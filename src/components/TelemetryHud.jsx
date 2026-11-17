import React from 'react';

/**
 * Clean, Simple Telemetry Bar
 * Uses the easiest, most accessible plain language so any user can understand it immediately.
 */
export default function TelemetryHud({ telemetry, site }) {
  if (!telemetry) return null;

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '8px 16px',
      fontSize: '0.72rem',
      fontFamily: 'var(--font-mono)'
    }}>
      {/* 1. Sunlight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          className="dot"
          style={{ background: telemetry.sun.isVisible ? 'var(--signal-sun)' : 'var(--signal-alert)' }}
        ></span>
        <div>
          <span className="sub-tag" style={{ marginRight: '6px' }}>SUN</span>
          <span className="mono-val" style={{ color: '#ffffff', fontWeight: 600 }}>
            {telemetry.sun.elevation > 0 ? '+' : ''}{telemetry.sun.elevation}°
          </span>
          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
          <span className="mono-val" style={{ color: telemetry.sun.isVisible ? 'var(--signal-sun)' : 'var(--text-muted)' }}>
            {telemetry.sun.powerWatts}W
          </span>
        </div>
      </div>

      <div style={{ width: '1px', height: '16px', background: 'var(--border-hairline)' }}></div>

      {/* 2. Earth Connection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          className="dot"
          style={{ background: telemetry.earth.commStatus === 'BLACKOUT' ? 'var(--signal-alert)' : 'var(--signal-earth)' }}
        ></span>
        <div>
          <span className="sub-tag" style={{ marginRight: '6px' }}>EARTH</span>
          <span className="mono-val" style={{ color: '#ffffff', fontWeight: 600 }}>
            {telemetry.earth.elevation > 0 ? '+' : ''}{telemetry.earth.elevation}°
          </span>
          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
          <span className="mono-val" style={{ color: telemetry.earth.commStatus === 'BLACKOUT' ? 'var(--signal-alert)' : 'var(--signal-earth)' }}>
            {telemetry.earth.commStatus === 'BLACKOUT' ? 'LOST' : 'ONLINE'}
          </span>
        </div>
      </div>

      <div style={{ width: '1px', height: '16px', background: 'var(--border-hairline)' }}></div>

      {/* 3. Surface Temperature */}
      <div>
        <span className="sub-tag" style={{ marginRight: '6px' }}>TEMP</span>
        <span className="mono-val" style={{ color: '#ffffff', fontWeight: 600 }}>
          {telemetry.environment.surfaceTempC}°C
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.64rem', marginLeft: '4px' }}>
          ({telemetry.environment.surfaceTempK}K)
        </span>
      </div>

      <div style={{ width: '1px', height: '16px', background: 'var(--border-hairline)' }}></div>

      {/* 4. Elevation & Nearest Dark Ice Crater */}
      <div>
        <span className="sub-tag" style={{ marginRight: '6px' }}>HEIGHT</span>
        <span className="mono-val" style={{ color: 'var(--text-secondary)' }}>
          +{site.elevationMeters}m
        </span>
        <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>•</span>
        <span className="sub-tag" style={{ marginRight: '4px' }}>ICE CRATER</span>
        <span className="mono-val" style={{ color: 'var(--text-secondary)' }}>
          {site.psrDistanceKm} km
        </span>
      </div>
    </div>
  );
}
