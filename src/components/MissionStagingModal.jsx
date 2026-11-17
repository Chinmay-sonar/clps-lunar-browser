import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';
import { LANDING_SITES } from '../data/landingSites';

export default function MissionStagingModal({
  isOpen,
  onClose,
  activeVehicle,
  setActiveVehicle,
  currentSimDate,
  setCurrentSimDate,
  selectedSite,
  setSelectedSite,
  onLaunchJourney
}) {
  const [customVehicle, setCustomVehicle] = useState({
    name: 'CUSTOM POLAR EXPLORER',
    massKg: 380,
    heightM: 2.2,
    solarWatts: 500,
    drillDepthM: 1.5,
    payloadPurpose: 'Volatile In-Situ Analysis & Cryogenic PSR Prospecting',
    modelFileName: ''
  });

  const [launchEarthDate, setLaunchEarthDate] = useState('2026-11-26');
  const [transitSpeedKps, setTransitSpeedKps] = useState(10.8); // km/s (TLI nominal)
  const [transitDays, setTransitDays] = useState(4.2); // ~100.8 hours

  if (!isOpen) return null;

  // Calculate Lunar Arrival Date from Earth Launch Date
  const launchEpoch = new Date(launchEarthDate + 'T12:00:00Z').getTime();
  const arrivalEpoch = launchEpoch + transitDays * 24 * 3600 * 1000;
  const arrivalDateStr = new Date(arrivalEpoch).toISOString().slice(0, 10);

  const vehicleCatalog = [
    {
      id: 'viper',
      name: 'NASA VIPER ROVER',
      role: 'Volatiles Investigating Polar Exploration Rover',
      massKg: 430,
      heightM: 2.5,
      dimensions: '1.5m × 1.5m × 2.5m',
      powerSource: 'Vertical Mast Solar Array (450W Peak)',
      sciencePayloads: 'TRIDENT 1m Drill, NIRVSS, MSolo, NSS Neutron Spectrometer',
      speedKmh: '0.72 km/h (0.2 m/s)',
      thermalClass: 'Cryogenic PSR Survival (Gold MLI Blankets + Internal Heaters)',
      purpose: 'Ground-truth ice water prospecting inside permanently shadowed cold traps at Nobile and Shackleton rims.'
    },
    {
      id: 'griffin',
      name: 'ASTROBOTIC GRIFFIN LANDER',
      role: 'CLPS Mission 1 Commercial Heavy Delivery Platform',
      massKg: 500, // payload mass
      heightM: 2.5,
      dimensions: '4.5m base diameter × 2.5m height',
      powerSource: 'Perimeter Solar Cells + 4 Li-Ion Battery Banks',
      sciencePayloads: 'VIPER Egress Ramps, NDL Doppler LiDAR, Hazard Detection Cameras',
      speedKmh: 'Terminal Descent @ 1.2 m/s vertical',
      thermalClass: 'Active Thermal Louvers + 24K Gold Multi-Layer Insulation',
      purpose: 'Deliver VIPER and heavy scientific payloads to the Moon’s South Pole with precision hazard-relative descent.'
    },
    {
      id: 'nova-c',
      name: 'INTUITIVE MACHINES NOVA-C',
      role: 'CLPS Hexagonal Methalox Delivery Lander',
      massKg: 130, // payload mass
      heightM: 3.0,
      dimensions: '1.5m diameter cylinder × 3.0m height',
      powerSource: 'Body-Mounted Silicon Arrays (780W)',
      sciencePayloads: 'PRIME-1 Ice Drill, MSolo Mass Spectrometer, Laser Retroreflector',
      speedKmh: 'Terminal Descent @ 1.0 m/s',
      thermalClass: 'Liquid Methane/LOX cryogenic boil-off management',
      purpose: 'Targeted delivery to Shackleton Connecting Ridge or Malapert Massif for commercial in-situ lunar science.'
    },
    {
      id: 'custom-uyor',
      name: 'UPLOAD YOUR ROVER',
      role: 'Custom 3D Lunar Surface Explorer',
      massKg: 380,
      heightM: 2.2,
      dimensions: '2.0m × 1.6m × 2.2m',
      powerSource: 'Bifacial Solar Wing Arrays (500W)',
      sciencePayloads: 'Custom Scientific Sensors & Surface Prospecting Modules',
      speedKmh: '0.90 km/h (0.25 m/s)',
      thermalClass: 'Cryogenic PSR Multi-Layer Blanket Insulation',
      purpose: 'User-uploaded .GLB/.GLTF 3D rover model for custom polar navigation.'
    }
  ];

  const selectedVehicleData = vehicleCatalog.find(v => v.id === activeVehicle) || vehicleCatalog[0];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (typeof window !== 'undefined') window.__CUSTOM_ROVER_URL__ = url;
      setCustomVehicle(prev => ({
        ...prev,
        modelFileName: file.name,
        file,
        url
      }));
      soundFX.playClick();
    }
  };

  const handleCommitMission = () => {
    soundFX.playClick();
    if (typeof setCurrentSimDate === 'function') {
      setCurrentSimDate(new Date(arrivalEpoch));
    }
    onClose();
    if (onLaunchJourney) {
      onLaunchJourney({
        vehicle: selectedVehicleData,
        customRover: customVehicle.file,
        customRoverUrl: customVehicle.url || (typeof window !== 'undefined' ? window.__CUSTOM_ROVER_URL__ : null),
        launchDate: new Date(launchEpoch),
        arrivalDate: new Date(arrivalEpoch),
        transitDays,
        site: selectedSite
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(3, 5, 8, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '1100px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        background: 'linear-gradient(180deg, #090d16 0%, #030408 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 32px 100px rgba(0, 0, 0, 0.95), 0 0 60px rgba(56, 189, 248, 0.08)',
        overflow: 'hidden',
        fontFamily: "'Google Sans', sans-serif"
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
            <div className="sub-tag" style={{ letterSpacing: '0.14em', color: '#94a3b8' }}>
              NASA ARTEMIS III & CLPS MISSION ARCHITECTURE
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: 400,
              color: '#ffffff',
              letterSpacing: '-0.015em',
              marginTop: '2px'
            }}>
              Vehicle Manifest, Specifications & Transit Calculator
            </h2>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="btn-minimal"
            style={{ width: '30px', height: '30px', padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Content Body: Two-Column Split (Vehicle Selection / Trajectory Calculation) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '24px'
        }}>
          {/* Column 1: Robotic Platform & Payload Specification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              1. Select Delivery & Surface Exploration Hardware
            </div>

            {/* Vehicle Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {vehicleCatalog.map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    soundFX.playClick();
                    setActiveVehicle(v.id);
                  }}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    background: activeVehicle === v.id ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                    color: activeVehicle === v.id ? '#050608' : 'var(--text-secondary)',
                    border: '1px solid ' + (activeVehicle === v.id ? '#ffffff' : 'var(--border-hairline)'),
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.62rem',
                    fontWeight: activeVehicle === v.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {v.id === 'viper' ? 'VIPER ROVER' : v.id === 'griffin' ? 'GRIFFIN' : v.id === 'nova-c' ? 'NOVA-C' : 'CUSTOM 3D'}
                </button>
              ))}
            </div>

            {/* Detailed Vehicle Specification Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <span className="sub-tag" style={{ color: '#38bdf8' }}>{selectedVehicleData.role}</span>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  fontWeight: 400,
                  color: '#ffffff',
                  marginTop: '2px'
                }}>
                  {selectedVehicleData.name}
                </h3>
                <p style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                  marginTop: '6px',
                  fontFamily: 'var(--font-sans)'
                }}>
                  {selectedVehicleData.purpose}
                </p>
              </div>

              {/* Grid Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px', borderRadius: '5px' }}>
                  <div className="sub-tag">WET / PAYLOAD MASS</div>
                  <div className="mono-val" style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>
                    {selectedVehicleData.massKg} kg
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px', borderRadius: '5px' }}>
                  <div className="sub-tag">ENVELOPE DIMENSIONS</div>
                  <div className="mono-val" style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>
                    {selectedVehicleData.dimensions}
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px', borderRadius: '5px' }}>
                  <div className="sub-tag">POWER GENERATION</div>
                  <div className="mono-val" style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                    {selectedVehicleData.powerSource}
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px', borderRadius: '5px' }}>
                  <div className="sub-tag">SURFACE PROPULSION / SPEED</div>
                  <div className="mono-val" style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                    {selectedVehicleData.speedKmh}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 10px', borderRadius: '5px' }}>
                <div className="sub-tag">SCIENCE SUITE & INSTRUMENTATION</div>
                <div style={{ fontSize: '0.72rem', color: '#e2e8f0', marginTop: '3px', fontFamily: 'var(--font-sans)' }}>
                  {selectedVehicleData.sciencePayloads}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Launch Trajectory & Earth-Moon Journey Calculator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              2. Earth-to-Moon Trajectory & Timeline Estimation
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {/* Earth Launch Date Input */}
              <div>
                <label className="sub-tag" style={{ display: 'block', marginBottom: '6px' }}>
                  EARTH DEPARTURE DATE (KENNEDY SPACE CENTER)
                </label>
                <input
                  type="date"
                  value={launchEarthDate}
                  min="2026-01-01"
                  max="2030-12-31"
                  onChange={(e) => setLaunchEarthDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Transit Speed & Duration Sliders */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="sub-tag">TRANS-LUNAR INJECTION VELOCITY (TLI)</span>
                  <span className="mono-val" style={{ color: '#38bdf8', fontSize: '0.75rem' }}>{transitSpeedKps} km/s</span>
                </div>
                <input
                  type="range"
                  min="10.2"
                  max="11.4"
                  step="0.1"
                  value={transitSpeedKps}
                  onChange={(e) => {
                    const spd = parseFloat(e.target.value);
                    setTransitSpeedKps(spd);
                    // Higher speed reduces transit days from 4.8 down to 3.5 days
                    const days = Number((4.2 * (10.8 / spd)).toFixed(1));
                    setTransitDays(days);
                  }}
                />
              </div>

              {/* Transit Breakdown Table */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TRANSIT DURATION:</span>
                  <span className="mono-val" style={{ color: '#ffffff', fontWeight: 600 }}>
                    {transitDays} DAYS ({(transitDays * 24).toFixed(0)} HOURS)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>POLAR ORBIT INSERTION (LOI):</span>
                  <span className="mono-val" style={{ color: '#34d399', fontWeight: 600 }}>
                    {arrivalDateStr} 06:00 UTC
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TARGET CANDIDATE SITE:</span>
                  <span className="mono-val" style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {selectedSite.name.split(' (')[0]}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOPOGRAPHIC ELEVATION DATUM:</span>
                  <span className="mono-val" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    +{selectedSite.elevationMeters} METERS
                  </span>
                </div>
              </div>

              {/* Target Landing Site Selector Dropdown */}
              <div>
                <label className="sub-tag" style={{ display: 'block', marginBottom: '6px' }}>
                  ASSIGN POLAR LANDING TARGET
                </label>
                <select
                  value={selectedSite.id}
                  onChange={(e) => {
                    const site = LANDING_SITES.find(s => s.id === e.target.value);
                    if (site) setSelectedSite(site);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#090d15',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem'
                  }}
                >
                  {LANDING_SITES.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} • Elevation: +{s.elevationMeters}m
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Launch CTA */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <button
                onClick={handleCommitMission}
                className="btn-action-primary"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer'
                }}
              >
                <span>CONFIRM MANIFEST & ENTER MISSION ARENA</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
