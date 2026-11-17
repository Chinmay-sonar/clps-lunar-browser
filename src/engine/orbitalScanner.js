/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELIOS-DTE Phase 2: AI/ML Orbital Surface Scanner & Hazard Detection Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Simulates high-resolution orbital reconnaissance conducted by a lunar
 * Propulsion Module / Orbiter during polar orbital revolutions before landing.
 * 
 * Scientific Instruments Modeled:
 *   1. LOLA (Lunar Orbiter Laser Altimeter) — 5-beam LiDAR altimetry, slope,
 *      surface roughness, and crater depth-to-diameter (d/D) profiles.
 *   2. LEND / Lunar Prospector — Epithermal neutron suppression flux measuring
 *      Water-Equivalent Hydrogen (WEH wt%).
 *   3. Diviner Lunar Radiometer — 7-channel IR radiometry for surface & subsurface
 *      thermal regimes (35K cryogenic PSRs to 240K sunlit massifs) and rock fraction.
 *   4. Phase 1 DE441 Ephemeris Link — Dynamic solar illumination persistence
 *      and Direct-to-Earth (DTE) communication visibility windows.
 * 
 * Multi-Criteria Decision Analysis (MCDA) Algorithm:
 *   Evaluates spatial grid cells and extracts optimal safe landing corridors
 *   (landing ellipses) while avoiding steep crater walls and boulder-strewn hazards.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { computeMissionParameters } from './ephemerisDE441.js';
import { sampleLolaElevation, sampleSlopeAngle, sampleDivinerTemperature, sampleWaterIceAbundance, LUNAR_SOUTH_POLE_FEATURES } from '../data/lunarGisData.js';

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICAL & ORBITAL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Moon's gravitational parameter GM (km³/s²) */
export const MOON_GM = 4902.800066;

/** Moon's mean radius (km) */
export const MOON_MEAN_RADIUS_KM = 1737.4;

/** Moon's sidereal rotation period in seconds (27.321661 days) */
export const MOON_ROTATION_PERIOD_SEC = 27.321661 * 86400;

/** Moon's angular rotation rate (rad/sec) */
export const MOON_ROTATION_RATE_RAD_S = (2 * Math.PI) / MOON_ROTATION_PERIOD_SEC;

/** Standard low lunar polar reconnaissance orbit altitude (km) */
export const NOMINAL_ORBIT_ALTITUDE_KM = 100.0;

/** Orbital semi-major axis (km) */
export const NOMINAL_ORBIT_SMA_KM = MOON_MEAN_RADIUS_KM + NOMINAL_ORBIT_ALTITUDE_KM;

/** Orbital velocity in 100km circular orbit (km/s): sqrt(GM / a) */
export const NOMINAL_ORBITAL_VELOCITY_KM_S = Math.sqrt(MOON_GM / NOMINAL_ORBIT_SMA_KM); // ~1.633 km/s

/** Orbital period in seconds: 2*pi*sqrt(a^3 / GM) */
export const NOMINAL_ORBITAL_PERIOD_SEC = 2 * Math.PI * Math.sqrt(Math.pow(NOMINAL_ORBIT_SMA_KM, 3) / MOON_GM); // ~7068 sec (~117.8 min)

/** Orbital period in hours */
export const NOMINAL_ORBITAL_PERIOD_HOURS = NOMINAL_ORBITAL_PERIOD_SEC / 3600; // ~1.963 hours

/** Ground track swath width for synthetic sensor suite (km) */
export const SENSOR_SWATH_WIDTH_KM = 8.0;

// ─────────────────────────────────────────────────────────────────────────────
// THRESHOLDS FOR SAFE LANDING CORRIDORS (NASA Artemis & CLPS Guidelines)
// ─────────────────────────────────────────────────────────────────────────────

export const SAFETY_THRESHOLDS = {
  /** Maximum safe landing gear tip-over slope limit (degrees) */
  SLOPE_MAX_SAFE_DEG: 8.0,
  /** Critical failure slope threshold where lander inevitably tips over */
  SLOPE_CRITICAL_TILT_DEG: 15.0,
  /** Minimum illumination fraction required during surface operational lifetime */
  MIN_ILLUMINATION_FRACTION: 0.65,
  /** Minimum continuous DTE comms visibility required */
  MIN_DTE_VISIBILITY_FRACTION: 0.70,
  /** Maximum allowable distance to target PSR volatile boundary for rover ingress (km) */
  MAX_ROVER_PSR_PROXIMITY_KM: 3.0,
  /** Minimum target water-equivalent hydrogen yield for priority volatiles site (wt%) */
  HIGH_VOLATILE_YIELD_WEH_WT_PCT: 1.5,
  /** Safe thermal range for lander avionics and battery survival without RHU (Kelvin) */
  SAFE_TEMP_MIN_K: 120,
  SAFE_TEMP_MAX_K: 290
};

// ─────────────────────────────────────────────────────────────────────────────
// ORBITAL GROUND TRACK PROPAGATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Propagates the spacecraft ground track for a given revolution.
 * 
 * @param {number} revIndex - Orbit revolution number (0, 1, 2, ...)
 * @param {number} numSamples - Number of along-track coordinate points
 * @param {number} initialRAAN - Right Ascension of Ascending Node in degrees (default 0)
 * @returns {Array<{ lat: number, lon: number, altitudeKm: number, timeSec: number }>}
 */
export function computeOrbitalGroundTrack(revIndex = 0, numSamples = 60, initialRAAN = 0) {
  const period = NOMINAL_ORBITAL_PERIOD_SEC;
  const tStart = revIndex * period;
  const points = [];

  // Nodal shift per revolution due to lunar rotation (deg)
  const nodalShiftPerRevDeg = (NOMINAL_ORBITAL_PERIOD_SEC / MOON_ROTATION_PERIOD_SEC) * 360; // ~0.985° per rev

  for (let i = 0; i < numSamples; i++) {
    const fraction = i / (numSamples - 1);
    const timeSec = tStart + fraction * period;
    
    // Orbital true anomaly (polar orbit passing through South Pole at fraction = 0.5)
    // Mean anomaly M: 0 at equator, pi at North Pole, 1.5 pi at equator descending, etc.
    const thetaRad = fraction * 2 * Math.PI;
    
    // In polar orbit (inclination = 90°), latitude corresponds directly to -90° * sin(theta)
    // Peaks at South Pole (-90.0°) when theta = pi/2
    const latDeg = -90.0 * Math.sin(thetaRad);

    // Selenographic longitude shifts as the Moon rotates beneath the orbit plane (timeSec accounts for revIndex)
    const lunarRotationDeg = ((timeSec / MOON_ROTATION_PERIOD_SEC) * 360) % 360;
    let lonDeg = (initialRAAN - lunarRotationDeg) % 360;
    if (lonDeg > 180) lonDeg -= 360;
    if (lonDeg < -180) lonDeg += 360;

    points.push({
      lat: parseFloat(latDeg.toFixed(4)),
      lon: parseFloat(lonDeg.toFixed(4)),
      altitudeKm: NOMINAL_ORBIT_ALTITUDE_KM,
      timeSec: Math.round(timeSec)
    });
  }

  return points;
}

// ─────────────────────────────────────────────────────────────────────────────
// SENSOR SUITE EVALUATION AT ARBITRARY COORDINATE (lat, lon)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates the full multi-instrument sensor reading at a specific surface location.
 * 
 * @param {number} lat - Selenographic latitude (-90 to -80 for South Pole)
 * @param {number} lon - Selenographic longitude (-180 to +180)
 * @param {Date|number} simDate - Target mission simulation timestamp
 * @returns {Object} Comprehensive multi-instrument reading
 */
export function evaluateSurfaceCell(lat, lon, simDate = new Date('2026-12-05T08:00:00Z')) {
  // 1. LOLA LiDAR Topography & Slope
  const elevationM = sampleLolaElevation(lat, lon);
  const slopeDeg = sampleSlopeAngle(lat, lon);

  // Surface roughness RMS (meters) derived from local slope variation
  const roughnessRmsM = parseFloat((0.15 + (slopeDeg / 20.0) * 0.85).toFixed(2));

  // Crater Depth-to-Diameter (d/D) classification
  let nearestFeature = null;
  let minFeatureDistKm = 9999;
  
  for (const feat of LUNAR_SOUTH_POLE_FEATURES) {
    const dLat = lat - feat.lat;
    const avgLatRad = ((lat + feat.lat) / 2 * Math.PI) / 180;
    const dLon = (lon - feat.lon) * Math.cos(avgLatRad);
    const distKm = Math.sqrt(dLat * dLat + dLon * dLon) * 30.3;
    if (distKm < minFeatureDistKm) {
      minFeatureDistKm = distKm;
      nearestFeature = feat;
    }
  }

  const isInsideCrater = nearestFeature && nearestFeature.depthMeters > 0 && minFeatureDistKm < (nearestFeature.diameterKm / 2);
  const depthToDiameterRatio = isInsideCrater ? parseFloat((nearestFeature.depthMeters / (nearestFeature.diameterKm * 1000)).toFixed(3)) : 0.02;

  // 2. Diviner Thermal Radiometer & Rock Fraction
  const thermal = sampleDivinerTemperature(lat, lon);
  const surfaceTempK = thermal.currentK;
  // Rock physical fraction (f_rock): high slopes and crater walls expose more boulders
  const rockFraction = parseFloat(Math.min(0.25, 0.02 + (slopeDeg > 10 ? (slopeDeg - 10) * 0.015 : 0)).toFixed(3));

  // 3. Neutron Spectrometer (LEND / Lunar Prospector) Water Ice Yield
  const waterIce = sampleWaterIceAbundance(lat, lon);
  const waterIceWEH = waterIce.abundanceWtPct;

  // 4. Illumination & DTE Line of Sight via Phase 1 Ephemeris Engine
  const ephemSite = {
    lat,
    lon,
    elevationM,
    horizonProfile: generateSyntheticHorizon(lat, lon, elevationM, nearestFeature, minFeatureDistKm)
  };

  const ephem = computeMissionParameters(ephemSite, simDate);

  // 5. Multi-Criteria Safety & Suitability Scoring (0 to 100)
  const scores = computeCellSuitabilityScore({
    slopeDeg,
    elevationM,
    roughnessRmsM,
    surfaceTempK,
    waterIceWEH,
    isSunLit: ephem.sun.isVisible,
    sunElevation: ephem.sun.elevation,
    isEarthVisible: ephem.earth.isVisible,
    earthElevation: ephem.earth.elevation,
    isInsideCrater,
    minFeatureDistKm
  });

  return {
    coordinates: { lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lon.toFixed(4)) },
    topography: {
      elevationM,
      slopeDeg,
      roughnessRmsM,
      depthToDiameterRatio,
      slopeCategory: slopeDeg <= SAFETY_THRESHOLDS.SLOPE_MAX_SAFE_DEG ? 'SAFE_FLAT' :
                     slopeDeg <= SAFETY_THRESHOLDS.SLOPE_CRITICAL_TILT_DEG ? 'MODERATE_CAUTION' : 'HAZARD_STEEP'
    },
    thermal: {
      surfaceTempK,
      thermalRegime: thermal.status,
      rockFraction
    },
    volatiles: {
      waterIceWEH,
      sublimationStability: waterIce.sublimationStability,
      yieldRating: waterIce.rating
    },
    astrodynamics: {
      sunElevation: ephem.sun.elevation,
      isSunLit: ephem.sun.isVisible,
      solarPowerW: ephem.sun.powerWatts,
      earthElevation: ephem.earth.elevation,
      isEarthVisible: ephem.earth.isVisible,
      commStatus: ephem.earth.commStatus,
      linkMarginDb: ephem.earth.linkMarginDb
    },
    scoring: scores,
    nearestLandmark: nearestFeature ? {
      name: nearestFeature.name,
      distanceKm: parseFloat(minFeatureDistKm.toFixed(2)),
      type: nearestFeature.type
    } : null
  };
}

/**
 * Builds a fast synthetic local horizon profile for arbitrary coordinates
 * based on nearby crater rims and mountains.
 */
function generateSyntheticHorizon(lat, lon, elevationM, nearestFeature, distKm) {
  const profile = new Float32Array(360);
  const baseElev = elevationM > 2000 ? 0.2 : 0.8;

  let peakAzimuth = 0;
  let peakHeight = 0;

  if (nearestFeature) {
    const dLat = nearestFeature.lat - lat;
    const dLon = nearestFeature.lon - lon;
    peakAzimuth = Math.round(((Math.atan2(dLon, dLat) * 180 / Math.PI) + 360) % 360);
    peakHeight = Math.max(0.5, Math.min(4.5, (nearestFeature.peakElevationM - elevationM) / 1000 + 1.2));
  }

  for (let az = 0; az < 360; az++) {
    let diff = Math.abs(az - peakAzimuth);
    if (diff > 180) diff = 360 - diff;
    const peakContribution = peakHeight * Math.exp(-0.5 * Math.pow(diff / 30, 2));
    profile[az] = parseFloat((baseElev + peakContribution).toFixed(2));
  }

  return profile;
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-CRITERIA DECISION ANALYSIS (MCDA) SCORING ALGORITHM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes individual sub-scores and the composite landing suitability index.
 */
export function computeCellSuitabilityScore(params) {
  const {
    slopeDeg,
    roughnessRmsM,
    surfaceTempK,
    waterIceWEH,
    isSunLit,
    sunElevation,
    isEarthVisible,
    earthElevation,
    isInsideCrater,
    minFeatureDistKm
  } = params;

  // 1. Slope Safety Subscore (Weight: 35%)
  // Hard cutoff at 15° (inevitable tip-over). Maximum points for slope <= 5°
  let slopeScore = 0;
  if (slopeDeg <= 5.0) {
    slopeScore = 100;
  } else if (slopeDeg < SAFETY_THRESHOLDS.SLOPE_CRITICAL_TILT_DEG) {
    const fraction = (slopeDeg - 5.0) / (SAFETY_THRESHOLDS.SLOPE_CRITICAL_TILT_DEG - 5.0);
    slopeScore = Math.max(0, 100 * (1.0 - fraction));
  } else {
    slopeScore = 0; // Unacceptable tip hazard
  }

  // 2. Solar Illumination Subscore (Weight: 25%)
  let illuminationScore = 0;
  if (isSunLit && sunElevation > 0.2) {
    illuminationScore = Math.min(100, 60 + sunElevation * 25);
  } else if (isSunLit) {
    illuminationScore = 50; // Grazing sunlight
  } else {
    // In shadow: severe power penalty for solar-powered CLPS landers
    illuminationScore = 10;
  }

  // 3. Direct-To-Earth Comms Line-of-Sight Subscore (Weight: 20%)
  let dteScore = 0;
  if (isEarthVisible && earthElevation > 1.5) {
    dteScore = 100;
  } else if (isEarthVisible && earthElevation > 0) {
    dteScore = 70; // Low elevation, atmospheric grazing
  } else {
    dteScore = 0; // Blackout
  }

  // 4. Volatile Resource Access Subscore (Weight: 20%)
  // High value if close to PSR cold trap without being trapped inside steep crater
  let volatileScore = 0;
  if (isInsideCrater) {
    // Inside pitch black crater floor: high ice, but lethal for solar lander
    volatileScore = 30;
  } else if (minFeatureDistKm < SAFETY_THRESHOLDS.MAX_ROVER_PSR_PROXIMITY_KM) {
    // On rim or ridge with short rover traverse to cold trap: optimal!
    volatileScore = Math.min(100, 50 + waterIceWEH * 20);
  } else {
    volatileScore = Math.max(10, waterIceWEH * 15);
  }

  // 5. Severe Hazard Penalties
  let hazardPenalty = 0;
  if (slopeDeg >= 12.0) hazardPenalty += 35;
  if (roughnessRmsM > 0.6) hazardPenalty += 15;
  if (surfaceTempK < 60 && !isSunLit) hazardPenalty += 30; // Deep cryogenic trap

  // Composite Weighted Sum
  const rawComposite =
    0.35 * slopeScore +
    0.25 * illuminationScore +
    0.20 * dteScore +
    0.20 * volatileScore -
    hazardPenalty;

  const compositeScore = Math.round(Math.max(0, Math.min(100, rawComposite)));

  // Risk Classification
  let riskLevel = 'CRITICAL_HAZARD';
  if (compositeScore >= 75) riskLevel = 'PRIME_LANDING_ZONE';
  else if (compositeScore >= 55) riskLevel = 'ACCEPTABLE_CAUTION';
  else if (compositeScore >= 35) riskLevel = 'HIGH_RISK';

  return {
    compositeScore,
    riskLevel,
    subscores: {
      slope: Math.round(slopeScore),
      illumination: Math.round(illuminationScore),
      dteComms: Math.round(dteScore),
      volatiles: Math.round(volatileScore)
    },
    penaltyDeduction: hazardPenalty
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL GRID SCANNER & CORRIDOR EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes a full orbital reconnaissance swath sweep over a target region.
 * 
 * @param {Object} options
 * @param {number} options.minLat - South Pole latitude boundary (e.g. -90.0)
 * @param {number} options.maxLat - Equatorward latitude boundary (e.g. -84.0)
 * @param {number} options.minLon - Longitude boundary (-180 to 180)
 * @param {number} options.maxLon - Longitude boundary (-180 to 180)
 * @param {number} options.gridResolution - Step in degrees (e.g. 0.25 for fast scan, 0.1 for high-res)
 * @param {Date|number} options.simDate - Mission target epoch
 * @returns {Object} Comprehensive scan survey result with top landing corridors
 */
export function executeOrbitalReconnaissance(options = {}) {
  const {
    minLat = -89.8,
    maxLat = -84.5,
    minLon = -180.0,
    maxLon = 180.0,
    gridResolution = 0.35, // ~10 km grid points
    simDate = new Date('2026-12-05T08:00:00Z')
  } = options;

  const tStart = Date.now();
  const cells = [];

  let highestScoreCell = null;
  let maxScore = -1;
  let totalAreaKm2 = 0;
  let primeCellsCount = 0;
  let waterRichCellsCount = 0;

  for (let lat = minLat; lat <= maxLat; lat += gridResolution) {
    const latRad = (lat * Math.PI) / 180;
    const lonStep = gridResolution / Math.max(0.15, Math.cos(latRad)); // Adjust for polar convergence

    for (let lon = minLon; lon <= maxLon; lon += lonStep) {
      const cell = evaluateSurfaceCell(lat, lon, simDate);
      cells.push(cell);

      totalAreaKm2 += (gridResolution * 30.3) * (gridResolution * 30.3);

      if (cell.scoring.compositeScore > maxScore) {
        maxScore = cell.scoring.compositeScore;
        highestScoreCell = cell;
      }

      if (cell.scoring.riskLevel === 'PRIME_LANDING_ZONE') {
        primeCellsCount++;
      }

      if (cell.volatiles.waterIceWEH >= SAFETY_THRESHOLDS.HIGH_VOLATILE_YIELD_WEH_WT_PCT) {
        waterRichCellsCount++;
      }
    }
  }

  // Sort and extract top candidate corridors
  const sortedCells = [...cells].sort((a, b) => b.scoring.compositeScore - a.scoring.compositeScore);

  // Group top cells to avoid selecting multiple adjacent cells from the exact same crater rim
  const topCorridors = [];
  for (const cell of sortedCells) {
    if (topCorridors.length >= 3) break;

    // Check separation distance from existing selected corridors (> 15 km separation)
    const isSeparated = topCorridors.every(cand => {
      const dLat = cell.coordinates.lat - cand.coordinates.lat;
      const avgLatRad = ((cell.coordinates.lat + cand.coordinates.lat) / 2 * Math.PI) / 180;
      const dLon = (cell.coordinates.lon - cand.coordinates.lon) * Math.cos(avgLatRad);
      const dist = Math.sqrt(dLat * dLat + dLon * dLon) * 30.3;
      return dist > 15.0;
    });

    if (isSeparated) {
      topCorridors.push({
        designation: topCorridors.length === 0 ? 'HAVEN-ALPHA (Prime)' :
                     topCorridors.length === 1 ? 'HAVEN-BETA (Secondary)' : 'HAVEN-GAMMA (Science Reserve)',
        coordinates: cell.coordinates,
        elevationMeters: cell.topography.elevationM,
        slopeDegrees: cell.topography.slopeDeg,
        compositeScore: cell.scoring.compositeScore,
        riskClassification: cell.scoring.riskLevel,
        sunElevationDeg: cell.astrodynamics.sunElevation,
        dteLinkMarginDb: cell.astrodynamics.linkMarginDb,
        waterIceYieldWEH: cell.volatiles.waterIceWEH,
        surfaceTemperatureK: cell.thermal.surfaceTempK,
        nearestFeature: cell.nearestLandmark,
        pdiVector: {
          burnDurationSec: 345,
          deltaVMps: 1680,
          approachAzimuthDeg: Math.round((cell.coordinates.lon + 180) % 360)
        }
      });
    }
  }

  const durationMs = Date.now() - tStart;

  return {
    surveyMetadata: {
      generatedAt: new Date().toISOString(),
      missionEpoch: typeof simDate === 'number' ? new Date(simDate).toISOString() : simDate.toISOString(),
      gridPointsScanned: cells.length,
      surveyDurationMs: durationMs,
      surveyedAreaKm2: Math.round(totalAreaKm2),
      primeZonesFound: primeCellsCount,
      waterIceHotspots: waterRichCellsCount,
      sensorSuite: 'LOLA LiDAR + LEND Epithermal Neutron + Diviner Radiometer + JPL DE441'
    },
    topLandingCorridors: topCorridors,
    sampleGrid: cells.slice(0, 100) // Compact sample for UI rendering
  };
}
