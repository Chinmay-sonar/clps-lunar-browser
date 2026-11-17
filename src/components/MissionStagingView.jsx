import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';
import { LANDING_SITES } from '../data/landingSites';

export default function MissionStagingView({
  activeVehicle,
  onSelectVehicle,
  currentSimDate,
  onSelectDate,
  selectedSite,
  onSelectSite,
  onProceedToGlobe,
  onBackToIntro,
  onBackToHome
}) {
  const [customVehicle, setCustomVehicle] = useState({
    name: 'CUSTOM POLAR ROVER & PAYLOAD',
    massKg: 380,
    heightM: 2.2,
    solarWatts: 500,
    drillDepthM: 1.5,
    payloadPurpose: 'Volatile In-Situ Analysis & Cryogenic PSR Prospecting',
    modelFileName: ''
  });

  const [launchEarthDate, setLaunchEarthDate] = useState('2026-11-26');
  const [transitSpeedKps, setTransitSpeedKps] = useState(10.8); // km/s (TLI nominal)
  const transitDays = 4.2; // ~100.8 hours

  // Calculate Lunar Arrival Date from Earth Launch Date
  const launchEpoch = new Date(launchEarthDate + 'T12:00:00Z').getTime();
  const arrivalEpoch = launchEpoch + transitDays * 24 * 3600 * 1000;
  const arrivalDate = new Date(arrivalEpoch);
  const arrivalDateStr = arrivalDate.toISOString().slice(0, 10);

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
      massKg: 500,
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
      massKg: 130,
      heightM: 3.0,
      dimensions: '1.5m diameter cylinder × 3.0m height',
      powerSource: 'Body-Mounted Silicon Arrays (780W)',
      sciencePayloads: 'PRIME-1 Ice Drill, MSolo Mass Spectrometer, Laser Retroreflector',
      speedKmh: 'Terminal Descent @ 1.0 m/s',
      thermalClass: 'Liquid Methane/LOX cryogenic boil-off management',
      purpose: 'Targeted delivery to Shackleton Connecting Ridge or Malapert Massif for commercial in-situ lunar science.'
    },
    {
      id: 'custom',
      name: customVehicle.name,
      role: 'User-Defined Robotic Expedition Package',
      massKg: customVehicle.massKg,
      heightM: customVehicle.heightM,
      dimensions: `${(customVehicle.heightM * 0.7).toFixed(1)}m × ${(customVehicle.heightM * 0.7).toFixed(1)}m × ${customVehicle.heightM}m`,
      powerSource: `Gallium-Arsenide Array (${customVehicle.solarWatts}W Peak)`,
      sciencePayloads: `In-Situ Deep Core Drill (${customVehicle.drillDepthM}m), Multi-Spectral Imagers`,
      speedKmh: '0.80 km/h (Autonomous Pathfinding)',
      thermalClass: 'Ultra-low temperature aerogel & multi-layer gold thermal barrier',
      purpose: customVehicle.payloadPurpose
    }
  ];

  const selectedVehicleData = vehicleCatalog.find(v => v.id === activeVehicle) || vehicleCatalog[0];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomVehicle(prev => ({
        ...prev,
        modelFileName: file.name
      }));
      soundFX.playClick();
    }
  };

  const handleConfirmAndProceed = () => {
    soundFX.playClick();
    if (onSelectDate) onSelectDate(arrivalDate);
    if (onProceedToGlobe) {
      onProceedToGlobe({
        vehicle: selectedVehicleData,
        launchDate: new Date(launchEpoch),
        arrivalDate,
        site: selectedSite
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'radial-gradient(circle at 50% 15%, rgba(56, 189, 248, 0.05) 0%, #030508 70%)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      padding: '28px 36px',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box'
    }}>
      {/* Top Header Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-hairline)',
        paddingBottom: '16px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBackToHome && (
            <button
              onClick={() => {
                soundFX.playClick();
                onBackToHome();
              }}
              style={{
                background: 'rgba(235, 80, 80, 0.1)',
                border: '1px solid rgba(235, 80, 80, 0.35)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Return to GRU Space Landing Page"
            >
              <span style={{ color: '#eb5050' }}>←</span>
              <span>GRU.SPACE</span>
            </button>
          )}

          {onBackToIntro && (
            <button
              onClick={() => {
                soundFX.playClick();
                onBackToIntro();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: 'var(--text-secondary)',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>←</span>
              <span>PROLOGUE</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8'
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.64rem',
              letterSpacing: '0.12em',
              color: '#38bdf8',
              fontWeight: 600
            }}>
              STAGE 01 // MISSION MANIFEST & EARTH DEPARTURE STAGING
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            EARTH LAUNCH WINDOW: NOV 2026 – DEC 2026
          </span>
        </div>
      </div>

      {/* Hero Title Section */}
      <div style={{ maxWidth: '980px', marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          marginBottom: '8px',
          lineHeight: 1.15
        }}>
          Configure Flight Hardware & Trajectory Parameters
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          maxWidth: '780px'
        }}>
          Select delivery landers, robotic surface prospection vehicles, Earth departure schedules, and Trans-Lunar Injection (TLI) velocity vectors to stage the mission before entering lunar orbit.
        </p>
      </div>

      {/* Main Grid: Hardware Selection (Left) & Trajectory Calculator (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: '24px',
        maxWidth: '1380px',
        width: '100%',
        marginBottom: '32px'
      }}>
        {/* LEFT COLUMN: Vehicle Manifest & Catalog */}
        <div style={{
          background: 'rgba(8, 12, 18, 0.75)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              1. SELECT FLIGHT HARDWARE PLATFORM
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#38bdf8' }}>
              4 VEHICLES REGISTERED
            </span>
          </div>

          {/* Vehicle Segmented Selector Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { id: 'viper', label: 'VIPER ROVER', tag: 'ROVER' },
              { id: 'griffin', label: 'GRIFFIN', tag: 'LANDER' },
              { id: 'nova-c', label: 'NOVA-C', tag: 'LANDER' },
              { id: 'custom', label: 'CUSTOM 3D', tag: 'BUILDER' }
            ].map(v => {
              const isSelected = activeVehicle === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    soundFX.playClick();
                    onSelectVehicle(v.id);
                  }}
                  style={{
                    background: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-hairline)',
                    borderRadius: '8px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.54rem',
                    color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                    letterSpacing: '0.05em'
                  }}>
                    {v.tag}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                  }}>
                    {v.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Vehicle Detailed Engineering Specs Sheet */}
          <div style={{
            background: 'rgba(5, 7, 11, 0.85)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ color: '#38bdf8', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedVehicleData.role}
                </span>
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                color: '#ffffff',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                margin: 0
              }}>
                {selectedVehicleData.name}
              </h3>
              <p style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                margin: '6px 0 0 0'
              }}>
                {selectedVehicleData.purpose}
              </p>
            </div>

            {/* Spec Matrix Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              borderTop: '1px solid var(--border-hairline)',
              paddingTop: '12px'
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  MASS (WET / PAYLOAD)
                </div>
                <div style={{ fontSize: '0.86rem', fontFamily: 'var(--font-mono)', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
                  {selectedVehicleData.massKg} kg
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  ENVELOPE DIMENSIONS
                </div>
                <div style={{ fontSize: '0.86rem', fontFamily: 'var(--font-mono)', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
                  {selectedVehicleData.dimensions}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  POWER GENERATION
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: 600, marginTop: '2px' }}>
                  {selectedVehicleData.powerSource}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  SURFACE MOBILITY
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                  {selectedVehicleData.speedKmh}
                </div>
              </div>
            </div>

            {/* Science Suite */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '6px',
              padding: '10px 12px'
            }}>
              <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                INTEGRATED SCIENCE PAYLOAD & SUITE
              </div>
              <div style={{ fontSize: '0.74rem', color: '#e2e8f0' }}>
                {selectedVehicleData.sciencePayloads}
              </div>
            </div>

            {/* Custom 3D Model Uploader Panel if Custom Vehicle Selected */}
            {activeVehicle === 'custom' && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.04)',
                border: '1px dashed rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 600 }}>
                    INCLUDE CUSTOM 3D MESH MODEL (.GLB / .GLTF / .OBJ)
                  </span>
                  {customVehicle.modelFileName && (
                    <span style={{ fontSize: '0.6rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      ✓ {customVehicle.modelFileName}
                    </span>
                  )}
                </div>

                <label style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#ffffff'
                }}>
                  <span>SELECT 3D ASSET FILE</span>
                  <input
                    type="file"
                    accept=".glb,.gltf,.obj"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', display: 'block' }}>MASS (KG)</span>
                    <input
                      type="number"
                      value={customVehicle.massKg}
                      onChange={(e) => setCustomVehicle(p => ({ ...p, massKg: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-hairline)',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', display: 'block' }}>HEIGHT (M)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={customVehicle.heightM}
                      onChange={(e) => setCustomVehicle(p => ({ ...p, heightM: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-hairline)',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', display: 'block' }}>POWER (WATTS)</span>
                    <input
                      type="number"
                      value={customVehicle.solarWatts}
                      onChange={(e) => setCustomVehicle(p => ({ ...p, solarWatts: Number(e.target.value) }))}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-hairline)',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Trajectory & Earth Departure Parameters */}
        <div style={{
          background: 'rgba(8, 12, 18, 0.75)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                2. EARTH DEPARTURE & TLI TRANSIT CALCULATOR
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#10b981' }}>
                JPL HORIZONS SYNCED
              </span>
            </div>

            {/* Earth Departure Date Picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                EARTH DEPARTURE DATE (KENNEDY SPACE CENTER LAUNCHPAD 39B)
              </label>
              <input
                type="date"
                value={launchEarthDate}
                onChange={(e) => setLaunchEarthDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(5, 7, 11, 0.95)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* TLI Velocity Slider */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                  TRANS-LUNAR INJECTION (TLI) VELOCITY
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
                  {transitSpeedKps.toFixed(1)} km/s
                </span>
              </div>
              <input
                type="range"
                min="10.5"
                max="11.2"
                step="0.1"
                value={transitSpeedKps}
                onChange={(e) => setTransitSpeedKps(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            {/* Calculated Transit Telemetry Summary Box */}
            <div style={{
              background: 'rgba(5, 7, 11, 0.85)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>TRANSIT DURATION:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{transitDays} DAYS (100.8 HOURS)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>LUNAR ORBIT INSERTION (LOI):</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>{arrivalDateStr} 18:00 UTC</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>ASSIGNED POLAR TARGET:</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{selectedSite ? selectedSite.name.split(' (')[0] : 'Malapert Mountain'}</span>
              </div>
            </div>

            {/* Candidate Landing Site Dropdown */}
            <div style={{ marginTop: '16px' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                TARGET CANDIDATE LANDING SITE
              </label>
              <select
                value={selectedSite ? selectedSite.id : 'malapert-massif'}
                onChange={(e) => {
                  const target = LANDING_SITES.find(s => s.id === e.target.value);
                  if (target) onSelectSite(target);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(5, 7, 11, 0.95)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              >
                {LANDING_SITES.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} • Elevation: +{s.elevationMeters}m • Illum: {s.illumination?.peak ?? s.illuminationPct ?? 90}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Confirm Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
            <button
              onClick={handleConfirmAndProceed}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#030508',
                border: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>CONFIRM MANIFEST & EXPLORE 3D MOON GLOBE</span>
              <span style={{ fontSize: '0.9rem' }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
