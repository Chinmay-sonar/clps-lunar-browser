import * as THREE from 'three';

/**
 * Procedural Texture Generator for Ultra-High-Precision Aerospace Assets
 * Generates crisp 1024x1024 canvas-based PBR textures for:
 * 1. Triple-junction Solar Photovoltaic Cells (Navy silicon + silver busbars)
 * 2. NASA Meatball & Mission Flight Placard Decals
 * 3. Silver MLI (Multilayer Insulation) Foil Blankets
 * 4. Regolith Wheel Tracks with Chevron Grouser Imprints
 */

export function createSolarCellTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep space-grade anti-reflective silicon blue
  ctx.fillStyle = '#061124';
  ctx.fillRect(0, 0, 1024, 1024);

  // Individual solar cell wafers (6 x 6 grid)
  const cols = 6;
  const rows = 6;
  const cellW = 1024 / cols;
  const cellH = 1024 / rows;
  const gap = 6;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + gap;
      const y = r * cellH + gap;
      const w = cellW - gap * 2;
      const h = cellH - gap * 2;

      // Dark blue gradient per cell
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#0a1e3f');
      grad.addColorStop(0.5, '#051228');
      grad.addColorStop(1, '#020917');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Chamfered silicon wafer corners
      ctx.fillStyle = '#061124';
      const chamfer = 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + chamfer, y);
      ctx.lineTo(x, y + chamfer);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x + w - chamfer, y);
      ctx.lineTo(x + w, y + chamfer);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + chamfer, y + h);
      ctx.lineTo(x, y + h - chamfer);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + w, y + h);
      ctx.lineTo(x + w - chamfer, y + h);
      ctx.lineTo(x + w, y + h - chamfer);
      ctx.fill();

      // Ultra-fine grid finger lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      const fingerCount = 18;
      for (let f = 1; f < fingerCount; f++) {
        const fy = y + (h * f) / fingerCount;
        ctx.beginPath();
        ctx.moveTo(x + 2, fy);
        ctx.lineTo(x + w - 2, fy);
        ctx.stroke();
      }

      // Dual silver main busbars per cell
      ctx.strokeStyle = '#c5d1e0';
      ctx.lineWidth = 2.5;
      [0.32, 0.68].forEach(pos => {
        const bx = x + w * pos;
        ctx.beginPath();
        ctx.moveTo(bx, y + 2);
        ctx.lineTo(bx, y + h - 2);
        ctx.stroke();

        // Silver solder tab pads
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(bx - 3, y + h * 0.25 - 4, 6, 8);
        ctx.fillRect(bx - 3, y + h * 0.75 - 4, 6, 8);
      });
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export function createNasaFlightDecalTexture(text = 'VIPER // NASA CLPS') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, 512, 256);

  // Dark aluminum plate background
  ctx.fillStyle = 'rgba(18, 22, 30, 0.94)';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 240, 12);
  ctx.fill();
  ctx.stroke();

  // Corner rivets
  ctx.fillStyle = '#cbd5e1';
  [[24, 24], [488, 24], [24, 232], [488, 232]].forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx, ry, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // NASA Meatball Emblem (Vector representation)
  const mx = 80;
  const my = 128;
  const mr = 48;

  // Blue sphere
  ctx.fillStyle = '#0b3d91';
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();

  // White orbit ellipse
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(mx, my, mr * 1.15, mr * 0.45, -0.4, 0, Math.PI * 2);
  ctx.stroke();

  // Red vector chevron
  ctx.strokeStyle = '#fc3d21';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(mx - 32, my + 26);
  ctx.lineTo(mx + 2, my - 28);
  ctx.lineTo(mx + 36, my + 14);
  ctx.stroke();

  // White NASA text inside ball
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NASA', mx, my - 2);

  // US Flag Placard
  const fx = 155;
  const fy = 65;
  const fw = 75;
  const fh = 42;

  // 13 Stripes
  const stripeH = fh / 13;
  for (let s = 0; s < 13; s++) {
    ctx.fillStyle = s % 2 === 0 ? '#b22234' : '#ffffff';
    ctx.fillRect(fx, fy + s * stripeH, fw, stripeH);
  }

  // Blue Canton
  ctx.fillStyle = '#3c3b6e';
  ctx.fillRect(fx, fy, fw * 0.45, stripeH * 7);

  // Typography Stencils
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
  ctx.fillText(text.split('//')[0].trim(), 155, 145);

  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText(text.includes('//') ? text.split('//')[1].trim() : 'CLPS MISSION', 155, 175);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('VOLATILES INVESTIGATING POLAR EXPLORATION ROVER', 155, 202);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export function createGriffinPlacardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = 'rgba(15, 20, 28, 0.95)';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 240, 12);
  ctx.fill();
  ctx.stroke();

  // Astrobotic Griffin Logo styling
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 36px "Trebuchet MS", sans-serif';
  ctx.fillText('ASTROBOTIC', 40, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Arial", sans-serif';
  ctx.fillText('GRIFFIN LANDER // CLPS-1', 40, 125);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('LUNAR SOUTH POLE CARRIER • VIPER DELIVERY', 40, 165);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '12px monospace';
  ctx.fillText('MAX PAYLOAD: 500 KG • NOBILE / MONS MOUTON', 40, 195);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export function createNovaCPlacardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = 'rgba(12, 16, 24, 0.95)';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 240, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
  ctx.fillText('INTUITIVE MACHINES', 40, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Arial", sans-serif';
  ctx.fillText('NOVA-C "ODYSSEUS" (IM-1)', 40, 125);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('HISTORIC MALAPERT A SOFT LANDING • 80.13° S', 40, 165);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '12px monospace';
  ctx.fillText('VR900 METHALOX 3D ENGINE • NASA CLPS PAYLOADS', 40, 195);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export function createWheelTrackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Darker disturbed regolith trench (albedo drop from 0.12 to 0.05)
  ctx.fillStyle = '#111419';
  ctx.fillRect(0, 0, 256, 512);

  // Chevron grouser indentations (16 per wheel revolution)
  ctx.fillStyle = '#080a0d';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;

  const cleatCount = 12;
  const cleatSpacing = 512 / cleatCount;

  for (let i = 0; i < cleatCount; i++) {
    const y = i * cleatSpacing;

    // V-shaped groove
    ctx.beginPath();
    ctx.moveTo(25, y);
    ctx.lineTo(128, y + 18);
    ctx.lineTo(231, y);
    ctx.lineTo(231, y + 14);
    ctx.lineTo(128, y + 32);
    ctx.lineTo(25, y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Raised compressed regolith berms on track edges
    ctx.fillStyle = 'rgba(180, 190, 205, 0.15)';
    ctx.fillRect(10, y, 12, cleatSpacing * 0.85);
    ctx.fillRect(234, y, 12, cleatSpacing * 0.85);
    ctx.fillStyle = '#080a0d';
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 10);
  texture.anisotropy = 4;
  return texture;
}
