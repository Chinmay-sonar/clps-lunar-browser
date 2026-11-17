import React, { useState, useMemo } from 'react';
import {
  generateSolarCycleData,
  generateEarthLibrationData,
  generateThermalCycleData,
  generateIceDepthProfile
} from '../utils/scientificAnalytics';
import { soundFX } from '../utils/soundFX';

export default function ScientificAnalyticsDrawer({
  isOpen,
  onClose,
  selectedSite,
  currentSimDate,
  onJumpToDate
}) {
  const [activeTab, setActiveTab] = useState('solar'); // 'solar' | 'earth' | 'thermal' | 'drill'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Generate data series based on current selected site and date
  const solarData = useMemo(() => generateSolarCycleData(selectedSite, currentSimDate), [selectedSite, currentSimDate]);
  const earthData = useMemo(() => generateEarthLibrationData(selectedSite, currentSimDate), [selectedSite, currentSimDate]);
  const thermalData = useMemo(() => generateThermalCycleData(selectedSite), [selectedSite]);
  const drillData = useMemo(() => generateIceDepthProfile(), []);

  if (!isOpen) return null;

  // CSV Export utility
  const handleExportCsv = () => {
    soundFX.playClick();
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `NASA_${selectedSite.id}_${activeTab}_data.csv`;

    if (activeTab === 'solar') {
      csvContent += 'Day,Hour,Timestamp,Elevation_Deg,Horizon_Block_Deg,Vertical_Watts,Horizontal_Watts,Status\n';
      solarData.forEach(d => {
        csvContent += `${d.day},${d.hour},${d.timestamp},${d.elevation},${d.horizonBlockDeg},${d.verticalWatts},${d.horizontalWatts},${d.shadowStatus}\n`;
      });
    } else if (activeTab === 'earth') {
      csvContent += 'Day,Hour,Timestamp,Earth_Elevation_Deg,Horizon_Obstacle_Deg,Link_Margin_dB,DataRate_Kbps,Comm_Status\n';
      earthData.forEach(d => {
        csvContent += `${d.day},${d.hour},${d.timestamp},${d.earthElevation},${d.horizonObstacle},${d.linkMarginDb},${d.dataRateKbps},${d.commStatus}\n`;
      });
    } else if (activeTab === 'thermal') {
      csvContent += 'Progress_Pct,Sun_Angle_Deg,Regolith_Kelvin,Regolith_Celsius,Avionics_Kelvin,Avionics_Celsius,Battery_Status\n';
      thermalData.forEach(d => {
        csvContent += `${d.progress},${d.sunAngle},${d.regolithK},${d.regolithC},${d.avionicsK},${d.avionicsC},${d.batterySurvival}\n`;
      });
    } else {
      csvContent += 'Depth_cm,Depth_m,Temp_Kelvin,Temp_Celsius,Sublimation_mm_per_Gyr,Ice_Concentration_wt_pct,Stability\n';
      drillData.forEach(d => {
        csvContent += `${d.depthCm},${d.depthM},${d.tempK},${d.tempC},${d.sublimationRate},${d.iceConcentrationWtPct},${d.stabilityRating}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 4, 8, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1060px',
        maxHeight: '90vh',
        background: 'rgba(9, 12, 19, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 26px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{
                  fontSize: '1.22rem',
                  fontWeight: 500,
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Lunar Scientific Analytics Suite
                </h2>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: '#38bdf8',
                  padding: '3px 9px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  borderRadius: '999px',
                  border: '1px solid rgba(56, 189, 248, 0.28)',
                  letterSpacing: '0.04em'
                }}>
                  {selectedSite.name.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportCsv}
              style={{
                padding: '6px 14px',
                height: '32px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '0.72rem',
                fontWeight: 500,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
              title="Download dataset as CSV"
            >
              Export CSV
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Minimal Tab Bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '0 20px'
        }}>
          {[
            { id: 'solar', label: 'SOLAR POWER' },
            { id: 'earth', label: 'EARTH LINK' },
            { id: 'thermal', label: 'THERMAL CYCLE' },
            { id: 'drill', label: 'SUBSURFACE ICE' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                soundFX.playClick();
                setActiveTab(tab.id);
                setHoveredPoint(null);
              }}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#ffffff' : '#888888',
                letterSpacing: '0.04em',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = '#888888';
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '22px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* TAB 1: Solar Power */}
          {activeTab === 'solar' && (
            <div>
              {/* Telemetry Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>MAX SOLAR ELEVATION</div>
                  <div style={{ fontSize: '1.35rem', color: '#ffb703', fontWeight: 600, marginTop: '3px' }}>
                    +{(90 - Math.abs(selectedSite.lat) + 1.54).toFixed(1)}°
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>HORIZON OBSTACLE THRESHOLD</div>
                  <div style={{ fontSize: '1.35rem', color: '#f87171', fontWeight: 600, marginTop: '3px' }}>
                    {selectedSite.horizonHeightDeg || 1.6}°
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>VERTICAL ARRAY PEAK POWER</div>
                  <div style={{ fontSize: '1.35rem', color: '#34d399', fontWeight: 600, marginTop: '3px' }}>
                    381.1 W
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>FLAT ARRAY DEFICIT</div>
                  <div style={{ fontSize: '1.35rem', color: '#f59e0b', fontWeight: 600, marginTop: '3px' }}>
                    97% Loss (10.5 W)
                  </div>
                </div>
              </div>

              {/* Clean Minimal Interactive SVG Chart */}
              <div style={{
                background: 'rgba(5, 7, 12, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 500 }}>
                    Solar Elevation & Power Yield (29.5-Day Synodic Month)
                  </span>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.68rem' }}>
                    <span style={{ color: '#ffb703' }}>● Sun Elevation (°)</span>
                    <span style={{ color: '#34d399' }}>● Vertical Array (W)</span>
                    <span style={{ color: '#64748b' }}>--- Rim Threshold</span>
                  </div>
                </div>

                <svg
                  viewBox="0 0 900 240"
                  style={{ width: '100%', height: '220px', overflow: 'visible', cursor: 'crosshair' }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffb703" stopOpacity="0.30" />
                      <stop offset="100%" stopColor="#ffb703" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal 0 degree axis line */}
                  <line x1="40" y1="120" x2="880" y2="120" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                  <text x="10" y="124" fill="#94a3b8" fontSize="10" fontFamily="'Google Sans', sans-serif">0°</text>

                  {/* Horizon obstacle threshold */}
                  <line x1="40" y1="102" x2="880" y2="102" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="10" y="105" fill="#f87171" fontSize="9" fontFamily="'Google Sans', sans-serif">+{selectedSite.horizonHeightDeg || 1.6}°</text>
                  <text x="810" y="98" fill="#f87171" fontSize="9" fontFamily="'Google Sans', sans-serif">RIM CUTOFF</text>

                  {/* Days */}
                  {[0, 7, 14, 21, 28].map((day, idx) => {
                    const x = 40 + (idx / 4) * 840;
                    return (
                      <g key={day}>
                        <line x1={x} y1="30" x2={x} y2="210" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                        <text x={x - 12} y="228" fill="#64748b" fontSize="10" fontFamily="'Google Sans', sans-serif">Day {day}</text>
                      </g>
                    );
                  })}

                  {/* Sun Elevation Area & Curve */}
                  {(() => {
                    const pathData = solarData.map((pt, i) => {
                      const x = 40 + (i / (solarData.length - 1)) * 840;
                      const y = 120 - pt.elevation * 11.25;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }).join(' ');

                    const areaData = `${pathData} L 880 120 L 40 120 Z`;

                    return (
                      <>
                        <path d={areaData} fill="url(#sunGrad)" />
                        <path d={pathData} fill="none" stroke="#ffb703" strokeWidth="2.5" />
                      </>
                    );
                  })()}

                  {/* Vertical Solar Array Power Curve (Watts) */}
                  {(() => {
                    const pathData = solarData.map((pt, i) => {
                      const x = 40 + (i / (solarData.length - 1)) * 840;
                      const y = 210 - (pt.verticalWatts / 400) * 170;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }).join(' ');

                    return (
                      <path d={pathData} fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="2 3" />
                    );
                  })()}

                  {/* Invisible Hit Zones */}
                  {solarData.map((pt, i) => {
                    const x = 40 + (i / (solarData.length - 1)) * 840;
                    return (
                      <rect
                        key={pt.hour}
                        x={x - 8}
                        y="20"
                        width="16"
                        height="200"
                        fill="transparent"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onClick={() => {
                          soundFX.playClick();
                          if (onJumpToDate) onJumpToDate(new Date(pt.timestamp));
                        }}
                      />
                    );
                  })}

                  {/* Hover Indicator Crosshair */}
                  {hoveredPoint && (
                    <g pointerEvents="none">
                      {(() => {
                        const idx = solarData.findIndex(p => p.hour === hoveredPoint.hour);
                        if (idx < 0) return null;
                        const x = 40 + (idx / (solarData.length - 1)) * 840;
                        const y = 120 - hoveredPoint.elevation * 11.25;
                        return (
                          <>
                            <line x1={x} y1="20" x2={x} y2="210" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                            <circle cx={x} cy={y} r="5" fill="#ffb703" stroke="#ffffff" strokeWidth="2" />
                          </>
                        );
                      })()}
                    </g>
                  )}
                </svg>

                {/* Hover Readout Box */}
                {hoveredPoint ? (
                  <div style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.74rem'
                  }}>
                    <span style={{ color: '#38bdf8', fontWeight: 500 }}>
                      Day {hoveredPoint.day} ({hoveredPoint.hour}h)
                    </span>
                    <span style={{ color: '#ffb703' }}>
                      Sun: {hoveredPoint.elevation}°
                    </span>
                    <span style={{ color: '#34d399' }}>
                      Power: {hoveredPoint.verticalWatts} W
                    </span>
                    <span style={{
                      color: hoveredPoint.isIlluminated ? '#34d399' : '#f87171',
                      fontWeight: 600
                    }}>
                      {hoveredPoint.shadowStatus}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.66rem' }}>
                      Click to sync date
                    </span>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '10px',
                    textAlign: 'center',
                    fontSize: '0.70rem',
                    color: '#64748b'
                  }}>
                    Hover over chart to inspect hourly sun angle & Watts generated • Click to jump sim time
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Earth Link */}
          {activeTab === 'earth' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>LIBRATION CYCLE</div>
                  <div style={{ fontSize: '1.35rem', color: '#38bdf8', fontWeight: 600, marginTop: '3px' }}>
                    27.3 Days
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>DIRECT LINK BAND</div>
                  <div style={{ fontSize: '1.35rem', color: '#34d399', fontWeight: 600, marginTop: '3px' }}>
                    X-Band (8.4 GHz)
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>OCCULTATION BLACKOUT</div>
                  <div style={{ fontSize: '1.35rem', color: '#f87171', fontWeight: 600, marginTop: '3px' }}>
                    14.2% Risk
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>PEAK DATA RATE</div>
                  <div style={{ fontSize: '1.35rem', color: '#a78bfa', fontWeight: 600, marginTop: '3px' }}>
                    2,048 kbps
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(5, 7, 12, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 500 }}>
                    Earth Elevation & Deep Space Network Link (27.3-Day Cycle)
                  </span>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.68rem' }}>
                    <span style={{ color: '#38bdf8' }}>● Earth Elevation (°)</span>
                    <span style={{ color: '#f87171' }}>--- Horizon Threshold</span>
                  </div>
                </div>

                <svg
                  viewBox="0 0 900 240"
                  style={{ width: '100%', height: '220px', overflow: 'visible', cursor: 'crosshair' }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <line x1="40" y1="160" x2="880" y2="160" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                  <text x="10" y="164" fill="#94a3b8" fontSize="10" fontFamily="'Google Sans', sans-serif">0°</text>

                  <line x1="40" y1="130" x2="880" y2="130" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="10" y="133" fill="#f87171" fontSize="9" fontFamily="'Google Sans', sans-serif">+2.1°</text>
                  <text x="810" y="124" fill="#f87171" fontSize="9" fontFamily="'Google Sans', sans-serif">RIM CUTOFF</text>

                  {[0, 7, 14, 21, 27].map((day, idx) => {
                    const x = 40 + (idx / 4) * 840;
                    return (
                      <g key={day}>
                        <line x1={x} y1="30" x2={x} y2="210" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                        <text x={x - 12} y="228" fill="#64748b" fontSize="10" fontFamily="'Google Sans', sans-serif">Day {day}</text>
                      </g>
                    );
                  })}

                  {(() => {
                    const pathData = earthData.map((pt, i) => {
                      const x = 40 + (i / (earthData.length - 1)) * 840;
                      const y = 160 - pt.earthElevation * 13;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }).join(' ');

                    return (
                      <path d={pathData} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* TAB 3: Thermal Cycle */}
          {activeTab === 'thermal' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>PSR COLD TRAP MINIMUM</div>
                  <div style={{ fontSize: '1.35rem', color: '#818cf8', fontWeight: 600, marginTop: '3px' }}>
                    52 K (-221°C)
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>SUNLIT PEAK TEMP</div>
                  <div style={{ fontSize: '1.35rem', color: '#f59e0b', fontWeight: 600, marginTop: '3px' }}>
                    380 K (+107°C)
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>AVIONICS ENVELOPE</div>
                  <div style={{ fontSize: '1.35rem', color: '#34d399', fontWeight: 600, marginTop: '3px' }}>
                    268 K Safe
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>BATTERY HEATER DRAW</div>
                  <div style={{ fontSize: '1.35rem', color: '#10b981', fontWeight: 600, marginTop: '3px' }}>
                    -45 W
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(5, 7, 12, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 500 }}>
                    Lunar Regolith & Avionics Temperature Response (Kelvin)
                  </span>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.68rem' }}>
                    <span style={{ color: '#f59e0b' }}>● Surface Regolith (K)</span>
                    <span style={{ color: '#34d399' }}>● Internal Avionics (K)</span>
                  </div>
                </div>

                <svg viewBox="0 0 900 240" style={{ width: '100%', height: '220px', overflow: 'visible' }}>
                  <line x1="40" y1="200" x2="880" y2="200" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                  <text x="10" y="204" fill="#94a3b8" fontSize="10" fontFamily="'Google Sans', sans-serif">50K</text>
                  <line x1="40" y1="120" x2="880" y2="120" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                  <text x="10" y="124" fill="#94a3b8" fontSize="10" fontFamily="'Google Sans', sans-serif">250K</text>

                  {/* Surface temp curve */}
                  {(() => {
                    const pathData = thermalData.map((pt, i) => {
                      const x = 40 + (i / (thermalData.length - 1)) * 840;
                      const y = 220 - (pt.regolithK / 400) * 180;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }).join(' ');

                    return <path d={pathData} fill="none" stroke="#f59e0b" strokeWidth="2.5" />;
                  })()}

                  {/* Avionics temp curve */}
                  {(() => {
                    const pathData = thermalData.map((pt, i) => {
                      const x = 40 + (i / (thermalData.length - 1)) * 840;
                      const y = 220 - (pt.avionicsK / 400) * 180;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }).join(' ');

                    return <path d={pathData} fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" />;
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* TAB 4: Subsurface Ice */}
          {activeTab === 'drill' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>SURFACE ICE STABILITY</div>
                  <div style={{ fontSize: '1.35rem', color: '#f87171', fontWeight: 600, marginTop: '3px' }}>
                    Sublimates
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>STABLE FROST DEPTH</div>
                  <div style={{ fontSize: '1.35rem', color: '#38bdf8', fontWeight: 600, marginTop: '3px' }}>
                    &gt; 45 cm
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>TRIDENT DRILL REACH</div>
                  <div style={{ fontSize: '1.35rem', color: '#34d399', fontWeight: 600, marginTop: '3px' }}>
                    1.0 Meter
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.04em' }}>PEAK WATER PURITY</div>
                  <div style={{ fontSize: '1.35rem', color: '#00f0ff', fontWeight: 600, marginTop: '3px' }}>
                    5.5 wt%
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(5, 7, 12, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 500 }}>
                    TRIDENT 1-Meter Regolith Core Depth Profile
                  </span>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.68rem' }}>
                    <span style={{ color: '#00f0ff' }}>● Water Ice (wt%)</span>
                    <span style={{ color: '#818cf8' }}>● Temperature (K)</span>
                  </div>
                </div>

                <svg viewBox="0 0 900 240" style={{ width: '100%', height: '220px', overflow: 'visible' }}>
                  <line x1="40" y1="30" x2="880" y2="30" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                  <text x="10" y="34" fill="#94a3b8" fontSize="10" fontFamily="'Google Sans', sans-serif">0cm</text>
                  <line x1="40" y1="120" x2="880" y2="120" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                  <text x="10" y="124" fill="#94a3b8" fontSize="10" fontFamily="'Google Sans', sans-serif">50cm</text>
                  <line x1="40" y1="210" x2="880" y2="210" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                  <text x="10" y="214" fill="#94a3b8" fontSize="10" fontFamily="'Google Sans', sans-serif">100cm</text>

                  {/* Water ice profile */}
                  {(() => {
                    const pathData = drillData.map((pt, i) => {
                      const y = 30 + (pt.depthCm / 100) * 180;
                      const x = 40 + (pt.iceConcentrationWtPct / 8.0) * 840;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }).join(' ');

                    return <path d={pathData} fill="none" stroke="#00f0ff" strokeWidth="2.5" />;
                  })()}
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
