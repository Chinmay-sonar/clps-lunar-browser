/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELIOS-DTE Phase 1: JPL Horizons Ephemeris Data Fetcher
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Fetches real NASA JPL Horizons DE441 ephemeris data for the Moon:
 *   - Sub-Solar selenographic longitude & latitude
 *   - Sub-Earth (observer) selenographic longitude & latitude
 * 
 * Time Range: 2026-01-01 to 2030-12-31 (sampled every 6 hours)
 * Source: NASA/JPL Solar System Dynamics Group, Horizons On-Line Ephemeris
 * Kernel: DE441 (latest JPL planetary ephemeris)
 * 
 * Output: Compressed JSON lookup table for browser-side interpolation
 * ═══════════════════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://ssd.jpl.nasa.gov/api/horizons.api';

// We fetch in 90-day chunks to stay within Horizons API limits
const CHUNK_DAYS = 90;
const STEP_HOURS = 6; // 6-hour sampling = 4 data points per day

/**
 * Builds a JPL Horizons API URL for a given date range.
 * Quantity 14 = Sub-observer (sub-Earth) lon/lat
 * Quantity 15 = Sub-solar lon/lat
 */
function buildHorizonsUrl(startDate, stopDate) {
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: "'301'",      // Moon
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",   // Geocentric (Earth center)
    START_TIME: `'${startDate}'`,
    STOP_TIME: `'${stopDate}'`,
    STEP_SIZE: `'${STEP_HOURS} h'`,
    QUANTITIES: "'14,15'"  // Sub-observer + Sub-solar coords
  });
  return `${API_BASE}?${params.toString()}`;
}

/**
 * Parses the JPL Horizons text result into structured data rows.
 * Each row: [epochMs, earthLon, earthLat, sunLon, sunLat]
 */
function parseHorizonsResult(resultText) {
  const rows = [];
  const lines = resultText.split('\n');
  
  let inData = false;
  for (const line of lines) {
    if (line.trim() === '$$SOE') { inData = true; continue; }
    if (line.trim() === '$$EOE') { inData = false; continue; }
    
    if (inData && line.trim().length > 0) {
      // Format: " 2026-Jan-01 00:00     358.716549  -6.556142   32.519634  -1.346422"
      const match = line.match(
        /(\d{4}-[A-Za-z]+-\d+\s+\d+:\d+)\s+([\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([-\d.]+)/
      );
      if (match) {
        const dateStr = match[1].trim();
        const epoch = new Date(dateStr + ' UTC').getTime();
        const earthLon = parseFloat(match[2]);
        const earthLat = parseFloat(match[3]);
        const sunLon = parseFloat(match[4]);
        const sunLat = parseFloat(match[5]);
        
        rows.push([epoch, earthLon, earthLat, sunLon, sunLat]);
      }
    }
  }
  return rows;
}

/**
 * Fetches one chunk of ephemeris data from JPL Horizons.
 */
async function fetchChunk(startDate, stopDate, chunkIndex, totalChunks) {
  const url = buildHorizonsUrl(startDate, stopDate);
  console.log(`  [${chunkIndex + 1}/${totalChunks}] Fetching ${startDate} → ${stopDate}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Horizons API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.result) {
    throw new Error(`No result in Horizons response for ${startDate}`);
  }
  
  const rows = parseHorizonsResult(data.result);
  console.log(`    ✓ Parsed ${rows.length} data points`);
  return rows;
}

/**
 * Formats a Date as "YYYY-MM-DD" for the Horizons API.
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Main pipeline: fetches all 2026–2030 ephemeris data in chunks.
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('HELIOS-DTE: NASA JPL Horizons DE441 Ephemeris Data Pipeline');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Target: Moon (301)');
  console.log('Source: NASA/JPL DE441 Planetary Ephemeris');
  console.log('Range:  2026-01-01 to 2030-12-31');
  console.log(`Step:   ${STEP_HOURS} hours (${24 / STEP_HOURS} samples/day)`);
  console.log('');
  
  const startDate = new Date('2026-01-01T00:00:00Z');
  const endDate = new Date('2030-12-31T00:00:00Z');
  
  // Calculate total chunks
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const totalChunks = Math.ceil(totalDays / CHUNK_DAYS);
  
  console.log(`Total span: ${totalDays} days → ${totalChunks} API chunks`);
  console.log('');
  
  let allRows = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkStart = new Date(startDate.getTime() + i * CHUNK_DAYS * 86400000);
    const chunkEnd = new Date(Math.min(
      chunkStart.getTime() + CHUNK_DAYS * 86400000,
      endDate.getTime()
    ));
    
    try {
      const rows = await fetchChunk(
        formatDate(chunkStart),
        formatDate(chunkEnd),
        i,
        totalChunks
      );
      allRows = allRows.concat(rows);
    } catch (err) {
      console.error(`  ✗ Error fetching chunk ${i + 1}: ${err.message}`);
      console.log('    Waiting 5s before retry...');
      await new Promise(r => setTimeout(r, 5000));
      
      try {
        const rows = await fetchChunk(
          formatDate(chunkStart),
          formatDate(chunkEnd),
          i,
          totalChunks
        );
        allRows = allRows.concat(rows);
      } catch (retryErr) {
        console.error(`  ✗ Retry failed: ${retryErr.message}`);
        // Continue with remaining chunks
      }
    }
    
    // Rate limiting: 500ms between requests to be respectful to NASA servers
    if (i < totalChunks - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log('');
  console.log(`Total data points collected: ${allRows.length}`);
  
  // Sort by epoch to ensure chronological order
  allRows.sort((a, b) => a[0] - b[0]);
  
  // Remove duplicates (chunk boundaries may overlap)
  const dedupedRows = [];
  let lastEpoch = -1;
  for (const row of allRows) {
    if (row[0] !== lastEpoch) {
      dedupedRows.push(row);
      lastEpoch = row[0];
    }
  }
  
  console.log(`After deduplication: ${dedupedRows.length} unique data points`);
  
  // Build the output object
  const output = {
    meta: {
      source: 'NASA/JPL Horizons On-Line Ephemeris System',
      kernel: 'DE441',
      target: 'Moon (301)',
      center: 'Geocentric (Earth center)',
      coordinateSystem: 'MOON_ME (Mean Earth/Polar Axis, East-longitude positive)',
      startEpoch: dedupedRows[0]?.[0],
      endEpoch: dedupedRows[dedupedRows.length - 1]?.[0],
      stepHours: STEP_HOURS,
      totalPoints: dedupedRows.length,
      fetchedAt: new Date().toISOString(),
      columns: ['epochMs', 'earthSubLon', 'earthSubLat', 'sunSubLon', 'sunSubLat'],
      units: {
        epochMs: 'Unix milliseconds (UTC)',
        earthSubLon: 'degrees East (0-360)',
        earthSubLat: 'degrees (-90 to +90)',
        sunSubLon: 'degrees East (0-360)',
        sunSubLat: 'degrees (-90 to +90)'
      }
    },
    // Compact column-oriented format to minimize file size
    epochs: dedupedRows.map(r => r[0]),
    earthSubLon: dedupedRows.map(r => parseFloat(r[1].toFixed(4))),
    earthSubLat: dedupedRows.map(r => parseFloat(r[2].toFixed(4))),
    sunSubLon: dedupedRows.map(r => parseFloat(r[3].toFixed(4))),
    sunSubLat: dedupedRows.map(r => parseFloat(r[4].toFixed(4)))
  };
  
  // Write the full-precision JSON
  const outputPath = path.join(__dirname, '..', 'data', 'jplDE441_ephemeris_2026_2030.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output));
  
  const fileSizeKB = (Buffer.byteLength(JSON.stringify(output)) / 1024).toFixed(1);
  console.log('');
  console.log(`✓ Written to: ${outputPath}`);
  console.log(`  File size: ${fileSizeKB} KB`);
  console.log('');
  
  // Print validation summary
  if (dedupedRows.length > 0) {
    const first = dedupedRows[0];
    const last = dedupedRows[dedupedRows.length - 1];
    console.log('═══ Validation Summary ═══');
    console.log(`First epoch: ${new Date(first[0]).toISOString()}`);
    console.log(`  Sun:   lon=${first[3].toFixed(4)}° lat=${first[4].toFixed(4)}°`);
    console.log(`  Earth: lon=${first[1].toFixed(4)}° lat=${first[2].toFixed(4)}°`);
    console.log(`Last epoch: ${new Date(last[0]).toISOString()}`);
    console.log(`  Sun:   lon=${last[3].toFixed(4)}° lat=${last[4].toFixed(4)}°`);
    console.log(`  Earth: lon=${last[1].toFixed(4)}° lat=${last[2].toFixed(4)}°`);
    
    // Compute sub-solar latitude range (should be near ±1.54°)
    const sunLatMin = Math.min(...output.sunSubLat);
    const sunLatMax = Math.max(...output.sunSubLat);
    console.log(`Sub-solar latitude range: ${sunLatMin.toFixed(4)}° to ${sunLatMax.toFixed(4)}°`);
    console.log(`  (Expected: approximately ±1.5424° from lunar obliquity)`);
    
    // Compute sub-Earth latitude range (should be near ±6.7°)
    const earthLatMin = Math.min(...output.earthSubLat);
    const earthLatMax = Math.max(...output.earthSubLat);
    console.log(`Sub-Earth latitude range: ${earthLatMin.toFixed(4)}° to ${earthLatMax.toFixed(4)}°`);
    console.log(`  (Expected: approximately ±6.7° from lunar libration)`);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Pipeline complete. DE441 ephemeris data ready for engine.');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
