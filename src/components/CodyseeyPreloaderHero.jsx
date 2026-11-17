import React, { useState, useEffect, useRef } from 'react';
import { soundFX } from '../utils/soundFX';
import { ShinyButton } from './ui/shiny-button';
import CodyseeyHandwrittenLogo from './CodyseeyHandwrittenLogo';
import { requestUniversalFullscreen } from '../utils/fullscreenHelper';
import { TextEffect } from './ui/text-effect';
import nasaSpaceAppsLogoImg from '../assets/nasa-space-apps-cropped.png';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OFFICIAL NASA INTERNATIONAL SPACE APPS CHALLENGE LOGO
 * ═══════════════════════════════════════════════════════════════════════════
 * Rendered with exact fidelity from input_file_2.png:
 * - Globe ring with satellite and radiating antenna rays
 * - NASA (Red #e03c31)
 * - INTERNATIONAL (Condensed Sans)
 * - SPACE APPS (Condensed Heavy Bold)
 * - CHALLENGE (Tracked Wide)
 * - Sized for commanding authority and visual parity
 * - STRICTLY NO GLOW / NO DROP-SHADOW
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function NasaSpaceAppsOfficialLogo({ height = 148, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        filter: 'none',
        ...style
      }}
    >
      <img
        src={nasaSpaceAppsLogoImg || '/assets/nasa-space-apps-cropped.png'}
        alt="NASA International Space Apps Challenge"
        onError={(e) => {
          // Robust fallback chain
          if (e.target.src !== '/assets/nasa-space-apps-cropped.png') {
            e.target.src = '/assets/nasa-space-apps-cropped.png';
          } else if (e.target.src !== '/assets/nasa-space-apps-logo.png') {
            e.target.src = '/assets/nasa-space-apps-logo.png';
          }
        }}
        style={{
          height: `${height}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          filter: 'none'
        }}
      />
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ORIGINAL MINIMAL WHITE-GREY VERTICAL DIVIDER "|"
 * ═══════════════════════════════════════════════════════════════════════════
 * - Original white-grey standing line (rgba(255, 255, 255, 0.35))
 * - Strictly NO animation effects (no beams, no pulses, no sparks, no gradient loops)
 * - Appears cleanly after Codyssey handwriting completes
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function OriginalVerticalDivider({
  height = 98,
  visible = true,
  isMobile = false
}) {
  const actualHeight = isMobile ? Math.round(height * 0.65) : height;

  return (
    <div
      style={{
        width: '1px',
        height: `${actualHeight}px`,
        background: 'rgba(255, 255, 255, 0.35)',
        flexShrink: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scaleY(1)' : 'scaleY(0.4)',
        transformOrigin: 'center',
        transition:
          'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: 'none',
        filter: 'none',
        borderRadius: '999px'
      }}
    />
  );
}

// Retain alias for compatibility
export const ShinyVerticalDivider = OriginalVerticalDivider;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE SCREEN GLOWING BORDER (STRICT LUXURY CYBER-SPACE BORDER)
 * ═══════════════════════════════════════════════════════════════════════════
 * - Matches the exact conic-gradient rotating luminous beam from ShinyButton:
 *   Electric blue (#3b82f6) + brilliant white (#ffffff) + indigo highlight (#8484ff)
 * - Runs around the perimeter of the mobile screen with radiant aura
 * - Stays active on deep black screen during 2s Elevate transition, then fades
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function MobileScreenGlowBorder({ active = true, ending = false }) {
  const borderRef = useRef(null);

  useEffect(() => {
    let angle = 0;
    let rafId;
    const tick = () => {
      // Majestic, smooth, slow laser sweep around mobile screen perimeter
      angle = (angle + 0.32) % 360;
      if (borderRef.current) {
        borderRef.current.style.setProperty('--glow-angle', `${angle}deg`);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  if (!active) return null;

  return (
    <div
      ref={borderRef}
      className="mobile-screen-glow-border"
      style={{
        position: 'fixed',
        inset: '4px',
        borderRadius: '20px',
        pointerEvents: 'none',
        zIndex: 99999,
        boxSizing: 'border-box',
        padding: '2.5px',
        background:
          'conic-gradient(from var(--glow-angle, 0deg), transparent 0%, transparent 66%, #3b82f6 78%, #ffffff 88%, #8484ff 94%, #3b82f6 97%, transparent 100%)',
        WebkitMask:
          'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        mask:
          'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        filter:
          'drop-shadow(0 0 6px rgba(59, 130, 246, 0.7)) drop-shadow(0 0 14px rgba(59, 130, 246, 0.4))',
        opacity: ending ? 0 : 1,
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    />
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROTATE PHONE CINEMATIC GUIDANCE PROMPT
 * ═══════════════════════════════════════════════════════════════════════════
 * - Deep dark black background (#000000)
 * - Pure crisp white typography & minimalist phone wireframe
 * - "ROTATE YOUR PHONE" strictly in ONE line (whiteSpace: 'nowrap')
 * - "for cinematic experience" strictly in ONE line (whiteSpace: 'nowrap')
 * - Google Font: Google Sans (from GoogleSans-Regular.ttf)
 * - TextEffect symmetric entrance and exit: Appears and disappears
 *   character-by-character with 3D roll and focal de-blur
 * ═══════════════════════════════════════════════════════════════════════════
 */
const rotatePhoneTextVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.035,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.02,
        staggerDirection: -1,
      },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      rotateX: 90,
      y: 10,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      rotateX: 0,
      y: 0,
      transition: {
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      filter: 'blur(12px)',
      rotateX: 90,
      y: 10,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  },
};

const subtitleTextVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.025,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.015,
        staggerDirection: -1,
      },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      rotateX: 90,
      y: 8,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      rotateX: 0,
      y: 0,
      transition: {
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      filter: 'blur(12px)',
      rotateX: 90,
      y: 8,
      transition: {
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  },
};

export function RotatePhoneCinematicPrompt({ revealed = false, ending = false }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        padding: '24px'
      }}
    >
      <style>{`
        @keyframes cinematicRotatePhone {
          0%, 18% {
            transform: rotate(0deg);
          }
          48%, 78% {
            transform: rotate(90deg);
          }
          95%, 100% {
            transform: rotate(0deg);
          }
        }
      `}</style>

      {/* Main Guidance Block */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '360px'
        }}
      >
        {/* Minimalist Phone Wireframe with Smooth 90° Rotation & Symmetric Blur Appearance/Exit */}
        <div
          style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            opacity: !revealed ? 0 : ending ? 0 : 1,
            filter: !revealed ? 'blur(12px)' : ending ? 'blur(12px)' : 'blur(0px)',
            transform: !revealed
              ? 'scale(0.92) translateY(10px)'
              : ending
              ? 'scale(0.92) translateY(10px)'
              : 'scale(1) translateY(0)',
            transition:
              'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), filter 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div
            style={{
              animation: 'cinematicRotatePhone 3.8s cubic-bezier(0.65, 0, 0.35, 1) infinite',
              transformOrigin: 'center center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              width="38"
              height="38"
              viewBox="0 0 32 32"
              fill="none"
            >
              {/* Phone Outer Shell - Pure Crisp White */}
              <rect
                x="8"
                y="3"
                width="16"
                height="26"
                rx="3.5"
                stroke="#ffffff"
                strokeWidth="1.8"
              />
              {/* Phone Speaker Notch */}
              <line
                x1="13.5"
                y1="5.5"
                x2="18.5"
                y2="5.5"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Phone Home Bar */}
              <line
                x1="13"
                y1="26.5"
                x2="19"
                y2="26.5"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* 1. Main Guidance: "ROTATE YOUR PHONE" - STRICTLY ONE LINE WITH TEXTEFFECT & GOOGLE SANS */}
        <div style={{ whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center' }}>
          <TextEffect
            per="char"
            as="h2"
            delay={0.1}
            trigger={revealed && !ending}
            variants={rotatePhoneTextVariants}
            className="whitespace-nowrap"
            style={{
              fontFamily: "'Google Sans', sans-serif",
              fontSize: 'clamp(0.92rem, 3.8vw, 1.25rem)',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              margin: 0,
              padding: 0,
              lineHeight: 1.2,
              display: 'inline-block'
            }}
          >
            ROTATE YOUR PHONE
          </TextEffect>
        </div>

        {/* 2. Subtitle: "for cinematic experience" - STRICTLY ONE LINE WITH TEXTEFFECT & GOOGLE SANS */}
        <div style={{ whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <TextEffect
            per="char"
            as="p"
            delay={0.35}
            trigger={revealed && !ending}
            variants={subtitleTextVariants}
            className="whitespace-nowrap"
            style={{
              fontFamily: "'Google Sans', sans-serif",
              fontSize: 'clamp(0.66rem, 2.7vw, 0.8rem)',
              fontWeight: 400,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.72)',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              margin: 0,
              padding: 0,
              lineHeight: 1.2,
              display: 'inline-block'
            }}
          >
            for cinematic experience
          </TextEffect>
        </div>
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CODYSEEY SINGLE-WINDOW HERO WITH PRECISE CHRONOLOGICAL APPEARANCE
 * ═══════════════════════════════════════════════════════════════════════════
 * Appearance Sequence:
 * 1. Firstly: Porsche cursive "Codyseey" writes letter-by-letter (0.2s - 2.6s)
 * 2. Then: Standing "|" appears in original clean white-grey (no animation effect)
 * 3. Then: NASA International Space Apps Challenge logo appears in slow-mo
 *    cinematic fade & focal resolve (3.3s - 5.5s)
 * 4. Finally: "Elevate" ShinyButton fades in at the bottom (4.8s)
 * - Deep pitch black background (#000000), zero ambient blur, zero glow.
 * - Mobile Strict Mode: Glowing screen border active on phone screen.
 * - Mobile Elevate Click: Screen goes dark space deep black with border effect
 *   for 2 seconds before launching video tour.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export default function CodyseeyPreloaderHero({ onEnterSimulation, onBrowse }) {
  const [dividerRevealed, setDividerRevealed] = useState(false);
  const [nasaRevealed, setNasaRevealed] = useState(false);
  const [buttonRevealed, setButtonRevealed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isElevating, setIsElevating] = useState(false);
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [transitionEnding, setTransitionEnding] = useState(false);

  // Responsive check and fluid dynamic scaling for mobile
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      setIsMobile(w <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Compute exact element dimensions:
  // Desktop lockup natural width is ~954px (Codyseey ~448px + gaps 97px + NASA ~409px).
  // On mobile (w <= 768), scale down smoothly so row fits cleanly with ~24px comfortable padding on each side.
  const isNarrow = isMobile || windowWidth <= 768;
  const mobileScale = isNarrow ? Math.min(1, Math.max(0.30, (windowWidth - 48) / 960)) : 1;

  const codyseeyHeight = isNarrow ? Math.round(105 * mobileScale) : 105;
  const dividerHeight = isNarrow ? Math.round(98 * mobileScale) : 98;
  const nasaHeight = isNarrow ? Math.round(148 * mobileScale) : 148;
  const lockupGap = isNarrow ? Math.round(48 * mobileScale) : 48;

  // Orchestrated appearance sequence
  useEffect(() => {
    // 1. Codyseey cursive writes from 0.2s to 2.6s

    // 2. Then: Divider '|' appears right when Codyseey finishes (2.6s)
    const dividerTimer = setTimeout(() => {
      setDividerRevealed(true);
    }, 2600);

    // 3. Then: NASA Space Apps logo appears in slow-mo cinematic fade (3.3s)
    const nasaTimer = setTimeout(() => {
      setNasaRevealed(true);
      try {
        soundFX.playTelemetry();
      } catch (e) {}
    }, 3300);

    // 4. Finally: "Elevate" & "Browse" ShinyButtons appear as both logos settle (4.8s)
    const buttonTimer = setTimeout(() => {
      setButtonRevealed(true);
    }, 4800);

    return () => {
      clearTimeout(dividerTimer);
      clearTimeout(nasaTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  // Handle Elevate button click
  const handleElevate = () => {
    // 1. Play tactile feedback sound
    try {
      soundFX.playClick();
    } catch (e) {}

    // 2. Request true fullscreen on all supported devices
    try {
      requestUniversalFullscreen(document.documentElement);
    } catch (e) {}

    try {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    } catch (e) {}

    setIsElevating(true);

    const startTourPlayback = () => {
      try {
        const vid = document.getElementById('viper-tour-video');
        if (vid) {
          vid.muted = false;
          vid.volume = 1.0;
          const playPromise = vid.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('[Elevate] Audio autoplay fallback to muted:', err);
              vid.muted = true;
              vid.play().catch(() => {});
            });
          }
        }
      } catch (e) {}

      if (onEnterSimulation) {
        onEnterSimulation();
      }
    };

    if (isNarrow) {
      // Mobile devices: show rotate phone prompt for 2 seconds, then smoothly start playback
      setShowRotatePrompt(true);
      setTimeout(() => {
        setTransitionEnding(true);
        setTimeout(() => {
          startTourPlayback();
        }, 200);
      }, 2000);
    } else {
      // Desktop / Laptops: immediate transition
      startTourPlayback();
    }
  };

  // Handle Browse button click (Deep Space Orange: Bypasses video, enters mission configuration & 3D browser)
  const handleBrowse = () => {
    try {
      soundFX.playClick();
    } catch (e) {}

    try {
      requestUniversalFullscreen(document.documentElement);
    } catch (e) {}

    if (onBrowse) {
      onBrowse();
    } else if (onEnterSimulation) {
      onEnterSimulation();
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#000000',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isNarrow ? '16px' : '24px',
        userSelect: 'none'
      }}
    >
      {/* ─── MOBILE SCREEN GLOWING BORDER (Strict Mode: ONLY after clicking Elevate and before video plays) ─── */}
      {isNarrow && isElevating && (
        <MobileScreenGlowBorder
          active={true}
          ending={transitionEnding}
        />
      )}

      {/* ─── "ROTATE YOUR PHONE" CINEMATIC PROMPT (Only on mobile for exactly 2 seconds after Elevate click) ─── */}
      {isNarrow && isElevating && (
        <RotatePhoneCinematicPrompt
          revealed={showRotatePrompt}
          ending={transitionEnding}
        />
      )}

      {/* ─── MAIN CENTERPIECE: [Codyseey Handwriting] | [Super Slowmo NASA Logo] ─── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isNarrow ? `${Math.max(28, Math.round(56 * mobileScale))}px` : '65px',
          opacity: isElevating ? 0 : 1,
          transform: isElevating ? 'scale(0.94) translateZ(0)' : 'scale(1) translateZ(0)',
          willChange: 'opacity, transform',
          transition:
            'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: isElevating ? 'none' : 'auto',
          width: '100%',
          maxWidth: '100vw'
        }}
      >
        {/* Partnership Lockup: Codyseey | NASA Space Apps (NEVER WRAPS ON MOBILE) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'nowrap',
            gap: `${lockupGap}px`,
            maxWidth: '100%',
            overflow: 'visible'
          }}
        >
          {/* 1. FIRSTLY: Porsche Cursive "Codyseey" handwriting letter-by-letter */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CodyseeyHandwrittenLogo
              height={codyseeyHeight}
              stretch={0.75}
              duration={2.4}
              delay={0.2}
            />
          </div>

          {/* 2. THEN: Original White-Grey Standing Divider "|" (No Animation Effect) */}
          <OriginalVerticalDivider
            height={dividerHeight}
            visible={dividerRevealed}
            isMobile={false}
          />

          {/* 3. THEN: Super Slow-Motion Cinematic NASA Logo Fade Reveal */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: nasaRevealed ? 1 : 0,
              transform: nasaRevealed ? 'scale(1) translateZ(0)' : 'scale(0.94) translateZ(0)',
              willChange: 'opacity, transform',
              transition:
                'opacity 1.8s cubic-bezier(0.16, 1, 0.3, 1), transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <NasaSpaceAppsOfficialLogo height={nasaHeight} />
          </div>
        </div>

        {/* ─── ACTION BUTTONS: "Elevate" & "Browse" (Deep Space Orange) ─── */}
        <div
          style={{
            opacity: buttonRevealed ? 1 : 0,
            transform: buttonRevealed ? 'translateY(0)' : 'translateY(16px)',
            transition:
              'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isNarrow ? '14px' : '24px',
            flexWrap: 'wrap'
          }}
        >
          <ShinyButton onClick={handleElevate}>
            Elevate
          </ShinyButton>

          <ShinyButton variant="orange" onClick={handleBrowse}>
            Browse
          </ShinyButton>
        </div>
      </div>
    </div>
  );
}
