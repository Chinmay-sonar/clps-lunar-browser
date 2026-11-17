import React, { useState, useEffect } from 'react';
import { soundFX } from '../utils/soundFX';

export default function MissionBootLoader({ onEnterMissionControl, onComplete }) {
  const [calibrationPct, setCalibrationPct] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const stages = [
    'INGESTING NASA JPL DE441 POLAR EPHEMERIS (7,301 NODES)...',
    'CALIBRATING LOLA 360° TOPOGRAPHIC HORIZON DATUMS...',
    'ACQUIRING DIRECT-TO-EARTH DSN COMMUNICATOR VECTORS...',
    'CONFIGURING ARTEMIS III & CLPS POLAR FLIGHT ARCHITECTURE...',
    'SUBSYSTEMS NOMINAL // READY FOR MISSION STAGING'
  ];

  useEffect(() => {
    const startTime = performance.now();
    const duration = 2800; // 2.8 seconds smooth calibration

    const timer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setCalibrationPct(progress);

      const stage = Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length));
      setStageIndex(stage);

      if (progress >= 100) {
        clearInterval(timer);
        setIsReady(true);
      }
    }, 32);

    return () => clearInterval(timer);
  }, []);

  const handleEnter = () => {
    soundFX.playClick();
    setIsFadingOut(true);
    setTimeout(() => {
      if (onEnterMissionControl) onEnterMissionControl();
      else if (onComplete) onComplete();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#030508',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '48px',
      color: '#f8fafc',
      opacity: isFadingOut ? 0 : 1,
      transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: isFadingOut ? 'none' : 'auto',
      overflow: 'hidden'
    }}>
      {/* Background Starfield Grid & Subtle Ambient Glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(56, 189, 248, 0.07) 0%, transparent 65%)',
        pointerEvents: 'none'
      }} />

      {/* Top Header Metadata */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 2,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isReady ? '#10b981' : '#f59e0b',
            boxShadow: isReady ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
          }} />
          <span>NASA ARTEMIS III & CLPS // AUTONOMOUS FLIGHT DECK</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span>LAT: 89.44°S</span>
          <span>LON: 140.80°E</span>
          <span style={{ color: '#38bdf8' }}>DE441: CALIBRATED</span>
        </div>
      </div>

      {/* Center Cinematic Typography Reveal */}
      <div style={{
        maxWidth: '880px',
        margin: 'auto',
        textAlign: 'center',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#38bdf8',
          marginBottom: '16px'
        }}>
          PROJECT CODYSEEY // LUNAR SOUTH POLE
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.6rem, 5.5vw, 4.4rem)',
          fontWeight: 300,
          lineHeight: 1.08,
          letterSpacing: '-0.025em',
          color: '#ffffff',
          marginBottom: '20px'
        }}>
          Simulate the Journey to the Lunar Cold Traps
        </h1>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.92rem',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          maxWidth: '620px',
          marginBottom: '36px'
        }}>
          Engineered for mission planners and planetary researchers. Trace grazing sub-solar vectors, long-reach crater rim shadows, and direct-to-Earth communication corridors across the extreme lunar South Pole.
        </p>

        {/* Progress Bar & Stage Indicator */}
        <div style={{ width: '100%', maxWidth: '420px', marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#e2e8f0' }}>{stages[stageIndex]}</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{calibrationPct}%</span>
          </div>

          <div style={{
            width: '100%',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '1px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${calibrationPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0284c7, #38bdf8, #10b981)',
              transition: 'width 0.08s ease-out'
            }} />
          </div>
        </div>

        {/* Action Button: Enter Mission Control */}
        <div>
          <button
            onClick={handleEnter}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 32px',
              borderRadius: '6px',
              background: isReady ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
              color: isReady ? '#050608' : 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              border: 'none',
              cursor: isReady ? 'pointer' : 'default',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isReady ? '0 0 25px rgba(255, 255, 255, 0.25)' : 'none',
              transform: isReady ? 'translateY(0)' : 'translateY(2px)'
            }}
          >
            <span>{isReady ? 'ENTER MISSION CONTROL' : 'CALIBRATING EPHEMERIS...'}</span>
            {isReady && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Footer Technical Credentials */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 2,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.62rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-hairline)',
        paddingTop: '16px'
      }}>
        <div>EPHEMERIS: JPL DE441 / LE441 (400-YR PRECISION)</div>
        <div>TOPOGRAPHY: LRO LOLA POLAR 30M HYPSOMETRIC RELIEF</div>
        <div>COMMUNICATIONS: NASA DEEP SPACE NETWORK (DSN) S/X-BAND</div>
      </div>
    </div>
  );
}
