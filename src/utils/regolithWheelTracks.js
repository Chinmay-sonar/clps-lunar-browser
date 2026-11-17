import * as THREE from 'three';
import { createWheelTrackTexture } from './proceduralTextures';

/**
 * Physical Lunar Regolith Wheel Tracks System
 * Simulates 1/6th gravity regolith compaction and chevron grouser indentation.
 * 
 * Includes:
 * 1. Static egress tracks from Astrobotic Griffin lander ramp
 * 2. Real-time dynamic ribbons along the autonomous traverse route
 */

export function createWheelTrackMaterial() {
  const texture = createWheelTrackTexture();
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: 0x141820,
    roughness: 0.96,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1.5,
    polygonOffsetUnits: -1.5,
    side: THREE.DoubleSide
  });
}

/**
 * Creates permanent tracks leading down from Griffin lander's dual egress ramps
 */
export function createStaticDeploymentTracks(getSiteElevation, siteId) {
  const group = new THREE.Group();
  group.name = 'STATIC_DEPLOYMENT_TRACKS';
  const trackMat = createWheelTrackMaterial();

  [-0.6, 0.6].forEach(cx => {
    const points = [];
    for (let z = 3.4; z <= 8.5; z += 0.25) {
      const y = getSiteElevation(cx, z, siteId) + 0.02;
      points.push(new THREE.Vector3(cx, y, z));
    }

    const vertices = [];
    const uvs = [];
    const indices = [];
    const halfW = 0.13; // half width of track

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      vertices.push(p.x - halfW, p.y, p.z);
      vertices.push(p.x + halfW, p.y, p.z);
      const v = (i / points.length) * 6.0;
      uvs.push(0, v, 1, v);
    }

    for (let i = 0; i < points.length - 1; i++) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2);
      indices.push(b + 1, b + 3, b + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const trackMesh = new THREE.Mesh(geo, trackMat);
    trackMesh.receiveShadow = true;
    group.add(trackMesh);
  });

  return group;
}

/**
 * Updates dynamic twin wheel tracks along the 3D spline up to current progress
 */
export function updateDynamicWheelTracks(trackGroup, spline, progress, siteId, getSiteElevation, trackMat) {
  // Clear previous dynamic meshes
  while (trackGroup.children.length > 0) {
    const child = trackGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    trackGroup.remove(child);
  }

  if (!spline || progress <= 0.005) return;

  const totalSteps = Math.max(6, Math.floor(progress * 240));
  const leftPoints = [];
  const rightPoints = [];

  for (let s = 0; s <= totalSteps; s++) {
    const t = (s / totalSteps) * progress;
    const pt = spline.getPoint(t);
    const tan = spline.getTangent(t).normalize();
    // Normal perpendicular to tangent on XZ plane
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    // Wheel gauge: ±0.8m from rover center
    const lx = pt.x - norm.x * 0.8;
    const lz = pt.z - norm.z * 0.8;
    const ly = getSiteElevation(lx, lz, siteId) + 0.022;
    leftPoints.push(new THREE.Vector3(lx, ly, lz));

    const rx = pt.x + norm.x * 0.8;
    const rz = pt.z + norm.z * 0.8;
    const ry = getSiteElevation(rx, rz, siteId) + 0.022;
    rightPoints.push(new THREE.Vector3(rx, ry, rz));
  }

  [leftPoints, rightPoints].forEach(pts => {
    if (pts.length < 2) return;
    const vertices = [];
    const uvs = [];
    const indices = [];
    const halfW = 0.13;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      let forward;
      if (i < pts.length - 1) {
        forward = pts[i + 1].clone().sub(p).normalize();
      } else {
        forward = p.clone().sub(pts[i - 1]).normalize();
      }
      const side = new THREE.Vector3(-forward.z, 0, forward.x).normalize();

      vertices.push(p.x - side.x * halfW, p.y, p.z - side.z * halfW);
      vertices.push(p.x + side.x * halfW, p.y, p.z + side.z * halfW);

      const v = i * 0.4;
      uvs.push(0, v, 1, v);
    }

    for (let i = 0; i < pts.length - 1; i++) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2);
      indices.push(b + 1, b + 3, b + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, trackMat);
    mesh.receiveShadow = true;
    trackGroup.add(mesh);
  });
}
