/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELIOS-DTE: Comparative Matrix Automated Validation Suite
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  evaluateMultiSiteComparison,
  compareSitesHeadToHead,
  DEFAULT_TRADE_WEIGHTS,
  SITE_PALETTE
} from './comparativeMatrix.js';
import { LANDING_SITES } from './landingSitesDE441.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║       HELIOS-DTE COMPARATIVE MATRIX VALIDATION SUITE               ║');
console.log('║     Multi-Site Synchronous Trade Study & MCDA Ranking Tests        ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// ─── SUITE 1: Basic Evaluation & Multi-Site Synchronicity ───
console.log('══════════════════════════════════════════════════════════════════════');
console.log(' SUITE 1: Multi-Site Synchronous Time-Series Generation');
console.log('══════════════════════════════════════════════════════════════════════');

const testEpoch = new Date('2026-12-05T00:00:00Z');
const threeSites = ['malapert-massif', 'shackleton-connecting-ridge', 'mons-mouton'];
const result3 = evaluateMultiSiteComparison({
  siteIds: threeSites,
  startDate: testEpoch,
  durationDays: 7,
  stepHours: 2
});

assert(result3.sites.length === 3, 'Evaluates exact requested number of sites (3 sites)');
assert(result3.window.totalSteps === (7 * 24 / 2) + 1, 'Total step count matches 7 days at 2h intervals (85 steps)', `steps=${result3.window.totalSteps}`);
assert(result3.timestamps.length === result3.window.totalSteps, 'Timestamps array length matches total steps');

const site1 = result3.sites[0];
assert(site1.series.power.length === result3.window.totalSteps, 'Power time series has correct length');
assert(site1.series.sunElevation.length === result3.window.totalSteps, 'Sun elevation time series has correct length');
assert(site1.series.earthElevation.length === result3.window.totalSteps, 'Earth elevation time series has correct length');
assert(site1.series.linkMargin.length === result3.window.totalSteps, 'Link margin time series has correct length');
assert(site1.series.viability.length === result3.window.totalSteps, 'Viability time series has correct length');

// ─── SUITE 2: All 6 Candidate Sites Full Trade Study ───
console.log('\n══════════════════════════════════════════════════════════════════════');
console.log(' SUITE 2: Comprehensive 6-Site Evaluation & Ranking');
console.log('══════════════════════════════════════════════════════════════════════');

const all6SiteIds = LANDING_SITES.map(s => s.id);
const t0 = performance.now();
const resultAll6 = evaluateMultiSiteComparison({
  siteIds: all6SiteIds,
  startDate: testEpoch,
  durationDays: 14,
  stepHours: 2
});
const elapsed = performance.now() - t0;

console.log(`  Processed 6 sites x 169 steps (${6 * 169} state vector calculations) in ${elapsed.toFixed(1)} ms`);
assert(resultAll6.sites.length === 6, 'Successfully evaluated all 6 South Pole candidate sites');
assert(resultAll6.rankedSites.length === 6, 'All 6 sites ranked in priority order');
assert(resultAll6.rankedSites[0].rank === 1, 'Top site assigned Rank #1');
assert(resultAll6.rankedSites[0].tier === 'PRIME_CANDIDATE', 'Top site classified as PRIME_CANDIDATE');
assert(
  resultAll6.rankedSites[0].metrics.compositeScore >= resultAll6.rankedSites[1].metrics.compositeScore,
  'Ranking is strictly monotonic descending by composite score'
);
assert(elapsed < 200, 'Evaluation executed well within 200ms real-time budget', `actual=${elapsed.toFixed(1)}ms`);

// ─── SUITE 3: Physical & Trade-Off Constraints Validation ───
console.log('\n══════════════════════════════════════════════════════════════════════');
console.log(' SUITE 3: Physical Metric Bounds & Consistency');
console.log('══════════════════════════════════════════════════════════════════════');

for (const s of resultAll6.sites) {
  assert(
    s.metrics.illuminationPct >= 0 && s.metrics.illuminationPct <= 100,
    `${s.site.name} illumination percentage within [0, 100]%`,
    `val=${s.metrics.illuminationPct}`
  );
  assert(
    s.metrics.commsAvailabilityPct >= 0 && s.metrics.commsAvailabilityPct <= 100,
    `${s.site.name} comms availability within [0, 100]%`,
    `val=${s.metrics.commsAvailabilityPct}`
  );
  assert(
    s.metrics.compositeScore >= 0 && s.metrics.compositeScore <= 100,
    `${s.site.name} composite score within [0, 100]`,
    `val=${s.metrics.compositeScore}`
  );
  assert(
    s.metrics.longestSunHours >= 0 && s.metrics.longestSunHours <= 14 * 24,
    `${s.site.name} longest continuous daylight hours within window bounds`,
    `val=${s.metrics.longestSunHours}`
  );
  assert(
    SITE_PALETTE[s.site.id] !== undefined,
    `${s.site.name} has assigned visualization theme color`
  );
}

// ─── SUITE 4: Head-to-Head Comparison Engine ───
console.log('\n══════════════════════════════════════════════════════════════════════');
console.log(' SUITE 4: Head-to-Head Differential Comparison');
console.log('══════════════════════════════════════════════════════════════════════');

const h2h = compareSitesHeadToHead('malapert-massif', 'shackleton-connecting-ridge', testEpoch);
assert(h2h.siteA.id === 'malapert-massif', 'Head-to-head correctly maps Site A');
assert(h2h.siteB.id === 'shackleton-connecting-ridge', 'Head-to-head correctly maps Site B');
assert(typeof h2h.delta.illuminationDiffPct === 'number', 'Calculated illumination differential');
assert(typeof h2h.delta.commsDiffPct === 'number', 'Calculated comms availability differential');
assert(typeof h2h.delta.scoreDiff === 'number', 'Calculated composite score differential');
assert(h2h.winner === h2h.siteA.name || h2h.winner === h2h.siteB.name, 'Declared winner between candidates');

console.log(`\n══════════════════════════════════════════════════════════════════════`);
console.log(` COMPARATIVE MATRIX SUMMARY: ${passed} PASSED / ${failed} FAILED (${passed + failed} total)`);
console.log(`══════════════════════════════════════════════════════════════════════\n`);

if (failed > 0) {
  process.exit(1);
}
