import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CodyseeyHandwrittenLogo from './CodyseeyHandwrittenLogo';
import { NasaSpaceAppsOfficialLogo, OriginalVerticalDivider } from './CodyseeyPreloaderHero';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROMO MOON COUNTDOWN — MINIMALIST FLOATING TRAILER FINALE
 * ═══════════════════════════════════════════════════════════════════════════
 * Strict user design specification:
 * 1. Background Boxes Removed: Zero boxes/cards behind numbers. Numbers float cleanly over the moon.
 * 2. Labels: DAYS, HOURS, MINS, SECS in PURE WHITE (#ffffff), NOT in green.
 * 3. Font: Modern clean geometric grotesque sans-serif (Inter / SF Pro Display, weight 300).
 * 4. Separators: Vertical colon ':' between groups with subtle opacity.
 * 5. Animation: Framer spring pop-layout flip on each second transition.
 * 6. Top-Left: Codyseey logo | vertical divider | NASA Space Apps official logo.
 * 7. Background: Zero-copy 60 FPS looping Moon background video (moon-background.mp4, no CSS filters).
 * 8. NOTHING ELSE on the window.
 * 9. Localhost / Dev: Press 'B', 'Enter', or click top-left logo to enter 3D simulation.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Target mission public unleash launch window: November 16, 2026
const TARGET_LAUNCH_DATE = '2026-11-16T08:00:00+05:30';

function calculateTimeLeft(targetDate) {
  const difference = +new Date(targetDate) - +new Date();
  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }
  // Cyclic dynamic 5-day hype countdown fallback
  const cycle = 5 * 24 * 3600 * 1000;
  const rem = cycle - (Math.abs(difference) % cycle);
  return {
    days: Math.floor(rem / (1000 * 60 * 60 * 24)),
    hours: Math.floor((rem / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((rem / 1000 / 60) % 60),
    seconds: Math.floor((rem / 1000) % 60)
  };
}

/**
 * Clean Sans-Serif Digit with Framer Motion Spring Flip Transition
 */
function Digit({ value, fontSize, tint = '#ffffff', fontWeight = 300 }) {
  return (
    <div
      style={{
        position: 'relative',
        height: fontSize * 1.15,
        width: fontSize * 0.58,
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          style={{
            fontSize: fontSize,
            lineHeight: 1,
            color: tint,
            position: 'absolute',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
            fontWeight: fontWeight,
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            textShadow: '0 4px 28px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 0.95)'
          }}
          initial={{ y: '-60%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '60%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 35, mass: 1 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/**
 * Separator ':' Between Number Groups
 */
function Separator({ fontSize, tint = '#ffffff' }) {
  return (
    <div
      style={{
        fontSize: fontSize * 0.85,
        lineHeight: 1,
        color: tint,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        fontWeight: 300,
        opacity: 0.45,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 clamp(4px, 1.2vw, 16px)',
        paddingBottom: 'clamp(14px, 2.2vh, 22px)',
        textShadow: '0 2px 14px rgba(0, 0, 0, 0.9)'
      }}
    >
      :
    </div>
  );
}

/**
 * Pure Floating Number Group (NO background boxes, PURE WHITE labels)
 */
function FloatingNumberGroup({ value, label, fontSize, tint = '#ffffff', fontWeight = 300 }) {
  const digits = (value < 10 ? `0${value}` : `${value}`).split('');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 'clamp(58px, 13vw, 110px)',
        padding: '0 clamp(2px, 0.6vw, 8px)',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {digits.map((digit, index) => (
          <Digit
            key={index}
            value={digit}
            fontSize={fontSize}
            tint={tint}
            fontWeight={fontWeight}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: 'clamp(10px, 1.2vw, 13px)',
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginTop: '10px',
          textAlign: 'center',
          color: '#ffffff', // STRICT WHITE LABELS
          textShadow: '0 2px 12px rgba(0, 0, 0, 0.9)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function PromoMoonCountdown({ onEnterSimulation }) {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const videoRef = useRef(null);

  // Check localhost / dev environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocal =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        window.location.search.includes('browser') ||
        window.location.search.includes('sim') ||
        window.location.search.includes('dev');
      setIsLocalhost(isLocal);
    }
  }, []);

  // Responsive dimension tracking
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Keyboard shortcut: Press 'B' or 'Enter' on localhost to enter 3D simulation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'b' || e.key === 'B' || e.key === 'Enter') {
        if (isLocalhost && onEnterSimulation) {
          onEnterSimulation();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLocalhost, onEnterSimulation]);

  // Live Timer
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(TARGET_LAUNCH_DATE));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(TARGET_LAUNCH_DATE));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Ensure video is actively playing immediately on mount with zero buffering lag
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, []);

  const time = timeLeft || { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const isMobile = windowWidth <= 768;

  // Responsive font sizing for crisp visibility
  const countdownFontSize = isMobile
    ? Math.max(34, Math.min(64, Math.round(windowWidth * 0.098)))
    : Math.min(96, Math.max(64, Math.round(windowWidth * 0.058)));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        backgroundColor: '#000000',
        color: '#ffffff',
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 99999,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
      }}
    >
      {/* ─── 1. SEAMLESS 60 FPS HARDWARE-ACCELERATED MOON VIDEO (NO CSS FILTERS) ─── */}
      <video
        ref={videoRef}
        src="/assets/videos/moon-background.mp4"
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload="auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100dvh',
          minWidth: '100%',
          minHeight: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: 1,
          transform: 'translateZ(0)'
        }}
      />

      {/* ─── OPTICAL VIGNETTE FOR CLEAN CONTRAST (OUTSIDE VIDEO) ─── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at center, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.5) 70%, rgba(0, 0, 0, 0.8) 100%)'
        }}
      />

      {/* ─── 2. TOP-LEFT: CODYSEEY LOGO | VERTICAL LINE | NASA SPACE APPS LOGO ─── */}
      <div
        onClick={isLocalhost ? onEnterSimulation : undefined}
        style={{
          position: 'absolute',
          top: isMobile ? '20px' : '36px',
          left: isMobile ? '20px' : '44px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '16px' : '28px',
          cursor: isLocalhost ? 'pointer' : 'default',
          transition: 'transform 0.2s ease',
          transform: 'translateZ(0)'
        }}
        title={isLocalhost ? 'Click or press [B] to enter 3D simulation' : undefined}
      >
        <CodyseeyHandwrittenLogo
          height={isMobile ? 32 : 46}
          stretch={0.75}
          immediate={true}
        />
        <OriginalVerticalDivider
          height={isMobile ? 28 : 40}
          visible={true}
          isMobile={isMobile}
        />
        <NasaSpaceAppsOfficialLogo
          height={isMobile ? 42 : 62}
        />
      </div>

      {/* ─── 3. MIDDLE: PURE FLOATING COUNTDOWN NUMBERS OVER MOON (NO BOXES, WHITE LABELS) ─── */}
      <main
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto'
        }}
      >
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'nowrap',
            gap: 'clamp(4px, 1.2vw, 14px)',
            transform: 'translateZ(0)',
            willChange: 'opacity, transform'
          }}
        >
          <FloatingNumberGroup
            value={time.days}
            label="DAYS"
            fontSize={countdownFontSize}
            tint="#ffffff"
            fontWeight={300}
          />
          <Separator fontSize={countdownFontSize} tint="#ffffff" />
          <FloatingNumberGroup
            value={time.hours}
            label="HOURS"
            fontSize={countdownFontSize}
            tint="#ffffff"
            fontWeight={300}
          />
          <Separator fontSize={countdownFontSize} tint="#ffffff" />
          <FloatingNumberGroup
            value={time.minutes}
            label="MINUTES"
            fontSize={countdownFontSize}
            tint="#ffffff"
            fontWeight={300}
          />
          <Separator fontSize={countdownFontSize} tint="#ffffff" />
          <FloatingNumberGroup
            value={time.seconds}
            label="SECONDS"
            fontSize={countdownFontSize}
            tint="#ffffff"
            fontWeight={300}
          />
        </motion.div>
      </main>
    </div>
  );
}
