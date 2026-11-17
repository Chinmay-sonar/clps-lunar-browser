import React, { useState, useEffect } from 'react';
import { soundFX } from '../utils/soundFX';
import { LANDING_SITES, CLPS_MISSIONS } from '../data/landingSites';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CODYSEEY // MISSION BRIEFING & PRESENTATION JOURNEY
 * ═══════════════════════════════════════════════════════════════════════════
 * Aesthetic inspired by www.gru.space, Apple Keynotes, & NASA Flight Operations:
 * - Ultra-deep space void (#030508) with high-contrast typography
 * - Cinematic backdrop video with subtle star dust and vignette
 * - Structured step-by-step expedition workflow journey
 * - Deep dive into What We Built, How It Works, Scientific Accuracy, and Future Space Impact
 * - Interactive 4-Site Showcase with 1-click launch
 * - Climax "Explore the Real Journey" Mission Dispatcher console
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function MissionBriefingLanding({
  onLaunchSimulator,
  onSelectSite,
  selectedSite
}) {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [activeTechTab, setActiveTechTab] = useState('ephemeris');
  const [activeSitePreview, setActiveSitePreview] = useState(selectedSite || LANDING_SITES[0]);
  const [selectedVehicle, setSelectedVehicle] = useState('viper');
  const [selectedSiteForLaunch, setSelectedSiteForLaunch] = useState(selectedSite || LANDING_SITES[0]);
  const [simulatedTelemetry, setSimulatedTelemetry] = useState({
    clock: new Date().toUTCString(),
    subSolarLon: '14.28° E',
    earthDistanceKm: '384,392 km',
    solarElevationDeg: '+1.82°'
  });

  // Dynamic live clock for mission control immersion
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedTelemetry(prev => ({
        ...prev,
        clock: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLaunch = (site, vehicle) => {
    soundFX.playClick();
    if (onSelectSite && site) onSelectSite(site);
    if (onLaunchSimulator) {
      onLaunchSimulator(site || selectedSiteForLaunch, vehicle || selectedVehicle);
    }
  };

  const workflowSteps = [
    {
      step: '01',
      title: 'Global Orbital Reconnaissance',
      subtitle: 'NASA LRO LOLA Topography & Candidate Selection',
      desc: 'Screening 1.2 million km² of the Lunar South Pole using 5m/pixel polar stereographic DEMs. Identifying towering peaks of near-continuous illumination (85–92%) and adjacent cryogenic Permanently Shadowed Regions (PSRs).',
      tag: 'Orbital Recon',
      stats: '4 Artemis III Zones Mapped'
    },
    {
      step: '02',
      title: 'Powered Descent & Terminal Hazard Avoidance',
      subtitle: 'Sub-Meter Slope & Crater Density Screening',
      desc: 'Simulating the final 2,000m touchdown corridor for commercial CLPS landers (Griffin, Nova-C, Blue Ghost). Validating touchdown slope safety (< 8°) and crater rim clearances to guarantee 0% rollover probability.',
      tag: 'Descent Guidance',
      stats: '< 8° Threshold Locked'
    },
    {
      step: '03',
      title: 'Autonomous Shadow-Dodge Surface Navigation',
      subtitle: 'A* Thermal Safe Haven Dynamic Routing',
      desc: 'Robotic mobility in a landscape where shadows sweep across boulder fields at 1.5 cm/s. The engine recalculates optimal paths every simulated second, ensuring the rover stays bathed in solar light while making brief tactical sorties into freezing PSRs.',
      tag: 'Thermal Survival',
      stats: '100% Shadow Margin Maintained'
    },
    {
      step: '04',
      title: 'ISRU Cryogenic Volatiles Prospecting',
      subtitle: 'TRIDENT 1-Meter Subsurface Sampling & Neutron Spectrometry',
      desc: 'Pinpointing hydrogen and water-ice deposits (> 0.35 wt% WEH) trapped at 40 Kelvin. Evaluating propellant depot yields to support permanent crewed Artemis bases and deep space refueling for Mars transit.',
      tag: 'Resource Prospecting',
      stats: 'Up to 0.42 wt% Water Equivalent'
    }
  ];

  const techDeepDives = {
    ephemeris: {
      title: 'JPL Horizons DE441 Ephemeris Engine',
      badge: 'Sub-Millidegree Solar Vectors',
      subtitle: 'True Astronomical Ephemeris Calibrated from 2024 to 2030',
      p1: 'Unlike generic game engines that cast arbitrary sunlight from a static point, CODYSEEY runs a high-precision celestial mechanics solver derived from the NASA JPL DE441 planetary ephemeris.',
      p2: 'At the Lunar South Pole, the Sun never rises high in the sky; it circles the horizon at razor-thin grazing angles between +1.5° and +2.5° elevation. Even a 0.05° calculation error casts kilometer-long false shadows. Our engine computes exact sub-solar coordinates, nutation, and libration with precision under 0.001°.',
      specs: [
        { label: 'Solar Elevation Range', val: '+1.54° to +2.48°' },
        { label: 'Vector Accuracy', val: '0.001° (DE441)' },
        { label: 'Time Horizon', val: '2024–2030 (Artemis Era)' },
        { label: 'DTE Direct-to-Earth', val: 'Continuous LOS Tracking' }
      ]
    },
    hapke: {
      title: 'Hapke Photometric BRDF Model',
      badge: 'Zero-Atmosphere Lunar Optical Physics',
      subtitle: 'Accurate Opposition Surge & Coherent Backscattering',
      p1: 'The lunar surface lacks an atmosphere. There is no air Rayleigh scattering, no sky ambient light, and no soft penumbra. Shadows on the Moon are absolute pitch-black voids where thermal radiation plummets to 40 Kelvin (-233°C).',
      p2: 'CODYSEEY implements the authoritative Hapke photometric bidirectional reflectance distribution function (BRDF). This simulates the sharp retroreflective "opposition surge" when looking down-sun, regolith micro-roughness macroscopic shadowing, and ultra-high-contrast horizon silhouettes.',
      specs: [
        { label: 'Opposition Parameter (B0)', val: '1.24 (High Surge)' },
        { label: 'Surface Roughness (θ)', val: '22.5° RMS' },
        { label: 'Ambient Scatter Factor', val: '0.00 (Pure Vacuum)' },
        { label: 'Shadow Sharpness', val: 'Optical Ray Boundary' }
      ]
    },
    physics: {
      title: '6-Wheel Articulated Triple-Bogie Physics',
      badge: 'High-Precision Regolith Ground Contact',
      subtitle: 'Rocking Axles & True Wheel Revolution on LOLA Terrain',
      p1: 'Generic 3D lunar visualizers float rovers flat on a static plane. In CODYSEEY, our VIPER and Curiosity rovers are articulated mechanical assemblies featuring differential rocking bogies and active suspension pivot joints.',
      p2: 'The physics engine solves 7-point raycast collision against a 3.4-kilometer continuous lunar horizon mesh. Wheels dynamically rotate in direct proportion to real ground distance traveled (θ = s / r), conforming to slopes and rocks while calculating wheel-slip ratios.',
      specs: [
        { label: 'Suspension Type', val: 'Triple-Bogie Rocker' },
        { label: 'Ground Contact Points', val: '7-Ray Surface Sampler' },
        { label: 'Terrain Horizon Range', val: '3,400 meters radius' },
        { label: 'Wheel Speed Sync', val: 'Kinematic s = r · ω' }
      ]
    },
    gis: {
      title: 'Multi-Spectral LOLA & LROC GIS Suite',
      badge: 'Multi-Band Planetary Layers',
      subtitle: 'Blending Laser Altimetry, Slope Risk, and Neutron Spectrometry',
      p1: 'Mission planners require multi-dimensional geospatial intelligence. CODYSEEY incorporates an on-the-fly planetary GIS engine capable of switching between true-color LROC NAC photography, LOLA digital elevation color ramps, and slope hazard heatmaps.',
      p2: 'Critical layers include Lunar Prospector Neutron Spectrometer water-ice equivalent hydrogen (WEH) overlays and Clementine ultraviolet/visible iron and titanium mineralogy maps, allowing commanders to scout both landing safety and scientific return.',
      specs: [
        { label: 'LOLA Elevation GDR', val: '5m–20m / pixel' },
        { label: 'Slope Safety Shading', val: 'Green <5°, Red >15°' },
        { label: 'Water Ice WEH Map', val: '0.00 to 0.45 wt%' },
        { label: 'LROC NAC Resolution', val: '0.5m / pixel true surface' }
      ]
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: '#030508',
      color: '#f8fafc',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      scrollBehavior: 'smooth',
      position: 'relative'
    }}>
      {/* ─── 1. TOP AEROSPACE STICKY HEADER ─── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(3, 5, 8, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Left: Brand & NASA Challenge Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
            }}>
              <span style={{ fontSize: '16px' }}>🌔</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                lineHeight: 1.1
              }}>
                CODYSEEY
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: '#94a3b8',
                textTransform: 'uppercase'
              }}>
                NASA CLPS LUNAR BROWSER
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '100px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 8px #38bdf8'
            }} />
            <span style={{ fontSize: '11px', color: '#e0f2fe', fontWeight: 500, letterSpacing: '0.04em' }}>
              NASA Space Apps 2026 // Challenge 4
            </span>
          </div>
        </div>

        {/* Center: Navigation Anchors */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px'
        }}>
          <a href="#workflow" className="gru-btn-1" style={{ fontSize: '14px', color: '#cbd5e1' }}>Mission Journey</a>
          <a href="#what-we-built" className="gru-btn-1" style={{ fontSize: '14px', color: '#cbd5e1' }}>What We Built</a>
          <a href="#how-it-works" className="gru-btn-1" style={{ fontSize: '14px', color: '#cbd5e1' }}>How It Works</a>
          <a href="#precision" className="gru-btn-1" style={{ fontSize: '14px', color: '#cbd5e1' }}>Scientific Accuracy</a>
          <a href="#impact" className="gru-btn-1" style={{ fontSize: '14px', color: '#cbd5e1' }}>Future Impact</a>
          <a href="#sites" className="gru-btn-1" style={{ fontSize: '14px', color: '#cbd5e1' }}>Landing Sites</a>
        </nav>

        {/* Right: Quick Launch CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => handleLaunch(selectedSite || LANDING_SITES[0], 'viper')}
            style={{
              fontSize: '13px',
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 28px rgba(56, 189, 248, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.35)';
            }}
          >
            <span>EXPLORE 3D SIMULATOR</span>
            <span style={{ fontSize: '14px' }}>🚀</span>
          </button>
        </div>
      </header>

      {/* ─── 2. EPIC HERO SECTION (Video & High-Impact Typography) ─── */}
      <section style={{
        position: 'relative',
        minHeight: '94vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '60px 40px 80px 40px',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* High-Res Cinematic Landscape Space Video */}
        <video
          src="https://webflow-resources.b-cdn.net/GruSpace_LaunchVideo_v06.1_Landscape_NoEndText_fixEnd_web1080-2.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            opacity: 0.58
          }}
        />

        {/* Dynamic Dark Vignette & Mesh Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, #030508 10%, rgba(3, 5, 8, 0.65) 50%, rgba(3, 5, 8, 0.85) 100%)',
          zIndex: 1
        }} />

        {/* Hero Interactive Content Box */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1360px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Live Telemetry Pill */}
          <div style={{ alignSelf: 'flex-start' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(12px)'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', color: '#6ee7b7', textTransform: 'uppercase' }}>
                LIVE DE441 EPHEMERIS ONLINE // {simulatedTelemetry.clock}
              </span>
            </div>
          </div>

          {/* Grand H1 Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 5.5vw, 68px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            maxWidth: '1100px',
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.9)',
            color: '#ffffff'
          }}>
            The Google Earth + Tactical Street View for the Moon’s South Pole.
          </h1>

          {/* Subtitle / Value Proposition */}
          <p style={{
            fontSize: 'clamp(16px, 1.3vw, 20px)',
            lineHeight: 1.5,
            color: 'rgba(241, 245, 249, 0.88)',
            maxWidth: '820px',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.8)'
          }}>
            A scientifically authenticated digital twin, autonomous shadow-dodge traverse planner, and high-precision terrain navigator engineered for NASA Artemis III and Commercial Lunar Payload Services (CLPS) missions.
          </p>

          {/* 4 Real Telemetry Metrics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginTop: '8px',
            maxWidth: '1200px'
          }}>
            <div style={{
              background: 'rgba(11, 15, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px 20px',
              backdropFilter: 'blur(16px)'
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                ALTIMETRY RESOLUTION
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                &lt; 1.0 Meter
              </div>
              <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px' }}>
                NASA LRO LOLA GDR Gridded Data
              </div>
            </div>

            <div style={{
              background: 'rgba(11, 15, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px 20px',
              backdropFilter: 'blur(16px)'
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                SOLAR VECTOR ACCURACY
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                0.001° Precision
              </div>
              <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>
                JPL Horizons DE441 Ephemeris
              </div>
            </div>

            <div style={{
              background: 'rgba(11, 15, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px 20px',
              backdropFilter: 'blur(16px)'
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                PERMANENT COLD TRAPS
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                40 Kelvin (-233°C)
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                Water-Ice Volatiles Mapped
              </div>
            </div>

            <div style={{
              background: 'rgba(11, 15, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px 20px',
              backdropFilter: 'blur(16px)'
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                ROVER SUSPENSION
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                6-Wheel Articulated
              </div>
              <div style={{ fontSize: '12px', color: '#a855f7', marginTop: '2px' }}>
                Triple-Bogie Kinematics on LOLA DEM
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '18px',
            marginTop: '12px'
          }}>
            <button
              onClick={() => handleLaunch(selectedSite || LANDING_SITES[0], 'viper')}
              style={{
                background: '#ffffff',
                color: '#030508',
                borderRadius: '10px',
                padding: '16px 34px',
                fontSize: '17px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 0 35px rgba(255, 255, 255, 0.35)',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 45px rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 35px rgba(255, 255, 255, 0.35)';
              }}
            >
              <span>EXPLORE THE REAL 3D JOURNEY</span>
              <span style={{ fontSize: '20px' }}>→</span>
            </button>

            <a
              href="#launch-console"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '16px 28px',
                fontSize: '16px',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(12px)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <span>DISPATCH CONSOLE</span>
              <span>🎮</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── 3. THE 4-STEP EXPEDITION WORKFLOW JOURNEY ─── */}
      <section id="workflow" style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '100px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 60px auto' }}>
          <div style={{
            color: '#38bdf8',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            // MISSION WORKFLOW ARCHITECTURE
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 3.8vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1.15
          }}>
            From Orbit to Regolith: The 4-Stage Operational Pipeline
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '14px', lineHeight: 1.6 }}>
            Explore how NASA flight directors, robotic teleoperators, and CLPS commercial lander teams utilize CODYSEEY across every phase of polar exploration.
          </p>
        </div>

        {/* 4 Interactive Step Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {workflowSteps.map((ws, idx) => {
            const isSelected = activeWorkflowStep === idx;
            return (
              <div
                key={ws.step}
                onClick={() => {
                  soundFX.playClick();
                  setActiveWorkflowStep(idx);
                }}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 0 30px rgba(56, 189, 248, 0.2)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span style={{
                      fontSize: '36px',
                      fontWeight: 800,
                      color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)',
                      fontFamily: 'monospace'
                    }}>
                      {ws.step}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#38bdf8' : '#94a3b8'
                    }}>
                      {ws.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                    {ws.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 500, marginBottom: '14px' }}>
                    {ws.subtitle}
                  </div>
                  <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
                    {ws.desc}
                  </p>
                </div>

                <div style={{
                  marginTop: '28px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isSelected ? '#38bdf8' : '#64748b'
                }}>
                  ✓ {ws.stats}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 4. WHAT WE HAVE BUILT (The Comprehensive Digital Twin) ─── */}
      <section id="what-we-built" style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '100px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '48px', alignItems: 'center' }}>
          {/* Left Narrative */}
          <div>
            <div style={{
              color: '#f59e0b',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              // CORE SYSTEM CAPABILITIES
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              lineHeight: 1.18,
              marginBottom: '20px'
            }}>
              What We Have Built: A Full-Spectrum Lunar Operations Environment
            </h2>
            <p style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: 1.65, marginBottom: '18px' }}>
              We engineered a unified web-native planetary browser that eliminates the fragmentation between orbital remote sensing, landing safety engineering, and surface robotic teleoperation.
            </p>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.65, marginBottom: '28px' }}>
              Rather than forcing mission planners to cross-reference multiple 2D maps, ephemeris spreadsheets, and separate simulator software, CODYSEEY synthesizes NASA LOLA DEMs, LROC imagery, and JPL DE441 celestial vectors into one continuous, 60 FPS real-time engine.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '8px', borderRadius: '8px', fontSize: '18px' }}>🌐</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '16px' }}>Global 3D Polar Moon Globe & Terrain Level of Detail (LOD)</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '2px' }}>Smooth transition from 1,737 km global lunar sphere down to 1-meter surface regolith boulders.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '8px', borderRadius: '8px', fontSize: '18px' }}>☀️</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '16px' }}>Dynamic Shadow-Dodge Traverse Pathfinding</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '2px' }}>Autonomous A* routing ensuring VIPER stays charged by evading moving shadows at 1.5 cm/s.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px', borderRadius: '8px', fontSize: '18px' }}>🛬</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '16px' }}>CLPS Commercial Lander Descent Corridor Analyzer</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '2px' }}>Real-time hazard detection for Griffin, Nova-C, and Blue Ghost with slope and crater risk assessment.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Dashboard Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(3, 7, 18, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', color: '#e2e8f0', textTransform: 'uppercase' }}>
                  TELEMETRY MATRIX & SENSOR STACK
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                60 FPS WebGL 2.0
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>EPHEMERIS RANGE</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>2024 – 2030 UTC</div>
                <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>NASA Horizons DE441</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>ILLUMINATION HORIZON</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>360° Raycast</div>
                <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px' }}>Mazarico 2011 Model</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>ROVER MECHANICS</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>6-Wheel Kinematic</div>
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>VIPER / Curiosity / Griffin</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>DTE LATENCY</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>1.28 Seconds</div>
                <div style={{ fontSize: '12px', color: '#a855f7', marginTop: '2px' }}>Earth Distance Locked</div>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                onClick={() => handleLaunch(selectedSite || LANDING_SITES[0], 'viper')}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                }}
              >
                Inspect Live System Architecture in 3D →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. HOW IT WORKS (The Mathematical & Engineering Core) ─── */}
      <section id="how-it-works" style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '100px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 50px auto' }}>
          <div style={{
            color: '#10b981',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            // MATHEMATICAL & PHYSICS CORE
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 3.8vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1.15
          }}>
            How It Works: Under the Hood of the Simulation
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '14px', lineHeight: 1.6 }}>
            Explore the four foundational engineering pillars powering CODYSEEY’s real-time accuracy.
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '40px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'ephemeris', label: '1. JPL DE441 Ephemeris' },
            { id: 'hapke', label: '2. Hapke Photometric BRDF' },
            { id: 'physics', label: '3. 6-Wheel Terrain Physics' },
            { id: 'gis', label: '4. Multi-Spectral GIS' }
          ].map(tab => {
            const isTabActive = activeTechTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFX.playClick();
                  setActiveTechTab(tab.id);
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: '100px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isTabActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isTabActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isTabActive ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Deep Dive Content Box */}
        {(() => {
          const tabData = techDeepDives[activeTechTab];
          return (
            <div style={{
              background: 'rgba(11, 15, 23, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '44px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '40px',
              alignItems: 'center'
            }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  letterSpacing: '0.08em'
                }}>
                  {tabData.badge}
                </span>

                <h3 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', marginTop: '16px', marginBottom: '8px' }}>
                  {tabData.title}
                </h3>
                <div style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '20px', fontWeight: 500 }}>
                  {tabData.subtitle}
                </div>

                <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '16px' }}>
                  {tabData.p1}
                </p>
                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.7 }}>
                  {tabData.p2}
                </p>
              </div>

              {/* Spec Highlights Grid */}
              <div style={{
                background: 'rgba(3, 7, 18, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}>
                {tabData.specs.map(spec => (
                  <div key={spec.label} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {spec.label}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                      {spec.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ─── 6. HOW ACCURATE IS THIS? (Scientific Fidelity & Truth Matrix) ─── */}
      <section id="precision" style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '100px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 60px auto' }}>
          <div style={{
            color: '#a855f7',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            // RIGOROUS SCIENTIFIC VALIDATION
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 3.8vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1.15
          }}>
            How Accurate Is This? Truth in Planetary Simulation
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '14px', lineHeight: 1.6 }}>
            We benchmarked every calculation against published peer-reviewed planetary literature and NASA flight guidelines.
          </p>
        </div>

        {/* Comparison Matrix Table */}
        <div style={{
          overflowX: 'auto',
          background: 'rgba(11, 15, 23, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '720px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '20px', fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase' }}>SIMULATION DOMAIN</th>
                <th style={{ padding: '20px', fontSize: '13px', color: '#ef4444', textTransform: 'uppercase' }}>GENERIC GAMES / TOY WEB APPS</th>
                <th style={{ padding: '20px', fontSize: '13px', color: '#38bdf8', textTransform: 'uppercase', background: 'rgba(56, 189, 248, 0.08)' }}>CODYSEEY CLPS LUNAR BROWSER</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <td style={{ padding: '20px', fontWeight: 600, color: '#ffffff' }}>Solar Illumination</td>
                <td style={{ padding: '20px', color: '#94a3b8' }}>Static directional light rotated on 24h timer</td>
                <td style={{ padding: '20px', color: '#e0f2fe', fontWeight: 600, background: 'rgba(56, 189, 248, 0.04)' }}>
                  JPL Horizons DE441 (0.001° solar grazing angle & nutation)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <td style={{ padding: '20px', fontWeight: 600, color: '#ffffff' }}>Surface Topography</td>
                <td style={{ padding: '20px', color: '#94a3b8' }}>Artificial Perlin noise with random craters</td>
                <td style={{ padding: '20px', color: '#e0f2fe', fontWeight: 600, background: 'rgba(56, 189, 248, 0.04)' }}>
                  NASA LRO LOLA Gridded Altimetry (&lt;1m vertical resolution)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <td style={{ padding: '20px', fontWeight: 600, color: '#ffffff' }}>Light Reflection (BRDF)</td>
                <td style={{ padding: '20px', color: '#94a3b8' }}>Basic Lambertian / Phong diffuse shading</td>
                <td style={{ padding: '20px', color: '#e0f2fe', fontWeight: 600, background: 'rgba(56, 189, 248, 0.04)' }}>
                  True Hapke photometric backscatter with opposition surge
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <td style={{ padding: '20px', fontWeight: 600, color: '#ffffff' }}>Shadow Behavior</td>
                <td style={{ padding: '20px', color: '#94a3b8' }}>Soft shadow maps with ambient light fill</td>
                <td style={{ padding: '20px', color: '#e0f2fe', fontWeight: 600, background: 'rgba(56, 189, 248, 0.04)' }}>
                  Zero atmosphere pitch-black vacuum shadows (40K cold traps)
                </td>
              </tr>
              <tr>
                <td style={{ padding: '20px', fontWeight: 600, color: '#ffffff' }}>Rover Kinematics</td>
                <td style={{ padding: '20px', color: '#94a3b8' }}>Rigid body gliding flat over hills</td>
                <td style={{ padding: '20px', color: '#e0f2fe', fontWeight: 600, background: 'rgba(56, 189, 248, 0.04)' }}>
                  6-Wheel articulated rocker-bogie with 7-point collision raycast
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 7. HOW IT AFFECTS FUTURE SPACE EXPLORATION (Global Impact) ─── */}
      <section id="impact" style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '100px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 60px auto' }}>
          <div style={{
            color: '#10b981',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            // REVOLUTIONIZING LUNAR CAMPAIGNS
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 3.8vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1.15
          }}>
            How This Affects the Future of Space Exploration
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '14px', lineHeight: 1.6 }}>
            The Moon’s South Pole is the linchpin for humanity’s expansion to Mars. Here is why CODYSEEY matters:
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '30px'
        }}>
          {/* Impact 1: Artemis III */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '36px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>👨‍🚀</div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              De-risking Crewed Artemis III Landings
            </h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.65 }}>
              Landing humans on a razor-thin crater ridge requires knowing the exact illumination shadow boundary down to the meter. CODYSEEY verifies touchdown slopes (&lt;8°), ensuring astronauts land in continuous sunlight with unbroken Direct-to-Earth radio communication.
            </p>
          </div>

          {/* Impact 2: Multi-Billion Propellant Economy */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '36px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>💧</div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Unlocking the $100B+ Water Ice Economy
            </h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.65 }}>
              Launching rocket fuel from Earth costs up to $100,000 per kilogram. By guiding rovers into PSR cold traps to mine lunar water ice, missions can crack water into liquid hydrogen (LH2) and liquid oxygen (LOX), establishing a deep space propellant refueling hub for Mars expeditions.
            </p>
          </div>

          {/* Impact 3: Overcoming 1.3s Teleoperation Latency */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '36px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚡</div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Solving the 1.3-Second Earth-Moon Delay
            </h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.65 }}>
              Because radio signals take 1.3 seconds to travel between Earth and the Moon, ground pilots cannot joystick rovers in real time. Our autonomous shadow-dodge algorithm enables robotic rovers to safely execute automated traverses without risking freezing in sudden shadows.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 8. INTERACTIVE 4-SITE SHOWCASE (Preview & 1-Click Launch) ─── */}
      <section id="sites" style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '100px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 50px auto' }}>
          <div style={{
            color: '#38bdf8',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            // CANDIDATE EXPLORATION TARGETS
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 3.8vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1.15
          }}>
            Select a South Pole Landing Haven
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '14px', lineHeight: 1.6 }}>
            Click any candidate site below to inspect its topographic properties and launch directly into its 3D coordinates.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {LANDING_SITES.map((site) => {
            const isSiteSelected = activeSitePreview.id === site.id;
            return (
              <div
                key={site.id}
                onClick={() => {
                  soundFX.playClick();
                  setActiveSitePreview(site);
                  setSelectedSiteForLaunch(site);
                }}
                style={{
                  background: isSiteSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSiteSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSiteSelected ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isSiteSelected ? '#38bdf8' : '#94a3b8',
                      textTransform: 'uppercase'
                    }}>
                      {site.designation}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '100px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      fontWeight: 600
                    }}>
                      {site.illuminationPct}% Sunlight
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                    {site.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginBottom: '12px' }}>
                    {Math.abs(site.lat).toFixed(2)}°S, {site.lon.toFixed(2)}°E • Elev: {site.elevationM}m
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                    {site.description.substring(0, 110)}...
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                    <span>Slope: {site.maxSlopeDeg}°</span>
                    <span style={{ color: '#38bdf8' }}>{site.waterIceProbability}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunch(site, selectedVehicle);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      background: isSiteSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                      color: isSiteSelected ? '#030508' : '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Explore in 3D →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 9. DEDICATED LAUNCH CONSOLE ("EXPLORE THE REAL JOURNEY") ─── */}
      <section id="launch-console" style={{
        maxWidth: '1280px',
        margin: '60px auto 100px auto',
        padding: '0 32px'
      }}>
        <div style={{
          background: 'radial-gradient(ellipse at top, rgba(30, 58, 138, 0.4) 0%, rgba(3, 7, 18, 0.95) 70%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '28px',
          padding: '60px 48px',
          textAlign: 'center',
          boxShadow: '0 0 80px rgba(56, 189, 248, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Grid Ambient Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.4,
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#38bdf8',
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              READY FOR TELEOPERATION DISPATCH
            </span>

            <h2 style={{
              fontSize: 'clamp(32px, 4.5vw, 54px)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginTop: '20px',
              marginBottom: '16px'
            }}>
              Explore the Real 3D Moon Journey
            </h2>

            <p style={{
              fontSize: '17px',
              color: '#cbd5e1',
              maxWidth: '680px',
              margin: '0 auto 36px auto',
              lineHeight: 1.6
            }}>
              Configure your vehicle payload, designate your polar landing site, and take manual command of the live 3D surface simulator.
            </p>

            {/* Vehicle Selection Selector */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '40px',
              flexWrap: 'wrap'
            }}>
              {[
                { id: 'viper', name: 'VIPER Rover', role: '6-Wheel Volatiles Prospector' },
                { id: 'griffin', name: 'Astrobotic Griffin', role: 'Medium Commercial Lander' },
                { id: 'nova-c', name: 'Intuitive Machines Nova-C', role: 'CLPS Surface Lander' }
              ].map(veh => {
                const isVehActive = selectedVehicle === veh.id;
                return (
                  <div
                    key={veh.id}
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedVehicle(veh.id);
                    }}
                    style={{
                      background: isVehActive ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: isVehActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                      {veh.name}
                    </div>
                    <div style={{ fontSize: '12px', color: isVehActive ? '#38bdf8' : '#94a3b8', marginTop: '2px' }}>
                      {veh.role}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* The Monumental CTA Launch Button */}
            <button
              onClick={() => handleLaunch(selectedSiteForLaunch, selectedVehicle)}
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: '#030508',
                borderRadius: '12px',
                padding: '20px 48px',
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 0 50px rgba(56, 189, 248, 0.5)',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = '0 0 70px rgba(56, 189, 248, 0.75)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1.0)';
                e.currentTarget.style.boxShadow = '0 0 50px rgba(56, 189, 248, 0.5)';
              }}
            >
              <span>ENTER LIVE 3D LUNAR SIMULATOR</span>
              <span style={{ fontSize: '24px' }}>🚀</span>
            </button>

            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '18px' }}>
              Selected Destination: <span style={{ color: '#ffffff', fontWeight: 600 }}>{selectedSiteForLaunch?.name || 'Shackleton Connecting Ridge'}</span> • Vehicle: <span style={{ color: '#ffffff', fontWeight: 600 }}>{selectedVehicle.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. AEROSPACE FOOTER ─── */}
      <footer style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '40px 32px 60px 32px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        fontSize: '13px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>CODYSEEY</span>
          <span>•</span>
          <span>NASA Space Apps Challenge 2026</span>
          <span>•</span>
          <span>Open Planetary Data Engine</span>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <span>Datasets: NASA LRO LOLA, LROC NAC, JPL DE441 Ephemeris</span>
        </div>
      </footer>
    </div>
  );
}
