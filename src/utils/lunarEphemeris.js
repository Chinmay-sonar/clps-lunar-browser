/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELIOS-DTE: Precision Lunar Ephemeris & Topocentric Geometry Bridge
 * ═══════════════════════════════════════════════════════════════════════════
 * Powered by NASA JPL Horizons DE441 Ground-Truth Ephemeris & LOLA DEMs.
 */

import jplData from '../data/jplDE441_ephemeris_2026_2030.json';
import {
  loadEphemerisData,
  computeMissionParameters,
  computeTimeSeries,
  getHorizonElevation,
  isEphemerisReady,
  DEG2RAD,
  RAD2DEG
} from '../engine/ephemerisDE441.js';

// Auto-initialize the JPL DE441 lookup cache on module load
if (jplData && !isEphemerisReady()) {
  loadEphemerisData(jplData);
}

// Convert degrees to radians and vice versa
export const degToRad = (d) => d * DEG2RAD;
export const radToDeg = (r) => r * RAD2DEG;

/**
 * Computes topocentric position of the Sun and Earth relative to a landing site at time t.
 * @param {Object} site - Landing site object with lat, lon, and horizonProfile
 * @param {Date|number} timestamp - UTC Date or millisecond epoch
 * @param {number} panelTiltDeg - Solar panel tilt angle from vertical (0° = vertical, 90° = horizontal)
 * @param {number} panelAzimuthOffsetDeg - Panel orientation relative to Sun
 */
export function calculateLunarEphemeris(site, timestamp, panelTiltDeg = 0, panelAzimuthOffsetDeg = 0) {
  if (!site) return null;

  const panelConfig = {
    tiltDeg: panelTiltDeg,
    azimuthOffsetDeg: panelAzimuthOffsetDeg,
    areaSqM: 3.2,
    areaM2: 3.2,
    efficiency: 0.32,
    bifacialAlbedoGain: 0.12
  };

  const params = computeMissionParameters(site, timestamp, panelConfig);

  // Return complete telemetry structure formatted for UI components
  return {
    ...params,
    environment: {
      ...params.environment,
      psrProximityKm: site.psrDistanceKm,
      slopeHazard: site.hazards || site.keyHazard
    }
  };
}

/**
 * Interpolates the height of the local horizon at any azimuth angle (0-360 deg).
 */
export function getHorizonHeightAtAzimuth(horizonProfile, azimuth) {
  return getHorizonElevation(horizonProfile, azimuth);
}

/**
 * Precomputes time series window forecast for solar and DTE visibility.
 */
export function calculateTimelineForecast(site, startTimestamp, hours = 72, stepHours = 1) {
  if (!site) return [];

  const rawSeries = computeTimeSeries(site, startTimestamp, hours, stepHours);

  return rawSeries.map(step => ({
    time: step.epoch,
    hourOffset: step.hourOffset,
    sunElev: step.sun.elevation,
    sunVisible: step.sun.isVisible,
    powerWatts: step.sun.powerWatts,
    earthElev: step.earth.elevation,
    earthVisible: step.earth.isVisible,
    commStatus: step.earth.commStatus,
    tempK: step.environment.surfaceTempK
  }));
}
