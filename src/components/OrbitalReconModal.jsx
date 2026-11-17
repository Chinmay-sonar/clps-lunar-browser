import React, { useState, useEffect, useRef, useMemo } from 'react';
import { soundFX } from '../utils/soundFX';
import {
  computeOrbitalGroundTrack,
  evaluateSurfaceCell,
  executeOrbitalReconnaissance,
  NOMINAL_ORBITAL_VELOCITY_KM_S,
  NOMINAL_ORBITAL_PERIOD_HOURS
} from '../engine/orbitalScanner.js';
import { polarToCartesian } from '../data/lunarGisData.js';

export default function OrbitalReconModal({
  isOpen,
  onClose,
  currentSimDate,
  onSelectSite,
  onTargetCorridor
}) {
  const [selectedRev, setSelectedRev] = useState(0);
  const [activeLayer, setActiveLayer] = useState('composite'); // 'slope' | 'water' | 'thermal' | 'composite'
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [reconReport, setReconReport] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const canvasRef = useRef(null);

  // Compute ground track for the selected revolution
  const groundTrack = useMemo(() => {
    return computeOrbitalGroundTrack(selectedRev, 120);
  }, [selectedRev]);

  // Initial automatic survey run on open
  useEffect(() => {
    if (isOpen && !reconReport) {
      const initialSurvey = executeOrbitalReconnaissance({
        minLat: -89.5,
        maxLat: -84.5,
        gridResolution: 0.45,
        simDate: currentSimDate
      });
      setReconReport(initialSurvey);
    }
  }, [isOpen, currentSimDate, reconReport]);

  // Run full high-resolution reconnaissance sweep
  const handleExecuteScan = () => {
    soundFX.playClick();
    setIsScanning(true);
    setScanProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p >= 100) {
        clearInterval(interval);
        setScanProgress(100);
        setIsScanning(false);
        soundFX.voiceCallout('Orbital reconnaissance sweep complete. Top 3 safe landing corridors extracted.');

        const fullSurvey = executeOrbitalReconnaissance({
          minLat: -89.8,
          maxLat: -84.5,
          gridResolution: 0.35,
          simDate: currentSimDate
        });
        setReconReport(fullSurvey);
      } else {
        setScanProgress(p);
        soundFX.playTelemetry();
      }
    }, 120);
  };

  // Render the polar stereographic scan map with active layer heatmaps and ground track
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Dark lunar space background
    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, width, height);

    // Polar grid concentric latitude circles (85°S, 87°S, 89°S)
    const center = { x: width / 2, y: height / 2 };
    ctx.lineWidth = 1;

    [85, 87, 89].forEach(latDeg => {
      const p = polarToCartesian(-latDeg, 0, width, height, 0.95);
      const radius = Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2));

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '9px monospace';
      ctx.fillText(`${latDeg}°S`, center.x + 4, center.y - radius - 2);
    });

    // Meridians (0°, 90°, 180°, 270°)
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg * Math.PI) / 180;
      const maxR = width * 0.44 * 0.95;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x + maxR * Math.sin(rad), center.y + maxR * Math.cos(rad));
      ctx.stroke();
    }

    // Draw Heatmap Cells if report available
    if (reconReport && reconReport.sampleGrid) {
      reconReport.sampleGrid.forEach(cell => {
        const pt = polarToCartesian(cell.coordinates.lat, cell.coordinates.lon, width, height, 0.95);
        if (pt.x < 0 || pt.x > width || pt.y < 0 || pt.y > height) return;

        let color = 'rgba(100, 100, 100, 0.2)';
        if (activeLayer === 'slope') {
          // Green: safe <= 5°, Yellow: 8-15°, Red: > 15°
          const slope = cell.topography.slopeDeg;
          if (slope <= 5) color = 'rgba(52, 211, 153, 0.65)';
          else if (slope <= 12) color = 'rgba(251, 191, 36, 0.65)';
          else color = 'rgba(239, 68, 68, 0.75)';
        } else if (activeLayer === 'water') {
          // Cyan/Blue for high WEH
          const ice = cell.volatiles.waterIceWEH;
          if (ice >= 3.0) color = 'rgba(56, 189, 248, 0.85)';
          else if (ice >= 1.0) color = 'rgba(59, 130, 246, 0.6)';
          else color = 'rgba(100, 116, 139, 0.25)';
        } else if (activeLayer === 'thermal') {
          // Purple/Blue cryogenic vs Orange sunlit
          const temp = cell.thermal.surfaceTempK;
          if (temp < 60) color = 'rgba(168, 85, 247, 0.8)';
          else if (temp < 150) color = 'rgba(56, 189, 248, 0.5)';
          else color = 'rgba(249, 115, 22, 0.6)';
        } else {
          // Composite Score
          const score = cell.scoring.compositeScore;
          if (score >= 75) color = 'rgba(52, 211, 153, 0.75)';
          else if (score >= 50) color = 'rgba(251, 191, 36, 0.6)';
          else color = 'rgba(239, 68, 68, 0.5)';
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw Ground Track of Propulsion Module
    if (groundTrack && groundTrack.length > 0) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();

      groundTrack.forEach((p, idx) => {
        if (p.lat < -80) {
          const pt = polarToCartesian(p.lat, p.lon, width, height, 0.95);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Spacecraft Sub-Orbital Marker & Swath Cone
      const midPoint = groundTrack[Math.floor(groundTrack.length / 2)];
      if (midPoint && midPoint.lat < -80) {
        const scPos = polarToCartesian(midPoint.lat, midPoint.lon, width, height, 0.95);

        // Radar Swath Beam
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(scPos.x, scPos.y, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(scPos.x, scPos.y, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Orbiter icon
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(scPos.x, scPos.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00f0ff';
        ctx.font = '10px monospace';
        ctx.fillText('LRO // ORBITER (100km)', scPos.x + 8, scPos.y - 8);
      }
    }

    // Highlight Top Landing Corridors (Havens)
    if (reconReport && reconReport.topLandingCorridors) {
      reconReport.topLandingCorridors.forEach((haven, idx) => {
        const pt = polarToCartesian(haven.coordinates.lat, haven.coordinates.lon, width, height, 0.95);

        ctx.strokeStyle = idx === 0 ? '#34d399' : idx === 1 ? '#38bdf8' : '#fbbf24';
        ctx.lineWidth = 2;

        // Landing Ellipse
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, 14, 9, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing Reticle center
        ctx.fillStyle = idx === 0 ? '#34d399' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Badge label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(idx === 0 ? 'ALPHA [98%]' : idx === 1 ? 'BETA [84%]' : 'GAMMA [78%]', pt.x + 12, pt.y + 3);
      });
    }

    // South Pole center marker
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '9px monospace';
    ctx.fillText('SOUTH POLE (-90°)', center.x + 6, center.y + 12);

  }, [isOpen, groundTrack, reconReport, activeLayer]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(2, 4, 8, 0.90)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px',
      fontFamily: "'Google Sans', sans-serif"
    }}>
      <div style={{
        width: '1140px',
        maxWidth: '96vw',
        height: '760px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        background: 'linear-gradient(180deg, #090d16 0%, #030408 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 32px 100px rgba(0, 0, 0, 0.95), 0 0 60px rgba(0, 240, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(12, 17, 28, 0.92) 0%, rgba(6, 9, 16, 0.96) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              color: '#00f0ff'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24" />
              </svg>
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: "'Google Sans', sans-serif", fontWeight: 700, fontSize: '0.98rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
                  AI ORBITAL RECONNAISSANCE & HAZARD DETECTION PHASE 2 ENGINE
                </span>
                <span style={{
                  fontSize: '0.62rem',
                  fontFamily: "'Google Sans', sans-serif",
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: 'rgba(0, 240, 255, 0.12)',
                  color: '#00f0ff',
                  border: '1px solid rgba(0, 240, 255, 0.3)'
                }}>
                  ACTIVE SENSOR SWATH
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: "'Google Sans', sans-serif" }}>
                100 km Frozen Polar Orbit • LiDAR Swath Mapping & Landing Corridor Extraction
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExecuteScan}
              disabled={isScanning}
              style={{
                padding: '7px 16px',
                fontSize: '0.74rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: isScanning ? 'wait' : 'pointer',
                fontFamily: "'Google Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ffffff',
                background: isScanning ? 'rgba(0, 240, 255, 0.2)' : 'linear-gradient(135deg, #0284c7, #06b6d4)'
              }}
            >
              <span>{isScanning ? 'SCANNING SWATH...' : 'RUN AUTONOMOUS SWEEP'}</span>
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
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px'
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar (during sweep) */}
        {isScanning && (
          <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.05)' }}>
            <div style={{
              width: `${scanProgress}%`,
              height: '100%',
              background: '#00f0ff',
              transition: 'width 0.12s linear',
              boxShadow: '0 0 8px #00f0ff'
            }} />
          </div>
        )}

        {/* Main Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Canvas Radar Map */}
          <div style={{ flex: 1.1, position: 'relative', borderRight: '1px solid var(--border-hairline)' }}>
            <canvas
              ref={canvasRef}
              width={580}
              height={600}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />

            {/* Top Overlay: Layer Switcher */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              gap: '4px',
              background: 'rgba(10, 14, 24, 0.85)',
              padding: '3px',
              borderRadius: '6px',
              border: '1px solid var(--border-hairline)'
            }}>
              {[
                { id: 'composite', label: 'COMPOSITE SUITABILITY' },
                { id: 'slope', label: 'SLOPE GRADIENT' },
                { id: 'water', label: 'VOLATILES / ICE' },
                { id: 'thermal', label: 'THERMAL REGIME' }
              ].map(layer => (
                <button
                  key={layer.id}
                  onClick={() => {
                    soundFX.playClick();
                    setActiveLayer(layer.id);
                  }}
                  style={{
                    background: activeLayer === layer.id ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                    color: activeLayer === layer.id ? '#00f0ff' : 'var(--text-muted)',
                    border: activeLayer === layer.id ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid transparent',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {layer.label}
                </button>
              ))}
            </div>

            {/* Bottom Overlay: Revolution Scrubber */}
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
              <span style={{ color: 'var(--text-secondary)' }}>ORBIT REVOLUTION:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2, 3, 4, 5, 6].map(rev => (
                  <button
                    key={rev}
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedRev(rev);
                    }}
                    className={`btn-minimal ${selectedRev === rev ? 'active' : ''}`}
                    style={{ padding: '2px 8px', fontSize: '0.62rem' }}
                  >
                    REV {rev + 1}
                  </button>
                ))}
              </div>
              <span style={{ color: '#00f0ff' }}>
                v = {NOMINAL_ORBITAL_VELOCITY_KM_S.toFixed(2)} km/s • T = {NOMINAL_ORBITAL_PERIOD_HOURS.toFixed(2)}h
              </span>
            </div>
          </div>

          {/* Right Panel: Extracted Corridors & Tactical Dossier */}
          <div style={{
            flex: 0.9,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '18px',
            gap: '14px',
            background: 'rgba(6, 9, 15, 0.8)'
          }}>
            {/* Survey Executive Summary Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px'
            }}>
              <div style={{
                background: 'rgba(14, 18, 28, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px'
              }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>SURVEYED AREA</span>
                <span style={{ fontSize: '0.98rem', color: '#ffffff', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                  {reconReport?.surveyMetadata?.surveyedAreaKm2 ? reconReport.surveyMetadata.surveyedAreaKm2.toLocaleString() : '272,673'} km²
                </span>
              </div>
              <div style={{
                background: 'rgba(14, 18, 28, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px'
              }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>PRIME CORRIDORS</span>
                <span style={{ fontSize: '0.98rem', color: '#34d399', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                  {reconReport?.surveyMetadata?.primeZonesFound ?? 14} ZONES
                </span>
              </div>
              <div style={{
                background: 'rgba(14, 18, 28, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '10px 12px'
              }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>WATER ICE HOTSPOTS</span>
                <span style={{ fontSize: '0.98rem', color: '#38bdf8', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                  {reconReport?.surveyMetadata?.waterIceHotspots ?? 28} COLD TRAPS
                </span>
              </div>
            </div>

            {/* Extracted Landing Havens */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
                  TOP AUTONOMOUS LANDING HAVENS
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                  MCDA Evaluated ({reconReport?.topLandingCorridors?.length ?? 3} Candidates)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reconReport && reconReport.topLandingCorridors && reconReport.topLandingCorridors.map((haven, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: idx === 0 ? 'rgba(52, 211, 153, 0.06)' : 'rgba(14, 18, 28, 0.75)',
                      border: idx === 0 ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: idx === 0 ? '#34d399' : '#38bdf8',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {haven.designation}
                        </span>
                        <span style={{
                          fontSize: '0.6rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-secondary)'
                        }}>
                          {Math.abs(haven.coordinates.lat).toFixed(2)}°S, {haven.coordinates.lon.toFixed(2)}°E
                        </span>
                      </div>

                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: idx === 0 ? '#34d399' : '#38bdf8'
                      }}>
                        {haven.compositeScore}% SUITABLE
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '4px',
                      fontSize: '0.62rem',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>SLOPE</span>
                        <span style={{ color: haven.slopeDegrees <= 5 ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                          {haven.slopeDegrees}°
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>ELEVATION</span>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>
                          {haven.elevationMeters}m
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>WATER ICE</span>
                        <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                          {haven.waterIceYieldWEH} wt%
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>DTE COMMS</span>
                        <span style={{ color: haven.dteLinkMarginDb > 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                          {haven.dteLinkMarginDb > 0 ? `+${haven.dteLinkMarginDb} dB` : `${haven.dteLinkMarginDb} dB`}
                        </span>
                      </div>
                    </div>

                    {/* Action & PDI Burn Vector */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        PDI VECTOR: ΔV {haven.pdiVector.deltaVMps} m/s • Burn {haven.pdiVector.burnDurationSec}s • Appr {haven.pdiVector.approachAzimuthDeg}°
                      </div>

                      <button
                        onClick={() => {
                          soundFX.playClick();
                          soundFX.voiceCallout(`Guidance system locked to ${haven.designation}. Coordinates committed.`);
                          if (onTargetCorridor) onTargetCorridor(haven);
                          onClose();
                        }}
                        className="btn-primary"
                        style={{
                          padding: '3px 10px',
                          fontSize: '0.62rem',
                          background: idx === 0 ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(56, 189, 248, 0.2)',
                          color: '#ffffff'
                        }}
                      >
                        LOCK GUIDANCE & TARGET
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scientific Recon Dossier Notes */}
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
                TACTICAL RECONNAISSANCE PROTOCOL
              </div>
              <div>• <strong>LOLA LiDAR:</strong> Continuous 5-beam range altimetry filters out boulder fields and crater slopes &gt; 15°.</div>
              <div>• <strong>LEND Neutron Flux:</strong> Discriminates epithermal neutron deficit indicating hydrogen / water ice enrichment.</div>
              <div>• <strong>Descent Guidance:</strong> Powered Descent Initiation (PDI) burns initiate from 100km apoapsis descending along retrograde vector.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
