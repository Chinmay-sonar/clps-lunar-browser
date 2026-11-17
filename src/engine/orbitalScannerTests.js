/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELIOS-DTE Phase 2: Orbital Scanner & Hazard Engine Automated Test Suite
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Benchmarks and validates:
 *   1. Orbital Mechanics & Polar Ground Track Propagation
 *   2. LOLA LiDAR Topography, Slope & Crater Depth Classification
 *   3. LEND Neutron Spectrometer Water Ice Yield & Diviner Thermals
 *   4. Multi-Criteria Decision Analysis (MCDA) Landing Suitability Scoring
 *   5. Autonomous Safe Corridor Extraction & PDI Descent Vectors
 * 
 * Run with: node src/engine/orbitalScannerTests.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  MOON_GM,
  MOON_MEAN_RADIUS_KM,
  NOMINAL_ORBIT_ALTITUDE_KM,
  NOMINAL_ORBITAL_VELOCITY_KM_S,
  NOMINAL_ORBITAL_PERIOD_SEC,
  NOMINAL_ORBITAL_PERIOD_HOURS,
  SAFETY_THRESHOLDS,
  computeOrbitalGroundTrack,
  evaluateSurfaceCell,
  computeCellSuitabilityScore,
  executeOrbitalReconnaissance
} from './orbitalScanner.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

function printHeader(title) {
  console.log('\n' + '═'.repeat(70));
  console.log(` ${title}`);
  console.log('═'.repeat(70));
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 1: Orbital Mechanics & Ground Track Propagation
// ─────────────────────────────────────────────────────────────────────────────

function testOrbitalMechanics() {
  printHeader('SUITE 1: Orbital Dynamics & Polar Ground Track Propagation');

  // Velocity in 100km circular orbit: sqrt(GM/a) ~ 1.633 km/s
  const expectedVel = Math.sqrt(MOON_GM / (MOON_MEAN_RADIUS_KM + NOMINAL_ORBIT_ALTITUDE_KM));
  assert(
    Math.abs(NOMINAL_ORBITAL_VELOCITY_KM_S - expectedVel) < 0.001,
    `Orbital velocity matches circular keplerian velocity: ${NOMINAL_ORBITAL_VELOCITY_KM_S.toFixed(4)} km/s`
  );

  // Period ~ 7068 sec (~1.963 hours)
  assert(
    NOMINAL_ORBITAL_PERIOD_HOURS >= 1.95 && NOMINAL_ORBITAL_PERIOD_HOURS <= 1.98,
    `Orbital period matches low lunar orbit period: ${NOMINAL_ORBITAL_PERIOD_HOURS.toFixed(3)} hours`
  );

  // Ground track propagation over 1 orbit
  const track = computeOrbitalGroundTrack(0, 100);
  assert(track.length === 100, `Propagated 100 ground track points for Rev 0`);

  // Verify latitude reaches extreme South Pole (-90°)
  const minLat = Math.min(...track.map(p => p.lat));
  assert(minLat <= -89.0, `Ground track sweeps across extreme South Pole: min lat = ${minLat.toFixed(2)}°`);

  // Verify multi-rev nodal shift (tracks shift across longitudes as Moon rotates)
  const trackRev0 = computeOrbitalGroundTrack(0, 10);
  const trackRev5 = computeOrbitalGroundTrack(5, 10);
  const lonShift = Math.abs(trackRev5[5].lon - trackRev0[5].lon);
  assert(lonShift > 2.0, `Multi-revolution ground tracks shift in longitude due to lunar rotation (shift: ${lonShift.toFixed(2)}°)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 2: Multi-Instrument Sensor Evaluation & Physical Regimes
// ─────────────────────────────────────────────────────────────────────────────

function testMultiInstrumentSensors() {
  printHeader('SUITE 2: Multi-Instrument Sensor Readings (LOLA, LEND, Diviner)');

  const testEpoch = new Date('2026-12-05T08:00:00Z');

  // Test 1: Malapert Massif Peak (Elevation > 4000m, high sunlight, low ice)
  const malapert = evaluateSurfaceCell(-85.9, -2.9, testEpoch);
  assert(malapert.topography.elevationM > 3500,
    `Malapert Massif high elevation detected (elevation: ${malapert.topography.elevationM} m)`);
  assert(malapert.thermal.surfaceTempK > 180,
    `Malapert summit warm sunlit thermal regime: ${malapert.thermal.surfaceTempK} K`);
  assert(malapert.volatiles.waterIceWEH < 1.0,
    `Malapert sunlit summit shows volatile-depleted surface (< 1.0 wt% WEH)`);

  // Test 2: Cabeus Crater PSR Floor (LCROSS confirmed ice: 40K, extreme WEH)
  const cabeus = evaluateSurfaceCell(-84.9, -35.5, testEpoch);
  assert(cabeus.thermal.surfaceTempK <= 55,
    `Cabeus crater cryogenic PSR cold trap detected: ${cabeus.thermal.surfaceTempK} K (LCROSS ground truth)`);
  assert(cabeus.volatiles.waterIceWEH >= 3.0,
    `Cabeus crater ultra-high water ice abundance: ${cabeus.volatiles.waterIceWEH} wt% WEH (LCROSS target)`);

  // Test 3: Mons Mouton Landing Plateau (Flat, gentle slope <= 8.5°)
  const mouton = evaluateSurfaceCell(-84.9, 29.5, testEpoch);
  assert(mouton.topography.slopeDeg <= 12.0,
    `Mons Mouton gentle plateau slopes detected: ${mouton.topography.slopeDeg}°`);
  assert(mouton.topography.slopeCategory !== 'HAZARD_STEEP',
    `Mons Mouton classified as traversable (category: ${mouton.topography.slopeCategory})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 3: Multi-Criteria Scoring (MCDA) Algorithm
// ─────────────────────────────────────────────────────────────────────────────

function testMCDAScoring() {
  printHeader('SUITE 3: Multi-Criteria Decision Analysis (MCDA) Scoring Logic');

  // Case 1: Ideal flat sunlit rim cell
  const idealCell = computeCellSuitabilityScore({
    slopeDeg: 3.5,
    roughnessRmsM: 0.25,
    surfaceTempK: 210,
    waterIceWEH: 2.1,
    isSunLit: true,
    sunElevation: 1.5,
    isEarthVisible: true,
    earthElevation: 5.2,
    isInsideCrater: false,
    minFeatureDistKm: 1.8
  });

  assert(idealCell.compositeScore >= 75,
    `Ideal terrain scores in Prime Landing Zone (composite: ${idealCell.compositeScore}%, risk: ${idealCell.riskLevel})`);
  assert(idealCell.subscores.slope === 100, `Slope <= 5° receives 100% safety score`);
  assert(idealCell.subscores.dteComms === 100, `Unobstructed Earth elevation receives 100% comms score`);

  // Case 2: Dangerous 22° crater wall (Inevitable Tip-Over)
  const steepWall = computeCellSuitabilityScore({
    slopeDeg: 22.0,
    roughnessRmsM: 0.85,
    surfaceTempK: 150,
    waterIceWEH: 0.5,
    isSunLit: false,
    sunElevation: -1.0,
    isEarthVisible: false,
    earthElevation: -2.0,
    isInsideCrater: true,
    minFeatureDistKm: 0.5
  });

  assert(steepWall.subscores.slope === 0, `Slope > 15° gets immediate 0 score on slope safety`);
  assert(steepWall.riskLevel === 'CRITICAL_HAZARD',
    `Steep crater wall classified as CRITICAL_HAZARD (composite score: ${steepWall.compositeScore}%)`);
  assert(steepWall.penaltyDeduction >= 35, `Steep slope triggers severe hazard penalty (deduction: ${steepWall.penaltyDeduction})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 4: Regional Reconnaissance & Safe Corridor Extraction
// ─────────────────────────────────────────────────────────────────────────────

function testRegionalReconnaissance() {
  printHeader('SUITE 4: Regional Reconnaissance Survey & Landing Corridor Extraction');

  const testEpoch = new Date('2026-12-05T08:00:00Z');
  const t0 = Date.now();

  const survey = executeOrbitalReconnaissance({
    minLat: -89.5,
    maxLat: -84.5,
    minLon: -180.0,
    maxLon: 180.0,
    gridResolution: 0.5, // ~15 km grid
    simDate: testEpoch
  });

  const durationMs = Date.now() - t0;
  console.log(`  Scanned ${survey.surveyMetadata.gridPointsScanned} grid cells in ${durationMs} ms (${survey.surveyMetadata.surveyedAreaKm2.toLocaleString()} km² surveyed)`);

  assert(survey.surveyMetadata.gridPointsScanned >= 100,
    `Survey evaluated >= 100 spatial cells (actual: ${survey.surveyMetadata.gridPointsScanned})`);
  assert(durationMs < 1000, `Survey completed within 1000ms budget (actual: ${durationMs}ms)`);

  // Verify Top Corridors Extracted
  assert(survey.topLandingCorridors.length === 3,
    `Autonomous corridor extractor identified exactly 3 safe haven candidates`);

  const alpha = survey.topLandingCorridors[0];
  console.log(`  Prime Haven-Alpha: Lat ${alpha.coordinates.lat}°, Lon ${alpha.coordinates.lon}°, Score ${alpha.compositeScore}%, Slope ${alpha.slopeDegrees}°, Ice ${alpha.waterIceYieldWEH} wt%`);

  assert(alpha.slopeDegrees <= SAFETY_THRESHOLDS.SLOPE_MAX_SAFE_DEG,
    `Haven-Alpha slope satisfies maximum safe gear threshold (slope: ${alpha.slopeDegrees}°)`);
  assert(alpha.compositeScore >= 65,
    `Haven-Alpha meets prime / acceptable qualification score (${alpha.compositeScore}%)`);
  assert(alpha.pdiVector && alpha.pdiVector.deltaVMps > 1000,
    `Computed Powered Descent Initiation (PDI) guidance delta-V vector (${alpha.pdiVector.deltaVMps} m/s)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Test Runner
// ─────────────────────────────────────────────────────────────────────────────

function runPhase2Tests() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║       HELIOS-DTE PHASE 2 ENGINE AUTOMATED VALIDATION SUITE         ║');
  console.log('║      AI/ML Orbital Surface Scanner & Hazard Detection Engine       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  testOrbitalMechanics();
  testMultiInstrumentSensors();
  testMCDAScoring();
  testRegionalReconnaissance();

  console.log('\n' + '═'.repeat(70));
  console.log(` PHASE 2 VALIDATION SUMMARY: ${passedTests} PASSED / ${failedTests} FAILED (${totalTests} total)`);
  console.log('═'.repeat(70) + '\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase2Tests();
