import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { soundFX } from '../utils/soundFX';
import { LANDING_SITES } from '../data/landingSites';
import CodyseeyHandwrittenLogo from './CodyseeyHandwrittenLogo';
import { NasaSpaceAppsOfficialLogo, OriginalVerticalDivider } from './CodyseeyPreloaderHero';
import RightShaderBackground from './RightShaderBackground';
import GlassBackButton from './GlassBackButton';
import GlassNextButton from './GlassNextButton';
import WhiteMapPinIcon from './WhiteMapPinIcon';
import SilveryGlobeButton from './SilveryGlobeButton';
import ShinyButton from './ui/shiny-button';
import CustomObjectivePillInput from './CustomObjectivePillInput';
import LunarCalendarModal from './LunarCalendarModal';
import LunarSurfaceFilter, { LUNAR_SURFACE_REGIONS } from './LunarSurfaceFilter';
import { calculateLunarTrajectory } from '../utils/lunarTrajectoryCalculator';
import { predictSiteMetrics } from '../utils/sitePredictionAlgorithm';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * BOUNDARY-LESS CINEMATIC MISSION STAGING CONFIGURATOR
 * ═════════════════════════════════════════════════════════════════════════════
 * Highlights:
 * - 100% Boundary-less: Zero border lines, zero visible edge boxes or seams
 * - Left: Photorealistic 3D Moon spinning smoothly in pure black void
 * - Right: Mesmerizing fluid wave shader fading from void black on the left
 * - Super Simple Language: Plain titles and punchy options
 * - Dynamic White Pin:
 *   - No pre-existing pins cluttering the Moon.
 *   - Clicking anywhere on the Moon drops the pure white pin at that exact spot!
 *   - Selecting a landing site from the list auto-rotates the lunar globe to
 *     bring that exact site front-and-center and drops the white pin there.
 *   - In globe choosing mode, auto-spinning stops completely.
 *     It rotates only when the user drags.
 * - Buttons:
 *   - Back: Apple-inspired Liquid Glass button (GlassBackButton)
 *   - Next: Fluid morphing gradient pill button (LiquidGradientNextButton)
 *   - Placed directly below options aligned towards the right
 */

export const RESEARCH_OBJECTIVES = [
  {
    id: 'lunar-mission-control',
    name: 'Lunar Mission Control Site',
    desc: 'Establish central command, telemetry & operational communications hub'
  },
  {
    id: 'water-ice',
    name: 'Water Ice',
    desc: 'Sample frozen ice in cold polar craters'
  },
  {
    id: 'oxygen-extraction',
    name: 'Oxygen Extraction',
    desc: 'Extract breathable oxygen from regolith'
  },
  {
    id: 'solar-energy',
    name: 'Solar Energy',
    desc: 'Harness sunlight on permanent peaks of light'
  },
  {
    id: 'helium-3',
    name: 'Helium-3 Fuel',
    desc: 'Collect clean energy for next-generation fusion'
  },
  {
    id: 'custom-other',
    name: 'Other',
    desc: 'Define custom scientific research objective'
  }
];

export const MINERAL_TARGETS = RESEARCH_OBJECTIVES;

export const VEHICLE_OPTIONS = [
  {
    id: 'viper',
    name: 'NASA VIPER Rover',
    desc: 'Flagship ice prospecting rover with TRIDENT 1m drill'
  },
  {
    id: 'griffin',
    name: 'Astrobotic Griffin Lander',
    desc: 'Heavy polar delivery lander with Griffin Rover 2'
  },
  {
    id: 'nova-c',
    name: 'Nova Lander',
    desc: 'Intuitive Machines Nova-C precision landing craft'
  },
  {
    id: 'custom-uyor',
    name: 'Upload Your Own Rover',
    desc: 'Custom 3D model (.GLB / .GLTF exported from Blender or CAD)'
  }
];

export const LAUNCH_WINDOWS = [
  {
    id: 'artemis-3',
    date: '2026-11-26',
    name: 'Artemis III',
    desc: 'November 2026 • Peak sunlight'
  },
  {
    id: 'clps-dawn',
    date: '2027-02-14',
    name: 'Polar Dawn',
    desc: 'February 2027 • Extended daylight'
  },
  {
    id: 'summer-solstice',
    date: '2027-07-20',
    name: 'Summer Solstice',
    desc: 'July 2027 • Minimal shadow'
  },
  {
    id: 'custom-date',
    date: '2027-04-15',
    name: 'Custom Date',
    desc: 'Pick your own arrival date'
  }
];

// Helper: Convert (lat, lon) on sphere of radius R into 3D Vector3
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}



// Helper: Calculate target rotation angles (rx, ry) to bring a site directly facing camera
function getSiteTargetRotation(lat, lon) {
  const p = latLonToVector3(lat, lon, 1);
  const targetRy = -Math.atan2(p.x, p.z);
  // Pitch South Pole (-85° to -89°) from south up to north so it's clearly visible in center
  const targetRx = -1.35;
  return { targetRx, targetRy };
}

// Single continuous cubic Bézier interpolation for unbroken single-motion transition
function bezierCubic(p0, p1, p2, p3, t) {
  const oneMinusT = 1 - t;
  return (
    oneMinusT * oneMinusT * oneMinusT * p0 +
    3 * oneMinusT * oneMinusT * t * p1 +
    3 * oneMinusT * t * t * p2 +
    t * t * t * p3
  );
}

// Exact Framer AITextLoadingFX Component (Cycles loading phrases with smooth gradient wave)
function AITextLoadingFX({
  phrases = [
    'Analyzing...',
    'Processing Telemetry...',
    'Computing Coordinates...'
  ],
  interval = 650,
  fontSize = '14px'
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, interval);
    return () => clearInterval(timer);
  }, [phrases.length, interval]);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      height: '24px',
      overflow: 'hidden',
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      padding: 0
    }}>
      <span
        key={index}
        className="ai-framer-text-wave"
        style={{
          fontSize,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          display: 'inline-block',
          fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
          animation: 'framerTextSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1), framerGradientSweep 2.2s linear infinite',
          filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.35)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.95))'
        }}
      >
        {phrases[index]}
      </span>
    </div>
  );
}

// Luxury White Map Pin Marker (100% Background-less, Stationary Pin Tip, Framer AI Text Shimmer beside Pin)
function WhiteMapPinMarker({
  site,
  x,
  y,
  isVisible,
  onClick,
  simDate,
  containerWidth = 1200,
  isAnalyzing = false
}) {
  if (!isVisible) return null;
  const metrics = predictSiteMetrics(site, simDate);

  // If pin is within 260px of right container edge, render text to the left so it never clips
  const isNearRightEdge = x > containerWidth - 260;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(site);
      }}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        // Anchor the pin tip mathematically at (x, y) with translate(-50%, -100%)
        // The container size is fixed to 24x24 so the pin NEVER shifts on text arrival or resizing!
        width: '24px',
        height: '24px',
        transform: 'translate(-50%, -100%)',
        cursor: 'pointer',
        zIndex: 500,
        userSelect: 'none',
        pointerEvents: 'auto',
        fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
        animation: 'dropPinIn 0.3s cubic-bezier(0.16, 1.4, 0.3, 1) forwards'
      }}
    >
      {/* 1. Pure White Map Pin with Ground Contact Tip touching exact (x, y) coordinates */}
      <div style={{
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <WhiteMapPinIcon size={24} glow={false} />
      </div>

      {/* 2. Direct Background-less Typography beside the Pin (Adjusts outward without ever moving the pin) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        ...(isNearRightEdge
          ? { right: 'calc(100% + 9px)' }
          : { left: 'calc(100% + 9px)' }),
        display: 'inline-flex',
        alignItems: 'center',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}>
        {isAnalyzing ? (
          <AITextLoadingFX
            phrases={[
              'Analyzing...',
              'Processing Telemetry...',
              'Computing Coordinates...'
            ]}
            interval={650}
            fontSize="14px"
          />
        ) : (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            whiteSpace: 'nowrap',
            animation: 'framerTextSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <span style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 4px rgba(0, 0, 0, 0.8)'
            }}>
              {site.name.split(' (')[0]}
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textShadow: '0 2px 6px rgba(0, 0, 0, 0.95)' }}>•</span>
            <span style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 400,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 4px rgba(0, 0, 0, 0.8)'
            }}>
              {metrics.peakRange}
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textShadow: '0 2px 6px rgba(0, 0, 0, 0.95)' }}>•</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '13px',
              color: metrics.connectivityColor,
              fontWeight: 500,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 4px rgba(0, 0, 0, 0.8)'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: metrics.connectivityColor,
                boxShadow: `0 0 8px ${metrics.connectivityColor}`
              }} />
              {metrics.connectivity}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScrollMissionShowcase({
  initialStep = 0,
  isQuickSelectMode = false,
  selectedSite,
  onSelectSite,
  activeVehicle,
  onSelectVehicle,
  currentSimDate,
  onSelectDate,
  activeMineralTarget,
  onSelectMineralTarget,
  onLaunchExpedition
}) {
  const canvasMountRef = useRef(null);

  // Stepper State: 0 = Objective, 1 = Landing Site, 2 = Rover, 3 = Arrival Date, 4 = Ready
  const [activeStep, setActiveStep] = useState(initialStep);

  // Interactive 3D Globe Site Picker Mode
  const [isGlobePickerActive, setIsGlobePickerActive] = useState(false);
  const isGlobePickerActiveRef = useRef(false);
  isGlobePickerActiveRef.current = isGlobePickerActive;

  // Selected & Placed Site
  const [placedSite, setPlacedSite] = useState(null);
  const placedSiteRef = useRef(placedSite);
  placedSiteRef.current = placedSite;
  const [hasDroppedPinOnGlobe, setHasDroppedPinOnGlobe] = useState(false);
  const hasDroppedPinOnGlobeRef = useRef(false);
  hasDroppedPinOnGlobeRef.current = hasDroppedPinOnGlobe;
  const [placedPinScreenPos, setPlacedPinScreenPos] = useState(null);
  const [globePickedBanner, setGlobePickedBanner] = useState(null);
  const [isSurfaceFilterOpen, setIsSurfaceFilterOpen] = useState(false);
  const [pinnedFilterRegions, setPinnedFilterRegions] = useState([]);
  const pinnedFilterRegionsRef = useRef([]);
  pinnedFilterRegionsRef.current = pinnedFilterRegions;
  const [pinnedFilterScreenPositions, setPinnedFilterScreenPositions] = useState([]);

  // Auto-rotation & Selected Site Orientation on Center of Lunar Disk
  const moonGroupRef = useRef(null);
  const spinAngleRef = useRef(0);
  const selectedSiteForOrientationRef = useRef(null);
  const targetRotationRef = useRef({ rx: 0.0, ry: 0 });
  const isAutoRotatingRef = useRef(false);

  // Cinematic Launch & Landing Video Flow
  const [isLaunchingExpedition, setIsLaunchingExpedition] = useState(false);
  const isLaunchingExpeditionRef = useRef(false);
  const launchStartTimeRef = useRef(0);
  const startMoonXRef = useRef(-1.6);
  const [isBlackoutActive, setIsBlackoutActive] = useState(false);
  const hasTriggeredBlackoutRef = useRef(false);
  const [isLandingVideoActive, setIsLandingVideoActive] = useState(false);
  const isLandingVideoActiveRef = useRef(false);
  const [isLandingTextVisible, setIsLandingTextVisible] = useState(false);
  const [hasVideoStartedPlaying, setHasVideoStartedPlaying] = useState(false);
  const landingVideoRef = useRef(null);
  const hasTriggeredVideoRef = useRef(false);
  const hasTriggeredLaunchRef = useRef(false);
  const startLandingVideoRef = useRef(null);

  // Reference to 3D anchor in Three.js
  const activePinAnchorRef = useRef(null);
  const triggerRaycastRef = useRef(null);
  const handleResizeRef = useRef(null);

  // Force immediate Three.js canvas & renderer resize whenever Globe Picker mode toggles
  useEffect(() => {
    if (handleResizeRef.current) handleResizeRef.current();
    const t1 = setTimeout(() => {
      if (handleResizeRef.current) handleResizeRef.current();
    }, 40);
    const t2 = setTimeout(() => {
      if (handleResizeRef.current) handleResizeRef.current();
    }, 180);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isGlobePickerActive]);

  // User Selections (Initialized cleanly to avoid null reference when opening from quick-select)
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [customObjectiveText, setCustomObjectiveText] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState(() => selectedSite?.id || 'malapert-massif');
  const [selectedVehicleId, setSelectedVehicleId] = useState(() => activeVehicle || 'viper');
  const [selectedWindowId, setSelectedWindowId] = useState(null);
  const [customLaunchDate, setCustomLaunchDate] = useState('2026-11-11');
  const [isCustomDateConfirmed, setIsCustomDateConfirmed] = useState(false);
  const [isAnalyzingTelemetry, setIsAnalyzingTelemetry] = useState(false);
  const telemetryTimeoutRef = useRef(null);

  // Sync with props when opened from Navbar Quick Select
  useEffect(() => {
    if (selectedSite?.id) setSelectedSiteId(selectedSite.id);
  }, [selectedSite]);

  useEffect(() => {
    if (activeVehicle) setSelectedVehicleId(activeVehicle);
  }, [activeVehicle]);

  useEffect(() => {
    if (initialStep !== undefined && initialStep !== null) {
      setActiveStep(initialStep);
    }
  }, [initialStep]);

  // Keep selectedSiteForOrientationRef in sync with chosen location
  useEffect(() => {
    const site = placedSite || (selectedSiteId ? LANDING_SITES.find(s => s.id === selectedSiteId) : null);
    selectedSiteForOrientationRef.current = site || null;
  }, [placedSite, selectedSiteId]);

  // Flight trajectory & Moon arrival calculation based on Earth launch date
  const customTrajectory = useMemo(() => calculateLunarTrajectory(customLaunchDate), [customLaunchDate]);

  // Hover state for interactive row expansion (headline initially, description reveals on hover)
  const [hoveredRowId, setHoveredRowId] = useState(null);

  // Resolved entities
  const currentTarget = selectedTargetId === 'custom-other'
    ? {
      id: 'custom-other',
      name: customObjectiveText.trim() || 'Custom Objective',
      desc: 'Custom scientific research mission'
    }
    : (RESEARCH_OBJECTIVES.find(t => t.id === selectedTargetId) || activeMineralTarget || RESEARCH_OBJECTIVES[0]);

  const currentSite = LANDING_SITES.find(s => s.id === selectedSiteId) || placedSite || (selectedSiteId ? selectedSite : null);

  // UYOR (Upload Your Own Rover) State
  const [customRoverFile, setCustomRoverFile] = useState(null);
  const [customRoverUrl, setCustomRoverUrl] = useState(null);
  const [customRoverName, setCustomRoverName] = useState('');
  const [customRoverMass, setCustomRoverMass] = useState('');
  const fileInputRef = useRef(null);

  // Dynamic appearance of Next button (UYOR requires uploaded 3D file before proceeding)
  const isOptionSelected =
    (activeStep === 0 && (selectedTargetId !== null && (selectedTargetId !== 'custom-other' || customObjectiveText.trim().length > 0))) ||
    (activeStep === 1 && (selectedSiteId !== null || placedSite !== null)) ||
    (activeStep === 2 && selectedVehicleId !== null) ||
    (activeStep === 3 && (selectedWindowId !== null && (selectedWindowId !== 'custom-date' || isCustomDateConfirmed)));

  const currentVehicle = VEHICLE_OPTIONS.find(v => v.id === selectedVehicleId) || VEHICLE_OPTIONS[0];

  const currentWindow = LAUNCH_WINDOWS.find(w => w.id === selectedWindowId) || LAUNCH_WINDOWS[0];
  const effectiveSimDate = selectedWindowId === 'custom-date'
    ? new Date(customTrajectory.arrivalDateStr + 'T12:00:00Z')
    : new Date(currentWindow.date + 'T12:00:00Z');

  // Real-time scientific prediction metrics for active and placed sites
  const activeSiteMetrics = useMemo(() => predictSiteMetrics(currentSite, effectiveSimDate), [currentSite, effectiveSimDate]);
  const placedSiteMetrics = useMemo(() => predictSiteMetrics(placedSite, effectiveSimDate), [placedSite, effectiveSimDate]);

  // ─── THREE.JS 3D MOON GLOBE ───
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020306);

    // ─── 5a. Helper: Crisp Circular Star Sprite Texture (Exact Viewport3D Replica) ───
    function createStarTexture(size = 32) {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      const half = size / 2;
      const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(235, 245, 255, 0.85)');
      grad.addColorStop(0.7, 'rgba(190, 220, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    }

    // ─── 5b. Pure Deep-Space 360° Omnidirectional Starfield (24,000 Stars - Covering Full Viewport) ───
    const starTex = createStarTexture(32);
    const starGroup = new THREE.Group();
    scene.add(starGroup);

    const starCount = 24000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1; // Uniform omnidirectional sphere: covers 100% of the entire sky
      const phi = Math.acos(u);
      const r = 2400 + Math.random() * 1400;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Natural stellar temperature color variations (crisp white, faint icy blue, warm solar white)
      const starType = Math.random();
      if (starType > 0.82) {
        // Crisp O/B Blue-White
        starColors[i * 3] = 0.85;
        starColors[i * 3 + 1] = 0.94;
        starColors[i * 3 + 2] = 1.0;
      } else if (starType > 0.68) {
        // Solar G-Type warm white
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.96;
        starColors[i * 3 + 2] = 0.88;
      } else {
        // Diamond starlight
        const lum = 0.60 + Math.random() * 0.40;
        starColors[i * 3] = lum;
        starColors[i * 3 + 1] = lum;
        starColors[i * 3 + 2] = lum * 1.03;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      map: starTex,
      size: 1.8,
      sizeAttenuation: false, // Ensures all 24,000 stars are razor-sharp across all screen sizes
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    starGroup.add(starPoints);

    // ─── 5c. Prominent Sparkling Foreground Diamond Stars (2,800 Stars) ───
    const brightStarCount = 2800;
    const brightStarGeo = new THREE.BufferGeometry();
    const brightPositions = new Float32Array(brightStarCount * 3);
    const brightColors = new Float32Array(brightStarCount * 3);

    for (let i = 0; i < brightStarCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const phi = Math.acos(u);
      const r = 2100 + Math.random() * 1200;
      brightPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      brightPositions[i * 3 + 1] = r * Math.cos(phi);
      brightPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const tone = 0.92 + Math.random() * 0.08;
      brightColors[i * 3] = tone;
      brightColors[i * 3 + 1] = tone * 0.98;
      brightColors[i * 3 + 2] = 1.0;
    }
    brightStarGeo.setAttribute('position', new THREE.BufferAttribute(brightPositions, 3));
    brightStarGeo.setAttribute('color', new THREE.BufferAttribute(brightColors, 3));
    const brightStarMat = new THREE.PointsMaterial({
      map: starTex,
      size: 3.2,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false
    });
    const brightStarPoints = new THREE.Points(brightStarGeo, brightStarMat);
    starGroup.add(brightStarPoints);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 6000);
    camera.position.set(0, 0, 8.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    const moonRadius = 2.28;
    const moonGroup = new THREE.Group();
    moonGroup.rotation.x = 0.0;
    moonGroup.rotation.y = -1.45; // Showcase iconic near-side lunar maria & craters immediately
    scene.add(moonGroup);
    moonGroupRef.current = moonGroup;

    // Authentic NASA LROC & LOLA 3D Moon Surface & High-Resolution GLB Asset
    const texLoader = new THREE.TextureLoader();
    const lrocTex = texLoader.load('/textures/lroc_color_2k.jpg');
    lrocTex.colorSpace = THREE.SRGBColorSpace;
    const lolaDisp = texLoader.load('/textures/lola_displacement_2k.jpg');

    const sphereGeo = new THREE.SphereGeometry(moonRadius, 128, 128);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: lrocTex,
      bumpMap: lolaDisp,
      bumpScale: 0.12,
      color: 0x88929e, // Natural lunar regolith albedo (prevents blown-out white disc)
      roughness: 0.94,
      metalness: 0.0
    });
    const fallbackMoon = new THREE.Mesh(sphereGeo, sphereMat);
    fallbackMoon.name = 'NASA_LROC_SHOWCASE_MOON';
    moonGroup.add(fallbackMoon);

    // Asynchronously load the user's authentic 3D Moon GLB model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/moon_3d_asset.glb',
      (gltf) => {
        const model = gltf.scene;
        // Calculate true mesh geometry radius (ignoring bounding box diagonal inflation)
        let actualRadius = 0;
        model.traverse((child) => {
          if (child.isMesh && child.geometry) {
            child.geometry.computeBoundingSphere();
            if (child.geometry.boundingSphere) {
              actualRadius = Math.max(actualRadius, child.geometry.boundingSphere.radius);
            }
          }
        });
        const modelRadius = actualRadius || 1.271864;
        const scale = moonRadius / modelRadius;
        model.scale.setScalar(scale);

        // Center model geometry perfectly at (0, 0, 0)
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.sub(center);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = 0.92;
              child.material.metalness = 0.0;
              if (child.material.map) {
                child.material.map.colorSpace = THREE.SRGBColorSpace;
                child.material.map.needsUpdate = true;
              }
              child.material.needsUpdate = true;
            }
          }
        });

        model.name = 'USER_MOON_3D_ASSET';
        // Replace fallback smoothly
        if (fallbackMoon.parent) {
          moonGroup.remove(fallbackMoon);
        }
        moonGroup.add(model);
      },
      undefined,
      (err) => {
        console.warn('Moon GLB loader fallback to LROC texture sphere:', err);
      }
    );

    // Active White Pin 3D Anchor Object
    const activePinAnchor = new THREE.Object3D();
    activePinAnchor.visible = false;
    moonGroup.add(activePinAnchor);
    activePinAnchorRef.current = activePinAnchor;

    // Solar Lighting
    const sunLight = new THREE.DirectionalLight(0xdbeafe, 2.5);
    sunLight.position.set(14, 5, 10);
    scene.add(sunLight);

    const earthshine = new THREE.DirectionalLight(0x93c5fd, 0.65);
    earthshine.position.set(-12, -6, -8);
    scene.add(earthshine);

    const ambLight = new THREE.AmbientLight(0x1e293b, 0.35);
    scene.add(ambLight);

    // Raycaster for clicking directly on the Moon surface
    const raycaster = new THREE.Raycaster();

    const performRaycastClick = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([moonGroup], true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const hitLocal = moonGroup.worldToLocal(hit.point.clone()).normalize();

        // Calculate latitude & longitude from local sphere coordinates
        const phi = Math.acos(Math.max(-1, Math.min(1, hitLocal.y)));
        const lat = 90 - (phi * 180 / Math.PI);
        let lon = (Math.atan2(hitLocal.z, -hitLocal.x) * 180 / Math.PI) - 180;
        if (lon < -180) lon += 360;
        if (lon > 180) lon -= 360;

        const clickedLat = Number(lat.toFixed(2));
        const clickedLon = Number(lon.toFixed(2));

        // Find nearest candidate site for intelligent naming
        let closestSite = null;
        let minDist = Infinity;
        for (const site of LANDING_SITES) {
          const dLat = site.lat - clickedLat;
          const dLon = site.lon - clickedLon;
          const dist = Math.hypot(dLat, dLon);
          if (dist < minDist) {
            minDist = dist;
            closestSite = site;
          }
        }

        const latDirection = clickedLat >= 0 ? 'N' : 'S';
        const lonDirection = clickedLon >= 0 ? 'E' : 'W';

        // NEVER snap or shift coordinates! The pin stays 100% on the exact clicked spot!
        const isNearCandidate = closestSite && minDist < 3.0;
        const siteName = isNearCandidate
          ? `${closestSite.name.split(' (')[0]} Area`
          : `Lunar Point (${Math.abs(clickedLat).toFixed(1)}°${latDirection}, ${Math.abs(clickedLon).toFixed(1)}°${lonDirection})`;

        const peakM = isNearCandidate
          ? closestSite.elevationM
          : Math.round(2200 + Math.sin((clickedLon * Math.PI) / 60) * 1500 + (Math.abs(clickedLat) - 80) * 220);

        const sunPct = isNearCandidate
          ? closestSite.illuminationPct
          : Math.min(92, Math.max(50, Math.round((76 + (peakM / 5040) * 12 + (Math.abs(clickedLat) - 80) * 0.4) * 10) / 10));

        const targetSite = {
          id: `custom-spot-${Math.round(clickedLat)}-${Math.round(clickedLon)}`,
          name: siteName,
          elevationM: peakM,
          illuminationPct: sunPct,
          lat: clickedLat,
          lon: clickedLon
        };

        // Pin 3D position is copied directly from hitLocal on the sphere surface (NEVER shifts):
        const p = hitLocal.clone().multiplyScalar(moonRadius + 0.03);
        activePinAnchor.position.copy(p);
        activePinAnchor.visible = true;

        // Ensure auto-rotation is NEVER triggered on click so the Moon and pin stay 100% stationary!
        isAutoRotatingRef.current = false;

        soundFX.playSuccessChime();
        setSelectedSiteId(targetSite.id);
        if (onSelectSite) onSelectSite(targetSite);
        setPlacedSite(targetSite);
        setHasDroppedPinOnGlobe(true);
        hasDroppedPinOnGlobeRef.current = true;
        setGlobePickedBanner(`Pin Dropped: ${targetSite.name.split(' (')[0]}`);

        // Dismiss other filter pins immediately so only this pin remains!
        setPinnedFilterRegions([]);

        // Trigger Framer AI Text Loading FX for 2.5s on location selection (Strictly 2 to 3 seconds)
        if (telemetryTimeoutRef.current) clearTimeout(telemetryTimeoutRef.current);
        setIsAnalyzingTelemetry(true);
        telemetryTimeoutRef.current = setTimeout(() => {
          setIsAnalyzingTelemetry(false);
        }, 2500);
      }
    };
    triggerRaycastRef.current = performRaycastClick;

    // Google Maps Style Smooth Zoom Control (Only the Moon zooms in/out, screen & UI remain intact)
    let currentCamDistance = 8.8;
    let targetCamDistance = 8.8;
    const minZoomDistance = 2.6; // Close-up orbital inspection
    const maxZoomDistance = 14.0; // High-altitude vantage overview

    // Interactive Drag to Rotate Globe & Click to Drop Pin
    let isPointerDown = false;
    let downClientX = 0;
    let downClientY = 0;
    let downTime = 0;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const domElement = renderer.domElement;

    // Mouse Wheel / Trackpad Zoom: zooms the 3D Moon without moving page or UI
    const handleWheel = (e) => {
      if (!isGlobePickerActiveRef.current) return;
      e.preventDefault();
      const zoomStep = e.deltaY * 0.005;
      targetCamDistance = Math.max(minZoomDistance, Math.min(maxZoomDistance, targetCamDistance + zoomStep));
    };

    // Touchscreen / Mobile 2-Finger Pinch Zoom
    let pinchStartDist = 0;
    let pinchStartCamDist = 8.8;

    const handleTouchStart = (e) => {
      if (!isGlobePickerActiveRef.current) return;
      if (e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartCamDist = targetCamDistance;
      }
    };

    const handleTouchMove = (e) => {
      if (!isGlobePickerActiveRef.current) return;
      if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = pinchStartDist / currentDist;
        targetCamDistance = Math.max(minZoomDistance, Math.min(maxZoomDistance, pinchStartCamDist * scale));
      }
    };

    const handleTouchEnd = () => {
      pinchStartDist = 0;
    };

    const handlePointerDown = (e) => {
      if (!isGlobePickerActiveRef.current) return;
      isPointerDown = true;
      downClientX = e.clientX;
      downClientY = e.clientY;
      downTime = performance.now();
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const handlePointerMove = (e) => {
      if (!isPointerDown || !isGlobePickerActiveRef.current) return;
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      // Fine-tune rotation sensitivity with current zoom level for Google Maps-grade feel
      const zoomRatio = Math.max(0.4, currentCamDistance / 8.8);
      moonGroup.rotation.y += deltaX * 0.005 * zoomRatio;
      moonGroup.rotation.x = Math.max(-1.35, Math.min(0.25, moonGroup.rotation.x + deltaY * 0.005 * zoomRatio));
    };

    const handlePointerUp = (e) => {
      if (!isGlobePickerActiveRef.current) return;
      if (isPointerDown) {
        isPointerDown = false;
        const moveDist = Math.hypot(e.clientX - downClientX, e.clientY - downClientY);
        const duration = performance.now() - downTime;

        // If movement is minimal (< 6px), it's a deliberate click on the Moon!
        if (moveDist < 6 && duration < 400) {
          performRaycastClick(e.clientX, e.clientY);
        }
      }
    };

    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    domElement.addEventListener('touchend', handleTouchEnd);
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation Loop
    let animId;
    const render = () => {
      animId = requestAnimationFrame(render);

      // Once full-screen landing video begins playing, suspend WebGL rendering
      // This frees 100% of GPU compute & decoder bandwidth exclusively for locked 60 FPS video playback
      if (isLandingVideoActiveRef.current) {
        return;
      }

      const rightPanelWidth = Math.min(540, width * 0.48);
      const visibleHeight = 2 * currentCamDistance * Math.tan((34 * Math.PI) / 360);

      if (isLaunchingExpeditionRef.current) {
        // Moon swipes smoothly to the right across the viewport without camera penetrating the surface
        const elapsed = performance.now() - launchStartTimeRef.current;
        const swipeDuration = 1400; // ms
        const s = Math.min(1.0, elapsed / swipeDuration);

        // Smooth cubic ease-in-out: starts gentle from rest, glides smoothly off to the right
        const t = s * s * (3 - 2 * s);

        const startX = startMoonXRef.current;
        // Sweeps from startX all the way across to the right until fully off-screen (+15.0)
        const targetSwipeX = 15.0;
        const moonX = bezierCubic(startX, startX + 2.0, targetSwipeX * 0.7, targetSwipeX, t);

        // Camera stays at a fixed cinematic observation distance (z = 7.5) so only the cratered surface sweeps past
        currentCamDistance += (7.5 - currentCamDistance) * 0.10;
        camera.position.z = currentCamDistance;
        moonGroup.position.x = moonX;
        moonGroup.rotation.y += 0.005;

        // When the Moon has fully swiped off-screen to the right:
        if (s >= 1.0) {
          if (!hasTriggeredBlackoutRef.current) {
            hasTriggeredBlackoutRef.current = true;
            setIsBlackoutActive(true);
            // Blackout holds for 1.3 seconds ("within 1 or 2 sec"), then video starts playing!
            setTimeout(() => {
              if (!hasTriggeredVideoRef.current && startLandingVideoRef.current) {
                startLandingVideoRef.current();
              }
            }, 1300);
          }
        }
      } else if (isGlobePickerActiveRef.current) {
        // Smooth Google Maps Style Camera Zoom Interpolation
        currentCamDistance += (targetCamDistance - currentCamDistance) * 0.12;
        camera.position.z = currentCamDistance;
        moonGroup.position.x += (0 - moonGroup.position.x) * 0.08;
        // Rotates only when user drags
      } else {
        targetCamDistance = 8.8;
        currentCamDistance += (8.8 - currentCamDistance) * 0.08;
        camera.position.z = currentCamDistance;

        const targetMoonX = - (rightPanelWidth * 0.88 / (2 * height)) * visibleHeight;
        moonGroup.position.x += (targetMoonX - moonGroup.position.x) * 0.08;

        // Continuous smooth rotation from left to right across the screen
        moonGroup.rotation.y += 0.0012;
        moonGroup.rotation.x += (0.0 - moonGroup.rotation.x) * 0.04;
      }
      starGroup.rotation.y += 0.00008;

      if (!isLaunchingExpeditionRef.current) {

        const shouldShowPinAnchor = (
          isGlobePickerActiveRef.current
            ? hasDroppedPinOnGlobeRef.current && activePinAnchor.visible
            : activePinAnchor.visible
        );

        if (shouldShowPinAnchor) {
          camera.updateMatrixWorld();
          moonGroup.updateMatrixWorld();

          const wp = new THREE.Vector3();
          activePinAnchor.getWorldPosition(wp);

          const toCam = new THREE.Vector3().subVectors(camera.position, wp).normalize();
          const moonCenter = new THREE.Vector3();
          moonGroup.getWorldPosition(moonCenter);
          const norm = new THREE.Vector3().subVectors(wp, moonCenter).normalize();
          const dot = norm.dot(toCam);
          const isVisible = dot > 0.02;

          wp.project(camera);
          const screenX = ((wp.x + 1) * width) / 2;
          const screenY = ((-wp.y + 1) * height) / 2;

          setPlacedPinScreenPos({ x: screenX, y: screenY, isVisible });
        } else {
          setPlacedPinScreenPos((prev) => (prev !== null ? null : prev));
        }

        // Project all filtered regions (when user selects a tier in the filter)
        if (pinnedFilterRegionsRef.current && pinnedFilterRegionsRef.current.length > 0) {
          camera.updateMatrixWorld();
          moonGroup.updateMatrixWorld();
          const moonCenter = new THREE.Vector3();
          moonGroup.getWorldPosition(moonCenter);

          const positions = pinnedFilterRegionsRef.current.map((region) => {
            const lp = latLonToVector3(region.lat, region.lon, moonRadius + 0.03);
            const wp = lp.clone().applyMatrix4(moonGroup.matrixWorld);

            const toCam = new THREE.Vector3().subVectors(camera.position, wp).normalize();
            const norm = new THREE.Vector3().subVectors(wp, moonCenter).normalize();
            const dot = norm.dot(toCam);
            const isVisible = dot > 0.02;

            wp.project(camera);
            const screenX = ((wp.x + 1) * width) / 2;
            const screenY = ((-wp.y + 1) * height) / 2;
            return { region, x: screenX, y: screenY, isVisible };
          });
          setPinnedFilterScreenPositions(positions);
        } else {
          setPinnedFilterScreenPositions((prev) => (prev.length === 0 ? prev : []));
        }
      }

      renderer.render(scene, camera);
    };
    render();

    const handleResize = () => {
      if (!container) return;
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    handleResizeRef.current = handleResize;

    window.addEventListener('resize', handleResize);

    const ro = new ResizeObserver(() => {
      handleResize();
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      brightStarGeo.dispose();
      brightStarMat.dispose();
      starTex.dispose();
      lrocTex.dispose();
      lolaDisp.dispose();
    };
  }, []);

  // When user selects a site from the list or filter, auto-rotate the Moon and dismiss other filter pins!
  const handleSelectSiteFromList = (site) => {
    soundFX.playClick();
    setSelectedSiteId(site.id);
    if (onSelectSite) onSelectSite(site);
    setPlacedSite(site);
    selectedSiteForOrientationRef.current = site;
    setPinnedFilterRegions([]); // Dismiss any remaining multi-tier pins

    // Place the white pin on that site
    if (activePinAnchorRef.current) {
      const p = latLonToVector3(site.lat, site.lon, moonRadius + 0.03);
      activePinAnchorRef.current.position.copy(p);
      activePinAnchorRef.current.visible = true;
    }

    // Auto-rotate Moon to face this exact site towards user
    const { targetRx, targetRy } = getSiteTargetRotation(site.lat, site.lon);
    targetRotationRef.current = { rx: targetRx, ry: targetRy };
    isAutoRotatingRef.current = true;

    // Trigger Framer AI Text Loading FX for 2.5s on location selection (Strictly 2 to 3 seconds)
    if (telemetryTimeoutRef.current) clearTimeout(telemetryTimeoutRef.current);
    setIsAnalyzingTelemetry(true);
    telemetryTimeoutRef.current = setTimeout(() => {
      setIsAnalyzingTelemetry(false);
    }, 2500);
  };

  // Step Advancement & Quick Select Confirmation
  const handleQuickSelectDone = () => {
    soundFX.playSuccessChime();
    const siteToUse = LANDING_SITES.find(s => s.id === selectedSiteId) || placedSite || selectedSite || LANDING_SITES[0];
    const vehId = selectedVehicleId || activeVehicle || 'viper';
    const vehObj = VEHICLE_OPTIONS.find(v => v.id === vehId) || { id: vehId, name: vehId };

    if (onSelectSite && siteToUse) {
      onSelectSite(siteToUse);
    }
    if (onSelectVehicle && vehId) {
      onSelectVehicle(vehId);
    }

    if (onLaunchExpedition) {
      onLaunchExpedition({
        site: siteToUse,
        vehicle: vehObj,
        customRover: customRoverFile,
        customRoverUrl: customRoverUrl || (typeof window !== 'undefined' ? window.__CUSTOM_ROVER_URL__ : null),
        simDate: effectiveSimDate,
        mineralTarget: activeMineral
      });
    }
  };

  const handleNextStep = () => {
    // If user selected Upload Your Own Rover, lock advancement until a 3D model is actually uploaded
    if (activeStep === 2 && selectedVehicleId === 'custom-uyor' && !customRoverFile) {
      return;
    }
    soundFX.playClick();
    if (activeStep < 4) {
      setActiveStep(prev => prev + 1);
    } else {
      handleFinalLaunch();
    }
  };

  const handlePrevStep = () => {
    soundFX.playClick();
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  // UYOR File Handling
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFX.playTelemetry();
    setCustomRoverFile(file);
    const url = URL.createObjectURL(file);
    setCustomRoverUrl(url);

    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setCustomRoverName(cleanName.toUpperCase());
    setSelectedVehicleId('custom-uyor');
    if (onSelectVehicle) onSelectVehicle('custom-uyor');
  };

  // ─── FULLSCREEN LANDING VIDEO FLOW ───
  const startLandingVideo = () => {
    if (hasTriggeredVideoRef.current) return;
    hasTriggeredVideoRef.current = true;
    setIsLandingVideoActive(true);
    isLandingVideoActiveRef.current = true;
    setHasVideoStartedPlaying(true);

    // Trigger blur-to-focus "Landing" text at bottom-right, fading away at 4 seconds
    setIsLandingTextVisible(true);
    setTimeout(() => {
      setIsLandingTextVisible(false);
    }, 4000);

    const video = landingVideoRef.current;
    if (video) {
      video.currentTime = 0;
      video.playbackRate = 1.0;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Video started playing smoothly full-screen to completion
          })
          .catch((err) => {
            console.warn('Landing video play retry:', err);
            video.muted = true;
            video.play().catch(() => {
              handleVideoFinished();
            });
          });
      }
    } else {
      // If video element is not available, immediately advance to browser
      handleVideoFinished();
    }

    // Safety watchdog: Video is 17.6s. Only force transition if completely stalled beyond 45s
    setTimeout(() => {
      if (!hasTriggeredLaunchRef.current) {
        handleVideoFinished();
      }
    }, 45000);
  };
  startLandingVideoRef.current = startLandingVideo;

  const handleVideoFinished = () => {
    if (hasTriggeredLaunchRef.current) return;
    hasTriggeredLaunchRef.current = true;
    soundFX.playSuccessChime();
    if (landingVideoRef.current) {
      landingVideoRef.current.pause();
    }
    if (onLaunchExpedition) {
      onLaunchExpedition({
        site: currentSite,
        vehicle: currentVehicle,
        customRover: selectedVehicleId === 'custom-uyor' ? {
          name: customRoverName,
          file: customRoverFile,
          url: customRoverUrl,
          mass: customRoverMass
        } : null,
        mineralTarget: currentTarget,
        simDate: effectiveSimDate
      });
    }
  };

  // Enforce zero skips, zero seeking, zero key controls while video is playing
  useEffect(() => {
    if (!isLandingVideoActive) return;
    const blockKeys = (e) => {
      // Prevent space, arrow keys, Tab, Enter, j, k, l, f, m, etc.
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', blockKeys, { capture: true });
    window.addEventListener('keyup', blockKeys, { capture: true });
    return () => {
      window.removeEventListener('keydown', blockKeys, { capture: true });
      window.removeEventListener('keyup', blockKeys, { capture: true });
    };
  }, [isLandingVideoActive]);

  const handleFinalLaunch = () => {
    soundFX.playRocketRumble();
    soundFX.playQuindarTone();
    setIsLaunchingExpedition(true);
    isLaunchingExpeditionRef.current = true;
    launchStartTimeRef.current = performance.now();
    hasTriggeredBlackoutRef.current = false;
    hasTriggeredVideoRef.current = false;
    hasTriggeredLaunchRef.current = false;
    setIsBlackoutActive(false);
    setIsLandingTextVisible(false);
    startMoonXRef.current = moonGroupRef.current ? moonGroupRef.current.position.x : -1.6;

    // Pre-arm / preload the video right inside this user click event
    if (landingVideoRef.current) {
      landingVideoRef.current.load();
      landingVideoRef.current.currentTime = 0;
    }

    if (onSelectDate) onSelectDate(effectiveSimDate);
  };

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      width: '100vw',
      background: '#020306',
      color: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'fixed',
      inset: 0,
      overflow: 'hidden'
    }}>
      {/* ─── 1. FULLSCREEN 100VW x 100VH CELESTIAL CANVAS (24,000+ STAR CELESTIAL VAULT & 3D MOON) ─── */}
      <div
        ref={canvasMountRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          cursor: isGlobePickerActive ? 'grab' : 'default',
          userSelect: 'none',
          touchAction: 'none'
        }}
      />

      {/* ─── 2. MAP PIN MARKERS (RENDERED IN SCREEN SPACE ON TOP OF 3D MOON) ─── */}
      {placedSite && placedPinScreenPos && (!isGlobePickerActive || hasDroppedPinOnGlobe) && !isLaunchingExpedition && (
        <WhiteMapPinMarker
          site={placedSite}
          x={placedPinScreenPos.x}
          y={placedPinScreenPos.y}
          isVisible={placedPinScreenPos.isVisible}
          simDate={effectiveSimDate}
          containerWidth={typeof window !== 'undefined' ? window.innerWidth : 1200}
          isAnalyzing={isAnalyzingTelemetry}
          onClick={() => {
            if (isGlobePickerActive) {
              setIsGlobePickerActive(false);
            }
          }}
        />
      )}

      {isGlobePickerActive && !isLaunchingExpedition && pinnedFilterScreenPositions.map((pos) => {
        if (placedSite && placedSite.id === pos.region.id) return null;
        return (
          <WhiteMapPinMarker
            key={pos.region.id}
            site={pos.region}
            x={pos.x}
            y={pos.y}
            isVisible={pos.isVisible}
            simDate={effectiveSimDate}
            containerWidth={typeof window !== 'undefined' ? window.innerWidth : 1200}
            onClick={() => {
              handleSelectSiteFromList(pos.region);
              setHasDroppedPinOnGlobe(true);
              setPinnedFilterRegions([]);
            }}
          />
        );
      })}

      {/* ─── 3. MINIMAL UNDER-MOON PROGRESS INDICATOR (CENTERED HORIZONTALLY BENEATH MOON ON LEFT) ─── */}
      {!isGlobePickerActive && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          left: 'calc((100vw - 540px) / 2)',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 25,
          pointerEvents: isLaunchingExpedition ? 'none' : 'auto',
          opacity: isLaunchingExpedition ? 0 : 1,
          transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {[0, 1, 2, 3].map((stepIdx) => {
            const isCurrent = activeStep === stepIdx;
            const isPassed = activeStep > stepIdx;
            return (
              <div
                key={stepIdx}
                onClick={() => {
                  soundFX.playClick();
                  setActiveStep(stepIdx);
                }}
                style={{
                  width: isCurrent ? '34px' : '18px',
                  height: '3px',
                  borderRadius: '2px',
                  background: isCurrent ? '#ffffff' : isPassed ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                title={`Step ${stepIdx + 1}`}
              />
            );
          })}
        </div>
      )}

      {/* ─── 4. FLOATING LOGO ONLY (HIDDEN WHEN IN GLOBE PICKER TO PREVENT OVERLAP) ─── */}
      {!isGlobePickerActive && (
        <div style={{
          position: 'fixed',
          top: '28px',
          left: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          zIndex: 100,
          pointerEvents: isLaunchingExpedition ? 'none' : 'auto',
          opacity: isLaunchingExpedition ? 0 : 1,
          transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <CodyseeyHandwrittenLogo height={22} stretch={0.75} immediate={true} />
          <OriginalVerticalDivider height={16} visible={true} />
          <NasaSpaceAppsOfficialLogo height={26} />
        </div>
      )}

      {/* ─── C. GLOBE PICKER ACTIVE TOP OVERLAY (BACK BUTTON & CINEMATIC TITLE) ─── */}
      {isGlobePickerActive && (
        <>
          <div style={{
            position: 'fixed',
            top: '28px',
            left: '36px',
            zIndex: 500,
            pointerEvents: 'auto'
          }}>
            <GlassBackButton
              onClick={() => setIsGlobePickerActive(false)}
              label="Back to Sites"
            />
          </div>

          {/* Centered Top Title (Grammar corrected, blur-to-focus animation from Epilogue section) */}
          <div style={{
            position: 'fixed',
            top: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 500,
            pointerEvents: 'none',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              fontSize: 'clamp(0.85rem, 1.5vw, 1.15rem)',
              fontWeight: 300,
              letterSpacing: '0.16em',
              color: 'rgba(255, 255, 255, 0.92)',
              fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
              textTransform: 'uppercase'
            }}>
              {["CLICK", "AND", "ROTATE", "THE", "GLOBE", "TO", "SELECT", "A", "LOCATION"].map((word, wIdx) => (
                <span
                  key={wIdx}
                  style={{
                    display: 'inline-block',
                    marginRight: '0.45em',
                    animation: `focusWordBlurIn 1.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + wIdx * 0.09}s forwards`,
                    opacity: 0,
                    filter: 'blur(16px)',
                    transform: 'scale(1.05)'
                  }}
                >
                  {word}
                </span>
              ))}
            </span>
          </div>

          {/* Top-Right: Ultra-Minimal Surface Filter (Arrives ONLY in Globe Picker mode) */}
          <div style={{
            position: 'fixed',
            top: '28px',
            right: '36px',
            zIndex: 500,
            pointerEvents: 'auto'
          }}>
            <LunarSurfaceFilter
              selectedSiteId={selectedSiteId}
              isOpen={isSurfaceFilterOpen}
              onToggleOpen={() => setIsSurfaceFilterOpen(prev => !prev)}
              onFilterTierChange={(regions) => setPinnedFilterRegions(regions)}
              onSelectRegion={(region) => {
                handleSelectSiteFromList(region);
                setHasDroppedPinOnGlobe(true);
                setIsSurfaceFilterOpen(false);
              }}
            />
          </div>
        </>
      )}

      {/* ─── MINIMAL & CLEAN REAL-TIME TELEMETRY HUD IN GLOBE PICKER (ARRIVES ONLY ONCE ANALYSIS IS RESOLVED) ─── */}
      {isGlobePickerActive && hasDroppedPinOnGlobe && placedSite && !isAnalyzingTelemetry && (
        <div style={{
          position: 'fixed',
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(8, 14, 28, 0.94) 0%, rgba(4, 8, 18, 0.96) 50%, rgba(10, 16, 32, 0.92) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.28)',
          borderRadius: '999px',
          padding: '8px 22px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          zIndex: 600,
          fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 24px rgba(56, 189, 248, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.28)',
          animation: 'elevateButtonIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Site Identity with White Pin SVG */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WhiteMapPinIcon size={18} glow={false} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                {placedSite.name.split(' (')[0]}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                {Math.abs(placedSite.lat).toFixed(1)}°{placedSite.lat >= 0 ? 'N' : 'S'}, {Math.abs(placedSite.lon).toFixed(1)}°{placedSite.lon >= 0 ? 'E' : 'W'}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.12)' }} />

          {/* 3 Real-Time Scientific Metrics (Ultra Minimal Google Font) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase' }}>
                Peak
              </span>
              <span style={{ fontWeight: 500, color: '#ffffff' }}>
                {placedSiteMetrics.peakRange}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase' }}>
                Sunlight
              </span>
              <span style={{ fontWeight: 500, color: '#ffffff' }}>
                {placedSiteMetrics.sunlight}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: placedSiteMetrics.connectivityColor }} />
              <span style={{ color: placedSiteMetrics.connectivityColor, fontWeight: 500 }}>
                {placedSiteMetrics.connectivity}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.12)' }} />

          {/* Clean Confirm Site Pill Button */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setIsGlobePickerActive(false);
              selectedSiteForOrientationRef.current = placedSite;
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              borderRadius: '999px',
              padding: '6px 16px',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Confirm Site
          </button>
        </div>
      )}

      {/* ─── D. RIGHT HALF: QUESTIONS PANEL (HIDDEN COMPLETELY IN GLOBE PICKER MODE) ─── */}
      {!isGlobePickerActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '540px',
          maxWidth: '48vw',
          height: '100%',
          zIndex: 20,
          background: 'transparent', // 100% boundary-less
          borderLeft: 'none',        // Zero visible boundary line
          boxShadow: 'none',         // Zero hard box shadow
          fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
          overflow: 'hidden',
          opacity: isLaunchingExpedition ? 0 : 1,
          transform: isLaunchingExpedition ? 'translateX(70px)' : 'translateX(0)',
          pointerEvents: isLaunchingExpedition ? 'none' : 'auto',
          transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Animated Fluid Shader Background (Screen-blended so 24,000 celestial stars shine directly through the purple nebula!) */}
          <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, mixBlendMode: 'screen' }}>
            <RightShaderBackground />
          </div>

          {/* Scrollable Questions Viewport */}
          <div
            className="questions-scroll-panel"
            style={{
              position: 'relative',
              zIndex: 10,
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '40px 40px 48px 40px',
              boxSizing: 'border-box'
            }}
          >
            {/* Inner Content Wrapper: Centered vertically when short, scrolls naturally from top when tall */}
            <div style={{
              position: 'relative',
              width: '100%',
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              margin: 'auto 0'
            }}>
              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 0: SELECT YOUR OBJECTIVE                                */}
              {/* ───────────────────────────────────────────────────────────── */}
              {activeStep === 0 && (
                <div className="staging-step-enter">
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 400,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2,
                    color: '#ffffff',
                    margin: '0 0 18px 0',
                    fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                  }}>
                    Select Your Objective
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {RESEARCH_OBJECTIVES.map((tgt) => {
                      const isSelected = selectedTargetId === tgt.id;
                      const isOther = tgt.id === 'custom-other';
                      const isHovered = hoveredRowId === tgt.id;

                      return (
                        <div
                          key={tgt.id}
                          onClick={() => {
                            soundFX.playClick();
                            setSelectedTargetId(tgt.id);
                            if (!isOther && onSelectMineralTarget) onSelectMineralTarget(tgt);
                          }}
                          onMouseEnter={() => setHoveredRowId(tgt.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            background: isSelected ? 'rgba(255, 255, 255, 0.08)' : isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.025)',
                            border: isSelected ? '1px solid rgba(255, 255, 255, 0.45)' : isHovered ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '12px 18px',
                            cursor: 'pointer',
                            backdropFilter: 'blur(16px)',
                            boxShadow: isSelected ? '0 0 24px rgba(255, 255, 255, 0.1)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                              {/* Headline is ALWAYS the static title (e.g. "Water Ice" or "Other") */}
                              <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {tgt.name}
                              </span>

                              {/* Hover inline reveal of description */}
                              <span style={{
                                fontSize: '12.5px',
                                color: 'rgba(255, 255, 255, 0.5)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: isHovered ? '420px' : '0px',
                                opacity: isHovered ? 1 : 0,
                                transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                pointerEvents: 'none',
                                marginLeft: isHovered ? '8px' : '0px'
                              }}>
                                — {isOther ? 'Define custom scientific research objective' : tgt.desc}
                              </span>
                            </div>

                            {isSelected && (!isOther || customObjectiveText.trim()) && (
                              <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: '8px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Custom Objective Capsule Pill Input (Natural Frosted Glass) */}
                          {isOther && isSelected && (
                            <div style={{ marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
                              <CustomObjectivePillInput
                                value={customObjectiveText}
                                onChange={(val) => setCustomObjectiveText(val)}
                                onSubmit={(val) => {
                                  setCustomObjectiveText(val);
                                  if (onSelectMineralTarget) {
                                    onSelectMineralTarget({ id: 'custom-other', name: val, desc: 'Custom objective' });
                                  }
                                }}
                                placeholder="Specify your mission objective..."
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 1: SELECT THE LANDING SITE (WITH GLOBE PICKER OPTION)    */}
              {/* ───────────────────────────────────────────────────────────── */}
              {activeStep === 1 && (
                <div className="staging-step-enter">
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 400,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2,
                    color: '#ffffff',
                    margin: '0 0 16px 0',
                    fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                  }}>
                    Select The Landing Site
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* All 6 Official NASA Water Ice Candidate Sites: Clean site name, hover reveals dynamics next to it */}
                    {LANDING_SITES.slice(0, 6).map((site) => {
                      const isSelected = selectedSiteId === site.id;
                      const isHovered = hoveredRowId === site.id;
                      const metrics = predictSiteMetrics(site, effectiveSimDate);

                      return (
                        <div
                          key={site.id}
                          onClick={() => handleSelectSiteFromList(site)}
                          onMouseEnter={() => setHoveredRowId(site.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            background: isSelected ? 'rgba(255, 255, 255, 0.08)' : isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.025)',
                            border: isSelected ? '1px solid rgba(255, 255, 255, 0.45)' : isHovered ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '12px 18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backdropFilter: 'blur(16px)',
                            boxShadow: isSelected ? '0 0 24px rgba(255, 255, 255, 0.1)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                            {/* Direct Site Name Headline */}
                            <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {site.name.split(' (')[0]}
                            </span>

                            {/* Dynamics arrive smoothly next to site name on hover */}
                            <span style={{
                              fontSize: '12.5px',
                              color: 'rgba(255, 255, 255, 0.5)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: isHovered ? '420px' : '0px',
                              opacity: isHovered ? 1 : 0,
                              transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                              pointerEvents: 'none',
                              marginLeft: isHovered ? '8px' : '0px'
                            }}>
                              — Peak {metrics.peakRange} • {metrics.sunlight} Sun • {metrics.connectivity} Link
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                            {site.id === 'nobile-rim-1' && hoveredRowId !== site.id && (
                              <span
                                className="ai-framer-text-wave"
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  letterSpacing: '-0.01em',
                                  display: 'inline-block',
                                  animation: 'framerGradientSweep 2.2s linear infinite',
                                  fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
                                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9))'
                                }}
                              >
                                Recommended
                              </span>
                            )}
                            {isSelected && (
                              <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* 7th Option: Choose on Lunar Globe (Silvery Laser Button) */}
                    <SilveryGlobeButton
                      onClick={() => {
                        setHasDroppedPinOnGlobe(false);
                        setIsGlobePickerActive(true);
                      }}
                    />

                    {/* Chosen Location Details (Directly Below Choose on Lunar Globe Bar) */}
                    {Boolean(selectedSiteId || placedSite) && currentSite && (
                      <div style={{
                        marginTop: '10px',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(16px)',
                        fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
                        animation: 'chosenLocationFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.45)',
                          letterSpacing: '0.02em',
                          marginBottom: '6px',
                          fontWeight: 400
                        }}>
                          Chosen Location: <span style={{ color: '#ffffff', fontWeight: 500 }}>{currentSite.name.split(' (')[0]}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '18px',
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.75)',
                          fontWeight: 400
                        }}>
                          <span>
                            Crater Peak: <strong style={{ color: '#ffffff', fontWeight: 500 }}>{activeSiteMetrics.peakRange}</strong>
                          </span>
                          <span>
                            Sunlight: <strong style={{ color: '#ffffff', fontWeight: 500 }}>{activeSiteMetrics.sunlight}</strong>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            Earth Link: <strong style={{ color: activeSiteMetrics.connectivityColor, fontWeight: 500 }}>{activeSiteMetrics.connectivity}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 2: CHOOSE YOUR ROVER (WITH UYOR DROPZONE)                */}
              {/* ───────────────────────────────────────────────────────────── */}
              {activeStep === 2 && (
                <div className="staging-step-enter">
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 400,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2,
                    color: '#ffffff',
                    margin: '0 0 18px 0',
                    fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                  }}>
                    Choose Your Rover
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {VEHICLE_OPTIONS.map((veh) => {
                      const isSelected = selectedVehicleId === veh.id;
                      const isHovered = hoveredRowId === veh.id;

                      return (
                        <div
                          key={veh.id}
                          onClick={() => {
                            soundFX.playClick();
                            setSelectedVehicleId(veh.id);
                            if (onSelectVehicle) onSelectVehicle(veh.id);
                          }}
                          onMouseEnter={() => setHoveredRowId(veh.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            background: isSelected ? 'rgba(255, 255, 255, 0.08)' : isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.025)',
                            border: isSelected ? '1px solid rgba(255, 255, 255, 0.45)' : isHovered ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '12px 18px',
                            cursor: 'pointer',
                            backdropFilter: 'blur(16px)',
                            boxShadow: isSelected ? '0 0 24px rgba(255, 255, 255, 0.1)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                              {/* Headline only initially */}
                              <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {veh.name}
                              </span>

                              {/* Hover-reveal description */}
                              <span style={{
                                fontSize: '12.5px',
                                color: 'rgba(255, 255, 255, 0.5)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: isHovered ? '420px' : '0px',
                                opacity: isHovered ? 1 : 0,
                                transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                pointerEvents: 'none',
                                marginLeft: isHovered ? '8px' : '0px'
                              }}>
                                — {veh.desc}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                              {veh.id === 'viper' && hoveredRowId !== veh.id && (
                                <span
                                  className="ai-framer-text-wave"
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    letterSpacing: '-0.01em',
                                    display: 'inline-block',
                                    animation: 'framerGradientSweep 2.2s linear infinite',
                                    fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
                                    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9))'
                                  }}
                                >
                                  Recommended
                                </span>
                              )}
                              {isSelected && (
                                <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interactive 3D Model Uploader Dropzone for Custom Rover */}
                          {isSelected && veh.id === 'custom-uyor' && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                marginTop: '12px',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px dashed rgba(255, 255, 255, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                                <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {customRoverFile ? customRoverFile.name : 'Upload 3D Rover Model (.GLB / .GLTF)'}
                                </span>
                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                  {customRoverFile ? `${(customRoverFile.size / (1024 * 1024)).toFixed(2)} MB • Surface Drive Ready` : 'Directly exported from Blender or CAD software'}
                                </span>
                              </div>
                              <label style={{
                                padding: '7px 15px',
                                borderRadius: '8px',
                                background: customRoverFile ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.12)',
                                border: customRoverFile ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(255, 255, 255, 0.25)',
                                color: customRoverFile ? '#38bdf8' : '#ffffff',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease'
                              }}>
                                {customRoverFile ? 'Change File' : 'Browse File'}
                                <input
                                  type="file"
                                  accept=".glb,.gltf"
                                  onChange={handleFileUpload}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 3: SELECT ARRIVAL DATE                                   */}
              {/* ───────────────────────────────────────────────────────────── */}
              {activeStep === 3 && (
                <div className="staging-step-enter">
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 400,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2,
                    color: '#ffffff',
                    margin: '0 0 18px 0',
                    fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                  }}>
                    Select Arrival Date
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {LAUNCH_WINDOWS.map((win) => {
                      const isSelected = selectedWindowId === win.id;
                      const isHovered = hoveredRowId === win.id;
                      const isCustom = win.id === 'custom-date';

                      return (
                        <div
                          key={win.id}
                          onClick={() => {
                            soundFX.playClick();
                            setSelectedWindowId(win.id);
                          }}
                          onMouseEnter={() => setHoveredRowId(win.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            background: isSelected ? 'rgba(255, 255, 255, 0.08)' : isHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.025)',
                            border: isSelected ? '1px solid rgba(255, 255, 255, 0.45)' : isHovered ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '12px 18px',
                            cursor: 'pointer',
                            backdropFilter: 'blur(16px)',
                            boxShadow: isSelected ? '0 0 24px rgba(255, 255, 255, 0.1)' : 'none',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                              {/* Headline only initially */}
                              <span style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {win.name}
                              </span>

                              {/* Hover-reveal description */}
                              <span style={{
                                fontSize: '12.5px',
                                color: 'rgba(255, 255, 255, 0.5)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: isHovered ? '420px' : '0px',
                                opacity: isHovered ? 1 : 0,
                                transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                pointerEvents: 'none',
                                marginLeft: isHovered ? '8px' : '0px'
                              }}>
                                — {isCustom ? (isCustomDateConfirmed ? `Launch: ${customLaunchDate}` : 'Select custom flight date') : win.desc}
                              </span>
                            </div>

                            {isSelected && (
                              <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: '8px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Custom Date Direct Calendar & Flight Trajectory Card */}
                          {isCustom && isSelected && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                marginTop: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px',
                                fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                              }}
                            >
                              {/* Calendar directly displayed, zero clutter headers or toggle buttons */}
                              <LunarCalendarModal
                                selectedDate={customLaunchDate}
                                isConfirmed={isCustomDateConfirmed}
                                onDatePendingChange={() => {
                                  setIsCustomDateConfirmed(false);
                                }}
                                onConfirmDate={(confirmedDate) => {
                                  setCustomLaunchDate(confirmedDate);
                                  setIsCustomDateConfirmed(true);
                                  const traj = calculateLunarTrajectory(confirmedDate);
                                  if (onSelectDate) onSelectDate(new Date(traj.arrivalDateStr + 'T12:00:00Z'));
                                }}
                              />

                              {/* Scientific Trajectory & Moon Touchdown Calculation Card (Appears only after tick confirmation) */}
                              {isCustomDateConfirmed && (
                                <div style={{
                                  width: '100%',
                                  maxWidth: '330px',
                                  padding: '14px 16px',
                                  background: 'rgba(255, 255, 255, 0.035)',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  borderRadius: '14px',
                                  backdropFilter: 'blur(20px)',
                                  WebkitBackdropFilter: 'blur(20px)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  animation: 'calcCardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: '11px',
                                    letterSpacing: '0.04em',
                                    color: 'rgba(255, 255, 255, 0.5)'
                                  }}>
                                    <span>TRANSLUNAR FLIGHT TRAJECTORY</span>
                                    <span style={{ color: '#ffffff', fontWeight: 500 }}>TLI ~{customTrajectory.injectionSpeedKmh.toLocaleString()} km/h</span>
                                  </div>

                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '10px',
                                    fontSize: '12px'
                                  }}>
                                    <div>
                                      <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '10.5px' }}>Lunar Distance</div>
                                      <div style={{ color: '#ffffff', fontWeight: 500, marginTop: '2px' }}>
                                        {customTrajectory.distanceKm.toLocaleString()} km
                                      </div>
                                      <div style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '9.5px' }}>
                                        ({customTrajectory.distanceMiles.toLocaleString()} mi)
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '10.5px' }}>Transit Duration</div>
                                      <div style={{ color: '#ffffff', fontWeight: 500, marginTop: '2px' }}>
                                        ~{customTrajectory.transitHours}h ({customTrajectory.transitDays} d)
                                      </div>
                                      <div style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '9.5px' }}>
                                        Avg: {customTrajectory.avgCruiseSpeedKmh.toLocaleString()} km/h
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '10px',
                                    fontSize: '12px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                                  }}>
                                    <div>
                                      <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '10.5px' }}>Injection Velocity</div>
                                      <div style={{ color: '#ffffff', fontWeight: 500, marginTop: '2px' }}>
                                        {customTrajectory.injectionSpeedKms} km/s
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '10.5px' }}>Phase at Touchdown</div>
                                      <div style={{ color: '#ffffff', fontWeight: 500, marginTop: '2px' }}>
                                        {customTrajectory.phaseName}
                                      </div>
                                      <div style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '9.5px' }}>
                                        {customTrajectory.illuminationPct}% illuminated
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{
                                    paddingTop: '8px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    justifyContent: 'space-between'
                                  }}>
                                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>Calculated Moon Touchdown</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                                      {customTrajectory.arrivalFormatted} • {customTrajectory.arrivalTimeFormatted}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 4: MISSION READY & LAUNCH                                */}
              {/* ───────────────────────────────────────────────────────────── */}
              {activeStep === 4 && (
                <div className="staging-step-enter">
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 400,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2,
                    color: '#ffffff',
                    margin: '0 0 16px 0',
                    fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                  }}>
                    Mission Ready
                  </h2>

                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.55)',
                    lineHeight: 1.5,
                    margin: '0 0 18px 0',
                    fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                  }}>
                    Your expedition parameters are locked. Ready to enter the interactive 3D Moon Browser.
                  </p>

                  {/* 4 Summary Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    marginBottom: '16px',
                    fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                  }}>
                    <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase' }}>Objective</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', marginTop: '3px' }}>{currentTarget.name}</div>
                    </div>
                    <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase' }}>Landing Site</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', marginTop: '3px' }}>{currentSite.name.split(' (')[0]}</div>
                    </div>
                    <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase' }}>Rover</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', marginTop: '3px' }}>
                        {currentVehicle?.name || 'NASA VIPER'}
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase' }}>Arrival Date</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', marginTop: '3px' }}>
                        {effectiveSimDate.toISOString().slice(0, 10)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* ACTION BUTTONS DIRECTLY BELOW THE OPTIONS (TOWARDS THE RIGHT) */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '22px',
                width: '100%',
                minHeight: '46px'
              }}>
                {/* Left: Glass Back Button (Completely hidden in Quick Select mode so user only has the option of changing site/rover!) */}
                {activeStep > 0 && !isQuickSelectMode ? (
                  <GlassBackButton
                    onClick={handlePrevStep}
                    label="Back"
                  />
                ) : (
                  <div />
                )}

                {/* Right: Glass Next / Select Button */}
                {(isOptionSelected || isQuickSelectMode) && activeStep < 4 && (
                  <div style={{
                    animation: 'elevateButtonIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                  }}>
                    <GlassNextButton
                      onClick={isQuickSelectMode ? handleQuickSelectDone : handleNextStep}
                      label={isQuickSelectMode ? "Select" : "Next"}
                    />
                  </div>
                )}

                {/* Step 4 Action: Launch Expedition into 3D Moon Browser (Exact Elevate ShinyButton Replica) */}
                {activeStep === 4 && (
                  <div style={{
                    animation: 'elevateButtonIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                  }}>
                    <ShinyButton
                      onClick={handleFinalLaunch}
                      style={{
                        padding: '0.95rem 2.4rem',
                        fontSize: '1.05rem',
                        letterSpacing: '0.02em'
                      }}
                    >
                      Enter 3D Moon Browser
                    </ShinyButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PITCH BLACKOUT SCREEN (Occurs right after Moon sweeps off to the right) ─── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999980,
        background: '#000000',
        pointerEvents: isBlackoutActive ? 'all' : 'none',
        opacity: isBlackoutActive ? 1 : 0,
        transition: 'opacity 0.22s ease-out'
      }} />

      {/* ─── FULLSCREEN LANDING VIDEO (COVERS ENTIRE SCREEN, AUTOPLAYS WHEN MOON REACHES 100%, ZERO ICONS/CONTROLS, LOCKED PLAYBACK) ─── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          background: '#000000',
          opacity: isLandingVideoActive ? 1 : 0,
          visibility: isLandingVideoActive ? 'visible' : 'hidden',
          pointerEvents: isLandingVideoActive ? 'all' : 'none',
          transition: 'opacity 0.28s ease',
          transform: 'translateZ(0)',
          willChange: 'opacity',
          backfaceVisibility: 'hidden',
          overflow: 'hidden'
        }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <video
          ref={landingVideoRef}
          src="/assets/videos/the-landing-video.mp4"
          playsInline
          autoPlay={false}
          muted
          controls={false}
          disablePictureInPicture
          onEnded={handleVideoFinished}
          onError={(e) => {
            console.warn('Video error, advancing to browser:', e);
            handleVideoFinished();
          }}
          onRateChange={(e) => {
            if (e.target.playbackRate !== 1.0) {
              e.target.playbackRate = 1.0;
            }
          }}
          onPause={(e) => {
            if (isLandingVideoActiveRef.current && !hasTriggeredLaunchRef.current) {
              e.target.play().catch(() => { });
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <source src="/assets/videos/the-landing-video.mp4" type="video/mp4" />
          <source src="/videos/the-landing-video.mp4" type="video/mp4" />
        </video>

        {/* ─── BOTTOM-RIGHT "LANDING" CINEMATIC TEXT OVERLAY (Blur-to-focus 4s fade) ─── */}
        <div style={{
          position: 'absolute',
          bottom: '48px',
          right: '56px',
          zIndex: 1000,
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: isLandingTextVisible ? 1 : 0,
          filter: isLandingTextVisible ? 'blur(0px)' : 'blur(16px)',
          transform: isLandingTextVisible ? 'scale(1)' : 'scale(1.05)',
          transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <span style={{
            fontSize: 'clamp(1.4rem, 2.5vw, 2.1rem)',
            fontWeight: 300,
            letterSpacing: '0.22em',
            color: '#ffffff',
            fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
            textTransform: 'uppercase',
            textShadow: '0 2px 18px rgba(0, 0, 0, 0.95), 0 0 24px rgba(255, 255, 255, 0.35)'
          }}>
            Landing
          </span>
        </div>
      </div>

      <style>{`
        .staging-step-enter {
          animation: stepFadeIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes stepFadeIn {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes elevateButtonIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropPinIn {
          0% { opacity: 0; transform: translate(-50%, -140%) scale(0.7); }
          60% { opacity: 1; transform: translate(-50%, -95%) scale(1.1); }
          100% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes calcCardIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes focusWordBlurIn {
          0% { opacity: 0; filter: blur(16px); transform: scale(1.05); }
          100% { opacity: 1; filter: blur(0px); transform: scale(1); }
        }
        .questions-scroll-panel::-webkit-scrollbar {
          width: 5px;
        }
        .questions-scroll-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .questions-scroll-panel::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
        }
        .questions-scroll-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.38);
        }
        .questions-scroll-panel {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
        }
      `}</style>
    </div>
  );
}
