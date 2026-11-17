import React, { useState, useEffect, useMemo } from 'react';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * ULTRA-MINIMAL LUNAR SURFACE REGION & TELEMETRY FILTER
 * ═════════════════════════════════════════════════════════════════════════════
 * - Arrives ONLY when user is on Step 1 (choosing the landing site).
 * - Ultra-minimal, clean glass UI with zero clutter.
 * - Single-line compact items: site name, peak range, and connectivity badge.
 * - Selecting any tier immediately auto-pins all matching locations on the Moon!
 * - Selecting any location focuses the Moon on it and dismisses the other pins.
 */

export const LUNAR_SURFACE_REGIONS = [
  // ─── STRONG TIERS (Spread Across Central & High Nearside) ───
  {
    id: 'malapert-mountain',
    name: 'Malapert Mountain (Massif)',
    sector: 'Sector Alpha • South Pole 86.0°S',
    lat: -86.0,
    lon: 0.0,
    elevationM: 5040,
    illuminationPct: 89.4,
    signalTier: 'Strong',
    sunlightTier: 'Strong',
    peakRange: '+5,040m',
    sunlight: '89.4%',
    connectivity: 'Strong',
    connectivityColor: '#34d399'
  },
  {
    id: 'mare-tranquillitatis',
    name: 'Mare Tranquillitatis',
    sector: 'Sector Nearside • 0.7°N, 23.5°E',
    lat: 0.7,
    lon: 23.5,
    elevationM: -1300,
    illuminationPct: 89.2,
    signalTier: 'Strong',
    sunlightTier: 'Strong',
    peakRange: '-1,300m',
    sunlight: '89.2%',
    connectivity: 'Strong',
    connectivityColor: '#34d399'
  },
  {
    id: 'sinus-medii',
    name: 'Sinus Medii Meridian',
    sector: 'Sector Prime • 1.6°N, 1.0°E',
    lat: 1.6,
    lon: 1.0,
    elevationM: -1000,
    illuminationPct: 91.0,
    signalTier: 'Strong',
    sunlightTier: 'Strong',
    peakRange: '-1,000m',
    sunlight: '91.0%',
    connectivity: 'Strong',
    connectivityColor: '#34d399'
  },
  {
    id: 'oceanus-procellarum',
    name: 'Oceanus Procellarum',
    sector: 'Sector West • 23.7°N, 47.4°W',
    lat: 23.7,
    lon: -47.4,
    elevationM: -2100,
    illuminationPct: 88.0,
    signalTier: 'Strong',
    sunlightTier: 'Strong',
    peakRange: '-2,100m',
    sunlight: '88.0%',
    connectivity: 'Strong',
    connectivityColor: '#34d399'
  },
  {
    id: 'mare-imbrium',
    name: 'Mare Imbrium Rim',
    sector: 'Sector North • 32.8°N, 15.6°W',
    lat: 32.8,
    lon: -15.6,
    elevationM: 1600,
    illuminationPct: 87.5,
    signalTier: 'Strong',
    sunlightTier: 'Strong',
    peakRange: '+1,600m',
    sunlight: '87.5%',
    connectivity: 'Strong',
    connectivityColor: '#34d399'
  },
  {
    id: 'mons-mouton',
    name: 'Mons Mouton Plateau',
    sector: 'Sector Beta • Nearside 84.9°S',
    lat: -84.9,
    lon: 29.5,
    elevationM: 3100,
    illuminationPct: 83.7,
    signalTier: 'Strong',
    sunlightTier: 'Strong',
    peakRange: '+3,100m',
    sunlight: '83.7%',
    connectivity: 'Strong',
    connectivityColor: '#34d399'
  },

  // ─── GOOD TIERS (Spread Across Nearside Limbs & Highlands) ───
  {
    id: 'mare-crisium',
    name: 'Mare Crisium Basin',
    sector: 'Sector East • 17.0°N, 59.1°E',
    lat: 17.0,
    lon: 59.1,
    elevationM: -3200,
    illuminationPct: 84.0,
    signalTier: 'Good',
    sunlightTier: 'Good',
    peakRange: '-3,200m',
    sunlight: '84.0%',
    connectivity: 'Good',
    connectivityColor: '#38bdf8'
  },
  {
    id: 'tycho-rim',
    name: 'Tycho Crater Rim',
    sector: 'Sector South • 43.3°S, 11.2°W',
    lat: -43.3,
    lon: -11.2,
    elevationM: 2200,
    illuminationPct: 82.5,
    signalTier: 'Good',
    sunlightTier: 'Good',
    peakRange: '+2,200m',
    sunlight: '82.5%',
    connectivity: 'Good',
    connectivityColor: '#38bdf8'
  },
  {
    id: 'gauss-rim',
    name: 'Gauss Crater Rim',
    sector: 'Sector Northeast • 36.0°N, 79.0°E',
    lat: 36.0,
    lon: 79.0,
    elevationM: 1850,
    illuminationPct: 80.0,
    signalTier: 'Good',
    sunlightTier: 'Good',
    peakRange: '+1,850m',
    sunlight: '80.0%',
    connectivity: 'Good',
    connectivityColor: '#38bdf8'
  },
  {
    id: 'humboldt-rim',
    name: 'Humboldt Basin Rim',
    sector: 'Sector Southeast • 27.0°S, 81.0°E',
    lat: -27.0,
    lon: 81.0,
    elevationM: 1400,
    illuminationPct: 79.0,
    signalTier: 'Good',
    sunlightTier: 'Good',
    peakRange: '+1,400m',
    sunlight: '79.0%',
    connectivity: 'Good',
    connectivityColor: '#38bdf8'
  },
  {
    id: 'shackleton-connecting-ridge',
    name: 'Shackleton Connecting Ridge',
    sector: 'Sector Delta • South Pole 89.4°S',
    lat: -89.4,
    lon: 120.0,
    elevationM: 1280,
    illuminationPct: 86.2,
    signalTier: 'Good',
    sunlightTier: 'Strong',
    peakRange: '+1,280m',
    sunlight: '86.2%',
    connectivity: 'Good',
    connectivityColor: '#38bdf8'
  },
  {
    id: 'de-gerlache-rim',
    name: 'de Gerlache Crater Rim',
    sector: 'Sector West • 88.3°S, 88.7°W',
    lat: -88.3,
    lon: -88.7,
    elevationM: 1850,
    illuminationPct: 76.1,
    signalTier: 'Good',
    sunlightTier: 'Good',
    peakRange: '+1,850m',
    sunlight: '76.1%',
    connectivity: 'Good',
    connectivityColor: '#38bdf8'
  },

  // ─── POOR TIERS (Spread Across Grazing Limb Transitions & Margins) ───
  {
    id: 'mare-orientale',
    name: 'Mare Orientale Ring',
    sector: 'Sector Western Limb • 19.4°S, 92.8°W',
    lat: -19.4,
    lon: -92.8,
    elevationM: -800,
    illuminationPct: 56.0,
    signalTier: 'Poor',
    sunlightTier: 'Poor',
    peakRange: '-800m',
    sunlight: '56.0%',
    connectivity: 'Average',
    connectivityColor: '#fbbf24'
  },
  {
    id: 'mare-smythii',
    name: 'Mare Smythii Margin',
    sector: 'Sector Eastern Limb • 1.3°S, 87.5°E',
    lat: -1.3,
    lon: 87.5,
    elevationM: -500,
    illuminationPct: 52.0,
    signalTier: 'Poor',
    sunlightTier: 'Poor',
    peakRange: '-500m',
    sunlight: '52.0%',
    connectivity: 'Average',
    connectivityColor: '#fbbf24'
  },
  {
    id: 'biolkowsky-basin',
    name: 'Biolkowsky Transition Zone',
    sector: 'Sector Southern Limb • 44.5°S, 95.0°E',
    lat: -44.5,
    lon: 95.0,
    elevationM: -1200,
    illuminationPct: 49.0,
    signalTier: 'Poor',
    sunlightTier: 'Poor',
    peakRange: '-1,200m',
    sunlight: '49.0%',
    connectivity: 'Average',
    connectivityColor: '#fbbf24'
  },
  {
    id: 'amundsen-basin',
    name: 'Amundsen Crater Basin',
    sector: 'Sector East • 84.5°S, 82.8°E',
    lat: -84.5,
    lon: 82.8,
    elevationM: -940,
    illuminationPct: 54.0,
    signalTier: 'Poor',
    sunlightTier: 'Poor',
    peakRange: '-940m',
    sunlight: '54.0%',
    connectivity: 'Average',
    connectivityColor: '#fbbf24'
  },
  {
    id: 'cabeus-flank',
    name: 'Cabeus Crater Flank',
    sector: 'Sector West • 84.9°S, 35.5°W',
    lat: -84.9,
    lon: -35.5,
    elevationM: -1100,
    illuminationPct: 51.5,
    signalTier: 'Poor',
    sunlightTier: 'Poor',
    peakRange: '-1,100m',
    sunlight: '51.5%',
    connectivity: 'Average',
    connectivityColor: '#fbbf24'
  },

  // ─── VERY POOR TIERS (Spread Across Farside & Permanent Polar Shadow) ───
  {
    id: 'von-karman-basin',
    name: 'Von Kármán Basin (SPA)',
    sector: 'Sector Farside South • 45.5°S, 177.6°E',
    lat: -45.5,
    lon: 177.6,
    elevationM: -4500,
    illuminationPct: 18.0,
    signalTier: 'Very Poor',
    sunlightTier: 'Very Poor',
    peakRange: '-4,500m',
    sunlight: '18.0%',
    connectivity: 'Bad',
    connectivityColor: '#f87171'
  },
  {
    id: 'korolev-basin',
    name: 'Korolev Basin Floor',
    sector: 'Sector Farside Equatorial • 4.4°S, 157.4°W',
    lat: -4.4,
    lon: -157.4,
    elevationM: -3900,
    illuminationPct: 15.0,
    signalTier: 'Very Poor',
    sunlightTier: 'Very Poor',
    peakRange: '-3,900m',
    sunlight: '15.0%',
    connectivity: 'Bad',
    connectivityColor: '#f87171'
  },
  {
    id: 'mare-moscoviense',
    name: 'Mare Moscoviense Floor',
    sector: 'Sector Farside North • 27.3°N, 147.9°E',
    lat: 27.3,
    lon: 147.9,
    elevationM: -3200,
    illuminationPct: 12.0,
    signalTier: 'Very Poor',
    sunlightTier: 'Very Poor',
    peakRange: '-3,200m',
    sunlight: '12.0%',
    connectivity: 'Bad',
    connectivityColor: '#f87171'
  },
  {
    id: 'hertzsprung-basin',
    name: 'Hertzsprung Basin Center',
    sector: 'Sector Farside West • 1.6°N, 128.7°W',
    lat: 1.6,
    lon: -128.7,
    elevationM: -4200,
    illuminationPct: 14.0,
    signalTier: 'Very Poor',
    sunlightTier: 'Very Poor',
    peakRange: '-4,200m',
    sunlight: '14.0%',
    connectivity: 'Bad',
    connectivityColor: '#f87171'
  },
  {
    id: 'shackleton-psr',
    name: 'Shackleton PSR Deep Floor',
    sector: 'Sector South Pole • 89.9°S, 0.0°E',
    lat: -89.9,
    lon: 0.0,
    elevationM: -4100,
    illuminationPct: 4.2,
    signalTier: 'Very Poor',
    sunlightTier: 'Very Poor',
    peakRange: '-4,100m',
    sunlight: '4.2%',
    connectivity: 'Bad',
    connectivityColor: '#f87171'
  }
];

export default function LunarSurfaceFilter({
  selectedSiteId,
  onSelectRegion,
  onFilterTierChange,
  isOpen,
  onToggleOpen
}) {
  const [filterMode, setFilterMode] = useState('signal'); // 'signal' | 'sunlight'
  const [activeTier, setActiveTier] = useState('Strong'); // 'Strong' | 'Good' | 'Poor' | 'Very Poor'
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const tierColors = {
    Strong: '#34d399',
    Good: '#60a5fa',
    Poor: '#fbbf24',
    'Very Poor': '#f87171'
  };

  // Aerospace Dark Gradient Palette (Zero Solid Colors, Ultra-Sophisticated Obsidian & Specular Glass)
  const tierGradients = {
    Strong: {
      activeBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 78, 59, 0.35) 50%, rgba(4, 47, 46, 0.55) 100%)',
      border: '1px solid rgba(52, 211, 153, 0.42)',
      shadow: '0 4px 16px rgba(6, 78, 59, 0.35), inset 0 1px 0 rgba(52, 211, 153, 0.35)',
      dotGradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
      dotShadow: '0 0 8px rgba(52, 211, 153, 0.75)',
      textColor: '#ffffff'
    },
    Good: {
      activeBg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(14, 116, 144, 0.35) 50%, rgba(12, 74, 110, 0.55) 100%)',
      border: '1px solid rgba(56, 189, 248, 0.42)',
      shadow: '0 4px 16px rgba(12, 74, 110, 0.35), inset 0 1px 0 rgba(56, 189, 248, 0.35)',
      dotGradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
      dotShadow: '0 0 8px rgba(56, 189, 248, 0.75)',
      textColor: '#ffffff'
    },
    Poor: {
      activeBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(180, 83, 9, 0.32) 50%, rgba(120, 53, 15, 0.45) 100%)',
      border: '1px solid rgba(251, 191, 36, 0.4)',
      shadow: '0 4px 16px rgba(120, 53, 15, 0.25), inset 0 1px 0 rgba(251, 191, 36, 0.3)',
      dotGradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
      dotShadow: '0 0 8px rgba(251, 191, 36, 0.7)',
      textColor: '#ffffff'
    },
    'Very Poor': {
      activeBg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.16) 0%, rgba(159, 18, 57, 0.32) 50%, rgba(136, 19, 55, 0.45) 100%)',
      border: '1px solid rgba(251, 113, 133, 0.4)',
      shadow: '0 4px 16px rgba(159, 18, 57, 0.25), inset 0 1px 0 rgba(251, 113, 133, 0.3)',
      dotGradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
      dotShadow: '0 0 8px rgba(251, 113, 133, 0.7)',
      textColor: '#ffffff'
    }
  };

  const matchingRegions = useMemo(() => {
    return LUNAR_SURFACE_REGIONS.filter((region) => {
      const tier = filterMode === 'signal' ? region.signalTier : region.sunlightTier;
      return tier === activeTier;
    });
  }, [filterMode, activeTier]);

  // When filter is opened or tier/mode changes, auto-pin all matching regions
  useEffect(() => {
    if (isOpen && onFilterTierChange) {
      onFilterTierChange(matchingRegions);
    }
  }, [isOpen, matchingRegions, onFilterTierChange]);

  const handleTierClick = (tier) => {
    setActiveTier(tier);
    const regions = LUNAR_SURFACE_REGIONS.filter((r) => {
      const t = filterMode === 'signal' ? r.signalTier : r.sunlightTier;
      return t === tier;
    });
    if (onFilterTierChange) {
      onFilterTierChange(regions);
    }
  };

  const handleModeChange = (mode) => {
    setFilterMode(mode);
    const regions = LUNAR_SURFACE_REGIONS.filter((r) => {
      const t = mode === 'signal' ? r.signalTier : r.sunlightTier;
      return t === activeTier;
    });
    if (onFilterTierChange) {
      onFilterTierChange(regions);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '28px',
      right: '36px',
      zIndex: 400,
      fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
      userSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }}>
      {/* ─── SURFACE FILTER TRIGGER BUTTON (STYLED EXACTLY LIKE NEXT BUTTON) ─── */}
      <button
        type="button"
        onClick={onToggleOpen}
        onMouseEnter={() => setIsBtnHovered(true)}
        onMouseLeave={() => setIsBtnHovered(false)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 18px',
          minHeight: '38px',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: isBtnHovered
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.16) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.09) 100%)',
          boxShadow: isBtnHovered
            ? '0 8px 24px rgba(0, 0, 0, 0.55), 0 0 16px rgba(255, 255, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.45)'
            : '0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          transform: isBtnHovered ? 'scale(1.02) translateY(-1px)' : 'scale(1)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Specular Edge Highlight Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '12%',
            right: '12%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.65) 50%, transparent 100%)',
            pointerEvents: 'none'
          }}
        />

        <span style={{ whiteSpace: 'nowrap' }}>Surface Filter</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            opacity: 0.75,
            marginLeft: '2px'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ─── ULTRA-MINIMAL & CLEAN FILTER DROPDOWN ─── */}
      {isOpen && (
        <div style={{
          marginTop: '8px',
          width: '320px',
          background: 'rgba(7, 10, 18, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '14px',
          padding: '10px 12px',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.88), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
          animation: 'filterPanelIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {/* Mode Switcher: Signal vs Sunlight (Ultra Compact) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '2px',
            borderRadius: '7px',
            marginBottom: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <button
              type="button"
              onClick={() => handleModeChange('signal')}
              style={{
                background: filterMode === 'signal' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                border: 'none',
                borderRadius: '5px',
                padding: '5px 0',
                color: filterMode === 'signal' ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                fontSize: '11px',
                fontWeight: filterMode === 'signal' ? 500 : 400,
                cursor: 'pointer',
                boxShadow: filterMode === 'signal' ? '0 1px 4px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none',
                transition: 'all 0.15s ease',
                fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
              }}
            >
              Earth Signal
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('sunlight')}
              style={{
                background: filterMode === 'sunlight' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                border: 'none',
                borderRadius: '5px',
                padding: '5px 0',
                color: filterMode === 'sunlight' ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                fontSize: '11px',
                fontWeight: filterMode === 'sunlight' ? 500 : 400,
                cursor: 'pointer',
                boxShadow: filterMode === 'sunlight' ? '0 1px 4px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none',
                transition: 'all 0.15s ease',
                fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
              }}
            >
              Sunlight
            </button>
          </div>

          {/* 4 Clean Minimal Tier Pills in 1 Single Row (Dark Gradient Shades, Zero Flat Solid Colors) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            marginBottom: '8px'
          }}>
            {['Strong', 'Good', 'Poor', 'Very Poor'].map((tier) => {
              const isActive = activeTier === tier;
              const g = tierGradients[tier];

              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleTierClick(tier)}
                  style={{
                    background: isActive ? g.activeBg : 'linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    border: isActive ? g.border : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '6px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    boxShadow: isActive ? g.shadow : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif"
                  }}
                >
                  <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: g.dotGradient,
                    boxShadow: isActive ? g.dotShadow : 'none'
                  }} />
                  <span style={{
                    fontSize: '10.5px',
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: 'nowrap'
                  }}>
                    {tier}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clean Minimal Single-Line Regions List with Aerospace Styling */}
          <div
            className="filter-regions-scroll"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '175px',
              overflowY: 'auto'
            }}
          >
            {matchingRegions.map((region) => {
              const isSelected = selectedSiteId === region.id;
              const g = tierGradients[region.signalTier || activeTier];

              const getStatusLabel = () => {
                if (filterMode === 'signal') {
                  switch (region.signalTier) {
                    case 'Strong': return 'Direct LOS';
                    case 'Good': return 'Nominal Link';
                    case 'Poor': return 'Grazing Link';
                    case 'Very Poor': return 'Occluded';
                    default: return region.connectivity || 'Direct';
                  }
                } else {
                  switch (region.sunlightTier) {
                    case 'Strong': return region.sunlight || '89%+ Sun';
                    case 'Good': return region.sunlight || '78%+ Sun';
                    case 'Poor': return region.sunlight || '52%+ Sun';
                    case 'Very Poor': return region.sunlight || 'PSR Shadow';
                    default: return region.sunlight;
                  }
                }
              };

              return (
                <div
                  key={region.id}
                  onClick={() => {
                    if (onSelectRegion) onSelectRegion(region);
                  }}
                  style={{
                    padding: '6px 10px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.025)',
                    border: isSelected ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.025)';
                    e.currentTarget.style.borderColor = isSelected ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)';
                  }}
                >
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 500 : 400,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '175px'
                  }}>
                    {region.name.split(' (')[0]}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontFamily: "'Space Mono', monospace, 'Roboto Mono', monospace",
                      color: 'rgba(255, 255, 255, 0.45)',
                      letterSpacing: '-0.02em'
                    }}>
                      {region.peakRange}
                    </span>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: g?.activeBg || 'rgba(255, 255, 255, 0.05)',
                      border: g?.border || '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected ? g?.shadow : 'none'
                    }}>
                      <span style={{
                        width: '4.5px',
                        height: '4.5px',
                        borderRadius: '50%',
                        background: g?.dotGradient || '#ffffff',
                        boxShadow: g?.dotShadow || 'none'
                      }} />
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        color: '#ffffff',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap'
                      }}>
                        {getStatusLabel()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes filterPanelIn {
          0% { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .filter-regions-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .filter-regions-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .filter-regions-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}
