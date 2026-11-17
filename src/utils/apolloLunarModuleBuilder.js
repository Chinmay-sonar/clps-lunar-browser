import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * Apollo Lunar Module (LM) Descent & Landing Propulsion Engine
 * 
 * High-fidelity integration of NASA Apollo Lunar Module 3D asset:
 * - Real metric scale: ~6.4m wide landing gear footprint, ~5.0m height
 * - Authentic Kapton gold thermal foil, black nickel-alloy panels & silver tanks
 * - Asynchronous loading of official Apollo LM GLB with Draco compression
 * - Supersonic descent engine plasma plume with additive shock diamonds
 * - Dynamic ground-illuminating engine firelight
 * - Surface regolith ejecta dust particle cloud expanding on proximity
 * - Deployable egress equipment ramps for rover rollout
 */

export function buildApolloLunarModule() {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'APOLLO_LUNAR_MODULE_MASTER';

  // Inner model container for rotation / scaling / landing gear articulation
  const modelContainer = new THREE.Group();
  modelContainer.name = 'APOLLO_LM_MODEL_CONTAINER';
  masterGroup.add(modelContainer);

  // ─── 1. High-Detail Procedural Apollo LM (instant render while GLB streams) ───
  const fallbackGroup = new THREE.Group();
  fallbackGroup.name = 'FALLBACK_APOLLO_LM';

  // Gold foil descent stage octagonal prism
  const descentGeo = new THREE.CylinderGeometry(2.1, 2.3, 1.6, 8);
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.88,
    roughness: 0.28
  });
  const blackPanelMat = new THREE.MeshStandardMaterial({
    color: 0x1f242d,
    metalness: 0.75,
    roughness: 0.42
  });
  const descentMesh = new THREE.Mesh(descentGeo, goldFoilMat);
  descentMesh.position.y = 1.6;
  descentMesh.castShadow = true;
  descentMesh.receiveShadow = true;
  fallbackGroup.add(descentMesh);

  // Black nickel thermal barrier panels on alternating octagonal faces
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const panelGeo = new THREE.BoxGeometry(1.68, 1.55, 0.08);
    const panel = new THREE.Mesh(panelGeo, blackPanelMat);
    panel.position.set(Math.sin(angle) * 2.12, 1.6, Math.cos(angle) * 2.12);
    panel.rotation.y = angle;
    panel.castShadow = true;
    fallbackGroup.add(panel);
  }

  // Spherical helium/fuel tanks on descent quadrant
  const tankGeo = new THREE.SphereGeometry(0.48, 20, 20);
  const silverTankMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.92,
    roughness: 0.18
  });
  const tank1 = new THREE.Mesh(tankGeo, silverTankMat);
  tank1.position.set(1.5, 1.6, 0.7);
  tank1.castShadow = true;
  fallbackGroup.add(tank1);

  // Ascent stage crew cabin (gray / silver anodized aluminum)
  const cabinGeo = new THREE.BoxGeometry(2.2, 1.8, 2.0);
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    metalness: 0.55,
    roughness: 0.42
  });
  const cabinMesh = new THREE.Mesh(cabinGeo, silverMat);
  cabinMesh.position.y = 3.2;
  cabinMesh.castShadow = true;
  fallbackGroup.add(cabinMesh);

  // Cabin front triangular observation windows
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const windowGeo = new THREE.BoxGeometry(0.55, 0.45, 0.05);
  const leftWin = new THREE.Mesh(windowGeo, windowMat);
  leftWin.position.set(-0.55, 3.35, 1.02);
  fallbackGroup.add(leftWin);
  const rightWin = new THREE.Mesh(windowGeo, windowMat);
  rightWin.position.set(0.55, 3.35, 1.02);
  fallbackGroup.add(rightWin);

  // 4 Landing gear outriggers with hydraulic struts & footpads
  const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 });
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const legGroup = new THREE.Group();
    legGroup.rotation.y = angle;

    // Primary diagonal strut
    const strutGeo = new THREE.CylinderGeometry(0.065, 0.065, 2.65, 8);
    const strut = new THREE.Mesh(strutGeo, legMat);
    strut.position.set(0, 1.0, 1.55);
    strut.rotation.x = 0.55;
    strut.castShadow = true;
    legGroup.add(strut);

    // Footpad dish
    const padGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.08, 16);
    const pad = new THREE.Mesh(padGeo, goldFoilMat);
    pad.position.set(0, 0.04, 2.35);
    pad.castShadow = true;
    legGroup.add(pad);

    fallbackGroup.add(legGroup);
  }
  modelContainer.add(fallbackGroup);

  // ─── 2. Asynchronous GLB Loader for Real Apollo Lunar Module ───
  let loadedModel = null;
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  loader.setDRACOLoader(dracoLoader);
  loader.load(
    '/models/apollo_lunar_module.glb',
    (gltf) => {
      loadedModel = gltf.scene;
      loadedModel.name = 'APOLLO_LM_GLB_SCENE';

      // Normalize bounding box & center
      const box = new THREE.Box3().setFromObject(loadedModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const min = box.min;

      // Real metric scale: width ~6.4m, height ~5.0m
      const maxDim = Math.max(size.x, size.z);
      const scale = maxDim > 0 ? 6.4 / maxDim : 1.0;
      loadedModel.scale.set(scale, scale, scale);

      // Center horizontally and align footpads flush to Y=0
      loadedModel.position.set(-center.x * scale, -min.y * scale, -center.z * scale);

      loadedModel.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material) {
            node.material.depthWrite = true;
            // Enhance Kapton gold foil and silver anodized aluminum reflex
            const c = node.material.color;
            if (c && c.r > 0.6 && c.g > 0.35 && c.b < 0.25) {
              node.material.metalness = 0.92;
              node.material.roughness = 0.24;
            } else if (c && c.r > 0.55 && c.g > 0.55 && c.b > 0.55) {
              node.material.metalness = 0.82;
              node.material.roughness = 0.28;
            } else {
              node.material.metalness = 0.55;
              node.material.roughness = 0.45;
            }
          }
        }
      });

      // Swap out fallback with official loaded GLB
      modelContainer.remove(fallbackGroup);
      modelContainer.add(loadedModel);
    },
    undefined,
    (err) => {
      console.warn('[ApolloLMBuilder] Falling back to procedural Apollo LM:', err);
    }
  );

  // ─── 3. Descent Engine Thruster Plume (Supersonic Vacuum Plasma Plume) ───
  const thrusterGroup = new THREE.Group();
  thrusterGroup.name = 'APOLLO_DESCENT_THRUSTER';
  thrusterGroup.position.set(0, 0.45, 0); // At the central engine bell nozzle
  masterGroup.add(thrusterGroup);

  // Curved supersonic vacuum plume geometry
  const plumeGeo = new THREE.CylinderGeometry(0.18, 1.45, 3.6, 32, 16, true);
  plumeGeo.translate(0, -1.8, 0);

  const plumeUniforms = {
    uTime: { value: 0 },
    uThrottle: { value: 0 }
  };

  const plumeMat = new THREE.ShaderMaterial({
    uniforms: plumeUniforms,
    vertexShader: `
      uniform float uTime;
      uniform float uThrottle;
      varying vec2 vUv;
      varying float vDist;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        // High-frequency supersonic plasma turbulence
        float flare = (1.0 - uv.y);
        float wave = sin(uv.y * 36.0 - uTime * 45.0) * 0.045 * flare;
        float jitter = cos(atan(position.z, position.x) * 4.0 + uTime * 50.0) * 0.035 * flare;
        pos.x += wave * normal.x + jitter * normal.x;
        pos.z += wave * normal.z + jitter * normal.z;

        vDist = length(pos);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uThrottle;
      varying vec2 vUv;
      varying float vDist;
      varying vec3 vNormal;

      void main() {
        float y = vUv.y; // 0 at nozzle, 1 at expansion plume tip
        
        // Mach shock diamonds along supersonic expansion axis
        float shock = pow(abs(sin(y * 22.0 - uTime * 40.0)), 6.0) * (1.0 - y * 0.85);

        // Core plasma hypergolic temperature gradient (4500K -> 1800K)
        vec3 throatColor = vec3(0.88, 0.95, 1.0); // Electric cyan-white plasma
        vec3 goldColor = vec3(1.0, 0.82, 0.12);   // Hot solar gold
        vec3 amberColor = vec3(0.95, 0.35, 0.05); // Incandescent amber
        vec3 fringeColor = vec3(0.45, 0.12, 0.65); // Ethereal vacuum violet

        vec3 color = mix(throatColor, goldColor, clamp(y * 1.8, 0.0, 1.0));
        color = mix(color, amberColor, clamp((y - 0.35) * 2.2, 0.0, 1.0));
        color = mix(color, fringeColor, clamp((y - 0.72) * 3.5, 0.0, 1.0));

        // Shock diamonds supercharge core brightness
        color += throatColor * shock * 0.95;

        // Fresnel edge falloff
        float viewDot = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
        float edgeGlow = pow(1.0 - viewDot, 1.6);

        // Opacity gradient: tight at nozzle, feathering out into space vacuum
        float alpha = (1.0 - pow(y, 1.3)) * (0.65 + edgeGlow * 0.35 + shock * 0.25) * uThrottle;
        
        gl_FragColor = vec4(color * (1.2 + shock * 0.6), clamp(alpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const plumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
  thrusterGroup.add(plumeMesh);

  // Inner hyper-focused nozzle core jet
  const innerJetGeo = new THREE.ConeGeometry(0.16, 2.2, 20, 1, true);
  innerJetGeo.rotateX(Math.PI);
  innerJetGeo.translate(0, -1.1, 0);
  const innerJetMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const innerJet = new THREE.Mesh(innerJetGeo, innerJetMat);
  thrusterGroup.add(innerJet);

  // Dynamic ground & lander illuminating engine firelight
  const thrusterLight = new THREE.PointLight(0xff8822, 0, 48, 1.4);
  thrusterLight.position.set(0, -0.6, 0);
  thrusterGroup.add(thrusterLight);

  // ─── 4. Regolith Ejecta Dust Particle System (Touchdown Proximity) ───
  const dustCount = 260;
  const dustGeo = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(dustCount * 3);
  const dustVelocities = [];

  for (let i = 0; i < dustCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4.0 + Math.random() * 8.0;
    dustVelocities.push({
      vx: Math.cos(angle) * speed,
      vz: Math.sin(angle) * speed,
      vy: 0.2 + Math.random() * 0.8,
      dist: Math.random() * 8.0,
      life: Math.random()
    });
    dustPositions[i * 3] = 0;
    dustPositions[i * 3 + 1] = 0.05;
    dustPositions[i * 3 + 2] = 0;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xd1d5db,
    size: 0.55,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const dustParticles = new THREE.Points(dustGeo, dustMat);
  masterGroup.add(dustParticles);

  // ─── 5. Deployable Equipment Egress Ramp for Rover Rollout ───
  const rampGroup = new THREE.Group();
  rampGroup.name = 'APOLLO_LM_EGRESS_RAMP';
  // Positioned from descent stage porch (Z ~ 1.9, Y ~ 1.4) descending to ground (Z ~ 4.6, Y ~ 0)
  const trackGeo = new THREE.BoxGeometry(0.32, 0.05, 3.2);
  const rampMat = new THREE.MeshStandardMaterial({
    color: 0x4b5563,
    metalness: 0.78,
    roughness: 0.35
  });

  // Left & right wheel runner tracks
  const leftTrack = new THREE.Mesh(trackGeo, rampMat);
  leftTrack.position.set(-0.62, 0.75, 3.25);
  leftTrack.rotation.x = -0.42; // ~24° slope
  leftTrack.castShadow = true;
  leftTrack.receiveShadow = true;
  rampGroup.add(leftTrack);

  const rightTrack = new THREE.Mesh(trackGeo, rampMat);
  rightTrack.position.set(0.62, 0.75, 3.25);
  rightTrack.rotation.x = -0.42;
  rightTrack.castShadow = true;
  rightTrack.receiveShadow = true;
  rampGroup.add(rightTrack);

  // Cross support rungs
  const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.35, 8);
  rungGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const rung = new THREE.Mesh(rungGeo, rampMat);
    const tz = 2.0 + i * 0.6;
    const ty = 1.35 - i * 0.28;
    rung.position.set(0, ty, tz);
    rampGroup.add(rung);
  }
  rampGroup.visible = false; // Deploys after touchdown
  masterGroup.add(rampGroup);

  // ─── 6. High-Frequency Frame Update & State API ───
  let timeElapsed = 0;

  function update(dt, {
    altitude = 0,
    throttle = 0, // 0.0 to 1.0
    rampDeployed = false,
    groundY = 0
  }) {
    timeElapsed += dt;

    // 1. Throttle & Supersonic Vacuum Plume Animation
    if (throttle > 0.02) {
      thrusterGroup.visible = true;
      const flicker = 0.88 + Math.sin(timeElapsed * 54.0) * 0.12;
      const effectiveThrottle = throttle * flicker;

      plumeUniforms.uTime.value = timeElapsed;
      plumeUniforms.uThrottle.value = effectiveThrottle;

      const plumeLength = 0.65 + effectiveThrottle * 0.35;
      plumeMesh.scale.set(effectiveThrottle, plumeLength, effectiveThrottle);
      innerJet.scale.set(effectiveThrottle * 0.85, plumeLength * 0.95, effectiveThrottle * 0.85);
      innerJetMat.opacity = 0.96 * effectiveThrottle;

      thrusterLight.intensity = 26.0 * effectiveThrottle * flicker;
    } else {
      thrusterGroup.visible = false;
      thrusterLight.intensity = 0;
    }

    // 2. Ground Dust Proximity Simulation (active when thruster fires within 14m of ground)
    if (altitude < 14.0 && throttle > 0.15) {
      dustParticles.visible = true;
      const proximityFactor = Math.max(0, 1.0 - altitude / 14.0);
      dustMat.opacity = proximityFactor * throttle * 0.65;

      const pos = dustGeo.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        const vel = dustVelocities[i];
        vel.life += dt * 1.8;
        if (vel.life > 1.0) {
          vel.life = 0;
          vel.dist = 0.2 + Math.random() * 0.6;
        }
        const curDist = vel.dist + vel.life * (6.0 + (1.0 - altitude / 14.0) * 10.0);
        const curY = groundY + Math.sin(vel.life * Math.PI) * (0.2 + vel.vy * proximityFactor);

        pos[i * 3] = (vel.vx / 8.0) * curDist;
        pos[i * 3 + 1] = curY;
        pos[i * 3 + 2] = (vel.vz / 8.0) * curDist;
      }
      dustGeo.attributes.position.needsUpdate = true;
    } else {
      dustParticles.visible = false;
      dustMat.opacity = 0;
    }

    // 3. Ramp Deployment State
    rampGroup.visible = rampDeployed;
  }

  return {
    group: masterGroup,
    modelContainer,
    thrusterGroup,
    rampGroup,
    update
  };
}
