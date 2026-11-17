# Codyseey Automated Verification & Test Suite

This directory contains integration, visual regression, and astrodynamic validation scripts for the **Codyseey CLPS Lunar Mission Browser**.

## Test Files

- `verify_guide_and_timeline.cjs`: Verifies interactive guidance card tab switching (Recommendation, Solar Dynamics, Earth DTE, Challenge Criteria) and Solstice timeline indicator points.
- `verify_latest_features.cjs`: End-to-end mission staging verification (landing site select, rover selection, 3D viewport canvas load).
- `verify_all_user_fixes.cjs`: Regression suite for ground contact envelope, rover chassis attitude clamping, and radar elevation tracking.
- `test_flow.py` / `test_full_flow.py`: Full journey simulation tests across landing, surface traversal, and mission report generation.

## Running Tests

To run the node-based verification scripts:
```bash
node tests/verify_guide_and_timeline.cjs
node tests/verify_latest_features.cjs
```
