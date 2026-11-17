# HELIOS-DTE Phase 1: Precision Ephemeris & Physics Engine

## Architecture
This directory contains the scientifically validated core engine modules:

1. **ephemerisDE441.js** — Precision lunar ephemeris validated against NASA JPL Horizons DE441
2. **horizonProfiles.js** — Real LOLA-derived 360° topographic horizon masks for 6 candidate sites
3. **physicsEngine.js** — Multi-output physics solver (shadow, power, DTE, thermal, viability)
4. **validationTests.js** — Automated test harness comparing against JPL Horizons ground truth

## Data Sources
- NASA JPL Horizons API (DE441 planetary ephemeris)
- NASA LOLA 5m/pixel South Pole DEMs
- NASA Diviner Lunar Radiometer Experiment
- NASA Lunar Prospector Neutron Spectrometer

## Validation Protocol
Every ephemeris computation is benchmarked against JPL Horizons API output.
Maximum tolerable error: ±0.05° for sub-solar/sub-Earth coordinates.
