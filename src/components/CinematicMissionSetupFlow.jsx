import React, { useState, useMemo } from 'react';
import { soundFX } from '../utils/soundFX';
import { LANDING_SITES } from '../data/landingSites';
import CodyseeyHandwrittenLogo from './CodyseeyHandwrittenLogo';
import { NasaSpaceAppsOfficialLogo, OriginalVerticalDivider } from './CodyseeyPreloaderHero';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CINEMATIC MISSION SETUP & EXPEDITION STAGING STUDIO
 * ═══════════════════════════════════════════════════════════════════════════
 * Interactive pre-flight mission configurator before entering the 3D Moon Browser:
 * 1. Target Landing Site Selection (Illumination, elevation, PSR cold traps)
 * 2. Surface Exploration Platform (NASA VIPER Rover, Griffin Lander, Nova-C)
 * 3. In-Situ Resource & Mineral Extraction Target (Water Ice, Ilmenite, Silicon, He-3)
 * 4. Launch Window, Trajectory (TLI) & Lunar Arrival Ephemeris
 * 5. Synthesized Flight Dossier & High-Energy Orbital Insertion Launch
 */

export const MINERAL_TARGETS = [
  {
    id: 'water-ice',
    name: 'Cryogenic Water Ice (H₂O) & Volatiles',
    symbol: 'H₂O ICE',
    icon: '💧',
    color: '#38bdf8',
    category: 'TIER-1 CRITICAL ISRU',
    geologicalDepth: '0.1m – 1.0m (PSR Micro-Cold Traps)',
    purityYield: '98.4% Pure Hydrolox Equivalent',
    primaryUtility: 'Propellant electrolysis (Liquid H₂ / LOX) for return vehicles and life-support drinking water & breathing oxygen.',
    instrumentSuite: 'TRIDENT 1m Rotary-Percussive Drill + MSolo Mass Spectrometer + NIRVSS',
    harvestMechanism: 'Cryogenic auger drilling into shadowed regolith followed by sealed thermal sublimation desorption.'
  },
  {
    id: 'ilmenite-oxygen',
    name: 'Regolith Ilmenite (FeTiO₃) & Metallic Iron',
    symbol: 'FeTiO₃',
    icon: '⛏️',
    color: '#f59e0b',
    category: 'ATMOSPHERE & METALS',
    geologicalDepth: '0.0m – 0.5m (Basaltic Mare / Highland Boundary)',
    purityYield: '14.2 wt% FeO / 8.5 wt% TiO₂',
    primaryUtility: 'High-yield carbothermal reduction producing breathable O₂ gas and pure sintered titanium/iron structural alloys.',
    instrumentSuite: 'Multi-Spectral Vis-NIR Imager + Alpha Particle X-Ray Spectrometer (APXS)',
    harvestMechanism: 'Continuous surface regolith scoop extraction routed to methane/hydrogen reduction sintering reactor.'
  },
  {
    id: 'silicon-solar',
    name: 'Photovoltaic Silicon & Sintered Solar Glass',
    symbol: 'SiO₂ / Si',
    icon: '⚡',
    color: '#34d399',
    category: 'PERMANENT ENERGY GRID',
    geologicalDepth: '0.0m – 0.3m (Anorthositic Regolith Blanket)',
    purityYield: '45.0 wt% Silicon Dioxide (SiO₂)',
    primaryUtility: 'In-situ manufacturing of thin-film solar arrays and molten regolith power cable conduits for the South Pole micro-grid.',
    instrumentSuite: 'X-ray Fluorescence Spectrometer + Focused Laser Sintering Head',
    harvestMechanism: 'High-temperature thermal vacuum reduction of silica yielding elemental semiconductor-grade silicon.'
  },
  {
    id: 'helium-3',
    name: 'Solar-Wind Trapped Helium-3 (³He)',
    symbol: '³He',
    icon: '⚛️',
    color: '#a855f7',
    category: 'CLEAN FUSION ENERGY',
    geologicalDepth: '0.5m – 2.0m (Unweathered Deep Beds)',
    purityYield: '0.015 ppm Yield @ 600°C Desorption',
    primaryUtility: 'Strategic aneutronic fusion fuel with zero radioactive waste for long-term cislunar and terrestrial clean power.',
    instrumentSuite: 'Gas Chromatograph Mass Spectrometer + Pulsed Neutron Volatiles Detector',
    harvestMechanism: 'Vacuum induction heating of excavated lunar soil bed to 600°C releasing volatile noble gases.'
  },
  {
    id: 'stratigraphic-core',
    name: 'Cryogenic Stratigraphic Ejecta Core',
    symbol: 'CORE STRATA',
    icon: '🔬',
    color: '#ec4899',
    category: 'PLANETARY CHRONOLOGY',
    geologicalDepth: '1.0m – 1.8m (Unbroken Impact Strata)',
    purityYield: 'Pristine 4-Billion-Year Volatile Archive',
    primaryUtility: 'Decoding the ancient bombardment history of the inner solar system, early Earth water delivery, and comet impacts.',
    instrumentSuite: 'Hermetic Sample Return Canister + Cryogenic Storage Dewar (-230°C)',
    harvestMechanism: 'Rotary-coring drill bit with sealed vacuum sleeve preserving delicate cryogenic micro-ice lenses.'
  }
];

export const VEHICLE_OPTIONS = [
  {
    id: 'viper',
    name: 'NASA VIPER ROVER',
    tag: 'SURFACE ROVER',
    icon: '🚜',
    subtitle: 'Volatiles Investigating Polar Exploration Rover',
    massKg: 430,
    dimensions: '1.5m × 1.5m × 2.5m',
    powerSource: 'Vertical Solar Mast (450W Peak) + Cryogenic Li-Ion Pack',
    sciencePayloads: 'TRIDENT 1m Drill, NIRVSS, MSolo, NSS Neutron Spectrometer',
    speed: '0.72 km/h (Autonomous Pathfinding)',
    thermalLimits: '-240°C Cryogenic PSR Survival (Internal Gold Heaters)',
    description: 'NASA flagship prospecting rover engineered specifically to navigate the extreme boulder-strewn slopes and pitch-black permanent shadows of the lunar South Pole.'
  },
  {
    id: 'griffin',
    name: 'ASTROBOTIC GRIFFIN LANDER',
    tag: 'HEAVY DELIVERY LANDER',
    icon: '🚀',
    subtitle: 'Commercial Lunar Payload Services (CLPS) Delivery Bus',
    massKg: 500,
    dimensions: '4.5m Base Diameter × 2.5m Height',
    powerSource: 'Perimeter Gallium-Arsenide Arrays (800W) + Battery Banks',
    sciencePayloads: 'Dual VIPER Deployment Ramps, NDL Doppler LiDAR, Hazard Cam Array',
    speed: 'Supersonic Throttle Descent @ 1.2 m/s touchdown',
    thermalLimits: 'Active Thermal Radiator Louvers + 24-Layer Gold MLI',
    description: 'Heavy cargo lander capable of pinpoint automated propulsive touchdown on rugged crater rims, equipped with articulating egress ramps for rover release.'
  },
  {
    id: 'nova-c',
    name: 'INTUITIVE MACHINES NOVA-C',
    tag: 'METHALOX PRECISION LANDER',
    icon: '🛸',
    subtitle: 'Hexagonal Deep-Space Commercial Cargo Platform',
    massKg: 130,
    dimensions: '1.5m Hexagonal Diameter × 3.0m Height',
    powerSource: 'Body-Mounted High-Efficiency Silicon Solar Array (780W)',
    sciencePayloads: 'PRIME-1 Ice Drill, MSolo Mass Spectrometer, Laser Retroreflector Array',
    speed: 'Automated Terrain-Relative Navigation @ 1.0 m/s',
    thermalLimits: 'Liquid Methane / LOX Cryogenic Boil-Off Management',
    description: 'Agile methalox-powered lander designed for targeted high-precision delivery to narrow ridge crests with rapid commercial science payload deployment.'
  }
];

export default function CinematicMissionSetupFlow({
  selectedSite,
  onSelectSite,
  activeVehicle,
  onSelectVehicle,
  currentSimDate,
  onSelectDate,
  activeMineralTarget,
  onSelectMineralTarget,
  onLaunchExpedition,
  onReturnToBriefing
}) {
  // Stepper: 0 = Site, 1 = Vehicle, 2 = Mineral Target, 3 = Trajectory & Launch Date, 4 = Final Review Dossier
  const [activeStep, setActiveStep] = useState(0);
  const [isWarping, setIsWarping] = useState(false);

  // Earth Departure & Trajectory Parameters
  const [launchEarthDate, setLaunchEarthDate] = useState('2026-11-26');
  const [tliVelocityKps, setTliVelocityKps] = useState(10.8); // km/s
  const transitDays = useMemo(() => {
    // 10.8 km/s corresponds to ~4.2 days (~100.8 hrs)
    return parseFloat((45.36 / tliVelocityKps).toFixed(1));
  }, [tliVelocityKps]);

  // Computed Lunar Arrival Date
  const arrivalDate = useMemo(() => {
    const launchEpoch = new Date(launchEarthDate + 'T12:00:00Z').getTime();
    const arrivalEpoch = launchEpoch + transitDays * 24 * 3600 * 1000;
    return new Date(arrivalEpoch);
  }, [launchEarthDate, transitDays]);

  const currentSite = selectedSite || LANDING_SITES[0];
  const currentVehicle = VEHICLE_OPTIONS.find(v => v.id === activeVehicle) || VEHICLE_OPTIONS[0];
  const currentTarget = activeMineralTarget || MINERAL_TARGETS[0];

  const stepTitles = [
    { id: 0, tag: '01', title: 'TARGET SITE', sub: 'Lunar South Pole Landing Zone' },
    { id: 1, tag: '02', title: 'VEHICLE PLATFORM', sub: 'Rover & Delivery Lander' },
    { id: 2, tag: '03', title: 'ISRU OBJECTIVE', sub: 'Mineral & Resource Extraction' },
    { id: 3, tag: '04', title: 'TRAJECTORY', sub: 'TLI Burn & Solar Ephemeris' },
    { id: 4, tag: '05', title: 'FLIGHT DOSSIER', sub: 'Pre-Flight Manifest & Launch' }
  ];

  const handleStepClick = (stepIdx) => {
    soundFX.playClick();
    setActiveStep(stepIdx);
  };

  const handleNextStep = () => {
    soundFX.playTelemetry();
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    } else {
      handleFinalLaunch();
    }
  };

  const handlePrevStep = () => {
    soundFX.playClick();
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  const handleFinalLaunch = () => {
    soundFX.playRocketRumble();
    soundFX.playQuindarTone();
    setIsWarping(true);

    if (onSelectDate) onSelectDate(arrivalDate);

    // Cinematic warp sequence delay before landing on the 3D Moon globe
    setTimeout(() => {
      soundFX.playSuccessChime();
      if (onLaunchExpedition) {
        onLaunchExpedition({
          site: currentSite,
          vehicle: currentVehicle,
          mineralTarget: currentTarget,
          simDate: arrivalDate
        });
      }
    }, 1800);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100dvh',
      background: 'radial-gradient(ellipse at 50% 10%, rgba(14, 28, 54, 0.7) 0%, #030508 75%)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
      zIndex: 1000,
      boxSizing: 'border-box'
    }}>
      {/* ─── A. TOP AEROSPACE COMMAND HEADER ─── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 28px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 20
      }}>
        {/* Brand Lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CodyseeyHandwrittenLogo height={24} stretch={0.75} immediate={true} />
            <OriginalVerticalDivider height={18} visible={true} />
            <NasaSpaceAppsOfficialLogo height={28} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 12px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '999px',
            fontSize: '0.66rem',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#38bdf8'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
            <span>EXPEDITION CONFIGURATOR // STAGE 01</span>
          </div>
        </div>

        {/* Stepper Progress Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {stepTitles.map((st) => {
            const isCurrent = activeStep === st.id;
            const isCompleted = activeStep > st.id;
            return (
              <button
                key={st.id}
                onClick={() => handleStepClick(st.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: isCurrent
                    ? '1px solid #38bdf8'
                    : isCompleted
                      ? '1px solid rgba(52, 211, 153, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.07)',
                  background: isCurrent
                    ? 'rgba(56, 189, 248, 0.16)'
                    : isCompleted
                      ? 'rgba(52, 211, 153, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                  color: isCurrent ? '#ffffff' : isCompleted ? '#34d399' : 'rgba(255, 255, 255, 0.45)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{
                  fontSize: '0.58rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: isCurrent ? '#38bdf8' : isCompleted ? '#34d399' : 'rgba(255, 255, 255, 0.3)'
                }}>
                  {st.tag}
                </span>
                <span>{st.title}</span>
              </button>
            );
          })}
        </div>

        {/* Return to Trailer / Briefing (Optional) */}
        {onReturnToBriefing && (
          <button
            onClick={() => {
              soundFX.playClick();
              onReturnToBriefing();
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '999px',
              padding: '5px 12px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            ← Briefing Teaser
          </button>
        )}
      </header>

      {/* ─── B. MAIN INTERACTIVE CONFIGURATION STUDIO ─── */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1.45fr 0.95fr',
        gap: '24px',
        padding: '24px 32px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
        {/* LEFT COLUMN: ACTIVE STEP OPTIONS & CONTROLS */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Step Header */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.68rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#38bdf8',
              letterSpacing: '0.1em',
              marginBottom: '6px'
            }}>
              <span>STEP {activeStep + 1} OF 5</span>
              <span>•</span>
              <span>{stepTitles[activeStep].sub.toUpperCase()}</span>
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 500,
              color: '#ffffff',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              {activeStep === 0 && 'Select Primary Landing Zone'}
              {activeStep === 1 && 'Select Exploration Platform & Hardware'}
              {activeStep === 2 && 'Select In-Situ Mineral & Resource Extraction Target'}
              {activeStep === 3 && 'Configure Launch Window & Trajectory'}
              {activeStep === 4 && 'Pre-Flight Dossier Verification & Launch'}
            </h2>
            <p style={{
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
              lineHeight: 1.5,
              maxWidth: '720px'
            }}>
              {activeStep === 0 && 'Target high-illumination mountain massifs or volatile-rich permanent cold traps along the lunar South Pole.'}
              {activeStep === 1 && 'Deploy NASA VIPER with sub-surface ice drilling capability, or select commercial CLPS heavy payload delivery landers.'}
              {activeStep === 2 && 'Choose the core scientific in-situ resource utilization (ISRU) goal for this polar deployment.'}
              {activeStep === 3 && 'Simulate Earth departure, trans-lunar injection (TLI) velocity vectors, and calculate exact lunar arrival ephemeris.'}
              {activeStep === 4 && 'Review flight manifest parameters before initiating orbital insertion into the 3D Moon Browser.'}
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 0: LANDING SITE CARDS GRID */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeStep === 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px'
            }}>
              {LANDING_SITES.map((site) => {
                const isSelected = currentSite.id === site.id;
                const latStr = `${Math.abs(site.lat).toFixed(2)}° S`;
                const lonStr = `${site.lon.toFixed(2)}° E`;
                const illum = site.illuminationPct || 85.0;

                return (
                  <div
                    key={site.id}
                    onClick={() => {
                      soundFX.playClick();
                      if (onSelectSite) onSelectSite(site);
                    }}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(10, 14, 22, 0.75)',
                      border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isSelected ? '0 12px 32px rgba(56, 189, 248, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.4)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '0.62rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.45)',
                        letterSpacing: '0.05em'
                      }}>
                        NASA CLPS CANDIDATE
                      </span>
                      {isSelected && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.62rem',
                          color: '#34d399',
                          fontWeight: 700
                        }}>
                          ● SELECTED
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 style={{
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: isSelected ? '#ffffff' : '#e2e8f0',
                        margin: '0 0 4px 0'
                      }}>
                        {site.name}
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.68rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: 'rgba(255, 255, 255, 0.55)'
                      }}>
                        <span>{latStr}, {lonStr}</span>
                        <span>•</span>
                        <span>+{site.elevationM || 5040}m ELEV</span>
                      </div>
                    </div>

                    {/* Solar Illumination Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '4px' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Solar Persistence:</span>
                        <span style={{ color: illum > 85 ? '#34d399' : '#38bdf8', fontWeight: 600 }}>{illum}%</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${illum}%`,
                          height: '100%',
                          background: illum > 85 ? 'linear-gradient(90deg, #38bdf8, #34d399)' : '#38bdf8',
                          borderRadius: '2px'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 1: VEHICLE / HARDWARE PLATFORM CARDS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {VEHICLE_OPTIONS.map((veh) => {
                const isSelected = currentVehicle.id === veh.id;
                return (
                  <div
                    key={veh.id}
                    onClick={() => {
                      soundFX.playClick();
                      if (onSelectVehicle) onSelectVehicle(veh.id);
                    }}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(10, 14, 22, 0.75)',
                      border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '18px 22px',
                      cursor: 'pointer',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: '20px',
                      alignItems: 'center',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isSelected ? '0 12px 32px rgba(56, 189, 248, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <div style={{
                      fontSize: '2rem',
                      width: '54px',
                      height: '54px',
                      borderRadius: '14px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {veh.icon}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '0.62rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#38bdf8',
                          letterSpacing: '0.06em'
                        }}>
                          {veh.tag}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                        <span style={{ fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.5)' }}>{veh.massKg} KG TOTAL MASS</span>
                      </div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', margin: '0 0 6px 0' }}>
                        {veh.name}
                      </h4>
                      <p style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                        {veh.description}
                      </p>
                      <div style={{
                        fontSize: '0.66rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: 'rgba(255, 255, 255, 0.45)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <span>⚡ {veh.powerSource}</span>
                        <span>🔬 {veh.sciencePayloads}</span>
                      </div>
                    </div>

                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? '6px solid #38bdf8' : '2px solid rgba(255, 255, 255, 0.2)',
                      background: isSelected ? '#ffffff' : 'transparent',
                      transition: 'all 0.2s ease'
                    }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 2: MINERAL & RESOURCE EXTRACTION (ISRU) TARGETS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {MINERAL_TARGETS.map((tgt) => {
                const isSelected = currentTarget.id === tgt.id;
                return (
                  <div
                    key={tgt.id}
                    onClick={() => {
                      soundFX.playClick();
                      if (onSelectMineralTarget) onSelectMineralTarget(tgt);
                    }}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(10, 14, 22, 0.75)',
                      border: isSelected ? `1.5px solid ${tgt.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: '18px',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 12px 32px ${tgt.color}25` : '0 4px 16px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <div style={{
                      fontSize: '1.8rem',
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      background: isSelected ? `${tgt.color}25` : 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${tgt.color}40`
                    }}>
                      {tgt.icon}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{
                          fontSize: '0.6rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: tgt.color,
                          fontWeight: 700,
                          letterSpacing: '0.06em'
                        }}>
                          {tgt.category}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                        <span style={{ fontSize: '0.64rem', color: 'rgba(255, 255, 255, 0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
                          DEPTH: {tgt.geologicalDepth}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>
                        {tgt.name}
                      </h4>

                      <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        {tgt.primaryUtility}
                      </p>

                      <div style={{
                        fontSize: '0.65rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: 'rgba(255, 255, 255, 0.45)'
                      }}>
                        ⚙ Payload: <span style={{ color: '#cbd5e1' }}>{tgt.instrumentSuite}</span>
                      </div>
                    </div>

                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: isSelected ? tgt.color : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#030712' : 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {tgt.symbol}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 3: TRAJECTORY & LAUNCH DATE CONTROLLER */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeStep === 3 && (
            <div style={{
              background: 'rgba(10, 14, 22, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Departure Date Input & Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8', marginBottom: '8px' }}>
                  EARTH DEPARTURE LAUNCH WINDOW:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    value={launchEarthDate}
                    onChange={(e) => {
                      soundFX.playClick();
                      setLaunchEarthDate(e.target.value);
                    }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none'
                    }}
                  />

                  {/* Preset Buttons */}
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      setLaunchEarthDate('2026-11-26');
                    }}
                    style={{
                      padding: '8px 14px',
                      background: launchEarthDate === '2026-11-26' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: launchEarthDate === '2026-11-26' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    Artemis III Primary Window (Nov 2026)
                  </button>

                  <button
                    onClick={() => {
                      soundFX.playClick();
                      setLaunchEarthDate('2027-02-14');
                    }}
                    style={{
                      padding: '8px 14px',
                      background: launchEarthDate === '2027-02-14' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: launchEarthDate === '2027-02-14' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    CLPS Polar Sunrise Window (Feb 2027)
                  </button>
                </div>
              </div>

              {/* TLI Velocity Booster Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8' }}>
                    TRANS-LUNAR INJECTION (TLI) DELTA-V VECTOR:
                  </label>
                  <span style={{ fontSize: '0.76rem', fontFamily: "'JetBrains Mono', monospace", color: '#ffffff', fontWeight: 600 }}>
                    {tliVelocityKps} km/s
                  </span>
                </div>
                <input
                  type="range"
                  min="10.2"
                  max="11.4"
                  step="0.1"
                  value={tliVelocityKps}
                  onChange={(e) => {
                    setTliVelocityKps(parseFloat(e.target.value));
                  }}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                  <span>10.2 km/s (Economy Trajectory ~4.5 Days)</span>
                  <span>10.8 km/s (Nominal Apollo/Artemis TLI)</span>
                  <span>11.4 km/s (Express Transit ~3.9 Days)</span>
                </div>
              </div>

              {/* Live Trajectory Computed Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px',
                padding: '16px',
                background: 'rgba(5, 8, 14, 0.8)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255, 255, 255, 0.45)' }}>
                    TRANSIT DURATION
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
                    {transitDays} DAYS
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                    ~{(transitDays * 24).toFixed(0)} Earth Hours
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255, 255, 255, 0.45)' }}>
                    LUNAR ORBIT INSERTION
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
                    {arrivalDate.toISOString().slice(0, 10)}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                    {arrivalDate.toISOString().slice(11, 16)} UTC Epoch
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255, 255, 255, 0.45)' }}>
                    SOLAR ILLUMINATION PHASE
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                    {currentSite.illuminationPct}% PEAK
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#34d399' }}>
                    Optimal Solar Window
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* STEP 4: FINAL PRE-FLIGHT VERIFICATION DOSSIER */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeStep === 4 && (
            <div style={{
              background: 'rgba(10, 14, 22, 0.75)',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '20px',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8', letterSpacing: '0.08em' }}>
                  OFFICIAL EXPEDITION FLIGHT MANIFEST // AUTHORIZED
                </span>
                <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600 }}>
                  ● ALL SYSTEMS NOMINAL
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255, 255, 255, 0.45)' }}>
                    TARGET LANDING SITE
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>
                    {currentSite.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>
                    {Math.abs(currentSite.lat).toFixed(2)}° S, {currentSite.lon.toFixed(2)}° E (+{currentSite.elevationM}m)
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255, 255, 255, 0.45)' }}>
                    ROVER / LANDER PLATFORM
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>
                    {currentVehicle.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>
                    {currentVehicle.massKg} KG • {currentVehicle.tag}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255, 255, 255, 0.45)' }}>
                    IN-SITU RESOURCE TARGET (ISRU)
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: currentTarget.color }}>
                    {currentTarget.symbol} — {currentTarget.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.55)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {currentTarget.category} ({currentTarget.geologicalDepth})
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255, 255, 255, 0.45)' }}>
                    LUNAR ORBIT INSERTION DATE
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#34d399' }}>
                    {arrivalDate.toISOString().slice(0, 10)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.55)', fontFamily: "'JetBrains Mono', monospace" }}>
                    TLI Vector: {tliVelocityKps} km/s ({transitDays} Transit Days)
                  </div>
                </div>
              </div>

              {/* Big Launch Call-To-Action */}
              <button
                onClick={handleFinalLaunch}
                disabled={isWarping}
                style={{
                  marginTop: '8px',
                  padding: '16px 28px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '1.02rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: isWarping ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 8px 32px rgba(56, 189, 248, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => {
                  if (!isWarping) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(56, 189, 248, 0.65)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isWarping) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.45)';
                  }
                }}
              >
                <span>INITIALIZE LUNAR INSERTION & ENTER MOON ORBIT</span>
                <span style={{ fontSize: '1.2rem' }}>🚀</span>
              </button>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
            <button
              onClick={handlePrevStep}
              disabled={activeStep === 0}
              style={{
                padding: '8px 18px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: activeStep === 0 ? 'rgba(255, 255, 255, 0.2)' : '#ffffff',
                fontSize: '0.78rem',
                cursor: activeStep === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Previous Step
            </button>

            {activeStep < 4 ? (
              <button
                onClick={handleNextStep}
                style={{
                  padding: '9px 24px',
                  background: '#38bdf8',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#030712',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(56, 189, 248, 0.35)'
                }}
              >
                <span>Proceed to {stepTitles[activeStep + 1].title}</span>
                <span>→</span>
              </button>
            ) : null}
          </div>
        </section>

        {/* RIGHT COLUMN: DYNAMIC LIVE FLIGHT DOSSIER HUD */}
        <aside style={{
          background: 'rgba(8, 12, 18, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
              <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em' }}>
                EXPEDITION TELEMETRY
              </span>
            </div>
            <span style={{ fontSize: '0.62rem', color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>
              LIVE CONFIG
            </span>
          </div>

          {/* Dossier Item 1: Site */}
          <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8', marginBottom: '4px' }}>
              <span>01 // TARGET SITE</span>
              <span>{currentSite.illuminationPct}% SUN</span>
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
              {currentSite.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
              {Math.abs(currentSite.lat).toFixed(2)}° S, {currentSite.lon.toFixed(2)}° E • +{currentSite.elevationM}m
            </div>
          </div>

          {/* Dossier Item 2: Vehicle */}
          <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8', marginBottom: '4px' }}>
              <span>02 // HARDWARE PLATFORM</span>
              <span>{currentVehicle.massKg} KG</span>
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
              {currentVehicle.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
              {currentVehicle.subtitle}
            </div>
          </div>

          {/* Dossier Item 3: Mineral Extraction Goal */}
          <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${currentTarget.color}35` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: "'JetBrains Mono', monospace", color: currentTarget.color, marginBottom: '4px' }}>
              <span>03 // ISRU RESOURCE TARGET</span>
              <span>{currentTarget.symbol}</span>
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
              {currentTarget.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
              {currentTarget.category} • Depth: {currentTarget.geologicalDepth}
            </div>
          </div>

          {/* Dossier Item 4: Departure & Arrival Timeline */}
          <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: "'JetBrains Mono', monospace", color: '#34d399', marginBottom: '4px' }}>
              <span>04 // TIMELINE</span>
              <span>{transitDays} DAYS FLIGHT</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
              <span>Earth Launch:</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8' }}>{launchEarthDate}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#ffffff', display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
              <span>Lunar Arrival:</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#34d399', fontWeight: 700 }}>
                {arrivalDate.toISOString().slice(0, 10)}
              </span>
            </div>
          </div>

          {/* Quick Launch Button on Sidebar */}
          <button
            onClick={handleFinalLaunch}
            disabled={isWarping}
            style={{
              marginTop: 'auto',
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: isWarping ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(56, 189, 248, 0.4)'
            }}
          >
            <span>{isWarping ? 'WARPING TO LUNAR ORBIT...' : 'ENTER LUNAR GLOBE'}</span>
            <span>🚀</span>
          </button>
        </aside>
      </main>

      {/* ─── C. HIGH-ENERGY ORBITAL INSERTION WARP OVERLAY ─── */}
      {isWarping && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 14, 0.96)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          zIndex: 99999,
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            border: '3px solid rgba(56, 189, 248, 0.2)',
            borderTopColor: '#38bdf8',
            animation: 'spin 0.75s linear infinite'
          }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.72rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#38bdf8',
              letterSpacing: '0.15em',
              marginBottom: '6px'
            }}>
              TRANS-LUNAR INJECTION BURN COMPLETE
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Entering Lunar Orbital Sphere of Influence...
            </div>
            <div style={{
              fontSize: '0.8rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#34d399',
              marginTop: '6px'
            }}>
              TARGET LOCK: {currentSite.name.toUpperCase()}
            </div>
          </div>

          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
          `}</style>
        </div>
      )}
    </div>
  );
}

