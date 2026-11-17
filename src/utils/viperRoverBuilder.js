import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * High-Precision NASA Polar Exploration Rover Suite (VIPER & Griffin Rover 2)
 * Supports dynamic switching between:
 * 1. NASA VIPER / Curiosity Model (/models/curiosity.glb)
 * 2. Griffin Rover 2 Model (/models/rover_2.glb)
 * 3. Articulated TRIDENT 1M Subsurface Core Drill with rotary-percussive penetration
 */

export const CURIOSITY_WHEEL_SPECS = {
  scaleFactor: 0.78,
  wheelRadius: 0.189, // meters (scaled)
  wheelbase: 1.762,   // front to rear axle span
  trackWidth: 1.664,  // left to right wheel track
  wheels: [
    { id: 'FR', name: 'Front-Right',  lx:  0.832, lz:  0.856, isFront: true,  isRear: false, isLeft: false },
    { id: 'MR', name: 'Middle-Right', lx:  0.934, lz: -0.068, isFront: false, isRear: false, isLeft: false },
    { id: 'RR', name: 'Rear-Right',   lx:  0.832, lz: -0.906, isFront: false, isRear: true,  isLeft: false },
    { id: 'FL', name: 'Front-Left',   lx: -0.832, lz:  0.856, isFront: true,  isRear: false, isLeft: true  },
    { id: 'ML', name: 'Middle-Left',  lx: -0.934, lz: -0.068, isFront: false, isRear: false, isLeft: true  },
    { id: 'RL', name: 'Rear-Left',    lx: -0.832, lz: -0.906, isFront: false, isRear: true,  isLeft: true  }
  ]
};

export function buildViperRover({ goldDiff, goldNormal, goldRoughness, isGriffinRover = false } = {}) {
  const roverGroup = new THREE.Group();
  roverGroup.name = 'NASA_CURIOSITY_ROVER_MASTER';

  // Container that holds the 3D GLB model
  const modelContainer = new THREE.Group();
  modelContainer.name = 'CURIOSITY_MODEL_CONTAINER';
  roverGroup.add(modelContainer);

  // Antenna Gimbal (used by Viewport3D to orient towards Earth)
  const antGimbal = new THREE.Group();
  antGimbal.position.set(-0.35, 1.45, -0.45);
  roverGroup.add(antGimbal);

  // ─── Dual Forward High-Power Lunar Headlights ───
  const headlights = [];
  const headlightLenses = [];

  const lightHousingGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.14, 16);
  lightHousingGeo.rotateX(Math.PI / 2);
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x1a202c,
    metalness: 0.8,
    roughness: 0.3
  });

  const lensOnMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lensOffMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.1
  });

  const lightPositions = [
    { x: -0.52, y: 1.05, z: 1.05 },
    { x:  0.52, y: 1.05, z: 1.05 }
  ];

  lightPositions.forEach(pos => {
    const lightMount = new THREE.Group();
    lightMount.position.set(pos.x, pos.y, pos.z);

    const housing = new THREE.Mesh(lightHousingGeo, housingMat);
    lightMount.add(housing);

    const lensGeo = new THREE.CircleGeometry(0.075, 16);
    const lens = new THREE.Mesh(lensGeo, lensOnMat);
    lens.position.z = 0.072;
    lightMount.add(lens);
    headlightLenses.push(lens);

    const spotLight = new THREE.SpotLight(0xfff7ed, 38.0, 48.0, Math.PI / 3.2, 0.45, 1.8);
    spotLight.position.set(0, 0, 0.08);
    spotLight.target.position.set(pos.x * 0.2, -1.2, 12.0);
    lightMount.add(spotLight);
    lightMount.add(spotLight.target);
    headlights.push(spotLight);

    const widePoint = new THREE.PointLight(0xfff7ed, 14.0, 16.0, 1.4);
    widePoint.position.set(0, 0, 0.15);
    lightMount.add(widePoint);
    headlights.push(widePoint);

    roverGroup.add(lightMount);
  });

  // ─── 3D Subsurface TRIDENT Rotary-Percussive Core Drill Assembly ───
  const drillGroup = new THREE.Group();
  drillGroup.name = 'TRIDENT_SUBSURFACE_DRILL';
  drillGroup.position.set(0, 0.45, 0.15);

  const mastGeo = new THREE.BoxGeometry(0.12, 0.55, 0.12);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
  const drillMast = new THREE.Mesh(mastGeo, mastMat);
  drillGroup.add(drillMast);

  const augerGroup = new THREE.Group();
  const shaftGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.72, 12);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
  const augerShaft = new THREE.Mesh(shaftGeo, shaftMat);
  augerGroup.add(augerShaft);

  for (let f = 0; f < 8; f++) {
    const flightGeo = new THREE.TorusGeometry(0.038, 0.008, 6, 16);
    const flight = new THREE.Mesh(flightGeo, shaftMat);
    flight.position.y = -0.3 + f * 0.08;
    flight.rotation.x = Math.PI / 2.3;
    flight.rotation.z = (f * Math.PI) / 4;
    augerGroup.add(flight);
  }

  const tipGeo = new THREE.ConeGeometry(0.042, 0.10, 12);
  const tipMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.98, roughness: 0.2 });
  const drillTip = new THREE.Mesh(tipGeo, tipMat);
  drillTip.position.y = -0.40;
  drillTip.rotation.x = Math.PI;
  augerGroup.add(drillTip);

  drillGroup.add(augerGroup);
  roverGroup.add(drillGroup);

  // Temporary sleek proxy mesh while GLB loads
  const proxyGeo = new THREE.BoxGeometry(1.6, 0.7, 2.2);
  const proxyMat = new THREE.MeshStandardMaterial({
    color: 0xdde3ed,
    metalness: 0.9,
    roughness: 0.2
  });
  const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
  proxyMesh.position.y = 0.65;
  proxyMesh.castShadow = true;
  modelContainer.add(proxyMesh);

  // ─── Asynchronous GLB Loader for Real NASA Models ───
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  loader.setDRACOLoader(dracoLoader);

  let currentModelUrl = null;
  let activeWheelAssemblies = [];

  // Helper to extract the 6 individual articulated rotating wheels from Cylinder000
  const extractCuriosityWheels = (originalMesh, parentNode) => {
    try {
      const geom = originalMesh.geometry;
      const pos = geom.attributes.position;
      const norm = geom.attributes.normal;
      const uv = geom.attributes.uv;
      const idx = geom.index;
      const material = originalMesh.material;

      if (!pos || !idx) return [];

      const wheelDefs = [
        { key: 'A_front', isLeft: true,  isFront: true,  isRear: false },
        { key: 'A_mid',   isLeft: true,  isFront: false, isRear: false },
        { key: 'A_rear',  isLeft: true,  isFront: false, isRear: true  },
        { key: 'B_front', isLeft: false, isFront: true,  isRear: false },
        { key: 'B_mid',   isLeft: false, isFront: false, isRear: false },
        { key: 'B_rear',  isLeft: false, isFront: false, isRear: true  }
      ];

      // Partition triangles into 6 spatial bins
      const bins = {
        'A_rear': [], 'A_mid': [], 'A_front': [],
        'B_rear': [], 'B_mid': [], 'B_front': []
      };

      for (let t = 0; t < idx.count; t += 3) {
        const i0 = idx.getX(t);
        const i1 = idx.getX(t + 1);
        const i2 = idx.getX(t + 2);

        const cx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
        const cz = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3;

        const side = cx < -1.058 ? 'A' : 'B';
        const lon = cz < -1.6 ? 'rear' : (cz < -0.55 ? 'mid' : 'front');
        bins[side + '_' + lon].push(i0, i1, i2);
      }

      const assemblies = [];

      wheelDefs.forEach(def => {
        const indices = bins[def.key];
        if (!indices || indices.length === 0) return;

        let sumX = 0, sumY = 0, sumZ = 0;
        const vertexMap = new Map();
        const newPositions = [];
        const newNormals = [];
        const newUvs = [];
        const newIndices = [];

        indices.forEach(oldIdx => {
          if (!vertexMap.has(oldIdx)) {
            vertexMap.set(oldIdx, newPositions.length / 3);
            const x = pos.getX(oldIdx);
            const y = pos.getY(oldIdx);
            const z = pos.getZ(oldIdx);
            sumX += x; sumY += y; sumZ += z;
            newPositions.push(x, y, z);
            if (norm) newNormals.push(norm.getX(oldIdx), norm.getY(oldIdx), norm.getZ(oldIdx));
            if (uv) newUvs.push(uv.getX(oldIdx), uv.getY(oldIdx));
          }
          newIndices.push(vertexMap.get(oldIdx));
        });

        const vertCount = newPositions.length / 3;
        const cx = sumX / vertCount;
        const cy = sumY / vertCount;
        const cz = sumZ / vertCount;

        // Center wheel vertices at (0, 0, 0)
        for (let i = 0; i < newPositions.length; i += 3) {
          newPositions[i]     -= cx;
          newPositions[i + 1] -= cy;
          newPositions[i + 2] -= cz;
        }

        const wheelGeom = new THREE.BufferGeometry();
        wheelGeom.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
        if (newNormals.length > 0) {
          wheelGeom.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
        } else {
          wheelGeom.computeVertexNormals();
        }
        if (newUvs.length > 0) {
          wheelGeom.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
        }
        wheelGeom.setIndex(newIndices);

        const pivotGroup = new THREE.Group();
        pivotGroup.name = `WHEEL_PIVOT_${def.key}`;
        pivotGroup.position.set(cx, cy, cz);

        const wheelMesh = new THREE.Mesh(wheelGeom, material);
        wheelMesh.name = `WHEEL_MESH_${def.key}`;
        wheelMesh.castShadow = true;
        wheelMesh.receiveShadow = true;
        pivotGroup.add(wheelMesh);

        parentNode.add(pivotGroup);

        assemblies.push({
          ...def,
          pivotGroup,
          wheelMesh,
          center: { cx, cy, cz }
        });
      });

      // Remove the static merged wheel mesh so only rotating wheels are active
      if (originalMesh.parent) {
        originalMesh.parent.remove(originalMesh);
      }

      return assemblies;
    } catch (err) {
      console.warn('Error extracting wheels from mesh:', err);
      return [];
    }
  };

  // Helper to extract the 6 individual rotating wheels and articulation pivots from Griffin Rover 2 (rover_2.glb)
  const extractRover2Wheels = (wheelsContainer, parentNode) => {
    try {
      const meshes = [];
      if (wheelsContainer.isMesh && wheelsContainer.geometry) {
        meshes.push(wheelsContainer);
      } else {
        wheelsContainer.traverse(child => {
          if (child.isMesh && child.geometry) meshes.push(child);
        });
      }

      if (meshes.length === 0) return [];

      const wheelDefs = [
        { key: 'A_front', isLeft: true,  isFront: true,  isRear: false },
        { key: 'A_mid',   isLeft: true,  isFront: false, isRear: false },
        { key: 'A_rear',  isLeft: true,  isFront: false, isRear: true  },
        { key: 'B_front', isLeft: false, isFront: true,  isRear: false },
        { key: 'B_mid',   isLeft: false, isFront: false, isRear: false },
        { key: 'B_rear',  isLeft: false, isFront: false, isRear: true  }
      ];

      // 1. Calculate centroid for each of the 6 wheels
      const binCentroids = {};
      wheelDefs.forEach(d => { binCentroids[d.key] = { sumX: 0, sumY: 0, sumZ: 0, count: 0 }; });

      meshes.forEach(m => {
        const geom = m.geometry;
        const pos = geom.attributes.position;
        const idx = geom.index;
        if (!pos || !idx) return;

        for (let t = 0; t < idx.count; t += 3) {
          const i0 = idx.getX(t);
          const i1 = idx.getX(t + 1);
          const i2 = idx.getX(t + 2);
          const cx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
          const cy = (pos.getY(i0) + pos.getY(i1) + pos.getY(i2)) / 3;
          const cz = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3;

          const side = cx < 0 ? 'A' : 'B';
          const lon = cz < -0.45 ? 'rear' : (cz <= 0.45 ? 'mid' : 'front');
          const k = side + '_' + lon;
          if (binCentroids[k]) {
            binCentroids[k].sumX += cx;
            binCentroids[k].sumY += cy;
            binCentroids[k].sumZ += cz;
            binCentroids[k].count += 1;
          }
        }
      });

      const wheelCenters = {};
      wheelDefs.forEach(d => {
        const c = binCentroids[d.key];
        if (c && c.count > 0) {
          wheelCenters[d.key] = {
            cx: c.sumX / c.count,
            cy: c.sumY / c.count,
            cz: c.sumZ / c.count
          };
        } else {
          wheelCenters[d.key] = {
            cx: d.isLeft ? -1.25 : 1.25,
            cy: 0,
            cz: d.isFront ? 0.95 : (d.isRear ? -0.95 : 0)
          };
        }
      });

      const assemblies = [];

      // 2. Build independent rotating wheel assemblies
      wheelDefs.forEach(def => {
        const wc = wheelCenters[def.key];
        const pivotGroup = new THREE.Group();
        pivotGroup.name = `GRIFFIN_WHEEL_PIVOT_${def.key}`;
        pivotGroup.position.set(wc.cx, wc.cy, wc.cz);

        const wheelMeshes = [];

        meshes.forEach((m, mIdx) => {
          const geom = m.geometry;
          const pos = geom.attributes.position;
          const norm = geom.attributes.normal;
          const uv = geom.attributes.uv;
          const idx = geom.index;
          if (!pos || !idx) return;

          const newPositions = [];
          const newNormals = [];
          const newUvs = [];
          const newIndices = [];
          const vMap = new Map();

          for (let t = 0; t < idx.count; t += 3) {
            const i0 = idx.getX(t);
            const i1 = idx.getX(t + 1);
            const i2 = idx.getX(t + 2);
            const cx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
            const cz = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3;
            const side = cx < 0 ? 'A' : 'B';
            const lon = cz < -0.45 ? 'rear' : (cz <= 0.45 ? 'mid' : 'front');

            if (side + '_' + lon === def.key) {
              [i0, i1, i2].forEach(oldIdx => {
                if (!vMap.has(oldIdx)) {
                  vMap.set(oldIdx, newPositions.length / 3);
                  newPositions.push(
                    pos.getX(oldIdx) - wc.cx,
                    pos.getY(oldIdx) - wc.cy,
                    pos.getZ(oldIdx) - wc.cz
                  );
                  if (norm) newNormals.push(norm.getX(oldIdx), norm.getY(oldIdx), norm.getZ(oldIdx));
                  if (uv) newUvs.push(uv.getX(oldIdx), uv.getY(oldIdx));
                }
                newIndices.push(vMap.get(oldIdx));
              });
            }
          }

          if (newIndices.length > 0) {
            const partGeom = new THREE.BufferGeometry();
            partGeom.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
            if (newNormals.length > 0) {
              partGeom.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
            } else {
              partGeom.computeVertexNormals();
            }
            if (newUvs.length > 0) {
              partGeom.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
            }
            partGeom.setIndex(newIndices);

            const partMesh = new THREE.Mesh(partGeom, m.material);
            partMesh.name = `GRIFFIN_WHEEL_PART_${def.key}_${mIdx}`;
            partMesh.castShadow = true;
            partMesh.receiveShadow = true;
            pivotGroup.add(partMesh);
            wheelMeshes.push(partMesh);
          }
        });

        parentNode.add(pivotGroup);

        assemblies.push({
          key: def.key,
          isLeft: def.isLeft,
          isFront: def.isFront,
          isRear: def.isRear,
          pivotGroup,
          wheelMesh: wheelMeshes[0] || null,
          wheelMeshes,
          center: wc
        });
      });

      if (wheelsContainer.parent) {
        wheelsContainer.parent.remove(wheelsContainer);
      }

      return assemblies;
    } catch (err) {
      console.warn('Error extracting Griffin Rover wheels:', err);
      return [];
    }
  };

  const loadCustomRoverModel = (customUrl) => {
    const url = customUrl || (typeof window !== 'undefined' ? window.__CUSTOM_ROVER_URL__ : null);
    if (!url) return;
    if (currentModelUrl === url && modelContainer.children.length > 0 && modelContainer.children[0] !== proxyMesh) {
      return;
    }
    currentModelUrl = url;
    activeWheelAssemblies = [];

    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        while (modelContainer.children.length > 0) {
          modelContainer.remove(modelContainer.children[0]);
        }

        // Normalize bounding box to ~2.2m scale
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z, 0.2);
        const scale = 2.2 / maxDim;
        model.scale.set(scale, scale, scale);

        // Center on X and Z
        model.position.x = -(box.min.x + box.max.x) * 0.5 * scale;
        model.position.z = -(box.min.z + box.max.z) * 0.5 * scale;
        // Ground model so lowest vertex sits exactly on Y = 0.000m
        model.position.y = -box.min.y * scale;

        // Search for wheel meshes to enable physical rotation
        const customWheelMeshes = [];
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const nameLower = (child.name || '').toLowerCase();
            if (nameLower.includes('wheel') || nameLower.includes('tire') || nameLower.includes('tread')) {
              customWheelMeshes.push(child);
            }
          }
        });

        if (customWheelMeshes.length > 0) {
          activeWheelAssemblies = customWheelMeshes.map((m, idx) => ({
            key: `custom_${idx}`,
            isLeft: m.position.x < 0,
            isFront: m.position.z > 0,
            isRear: m.position.z < 0,
            wheelMesh: m,
            wheelMeshes: [m],
            pivotGroup: m.parent || m,
            center: { cx: m.position.x, cy: m.position.y, cz: m.position.z }
          }));
        }

        modelContainer.add(model);
      },
      undefined,
      (err) => {
        console.warn('Error loading custom rover model:', err);
      }
    );
  };

  const loadRoverModel = (useGriffin) => {
    const url = useGriffin ? '/models/rover_2.glb' : '/models/curiosity.glb';
    if (currentModelUrl === url && modelContainer.children.length > 0 && modelContainer.children[0] !== proxyMesh) {
      return; // Already loaded this model
    }
    currentModelUrl = url;
    activeWheelAssemblies = [];

    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        while (modelContainer.children.length > 0) {
          const c = modelContainer.children[0];
          modelContainer.remove(c);
        }

        if (useGriffin) {
          // Normalize Rover 2 bounding box to 2.2m scale
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z, 0.1);
          const scale = 2.2 / maxDim;
          model.scale.set(scale, scale, scale);

          // Find wheels container object
          let wheelsObj = model.getObjectByName('Wheels_objs');
          if (!wheelsObj) {
            model.traverse(c => {
              if (c.name && c.name.toLowerCase().includes('wheel')) wheelsObj = c;
            });
          }

          if (wheelsObj) {
            activeWheelAssemblies = extractRover2Wheels(wheelsObj, wheelsObj.parent || model);
          }

          // Ground Griffin Rover wheels with 100% surface touch (zero mid-air gap, zero sinking)
          let wheelsMinY = Infinity;
          if (activeWheelAssemblies.length > 0) {
            activeWheelAssemblies.forEach(wh => {
              if (wh.wheelMeshes) {
                wh.wheelMeshes.forEach(m => {
                  m.geometry.computeBoundingBox();
                  const bMinY = wh.center.cy + m.geometry.boundingBox.min.y;
                  if (bMinY < wheelsMinY) wheelsMinY = bMinY;
                });
              }
            });
          }
          if (!isFinite(wheelsMinY)) {
            const b = new THREE.Box3().setFromObject(model);
            wheelsMinY = b.min.y / scale;
          }

          // Align lowest wheel points exactly to local Y = 0.000m
          model.position.y = -wheelsMinY * scale;
          model.position.x = -(box.min.x + box.max.x) * 0.5 * scale;
          model.position.z = -(box.min.z + box.max.z) * 0.5 * scale;

          model.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          modelContainer.add(model);
        } else {
          // Curiosity / VIPER Model
          const scaleFactor = CURIOSITY_WHEEL_SPECS.scaleFactor;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);
          model.position.set(-0.003, -0.00594, 0.025);

          // Extract and mount the 6 independent rotating wheels
          let wheelsMesh = model.getObjectByName('Cylinder000') || model.getObjectByName('Cylinder.000');
          if (!wheelsMesh) {
            model.traverse(c => {
              if (c.isMesh && (c.name.includes('Cylinder') || (c.material && c.material.name === 'wheels'))) {
                wheelsMesh = c;
              }
            });
          }
          if (wheelsMesh && wheelsMesh.geometry && wheelsMesh.geometry.index) {
            activeWheelAssemblies = extractCuriosityWheels(wheelsMesh, wheelsMesh.parent || model);
          }

          model.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          modelContainer.add(model);
        }
      },
      undefined,
      (err) => {
        console.warn(`Could not load ${url}, retaining proxy:`, err);
      }
    );
  };

  loadRoverModel(isGriffinRover);

  // State Controller Methods
  let isHeadlightsOn = true;
  let drillState = 'stowed';

  const setHeadlights = (enabled) => {
    isHeadlightsOn = enabled;
    headlights.forEach(h => {
      if (h.isPointLight) {
        h.intensity = enabled ? 14.0 : 0.0;
      } else {
        h.intensity = enabled ? 38.0 : 0.0;
      }
    });
    headlightLenses.forEach(l => {
      l.material = enabled ? lensOnMat : lensOffMat;
    });
  };

  const setDrillState = (state) => {
    drillState = state;
  };

  const setModelType = (type, customUrl) => {
    if (type === 'custom' || type === 'custom-uyor') {
      loadCustomRoverModel(customUrl);
    } else {
      const isG = (type === 'griffin' || type === 'griffin-rover' || type === 'rover_2');
      loadRoverModel(isG);
    }
  };

  const update = (delta, driveSpeed = 0, isMoving = false, steerAngle = 0, turnRate = 0) => {
    if (!modelContainer) return;

    // Authentic lunar suspension dynamics (gentle spring-damped pitch/roll, NEVER accumulating)
    const targetRoll = -Math.max(-0.06, Math.min(0.06, turnRate * 0.035 + steerAngle * 0.02));
    const targetPitch = Math.max(-0.06, Math.min(0.06, driveSpeed * 0.015));

    modelContainer.rotation.z += (targetRoll - modelContainer.rotation.z) * Math.min(1.0, delta * 8.0);
    modelContainer.rotation.x += (targetPitch - modelContainer.rotation.x) * Math.min(1.0, delta * 8.0);

    // ─── High-Precision Physical Circular Rotation for All Rover Wheels ───
    // Scaled wheel radius is ~0.193m in world units (1:1 ground-contact roll physics)
    const effectiveRadius = 0.193;
    if (activeWheelAssemblies && activeWheelAssemblies.length > 0) {
      activeWheelAssemblies.forEach(wh => {
        let wheelSpeed = driveSpeed;
        if (Math.abs(turnRate) > 0.01) {
          // Differential skid-steer wheel speed on turning
          const trackSign = wh.isLeft ? 1 : -1;
          wheelSpeed += turnRate * 0.83 * trackSign;
        }

        // Circular roll motion: dTheta = (v * dt) / R
        const rollDelta = (wheelSpeed * delta) / effectiveRadius;
        if (wh.wheelMesh) {
          wh.wheelMesh.rotation.x += rollDelta;
        }
        if (wh.wheelMeshes && wh.wheelMeshes.length > 0) {
          wh.wheelMeshes.forEach(m => {
            if (m !== wh.wheelMesh) {
              m.rotation.x += rollDelta;
            }
          });
        }

        // Realistic Ackerman steering for front & rear wheels
        if (wh.pivotGroup) {
          if (wh.isFront) {
            wh.pivotGroup.rotation.y = THREE.MathUtils.lerp(wh.pivotGroup.rotation.y, steerAngle, Math.min(1.0, delta * 12.0));
          } else if (wh.isRear) {
            wh.pivotGroup.rotation.y = THREE.MathUtils.lerp(wh.pivotGroup.rotation.y, -steerAngle * 0.65, Math.min(1.0, delta * 12.0));
          }
        }
      });
    }

    // 3D Subsurface Drill Animation
    if (drillGroup && augerGroup) {
      if (drillState === 'drilling') {
        augerGroup.rotation.y += delta * 42.0; // Rapid rotary spinning
        const targetAugerY = -0.38 + Math.sin(performance.now() * 0.06) * 0.012; // 18Hz percussive vibration
        augerGroup.position.y = THREE.MathUtils.lerp(augerGroup.position.y, targetAugerY, Math.min(1.0, delta * 6.0));
      } else if (drillState === 'sampling') {
        augerGroup.rotation.y += delta * 6.0;
        augerGroup.position.y = THREE.MathUtils.lerp(augerGroup.position.y, -0.05, Math.min(1.0, delta * 4.0));
      } else {
        // Stowed
        augerGroup.position.y = THREE.MathUtils.lerp(augerGroup.position.y, 0.15, Math.min(1.0, delta * 8.0));
      }
    }
  };

  const setSuspensionDeltas = (suspDeltas) => {
    if (!suspDeltas || !activeWheelAssemblies || activeWheelAssemblies.length < 6) return;
    // Map suspension deltas to wheels
    // Wheels array order in CURIOSITY_WHEEL_SPECS:
    // 0: FR (Right Front -> B_front)
    // 1: MR (Right Mid -> B_mid)
    // 2: RR (Right Rear -> B_rear)
    // 3: FL (Left Front -> A_front)
    // 4: ML (Left Mid -> A_mid)
    // 5: RL (Left Rear -> A_rear)
    const deltaMap = {
      'B_front': suspDeltas[0] || 0,
      'B_mid':   suspDeltas[1] || 0,
      'B_rear':  suspDeltas[2] || 0,
      'A_front': suspDeltas[3] || 0,
      'A_mid':   suspDeltas[4] || 0,
      'A_rear':  suspDeltas[5] || 0
    };
    activeWheelAssemblies.forEach(wh => {
      if (wh && wh.pivotGroup && wh.center && wh.key) {
        const rawDelta = deltaMap[wh.key] || 0;
        // Rocker-bogie physical suspension travel range: [-0.40m, +0.40m]
        const delta = Math.max(-0.40, Math.min(0.40, rawDelta));
        wh.pivotGroup.position.y = wh.center.cy + (delta / 0.78);
      }
    });
  };

  return {
    group: roverGroup,
    modelContainer,
    antGimbal,
    drillGroup,
    setHeadlights,
    setDrillState,
    setModelType,
    update,
    setSuspensionDeltas
  };
}
