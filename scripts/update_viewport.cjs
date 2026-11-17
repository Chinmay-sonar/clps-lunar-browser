const fs = require('fs');
let code = fs.readFileSync('src/components/Viewport3D.jsx', 'utf8');

// 1. Update computeRoverTerrainContact
const oldContact = `  // Maximum contact height constraint:
  // To ensure NO wheel ever sinks below the terrain surface even over bumps, crater rims, or ridges:
  let maxRequiredBase = -Infinity;
  let sumBase = 0;
  for (let i = 0; i < wheels.length; i++) {
    const tiltOffset = wheels[i].lz * sinP + wheels[i].lx * sinR;
    const reqBase = wheelWorldElevs[i] - tiltOffset;
    if (reqBase > maxRequiredBase) {
      maxRequiredBase = reqBase;
    }
    sumBase += reqBase;
  }

  // Exact wheel tread ground clearance (+0.205m = wheel radius 0.189m + 0.016m mesh facet buffer)
  // Ensures tire treads sit with zero embed and zero hover directly on the regolith surface
  const avgBase = sumBase / wheels.length;
  const WHEEL_GROUND_CLEARANCE = 0.205;
  const yBase = Math.max(maxRequiredBase, avgBase) + WHEEL_GROUND_CLEARANCE;

  // Compute individual suspension articulation deltas for all 6 rocker-bogie arms
  // Relative to nominal axle position (targetAxleY = wheelWorldElev + WHEEL_GROUND_CLEARANCE)
  const suspDeltas = wheels.map((w, i) => {
    const tiltOffset = wheels[i].lz * sinP + wheels[i].lx * sinR;
    const rigidAxleY = yBase + tiltOffset;
    const targetAxleY = wheelWorldElevs[i] + WHEEL_GROUND_CLEARANCE;
    return targetAxleY - rigidAxleY;
  });`;

const newContact = `  // Maximum contact height constraint:
  // For each wheel at local (lx, lz), with rotation (-pitch, heading, roll, 'YXZ'),
  // the vertical displacement due to chassis tilt is: tiltOffset = -wheels[i].lz * sinP + wheels[i].lx * sinR.
  let maxRequiredBase = -Infinity;
  for (let i = 0; i < wheels.length; i++) {
    const tiltOffset = -wheels[i].lz * sinP + wheels[i].lx * sinR;
    const reqBase = wheelWorldElevs[i] - tiltOffset;
    if (reqBase > maxRequiredBase) {
      maxRequiredBase = reqBase;
    }
  }

  // Exact 0.000m clearance: Curiosity 3D model local lowest tire points are at Y = 0.000m.
  // Setting yBase = maxRequiredBase ensures wheel treads sit flush directly on the regolith surface
  // with zero penetration into the ground and zero floating air gap.
  const yBase = maxRequiredBase;

  // Compute individual suspension articulation deltas for all 6 rocker-bogie arms
  // Relative to nominal axle position so all 6 wheels maintain firm contact with the regolith
  const suspDeltas = wheels.map((w, i) => {
    const tiltOffset = -w.lz * sinP + w.lx * sinR;
    const rigidAxleY = yBase + tiltOffset;
    const targetAxleY = wheelWorldElevs[i];
    return targetAxleY - rigidAxleY;
  });`;

if (code.includes(oldContact)) {
  code = code.replace(oldContact, newContact);
  console.log('1. Successfully replaced computeRoverTerrainContact');
} else {
  console.error('1. Could not find oldContact');
}

// 2. Initial Apollo LM position
code = code.replace(
  'apolloLM.group.position.set(0, 0, 0);',
  'apolloLM.group.position.set(0, getSiteElevation(0, 0, currentSiteId), 0);'
);
console.log('2. Apollo LM initial ground Y set');

// 3. Initial Viper Rover rotation roll
code = code.replace(
  "viperRover.group.rotation.set(-initialContact.pitch, 0, -initialContact.roll, 'YXZ');",
  "viperRover.group.rotation.set(-initialContact.pitch, 0, initialContact.roll, 'YXZ');"
);
console.log('3. Initial Viper Rover roll fixed');

// 4. Spline contact rotation roll
code = code.replace(
  "viperRoverRef.current.group.rotation.set(-splineContact.pitch, roverHeading, -splineContact.roll, 'YXZ');",
  "viperRoverRef.current.group.rotation.set(-splineContact.pitch, roverHeading, splineContact.roll, 'YXZ');"
);
console.log('4. Spline contact roll fixed');

// 5. Free driving rotation roll
code = code.replace(
  "viperRoverRef.current.group.rotation.set(-contact.pitch, rover.heading, -contact.roll, 'YXZ');",
  "viperRoverRef.current.group.rotation.set(-contact.pitch, rover.heading, contact.roll, 'YXZ');"
);
console.log('5. Free driving roll fixed');

// 6. Apollo LM descent height
code = code.replace(
  'const yGround = 0;\n          if (apolloLMRef.current) {\n            apolloLMRef.current.group.position.set(0, yGround + curAlt, 0);',
  'const lmGroundY = getSiteElevation(0, 0, currentSiteId);\n          if (apolloLMRef.current) {\n            apolloLMRef.current.group.position.set(0, lmGroundY + curAlt, 0);'
);
code = code.replace('groundY: yGround', 'groundY: lmGroundY');
console.log('6. Descent height fixed');

// 7. Apollo LM touchdown height
code = code.replace(
  `          if (apolloLMRef.current) {
            apolloLMRef.current.group.position.set(0, 0, 0);
            apolloLMRef.current.group.rotation.set(0, 0, 0);
            apolloLMRef.current.update(dt, {
              altitude: 0,
              throttle: 0,
              rampDeployed: true,
              groundY: 0
            });
          }`,
  `          const lmGroundY = getSiteElevation(0, 0, currentSiteId);
          if (apolloLMRef.current) {
            apolloLMRef.current.group.position.set(0, lmGroundY, 0);
            apolloLMRef.current.group.rotation.set(0, 0, 0);
            apolloLMRef.current.update(dt, {
              altitude: 0,
              throttle: 0,
              rampDeployed: true,
              groundY: lmGroundY
            });
          }`
);
console.log('7. Touchdown height fixed');

// 8. ROVER_DEPLOY sequence
const oldDeploy = `        } else if (landingSeq.phase === 'ROVER_DEPLOY') {
          // Phase 4: Rover Rollout down egress ramp onto lunar surface (8.6s to 11.6s)
          const deployDuration = 3.0;
          const tau = Math.min(1.0, (t - 8.6) / deployDuration);
          const zPos = 2.0 + tau * 3.4; // 2.0 down to 5.4
          let yPos = 2.0;
          if (zPos < 4.2) {
            yPos = 2.0 + 1.35 - (zPos - 2.0) * (1.35 / 2.2); // on ramp
          } else {
            const rolloutContact = computeRoverTerrainContact(0, zPos, 0, currentSiteId);
            yPos = rolloutContact.yBase; // on ground
          }

          if (viperRoverRef.current) {
            viperRoverRef.current.group.visible = true;
            viperRoverRef.current.group.position.set(0, yPos, zPos);
            viperRoverRef.current.group.rotation.set(zPos < 4.2 ? 0.38 : 0, 0, 0);
            viperRoverRef.current.update(dt, 1.2, true, 0, 0);
          }

          if (apolloLMRef.current) {
            apolloLMRef.current.update(dt, { altitude: 0, throttle: 0, rampDeployed: true, groundY: 0 });
          }`;

const newDeploy = `        } else if (landingSeq.phase === 'ROVER_DEPLOY') {
          // Phase 4: Rover Rollout down egress ramp onto lunar surface (8.6s to 11.6s)
          const lmGroundY = getSiteElevation(0, 0, currentSiteId);
          const deployDuration = 3.0;
          const tau = Math.min(1.0, (t - 8.6) / deployDuration);
          const zPos = 2.0 + tau * 3.2; // 2.0 down to 5.2
          let yPos = lmGroundY;
          if (zPos < 4.2) {
            const rampT = (zPos - 2.0) / 2.2;
            yPos = lmGroundY + 1.25 * (1.0 - rampT); // on ramp
            const rampPitch = Math.atan2(1.25, 2.2);
            if (viperRoverRef.current) {
              viperRoverRef.current.group.visible = true;
              viperRoverRef.current.group.position.set(0, yPos, zPos);
              viperRoverRef.current.group.rotation.set(-rampPitch, 0, 0);
              viperRoverRef.current.update(dt, 1.2, true, 0, 0);
            }
          } else {
            const rolloutContact = computeRoverTerrainContact(0, zPos, 0, currentSiteId);
            yPos = rolloutContact.yBase; // on ground
            if (viperRoverRef.current) {
              viperRoverRef.current.group.visible = true;
              viperRoverRef.current.group.position.set(0, yPos, zPos);
              viperRoverRef.current.group.rotation.set(-rolloutContact.pitch, 0, rolloutContact.roll, 'YXZ');
              viperRoverRef.current.setSuspensionDeltas(rolloutContact.suspDeltas);
              viperRoverRef.current.update(dt, 1.2, true, 0, 0);
            }
          }

          if (apolloLMRef.current) {
            apolloLMRef.current.update(dt, { altitude: 0, throttle: 0, rampDeployed: true, groundY: lmGroundY });
          }`;

if (code.includes(oldDeploy)) {
  code = code.replace(oldDeploy, newDeploy);
  console.log('8. ROVER_DEPLOY updated');
} else {
  console.error('8. Could not find oldDeploy');
}

// 9. skipLandingToSurface
const oldSkip = `    if (apolloLMRef.current) {
      apolloLMRef.current.group.visible = true;
      apolloLMRef.current.group.position.set(0, 0, 0);
      apolloLMRef.current.group.rotation.set(0, 0, 0);
      apolloLMRef.current.update(0.1, { altitude: 0, throttle: 0, rampDeployed: true, groundY: 0 });
    }
    if (griffinLanderRef.current) griffinLanderRef.current.group.visible = false;
    if (novaCLanderRef.current) novaCLanderRef.current.group.visible = false;

    if (viperRoverRef.current) {
      viperRoverRef.current.group.visible = true;
      const contact = computeRoverTerrainContact(0, 5.5, 0, selectedSite?.id);
      viperRoverRef.current.group.position.set(0, contact.yBase, 5.5);
      viperRoverRef.current.group.rotation.set(-contact.pitch, 0, contact.roll, 'YXZ');
    }`;

const newSkip = `    const lmGroundY = getSiteElevation(0, 0, selectedSite?.id || 'malapert-massif');
    if (apolloLMRef.current) {
      apolloLMRef.current.group.visible = true;
      apolloLMRef.current.group.position.set(0, lmGroundY, 0);
      apolloLMRef.current.group.rotation.set(0, 0, 0);
      apolloLMRef.current.update(0.1, { altitude: 0, throttle: 0, rampDeployed: true, groundY: lmGroundY });
    }
    if (griffinLanderRef.current) griffinLanderRef.current.group.visible = false;
    if (novaCLanderRef.current) novaCLanderRef.current.group.visible = false;

    if (viperRoverRef.current) {
      viperRoverRef.current.group.visible = true;
      freeRoverStateRef.current = { x: 0, z: 5.2, speed: 0, heading: 0, steerAngle: 0 };
      const contact = computeRoverTerrainContact(0, 5.2, 0, selectedSite?.id);
      viperRoverRef.current.group.position.set(0, contact.yBase, 5.2);
      viperRoverRef.current.group.rotation.set(-contact.pitch, 0, contact.roll, 'YXZ');
      viperRoverRef.current.setSuspensionDeltas(contact.suspDeltas);
    }`;

if (code.includes(oldSkip)) {
  code = code.replace(oldSkip, newSkip);
  console.log('9. skipLandingToSurface updated');
} else {
  console.error('9. Could not find oldSkip');
}

// 10. Toolbar visible in all surface modes
code = code.replace(
  "{cameraMode !== 'orbital' && landingPhase === 'IDLE' && (\n        <div style={{\n          position: 'absolute',\n          top: '72px',\n          left: '20px',",
  "{cameraMode !== 'orbital' && (\n        <div style={{\n          position: 'absolute',\n          top: '72px',\n          left: '20px',"
);
console.log('10. Toolbar visibility fixed');

// 11. Mode button text
code = code.replace(
  "{lightingMode === 'heatmap' && 'LiDAR HEATMAP [ACTIVE]'}",
  "{lightingMode === 'heatmap' && 'LiDAR HEATMAP [ANALYSIS]'}"
);
console.log('11. Heatmap button text updated');

fs.writeFileSync('src/components/Viewport3D.jsx', code, 'utf8');
console.log('All Viewport3D updates applied successfully!');
