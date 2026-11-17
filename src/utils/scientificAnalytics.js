// NASA Scientific Analytics Engine for Lunar South Pole Exploration
// Implements mathematical models for:
// 1. 29.5-day synodic solar elevation & power generation
// 2. 27.3-day Earth libration & Direct-to-Earth (DTE) horizon line-of-sight
// 3. Diviner radiometer diurnal regolith thermal cycles (38K to 240K)
// 4. Volatile water ice sublimation loss vs. regolith depth (0 - 100cm TRIDENT drill range)

import { degToRad } from './lunarEphemeris';

/**
 * 1. Calculate 29.5-day synodic solar elevation and power generation curve
 * @param {Object} site - Landing site info
 * @param {Date} startDate - Reference sim start date
 * @returns {Array} Array of 240 data points across one full lunar month (708 hours)
 */
export function generateSolarCycleData(site, startDate = new Date('2024-02-18T00:00:00Z')) {
  const points = [];
  const totalHours = 29.53 * 24; // 708.7 hours in a synodic month
  const stepHours = totalHours / 160; // 160 samples

  const siteLat = site.lat || -85.0;
  // Maximum polar solar elevation angle: 90° - |lat| + lunar obliquity (1.54°)
  // At -85°S: max elevation ~ +6.54°. At -89.9°S (Shackleton): max elevation ~ +1.54°!
  const maxElev = (90 - Math.abs(siteLat)) + 1.54;
  const minElev = -( (90 - Math.abs(siteLat)) + 1.54 );

  for (let i = 0; i <= 160; i++) {
    const hoursOffset = i * stepHours;
    const time = new Date(startDate.getTime() + hoursOffset * 3600 * 1000);
    const dayOfMonth = (hoursOffset / 24).toFixed(1);

    // Diurnal progression around 360° azimuth
    const phase = (hoursOffset / totalHours) * Math.PI * 2;
    // Real solar elevation oscillates slowly with seasonal variation
    const rawElev = Math.sin(phase) * (maxElev - minElev) / 2 + (maxElev + minElev) / 2;
    
    // Mountain horizon blocking threshold at this site (e.g. 1.8° average rim height)
    const horizonBlockDeg = site.horizonHeightDeg || 1.6;
    const isIlluminated = rawElev > horizonBlockDeg;

    // Solar flux (Solar constant at 1 AU = 1361 W/m²)
    // Cosine efficiency: for vertical panels on rover, flux is cos(elevation), peak at grazing!
    // For flat panels, flux is sin(elevation).
    const solarConstant = 1361;
    const verticalPanelWatts = isIlluminated ? Math.max(0, solarConstant * 0.28 * Math.cos(degToRad(rawElev))) : 0;
    const horizontalPanelWatts = isIlluminated ? Math.max(0, solarConstant * 0.28 * Math.sin(degToRad(Math.max(0, rawElev)))) : 0;

    points.push({
      hour: hoursOffset.toFixed(0),
      day: dayOfMonth,
      timestamp: time.toISOString(),
      elevation: parseFloat(rawElev.toFixed(2)),
      horizonBlockDeg,
      isIlluminated,
      verticalWatts: parseFloat(verticalPanelWatts.toFixed(1)),
      horizontalWatts: parseFloat(horizontalPanelWatts.toFixed(1)),
      shadowStatus: isIlluminated ? 'DIRECT SUN' : (rawElev > 0 ? 'TERRAIN OCCULTED' : 'SUB-HORIZON NIGHT')
    });
  }

  return points;
}

/**
 * 2. Calculate 27.3-day Earth libration cycle & Direct-to-Earth (DTE) communications visibility
 * @param {Object} site - Landing site info
 * @param {Date} startDate - Reference sim start date
 * @returns {Array} Array of data points showing Earth elevation oscillating across local mountain skyline
 */
export function generateEarthLibrationData(site, startDate = new Date('2024-02-18T00:00:00Z')) {
  const points = [];
  const totalDays = 27.32; // Sidereal libration period
  const totalHours = totalDays * 24;
  const stepHours = totalHours / 140;

  // Mean Earth elevation at lunar south pole:
  // elevation ≈ 90° - |lat| ± libration amplitude (~6.7° lat, ~7.9° lon)
  const siteLat = site.lat || -85.0;
  const meanElev = (90 - Math.abs(siteLat)) - 0.8;
  const librationAmplitude = 6.2; // degrees oscillation
  const localRimHeight = site.horizonHeightDeg || 2.1;

  for (let i = 0; i <= 140; i++) {
    const hoursOffset = i * stepHours;
    const day = (hoursOffset / 24).toFixed(1);
    const time = new Date(startDate.getTime() + hoursOffset * 3600 * 1000);

    // Compound harmonic libration oscillation
    const phaseLat = (hoursOffset / totalHours) * Math.PI * 2;
    const phaseLon = (hoursOffset / (27.55 * 24)) * Math.PI * 2; // Anomalistic month
    const earthElev = meanElev + librationAmplitude * Math.sin(phaseLat) + 0.8 * Math.cos(phaseLon * 2);

    const hasLineOfSight = earthElev > localRimHeight;
    const linkMarginDb = hasLineOfSight ? (earthElev - localRimHeight) * 3.4 + 18.0 : 0;
    const dataRateKbps = hasLineOfSight ? Math.min(2048, Math.round(512 + linkMarginDb * 65)) : 0;

    points.push({
      day,
      hour: hoursOffset.toFixed(0),
      timestamp: time.toISOString(),
      earthElevation: parseFloat(earthElev.toFixed(2)),
      horizonObstacle: localRimHeight,
      hasLineOfSight,
      commStatus: hasLineOfSight ? 'NOMINAL DTE (X-BAND)' : 'MOUNTAIN OCCULTATION (BLACKOUT)',
      linkMarginDb: parseFloat(linkMarginDb.toFixed(1)),
      dataRateKbps
    });
  }

  return points;
}

/**
 * 3. Calculate Diurnal Regolith & Spacecraft Thermal Cycle
 * Diviner Radiometer Thermal Model (38K cold trap to 245K sunlit peak)
 * @returns {Array} Array of thermal points across illumination cycle
 */
export function generateThermalCycleData(site) {
  const points = [];
  const isPsr = site.isPSR || false;

  for (let t = 0; t <= 100; t += 2) {
    // Phase 0 to 100% of a solar rotation
    const sunAngle = (t / 100) * 360;
    const rad = degToRad(sunAngle);

    let regolithKelvin;
    if (isPsr) {
      // In permanent shadow, strictly geothermally & scatter balanced: 38K - 45K
      regolithKelvin = 40 + Math.sin(rad * 2) * 2.5;
    } else {
      // Sunlit / grazing terrain: swings between night cold (65K - 90K) and daytime sun (205K - 240K)
      const sunFactor = Math.max(0, Math.sin(rad));
      regolithKelvin = 75 + Math.pow(sunFactor, 0.4) * 165;
    }

    const regolithCelsius = regolithKelvin - 273.15;
    
    // Spacecraft internal temperature (protected by Kapton MLI blanket + survival heaters)
    // Nominal operating range: 240K to 300K (-33°C to +27°C)
    const avionicsKelvin = Math.max(245, Math.min(295, 260 + (regolithKelvin - 160) * 0.18));

    points.push({
      progress: t,
      sunAngle: Math.round(sunAngle),
      regolithK: Math.round(regolithKelvin),
      regolithC: Math.round(regolithCelsius),
      avionicsK: Math.round(avionicsKelvin),
      avionicsC: Math.round(avionicsKelvin - 273.15),
      batterySurvival: avionicsKelvin >= 240 ? 'SAFE' : 'HEATER ACTIVE',
      drillThermalState: regolithKelvin < 110 ? 'CRYOGENIC ICE ROCK' : 'REGOLITH GRAIN'
    });
  }

  return points;
}

/**
 * 4. Calculate Water Ice Stability & Sublimation Rate vs. Regolith Depth (0 - 100cm)
 * Explains why NASA VIPER requires a 1-meter TRIDENT percussive drill!
 * @returns {Array} Array of depth slices from 0 cm to 100 cm
 */
export function generateIceDepthProfile() {
  const depths = [];

  for (let d = 0; d <= 100; d += 5) {
    // Thermal penetration depth: diurnal temperature wave attenuates exponentially
    // Skin depth delta ~ 5 to 10 cm in porous lunar regolith!
    // Surface T ~ 140K (mean polar sunlit), decaying toward constant subsurface temperature ~ 85K at 80cm depth.
    const tempK = 85 + 55 * Math.exp(-d / 12.0);

    // Water ice sublimation rate (Hert-Knudsen equation in vacuum):
    // log10(E) = A - B/T -> Sublimation drops by orders of magnitude as temperature drops!
    // At T > 145K: Sublimates in years. At T < 105K: Sublimates at < 1mm per billion years (stable forever!)
    let sublimationRateMmPerGyr;
    let stabilityRating;
    let iceConcentrationWtPct;

    if (tempK > 120) {
      sublimationRateMmPerGyr = Math.round(Math.pow(10, (tempK - 95) / 6.0));
      stabilityRating = 'UNSTABLE (BOILS OFF)';
      iceConcentrationWtPct = 0.05 + (d / 100) * 0.4;
    } else if (tempK > 100) {
      sublimationRateMmPerGyr = parseFloat((120 - tempK).toFixed(1));
      stabilityRating = 'METASTABLE DEPOSIT';
      iceConcentrationWtPct = 1.2 + (d / 40);
    } else {
      sublimationRateMmPerGyr = 0.001; // Less than 1 micrometer per billion years
      stabilityRating = 'PERMANENTLY STABLE ICE';
      iceConcentrationWtPct = 3.5 + Math.min(5.5, (d - 40) * 0.15);
    }

    depths.push({
      depthCm: d,
      depthM: (d / 100).toFixed(2),
      tempK: Math.round(tempK),
      tempC: Math.round(tempK - 273.15),
      sublimationRate: sublimationRateMmPerGyr,
      stabilityRating,
      iceConcentrationWtPct: parseFloat(iceConcentrationWtPct.toFixed(1)),
      tridentReachable: d <= 100
    });
  }

  return depths;
}
