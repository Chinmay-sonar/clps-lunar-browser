import * as THREE from 'three';

/**
 * High-Precision Trans-Lunar Injection (TLI) Rocket Stage Builder
 * Simulates the heavy-lift cryogenic upper stage (Centaur V / Falcon Heavy Upper Stage)
 * carrying the NASA CLPS Lunar Lander from Earth to the Moon.
 */

export function buildRocketCarrierStage() {
  const stageGroup = new THREE.Group();
  stageGroup.name = 'ROCKET_CARRIER_STAGE';

  // Materials
  const tankMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.85,
    roughness: 0.28
  });

  const darkTitaniumMat = new THREE.MeshStandardMaterial({
    color: 0x1e2530,
    metalness: 0.92,
    roughness: 0.35
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.98,
    roughness: 0.1
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    metalness: 0.9,
    roughness: 0.3
  });

  const vacuumNozzleMat = new THREE.MeshStandardMaterial({
    color: 0x181e26,
    metalness: 0.95,
    roughness: 0.2,
    side: THREE.DoubleSide
  });

  // 1. Main Cryogenic Propellant Tank (Liquid Hydrogen / LOX)
  // Diameter: 3.8m, Length: 8.5m
  const tankGeo = new THREE.CylinderGeometry(1.9, 1.9, 7.5, 32);
  const tank = new THREE.Mesh(tankGeo, tankMat);
  tank.castShadow = true;
  stageGroup.add(tank);

  // Forward Dome Bulkhead
  const fwdDomeGeo = new THREE.SphereGeometry(1.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const fwdDome = new THREE.Mesh(fwdDomeGeo, tankMat);
  fwdDome.position.y = 3.75;
  stageGroup.add(fwdDome);

  // Aft Dome Bulkhead
  const aftDomeGeo = new THREE.SphereGeometry(1.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const aftDome = new THREE.Mesh(aftDomeGeo, tankMat);
  aftDome.position.y = -3.75;
  aftDome.rotation.x = Math.PI;
  stageGroup.add(aftDome);

  // External Structural Stringers / Stiffening Rings
  for (let r = -3.2; r <= 3.2; r += 1.6) {
    const ringGeo = new THREE.TorusGeometry(1.92, 0.03, 6, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, darkTitaniumMat);
    ring.position.y = r;
    stageGroup.add(ring);
  }

  // Cryogenic Feedlines Running Externally Down Tank
  [-1.85, 1.85].forEach(xOff => {
    const feedlineGeo = new THREE.CylinderGeometry(0.06, 0.06, 7.2, 12);
    const feedline = new THREE.Mesh(feedlineGeo, chromeMat);
    feedline.position.set(xOff, 0, 0.45);
    stageGroup.add(feedline);
  });

  // 2. Large Vacuum Rocket Engine (RL10 / Merlin Vacuum with Niobium Extension)
  const engineGroup = new THREE.Group();
  engineGroup.position.y = -4.2;

  // Huge Vacuum Nozzle Bell
  const bellGeo = new THREE.ConeGeometry(1.4, 2.8, 32, 1, true);
  const bell = new THREE.Mesh(bellGeo, vacuumNozzleMat);
  bell.rotation.x = Math.PI;
  bell.position.y = -1.4;
  bell.castShadow = true;
  engineGroup.add(bell);

  // Glowing Throat (Orange/White hot combustion area)
  const throatGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.6, 24);
  const throatMat = new THREE.MeshStandardMaterial({
    color: 0xff7722,
    emissive: 0xff4400,
    emissiveIntensity: 1.8,
    metalness: 0.8,
    roughness: 0.2
  });
  const throat = new THREE.Mesh(throatGeo, throatMat);
  throat.position.y = 0.2;
  engineGroup.add(throat);

  // Turbopump, Manifolds, and Gimbals
  const turbopump = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.55), copperMat);
  turbopump.position.set(0.4, 0.35, 0);
  engineGroup.add(turbopump);

  // Dynamic Rocket Exhaust Plume Mesh
  const plumeGeo = new THREE.ConeGeometry(1.6, 8.5, 24, 1, true);
  const plumeMat = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.position.y = -6.8;
  plume.visible = true;
  engineGroup.add(plume);

  // Inner superhot shock diamond core
  const coreGeo = new THREE.ConeGeometry(0.6, 6.0, 16, 1, true);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const corePlume = new THREE.Mesh(coreGeo, coreMat);
  corePlume.position.y = -5.5;
  engineGroup.add(corePlume);

  stageGroup.add(engineGroup);

  // 3. Four RCS Attitude Control Thruster Quads on Aft Skirt
  for (let q = 0; q < 4; q++) {
    const qAngle = (q * Math.PI) / 2;
    const rcsGroup = new THREE.Group();
    rcsGroup.position.set(Math.cos(qAngle) * 2.05, -3.2, Math.sin(qAngle) * 2.05);

    const rcsBase = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), darkTitaniumMat);
    rcsGroup.add(rcsBase);

    // 4 miniature cold-gas thrusters per pod
    [-0.1, 0.1].forEach(dx => {
      const miniNozzle = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 8), chromeMat);
      miniNozzle.position.set(dx, 0.12, 0);
      rcsGroup.add(miniNozzle);
    });

    stageGroup.add(rcsGroup);
  }

  // 4. Forward Payload Separation Ring & Pneumatic Pushers
  // This is the mechanical interface where the CLPS Lander mounts!
  const sepRingGroup = new THREE.Group();
  sepRingGroup.position.y = 4.3;

  const ringGeo = new THREE.CylinderGeometry(1.85, 1.9, 0.45, 32);
  const ring = new THREE.Mesh(ringGeo, darkTitaniumMat);
  sepRingGroup.add(ring);

  // 8 Explosive Separation Clamp Bands with Red Arming Tags
  for (let c = 0; c < 8; c++) {
    const cAngle = (c * Math.PI * 2) / 8;
    const boltGeo = new THREE.BoxGeometry(0.08, 0.2, 0.08);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.2 });
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.set(Math.sin(cAngle) * 1.92, 0, Math.cos(cAngle) * 1.92);
    sepRingGroup.add(bolt);

    // Pneumatic separation spring cylinders
    const springGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
    const spring = new THREE.Mesh(springGeo, chromeMat);
    spring.position.set(Math.sin(cAngle) * 1.75, 0.2, Math.cos(cAngle) * 1.75);
    sepRingGroup.add(spring);
  }

  stageGroup.add(sepRingGroup);

  return {
    group: stageGroup,
    engineGroup,
    plume,
    corePlume,
    sepRingGroup
  };
}
