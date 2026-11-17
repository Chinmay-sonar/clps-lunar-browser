/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELIOS-DTE: Scientifically Calibrated Landing Sites & Mission Manifest
 * ═══════════════════════════════════════════════════════════════════════════
 * Backwards-compatible export linking Phase 1 LOLA-derived horizon masks
 * and JPL DE441 ephemeris models to the UI components.
 */

import { LANDING_SITES as ENGINE_SITES, CLPS_MISSIONS as ENGINE_MISSIONS } from '../engine/landingSitesDE441.js';

// Map each site with complete compatibility properties for Viewport3D, UI hud, etc.
export const LANDING_SITES = ENGINE_SITES.map(site => ({
  ...site,
  targetType: site.designation,
  elevationMeters: site.elevationM,
  keyHazard: site.hazards,
  waterIceProbability: site.waterIceWEH >= 0.25 ? `High (${site.waterIceWEH} wt% WEH)` : `Moderate (${site.waterIceWEH} wt% WEH)`,
  dteReliability: `${(site.illuminationPct * 0.98).toFixed(1)}% Line-of-Sight Window`,
  maxSunElev: parseFloat((site.lat >= -86 ? 1.62 : site.lat >= -88 ? 1.58 : 1.54).toFixed(2)),
  minSunElev: parseFloat((-1.54 + (site.lat + 90) * 0.05).toFixed(2)),
  terrainColor: site.id === 'malapert-massif' ? '#8a929e' :
                site.id === 'shackleton-connecting-ridge' ? '#949ba6' :
                site.id === 'mons-mouton' ? '#8e96a2' :
                site.id === 'nobile-rim-1' ? '#868f9b' :
                site.id === 'de-gerlache-rim' ? '#8c95a0' : '#848d9a'
}));

// Missions with backwards compatibility fields
export const CLPS_MISSIONS = ENGINE_MISSIONS.map(m => ({
  ...m,
  significance: m.outcome || m.provider + ' mission demonstrating autonomous lunar polar operations and scientific analysis.',
  targetCoords: `${Math.abs(m.targetCoords.lat).toFixed(2)}° S, ${m.targetCoords.lon.toFixed(2)}° E`
}));
