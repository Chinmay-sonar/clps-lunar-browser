import React, { useState, useEffect } from 'react';
import { soundFX } from '../utils/soundFX';
import { generateMissionBriefPdf } from '../utils/exportMissionBrief';

/**
 * High-Editorial PPT-Style Mission Presentation Deck Modal
 * Matches the Google Sans, Dark Space Black, and Champagne Gold presentation deck format.
 * Generates an exhaustive, multi-slide 16:9 widescreen dossier documenting:
 * - Distance traveled & odometry analytics
 * - Continuous Earth link & DTE telemetry
 * - Subsurface mineral & volatile discoveries (Water ice, Ilmenite, Helium-3)
 * - Overall vehicle performance & thermal health
 * - Artemis Base Camp strategic clearance
 */
export default function MissionReportPptModal({
  isOpen,
  onClose,
  selectedSite,
  telemetry,
  activeMission,
  activeVehicle = 'viper',
  timelineForecast
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 6;

  // Real-time recorded odometry from rover locomotion (defaults to realistic traverse baseline if user hasn't driven far)
  const recordedOdometryMeters = typeof window !== 'undefined' && window.__LUNAR_ROVER_ODOMETRY__
    ? Math.max(1482, Math.round(window.__LUNAR_ROVER_ODOMETRY__ * 12.5))
    : 1482;
  const distanceKm = (recordedOdometryMeters / 1000).toFixed(2);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextSlide();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide]);

  if (!isOpen) return null;

  const nextSlide = () => {
    soundFX.playClick();
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    soundFX.playClick();
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleDownloadPdf = () => {
    soundFX.playSuccessChime();
    generateMissionBriefPdf(selectedSite, telemetry, activeMission, timelineForecast, recordedOdometryMeters);
  };

  const siteName = selectedSite?.name || 'Mons Mouton Plateau';
  const siteLat = selectedSite?.lat ? Math.abs(selectedSite.lat).toFixed(2) : '84.90';
  const siteLon = selectedSite?.lon ? (selectedSite.lon >= 0 ? `${selectedSite.lon.toFixed(2)}° E` : `${Math.abs(selectedSite.lon).toFixed(2)}° W`) : '32.50° E';
  const siteElev = selectedSite?.elevationMeters || 1850;
  const vehicleName = activeVehicle === 'viper' ? 'NASA VIPER Planetary Rover' : (activeVehicle === 'griffin' ? 'Astrobotic Griffin Lander & Rover' : 'Intuitive Machines Nova-C Lander');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        background: 'rgba(2, 4, 8, 0.94)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: "'Google Sans', sans-serif",
        color: '#ffffff'
      }}
    >
      {/* ─── 16:9 Widescreen Presentation Slide Canvas ─── */}
      <div
        style={{
          width: 'min(94vw, 1320px)',
          aspectRatio: '16 / 9',
          maxHeight: '84vh',
          background: 'linear-gradient(180deg, #050811 0%, #010205 100%)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '24px',
          boxShadow: '0 40px 120px rgba(0, 0, 0, 0.95), 0 0 80px rgba(56, 189, 248, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Fluid Wave Gradient Background Accent */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.12), transparent 70%), radial-gradient(ellipse 60% 40% at 85% 90%, rgba(202, 175, 137, 0.08), transparent 60%)',
            pointerEvents: 'none'
          }}
        />

        {/* ─── SLIDE HEADER BAR ─── */}
        <div
          style={{
            padding: '20px 36px 12px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Codyseey
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '14px' }}>|</span>
            <span style={{ fontSize: '12px', color: '#CAAF89', letterSpacing: '0.04em', fontWeight: 600 }}>
              NASA SPACE APPS CHALLENGE 2026
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                letterSpacing: '0.04em'
              }}
            >
              MISSION DOSSIER • SLIDE {currentSlide + 1} OF {totalSlides}
            </span>

            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px'
              }}
              title="Close Presentation (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ─── SLIDE BODY CONTENT (SWITCHED BY CURRENT SLIDE) ─── */}
        <div style={{ flex: 1, padding: '28px 42px', position: 'relative', zIndex: 2, overflowY: 'auto' }}>
          {/* ══════════════════════════════════════════════════════════════
              SLIDE 1: EXECUTIVE EXPEDITION DOSSIER & FLIGHT CLEARANCE
          ══════════════════════════════════════════════════════════════ */}
          {currentSlide === 0 && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#CAAF89', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  <span>EXECUTIVE MISSION MANIFEST</span>
                  <div style={{ width: '32px', height: '1px', background: '#CAAF89' }} />
                </div>
                <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  LUNAR SOUTH POLE EXPEDITION REPORT
                </h1>
                <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#94a3b8', maxWidth: '780px', lineHeight: 1.5 }}>
                  Autonomous Surface Traverse Telemetry, In-Situ Volatile Extraction, and Continuous Earth Direct-to-Earth (DTE) Link Budget Analysis.
                </p>
              </div>

              {/* 4 Feature Key Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '20px 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>EXPEDITION TARGET</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>{siteName}</div>
                  <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '4px' }}>{siteLat}° S, {siteLon}</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>EXPEDITION VEHICLE</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>{vehicleName.split(' ')[1] || 'VIPER'}</div>
                  <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px' }}>Flight Clearance Approved</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>TOPOGRAPHIC DATUM</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>+{siteElev} Meters</div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '4px' }}>LRO LOLA 10m DEM Reference</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>TRAVERSE DISTANCE</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#CAAF89', marginTop: '6px' }}>{distanceKm} km</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{recordedOdometryMeters.toLocaleString()} Meters Odometry</div>
                </div>
              </div>

              {/* Mission Protocol Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  NASA Science Mission Directorate (SMD) • Lunar Discovery and Exploration Program (LDEP) • Artemis Program Compliant
                </span>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                  CONFIRMED SOFT LANDING // 2026-12-16
                </span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SLIDE 2: COMPLETE TRAVERSE & ODOMETRY ANALYTICS
          ══════════════════════════════════════════════════════════════ */}
          {currentSlide === 1 && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#CAAF89', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  <span>TRAVERSE PERFORMANCE & LOCOMOTION</span>
                  <div style={{ width: '32px', height: '1px', background: '#CAAF89' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  SURFACE TRAVERSE & ODOMETRY PERFORMANCE
                </h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
                  Step-by-step surface navigation metrics across lunar regolith, obstacle clearance, and suspension articulation.
                </p>
              </div>

              {/* Odometry Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', margin: '14px 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Traveled Distance</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>{distanceKm} km</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{recordedOdometryMeters}m Odometry</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Peak & Mean Speed</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>0.20 m/s</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>0.72 km/h Nominal Drive</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Max Slope Navigated</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>14.2° Grade</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>24° Mechanical Slip Limit</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Suspension Articulation</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#CAAF89', marginTop: '4px' }}>±0.22 m</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>6-Wheel Rocker-Bogie Active</div>
                </div>
              </div>

              {/* Waypoint Traverse Log Table */}
              <div style={{ background: 'rgba(6, 9, 16, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 18px', background: 'rgba(255, 255, 255, 0.04)', display: 'grid', gridTemplateColumns: '80px 140px 180px 1fr 100px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
                  <span>TIME</span>
                  <span>WAYPOINT</span>
                  <span>COORDINATES</span>
                  <span>GEOLOGICAL OBSERVATION</span>
                  <span>STATUS</span>
                </div>
                {[
                  { t: 'T+00:00', wp: 'Lander Egress Ramp', c: `${siteLat}°S, ${siteLon}`, obs: 'Astrobotic Griffin touchdown. Egress down forward ramp onto lunar soil.', s: 'COMPLETED' },
                  { t: 'T+02:15', wp: 'Sun Ridge Alpha', c: `${siteLat}°S, ${siteLon}`, obs: 'Low-grazing polar sunlight harvested (+480W vertical solar array).', s: 'OPTIMAL' },
                  { t: 'T+04:40', wp: 'Boulder Field North', c: `${siteLat}°S, ${siteLon}`, obs: 'Autonomous hazard avoidance diverted around 1.3m ejecta boulder.', s: 'CLEARED' },
                  { t: 'T+06:50', wp: 'Cold-Trap Crest', c: `${siteLat}°S, ${siteLon}`, obs: 'TRIDENT 1m drill deployment. Subsurface ice core extracted at 38K.', s: 'DISCOVERY' }
                ].map((row, idx) => (
                  <div key={idx} style={{ padding: '8px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'grid', gridTemplateColumns: '80px 140px 180px 1fr 100px', fontSize: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{row.t}</span>
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>{row.wp}</span>
                    <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>{row.c}</span>
                    <span style={{ color: '#cbd5e1' }}>{row.obs}</span>
                    <span style={{ color: '#34d399', fontWeight: 700, fontSize: '11px' }}>● {row.s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SLIDE 3: CONTINUOUS EARTH & DTE COMMUNICATIONS LINK BUDGET
          ══════════════════════════════════════════════════════════════ */}
          {currentSlide === 2 && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#CAAF89', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  <span>TELECOMMUNICATIONS & RF LINK</span>
                  <div style={{ width: '32px', height: '1px', background: '#CAAF89' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  CONTINUOUS EARTH DIRECT-TO-EARTH (DTE) LINK BUDGET
                </h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
                  Uninterrupted radio line-of-sight tracking to NASA Deep Space Network (DSN) ground stations with libration modeling.
                </p>
              </div>

              {/* Comm Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', margin: '14px 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Earth LOS Uptime</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>98.4%</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Continuous Signal Lock</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>RF Modulation</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>S-Band / X-Band</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>100 Mbps Telemetry Rate</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Link Margin</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>+{telemetry?.earth?.linkMarginDb || '14.2'} dB</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>+3.0 dB NASA Min Spec</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>One-Way Light Time</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#CAAF89', marginTop: '4px' }}>1.28 s</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>384,400 km Distance</div>
                </div>
              </div>

              {/* DSN Stations Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ background: 'rgba(10, 14, 24, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>Goldstone Complex (DSS-14)</span>
                    <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 700 }}>ACTIVE LOCK</span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    California Mojave Desert • 70-Meter Parabolic High-Gain Dish • SNR 42.1 dB
                  </p>
                </div>

                <div style={{ background: 'rgba(10, 14, 24, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>Madrid Complex (DSS-63)</span>
                    <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>STANDBY RELAY</span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Robledo de Chavela, Spain • 70-Meter Parabolic Dish • Handover ready
                  </p>
                </div>

                <div style={{ background: 'rgba(10, 14, 24, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>Canberra Complex (DSS-43)</span>
                    <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>SCHEDULED</span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Tidbinbilla, Australia • 70-Meter Southern Hemisphere Coverage
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SLIDE 4: SUBSURFACE MINERALOGICAL & VOLATILE FINDINGS
          ══════════════════════════════════════════════════════════════ */}
          {currentSlide === 3 && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#CAAF89', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  <span>IN-SITU RESOURCE UTILIZATION (ISRU)</span>
                  <div style={{ width: '32px', height: '1px', background: '#CAAF89' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  SUBSURFACE VOLATILES & MINERALOGICAL DISCOVERY
                </h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
                  TRIDENT 1-meter rotary percussive drill core stratigraphy, NIRVSS infrared reflectance, and volatile concentration.
                </p>
              </div>

              {/* 4 Mineral Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', margin: '14px 0' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>WATER ICE (H2O)</span>
                    <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>CONFIRMED</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>5.8 wt%</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>58,000 ppm Cryogenic Permafrost</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700 }}>ILMENITE (FeTiO3)</span>
                    <span style={{ fontSize: '10px', color: '#38bdf8' }}>O2 ORE</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>8.4 wt%</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Hydrogen Reduction Feedstock</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700 }}>PLAGIOCLASE FELDSPAR</span>
                    <span style={{ fontSize: '10px', color: '#cbd5e1' }}>ANORTHOSITE</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>64.2 wt%</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Sintered Construction Matrix</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#CAAF89', fontWeight: 700 }}>HELIUM-3 (3He)</span>
                    <span style={{ fontSize: '10px', color: '#CAAF89' }}>FUSION</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>14.2 ppb</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Solar Wind Trapped Particles</div>
                </div>
              </div>

              {/* TRIDENT 1m Drill Core Visual Strata Bar */}
              <div style={{ background: 'rgba(6, 9, 16, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
                  TRIDENT 1-METER DRILL CORE STRATIGRAPHY (40 KELVIN COLD TRAP)
                </span>
                <div style={{ display: 'flex', height: '36px', borderRadius: '8px', overflow: 'hidden', marginTop: '10px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                  <div style={{ width: '15%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>
                    0-10cm Dry Regolith (120K)
                  </div>
                  <div style={{ width: '35%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                    10-45cm Hydroxyl Transition Zone (85K)
                  </div>
                  <div style={{ width: '50%', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000000' }}>
                    45-100cm Cryogenic Ice Matrix [5.8 wt% H2O] (38K)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SLIDE 5: OVERALL VEHICLE & POWER SYSTEM PERFORMANCE
          ══════════════════════════════════════════════════════════════ */}
          {currentSlide === 4 && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#CAAF89', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  <span>AVIONICS & SUBSYSTEM HEALTH</span>
                  <div style={{ width: '32px', height: '1px', background: '#CAAF89' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  OVERALL VEHICLE & POWER SYSTEM PERFORMANCE
                </h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
                  Bifacial vertical solar harvest, cryogenic thermal survival, and active rocker-bogie wheel drive telemetry.
                </p>
              </div>

              {/* Power and Vehicle Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', margin: '14px 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Solar Harvest (Direct Sun)</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>480 Watts</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Vertical Triple-Junction PV</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Battery Energy Reserve</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>92% DoD</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>1.2 kWh Li-Ion Storage</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Avionics Core Temp</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>+18°C Stable</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Exterior Ambient -235°C (38K)</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Actuator Health Status</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>100% OK</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>6 Motors • 0 Stalls</div>
                </div>
              </div>

              {/* Thermal Management Architecture Card */}
              <div style={{ background: 'rgba(6, 9, 16, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
                  THERMAL ARCHITECTURE IN PERMANENT SHADOW (PSR COLD SURVIVAL)
                </span>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                  During 7-hour operations in cryogenic permanent shadow (-235°C), loop heat pipes and variable conductance insulation maintained all mission avionics, star trackers, and scientific spectrometers within safe operational bands (+10°C to +25°C) without single point thermal failure.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SLIDE 6: ARTEMIS STRATEGIC EVALUATION & CLEARANCE STAMP
          ══════════════════════════════════════════════════════════════ */}
          {currentSlide === 5 && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#CAAF89', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  <span>STRATEGIC FLIGHT VALIDATION</span>
                  <div style={{ width: '32px', height: '1px', background: '#CAAF89' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  ARTEMIS BASE CAMP STRATEGIC VALUE & VERIFICATION
                </h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
                  Formal assessment of target site for sustained human lunar infrastructure and permanent crewed outposts.
                </p>
              </div>

              {/* Strategic Scorecards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '14px 0' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Base Camp Suitability</span>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>98.6%</div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Optimal combination of annual sunlight (86.4%), direct line-of-sight to Earth, and proximity to cold-trap volatiles.
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>ISRU Economic Viability</span>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>GRADE A+</div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    High water ice concentrations (5.8 wt%) and accessible titanium ilmenite reduce Earth supply launch mass requirements by 74%.
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Landing Safety Index</span>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#CAAF89', marginTop: '4px' }}>99.2%</div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    Flat ridge plateau topography with slope &lt; 5° and minimal boulder hazards within the designated 500m landing ellipse.
                  </p>
                </div>
              </div>

              {/* Cryptographic Compliance Signatures Stamp */}
              <div style={{ background: 'rgba(6, 9, 16, 0.9)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                    AUTHENTICATION: CODYSEEY-NASA-SPACE-APPS-2026-CHALLENGE-04
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Ephemeris verified against LRO LOLA GDR & JPL NAIF SPICE DE441 Ephemeris Data.
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>APPROVED FOR SIMULATION REVIEW</div>
                  <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 600 }}>FLIGHT CLEARANCE VERIFIED</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── SLIDE FOOTER CONTROLS ─── */}
        <div
          style={{
            padding: '16px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'linear-gradient(180deg, rgba(8, 11, 20, 0.8) 0%, rgba(4, 6, 12, 0.95) 100%)',
            position: 'relative',
            zIndex: 2
          }}
        >
          {/* Slide Indicator Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  soundFX.playClick();
                  setCurrentSlide(idx);
                }}
                style={{
                  width: currentSlide === idx ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: currentSlide === idx ? '#CAAF89' : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
                title={`Go to Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation & Download Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={prevSlide}
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontFamily: "'Google Sans', sans-serif",
                transition: 'all 0.15s ease'
              }}
            >
              ← Previous Slide
            </button>

            <button
              onClick={nextSlide}
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontFamily: "'Google Sans', sans-serif",
                transition: 'all 0.15s ease'
              }}
            >
              Next Slide →
            </button>

            {/* Direct High-Definition 16:9 PDF Deck Download Button */}
            <button
              onClick={handleDownloadPdf}
              style={{
                padding: '9px 24px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '999px',
                background: 'rgb(253, 253, 253)',
                color: 'rgb(0, 0, 0)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Google Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(255, 255, 255, 0.2)'
              }}
            >
              <span>Download 16:9 Presentation PDF</span>
              <span>📥</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
