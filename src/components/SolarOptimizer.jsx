import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';

export default function SolarOptimizer({
  isOpen,
  onClose,
  telemetry,
  panelTiltDeg,
  setPanelTiltDeg,
  panelAzimuthOffsetDeg,
  setPanelAzimuthOffsetDeg
}) {
  const [autoTrack, setAutoTrack] = useState(false);
  const [evasionActive, setEvasionActive] = useState(false);

  if (!isOpen) return null;

  const handleAutoTrackToggle = () => {
    soundFX.playClick();
    const next = !autoTrack;
    setAutoTrack(next);
    if (next && telemetry) {
      const optimal = Math.max(0, Math.min(30, Math.round(telemetry.sun.elevation)));
      setPanelTiltDeg(optimal);
      setPanelAzimuthOffsetDeg(0);
    }
  };

  const handleEvasionSimulate = () => {
    soundFX.playTelemetry();
    setEvasionActive(true);
    setTimeout(() => {
      setEvasionActive(false);
    }, 3500);
  };

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      top: '68px',
      right: '16px',
      width: '320px',
      padding: '16px',
      zIndex: 45
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span className="sub-tag">SOLAR ARRAY OPTIMIZATION</span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          ✕
        </button>
      </div>

      {/* Tilt Angle */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>PANEL TILT:</span>
          <span style={{ color: '#ffffff' }}>{panelTiltDeg}° from vertical</span>
        </div>
        <input
          type="range"
          min="0"
          max="45"
          step="1"
          value={panelTiltDeg}
          disabled={autoTrack}
          onChange={(e) => setPanelTiltDeg(parseInt(e.target.value, 10))}
        />
      </div>

      {/* Azimuth Offset */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>AZIMUTH OFFSET:</span>
          <span style={{ color: '#ffffff' }}>{panelAzimuthOffsetDeg > 0 ? '+' : ''}{panelAzimuthOffsetDeg}°</span>
        </div>
        <input
          type="range"
          min="-60"
          max="60"
          step="2"
          value={panelAzimuthOffsetDeg}
          disabled={autoTrack}
          onChange={(e) => setPanelAzimuthOffsetDeg(parseInt(e.target.value, 10))}
        />
      </div>

      {/* Auto-Track Button */}
      <button
        onClick={handleAutoTrackToggle}
        className={`btn-minimal ${autoTrack ? 'active' : ''}`}
        style={{ width: '100%', marginBottom: '14px', fontSize: '0.68rem' }}
      >
        {autoTrack ? 'AUTONOMOUS TRACKING ACTIVE' : 'ALIGN TO SOLAR VECTOR'}
      </button>

      {/* Performance Metric */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '6px',
        padding: '10px',
        marginBottom: '14px',
        fontSize: '0.68rem',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)' }}>YIELD:</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>{telemetry?.sun?.powerWatts ?? 0} Watts</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>EFFICIENCY:</span>
          <span style={{ color: 'var(--signal-earth)' }}>
            {Math.round(((telemetry?.sun?.powerWatts ?? 0) / 1020) * 100)}% of theoretical max
          </span>
        </div>
      </div>

      {/* Rover Shadow Dodge Section */}
      <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '12px' }}>
        <div className="sub-tag" style={{ marginBottom: '6px' }}>VIPER SHADOW DODGE</div>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.3 }}>
          Calculate escape vector to evade incoming crater rim shadows.
        </p>

        <button
          onClick={handleEvasionSimulate}
          className="btn-minimal"
          style={{ width: '100%', fontSize: '0.68rem' }}
        >
          {evasionActive ? 'CALCULATING ESCAPE...' : 'CALCULATE ESCAPE VECTOR'}
        </button>

        {evasionActive && (
          <div style={{
            marginTop: '8px',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}>
            <div>Vector: Heading 038° NNE</div>
            <div>Distance to Sunlight: 185m at 10cm/s</div>
            <div style={{ color: 'var(--signal-earth)' }}>+4.2h power window preserved</div>
          </div>
        )}
      </div>
    </div>
  );
}
