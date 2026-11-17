import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SILVERY ROTATING GRADIENT "CHOOSE ON LUNAR GLOBE" BUTTON (PURE TITLE)
 * ═══════════════════════════════════════════════════════════════════════════
 * Ultra-minimal:
 * - Rotating silvery laser border beam (conic-gradient)
 * - Deep dark space backdrop
 * - Only the title: "Choose on Lunar Globe" (0 pins, 0 subtext)
 * - Google Sans typography
 */
export default function SilveryGlobeButton({
  onClick,
  style = {}
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e) => {
    soundFX.playClick();
    if (onClick) onClick(e);
  };

  return (
    <>
      <style>{`
        @property --silvery-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes silvery-beam-spin {
          to {
            --silvery-angle: 360deg;
          }
        }

        .silvery-globe-card {
          --silvery-angle: 0deg;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          cursor: pointer;
          user-select: none;
          outline: none;
          padding: 1px;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .silvery-globe-card::before {
          content: '';
          position: absolute;
          top: -200%;
          left: -200%;
          width: 500%;
          height: 500%;
          background: conic-gradient(
            from var(--silvery-angle),
            transparent 0deg,
            rgba(255, 255, 255, 0.06) 50deg,
            #ffffff 90deg,
            rgba(220, 240, 255, 0.95) 120deg,
            rgba(255, 255, 255, 0.25) 155deg,
            transparent 200deg,
            transparent 360deg
          );
          animation: silvery-beam-spin 3.8s linear infinite;
          pointer-events: none;
        }

        .silvery-globe-card:hover::before {
          animation-duration: 2s;
        }

        .silvery-globe-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(255, 255, 255, 0.12);
        }

        .silvery-globe-card:active {
          transform: translateY(0) scale(0.99);
        }

        .silvery-globe-card-inner {
          position: relative;
          z-index: 1;
          background: #080c16;
          border-radius: 11px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          box-sizing: border-box;
          font-family: 'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif;
        }
      `}</style>

      <div
        className="silvery-globe-card"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          marginTop: '6px',
          ...style
        }}
      >
        <div className="silvery-globe-card-inner">
          <span
            style={{
              fontSize: '14.5px',
              fontWeight: 500,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              lineHeight: 1.2
            }}
          >
            Choose on Lunar Globe
          </span>

          {/* Minimal subtle chevron */}
          <div
            style={{
              color: isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
