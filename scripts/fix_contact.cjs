const fs = require('fs');
let code = fs.readFileSync('src/components/Viewport3D.jsx', 'utf8');

const startIdx = code.indexOf('  const sinP = Math.sin(pitch);');
const endIdx = code.indexOf('  return {\n    yBase,\n    pitch,\n    roll,');

if (startIdx === -1 || endIdx === -1) {
  console.error('Indices not found:', startIdx, endIdx);
  process.exit(1);
}

const replacement = `  const sinP = Math.sin(pitch);
  const sinR = Math.sin(roll);

  // Maximum contact height constraint:
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
  });

`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('src/components/Viewport3D.jsx', code, 'utf8');
console.log('Successfully updated computeRoverTerrainContact in Viewport3D.jsx');
