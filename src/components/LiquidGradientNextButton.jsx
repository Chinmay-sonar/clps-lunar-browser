import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * LIQUID GRADIENT ACTION BUTTON
 * ═════════════════════════════════════════════════════════════════════════════
 * Replicates the mesmerizing animated gradient pill button from:
 * https://framer.com/m/Button-WyZEWe.js@HA6JTrzXkbhN1R0BYe13
 *
 * - Multi-layer animated morphing gradient blobs (Royal Blue, Soft Sky, Warm Amber)
 * - Luminous base with subtle glass specular border highlight
 * - Smooth hover scaling, shadow elevation, and arrow translation
 */
export default function LiquidGradientNextButton({
  onClick,
  text = 'Next',
  disabled = false,
  isWarping = false,
  style = {}
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e) => {
    if (disabled || isWarping) return;
    soundFX.playClick();
    if (onClick) onClick(e);
  };

  return (
    <>
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
          gap: '9px',
          height: '46px',
          minHeight: '46px',
          paddingLeft: '26px',
          paddingRight: '22px',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.55)',
          background: '#E8EAED',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          outline: 'none',
          overflow: 'hidden',
          textDecoration: 'none',
          boxShadow: isHovered
            ? '0 12px 32px -8px rgba(0, 0, 0, 0.45), 0 0 28px rgba(36, 121, 255, 0.35)'
            : '0 8px 24px -10px rgba(0, 0, 0, 0.3), 0 0 16px rgba(36, 121, 255, 0.2)',
          transform: isPressed
            ? 'scale(0.98)'
            : isHovered
            ? 'scale(1.025) translateY(-2px)'
            : 'scale(1)',
          transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
          isolation: 'isolate',
          opacity: disabled ? 0.45 : 1,
          ...style
        }}
      >
        {/* Base Layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#E8EAED',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        {/* Blob 1: Royal Blue Morphing Organism */}
        <div
          className={`liquid-blob-1 ${isHovered ? 'liquid-blob-hover' : ''}`}
          style={{
            position: 'absolute',
            width: '74%',
            height: '210%',
            left: '-20%',
            bottom: '-90%',
            borderRadius: '42% 58% 62% 38% / 55% 46% 54% 45%',
            background: '#2479FF',
            filter: 'blur(11px)',
            opacity: 0.92,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Blob 2: Light Sky Blue Counter-Morphing Layer */}
        <div
          className={`liquid-blob-2 ${isHovered ? 'liquid-blob-hover' : ''}`}
          style={{
            position: 'absolute',
            width: '70%',
            height: '195%',
            left: '18%',
            top: '-92%',
            borderRadius: '55% 45% 38% 62% / 42% 58% 44% 56%',
            background: '#91C4FF',
            filter: 'blur(10px)',
            opacity: 0.82,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Blob 3: Warm Solar Peach Highlight Blob */}
        <div
          className={`liquid-blob-3 ${isHovered ? 'liquid-blob-hover' : ''}`}
          style={{
            position: 'absolute',
            width: '72%',
            height: '205%',
            right: '-24%',
            bottom: '-88%',
            borderRadius: '62% 38% 55% 45% / 48% 58% 42% 52%',
            background: '#F1D8C9',
            filter: 'blur(11px)',
            opacity: 0.88,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Top Glare Specular Shine Sweep */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />

        {/* Button Content Label (Above Gradient Blobs) */}
        <span
          style={{
            position: 'relative',
            zIndex: 3,
            color: '#111111',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: '15px',
            fontWeight: 500,
            letterSpacing: '-0.015em',
            pointerEvents: 'none'
          }}
        >
          {text}
        </span>

        {/* Arrow Icon with Hover Translation */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{
            position: 'relative',
            zIndex: 3,
            display: 'block',
            transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none'
          }}
        >
          <path
            d="M5 12H19"
            stroke="#111111"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M13 6L19 12L13 18"
            stroke="#111111"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <style>{`
        @keyframes liquidMove1 {
          0% { transform: translate(-30px, 10px) rotate(-8deg) scale(1); }
          25% { transform: translate(40px, -20px) rotate(12deg) scale(1.35); }
          50% { transform: translate(10px, 15px) rotate(-5deg) scale(1.05); }
          75% { transform: translate(-40px, -5px) rotate(15deg) scale(1.45); }
          100% { transform: translate(-30px, 10px) rotate(-8deg) scale(1); }
        }
        @keyframes liquidMove2 {
          0% { transform: translate(25px, -12px) rotate(8deg) scale(1.1); }
          30% { transform: translate(-35px, 22px) rotate(-12deg) scale(1.4); }
          60% { transform: translate(12px, -28px) rotate(10deg) scale(0.95); }
          85% { transform: translate(35px, 8px) rotate(-6deg) scale(1.42); }
          100% { transform: translate(25px, -12px) rotate(8deg) scale(1.1); }
        }
        @keyframes liquidMove3 {
          0% { transform: translate(32px, 8px) rotate(6deg) scale(1); }
          33% { transform: translate(-32px, -20px) rotate(-14deg) scale(1.4); }
          66% { transform: translate(15px, 22px) rotate(7deg) scale(1.08); }
          88% { transform: translate(-18px, 0px) rotate(-8deg) scale(1.32); }
          100% { transform: translate(32px, 8px) rotate(6deg) scale(1); }
        }
        .liquid-blob-1 {
          animation: liquidMove1 5.5s infinite ease-in-out;
        }
        .liquid-blob-2 {
          animation: liquidMove2 6.2s infinite ease-in-out;
        }
        .liquid-blob-3 {
          animation: liquidMove3 7.0s infinite ease-in-out;
        }
        .liquid-blob-hover.liquid-blob-1 {
          animation-duration: 2.8s;
        }
        .liquid-blob-hover.liquid-blob-2 {
          animation-duration: 3.2s;
        }
        .liquid-blob-hover.liquid-blob-3 {
          animation-duration: 3.5s;
        }
      `}</style>
    </>
  );
}

