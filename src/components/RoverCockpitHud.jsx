import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';

export default function RoverCockpitHud({
  telemetry,
  site,
  headlightsOn,
  setHeadlightsOn,
  drillState,
  setDrillState,
  onExitCockpit
}) {
  const [showCadetExplainer, setShowCadetExplainer] = useState(false);

  // Compute roll and pitch from terrain slope
  const slopeDeg = site?.slopeDeg || 4.2;
  const rollDeg = (Math.sin(telemetry?.sun?.azimuth || 0) * slopeDeg * 0.4).toFixed(1);
  const pitchDeg = (Math.cos(telemetry?.sun?.azimuth || 0) * slopeDeg * 0.6).toFixed(1);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 32px'
    }}>
      {/* 1. Top Bar: Heading Compass & Bearing Indicators */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
      }}>
        {/* Top Heading Tape */}
        <div style={{
          background: 'rgba(5, 7, 12, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '8px',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: '#ffffff',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#00f0ff', fontWeight: 700 }}>MASTCAM-1</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>ELEV 2.4M</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>N 000°</span>
            <span style={{ color: '#00f0ff', fontWeight: 700 }}>▲ HEADING 042°</span>
            <span>E 090°</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ color: '#ffb703' }}>
              SUN {telemetry?.sun?.azimuth?.toFixed(0) || 0}° (+{telemetry?.sun?.elevation?.toFixed(1) || 0}°)
            </span>
            <span style={{ color: '#38bdf8' }}>
              EARTH {telemetry?.earth?.azimuth?.toFixed(0) || 0}° (+{telemetry?.earth?.elevation?.toFixed(1) || 0}°)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center Reticle & Crosshair with Stereo Rangefinder */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Optical Crosshair */}
        <div style={{
          width: '180px',
          height: '180px',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          borderRadius: '50%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Central dot */}
          <div style={{ width: '4px', height: '4px', background: '#00f0ff', borderRadius: '50%' }} />

          {/* Crosshair ticks */}
          <div style={{ position: 'absolute', left: '-20px', width: '20px', height: '1px', background: '#00f0ff' }} />
          <div style={{ position: 'absolute', right: '-20px', width: '20px', height: '1px', background: '#00f0ff' }} />
          <div style={{ position: 'absolute', top: '-20px', width: '1px', height: '20px', background: '#00f0ff' }} />
          <div style={{ position: 'absolute', bottom: '-20px', width: '1px', height: '20px', background: '#00f0ff' }} />

          {/* Rangefinder markers */}
          <span style={{ position: 'absolute', right: '-65px', top: '25%', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#00f0ff' }}>
            5M RANGE
          </span>
          <span style={{ position: 'absolute', right: '-72px', top: '50%', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#00f0ff' }}>
            15M TRIDENT
          </span>
          <span style={{ position: 'absolute', right: '-65px', top: '75%', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#00f0ff' }}>
            45M BEAM
          </span>
        </div>

        {/* Pitch & Roll Inclinometer Ladder */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: '#ffffff',
          background: 'rgba(0, 0, 0, 0.45)',
          padding: '3px 12px',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <span>PITCH: <strong style={{ color: '#00f0ff' }}>{pitchDeg}°</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span>ROLL: <strong style={{ color: '#00f0ff' }}>{rollDeg}°</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: '#34d399' }}>STABILITY: NOMINAL (&lt;15°)</span>
        </div>
      </div>

      {/* 3. Left Flank: Tactical Cockpit Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '260px',
        pointerEvents: 'auto'
      }}>
        {/* Vehicle Identity */}
        <div style={{
          background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '8px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.78rem', color: '#ffffff' }}>
              VIPER ROVER COCKPIT
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.58rem',
              color: '#34d399',
              padding: '1px 5px',
              background: 'rgba(52, 211, 153, 0.15)',
              borderRadius: '3px'
            }}>
              ONLINE
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            SITE: {site?.name}
          </div>

          {/* Headlight Quick Toggle */}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => {
                soundFX.playClick();
                setHeadlightsOn(!headlightsOn);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: headlightsOn ? 'rgba(255, 247, 237, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                border: headlightsOn ? '1px solid #ffedd5' : '1px solid var(--border-hairline)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: headlightsOn ? '#ffedd5' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 600
              }}
            >
              <span>HEADLIGHTS</span>
              <span>{headlightsOn ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Drill Quick Toggle */}
          <div style={{ marginTop: '6px' }}>
            <button
              onClick={() => {
                soundFX.playClick();
                setDrillState(drillState === 'stowed' ? 'drilling' : drillState === 'drilling' ? 'sampling' : 'stowed');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: drillState !== 'stowed' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: drillState !== 'stowed' ? '1px solid #00f0ff' : '1px solid var(--border-hairline)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: drillState !== 'stowed' ? '#00f0ff' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 600
              }}
            >
              <span>ICE DRILL</span>
              <span>{drillState === 'stowed' ? 'OFF' : drillState === 'drilling' ? 'DRILLING' : 'SAMPLE READY'}</span>
            </button>
          </div>
        </div>

        {/* 4th Grade Cadet Explainer Toggle */}
        <button
          onClick={() => {
            soundFX.playClick();
            setShowCadetExplainer(!showCadetExplainer);
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))',
            border: '1px solid #34d399',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#34d399',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: 'rgba(52, 211, 153, 0.2)' }}>GUIDE</span>
          <span>{showCadetExplainer ? 'Hide Rover Guide' : 'Help: What am I seeing?'}</span>
        </button>

        {showCadetExplainer && (
          <div style={{
            background: 'rgba(10, 14, 22, 0.95)',
            border: '1px solid #34d399',
            borderRadius: '8px',
            padding: '12px',
            color: '#e2e8f0',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem',
            lineHeight: 1.4
          }}>
            <strong style={{ color: '#34d399' }}>You are driving VIPER on the Moon!</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              You are looking through VIPER's two front cameras on top of its mast. Click and drag your mouse to look around at the craters. Turn on the bright headlights to light up dark shadows, and test the ice drill!
            </p>
          </div>
        )}
      </div>

      {/* 4. Right Flank: Telemetry & Exit Button */}
      <div style={{
        position: 'absolute',
        top: '72px',
        right: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'auto'
      }}>
        {/* Link Quality Readout */}
        <div style={{
          background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          minWidth: '200px'
        }}>
          <div style={{ color: 'var(--text-muted)' }}>EARTH CONNECTION</div>
          <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.82rem', marginTop: '2px' }}>
            {telemetry?.earth?.commStatus === 'BLACKOUT' ? 'SIGNAL LOST' : 'CONNECTED (GOOD)'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.62rem', marginTop: '4px' }}>
            NASA GROUND NETWORK
          </div>
        </div>

        {/* Exit Cockpit Button */}
        <button
          onClick={() => {
            soundFX.playClick();
            onExitCockpit();
          }}
          style={{
            background: 'rgba(248, 113, 113, 0.15)',
            border: '1px solid rgba(248, 113, 113, 0.4)',
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#f87171',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          ✕ EXIT DRIVER VIEW
        </button>
      </div>
    </div>
  );
}
