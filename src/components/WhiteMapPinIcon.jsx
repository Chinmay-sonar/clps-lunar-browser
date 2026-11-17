import React from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LUXURY PURE WHITE MAP PIN SVG ICON
 * ═══════════════════════════════════════════════════════════════════════════
 * Exact vector replica of the lunar surface pin:
 * - Pure white (#ffffff) teardrop body with crisp dark border
 * - Dark inner core (#0f172a) with centered pure white dot
 * - Pure white anchor point tip
 * - Optional specular glow and drop shadow
 */
export default function WhiteMapPinIcon({
  size = 18,
  glow = false,
  style = {},
  className = ''
}) {
  const width = size;
  const height = Math.round(size * 1.25);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 30"
      fill="none"
      className={className}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))',
        ...style
      }}
    >
      {/* Outer White Teardrop Pin Body */}
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 18 12 18s12-9.5 12-18c0-6.627-5.373-12-12-12z"
        fill="#ffffff"
        stroke="#050811"
        strokeWidth="1.2"
      />
      {/* Dark Inner Core Ring */}
      <circle cx="12" cy="11" r="4.2" fill="#0f172a" />
      {/* Center White Core Dot */}
      <circle cx="12" cy="11" r="1.6" fill="#ffffff" />
      {/* Ground Contact Tip Dot */}
      <circle cx="12" cy="28.5" r="1.4" fill="#ffffff" />
    </svg>
  );
}

