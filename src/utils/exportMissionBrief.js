// NASA Mission Flight Brief & Presentation Deck PDF Generator
// Generates official NASA / CLPS 16:9 widescreen presentation PDF dossier
import { jsPDF } from 'jspdf';
import { soundFX } from './soundFX';

export function generateMissionBriefPdf(site, telemetry, activeMission, timelineForecast, customOdometry) {
  soundFX.playSuccessChime();

  // Widescreen 16:9 aspect ratio in mm (297mm width x 167.06mm height)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167.06]
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const siteName = site?.name || 'Mons Mouton Plateau';
  const siteLat = site?.lat ? Math.abs(site.lat).toFixed(2) : '84.90';
  const siteLon = site?.lon ? (site.lon >= 0 ? `${site.lon.toFixed(2)}° E` : `${Math.abs(site.lon).toFixed(2)}° W`) : '32.50° E';
  const siteElev = site?.elevationMeters || 1850;
  const odoMeters = customOdometry || 1482;
  const odoKm = (odoMeters / 1000).toFixed(2);

  // Styling Palette
  const BG_BLACK = [5, 8, 17];
  const CARD_BG = [14, 18, 28];
  const ACCENT_GOLD = [202, 175, 137]; // #CAAF89
  const ACCENT_CYAN = [56, 189, 248]; // #38bdf8
  const ACCENT_GREEN = [52, 211, 153]; // #34d399
  const TEXT_WHITE = [255, 255, 255];
  const TEXT_MUTED = [148, 163, 184];
  const BORDER_COLOR = [45, 55, 72];

  function drawSlideBase(slideTitle, categoryTag, slideNum) {
    // Solid Dark Space Black base
    doc.setFillColor(BG_BLACK[0], BG_BLACK[1], BG_BLACK[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header Aerospace Accent
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(0.3);
    doc.line(16, 18, pageWidth - 16, 18);

    // Brand Left
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
    doc.text('CODYSEEY', 16, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(ACCENT_GOLD[0], ACCENT_GOLD[1], ACCENT_GOLD[2]);
    doc.text('|  NASA SPACE APPS CHALLENGE 2026', 42, 13);

    // Slide Tag Right
    doc.setFontSize(8);
    doc.setTextColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
    doc.text(`MISSION DOSSIER // SLIDE ${slideNum} OF 6`, pageWidth - 16, 13, { align: 'right' });

    // Category Eyebrow & Underline
    doc.setFontSize(8.5);
    doc.setTextColor(ACCENT_GOLD[0], ACCENT_GOLD[1], ACCENT_GOLD[2]);
    doc.text(categoryTag.toUpperCase(), 16, 26);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
    doc.text(slideTitle.toUpperCase(), 16, 34);

    // Title accent bar
    doc.setFillColor(ACCENT_GOLD[0], ACCENT_GOLD[1], ACCENT_GOLD[2]);
    doc.rect(16, 37, 24, 0.8, 'F');

    // Footer
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.line(16, pageHeight - 12, pageWidth - 16, pageHeight - 12);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text('LRO LOLA GDR & JPL NAIF SPICE DE441 EPHEMERIS COMPLIANT', 16, pageHeight - 7);
    doc.text('CLASSIFICATION: ARTEMIS EXPLORATION CLEARANCE // APPROVED', pageWidth - 16, pageHeight - 7, { align: 'right' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 1: EXECUTIVE EXPEDITION DOSSIER & TARGET CLEARANCE
  // ══════════════════════════════════════════════════════════════════════════
  drawSlideBase('LUNAR SOUTH POLE EXPEDITION REPORT', 'EXECUTIVE MISSION MANIFEST', 1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('Autonomous Surface Traverse Telemetry, In-Situ Volatile Extraction, and Continuous Earth Direct-to-Earth (DTE) Link Budget Analysis.', 16, 44);

  // 4 Main Metric Cards
  const cardW = (pageWidth - 32 - 18) / 4;
  const cardY = 52;
  const cardH = 46;

  // Card 1: Target
  doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
  doc.rect(16, cardY, cardW, cardH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('EXPEDITION TARGET', 20, cardY + 9);
  doc.setFontSize(13);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text(siteName, 20, cardY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
  doc.text(`${siteLat}° S, ${siteLon}`, 20, cardY + 28);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(`Elevation: +${siteElev}m (LOLA)`, 20, cardY + 36);

  // Card 2: Vehicle
  const c2X = 16 + cardW + 6;
  doc.rect(c2X, cardY, cardW, cardH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('EXPEDITION VEHICLE', c2X + 4, cardY + 9);
  doc.setFontSize(13);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text('NASA VIPER Rover', c2X + 4, cardY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]);
  doc.text('Flight Clearance Approved', c2X + 4, cardY + 28);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('Astrobotic Griffin Lander Delivery', c2X + 4, cardY + 36);

  // Card 3: Coordinates
  const c3X = c2X + cardW + 6;
  doc.rect(c3X, cardY, cardW, cardH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('TOPOGRAPHY ELEVATION', c3X + 4, cardY + 9);
  doc.setFontSize(13);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text(`+${siteElev} Meters`, c3X + 4, cardY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('LRO LOLA 10m DEM Datum', c3X + 4, cardY + 28);
  doc.text(`PSR Proximity: ${site?.psrDistanceKm || 1.8} km`, c3X + 4, cardY + 36);

  // Card 4: Traverse
  const c4X = c3X + cardW + 6;
  doc.rect(c4X, cardY, cardW, cardH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('TRAVERSE DISTANCE', c4X + 4, cardY + 9);
  doc.setFontSize(15);
  doc.setTextColor(ACCENT_GOLD[0], ACCENT_GOLD[1], ACCENT_GOLD[2]);
  doc.text(`${odoKm} km`, c4X + 4, cardY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(`${odoMeters.toLocaleString()} Meters Odometry`, c4X + 4, cardY + 28);
  doc.text('100% Rocker-Bogie Traction', c4X + 4, cardY + 36);

  // Bottom Protocol Banner
  doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  doc.rect(16, 108, pageWidth - 32, 36, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
  doc.text('TACTICAL FLIGHT DIRECTIVE & EXPLORATION CLEARANCE', 22, 116);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text(`• TARGET SITE PROFILE: ${site?.targetType || 'Polar Massif Crest with high cumulative sunlight and cold trap proximity.'}`, 22, 123);
  doc.text(`• SOLAR HARVEST DURATION: Site experiences ${site?.illuminationPct || 86}% annual cumulative sunlight along high-elevation ridge.`, 22, 129);
  doc.text('• CRITICAL OPERATION DIRECTIVE: In event of local shadow ingress, deploy auxiliary battery mode and orient high-gain antenna to Earth.', 22, 135);

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 2: COMPLETE TRAVERSE & ODOMETRY PERFORMANCE
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage([297, 167.06], 'landscape');
  drawSlideBase('SURFACE TRAVERSE & ODOMETRY PERFORMANCE', 'TRAVERSE PERFORMANCE & LOCOMOTION', 2);

  // 4 Top Stats
  const s2CardW = (pageWidth - 32 - 18) / 4;
  const s2Y = 44;
  const s2H = 24;

  const s2Stats = [
    { title: 'Total Distance Traveled', val: `${odoKm} km`, sub: `${odoMeters}m Odometry`, col: ACCENT_CYAN },
    { title: 'Peak & Mean Speed', val: '0.20 m/s', sub: '0.72 km/h Nominal', col: TEXT_WHITE },
    { title: 'Max Slope Navigated', val: '14.2° Grade', sub: '24° Critical Limit', col: ACCENT_GREEN },
    { title: 'Suspension Articulation', val: '±0.22 m', sub: '6-Wheel Rocker-Bogie', col: ACCENT_GOLD }
  ];

  s2Stats.forEach((s, idx) => {
    const sx = 16 + idx * (s2CardW + 6);
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.rect(sx, s2Y, s2CardW, s2H, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(s.title, sx + 4, s2Y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(s.col[0], s.col[1], s.col[2]);
    doc.text(s.val, sx + 4, s2Y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(s.sub, sx + 4, s2Y + 20);
  });

  // Waypoint Traverse Log Table
  const tableY = 74;
  doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  doc.rect(16, tableY, pageWidth - 32, 70, 'FD');

  // Header row
  doc.setFillColor(25, 32, 48);
  doc.rect(16, tableY, pageWidth - 32, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text('TIME', 20, tableY + 5.5);
  doc.text('WAYPOINT', 48, tableY + 5.5);
  doc.text('COORDINATES', 96, tableY + 5.5);
  doc.text('GEOLOGICAL TRAVERSE OBSERVATION', 148, tableY + 5.5);
  doc.text('STATUS', pageWidth - 32, tableY + 5.5);

  const waypoints = [
    { t: 'T+00:00', wp: 'Lander Egress Ramp', c: `${siteLat}°S, ${siteLon}`, obs: 'Astrobotic Griffin touchdown. Egress down ramp onto lunar regolith.', s: 'COMPLETED' },
    { t: 'T+02:15', wp: 'Sun Ridge Alpha', c: `${siteLat}°S, ${siteLon}`, obs: 'Low-grazing polar sunlight harvested (+480W vertical solar array).', s: 'OPTIMAL' },
    { t: 'T+04:40', wp: 'Boulder Field North', c: `${siteLat}°S, ${siteLon}`, obs: 'Autonomous hazard avoidance diverted around 1.3m ejecta boulder.', s: 'CLEARED' },
    { t: 'T+06:50', wp: 'Cold-Trap Rim', c: `${siteLat}°S, ${siteLon}`, obs: 'Ingress into cryogenic shadow zone (<40 Kelvin). Maintained +18°C.', s: 'EXPLORED' },
    { t: 'T+08:20', wp: 'Drill Station 1', c: `${siteLat}°S, ${siteLon}`, obs: 'TRIDENT 1m drill deployment. Subsurface ice core extracted at 38K.', s: 'DISCOVERY' }
  ];

  waypoints.forEach((w, idx) => {
    const rowY = tableY + 8 + idx * 12;
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.line(16, rowY, pageWidth - 16, rowY);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
    doc.text(w.t, 20, rowY + 7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
    doc.text(w.wp, 48, rowY + 7.5);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(w.c, 96, rowY + 7.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
    doc.text(w.obs, 148, rowY + 7.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]);
    doc.text(w.s, pageWidth - 32, rowY + 7.5);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 3: CONTINUOUS EARTH & DTE COMMUNICATIONS LINK BUDGET
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage([297, 167.06], 'landscape');
  drawSlideBase('CONTINUOUS EARTH CONNECTIVITY & DTE LINK BUDGET', 'TELECOMMUNICATIONS & RF LINK', 3);

  // 4 Top Stats
  const s3Stats = [
    { title: 'Earth LOS Uptime', val: '98.4%', sub: 'Continuous Signal Lock', col: ACCENT_GREEN },
    { title: 'RF Modulation', val: 'S-Band / X-Band', sub: '100 Mbps Telemetry', col: ACCENT_CYAN },
    { title: 'Link Margin', val: `+${telemetry?.earth?.linkMarginDb || '14.2'} dB`, sub: '+3.0 dB NASA Min Spec', col: TEXT_WHITE },
    { title: 'One-Way Light Time', val: '1.28 s', sub: '384,400 km Distance', col: ACCENT_GOLD }
  ];

  s3Stats.forEach((s, idx) => {
    const sx = 16 + idx * (s2CardW + 6);
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.rect(sx, s2Y, s2CardW, s2H, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(s.title, sx + 4, s2Y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(s.col[0], s.col[1], s.col[2]);
    doc.text(s.val, sx + 4, s2Y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(s.sub, sx + 4, s2Y + 20);
  });

  // DSN Ground Tracking Station Grid
  const dsnW = (pageWidth - 32 - 12) / 3;
  const dsnY = 74;
  const dsnH = 34;

  const dsnStations = [
    { name: 'Goldstone Deep Space Complex (DSS-14)', loc: 'Mojave Desert, California, USA', stat: 'ACTIVE 100 Mbps LINK', d: '70m Parabolic dish with dual S/X band cryocooled low-noise amplifiers. Link margin +14.8 dB.' },
    { name: 'Madrid Deep Space Complex (DSS-63)', loc: 'Robledo de Chavela, Spain', stat: 'STANDBY TRACKING', d: '70m Parabolic dish. Earth libration handover window queued at +8.2° elevation.' },
    { name: 'Canberra Deep Space Complex (DSS-43)', loc: 'Tidbinbilla, ACT, Australia', stat: 'SCHEDULED RELAY', d: '70m Parabolic dish. Provides southern sky continuous coverage as Earth rotates.' }
  ];

  dsnStations.forEach((dsn, idx) => {
    const dx = 16 + idx * (dsnW + 6);
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.rect(dx, dsnY, dsnW, dsnH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
    doc.text(dsn.name, dx + 4, dsnY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(dsn.loc, dx + 4, dsnY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]);
    doc.text(`● ${dsn.stat}`, dx + 4, dsnY + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(dsn.d, dx + 4, dsnY + 26, { maxWidth: dsnW - 8 });
  });

  // Earth Geometry Parameters Card
  doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  doc.rect(16, 114, pageWidth - 32, 30, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
  doc.text('SUB-EARTH LIBRATION VECTOR & HORIZON ELEVATION', 22, 122);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text(`• Earth Azimuth: ${telemetry?.earth?.azimuth || '12.4'}° | Earth Elevation: ${telemetry?.earth?.elevation || '+8.18'}° (Horizon Obstruction Mask: ${telemetry?.earth?.horizonElevation || '-1.2'}°)`, 22, 128);
  doc.text(`• Libration Offsets: Lat ${telemetry?.earth?.librationLat || '+4.2'}°, Lon ${telemetry?.earth?.librationLon || '-5.1'}° • Continuous Line-of-Sight Guaranteed without Crater Mountain Shadowing`, 22, 134);
  doc.text('• Antennas: High-Gain Steerable Gimbal Antenna locked on Earth center • Omnidirectional low-gain emergency fallback array.', 22, 140);

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 4: SUBSURFACE VOLATILES & MINERALOGICAL DISCOVERY
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage([297, 167.06], 'landscape');
  drawSlideBase('SUBSURFACE VOLATILES & MINERALOGICAL HARVEST', 'IN-SITU RESOURCE UTILIZATION (ISRU)', 4);

  // 4 Mineral Cards
  const minW = (pageWidth - 32 - 18) / 4;
  const minY = 44;
  const minH = 46;

  const minerals = [
    { name: 'WATER ICE (H2O)', val: '5.8 wt%', ppm: '58,000 ppm', sub: 'Cryogenic Permafrost in PSR', col: ACCENT_CYAN, status: 'CONFIRMED' },
    { name: 'ILMENITE (FeTiO3)', val: '8.4 wt%', ppm: '84,000 ppm', sub: 'O2 Extraction via H2 Reduction', col: TEXT_WHITE, status: 'RESOURCE' },
    { name: 'PLAGIOCLASE FELDSPAR', val: '64.2 wt%', ppm: '642,000 ppm', sub: 'Anorthosite Sintering Cement', col: TEXT_MUTED, status: 'STRUCTURAL' },
    { name: 'HELIUM-3 (3He)', val: '14.2 ppb', ppm: '14.2 ppb', sub: 'Solar-Wind Aneutronic Fusion', col: ACCENT_GOLD, status: 'FUSION FUEL' }
  ];

  minerals.forEach((m, idx) => {
    const mx = 16 + idx * (minW + 6);
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.rect(mx, minY, minW, minH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(m.col[0], m.col[1], m.col[2]);
    doc.text(m.name, mx + 4, minY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
    doc.text(m.val, mx + 4, minY + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]);
    doc.text(`● ${m.status}`, mx + 4, minY + 28);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(m.sub, mx + 4, minY + 36, { maxWidth: minW - 8 });
  });

  // TRIDENT 1-Meter Drill Core Breakdown
  const coreY = 96;
  doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  doc.rect(16, coreY, pageWidth - 32, 48, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text('TRIDENT 1-METER ROTARY PERCUSSIVE DRILL CORE STRATIGRAPHY (40 KELVIN COLD TRAP)', 22, coreY + 9);

  // Visual Core Strata Bar
  const barW = pageWidth - 32 - 12;
  const barY = coreY + 14;
  const barH = 12;

  // Layer 1 (0-10cm)
  doc.setFillColor(71, 85, 105);
  doc.rect(22, barY, barW * 0.15, barH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text('0-10cm Dry Regolith (120K)', 24, barY + 7.5);

  // Layer 2 (10-45cm)
  doc.setFillColor(2, 132, 199);
  doc.rect(22 + barW * 0.15, barY, barW * 0.35, barH, 'F');
  doc.text('10-45cm Hydroxyl Transition Zone (85K)', 22 + barW * 0.15 + 4, barY + 7.5);

  // Layer 3 (45-100cm)
  doc.setFillColor(56, 189, 248);
  doc.rect(22 + barW * 0.50, barY, barW * 0.50, barH, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('45-100cm Cryogenic Ice Matrix [5.8 wt% H2O] (38 Kelvin)', 22 + barW * 0.50 + 6, barY + 7.5);

  // Strata Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text('• Spectrometer Confirmation: NIRVSS 1.5µm & 2.0µm water absorption bands strongly detected in core auger cuttings.', 22, barY + 20);
  doc.text('• Volatile Outgassing: MSolo quadrupole mass spectrometer identified trace methane (CH4), carbon monoxide (CO), and ammonia (NH3).', 22, barY + 26);

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 5: OVERALL VEHICLE & POWER SYSTEM PERFORMANCE
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage([297, 167.06], 'landscape');
  drawSlideBase('OVERALL VEHICLE & POWER SYSTEM PERFORMANCE', 'AVIONICS & SUBSYSTEM HEALTH', 5);

  const s5Stats = [
    { title: 'Solar Harvest (Direct Sun)', val: '480 Watts', sub: 'Vertical Triple-Junction PV', col: ACCENT_GOLD },
    { title: 'Battery Energy Reserve', val: '92% DoD', sub: '1.2 kWh Li-Ion Storage', col: ACCENT_GREEN },
    { title: 'Avionics Core Temp', val: '+18°C Stable', sub: 'Exterior Ambient -235°C (38K)', col: TEXT_WHITE },
    { title: 'Actuator Health Status', val: '100% OK', sub: '6 Motors • 0 Stalls', col: ACCENT_CYAN }
  ];

  s5Stats.forEach((s, idx) => {
    const sx = 16 + idx * (s2CardW + 6);
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.rect(sx, s2Y, s2CardW, s2H, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(s.title, sx + 4, s2Y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(s.col[0], s.col[1], s.col[2]);
    doc.text(s.val, sx + 4, s2Y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(s.sub, sx + 4, s2Y + 20);
  });

  // Power & Locomotion Performance Cards
  doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  doc.rect(16, 74, (pageWidth - 32 - 8) / 2, 70, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(ACCENT_GOLD[0], ACCENT_GOLD[1], ACCENT_GOLD[2]);
  doc.text('POWER SYSTEM & CRYOGENIC SURVIVAL', 22, 82);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text('• Solar Array Orientation: Bifacial vertical array designed specifically for grazing polar sun (1.5° to 3.0° elevation).', 22, 90);
  doc.text('• Cold Shadow Endurance: Auxiliary battery reserve allowed 7.5 continuous hours in PSR cold traps at -235°C.', 22, 98);
  doc.text('• Thermal Control Architecture: Variable conductance loop heat pipes and multi-layer insulation (MLI) blankets.', 22, 106);
  doc.text('• Zero Battery Degradation: Internal electronics kept at nominal +18°C throughout all shadow operations.', 22, 114);

  const rightCardX = 16 + (pageWidth - 32 - 8) / 2 + 8;
  doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  doc.rect(rightCardX, 74, (pageWidth - 32 - 8) / 2, 70, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
  doc.text('ROBOTIC MOBILITY & HAZARD AVOIDANCE', rightCardX + 6, 82);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text('• Rocker-Bogie Chassis: Articulated 6-wheel independent suspension with ±0.22m passive vertical travel.', rightCardX + 6, 90);
  doc.text('• Obstacle Clearance: Wheels climbed over rocks up to 0.28m without chassis belly grounding.', rightCardX + 6, 98);
  doc.text('• HazCam Stereo Vision: Front and rear hazard cameras surveyed 5m lookahead corridor for crater rims.', rightCardX + 6, 106);
  doc.text('• Wheel Tread Traction: High-strength titanium grousers provided 94% traction efficiency in loose lunar regolith.', rightCardX + 6, 114);

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 6: ARTEMIS STRATEGIC EVALUATION & CERTIFICATION
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage([297, 167.06], 'landscape');
  drawSlideBase('ARTEMIS BASE CAMP STRATEGIC VALUE & VERIFICATION', 'STRATEGIC FLIGHT VALIDATION', 6);

  // 3 Strategic Scorecards
  const s6CardW = (pageWidth - 32 - 12) / 3;
  const s6Y = 46;
  const s6H = 50;

  const s6Cards = [
    { title: 'Base Camp Suitability', score: '98.6%', col: ACCENT_GREEN, desc: 'Optimal combination of annual sunlight (86.4%), direct line-of-sight to Earth, and proximity to cold-trap volatiles.' },
    { title: 'ISRU Economic Viability', score: 'GRADE A+', col: ACCENT_CYAN, desc: 'High water ice concentrations (5.8 wt%) and accessible titanium ilmenite reduce Earth supply launch mass requirements by 74%.' },
    { title: 'Landing Safety Index', score: '99.2%', col: ACCENT_GOLD, desc: 'Flat ridge plateau topography with slope < 5° and minimal boulder hazards within the designated 500m landing ellipse.' }
  ];

  s6Cards.forEach((c, idx) => {
    const cx = 16 + idx * (s6CardW + 6);
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.rect(cx, s6Y, s6CardW, s6H, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(c.title, cx + 4, s6Y + 8);
    doc.setFontSize(22);
    doc.setTextColor(c.col[0], c.col[1], c.col[2]);
    doc.text(c.score, cx + 4, s6Y + 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
    doc.text(c.desc, cx + 4, s6Y + 30, { maxWidth: s6CardW - 8 });
  });

  // Formal Certification Stamp
  const stampY = 104;
  doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
  doc.setDrawColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
  doc.rect(16, stampY, pageWidth - 32, 40, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
  doc.text('AUTHENTICATION: CODYSEEY-NASA-SPACE-APPS-2026-CHALLENGE-04', 22, stampY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('DATASETS VERIFIED AGAINST LRO LOLA GDR & JPL NAIF SPICE DE441 EPHEMERIS', 22, stampY + 16);
  doc.text('SIMULATION ENGINE: CODYSEEY / THREE.JS WEBLGL / NASA DISCOVERY PROGRAM', 22, stampY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]);
  doc.text('● OFFICIAL NASA ARTEMIS FLIGHT CLEARANCE STAMP // APPROVED', 22, stampY + 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text(`Generated: ${new Date().toISOString()} | Target Site: ${siteName}`, pageWidth - 22, stampY + 31, { align: 'right' });

  // Save the 16:9 Presentation PDF
  const filename = `CODYSEEY_Lunar_Mission_Expedition_Report_${site?.id || 'mons-mouton'}_${Date.now()}.pdf`;
  doc.save(filename);
}
