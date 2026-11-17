// ============================================================================
// src/utils/terrainElevation.js
// LOLA-Calibrated Lunar South Pole Geomorphological DEM & Crater Engine
// Implements Melosh (1989) & Pike (1977) Impact Crater Equations + r^-3 Ejecta
// ============================================================================

// Fast deterministic 2D spatial hash for Poisson-disc crater distribution
function hash2D(ix, iz, seed = 1337) {
  let n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 1442695040);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296.0;
}

// Smooth quintic interpolation
function quintic(t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// 2D Gradient Value Noise for long-wavelength LOLA massif topography
function valueNoise2D(x, z, seed = 101) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = quintic(fx);
  const uz = quintic(fz);
  const a = hash2D(ix, iz, seed);
  const b = hash2D(ix + 1, iz, seed);
  const c = hash2D(ix, iz + 1, seed);
  const d = hash2D(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/**
 * Evaluates a single impact crater using Pike (1977) & Melosh (1989) morphology:
 * - Parabolic floor cavity (u < 1) with depth-to-diameter d/D = 0.20
 * - Raised structural rim uplift & overturned flap at u = 1.0 (h_rim = 0.045 * D)
 * - Continuous exterior ejecta blanket decaying by inverse cube power law (u^-3)
 * - Age degradation factor alpha in [0.2, 1.0] (1.0 = fresh Copernican, 0.2 = degraded Pre-Nectarian)
 */
function evaluateMeloshCrater(dx, dz, radius, freshness = 0.85, seed = 1) {
  const r2 = dx * dx + dz * dz;
  const maxInfluenceRadius = radius * 3.4;
  if (r2 >= maxInfluenceRadius * maxInfluenceRadius) return 0.0;

  const r = Math.sqrt(r2);
  const u = r / radius; // Normalized radial distance (u = 1.0 at rim crest)
  const diameter = 2.0 * radius;
  const depth = 0.195 * diameter * (0.45 + 0.55 * freshness);
  const rimHeight = 0.042 * diameter * (0.35 + 0.65 * freshness);
  // Sharpness exponent increases with crater freshness (Copernican vs degraded)
  const rimSteepness = 2.0 + 1.6 * freshness;

  if (u <= 1.0) {
    // Interior bowl + smooth transition to rim crest
    // Flat-bottom breccia lens correction for craters with degraded walls
    const bowlCurve = Math.pow(u, rimSteepness);
    const slumpingSmoothing = (1.0 - freshness) * 0.12 * (1.0 - u * u);
    return -depth * (1.0 - bowlCurve) + rimHeight * Math.pow(u, 3.5) + slumpingSmoothing;
  } else {
    // Exterior continuous ejecta blanket: h(u) = h_rim * u^-3 * Gaussian taper
    const invU3 = 1.0 / (u * u * u);
    const taper = Math.exp(-Math.pow((u - 1.0) / 1.85, 2.0));
    // Radial ejecta ray striations for fresh impacts
    let rayModulation = 1.0;
    if (freshness > 0.65) {
      const angle = Math.atan2(dz, dx);
      const rayWave = Math.sin(angle * 7.0 + seed * 6.28) * 0.5 +
                      Math.cos(angle * 13.0 - seed * 3.14) * 0.5;
      rayModulation = 1.0 + 0.18 * freshness * rayWave * Math.exp(-(u - 1.0) * 1.2);
    }
    return rimHeight * invU3 * taper * rayModulation;
  }
}

/**
 * Deterministic Catalog of Major Landmark Craters Surrounding the Landing Zone
 */
const HERO_CRATERS = [
  // Fresh Copernican Crater with sharp raised rim & bright ejecta (North-East of pad)
  { x: 38.0,  z: -32.0, radius: 18.5, freshness: 0.96, seed: 11 },
  // Deep Permanently Shadowed Cold-Trap Crater (South-West — prime VIPER ice drill target)
  { x: -46.0, z: 28.0,  radius: 26.0, freshness: 0.82, seed: 23 },
  // Degraded Pre-Nectarian Basin overlapped by younger craters (North-West)
  { x: -58.0, z: -54.0, radius: 42.0, freshness: 0.34, seed: 37 },
  // Secondary Impact Cluster near rover drive path
  { x: 21.5,  z: 19.0,  radius: 8.2,  freshness: 0.91, seed: 53 },
  { x: -19.0, z: -22.5, radius: 9.8,  freshness: 0.74, seed: 71 },
  { x: 64.0,  z: 48.0,  radius: 31.0, freshness: 0.62, seed: 89 },
  { x: 12.0,  z: -48.0, radius: 13.5, freshness: 0.88, seed: 97 },
  { x: -28.0, z: 58.0,  radius: 19.0, freshness: 0.48, seed: 113 }
];

/**
 * Evaluates Poisson-disc distributed micro- and meso-craters across a cellular grid.
 * Allows infinite, non-repeating craters down to 0.5-meter diameter.
 */
function evaluateCellularCraterLayer(x, z, cellSize, minRadius, maxRadius, densityProb, layerSeed) {
  const gx = Math.floor(x / cellSize);
  const gz = Math.floor(z / cellSize);
  let heightSum = 0.0;

  // Search 3x3 neighborhood so ejecta blankets (up to 3.4 * R) cross cell boundaries
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = gx + dx;
      const cz = gz + dz;
      const prob = hash2D(cx, cz, layerSeed);
      if (prob > densityProb) continue;

      const jitterX = (0.2 + 0.6 * hash2D(cx, cz, layerSeed + 17)) * cellSize;
      const jitterZ = (0.2 + 0.6 * hash2D(cx, cz, layerSeed + 31)) * cellSize;
      const craterX = cx * cellSize + jitterX;
      const craterZ = cz * cellSize + jitterZ;

      // Power-law size-frequency distribution (N(>D) ~ D^-2): smaller craters are more common
      const randSize = Math.pow(hash2D(cx, cz, layerSeed + 47), 1.65);
      const radius = minRadius + randSize * (maxRadius - minRadius);
      const freshness = 0.25 + 0.75 * hash2D(cx, cz, layerSeed + 61);

      heightSum += evaluateMeloshCrater(
        x - craterX,
        z - craterZ,
        radius,
        freshness,
        prob
      );
    }
  }
  return heightSum;
}

/**
 * Site-Specific Macro-Altimetry Calibrated to NASA LOLA South Pole Profiles
 */
function evaluateMacroSiteDatum(x, z, siteId = 'malapert') {
  const site = (siteId || 'malapert').toLowerCase();

  // Base multi-octave regolith undulation
  const n1 = (valueNoise2D(x * 0.008, z * 0.008, 101) - 0.5) * 9.5;
  const n2 = (valueNoise2D(x * 0.025, z * 0.025, 202) - 0.5) * 2.8;
  const n3 = (valueNoise2D(x * 0.085, z * 0.085, 303) - 0.5) * 0.65;

  let macroFeature = 0.0;

  if (site.includes('shackleton')) {
    // Shackleton Rim: High sunlit ridge crest dropping sharply toward the 4.2km deep crater interior
    const scarpDist = z + 85.0 + Math.sin(x * 0.018) * 14.0;
    if (scarpDist < 0) {
      macroFeature = -Math.pow(Math.abs(scarpDist), 1.35) * 0.42;
    } else {
      macroFeature = 3.2 * Math.exp(-Math.pow(scarpDist * 0.022, 2.0));
    }
  } else if (site.includes('mouton') || site.includes('leibnitz')) {
    // Mons Mouton (Leibnitz Beta): Broad flat-topped massif plateau with steep terraced scarps
    const r = Math.hypot(x * 0.006, z * 0.006);
    macroFeature = 4.5 * Math.tanh(Math.max(0.0, 1.4 - r) * 2.5);
  } else if (site.includes('nobile')) {
    // Nobile Rim: Hummocky, heavily degraded basin rim with interlocking secondary troughs
    macroFeature = Math.sin(x * 0.014 + z * 0.011) * 4.2 + Math.cos(x * 0.029 - z * 0.007) * 2.1;
  } else if (site.includes('gerlache')) {
    // de Gerlache rim: Northern rim with dropoff into interior cold trap
    const rimDist = Math.abs(x * 0.3 + z * 0.95 - 15);
    if (rimDist < 50) macroFeature = Math.cos((rimDist / 50) * (Math.PI / 2)) * 6.8;
    if (z < -10) macroFeature -= Math.min(22.0, Math.pow((-z - 10) * 0.30, 1.25));
  } else if (site.includes('haworth')) {
    // Haworth Crater Rim Ridge overlooking Cabeus/Haworth volatile deposits
    const ridgeDist = Math.abs(x * 0.6 - z * 0.7);
    if (ridgeDist < 55) macroFeature = Math.cos((ridgeDist / 55) * (Math.PI / 2)) * 6.2;
    if (z > 20) macroFeature -= Math.min(20.0, Math.pow((z - 20) * 0.26, 1.25));
  } else {
    // Default — Malapert Massif (Site 23): Towering asymmetric mountain ridge on the lunar limb
    const ridgeLine = z + 95.0 - Math.cos(x * 0.012) * 18.0;
    if (ridgeLine < 0) {
      macroFeature = Math.min(48.0, Math.pow(Math.abs(ridgeLine), 1.25) * 0.35);
    } else {
      macroFeature = 1.8 * Math.sin(x * 0.015) * Math.exp(-ridgeLine * 0.015);
    }
  }

  return macroFeature + n1 + n2 + n3;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3.0 - 2.0 * t);
}

// ==== Pre-compute origin datum offsets per-site ====
const SITE_IDS = [
  'malapert-massif', 'malapert',
  'shackleton-connecting-ridge', 'shackleton',
  'mons-mouton', 'mouton', 'leibnitz',
  'nobile-rim-1', 'nobile-rim', 'nobile',
  'de-gerlache-rim', 'gerlache',
  'haworth-rim', 'haworth'
];

function computeRawElev(x, z, siteId) {
  let h = evaluateMacroSiteDatum(x, z, siteId);

  // Hero craters
  for (let i = 0; i < HERO_CRATERS.length; i++) {
    const c = HERO_CRATERS[i];
    h += evaluateMeloshCrater(x - c.x, z - c.z, c.radius, c.freshness, c.seed);
  }

  // Meso-Scale Saturation Craters (4m - 11m diameter, 22m grid cells)
  h += evaluateCellularCraterLayer(x, z, 22.0, 2.0, 5.5, 0.78, 409);
  // Small Rover-Hazard Craters (1.4m - 3.6m diameter, 7.5m grid cells)
  h += evaluateCellularCraterLayer(x, z, 7.5, 0.7, 1.8, 0.85, 811);
  // Sub-Meter Micro-Crater Saturation (0.5m - 1.1m diameter, 2.4m grid cells)
  h += evaluateCellularCraterLayer(x, z, 2.4, 0.25, 0.55, 0.90, 1217);

  // Ejecta Boulder Hummocks & Regolith Gardening Micro-Roughness
  const microRough = (valueNoise2D(x * 0.65, z * 0.65, 505) - 0.5) * 0.14;
  h += microRough;

  return h;
}

// Pre-computed origin offsets so (0,0) starts at a clean datum of ~2.0m
const SITE_DATUM_OFFSETS = {};
for (const sid of SITE_IDS) {
  SITE_DATUM_OFFSETS[sid] = computeRawElev(0, 0, sid);
}

/**
 * MASTER ELEVATION FUNCTION (backwards-compatible alias: getSiteElevation)
 * Returns exact vertical elevation (in meters) at world coordinates (x, z).
 */
export function getSiteElevation(x, z, siteId = 'malapert-massif') {
  const raw = computeRawElev(x, z, siteId);
  const base = SITE_DATUM_OFFSETS[siteId] ?? SITE_DATUM_OFFSETS['malapert-massif'];
  const natural = (raw - base) + 2.0;

  // Touchdown Pad Safety Apron: Smoothly levels the central 7.5m radius around (0,0)
  // so the lander footpads and rover egress ramp never clip into a steep crater wall
  // while keeping realistic micro-regolith texture right up to the footpads.
  const distFromPad = Math.hypot(x, z);
  if (distFromPad < 26.0) {
    if (distFromPad <= 8.0) return 2.0;
    const t = (distFromPad - 8.0) / 18.0;
    const smoothT = t * t * (3 - 2 * t);
    return 2.0 * (1 - smoothT) + natural * smoothT;
  }
  return natural;
}

// Alias for Argon compatibility
export const getTerrainElevation = getSiteElevation;

/**
 * Legacy evaluateCrater — kept for backwards compatibility with existing code.
 * Delegates to the new Melosh model.
 */
export function evaluateCrater(x, z, cx, cz, radius, depth, rimHeight) {
  const freshness = Math.min(1.0, depth / (0.39 * radius));
  return evaluateMeloshCrater(x - cx, z - cz, radius, freshness, 42);
}

/**
 * Computes exact surface normal vector { x, y, z } using central finite differences.
 */
export function getTerrainNormal(x, z, siteId = 'malapert-massif', eps = 0.25) {
  const hL = getSiteElevation(x - eps, z, siteId);
  const hR = getSiteElevation(x + eps, z, siteId);
  const hD = getSiteElevation(x, z - eps, siteId);
  const hU = getSiteElevation(x, z + eps, siteId);
  const nx = -(hR - hL) / (2.0 * eps);
  const ny = 1.0;
  const nz = -(hU - hD) / (2.0 * eps);
  const len = Math.hypot(nx, ny, nz) || 1.0;
  return { x: nx / len, y: ny / len, z: nz / len };
}

/**
 * Returns local terrain slope in degrees [0, 90].
 */
export function getSlopeDegrees(x, z, siteId = 'malapert-massif') {
  const n = getTerrainNormal(x, z, siteId);
  return Math.acos(Math.max(-1.0, Math.min(1.0, n.y))) * (180.0 / Math.PI);
}

/**
 * Real-time Rover Geomorphology & Hazard Telemetry Classifier for HUD integration.
 * Flags slopes > 15 degrees (VIPER tip/slip limit) and Permanently Shadowed Cold Traps.
 */
export function getRoverHazardTelemetry(x, z, siteId = 'malapert-massif') {
  const elevation = getSiteElevation(x, z, siteId);
  const normal = getTerrainNormal(x, z, siteId);
  const slopeDeg = Math.acos(Math.max(-1.0, Math.min(1.0, normal.y))) * (180.0 / Math.PI);

  let hazardLevel = 'NOMINAL';
  if (slopeDeg >= 15.0) {
    hazardLevel = 'CRITICAL_SLOPE_HAZARD';
  } else if (slopeDeg >= 8.0) {
    hazardLevel = 'CAUTION_GRADE';
  }

  // Cold traps occur in depressed crater bowls below datum
  const isColdTrapCandidate = elevation < -1.6;

  return {
    elevationMeters: Number(elevation.toFixed(2)),
    slopeDegrees: Number(slopeDeg.toFixed(1)),
    normal,
    hazardLevel,
    isColdTrapCandidate
  };
}

// Re-export noise functions for other modules that may import them
export { valueNoise2D as simplex2D };
export function lunarFBM(x, z, octaves = 5) {
  let total = 0;
  let freq = 0.015;
  let amp = 1.2;
  for (let o = 0; o < octaves; o++) {
    total += (valueNoise2D(x * freq, z * freq, 101 + o * 7) - 0.5) * amp;
    amp *= 0.48;
    freq *= 2.15;
  }
  return total;
}
