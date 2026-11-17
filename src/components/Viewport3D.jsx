import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { degToRad } from '../utils/lunarEphemeris';
import { buildViperRover, CURIOSITY_WHEEL_SPECS } from '../utils/viperRoverBuilder';
import { buildGriffinLander, buildNovaCLander } from '../utils/clpsLanderBuilder';
import { buildApolloLunarModule } from '../utils/apolloLunarModuleBuilder';
import { soundFX } from '../utils/soundFX';
import { createStaticDeploymentTracks, updateDynamicWheelTracks, createWheelTrackMaterial } from '../utils/regolithWheelTracks';
import { buildTraverseSpline } from '../utils/shadowDodgePlanner';
import {
  getSiteElevation,
  getTerrainElevation,
  getTerrainNormal,
  getSlopeDegrees,
  getRoverHazardTelemetry,
  evaluateCrater
} from '../utils/terrainElevation';
import { createLunarRegolithMaterial, updateLunarRegolithUniforms } from '../utils/lunarRegolithShader';
import { setupLunarSouthPoleLighting } from '../utils/lunarLightingRig';
import { LANDING_SITES } from '../data/landingSites';
import LunarCoreDrillModal from './LunarCoreDrillModal';

// Memory & Disposal Armor: Disposes all textures, materials, and geometries cleanly
function disposeSurfaceScene(scene) {
  if (!scene) return;
  scene.traverse((obj) => {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m && m.dispose && m.dispose());
      } else if (obj.material.dispose) {
        obj.material.dispose();
      }
    }
  });
}

function setOrbitalGlobeVisibility(scene, orbitalMoonGroup, isVisible) {
  if (!scene || !orbitalMoonGroup) return;

  if (isVisible) {
    if (orbitalMoonGroup.parent !== scene) scene.add(orbitalMoonGroup);
    orbitalMoonGroup.position.set(0, 0, 0);
    orbitalMoonGroup.visible = true;
  } else {
    orbitalMoonGroup.visible = false;
    if (orbitalMoonGroup.parent === scene) scene.remove(orbitalMoonGroup);
  }
}

// Master Unified Elevation Function (Zero height mismatch between terrain mesh and rover wheels)
function getHorizonCurvedElevation(x, z, siteId) {
  return getSiteElevation(x, z, siteId);
}

// Generates physical 3D tire tread tracks in the regolith as VIPER drives freely
function updateFreeTracksMesh(group, points, siteId, getElevation, trackMat) {
  while (group.children.length > 0) {
    const c = group.children[0];
    if (c.geometry) c.geometry.dispose();
    group.remove(c);
  }
  if (!points || points.length < 2 || !trackMat) return;

  const leftPoints = [];
  const rightPoints = [];
  const halfGauge = 0.832; // NASA Curiosity wheel half-trackwidth (exact scaled contact)

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const cosH = Math.cos(pt.heading);
    const sinH = Math.sin(pt.heading);

    const lx = pt.x - cosH * halfGauge;
    const lz = pt.z + sinH * halfGauge;
    const ly = getElevation(lx, lz, siteId) + 0.022;
    leftPoints.push(new THREE.Vector3(lx, ly, lz));

    const rx = pt.x + cosH * halfGauge;
    const rz = pt.z - sinH * halfGauge;
    const ry = getElevation(rx, rz, siteId) + 0.022;
    rightPoints.push(new THREE.Vector3(rx, ry, rz));
  }

  [leftPoints, rightPoints].forEach(pts => {
    if (pts.length < 2) return;
    const vertices = [];
    const uvs = [];
    const indices = [];
    const halfW = 0.12;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      let forward;
      if (i < pts.length - 1) {
        forward = pts[i + 1].clone().sub(p).normalize();
      } else {
        forward = p.clone().sub(pts[i - 1]).normalize();
      }
      const side = new THREE.Vector3(-forward.z, 0, forward.x).normalize();

      vertices.push(p.x - side.x * halfW, p.y, p.z - side.z * halfW);
      vertices.push(p.x + side.x * halfW, p.y, p.z + side.z * halfW);
      const v = i * 0.45;
      uvs.push(0, v, 1, v);
    }

    for (let i = 0; i < pts.length - 1; i++) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2);
      indices.push(b + 1, b + 3, b + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, trackMat);
    mesh.receiveShadow = true;
    group.add(mesh);
  });
}

const _tempRoverEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _tempRoverMatrix = new THREE.Matrix4();
const _tempRoverVec = new THREE.Vector3();

// High-Precision NASA Curiosity/VIPER Rover 6-Wheel Contact Physics & Rocker-Bogie Rock Climbing
function computeRoverTerrainContact(rx, rz, heading, siteId, climbableRocks = []) {
  const cosH = Math.cos(heading);
  const sinH = Math.sin(heading);
  const wheels = CURIOSITY_WHEEL_SPECS.wheels;

  // Sample terrain elevation at all 6 wheels in world coordinates
  const wheelWorldElevs = [];
  for (let i = 0; i < wheels.length; i++) {
    const w = wheels[i];
    const wx = rx + w.lx * cosH + w.lz * sinH;
    const wz = rz - w.lx * sinH + w.lz * cosH;
    let baseElev = getSiteElevation(wx, wz, siteId);

    // Dynamic Rocker-Bogie Obstacle Traversal: Wheel rides up and over small climbable rocks
    if (climbableRocks && climbableRocks.length > 0) {
      let maxRockLift = 0;
      for (let k = 0; k < climbableRocks.length; k++) {
        const rock = climbableRocks[k];
        const dx = wx - rock.x;
        const dz = wz - rock.z;
        const dSq = dx * dx + dz * dz;
        const contactRadius = rock.radius + 0.16; // Wheel tire contact patch
        if (dSq < contactRadius * contactRadius) {
          const d = Math.sqrt(dSq);
          const domeFactor = Math.sqrt(Math.max(0, 1.0 - Math.pow(d / contactRadius, 2.0)));
          const rockLift = rock.height * domeFactor;
          if (rockLift > maxRockLift) maxRockLift = rockLift;
        }
      }
      baseElev += maxRockLift;
    }

    wheelWorldElevs.push(baseElev);
  }

  // Wheel indices: FR=0, MR=1, RR=2, FL=3, ML=4, RL=5
  const yFront = (wheelWorldElevs[0] + wheelWorldElevs[3]) * 0.5;
  const yRear = (wheelWorldElevs[2] + wheelWorldElevs[5]) * 0.5;
  const rawPitch = Math.atan2(yFront - yRear, CURIOSITY_WHEEL_SPECS.wheelbase);

  const yRight = (wheelWorldElevs[0] + wheelWorldElevs[1] + wheelWorldElevs[2]) / 3.0;
  const yLeft = (wheelWorldElevs[3] + wheelWorldElevs[4] + wheelWorldElevs[5]) / 3.0;
  const rawRoll = Math.atan2(yRight - yLeft, CURIOSITY_WHEEL_SPECS.trackWidth);

  // Dynamic stability clamping: Allows natural slope adherence on steep crater walls (up to 66°) while preventing flips
  const pitch = Math.max(-1.15, Math.min(1.15, rawPitch));
  const roll = Math.max(-0.85, Math.min(0.85, rawRoll));

  // Exact 3D orientation transformation for chassis frame
  _tempRoverEuler.set(-pitch, heading, roll, 'YXZ');
  _tempRoverMatrix.makeRotationFromEuler(_tempRoverEuler);

  // Calculate exact vertical displacement (deltaY) of each wheel caused by 3D pitch/heading/roll
  const deltaYs = [];
  let maxRequiredWheelBase = -Infinity;
  let sumRequiredBases = 0;

  for (let i = 0; i < wheels.length; i++) {
    _tempRoverVec.set(wheels[i].lx, 0, wheels[i].lz).applyMatrix4(_tempRoverMatrix);
    const dY = _tempRoverVec.y;
    deltaYs.push(dY);
    const reqBase = wheelWorldElevs[i] - dY;
    sumRequiredBases += reqBase;
    if (reqBase > maxRequiredWheelBase) maxRequiredWheelBase = reqBase;
  }

  const avgWheelBase = sumRequiredBases / wheels.length;

  // Comprehensive multi-point chassis hull envelope check
  // Prevents underbody, front bumper, rear deck or corners from ever embedding into steep slopes
  const hullPoints = [
    { lx: 0, ly: 0.22, lz: 0 },          // Center underbody
    { lx: 0, ly: 0.24, lz: 0.70 },       // Mid-front belly
    { lx: 0, ly: 0.24, lz: -0.70 },      // Mid-rear belly
    { lx: 0, ly: 0.26, lz: 1.35 },       // Front bumper
    { lx: 0, ly: 0.26, lz: -1.45 },      // Rear generator/battery deck
    { lx: -0.92, ly: 0.25, lz: 0 },      // Left chassis flank
    { lx: 0.92, ly: 0.25, lz: 0 },       // Right chassis flank
    { lx: -0.88, ly: 0.28, lz: 1.25 },   // Front-left hull corner
    { lx: 0.88, ly: 0.28, lz: 1.25 },    // Front-right hull corner
    { lx: -0.88, ly: 0.28, lz: -1.35 },  // Rear-left hull corner
    { lx: 0.88, ly: 0.28, lz: -1.35 }    // Rear-right hull corner
  ];

  let maxRequiredHullBase = -Infinity;
  for (let h = 0; h < hullPoints.length; h++) {
    const hp = hullPoints[h];
    const hx = rx + hp.lx * cosH + hp.lz * sinH;
    const hz = rz - hp.lx * sinH + hp.lz * cosH;
    const groundAtHull = getSiteElevation(hx, hz, siteId);
    _tempRoverVec.set(hp.lx, hp.ly, hp.lz).applyMatrix4(_tempRoverMatrix);
    const reqBaseForHull = groundAtHull - _tempRoverVec.y + 0.02; // Firm 2cm clearance above regolith
    if (reqBaseForHull > maxRequiredHullBase) maxRequiredHullBase = reqBaseForHull;
  }

  // Master chassis elevation: exactly tracks wheels while ensuring zero hull-ground embedding
  const yBase = Math.max(avgWheelBase, maxRequiredWheelBase - 0.06, maxRequiredHullBase);

  // Individual suspension articulation deltas for all 6 rocker-bogie arms
  // Ensures every tire tread sits 100% flush on the regolith with zero air gap
  const suspDeltas = wheels.map((w, i) => {
    return wheelWorldElevs[i] - (yBase + deltaYs[i]);
  });

  return {
    yBase,
    pitch,
    roll,
    wheelElevs: wheelWorldElevs,
    suspDeltas
  };
}

// Astrobotic Griffin Lunar Lander 4-Footpad Ground Contact (Always Upright and Firmly Planted)
function computeGriffinLanderGrounding(siteId) {
  // 4 landing footpads at radius 2.85m, angles PI/4, 3PI/4, 5PI/4, 7PI/4
  const y1 = getSiteElevation(2.015, 2.015, siteId);
  const y2 = getSiteElevation(-2.015, 2.015, siteId);
  const y3 = getSiteElevation(-2.015, -2.015, siteId);
  const y4 = getSiteElevation(2.015, -2.015, siteId);
  const avgElev = (y1 + y2 + y3 + y4) * 0.25;

  const yFront = (y1 + y2) * 0.5;
  const yRear = (y3 + y4) * 0.5;
  const yRight = (y1 + y4) * 0.5;
  const yLeft = (y2 + y3) * 0.5;

  const landerPitch = Math.atan2(yFront - yRear, 4.03);
  const landerRoll = Math.atan2(yRight - yLeft, 4.03);

  // Stable upright landing constraint (clamp tilt to realistic touchdown angle <= 2 deg)
  const clampedPitch = Math.max(-0.035, Math.min(0.035, landerPitch));
  const clampedRoll = Math.max(-0.035, Math.min(0.035, landerRoll));

  return {
    posY: avgElev + 0.19, // In clpsLanderBuilder, footpads are at local y = -0.19m
    pitch: clampedPitch,
    roll: clampedRoll
  };
}

// Intuitive Machines Nova-C "Odysseus" Lander Ground Contact
function computeNovaCGrounding(siteId) {
  const y1 = getSiteElevation(1.95, 0, siteId);
  const y2 = getSiteElevation(-1.95, 0, siteId);
  const y3 = getSiteElevation(0, 1.95, siteId);
  const y4 = getSiteElevation(0, -1.95, siteId);
  const avgElev = (y1 + y2 + y3 + y4) * 0.25;
  const pitch = Math.atan2(y3 - y4, 3.9);
  const roll = Math.atan2(y1 - y2, 3.9);
  return {
    posY: avgElev,
    pitch: Math.max(-0.035, Math.min(0.035, pitch)),
    roll: Math.max(-0.035, Math.min(0.035, roll))
  };
}

export default function Viewport3D({
  selectedSite,
  telemetry,
  cameraMode,
  panelTiltDeg = 0,
  activeVehicle = 'viper',
  customRoverModel = null,
  customRoverUrl = null,
  roverHeadlights = true,
  roverDrillState = 'stowed',
  activeTraverse = null,
  driveProgress = 0,
  isDriving = false,
  driveSpeedMultiplier = 1,
  onSelectSite,
  onDescendToSurface,
  setCameraMode,
  isDirectLandingDeploy = false,
  onLandingComplete = null,
  isUiRevealed = true
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const terrainGeoRef = useRef(null);
  const terrainMeshRef = useRef(null);
  const horizonGeoRef = useRef(null);
  const horizonMeshRef = useRef(null);
  const orbitalMoonGroupRef = useRef(null);
  const orbitalPinsGroupRef = useRef(null);
  const orbitalPinsListRef = useRef([]);
  const landerGroupRef = useRef(null);
  const apolloLMRef = useRef(null);
  const griffinLanderRef = useRef(null);
  const novaCLanderRef = useRef(null);
  const viperRoverRef = useRef(null);
  const wheelTracksGroupRef = useRef(null);
  const dynamicTracksGroupRef = useRef(null);
  const wheelTrackMaterialRef = useRef(null);
  const lastTrackProgressRef = useRef(-1);
  const activeVehicleRef = useRef(activeVehicle);

  // Cinematic Landing & Google Earth Street View state machine
  const landingSeqRef = useRef({
    active: false,
    phase: 'IDLE',
    time: 0,
    site: selectedSite,
    startCamPos: new THREE.Vector3(15.0, 24.0, 22.0),
    altitude: 0.0,
    velocity: 0.0,
    throttle: 0.0,
    fuel: 100.0
  });

  const [landingPhase, setLandingPhase] = useState('IDLE');
  const [landingTelemetry, setLandingTelemetry] = useState({ altitude: 0.0, velocity: 0.0, throttle: 18, fuel: 86.4 });
  const [hoveredSite, setHoveredSite] = useState(null);
  const [hoveredPinScreenPos, setHoveredPinScreenPos] = useState(null);
  const [commsTelemetry, setCommsTelemetry] = useState({ dteBlocked: false, sunOccluded: false, nearestObstacleM: 18.5 });
  const [isSiteBarOpen, setIsSiteBarOpen] = useState(false);
  const [isDrillReportOpen, setIsDrillReportOpen] = useState(false);
  const triggerCinematicLandingRef = useRef(null);

  // Hapke BRDF, Lunar Lighting Rig, LiDAR Heatmap & Geomorphological Hazard Telemetry
  const terrainMaterialRef = useRef(null);
  const lunarLightingRef = useRef(null);
  // 3 Lighting & Visualization Modes: 'light' (Default) | 'vacuum_dark' | 'heatmap'
  const [lightingMode, setLightingMode] = useState('light');
  const lightingModeRef = useRef('light');
  const isHeatmapActive = (lightingMode === 'heatmap');
  const [roverHazard, setRoverHazard] = useState({
    elevationMeters: 0,
    slopeDegrees: 0,
    hazardLevel: 'NOMINAL',
    isColdTrapCandidate: false
  });
  const [discoveredSample, setDiscoveredSample] = useState(null);
  const discoveredSampleRef = useRef(null);
  const [isHazCamPipOpen, setIsHazCamPipOpen] = useState(false);
  const [isBoundaryWarning, setIsBoundaryWarning] = useState(false);
  const isBoundaryWarningRef = useRef(false);

  const rockGroupRef = useRef(null);
  const sunLightRef = useRef(null);
  const earthshineLightRef = useRef(null);
  const sunMeshRef = useRef(null);
  const earthGroupRef = useRef(null);
  const earthMeshRef = useRef(null);
  const rfBeamGroupRef = useRef(null);
  const antennaGroupRef = useRef(null);
  const solarPanelGroupRef = useRef(null);
  const traversePathGroupRef = useRef(null);
  const splineRef = useRef(null);

  // 60 FPS Butter-Smooth Celestial Sun, Light, & Earth Interpolation Refs
  const sunPosTargetRef = useRef(new THREE.Vector3(0, 50, -2400));
  const sunPosSmoothRef = useRef(new THREE.Vector3(0, 50, -2400));
  const sunLightTargetRef = useRef(new THREE.Vector3(0, 10, -220));
  const sunLightSmoothRef = useRef(new THREE.Vector3(0, 10, -220));
  const sunIntensityTargetRef = useRef(4.8);
  const sunIntensitySmoothRef = useRef(4.8);
  const sunOpacityTargetRef = useRef(0.99);
  const earthPosTargetRef = useRef(new THREE.Vector3(0, 200, -2200));
  const earthPosSmoothRef = useRef(new THREE.Vector3(0, 200, -2200));
  const earthshineIntensityTargetRef = useRef(0.55);
  const earthshineIntensitySmoothRef = useRef(0.55);
  const isCelestialInitRef = useRef(false);

  const isDraggingRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const mouseVelRef = useRef({ x: 0, y: 0 });
  // Camera polar angles: initialized for immediate high-altitude South Pole framing in Orbit mode
  const isOrbitalInitState = (cameraMode === 'orbital');
  const cameraRotTargetRef = useRef(
    isOrbitalInitState ? { theta: 0.25, phi: 2.30, distance: 180 }
      : { theta: 0.65, phi: 1.34, distance: 14 }
  );
  const cameraRotSmoothRef = useRef(
    isOrbitalInitState ? { theta: 0.25, phi: 2.30, distance: 180 }
      : { theta: 0.65, phi: 1.34, distance: 14 }
  );
  const cameraTargetPosRef = useRef(new THREE.Vector3(0, 2.0, 8.8));
  const cameraModeRef = useRef(cameraMode);
  const cockpitLookRef = useRef({ yaw: 0, pitch: -0.05 });
  const landerBaseYRef = useRef(2.0);

  // Free interactive rover driving state (WASD / Arrows)
  const freeRoverStateRef = useRef({ x: 0, z: 8.8, speed: 0, heading: 0, steerAngle: 0 });
  const obstaclesRef = useRef([]); // Impassable large boulders & lander
  const climbableRocksRef = useRef([]); // Small rocks rover suspension rides over
  const freeDrivePointsRef = useRef([]);
  const lastTrackPosRef = useRef({ x: 0, z: 8.8 });
  const freeTracksGroupRef = useRef(null);
  const loadOrbitalGlobeRef = useRef(null);
  const keysDownRef = useRef({});

  // Synchronized refs for 60fps render loop
  const driveProgressRef = useRef(driveProgress);
  const isDrivingRef = useRef(isDriving);
  const driveSpeedMultiplierRef = useRef(driveSpeedMultiplier);

  useEffect(() => {
    activeVehicleRef.current = activeVehicle;
  }, [activeVehicle]);

  useEffect(() => {
    driveProgressRef.current = driveProgress;
    isDrivingRef.current = isDriving;
    driveSpeedMultiplierRef.current = driveSpeedMultiplier;
  }, [driveProgress, isDriving, driveSpeedMultiplier]);

  // Smooth Camera presets transition and Orbital/Surface mode toggle
  useEffect(() => {
    cameraModeRef.current = cameraMode;
    const isOrbital = cameraMode === 'orbital';

    if (isOrbital && loadOrbitalGlobeRef.current) {
      loadOrbitalGlobeRef.current();
    }

    setOrbitalGlobeVisibility(sceneRef.current, orbitalMoonGroupRef.current, isOrbital);
    if (terrainMeshRef.current) {
      terrainMeshRef.current.visible = !isOrbital;
    }
    if (horizonMeshRef.current) {
      horizonMeshRef.current.visible = !isOrbital;
    }
    if (rockGroupRef.current) {
      rockGroupRef.current.visible = !isOrbital;
    }
    if (freeTracksGroupRef.current) {
      freeTracksGroupRef.current.visible = !isOrbital;
    }
    if (traversePathGroupRef.current) {
      traversePathGroupRef.current.visible = !isOrbital;
    }
    const isRoverActive = (activeVehicle === 'viper' || activeVehicle === 'griffin-rover' || activeVehicle === 'rover_2' || activeVehicle === 'griffin' || activeVehicle === 'custom' || activeVehicle === 'custom-uyor' || !activeVehicle);
    if (wheelTracksGroupRef.current) {
      wheelTracksGroupRef.current.visible = !isOrbital && isRoverActive;
    }

    // Vehicle Visibility: Astrobotic Griffin is the primary NASA CLPS lander carrying VIPER / Rover 2
    if (griffinLanderRef.current) {
      griffinLanderRef.current.group.visible = !isOrbital && (activeVehicle === 'griffin' || activeVehicle === 'viper' || activeVehicle === 'griffin-rover' || activeVehicle === 'rover_2' || !activeVehicle);
    }
    if (apolloLMRef.current) {
      apolloLMRef.current.group.visible = !isOrbital && activeVehicle === 'apollo';
    }
    if (novaCLanderRef.current) {
      novaCLanderRef.current.group.visible = !isOrbital && (activeVehicle === 'nova-c' || activeVehicle === 'lander');
    }
    if (viperRoverRef.current) {
      viperRoverRef.current.group.visible = !isOrbital && isRoverActive;
      const isCustom = activeVehicle === 'custom' || activeVehicle === 'custom-uyor';
      const cUrl = customRoverUrl || (typeof window !== 'undefined' ? window.__CUSTOM_ROVER_URL__ : null);
      viperRoverRef.current.setModelType(activeVehicle, isCustom ? cUrl : undefined);
    }
    if (rfBeamGroupRef.current) {
      rfBeamGroupRef.current.visible = !isOrbital;
    }

    if (cameraMode === 'surface') {
      cameraRotTargetRef.current.distance = 11;
      cameraRotTargetRef.current.phi = 1.34; // Cinematic eye-level perspective looking across cratered horizon
    } else if (cameraMode === 'orbital') {
      cameraRotTargetRef.current.distance = 180;
      cameraRotTargetRef.current.phi = 2.30; // Celestial tactical perspective framing NASA LRO Moon South Pole
      cameraRotTargetRef.current.theta = 0.25;
      cameraRotSmoothRef.current.distance = 180;
      cameraRotSmoothRef.current.phi = 2.30;
      cameraRotSmoothRef.current.theta = 0.25;
    } else if (cameraMode === 'rover') {
      cameraRotTargetRef.current.distance = 4.8;
      cameraRotTargetRef.current.phi = 1.28;
      cameraRotTargetRef.current.theta = freeRoverStateRef.current.heading + 0.72; // Crisp 3/4 side angle showing wheel treads
    } else if (cameraMode === 'lander') {
      const inspectDist = (activeVehicle === 'griffin') ? 8.5 : ((activeVehicle === 'nova-c' || activeVehicle === 'lander') ? 7.2 : 6.0);
      cameraRotTargetRef.current.distance = inspectDist;
      cameraRotTargetRef.current.phi = 1.25; // Close inspection of flight hardware
    } else if (cameraMode === 'cockpit') {
      cockpitLookRef.current = { yaw: 0, pitch: -0.05 };
    }
  }, [cameraMode, activeVehicle]);

  // Synchronous Reactive Direct Landing Deploy Trigger: Rolls VIPER down the ramp to lunar regolith
  useEffect(() => {
    if (isDirectLandingDeploy) {
      if (setCameraMode) setCameraMode('surface');
      cameraModeRef.current = 'surface';
      setOrbitalGlobeVisibility(sceneRef.current, orbitalMoonGroupRef.current, false);
      if (apolloLMRef.current) apolloLMRef.current.group.visible = false;
      if (novaCLanderRef.current) novaCLanderRef.current.group.visible = false;
      if (terrainMeshRef.current) terrainMeshRef.current.visible = true;
      if (horizonMeshRef.current) horizonMeshRef.current.visible = true;
      if (rockGroupRef.current) rockGroupRef.current.visible = true;
      if (freeTracksGroupRef.current) freeTracksGroupRef.current.visible = true;

      const currentSiteId = selectedSite?.id || 'malapert-massif';
      const griffinGrounding = computeGriffinLanderGrounding(currentSiteId);
      if (griffinLanderRef.current) {
        griffinLanderRef.current.group.visible = true;
        griffinLanderRef.current.group.position.set(0, griffinGrounding.posY, 0);
        griffinLanderRef.current.group.rotation.set(-griffinGrounding.pitch, 0, griffinGrounding.roll);
      }
      if (viperRoverRef.current) {
        viperRoverRef.current.group.visible = true;
        // Position rover at top deck ramp egress start
        viperRoverRef.current.group.position.set(0, griffinGrounding.posY + 1.92, 1.85);
        viperRoverRef.current.group.rotation.set(0.375, 0, griffinGrounding.roll, 'YXZ');
      }

      cameraRotTargetRef.current = { theta: 0.65, phi: 1.30, distance: 7.2 };
      cameraRotSmoothRef.current = { theta: 0.65, phi: 1.30, distance: 7.2 };

      // Trigger realistic VIPER egress rollout down the ramp onto lunar soil
      landingSeqRef.current = {
        active: true,
        phase: 'ROVER_DEPLOY',
        time: 8.6, // Start of ROVER_DEPLOY phase
        site: selectedSite,
        startCamPos: new THREE.Vector3(4.5, griffinGrounding.posY + 2.8, 12.0),
        altitude: 0.0,
        velocity: 0.0,
        throttle: 0.0,
        fuel: 86.4
      };
      setLandingPhase('ROVER_DEPLOY');
    }
  }, [isDirectLandingDeploy, selectedSite, onLandingComplete, setCameraMode]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Deep Space Void (Airless vacuum, crisp stars and earthrise)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020306);
    sceneRef.current = scene;

    // 2. Camera Setup (Far plane 6,000 for deep celestial sphere)
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 6000);
    if (cameraModeRef.current === 'orbital') {
      const initDist = 180;
      const initPhi = 2.30;
      const initTheta = 0.25;
      camera.position.set(
        initDist * Math.sin(initPhi) * Math.sin(initTheta),
        initDist * Math.cos(initPhi),
        initDist * Math.sin(initPhi) * Math.cos(initTheta)
      );
      camera.lookAt(0, 0, 0);
    } else {
      const groundY = getSiteElevation(0, 0, selectedSite?.id || 'malapert-massif');
      camera.position.set(4.2, groundY + 2.4, 7.2);
      camera.lookAt(0, groundY + 0.7, 2.8);
    }
    cameraRef.current = camera;

    // 3. Renderer with ACES Filmic Tone Mapping & Soft Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.00;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Texture Loader with automatic update hooks
    const textureLoader = new THREE.TextureLoader();

    const regolithDiff = textureLoader.load('/textures/lunar_regolith_hd.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(32, 32);
      tex.needsUpdate = true;
    });

    const regolithNormal = textureLoader.load('/textures/lunar_regolith_normal.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(32, 32);
      tex.needsUpdate = true;
    });

    const regolithRough = textureLoader.load('/textures/lunar_regolith_roughness.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(32, 32);
      tex.needsUpdate = true;
    });

    const regolithAO = textureLoader.load('/textures/lunar_regolith_ao.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(32, 32);
      tex.needsUpdate = true;
    });

    const goldDiff = textureLoader.load('/textures/gold_mli.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      tex.needsUpdate = true;
    });

    const goldNormal = textureLoader.load('/textures/gold_mli_normal.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      tex.needsUpdate = true;
    });

    const goldRoughness = textureLoader.load('/textures/gold_mli_roughness.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      tex.needsUpdate = true;
    });

    const earthDiff = textureLoader.load('/textures/earth_diffuse.jpg', (tex) => {
      tex.needsUpdate = true;
    });

    // 5a. Helper: Crisp circular star sprite texture
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
      const tex = new THREE.CanvasTexture(c);
      return tex;
    }

    // 5b. Pure Deep-Space 360° Starfield (24,000 pure stars across all 4π steradians - NO GALAXY HAZE)
    const starTex = createStarTexture(32);
    const starGeo = new THREE.BufferGeometry();
    const starCount = 24000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1; // Uniform omnidirectional sphere: top, bottom, and all 360 degrees
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
      sizeAttenuation: false, // Ensures all 24,000 stars are sharp and visible across all monitors
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // 5c. Prominent Sparkling Foreground Diamond Stars (2,800 stars)
    const brightStarGeo = new THREE.BufferGeometry();
    const brightCount = 2800;
    const brightPositions = new Float32Array(brightCount * 3);
    const brightColors = new Float32Array(brightCount * 3);
    for (let i = 0; i < brightCount; i++) {
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
    scene.add(new THREE.Points(brightStarGeo, brightStarMat));

    // 6. High-Precision Lunar South Pole Terrain Mesh (Sub-meter Geological Detail)
    const terrainSize = 900;
    const terrainSegs = 320;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
    terrainGeo.rotateX(-Math.PI / 2);
    terrainGeo.setAttribute('uv2', terrainGeo.attributes.uv);
    terrainGeoRef.current = terrainGeo;

    const currentSiteId = selectedSite ? selectedSite.id : 'malapert-massif';
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      posAttr.setY(i, getHorizonCurvedElevation(x, z, currentSiteId));
    }
    terrainGeo.computeVertexNormals();

    // 6b. Natural Lunar Regolith Material (Authentic Apollo / LROC NAC photorealistic PBR)
    const terrainMat = new THREE.MeshStandardMaterial({
      map: regolithDiff,
      normalMap: regolithNormal,
      normalScale: new THREE.Vector2(1.35, 1.35),
      roughnessMap: regolithRough,
      roughness: 0.90,
      aoMap: regolithAO,
      aoMapIntensity: 0.85,
      metalness: 0.0,
      color: 0x828894,
      side: THREE.FrontSide
    });

    // Organic multi-scale macro-albedo modulation & LiDAR Heatmap overlay
    terrainMat.onBeforeCompile = (shader) => {
      shader.uniforms.uHeatmapMode = { value: lightingModeRef.current === 'heatmap' ? 1.0 : 0.0 };
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_pars_vertex>',
        `#include <uv_pars_vertex>
         varying vec3 vWorldPosition;
         varying vec3 vWorldNormal;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <uv_pars_fragment>',
        `#include <uv_pars_fragment>
         uniform float uHeatmapMode;
         varying vec3 vWorldPosition;
         varying vec3 vWorldNormal;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         float n1 = sin(vWorldPosition.x * 0.018) * cos(vWorldPosition.z * 0.018);
         float n2 = sin(vWorldPosition.x * 0.045 + vWorldPosition.z * 0.038) * 0.5;
         float n3 = sin(vWorldPosition.x * 0.11 - vWorldPosition.z * 0.09) * 0.25;
         float macroNoise = (n1 + n2 + n3) * 0.16;
         diffuseColor.rgb *= clamp(0.92 + macroNoise, 0.74, 1.16);`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
         if (uHeatmapMode > 0.01) {
           float slopeDeg = degrees(acos(clamp(vWorldNormal.y, 0.0, 1.0)));
           vec3 lidarColor;
           if (slopeDeg < 5.0) lidarColor = vec3(0.12, 0.85, 0.35);
           else if (slopeDeg < 12.0) lidarColor = vec3(0.20, 0.75, 0.90);
           else if (slopeDeg < 18.0) lidarColor = vec3(0.95, 0.85, 0.20);
           else if (slopeDeg < 25.0) lidarColor = vec3(0.95, 0.45, 0.12);
           else lidarColor = vec3(0.92, 0.15, 0.15);

           if (vWorldPosition.y < 0.5 && slopeDeg > 12.0) {
             lidarColor = mix(lidarColor, vec3(0.15, 0.20, 0.95), 0.75);
           }
           gl_FragColor.rgb = mix(gl_FragColor.rgb, lidarColor, 0.82);
         }`
      );
      terrainMat.userData.shader = shader;
    };
    terrainMaterialRef.current = terrainMat;

    const isOrbitalInit = (cameraModeRef.current === 'orbital');

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.visible = !isOrbitalInit;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 6c. Distant Lunar South Pole Massif Horizon & Rim Ring (Continuous Terrain - Zero Black Void Cutoffs!)
    // Extends 3.4km into the distance with continuous lunar mountains and crater ridges
    const horizonGeo = new THREE.RingGeometry(440, 3400, 120, 24);
    horizonGeo.rotateX(-Math.PI / 2);
    const horizonPos = horizonGeo.attributes.position;
    for (let i = 0; i < horizonPos.count; i++) {
      const hx = horizonPos.getX(i);
      const hz = horizonPos.getZ(i);
      const hr = Math.sqrt(hx * hx + hz * hz);
      const phi = Math.atan2(hz, hx);
      // Base elevation matches active terrain perimeter
      const baseElev = getSiteElevation((hx / hr) * 440, (hz / hr) * 440, currentSiteId);
      // Outer mountain ridges (South Pole peaks & massifs up to +120m)
      const ridgeU = Math.min(1.0, (hr - 440) / 1100);
      const mountainPeak = Math.sin(phi * 4.0) * 48.0 + Math.cos(phi * 9.0) * 32.0 + Math.sin(phi * 15.0 + 1.4) * 20.0;
      // Spherical Moon curvature falloff (Moon radius 1737km)
      const curvatureDrop = (hr * hr) / (2.0 * 1737000.0) * 8.0;
      horizonPos.setY(i, baseElev + mountainPeak * ridgeU - curvatureDrop);
    }
    horizonGeo.computeVertexNormals();
    horizonGeoRef.current = horizonGeo;

    const horizonMesh = new THREE.Mesh(horizonGeo, terrainMat);
    horizonMesh.receiveShadow = true;
    horizonMesh.visible = !isOrbitalInit;
    scene.add(horizonMesh);
    horizonMeshRef.current = horizonMesh;

    // 6d. NASA LRO 3D Moon Globe (SVS 14959 / 4720) for ORBITAL Mode
    const orbitalMoonGroup = new THREE.Group();
    orbitalMoonGroup.name = 'NASA_LRO_MOON_GLOBE';
    orbitalMoonGroup.visible = isOrbitalInit;
    if (isOrbitalInit) scene.add(orbitalMoonGroup);
    orbitalMoonGroupRef.current = orbitalMoonGroup;

    const lunarRadius = 50;
    const LUNAR_SITES_3D = LANDING_SITES.map(s => {
      const selLon = s.lon > 180 ? s.lon - 360 : s.lon;
      return {
        id: s.id,
        name: s.name,
        lat: s.lat,
        lon: selLon,
        elevationM: s.elevationM,
        designation: s.designation,
        color: s.id === 'malapert-massif' ? 0x00f0ff :
          s.id === 'shackleton-connecting-ridge' ? 0x34d399 :
            s.id === 'mons-mouton' ? 0xf59e0b :
              s.id === 'nobile-rim-1' ? 0xa855f7 :
                s.id === 'de-gerlache-rim' ? 0xec4899 : 0x38bdf8
      };
    });

    function latLonToVector3(lat, lon, radius) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    // High-resolution NASA LROC WAC texture sphere & 3D Moon GLB Asset
    let orbitalGlobeLoaded = false;
    const loadOrbitalGlobeAssets = () => {
      if (orbitalGlobeLoaded) return;
      orbitalGlobeLoaded = true;

      const sphereGeo = new THREE.SphereGeometry(lunarRadius, 96, 96);
      const lrocTex = textureLoader.load('/textures/lroc_color_2k.jpg');
      lrocTex.colorSpace = THREE.SRGBColorSpace;
      const lolaDisp = textureLoader.load('/textures/lola_displacement_2k.jpg');
      const sphereMat = new THREE.MeshStandardMaterial({
        map: lrocTex,
        bumpMap: lolaDisp,
        bumpScale: 1.8,
        color: 0x88929e,
        roughness: 0.94,
        metalness: 0.02
      });
      const fallbackMoon = new THREE.Mesh(sphereGeo, sphereMat);
      fallbackMoon.name = 'NASA_LROC_GLOBE';
      fallbackMoon.castShadow = true;
      fallbackMoon.receiveShadow = true;
      orbitalMoonGroup.add(fallbackMoon);

      // Load user 3D Moon Asset for Orbital inspection
      const gltfLoader = new GLTFLoader();
      gltfLoader.load('/models/moon_3d_asset.glb', (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        const modelRadius = sphere.radius || 1.271864;
        const scale = lunarRadius / modelRadius;
        model.scale.setScalar(scale);
        model.position.sub(sphere.center.clone().multiplyScalar(scale));

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
        model.name = 'USER_MOON_3D_ASSET_ORBITAL';
        if (fallbackMoon.parent) {
          orbitalMoonGroup.remove(fallbackMoon);
        }
        orbitalMoonGroup.add(model);
      }, undefined, (err) => {
        console.warn('Orbital Moon GLB fallback to LROC sphere:', err);
      });
    };
    loadOrbitalGlobeRef.current = loadOrbitalGlobeAssets;
    if (isOrbitalInit) {
      loadOrbitalGlobeAssets();
    }

    // Dedicated orbital lighting for high-fidelity planetary inspection (active only in Orbital mode)
    const orbitalFill = new THREE.DirectionalLight(0xdbeafe, 1.4);
    orbitalFill.position.set(80, 140, 160);
    orbitalMoonGroup.add(orbitalFill);

    const orbitalRim = new THREE.DirectionalLight(0x93c5fd, 0.85);
    orbitalRim.position.set(-90, -80, -110);
    orbitalMoonGroup.add(orbitalRim);

    const orbitalAmbient = new THREE.AmbientLight(0x1e293b, 0.45);
    orbitalMoonGroup.add(orbitalAmbient);

    orbitalPinsListRef.current = [];
    const pinsLayer = new THREE.Group();
    pinsLayer.name = 'ORBITAL_BEACONS_LAYER';
    orbitalPinsGroupRef.current = pinsLayer;
    orbitalMoonGroup.add(pinsLayer);

    LUNAR_SITES_3D.forEach((s) => {
      const pos = latLonToVector3(s.lat, s.lon, lunarRadius + 0.12);
      const markerGroup = new THREE.Group();
      markerGroup.name = `ORBITAL_PIN_${s.id}`;
      markerGroup.userData = { siteId: s.id, siteData: s, basePos: pos };
      markerGroup.position.copy(pos);
      markerGroup.lookAt(0, 0, 0);

      const isSelected = selectedSite && selectedSite.id === s.id;
      const themeColor = isSelected ? 0x38bdf8 : 0xdbeafe;

      // 1. Sleek hairline target reticle ring on lunar surface
      const ringGeo = new THREE.RingGeometry(0.85, 1.05, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: themeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.65
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.userData = { siteId: s.id, siteData: s };
      markerGroup.add(ringMesh);

      // 2. Center micro-core dot
      const centerDotGeo = new THREE.CircleGeometry(0.22, 24);
      const centerDotMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
      const centerDotMesh = new THREE.Mesh(centerDotGeo, centerDotMat);
      centerDotMesh.userData = { siteId: s.id, siteData: s };
      markerGroup.add(centerDotMesh);

      // 3. Ultra-slender laser beacon needle
      const pinGeo = new THREE.CylinderGeometry(0.06, 0.06, 4.2, 12);
      const pinMat = new THREE.MeshBasicMaterial({
        color: themeColor,
        transparent: true,
        opacity: isSelected ? 0.92 : 0.60
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.z = -2.1;
      pinMesh.rotateX(Math.PI / 2);
      pinMesh.userData = { siteId: s.id, siteData: s };
      markerGroup.add(pinMesh);

      // 4. Luminous beacon tip pip
      const pipGeo = new THREE.SphereGeometry(0.28, 16, 16);
      const pipMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x38bdf8 : 0xffffff
      });
      const pipMesh = new THREE.Mesh(pipGeo, pipMat);
      pipMesh.position.z = -4.2;
      pipMesh.userData = { siteId: s.id, siteData: s };
      markerGroup.add(pipMesh);

      // 5. Delicate radar wave ripple (animated on selected site)
      const pulseGeo = new THREE.RingGeometry(0.95, 1.15, 48);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.name = 'PULSE_RING';
      pulseMesh.userData = { siteId: s.id, isSelected };
      markerGroup.add(pulseMesh);

      // 6. Invisible generous raycast hit proxy for effortless interaction
      const proxyGeo = new THREE.SphereGeometry(3.2, 12, 12);
      const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
      const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
      proxyMesh.position.z = -2.1;
      proxyMesh.userData = { siteId: s.id, siteData: s };
      markerGroup.add(proxyMesh);

      pinsLayer.add(markerGroup);
      orbitalPinsListRef.current.push(markerGroup);
    });

    // 6c. Dynamic Free Driving Regolith Tire Tracks Group
    const freeTracksGroup = new THREE.Group();
    freeTracksGroup.name = 'FREE_DRIVE_TRACKS';
    scene.add(freeTracksGroup);
    freeTracksGroupRef.current = freeTracksGroup;

    // 7. Photorealistic Lunar Basalt & Anorthosite Breccia Boulder Field (NASA Apollo 17 Sample 70017 Vesicular Basalt Fidelity)
    const rockGroup = new THREE.Group();
    rockGroup.name = 'LUNAR_BOULDER_FIELD';

    const rockDiff = textureLoader.load('/textures/lunar_regolith_hd.jpg');
    rockDiff.wrapS = THREE.RepeatWrapping;
    rockDiff.wrapT = THREE.RepeatWrapping;
    rockDiff.repeat.set(2, 2);
    rockDiff.colorSpace = THREE.SRGBColorSpace;

    const rockNorm = textureLoader.load('/textures/lunar_regolith_normal.jpg');
    rockNorm.wrapS = THREE.RepeatWrapping;
    rockNorm.wrapT = THREE.RepeatWrapping;
    rockNorm.repeat.set(2, 2);

    const rockRough = textureLoader.load('/textures/lunar_regolith_roughness.jpg');
    rockRough.wrapS = THREE.RepeatWrapping;
    rockRough.wrapT = THREE.RepeatWrapping;
    rockRough.repeat.set(2, 2);

    const rockMat = new THREE.MeshStandardMaterial({
      map: rockDiff,
      normalMap: rockNorm,
      normalScale: new THREE.Vector2(2.4, 2.4),
      roughnessMap: rockRough,
      color: 0x444950, // Authentic Apollo 17 dark charcoal vesicular basalt
      roughness: 0.95,
      metalness: 0.02,
      flatShading: false // Smooth organic weathered surface (eliminates edgy low-poly facets)
    });

    function createPhotorealisticLunarRockGeo(baseScale, seed = 0) {
      // High-subdivision geodesic icosahedron (Subdivision 4 = 2,562 smooth vertices)
      const geo = new THREE.IcosahedronGeometry(baseScale, 4);
      const pos = geo.attributes.position;
      const count = pos.count;
      const s = Math.sin(seed * 78.233 + 1.2) * 43758.5453 % 10.0;

      for (let i = 0; i < count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);

        const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
        const nx = vx / len;
        const ny = vy / len;
        const nz = vz / len;

        // 1. Organic base flattening on bottom where boulder nests naturally into lunar regolith dust
        let flatten = 1.0;
        if (ny < 0.0) {
          flatten = 0.84 + 0.16 * (1.0 + ny);
        }

        // 2. Smooth geomorphological weathering harmonics (rounded natural curves)
        const d1 = Math.sin(nx * 2.8 + ny * 1.8 + s) * 0.11;
        const d2 = Math.cos(nz * 2.6 - ny * 2.2 + s * 1.3) * 0.09;
        const d3 = Math.sin((nx + nz) * 4.2 + s * 0.7) * 0.05;

        // 3. Vesicular micro-cratering (ancient volcanic gas vesicles like Apollo 17 sample 70017)
        const v1 = Math.sin(nx * 10.8 + s) * Math.sin(ny * 10.4 + s * 1.5) * Math.cos(nz * 11.0);
        const vPocket = (v1 > 0.32 && ny > -0.3) ? -0.075 * (v1 - 0.32) : 0.0;

        const displacement = 1.0 + d1 + d2 + d3 + vPocket;
        const finalR = baseScale * displacement * flatten;

        // Natural asymmetrical aspect ratio
        const scaleX = 1.05;
        const scaleY = 0.86;
        const scaleZ = 0.98;

        pos.setXYZ(i, nx * finalR * scaleX, ny * finalR * scaleY, nz * finalR * scaleZ);
      }

      geo.computeVertexNormals();
      return geo;
    }

    const rockSpecs = [];
    // Authentic regolith surface stones scattered around landing zone (Apollo 17 / Taurus-Littrow Fidelity)
    for (let i = 0; i < 35; i++) {
      const angle = (i / 35) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const radius = 3.6 + Math.random() * 5.4;
      const rx = radius * Math.cos(angle);
      const rz = radius * Math.sin(angle);
      // Keep rover egress ramp rollout corridor (x: [-1.6, 1.6], z: [0, 8.5]) clear
      if (Math.abs(rx) < 1.6 && rz > 0 && rz < 8.5) continue;
      rockSpecs.push({ scale: 0.10 + Math.random() * 0.20, radius, seed: i * 3.7 });
    }
    for (let i = 0; i < 65; i++) {
      rockSpecs.push({ scale: 0.12 + Math.random() * 0.26, radius: 9 + Math.random() * 55, seed: 100 + i * 2.3 });
    }
    for (let i = 0; i < 26; i++) {
      rockSpecs.push({ scale: 0.45 + Math.random() * 0.65, radius: 12 + Math.random() * 68, seed: 200 + i * 4.1 });
    }
    for (let i = 0; i < 8; i++) {
      rockSpecs.push({ scale: 1.30 + Math.random() * 1.10, radius: 18 + Math.random() * 60, seed: 300 + i * 5.7 });
    }

    const physicalObstacles = [
      // Astrobotic Griffin Lander at origin (bus radius 2.25m, articulated legs extend to 2.85m)
      { x: 0, z: 0, radius: 2.7, type: 'LANDER', name: 'Astrobotic Griffin Lander' }
    ];
    const climbableRocks = [];

    rockSpecs.forEach((spec) => {
      const angle = Math.random() * Math.PI * 2;
      const rx = spec.radius * Math.cos(angle);
      const rz = spec.radius * Math.sin(angle);
      const ry = getSiteElevation(rx, rz, currentSiteId);
      const rockGeo = createPhotorealisticLunarRockGeo(spec.scale, spec.seed);
      const rock = new THREE.Mesh(rockGeo, rockMat);

      // Embed rock 22% into lunar regolith dust for authentic weathered burial
      rock.position.set(rx, ry - spec.scale * 0.22, rz);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rockGroup.add(rock);

      if (spec.scale < 0.32) {
        // Small rock: Rover rocker-bogie suspension articulates and climbs over when holding W!
        climbableRocks.push({
          x: rx,
          z: rz,
          radius: spec.scale * 0.95,
          height: spec.scale * 0.65
        });
      } else {
        // Large boulder: Impassable terrain obstacle that arrests forward motion
        physicalObstacles.push({
          x: rx,
          z: rz,
          radius: Math.max(0.35, spec.scale * 0.85),
          type: 'BOULDER',
          name: 'Breccia Boulder'
        });
      }
    });

    obstaclesRef.current = physicalObstacles;
    climbableRocksRef.current = climbableRocks;
    rockGroup.visible = !isOrbitalInit;
    rockGroupRef.current = rockGroup;
    scene.add(rockGroup);

    // 7b. Autonomous Traverse Path Spline & Waypoint Beacons Group
    const traverseGroup = new THREE.Group();
    traverseGroup.visible = !isOrbitalInit;
    scene.add(traverseGroup);
    traversePathGroupRef.current = traverseGroup;

    // 8. Authentic NASA South Pole Vacuum Illumination Rig (1.8° Solar Grazing + Earthshine)
    // Purges atmospheric ambient/hemisphere leaks; stabilizes shadow acne at grazing angles
    const initialSunAz = telemetry?.sun?.azimuth ?? 35.0;
    const initialSunElev = Math.max(0.5, telemetry?.sun?.elevation ?? 1.8);
    const initialEarthAz = telemetry?.earth?.azimuth ?? 215.0;
    const initialEarthElev = telemetry?.earth?.elevation ?? 11.5;

    const lunarLighting = setupLunarSouthPoleLighting(scene, renderer, {
      sunAzimuthDeg: initialSunAz,
      sunElevationDeg: initialSunElev,
      earthAzimuthDeg: initialEarthAz,
      earthElevationDeg: initialEarthElev,
      shadowFrustumSize: 110.0,
      initialMode: lightingModeRef.current
    });
    lunarLightingRef.current = lunarLighting;
    sunLightRef.current = lunarLighting.sunLight;
    earthshineLightRef.current = lunarLighting.earthshineLight;

    // Direct synchronization with Hapke regolith material
    if (terrainMaterialRef.current) {
      updateLunarRegolithUniforms(terrainMaterialRef.current, {
        sunDir: lunarLighting.sunDirection,
        earthDir: lunarLighting.earthDirection,
        ambientFill: lightingModeRef.current === 'vacuum_dark' ? 0.0 : (lightingModeRef.current === 'heatmap' ? 0.50 : 1.0),
        heatmapMode: lightingModeRef.current === 'heatmap' ? 1.0 : 0.0
      });
    }

    // 9. Photorealistic Celestial Sun Disc & Optical Apollo Hasselblad Glare
    const sunMeshGeo = new THREE.SphereGeometry(14, 32, 32);
    const sunMeshMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sunMesh = new THREE.Mesh(sunMeshGeo, sunMeshMat);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    // Procedural optical glare canvas
    const glareCanvas = document.createElement('canvas');
    glareCanvas.width = 512;
    glareCanvas.height = 512;
    const gctx = glareCanvas.getContext('2d');
    const gcx = 256, gcy = 256;

    // Soft radial solar corona
    const radGrad = gctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, 256);
    radGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    radGrad.addColorStop(0.08, 'rgba(255, 252, 240, 0.88)');
    radGrad.addColorStop(0.24, 'rgba(255, 235, 185, 0.35)');
    radGrad.addColorStop(0.55, 'rgba(255, 205, 120, 0.10)');
    radGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    gctx.fillStyle = radGrad;
    gctx.fillRect(0, 0, 512, 512);

    // Horizontal anamorphic diffraction streak
    const streakGrad = gctx.createLinearGradient(0, gcy, 512, gcy);
    streakGrad.addColorStop(0.0, 'rgba(255, 240, 200, 0.0)');
    streakGrad.addColorStop(0.4, 'rgba(255, 250, 230, 0.28)');
    streakGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.90)');
    streakGrad.addColorStop(0.6, 'rgba(255, 250, 230, 0.28)');
    streakGrad.addColorStop(1.0, 'rgba(255, 240, 200, 0.0)');
    gctx.fillStyle = streakGrad;
    gctx.fillRect(0, gcy - 7, 512, 14);

    // 6-point diffraction spikes (Zeiss Biogon Hasselblad optics)
    gctx.strokeStyle = 'rgba(255, 248, 225, 0.28)';
    gctx.lineWidth = 2.0;
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI) / 3;
      gctx.beginPath();
      gctx.moveTo(gcx - Math.cos(angle) * 230, gcy - Math.sin(angle) * 230);
      gctx.lineTo(gcx + Math.cos(angle) * 230, gcy + Math.sin(angle) * 230);
      gctx.stroke();
    }

    const glareTex = new THREE.CanvasTexture(glareCanvas);
    const glareMat = new THREE.SpriteMaterial({
      map: glareTex,
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.95
    });
    const glareSprite = new THREE.Sprite(glareMat);
    glareSprite.scale.set(420, 420, 1);
    sunMesh.add(glareSprite);

    // 10. Photorealistic 3D Earth Globe ("The Blue Marble")
    const earthGroup = new THREE.Group();
    const earthGeo = new THREE.SphereGeometry(44, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthDiff,
      roughness: 0.50,
      metalness: 0.02,
      emissive: 0x051b33,
      emissiveIntensity: 0.35
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.z = degToRad(23.44); // Authentic Earth axial tilt
    earthGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Glowing sapphire blue atmospheric Rayleigh scattering limb
    const atmosGeo = new THREE.SphereGeometry(46.5, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    earthGroup.add(new THREE.Mesh(atmosGeo, atmosMat));
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // 11. High-Precision Physical RF Microwave Telemetry Beam to Earth & Relay Orbiter
    const rfGroup = new THREE.Group();
    rfGroup.name = 'RF_COMMS_SYSTEM';
    const lineGeo = new THREE.BufferGeometry();
    const linePoints = new Float32Array([0, 1.8, 8.8, 0, 200, -2200]);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePoints, 3));
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 2.0,
      gapSize: 1.2,
      transparent: true,
      opacity: 0.85
    });
    const rfLine = new THREE.Line(lineGeo, lineMat);
    rfGroup.add(rfLine);
    rfGroup.visible = !isOrbitalInit;
    scene.add(rfGroup);
    rfBeamGroupRef.current = rfGroup;

    // 11b. Volumetric Solar Flux Ray Vector (Polar Grazing Sun)
    const solarRayGroup = new THREE.Group();
    solarRayGroup.name = 'SOLAR_RAY_SYSTEM';
    const sLineGeo = new THREE.BufferGeometry();
    const sLinePoints = new Float32Array([0, 1.2, 8.8, 0, 50, -2400]);
    sLineGeo.setAttribute('position', new THREE.BufferAttribute(sLinePoints, 3));
    const sLineMat = new THREE.LineBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.45
    });
    const sLine = new THREE.Line(sLineGeo, sLineMat);
    solarRayGroup.add(sLine);
    solarRayGroup.visible = !isOrbitalInit;
    scene.add(solarRayGroup);

    // 12. NASA Apollo Lunar Module (Real 3D Asset with Supersonic Descent Engine & Egress Ramp)
    const apolloLM = buildApolloLunarModule();
    apolloLM.group.position.set(0, getSiteElevation(0, 0, currentSiteId), 0);
    apolloLMRef.current = apolloLM;
    scene.add(apolloLM.group);

    // 12b. Astrobotic Griffin Lunar Lander (VIPER Delivery Mothership with deployable egress ramps)
    const griffinLander = buildGriffinLander({ goldDiff, goldNormal, goldRoughness });
    const griffinGround = computeGriffinLanderGrounding(currentSiteId);
    griffinLander.group.position.set(0, griffinGround.posY, 0);
    griffinLander.group.rotation.set(-griffinGround.pitch, 0, griffinGround.roll);
    griffinLanderRef.current = griffinLander;
    scene.add(griffinLander.group);

    // 13. Intuitive Machines Nova-C "Odysseus" Lander (IM-1 Historic South Pole Soft Lander)
    const novaCLander = buildNovaCLander({ goldDiff, goldNormal, goldRoughness });
    const novaGround = computeNovaCGrounding(currentSiteId);
    novaCLander.group.position.set(0, novaGround.posY, 0);
    novaCLander.group.rotation.set(-novaGround.pitch, 0, novaGround.roll);
    novaCLanderRef.current = novaCLander;
    scene.add(novaCLander.group);

    // 14. High-Precision NASA VIPER Lunar Rover Model (6-Wheel Rocker-Bogie Ground Contact)
    const viperRover = buildViperRover({ goldDiff, goldNormal, goldRoughness });
    const initialContact = computeRoverTerrainContact(0, 8.8, 0, currentSiteId);
    viperRover.group.position.set(0, initialContact.yBase, 8.8);
    viperRover.group.rotation.set(-initialContact.pitch, 0, initialContact.roll, 'YXZ');
    viperRover.setSuspensionDeltas(initialContact.suspDeltas);
    viperRoverRef.current = viperRover;
    scene.add(viperRover.group);

    // 15. Physical Lunar Regolith Wheel Tracks System
    const wheelTracksMaster = new THREE.Group();
    wheelTracksMaster.name = 'WHEEL_TRACKS_MASTER';

    // 15a. Permanent Static Deployment Tracks from Griffin Lander's Egress Ramps
    const staticTracks = createStaticDeploymentTracks(getSiteElevation, currentSiteId);
    wheelTracksMaster.add(staticTracks);

    // 15b. Dynamic Active Tracks Group along Traverse Spline
    const dynamicTracks = new THREE.Group();
    dynamicTracks.name = 'DYNAMIC_ACTIVE_TRACKS';
    wheelTracksMaster.add(dynamicTracks);
    dynamicTracksGroupRef.current = dynamicTracks;

    const trackMat = createWheelTrackMaterial();
    wheelTrackMaterialRef.current = trackMat;

    wheelTracksGroupRef.current = wheelTracksMaster;
    scene.add(wheelTracksMaster);

    // Initial vehicle visibility strictly checking orbital mode (Astrobotic Griffin is default CLPS lander)
    griffinLander.group.visible = !isOrbitalInit && (activeVehicle === 'griffin' || activeVehicle === 'viper' || !activeVehicle);
    apolloLM.group.visible = !isOrbitalInit && activeVehicle === 'apollo';
    novaCLander.group.visible = !isOrbitalInit && (activeVehicle === 'nova-c' || activeVehicle === 'lander');
    viperRover.group.visible = !isOrbitalInit && (activeVehicle === 'viper' || !activeVehicle || activeVehicle === 'griffin');
    wheelTracksMaster.visible = !isOrbitalInit && (activeVehicle === 'griffin' || activeVehicle === 'viper' || !activeVehicle);

    if (isDirectLandingDeploy) {
      const griffinGround = computeGriffinLanderGrounding(currentSiteId);
      griffinLander.group.position.set(0, griffinGround.posY, 0);
      griffinLander.group.rotation.set(-griffinGround.pitch, 0, griffinGround.roll);
      griffinLander.group.visible = true;
      apolloLM.group.visible = false;
      novaCLander.group.visible = false;

      viperRover.group.visible = true;
      // Rover starts at top of egress ramp ready to roll down
      viperRover.group.position.set(0, griffinGround.posY + 1.92, 1.85);
      viperRover.group.rotation.set(0.375, 0, griffinGround.roll, 'YXZ');

      cameraRotTargetRef.current = { theta: 0.65, phi: 1.30, distance: 7.2 };
      cameraRotSmoothRef.current = { theta: 0.65, phi: 1.30, distance: 7.2 };
      camera.position.set(4.5, griffinGround.posY + 2.5, 11.5);
      camera.lookAt(0, griffinGround.posY + 1.2, 3.5);
    }

    // Mouse Interaction with Butter-Smooth Momentum & Inertia
    const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
      mouseVelRef.current = { x: 0, y: 0 };
    };

    // Keyboard interaction for free rover driving (WASD / Arrows / Space / R)
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      keysDownRef.current[e.code] = true;
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'KeyH') {
        const modes = ['light', 'vacuum_dark', 'heatmap'];
        const currentIdx = modes.indexOf(lightingModeRef.current);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        lightingModeRef.current = nextMode;
        setLightingMode(nextMode);

        if (lunarLightingRef.current) {
          lunarLightingRef.current.setLightingMode(nextMode);
        }
        if (terrainMaterialRef.current) {
          updateLunarRegolithUniforms(terrainMaterialRef.current, {
            ambientFill: nextMode === 'vacuum_dark' ? 0.0 : (nextMode === 'heatmap' ? 0.50 : 1.0),
            heatmapMode: nextMode === 'heatmap' ? 1.0 : 0.0
          });
        }
        soundFX.playTelemetry();
      }
      if (e.code === 'KeyR') {
        // Reset rover to safe parking position in front of lander ramp and clear tire tracks
        freeRoverStateRef.current = { x: 0, z: 8.8, speed: 0, heading: 0, steerAngle: 0 };
        freeDrivePointsRef.current = [];
        if (freeTracksGroupRef.current) {
          while (freeTracksGroupRef.current.children.length > 0) {
            const c = freeTracksGroupRef.current.children[0];
            if (c.geometry) c.geometry.dispose();
            freeTracksGroupRef.current.remove(c);
          }
        }
        if (viperRoverRef.current) {
          const resetContact = computeRoverTerrainContact(0, 8.8, 0, currentSiteId);
          viperRoverRef.current.group.position.set(0, resetContact.yBase, 8.8);
          viperRoverRef.current.group.rotation.set(-resetContact.pitch, 0, resetContact.roll, 'YXZ');
          viperRoverRef.current.setSuspensionDeltas(resetContact.suspDeltas);
          viperRoverRef.current.update(0.016, 0, false, 0, 0);
        }
      }
    };

    const handleKeyUp = (e) => {
      keysDownRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const triggerCinematicLanding = (targetSite) => {
      const site = targetSite || selectedSite || LANDING_SITES[0];
      if (onSelectSite) onSelectSite(site);
      if (setCameraMode) setCameraMode('surface');
      cameraModeRef.current = 'surface';
      soundFX.playClick();
      soundFX.playTelemetry();
      soundFX.playRocketRumble(4.2);

      const targetSiteId = site.id;
      const griffinGrounding = computeGriffinLanderGrounding(targetSiteId);

      // 1. Strictly hide orbital globe to prevent white dome blowout
      setOrbitalGlobeVisibility(scene, orbitalMoonGroupRef.current, false);
      if (terrainMeshRef.current) terrainMeshRef.current.visible = true;
      if (horizonMeshRef.current) horizonMeshRef.current.visible = true;
      if (rockGroupRef.current) rockGroupRef.current.visible = true;
      if (freeTracksGroupRef.current) freeTracksGroupRef.current.visible = true;
      if (apolloLMRef.current) apolloLMRef.current.group.visible = false;

      // 2. Position Astrobotic Griffin Lander 48m above terrain for powered descent
      if (griffinLanderRef.current) {
        griffinLanderRef.current.group.visible = true;
        griffinLanderRef.current.group.position.set(0, griffinGrounding.posY + 48.0, 0);
        griffinLanderRef.current.group.rotation.set(-griffinGrounding.pitch, 0, griffinGrounding.roll);
      }
      if (novaCLanderRef.current) novaCLanderRef.current.group.visible = false;

      // 3. Rover sits stowed on lander top deck
      if (viperRoverRef.current) {
        viperRoverRef.current.group.visible = true;
        viperRoverRef.current.group.position.set(0, griffinGrounding.posY + 48.0 + 1.92, 1.85);
        viperRoverRef.current.group.rotation.set(-griffinGrounding.pitch, 0, griffinGrounding.roll);
      }

      landingSeqRef.current = {
        active: true,
        phase: 'DESCENT',
        time: 2.2,
        site: site,
        startCamPos: new THREE.Vector3(15.0, griffinGrounding.posY + 24.0, 22.0),
        altitude: 48.0,
        velocity: -16.2,
        throttle: 1.0,
        fuel: 98.4
      };
      setLandingPhase('DESCENT');
    };
    triggerCinematicLandingRef.current = triggerCinematicLanding;

    const handleMouseMove = (e) => {
      // 1. Hover detection for minimal orbital pins in Moon Globe mode
      if (cameraModeRef.current === 'orbital' && cameraRef.current && container && orbitalPinsGroupRef.current) {
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        const hits = raycaster.intersectObjects(orbitalPinsGroupRef.current.children, true);
        if (hits.length > 0) {
          let target = hits[0].object;
          while (target && !target.userData?.siteData && target.parent && target.parent !== orbitalPinsGroupRef.current) {
            target = target.parent;
          }
          if (target?.userData?.siteData) {
            container.style.cursor = 'pointer';
            setHoveredSite(target.userData.siteData);
            const wp = new THREE.Vector3();
            target.getWorldPosition(wp);
            wp.project(cameraRef.current);
            const sx = (wp.x * 0.5 + 0.5) * rect.width;
            const sy = (-wp.y * 0.5 + 0.5) * rect.height;
            setHoveredPinScreenPos({ x: sx, y: sy });
          }
        } else {
          container.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
          if (hoveredSite) {
            setHoveredSite(null);
            setHoveredPinScreenPos(null);
          }
        }
      }

      if (!isDraggingRef.current) return;
      const dx = e.clientX - mousePosRef.current.x;
      const dy = e.clientY - mousePosRef.current.y;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      mouseVelRef.current = { x: dx, y: dy };

      if (cameraModeRef.current === 'cockpit') {
        cockpitLookRef.current.yaw -= dx * 0.0035;
        cockpitLookRef.current.pitch = Math.max(-0.95, Math.min(0.95, cockpitLookRef.current.pitch - dy * 0.0035));
      } else {
        cameraRotTargetRef.current.theta -= dx * 0.0038;
        const minPhi = cameraModeRef.current === 'orbital' ? 0.08 : 0.35;
        const maxPhi = cameraModeRef.current === 'orbital' ? 3.05 : 1.48;
        cameraRotTargetRef.current.phi = Math.max(minPhi, Math.min(maxPhi, cameraRotTargetRef.current.phi + dy * 0.0038));
      }
    };

    const handleMouseUp = (e) => {
      isDraggingRef.current = false;
      if (!e) return;
      const dx = e.clientX - mouseDownPosRef.current.x;
      const dy = e.clientY - mouseDownPosRef.current.y;
      // If user performed a click rather than a pan/orbit drag, check for site pin selection
      if (Math.hypot(dx, dy) < 6 && cameraModeRef.current === 'orbital' && orbitalPinsGroupRef.current && cameraRef.current && container) {
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(orbitalPinsGroupRef.current.children, true);
        for (const hit of intersects) {
          let obj = hit.object;
          while (obj && !obj.userData?.siteData && obj.parent && obj.parent !== orbitalPinsGroupRef.current) {
            obj = obj.parent;
          }
          if (obj?.userData?.siteData) {
            const hitSite = obj.userData.siteData;
            if (onSelectSite) onSelectSite(hitSite);
            setIsSiteBarOpen(true);
            soundFX.playClick();
            break;
          }
        }
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (cameraModeRef.current !== 'cockpit') {
        const minDist = cameraModeRef.current === 'orbital' ? 110 : 3.5;
        const maxDist = cameraModeRef.current === 'orbital' ? 450 : 48;
        cameraRotTargetRef.current.distance = Math.max(minDist, Math.min(maxDist, cameraRotTargetRef.current.distance + e.deltaY * 0.028));
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop with smooth spherical damping & free rover driving physics
    let animId;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const currentSiteId = (landingSeqRef.current && landingSeqRef.current.active && landingSeqRef.current.site) ? landingSeqRef.current.site.id : (selectedSite ? selectedSite.id : 'malapert-massif');

      // ─── 0. Google Earth Street View-Style Cinematic Landing State Machine ───
      const landingSeq = landingSeqRef.current;
      if (landingSeq && landingSeq.active) {
        setOrbitalGlobeVisibility(scene, orbitalMoonGroupRef.current, false);
        if (terrainMeshRef.current) terrainMeshRef.current.visible = true;
        if (horizonMeshRef.current) horizonMeshRef.current.visible = true;
        if (rockGroupRef.current) rockGroupRef.current.visible = true;

        landingSeq.time += dt;
        const t = landingSeq.time;

        if (landingSeq.phase === 'SWOOP') {
          // Phase 1: Swoop / Dive from high orbit towards target site (0 to 2.2s)
          const swoopDuration = 2.2;
          const u = Math.min(1.0, t / swoopDuration);
          const p = u * u * (3 - 2 * u); // Smoothstep curve

          // Seamless Google Earth transition: cross-switch globe and terrain at midpoint
          if (u >= 0.45) {
            setOrbitalGlobeVisibility(scene, orbitalMoonGroupRef.current, false);
            if (terrainMeshRef.current) terrainMeshRef.current.visible = true;
            if (rockGroupRef.current) rockGroupRef.current.visible = true;
            if (rfBeamGroupRef.current) rfBeamGroupRef.current.visible = true;
          }

          // Camera dives from startCamPos to localized terrain surface perspective
          const targetCam = new THREE.Vector3(15.0, 24.0, 22.0);
          camera.position.lerpVectors(landingSeq.startCamPos, targetCam, p);
          camera.lookAt(0, 14.0 * (1 - p) + 6.0 * p, 0);

          if (t >= swoopDuration) {
            landingSeq.phase = 'DESCENT';
            setLandingPhase('DESCENT');
            soundFX.playQuindarTone(true);
            soundFX.playRocketRumble(4.2);
          }
        } else if (landingSeq.phase === 'DESCENT') {
          // Phase 2: Powered Retro-Braking Descent (2.2s to 7.2s)
          const descentDuration = 5.0;
          const tau = Math.min(1.0, (t - 2.2) / descentDuration);
          const decelCurve = Math.pow(tau, 1.5);
          const curAlt = 48.0 * (1.0 - decelCurve);
          const velocity = -16.2 * (1.0 - tau);
          const throttle = tau < 0.85 ? 1.0 : Math.max(0.18, 1.0 - (tau - 0.85) / 0.15);
          const fuel = Math.max(82.0, 98.4 - tau * 12.0);

          landingSeq.altitude = curAlt;
          landingSeq.velocity = velocity;
          landingSeq.throttle = throttle;
          landingSeq.fuel = fuel;

          // Update Astrobotic Griffin Lander & Rover Descent
          const griffinGrounding = computeGriffinLanderGrounding(currentSiteId);
          const landerGroundY = griffinGrounding.posY;
          if (griffinLanderRef.current) {
            griffinLanderRef.current.group.visible = true;
            griffinLanderRef.current.group.position.set(0, landerGroundY + curAlt, 0);
            griffinLanderRef.current.group.rotation.set(
              -griffinGrounding.pitch + Math.sin(t * 3.6) * 0.015,
              0,
              griffinGrounding.roll + Math.cos(t * 3.0) * 0.015
            );
          }
          if (apolloLMRef.current) apolloLMRef.current.group.visible = false;

          // Rover carried smoothly on the lander deck during descent
          if (viperRoverRef.current) {
            viperRoverRef.current.group.visible = true;
            viperRoverRef.current.group.position.set(0, landerGroundY + curAlt + 1.92, 1.85);
            viperRoverRef.current.group.rotation.set(-griffinGrounding.pitch, 0, griffinGrounding.roll);
          }

          // Dynamic tracking camera cinematic tracking descending lander
          const camX = 14.0 + Math.sin(t * 0.35) * 1.8;
          const camY = landerGroundY + 3.6 + curAlt * 0.24;
          const camZ = 18.0;
          camera.position.set(camX, camY, camZ);
          camera.lookAt(0, landerGroundY + curAlt + 1.2, 0);

          if (tau >= 1.0 || curAlt <= 0.05) {
            landingSeq.phase = 'TOUCHDOWN';
            setLandingPhase('TOUCHDOWN');
            soundFX.playSuccessChime();
            soundFX.playQuindarTone(false);
          }
        } else if (landingSeq.phase === 'TOUCHDOWN') {
          // Phase 3: Touchdown contact & engine cutoff (7.2s to 8.6s)
          const griffinGrounding = computeGriffinLanderGrounding(currentSiteId);
          const landerGroundY = griffinGrounding.posY;
          if (griffinLanderRef.current) {
            griffinLanderRef.current.group.visible = true;
            griffinLanderRef.current.group.position.set(0, landerGroundY, 0);
            griffinLanderRef.current.group.rotation.set(-griffinGrounding.pitch, 0, griffinGrounding.roll);
          }
          if (apolloLMRef.current) apolloLMRef.current.group.visible = false;
          if (viperRoverRef.current) {
            viperRoverRef.current.group.visible = true;
            viperRoverRef.current.group.position.set(0, landerGroundY + 1.92, 1.85);
            viperRoverRef.current.group.rotation.set(-griffinGrounding.pitch, 0, griffinGrounding.roll);
          }

          camera.position.lerp(new THREE.Vector3(7.5, landerGroundY + 3.0, 11.0), 0.07);
          camera.lookAt(0, landerGroundY + 1.0, 1.5);

          if (t >= 8.6) {
            landingSeq.phase = 'ROVER_DEPLOY';
            setLandingPhase('ROVER_DEPLOY');
            soundFX.playTelemetry();
            if (viperRoverRef.current) {
              viperRoverRef.current.group.visible = true;
            }
          }
        } else if (landingSeq.phase === 'ROVER_DEPLOY') {
          // Phase 4: Realistic NASA VIPER Rollout down Egress Ramp onto Lunar Regolith
          const griffinGrounding = computeGriffinLanderGrounding(currentSiteId);
          const landerY = griffinGrounding.posY;

          if (griffinLanderRef.current) {
            griffinLanderRef.current.group.visible = true;
            griffinLanderRef.current.group.position.set(0, landerY, 0);
            griffinLanderRef.current.group.rotation.set(-griffinGrounding.pitch, 0, griffinGrounding.roll);
          }

          // Total rollout duration: 4.6 seconds (lunar 1/6th gravity ramp egress)
          const deployDuration = 4.6;
          const u = Math.min(1.0, (t - 8.6) / deployDuration);

          // Real physics acceleration: ease-in -> coast -> ease-out on lunar regolith
          const p = u < 0.5 ? 2.0 * u * u : 1.0 - Math.pow(-2.0 * u + 2.0, 2.0) / 2.0;

          // Rover travels from lander top deck (z = 1.85) down ramp (ends at z = 7.1) to safe parking on regolith (z = 8.8)
          const zStart = 1.85;
          const zEnd = 8.8;
          const zPos = zStart + p * (zEnd - zStart);

          const rampAngle = 0.375; // 21.5° ramp incline
          const rampZEnd = 7.10;
          const rampBreakoverZ = 5.30; // Front wheels start touching ground

          let yPos = landerY;
          let roverPitch = 0;
          let roverRoll = griffinGrounding.roll;
          let suspDeltas = [0, 0, 0, 0, 0, 0];

          if (zPos <= rampBreakoverZ) {
            // Entire rover is on the inclined ramp tracks
            const rampDrop = (zPos - zStart) * Math.sin(rampAngle) / Math.cos(rampAngle);
            yPos = landerY + 1.92 - rampDrop;
            roverPitch = -rampAngle;
          } else if (zPos < rampZEnd + 0.5) {
            // Breakover zone: Front wheels roll onto lunar regolith, rear wheels still on ramp
            const breakT = (zPos - rampBreakoverZ) / ((rampZEnd + 0.5) - rampBreakoverZ);
            const rampDrop = (zPos - zStart) * Math.sin(rampAngle) / Math.cos(rampAngle);
            const rampY = landerY + 1.92 - rampDrop;
            const groundContact = computeRoverTerrainContact(0, zPos, 0, currentSiteId, climbableRocksRef.current);

            // Smoothly blend height and pitch to avoid any sudden snapping
            yPos = THREE.MathUtils.lerp(rampY, groundContact.yBase, breakT * breakT);
            roverPitch = THREE.MathUtils.lerp(-rampAngle, groundContact.pitch, breakT);
            roverRoll = THREE.MathUtils.lerp(griffinGrounding.roll, groundContact.roll, breakT);
            suspDeltas = groundContact.suspDeltas;
          } else {
            // Fully on lunar regolith: 100% Rocker-Bogie ground contact solver
            const groundContact = computeRoverTerrainContact(0, zPos, 0, currentSiteId, climbableRocksRef.current);
            yPos = groundContact.yBase;
            roverPitch = groundContact.pitch;
            roverRoll = groundContact.roll;
            suspDeltas = groundContact.suspDeltas;
          }

          if (viperRoverRef.current) {
            viperRoverRef.current.group.visible = true;
            viperRoverRef.current.group.position.set(0, yPos, zPos);
            viperRoverRef.current.group.rotation.set(-roverPitch, 0, roverRoll, 'YXZ');
            viperRoverRef.current.setSuspensionDeltas(suspDeltas);
            // Rotate wheels according to forward motion (deltaS / wheelRadius)
            const speed = (zEnd - zStart) * (u < 0.5 ? 4.0 * u : 4.0 * (1.0 - u)) / deployDuration;
            viperRoverRef.current.update(dt, Math.max(0.2, speed * 2.2), true, 0, 0);
          }

          // Leave tire tracks once wheels touch regolith
          if (zPos > rampBreakoverZ && freeTracksGroupRef.current) {
            const lastPos = lastTrackPosRef.current;
            if (Math.hypot(zPos - lastPos.z) > 0.35) {
              lastTrackPosRef.current = { x: 0, z: zPos };
              freeDrivePointsRef.current.push({ x: 0, z: zPos, heading: 0 });
              if (freeDrivePointsRef.current.length > 220) {
                freeDrivePointsRef.current.shift();
              }
              updateFreeTracksMesh(
                freeTracksGroupRef.current,
                freeDrivePointsRef.current,
                currentSiteId,
                getSiteElevation,
                wheelTrackMaterialRef.current
              );
            }
          }

          landingSeq.altitude = 0.0;
          landingSeq.velocity = 0.0;
          landingSeq.throttle = 0;
          landingSeq.fuel = 86.4;

          // Camera: Cinematic 3/4 tracking shot capturing the historic rollout
          // Smoothly transitions from framing the lander ramp to the 3rd person surface chase view
          if (u < 0.62) {
            const camProgress = u / 0.62;
            const camX = 4.2 - camProgress * 2.2;
            const camY = landerY + 2.5 - camProgress * 0.7;
            const camZ = zPos + 5.8 - camProgress * 1.2;
            camera.position.lerp(new THREE.Vector3(camX, Math.max(yPos + 0.9, camY), camZ), 0.08);
            camera.lookAt(0, yPos + 0.6, zPos);
          } else {
            const chaseProgress = (u - 0.62) / 0.38;
            const targetDist = 8.5;
            const camZ = zPos + targetDist * Math.sin(1.28) * Math.cos(0);
            const camY = yPos + 1.2 + targetDist * Math.cos(1.28);
            camera.position.lerp(new THREE.Vector3(0, Math.max(yPos + 1.1, camY), camZ), 0.06 + chaseProgress * 0.05);
            camera.lookAt(0, yPos + 0.6, zPos);
          }

          if (u >= 1.0) {
            landingSeq.phase = 'IDLE';
            landingSeq.active = false;
            setLandingPhase('IDLE');
            soundFX.playRadioSquelch();
            freeRoverStateRef.current = { x: 0, z: zPos, speed: 0, heading: 0, steerAngle: 0 };
            if (setCameraMode) setCameraMode('surface');
            cameraModeRef.current = 'surface';
            if (onLandingComplete) onLandingComplete();
          }
        }

        // Sync live telemetry to React state for HUD
        setLandingTelemetry({
          altitude: Number((landingSeq.altitude || 0).toFixed(1)),
          velocity: Number((landingSeq.velocity || 0).toFixed(1)),
          throttle: Number(((landingSeq.throttle || 0) * 100).toFixed(0)),
          fuel: Number((landingSeq.fuel || 85).toFixed(1))
        });

        renderer.render(scene, camera);
        return; // Dedicated cinematic landing frame
      }

      // Orbital Pins gentle radar ripple pulse in Moon Globe mode
      if (orbitalPinsListRef.current && cameraModeRef.current === 'orbital') {
        const pulseCycle = (now * 0.0018) % 1.0;
        orbitalPinsListRef.current.forEach((marker) => {
          const pMesh = marker.getObjectByName('PULSE_RING');
          if (pMesh) {
            const isSel = selectedSite && selectedSite.id === marker.userData.siteId;
            if (isSel) {
              const r = 0.24 + pulseCycle * 0.72;
              pMesh.scale.set(r / 0.24, r / 0.24, 1.0);
              pMesh.material.opacity = Math.max(0, (1.0 - pulseCycle) * 0.85);
            } else {
              pMesh.material.opacity = 0;
            }
          }
        });
      }

      // Check target position and heading based on active vehicle
      let roverTargetX = 0;
      let roverTargetY = 2.0;
      let roverTargetZ = 0;
      let roverHeading = 0;
      let isRoverMoving = false;
      let roverMoveSpeed = 0;

      if (activeVehicleRef.current === 'nova-c' || activeVehicleRef.current === 'lander') {
        roverTargetX = 0;
        roverTargetY = 2.0;
        roverTargetZ = 0;
      } else if (splineRef.current && activeVehicleRef.current === 'viper' && isDrivingRef.current && viperRoverRef.current) {
        // Canned automated traverse driving
        const pt = splineRef.current.getPoint(driveProgressRef.current);
        const tan = splineRef.current.getTangent(driveProgressRef.current);
        roverTargetX = pt.x;
        roverTargetZ = pt.z;
        roverHeading = Math.atan2(tan.x, tan.z);
        isRoverMoving = true;
        roverMoveSpeed = 1.5 * driveSpeedMultiplierRef.current;

        const splineContact = computeRoverTerrainContact(pt.x, pt.z, roverHeading, currentSiteId);
        roverTargetY = splineContact.yBase;

        viperRoverRef.current.group.position.set(pt.x, splineContact.yBase, pt.z);
        viperRoverRef.current.group.rotation.set(-splineContact.pitch, roverHeading, splineContact.roll, 'YXZ');
        viperRoverRef.current.setSuspensionDeltas(splineContact.suspDeltas);
        viperRoverRef.current.update(dt, roverMoveSpeed, true, 0, 0);
      } else if (viperRoverRef.current) {
        // Interactive free keyboard driving
        const keys = keysDownRef.current;
        const rover = freeRoverStateRef.current;

        const isFwd = keys['KeyW'] || keys['ArrowUp'];
        const isRev = keys['KeyS'] || keys['ArrowDown'];
        const isLeft = keys['KeyA'] || keys['ArrowLeft'];
        const isRight = keys['KeyD'] || keys['ArrowRight'];
        const isBrake = keys['Space'];

        // Lunar regolith mobility parameters (NASA VIPER mechanical specs):
        // 4 independently driven in-wheel brushless DC motors, 1/6th g gravity, responsive low-lag traction
        const accel = 3.8; // m/s^2 (Instant tactile response, zero input lag)
        const maxFwd = 4.2; // m/s (~15 km/h)
        const maxRev = -2.0;
        const steerSpeed = 2.4; // rad/s (Snappy, responsive lunar turning)

        // Steer front wheel assemblies with smooth servo response
        const targetSteer = isLeft ? 0.38 : (isRight ? -0.38 : 0);
        rover.steerAngle += (targetSteer - rover.steerAngle) * 0.28;

        if (Math.abs(rover.speed) > 0.02) {
          const dir = rover.speed >= 0 ? 1 : -1;
          if (isLeft) rover.heading += steerSpeed * dir * dt;
          if (isRight) rover.heading -= steerSpeed * dir * dt;
        }

        // Measure terrain slope along heading direction for realistic lunar locomotion
        const curElev = getSiteElevation(rover.x, rover.z, currentSiteId);
        const probeAheadX = rover.x + Math.sin(rover.heading) * 0.8;
        const probeAheadZ = rover.z + Math.cos(rover.heading) * 0.8;
        const aheadElev = getSiteElevation(probeAheadX, probeAheadZ, currentSiteId);
        const localSlopeGrade = (aheadElev - curElev) / 0.8;
        const slopeAngle = Math.atan(localSlopeGrade);

        // Slope gravitational resistance/assist in 1/6th g
        const gravitySlopeFactor = Math.sin(slopeAngle) * 0.85;

        if (isFwd) {
          rover.speed = Math.min(maxFwd, rover.speed + (accel - gravitySlopeFactor) * dt);
        } else if (isRev) {
          rover.speed = Math.max(maxRev, rover.speed - (accel + gravitySlopeFactor) * dt);
        } else {
          rover.speed *= Math.pow(0.80, dt * 60); // Regolith rolling drag
        }

        if (isBrake) {
          rover.speed *= Math.pow(0.30, dt * 60); // Heavy friction brake
        }

        // Mechanical climb limit: slope > 24 deg causes wheel slip
        if (slopeAngle > 0.42 && rover.speed > 0) {
          rover.speed = Math.max(0, rover.speed - 2.5 * dt);
        }

        // Proposed displacement
        const moveDist = rover.speed * dt;
        let nextX = rover.x + Math.sin(rover.heading) * moveDist;
        let nextZ = rover.z + Math.cos(rover.heading) * moveDist;

        // --- OPTIMIZED HIGH-PERFORMANCE OBSTACLE COLLISION DETECTION (Zero GC/CPU Lag) ---
        const cosH = Math.cos(rover.heading);
        const sinH = Math.sin(rover.heading);

        // Three principal hull envelopes covering full vehicle bounding perimeter
        const testPoints = [
          { lx: 0, lz: 0, r: 1.15 },      // Central chassis envelope
          { lx: 0, lz: 1.05, r: 0.85 },   // Front bumper & front wheels envelope
          { lx: 0, lz: -1.05, r: 0.85 }   // Rear bumper & rear wheels envelope
        ];

        let isBlockedByBoulder = false;
        const allObs = obstaclesRef.current;
        // Spatial pre-filter: test only obstacles within 4.5m radius
        for (let i = 0; i < allObs.length; i++) {
          const obs = allObs[i];
          if (Math.abs(nextX - obs.x) > 4.5 || Math.abs(nextZ - obs.z) > 4.5) continue;

          for (let j = 0; j < testPoints.length; j++) {
            const tp = testPoints[j];
            const tpx = nextX + tp.lx * cosH + tp.lz * sinH;
            const tpz = nextZ - tp.lx * sinH + tp.lz * cosH;
            const dx = tpx - obs.x;
            const dz = tpz - obs.z;
            const distSq = dx * dx + dz * dz;
            const minDist = tp.r + obs.radius;

            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq);
              const nx = dist > 0.001 ? (dx / dist) : Math.sin(rover.heading + Math.PI);
              const nz = dist > 0.001 ? (dz / dist) : Math.cos(rover.heading + Math.PI);
              const penetration = minDist - dist;

              nextX += nx * (penetration + 0.02);
              nextZ += nz * (penetration + 0.02);

              const travelX = Math.sin(rover.heading) * rover.speed;
              const travelZ = Math.cos(rover.heading) * rover.speed;
              const dot = travelX * nx + travelZ * nz;
              if (dot < 0) {
                rover.speed = 0;
                isBlockedByBoulder = true;
              }
              break;
            }
          }
        }

        // --- OPERATIONAL MISSION TRAVERSE PERIMETER (Never drive off into empty space) ---
        const MISSION_BOUNDARY_RADIUS = 280.0;
        const roverDist = Math.hypot(nextX, nextZ);
        let outOfBounds = false;
        if (roverDist >= MISSION_BOUNDARY_RADIUS - 1.5) {
          const bAngle = Math.atan2(nextZ, nextX);
          if (roverDist > MISSION_BOUNDARY_RADIUS) {
            nextX = Math.cos(bAngle) * MISSION_BOUNDARY_RADIUS;
            nextZ = Math.sin(bAngle) * MISSION_BOUNDARY_RADIUS;
          }

          // Arrest outward velocity
          const travelX = Math.sin(rover.heading) * rover.speed;
          const travelZ = Math.cos(rover.heading) * rover.speed;
          const radX = Math.cos(bAngle);
          const radZ = Math.sin(bAngle);
          const outward = travelX * radX + travelZ * radZ;
          if (outward > 0 || (isFwd && Math.abs(rover.speed) < 0.05)) {
            outOfBounds = true;
            rover.speed = Math.min(0, rover.speed);
          }
        }
        if (isBoundaryWarningRef.current !== outOfBounds) {
          isBoundaryWarningRef.current = outOfBounds;
          setIsBoundaryWarning(outOfBounds);
        }

        // Commit validated position & track real-time traverse odometry
        const stepDist = Math.hypot(nextX - rover.x, nextZ - rover.z);
        rover.odometry = (rover.odometry || 0) + stepDist;
        window.__LUNAR_ROVER_ODOMETRY__ = rover.odometry;
        rover.x = nextX;
        rover.z = nextZ;

        // Calculate 6-wheel independent contact, chassis elevation, pitch, roll, and suspension with small rock climbing
        const contact = computeRoverTerrainContact(rover.x, rover.z, rover.heading, currentSiteId, climbableRocksRef.current);

        // Subtle motor torque vibration when pressing W against a large boulder
        if (isBlockedByBoulder && isFwd) {
          const shudder = Math.sin(now * 0.04) * 0.006;
          contact.suspDeltas[0] += shudder;
          contact.suspDeltas[3] += shudder;
        }

        // Position rover base directly at yBase (Zero air gap! Firm ground contact!)
        viperRoverRef.current.group.position.set(rover.x, contact.yBase, rover.z);
        viperRoverRef.current.group.rotation.set(-contact.pitch, rover.heading, contact.roll, 'YXZ');
        viperRoverRef.current.setSuspensionDeltas(contact.suspDeltas);

        // Check if turning in place (differential skid steer)
        const isTurningInPlace = Math.abs(rover.speed) < 0.05 && (keys['KeyA'] || keys['KeyD'] || keys['ArrowLeft'] || keys['ArrowRight']);
        const turnRate = isTurningInPlace ? ((keys['KeyA'] || keys['ArrowLeft']) ? 0.85 : -0.85) : 0;

        viperRoverRef.current.update(
          dt,
          rover.speed,
          Math.abs(rover.speed) > 0.01 || isTurningInPlace,
          rover.steerAngle,
          turnRate
        );

        roverTargetX = rover.x;
        roverTargetY = contact.yBase;
        roverTargetZ = rover.z;
        roverHeading = rover.heading;
        isRoverMoving = Math.abs(rover.speed) > 0.05;
        roverMoveSpeed = Math.abs(rover.speed);

        // Update dynamic free driving wheel tracks in regolith (throttled for 60fps silky smooth rendering)
        if (freeTracksGroupRef.current && isRoverMoving && activeVehicleRef.current === 'viper' && !isDrivingRef.current) {
          const distFromLast = Math.hypot(roverTargetX - lastTrackPosRef.current.x, roverTargetZ - lastTrackPosRef.current.z);
          if (distFromLast >= 0.75) {
            lastTrackPosRef.current = { x: roverTargetX, z: roverTargetZ };
            freeDrivePointsRef.current.push({ x: roverTargetX, z: roverTargetZ, heading: roverHeading });
            if (freeDrivePointsRef.current.length > 120) {
              freeDrivePointsRef.current.shift();
            }
            updateFreeTracksMesh(
              freeTracksGroupRef.current,
              freeDrivePointsRef.current,
              currentSiteId,
              getSiteElevation,
              wheelTrackMaterialRef.current
            );
          }
        }
      }

      // Update dynamic regolith wheel tracks when driving along spline
      if (dynamicTracksGroupRef.current && splineRef.current && activeVehicleRef.current === 'viper' && isDrivingRef.current) {
        if (Math.abs(lastTrackProgressRef.current - driveProgressRef.current) > 0.002) {
          lastTrackProgressRef.current = driveProgressRef.current;
          updateDynamicWheelTracks(
            dynamicTracksGroupRef.current,
            splineRef.current,
            driveProgressRef.current,
            currentSiteId,
            getSiteElevation,
            wheelTrackMaterialRef.current
          );
        }
      }

      // ─── Gentle Chase Camera Orientation Follow when Driving in Surface Mode ───
      if (cameraModeRef.current === 'surface' && isRoverMoving && !isDraggingRef.current) {
        const targetChaseTheta = roverHeading + Math.PI;
        let angleDiff = (targetChaseTheta - cameraRotTargetRef.current.theta) % (Math.PI * 2);
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        cameraRotTargetRef.current.theta += angleDiff * 0.025;
      }

      // ─── Fluid Physical Momentum Decay on Mouse Release ───
      if (!isDraggingRef.current) {
        if (Math.abs(mouseVelRef.current.x) > 0.012 || Math.abs(mouseVelRef.current.y) > 0.012) {
          if (cameraModeRef.current !== 'cockpit') {
            cameraRotTargetRef.current.theta -= mouseVelRef.current.x * 0.0035;
            const minPhi = cameraModeRef.current === 'orbital' ? 0.08 : 0.35;
            const maxPhi = cameraModeRef.current === 'orbital' ? 3.05 : 1.48;
            cameraRotTargetRef.current.phi = Math.max(minPhi, Math.min(maxPhi, cameraRotTargetRef.current.phi + mouseVelRef.current.y * 0.0035));
          }
          mouseVelRef.current.x *= 0.92;
          mouseVelRef.current.y *= 0.92;
        } else if (cameraModeRef.current === 'orbital' && !isDrivingRef.current) {
          // Slow majestic celestial orbital procession
          cameraRotTargetRef.current.theta += 0.00015;
        }
      }

      // ─── Smooth Camera Damping & Interpolation (Apple/Linear Smoothness) ───
      const targetRot = cameraRotTargetRef.current;
      const smoothRot = cameraRotSmoothRef.current;
      const dampFactor = 0.085;

      smoothRot.theta += (targetRot.theta - smoothRot.theta) * dampFactor;
      smoothRot.phi += (targetRot.phi - smoothRot.phi) * dampFactor;
      smoothRot.distance += (targetRot.distance - smoothRot.distance) * dampFactor;

      const targetElevation = (activeVehicleRef.current === 'nova-c' || activeVehicleRef.current === 'lander') ? 3.6 : ((activeVehicleRef.current === 'griffin') ? 2.8 : 0.65);
      cameraTargetPosRef.current.lerp(new THREE.Vector3(roverTargetX, roverTargetY + targetElevation, roverTargetZ), 0.08);

      if (cameraModeRef.current === 'cockpit') {
        const { yaw, pitch } = cockpitLookRef.current;
        const camX = roverTargetX + (-0.35 * Math.cos(roverHeading) + 0.62 * Math.sin(roverHeading));
        const camY = roverTargetY + 2.45;
        const camZ = roverTargetZ + (0.62 * Math.cos(roverHeading) + 0.35 * Math.sin(roverHeading));
        const lookDist = 50.0;
        const totalYaw = roverHeading + yaw;
        const targetX = camX + lookDist * Math.sin(totalYaw) * Math.cos(pitch);
        const targetY = camY + lookDist * Math.sin(pitch);
        const targetZ = camZ + lookDist * Math.cos(totalYaw) * Math.cos(pitch);

        camera.position.set(camX, camY, camZ);
        camera.lookAt(targetX, targetY, targetZ);
      } else if (cameraModeRef.current === 'rover') {
        // Dedicated 3rd-Person Chase Camera following behind the active rover
        const chaseDist = 5.2;
        const chaseHeight = 2.4;
        const targetCamX = roverTargetX - Math.sin(roverHeading) * chaseDist;
        const targetCamZ = roverTargetZ - Math.cos(roverHeading) * chaseDist;
        const groundElev = getSiteElevation(targetCamX, targetCamZ, currentSiteId);
        const targetCamY = Math.max(roverTargetY + chaseHeight, groundElev + 1.2);

        camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.14);
        camera.lookAt(roverTargetX, roverTargetY + 0.95, roverTargetZ);
      } else if (cameraModeRef.current === 'orbital') {
        // High-altitude sweeping celestial perspective framing NASA LRO 3D Moon Globe
        const camX = smoothRot.distance * Math.sin(smoothRot.phi) * Math.sin(smoothRot.theta);
        const camZ = smoothRot.distance * Math.sin(smoothRot.phi) * Math.cos(smoothRot.theta);
        const camY = smoothRot.distance * Math.cos(smoothRot.phi);

        camera.position.set(camX, camY, camZ);
        camera.lookAt(0, 0, 0);

        if (orbitalMoonGroupRef.current && !isDraggingRef.current) {
          orbitalMoonGroupRef.current.rotation.y += 0.0008; // Left-to-right planetary rotation
        }
      } else {
        // Surface & Lander perspective
        const camX = cameraTargetPosRef.current.x + smoothRot.distance * Math.sin(smoothRot.phi) * Math.sin(smoothRot.theta);
        const camZ = cameraTargetPosRef.current.z + smoothRot.distance * Math.sin(smoothRot.phi) * Math.cos(smoothRot.theta);
        const groundElev = getSiteElevation(camX, camZ, currentSiteId);
        const calculatedY = cameraTargetPosRef.current.y + smoothRot.distance * Math.cos(smoothRot.phi);
        const camY = Math.max(calculatedY, groundElev + 1.4);

        camera.position.set(camX, camY, camZ);
        camera.lookAt(cameraTargetPosRef.current.x, cameraTargetPosRef.current.y, cameraTargetPosRef.current.z);
      }

      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y += 0.0006;
      }

      // ─── 60 FPS NASA Vacuum Grazing Sun & Hapke Shader Synchronizer ───
      if (lunarLightingRef.current) {
        let focusTarget = new THREE.Vector3(0, 2.0, 0);
        if (activeVehicleRef.current === 'viper' && viperRoverRef.current) {
          focusTarget = viperRoverRef.current.group.position;
        } else if (activeVehicleRef.current === 'griffin' && griffinLanderRef.current) {
          focusTarget = griffinLanderRef.current.group.position;
        } else if (novaCLanderRef.current && (activeVehicleRef.current === 'nova-c' || activeVehicleRef.current === 'lander')) {
          focusTarget = novaCLanderRef.current.group.position;
        }

        const sunAz = telemetry?.sun?.azimuth ?? 35.0;
        const sunElev = Math.max(0.5, telemetry?.sun?.elevation ?? 1.8);
        const { sunDir, earthDir } = lunarLightingRef.current.updateLighting({
          newSunAzimuthDeg: sunAz,
          newSunElevationDeg: sunElev,
          focusTarget
        });

        if (terrainMaterialRef.current) {
          updateLunarRegolithUniforms(terrainMaterialRef.current, {
            sunDir,
            earthDir,
            roverPos: focusTarget
          });
        }
      }

      if (sunMeshRef.current) {
        const sunDamp = 0.12;
        sunPosSmoothRef.current.lerp(sunPosTargetRef.current, sunDamp);
        if (sunPosSmoothRef.current.lengthSq() > 10) {
          sunPosSmoothRef.current.setLength(2400);
        }
        sunMeshRef.current.position.copy(sunPosSmoothRef.current);
      }

      if (earthGroupRef.current) {
        earthPosSmoothRef.current.lerp(earthPosTargetRef.current, 0.08);
        earthGroupRef.current.position.copy(earthPosSmoothRef.current);
        earthGroupRef.current.lookAt(0, 2.0, 0);
      }

      // ─── 60 FPS High-Precision RF Comms Beam Attached to Vehicle Antenna Gimbal ───
      if (rfBeamGroupRef.current && rfBeamGroupRef.current.children.length > 0) {
        const line = rfBeamGroupRef.current.children[0];
        if (line && line.geometry) {
          const positions = line.geometry.attributes.position.array;
          let antX = 0, antY = 2.4, antZ = 0;

          if (viperRoverRef.current && viperRoverRef.current.group && viperRoverRef.current.group.visible) {
            const worldAntPos = new THREE.Vector3();
            if (viperRoverRef.current.antGimbal) {
              viperRoverRef.current.antGimbal.getWorldPosition(worldAntPos);
              antX = worldAntPos.x;
              antY = worldAntPos.y;
              antZ = worldAntPos.z;
            } else {
              const rPos = viperRoverRef.current.group.position;
              antX = rPos.x;
              antY = rPos.y + 1.85;
              antZ = rPos.z;
            }
          } else if (griffinLanderRef.current && griffinLanderRef.current.group && griffinLanderRef.current.group.visible) {
            antX = griffinLanderRef.current.group.position.x - 1.4;
            antY = griffinLanderRef.current.group.position.y + 2.5;
            antZ = griffinLanderRef.current.group.position.z - 1.2;
          } else if (novaCLanderRef.current && novaCLanderRef.current.group && novaCLanderRef.current.group.visible) {
            antX = novaCLanderRef.current.group.position.x;
            antY = novaCLanderRef.current.group.position.y + 3.8;
            antZ = novaCLanderRef.current.group.position.z;
          }

          positions[0] = antX;
          positions[1] = antY;
          positions[2] = antZ;

          const earthElevRad = degToRad(telemetry?.earth?.elevation ?? 8.5);
          const earthAzRad = degToRad(telemetry?.earth?.azimuth ?? 215.0);
          const dirX = Math.cos(earthElevRad) * Math.sin(earthAzRad);
          const dirY = Math.sin(earthElevRad);
          const dirZ = -Math.cos(earthElevRad) * Math.cos(earthAzRad);
          const beamLen = 240;

          positions[3] = antX + dirX * beamLen;
          positions[4] = antY + dirY * beamLen;
          positions[5] = antZ + dirZ * beamLen;

          line.geometry.attributes.position.needsUpdate = true;
          line.computeLineDistances();
        }
      }

      // Periodic Geomorphological Hazard & Cold-Trap Mineralogy Discovery Sampling (~10 Hz)
      if (viperRoverRef.current && activeVehicleRef.current === 'viper' && Math.random() < 0.16) {
        const rPos = viperRoverRef.current.group.position;
        const haz = getRoverHazardTelemetry(rPos.x, rPos.z, currentSiteId);
        setRoverHazard(haz);

        // Discovery system: Cold trap water-ice volatile discovery
        if (haz.isColdTrapCandidate && !discoveredSampleRef.current) {
          const sample = {
            location: `${(selectedSite?.name || 'South Pole').toUpperCase()} PSR COLD-TRAP`,
            elevationM: haz.elevationMeters,
            slopeDeg: haz.slopeDegrees,
            h2oYieldWEH: (5.4 + Math.random() * 2.6).toFixed(1),
            anorthositePct: 62.4,
            ilmenitePct: 4.6,
            volatileYield: 'HIGH_CRYOGENIC_ICE',
            drillDepthCm: 92,
            timestamp: new Date().toLocaleTimeString()
          };
          discoveredSampleRef.current = sample;
          setDiscoveredSample(sample);
          soundFX.playSuccess();
        }
      }

      if (viperRoverRef.current && !isDrivingRef.current && activeVehicleRef.current !== 'viper') {
        viperRoverRef.current.update(dt, roverMoveSpeed, isRoverMoving);
      }

      // ─── Fail-Safe Visibility Sync Between Orbital Planetary Recon and Surface Topography ───
      const isOrbitalFrame = cameraModeRef.current === 'orbital' && (!landingSeq || !landingSeq.active);
      setOrbitalGlobeVisibility(scene, orbitalMoonGroupRef.current, isOrbitalFrame);
      if (terrainMeshRef.current && terrainMeshRef.current.visible !== !isOrbitalFrame) {
        terrainMeshRef.current.visible = !isOrbitalFrame;
      }
      if (horizonMeshRef.current && horizonMeshRef.current.visible !== !isOrbitalFrame) {
        horizonMeshRef.current.visible = !isOrbitalFrame;
      }
      if (rockGroupRef.current && rockGroupRef.current.visible !== !isOrbitalFrame) {
        rockGroupRef.current.visible = !isOrbitalFrame;
      }
      if (freeTracksGroupRef.current && freeTracksGroupRef.current.visible !== !isOrbitalFrame) {
        freeTracksGroupRef.current.visible = !isOrbitalFrame;
      }
      if (traversePathGroupRef.current && traversePathGroupRef.current.visible !== !isOrbitalFrame) {
        traversePathGroupRef.current.visible = !isOrbitalFrame;
      }
      if (apolloLMRef.current) {
        const showApollo = !isOrbitalFrame && activeVehicleRef.current === 'apollo';
        if (apolloLMRef.current.group.visible !== showApollo) {
          apolloLMRef.current.group.visible = showApollo;
        }
      }
      if (rfBeamGroupRef.current && rfBeamGroupRef.current.visible !== !isOrbitalFrame) {
        rfBeamGroupRef.current.visible = !isOrbitalFrame;
      }
      if (wheelTracksGroupRef.current) {
        const showTracks = !isOrbitalFrame;
        if (wheelTracksGroupRef.current.visible !== showTracks) wheelTracksGroupRef.current.visible = showTracks;
      }
      if (griffinLanderRef.current) {
        // Astrobotic Griffin Carrier Lander: strictly visible on surface during rover rollout and surface ops
        const showGriffin = !isOrbitalFrame && activeVehicleRef.current !== 'apollo' && (activeVehicleRef.current !== 'nova-c' || landingSeqRef.current.active);
        if (griffinLanderRef.current.group.visible !== showGriffin) griffinLanderRef.current.group.visible = showGriffin;
      }
      if (novaCLanderRef.current) {
        // Nova-C: only visible when explicitly selected and NOT during Griffin carrier deploy
        const showNova = !isOrbitalFrame && activeVehicleRef.current === 'nova-c' && !landingSeqRef.current.active;
        if (novaCLanderRef.current.group.visible !== showNova) novaCLanderRef.current.group.visible = showNova;
      }
      if (viperRoverRef.current) {
        // NASA VIPER Rover: ALWAYS visible during rollout (ROVER_DEPLOY) and on lunar surface
        const showViper = !isOrbitalFrame && activeVehicleRef.current !== 'apollo';
        if (viperRoverRef.current.group.visible !== showViper) viperRoverRef.current.group.visible = showViper;
      }

      // ─── Real-Time Physical Radio Beam (Earth Line-of-Sight) & Obstacle Raycasting ───
      if (!isOrbitalFrame) {
        const rPos = viperRoverRef.current ? viperRoverRef.current.group.position : new THREE.Vector3(0, 0, 8.8);

        // Track RF line start and end points dynamically
        if (rfBeamGroupRef.current && rfBeamGroupRef.current.children[0]) {
          const rfLine = rfBeamGroupRef.current.children[0];
          const posAttr = rfLine.geometry.attributes.position;
          if (posAttr) {
            posAttr.setXYZ(0, rPos.x, rPos.y + 1.8, rPos.z);
            if (commsTelemetry.dteBlocked) {
              // Re-route upward to CLPS Lunar Relay Orbiter
              posAttr.setXYZ(1, rPos.x + 35, 240, rPos.z - 50);
            } else if (earthGroupRef.current) {
              posAttr.setXYZ(1, earthGroupRef.current.position.x, earthGroupRef.current.position.y, earthGroupRef.current.position.z);
            }
            posAttr.needsUpdate = true;
          }
        }
      }

      // Obstacle & Line-of-Sight Telemetry Sampling
      if (!isOrbitalFrame && Math.random() < 0.08) {
        const rPos = viperRoverRef.current ? viperRoverRef.current.group.position : new THREE.Vector3(0, 0, 8.8);

        // Earth elevation vs horizon check
        const earthEl = telemetry?.earth?.elevationDeg ?? 2.4;
        const earthHor = telemetry?.earth?.horizonDeg ?? 1.2;
        const dteBlocked = earthEl <= earthHor;

        // Sun elevation vs horizon check
        const sunEl = telemetry?.sun?.elevationDeg ?? 1.8;
        const sunHor = telemetry?.sun?.horizonDeg ?? 1.2;
        const sunOccluded = sunEl <= sunHor;

        // Nearest boulder obstacle clearance
        let nearestDist = 999;
        for (const obs of obstaclesRef.current) {
          const d = Math.hypot(obs.x - rPos.x, obs.z - rPos.z) - obs.r;
          if (d < nearestDist) nearestDist = Math.max(0, d);
        }

        setCommsTelemetry({
          dteBlocked,
          sunOccluded,
          nearestObstacleM: Number(nearestDist.toFixed(1))
        });

        if (rfBeamGroupRef.current && rfBeamGroupRef.current.children[0]) {
          const rfLine = rfBeamGroupRef.current.children[0];
          rfLine.material.color.setHex(dteBlocked ? 0xf87171 : 0x38bdf8);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (orbitalMoonGroup.parent !== scene) disposeSurfaceScene(orbitalMoonGroup);
      disposeSurfaceScene(scene);
      renderer.dispose();
    };
  }, []);

  // Update vehicle visibility and rover controls
  useEffect(() => {
    if (griffinLanderRef.current) {
      griffinLanderRef.current.group.visible = (activeVehicle === 'viper' || activeVehicle === 'griffin');
    }
    if (novaCLanderRef.current) {
      novaCLanderRef.current.group.visible = (activeVehicle === 'nova-c' || activeVehicle === 'lander');
    }
    if (viperRoverRef.current) {
      viperRoverRef.current.group.visible = (activeVehicle === 'viper' || activeVehicle === 'griffin' || activeVehicle === 'griffin-rover');
      viperRoverRef.current.setHeadlights(roverHeadlights);
      viperRoverRef.current.setDrillState(roverDrillState);
      if (viperRoverRef.current.setModelType) {
        viperRoverRef.current.setModelType(activeVehicle);
      }
      if (roverDrillState === 'drilling' || roverDrillState === 'sampling') {
        setIsDrillReportOpen(true);
      }
    }
    if (wheelTracksGroupRef.current) {
      wheelTracksGroupRef.current.visible = (activeVehicle === 'viper' || activeVehicle === 'griffin' || activeVehicle === 'griffin-rover');
    }
    if (cameraModeRef.current !== 'orbital') {
      if (activeVehicle === 'viper') {
        cameraRotTargetRef.current.distance = 7.8;
        cameraRotTargetRef.current.phi = 1.34;
      } else if (activeVehicle === 'griffin' || activeVehicle === 'nova-c') {
        cameraRotTargetRef.current.distance = 14.0;
      }
    }
  }, [activeVehicle, roverHeadlights, roverDrillState]);

  // Update 3D autonomous traverse path spline and waypoint markers
  useEffect(() => {
    if (!sceneRef.current || !traversePathGroupRef.current) return;
    const group = traversePathGroupRef.current;

    // Clear old children
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    if (!activeTraverse || !activeTraverse.waypoints) {
      splineRef.current = null;
      return;
    }

    const currentSiteId = selectedSite ? selectedSite.id : 'malapert-massif';
    const spline = buildTraverseSpline(activeTraverse.waypoints, (x, z) => getSiteElevation(x, z, currentSiteId));
    splineRef.current = spline;

    // 1. Neon Cyan Glowing Path Ribbon
    const pathPoints = spline.getPoints(240);
    const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });
    const pathLine = new THREE.Line(pathGeo, pathMat);
    group.add(pathLine);

    // 2. Waypoint Glowing Beacons
    activeTraverse.waypoints.forEach((wp, idx) => {
      const y = getSiteElevation(wp.x, wp.z, currentSiteId);
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(wp.x, y + 0.1, wp.z);

      // Ground disc ring
      const ringGeo = new THREE.RingGeometry(0.8, 1.2, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: wp.drill ? 0x00f0ff : 0x34d399,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      beaconGroup.add(new THREE.Mesh(ringGeo, ringMat));

      // Vertical beacon light column
      const colGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8);
      const colMat = new THREE.MeshBasicMaterial({
        color: wp.drill ? 0x00f0ff : 0x34d399,
        transparent: true,
        opacity: 0.45
      });
      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.position.y = 1.75;
      beaconGroup.add(colMesh);

      group.add(beaconGroup);
    });
  }, [activeTraverse, selectedSite]);

  // Update terrain when selected site changes
  useEffect(() => {
    if (terrainGeoRef.current && selectedSite) {
      const posAttr = terrainGeoRef.current.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        posAttr.setY(i, getHorizonCurvedElevation(x, z, selectedSite.id));
      }
      terrainGeoRef.current.computeVertexNormals();
      posAttr.needsUpdate = true;

      // Update distant horizon ring
      if (horizonGeoRef.current) {
        const hPos = horizonGeoRef.current.attributes.position;
        for (let i = 0; i < hPos.count; i++) {
          const hx = hPos.getX(i);
          const hz = hPos.getZ(i);
          const hr = Math.sqrt(hx * hx + hz * hz);
          const phi = Math.atan2(hz, hx);
          const baseElev = getSiteElevation((hx / hr) * 440, (hz / hr) * 440, selectedSite.id);
          const ridgeU = Math.min(1.0, (hr - 440) / 1100);
          const mountainPeak = Math.sin(phi * 4.0) * 48.0 + Math.cos(phi * 9.0) * 32.0 + Math.sin(phi * 15.0 + 1.4) * 20.0;
          const curvatureDrop = (hr * hr) / (2.0 * 1737000.0) * 8.0;
          hPos.setY(i, baseElev + mountainPeak * ridgeU - curvatureDrop);
        }
        horizonGeoRef.current.computeVertexNormals();
        hPos.needsUpdate = true;
      }

      // Update rocks
      if (rockGroupRef.current) {
        rockGroupRef.current.children.forEach(rock => {
          const rx = rock.position.x;
          const rz = rock.position.z;
          rock.position.y = getSiteElevation(rx, rz, selectedSite.id) + 0.18;
        });
      }

      // Re-ground landers & VIPER rover to exact terrain elevation for this site
      if (landingSeqRef.current) {
        landingSeqRef.current.site = selectedSite;
      }

      if (griffinLanderRef.current) {
        const gGround = computeGriffinLanderGrounding(selectedSite.id);
        griffinLanderRef.current.group.position.set(0, gGround.posY, 0);
        griffinLanderRef.current.group.rotation.set(-gGround.pitch, 0, gGround.roll);
      }
      if (novaCLanderRef.current) {
        const nGround = computeNovaCGrounding(selectedSite.id);
        novaCLanderRef.current.group.position.set(0, nGround.posY, 0);
        novaCLanderRef.current.group.rotation.set(-nGround.pitch, 0, nGround.roll);
      }

      // Reset rover position and clear tracks so rover is cleanly relocated at new site
      freeRoverStateRef.current = { x: 0, z: 8.8, speed: 0, heading: 0, steerAngle: 0 };
      freeDrivePointsRef.current = [];
      if (freeTracksGroupRef.current) {
        while (freeTracksGroupRef.current.children.length > 0) {
          const c = freeTracksGroupRef.current.children[0];
          if (c.geometry) c.geometry.dispose();
          freeTracksGroupRef.current.remove(c);
        }
      }

      if (viperRoverRef.current) {
        const contact = computeRoverTerrainContact(0, 8.8, 0, selectedSite.id, climbableRocksRef.current);
        viperRoverRef.current.group.position.set(0, contact.yBase, 8.8);
        viperRoverRef.current.group.rotation.set(-contact.pitch, 0, contact.roll, 'YXZ');
        viperRoverRef.current.setSuspensionDeltas(contact.suspDeltas);
      }
    }
  }, [selectedSite]);

  // Update Dynamic Sun & Earth Positions (Target Vectors for 60fps smoothing)
  useEffect(() => {
    if (!telemetry) return;

    const baseY = 2.0;

    // 1. Sun Position & Grazing Sunlight
    const sunAzRad = degToRad(telemetry.sun.azimuth);
    const sunElevRad = degToRad(telemetry.sun.elevation);
    const sunDist = 2400; // Deep celestial distance

    const sunX = sunDist * Math.cos(sunElevRad) * Math.sin(sunAzRad);
    const sunY = baseY + sunDist * Math.sin(sunElevRad);
    const sunZ = -sunDist * Math.cos(sunElevRad) * Math.cos(sunAzRad);

    // Directional shadow-casting light (kept at 220m for shadow map accuracy)
    const lightDist = 220;
    const lightX = lightDist * Math.cos(sunElevRad) * Math.sin(sunAzRad);
    const lightY = baseY + lightDist * Math.sin(sunElevRad);
    const lightZ = -lightDist * Math.cos(sunElevRad) * Math.cos(sunAzRad);

    sunPosTargetRef.current.set(sunX, sunY, sunZ);
    sunLightTargetRef.current.set(lightX, Math.max(baseY + 1.2, lightY), lightZ);

    // Maintain a minimum lunar twilight / starlight floor of 1.85 even during shadow, 5.2 in sunlight
    sunIntensityTargetRef.current = !telemetry.sun.isVisible ? 1.85 : 5.2;
    sunOpacityTargetRef.current = !telemetry.sun.isVisible ? 0.35 : 0.99;

    // 2. Earth Position & Earthshine (Deep celestial distance outside terrain skirt)
    const earthAzRad = degToRad(telemetry.earth.azimuth);
    const earthElevRad = degToRad(telemetry.earth.elevation);
    const earthDist = 2200;

    const earthX = earthDist * Math.cos(earthElevRad) * Math.sin(earthAzRad);
    const earthY = baseY + earthDist * Math.sin(earthElevRad);
    const earthZ = -earthDist * Math.cos(earthElevRad) * Math.cos(earthAzRad);

    earthPosTargetRef.current.set(earthX, earthY, earthZ);
    // Earthshine: Earth provides soft blue-white illumination across the regolith
    earthshineIntensityTargetRef.current = telemetry.earth.elevation > -4 ? 1.25 : 0.45;

    // Immediate sync on initial render
    if (!isCelestialInitRef.current && sunMeshRef.current && sunLightRef.current && earthGroupRef.current) {
      sunPosSmoothRef.current.copy(sunPosTargetRef.current);
      sunLightSmoothRef.current.copy(sunLightTargetRef.current);
      sunMeshRef.current.position.copy(sunPosSmoothRef.current);
      sunLightRef.current.position.copy(sunLightSmoothRef.current);
      earthPosSmoothRef.current.copy(earthPosTargetRef.current);
      earthGroupRef.current.position.copy(earthPosSmoothRef.current);
      sunIntensitySmoothRef.current = sunIntensityTargetRef.current;
      sunLightRef.current.intensity = sunIntensitySmoothRef.current;
      isCelestialInitRef.current = true;
    }

    // 3. Antenna Tracks Earth
    if (activeVehicle === 'viper' && viperRoverRef.current) {
      viperRoverRef.current.antGimbal.lookAt(earthX, earthY, earthZ);
    } else if (activeVehicle === 'griffin' && griffinLanderRef.current) {
      griffinLanderRef.current.hgaGroup.lookAt(earthX, earthY, earthZ);
    } else if (novaCLanderRef.current) {
      novaCLanderRef.current.topDeckGroup.lookAt(earthX, earthY, earthZ);
    }

    // 4. RF Link Line (Dashed vector reaching 140m into sky towards Earth)
    if (rfBeamGroupRef.current) {
      const line = rfBeamGroupRef.current.children[0];
      if (line && line.geometry) {
        const positions = line.geometry.attributes.position.array;
        let antX = 0, antY = baseY + 2.3, antZ = 0;
        if (activeVehicle === 'nova-c' || activeVehicle === 'lander') {
          antY = baseY + 3.8;
        } else if (activeVehicle === 'griffin') {
          antX = -1.4; antY = baseY + 2.3; antZ = -1.2;
        } else if (activeVehicle === 'viper' && viperRoverRef.current) {
          antX = viperRoverRef.current.group.position.x;
          antY = viperRoverRef.current.group.position.y + 2.3;
          antZ = viperRoverRef.current.group.position.z;
        }
        positions[0] = antX; positions[1] = antY; positions[2] = antZ;
        const dirX = Math.cos(earthElevRad) * Math.sin(earthAzRad);
        const dirY = Math.sin(earthElevRad);
        const dirZ = -Math.cos(earthElevRad) * Math.cos(earthAzRad);
        const beamLen = 140;
        positions[3] = antX + dirX * beamLen;
        positions[4] = antY + dirY * beamLen;
        positions[5] = antZ + dirZ * beamLen;
        line.geometry.attributes.position.needsUpdate = true;
        line.computeLineDistances();

        const color = telemetry.earth.commStatus === 'BLACKOUT' ? 0xf87171 : 0x34d399;
        line.material.color.setHex(color);
      }
    }

    // 5. Solar Panel Tilt
    if (solarPanelGroupRef.current) {
      solarPanelGroupRef.current.rotation.x = degToRad(panelTiltDeg);
      solarPanelGroupRef.current.rotation.y = sunAzRad + Math.PI / 2;
    }
  }, [telemetry, panelTiltDeg]);

  const triggerCinematicLanding = (site) => {
    if (triggerCinematicLandingRef.current) {
      triggerCinematicLandingRef.current(site);
    }
  };

  const handleReturnToOrbit = () => {
    soundFX.playClick();
    if (setCameraMode) setCameraMode('orbital');
    cameraModeRef.current = 'orbital';
    cameraRotTargetRef.current = { theta: 0.25, phi: 2.30, distance: 180 };
    cameraRotSmoothRef.current = { theta: 0.25, phi: 2.30, distance: 180 };
    setOrbitalGlobeVisibility(sceneRef.current, orbitalMoonGroupRef.current, true);
    if (terrainMeshRef.current) terrainMeshRef.current.visible = false;
    if (horizonMeshRef.current) horizonMeshRef.current.visible = false;
    if (rockGroupRef.current) rockGroupRef.current.visible = false;
    if (rfBeamGroupRef.current) rfBeamGroupRef.current.visible = false;
    if (apolloLMRef.current) apolloLMRef.current.group.visible = false;
    if (griffinLanderRef.current) griffinLanderRef.current.group.visible = false;
    if (novaCLanderRef.current) novaCLanderRef.current.group.visible = false;
    if (viperRoverRef.current) viperRoverRef.current.group.visible = false;
    setLandingPhase('IDLE');
  };

  const handleReplayLanding = () => {
    triggerCinematicLanding(selectedSite);
  };

  const skipLandingToSurface = () => {
    soundFX.playClick();
    landingSeqRef.current.active = false;
    landingSeqRef.current.phase = 'IDLE';
    setLandingPhase('IDLE');

    setOrbitalGlobeVisibility(sceneRef.current, orbitalMoonGroupRef.current, false);
    if (terrainMeshRef.current) terrainMeshRef.current.visible = true;
    if (horizonMeshRef.current) horizonMeshRef.current.visible = true;
    if (rockGroupRef.current) rockGroupRef.current.visible = true;
    if (rfBeamGroupRef.current) rfBeamGroupRef.current.visible = true;

    const lmGroundY = getSiteElevation(0, 0, selectedSite?.id || 'malapert-massif');
    if (apolloLMRef.current) {
      apolloLMRef.current.group.visible = (activeVehicle === 'apollo-lm');
      apolloLMRef.current.group.position.set(0, lmGroundY, 0);
      apolloLMRef.current.group.rotation.set(0, 0, 0);
      apolloLMRef.current.update(0.1, { altitude: 0, throttle: 0, rampDeployed: true, groundY: lmGroundY });
    }
    if (griffinLanderRef.current) {
      griffinLanderRef.current.group.visible = true;
      const griffinGround = computeGriffinLanderGrounding(selectedSite?.id || 'malapert-massif');
      griffinLanderRef.current.group.position.set(0, griffinGround.posY, 0);
      griffinLanderRef.current.group.rotation.set(-griffinGround.pitch, 0, griffinGround.roll);
    }
    if (novaCLanderRef.current) novaCLanderRef.current.group.visible = (activeVehicle === 'nova-c');

    if (viperRoverRef.current) {
      viperRoverRef.current.group.visible = true;
      freeRoverStateRef.current = { x: 0, z: 8.8, speed: 0, heading: 0, steerAngle: 0 };
      const contact = computeRoverTerrainContact(0, 8.8, 0, selectedSite?.id);
      viperRoverRef.current.group.position.set(0, contact.yBase, 8.8);
      viperRoverRef.current.group.rotation.set(-contact.pitch, 0, contact.roll, 'YXZ');
      viperRoverRef.current.setSuspensionDeltas(contact.suspDeltas);
    }

    if (setCameraMode) setCameraMode('surface');
    cameraModeRef.current = 'surface';
    cameraRotTargetRef.current = { theta: 0.65, phi: 1.30, distance: 7.2 };
    cameraRotSmoothRef.current = { theta: 0.65, phi: 1.30, distance: 7.2 };
    if (onDescendToSurface) onDescendToSurface();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: 'grab'
        }}
      />

      {/* ─── 1. Minimal Pin Hover Tooltip Badge in Orbit Mode ─── */}
      {hoveredSite && hoveredPinScreenPos && cameraMode === 'orbital' && landingPhase === 'IDLE' && (
        <div style={{
          position: 'absolute',
          left: `${hoveredPinScreenPos.x}px`,
          top: `${hoveredPinScreenPos.y - 18}px`,
          transform: 'translate(-50%, -100%)',
          background: 'rgba(6, 8, 14, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '12px',
          padding: '8px 14px',
          pointerEvents: 'none',
          zIndex: 50,
          boxShadow: '0 8px 32px rgba(0,0,0,0.85), 0 0 16px rgba(56,189,248,0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          fontFamily: "'Google Sans', sans-serif"
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
            {hoveredSite.name}
          </div>
          <div style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            {Math.abs(hoveredSite.lat).toFixed(2)}° S • Elev: +{hoveredSite.elevationM}m
          </div>
          <div style={{ fontSize: '9px', color: '#34d399', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>✦ CLICK PIN TO LAND (STREET VIEW)</span>
          </div>
        </div>
      )}

      {/* ─── Boundary Range Alert Toast in Google Sans ─── */}
      {isBoundaryWarning && cameraMode !== 'orbital' && (
        <div style={{
          position: 'absolute',
          top: '76px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 95,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 18px',
          borderRadius: '9999px',
          background: 'rgba(10, 14, 22, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.75), 0 0 16px rgba(239, 68, 68, 0.3)',
          fontFamily: "'Google Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.03em',
          color: '#fca5a5',
          pointerEvents: 'none',
          animation: 'veloraFadeDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 10px #ef4444'
          }} />
          <span>Rover getting Outside range</span>
        </div>
      )}

      {/* ─── 3. Real-Time Physical Comms & Solar Obstacle Status Widget (Surface Mode) ─── */}
      {cameraMode !== 'orbital' && (landingPhase === 'IDLE' || landingPhase === 'DONE') && (
        <div style={{
          position: 'absolute',
          top: '72px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(6, 8, 14, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '8px 16px',
          zIndex: 35,
          fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
          fontSize: '0.70rem',
          opacity: isUiRevealed ? 1 : 0,
          transform: isUiRevealed ? 'translateY(0)' : 'translateY(-14px)',
          transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
          pointerEvents: isUiRevealed ? 'auto' : 'none'
        }}>
          {/* Radio Link Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: commsTelemetry.dteBlocked ? '#f59e0b' : '#34d399',
              boxShadow: commsTelemetry.dteBlocked ? '0 0 6px #f59e0b' : '0 0 6px #34d399'
            }} />
            <span style={{ color: commsTelemetry.dteBlocked ? '#f59e0b' : '#ffffff', fontWeight: 600 }}>
              {commsTelemetry.dteBlocked ? 'RELAY ORBITER ACTIVE (LOS BLOCKED)' : 'DTE S-BAND LOCKED (100 Mbps)'}
            </span>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>

          {/* Polar Solar Flux Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: commsTelemetry.sunOccluded ? '#38bdf8' : '#eab308',
              boxShadow: commsTelemetry.sunOccluded ? '0 0 6px #38bdf8' : '0 0 6px #eab308'
            }} />
            <span style={{ color: commsTelemetry.sunOccluded ? '#93c5fd' : '#ffffff' }}>
              {commsTelemetry.sunOccluded ? 'PSR SHADOW (BATTERY DRAW)' : 'DIRECT SUNLIGHT (+480W)'}
            </span>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>

          {/* Forward LiDAR Obstacle Clearance */}
          <div style={{ color: commsTelemetry.nearestObstacleM < 5 ? '#f87171' : 'var(--text-secondary)' }}>
            LIDAR CLEARANCE: {commsTelemetry.nearestObstacleM}m
          </div>
        </div>
      )}



      {/* ─── 3d. Rover Geomorphology & Hazard Telemetry Bar ─── */}
      {activeVehicle === 'viper' && cameraMode !== 'orbital' && (landingPhase === 'IDLE' || landingPhase === 'DONE') && (
        <div style={{
          position: 'absolute',
          bottom: '124px',
          left: '50%',
          transform: isUiRevealed ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(16px)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(6, 8, 14, 0.92)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${roverHazard.hazardLevel === 'CRITICAL_SLOPE_HAZARD'
            ? 'rgba(239, 68, 68, 0.7)'
            : roverHazard.hazardLevel === 'CAUTION_GRADE'
              ? 'rgba(245, 158, 11, 0.5)'
              : 'rgba(255, 255, 255, 0.14)'
            }`,
          borderRadius: '16px',
          padding: '6px 20px',
          zIndex: 30,
          fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          opacity: isUiRevealed ? 1 : 0,
          transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.25s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
          pointerEvents: isUiRevealed ? 'auto' : 'none'
        }}>
          {/* Slope Grade */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>GRADE:</span>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: roverHazard.hazardLevel === 'CRITICAL_SLOPE_HAZARD'
                ? '#ef4444'
                : roverHazard.hazardLevel === 'CAUTION_GRADE'
                  ? '#f59e0b'
                  : '#34d399'
            }}>
              {roverHazard.slopeDegrees}°
            </span>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>

          {/* Elevation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>ALT:</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>
              {roverHazard.elevationMeters} m
            </span>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>

          {/* Geomorphology Region / Cold-Trap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 600,
              color: roverHazard.isColdTrapCandidate ? '#00f0ff' : '#cbd5e1'
            }}>
              {roverHazard.isColdTrapCandidate ? '❄️ PSR CRATER COLD-TRAP' : 'HIGHLAND REGOLITH'}
            </span>
          </div>
        </div>
      )}

      {/* ─── 3e. Mineralogy Core Sample Assay Recovery Card ─── */}
      {discoveredSample && cameraMode !== 'orbital' && (
        <div style={{
          position: 'absolute',
          top: '72px',
          left: '20px',
          width: '310px',
          background: 'rgba(6, 10, 18, 0.94)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0, 240, 255, 0.4)',
          borderRadius: '14px',
          padding: '14px 16px',
          zIndex: 45,
          fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 240, 255, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🔬</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#00f0ff', letterSpacing: '0.04em' }}>
                TRIDENT CORE SAMPLE ASSAY
              </span>
            </div>
            <button
              onClick={() => setDiscoveredSample(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginBottom: '8px' }}>
            {discoveredSample.location} • DEPTH: {discoveredSample.drillDepthCm} cm
          </div>

          {/* Mineralogy Yield Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '8px 10px',
            borderRadius: '8px',
            marginBottom: '8px'
          }}>
            <div>
              <div style={{ fontSize: '0.52rem', color: '#64748b' }}>WATER ICE (H₂O)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                {discoveredSample.h2oYieldWEH} wt%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.52rem', color: '#64748b' }}>ANORTHOSITE</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                {discoveredSample.anorthositePct} wt%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.52rem', color: '#64748b' }}>ILMENITE (FeTiO₃)</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f59e0b' }}>
                {discoveredSample.ilmenitePct} wt%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.52rem', color: '#64748b' }}>VOLATILE YIELD</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#34d399' }}>
                CRYOGENIC
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.52rem', color: '#64748b', textAlign: 'right' }}>
            NASA MSolo & NIRVSS SPECTRUM VERIFIED • {discoveredSample.timestamp}
          </div>
        </div>
      )}

      {/* ─── 4. Cinematic Griffin Lander Flight Guidance HUD Overlay (Only during descent replay, completely hidden during rover egress) ─── */}
      {landingPhase !== 'IDLE' && landingPhase !== 'DONE' && landingPhase !== 'ROVER_DEPLOY' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: landingPhase === 'ROVER_DEPLOY' ? 'flex-end' : 'space-between',
          padding: '24px 32px',
          background: 'transparent',
          fontFamily: "'Google Sans', sans-serif"
        }}>
          {/* Top Flight Header (Only for SWOOP / DESCENT / TOUCHDOWN) */}
          {landingPhase !== 'ROVER_DEPLOY' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pointerEvents: 'auto'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(8, 10, 16, 0.92)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                borderRadius: '30px',
                padding: '8px 20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: landingPhase === 'TOUCHDOWN' ? '#34d399' : '#38bdf8',
                  boxShadow: landingPhase === 'TOUCHDOWN' ? '0 0 10px #34d399' : '0 0 10px #38bdf8'
                }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', letterSpacing: '0.04em' }}>
                  {landingPhase === 'SWOOP' && 'ORBITAL DIVE: TARGETING CORRIDOR'}
                  {landingPhase === 'DESCENT' && 'POWERED RETRO-DESCENT • ASTROBOTIC GRIFFIN LANDER (MAX THRUST)'}
                  {landingPhase === 'TOUCHDOWN' && 'TOUCHDOWN CONFIRMED • GRIFFIN RETRO-PROPULSION ENGINE STOP'}
                </span>
              </div>

              {/* Skip Button */}
              <button
                onClick={skipLandingToSurface}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  borderRadius: '20px',
                  padding: '7px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(16px)',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Google Sans', sans-serif"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
              >
                SKIP TO SURFACE ➔
              </button>
            </div>
          )}

          {/* Center Targeting Reticle (Only for SWOOP / DESCENT) */}
          {landingPhase !== 'ROVER_DEPLOY' && landingPhase !== 'TOUCHDOWN' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '160px',
              height: '160px',
              border: '1px solid rgba(56, 189, 248, 0.22)',
              borderRadius: '50%',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
            </div>
          )}

          {/* Bottom Live Flight Telemetry Bento Strip (Pixel-perfect to Image 1) */}
          <div style={{
            alignSelf: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            background: 'rgba(6, 8, 14, 0.94)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '18px',
            padding: '12px 28px',
            fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.7)'
          }}>
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8' }}>ALTITUDE</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>{landingTelemetry.altitude} m</div>
            </div>
            <div style={{ width: '1px', height: '26px', background: 'rgba(255, 255, 255, 0.12)' }} />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8' }}>VERTICAL VELOCITY</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>{landingTelemetry.velocity} m/s</div>
            </div>
            <div style={{ width: '1px', height: '26px', background: 'rgba(255, 255, 255, 0.12)' }} />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8' }}>DPS RETRO-THROTTLE</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: landingTelemetry.throttle > 50 ? '#f59e0b' : '#34d399' }}>{landingTelemetry.throttle}%</div>
            </div>
            <div style={{ width: '1px', height: '26px', background: 'rgba(255, 255, 255, 0.12)' }} />
            <div>
              <div style={{ fontSize: '9px', color: '#94a3b8' }}>PROPELLANT REMAINING</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>{landingTelemetry.fuel}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Minimalist Rover Driving Hint */}
      {activeVehicle === 'viper' && cameraMode !== 'orbital' && (landingPhase === 'IDLE' || landingPhase === 'DONE') && (
        <div style={{
          position: 'absolute',
          bottom: '84px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(6, 8, 13, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
          fontSize: '0.62rem',
          color: 'var(--text-secondary)',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>[W A S D / ARROWS]</span>
          <span>Drive VIPER Rover</span>
          <span style={{ color: 'var(--border-hairline)' }}>•</span>
          <span style={{ color: 'var(--text-muted)' }}>[SPACE] Brake</span>
          <span style={{ color: 'var(--border-hairline)' }}>•</span>
          <span style={{ color: 'var(--text-muted)' }}>[R] Reset Pad</span>
          <span style={{ color: 'var(--border-hairline)' }}>•</span>
          <span style={{ color: '#38bdf8' }}>[H] LiDAR Heatmap</span>
        </div>
      )}

      {/* ─── Real NASA Subsurface Core Drill Geochemical Assay Modal ─── */}
      <LunarCoreDrillModal
        isOpen={isDrillReportOpen && (roverDrillState === 'drilling' || roverDrillState === 'sampling')}
        onClose={() => setIsDrillReportOpen(false)}
        drillState={roverDrillState}
        siteId={selectedSite?.id || 'nobile-rim-1'}
        roverName={activeVehicle === 'griffin-rover' || activeVehicle === 'griffin' ? 'GRIFFIN ROVER 2' : 'NASA VIPER'}
      />

    </div>
  );
}
