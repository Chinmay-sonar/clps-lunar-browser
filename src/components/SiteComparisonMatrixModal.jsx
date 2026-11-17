import React, { useState, useMemo, useRef, useEffect } from 'react';
import { soundFX } from '../utils/soundFX';
import { LANDING_SITES } from '../engine/landingSitesDE441.js';
import {
  evaluateMultiSiteComparison,
  compareSitesHeadToHead,
  SITE_PALETTE,
  DEFAULT_TRADE_WEIGHTS
} from '../engine/comparativeMatrix.js';

export default function SiteComparisonMatrixModal({
  isOpen,
  onClose,
  currentSimDate = new Date('2026-12-05T08:00:00Z'),
  onSelectSite
}) {
  const [selectedSiteIds, setSelectedSiteIds] = useState([
    'malapert-massif',
    'shackleton-connecting-ridge',
    'mons-mouton',
    'nobile-rim-1'
  ]);
  const [durationDays, setDurationDays] = useState(14);
  const [activeMetric, setActiveMetric] = useState('power'); // 'power' | 'earthElev' | 'linkMargin' | 'viability'
  const [hoverIndex, setHoverIndex] = useState(null);
  const [h2hSiteA, setH2hSiteA] = useState('malapert-massif');
  const [h2hSiteB, setH2hSiteB] = useState('shackleton-connecting-ridge');

  const canvasRef = useRef(null);

  // Compute multi-site comparison
  const comparisonData = useMemo(() => {
    if (!isOpen || selectedSiteIds.length === 0) return null;
    return evaluateMultiSiteComparison({
      siteIds: selectedSiteIds,
      startDate: currentSimDate,
      durationDays,
      stepHours: 2
    });
  }, [isOpen, selectedSiteIds, currentSimDate, durationDays]);

  // Compute head-to-head comparison
  const headToHeadData = useMemo(() => {
    if (!isOpen || !h2hSiteA || !h2hSiteB) return null;
    try {
      return compareSitesHeadToHead(h2hSiteA, h2hSiteB, currentSimDate);
    } catch {
      return null;
    }
  }, [isOpen, h2hSiteA, h2hSiteB, currentSimDate]);

  // Handle toggling site selection
  const toggleSite = (siteId) => {
    soundFX.playClick();
    if (selectedSiteIds.includes(siteId)) {
      if (selectedSiteIds.length <= 1) return; // Keep at least one
      setSelectedSiteIds(prev => prev.filter(id => id !== siteId));
    } else {
      setSelectedSiteIds(prev => [...prev, siteId]);
    }
  };

  // Render multi-curve chart on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !comparisonData) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    // Background
    ctx.fillStyle = '#06080d';
    ctx.fillRect(0, 0, W, H);

    // Padding
    const padL = 55;
    const padR = 25;
    const padT = 30;
    const padB = 40;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const totalSteps = comparisonData.window.totalSteps;

    // Determine value range based on active metric
    let minVal = 0;
    let maxVal = 100;
    let unit = '%';

    if (activeMetric === 'power') {
      minVal = 0;
      maxVal = 1100; // Watts
      unit = ' W';
    } else if (activeMetric === 'earthElev') {
      minVal = -5;
      maxVal = 15; // Degrees
      unit = '°';
    } else if (activeMetric === 'linkMargin') {
      minVal = -20;
      maxVal = 20; // dB
      unit = ' dB';
    } else if (activeMetric === 'viability') {
      minVal = 0;
      maxVal = 100;
      unit = '%';
    }

    // Grid lines (horizontal)
    const gridRows = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'right';

    for (let r = 0; r <= gridRows; r++) {
      const y = padT + (plotH / gridRows) * r;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();

      const val = maxVal - ((maxVal - minVal) / gridRows) * r;
      ctx.fillText(`${Math.round(val)}${unit}`, padL - 8, y + 3);
    }

    // Zero line if range spans negative
    if (minVal < 0 && maxVal > 0) {
      const zeroY = padT + plotH * (maxVal / (maxVal - minVal));
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, zeroY);
      ctx.lineTo(W - padR, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Grid lines (vertical time ticks)
    const dayCols = Math.min(durationDays, 7);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

    for (let d = 0; d <= dayCols; d++) {
      const x = padL + (plotW / dayCols) * d;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.moveTo(x, padT);
      ctx.lineTo(x, H - padB);
      ctx.stroke();

      const dayOffset = Math.round((durationDays / dayCols) * d);
      ctx.fillText(`+${dayOffset}d`, x, H - padB + 16);
    }

    // Draw curves for each site
    comparisonData.sites.forEach(siteItem => {
      let seriesData;
      if (activeMetric === 'power') seriesData = siteItem.series.power;
      else if (activeMetric === 'earthElev') seriesData = siteItem.series.earthElevation;
      else if (activeMetric === 'linkMargin') seriesData = siteItem.series.linkMargin;
      else seriesData = siteItem.series.viability;

      if (!seriesData || seriesData.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = siteItem.color;
      ctx.lineWidth = 2.0;

      for (let i = 0; i < seriesData.length; i++) {
        const val = seriesData[i];
        const normVal = (val - minVal) / (maxVal - minVal);
        const clampedNorm = Math.max(0, Math.min(1, normVal));

        const x = padL + (plotW / (totalSteps - 1)) * i;
        const y = padT + plotH * (1 - clampedNorm);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Draw crosshair and hover point if user is hovering
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < totalSteps) {
      const hoverX = padL + (plotW / (totalSteps - 1)) * hoverIndex;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverX, padT);
      ctx.lineTo(hoverX, H - padB);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw point markers for each site
      comparisonData.sites.forEach(siteItem => {
        let seriesData;
        if (activeMetric === 'power') seriesData = siteItem.series.power;
        else if (activeMetric === 'earthElev') seriesData = siteItem.series.earthElevation;
        else if (activeMetric === 'linkMargin') seriesData = siteItem.series.linkMargin;
        else seriesData = siteItem.series.viability;

        const val = seriesData[hoverIndex];
        const normVal = (val - minVal) / (maxVal - minVal);
        const clampedNorm = Math.max(0, Math.min(1, normVal));
        const y = padT + plotH * (1 - clampedNorm);

        ctx.fillStyle = siteItem.color;
        ctx.beginPath();
        ctx.arc(hoverX, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  }, [comparisonData, activeMetric, hoverIndex, durationDays]);

  // Handle canvas mouse move for hover tooltip
  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !comparisonData) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padL = 55;
    const padR = 25;
    const plotW = rect.width - padL - padR;

    if (x < padL || x > rect.width - padR) {
      setHoverIndex(null);
      return;
    }

    const frac = (x - padL) / plotW;
    const idx = Math.round(frac * (comparisonData.window.totalSteps - 1));
    setHoverIndex(idx);
  };

  const handleCanvasMouseLeave = () => {
    setHoverIndex(null);
  };

  // Export trade study as CSV
  const handleExportCsv = () => {
    if (!comparisonData) return;
    soundFX.playClick();

    let csv = 'Rank,Site Name,Designation,Illumination (%),Longest Day (hrs),Max Shadow (hrs),DTE Comms (%),Max Blackout (hrs),Water Ice (wt%),Slope Hazard (deg),Composite Score (%)\n';
    comparisonData.rankedSites.forEach(s => {
      csv += `${s.rank},"${s.site.name}","${s.site.designation}",${s.metrics.illuminationPct},${s.metrics.longestSunHours},${s.metrics.longestShadowHours},${s.metrics.commsAvailabilityPct},${s.metrics.longestBlackoutHours},${s.site.waterIceWEH || 0},${s.site.maxSlopeDeg || 0},${s.metrics.compositeScore}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NASA_CLPS_Trade_Study_Matrix_${comparisonData.window.startDate.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 5, 9, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1240px',
        maxHeight: '92vh',
        background: 'rgba(9, 12, 19, 0.96)',
        border: '1px solid var(--border-hairline)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M7 16l4-5 4 2 5-7" />
              </svg>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.28rem',
                fontWeight: 400,
                color: '#ffffff',
                letterSpacing: '-0.015em',
                margin: 0
              }}>
                Multi-Site Comparative Trade Study Matrix
              </h2>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.04em'
              }}>
                NASA DE441 • SYNCHRONOUS OVERLAY
              </span>
            </div>
            <p style={{
              margin: '4px 0 0 0',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)'
            }}>
              Simultaneous solar illumination, DTE comms link margin, and ISRU volatile access trade study across candidate South Pole landing sites.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleExportCsv}
              className="btn-minimal"
              style={{
                height: '30px',
                padding: '0 12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '0.70rem',
                fontWeight: 600,
                gap: '6px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>EXPORT CSV</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-muted)',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {/* Controls Bar: Site Selector Pills + Window Duration + Active Metric */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-hairline)'
          }}>
            {/* Site Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.64rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginRight: '4px'
              }}>
                Compare Sites ({selectedSiteIds.length}/6):
              </span>
              {LANDING_SITES.map(site => {
                const isSelected = selectedSiteIds.includes(site.id);
                const color = SITE_PALETTE[site.id] || '#00f0ff';
                return (
                  <button
                    key={site.id}
                    onClick={() => toggleSite(site.id)}
                    style={{
                      background: isSelected ? `${color}22` : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isSelected ? color : 'rgba(255, 255, 255, 0.12)'}`,
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.66rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: color,
                      boxShadow: isSelected ? `0 0 8px ${color}` : 'none'
                    }} />
                    <span>{site.name.split(' (')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Duration Selector & Metric Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Duration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
                {[7, 14, 28].map(days => (
                  <button
                    key={days}
                    onClick={() => {
                      soundFX.playClick();
                      setDurationDays(days);
                    }}
                    style={{
                      background: durationDays === days ? 'rgba(0, 240, 255, 0.25)' : 'transparent',
                      color: durationDays === days ? '#00f0ff' : 'var(--text-muted)',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {days}D
                  </button>
                ))}
              </div>

              {/* Metric Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
                {[
                  { id: 'power', label: 'SOLAR POWER' },
                  { id: 'earthElev', label: 'EARTH ELEV' },
                  { id: 'linkMargin', label: 'LINK MARGIN' },
                  { id: 'viability', label: 'VIABILITY' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      soundFX.playClick();
                      setActiveMetric(m.id);
                    }}
                    style={{
                      background: activeMetric === m.id ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                      color: activeMetric === m.id ? '#fbbf24' : 'var(--text-muted)',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Multi-Curve Chart View */}
          <div style={{
            background: '#06080d',
            border: '1px solid var(--border-hairline)',
            borderRadius: '8px',
            padding: '12px',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px'
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.64rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}>
                SYNCHRONIZED {activeMetric.toUpperCase()} OVERLAY ({durationDays} DAYS • {comparisonData?.window.startDate.slice(0, 10)} → {comparisonData?.window.endDate.slice(0, 10)})
              </span>

              {/* Live Hover Tooltip Values */}
              {hoverIndex !== null && comparisonData && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.64rem',
                  color: '#ffffff'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    T+{Math.round(hoverIndex * 2)}h ({new Date(comparisonData.timestamps[hoverIndex]).toUTCString().slice(5, 22)}):
                  </span>
                  {comparisonData.sites.map(s => {
                    let val;
                    if (activeMetric === 'power') val = `${Math.round(s.series.power[hoverIndex])} W`;
                    else if (activeMetric === 'earthElev') val = `${s.series.sunElevation[hoverIndex].toFixed(1)}°`;
                    else if (activeMetric === 'linkMargin') val = `${s.series.linkMargin[hoverIndex].toFixed(1)} dB`;
                    else val = `${Math.round(s.series.viability[hoverIndex])}%`;

                    return (
                      <span key={s.site.id} style={{ color: s.color, fontWeight: 700 }}>
                        {s.site.name.split(' (')[0]}: {val}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <canvas
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              style={{
                width: '100%',
                height: '240px',
                display: 'block',
                cursor: 'crosshair',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Trade-Off Matrix Table */}
          {comparisonData && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0
                }}>
                  MULTI-CRITERIA TRADE STUDY RANKINGS ({durationDays}-DAY EVALUATION)
                </h3>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  color: 'var(--text-muted)'
                }}>
                  Weights: Power (30%) • Sun Window (15%) • Comms (25%) • Safety (15%) • ISRU (15%)
                </span>
              </div>

              <div style={{
                overflowX: 'auto',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  textAlign: 'left'
                }}>
                  <thead>
                    <tr style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderBottom: '1px solid var(--border-hairline)',
                      color: 'var(--text-muted)'
                    }}>
                      <th style={{ padding: '8px 12px' }}>RANK</th>
                      <th style={{ padding: '8px 12px' }}>CANDIDATE SITE</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>SUNLIGHT %</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>LONGEST DAY</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>DTE COMMS %</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>MAX BLACKOUT</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>WATER ICE (WEH)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>SLOPE HAZARD</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>COMPOSITE SCORE</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.rankedSites.map(item => (
                      <tr
                        key={item.site.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: item.rank === 1 ? 'rgba(0, 240, 255, 0.04)' : 'transparent'
                        }}
                      >
                        {/* Rank */}
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: item.rank === 1 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: item.rank === 1 ? '#00f0ff' : 'var(--text-muted)',
                            fontWeight: 800,
                            fontSize: '0.62rem'
                          }}>
                            #{item.rank} {item.rank === 1 ? 'PRIME' : ''}
                          </span>
                        </td>

                        {/* Site Name & Badges */}
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: item.color
                            }} />
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff' }}>{item.site.name}</div>
                              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                                {item.site.elevationM}m elev • Lat {item.site.lat.toFixed(2)}°S, Lon {item.site.lon.toFixed(1)}°E
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Sunlight % */}
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>
                          {item.metrics.illuminationPct}%
                        </td>

                        {/* Longest Day */}
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#ffffff' }}>
                          {item.metrics.longestSunHours} hrs
                        </td>

                        {/* DTE Comms % */}
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#00f0ff' }}>
                          {item.metrics.commsAvailabilityPct}%
                        </td>

                        {/* Max Blackout */}
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: item.metrics.longestBlackoutHours > 24 ? '#f43f5e' : 'var(--text-muted)' }}>
                          {item.metrics.longestBlackoutHours} hrs
                        </td>

                        {/* Water Ice */}
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#38bdf8' }}>
                          {item.site.waterIceWEH} wt% ({item.site.psrDistanceKm} km)
                        </td>

                        {/* Slope Hazard */}
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: item.site.maxSlopeDeg > 15 ? '#f43f5e' : '#10b981' }}>
                          {item.site.maxSlopeDeg}° max
                        </td>

                        {/* Composite Score */}
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div style={{
                              width: '45px',
                              height: '5px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${item.metrics.compositeScore}%`,
                                height: '100%',
                                background: item.rank === 1 ? '#00f0ff' : '#10b981'
                              }} />
                            </div>
                            <span style={{ fontWeight: 800, color: item.rank === 1 ? '#00f0ff' : '#ffffff' }}>
                              {item.metrics.compositeScore}%
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              soundFX.playTelemetry();
                              if (onSelectSite) onSelectSite(item.site);
                              onClose();
                            }}
                            className="btn-minimal"
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.62rem',
                              border: '1px solid rgba(0, 240, 255, 0.4)',
                              color: '#00f0ff',
                              fontWeight: 700
                            }}
                          >
                            TARGET SITE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Head-to-Head Comparison Card */}
          {headToHeadData && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              padding: '12px 16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  HEAD-TO-HEAD CANDIDATE COMPARISON
                </span>

                {/* Dropdowns */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={h2hSiteA}
                    onChange={(e) => setH2hSiteA(e.target.value)}
                    style={{
                      background: 'rgba(10, 14, 23, 0.9)',
                      border: '1px solid var(--border-hairline)',
                      color: '#00f0ff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.66rem',
                      padding: '3px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {LANDING_SITES.map(s => (
                      <option key={s.id} value={s.id}>{s.name.split(' (')[0]}</option>
                    ))}
                  </select>

                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800 }}>VS</span>

                  <select
                    value={h2hSiteB}
                    onChange={(e) => setH2hSiteB(e.target.value)}
                    style={{
                      background: 'rgba(10, 14, 23, 0.9)',
                      border: '1px solid var(--border-hairline)',
                      color: '#f59e0b',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.66rem',
                      padding: '3px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {LANDING_SITES.map(s => (
                      <option key={s.id} value={s.id}>{s.name.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Differential Metric Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>SUNLIGHT DIFFERENTIAL</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: headToHeadData.delta.illuminationDiffPct >= 0 ? '#00f0ff' : '#f59e0b' }}>
                    {headToHeadData.delta.illuminationDiffPct >= 0 ? `+${headToHeadData.delta.illuminationDiffPct}%` : `${headToHeadData.delta.illuminationDiffPct}%`}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>COMMS DIFFERENTIAL</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: headToHeadData.delta.commsDiffPct >= 0 ? '#00f0ff' : '#f59e0b' }}>
                    {headToHeadData.delta.commsDiffPct >= 0 ? `+${headToHeadData.delta.commsDiffPct}%` : `${headToHeadData.delta.commsDiffPct}%`}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>DAYLIGHT STREAK Δ</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: headToHeadData.delta.continuousSunDiffHours >= 0 ? '#00f0ff' : '#f59e0b' }}>
                    {headToHeadData.delta.continuousSunDiffHours >= 0 ? `+${headToHeadData.delta.continuousSunDiffHours}h` : `${headToHeadData.delta.continuousSunDiffHours}h`}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>SLOPE SAFETY Δ</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: headToHeadData.delta.slopeMarginDiffDeg >= 0 ? '#10b981' : '#f43f5e' }}>
                    {headToHeadData.delta.slopeMarginDiffDeg >= 0 ? `+${headToHeadData.delta.slopeMarginDiffDeg.toFixed(1)}° flatter` : `${headToHeadData.delta.slopeMarginDiffDeg.toFixed(1)}° steeper`}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>OVERALL ADVANTAGE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                    {headToHeadData.winner.split(' (')[0]}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
