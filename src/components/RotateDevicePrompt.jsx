import React, { useState, useEffect } from 'react';

/**
 * Hook to detect whether the user is on a touch/mobile/tablet device (all devices EXCEPT laptops/desktops)
 * and whether the device is currently in portrait (standing) orientation.
 */
export function useIsPortraitTouchDevice() {
  const [isPortraitTouch, setIsPortraitTouch] = useState(false);

  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      const isPortrait = window.innerHeight > window.innerWidth;
      const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
      const isMobileOrTabletUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet/i.test(
        navigator.userAgent
      );
      const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

      // Exclude laptops/desktops: Must have coarse touch pointer AND be mobile/tablet/iPad
      const isNonLaptop = hasTouch && (isMobileOrTabletUA || isIPadOS || isCoarsePointer);
      setIsPortraitTouch(Boolean(isNonLaptop && isPortrait));
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return isPortraitTouch;
}

/**
 * Universal Cinematic Rotate Device Guidance Element
 * - Strictly shown on non-laptop devices (iPads, tablets, phones) when in portrait mode.
 * - Smoothly de-blurs and fades out when rotated to landscape.
 */
export default function RotateDevicePrompt({
  variant = 'floating', // 'floating' | 'inline'
  subtitle = 'for cinematic widescreen view',
  style = {}
}) {
  const isPortraitTouch = useIsPortraitTouchDevice();

  if (!isPortraitTouch) return null;

  return (
    <div
      className="rotate-device-prompt-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 90,
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        ...(variant === 'floating'
          ? {
              position: 'fixed',
              bottom: '32px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '11px 22px',
              borderRadius: '999px',
              backgroundColor: 'rgba(10, 12, 16, 0.82)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
              maxWidth: '92vw'
            }
          : {}),
        ...style
      }}
    >
      <style>{`
        @keyframes rotateDeviceIconAnim {
          0%, 15% {
            transform: rotate(0deg);
          }
          45%, 75% {
            transform: rotate(90deg);
          }
          95%, 100% {
            transform: rotate(0deg);
          }
        }
        .anim-rotate-device {
          animation: rotateDeviceIconAnim 3.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          transform-origin: center center;
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Animated Rotating Device Icon */}
        <div
          className="anim-rotate-device"
          style={{
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="3.5" />
            <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
            <line x1="10" y1="5" x2="14" y2="5" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Text Guidance */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span
            style={{
              fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#ffffff',
              lineHeight: 1.2
            }}
          >
            ROTATE YOUR DEVICE
          </span>
          <span
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: '10px',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.65)',
              lineHeight: 1.2,
              marginTop: '2px'
            }}
          >
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}

