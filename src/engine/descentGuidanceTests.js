/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELIOS-DTE Phase 3: Descent Guidance & HDA Engine Automated Test Suite
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Benchmarks and validates:
 *   1. Flash LiDAR 3D Point Cloud Generation & Micro-Topography
 *   2. Least-Squares Reference Plane Fitting & Slope Angle Recovery
 *   3. Hazard Identification (Boulders > 0.35m & Crater Depressions)
 *   4. Sliding-Footprint Haven Search & Clear Radius Extraction
 *   5. Zero-Effort-Miss / Zero-Effort-Velocity (ZEM/ZEV) Guidance Law
 *   6. Closed-Loop Terminal Descent Trajectory Convergence to Touchdown
 * 
 * Run with: node src/engine/descentGuidanceTests.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  MOON_GRAVITY_MPS2,
  MAX_SAFE_TOUCHDOWN_SLOPE_DEG,
  MAX_SAFE_BOULDER_HEIGHT_M,
  MIN_TOUCHDOWN_ZONE_RADIUS_M,
  generateFlashLidarPointCloud,
  analyzeLandingHazards,
  computeZemGuidance,
  simulateTerminalDescent
} from './descentGuidanceHDA.js';

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
// Test Suite 1: Point Cloud Generation & Planar Surface Fitting
// ─────────────────────────────────────────────────────────────────────────────

function testPointCloudAndPlaneFitting() {
  printHeader('SUITE 1: Flash LiDAR Point Cloud & Least-Squares Plane Fitting');

  // Test 1: Point cloud density
  const cloud = generateFlashLidarPointCloud({
    gridSizeMeters: 100.0,
    resolutionMeters: 2.0,
    baseSlopeDeg: 4.5,
    baseSlopeAzimuthDeg: 60.0
  });

  assert(cloud.length >= 2500, `Point cloud contains >= 2,500 points (actual: ${cloud.length})`);

  // Test 2: Least-squares plane recovery
  const analysis = analyzeLandingHazards(cloud, MIN_TOUCHDOWN_ZONE_RADIUS_M);
  assert(
    Math.abs(analysis.regionalSlopeDeg - 4.5) <= 0.5,
    `Regional slope recovered accurately: ${analysis.regionalSlopeDeg}° (expected: 4.5° ± 0.5°)`
  );

  assert(analysis.isRegionalSlopeSafe, `Slope 4.5° satisfies safe landing gear limit (<= 6.0°)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 2: Boulder & Micro-Crater Hazard Classification
// ─────────────────────────────────────────────────────────────────────────────

function testHazardClassification() {
  printHeader('SUITE 2: Boulder Residual Profiling & Hazard Classification');

  // Inject a known hazardous boulder at [10, 10] with height 0.9m
  const cloud = generateFlashLidarPointCloud({
    gridSizeMeters: 80.0,
    resolutionMeters: 2.0,
    baseSlopeDeg: 2.0,
    obstacles: [
      { type: 'boulder', x: 10, y: 10, height: 0.90, radius: 2.5 },
      { type: 'crater', x: -15, y: -15, depth: 1.5, radius: 5.0 }
    ]
  });

  const analysis = analyzeLandingHazards(cloud, 8.0);

  assert(analysis.statistics.bouldersDetected >= 1,
    `Successfully detected injected boulder hazards (boulders: ${analysis.statistics.bouldersDetected})`);
  assert(analysis.statistics.cratersDetected >= 1,
    `Successfully detected injected crater hazard (craters: ${analysis.statistics.cratersDetected})`);

  // Verify optimal safe haven was placed away from the boulder at [10, 10]
  const haven = analysis.optimalSafeHaven;
  const distToBoulder = Math.sqrt(Math.pow(haven.x - 10, 2) + Math.pow(haven.y - 10, 2));
  assert(distToBoulder > 8.0,
    `Optimal haven successfully placed away from boulder: ${distToBoulder.toFixed(1)}m separation`);
  assert(haven.isSafe, `Haven verified safe for touchdown (score: ${haven.score}%)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 3: ZEM / ZEV Optimal Divert Guidance Law
// ─────────────────────────────────────────────────────────────────────────────

function testZemGuidance() {
  printHeader('SUITE 3: Zero-Effort-Miss (ZEM) Guidance Law Evaluation');

  // Test lander at 200m altitude with lateral miss of 30m
  const state = {
    pos: [30.0, 0.0, 200.0],
    vel: [5.0, 0.0, -10.0]
  };

  const target = {
    pos: [0.0, 0.0, 0.0],
    vel: [0.0, 0.0, -1.0]
  };

  const tGo = 20.0;
  const cmd = computeZemGuidance(state, target, tGo);

  // Command must push laterally toward negative X to correct the +30m miss
  assert(cmd.accelCmdMps2[0] < 0,
    `Lateral acceleration correctly commands negative X thrust to null miss (ax = ${cmd.accelCmdMps2[0]} m/s²)`);

  // Vertical acceleration must exceed lunar gravity (1.625 m/s²) to decelerate vertical velocity from -10 to -1 m/s
  assert(cmd.accelCmdMps2[2] > MOON_GRAVITY_MPS2,
    `Vertical acceleration provides upward deceleration thrust (az = ${cmd.accelCmdMps2[2]} m/s² > 1.625 m/s²)`);

  // Thrust tilt from vertical should remain within aerodynamic / thruster gimbal envelope (< 45°)
  assert(cmd.thrustAttitude.tiltFromVerticalDeg < 45.0,
    `Thrust vector tilt within acceptable envelope: ${cmd.thrustAttitude.tiltFromVerticalDeg}°`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 4: Closed-Loop Terminal Descent Trajectory Simulation
// ─────────────────────────────────────────────────────────────────────────────

function testTerminalDescentSimulation() {
  printHeader('SUITE 4: Closed-Loop Terminal Descent & Touchdown Convergence');

  const tStart = Date.now();
  const sim = simulateTerminalDescent({
    initialAltitude: 500.0,
    nominalTarget: [0, 0]
  });
  const durationMs = Date.now() - tStart;

  console.log(`  Descent simulation integrated in ${durationMs} ms (${sim.trajectoryWaypoints.length} waypoints)`);
  console.log(`  Touchdown result: ${sim.trajectorySummary.outcomeClassification}`);
  console.log(`  Touchdown velocities: vz = ${sim.trajectorySummary.touchdownVelocities.verticalMps} m/s, v_lat = ${sim.trajectorySummary.touchdownVelocities.lateralMps} m/s`);
  console.log(`  Miss distance to haven: ${sim.trajectorySummary.missDistanceM} m`);

  assert(sim.trajectorySummary.isTouchdownSuccess, `Closed-loop descent achieved NOMINAL_SOFT_TOUCHDOWN`);
  assert(sim.trajectorySummary.touchdownVelocities.verticalMps <= 2.0,
    `Vertical touchdown velocity <= 2.0 m/s (actual: ${sim.trajectorySummary.touchdownVelocities.verticalMps} m/s)`);
  assert(sim.trajectorySummary.touchdownVelocities.lateralMps <= 0.5,
    `Lateral touchdown velocity <= 0.5 m/s (actual: ${sim.trajectorySummary.touchdownVelocities.lateralMps} m/s)`);
  assert(sim.trajectorySummary.missDistanceM <= 3.0,
    `Guidance achieved pinpoint touchdown within 3.0m of safe haven (miss: ${sim.trajectorySummary.missDistanceM} m)`);
  assert(durationMs < 100, `Descent simulation completed in under 100ms (actual: ${durationMs}ms)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Test Runner
// ─────────────────────────────────────────────────────────────────────────────

function runPhase3Tests() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║       HELIOS-DTE PHASE 3 ENGINE AUTOMATED VALIDATION SUITE         ║');
  console.log('║    Autonomous Lander Descent Guidance & HDA Retargeting Engine     ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  testPointCloudAndPlaneFitting();
  testHazardClassification();
  testZemGuidance();
  testTerminalDescentSimulation();

  console.log('\n' + '═'.repeat(70));
  console.log(` PHASE 3 VALIDATION SUMMARY: ${passedTests} PASSED / ${failedTests} FAILED (${totalTests} total)`);
  console.log('═'.repeat(70) + '\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase3Tests();
