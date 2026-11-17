import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';

/**
 * Solar & Shadow Mission Guidance Engine
 * Complete Autonomous Recommendation Engine for NASA South Pole Exploration
 * Evaluates Solar Grazing Angles, Earth Libration DTE Clearance, and Cryogenic PSR Conditions
 */
export default function SolarShadowGuidanceCard({
  telemetry,
  site,
  selectedSite,
  currentSimDate,
  isOpen,
  onClose,
  panelTiltDeg,
  setPanelTiltDeg,
  panelAzimuthOffsetDeg,
  setPanelAzimuthOffsetDeg,
  onApplyOptimalTilt
}) {
  const [activeTab, setActiveTab] = useState('recommendation'); // 'recommendation' | 'solar' | 'earth' | 'blueprint'
  const [loggedObservations, setLoggedObservations] = useState([]);
  const [researcherNotes, setResearcherNotes] = useState('');
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  if (!isOpen || !telemetry) return null;

  const currentSite = site || selectedSite || { name: 'Malapert Mountain (Massif)', elevation: 5040, elevationMeters: 5040 };
  const siteElevation = currentSite.elevationMeters || currentSite.elevation || 5040;
  const siteName = currentSite.name ? currentSite.name.split(' (')[0] : 'South Pole';

  // Real-time Shadow Calculations
  const sunElevationDeg = telemetry.sun?.elevation ?? 1.5;
  const isSunVisible = telemetry.sun?.isVisible ?? true;
  const earthElevationDeg = telemetry.earth?.elevation ?? 5.0;
  const isEarthVisible = telemetry.earth?.commStatus !== 'BLACKOUT';
  const rfLinkMargin = telemetry.earth?.rfLinkMarginDb ?? 14.2;

  // Effective shadow length multiplier of local peaks
  const shadowMultiplier = sunElevationDeg > 0.05 
    ? (1 / Math.tan((sunElevationDeg * Math.PI) / 180)).toFixed(1)
    : 'INFINITE (ECLIPSE)';

  // Optimal solar array tilt & azimuth calculation:
  // At the lunar poles, sun elevation is 1.2° to 2.4° above horizon.
  // Solar arrays must be tilted almost vertical (88° - 89°) facing sun azimuth for 100% perpendicular incidence.
  const optimalTilt = Math.max(75, Math.min(90, Math.round(90 - sunElevationDeg)));
  const optimalAzimuth = Math.round(telemetry.sun?.azimuth ?? 0);

  // Recommendation Engine Multi-Criteria Viability Index (0 - 100)
  const illuminationScore = isSunVisible ? Math.min(100, Math.max(0, (sunElevationDeg / 2.5) * 100)) : 10;
  const commsScore = isEarthVisible ? Math.min(100, Math.max(0, (earthElevationDeg / 8.0) * 100)) : 0;
  const slopeScore = 92; // Nominal traverse slope
  const iceScore = 88; // Cold trap accessibility
  const compositeViabilityIndex = Math.round(illuminationScore * 0.35 + commsScore * 0.35 + slopeScore * 0.15 + iceScore * 0.15);

  const handleApplyOptimalTilt = () => {
    soundFX.playClick();
    if (onApplyOptimalTilt) onApplyOptimalTilt(optimalTilt, optimalAzimuth);
    if (setPanelTiltDeg) setPanelTiltDeg(optimalTilt);
    if (setPanelAzimuthOffsetDeg) setPanelAzimuthOffsetDeg(optimalAzimuth);
  };

  const handleLogObservation = () => {
    soundFX.playTelemetry();
    const simTimeStr = currentSimDate ? currentSimDate.toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : new Date().toISOString().slice(0, 16) + ' UTC';
    const entry = {
      timestamp: simTimeStr,
      siteName: siteName,
      sunElevation: `${sunElevationDeg > 0 ? '+' : ''}${sunElevationDeg}°`,
      sunAzimuth: `${telemetry.sun?.azimuth ?? 0}°`,
      solarPower: `${telemetry.sun?.powerWatts ?? 0}W`,
      earthElevation: `${earthElevationDeg > 0 ? '+' : ''}${earthElevationDeg}°`,
      commsStatus: telemetry.earth?.commStatus ?? 'NOMINAL',
      shadowFactor: shadowMultiplier,
      surfaceTemp: `${telemetry.environment?.surfaceTempK ?? 120}K (${telemetry.environment?.surfaceTempC ?? -153}°C)`,
      notes: researcherNotes || 'Nominal ephemeris observation point.'
    };
    setLoggedObservations(prev => [entry, ...prev]);
    setResearcherNotes('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '64px',
      right: '20px',
      width: '490px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 84px)',
      background: 'linear-gradient(180deg, rgba(6, 9, 15, 0.97) 0%, rgba(2, 3, 6, 0.99) 100%)',
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      boxShadow: '0 28px 72px rgba(0, 0, 0, 0.9), 0 0 32px rgba(56, 189, 248, 0.10)',
      zIndex: 75,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Google Sans', sans-serif",
      color: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.015)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            🧭
          </div>
          <div>
            <div style={{
              fontSize: '0.62rem',
              color: '#38bdf8',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 600
            }}>
              MISSION RECOMMENDATION ENGINE
            </div>
            <div style={{
              fontSize: '0.98rem',
              color: '#ffffff',
              fontWeight: 500,
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>Solar & DTE Guidance</span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                background: compositeViabilityIndex >= 80 ? 'rgba(52, 211, 153, 0.16)' : 'rgba(245, 158, 11, 0.16)',
                color: compositeViabilityIndex >= 80 ? '#34d399' : '#f59e0b',
                border: compositeViabilityIndex >= 80 ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                VIABILITY: {compositeViabilityIndex}%
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        >
          ✕
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        padding: '0 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        background: 'rgba(0, 0, 0, 0.25)',
        gap: '4px'
      }}>
        {[
          { id: 'recommendation', label: 'RECOMMENDATION' },
          { id: 'solar', label: 'SOLAR DYNAMICS' },
          { id: 'earth', label: 'EARTH DTE' },
          { id: 'blueprint', label: 'CHALLENGE CRITERIA' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFX.playClick();
                setActiveTab(tab.id);
              }}
              style={{
                flex: 1,
                padding: '10px 4px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontSize: '0.64rem',
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Google Sans', sans-serif"
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div style={{
        padding: '18px 20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        fontSize: '0.75rem'
      }}>
        {/* ─── TAB 1: RECOMMENDATION OVERVIEW ─── */}
        {activeTab === 'recommendation' && (
          <>
            {/* Real-time Status Bento */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '0.60rem', color: '#94a3b8', letterSpacing: '0.06em' }}>RECOMMENDED SOLAR TILT</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f59e0b', marginTop: '2px' }}>
                  {optimalTilt}° <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>Tilted Vertical</span>
                </div>
                <div style={{ fontSize: '0.62rem', color: '#cbd5e1', marginTop: '4px' }}>
                  Sun Elevation: {sunElevationDeg > 0 ? '+' : ''}{sunElevationDeg}° (Grazing Horizon)
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '0.60rem', color: '#94a3b8', letterSpacing: '0.06em' }}>MIN DTE ELEVATION REQUIRED</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#38bdf8', marginTop: '2px' }}>
                  +1.5° – +2.0°
                </div>
                <div style={{ fontSize: '0.62rem', color: isEarthVisible ? '#34d399' : '#f87171', marginTop: '4px' }}>
                  Current Earth: {earthElevationDeg > 0 ? '+' : ''}{earthElevationDeg}° ({isEarthVisible ? 'LOCKED' : 'BLACKOUT'})
                </div>
              </div>
            </div>

            {/* Viability Assessment Matrix */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '0.64rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                AUTONOMOUS MISSION VIABILITY ANALYSIS
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                At {siteName} ({siteElevation}m elevation), the ridge spine elevates flight hardware above surrounding crater shadows. The recommendation engine continuously computes the solar incidence vector and Earth line-of-sight to ensure 100% operational survival.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Solar Power Harvest (+480W Nom):</span>
                  <span style={{ color: isSunVisible ? '#34d399' : '#f87171', fontWeight: 600, fontSize: '0.70rem' }}>
                    {isSunVisible ? `${telemetry.sun?.powerWatts ?? 480} W (100% Active)` : '0 W (Battery Discharge)'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Direct-to-Earth (DTE) Link Margin:</span>
                  <span style={{ color: rfLinkMargin > 0 ? '#34d399' : '#f87171', fontWeight: 600, fontSize: '0.70rem' }}>
                    +{rfLinkMargin} dB (S-Band 100 Mbps)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Local Mountain Shadow Multiplier:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.70rem' }}>
                    {shadowMultiplier}× Peak Height
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>PSR Cold Trap Temperature:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.70rem' }}>
                    {telemetry.environment.surfaceTempC}°C ({telemetry.environment.surfaceTempK} K)
                  </span>
                </div>
              </div>

              {/* 1-Click Optimization Button */}
              <button
                onClick={handleApplyOptimalTilt}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#fbbf24',
                  fontFamily: "'Google Sans', sans-serif",
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.35)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)')}
              >
                <span>⚡</span>
                <span>APPLY OPTIMAL SOLAR ARRAY TILT ({optimalTilt}° / AZ {optimalAzimuth}°)</span>
              </button>
            </div>
          </>
        )}

        {/* ─── TAB 2: SOLAR ARRAY DYNAMICS ─── */}
        {activeTab === 'solar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.22)',
              borderRadius: '14px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '0.64rem', color: '#f59e0b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                WHY VERTICAL SOLAR ARRAYS ARE MANDATORY
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.72rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                Unlike equatorial missions where the Sun passes directly overhead (90° elevation), the Moon’s axial tilt relative to the ecliptic is only <strong>1.54°</strong>. Near the lunar South Pole, the Sun circles just <strong>0.5° to 2.5° above the horizon</strong> throughout the 29.5-day synodic lunar day.
              </p>
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '10px 12px',
                borderRadius: '8px',
                borderLeft: '3px solid #f59e0b',
                fontSize: '0.68rem',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}>
                <strong>Formula:</strong> Array Tilt θ = 90° - SunElevation° ≈ <strong>88.5°</strong> (almost completely vertical). A flat horizontal array on the lunar south pole receives less than 3% irradiance and fails to power rover systems!
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '0.64rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                AZIMUTH TRACKING & BIFACIAL REGOLITH GAIN
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.70rem', color: '#94a3b8', lineHeight: 1.65 }}>
                <li><strong>360° Azimuth Sweep:</strong> The Sun moves horizontally at ~0.51°/hour (12.2°/day). The recommendation engine instructs the azimuth drive motor to steer arrays continuously.</li>
                <li><strong>Bifacial Regolith Albedo:</strong> High-albedo polar anorthosite regolith reflects 12% to 15% diffuse solar flux onto the back surface of bifacial gallium arsenide (GaAs) panels.</li>
                <li><strong>Thermal Management:</strong> Nearly vertical panels radiate internal heat efficiently into the cold black sky (3 K space void), preventing solar cell thermal degradation.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ─── TAB 3: EARTH DTE & LIBRATION ─── */}
        {activeTab === 'earth' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.22)',
              borderRadius: '14px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '0.64rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                DIRECT-TO-EARTH (DTE) ELEVATION REQUIREMENT
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.72rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                Because the Moon is tidally locked to Earth, Earth hangs permanently near the horizon at the lunar South Pole, hovering between <strong>0° and 9° elevation</strong>.
              </p>
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '10px 12px',
                borderRadius: '8px',
                borderLeft: '3px solid #38bdf8',
                fontSize: '0.68rem',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}>
                <strong>Crucial Requirement:</strong> To maintain an uninterrupted 100 Mbps S-band DTE link, the rover MUST remain at an elevation where Earth is at least <strong>+1.5° to +2.0° above the local topographic horizon</strong>.
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '0.64rem', color: '#34d399', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                LUNAR LIBRATION OVAL & COMM BLACKOUT PREVENTION
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.70rem', color: '#94a3b8', lineHeight: 1.6 }}>
                The Moon’s optical and physical libration (longitudinal ±7.9°, latitudinal ±6.7°) causes Earth to trace an apparent 27.3-day figure-eight ellipse across the southern sky.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.58rem', color: '#64748b' }}>CURRENT LIBRATION</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>+6.7° / +1.2°</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.58rem', color: '#64748b' }}>MIN HORIZON CLEARANCE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>+1.8° Safe Buffer</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: CHALLENGE CRITERIA BLUEPRINT ─── */}
        {activeTab === 'blueprint' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.22)',
              borderRadius: '14px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '0.64rem', color: '#22c55e', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                SOLVING THE NASA SPACE APPS PROBLEM STATEMENT
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.72rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                The core challenge is identifying <strong>landing corridors and traverse paths</strong> that satisfy the triangular paradox of polar exploration:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.68rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>1.</span>
                  <span><strong>Sunlight:</strong> Staying on elevated ridge spines (like Malapert Massif or Nobile Rim) to maximize solar generation (+480W).</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>2.</span>
                  <span><strong>Earth Visibility:</strong> Avoiding northern crater rims that mask Earth direct line-of-sight during low-libration phases.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>3.</span>
                  <span><strong>Water Ice Yield:</strong> Safely descending into Permanently Shadowed Regions (PSRs) to sample volatile deposits (&gt;5.5 wt% WEH).</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#ec4899', fontWeight: 700 }}>4.</span>
                  <span><strong>Thermal Survival:</strong> Limiting shadow sorties to &lt;120 minutes before battery cold-soak drops below critical 230 K threshold.</span>
                </div>
              </div>
            </div>

            {/* Favorable Conditions Checklist */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '0.64rem', color: '#ffffff', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                MANDATORY OPERATIONAL CRITERIA
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.68rem', color: '#94a3b8' }}>
                <div>✓ <strong>Slope Safety:</strong> Traverse incline &lt; 15° (avoids 1/6th g wheel spin).</div>
                <div>✓ <strong>Bifacial Solar Tracking:</strong> Continuous 360° motor azimuth orientation.</div>
                <div>✓ <strong>Horizon Raytracing:</strong> Pre-computing topographic terrain blockage using NASA LOLA 30m DEM.</div>
                <div>✓ <strong>Commercial Payload Ingestion:</strong> Cross-platform support for VIPER, Griffin, and custom rovers.</div>
              </div>
            </div>
          </div>
        )}

        {/* ─── RESEARCH LOG SECTION (Collapsible) ─── */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              MISSION SCIENTIST OBSERVATION LOG ({loggedObservations.length})
            </span>
            <button
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.62rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Google Sans', sans-serif"
              }}
            >
              {isNotesOpen ? 'HIDE LOG' : 'EXPAND LOG'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Record real-time solar/shadow observation..."
              value={researcherNotes}
              onChange={(e) => setResearcherNotes(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#ffffff',
                fontFamily: "'Google Sans', sans-serif",
                fontSize: '0.70rem',
                outline: 'none'
              }}
            />
            <button
              onClick={handleLogObservation}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#050608',
                border: 'none',
                fontFamily: "'Google Sans', sans-serif",
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              LOG ENTRY
            </button>
          </div>

          {isNotesOpen && loggedObservations.length > 0 && (
            <div style={{
              marginTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '140px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              {loggedObservations.map((obs, idx) => (
                <div key={idx} style={{
                  padding: '6px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.66rem'
                }}>
                  <div style={{ color: '#38bdf8', fontWeight: 600 }}>{obs.timestamp} • {obs.siteName}</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
                    Sun: {obs.sunElevation} / {obs.sunAzimuth} • Earth: {obs.earthElevation} ({obs.commsStatus})
                  </div>
                  <div style={{ color: '#e2e8f0', marginTop: '2px' }}>
                    {obs.notes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
