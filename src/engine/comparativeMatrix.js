/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELIOS-DTE: Multi-Site Comparative Matrix & Trade Study Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides simultaneous multi-site evaluation and trade study ranking for
 * NASA Artemis and CLPS candidate landing sites at the Lunar South Pole.
 * 
 * Capabilities:
 *   1. Synchronous multi-site time-series generation (Power, Comms, Viability)
 *   2. Trade study metric extraction (illumination fraction, longest day,
 *      max blackout, link margin, ISRU proximity, landing safety)
 *   3. Weighted Multi-Criteria Decision Analysis (MCDA) Site Ranking
 *   4. Head-to-head delta comparisons
 * ═══════════════════════════════════════════════════════════════════════════
 */

import jplData from '../data/jplDE441_ephemeris_2026_2030.json' with { type: 'json' };
import { LANDING_SITES } from './landingSitesDE441.js';
import {
  computeMissionParameters,
  DEFAULT_PANEL_CONFIG,
  loadEphemerisData,
  isEphemerisReady
} from './ephemerisDE441.js';

// Auto-initialize the JPL DE441 lookup cache on module load
if (jplData && !isEphemerisReady()) {
  loadEphemerisData(jplData);
}

/**
 * Site palette colors for multi-curve visualization
 */
export const SITE_PALETTE = {
  'malapert-massif': '#00f0ff',           // Electric Cyan
  'shackleton-connecting-ridge': '#f59e0b', // Solar Gold
  'mons-mouton': '#10b981',               // Emerald Green
  'nobile-rim-1': '#a855f7',              // Purple Orchid
  'de-gerlache-rim': '#f43f5e',           // Rose Red
  'haworth-rim': '#38bdf8'                // Sky Blue
};

/**
 * Default weights for the Multi-Criteria Trade Study Ranking Index
 */
export const DEFAULT_TRADE_WEIGHTS = {
  illuminationPct: 0.30,      // Total sunlight fraction
  longestSunWindow: 0.15,     // Continuous uninterrupted operations
  commsAvailability: 0.25,    // Direct-to-Earth line-of-sight availability
  landingSafety: 0.15,        // Inverse terrain slope & elevation margin
  isruPotential: 0.15         // Water-ice abundance & PSR proximity
};

/**
 * Evaluates multiple landing sites over a synchronized time window.
 * 
 * @param {Object} options
 * @param {string[]} options.siteIds - Array of site IDs to compare (e.g. ['malapert-massif', 'shackleton-connecting-ridge'])
 * @param {Date|number} options.startDate - Start of evaluation window
 * @param {number} [options.durationDays=14] - Duration in Earth days (e.g. 7, 14, 28)
 * @param {number} [options.stepHours=2] - Time sampling interval in hours
 * @param {Object} [options.panelConfig] - Solar array configuration
 * @param {Object} [options.weights] - Ranking weights
 * @returns {Object} Comparative study results including time series and ranked site metrics
 */
export function evaluateMultiSiteComparison({
  siteIds = ['malapert-massif', 'shackleton-connecting-ridge', 'mons-mouton'],
  startDate = new Date('2026-12-05T00:00:00Z'),
  durationDays = 14,
  stepHours = 2,
  panelConfig = DEFAULT_PANEL_CONFIG,
  weights = DEFAULT_TRADE_WEIGHTS
} = {}) {
  const startMs = typeof startDate === 'number' ? startDate : startDate.getTime();
  const totalHours = Math.round(durationDays * 24);
  const totalSteps = Math.floor(totalHours / stepHours) + 1;

  // Filter and resolve selected site objects
  const selectedSites = siteIds
    .map(id => LANDING_SITES.find(s => s.id === id))
    .filter(Boolean);

  if (selectedSites.length === 0) {
    throw new Error('[ComparativeMatrix] No valid sites found for provided IDs');
  }

  // Pre-allocate timestamps array
  const timestamps = new Array(totalSteps);
  for (let i = 0; i < totalSteps; i++) {
    timestamps[i] = startMs + i * stepHours * 3600 * 1000;
  }

  // Generate synchronized time-series and aggregate statistics for each site
  const siteResults = selectedSites.map(site => {
    const powerSeries = new Float32Array(totalSteps);
    const sunElevSeries = new Float32Array(totalSteps);
    const earthElevSeries = new Float32Array(totalSteps);
    const linkMarginSeries = new Float32Array(totalSteps);
    const viabilitySeries = new Float32Array(totalSteps);
    const sunVisibleSeries = new Uint8Array(totalSteps);
    const earthVisibleSeries = new Uint8Array(totalSteps);

    let sunlitStepCount = 0;
    let commsStepCount = 0;
    let totalPower = 0;
    let maxPower = 0;
    let totalLinkMargin = 0;
    let validMarginCount = 0;

    let currentSunStreak = 0;
    let longestSunStreak = 0;
    let currentShadowStreak = 0;
    let longestShadowStreak = 0;

    let currentCommsStreak = 0;
    let longestCommsStreak = 0;
    let currentBlackoutStreak = 0;
    let longestBlackoutStreak = 0;

    for (let i = 0; i < totalSteps; i++) {
      const t = timestamps[i];
      const params = computeMissionParameters(site, t, panelConfig);

      const solarW = params.sun?.powerWatts ?? 0;
      const sunElev = params.sun?.elevation ?? -90;
      const earthElev = params.earth?.elevation ?? -90;
      const linkDb = params.earth?.linkMarginDb ?? -18.5;
      const viability = params.viabilityIndex ?? 0;
      const isSunLit = !!params.sun?.isVisible;
      const isEarthLit = !!params.earth?.isVisible;

      powerSeries[i] = solarW;
      sunElevSeries[i] = sunElev;
      earthElevSeries[i] = earthElev;
      linkMarginSeries[i] = linkDb;
      viabilitySeries[i] = viability;
      sunVisibleSeries[i] = isSunLit ? 1 : 0;
      earthVisibleSeries[i] = isEarthLit ? 1 : 0;

      totalPower += solarW;
      if (solarW > maxPower) maxPower = solarW;

      if (isSunLit) {
        sunlitStepCount++;
        currentSunStreak++;
        if (currentShadowStreak > longestShadowStreak) longestShadowStreak = currentShadowStreak;
        currentShadowStreak = 0;
        if (currentSunStreak > longestSunStreak) longestSunStreak = currentSunStreak;
      } else {
        currentShadowStreak++;
        if (currentSunStreak > longestSunStreak) longestSunStreak = currentSunStreak;
        currentSunStreak = 0;
        if (currentShadowStreak > longestShadowStreak) longestShadowStreak = currentShadowStreak;
      }

      if (isEarthLit) {
        commsStepCount++;
        currentCommsStreak++;
        if (currentBlackoutStreak > longestBlackoutStreak) longestBlackoutStreak = currentBlackoutStreak;
        currentBlackoutStreak = 0;
        if (currentCommsStreak > longestCommsStreak) longestCommsStreak = currentCommsStreak;

        totalLinkMargin += linkDb;
        validMarginCount++;
      } else {
        currentBlackoutStreak++;
        if (currentCommsStreak > longestCommsStreak) longestCommsStreak = currentCommsStreak;
        currentCommsStreak = 0;
        if (currentBlackoutStreak > longestBlackoutStreak) longestBlackoutStreak = currentBlackoutStreak;
      }
    }

    // Flush final streaks
    if (currentSunStreak > longestSunStreak) longestSunStreak = currentSunStreak;
    if (currentShadowStreak > longestShadowStreak) longestShadowStreak = currentShadowStreak;
    if (currentCommsStreak > longestCommsStreak) longestCommsStreak = currentCommsStreak;
    if (currentBlackoutStreak > longestBlackoutStreak) longestBlackoutStreak = currentBlackoutStreak;

    const illuminationPct = (sunlitStepCount / totalSteps) * 100;
    const commsAvailabilityPct = (commsStepCount / totalSteps) * 100;
    const avgPowerW = totalPower / totalSteps;
    const avgLinkMarginDb = validMarginCount > 0 ? totalLinkMargin / validMarginCount : -18.5;

    const longestSunHours = longestSunStreak * stepHours;
    const longestShadowHours = longestShadowStreak * stepHours;
    const longestCommsHours = longestCommsStreak * stepHours;
    const longestBlackoutHours = longestBlackoutStreak * stepHours;

    // Safety and ISRU normalization
    // Slope safety: 0 deg = 100%, 25 deg = 0%
    const maxSafeSlope = 25.0;
    const slopeSafetyPct = Math.max(0, Math.min(100, (1 - (site.maxSlopeDeg || 15) / maxSafeSlope) * 100));

    // ISRU Score: Combined Water-Ice WEH (up to 0.4 wt%) and PSR proximity (closer = better, up to 5km)
    const iceScore = Math.min(100, ((site.waterIceWEH || 0.1) / 0.4) * 100);
    const psrProximityScore = Math.max(0, Math.min(100, (1 - ((site.psrDistanceKm || 3) / 6.0)) * 100));
    const isruCompositePct = iceScore * 0.6 + psrProximityScore * 0.4;

    // Continuous day score (relative to 14-day mission = 336 hours)
    const continuousDayPct = Math.min(100, (longestSunHours / (durationDays * 24)) * 100);

    // Compute composite trade-off score
    const w = { ...DEFAULT_TRADE_WEIGHTS, ...weights };
    const compositeScore = Math.round(
      illuminationPct * w.illuminationPct +
      continuousDayPct * w.longestSunWindow +
      commsAvailabilityPct * w.commsAvailability +
      slopeSafetyPct * w.landingSafety +
      isruCompositePct * w.isruPotential
    );

    return {
      site,
      color: SITE_PALETTE[site.id] || '#00f0ff',
      metrics: {
        illuminationPct: parseFloat(illuminationPct.toFixed(1)),
        commsAvailabilityPct: parseFloat(commsAvailabilityPct.toFixed(1)),
        avgPowerW: Math.round(avgPowerW),
        maxPowerW: Math.round(maxPower),
        longestSunHours,
        longestShadowHours,
        longestCommsHours,
        longestBlackoutHours,
        avgLinkMarginDb: parseFloat(avgLinkMarginDb.toFixed(1)),
        slopeSafetyPct: Math.round(slopeSafetyPct),
        isruCompositePct: Math.round(isruCompositePct),
        compositeScore
      },
      series: {
        power: Array.from(powerSeries),
        sunElevation: Array.from(sunElevSeries),
        earthElevation: Array.from(earthElevSeries),
        linkMargin: Array.from(linkMarginSeries),
        viability: Array.from(viabilitySeries),
        sunVisible: Array.from(sunVisibleSeries),
        earthVisible: Array.from(earthVisibleSeries)
      }
    };
  });

  // Rank sites by composite score descending
  const rankedSites = [...siteResults].sort((a, b) => b.metrics.compositeScore - a.metrics.compositeScore);
  rankedSites.forEach((item, index) => {
    item.rank = index + 1;
    item.tier = index === 0 ? 'PRIME_CANDIDATE' : index === 1 ? 'SECONDARY_CANDIDATE' : 'CONTINGENCY_SITE';
  });

  return {
    window: {
      startDate: new Date(startMs).toISOString(),
      endDate: new Date(startMs + totalHours * 3600 * 1000).toISOString(),
      durationDays,
      stepHours,
      totalSteps
    },
    timestamps,
    sites: siteResults,
    rankedSites,
    primeRecommendation: rankedSites[0]
  };
}

/**
 * Computes a direct Head-to-Head differential comparison between two sites.
 * 
 * @param {string} siteAId
 * @param {string} siteBId
 * @param {Date|number} epoch
 * @returns {Object} Direct delta comparison
 */
export function compareSitesHeadToHead(siteAId, siteBId, epoch = new Date('2026-12-05T00:00:00Z')) {
  const siteA = LANDING_SITES.find(s => s.id === siteAId);
  const siteB = LANDING_SITES.find(s => s.id === siteBId);

  if (!siteA || !siteB) {
    throw new Error('[ComparativeMatrix] Invalid site IDs for head-to-head comparison');
  }

  const res = evaluateMultiSiteComparison({
    siteIds: [siteAId, siteBId],
    startDate: epoch,
    durationDays: 14,
    stepHours: 4
  });

  const a = res.sites.find(s => s.site.id === siteAId);
  const b = res.sites.find(s => s.site.id === siteBId);

  return {
    siteA: { id: siteA.id, name: siteA.name, metrics: a.metrics },
    siteB: { id: siteB.id, name: siteB.name, metrics: b.metrics },
    delta: {
      illuminationDiffPct: parseFloat((a.metrics.illuminationPct - b.metrics.illuminationPct).toFixed(1)),
      commsDiffPct: parseFloat((a.metrics.commsAvailabilityPct - b.metrics.commsAvailabilityPct).toFixed(1)),
      continuousSunDiffHours: a.metrics.longestSunHours - b.metrics.longestSunHours,
      slopeMarginDiffDeg: (b.site.maxSlopeDeg || 15) - (a.site.maxSlopeDeg || 15), // positive means A is flatter
      iceDiffWEH: parseFloat(((a.site.waterIceWEH || 0) - (b.site.waterIceWEH || 0)).toFixed(2)),
      scoreDiff: a.metrics.compositeScore - b.metrics.compositeScore
    },
    winner: a.metrics.compositeScore >= b.metrics.compositeScore ? a.site.name : b.site.name
  };
}
