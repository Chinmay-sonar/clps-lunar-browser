import * as THREE from 'three';
import {
  createSolarCellTexture,
  createGriffinPlacardTexture,
  createNovaCPlacardTexture
} from './proceduralTextures';

/**
 * High-Precision NASA Commercial Lunar Payload Services (CLPS) Lander Digital Twin Suite
 * 
 * Includes:
 * 1. Astrobotic Griffin Lander (VIPER Delivery Mothership with deployable egress ramps)
 * 2. Intuitive Machines Nova-C "Odysseus" Lander (IM-1 Historic South Pole Soft Lander)
 * 
 * Millimeter-accurate aerospace components:
 * - Regeneratively cooled rocket engine bells with fuel manifolds
 * - Quilted MLI Kapton and silver thermal insulation
 * - Spherical titanium propellant tanks with hold-down tension bands
 * - Articulated landing gear with crushable aluminum honeycomb attenuators
 * - Autonomous Hazard Detection Lidar & Doppler optical sensors
 * - Deep Space Network (DSN) steerable X-band parabolic antennas
 */

export function buildGriffinLander({ goldDiff, goldNormal, goldRoughness }) {
  const griffinGroup = new THREE.Group();
  griffinGroup.name = 'ASTROBOTIC_GRIFFIN_LANDER';

  // 1. Aerospace Materials
  const goldMliMat = new THREE.MeshStandardMaterial({
    map: goldDiff || null,
    normalMap: goldNormal || null,
    normalScale: new THREE.Vector2(3.2, 3.2),
    roughnessMap: goldRoughness || null,
    color: 0xfab005,
    metalness: 0.98,
    roughness: 0.20
  });

  const silverMliMat = new THREE.MeshStandardMaterial({
    normalMap: goldNormal || null,
    normalScale: new THREE.Vector2(2.4, 2.4),
    color: 0xe2e8f0,
    metalness: 0.96,
    roughness: 0.18
  });

  const titaniumTrussMat = new THREE.MeshStandardMaterial({
    color: 0x3a424e,
    metalness: 0.88,
    roughness: 0.35
  });

  const aluminumPlateMat = new THREE.MeshStandardMaterial({
    color: 0xc8d0dc,
    metalness: 0.9,
    roughness: 0.2
  });

  const darkInconelMat = new THREE.MeshStandardMaterial({
    color: 0x161a20,
    metalness: 0.95,
    roughness: 0.25,
    side: THREE.DoubleSide
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf0f4f8,
    metalness: 0.98,
    roughness: 0.08
  });

  const carbonFiberMat = new THREE.MeshStandardMaterial({
    color: 0x121418,
    metalness: 0.45,
    roughness: 0.6
  });

  const solarCellMat = new THREE.MeshStandardMaterial({
    map: createSolarCellTexture(),
    metalness: 0.92,
    roughness: 0.12,
    emissive: 0x021028,
    emissiveIntensity: 0.25
  });

  // 2. Central Hexagonal Composite Spacecraft Bus (4.5m wide, 1.8m tall)
  const busGroup = new THREE.Group();
  busGroup.position.y = 1.1;

  // Hexagonal core deck
  const hexCoreGeo = new THREE.CylinderGeometry(2.25, 2.45, 1.5, 6);
  const hexCore = new THREE.Mesh(hexCoreGeo, silverMliMat);
  hexCore.castShadow = true;
  hexCore.receiveShadow = true;
  busGroup.add(hexCore);

  // Top Payload & Egress Deck
  const topDeckGeo = new THREE.CylinderGeometry(2.35, 2.35, 0.1, 6);
  const topDeck = new THREE.Mesh(topDeckGeo, aluminumPlateMat);
  topDeck.position.y = 0.8;
  topDeck.castShadow = true;
  busGroup.add(topDeck);

  // VIPER Mounting Rails & Umbilical Latch on Deck (Centered with VIPER 0.832m half-trackwidth)
  [-0.832, 0.832].forEach(rx => {
    const guideRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 2.2), titaniumTrussMat);
    guideRail.position.set(rx, 0.86, 0.1);
    busGroup.add(guideRail);
  });

  // Peripheral Vertical Solar Panels (Optimized for 1.5° Grazing Sunlight)
  for (let p = 0; p < 6; p++) {
    const angle = (p * Math.PI) / 3;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 0.03), solarCellMat);
    panel.position.set(Math.sin(angle) * 2.38, 0, Math.cos(angle) * 2.38);
    panel.rotation.y = angle;
    panel.castShadow = true;
    busGroup.add(panel);
  }

  // 3. Spherical Titanium Propellant Tanks (4 Hydrazine/NTO Spheres)
  const tankRadius = 0.58;
  const tankGeo = new THREE.SphereGeometry(tankRadius, 28, 28);
  const tankPositions = [
    { x: 1.15, z: 0.75, mat: goldMliMat },
    { x: -1.15, z: 0.75, mat: goldMliMat },
    { x: 1.15, z: -0.75, mat: silverMliMat },
    { x: -1.15, z: -0.75, mat: silverMliMat }
  ];

  tankPositions.forEach(tp => {
    const tank = new THREE.Mesh(tankGeo, tp.mat);
    tank.position.set(tp.x, 0.15, tp.z);
    tank.castShadow = true;
    busGroup.add(tank);

    // Titanium structural hold-down straps
    const strapGeo = new THREE.TorusGeometry(tankRadius + 0.015, 0.018, 6, 24);
    const strap = new THREE.Mesh(strapGeo, titaniumTrussMat);
    strap.position.set(tp.x, 0.15, tp.z);
    strap.rotation.x = Math.PI / 2;
    busGroup.add(strap);
  });

  // 4. Primary Propulsion: 4 Rocket Engine Bells with Cooling Manifolds
  const enginePositions = [
    { x: 1.25, z: 1.25 },
    { x: -1.25, z: 1.25 },
    { x: 1.25, z: -1.25 },
    { x: -1.25, z: -1.25 }
  ];

  enginePositions.forEach(ep => {
    const engineGroup = new THREE.Group();
    engineGroup.position.set(ep.x, -0.65, ep.z);

    // Regeneratively cooled bell nozzle
    const bellGeo = new THREE.ConeGeometry(0.32, 0.65, 20, 1, true);
    const bell = new THREE.Mesh(bellGeo, darkInconelMat);
    bell.rotation.x = Math.PI;
    bell.castShadow = true;
    engineGroup.add(bell);

    // Combustion Chamber & Injector Dome
    const chamberGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.28, 16);
    const chamber = new THREE.Mesh(chamberGeo, chromeMat);
    chamber.position.y = 0.42;
    engineGroup.add(chamber);

    // Propellant Feed Pipes
    const pipeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
    const pipe = new THREE.Mesh(pipeGeo, chromeMat);
    pipe.position.set(0.12, 0.35, 0.08);
    pipe.rotation.z = 0.4;
    engineGroup.add(pipe);

    busGroup.add(engineGroup);
  });

  // 5. 16 RCS (Reaction Control System) Thrusters in 4 Corner Pods
  enginePositions.forEach(ep => {
    const rcsPod = new THREE.Group();
    rcsPod.position.set(ep.x * 1.5, 0.45, ep.z * 1.5);

    const podBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), goldMliMat);
    rcsPod.add(podBox);

    // 4 Orthogonal Thruster Nozzles per pod
    const nozzleOffsets = [
      { r: [0, 0, 0], p: [0, 0, 0.16] },
      { r: [0, Math.PI, 0], p: [0, 0, -0.16] },
      { r: [0, Math.PI / 2, 0], p: [0.16, 0, 0] },
      { r: [-Math.PI / 2, 0, 0], p: [0, -0.16, 0] }
    ];

    nozzleOffsets.forEach(no => {
      const rcsNozzle = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 10, 1, true), darkInconelMat);
      rcsNozzle.rotation.set(no.r[0], no.r[1], no.r[2]);
      rcsNozzle.position.set(no.p[0], no.p[1], no.p[2]);
      rcsPod.add(rcsNozzle);
    });

    busGroup.add(rcsPod);
  });

  // 6. Dual Deployable Egress Ramps (Where VIPER Rolls Down to the Lunar Soil!)
  const egressRampGroup = new THREE.Group();
  egressRampGroup.position.set(0, 0.82, 1.85);

  const rampLength = 5.65;
  const rampWidth = 0.48;
  const rampAngle = 0.375; // ~21.5 degrees down to lunar surface

  // Dual ramp tracks aligned with VIPER 0.832m half-trackwidth for flush tire traction
  [-0.832, 0.832].forEach(rx => {
    const rampTrack = new THREE.Group();
    rampTrack.position.set(rx, 0, 0);
    rampTrack.rotation.x = rampAngle;

    // Carbon-composite track bed
    const bedGeo = new THREE.BoxGeometry(rampWidth, 0.05, rampLength);
    const bed = new THREE.Mesh(bedGeo, carbonFiberMat);
    bed.position.set(0, -0.025, rampLength / 2);
    bed.castShadow = true;
    rampTrack.add(bed);

    // Guide Rails on left & right of each ramp
    [-rampWidth / 2, rampWidth / 2].forEach(gx => {
      const railGeo = new THREE.BoxGeometry(0.025, 0.08, rampLength);
      const rail = new THREE.Mesh(railGeo, aluminumPlateMat);
      rail.position.set(gx, 0.02, rampLength / 2);
      rampTrack.add(rail);
    });

    // Anti-slip traction rungs (Cleats for VIPER wheels)
    const rungCount = 28;
    for (let r = 0; r < rungCount; r++) {
      const rz = (r * rampLength) / rungCount + 0.1;
      const rungGeo = new THREE.BoxGeometry(rampWidth - 0.05, 0.012, 0.035);
      const rung = new THREE.Mesh(rungGeo, titaniumTrussMat);
      rung.position.set(0, 0.006, rz);
      rampTrack.add(rung);
    }

    // Deployable diagonal support strut touching down to lunar soil
    const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8);
    const strut = new THREE.Mesh(strutGeo, titaniumTrussMat);
    strut.position.set(rx > 0 ? 0.15 : -0.15, -1.0, rampLength * 0.45);
    strut.rotation.x = -0.45;
    rampTrack.add(strut);

    egressRampGroup.add(rampTrack);
  });

  busGroup.add(egressRampGroup);

  // 7. Four Massive Articulated Landing Legs with Shock Honeycomb & Footpads
  const legAngles = [
    Math.PI / 4,
    (3 * Math.PI) / 4,
    (5 * Math.PI) / 4,
    (7 * Math.PI) / 4
  ];

  legAngles.forEach(angle => {
    const legGroup = new THREE.Group();
    legGroup.rotation.y = angle;

    // Primary Inverted-V Landing Strut (Crushable Honeycomb Core)
    const mainStrutGeo = new THREE.CylinderGeometry(0.09, 0.08, 2.8, 12);
    const mainStrut = new THREE.Mesh(mainStrutGeo, titaniumTrussMat);
    mainStrut.position.set(1.9, -0.3, 0);
    mainStrut.rotation.z = -0.78;
    mainStrut.castShadow = true;
    legGroup.add(mainStrut);

    // Gold thermal foil wrapped around upper strut hinge
    const strutWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.6, 12), goldMliMat);
    strutWrap.position.set(1.35, 0.25, 0);
    strutWrap.rotation.z = -0.78;
    legGroup.add(strutWrap);

    // Secondary Telescopic Drag Braces (Dual A-frame)
    [-0.35, 0.35].forEach(zOff => {
      const braceGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.3, 8);
      const brace = new THREE.Mesh(braceGeo, aluminumPlateMat);
      brace.position.set(1.6, -0.1, zOff);
      brace.rotation.z = -0.65;
      brace.rotation.y = zOff > 0 ? -0.2 : 0.2;
      legGroup.add(brace);
    });

    // Regolith Contact Footpad: Wide spherical-dish with lunar ground-sensing probe
    const footpadGroup = new THREE.Group();
    footpadGroup.position.set(2.85, -1.25, 0);

    // Wide concave dish footpad
    const dishGeo = new THREE.CylinderGeometry(0.42, 0.35, 0.08, 24);
    const footpad = new THREE.Mesh(dishGeo, darkInconelMat);
    footpad.castShadow = true;
    footpadGroup.add(footpad);

    // Center pivot knuckle ball
    const ballGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const ball = new THREE.Mesh(ballGeo, chromeMat);
    ball.position.y = 0.08;
    footpadGroup.add(ball);

    // Lunar ground-contact microswitch probe (Sticks 0.2m into soil to cut main engine)
    const probeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6);
    const probe = new THREE.Mesh(probeGeo, chromeMat);
    probe.position.y = -0.16;
    footpadGroup.add(probe);

    // Soft Lunar Regolith Footpad Contact Shadow Disc
    const padShadowGeo = new THREE.CircleGeometry(0.55, 20);
    padShadowGeo.rotateX(-Math.PI / 2);
    const padShadow = new THREE.Mesh(padShadowGeo, new THREE.MeshBasicMaterial({ color: 0x010204, transparent: true, opacity: 0.65, depthWrite: false }));
    padShadow.position.y = -0.045;
    footpadGroup.add(padShadow);

    legGroup.add(footpadGroup);
    busGroup.add(legGroup);
  });

  // 8. Navigation Doppler Lidar (NDL) & Hazard Avoidance Cameras
  const sensorPod = new THREE.Group();
  sensorPod.position.set(0, -0.5, 2.1);

  const nldHousing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.25), darkInconelMat);
  sensorPod.add(nldHousing);

  // Dual Laser Emitter Optical Lenses (Green Lidar Apertures)
  [-0.08, 0.08].forEach(lx => {
    const lensGeo = new THREE.CircleGeometry(0.04, 16);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(lx, -0.02, 0.13);
    sensorPod.add(lens);
  });
  busGroup.add(sensorPod);

  // 9. Gimbaled High-Gain Parabolic X-Band DSN Antenna
  const hgaGroup = new THREE.Group();
  hgaGroup.position.set(-1.4, 1.15, -1.2);

  const hgaMast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 10), titaniumTrussMat);
  hgaMast.position.y = 0.35;
  hgaGroup.add(hgaMast);

  const dishGeo = new THREE.CylinderGeometry(0.55, 0.08, 0.16, 24, 1, true);
  const hgaDish = new THREE.Mesh(dishGeo, aluminumPlateMat);
  hgaDish.position.set(0, 0.75, 0);
  hgaDish.rotation.x = Math.PI / 2.6; // Angled toward Earth
  hgaDish.castShadow = true;
  hgaGroup.add(hgaDish);

  const subReflector = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), darkInconelMat);
  subReflector.position.set(0, 0.88, 0.22);
  subReflector.rotation.x = -Math.PI / 2.6;
  hgaGroup.add(subReflector);

  busGroup.add(hgaGroup);

  // 10. Flight Mission Placard
  const placardGeo = new THREE.PlaneGeometry(0.9, 0.45);
  const placardMat = new THREE.MeshBasicMaterial({
    map: createGriffinPlacardTexture(),
    transparent: true
  });
  const placard = new THREE.Mesh(placardGeo, placardMat);
  placard.position.set(0, 0.35, 2.46);
  busGroup.add(placard);

  griffinGroup.add(busGroup);

  return {
    group: griffinGroup,
    busGroup,
    egressRampGroup,
    hgaGroup
  };
}

/**
 * Intuitive Machines Nova-C "Odysseus" Lander (IM-1 Flight Twin)
 * 4.0m tall hexagonal prism with VR900 3D-printed methalox engine, 6 landing legs,
 * NASA ROLSES antenna whips, Laser Retroreflector Array, and SCALPSS cameras.
 */
export function buildNovaCLander({ goldDiff, goldNormal, goldRoughness }) {
  const novaGroup = new THREE.Group();
  novaGroup.name = 'NOVA_C_ODYSSEUS_LANDER';

  // Materials
  const silverMliMat = new THREE.MeshStandardMaterial({
    normalMap: goldNormal || null,
    normalScale: new THREE.Vector2(2.4, 2.4),
    color: 0xedf2f7,
    metalness: 0.96,
    roughness: 0.16
  });

  const goldMliMat = new THREE.MeshStandardMaterial({
    map: goldDiff || null,
    normalMap: goldNormal || null,
    normalScale: new THREE.Vector2(3.2, 3.2),
    roughnessMap: goldRoughness || null,
    color: 0xfab005,
    metalness: 0.98,
    roughness: 0.20
  });

  const carbonFiberMat = new THREE.MeshStandardMaterial({
    color: 0x141820,
    metalness: 0.5,
    roughness: 0.55
  });

  const methaloxEngineMat = new THREE.MeshStandardMaterial({
    color: 0x1f242d,
    metalness: 0.95,
    roughness: 0.22,
    side: THREE.DoubleSide
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.98,
    roughness: 0.08
  });

  const solarCellMat = new THREE.MeshStandardMaterial({
    map: createSolarCellTexture(),
    metalness: 0.92,
    roughness: 0.12,
    emissive: 0x021028,
    emissiveIntensity: 0.25
  });

  const busGroup = new THREE.Group();
  busGroup.position.y = 1.9;

  // 1. Tall Hexagonal Composite Bus (4.0m height, 1.57m diameter)
  const hexBusGeo = new THREE.CylinderGeometry(0.85, 0.85, 3.8, 6);
  const hexBus = new THREE.Mesh(hexBusGeo, silverMliMat);
  hexBus.castShadow = true;
  hexBus.receiveShadow = true;
  busGroup.add(hexBus);

  // Quilted gold MLI belt around midsection
  const goldBeltGeo = new THREE.CylinderGeometry(0.86, 0.86, 1.2, 6);
  const goldBelt = new THREE.Mesh(goldBeltGeo, goldMliMat);
  goldBelt.position.y = -0.3;
  goldBelt.castShadow = true;
  busGroup.add(goldBelt);

  // Vertical Solar Panels on 3 Sun-Facing Facets
  for (let s = 0; s < 3; s++) {
    const angle = (s * Math.PI * 2) / 3;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.78, 2.2, 0.02), solarCellMat);
    panel.position.set(Math.sin(angle) * 0.87, 0.5, Math.cos(angle) * 0.87);
    panel.rotation.y = angle;
    panel.castShadow = true;
    busGroup.add(panel);
  }

  // 2. VR900 3D-Printed Liquid Methane / LOX Rocket Engine Bell
  const engineGroup = new THREE.Group();
  engineGroup.position.y = -1.9;

  const nozzleGeo = new THREE.ConeGeometry(0.48, 0.95, 24, 1, true);
  const nozzle = new THREE.Mesh(nozzleGeo, methaloxEngineMat);
  nozzle.rotation.x = Math.PI;
  nozzle.castShadow = true;
  engineGroup.add(nozzle);

  // Glowing combustion throat
  const throatGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.35, 16);
  const throatMat = new THREE.MeshStandardMaterial({
    color: 0xff6622,
    emissive: 0xff3300,
    emissiveIntensity: 0.8,
    metalness: 0.8,
    roughness: 0.2
  });
  const throat = new THREE.Mesh(throatGeo, throatMat);
  throat.position.y = 0.55;
  engineGroup.add(throat);

  busGroup.add(engineGroup);

  // 3. Six Articulated Carbon-Composite Landing Gear Legs with Titanium Footpads
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const legGroup = new THREE.Group();
    legGroup.rotation.y = angle;

    // Main Strut
    const strutGeo = new THREE.CylinderGeometry(0.045, 0.04, 2.6, 8);
    const strut = new THREE.Mesh(strutGeo, carbonFiberMat);
    strut.position.set(1.1, -1.0, 0);
    strut.rotation.z = -0.68;
    strut.castShadow = true;
    legGroup.add(strut);

    // Cross-brace
    const braceGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6);
    const brace = new THREE.Mesh(braceGeo, chromeMat);
    brace.position.set(0.65, -0.65, 0);
    brace.rotation.z = 0.55;
    legGroup.add(brace);

    // Circular footpad
    const footpadGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.05, 16);
    const footpad = new THREE.Mesh(footpadGeo, chromeMat);
    footpad.position.set(1.95, -1.88, 0);
    footpad.castShadow = true;
    legGroup.add(footpad);

    // Soft Lunar Regolith Footpad Contact Shadow Disc
    const padShadowGeo = new THREE.CircleGeometry(0.38, 16);
    padShadowGeo.rotateX(-Math.PI / 2);
    const padShadow = new THREE.Mesh(padShadowGeo, new THREE.MeshBasicMaterial({ color: 0x010204, transparent: true, opacity: 0.65, depthWrite: false }));
    padShadow.position.set(1.95, -1.905, 0);
    legGroup.add(padShadow);

    busGroup.add(legGroup);
  }

  // 4. Top Deck Scientific Payloads
  const topDeckGroup = new THREE.Group();
  topDeckGroup.position.y = 1.92;

  // NASA LRA (Laser Retroreflector Array) Hemispherical Dome
  const lraDomeGeo = new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const lraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.05 });
  const lraDome = new THREE.Mesh(lraDomeGeo, lraMat);
  lraDome.position.set(0.3, 0, 0.2);
  topDeckGroup.add(lraDome);

  // NASA ROLSES 4 Deployable Antenna Whips
  for (let w = 0; w < 4; w++) {
    const wAngle = (w * Math.PI) / 2 + Math.PI / 4;
    const whipGeo = new THREE.CylinderGeometry(0.006, 0.003, 1.8, 6);
    const whip = new THREE.Mesh(whipGeo, chromeMat);
    whip.position.set(Math.cos(wAngle) * 0.7, 0.8, Math.sin(wAngle) * 0.7);
    whip.rotation.z = Math.cos(wAngle) * 0.45;
    whip.rotation.x = Math.sin(wAngle) * 0.45;
    topDeckGroup.add(whip);
  }

  // High-Gain Direct-to-Earth Parabolic Dish
  const dishGeo = new THREE.CylinderGeometry(0.32, 0.04, 0.1, 18, 1, true);
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xdde4ee, metalness: 0.9, roughness: 0.2 });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.set(-0.25, 0.35, -0.2);
  dish.rotation.x = Math.PI / 2.3;
  dish.castShadow = true;
  topDeckGroup.add(dish);

  // SCALPSS Camera Pod
  const scalpssGeo = new THREE.BoxGeometry(0.12, 0.1, 0.16);
  const scalpss = new THREE.Mesh(scalpssGeo, carbonFiberMat);
  scalpss.position.set(0.45, 0.06, -0.3);
  topDeckGroup.add(scalpss);

  busGroup.add(topDeckGroup);

  // 5. Mission Placard
  const placardGeo = new THREE.PlaneGeometry(0.8, 0.4);
  const placardMat = new THREE.MeshBasicMaterial({
    map: createNovaCPlacardTexture(),
    transparent: true
  });
  const placard = new THREE.Mesh(placardGeo, placardMat);
  placard.position.set(0, 0.4, 0.88);
  busGroup.add(placard);

  novaGroup.add(busGroup);

  return {
    group: novaGroup,
    busGroup,
    engineGroup,
    topDeckGroup
  };
}
