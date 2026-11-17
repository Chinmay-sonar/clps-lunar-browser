import React, { useState, useEffect, useRef } from 'react';
import { soundFX } from '../utils/soundFX';
import {
  simulateTerminalDescent,
  generateFlashLidarPointCloud,
  analyzeLandingHazards,
  MOON_GRAVITY_MPS2,
  MAX_SAFE_TOUCHDOWN_SLOPE_DEG,
  MAX_SAFE_BOULDER_HEIGHT_M
} from '../engine/descentGuidanceHDA.js';

export default function TerminalDescentModal({
  isOpen,
  onClose,
  selectedSite
}) {
  const [boulderHazardLevel, setBoulderHazardLevel] = useState('moderate'); // 'none' | 'moderate' | 'severe'
  const [baseSlopeDeg, setBaseSlopeDeg] = useState(3.5);
  const [simState, setSimState] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [callouts, setCallouts] = useState([]);
  const canvasRef = useRef(null);

  // Generate and run simulation whenever hazards/slope change
  const runSimulation = () => {
    let obstacles = [];
    if (boulderHazardLevel === 'moderate') {
      obstacles = [
        { type: 'boulder', x: 2, y: 3, height: 0.75, radius: 2.2 },
        { type: 'boulder', x: -14, y: 12, height: 0.55, radius: 1.8 },
        { type: 'crater', x: 20, y: -18, depth: 1.4, radius: 5.5 }
      ];
    } else if (boulderHazardLevel === 'severe') {
      obstacles = [
        { type: 'boulder', x: 0, y: 1, height: 1.10, radius: 2.8 }, // Direct bullseye hazard
        { type: 'boulder', x: 8, y: -6, height: 0.85, radius: 2.2 },
        { type: 'boulder', x: -12, y: 15, height: 0.65, radius: 1.9 },
        { type: 'crater', x: 18, y: 22, depth: 2.1, radius: 6.8 },
        { type: 'crater', x: -24, y: -15, depth: 1.8, radius: 5.2 }
      ];
    }

    const sim = simulateTerminalDescent({
      initialAltitude: 500.0,
      nominalTarget: [0, 0],
      obstacles
    });

    setSimState(sim);
    setCurrentStepIndex(0);
    setIsPlaying(true);

    // Build timeline callout logs
    const logs = [
      { time: 0, text: 'T-0.0s (h=500m): Flash LiDAR point cloud acquisition initiated.' },
      { time: 6, text: `T-6.0s (h=420m): Surface normal slope evaluated at ${sim.hdaAnalysis.regionalSlopeDeg}°.` }
    ];

    if (sim.hdaAnalysis.statistics.bouldersDetected > 0) {
      logs.push({
        time: 14,
        text: `T-14.0s (h=320m): [HAZARD] ${sim.hdaAnalysis.statistics.bouldersDetected} boulders detected in landing footprint.`
      });
      logs.push({
        time: 20,
        text: `T-20.0s (h=240m): [DIVERT] ZEM/ZEV retargeting to Safe Haven (${sim.hdaAnalysis.optimalSafeHaven.x}m, ${sim.hdaAnalysis.optimalSafeHaven.y}m).`
      });
    }

    logs.push({ time: 38, text: 'T-38.0s (h=30m): Divert null complete. Entering terminal gate.' });
    logs.push({
      time: Math.round(sim.trajectorySummary.totalDescentTimeSec),
      text: `T-${sim.trajectorySummary.totalDescentTimeSec}s (h=0m): [TOUCHDOWN] Soft landing confirmed (${sim.trajectorySummary.touchdownVelocities.verticalMps} m/s).`
    });

    setCallouts(logs);
    soundFX.voiceCallout('Flash LiDAR hazard detection active. Retargeting terminal descent.');
  };

  useEffect(() => {
    if (isOpen) {
      runSimulation();
    }
  }, [isOpen, boulderHazardLevel, baseSlopeDeg]);

  // Animation playback timer
  useEffect(() => {
    if (!isPlaying || !simState) return;
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev + 1 >= simState.trajectoryWaypoints.length) {
          setIsPlaying(false);
          soundFX.playSuccessChime();
          return prev;
        }
        return prev + 1;
      });
    }, 50); // Fast 20 FPS step advancement
    return () => clearInterval(interval);
  }, [isPlaying, simState]);

  // Canvas LiDAR 2D Top-Down Footprint Renderer
  useEffect(() => {
    if (!canvasRef.current || !simState) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Dark lunar space canvas
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, w, h);

    const center = { x: w / 2, y: h / 2 };
    const scale = (w * 0.42) / 50.0; // 50 meters from center to edge

    // 10-meter concentric range rings
    [10, 20, 30, 40, 50].forEach(rMeters => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(center.x, center.y, rMeters * scale, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '9px monospace';
      ctx.fillText(`${rMeters}m`, center.x + 4, center.y - rMeters * scale - 2);
    });

    // Draw LiDAR point cloud
    if (simState.hdaAnalysis && simState.hdaAnalysis.classifiedPoints) {
      simState.hdaAnalysis.classifiedPoints.forEach(p => {
        const px = center.x + p.x * scale;
        const py = center.y - p.y * scale;

        let color = 'rgba(52, 211, 153, 0.35)'; // Safe planar regolith
        let pointRadius = 2.0;

        if (p.hazardType === 'BOULDER') {
          color = 'rgba(239, 68, 68, 0.85)'; // Red dangerous boulder
          pointRadius = 3.5;
        } else if (p.hazardType === 'CRATER') {
          color = 'rgba(249, 115, 22, 0.75)'; // Orange crater
          pointRadius = 3.0;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, pointRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Nominal Target Reticle (0, 0)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, 8 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.font = '9px monospace';
    ctx.fillText('NOMINAL (ORIGINAL)', center.x + 10, center.y + 12);

    // Selected Safe Haven Reticle
    const haven = simState.hdaAnalysis.optimalSafeHaven;
    if (haven) {
      const hx = center.x + haven.x * scale;
      const hy = center.y - haven.y * scale;

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, haven.clearRadiusM * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy);
      ctx.lineTo(hx + 8, hy);
      ctx.moveTo(hx, hy - 8);
      ctx.lineTo(hx, hy + 8);
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`SAFE HAVEN [${haven.score}%]`, hx + 12, hy - 6);
    }

    // Current Lander Position & Trajectory Trail
    if (simState.trajectoryWaypoints && simState.trajectoryWaypoints.length > 0) {
      // Trail
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= currentStepIndex; i++) {
        const wp = simState.trajectoryWaypoints[i];
        const wx = center.x + wp.posX * scale;
        const wy = center.y - wp.posY * scale;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Current lander symbol
      const curWp = simState.trajectoryWaypoints[currentStepIndex];
      const cx = center.x + curWp.posX * scale;
      const cy = center.y - curWp.posY * scale;

      // Lander circle with thrust pulse
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`LANDER // DESCENT (h=${curWp.altitudeM}m)`, cx + 12, cy + 4);
    }

  }, [simState, currentStepIndex]);

  if (!isOpen) return null;

  const currentWp = simState?.trajectoryWaypoints?.[currentStepIndex] || {
    altitudeM: 500,
    velZ: -14,
    velLateral: 12.6,
    thrustAccel: 3.0,
    tiltDeg: 30,
    timeSec: 0
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(4, 6, 12, 0.88)',
      backdropFilter: 'blur(22px)',
      WebkitBackdropFilter: 'blur(22px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 210,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '1150px',
        maxWidth: '96vw',
        height: '760px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        boxShadow: '0 0 45px rgba(52, 211, 153, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              <circle cx="12" cy="12" r="2.5" fill="#38bdf8" fillOpacity="0.5" />
            </svg>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                  AUTONOMOUS DESCENT GUIDANCE & HAZARD DETECTION (HDA)
                </span>
                <span style={{
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(52, 211, 153, 0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.3)'
                }}>
                  PHASE 3 ENGINE • ZEM/ZEV
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                Flash LiDAR 3D Footprint Profiling • Boulder Tipping Hazard Avoidance • Pinpoint Soft Touchdown
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                soundFX.playClick();
                runSimulation();
              }}
              className="btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.72rem',
                background: 'linear-gradient(135deg, #059669, #10b981)'
              }}
            >
              REPLAY SIMULATION
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="btn-minimal"
              style={{ width: '28px', height: '28px', padding: 0 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Canvas: Flash LiDAR 2D Radar Footprint */}
          <div style={{ flex: 1.15, position: 'relative', borderRight: '1px solid var(--border-hairline)' }}>
            <canvas
              ref={canvasRef}
              width={600}
              height={620}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />

            {/* Top Legend */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              gap: '8px',
              background: 'rgba(10, 14, 24, 0.85)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-hairline)',
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ color: '#34d399' }}>● SAFE REGOLITH (≤5°)</span>
              <span style={{ color: '#ef4444' }}>● BOULDER HAZARD (&gt;0.35m)</span>
              <span style={{ color: '#f97316' }}>● CRATER RIM</span>
            </div>

            {/* Bottom Controls: Hazard Injector */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(10, 14, 24, 0.85)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-hairline)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>HAZARD SCENARIO:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'none', label: 'CLEAN RIM' },
                  { id: 'moderate', label: 'MODERATE BOULDERS' },
                  { id: 'severe', label: 'SEVERE BULLSEYE HAZARD' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      soundFX.playClick();
                      setBoulderHazardLevel(opt.id);
                    }}
                    className={`btn-minimal ${boulderHazardLevel === opt.id ? 'active' : ''}`}
                    style={{ padding: '2px 8px', fontSize: '0.62rem' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <span style={{ color: '#34d399' }}>
                FOV: 100m × 100m • Flash LiDAR
              </span>
            </div>
          </div>

          {/* Right Panel: ZEM/ZEV Guidance Telemetry & Real-Time Callouts */}
          <div style={{
            flex: 0.85,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '16px',
            gap: '14px',
            background: 'rgba(10, 12, 18, 0.6)'
          }}>
            {/* Real-time Descent Telemetry Hud */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}>
              <div className="telemetry-card" style={{ padding: '8px' }}>
                <span className="mono-sub" style={{ fontSize: '0.58rem' }}>ALTITUDE</span>
                <span className="mono-val" style={{ fontSize: '1.05rem', color: '#00f0ff' }}>
                  {currentWp.altitudeM} m
                </span>
              </div>
              <div className="telemetry-card" style={{ padding: '8px' }}>
                <span className="mono-sub" style={{ fontSize: '0.58rem' }}>DESCENT RATE</span>
                <span className="mono-val" style={{ fontSize: '1.05rem', color: currentWp.velZ < -3 ? '#fbbf24' : '#34d399' }}>
                  {currentWp.velZ} m/s
                </span>
              </div>
              <div className="telemetry-card" style={{ padding: '8px' }}>
                <span className="mono-sub" style={{ fontSize: '0.58rem' }}>LATERAL DRIFT</span>
                <span className="mono-val" style={{ fontSize: '1.05rem', color: currentWp.velLateral > 1.0 ? '#ef4444' : '#34d399' }}>
                  {currentWp.velLateral} m/s
                </span>
              </div>
              <div className="telemetry-card" style={{ padding: '8px' }}>
                <span className="mono-sub" style={{ fontSize: '0.58rem' }}>THRUST ACCEL</span>
                <span className="mono-val" style={{ fontSize: '0.9rem', color: '#ffffff' }}>
                  {currentWp.thrustAccel} m/s²
                </span>
              </div>
              <div className="telemetry-card" style={{ padding: '8px' }}>
                <span className="mono-sub" style={{ fontSize: '0.58rem' }}>THRUSTER GIMBAL</span>
                <span className="mono-val" style={{ fontSize: '0.9rem', color: '#ffffff' }}>
                  {currentWp.tiltDeg}°
                </span>
              </div>
              <div className="telemetry-card" style={{ padding: '8px' }}>
                <span className="mono-sub" style={{ fontSize: '0.58rem' }}>DELTA-V EXPENDED</span>
                <span className="mono-val" style={{ fontSize: '0.9rem', color: '#38bdf8' }}>
                  {simState?.trajectorySummary?.totalDeltaVExpendedMps ?? 0} m/s
                </span>
              </div>
            </div>

            {/* Touchdown Assessment Summary */}
            <div style={{
              background: simState?.trajectorySummary?.isTouchdownSuccess ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: simState?.trajectorySummary?.isTouchdownSuccess ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  AUTONOMOUS TOUCHDOWN OUTCOME
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: simState?.trajectorySummary?.isTouchdownSuccess ? '#34d399' : '#ef4444'
                }}>
                  {simState?.trajectorySummary?.outcomeClassification ?? 'ANALYZING'}
                </span>
              </div>

              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                Safe Haven Miss Distance: <strong style={{ color: '#ffffff' }}>{simState?.trajectorySummary?.missDistanceM}m</strong> (Target: &lt; 3.0m)
              </div>
              <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                Final Contact Velocity: <strong style={{ color: '#34d399' }}>{simState?.trajectorySummary?.touchdownVelocities.verticalMps} m/s vertical</strong>, <strong style={{ color: '#34d399' }}>{simState?.trajectorySummary?.touchdownVelocities.lateralMps} m/s lateral</strong>
              </div>
            </div>

            {/* Flight Guidance Callout Chronology */}
            <div>
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: '6px' }}>
                FLIGHT COMPUTER GUIDANCE LOG:
              </span>
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                maxHeight: '180px',
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem'
              }}>
                {callouts.map((c, idx) => (
                  <div key={idx} style={{
                    color: c.text.includes('[HAZARD]') || c.text.includes('[DIVERT]') ? '#fbbf24' : c.text.includes('[TOUCHDOWN]') ? '#34d399' : 'var(--text-secondary)'
                  }}>
                    {c.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Scientific Engineering Footnotes */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '4px', letterSpacing: '0.04em' }}>
                HDA ALGORITHMIC SAFEGUARDS:
              </div>
              <div>• <strong>Plane Fitting:</strong> Least-squares plane normal filters macro-topographic slopes exceeding 6.0°.</div>
              <div>• <strong>Obstacle Gate:</strong> Rejects candidate footpads with residual rock elevation &gt; 0.35m to prevent engine bell or strut failure.</div>
              <div>• <strong>ZEM Guidance:</strong> Minimum-effort quadratic acceleration law drives miss distance to zero before terminal gate transition.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
