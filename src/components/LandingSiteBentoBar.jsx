import React from 'react';
import { soundFX } from '../utils/soundFX';
import { LANDING_SITES } from '../data/landingSites';

/**
 * Stats Bento Information & Choose Landing Location Component
 * Inspired by 21st.dev "Stats Bento" card architecture:
 * - High-contrast hero card with subtle diagonal hatch texture
 * - Top-right stat card with growth/illumination histogram bars
 * - Bottom stat cards for Summit Elevation and Earth Direct Link
 * - Quick-selection pill buttons for official lunar landing sites
 * - Prominent "DESCEND TO SURFACE ↓" CTA
 * - Strictly styled using Google Sans font (@[GoogleSans-Regular.ttf])
 */
export default function LandingSiteBentoBar({
  selectedSite,
  onSelectSite,
  onDescendToSurface,
  onClose
}) {
  const site = selectedSite || LANDING_SITES[0];

  const latStr = `${Math.abs(site.lat ?? site.coordinates?.lat ?? -85.99).toFixed(2)}° S`;
  const lonStr = `${(site.lon ?? site.coordinates?.lng ?? 2.93).toFixed(2)}° E`;
  const elevM = site.elevationM ?? site.elevationMeters ?? site.elevation ?? 5040;
  const illumPct = site.illuminationPct ?? site.illumination?.peak ?? 89.4;

  // Site descriptions in simple, clear language
  const siteDescriptions = {
    'malapert-massif': 'Highest mountain summit at the lunar South Pole with near-permanent sunlight for solar power.',
    'shackleton-connecting-ridge': 'Narrow high ridge separating deep ice craters with direct line-of-sight communication to Earth.',
    'mons-mouton': 'Large flat plateau with expansive landing zones and safe driving corridors for rover exploration.',
    'nobile-rim-1': 'Undulating crater rim with accessible permanently shadowed micro-cold traps holding water ice.',
    'de-gerlache-rim': 'Elevated crater rim with high solar peaks and moderate terrain slopes for lander touchdown.',
    'haworth-rim': 'Prominent ridge overlooking permanent shadow volatile deposits with high scientific value.'
  };

  const description = siteDescriptions[site.id] || site.notes || 'Prime lunar exploration site selected for NASA CLPS missions.';

  // Histogram simulation for solar illumination bars
  const histogramHeights = [45, 55, 68, 75, 82, 90, 88, 94, 98, 92, 86, 78];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(94vw, 860px)',
        background: 'rgba(8, 10, 15, 0.94)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '16px 20px',
        boxShadow: '0 32px 90px rgba(0, 0, 0, 0.88), 0 0 40px rgba(56, 189, 248, 0.08)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        fontFamily: "'Google Sans', sans-serif",
        color: '#ffffff',
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {/* Minimize / Close Button */}
      {onClose && (
        <button
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '-14px',
            right: '18px',
            background: 'rgba(15, 18, 25, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            borderRadius: '999px',
            padding: '4px 12px',
            color: '#cbd5e1',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.15s ease',
            zIndex: 50
          }}
          title="Minimize landing site panel"
        >
          <span>✕</span>
          <span>Close</span>
        </button>
      )}

      {/* ─── 1. BENTO GRID ARCHITECTURE (2 Columns) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.18fr 1fr',
          gap: '14px',
          alignItems: 'stretch'
        }}
      >
        {/* ─── LEFT: PRIMARY HERO STAT CARD (White / Light Contrast Bento Card) ─── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #edf1f7 100%)',
            color: '#090a0f',
            borderRadius: '18px',
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Subtle Diagonal Hatch Texture in Corner (21st.dev Bento Aesthetic) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '180px',
              height: '140px',
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0, 0, 0, 0.045) 6px, rgba(0, 0, 0, 0.045) 8px)',
              pointerEvents: 'none',
              maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)'
            }}
          />

          {/* Top Pill Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            <span
              style={{
                background: 'rgba(0, 0, 0, 0.07)',
                color: '#475569',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              SELECTED TARGET SITE
            </span>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#0284c7',
                background: 'rgba(2, 132, 199, 0.1)',
                padding: '4px 8px',
                borderRadius: '9999px'
              }}
            >
              NASA CLPS
            </span>
          </div>

          {/* Big Hero Number & Site Name */}
          <div style={{ marginTop: '14px', marginBottom: '8px', zIndex: 1 }}>
            <div
              style={{
                fontSize: '44px',
                fontWeight: 700,
                lineHeight: 1,
                color: '#090a0f',
                letterSpacing: '-0.03em'
              }}
            >
              {illumPct}%
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                marginTop: '6px'
              }}
            >
              {site.name}
            </div>
          </div>

          {/* Descriptive Subtext */}
          <div
            style={{
              fontSize: '12px',
              color: '#475569',
              lineHeight: 1.45,
              fontWeight: 400,
              zIndex: 1
            }}
          >
            {description}
          </div>
        </div>

        {/* ─── RIGHT: BENTO GRID SUB-TILES (2x2 Layout) ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto',
            gap: '12px'
          }}
        >
          {/* Top Span: Sunlight Growth / Persistence with Visual Histogram Bars */}
          <div
            style={{
              gridColumn: 'span 2',
              background: 'rgba(20, 22, 28, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}
              >
                SOLAR PERSISTENCE
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginTop: '2px',
                  letterSpacing: '-0.02em'
                }}
              >
                +{illumPct}%
              </div>
            </div>

            {/* Micro Histogram Sparkline (just like the 21st.dev Bento growth graphic) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '3px',
                height: '36px',
                padding: '2px 0'
              }}
            >
              {histogramHeights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '4px',
                    height: `${(h / 100) * 32}px`,
                    background: i >= 8 ? '#f59e0b' : '#34d399',
                    borderRadius: '2px',
                    opacity: 0.85
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom Left: Elevation Stat Card */}
          <div
            style={{
              background: 'rgba(20, 22, 28, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em'
              }}
            >
              +{elevM.toLocaleString()}m
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#94a3b8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginTop: '2px'
              }}
            >
              ELEVATION
            </div>
          </div>

          {/* Bottom Right: Coordinates & Earth Link Card */}
          <div
            style={{
              background: 'rgba(20, 22, 28, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700
                }}
              >
                ★
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#ffffff'
                }}
              >
                {latStr}
              </span>
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#94a3b8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginTop: '4px'
              }}
            >
              {lonStr} • LRO VERIFIED
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. SITE SELECTION PILLS & DESCEND TO SURFACE CTA ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '12px',
          flexWrap: 'wrap'
        }}
      >
        {/* Lunar Site Selector Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            flex: 1
          }}
        >
          {LANDING_SITES.map((s) => {
            const isSelected = site.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  soundFX.playClick();
                  if (onSelectSite) onSelectSite(s);
                }}
                style={{
                  background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
                  color: isSelected ? '#090a0f' : '#cbd5e1',
                  border: isSelected ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: "'Google Sans', sans-serif"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isSelected ? '#0284c7' : s.color
                  }}
                />
                {s.name.split(' (')[0]}
              </button>
            );
          })}
        </div>

        {/* Primary CTA: Descend to Surface */}
        <button
          onClick={() => {
            soundFX.playClick();
            if (onDescendToSurface) onDescendToSurface();
          }}
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '8px 20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 18px rgba(56, 189, 248, 0.35)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            whiteSpace: 'nowrap',
            fontFamily: "'Google Sans', sans-serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(56, 189, 248, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 18px rgba(56, 189, 248, 0.35)';
          }}
        >
          <span>DESCEND TO SURFACE</span>
          <span style={{ fontSize: '13px' }}>↓</span>
        </button>
      </div>
    </div>
  );
}
