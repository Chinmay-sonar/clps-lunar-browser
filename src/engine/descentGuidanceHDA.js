/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELIOS-DTE Phase 3: Autonomous Lander Descent Guidance & HDA Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Implements real-time Terrain-Relative Navigation (TRN) and Hazard Detection
 * & Avoidance (HDA) for the final terminal descent phase of CLPS/Artemis landers.
 * 
 * Engineering Principles Modeled:
 *   1. Flash LiDAR 3D Point Cloud Scanning (500m to 100m altitude)
 *   2. Planar Normal Surface Fitting & Micro-Slope Angle Computation
 *   3. Boulder / Obstacle Residual Profiling (> 0.35m tipping hazard)
 *   4. Zero-Effort-Miss / Zero-Effort-Velocity (ZEM/ZEV) Fuel-Optimal Divert Guidance
 *   5. Real-Time Autonomous Touchdown Safe Haven Retargeting
 * 
 * References:
 *   - NASA Autonomous Landing and Hazard Avoidance Technology (ALHAT) Project
 *   - Epp & Steen (NASA JSC) "Autonomous Landing Hazard Avoidance Technology"
 *   - D'Souza (2009) "An Optimal Guidance Law for Planetary Landing"
 *   - Intuitive Machines IM-1 Odysseus landing dynamics post-flight analysis
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICAL CONSTANTS & LANDER CONSTRAINTS
// ─────────────────────────────────────────────────────────────────────────────

/** Lunar surface gravitational acceleration (m/s²) */
export const MOON_GRAVITY_MPS2 = 1.625;

/** Maximum safe landing gear slope limit (degrees) */
export const MAX_SAFE_TOUCHDOWN_SLOPE_DEG = 6.0;

/** Critical tip-over slope limit (degrees) */
export const CRITICAL_TIPOVER_SLOPE_DEG = 12.0;

/** Maximum allowable boulder / rock obstacle height for gear clearance (meters) */
export const MAX_SAFE_BOULDER_HEIGHT_M = 0.35;

/** Minimum clear radius required for lander footpad footprint (meters) */
export const MIN_TOUCHDOWN_ZONE_RADIUS_M = 8.0;

/** Maximum lateral divert velocity during HDA maneuver (m/s) */
export const MAX_DIVERT_LATERAL_VELOCITY_MPS = 15.0;

/** Nominal vertical touchdown velocity (m/s) */
export const NOMINAL_TOUCHDOWN_VEL_Z_MPS = -1.0;

// ─────────────────────────────────────────────────────────────────────────────
// SYNTHETIC FLASH LiDAR POINT CLOUD GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a realistic high-density 3D Flash LiDAR point cloud scan
 * of the landing footprint beneath the lander.
 * 
 * @param {Object} options
 * @param {number} options.gridSizeMeters - Size of surveyed square footprint (default 100m)
 * @param {number} options.resolutionMeters - Point spacing (default 1.5m -> ~4,500 points)
 * @param {number} options.baseSlopeDeg - Base regional terrain slope in degrees
 * @param {number} options.baseSlopeAzimuthDeg - Direction of terrain slope
 * @param {Array<Object>} options.obstacles - Custom boulder / crater features
 * @returns {Array<{ x: number, y: number, z: number }>} Array of 3D points
 */
export function generateFlashLidarPointCloud(options = {}) {
  const {
    gridSizeMeters = 100.0,
    resolutionMeters = 1.5,
    baseSlopeDeg = 4.0,
    baseSlopeAzimuthDeg = 45.0,
    obstacles = null
  } = options;

  const halfSize = gridSizeMeters / 2;
  const slopeRad = (baseSlopeDeg * Math.PI) / 180;
  const azRad = (baseSlopeAzimuthDeg * Math.PI) / 180;

  // Slope gradients
  const gradX = Math.sin(slopeRad) * Math.sin(azRad);
  const gradY = Math.sin(slopeRad) * Math.cos(azRad);

  // Pre-generate standard hazardous obstacles if none provided
  const featureList = obstacles || [
    // Boulder field 1 (hazard)
    { type: 'boulder', x: -18, y: 12, height: 0.85, radius: 2.2 },
    { type: 'boulder', x: -15, y: 15, height: 0.65, radius: 1.8 },
    { type: 'boulder', x: -22, y: 8, height: 0.50, radius: 1.5 },
    // Small impact crater with raised rim (hazard)
    { type: 'crater', x: 24, y: -20, depth: 1.8, radius: 6.5 },
    // Isolated sharp rock near nominal center
    { type: 'boulder', x: 4, y: 3, height: 0.58, radius: 1.4 },
    // Another crater flank
    { type: 'crater', x: -28, y: -22, depth: 1.2, radius: 4.8 }
  ];

  const points = [];

  for (let x = -halfSize; x <= halfSize; x += resolutionMeters) {
    for (let y = -halfSize; y <= halfSize; y += resolutionMeters) {
      // Base planar slope
      let z = gradX * x + gradY * y;

      // Add high-frequency micro-regolith roughness
      const micro = 0.08 * Math.sin(x * 1.2 + y * 0.9) +
                    0.05 * Math.cos(x * 2.8 - y * 1.7) +
                    0.03 * Math.sin(x * 5.4 + y * 4.1);
      z += micro;

      // Overlay obstacles
      for (const feat of featureList) {
        const dx = x - feat.x;
        const dy = y - feat.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < feat.radius) {
          const factor = 1.0 - (dist / feat.radius);
          if (feat.type === 'boulder') {
            // Hemisphere dome rock
            z += feat.height * Math.sqrt(Math.max(0, 1.0 - Math.pow(dist / feat.radius, 2)));
          } else if (feat.type === 'crater') {
            // Parabolic crater bowl
            z -= feat.depth * (1.0 - Math.pow(dist / feat.radius, 2));
          }
        }
      }

      points.push({
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        z: parseFloat(z.toFixed(3))
      });
    }
  }

  return points;
}

// ─────────────────────────────────────────────────────────────────────────────
// HAZARD DETECTION & SAFE TOUCHDOWN SELECTION ALGORITHM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyzes a 3D LiDAR point cloud to detect slope hazards, boulders, and craters,
 * and identifies the optimal safe landing haven.
 * 
 * @param {Array<{ x: number, y: number, z: number }>} pointCloud
 * @param {number} patchRadiusMeters - Footprint diameter to evaluate for each candidate center
 * @returns {Object} Hazard map, categorized points, and optimal safe touchdown coordinate
 */
export function analyzeLandingHazards(pointCloud, patchRadiusMeters = MIN_TOUCHDOWN_ZONE_RADIUS_M) {
  if (!pointCloud || pointCloud.length === 0) {
    throw new Error('[HDA] Point cloud must contain at least 1 point');
  }

  // 1. Compute global best-fit reference plane using least squares
  let sumX = 0, sumY = 0, sumZ = 0;
  let sumXX = 0, sumYY = 0, sumXY = 0, sumXZ = 0, sumYZ = 0;
  const N = pointCloud.length;

  for (const p of pointCloud) {
    sumX += p.x;
    sumY += p.y;
    sumZ += p.z;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
    sumXY += p.x * p.y;
    sumXZ += p.x * p.z;
    sumYZ += p.y * p.z;
  }

  // Solve normal equations for z = a*x + b*y + c
  const meanX = sumX / N;
  const meanY = sumY / N;
  const meanZ = sumZ / N;

  const sxx = sumXX - sumX * meanX;
  const syy = sumYY - sumY * meanY;
  const sxy = sumXY - sumX * meanY;
  const sxz = sumXZ - sumX * meanZ;
  const syz = sumYZ - sumY * meanZ;

  const det = sxx * syy - sxy * sxy;
  const planeA = det !== 0 ? (syy * sxz - sxy * syz) / det : 0;
  const planeB = det !== 0 ? (sxx * syz - sxy * sxz) / det : 0;
  const planeC = meanZ - planeA * meanX - planeB * meanY;

  // Regional slope angle from plane normal [planeA, planeB, -1]
  const normalLen = Math.sqrt(planeA * planeA + planeB * planeB + 1.0);
  const regionalSlopeRad = Math.acos(1.0 / normalLen);
  const regionalSlopeDeg = parseFloat(((regionalSlopeRad * 180) / Math.PI).toFixed(2));

  // 2. Classify individual points for residual hazards
  const classifiedPoints = [];
  let totalBoulders = 0;
  let totalDepressions = 0;

  for (const p of pointCloud) {
    const planeZ = planeA * p.x + planeB * p.y + planeC;
    const residual = p.z - planeZ; // Positive = protrusion (boulder), Negative = crater

    let hazardType = 'SAFE';
    if (residual > MAX_SAFE_BOULDER_HEIGHT_M) {
      hazardType = 'BOULDER';
      totalBoulders++;
    } else if (residual < -0.6) {
      hazardType = 'CRATER';
      totalDepressions++;
    }

    classifiedPoints.push({
      ...p,
      residual: parseFloat(residual.toFixed(3)),
      hazardType
    });
  }

  // 3. Candidate landing haven search (sliding circular footprint)
  // Search on a candidate grid across the inner 70% of the surveyed area
  const candidateStep = 3.0; // 3-meter spacing for haven centers
  const searchBound = 35.0; // +/- 35m from nominal center
  let bestHaven = null;
  let maxHavenScore = -1;

  for (let cx = -searchBound; cx <= searchBound; cx += candidateStep) {
    for (let cy = -searchBound; cy <= searchBound; cy += candidateStep) {
      // Collect points inside this landing circle
      let circlePoints = 0;
      let maxBoulderHeight = 0;
      let maxCraterDepth = 0;
      let hazardCount = 0;

      for (const p of classifiedPoints) {
        const dx = p.x - cx;
        const dy = p.y - cy;
        if (dx * dx + dy * dy <= patchRadiusMeters * patchRadiusMeters) {
          circlePoints++;
          if (p.residual > maxBoulderHeight) maxBoulderHeight = p.residual;
          if (p.residual < -maxCraterDepth) maxCraterDepth = -p.residual;
          if (p.hazardType !== 'SAFE') hazardCount++;
        }
      }

      if (circlePoints < 15) continue; // Skip edge patches with insufficient points

      // Calculate candidate suitability score (0 to 100)
      let score = 100;
      
      // Heavy penalty for any boulders > 0.35m
      if (maxBoulderHeight > MAX_SAFE_BOULDER_HEIGHT_M) {
        score -= (maxBoulderHeight - MAX_SAFE_BOULDER_HEIGHT_M) * 120;
      }
      // Penalty for crater depressions
      if (maxCraterDepth > 0.5) {
        score -= (maxCraterDepth - 0.5) * 80;
      }
      // Penalty for number of hazardous points inside footprint
      score -= hazardCount * 4.0;
      
      // Distance from nominal center (minor penalty to minimize unnecessary divert fuel)
      const distFromCenter = Math.sqrt(cx * cx + cy * cy);
      score -= (distFromCenter / searchBound) * 8.0;

      score = Math.round(Math.max(0, Math.min(100, score)));

      if (score > maxHavenScore) {
        maxHavenScore = score;
        bestHaven = {
          x: cx,
          y: cy,
          score,
          clearRadiusM: patchRadiusMeters,
          maxObstacleHeightM: parseFloat(maxBoulderHeight.toFixed(2)),
          maxDepressionDepthM: parseFloat(maxCraterDepth.toFixed(2)),
          divertDistanceM: parseFloat(distFromCenter.toFixed(1)),
          isSafe: score >= 70 && maxBoulderHeight <= MAX_SAFE_BOULDER_HEIGHT_M
        };
      }
    }
  }

  // Fallback haven if somehow no patch scored above 0
  if (!bestHaven) {
    bestHaven = {
      x: 0,
      y: 0,
      score: 50,
      clearRadiusM: patchRadiusMeters,
      maxObstacleHeightM: 0.3,
      maxDepressionDepthM: 0.3,
      divertDistanceM: 0,
      isSafe: true
    };
  }

  return {
    regionalSlopeDeg,
    isRegionalSlopeSafe: regionalSlopeDeg <= MAX_SAFE_TOUCHDOWN_SLOPE_DEG,
    statistics: {
      totalPointsScanned: pointCloud.length,
      bouldersDetected: totalBoulders,
      cratersDetected: totalDepressions,
      hazardDensityPct: parseFloat((( (totalBoulders + totalDepressions) / N) * 100).toFixed(1))
    },
    optimalSafeHaven: bestHaven,
    classifiedPoints: classifiedPoints.slice(0, 1200) // Sample for fast rendering
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIMAL DIVERT GUIDANCE LAW (ZEM / ZEV FEEDBACK CONTROLLER)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the optimal acceleration command vector to divert the lander from its
 * current state to the safe touchdown haven using Zero-Effort-Miss (ZEM) guidance.
 * 
 * Formula: a_cmd = (6 / t_go^2) * (r_target - r - v*t_go) - (2 / t_go) * (v_target - v) + g_moon
 * 
 * @param {Object} state - Current lander state
 * @param {Array<number>} state.pos - [x, y, z] in meters relative to landing zone
 * @param {Array<number>} state.vel - [vx, vy, vz] in m/s
 * @param {Object} target - Target haven state
 * @param {Array<number>} target.pos - [x, y, z] target touchdown position (z ~ 0)
 * @param {Array<number>} target.vel - [vx, vy, vz] target touchdown velocity (e.g. [0, 0, -1.0])
 * @param {number} timeToGoSec - Estimated remaining time to touchdown (t_go > 0)
 * @returns {Object} Guidance command (acceleration vector, thrust magnitude, attitude tilt)
 */
export function computeZemGuidance(state, target, timeToGoSec) {
  const tGo = Math.max(0.5, timeToGoSec);
  const tGoSq = tGo * tGo;

  // Position error & velocity error
  const rErr = [
    target.pos[0] - state.pos[0],
    target.pos[1] - state.pos[1],
    target.pos[2] - state.pos[2]
  ];

  const vErr = [
    target.vel[0] - state.vel[0],
    target.vel[1] - state.vel[1],
    target.vel[2] - state.vel[2]
  ];

  // Zero-Effort-Miss vector: ZEM = r_target - (r + v * t_go)
  const zem = [
    rErr[0] - state.vel[0] * tGo,
    rErr[1] - state.vel[1] * tGo,
    rErr[2] - state.vel[2] * tGo
  ];

  // Zero-Effort-Velocity vector: ZEV = v_target - v
  const zev = [
    target.vel[0] - state.vel[0],
    target.vel[1] - state.vel[1],
    target.vel[2] - state.vel[2]
  ];

  // Optimal Acceleration Command: a_cmd = (6/tGo^2)*ZEM + (2/tGo)*(v_target - v) + [0, 0, g_moon]
  const aCmdX = (6.0 / tGoSq) * zem[0] + (2.0 / tGo) * zev[0];
  const aCmdY = (6.0 / tGoSq) * zem[1] + (2.0 / tGo) * zev[1];
  const aCmdZ = (6.0 / tGoSq) * zem[2] + (2.0 / tGo) * zev[2] + MOON_GRAVITY_MPS2;

  // Total thrust acceleration magnitude (m/s²)
  const aTotal = Math.sqrt(aCmdX * aCmdX + aCmdY * aCmdY + aCmdZ * aCmdZ);

  // Thrust vector attitude: pitch and yaw tilt from vertical zenith
  const lateralAccel = Math.sqrt(aCmdX * aCmdX + aCmdY * aCmdY);
  const tiltFromVerticalDeg = (Math.atan2(lateralAccel, Math.max(0.01, aCmdZ)) * 180) / Math.PI;
  const thrustAzimuthDeg = ((Math.atan2(aCmdX, aCmdY) * 180 / Math.PI) + 360) % 360;

  // Delta-V consumed estimation for divert
  const lateralZem = Math.sqrt(zem[0] * zem[0] + zem[1] * zem[1]);
  const estimatedDivertDeltaVMps = (lateralZem / tGo) * 1.5;

  return {
    timeToGoSec: parseFloat(tGo.toFixed(1)),
    accelCmdMps2: [
      parseFloat(aCmdX.toFixed(3)),
      parseFloat(aCmdY.toFixed(3)),
      parseFloat(aCmdZ.toFixed(3))
    ],
    thrustAccelMps2: parseFloat(aTotal.toFixed(2)),
    thrustAttitude: {
      tiltFromVerticalDeg: parseFloat(tiltFromVerticalDeg.toFixed(1)),
      thrustAzimuthDeg: parseFloat(thrustAzimuthDeg.toFixed(1))
    },
    zeroEffortMissMeters: {
      lateral: parseFloat(lateralZem.toFixed(2)),
      vertical: parseFloat(Math.abs(zem[2]).toFixed(2))
    },
    estimatedDivertDeltaVMps: parseFloat(estimatedDivertDeltaVMps.toFixed(1))
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE TERMINAL DESCENT PROFILE SIMULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates a complete closed-loop terminal descent trajectory from 500m to touchdown.
 * 
 * @param {Object} options
 * @param {Array<number>} options.initialAltitude - Starting height in meters (default 500)
 * @param {Array<number>} options.nominalTarget - Nominal landing center [x, y]
 * @param {Array<Object>} options.obstacles - Surface obstacles for HDA evaluation
 * @returns {Object} Complete descent trajectory, HDA analysis, and touchdown metrics
 */
export function simulateTerminalDescent(options = {}) {
  const {
    initialAltitude = 500.0,
    nominalTarget = [0, 0],
    obstacles = null
  } = options;

  // 1. Generate LiDAR scan of the landing footprint
  const pointCloud = generateFlashLidarPointCloud({
    gridSizeMeters: 100.0,
    resolutionMeters: 2.0,
    baseSlopeDeg: 3.5,
    obstacles
  });

  // 2. Perform HDA hazard analysis & locate safe haven
  const hdaResult = analyzeLandingHazards(pointCloud, MIN_TOUCHDOWN_ZONE_RADIUS_M);
  const targetHaven = hdaResult.optimalSafeHaven;

  // Target touchdown state at the safe haven
  const targetState = {
    pos: [targetHaven.x, targetHaven.y, 0.0],
    vel: [0.0, 0.0, NOMINAL_TOUCHDOWN_VEL_Z_MPS]
  };

  // Initial lander state at h = 500m
  let state = {
    pos: [nominalTarget[0], nominalTarget[1], initialAltitude],
    vel: [12.0, 4.0, -14.0], // Initial descending glide
    timeSec: 0
  };

  const trajectory = [];
  const dt = 0.2; // 0.2-second integration time step for numerical stability
  let totalDeltaVMps = 0;
  let hasTouchdown = false;
  const nominalDurationSec = 40.0;

  while (!hasTouchdown && state.timeSec < 75.0) {
    const tGo = Math.max(3.0, nominalDurationSec - state.timeSec);
    let guidance = computeZemGuidance(state, targetState, tGo);

    // Terminal Touchdown Gate: below 12m altitude, switch to pure vertical descent & null horizontal drift
    if (state.pos[2] < 12.0) {
      guidance.accelCmdMps2[0] = -state.vel[0] * 2.0;
      guidance.accelCmdMps2[1] = -state.vel[1] * 2.0;
      guidance.accelCmdMps2[2] = MOON_GRAVITY_MPS2 + (NOMINAL_TOUCHDOWN_VEL_Z_MPS - state.vel[2]) * 1.8;
      guidance.thrustAccelMps2 = Math.sqrt(
        guidance.accelCmdMps2[0] * guidance.accelCmdMps2[0] +
        guidance.accelCmdMps2[1] * guidance.accelCmdMps2[1] +
        guidance.accelCmdMps2[2] * guidance.accelCmdMps2[2]
      );
      guidance.thrustAttitude.tiltFromVerticalDeg = 0.0;
    }

    trajectory.push({
      timeSec: parseFloat(state.timeSec.toFixed(1)),
      altitudeM: parseFloat(state.pos[2].toFixed(1)),
      posX: parseFloat(state.pos[0].toFixed(1)),
      posY: parseFloat(state.pos[1].toFixed(1)),
      velZ: parseFloat(state.vel[2].toFixed(2)),
      velLateral: parseFloat(Math.sqrt(state.vel[0] * state.vel[0] + state.vel[1] * state.vel[1]).toFixed(2)),
      thrustAccel: parseFloat(guidance.thrustAccelMps2.toFixed(2)),
      tiltDeg: parseFloat(guidance.thrustAttitude.tiltFromVerticalDeg.toFixed(1)),
      zemMeters: guidance.zeroEffortMissMeters.lateral
    });

    // Accumulate delta-V
    totalDeltaVMps += guidance.thrustAccelMps2 * dt;

    // Euler integration of lander equations of motion
    // Net acceleration: a_cmd - [0, 0, g_moon]
    state.vel[0] += guidance.accelCmdMps2[0] * dt;
    state.vel[1] += guidance.accelCmdMps2[1] * dt;
    state.vel[2] += (guidance.accelCmdMps2[2] - MOON_GRAVITY_MPS2) * dt;

    state.pos[0] += state.vel[0] * dt;
    state.pos[1] += state.vel[1] * dt;
    state.pos[2] += state.vel[2] * dt;
    state.timeSec += dt;

    // Touchdown trigger when altitude reaches 0
    if (state.pos[2] <= 0.0) {
      hasTouchdown = true;
      state.pos[2] = 0.0;
    }
  }

  const finalVelocityZ = Math.abs(state.vel[2]);
  const finalLateralVelocity = Math.sqrt(state.vel[0] * state.vel[0] + state.vel[1] * state.vel[1]);
  const missDistanceM = Math.sqrt(
    Math.pow(state.pos[0] - targetHaven.x, 2) + Math.pow(state.pos[1] - targetHaven.y, 2)
  );

  const touchdownSafe =
    finalVelocityZ <= 2.0 &&
    finalLateralVelocity <= 0.5 &&
    missDistanceM <= 3.0 &&
    targetHaven.isSafe;

  return {
    hdaAnalysis: hdaResult,
    trajectorySummary: {
      totalDescentTimeSec: parseFloat(state.timeSec.toFixed(1)),
      totalDeltaVExpendedMps: parseFloat(totalDeltaVMps.toFixed(1)),
      touchdownCoordinates: {
        x: parseFloat(state.pos[0].toFixed(2)),
        y: parseFloat(state.pos[1].toFixed(2))
      },
      missDistanceM: parseFloat(missDistanceM.toFixed(2)),
      touchdownVelocities: {
        verticalMps: parseFloat(finalVelocityZ.toFixed(2)),
        lateralMps: parseFloat(finalLateralVelocity.toFixed(2))
      },
      isTouchdownSuccess: touchdownSafe,
      outcomeClassification: touchdownSafe ? 'NOMINAL_SOFT_TOUCHDOWN' : 'HAZARD_ABORT'
    },
    trajectoryWaypoints: trajectory
  };
}
