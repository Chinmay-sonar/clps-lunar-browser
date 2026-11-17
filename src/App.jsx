import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import Viewport3D from './components/Viewport3D';
import HorizonRadar from './components/HorizonRadar';
import TelemetryHud from './components/TelemetryHud';
import TimeController from './components/TimeController';
import SiteSelector from './components/SiteSelector';
import SolarOptimizer from './components/SolarOptimizer';
import LunarGisMap from './components/LunarGisMap';
import RoverControlDock from './components/RoverControlDock';
import RoverCockpitHud from './components/RoverCockpitHud';
import ScientificAnalyticsDrawer from './components/ScientificAnalyticsDrawer';
import TraversePlannerModal from './components/TraversePlannerModal';
import OrbitalReconModal from './components/OrbitalReconModal';
import TerminalDescentModal from './components/TerminalDescentModal';
import SiteComparisonMatrixModal from './components/SiteComparisonMatrixModal';
import MissionStagingModal from './components/MissionStagingModal';
import SolarShadowGuidanceCard from './components/SolarShadowGuidanceCard';
import ClpsDeliveriesModal from './components/ClpsDeliveriesModal';
import MissionReportPptModal from './components/MissionReportPptModal';
import CodyseeyPreloaderHero from './components/CodyseeyPreloaderHero';
import ViperTourTheater from './components/ViperTourTheater';
import CinematicTextEpilogue from './components/CinematicTextEpilogue';
import PromoMoonCountdown from './components/PromoMoonCountdown';
import DesktopOnlyNotice from './components/DesktopOnlyNotice';
import { isMobileOrTabletDevice } from './utils/deviceDetection';
import { LANDING_SITES, CLPS_MISSIONS } from './data/landingSites';
import { MISSION_TRAVERSES } from './utils/shadowDodgePlanner';
import { calculateLunarEphemeris, calculateTimelineForecast } from './utils/lunarEphemeris';
import { generateMissionBriefPdf } from './utils/exportMissionBrief';
import { soundFX } from './utils/soundFX';
import { requestUniversalFullscreen } from './utils/fullscreenHelper';
import ScrollMissionShowcase, { MINERAL_TARGETS } from './components/ScrollMissionShowcase';

export default function App() {
  // App Experience Mode:
  // Starts on the animated Codyseey | NASA Space Apps Challenge hero with [Elevate] & [Browse]
  const [appMode, setAppMode] = useState(() => {
    if (typeof window === 'undefined') return 'briefing';

    const isExplicitDirectSim = window.location.search.includes('direct=true');
    const isExplicitStaging = window.location.search.includes('staging=true');

    // Strict Device Gate: Mobile phones & tablets are strictly restricted from the 3D browser
    if (isMobileOrTabletDevice()) {
      if (isExplicitDirectSim || isExplicitStaging) return 'desktop_only_notice';
      return 'briefing';
    }

    if (isExplicitDirectSim) return 'simulation';
    if (isExplicitStaging) return 'mission_staging';

    // Default entrance: Animated Brand Entrance with [Elevate] and [Browse]
    return 'briefing';
  });

  // Strict Hardware Enforcement: Instantly redirect to DesktopOnlyNotice if accessed on phone or tablet
  useEffect(() => {
    const enforceDesktopOnly = () => {
      if (isMobileOrTabletDevice()) {
        if (appMode === 'mission_staging' || appMode === 'simulation') {
          setAppMode('desktop_only_notice');
        }
      }
    };
    enforceDesktopOnly();
    window.addEventListener('resize', enforceDesktopOnly);
    window.addEventListener('orientationchange', enforceDesktopOnly);
    return () => {
      window.removeEventListener('resize', enforceDesktopOnly);
      window.removeEventListener('orientationchange', enforceDesktopOnly);
    };
  }, [appMode]);
  const [stagingInitialStep, setStagingInitialStep] = useState(0);
  const [isQuickSelectMode, setIsQuickSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'gis'
  const [activeVehicle, setActiveVehicle] = useState('viper'); // 'viper' | 'griffin' | 'nova-c' | 'custom-uyor'
  const [customRoverModel, setCustomRoverModel] = useState(null); // UYOR custom 3D model
  const [customRoverUrl, setCustomRoverUrl] = useState(null);
  const [activeMineralTarget, setActiveMineralTarget] = useState(MINERAL_TARGETS[0]);
  const [roverHeadlights, setRoverHeadlights] = useState(true);
  const [roverDrillState, setRoverDrillState] = useState('stowed'); // 'stowed' | 'drilling' | 'sampling'
  const [isOrbitalReconOpen, setIsOrbitalReconOpen] = useState(false);
  const [isTerminalDescentOpen, setIsTerminalDescentOpen] = useState(false);
  const [isSiteMatrixOpen, setIsSiteMatrixOpen] = useState(false);
  const [isClpsDeliveriesOpen, setIsClpsDeliveriesOpen] = useState(false);

  const [selectedSite, setSelectedSite] = useState(LANDING_SITES[0]);
  const [activeMission, setActiveMission] = useState(CLPS_MISSIONS[0]);
  // Default to Artemis III high-illumination window in NASA DE441 dataset: 2026-12-01T06:00:00Z
  const [currentSimDate, setCurrentSimDate] = useState(new Date('2026-12-01T06:00:00Z'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(3600);
  const [cameraMode, setCameraMode] = useState('surface'); // Always default to immersive 3D lunar surface operations
  const [isDirectLandingDeploy, setIsDirectLandingDeploy] = useState(false);
  const [isUiRevealed, setIsUiRevealed] = useState(() => window.location.search.includes('direct=true'));

  // Staged UI Emergence: When transitioning to surface simulation, reveal 3D Moon & vehicles FIRST, then emerge UI
  useEffect(() => {
    if (appMode === 'simulation') {
      setIsUiRevealed(false);
      const timer = setTimeout(() => {
        setIsUiRevealed(true);
      }, 1400); // 1.4s delay allows user to first see pristine lunar surface, Griffin lander, and VIPER rover
      return () => clearTimeout(timer);
    } else {
      setIsUiRevealed(false);
    }
  }, [appMode]);

  // Solar Array Tilt State
  const [panelTiltDeg, setPanelTiltDeg] = useState(0);
  const [panelAzimuthOffsetDeg, setPanelAzimuthOffsetDeg] = useState(0);

  // Autonomous Traverse & Shadow-Dodge Simulator State
  const [isTraverseOpen, setIsTraverseOpen] = useState(false);
  const [activeTraverse, setActiveTraverse] = useState(MISSION_TRAVERSES[0]);
  const [isDriving, setIsDriving] = useState(false);
  const [driveProgress, setDriveProgress] = useState(0.0);
  const [driveSpeedMultiplier, setDriveSpeedMultiplier] = useState(1);

  // Toggles for Floating Tools
  const [isSiteSelectorOpen, setIsSiteSelectorOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Live Ephemeris Telemetry
  const telemetry = useMemo(() => {
    return calculateLunarEphemeris(selectedSite, currentSimDate, panelTiltDeg, panelAzimuthOffsetDeg);
  }, [selectedSite, currentSimDate, panelTiltDeg, panelAzimuthOffsetDeg]);

  // 72-Hour Forecast
  const timelineForecast = useMemo(() => {
    return calculateTimelineForecast(selectedSite, currentSimDate, 72, 2);
  }, [selectedSite, currentSimDate]);

  // Autonomous Drive Progress Animation Timer
  React.useEffect(() => {
    if (!isDriving) return;
    const interval = setInterval(() => {
      setDriveProgress(prev => {
        const next = prev + 0.0012 * driveSpeedMultiplier;
        if (next >= 1.0) {
          setIsDriving(false);
          return 1.0;
        }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isDriving, driveSpeedMultiplier]);

  // Handle Mission Selection
  const handleSelectMission = (mission) => {
    setActiveMission(mission);
    const targetSite = LANDING_SITES.find(s => s.id === mission.siteId);
    if (targetSite) setSelectedSite(targetSite);
    setCurrentSimDate(new Date(mission.landingDate));
  };

  // Handle Export Flight Brief: Opens the interactive 16:9 widescreen presentation deck
  const handleExportBrief = () => {
    setIsReportModalOpen(true);
  };

  // Handle Targeting a Safe Haven Corridor from Phase 2 Orbital Recon
  const handleTargetCorridor = (corridor) => {
    const targetSite = {
      id: corridor.designation.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: `${corridor.designation} (${Math.abs(corridor.coordinates.lat).toFixed(2)}°S, ${corridor.coordinates.lon.toFixed(2)}°E)`,
      targetType: 'Autonomous Haven (Orbital Recon)',
      designation: corridor.designation,
      lat: corridor.coordinates.lat,
      lon: corridor.coordinates.lon,
      elevationMeters: corridor.elevationMeters,
      elevationM: corridor.elevationMeters,
      illuminationPct: 88.0,
      maxSlopeDeg: corridor.slopeDegrees,
      psrDistanceKm: 1.2,
      waterIceWEH: corridor.waterIceYieldWEH,
      waterIceProbability: `High (${corridor.waterIceYieldWEH} wt% WEH)`,
      dteReliability: 'High (Line-of-Sight Locked)',
      description: `Autonomously surveyed landing haven via Phase 2 Orbital Reconnaissance. Slope: ${corridor.slopeDegrees}°, Elevation: ${corridor.elevationMeters}m. Powered Descent Initiation vector configured.`,
      keyHazard: corridor.slopeDegrees > 5 ? 'Moderate terrain slope on approach' : 'Nominal safe terrain',
      terrainColor: '#8ca0b0',
      horizonProfile: selectedSite.horizonProfile
    };
    setSelectedSite(targetSite);
  };

  // 1 & 2. Unified Preloader + Fullscreen Cinematic VIPER Tour
  // Both are mounted together so the <video> is pre-buffered in the DOM.
  // When user clicks "Elevate", vid.play() executes synchronously inside that user gesture.
  if (appMode === 'briefing' || appMode === 'video_tour') {
    return (
      <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', background: '#000000', overflow: 'hidden' }}>
        <ViperTourTheater
          isActive={appMode === 'video_tour'}
          onComplete={() => {
            setAppMode('cinematic_epilogue');
          }}
        />
        {appMode === 'briefing' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100 }}>
            <CodyseeyPreloaderHero
              onEnterSimulation={() => {
                setAppMode('video_tour');
              }}
              onBrowse={() => {
                if (isMobileOrTabletDevice()) {
                  setAppMode('desktop_only_notice');
                } else {
                  setAppMode('mission_staging');
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // 3. Cinematic Epilogue (Problem -> Solution -> Impact)
  // When completed:
  // - If mobile/tablet: strictly transitions to DesktopOnlyNotice with Moon Background.mp4
  // - If laptop/desktop: transitions directly into the interactive mission setup/browser
  if (appMode === 'cinematic_epilogue') {
    return (
      <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', background: '#000000', overflow: 'hidden' }}>
        <CinematicTextEpilogue
          onComplete={() => {
            if (isMobileOrTabletDevice()) {
              setAppMode('desktop_only_notice');
            } else {
              setAppMode('mission_staging');
            }
          }}
        />
      </div>
    );
  }

  // 4. Strict Desktop / Laptop Only Notice Screen (Mobile & Tablet Enforcement)
  if (appMode === 'desktop_only_notice') {
    return <DesktopOnlyNotice />;
  }

  // 5. Scroll-Driven Cinematic Mission Setup & Showcase Flow
  if (appMode === 'mission_staging') {
    return (
      <ScrollMissionShowcase
        initialStep={stagingInitialStep}
        isQuickSelectMode={isQuickSelectMode}
        selectedSite={selectedSite}
        onSelectSite={(site) => {
          setSelectedSite(site);
          soundFX.playTelemetry();
        }}
        activeVehicle={activeVehicle}
        onSelectVehicle={(vehId) => {
          setActiveVehicle(vehId);
          soundFX.playClick();
        }}
        currentSimDate={currentSimDate}
        onSelectDate={(newDate) => {
          setCurrentSimDate(newDate);
        }}
        activeMineralTarget={activeMineralTarget}
        onSelectMineralTarget={(target) => {
          setActiveMineralTarget(target);
          soundFX.playTelemetry();
        }}
        onLaunchExpedition={(expeditionConfig) => {
          if (expeditionConfig.site) setSelectedSite(expeditionConfig.site);
          const veh = expeditionConfig.vehicle?.id || 'viper';
          setActiveVehicle(veh);
          if (expeditionConfig.customRover) setCustomRoverModel(expeditionConfig.customRover);
          if (expeditionConfig.customRoverUrl) setCustomRoverUrl(expeditionConfig.customRoverUrl);
          if (expeditionConfig.simDate) setCurrentSimDate(expeditionConfig.simDate);
          if (expeditionConfig.mineralTarget) setActiveMineralTarget(expeditionConfig.mineralTarget);
          setIsQuickSelectMode(false);
          setIsDirectLandingDeploy(true);
          setCameraMode('surface');
          setAppMode('simulation');
        }}
        onReturnToBriefing={() => {
          setIsQuickSelectMode(false);
          setAppMode('simulation');
        }}
      />
    );
  }

  // Main 3D Lunar Mission Operations Workspace (Full Interactive Simulator Mode)
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-void)'
    }}>
      {/* 1. Sleek Floating Top Header (Graceful delayed emergence) */}
      <div style={{
        position: 'relative',
        zIndex: 40,
        opacity: isUiRevealed ? 1 : 0,
        transform: isUiRevealed ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'opacity 1.3s cubic-bezier(0.16, 1, 0.3, 1), transform 1.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isUiRevealed ? 'auto' : 'none'
      }}>
        <Navbar
          selectedSite={selectedSite}
          onSelectSite={(site) => {
            setSelectedSite(site);
            soundFX.playTelemetry();
          }}
          currentSimDate={currentSimDate}
          onOpenSiteSelector={() => setIsSiteSelectorOpen(true)}
          onExportBrief={handleExportBrief}
          onOpenOptimizer={() => setIsOptimizerOpen(!isOptimizerOpen)}
          isOptimizerOpen={isOptimizerOpen}
          isRadarOpen={isRadarOpen}
          setIsRadarOpen={setIsRadarOpen}
          onOpenAnalytics={() => setIsAnalyticsOpen(true)}
          isAnalyticsOpen={isAnalyticsOpen}
          onOpenTraversePlanner={() => setIsTraverseOpen(true)}
          isTraverseOpen={isTraverseOpen}
          cameraMode={cameraMode}
          setCameraMode={(mode) => {
            setCameraMode(mode);
            if (mode === 'cockpit' || mode === 'rover') {
              if (activeVehicle === 'nova-c' || activeVehicle === 'lander') {
                setActiveVehicle('viper');
              }
            }
          }}
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeVehicle={activeVehicle}
          activeMineralTarget={activeMineralTarget}
          onOpenStaging={(step = 1) => {
            soundFX.playClick();
            setStagingInitialStep(step);
            setIsQuickSelectMode(true);
            setAppMode('mission_staging');
          }}
          onOpenOrbitalRecon={() => setIsOrbitalReconOpen(true)}
          isOrbitalReconOpen={isOrbitalReconOpen}
          onOpenTerminalDescent={() => setIsTerminalDescentOpen(true)}
          isTerminalDescentOpen={isTerminalDescentOpen}
          onOpenSiteMatrix={() => setIsSiteMatrixOpen(true)}
          isSiteMatrixOpen={isSiteMatrixOpen}
          onOpenManifest={() => {
            soundFX.playClick();
            setIsManifestOpen(true);
          }}
          isGuidanceOpen={isGuidanceOpen}
          setIsGuidanceOpen={setIsGuidanceOpen}
          onOpenClpsDeliveries={() => {
            soundFX.playClick();
            setIsClpsDeliveriesOpen(true);
          }}
          onReturnToBriefing={() => {
            soundFX.playClick();
            setCameraMode('orbital');
          }}
        />
      </div>

      {/* 2. Main Display Area: Either 3D Simulator or Multi-Spectral Lunar GIS Map */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {viewMode === 'gis' ? (
          <LunarGisMap
            selectedSite={selectedSite}
            onSelectSite={(site) => {
              setSelectedSite(site);
              soundFX.playTelemetry();
            }}
            onSwitchTo3D={() => setViewMode('3d')}
          />
        ) : (
          <>
            <Viewport3D
              selectedSite={selectedSite}
              telemetry={telemetry}
              cameraMode={cameraMode}
              panelTiltDeg={panelTiltDeg}
              activeVehicle={activeVehicle}
              customRoverModel={customRoverModel}
              customRoverUrl={customRoverUrl}
              roverHeadlights={roverHeadlights}
              roverDrillState={roverDrillState}
              activeTraverse={activeTraverse}
              driveProgress={driveProgress}
              isDriving={isDriving}
              driveSpeedMultiplier={driveSpeedMultiplier}
              setCameraMode={setCameraMode}
              isDirectLandingDeploy={isDirectLandingDeploy}
              onLandingComplete={() => setIsDirectLandingDeploy(false)}
              onSelectSite={(site) => {
                setSelectedSite(site);
                soundFX.playTelemetry();
              }}
              onDescendToSurface={() => {
                setCameraMode('surface');
                soundFX.playClick();
              }}
              isUiRevealed={isUiRevealed}
            />

            {/* Tactical Rover / Lander Control Dock (Only in Surface / Non-Orbital Modes) */}
            <div style={{
              opacity: isUiRevealed ? 1 : 0,
              transform: isUiRevealed ? 'translateX(0)' : 'translateX(-24px)',
              transition: 'opacity 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
              pointerEvents: isUiRevealed ? 'auto' : 'none'
            }}>
              {cameraMode !== 'orbital' && (
                cameraMode === 'cockpit' ? (
                  <RoverCockpitHud
                    telemetry={telemetry}
                    site={selectedSite}
                    headlightsOn={roverHeadlights}
                    setHeadlightsOn={setRoverHeadlights}
                    drillState={roverDrillState}
                    setDrillState={setRoverDrillState}
                    onExitCockpit={() => setCameraMode('surface')}
                  />
                ) : (
                  <RoverControlDock
                    activeVehicle={activeVehicle}
                    setActiveVehicle={setActiveVehicle}
                    headlightsOn={roverHeadlights}
                    setHeadlightsOn={setRoverHeadlights}
                    drillState={roverDrillState}
                    setDrillState={setRoverDrillState}
                  />
                )
              )}
            </div>

            {/* Collapsible Horizon Radar Overlay */}
            <HorizonRadar
              site={selectedSite}
              telemetry={telemetry}
              isOpen={isRadarOpen}
              onClose={() => setIsRadarOpen(false)}
            />

            {/* Slide-in Solar Tilt Tool */}
            <SolarOptimizer
              isOpen={isOptimizerOpen}
              onClose={() => setIsOptimizerOpen(false)}
              telemetry={telemetry}
              panelTiltDeg={panelTiltDeg}
              setPanelTiltDeg={setPanelTiltDeg}
              panelAzimuthOffsetDeg={panelAzimuthOffsetDeg}
              setPanelAzimuthOffsetDeg={setPanelAzimuthOffsetDeg}
            />

            {/* 3. Refined, Minimal Floating Bottom Dock (Surface Operations Mode Only) */}
            {cameraMode !== 'orbital' && (
              <div style={{
                position: 'absolute',
                bottom: '14px',
                left: '16px',
                right: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: isUiRevealed ? 'auto' : 'none',
                zIndex: 30,
                opacity: isUiRevealed ? 1 : 0,
                transform: isUiRevealed ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s'
              }}>
                {/* Top of Dock: Sleek Single-Line Telemetry Strip */}
                <TelemetryHud telemetry={telemetry} site={selectedSite} />

                {/* Bottom of Dock: Precision Minimal Scrubber */}
                <TimeController
                  currentSimDate={currentSimDate}
                  setCurrentSimDate={setCurrentSimDate}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  simSpeed={simSpeed}
                  setSimSpeed={setSimSpeed}
                  timelineForecast={timelineForecast}
                  onSelectMission={handleSelectMission}
                  onOpenAnalytics={() => setIsAnalyticsOpen(true)}
                  onOpenRadar={() => setIsRadarOpen(!isRadarOpen)}
                  telemetry={telemetry}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Candidate Landing Site Selection Modal */}
      <SiteSelector
        isOpen={isSiteSelectorOpen}
        onClose={() => setIsSiteSelectorOpen(false)}
        selectedSite={selectedSite}
        onSelectSite={(site) => {
          setSelectedSite(site);
          soundFX.playTelemetry();
        }}
      />

      {/* NASA Lunar Scientific Analytics Suite Modal */}
      <ScientificAnalyticsDrawer
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        selectedSite={selectedSite}
        currentSimDate={currentSimDate}
        onJumpToDate={(date) => setCurrentSimDate(date)}
      />

      {/* VIPER Autonomous Shadow-Dodge Traverse Planner & Simulator Modal */}
      <TraversePlannerModal
        isOpen={isTraverseOpen}
        onClose={() => setIsTraverseOpen(false)}
        selectedSite={selectedSite}
        activeTraverse={activeTraverse}
        setActiveTraverse={setActiveTraverse}
        isDriving={isDriving}
        setIsDriving={setIsDriving}
        driveProgress={driveProgress}
        setDriveProgress={setDriveProgress}
        driveSpeedMultiplier={driveSpeedMultiplier}
        setDriveSpeedMultiplier={setDriveSpeedMultiplier}
      />

      {/* 5. AI Orbital Reconnaissance & Hazard Detection Modal */}
      <OrbitalReconModal
        isOpen={isOrbitalReconOpen}
        onClose={() => setIsOrbitalReconOpen(false)}
        currentSimDate={currentSimDate}
        onSelectSite={(site) => setSelectedSite(site)}
        onTargetCorridor={handleTargetCorridor}
      />

      {/* 7. Autonomous Lander Descent Guidance & Real-Time Hazard Detection Modal */}
      <TerminalDescentModal
        isOpen={isTerminalDescentOpen}
        onClose={() => setIsTerminalDescentOpen(false)}
        selectedSite={selectedSite}
      />

      {/* 8. Multi-Site Comparative Trade Study Matrix Modal */}
      <SiteComparisonMatrixModal
        isOpen={isSiteMatrixOpen}
        onClose={() => setIsSiteMatrixOpen(false)}
        currentSimDate={currentSimDate}
        onSelectSite={(site) => setSelectedSite(site)}
      />

      {/* 9. Mission Staging & Vehicle Manifest Modal */}
      <MissionStagingModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
        activeVehicle={activeVehicle}
        onSelectVehicle={(vehId) => setActiveVehicle(vehId)}
        selectedSite={selectedSite}
        onSelectSite={(site) => setSelectedSite(site)}
        currentSimDate={currentSimDate}
        setCurrentSimDate={setCurrentSimDate}
        onConfirmMissionTrajectory={(plan) => {
          if (plan.targetSite) setSelectedSite(plan.targetSite);
          if (plan.arrivalDate) setCurrentSimDate(plan.arrivalDate);
          if (plan.vehicle) setActiveVehicle(plan.vehicle);
          setIsManifestOpen(false);
          soundFX.playTelemetry();
        }}
      />

      {/* 10. Continuous Solar & Shadow Guidance Engine Card */}
      <SolarShadowGuidanceCard
        isOpen={isGuidanceOpen}
        onClose={() => setIsGuidanceOpen(false)}
        telemetry={telemetry}
        site={selectedSite}
        selectedSite={selectedSite}
        currentSimDate={currentSimDate}
        activeVehicle={activeVehicle}
        panelTiltDeg={panelTiltDeg}
        setPanelTiltDeg={setPanelTiltDeg}
        panelAzimuthOffsetDeg={panelAzimuthOffsetDeg}
        setPanelAzimuthOffsetDeg={setPanelAzimuthOffsetDeg}
        onApplyOptimalTilt={(tilt, az) => {
          setPanelTiltDeg(tilt);
          if (az !== undefined) setPanelAzimuthOffsetDeg(az);
          soundFX.playClick();
        }}
      />

      {/* 11. Official NASA CLPS Deliveries Interactive Resource Modal */}
      <ClpsDeliveriesModal
        isOpen={isClpsDeliveriesOpen}
        onClose={() => setIsClpsDeliveriesOpen(false)}
        onSelectSite={(site) => setSelectedSite(site)}
        setCameraMode={setCameraMode}
      />

      {/* 12. High-Editorial Presentation PPT Mission Dossier Modal */}
      <MissionReportPptModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedSite={selectedSite}
        telemetry={telemetry}
        activeMission={activeMission}
        activeVehicle={activeVehicle}
        timelineForecast={timelineForecast}
      />
    </div>
  );
}
