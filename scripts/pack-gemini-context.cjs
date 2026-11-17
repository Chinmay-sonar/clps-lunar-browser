const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'GEMINI_3D_STUDIO_PACK.md');

const CORE_FILES = [
  { name: 'terrainElevation.js', path: 'src/utils/terrainElevation.js', desc: 'Mathematical Digital Elevation Model (DEM), micro-crater formulas, and slope vectors' },
  { name: 'proceduralTextures.js', path: 'src/utils/proceduralTextures.js', desc: 'PBR regolith normal maps, micro-roughness noise, and thermal emission patterns' },
  { name: 'apolloLunarModuleBuilder.js', path: 'src/utils/apolloLunarModuleBuilder.js', desc: '3D Apollo LM asset loader, supersonic plasma exhaust, dust ejecta, and ramps' },
  { name: 'landingSitesDE441.js', path: 'src/engine/landingSitesDE441.js', desc: 'NASA JPL DE441 Ephemeris, landing sites, polar coordinates, and horizon profiles' }
];

let doc = `# 🌕 NASA CLPS Lunar Mission Browser — Complete Project Context & 3D Engine Master Dossier
### Prepared for Google Gemini (Argon / Advanced / Pro Analysis)

> **Role & Directives for Gemini:**
> You are the **Principal 3D Graphics Architect, Planetary Geomorphologist, and Space Systems Engineer** analyzing this application.
> The project is built using **Three.js (r160+)**, **Vite**, and **React**.
>
> **What You Need to Know:**
> 1. **What We Are Trying to Build**: An interactive "Google Earth + Street View for the Moon's South Pole" to stage NASA Commercial Lunar Payload Services (CLPS) missions, explore candidate Artemis landing sites (Malapert Massif, Shackleton Ridge, Mons Mouton), simulate low-angle polar solar grazing (1.5°–2.0°), and calculate real-time Direct-to-Earth (DTE) vs. Lunar Relay Satellite radio communication links.
> 2. **What We Have Built So Far**:
>    - **3D Moon Globe (Orbit Mode)**: LROC WAC texture globe with realistic orbital lighting and sleek hairline aerospace target beacons & reticles (replacing old pins).
>    - **Google Earth-Style Cinematic Dive**: Clicking a site triggers a multi-phase dive (\`SWOOP\` ➔ \`DESCENT\` ➔ \`TOUCHDOWN\` ➔ \`ROVER_DEPLOY\` ➔ \`DONE\`).
>    - **Apollo Lunar Module 3D Asset**: Loaded from \`apollo_lunar_module.glb\` using Three.js \`GLTFLoader\` and \`DRACOLoader\` (metric 1:1 scale, Kapton gold foil reflex, silver anodized cabin).
>    - **Supersonic Retro-Braking Propulsion**: Triple-tier thruster plumes (outer orange incandescent expansion, middle amber plasma core, inner shock diamond supersonic jet) with dynamic flickering ground firelight, rocket rumble audio, and radial regolith dust ejecta particles.
>    - **Touchdown & Ramp Egress**: Touchdown suspension dampening, automatic equipment ramp deployment, and the rover rolling out smoothly down the ramp onto the regolith.
>    - **Surface Rover Exploration (Street View)**: Full WASD / Arrow driving controls, 6-wheel rocker-bogie terrain articulation, dynamic wheel tracks, and camera transition into third-person driving view.
>    - **RF Comms & Obstacle Raycasting**: Real-time line-of-sight raycasting from rover high-gain antenna to Earth. If crater rims or ridges occlude Earth, it detects the obstacle and dynamically re-routes upward to the CLPS Lunar Relay Orbiter.
>    - **Return to Orbit**: Seamless \`[🌐 MOON GLOBE (ORBIT)]\` exit back to planetary view, just like exiting Street View in Google Earth.
> 3. **Your Enhancement Objectives**:
>    - Custom WebGL / GLSL shaders for authentic lunar regolith scattering (Hapke opposition surge, Lommel-Seeliger scattering).
>    - Micro-crater displacement and ejecta blanket normal maps.
>    - Refined polar shadow penumbras and diffuse Earthshine illumination in deep crater cold traps.
>    - Mathematical enhancements to terrain elevation profiles and physics.

---

## 🏗️ Core Architecture & File Map

| File Path | Role & Content |
| :--- | :--- |
| \`src/components/Viewport3D.jsx\` | Core 3D engine, orbital Moon globe, camera state machine, landing dive sequence, RF comms raycasting, and return-to-orbit navigation. |
| \`src/utils/apolloLunarModuleBuilder.js\` | Apollo Lunar Module 3D asset loader with Draco decompression, supersonic plasma plumes, ground firelight, dust ejecta, and ramps. |
| \`src/utils/terrainElevation.js\` | Digital Elevation Model (DEM), multi-octave Simplex fractal Brownian motion (fBm), and site-specific crater profiles for Malapert Massif, Shackleton, Mons Mouton, and Nobile. |
| \`src/utils/proceduralTextures.js\` | Canvas-generated PBR regolith normal maps, micro-roughness noise, and thermal emission patterns. |
| \`src/utils/viperRoverBuilder.js\` | 6-wheel rocker-bogie Curiosity/VIPER rover model with terrain contact articulation. |
| \`src/engine/landingSitesDE441.js\` | NASA JPL DE441 Ephemeris, landing sites, polar coordinates, and horizon profiles. |

---

`;

for (const file of CORE_FILES) {
  const fullPath = path.join(ROOT_DIR, file.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    doc += `## Source File: \`${file.path}\`\n*${file.desc}*\n\n\`\`\`javascript\n${content}\n\`\`\`\n\n---\n\n`;
  }
}

fs.writeFileSync(OUTPUT_FILE, doc, 'utf8');
console.log(`✅ Successfully generated: ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB)`);
