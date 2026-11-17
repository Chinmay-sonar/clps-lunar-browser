// ============================================================================
// src/utils/lunarLightingRig.js
// NASA South Pole Illumination Rig (Mission Light + Vacuum Dark + LiDAR Heatmap)
// Calibrated for Three.js r160+ ShadowMap and ACESFilmic Tone Mapping
// ============================================================================
import * as THREE from 'three';

/**
 * Configures authentic lunar South Pole illumination with 3 toggleable modes:
 * 1. 'light' (DEFAULT): Bright, clear, daylight mission visibility with ambient/hemisphere fill
 *    so terrain, mountains, lander, and rover are crystal clear at any sun angle.
 * 2. 'vacuum_dark': Pure harsh vacuum contrast (0.0 ambient) with 1.8° grazing sun + Earthshine.
 * 3. 'heatmap': Analytical LiDAR slope / cold-trap visualization mode.
 */
export function setupLunarSouthPoleLighting(scene, renderer, options = {}) {
  const {
    sunAzimuthDeg = 35.0,       // Solar horizon azimuth (0 - 360 deg for synodic time)
    sunElevationDeg = 1.8,      // Authentic lunar South Pole grazing angle (1.5° - 2.0°)
    earthAzimuthDeg = 215.0,    // Sub-Earth azimuth
    earthElevationDeg = 11.5,   // Earth libration elevation above South Pole horizon
    shadowFrustumSize = 110.0,  // Tight meter-scale bounds around landing site & rover
    initialMode = 'light'       // Default to bright visible Mission Light mode
  } = options;

  // 1. Configure WebGLRenderer for calibrated dynamic range
  if (renderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.00;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  // 2. Clean previous rig instances
  const lightsToRemove = [];
  scene.traverse((obj) => {
    if (obj.userData?.isLunarRigLight) {
      lightsToRemove.push(obj);
    }
  });
  lightsToRemove.forEach((l) => l.parent?.remove(l));

  const rigGroup = new THREE.Group();
  rigGroup.name = 'LunarSouthPoleLightingRig';
  rigGroup.userData.isLunarRigLight = true;

  // 3. Primary Grazing Solar DirectionalLight (Authentic solar spectrum in vacuum)
  const sunLight = new THREE.DirectionalLight(0xfffaed, 3.8);
  sunLight.name = 'LunarGrazingSunLight';
  sunLight.castShadow = true;

  // High-resolution 4096x4096 shadow map with grazing-angle bias stabilization
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.camera.near = 10.0;
  sunLight.shadow.camera.far = 420.0;
  sunLight.shadow.camera.left = -shadowFrustumSize;
  sunLight.shadow.camera.right = shadowFrustumSize;
  sunLight.shadow.camera.top = shadowFrustumSize;
  sunLight.shadow.camera.bottom = -shadowFrustumSize;
  sunLight.shadow.bias = -0.00018;
  sunLight.shadow.normalBias = 0.045;
  sunLight.shadow.radius = 1.15;
  rigGroup.add(sunLight);
  rigGroup.add(sunLight.target);

  // 4. Secondary Sub-Earth DirectionalLight (Earthshine in Permanent Shadow Regions)
  const earthshineLight = new THREE.DirectionalLight(0x7a9ec9, 0.08);
  earthshineLight.name = 'SubEarthEarthshineLight';
  earthshineLight.castShadow = false;
  rigGroup.add(earthshineLight);
  rigGroup.add(earthshineLight.target);

  // 5. Natural Light Soft Ambient Light (Exact pre-Argon natural lunar ambient)
  const ambientLight = new THREE.AmbientLight(0x0e1422, 0.45);
  ambientLight.name = 'MissionLightAmbient';
  rigGroup.add(ambientLight);

  // 6. Natural Light Celestial Hemisphere Light (Subtle cosmic gradient)
  const hemiLight = new THREE.HemisphereLight(0x1a2436, 0x080c14, 0.08);
  hemiLight.name = 'MissionLightHemisphere';
  hemiLight.position.set(0, 100, 0);
  rigGroup.add(hemiLight);

  // 7. Regolith Diffuse Secondary Bounce DirectionalLight
  const regolithBounceLight = new THREE.DirectionalLight(0x1e2838, 0.06);
  regolithBounceLight.name = 'RegolithBounceFill';
  regolithBounceLight.position.set(60, 45, -70);
  regolithBounceLight.castShadow = false;
  rigGroup.add(regolithBounceLight);

  // 8. Spacecraft Aerospace Specular Rim Light (Highlights MLI gold foil and rover chassis)
  const craftRimLight = new THREE.DirectionalLight(0x6b829e, 0.15);
  craftRimLight.name = 'SpacecraftRimLight';
  craftRimLight.position.set(-80, 50, 70);
  craftRimLight.castShadow = false;
  rigGroup.add(craftRimLight);

  scene.add(rigGroup);

  let currentMode = initialMode;

  /**
   * Switches dynamically between:
   * - 'light': Default natural, balanced lunar daylight illumination (pre-Argon natural look)
   * - 'vacuum_dark': Pure harsh vacuum contrast with zero atmospheric ambient
   * - 'heatmap': Analytical false-color LiDAR slope & PSR view
   */
  const setLightingMode = (mode) => {
    currentMode = mode;
    if (mode === 'light') {
      ambientLight.color.setHex(0x0e1422);
      ambientLight.intensity = 0.45;
      hemiLight.intensity = 0.08;
      regolithBounceLight.intensity = 0.06;
      craftRimLight.intensity = 0.15;
      sunLight.color.setHex(0xfffaed);
      sunLight.intensity = 4.0;
      earthshineLight.intensity = 0.08;
      if (renderer) renderer.toneMappingExposure = 1.00;
    } else if (mode === 'vacuum_dark') {
      ambientLight.color.setHex(0x04060a);
      ambientLight.intensity = 0.02;
      hemiLight.intensity = 0.0;
      regolithBounceLight.intensity = 0.0;
      craftRimLight.intensity = 0.08;
      sunLight.color.setHex(0xfffaed);
      sunLight.intensity = 4.0;
      earthshineLight.intensity = 0.06;
      if (renderer) renderer.toneMappingExposure = 1.00;
    } else if (mode === 'heatmap') {
      ambientLight.color.setHex(0x1e2838);
      ambientLight.intensity = 0.55;
      hemiLight.intensity = 0.20;
      regolithBounceLight.intensity = 0.10;
      craftRimLight.intensity = 0.20;
      sunLight.color.setHex(0xfffaed);
      sunLight.intensity = 2.8;
      earthshineLight.intensity = 0.08;
      if (renderer) renderer.toneMappingExposure = 1.00;
    }
  };

  // Helper to compute unit vector from azimuth/elevation angles
  const computeDirectionVector = (azDeg, elDeg) => {
    const az = THREE.MathUtils.degToRad(azDeg);
    const el = THREE.MathUtils.degToRad(elDeg);
    return new THREE.Vector3(
      Math.cos(el) * Math.cos(az),
      Math.sin(el),
      Math.cos(el) * Math.sin(az)
    ).normalize();
  };

  const updateLighting = ({
    newSunAzimuthDeg = sunAzimuthDeg,
    newSunElevationDeg = sunElevationDeg,
    focusTarget = new THREE.Vector3(0, 0, 0)
  } = {}) => {
    const sunDir = computeDirectionVector(newSunAzimuthDeg, newSunElevationDeg);
    const earthDir = computeDirectionVector(earthAzimuthDeg, earthElevationDeg);

    sunLight.target.position.copy(focusTarget);
    sunLight.position.copy(focusTarget).addScaledVector(sunDir, 200.0);
    sunLight.target.updateMatrixWorld();

    earthshineLight.target.position.copy(focusTarget);
    earthshineLight.position.copy(focusTarget).addScaledVector(earthDir, 150.0);
    earthshineLight.target.updateMatrixWorld();

    return { sunDir, earthDir };
  };

  // Apply initial lighting mode
  setLightingMode(initialMode);
  const initialVectors = updateLighting();

  return {
    rigGroup,
    sunLight,
    earthshineLight,
    ambientLight,
    hemiLight,
    regolithBounceLight,
    craftRimLight,
    sunDirection: initialVectors.sunDir,
    earthDirection: initialVectors.earthDir,
    updateLighting,
    setLightingMode,
    getLightingMode: () => currentMode
  };
}
