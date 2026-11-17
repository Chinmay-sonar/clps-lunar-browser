# 🛰️ NASA Space Apps 2026 - Challenge 4: CLPS Lunar Mission Browser
## Master Resources, Scientific Data, GitHub Repositories & Tech Stack Manifest

This document contains the complete, verified, cross-checkable directory of all NASA datasets, scientific papers, open-source repositories, APIs, web technologies, and tools utilized in the Codyseey CLPS Lunar Mission Browser project.

---

## 1. 🪐 Official NASA Scientific Portals & Data Repositories

| Resource Name | Organization / Node | Direct URL | Role in Our Project |
| :--- | :--- | :--- | :--- |
| **NASA PDS Geosciences Node** | NASA / Washington Univ. St. Louis | https://pds-geosciences.wustl.edu/missions/lro/lola.html | Primary repository for raw and gridded LOLA altimetry datasets. |
| **LOLA Gridded Data Records (GDR)** | NASA Goddard Space Flight Center | https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/ | High-precision elevation models (LDEM 20m & 100m) used to generate 3D crater rims and peaks. |
| **NASA Moon Trek** | NASA JPL / Solar System Treks | https://trek.nasa.gov/moon/ | Interactive GIS portal for lunar South Pole terrain layers and polar projections. |
| **NASA Moon Trek Tile API** | NASA JPL | https://trek.nasa.gov/tiles/apidoc/ | REST API endpoint for streaming polar stereographic map tiles directly into web globes. |
| **LROC QuickMap** | Arizona State University / NASA | https://quickmap.lroc.asu.edu/ | Golden benchmark tool for measuring lunar slope angles, sun angles, and elevation profiles. |
| **LROC WMS Server** | ASU / NASA LROC Team | https://wms.lroc.asu.edu/lroc/ | Web Map Service streaming high-resolution NAC (Narrow Angle Camera) photographic mosaics. |
| **LPI Lunar South Pole Atlas** | Lunar and Planetary Institute / USRA | https://www.lpi.usra.edu/lunar/lunar_south_pole_atlas/ | Curated maps of Permanently Shadowed Regions (PSRs), water ice cold traps, and slope hazards. |
| **NASA SVS (Scientific Visualization Studio)** | NASA Goddard | https://svs.gsfc.nasa.gov/ | CGI Moon Kit textures, high-res displacement heightmaps, and Moon libration datasets. |
| **NASA Images API** | NASA Open Innovation | https://images-api.nasa.gov/search?q=lunar+south+pole | Official NASA media archive for Apollo, LRO, and Artemis rover mission imagery. |
| **NASA CLPS Program Portal** | NASA Headquarters | https://www.nasa.gov/commercial-lunar-payload-services/ | Official payload manifests, lander contracts, and delivery schedules for CLPS missions. |

---

## 2. 🧭 NASA SPICE Ephemeris & Orbital Mechanics Infrastructure

| Tool / Kernel | Source / Facility | Direct URL | Role in Our Project |
| :--- | :--- | :--- | :--- |
| **NAIF SPICE Toolkit** | NASA JPL / NAIF | https://naif.jpl.nasa.gov/pub/naif/ | Standard software system for space geometry, spacecraft trajectory, and planetary orientations. |
| **Generic SPICE Kernels** | NASA NAIF Public FTP | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/ | Planetary ephemeris files (SPK: de440.bsp), leap seconds (LSK: 
aif0012.tls), and planetary constants (PCK). |
| **Lunar Libration Kernels** | NASA NAIF | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/ | Sub-arcsecond precision orientation files for the Moon's wobble (moon_pa_de440_200625.bpc). |
| **JPL HORIZONS Web System & API** | NASA JPL Solar System Dynamics | https://ssd.jpl.nasa.gov/horizons/ | Web REST API calculating real-time sub-solar and sub-Earth coordinates from any epoch (2024–2035). |

---

## 3. 📚 Key Scientific Research Papers & Mission Documents

| Paper / Document Title | Authors / Source | Citation / Link | Core Concept Used in Simulator |
| :--- | :--- | :--- | :--- |
| **Artemis III Candidate Landing Regions** | NASA Artemis Science Team (2020) | [NASA SP-2020-567](https://www.nasa.gov/wp-content/uploads/2023/03/artemis-iii-candidate-landing-regions-white-paper.pdf) | Defines the 13 South Pole landing sites (Malapert Mountain, Shackleton, Connecting Ridge) and solar criteria. |
| **Illumination conditions of the lunar polar regions using LOLA data** | Mazarico, E. et al. (Icarus, 2011) | DOI: 10.1016/j.icarus.2010.10.030 | Explains why sunlight grazes at 1.5 deg and how topographic peaks cast rotating shadows. |
| **Illumination conditions at the lunar poles: Implications for future exploration** | Glaser, P. et al. (Icarus, 2014) | DOI: 10.1016/j.icarus.2014.08.013 | Mathematical models for crater rim blockage of Direct-to-Earth (DTE) radio links. |
| **VIPER: Volatiles Investigating Polar Exploration Rover Operations** | Colaprete, A. et al. (NASA Ames, 2021) | NASA Technical Reports Server | Principles of shadow-dodging, thermal cold trap hazards, and battery preservation. |
| **Permanent sunlight and shadow at the lunar south pole** | Bussey, D. B. J. et al. (Nature, 1999) | Nature 398, 442-445 | Initial proof of 'peaks of eternal light' on crater rims and permanently shadowed water traps. |

---

## 4. 💻 Open-Source GitHub Repositories & Reference Codebases

| Repository Name | Author / Organization | GitHub URL | How We Leverage It |
| :--- | :--- | :--- | :--- |
| **SpiceyPy** | Andrew Annex / NAIF | https://github.com/AndrewAnnex/SpiceyPy | Python wrapper for SPICE C-kernel calculations; used for ephemeris validation and test vectors. |
| **three.js** | Ricardo Cabello (mrdoob) | https://github.com/mrdoob/three.js | Core WebGL 3D rendering engine for the lunar globe, surface terrain mesh, and celestial sky dome. |
| **Cesium** | CesiumGS | https://github.com/CesiumGS/cesium | Reference architecture for planetary coordinate transformations and ellipsoid math. |
| **Ames Stereo Pipeline (ASP)** | NASA Ames Research Center | https://github.com/NeoGeographyToolkit/StereoPipeline | NASA open-source software for generating 3D DEM meshes from satellite stereo imagery. |
| **NASA Web WorldWind** | NASA WorldWind Team | https://github.com/NASAWorldWind/WebWorldWind | NASA open-source virtual globe library for web GIS layers and polar projections. |
| **SunCalc** | Vladimir Agafonkin (mourner) | https://github.com/mourner/suncalc | Reference client-side astronomical algorithms for rapid solar position calculation. |

---

## 5. 🛠️ Complete Software Stack & UI Engineering Tools

### A. Frontend Core & Styling
* **HTML5**: Semantic document layout, interactive Canvas 2D & WebGL 3D elements, accessible HUD controls.
* **Vanilla CSS3**: Aerospace dark mode (#08090d), Glassmorphic control cards (ackdrop-filter: blur(16px)), electric cyan (#00f0ff) and solar gold (#ffcc00) theme tokens, hardware-accelerated animations.
* **Modern Typography**: Inter & Space Grotesk (via Google Fonts CDN) for clean mission control telemetry legibility.
* **Lucide-React**: Ultra-clean SVG icon set for aerospace controls (Satellite, Sun, Radio, Compass, Mountain, Battery, ShieldAlert, Download).

### B. Reactive Framework & State Management
* **Vite + React 18**: High-speed build system, sub-second HMR (Hot Module Replacement), and reactive state loops for real-time timeline scrubbing.

### C. 3D Graphics & Simulation Physics
* **Three.js (WebGL)**:
  * OrbitControls for 360-degree first-person horizon panning.
  * Custom displacement shaders for LOLA 3D crater terrain meshes.
  * Directional shadow-casting light source modeling the low-grazing Sun.
  * Vector raycasting for line-of-sight (LOS) collision detection against mountain terrain.
* **HTML5 Canvas 2D**: High-frequency rendering of the 360-degree horizon silhouette radar profile and telemetry strip charts.

### D. Export & Reporting Utilities
* **jsPDF / html2canvas**: Client-side PDF generator that turns live simulation data into official, downloadable NASA Mission Flight Briefs without sending data to third-party servers.

### E. Optional Cloud, Web & AI Infrastructure (Ready for Integration)
* **Hosting Options**: GitHub Pages / Vercel / Firebase Hosting (instant deployment, global edge CDN, HTTPS).
* **NVIDIA NIM / Gemini / OpenAI APIs (Optional)**: Can be wired up as an **AI Flight Director Co-Pilot** to review selected coordinates and generate automated tactical mission advice.
* **Web Scraping / Data Refresh (Optional)**: Firecrawl or Cheerio for automated harvesting of real-time CLPS mission status updates.
