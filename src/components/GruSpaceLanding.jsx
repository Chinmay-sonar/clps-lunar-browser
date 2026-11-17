import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';

export default function GruSpaceLanding({
  onLaunchMissionControl,
  onOpenManifest,
  onOpenMoonGlobe
}) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    soundFX.playClick();
    setIsSubscribed(true);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'var(--swatch--black)',
      color: 'var(--swatch--text-white)',
      fontFamily: 'var(--_typography---font--primary-family)',
      fontSize: 'var(--_typography---font-size--text-main)',
      lineHeight: 'var(--_typography---line-height--lh-1-4)',
      fontWeight: 'var(--_typography---font--primary-regular)',
      scrollBehavior: 'smooth'
    }}>
      {/* ─── Top Navigation Header ─── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        maxWidth: '1920px',
        margin: '0 auto',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Left: Brand & Y Combinator Partner Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', cursor: 'pointer' }}>
            <span style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#ffffff'
            }}>
              GRU
            </span>
            <span style={{
              fontSize: '16px',
              fontWeight: 400,
              letterSpacing: '0.12em',
              color: 'var(--gru-text-muted)'
            }}>
              SPACE
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <img
              src="https://cdn.prod.website-files.com/69523705e6ef6f1b4fbf357d/69526a31636987ccd79f88fb_Y%20-%20Combinator.png"
              alt="Y Combinator"
              style={{ height: '16px', width: 'auto', display: 'block' }}
            />
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
              Backed by Y Combinator
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <a href="#intro" className="gru-btn-1" style={{ fontSize: '16px' }}>About</a>
          <a href="#roadmap" className="gru-btn-1" style={{ fontSize: '16px' }}>Roadmap</a>
          <a href="#model" className="gru-btn-1" style={{ fontSize: '16px' }}>Habitat Architecture</a>
          <a href="#whitepaper" className="gru-btn-1" style={{ fontSize: '16px' }}>Feasibility</a>
          <a href="#team" className="gru-btn-1" style={{ fontSize: '16px' }}>Team</a>
        </nav>

        {/* Right: Interactive Simulator Launch CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              soundFX.playClick();
              if (onOpenMoonGlobe) onOpenMoonGlobe();
            }}
            className="gru-btn-1"
            style={{
              fontSize: '14px',
              padding: '6px 14px',
              borderRadius: '1440px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff'
            }}
            title="Inspect 3D Lunar Polar Globe"
          >
            <span>🌔 3D MOON GLOBE</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              if (onLaunchMissionControl) onLaunchMissionControl();
            }}
            style={{
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 18px',
              borderRadius: '1440px',
              background: '#eb5050',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 20px rgba(235, 80, 80, 0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 28px rgba(235, 80, 80, 0.65)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(235, 80, 80, 0.4)';
            }}
          >
            <span>LAUNCH SIMULATOR</span>
            <span>🚀</span>
          </button>
        </div>
      </header>

      {/* ─── SECTION 1: s-h-home (Hero with Video Background) ─── */}
      <section className="s-h-home" style={{
        position: 'relative',
        minHeight: '92vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '64px 32px',
        overflow: 'hidden',
        background: 'transparent'
      }}>
        {/* Full-width Autoplay Background Video */}
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
            opacity: 0.68
          }}
        />

        {/* Cinematic Vignette Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.35) 45%, rgba(0, 0, 0, 0.75) 100%)',
          zIndex: 1
        }} />

        {/* Content Box */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Badge Pill */}
          <div style={{ alignSelf: 'flex-start' }}>
            <span className="badge-pill">
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#eb5050',
                boxShadow: '0 0 10px #eb5050'
              }} />
              <span>THE FIRST HOTEL ON THE MOON</span>
            </span>
          </div>

          {/* H2 Title */}
          <h1 className="gru-h2" style={{
            maxWidth: '1000px',
            textShadow: '0 4px 30px rgba(0,0,0,0.8)'
          }}>
            Creating Habitats for Humanity on Other Planets
          </h1>

          {/* Subtitle / Body */}
          <p className="gru-body-text" style={{
            maxWidth: '652.771px',
            color: 'rgba(255, 255, 255, 0.85)',
            textShadow: '0 2px 10px rgba(0,0,0,0.8)'
          }}>
            GRU Space is engineering autonomous lunar hotel and research habitats, leveraging in-situ regolith shielding and continuous solar illumination at the Moon's South Pole.
          </p>

          {/* Interactive Floating Glass Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginTop: '12px',
            maxWidth: '1080px'
          }}>
            <div className="glass-card">
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                TARGET REGION
              </div>
              <div style={{ fontSize: '24px', fontWeight: 500, marginTop: '4px' }}>
                Shackleton Rim (-89.9° S)
              </div>
              <div style={{ fontSize: '14px', color: '#38bdf8', marginTop: '4px' }}>
                Peak Illumination: 92.4% • Constant Direct-to-Earth Link
              </div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                FIRST FLIGHT TEST
              </div>
              <div style={{ fontSize: '24px', fontWeight: 500, marginTop: '4px' }}>
                2026 Polar Systems Test
              </div>
              <div style={{ fontSize: '14px', color: '#10b981', marginTop: '4px' }}>
                NASA CLPS Co-Manifested Mission
              </div>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                INTERACTIVE SUITE
              </div>
              <div style={{ fontSize: '24px', fontWeight: 500, marginTop: '4px' }}>
                3D Research Simulator
              </div>
              <div style={{ fontSize: '14px', color: '#eb5050', marginTop: '4px' }}>
                Real-time JPL DE441 Ephemeris Engine
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '16px',
            marginTop: '8px'
          }}>
            <button
              onClick={() => {
                soundFX.playClick();
                if (onLaunchMissionControl) onLaunchMissionControl();
              }}
              style={{
                background: '#ffffff',
                color: '#080808',
                borderRadius: '8px',
                padding: '14px 28px',
                fontSize: '18px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 0 25px rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 35px rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 255, 255, 0.3)';
              }}
            >
              <span>ENTER MISSION CONTROL SIMULATOR</span>
              <span>→</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                if (onOpenManifest) onOpenManifest();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '14px 24px',
                fontSize: '18px',
                fontWeight: 500,
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(12px)',
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
              <span>CONFIGURE VEHICLE MANIFEST</span>
              <span>🚀</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: s-intro (The First Hotel on the Moon) ─── */}
      <section id="intro" className="s-intro" style={{
        maxWidth: '1920px',
        margin: '0 auto',
        padding: '110px 32px',
        background: 'transparent',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '48px',
        alignItems: 'center'
      }}>
        {/* Left: Text Narrative */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ color: '#eb5050', fontSize: '16px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            // EXPEDITION CIVILIZATION
          </div>

          <h2 className="gru-h2">
            The First Hotel on the Moon — Take Part in Humanity’s Journey to the Next Frontier
          </h2>

          <p className="gru-body-text" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            For thousands of years, humans have looked up at the silver disc of the Moon and dreamed of standing upon its plains. Today, with commercial super heavy-lift launch vehicles and lunar water ice deposits, that dream transitions into permanent architectural reality.
          </p>

          <p className="gru-body-text" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            GRU Space is constructing the premier luxury habitat and scientific research complex atop the rim of Shackleton Crater. Here, the Sun skims the craggy horizon at grazing angles (+1.5° to +2.5°), bathing vertical bifacial solar towers in near-perpetual daylight while deep cold traps preserve millions of tons of pristine cryogenic volatiles.
          </p>

          <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 600, color: '#ffffff' }}>1/6th</div>
              <div style={{ fontSize: '16px', color: 'var(--gru-text-muted)' }}>Lunar Gravity Freedom</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <div>
              <div style={{ fontSize: '32px', fontWeight: 600, color: '#ffffff' }}>384,400 km</div>
              <div style={{ fontSize: '16px', color: 'var(--gru-text-muted)' }}>Earth Orbit Distance</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <div>
              <div style={{ fontSize: '32px', fontWeight: 600, color: '#ffffff' }}>100%</div>
              <div style={{ fontSize: '16px', color: 'var(--gru-text-muted)' }}>Solar Self-Sufficiency</div>
            </div>
          </div>
        </div>

        {/* Right: Intro Image with Ambient Border */}
        <div style={{ position: 'relative' }}>
          <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
          }}>
            <img
              src="https://cdn.prod.website-files.com/69523705e6ef6f1b4fbf357d/6953bc1be75474700a93b842_46f389cdddb34a079c3405b6d5786d4d_Introduction.avif"
              alt="GRU Space Introduction Lunar Hotel"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: s-roadmap (Roadmap - Background #000000) ─── */}
      <section id="roadmap" className="s-roadmap" style={{
        background: '#000000',
        padding: '110px 32px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ color: '#eb5050', fontSize: '16px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            // FLIGHT DEPLOYMENT SCHEDULE
          </div>

          <h2 className="gru-h2" style={{ marginBottom: '48px' }}>
            First Lunar Systems Test
          </h2>

          {/* 4-Stage Visual Milestones Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {/* Phase 1 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ color: '#eb5050', fontSize: '14px', fontWeight: 700 }}>2026 // PHASE I</span>
              <h3 className="gru-h3">Autonomous Polar Reconnaissance</h3>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
                Co-manifested payload deployment on commercial CLPS lander. Real-time testing of shadow-dodging navigation, 88° solar panel tilt tracking, and cryogenic volatile prospecting.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                <span className="badge-pill" style={{ fontSize: '13px', padding: '4px 10px', background: 'rgba(235, 80, 80, 0.15)', color: '#eb5050' }}>
                  SIMULATED IN THIS APP
                </span>
              </div>
            </div>

            {/* Phase 2 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ color: '#38bdf8', fontSize: '14px', fontWeight: 700 }}>2027 // PHASE II</span>
              <h3 className="gru-h3">Regolith Microwave Sintering</h3>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
                Autonomous rovers melt and sinter lunar dust into interlocking ceramic tiles, fabricating dust-free landing pads, roadways, and outer radiation berms around Shackleton Ridge.
              </p>
            </div>

            {/* Phase 3 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 700 }}>2028 // PHASE III</span>
              <h3 className="gru-h3">Inflatable Habitat Module Core</h3>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
                Deployment of the multi-layer Vectran inflatable pressure hull with closed-loop ECLSS life support, water walls, and Earth-facing observation cupolas.
              </p>
            </div>

            {/* Phase 4 */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 700 }}>2029 // PHASE IV</span>
              <h3 className="gru-h3">Maiden Passenger Stay</h3>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
                Welcoming the first commercial guests to live, conduct science, and walk upon the lunar regolith in custom spacesuits, with 4-day Earth-return readiness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: s-model (Habitat Architecture & Engineering) ─── */}
      <section id="model" className="s-model" style={{
        maxWidth: '1920px',
        margin: '0 auto',
        padding: '110px 32px',
        background: 'transparent',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '48px',
        alignItems: 'center'
      }}>
        {/* Left: Model Image */}
        <div style={{ position: 'relative' }}>
          <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
          }}>
            <img
              src="https://cdn.prod.website-files.com/69523705e6ef6f1b4fbf357d/69536c1b2505f0dae2f15008_39595a74cfba138cfa05c813f47e8152_Creating%20habitats%20for%20humanity%20%20on%20other%20planets..avif"
              alt="GRU Space Habitat Model 3D Architecture"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

        {/* Right: Technical Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ color: '#eb5050', fontSize: '16px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            // STRUCTURAL ARCHITECTURE
          </div>

          <h2 className="gru-h2">
            Engineered for Deep Space Survival
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-card" style={{ fontSize: '16px' }}>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                🛡️ Radiation-Hardened Water Walls & Sintered Regolith
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: '1.5' }}>
                Dual-layer cosmic ray and solar proton event (SPE) shielding: 1.5 meters of fused lunar regolith topped with circulating greywater jackets reduce interior radiation below LEO space station baselines.
              </div>
            </div>

            <div className="glass-card" style={{ fontSize: '16px' }}>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                ☀️ Grazing Solar Elevation (+1.5° to +2.5°) Power Arrays
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: '1.5' }}>
                Because the Moon's axial tilt is only 1.54°, sunlight at polar peaks strikes nearly horizontal. Vertical bifacial solar arrays tilted at 88° capture peak continuous irradiance without 14-day lunar night blackouts.
              </div>
            </div>

            <div className="glass-card" style={{ fontSize: '16px' }}>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                💧 Cryogenic Volatiles & ISRU Closed-Loop Life Support
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: '1.5' }}>
                Directly adjacent to permanently shadowed regions (PSRs) at -240°C (33K), allowing robotic rovers to mine sub-surface water ice for drinking water, oxygen generation, and rocket propellant.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: s-whitepaper (Feasibility & Physics) ─── */}
      <section id="whitepaper" className="s-whitepaper" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '110px 32px',
        background: 'transparent'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ color: '#eb5050', fontSize: '16px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            // SCIENTIFIC & ECONOMIC RIGOR
          </div>
          <h2 className="gru-h2">
            How is This Actually Possible?
          </h2>
          <p className="gru-body-text" style={{ maxWidth: '630px', margin: '16px auto 0', color: 'rgba(255, 255, 255, 0.75)' }}>
            We do not rely on sci-fi assumptions. Every element of the GRU Space architecture is built on peer-reviewed planetary science, verified JPL ephemeris data, and commercial payload pricing.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ fontSize: '14px', color: '#eb5050', fontWeight: 600, marginBottom: '6px' }}>
              RESEARCH PAPER 01
            </div>
            <h3 className="gru-h3" style={{ fontSize: '20px', marginBottom: '10px' }}>
              Topographic Solar Trapping at Shackleton Ridge
            </h3>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
              Using LOLA 30m digital elevation models, we demonstrate that elevated ridges at 89.9°S remain illuminated for up to 94% of the lunar year, avoiding the 350-hour cryogenic battery crisis that killed historical missions.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 600, marginBottom: '6px' }}>
              RESEARCH PAPER 02
            </div>
            <h3 className="gru-h3" style={{ fontSize: '20px', marginBottom: '10px' }}>
              Microwave Sintering of Lunar Regolith Simulant
            </h3>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
              Co-authored by Dr. Kevin Cannon, showing that 2.45 GHz microwave heating fuses highland anorthosite regolith within 18 minutes into high-compressive-strength pavers without requiring transported chemical binders.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 600, marginBottom: '6px' }}>
              RESEARCH PAPER 03
            </div>
            <h3 className="gru-h3" style={{ fontSize: '20px', marginBottom: '10px' }}>
              Translunar Trajectory & Launch Economics
            </h3>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
              Detailed delta-v budgets and TLI cruise profiles (10.8 km/s Earth departure to 100.8-hour polar orbital arrival), verified with NASA JPL DE441 ephemeris calculations implemented directly in our simulator.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: s-team (GRU Space Team) ─── */}
      <section id="team" className="s-team" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '110px 32px',
        background: 'transparent'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ color: '#eb5050', fontSize: '16px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            // LEADERSHIP & PLANETARY SCIENTISTS
          </div>
          <h2 className="gru-h2">
            GRU Space Team
          </h2>
          <p className="gru-body-text" style={{ maxWidth: '630px', margin: '16px auto 0', color: 'rgba(255, 255, 255, 0.75)' }}>
            Founders and scientists combining aerospace flight software, planetary geology, and Y Combinator backing to establish permanent human lunar civilization.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '32px',
          maxWidth: '860px',
          margin: '0 auto'
        }}>
          {/* Skyler Chan */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ height: '360px', overflow: 'hidden', background: '#0a0d14' }}>
              <img
                src="https://cdn.prod.website-files.com/6953aaefe9d9d9d35cb3a684/695fa7f4f115334018af747f_Skyler%20Chan.avif"
                alt="Skyler Chan"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '24px' }}>
              <h3 className="gru-h3" style={{ fontSize: '24px', fontWeight: 600 }}>Skyler Chan</h3>
              <div style={{ color: '#eb5050', fontSize: '14px', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase' }}>
                Co-Founder & CEO
              </div>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '10px', lineHeight: '1.5' }}>
                Aerospace technologist and founder leading the design, commercial architecture, and space system operations of the GRU lunar outpost.
              </p>
            </div>
          </div>

          {/* Dr. Kevin Cannon */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ height: '360px', overflow: 'hidden', background: '#0a0d14' }}>
              <img
                src="https://cdn.prod.website-files.com/6953aaefe9d9d9d35cb3a684/695fa83a3878cca4c8bb6bb5_Dr.%20Kevin%20Cannon.avif"
                alt="Dr. Kevin Cannon"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '24px' }}>
              <h3 className="gru-h3" style={{ fontSize: '24px', fontWeight: 600 }}>Dr. Kevin Cannon</h3>
              <div style={{ color: '#eb5050', fontSize: '14px', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase' }}>
                Co-Founder & Chief Scientist
              </div>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '10px', lineHeight: '1.5' }}>
                Planetary scientist, world-renowned expert in lunar regolith geotechnics, in-situ resource utilization, and ISRU microwave processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: s-featured-blog (Featured in) ─── */}
      <section className="s-featured-blog" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '80px 32px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <h3 className="gru-h3" style={{
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontSize: '16px',
          marginBottom: '36px'
        }}>
          Featured in
        </h3>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '48px',
          opacity: 0.7
        }}>
          <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.04em' }}>Y COMBINATOR</span>
          <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.04em' }}>TECHCRUNCH</span>
          <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.04em' }}>NASA SPACE APPS 2026</span>
          <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.04em' }}>BLOOMBERG SPACE</span>
          <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.04em' }}>ARS TECHNICA</span>
        </div>
      </section>

      {/* ─── SECTION 8: s-cta (Be Part of Humanity’s Lunar Future) ─── */}
      <section className="s-cta" style={{
        position: 'relative',
        minHeight: '75vh',
        width: '100%',
        maxWidth: '1920px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 32px',
        overflow: 'hidden'
      }}>
        {/* Background CTA Image */}
        <img
          src="https://cdn.prod.website-files.com/69523705e6ef6f1b4fbf357d/69627f85fba570f104928407_bg-cta.avif"
          alt="GRU Space Lunar Future Background"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.5,
            zIndex: 0
          }}
        />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.9) 100%)',
          zIndex: 1
        }} />

        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '860px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          <img
            src="https://cdn.prod.website-files.com/69523705e6ef6f1b4fbf357d/6953c2758ff7e237e5dd3df7_CTA-img.avif"
            alt="GRU Space CTA Emblem"
            style={{ width: '120px', height: 'auto', marginBottom: '8px' }}
          />

          <h2 className="gru-h2" style={{ maxWidth: '800px' }}>
            Be Part of Humanity’s Lunar Future
          </h2>

          <p className="gru-body-text" style={{ maxWidth: '630px', color: 'rgba(255, 255, 255, 0.8)' }}>
            Experience the real physics, flight trajectories, and solar illumination conditions that make lunar settlement possible. Test our live NASA ephemeris simulator today.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                soundFX.playClick();
                if (onLaunchMissionControl) onLaunchMissionControl();
              }}
              style={{
                background: '#eb5050',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 32px',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 0 25px rgba(235, 80, 80, 0.5)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 35px rgba(235, 80, 80, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(235, 80, 80, 0.5)';
              }}
            >
              <span>LAUNCH MISSION CONTROL</span>
              <span>🚀</span>
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                if (onOpenMoonGlobe) onOpenMoonGlobe();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                padding: '14px 28px',
                fontSize: '18px',
                fontWeight: 500,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              <span>EXPLORE 3D MOON GLOBE</span>
              <span>🌔</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: s-cta-newsletter (Join our Newsletter) ─── */}
      <section className="s-cta-newsletter" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '90px 32px',
        textAlign: 'center',
        background: 'transparent'
      }}>
        <div style={{ maxWidth: '630px', margin: '0 auto' }}>
          <h3 className="gru-h3" style={{ fontSize: '32px', marginBottom: '12px' }}>
            Join our Newsletter
          </h3>
          <p className="gru-body-text" style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '28px' }}>
            Receive periodic dispatches on lunar mission tests, architecture whitepapers, and flight reservation windows.
          </p>

          {isSubscribed ? (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#10b981',
              fontSize: '16px',
              fontWeight: 500
            }}>
              ✓ Thank you for subscribing. You are now on the official GRU Space lunar dispatch manifest.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="input"
                style={{ flex: '1 1 280px', maxWidth: '380px' }}
              />
              <button
                type="submit"
                style={{
                  background: '#eb5050',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        maxWidth: '1920px',
        margin: '0 auto',
        padding: '48px 32px 32px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>GRU SPACE</span>
          <span>© 2026 GRU Space Inc. All rights reserved.</span>
          <span>Shackleton Rim Base (-89.9° S, 0.0° E)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="#intro" className="gru-link" style={{ color: 'rgba(255,255,255,0.6)' }}>About</a>
          <a href="#roadmap" className="gru-link" style={{ color: 'rgba(255,255,255,0.6)' }}>Roadmap</a>
          <a href="#whitepaper" className="gru-link" style={{ color: 'rgba(255,255,255,0.6)' }}>Whitepaper</a>
          <a href="#team" className="gru-link" style={{ color: 'rgba(255,255,255,0.6)' }}>Team</a>
          <span style={{ color: '#eb5050' }}>NASA Space Apps Challenge 2026</span>
        </div>
      </footer>
    </div>
  );
}
