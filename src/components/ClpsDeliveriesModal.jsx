import React, { useState, useEffect } from 'react';
import { soundFX } from '../utils/soundFX';
import { LANDING_SITES } from '../data/landingSites';

/**
 * Commercial Lunar Payload Services (CLPS) Deliveries Modal
 * Official NASA SMD Interactive Lunar Delivery Resource
 * Source: https://www.nasa.gov/commercial-lunar-payload-services/clps-landing-sites/
 */
export default function ClpsDeliveriesModal({
  isOpen,
  onClose,
  onSelectSite,
  setCameraMode
}) {
  const [activeTab, setActiveTab] = useState('live_nasa'); // 'live_nasa' | 'missions_grid'
  const [filterRegion, setFilterRegion] = useState('all'); // 'all' | 'south_pole' | 'near_side' | 'far_side'
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // NASA Official CLPS Deliveries Dataset
  const clpsDeliveries = [
    {
      id: 'im-1',
      title: 'Intuitive Machines IM-1 (TO 2-IM)',
      contractor: 'Intuitive Machines',
      lander: 'Nova-C "Odysseus"',
      siteName: 'Malapert A (Near Malapert Massif)',
      region: 'south_pole',
      coordinates: '80.13° S, 1.44° E',
      landingDate: 'February 22, 2024',
      status: 'Historic First Commercial Landing',
      statusColor: '#10b981',
      payloadMass: '130 kg (6 NASA Instruments)',
      launchVehicle: 'SpaceX Falcon 9',
      siteMatchId: 'malapert-massif',
      description: 'Historic mission achieving the first American soft lunar landing in over 50 years. Landed near the rim of Malapert A crater at 80.13° S.',
      instruments: ['ROLSES (Radio Wave Physics)', 'LRA (Laser Retroreflector Array)', 'NDL (Doppler Lidar)', 'SCALPSS (Plume-Surface Stereo Camera)']
    },
    {
      id: 'im-2',
      title: 'Intuitive Machines IM-2 / PRIME-1',
      contractor: 'Intuitive Machines',
      lander: 'Nova-C Lander',
      siteName: 'Shackleton Connecting Ridge',
      region: 'south_pole',
      coordinates: '89.54° S, 222.9° E',
      landingDate: 'Late 2026',
      status: 'Scheduled Launch',
      statusColor: '#38bdf8',
      payloadMass: '39 kg (PRIME-1 Subsurface Drill)',
      launchVehicle: 'SpaceX Falcon 9',
      siteMatchId: 'shackleton-connecting-ridge',
      description: 'First attempt to drill 1 meter beneath the lunar South Pole surface to search for water ice volatiles at cryogenic temperatures.',
      instruments: ['TRIDENT (1-Meter Rotary-Percussive Drill)', 'MSolo (Mass Spectrometer for Volatile Detection)', 'Micro-Nova Hopper Drone']
    },
    {
      id: 'griffin-viper',
      title: 'Astrobotic Griffin Mission-1 (TO VIPER)',
      contractor: 'Astrobotic Technology',
      lander: 'Griffin Lander',
      siteName: 'Mons Mouton Plateau',
      region: 'south_pole',
      coordinates: '84.90° S, 32.50° E',
      landingDate: '2026',
      status: 'Heavy Delivery Manifest',
      statusColor: '#a855f7',
      payloadMass: '450 kg (VIPER Lunar Rover)',
      launchVehicle: 'SpaceX Falcon Heavy',
      siteMatchId: 'mons-mouton',
      description: 'Delivering NASA\'s VIPER heavy robotic rover with dual deployable egress ramps onto the flat elevated plateau of Mons Mouton.',
      instruments: ['NASA VIPER Lunar Rover', 'TRIDENT 1m Drill', 'NIRVSS Near-Infrared Spectrometer', 'NSS Neutron Spectrometer']
    },
    {
      id: 'blue-ghost-1',
      title: 'Firefly Blue Ghost Mission 1 (TO 19D)',
      contractor: 'Firefly Aerospace',
      lander: 'Blue Ghost Lander',
      siteName: 'Mare Crisium Basin',
      region: 'near_side',
      coordinates: '18.56° N, 61.81° E',
      landingDate: '2026',
      status: 'Lunar Surface Exploration',
      statusColor: '#38bdf8',
      payloadMass: '150 kg (10 NASA Payloads)',
      launchVehicle: 'SpaceX Falcon 9',
      siteMatchId: null,
      description: 'Delivering a suite of 10 NASA instruments to investigate lunar regolith heat flow, solar wind interaction, and drill subsurface soil.',
      instruments: ['LMS (Lunar Magnetotelluric Sounder)', 'LISTER (Subsurface Thermal Probe)', 'LuGRE (GNSS Lunar Receiver)', 'RAC (Regolith Adherence Camera)']
    },
    {
      id: 'peregrine-1',
      title: 'Astrobotic Peregrine Mission-1 (TO 2-AB)',
      contractor: 'Astrobotic Technology',
      lander: 'Peregrine Lander',
      siteName: 'Sinus Viscositatis (Gruithuisen)',
      region: 'near_side',
      coordinates: '35.25° N, 317.0° E',
      landingDate: 'January 2024',
      status: 'Lunar Trans-Injection Flight',
      statusColor: '#f59e0b',
      payloadMass: '90 kg (5 NASA Payloads)',
      launchVehicle: 'ULA Vulcan Centaur',
      siteMatchId: null,
      description: 'Inaugural CLPS flight carrying NASA payloads to explore Gruithuisen Domes silicic volcanism and lunar radiation environment.',
      instruments: ['NSS (Neutron Spectrometer)', 'LRA (Laser Retroreflector)', 'NIRVSS (Volatiles Spectrometer)', 'PITMS (Ion Trap Mass Spectrometer)']
    },
    {
      id: 'im-3',
      title: 'Intuitive Machines IM-3 (TO CP-11)',
      contractor: 'Intuitive Machines',
      lander: 'Nova-C Lander',
      siteName: 'Reiner Gamma Swirl',
      region: 'near_side',
      coordinates: '7.5° N, 59.0° W',
      landingDate: '2026',
      status: 'Magnetic Swirl Survey',
      statusColor: '#38bdf8',
      payloadMass: '92 kg (Lunar Vertex Suite)',
      launchVehicle: 'SpaceX Falcon 9',
      siteMatchId: null,
      description: 'Investigating the mysterious Reiner Gamma lunar magnetic swirl and space weathering using surface rovers and magnetometers.',
      instruments: ['Lunar Vertex (Magnetometer & Rover)', 'CADRE (Autonomous Cooperative Mini-Rovers)', 'ESA MoonLIGHT Retroreflector']
    },
    {
      id: 'draper-cp12',
      title: 'Draper SERIES-2 (TO CP-12)',
      contractor: 'Draper / ispace',
      lander: 'APEX 1.0 Lander',
      siteName: 'Schrödinger Basin (Far Side)',
      region: 'far_side',
      coordinates: '75.0° S, 132.5° E',
      landingDate: '2026',
      status: 'Lunar Far Side Geophysics',
      statusColor: '#10b981',
      payloadMass: '95 kg (Farside Seismic Suite)',
      launchVehicle: 'SpaceX Falcon 9',
      siteMatchId: null,
      description: 'First NASA mission to the lunar far side south pole basin to measure moonquakes, internal heat flow, and electrical conductivity.',
      instruments: ['FSS (Farside Seismic Suite)', 'LIT (Lunar Interior Temperature & Electrical Conductivity)', 'MoonLIGHT Retroreflector']
    },
    {
      id: 'blue-ghost-2',
      title: 'Firefly Blue Ghost Mission 2 (TO CS-3)',
      contractor: 'Firefly Aerospace',
      lander: 'Blue Ghost Lander',
      siteName: 'Far Side South Pole / Schrödinger',
      region: 'far_side',
      coordinates: '75.3° S, 135.0° E',
      landingDate: '2026',
      status: 'Far Side Orbit & Surface Comms',
      statusColor: '#a855f7',
      payloadMass: '135 kg + Lunar Pathfinder Relay',
      launchVehicle: 'SpaceX Falcon 9',
      siteMatchId: null,
      description: 'Deploying the ESA Lunar Pathfinder communications relay satellite into lunar orbit before touching down on the lunar far side.',
      instruments: ['Lunar Pathfinder (Data Relay Satellite)', 'LuSEE-Night (Dark Ages Radio Astronomy)', 'User Surface Terminal']
    }
  ];

  const filteredMissions = clpsDeliveries.filter(m => {
    if (filterRegion === 'all') return true;
    return m.region === filterRegion;
  });

  const handleFlyToSite = (siteMatchId) => {
    soundFX.playClick();
    if (siteMatchId && onSelectSite) {
      const target = LANDING_SITES.find(s => s.id === siteMatchId);
      if (target) onSelectSite(target);
    }
    if (setCameraMode) setCameraMode('orbital');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(2, 4, 8, 0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      {/* Modal Container */}
      <div
        style={{
          width: 'min(96vw, 1320px)',
          height: 'min(92vh, 920px)',
          background: 'linear-gradient(180deg, #090d16 0%, #030408 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 32px 100px rgba(0, 0, 0, 0.95), 0 0 60px rgba(56, 189, 248, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Google Sans', sans-serif",
          color: '#ffffff'
        }}
      >
        {/* ─── 1. MODAL TOP HEADER (NASA Brand & Tabs) ─── */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(12, 17, 28, 0.92) 0%, rgba(6, 9, 16, 0.96) 100%)'
          }}
        >
          {/* Brand Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* NASA Meatball Minimalist Mark */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#0b3d91',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px',
                letterSpacing: '1px',
                color: '#fc3d21'
              }}
            >
              NASA
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Commercial Lunar Payload Services (CLPS) Deliveries
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    borderRadius: '999px',
                    letterSpacing: '0.04em'
                  }}
                >
                  OFFICIAL PORTAL
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                NASA Science Mission Directorate (SMD) • Lunar Discovery and Exploration Program
              </p>
            </div>
          </div>

          {/* Center View Selector Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '3px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('live_nasa');
              }}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '9px',
                border: activeTab === 'live_nasa' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                fontFamily: "'Google Sans', sans-serif",
                background: activeTab === 'live_nasa' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(2, 132, 199, 0.35) 100%)' : 'transparent',
                color: activeTab === 'live_nasa' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              🌐 Live NASA Interactive 3D Portal
            </button>
            <button
              onClick={() => {
                soundFX.playClick();
                setActiveTab('missions_grid');
              }}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '9px',
                border: activeTab === 'missions_grid' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                fontFamily: "'Google Sans', sans-serif",
                background: activeTab === 'missions_grid' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(2, 132, 199, 0.35) 100%)' : 'transparent',
                color: activeTab === 'missions_grid' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              🚀 Official Deliveries Manifest ({clpsDeliveries.length})
            </button>
          </div>

          {/* Actions Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="https://www.nasa.gov/commercial-lunar-payload-services/clps-landing-sites/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#38bdf8',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Open direct NASA web page in new browser window"
            >
              <span>NASA.gov</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            <button
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ─── 2. TAB CONTENT ─── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* TAB A: LIVE NASA 3D INTERACTIVE VIEW */}
          {activeTab === 'live_nasa' && (
            <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000000' }}>
              <iframe
                src="https://www.nasa.gov/commercial-lunar-payload-services/clps-landing-sites/"
                title="NASA CLPS Landing Sites 3D Interactive"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block'
                }}
                allow="fullscreen; accelerometer; gyroscope"
                onError={() => setIframeError(true)}
              />

              {/* Bottom Quick Jump Bar to Moon Simulation */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.92)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '14px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8)'
                }}
              >
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Explore these same landing sites in our real-time 3D ephemeris engine:
                </span>
                <button
                  onClick={() => handleFlyToSite('malapert-massif')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    cursor: 'pointer'
                  }}
                >
                  Malapert Massif (IM-1)
                </button>
                <button
                  onClick={() => handleFlyToSite('shackleton-connecting-ridge')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    cursor: 'pointer'
                  }}
                >
                  Shackleton Ridge (IM-2)
                </button>
                <button
                  onClick={() => handleFlyToSite('mons-mouton')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    cursor: 'pointer'
                  }}
                >
                  Mons Mouton (VIPER)
                </button>
              </div>
            </div>
          )}

          {/* TAB B: OFFICIAL DELIVERIES MANIFEST GRID */}
          {activeTab === 'missions_grid' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                padding: '24px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              {/* Region Filter Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'all', label: 'All CLPS Deliveries' },
                    { id: 'south_pole', label: '🌕 Lunar South Pole (Artemis)' },
                    { id: 'near_side', label: '🌓 Lunar Near Side Basins' },
                    { id: 'far_side', label: '🌑 Lunar Far Side (Schrödinger)' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        soundFX.playClick();
                        setFilterRegion(f.id);
                      }}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '999px',
                        border: filterRegion === f.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: filterRegion === f.id ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                        color: filterRegion === f.id ? '#38bdf8' : '#cbd5e1',
                        cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Showing {filteredMissions.length} Official NASA Delivery Missions
                </span>
              </div>

              {/* Mission Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '16px'
                }}
              >
                {filteredMissions.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: 'linear-gradient(180deg, rgba(14, 18, 28, 0.75) 0%, rgba(7, 10, 16, 0.9) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'border-color 0.2s ease, transform 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    {/* Top Tag & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          color: '#e2e8f0',
                          letterSpacing: '0.02em'
                        }}
                      >
                        {m.contractor}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: m.statusColor
                        }}
                      >
                        ● {m.status}
                      </span>
                    </div>

                    {/* Title & Lander */}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                        {m.title}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px', fontWeight: 600 }}>
                        Lander Vehicle: {m.lander} • {m.launchVehicle}
                      </div>
                    </div>

                    {/* Destination & Coordinates */}
                    <div
                      style={{
                        background: 'rgba(4, 6, 12, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Landing Location:</span>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{m.siteName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Coordinates:</span>
                        <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{m.coordinates}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Payload Delivery:</span>
                        <span style={{ color: '#e2e8f0' }}>{m.payloadMass}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      {m.description}
                    </p>

                    {/* Instruments List */}
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Key Science Instruments:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {m.instruments.map((inst, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '4px',
                              color: '#cbd5e1'
                            }}
                          >
                            {inst}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    {m.siteMatchId && (
                      <button
                        onClick={() => handleFlyToSite(m.siteMatchId)}
                        style={{
                          marginTop: 'auto',
                          padding: '10px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(3, 105, 161, 0.3) 100%)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>TARGET ON MOON GLOBE</span>
                        <span>🎯</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
