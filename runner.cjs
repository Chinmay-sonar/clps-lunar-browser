#!/usr/bin/env node
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

// Locate valid project directory containing healthy node_modules/vite
const candidateDirs = [
  'C:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser',
  path.resolve(__dirname),
  path.resolve(__dirname, '..'),
  'G:\\My Drive\\The Laptop Space\\The NASA Space App\\Challenge 4\\clps-lunar-browser'
];

let targetDir = null;
let viteBin = null;

for (const dir of candidateDirs) {
  const candidateVite = path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js');
  if (fs.existsSync(candidateVite)) {
    targetDir = dir;
    viteBin = candidateVite;
    break;
  }
}

if (!viteBin) {
  console.error('[Error] Could not find vite in node_modules! Checked:', candidateDirs);
  process.exit(1);
}

const action = process.argv[2] || 'dev';
const args = [viteBin];

if (action === 'dev') {
  args.push('--host', '0.0.0.0', '--port', '5175');
} else if (action === 'open') {
  args.push('--host', '0.0.0.0', '--port', '5175', '--open');
} else if (action === 'build') {
  args.push('build');
} else if (action === 'preview') {
  args.push('preview', '--host', '0.0.0.0', '--port', '4173');
} else if (action === 'test' || action === 'validate') {
  const testScript = path.join(targetDir, 'src', 'engine', 'validationTests.js');
  args.length = 0;
  args.push(testScript);
} else {
  args.push(action, ...process.argv.slice(3));
}

console.log(`\n==================================================`);
console.log(`🚀 NASA CLPS Lunar Mission Browser Runner`);
console.log(`📂 Target: ${targetDir}`);
console.log(`⚡ Command: ${action}`);
if (action === 'dev' || action === 'open') {
  console.log(`🔗 Dev URL:  http://localhost:5175/`);
  console.log(`🌐 Network:  http://127.0.0.1:5175/`);
}
console.log(`==================================================\n`);

const child = spawn(process.execPath, args, {
  cwd: targetDir,
  stdio: 'inherit',
  env: process.env,
  shell: false
});

child.on('exit', (code) => {
  if (action === 'build' && code === 0) {
    try {
      const publicDir = path.join(targetDir, 'public');
      const distDir = path.join(targetDir, 'dist');
      if (fs.existsSync(publicDir) && fs.existsSync(distDir)) {
        fs.cpSync(publicDir, distDir, { recursive: true, force: true });
        const indexPath = path.join(distDir, 'index.html');
        const fallbackPath = path.join(distDir, '200.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fallbackPath);
        }
      }
    } catch (e) {
      console.warn('[Post-build copy warning]', e);
    }
  }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('[Runner Error]', err);
  process.exit(1);
});
