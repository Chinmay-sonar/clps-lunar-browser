import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  LUNAR_SOUTH_POLE_FEATURES,
  polarToCartesian,
  cartesianToPolar,
  sampleLolaElevation,
  sampleSlopeAngle,
  sampleDivinerTemperature,
  sampleWaterIceAbundance
} from '../data/lunarGisData';
import { LANDING_SITES } from '../data/landingSites';
import { soundFX } from '../utils/soundFX';

// 6 NASA Scientific Layers
export const GIS_LAYERS = [
  {
    id: 'lola-elevation',
    name: 'LOLA Hypsometry (Elevation)',
    category: 'Topography',
    description: 'Laser Altimeter GDR digital elevation model (-4,000m to +6,000m datum).',
    unit: 'Meters relative to 1,737.4 km datum',
    colorKey: 'NASA Rainbow Hypsometric Relief'
  },
  {
    id: 'lroc-optical',
    name: 'LROC Optical Mosaic',
    category: 'Optical Imagery',
    description: 'Narrow & Wide Angle Camera (NAC/WAC) high-contrast photographic surface albedo.',
    unit: 'Albedo / Reflectance',
    colorKey: 'Hillshaded Regolith Photomosaic'
  },
  {
    id: 'lola-slope',
    name: 'LOLA Slope Hazards',
    category: 'Engineering Safety',
    description: 'Safe landing zones (<5°) vs hazardous crater scarps (>20°).',
    unit: 'Slope Angle (Degrees)',
    colorKey: 'Green (<5°) • Yellow (5-15°) • Red (>20°)'
  },
  {
    id: 'diviner-thermal',
    name: 'Diviner Surface Temperature',
    category: 'Thermodynamics',
    description: 'Cryogenic cold traps (38K to 50K) vs sunlit peaks of eternal light (220K+).',
    unit: 'Kelvin (K)',
    colorKey: '38K Deep Violet → 140K Cyan → 240K Orange'
  },
  {
    id: 'neutron-ice',
    name: 'Neutron Spectrometer (Water Ice)',
    category: 'Volatiles & In-Situ Resources',
    description: 'Hydrogen proxy indicating buried volatile ice deposits validated by LCROSS.',
    unit: 'Water-Equivalent Hydrogen (wt%)',
    colorKey: '0.1 wt% Desiccated → 6.0 wt% Ice-Rich'
  },
  {
    id: 'psr-boundaries',
    name: 'PSR Boundary Vectors',
    category: 'Permanently Shadowed Regions',
    description: 'Craters and micro-depressions that have never received sunlight in 2 billion years.',
    unit: '0% Annual Direct Illumination',
    colorKey: 'Neon Cyan Outlines'
  }
];

export default function LunarGisMap({
  selectedSite,
  onSelectSite,
  onSwitchTo3D
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Responsive Dimensions State
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Map Navigation State
  const [zoom, setZoom] = useState(1.2);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Active Scientific Layer
  const [activeLayer, setActiveLayer] = useState(GIS_LAYERS[0]); // LOLA Elevation
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // Inspector Crosshair State
  const [cursorPos, setCursorPos] = useState(null);
  const [inspectedData, setInspectedData] = useState(null);

  // Elevation Transect Profiler Tool
  const [isTransectMode, setIsTransectMode] = useState(false);
  const [transectPoints, setTransectPoints] = useState([]);
  const [transectProfile, setTransectProfile] = useState(null);

  // Sync container size on mount & resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({ width: clientWidth, height: clientHeight });
          if (canvasRef.current) {
            canvasRef.current.width = clientWidth;
            canvasRef.current.height = clientHeight;
          }
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Center on Selected Site
  const centerOnFeature = useCallback((lat, lon) => {
    const { width: w, height: h } = dimensions;
    const p = polarToCartesian(lat, lon, w, h, zoom, 0, 0);
    setPan({
      x: (w / 2) - p.x,
      y: (h / 2) - p.y
    });
  }, [dimensions, zoom]);

  // Master High-Resolution Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    // Ensure canvas internal buffer matches layout
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // 1. Deep Space Void Background
    ctx.fillStyle = '#06080d';
    ctx.fillRect(0, 0, width, height);

    // Calculate Center and Polar Radius
    const center = polarToCartesian(-90, 0, width, height, zoom, pan.x, pan.y);
    const maxRadius = (Math.min(width, height) * 0.44) * zoom;

    // 2. High-Density Fast Surface Rasterizer (Smooth 3px Grid for Crystal Clear Clarity)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, maxRadius, 0, Math.PI * 2);
    ctx.clip();

    const step = 3; // Ultra fine 3px sampling grid for high definition
    const cols = Math.ceil((maxRadius * 2) / step);
    const rows = Math.ceil((maxRadius * 2) / step);
    const startX = center.x - maxRadius;
    const startY = center.y - maxRadius;

    // Pre-fill dark lunar crust base
    ctx.fillStyle = '#0f131a';
    ctx.fillRect(startX, startY, maxRadius * 2, maxRadius * 2);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const px = startX + i * step;
        const py = startY + j * step;
        const distFromCenter = Math.hypot(px - center.x, py - center.y);

        if (distFromCenter <= maxRadius) {
          const { lat, lon } = cartesianToPolar(px, py, width, height, zoom, pan.x, pan.y);
          const elev = sampleLolaElevation(lat, lon);

          let r = 25, g = 30, b = 40;

          if (activeLayer.id === 'lola-elevation') {
            // NASA LOLA Official Rainbow Scheme: -4000m to +5500m
            const norm = Math.max(0, Math.min(1, (elev + 3800) / 9000));
            // Multi-stop NASA colormap: Deep Indigo -> Blue -> Cyan -> Green -> Yellow -> Orange -> Magenta -> White
            if (norm < 0.2) {
              const t = norm / 0.2;
              r = Math.round(20 + 20 * t);
              g = Math.round(10 + 50 * t);
              b = Math.round(70 + 130 * t);
            } else if (norm < 0.4) {
              const t = (norm - 0.2) / 0.2;
              r = Math.round(40 - 20 * t);
              g = Math.round(60 + 120 * t);
              b = Math.round(200 + 40 * t);
            } else if (norm < 0.6) {
              const t = (norm - 0.4) / 0.2;
              r = Math.round(20 + 180 * t);
              g = Math.round(180 + 40 * t);
              b = Math.round(240 - 180 * t);
            } else if (norm < 0.8) {
              const t = (norm - 0.6) / 0.2;
              r = Math.round(200 + 45 * t);
              g = Math.round(220 - 70 * t);
              b = Math.round(60 - 40 * t);
            } else {
              const t = (norm - 0.8) / 0.2;
              r = Math.round(245 + 10 * t);
              g = Math.round(150 + 90 * t);
              b = Math.round(20 + 220 * t);
            }
          } else if (activeLayer.id === 'lroc-optical') {
            // High-Contrast LROC Optical with Hillshading
            const slope = sampleSlopeAngle(lat, lon);
            const hillshade = Math.cos((lon - 45) * Math.PI / 180) * (slope * 0.04);
            const baseAlbedo = Math.max(0.12, Math.min(0.85, 0.32 + (elev + 2000) / 12000 + hillshade));
            const val = Math.round(baseAlbedo * 240);
            r = val; g = val; b = val;
          } else if (activeLayer.id === 'lola-slope') {
            // Slope Hazards: Safe green (<5°), Caution yellow (5-15°), Danger red (>20°)
            const slope = sampleSlopeAngle(lat, lon);
            if (slope < 6) {
              r = Math.round(20 + slope * 5);
              g = Math.round(160 + slope * 10);
              b = Math.round(80);
            } else if (slope < 16) {
              const t = (slope - 6) / 10;
              r = Math.round(180 + 60 * t);
              g = Math.round(190 + 30 * t);
              b = Math.round(40);
            } else {
              const t = Math.min(1, (slope - 16) / 15);
              r = Math.round(230 + 25 * t);
              g = Math.round(50 - 30 * t);
              b = Math.round(50 - 30 * t);
            }
          } else if (activeLayer.id === 'diviner-thermal') {
            // Diviner Temperature: 38K (Violet) -> 100K (Cyan) -> 230K (Solar Orange)
            const temp = sampleDivinerTemperature(lat, lon);
            if (temp.currentK < 60) {
              const t = (temp.currentK - 35) / 25;
              r = Math.round(75 + 30 * t);
              g = Math.round(15 + 40 * t);
              b = Math.round(130 + 100 * t);
            } else if (temp.currentK < 160) {
              const t = (temp.currentK - 60) / 100;
              r = Math.round(105 - 70 * t);
              g = Math.round(55 + 130 * t);
              b = Math.round(230 - 30 * t);
            } else {
              const t = (temp.currentK - 160) / 80;
              r = Math.round(35 + 215 * t);
              g = Math.round(185 - 20 * t);
              b = Math.round(200 - 170 * t);
            }
          } else if (activeLayer.id === 'neutron-ice') {
            // Water Ice: Electric Cyan glow for high WEH concentrations
            const ice = sampleWaterIceAbundance(lat, lon);
            if (ice.abundanceWtPct > 3.0) {
              const t = (ice.abundanceWtPct - 3.0) / 3.0;
              r = Math.round(0 + 40 * t);
              g = Math.round(210 + 45 * t);
              b = Math.round(245 + 10 * t);
            } else if (ice.abundanceWtPct > 1.0) {
              r = 15; g = 110; b = 180;
            } else {
              r = 18; g = 24; b = 34;
            }
          } else if (activeLayer.id === 'psr-boundaries') {
            // Dark terrain with illuminated permanently shadowed craters
            const temp = sampleDivinerTemperature(lat, lon);
            if (temp.currentK < 60) {
              r = 0; g = 180; b = 230;
            } else {
              r = 14; g = 18; b = 26;
            }
          }

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(px, py, step, step);
        }
      }
    }

    // 3. Draw Subdued Topographic Contour Rings
    if (activeLayer.id === 'lola-elevation') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = 1;
      LUNAR_SOUTH_POLE_FEATURES.forEach(feat => {
        const p = polarToCartesian(feat.lat, feat.lon, width, height, zoom, pan.x, pan.y);
        const pxRadius = (feat.diameterKm / 2 / 303) * maxRadius;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pxRadius, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    // 4. Draw Neon PSR Boundary Vectors
    if (activeLayer.id === 'psr-boundaries' || activeLayer.id === 'neutron-ice') {
      LUNAR_SOUTH_POLE_FEATURES.forEach(feat => {
        if (feat.depthMeters > 0) {
          const p = polarToCartesian(feat.lat, feat.lon, width, height, zoom, pan.x, pan.y);
          const pxRadius = (feat.diameterKm / 2 / 303) * maxRadius * 0.72;
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(p.x, p.y, pxRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // 5. Polar Coordinate Grid Rings & Meridians
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);

      // Concentric Latitude rings: -82°, -84°, -86°, -88°
      [-82, -84, -86, -88].forEach(lat => {
        const colat = 90 + lat;
        const r = (colat / 10) * maxRadius;
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '9px var(--font-mono, monospace)';
        ctx.fillText(`${lat}° S`, center.x + 6, center.y - r + 11);
      });

      // Longitude spokes (every 45 degrees)
      for (let az = 0; az < 360; az += 45) {
        const rad = (az * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + maxRadius * Math.sin(rad), center.y + maxRadius * Math.cos(rad));
        ctx.stroke();

        const lx = center.x + (maxRadius - 16) * Math.sin(rad);
        const ly = center.y + (maxRadius - 16) * Math.cos(rad);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '9px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${az}°`, lx, ly);
      }
      ctx.setLineDash([]);
    }

    ctx.restore(); // Restore clip mask

    // 6. Polar Stereographic Outer Rim Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center.x, center.y, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 7. Clean Decluttered Feature Labels with Pill Badges
    if (showLabels) {
      // Prioritize features based on zoom
      LUNAR_SOUTH_POLE_FEATURES.forEach((feat, idx) => {
        const p = polarToCartesian(feat.lat, feat.lon, width, height, zoom, pan.x, pan.y);
        const distFromCenter = Math.hypot(p.x - center.x, p.y - center.y);

        if (distFromCenter <= maxRadius + 20) {
          const isSelected = selectedSite && selectedSite.name.toLowerCase().includes(feat.name.split(' ')[0].toLowerCase());

          // Marker Pin Dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, isSelected ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#ffcc00' : (feat.peakElevationM > 3000 ? '#ffaa44' : '#00f0ff');
          ctx.shadowColor = isSelected ? '#ffcc00' : '#00f0ff';
          ctx.shadowBlur = isSelected ? 10 : 3;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Declutter labels: skip lesser craters if zoomed out and close to another label
          if (zoom < 1.4 && idx > 5) return;

          // Label Badge Background
          const labelText = feat.name;
          const subText = `${feat.peakElevationM > 0 ? '+' : ''}${feat.floorElevationM || feat.peakElevationM}m`;
          
          ctx.font = '600 10px var(--font-mono, monospace)';
          const textWidth = ctx.measureText(labelText).width;
          const badgeX = p.x + (feat.badgeOffsetX !== undefined ? feat.badgeOffsetX : 8);
          const badgeY = p.y + (feat.badgeOffsetY !== undefined ? feat.badgeOffsetY : -10);

          ctx.fillStyle = 'rgba(8, 12, 18, 0.88)';
          ctx.strokeStyle = isSelected ? '#ffcc00' : 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, textWidth + 10, 20, 4);
          ctx.fill();
          ctx.stroke();

          // Main Label
          ctx.fillStyle = isSelected ? '#ffcc00' : '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(labelText, badgeX + 5, badgeY + 4);
        }
      });

      // 7b. Official NASA Artemis III & CLPS Candidate Landing Sites (Accurate Reticles)
      LANDING_SITES.forEach(site => {
        const selLon = site.lon > 180 ? site.lon - 360 : site.lon;
        const p = polarToCartesian(site.lat, selLon, width, height, zoom, pan.x, pan.y);
        const distFromCenter = Math.hypot(p.x - center.x, p.y - center.y);

        if (distFromCenter <= maxRadius + 30) {
          const isSelected = selectedSite && selectedSite.id === site.id;

          // Target Pulse Reticle
          ctx.beginPath();
          ctx.arc(p.x, p.y, isSelected ? 9 : 6, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? '#ffd700' : '#00f0ff';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.stroke();

          // Center Reticle Crosshairs
          const ch = isSelected ? 6 : 4;
          ctx.beginPath();
          ctx.moveTo(p.x - ch, p.y); ctx.lineTo(p.x + ch, p.y);
          ctx.moveTo(p.x, p.y - ch); ctx.lineTo(p.x, p.y + ch);
          ctx.strokeStyle = isSelected ? '#ffd700' : '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Target Badge Box (Clean anti-slop technical notation)
          const labelText = `TARGET // ${site.name}`;
          const subText = `${site.lat.toFixed(2)}°S, ${selLon.toFixed(2)}°E • +${site.elevationMeters}m`;

          ctx.font = 'bold 10px var(--font-mono, monospace)';
          const textWidth = ctx.measureText(labelText).width;
          const badgeX = p.x + 12;
          const badgeY = p.y - 14;

          ctx.fillStyle = isSelected ? 'rgba(16, 22, 34, 0.95)' : 'rgba(8, 12, 18, 0.90)';
          ctx.strokeStyle = isSelected ? '#ffd700' : 'rgba(0, 240, 255, 0.45)';
          ctx.lineWidth = isSelected ? 1.5 : 1.0;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, textWidth + 14, 28, 4);
          ctx.fill();
          ctx.stroke();

          // Site Name
          ctx.fillStyle = isSelected ? '#ffd700' : '#ffffff';
          ctx.font = 'bold 9.5px var(--font-mono, monospace)';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(labelText, badgeX + 6, badgeY + 4);

          // Subtext Coordinates & Elevation
          ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.65)';
          ctx.font = '8px var(--font-mono, monospace)';
          ctx.fillText(subText, badgeX + 6, badgeY + 16);
        }
      });

      // True South Pole Marker
      ctx.beginPath();
      ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 9px var(--font-mono, monospace)';
      ctx.textAlign = 'center';
      ctx.fillText('SOUTH POLE (90° S)', center.x, center.y - 15);
    }

    // 8. Active Transect Profile Line
    if (transectPoints.length > 0) {
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      transectPoints.forEach((pt, idx) => {
        const p = polarToCartesian(pt.lat, pt.lon, width, height, zoom, pan.x, pan.y);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);

        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 10px var(--font-mono, monospace)';
        ctx.fillText(idx === 0 ? 'START' : 'END', p.x + 8, p.y - 6);
      });
      ctx.stroke();
    }

    // 9. Precision Crosshair Reticle under Cursor
    if (cursorPos) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cursorPos.x, cursorPos.y, 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cursorPos.x - 12, cursorPos.y);
      ctx.lineTo(cursorPos.x + 12, cursorPos.y);
      ctx.moveTo(cursorPos.x, cursorPos.y - 12);
      ctx.lineTo(cursorPos.x, cursorPos.y + 12);
      ctx.stroke();
    }

  }, [dimensions, zoom, pan, activeLayer, showGrid, showLabels, selectedSite, transectPoints, cursorPos]);

  // Mouse / Drag Handlers
  const handleMouseDown = (e) => {
    if (isTransectMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    const { lat, lon, rNorm } = cartesianToPolar(mouseX, mouseY, dimensions.width, dimensions.height, zoom, pan.x, pan.y);

    if (rNorm <= 1.05 && lat <= -80.0) {
      setCursorPos({ x: mouseX, y: mouseY, lat, lon });
      const elev = sampleLolaElevation(lat, lon);
      const slope = sampleSlopeAngle(lat, lon);
      const temp = sampleDivinerTemperature(lat, lon);
      const ice = sampleWaterIceAbundance(lat, lon);

      setInspectedData({
        lat,
        lon,
        elevation: elev,
        slope,
        temperature: temp,
        ice
      });
    } else {
      setCursorPos(null);
      setInspectedData(null);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(prev => Math.max(0.6, Math.min(6.0, prev * factor)));
  };

  // Canvas Click (Feature Selection or Transect Line)
  const handleCanvasClick = () => {
    if (!cursorPos) return;
    soundFX.playClick();

    if (isTransectMode) {
      if (transectPoints.length === 0) {
        setTransectPoints([{ lat: cursorPos.lat, lon: cursorPos.lon }]);
        setTransectProfile(null);
      } else if (transectPoints.length === 1) {
        const start = transectPoints[0];
        const end = { lat: cursorPos.lat, lon: cursorPos.lon };
        setTransectPoints([start, end]);

        // Calculate 50 sample points along the transect line
        const profile = [];
        const numSteps = 50;
        for (let s = 0; s <= numSteps; s++) {
          const t = s / numSteps;
          const sampleLat = start.lat + (end.lat - start.lat) * t;
          const sampleLon = start.lon + (end.lon - start.lon) * t;
          const elev = sampleLolaElevation(sampleLat, sampleLon);
          const slope = sampleSlopeAngle(sampleLat, sampleLon);
          const temp = sampleDivinerTemperature(sampleLat, sampleLon);
          profile.push({ step: s, lat: sampleLat, lon: sampleLon, elev, slope, tempK: temp.currentK });
        }
        setTransectProfile(profile);
      } else {
        setTransectPoints([{ lat: cursorPos.lat, lon: cursorPos.lon }]);
        setTransectProfile(null);
      }
    } else {
      // Select clicked NASA candidate landing site
      let targetCandidate = null;
      let minCandidateDist = 35; // 35px click radius
      LANDING_SITES.forEach(site => {
        const selLon = site.lon > 180 ? site.lon - 360 : site.lon;
        const p = polarToCartesian(site.lat, selLon, dimensions.width, dimensions.height, zoom, pan.x, pan.y);
        const dist = Math.hypot(p.x - cursorPos.x, p.y - cursorPos.y);
        if (dist < minCandidateDist) {
          minCandidateDist = dist;
          targetCandidate = site;
        }
      });

      if (targetCandidate && onSelectSite) {
        onSelectSite(targetCandidate);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#06080d',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* 1. Main High-Precision 2D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isTransectMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab')
        }}
      />

      {/* 2. Top-Left Floating Scientific Layer Selector */}
      <div style={{
        position: 'absolute',
        top: '68px',
        left: '20px',
        width: '280px',
        background: 'rgba(10, 14, 22, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-hairline, rgba(255,255,255,0.1))',
        borderRadius: '8px',
        padding: '12px',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-muted, #717d96)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            NASA SCIENTIFIC LAYERS
          </span>
          <span style={{
            fontSize: '0.62rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: '#00f0ff',
            padding: '1px 5px',
            background: 'rgba(0, 240, 255, 0.1)',
            borderRadius: '4px'
          }}>
            LRO / LOLA / DIVINER
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {GIS_LAYERS.map(layer => {
            const isActive = activeLayer.id === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => {
                  soundFX.playClick();
                  setActiveLayer(layer);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  background: isActive ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid #00f0ff' : '1px solid transparent',
                  borderRadius: '6px',
                  color: isActive ? '#ffffff' : 'var(--text-secondary, #a0aec0)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: isActive ? 600 : 500 }}>
                    {layer.name}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted, #717d96)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {layer.category}
                  </div>
                </div>
                {isActive && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f0ff' }}></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Layer Color Key / Legend */}
        <div style={{
          marginTop: '10px',
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '4px',
          fontSize: '0.64rem',
          fontFamily: 'var(--font-mono, monospace)'
        }}>
          <div style={{ color: 'var(--text-muted, #717d96)', marginBottom: '3px' }}>LAYER SCALE:</div>
          <div style={{ color: '#00f0ff' }}>{activeLayer.colorKey}</div>
          <div style={{ color: 'var(--text-dim, #4a5568)', marginTop: '2px' }}>{activeLayer.unit}</div>
        </div>

        {/* View Options */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="btn-minimal"
            style={{
              flex: 1,
              height: '26px',
              fontSize: '0.62rem',
              background: showGrid ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            GRID: {showGrid ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className="btn-minimal"
            style={{
              flex: 1,
              height: '26px',
              fontSize: '0.62rem',
              background: showLabels ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            LABELS: {showLabels ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 3. Top-Right Mission Targets Quick-Selector */}
      <div style={{
        position: 'absolute',
        top: '68px',
        right: '20px',
        width: '260px',
        background: 'rgba(10, 14, 22, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-hairline, rgba(255,255,255,0.1))',
        borderRadius: '8px',
        padding: '12px',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-muted, #717d96)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            KEY POLAR REGIONS
          </span>
          <span style={{
            fontSize: '0.62rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: '#ffcc00'
          }}>
            ARTEMIS / CLPS
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '210px', overflowY: 'auto' }}>
          {LUNAR_SOUTH_POLE_FEATURES.slice(0, 6).map(feat => {
            return (
              <button
                key={feat.id}
                onClick={() => {
                  soundFX.playClick();
                  centerOnFeature(feat.lat, feat.lon);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.7rem'
                }}
              >
                <span>{feat.name}</span>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.62rem',
                  color: feat.peakElevationM > 3000 ? '#ff9955' : '#00f0ff'
                }}>
                  {feat.lat}°S
                </span>
              </button>
            );
          })}
        </div>

        {/* Transect Profile Tool Button */}
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              soundFX.playClick();
              setIsTransectMode(!isTransectMode);
              if (isTransectMode) {
                setTransectPoints([]);
                setTransectProfile(null);
              }
            }}
            className={`btn-minimal ${isTransectMode ? 'active' : ''}`}
            style={{
              flex: 1,
              height: '30px',
              fontSize: '0.66rem',
              background: isTransectMode ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: isTransectMode ? '#ffcc00' : 'var(--border-hairline)'
            }}
          >
            {isTransectMode ? 'CANCEL TRANSECT' : 'ELEVATION TRANSECT'}
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onSwitchTo3D();
            }}
            className="btn-minimal btn-action-primary"
            style={{ height: '30px', padding: '0 10px', fontSize: '0.66rem' }}
            title="Switch back to First-Person 3D Surface View"
          >
            3D VIEW
          </button>
        </div>
      </div>

      {/* 4. Bottom-Left Live Crosshair Inspector HUD */}
      {inspectedData && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '20px',
          width: '380px',
          background: 'rgba(10, 14, 22, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-hairline, rgba(255,255,255,0.1))',
          borderRadius: '8px',
          padding: '12px 14px',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot" style={{ background: '#00f0ff' }}></span>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '0.04em'
              }}>
                LUNAR GIS INSPECTOR (MM-PRECISION)
              </span>
            </div>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.64rem',
              color: 'var(--text-muted)'
            }}>
              LOLA GDR + DIVINER
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono, monospace)'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>COORDINATES</div>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>
                {Math.abs(inspectedData.lat).toFixed(4)}° S, {inspectedData.lon >= 0 ? inspectedData.lon.toFixed(4) : (360 + inspectedData.lon).toFixed(4)}° E
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>LOLA ELEVATION</div>
              <div style={{ color: inspectedData.elevation >= 0 ? '#ffcc00' : '#00f0ff', fontWeight: 600 }}>
                {inspectedData.elevation >= 0 ? '+' : ''}{inspectedData.elevation.toLocaleString()} m
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>SLOPE HAZARD</div>
              <div style={{
                color: inspectedData.slope < 6 ? '#00e676' : (inspectedData.slope < 16 ? '#ffcc00' : '#ff5252'),
                fontWeight: 600
              }}>
                {inspectedData.slope}° {inspectedData.slope < 6 ? '(SAFE)' : (inspectedData.slope < 16 ? '(MODERATE)' : '(HAZARD)')}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>DIVINER THERMAL</div>
              <div style={{ color: inspectedData.temperature.currentK < 60 ? '#00f0ff' : '#ffffff', fontWeight: 600 }}>
                {inspectedData.temperature.currentK} K ({inspectedData.temperature.currentK - 273}°C)
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '8px',
            padding: '6px 8px',
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>
                WATER ICE PROBABILITY (LCROSS / NEUTRON)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#00f0ff', fontWeight: 600 }}>
                {inspectedData.ice.rating}: {inspectedData.ice.abundanceWtPct} wt% WEH
              </div>
            </div>
            <div style={{
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)',
              textAlign: 'right'
            }}>
              {inspectedData.ice.depthMeters}
            </div>
          </div>
        </div>
      )}

      {/* 5. Live Elevation Transect Profile Chart */}
      {transectProfile && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          right: '20px',
          width: '460px',
          background: 'rgba(10, 14, 22, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid #ffcc00',
          borderRadius: '8px',
          padding: '14px',
          zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot" style={{ background: '#ffcc00' }}></span>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#ffffff'
              }}>
                LOLA TOPOGRAPHIC CROSS-SECTION
              </span>
            </div>
            <button
              onClick={() => {
                setTransectPoints([]);
                setTransectProfile(null);
                setIsTransectMode(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ width: '100%', height: '110px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
            {(() => {
              const elevs = transectProfile.map(p => p.elev);
              const minE = Math.min(...elevs) - 300;
              const maxE = Math.max(...elevs) + 300;
              const range = maxE - minE || 1;
              const w = 432;
              const h = 110;

              const pointsStr = transectProfile.map((pt, i) => {
                const x = (i / (transectProfile.length - 1)) * w;
                const y = h - ((pt.elev - minE) / range) * (h - 24) - 12;
                return `${x},${y}`;
              }).join(' ');

              const areaStr = `0,${h} ` + pointsStr + ` ${w},${h}`;

              return (
                <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                  <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
                  <polygon points={areaStr} fill="rgba(255, 204, 0, 0.18)" />
                  <polyline points={pointsStr} fill="none" stroke="#ffcc00" strokeWidth="2.5" />
                  
                  <text x="6" y="14" fill="#ffcc00" fontSize="9" fontFamily="var(--font-mono, monospace)">
                    MAX ELEVATION: +{Math.round(maxE - 300)}m
                  </text>
                  <text x="6" y={h - 6} fill="#00f0ff" fontSize="9" fontFamily="var(--font-mono, monospace)">
                    MIN ELEVATION: {Math.round(minE + 300)}m
                  </text>
                </svg>
              );
            })()}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '0.62rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-muted)'
          }}>
            <span>START: {transectPoints[0]?.lat.toFixed(2)}°S</span>
            <span style={{ color: '#ffcc00' }}>TOTAL TRANSECT: ~{Math.round(transectProfile.length * 3.2)} KM</span>
            <span>END: {transectPoints[1]?.lat.toFixed(2)}°S</span>
          </div>
        </div>
      )}

      {/* 6. Map Zoom & Reset Toolstrip */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: transectProfile ? '490px' : '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 20
      }}>
        <button
          onClick={() => {
            soundFX.playClick();
            setZoom(prev => Math.min(6.0, prev * 1.3));
          }}
          className="btn-minimal"
          style={{ width: '32px', height: '32px', padding: 0, fontSize: '1rem', fontWeight: 600 }}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => {
            soundFX.playClick();
            setZoom(prev => Math.max(0.6, prev * 0.77));
          }}
          className="btn-minimal"
          style={{ width: '32px', height: '32px', padding: 0, fontSize: '1rem', fontWeight: 600 }}
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={() => {
            soundFX.playClick();
            setZoom(1.2);
            setPan({ x: 0, y: 0 });
          }}
          className="btn-minimal"
          style={{ width: '32px', height: '32px', padding: 0, fontSize: '0.65rem' }}
          title="Reset View"
        >
          RESET
        </button>
      </div>
    </div>
  );
}
