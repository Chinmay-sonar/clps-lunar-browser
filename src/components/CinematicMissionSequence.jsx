import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { buildRocketCarrierStage } from '../utils/rocketStageBuilder';
import { buildGriffinLander, buildNovaCLander } from '../utils/clpsLanderBuilder';
import { soundFX } from '../utils/soundFX';

/**
 * AAA-Game Level Cinematic Interactive Lunar Mission Sequence
 * 
 * Act I:   Earth Departure & Trans-Lunar Injection (TLI)
 * Act II:  Cislunar Cruise & 90° Polar Lunar Orbit Insertion
 * Act III: Interactive Ejection Checkpoint: HOLD [SHIFT] 5s to detach lander!
 * Act IV:  Powered Retro-Descent & Navigation Doppler Lidar (NDL) crater scan
 * Act V:   Terminal Touchdown at Lunar South Pole with regolith plume & DSN link
 */

export default function CinematicMissionSequence({
  onComplete,
  selectedSite,
  telemetry,
  targetLander = 'griffin' // 'griffin' | 'nova-c'
}) {
  const mountRef = useRef(null);
  const [act, setAct] = useState(1); // 1: TLI Earth, 2: Moon Orbit, 3: Eject Checkpoint, 4: Descent, 5: Touchdown
  const [shiftProgress, setShiftProgress] = useState(0.0); // 0 to 1 (5 seconds hold)
  const [isHoldingShift, setIsHoldingShift] = useState(false);
  const [hudStatus, setHudStatus] = useState('TRANS-LUNAR INJECTION (TLI) NOMINAL');
  const [altitudeKm, setAltitudeKm] = useState(384000);
  const [velocityKps, setVelocityKps] = useState(10.8);
  const [cameraAngle, setCameraAngle] = useState('cinematic'); // 'cinematic' | 'engine' | 'orbit' | 'radar'

  const shiftProgressRef = useRef(0.0);
  const isHoldingShiftRef = useRef(false);
  const actRef = useRef(1);
  const animTimeRef = useRef(0);
  const soundBeepTimerRef = useRef(0);

  // Sync refs
  useEffect(() => {
    isHoldingShiftRef.current = isHoldingShift;
  }, [isHoldingShift]);

  // Handle keyboard [SHIFT] hold
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setIsHoldingShift(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsHoldingShift(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Three.js Cinematic Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020306);
    scene.fog = new THREE.FogExp2(0x020306, 0.0008);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 8000);
    camera.position.set(0, 4, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Textures
    const textureLoader = new THREE.TextureLoader();
    const earthTex = textureLoader.load('/textures/earth_diffuse.jpg');
    const moonTex = textureLoader.load('/textures/lunar_regolith.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 3);
    });
    const moonNormal = textureLoader.load('/textures/lunar_regolith_normal.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 3);
    });
    const goldDiff = textureLoader.load('/textures/gold_mli.jpg');
    const goldNormal = textureLoader.load('/textures/gold_mli_normal.jpg');
    const goldRoughness = textureLoader.load('/textures/gold_mli_roughness.jpg');

    // 1. Starfield Universe (8,000 stars)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 8000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 3500 + Math.random() * 1500;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const isBlue = Math.random() > 0.8;
      starColors[i * 3] = isBlue ? 0.7 : 1.0;
      starColors[i * 3 + 1] = isBlue ? 0.85 : 0.98;
      starColors[i * 3 + 2] = 1.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({ size: 1.8, vertexColors: true, transparent: true, opacity: 0.9 });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    // 2. Distant Sun Light
    const sunLight = new THREE.DirectionalLight(0xfffaed, 3.8);
    sunLight.position.set(450, 120, 250);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0e1422, 0.45);
    scene.add(ambientLight);

    // 3. Earth Globe (Act 1 Background)
    const earthGroup = new THREE.Group();
    earthGroup.position.set(-60, -40, -180);
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(45, 64, 64),
      new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.6, metalness: 0.1 })
    );
    earthGroup.add(earthMesh);

    // Atmosphere halo
    const atmosMesh = new THREE.Mesh(
      new THREE.SphereGeometry(47, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, side: THREE.BackSide })
    );
    earthGroup.add(atmosMesh);
    scene.add(earthGroup);

    // 4. Photorealistic Moon Globe (Act 2 & 3 Target)
    const moonGroup = new THREE.Group();
    moonGroup.position.set(0, 0, -450);
    const moonRadius = 120;
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(moonRadius, 64, 64),
      new THREE.MeshStandardMaterial({
        map: moonTex,
        normalMap: moonNormal,
        normalScale: new THREE.Vector2(2.0, 2.0),
        roughness: 0.95,
        metalness: 0.05
      })
    );
    moonGroup.add(moonMesh);

    // South Pole glowing beacon ring
    const poleBeaconGeo = new THREE.RingGeometry(8, 12, 32);
    poleBeaconGeo.rotateX(Math.PI / 2);
    const poleBeaconMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const poleBeacon = new THREE.Mesh(poleBeaconGeo, poleBeaconMat);
    poleBeacon.position.y = -moonRadius - 0.2; // South Pole bottom
    moonGroup.add(poleBeacon);

    scene.add(moonGroup);

    // 5. Spacecraft Stack: Rocket Carrier Stage + CLPS Lander
    const spacecraftStack = new THREE.Group();
    scene.add(spacecraftStack);

    // 5a. Rocket Carrier Stage
    const rocketCarrier = buildRocketCarrierStage();
    spacecraftStack.add(rocketCarrier.group);

    // 5b. CLPS Lander (Griffin or Nova-C) mounted to separation ring
    let landerObj;
    if (targetLander === 'nova-c') {
      landerObj = buildNovaCLander({ goldDiff, goldNormal, goldRoughness });
      landerObj.group.position.set(0, 6.8, 0); // Mounted to upper ring
    } else {
      landerObj = buildGriffinLander({ goldDiff, goldNormal, goldRoughness });
      landerObj.group.position.set(0, 5.8, 0);
    }
    spacecraftStack.add(landerObj.group);

    // 5c. Separation Springs & Bolt Particle Puff Group
    const separationFxGroup = new THREE.Group();
    scene.add(separationFxGroup);

    // 5d. Navigation Doppler Lidar (NDL) Green Laser Scanning Beams
    const lidarBeamsGroup = new THREE.Group();
    lidarBeamsGroup.visible = false;
    for (let b = 0; b < 4; b++) {
      const bGeo = new THREE.CylinderGeometry(0.02, 0.45, 45, 8);
      const bMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending });
      const beam = new THREE.Mesh(bGeo, bMat);
      beam.position.set((b - 1.5) * 0.4, -22.5, 0);
      lidarBeamsGroup.add(beam);
    }
    landerObj.group.add(lidarBeamsGroup);

    // Separation animation state
    let isSeparated = false;
    let separationDist = 0.0;
    let separationVel = 0.0;

    // Camera cut sequencer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Initial audio callout
    soundFX.voiceCallout('Trans-Lunar Injection burn nominal. En route to Moon.');

    // 60 FPS Cinematic Loop
    let animId;
    let lastTime = performance.now();

    const animate = (now) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      animTimeRef.current += delta;
      const t = animTimeRef.current;

      // Rotate Earth & Moon
      earthMesh.rotation.y += 0.0008;
      moonMesh.rotation.y += 0.0004;

      // ─────────────────────────────────────────────────────────────
      // ACT 1: Earth Departure & Trans-Lunar Injection (0s - 7s)
      // ─────────────────────────────────────────────────────────────
      if (t < 7.0) {
        actRef.current = 1;
        setAct(1);
        setHudStatus('ACT I: TRANS-LUNAR INJECTION (TLI) BURN');
        setAltitudeKm(Math.round(384000 - t * 45000));
        setVelocityKps(10.82);

        // Rocket carrier engine active
        rocketCarrier.plume.visible = true;
        rocketCarrier.corePlume.visible = true;
        rocketCarrier.plume.scale.set(
          1.0 + Math.sin(t * 30) * 0.06,
          1.0 + Math.cos(t * 25) * 0.08,
          1.0
        );

        // Rocket flies forward along -Z
        spacecraftStack.position.set(0, 0, -t * 12);
        spacecraftStack.rotation.set(0.1, 0, 0);

        // Camera Cut 1: Dramatic Hero Engine Shot
        camera.position.set(3.5, -2.0, spacecraftStack.position.z + 14);
        camera.lookAt(spacecraftStack.position.x, spacecraftStack.position.y + 2, spacecraftStack.position.z);
      }

      // ─────────────────────────────────────────────────────────────
      // ACT 2: Moon Approach & 90° Polar Orbit Insertion (7s - 14s)
      // ─────────────────────────────────────────────────────────────
      else if (t >= 7.0 && t < 14.0) {
        actRef.current = 2;
        setAct(2);
        setHudStatus('ACT II: LUNAR POLAR ORBIT INSERTION (LOI)');
        setAltitudeKm(Math.max(100, Math.round(75000 - (t - 7) * 10500)));
        setVelocityKps(1.68);

        // Rocket engine cutoff (coasting)
        rocketCarrier.plume.visible = false;
        rocketCarrier.corePlume.visible = false;

        // Position stack orbiting the Moon
        const orbitAngle = (t - 7.0) * 0.45;
        const orbitR = 175; // Orbit radius around moon center (0, 0, -450)
        const stackX = Math.sin(orbitAngle) * orbitR;
        const stackY = Math.cos(orbitAngle) * orbitR; // Polar orbit across Y-axis
        const stackZ = -450;

        spacecraftStack.position.set(stackX, stackY, stackZ);
        spacecraftStack.rotation.set(0, 0, -orbitAngle + Math.PI / 2);

        // Camera Cut 2: Wide Cinematic Orbit View
        camera.position.set(stackX + 22, stackY + 8, stackZ + 38);
        camera.lookAt(stackX, stackY, stackZ);
      }

      // ─────────────────────────────────────────────────────────────
      // ACT 3: Checkpoint: HOLD [SHIFT] 5s to Eject Lander!
      // ─────────────────────────────────────────────────────────────
      else if (t >= 14.0 && !isSeparated) {
        actRef.current = 3;
        setAct(3);
        setHudStatus('ACT III: POLAR CHECKPOINT — HOLD [SHIFT] 5 SECONDS TO SEPARATE!');
        setAltitudeKm(100);
        setVelocityKps(1.62);

        // Orbit slows down at checkpoint (waiting for user input)
        const checkAngle = 14.0 * 0.45;
        const orbitR = 175;
        const stackX = Math.sin(checkAngle) * orbitR;
        const stackY = Math.cos(checkAngle) * orbitR;
        const stackZ = -450;
        spacecraftStack.position.set(stackX, stackY, stackZ);
        spacecraftStack.rotation.set(0, 0, -checkAngle + Math.PI / 2);

        // Camera zooms in close to separation ring
        camera.position.lerp(
          new THREE.Vector3(stackX + 4.2, stackY + 3.8, stackZ + 6.5),
          0.04
        );
        camera.lookAt(stackX, stackY + 5.0, stackZ);

        // Process Automated or Single-Click Separation (Smooth cinematic flow)
        shiftProgressRef.current = Math.min(1.0, shiftProgressRef.current + delta * 0.45);
        setShiftProgress(shiftProgressRef.current);

        // Sound feedback
        soundBeepTimerRef.current += delta;
        if (soundBeepTimerRef.current > 0.15 && shiftProgressRef.current < 1.0) {
          soundBeepTimerRef.current = 0;
          soundFX.playChargeBeep(shiftProgressRef.current);
        }

        // Trigger separation when charged or user clicked
        if (shiftProgressRef.current >= 1.0 || isHoldingShiftRef.current) {
          isSeparated = true;
          soundFX.playSeparationBang();
          soundFX.voiceCallout('Separation confirmed! Explosive bolts sheared. CLPS Lander is free flight!');

          // Create separation gas cloud puff
          for (let p = 0; p < 16; p++) {
            const puffGeo = new THREE.SphereGeometry(0.35 + Math.random() * 0.3, 8, 8);
            const puffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
            const puff = new THREE.Mesh(puffGeo, puffMat);
            const pAngle = (p * Math.PI * 2) / 16;
            puff.position.set(
              stackX + Math.sin(pAngle) * 2.2,
              stackY + 4.5,
              stackZ + Math.cos(pAngle) * 2.2
            );
            separationFxGroup.add(puff);
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // ACT 4: Powered Descent & Lidar Scanning (Separated!)
      // ─────────────────────────────────────────────────────────────
      else if (isSeparated && separationDist < 60.0) {
        actRef.current = 4;
        setAct(4);
        setHudStatus('ACT IV: POWERED RETRO-DESCENT & TERRAIN RELATIVE NAVIGATION');

        separationVel += delta * 4.2;
        separationDist += separationVel * delta;

        // Lander pushes forward away from rocket carrier
        landerObj.group.position.y += delta * 6.5;

        // Rocket carrier stage recoils and tilts away into disposal orbit
        rocketCarrier.group.position.y -= delta * 1.5;
        rocketCarrier.group.rotation.x += delta * 0.12;

        // Descent altitude decreases rapidly
        const currentAlt = Math.max(0.8, 100 - separationDist * 1.6);
        setAltitudeKm(Math.round(currentAlt * 10) / 10);
        setVelocityKps(Math.round((1.62 - (separationDist / 60) * 1.5) * 100) / 100);

        // Turn on Navigation Doppler Lidar (NDL) green beams
        lidarBeamsGroup.visible = true;
        if (Math.random() > 0.6) {
          soundFX.playLidarScan();
        }

        // Camera Cut 4: Thruster Chase Cam following the falling lander
        const landerWorldPos = new THREE.Vector3();
        landerObj.group.getWorldPosition(landerWorldPos);

        camera.position.lerp(
          new THREE.Vector3(landerWorldPos.x - 6.5, landerWorldPos.y + 4.5, landerWorldPos.z + 12),
          0.06
        );
        camera.lookAt(landerWorldPos);
      }

      // ─────────────────────────────────────────────────────────────
      // ACT 5: Terminal Touchdown on South Pole Regolith
      // ─────────────────────────────────────────────────────────────
      else if (isSeparated && separationDist >= 60.0) {
        actRef.current = 5;
        setAct(5);
        setHudStatus('ACT V: TOUCHDOWN CONFIRMED AT NOBILE CRATER / SOUTH POLE!');
        setAltitudeKm(0.0);
        setVelocityKps(0.0);
        lidarBeamsGroup.visible = false;

        // Final Touchdown Voice & Chime
        if (!window.__touchdownCelebrated) {
          window.__touchdownCelebrated = true;
          soundFX.playSuccessChime();
          soundFX.voiceCallout('Touchdown verified! CLPS Lander is safely on the Moon. Transitioning to surface operations.');
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 3500);
        }
      }

      // Fade separation gas puffs
      separationFxGroup.children.forEach(c => {
        c.scale.multiplyScalar(1.04);
        if (c.material) c.material.opacity = Math.max(0, c.material.opacity - delta * 0.6);
      });

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      window.__touchdownCelebrated = false;
    };
  }, [targetLander, onComplete]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: '#020306',
        overflow: 'hidden'
      }}
    >
      {/* 1. Tactical Flight HUD Bar (Top) */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '24px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'rgba(8, 12, 18, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-hairline, rgba(255, 255, 255, 0.15))',
        borderRadius: '10px',
        pointerEvents: 'auto',
        fontFamily: 'var(--font-mono, monospace)',
        zIndex: 10
      }}>
        {/* Left: Mission Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="dot animate-pulse" style={{ background: '#00f0ff', width: '8px', height: '8px' }}></span>
          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.82rem', letterSpacing: '0.06em' }}>
            NASA CLPS FLIGHT DIRECTOR // {hudStatus}
          </span>
        </div>

        {/* Center: Live Flight Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.72rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: 'var(--text-muted, #8a929e)' }}>ALT: </span>
            <span style={{ color: '#00f0ff', fontWeight: 600 }}>{altitudeKm} KM</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted, #8a929e)' }}>VEL: </span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>{velocityKps} KM/S</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted, #8a929e)' }}>TARGET: </span>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{selectedSite ? selectedSite.name.split(' (')[0] : 'South Pole'}</span>
          </div>
          {act >= 2 && (
            <>
              <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>SUN RAY ANGLE: </span>
                <span style={{ color: '#ffffff' }}>+{telemetry?.sun?.elevation || 2.16}° (GRAZING)</span>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>EARTH DTE SIGNAL: </span>
                <span style={{ color: '#ffffff' }}>+{telemetry?.earth?.elevation || 4.82}° (LOS LOCK)</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Stage Navigation & Skip Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              soundFX.playClick();
              if (onComplete) onComplete();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#e2e8f0',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              transition: 'all 0.15s ease'
            }}
            title="Skip cinematic and go directly to surface simulation"
          >
            SKIP TO SURFACE →
          </button>
        </div>
      </div>

      {/* 2. Gamified Checkpoint HUD Overlay: HOLD [SHIFT] 5s TO EJECT! */}
      {act === 3 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(6, 10, 16, 0.94)',
          backdropFilter: 'blur(24px)',
          border: '2px solid #00f0ff',
          boxShadow: '0 0 45px rgba(0, 240, 255, 0.25)',
          borderRadius: '16px',
          padding: '24px 32px',
          width: '460px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono, monospace)',
          pointerEvents: 'auto',
          zIndex: 20
        }}>
          {/* Header Warning */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              color: '#f59e0b',
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              CHECKPOINT
            </span>
            <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.04em' }}>
              DE-ORBIT RETRO-DESCENT CHECKPOINT
            </span>
          </div>

          <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            Positioned over the <strong style={{ color: '#ffffff' }}>Lunar South Pole</strong> at 100 km altitude.
            Pneumatic pushers and separation explosive bolts are armed.
          </div>

          {/* Tactical Action Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              setIsHoldingShift(true);
            }}
            className="btn-action-primary"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.04em' }}>
              ENGAGE SEPARATION & POWERED DESCENT
            </div>
            <div style={{ fontSize: '0.62rem', opacity: 0.8 }}>
              Click now or auto-separates in {Math.max(1, Math.ceil((1 - shiftProgress) * 2.5))}s
            </div>
          </button>

          {/* Progress Bar (0% to 100%) */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
              <span>PNEUMATIC CHARGE</span>
              <span style={{ color: '#00f0ff', fontWeight: 700 }}>{Math.round(shiftProgress * 100)}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '5px',
              overflow: 'hidden',
              border: '1px solid rgba(0, 240, 255, 0.3)'
            }}>
              <div style={{
                height: '100%',
                width: `${shiftProgress * 100}%`,
                background: 'linear-gradient(90deg, #00f0ff, #f59e0b)',
                transition: 'width 0.05s linear',
                boxShadow: '0 0 12px #00f0ff'
              }}></div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Act IV Lidar Scanning HUD Reticle */}
      {act === 4 && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(6, 10, 16, 0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #00ff88',
          borderRadius: '8px',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.72rem',
          color: '#00ff88',
          boxShadow: '0 0 25px rgba(0, 255, 136, 0.2)'
        }}>
          <span className="dot animate-ping" style={{ background: '#00ff88' }}></span>
          <span>NAVIGATION DOPPLER LIDAR (NDL): ACTIVE TERRAIN SCANNING</span>
          <span style={{ color: '#ffffff' }}>ALT: {altitudeKm} KM</span>
        </div>
      )}

      {/* 4. Act V Touchdown Banner */}
      {act === 5 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(6, 10, 16, 0.94)',
          border: '2px solid #34d399',
          boxShadow: '0 0 45px rgba(52, 211, 153, 0.35)',
          borderRadius: '16px',
          padding: '24px 36px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono, monospace)',
          animation: 'fade-in 0.4s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '4px',
              background: 'rgba(52, 211, 153, 0.15)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              fontSize: '0.66rem',
              letterSpacing: '0.12em',
              color: '#34d399',
              fontWeight: 700
            }}>
              TERMINAL STATUS: NOMINAL TOUCHDOWN
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.66rem',
              letterSpacing: '0.12em',
              color: '#94a3b8'
            }}>
              POLAR SURFACE ARCHITECTURE
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.05em' }}>
            TOUCHDOWN CONFIRMED AT LUNAR SOUTH POLE!
          </div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '6px' }}>
            Flight hardware is secure on the plateau. Deploying egress ramps for surface rover exploration.
          </div>
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => {
                soundFX.playClick();
                if (onComplete) onComplete();
              }}
              style={{
                background: '#34d399',
                color: '#060a10',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 25px rgba(52, 211, 153, 0.45)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>ENTER POLAR RESEARCH OPERATIONS & GUIDANCE</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
