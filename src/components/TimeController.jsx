import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { soundFX } from '../utils/soundFX';

// Mission timeline span: 2026-01-01 to 2030-12-31 UTC
const BASE_EPOCH = new Date('2026-01-01T00:00:00Z').getTime();
const END_EPOCH = new Date('2030-12-31T23:59:59Z').getTime();
const TOTAL_HOURS = Math.round((END_EPOCH - BASE_EPOCH) / (3600 * 1000)); // 43,824 hours

export default function TimeController({
  currentSimDate,
  setCurrentSimDate,
  isPlaying,
  setIsPlaying,
  simSpeed = 3600,
  setSimSpeed,
  timelineForecast,
  onSelectMission,
  onOpenAnalytics,
  onOpenRadar,
  telemetry
}) {
  const [activeTab, setActiveTab] = useState('mission'); // 'mission' | 'analysis' | 'telemetry' | 'settings'
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const timelineBarRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Auto simulation ticker
  useEffect(() => {
    if (!isPlaying) return;
    let lastTick = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dtSec = Math.min(0.1, (now - lastTick) / 1000);
      lastTick = now;
      const stepMs = Math.max(1000, Math.round(dtSec * simSpeed * 1000));
      setCurrentSimDate(prev => {
        const nextTime = prev.getTime() + stepMs;
        if (nextTime > END_EPOCH) return new Date(BASE_EPOCH);
        return new Date(nextTime);
      });
    }, 33);
    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, setCurrentSimDate]);

  // Calculations for dates & timeline progress
  const currentTimeMs = currentSimDate.getTime();
  const currentOffsetHours = Math.max(0, Math.min(TOTAL_HOURS, (currentTimeMs - BASE_EPOCH) / (3600 * 1000)));
  const progressRatio = Math.max(0, Math.min(1, (currentTimeMs - BASE_EPOCH) / (END_EPOCH - BASE_EPOCH)));

  const formattedDate = currentSimDate.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const metHours = Math.round(currentOffsetHours);
  const metFormatted = `T+${metHours.toLocaleString()}h`;

  // Dynamic years based on current year
  const currentYear = currentSimDate.getUTCFullYear();
  const year1 = Math.min(2029, Math.max(2026, currentYear));
  const year2 = year1 + 1;

  // Handle Scrubbing by user click or drag (accurately mapped to track width)
  const handleScrub = useCallback((clientX) => {
    if (!timelineBarRef.current) return;
    const rect = timelineBarRef.current.getBoundingClientRect();
    const offset = isTimelineCollapsed ? 32 : 160;
    const trackLeft = rect.left + offset;
    const trackWidth = rect.width - (isTimelineCollapsed ? 64 : 160);
    if (trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - trackLeft) / trackWidth));
    const targetTimeMs = BASE_EPOCH + ratio * (END_EPOCH - BASE_EPOCH);
    setCurrentSimDate(new Date(targetTimeMs));
  }, [setCurrentSimDate, isTimelineCollapsed]);

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    handleScrub(e.clientX);
    try { soundFX.playClick(); } catch (err) {}

    const onPointerMove = (ev) => {
      if (isDraggingRef.current) {
        handleScrub(ev.clientX);
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleStepDays = (days) => {
    try { soundFX.playClick(); } catch (err) {}
    setCurrentSimDate(prev => {
      const nextTime = Math.max(BASE_EPOCH, Math.min(END_EPOCH, prev.getTime() + days * 24 * 3600 * 1000));
      return new Date(nextTime);
    });
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '10px 24px 18px',
        background: 'rgba(0, 0, 0, 0.94)',
        backdropFilter: 'blur(28px)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: 'none',
        boxShadow: '0 -16px 48px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        position: 'relative',
        userSelect: 'none',
        fontFamily: "'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#ffffff',
        overflow: 'hidden'
      }}
    >
      {/* ─── 1. TOP BAR: CRESCENT LOGO, TABS & DATE/CONTROLS ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {/* Left: Crescent Moon Icon + Divider + Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Crescent Moon Icon */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))' }}>
              <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                fill="#ffffff"
                opacity="0.95"
              />
            </svg>
          </div>

          {/* Thin Divider */}
          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.25)' }} />

          {/* Tabs: Mission | Analysis | Telemetry | Settings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
            {/* Tab: Mission */}
            <div
              onClick={() => {
                setActiveTab('mission');
                try { soundFX.playClick(); } catch (e) {}
              }}
              style={{
                fontSize: '13px',
                fontWeight: activeTab === 'mission' ? 500 : 400,
                color: activeTab === 'mission' ? '#ffffff' : '#888888',
                cursor: 'pointer',
                position: 'relative',
                paddingBottom: '6px',
                transition: 'color 0.2s ease',
                letterSpacing: '0.02em'
              }}
            >
              Mission
              {activeTab === 'mission' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#ffffff',
                    borderRadius: '2px'
                  }}
                />
              )}
            </div>

            {/* Tab: Analysis */}
            <div
              onClick={() => {
                setActiveTab('analysis');
                try { soundFX.playClick(); } catch (e) {}
                if (onOpenAnalytics) onOpenAnalytics();
              }}
              style={{
                fontSize: '13px',
                fontWeight: activeTab === 'analysis' ? 500 : 400,
                color: activeTab === 'analysis' ? '#ffffff' : '#888888',
                cursor: 'pointer',
                position: 'relative',
                paddingBottom: '6px',
                transition: 'color 0.2s ease',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => {
                if (activeTab !== 'analysis') e.currentTarget.style.color = '#888888';
              }}
            >
              Analysis
              {activeTab === 'analysis' && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#ffffff', borderRadius: '2px' }} />
              )}
            </div>

            {/* Tab: Telemetry (Shadow & Thermal Impact Report) */}
            <div
              onClick={() => {
                setActiveTab(activeTab === 'telemetry' ? 'mission' : 'telemetry');
                try { soundFX.playClick(); } catch (e) {}
              }}
              style={{
                fontSize: '13px',
                fontWeight: activeTab === 'telemetry' ? 500 : 400,
                color: activeTab === 'telemetry' ? '#ffffff' : '#888888',
                cursor: 'pointer',
                position: 'relative',
                paddingBottom: '6px',
                transition: 'color 0.2s ease',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => {
                if (activeTab !== 'telemetry') e.currentTarget.style.color = '#888888';
              }}
            >
              Telemetry
              {activeTab === 'telemetry' && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#ffffff', borderRadius: '2px' }} />
              )}
            </div>

            {/* Tab: Settings / Speed */}
            <div
              onClick={() => {
                setActiveTab('settings');
                setIsSpeedMenuOpen(!isSpeedMenuOpen);
                try { soundFX.playClick(); } catch (e) {}
              }}
              style={{
                fontSize: '13px',
                fontWeight: activeTab === 'settings' ? 500 : 400,
                color: activeTab === 'settings' ? '#ffffff' : '#888888',
                cursor: 'pointer',
                position: 'relative',
                paddingBottom: '6px',
                transition: 'color 0.2s ease',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => {
                if (activeTab !== 'settings') e.currentTarget.style.color = '#888888';
              }}
            >
              Settings
              {activeTab === 'settings' && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#ffffff', borderRadius: '2px' }} />
              )}
            </div>
          </div>
        </div>

        {/* Right: Date Capsule + Elapsed Time + Circular Play Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          {/* Speed Selector Menu Popup */}
          {isSpeedMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '-110px',
                right: '48px',
                background: 'rgba(15, 18, 24, 0.96)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '6px',
                display: 'flex',
                gap: '6px',
                zIndex: 60,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)'
              }}
            >
              {[
                { label: '1× Real', val: 1 },
                { label: '60× Min', val: 60 },
                { label: '1h/s', val: 3600 },
                { label: '1d/s', val: 86400 }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => {
                    if (setSimSpeed) setSimSpeed(opt.val);
                    setIsSpeedMenuOpen(false);
                    try { soundFX.playClick(); } catch (e) {}
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: simSpeed === opt.val ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid transparent',
                    background: simSpeed === opt.val ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Date Selector Pill */}
          <div
            onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              cursor: 'pointer',
              fontSize: '12.5px',
              color: '#f3f4f6',
              letterSpacing: '0.02em',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.26)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
            }}
          >
            {/* Calendar Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formattedDate}</span>
            {/* Small Down Chevron */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.65 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Mission Elapsed Time Pill */}
          <div
            style={{
              fontSize: '12px',
              color: '#9ca3af',
              letterSpacing: '0.04em',
              fontWeight: 400
            }}
          >
            {metFormatted}
          </div>

          {/* Circular Play / Pause Button */}
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              try { soundFX.playClick(); } catch (e) {}
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
              e.currentTarget.style.boxShadow = '0 0 14px rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
            }}
            title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
          >
            {isPlaying ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Down Chevron / Collapse Timeline Toggle Button */}
          <button
            id="timeline-collapse-toggle"
            aria-label="Toggle Timeline Collapse"
            onClick={() => {
              console.log('>>> TOGGLING TIMELINE COLLAPSE:', !isTimelineCollapsed);
              setIsTimelineCollapsed(!isTimelineCollapsed);
              try { soundFX.playClick(); } catch (e) {}
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isTimelineCollapsed ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.08)',
              border: isTimelineCollapsed ? '1px solid rgba(255, 255, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.22)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.20)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.50)';
              e.currentTarget.style.boxShadow = '0 0 14px rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isTimelineCollapsed ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = isTimelineCollapsed ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.22)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
            }}
            title={isTimelineCollapsed ? 'Expand Full 3-Track Timeline' : 'Collapse into Streamlined Single-Line Timeline'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isTimelineCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease'
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── TELEMETRY TAB: SHADOW & THERMAL IMPACT REPORT DASHBOARD ─── */}
      {activeTab === 'telemetry' && (
        <div style={{
          marginTop: '12px',
          marginBottom: '14px',
          padding: '16px 20px',
          background: 'rgba(12, 16, 24, 0.92)',
          border: '1px solid rgba(239, 68, 68, 0.32)',
          borderRadius: '14px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif"
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', color: '#f87171' }}>
                SHADOW & THERMAL IMPACT REPORT
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                Permanently Shadowed Region (PSR) Micro-Cold Trap Analysis
              </span>
            </div>
            <button
              onClick={() => setActiveTab('mission')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                color: '#cbd5e1',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              ✕ Minimize
            </button>
          </div>

          {/* 4 Minimal Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '10px 14px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Time in Shadow</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f87171', marginTop: '2px' }}>
                {telemetry?.sun?.isVisible ? '0.0 h' : '48.2 h'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Cumulative PSR duration</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '10px 14px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Cryogenic Plunge</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#38bdf8', marginTop: '2px' }}>
                -221°C <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>(52 K)</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Avionics internal at 268 K</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '10px 14px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Battery Survival Draw</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fbbf24', marginTop: '2px' }}>
                -45 W <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>(vs +480W sun)</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Electrical heater active</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '10px 14px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Illumination Duty Cycle</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#34d399', marginTop: '2px' }}>
                88.4%
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Connecting ridge corridors</div>
            </div>
          </div>

          {/* Minimal Clean SVG Shadow Timeline Graph */}
          <div style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '11px', color: '#94a3b8' }}>
              <span>29.5-Day Synodic Shadow Ingress & Thermal Plunge Curve</span>
              <div style={{ display: 'flex', gap: '14px' }}>
                <span style={{ color: '#22c55e' }}>● Direct Sunlight (%)</span>
                <span style={{ color: '#ef4444' }}>■ Cold Trap Shadow Window</span>
                <span style={{ color: '#38bdf8' }}>● Temperature (K)</span>
              </div>
            </div>

            <svg viewBox="0 0 900 110" style={{ width: '100%', height: '100px', overflow: 'visible' }}>
              <line x1="20" y1="90" x2="880" y2="90" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />

              {/* Shadow intervals (Crimson bars) */}
              <rect x="240" y="20" width="120" height="70" fill="rgba(239, 68, 68, 0.18)" rx="4" />
              <rect x="620" y="20" width="140" height="70" fill="rgba(239, 68, 68, 0.18)" rx="4" />
              <text x="300" y="55" fill="#f87171" fontSize="10" textAnchor="middle" fontFamily="'Google Sans', sans-serif">PSR Cold Trap (52 K)</text>
              <text x="690" y="55" fill="#f87171" fontSize="10" textAnchor="middle" fontFamily="'Google Sans', sans-serif">Night Occultation (48h)</text>

              {/* Illumination curve */}
              <path
                d="M 20 25 C 100 25, 180 30, 240 88 L 360 88 C 420 30, 560 25, 620 88 L 760 88 C 800 40, 840 25, 880 25"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
              />

              {/* Temperature curve */}
              <path
                d="M 20 38 C 110 38, 190 42, 240 82 L 360 82 C 430 42, 550 38, 620 82 L 760 82 C 810 50, 850 38, 880 38"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeDasharray="3 3"
              />

              {/* Current Progress Cursor */}
              <line
                x1={20 + progressRatio * 860}
                y1="10"
                x2={20 + progressRatio * 860}
                y2="95"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <circle
                cx={20 + progressRatio * 860}
                cy="10"
                r="3"
                fill="#ffffff"
                style={{ filter: 'drop-shadow(0 0 6px #ffffff)' }}
              />
            </svg>
          </div>
        </div>
      )}

      {/* ─── 2. MAIN TIMELINE & 3 STATUS TRACKS WITH VERTICAL LASER PLAYHEAD ─── */}
      {isTimelineCollapsed ? (
        /* ─── COLLAPSED STREAMLINED SINGLE-LINE TIMELINE WITH FADED ENDS ─── */
        <div
          ref={timelineBarRef}
          onPointerDown={handlePointerDown}
          style={{
            position: 'relative',
            padding: '18px 24px 16px',
            cursor: 'ew-resize',
            userSelect: 'none'
          }}
        >
          {/* Top Year Indicators (2026 to 2030) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              padding: '0 8px',
              fontSize: '11px',
              color: '#94a3b8',
              fontFamily: "'Google Sans', sans-serif"
            }}
          >
            {[2026, 2027, 2028, 2029, 2030].map((yr) => {
              const isCurrent = currentYear === yr;
              return (
                <div key={yr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetMs = new Date(`${yr}-01-01T00:00:00Z`).getTime();
                      setCurrentSimDate(new Date(targetMs));
                      try { soundFX.playClick(); } catch (err) {}
                    }}
                    style={{
                      fontSize: '11px',
                      fontWeight: isCurrent ? 700 : 400,
                      color: isCurrent ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {yr}
                  </span>
                  <div
                    style={{
                      width: '1px',
                      height: '5px',
                      background: isCurrent ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                      marginTop: '3px'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Sleek Faded Single Line Container with Strong Sunlight & Earth Presence Markers */}
          <div style={{ position: 'relative', height: '28px', display: 'flex', alignItems: 'center' }}>
            {/* The Base Track Line with Faded Gradient Ends */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '1.5px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 4%, rgba(255,255,255,0.45) 20%, rgba(255,255,255,0.45) 80%, rgba(255,255,255,0.18) 96%, transparent 100%)',
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.25)'
              }}
            />

            {/* ─── Luminous Strong Sunlight Solstice Peak Zones (Gold/Amber) ─── */}
            {[
              { start: 17.5, end: 23.2, label: '2026-27 Peak Sun' },
              { start: 37.5, end: 43.2, label: '2027-28 Peak Sun' },
              { start: 57.5, end: 63.3, label: '2028-29 Peak Sun' },
              { start: 77.5, end: 83.2, label: '2029-30 Peak Sun' }
            ].map((zone, idx) => (
              <div
                key={`sun-zone-${idx}`}
                title={`Strong Sunlight Window (+480W): ${zone.label}`}
                style={{
                  position: 'absolute',
                  left: `${zone.start}%`,
                  width: `${zone.end - zone.start}%`,
                  height: '3.5px',
                  borderRadius: '2px',
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.5), rgba(251, 191, 36, 0.95), rgba(245, 158, 11, 0.5))',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.8), 0 0 4px #fbbf24',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />
            ))}

            {/* ─── Luminous Earth Presence / DTE High-Libration Zones (Cyan) ─── */}
            {[
              { start: 16.0, end: 25.0, label: 'Artemis III / Griffin DTE Window' },
              { start: 35.5, end: 44.5, label: '2027 Favorable Libration' },
              { start: 55.5, end: 65.0, label: '2028-29 Favorable Libration' },
              { start: 75.5, end: 85.0, label: '2029-30 Favorable Libration' }
            ].map((zone, idx) => (
              <div
                key={`earth-zone-${idx}`}
                title={`Earth Presence / DTE S-Band Locked: ${zone.label}`}
                style={{
                  position: 'absolute',
                  left: `${zone.start}%`,
                  width: `${zone.end - zone.start}%`,
                  height: '2px',
                  top: '16px',
                  borderRadius: '2px',
                  background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.4), rgba(56, 189, 248, 0.9), rgba(56, 189, 248, 0.4))',
                  boxShadow: '0 0 8px rgba(56, 189, 248, 0.7)',
                  zIndex: 3,
                  pointerEvents: 'none'
                }}
              />
            ))}

            {/* Glowing Interactive Dot Showcasing Earth & Sun Movement */}
            <div
              style={{
                position: 'absolute',
                left: `${progressRatio * 100}%`,
                transform: 'translate(-50%, -50%)',
                top: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
                zIndex: 20
              }}
            >
              {/* Floating Earth & Sun Movement Status Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '22px',
                  whiteSpace: 'nowrap',
                  background: 'rgba(8, 11, 18, 0.96)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  fontSize: '10.5px',
                  color: '#e2e8f0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.85), 0 0 12px rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  letterSpacing: '0.02em',
                  fontFamily: "'Google Sans', sans-serif"
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} />
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {telemetry?.sun?.elevation !== undefined ? `Sun: +${telemetry.sun.elevation}°` : `Sun: +${(Math.sin(progressRatio * Math.PI * 12) * 1.8).toFixed(1)}°`}
                  </span>
                  <span style={{ fontSize: '9px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                    STRONG SUNLIGHT
                  </span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {telemetry?.earth?.elevation !== undefined ? `Earth: +${telemetry.earth.elevation}°` : 'Earth: +6.2°'}
                  </span>
                  <span style={{ fontSize: '9px', color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                    DTE LOCKED
                  </span>
                </div>
              </div>

              {/* Glowing Dot Handle */}
              <div
                style={{
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 10px #ffffff, 0 0 22px rgba(255, 255, 255, 0.95), 0 0 32px rgba(56, 189, 248, 0.8)',
                  border: '2px solid rgba(56, 189, 248, 0.9)',
                  cursor: 'grab',
                  pointerEvents: 'auto'
                }}
              />
            </div>
          </div>

          {/* Interactive Timeline Legend & Fast Solstice / DTE Jump Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '6px',
            fontSize: '9.5px',
            color: '#94a3b8',
            fontFamily: "'Google Sans', sans-serif",
            letterSpacing: '0.03em'
          }}>
            {/* Clickable Peak Sunlight Jump Pill */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSimDate(new Date('2026-12-01T06:00:00Z'));
                try { soundFX.playClick(); } catch (err) {}
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                padding: '3px 9px',
                borderRadius: '6px',
                color: '#fbbf24',
                cursor: 'pointer',
                fontFamily: "'Google Sans', sans-serif",
                fontSize: '9.5px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.22)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)')}
              title="Click to jump to peak solar window: +2.4° solar grazing, +480W generation"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
              <span><strong>Peak Sunlight Window</strong> (Nov 2026 – Feb 2027 Solstice • +480W)</span>
            </button>

            {/* Clickable Continuous Earth DTE Jump Pill */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSimDate(new Date('2026-11-26T12:00:00Z'));
                try { soundFX.playClick(); } catch (err) {}
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '3px 9px',
                borderRadius: '6px',
                color: '#38bdf8',
                cursor: 'pointer',
                fontFamily: "'Google Sans', sans-serif",
                fontSize: '9.5px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)')}
              title="Click to jump to continuous line-of-sight: +8.2° Earth elevation, +14dB margin"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
              <span><strong>Earth DTE Lock</strong> (+8.2° Elevation • 100 Mbps Locked)</span>
            </button>
          </div>
        </div>
      ) : (
        /* ─── FULL 3-TRACK EXPANDED TIMELINE ─── */
        <div style={{ position: 'relative', padding: '16px 0 12px' }}>
        {/* Navigation Step Arrows & Full 2026 - 2030 Timeline Ruler */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            fontSize: '12px',
            color: '#9ca3af'
          }}
        >
          {/* Step Back Arrow < */}
          <button
            onClick={() => handleStepDays(-30)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
            title="Step Back 30 Days"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* 160px Label Alignment Spacer */}
          <div style={{ width: '150px', flexShrink: 0, paddingLeft: '4px', fontSize: '11px', color: '#64748b', letterSpacing: '0.04em' }}>
            <span>MISSION PHASE</span>
          </div>

          {/* Full 2026 to 2030 Ruler Span */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '12px' }}>
            {[2026, 2027, 2028, 2029, 2030].map((yr) => {
              const isCurrent = currentYear === yr;
              return (
                <div key={yr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <span
                    onClick={() => {
                      const targetMs = new Date(`${yr}-01-01T00:00:00Z`).getTime();
                      setCurrentSimDate(new Date(targetMs));
                      try { soundFX.playClick(); } catch (err) {}
                    }}
                    style={{
                      fontSize: '12px',
                      fontWeight: isCurrent ? 600 : 400,
                      letterSpacing: '0.05em',
                      color: isCurrent ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.color = '#94a3b8';
                    }}
                    title={`Jump to ${yr}`}
                  >
                    {yr}
                  </span>
                  <div
                    style={{
                      width: '1px',
                      height: '6px',
                      background: isCurrent ? '#ffffff' : 'rgba(255, 255, 255, 0.28)',
                      marginTop: '3px'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Step Forward Arrow > */}
          <button
            onClick={() => handleStepDays(30)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
            title="Step Forward 30 Days"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* ─── 3. THE THREE HORIZONTAL DATA TRACKS CONTAINER ─── */}
        <div
          ref={timelineBarRef}
          onPointerDown={handlePointerDown}
          style={{
            position: 'relative',
            width: '100%',
            cursor: 'ew-resize',
            padding: '4px 0'
          }}
        >
          {/* TRACK 1: Sun & Earth Link (Green) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '32px',
              position: 'relative'
            }}
          >
            {/* Track Label on Left */}
            <div
              style={{
                width: '160px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontSize: '12px',
                color: '#d1d5db',
                letterSpacing: '0.02em',
                zIndex: 2
              }}
            >
              <div
                style={{
                  width: '6.5px',
                  height: '6.5px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)'
                }}
              />
              <span>Sun & Earth Link</span>
            </div>

            {/* Horizontal Line across timeline */}
            <div style={{ flex: 1, position: 'relative', height: '1.5px', background: 'rgba(34, 197, 94, 0.65)' }}>
              {/* Soft glow strip */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.4), rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 0.4))',
                  filter: 'blur(1px)'
                }}
              />
            </div>
          </div>

          {/* TRACK 2: Sunlight Only (Amber / Orange) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '32px',
              position: 'relative'
            }}
          >
            {/* Track Label on Left */}
            <div
              style={{
                width: '160px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontSize: '12px',
                color: '#d1d5db',
                letterSpacing: '0.02em',
                zIndex: 2
              }}
            >
              <div
                style={{
                  width: '6.5px',
                  height: '6.5px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  boxShadow: '0 0 6px rgba(245, 158, 11, 0.8)'
                }}
              />
              <span>Sunlight Only</span>
            </div>

            {/* Horizontal Line across timeline */}
            <div style={{ flex: 1, position: 'relative', height: '1.5px', background: 'rgba(245, 158, 11, 0.65)' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.35), rgba(245, 158, 11, 0.75), rgba(245, 158, 11, 0.35))',
                  filter: 'blur(1px)'
                }}
              />
            </div>
          </div>

          {/* TRACK 3: Shadow / Cold Trap (Red / Crimson) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '32px',
              position: 'relative'
            }}
          >
            {/* Track Label on Left */}
            <div
              style={{
                width: '160px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                fontSize: '12px',
                color: '#d1d5db',
                letterSpacing: '0.02em',
                zIndex: 2
              }}
            >
              <div
                style={{
                  width: '6.5px',
                  height: '6.5px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)'
                }}
              />
              <span>Shadow / Cold Trap</span>
            </div>

            {/* Horizontal Line across timeline */}
            <div style={{ flex: 1, position: 'relative', height: '1.5px', background: 'rgba(239, 68, 68, 0.65)' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.35), rgba(239, 68, 68, 0.75), rgba(239, 68, 68, 0.35))',
                  filter: 'blur(1px)'
                }}
              />
            </div>
          </div>

          {/* ─── GLOWING VERTICAL LASER PLAYHEAD WITH INTERACTIVE SCRUB BEAD ─── */}
          {/* Positioned dynamically along the width (accounting for the 160px label offset) */}
          <div
            style={{
              position: 'absolute',
              top: '-18px',
              bottom: '0px',
              left: `calc(160px + (100% - 160px) * ${progressRatio})`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 15,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: isDragging ? 'none' : 'left 0.08s ease-out'
            }}
          >
            {/* Glowing White Interactive Bead / Slider Handle */}
            <div
              onPointerDown={handlePointerDown}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 0 12px #ffffff, 0 0 24px rgba(255, 255, 255, 0.9), 0 0 36px rgba(255, 255, 255, 0.5)',
                marginBottom: '2px',
                flexShrink: 0,
                cursor: 'grab',
                pointerEvents: 'auto'
              }}
            />

            {/* Vertical White Laser Beam Line */}
            <div
              style={{
                width: '1.5px',
                flex: 1,
                background: 'linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 0.2) 100%)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.65)'
              }}
            />
          </div>
        </div>
      </div>
    )}

      {/* ─── 4. BOTTOM BAR: LUNAR MISSION TIMELINE & NASA • ARTEMIS ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '11px',
          color: '#6b7280',
          letterSpacing: '0.04em'
        }}
      >
        {/* Left: Signal Bars / Histogram Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.65 }}>
            <rect x="2" y="14" width="3" height="7" rx="1" />
            <rect x="8" y="10" width="3" height="11" rx="1" />
            <rect x="14" y="6" width="3" height="15" rx="1" />
            <rect x="20" y="2" width="3" height="19" rx="1" />
          </svg>
          <span>Lunar Mission Timeline</span>
        </div>

        {/* Right: Moon Phase Icon + NASA • Artemis */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" opacity="0.6" />
          </svg>
          <span style={{ fontWeight: 400 }}>NASA • Artemis</span>
        </div>
      </div>

      {/* ─── 5. SUBTLE CURVED LUNAR HORIZON SILHOUETTE LIMB (Bottom Arc) ─── */}
      <div
        style={{
          position: 'absolute',
          bottom: '-120px',
          left: '-10%',
          right: '-10%',
          height: '140px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at top, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 40%, transparent 70%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 -4px 24px rgba(255, 255, 255, 0.04)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
