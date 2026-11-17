import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * PREMIUM LIQUID GLASS NEXT BUTTON
 * ═════════════════════════════════════════════════════════════════════════════
 * Exact counterpart to GlassBackButton.jsx:
 * - Liquid frosted glass styling with 20px blur
 * - Specular highlight upper border line
 * - Forward-pointing chevron arrow with hover translation
 * - Tactile soundFX click feedback
 * - Apple-inspired fluid glass aesthetic
 */
export default function GlassNextButton({
  onClick,
  label = 'Next',
  showText = true,
  disabled = false,
  style = {}
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e) => {
    if (disabled) return;
    soundFX.playClick();
    if (onClick) onClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showText ? '8px' : '0',
        padding: showText ? '10px 20px' : '10px',
        minHeight: '42px',
        borderRadius: '999px',
        border: '1px solid rgba(255, 255, 255, 0.22)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        outline: 'none',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: isHovered
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.16) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.09) 100%)',
        boxShadow: isHovered
          ? '0 8px 30px rgba(0, 0, 0, 0.55), 0 0 16px rgba(255, 255, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.45)'
          : '0 4px 18px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        color: '#ffffff',
        fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        transform: isPressed ? 'scale(0.97)' : isHovered ? 'scale(1.02) translateY(-1px)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: disabled ? 0.45 : 1,
        ...style
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

      {showText && <span>{label}</span>}

      {/* Chevron Forward / Next Icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{
          display: 'block',
          transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
          transition: 'transform 0.2s ease'
        }}
      >
        <path
          d="M9 18L15 12L9 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

