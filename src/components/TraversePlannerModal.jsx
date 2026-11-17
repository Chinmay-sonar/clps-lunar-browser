import React, { useState, useMemo } from 'react';
import { MISSION_TRAVERSES } from '../utils/shadowDodgePlanner';
import { soundFX } from '../utils/soundFX';

export default function TraversePlannerModal({
  isOpen,
  onClose,
  selectedSite,
  activeTraverse,
  setActiveTraverse,
  isDriving,
  setIsDriving,
  driveProgress,
  setDriveProgress,
  driveSpeedMultiplier,
  setDriveSpeedMultiplier
}) {
  const [isCadetMode, setIsCadetMode] = useState(false);

  // Available traverses matching site or global
  const siteTraverses = useMemo(() => {
    return MISSION_TRAVERSES.filter(t => t.siteId === selectedSite.id) || [MISSION_TRAVERSES[0]];
  }, [selectedSite]);

  if (!isOpen) return null;

  const currentTraverse = activeTraverse || siteTraverses[0] || MISSION_TRAVERSES[0];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 4, 8, 0.78)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 92,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1020px',
        maxHeight: '92vh',
        background: 'rgba(9, 12, 19, 0.96)',
        border: '1px solid var(--border-hairline)',
        borderRadius: '10px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-hairline)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.28rem',
                  fontWeight: 400,
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.015em'
                }}>
                  VIPER Autonomous Shadow-Dodge Traverse Planner
                </h2>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  color: '#34d399',
                  padding: '2px 8px',
                  background: 'rgba(52, 211, 153, 0.08)',
                  borderRadius: '4px',
                  border: '1px solid rgba(52, 211, 153, 0.25)'
                }}>
                  ACTIVE SIMULATOR
                </span>
              </div>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                margin: '3px 0 0 0'
              }}>
                Polar Grazing Shadow Evasion • Slope Hazard Cutoff (&lt;12°) • DSN Line-of-Sight Hold
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Cadet Mode Switch */}
            <button
              onClick={() => {
                soundFX.playClick();
                setIsCadetMode(!isCadetMode);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: isCadetMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: isCadetMode ? '1px solid #10b981' : '1px solid var(--border-hairline)',
                borderRadius: '6px',
                color: isCadetMode ? '#34d399' : '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.7rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <span>{isCadetMode ? 'CADET EXPLAINER MODE' : 'EXECUTIVE FLIGHT MODE'}</span>
            </button>

            {/* Close */}
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
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Route Selector Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-hairline)',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '6px 16px',
          gap: '8px'
        }}>
          {MISSION_TRAVERSES.map(traverse => (
            <button
              key={traverse.id}
              onClick={() => {
                soundFX.playClick();
                setActiveTraverse(traverse);
                setDriveProgress(0);
                setIsDriving(false);
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: currentTraverse.id === traverse.id ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                border: currentTraverse.id === traverse.id ? '1px solid #00f0ff' : '1px solid var(--border-hairline)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: currentTraverse.id === traverse.id ? '#00f0ff' : 'var(--text-secondary)'
                }}>
                  {traverse.name}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  color: '#34d399'
                }}>
                  {traverse.totalDistanceM}m
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.64rem',
                color: 'var(--text-muted)'
              }}>
                {traverse.targetObjective}
              </span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Cadet Mode Educational Banner */}
          {isCadetMode && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.08))',
              border: '1px solid #34d399',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                color: '#34d399',
                flexShrink: 0
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 18h14M5 14h14M7 10h10M9 6h6" />
                </svg>
              </span>
              <div>
                <h4 style={{
                  margin: '0 0 4px 0',
                  color: '#34d399',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.88rem',
                  fontWeight: 700
                }}>
                  Why Can't VIPER Just Drive in a Straight Line on the Moon?
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  lineHeight: '1.45',
                  color: '#e2e8f0',
                  fontFamily: 'var(--font-sans)'
                }}>
                  Driving on the Moon is not like driving on a road! First, tall crater mountains cast shadows that stretch for miles. If VIPER stays in the shadow for more than a few days, its solar panels go dark and the batteries freeze solid! Second, if the slope is steeper than 12 degrees, the rover's wheels will slip on the powdery dust and roll over. That's why our computer finds a zigzag path called <strong>Shadow-Dodge</strong> that keeps the rover in bright sunlight and on gentle hills all the way to the water ice cold trap!
                </p>
              </div>
            </div>
          )}

          {/* Key Mission Flight Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            <div className="card-glass" style={{ padding: '10px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>TOTAL DISTANCE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: '#00f0ff', fontWeight: 700, marginTop: '2px' }}>
                {currentTraverse.totalDistanceM} m
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Traverse odometer</div>
            </div>

            <div className="card-glass" style={{ padding: '10px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>SUNLIT PATH RATIO</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: '#ffb703', fontWeight: 700, marginTop: '2px' }}>
                {currentTraverse.sunLitPct}%
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Shadow-dodge active</div>
            </div>

            <div className="card-glass" style={{ padding: '10px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>DSN EARTH COVERAGE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>
                {currentTraverse.dteCoveragePct}%
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Direct line-of-sight hold</div>
            </div>

            <div className="card-glass" style={{ padding: '10px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>MAX TRAVERSE SLOPE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: '#a78bfa', fontWeight: 700, marginTop: '2px' }}>
                {currentTraverse.maxSlopeDeg}°
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Safe (&lt;12° safety rule)</div>
            </div>

            <div className="card-glass" style={{ padding: '10px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>ESTIMATED DRIVE TIME</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: '#38bdf8', fontWeight: 700, marginTop: '2px' }}>
                {currentTraverse.estimatedDriveHours} hrs
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>At 0.15 m/s drive rate</div>
            </div>
          </div>

          {/* Interactive Rover Autonomous Drive Controller */}
          <div style={{
            background: 'rgba(5, 7, 12, 0.85)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#ffffff', fontWeight: 700 }}>
                  AUTONOMOUS TRAVERSE DRIVE SIMULATOR
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  color: isDriving ? '#34d399' : 'var(--text-muted)',
                  padding: '2px 8px',
                  background: isDriving ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  border: isDriving ? '1px solid #34d399' : '1px solid var(--border-hairline)'
                }}>
                  {isDriving ? '⚡ MOTORS ENGAGED • DRIVING' : '⏸ SYSTEM HOLD'}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    soundFX.playClick();
                    setIsDriving(!isDriving);
                  }}
                  style={{
                    padding: '8px 18px',
                    background: isDriving ? 'rgba(245, 158, 11, 0.2)' : 'linear-gradient(135deg, #00f0ff, #0284c7)',
                    border: isDriving ? '1px solid #f59e0b' : 'none',
                    borderRadius: '6px',
                    color: isDriving ? '#f59e0b' : '#000000',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{isDriving ? '⏸ PAUSE DRIVE' : '▶ START AUTONOMOUS DRIVE'}</span>
                </button>

                <button
                  onClick={() => {
                    soundFX.playClick();
                    setDriveProgress(0);
                    setIsDriving(false);
                  }}
                  className="btn-minimal"
                  style={{ padding: '8px 12px', fontSize: '0.7rem' }}
                >
                  ↺ RESET
                </button>

                {/* Speed Multiplier */}
                {[1, 5, 20].map(mult => (
                  <button
                    key={mult}
                    onClick={() => {
                      soundFX.playClick();
                      setDriveSpeedMultiplier(mult);
                    }}
                    style={{
                      padding: '6px 10px',
                      background: driveSpeedMultiplier === mult ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: driveSpeedMultiplier === mult ? '1px solid #00f0ff' : '1px solid var(--border-hairline)',
                      borderRadius: '4px',
                      color: driveSpeedMultiplier === mult ? '#00f0ff' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.64rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {mult}×
                  </button>
                ))}
              </div>
            </div>

            {/* Drive Progress Scrubber */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                <span style={{ color: '#00f0ff' }}>
                  PROGRESS: {(driveProgress * 100).toFixed(1)}% ({Math.round(driveProgress * currentTraverse.totalDistanceM)}m / {currentTraverse.totalDistanceM}m)
                </span>
                <span style={{ color: '#ffb703' }}>
                  BATTERY SoC: {Math.max(48, Math.round(98 - driveProgress * 24))}% (SOLAR HARVEST: 374W)
                </span>
                <span style={{ color: '#34d399' }}>
                  MOTOR DRIVE: 4-WHEEL ALL-WHEEL DRIVE (NOMINAL)
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.002"
                value={driveProgress}
                onChange={(e) => {
                  setDriveProgress(parseFloat(e.target.value));
                }}
                style={{
                  width: '100%',
                  accentColor: '#00f0ff',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Sequential Waypoint Table */}
          <div style={{
            background: 'rgba(5, 7, 12, 0.85)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#ffffff', fontWeight: 600 }}>
              MISSION WAYPOINT SEQUENCE & SCIENCE OBJECTIVES
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentTraverse.waypoints.map((wp, idx) => {
                const isPassed = driveProgress >= (idx / (currentTraverse.waypoints.length - 1));
                const isNext = !isPassed && (idx === 0 || driveProgress >= ((idx - 1) / (currentTraverse.waypoints.length - 1)));

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: isNext
                        ? 'rgba(0, 240, 255, 0.12)'
                        : isPassed
                          ? 'rgba(52, 211, 153, 0.06)'
                          : 'rgba(255, 255, 255, 0.02)',
                      borderLeft: isNext
                        ? '4px solid #00f0ff'
                        : isPassed
                          ? '4px solid #34d399'
                          : '4px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isNext ? '#00f0ff' : isPassed ? '#34d399' : 'rgba(255, 255, 255, 0.1)',
                        color: isNext || isPassed ? '#000000' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.62rem'
                      }}>
                        {idx}
                      </span>
                      <span style={{ color: isNext ? '#00f0ff' : isPassed ? '#34d399' : '#e2e8f0', fontWeight: 600 }}>
                        {wp.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        X: {wp.x}m, Z: {wp.z}m
                      </span>
                      {wp.drill && (
                        <span style={{
                          padding: '2px 8px',
                          background: 'rgba(0, 240, 255, 0.2)',
                          color: '#00f0ff',
                          borderRadius: '4px',
                          border: '1px solid #00f0ff',
                          fontWeight: 700,
                          fontSize: '0.6rem'
                        }}>
                          TRIDENT 1M DRILL SITE
                        </span>
                      )}
                      <span style={{
                        color: isPassed ? '#34d399' : isNext ? '#00f0ff' : 'var(--text-dim)',
                        fontWeight: 600
                      }}>
                        {isPassed ? '✓ REACHED' : isNext ? 'TARGET' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
