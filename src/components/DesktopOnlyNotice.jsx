import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CodyseeyHandwrittenLogo from './CodyseeyHandwrittenLogo';
import { NasaSpaceAppsOfficialLogo, OriginalVerticalDivider } from './CodyseeyPreloaderHero';

const LAZY_FOCUS_EASE = [0.16, 1, 0.3, 1];
const TARGET_LAUNCH_DATE = '2026-11-16T08:00:00+05:30';

function calculateTimeLeft() {
  const difference = +new Date(TARGET_LAUNCH_DATE) - +new Date();
  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }
  return { days: 0, hours: 0, minutes: 0, seconds: 0 };
}

export default function DesktopOnlyNotice() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const text = "This Browser Is Strictly for the Desktop / Laptop usecases only";
  const words = text.split(' ');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#000000',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      {/* ─── 1. FULLSCREEN LOOPING MOON BACKGROUND VIDEO ─── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none'
        }}
        src="/videos/moon_background.mp4"
      />

      {/* ─── 2. SUBTLE CINEMATIC VIGNETTE OVERLAY FOR PRISTINE READABILITY ─── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(2, 4, 8, 0.45) 0%, rgba(2, 4, 8, 0.78) 100%)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* ─── 3. TOP-LEFT BRAND HEADER: CODYSEEY | NASA SPACE APPS CHALLENGE ─── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: LAZY_FOCUS_EASE, delay: 0.2 }}
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'none'
        }}
      >
        <CodyseeyHandwrittenLogo height={22} immediate={true} />
        <OriginalVerticalDivider height={14} />
        <NasaSpaceAppsOfficialLogo height={18} />
      </motion.div>

      {/* ─── 4. HERO CINEMATIC CONTENT IN GOOGLE SANS ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '920px',
          width: '90%',
          textAlign: 'center',
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* ─── 4a. COUNTDOWN TIMER UP TO 16TH NOV 2026 ─── */}
        <motion.div
          initial={{ opacity: 0, y: -20, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, ease: LAZY_FOCUS_EASE, delay: 0.1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(10px, 2.8vw, 24px)',
            marginBottom: '28px'
          }}
        >
          {[
            { label: 'DAYS', val: String(timeLeft.days).padStart(2, '0') },
            { label: 'HOURS', val: String(timeLeft.hours).padStart(2, '0') },
            { label: 'MINS', val: String(timeLeft.minutes).padStart(2, '0') },
            { label: 'SECS', val: String(timeLeft.seconds).padStart(2, '0') }
          ].map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{
                  fontFamily: "'Google Sans', sans-serif",
                  fontSize: 'clamp(1.6rem, 4.8vw, 3.0rem)',
                  fontWeight: 300,
                  color: '#ffffff',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: '0 4px 24px rgba(0, 0, 0, 0.9)'
                }}>
                  {item.val}
                </span>
                <span style={{
                  fontFamily: "'Google Sans', sans-serif",
                  fontSize: 'clamp(0.60rem, 1.1vw, 0.72rem)',
                  fontWeight: 400,
                  letterSpacing: '0.18em',
                  color: '#ffffff',
                  marginTop: '8px',
                  textTransform: 'uppercase'
                }}>
                  {item.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <span style={{
                  fontFamily: "'Google Sans', sans-serif",
                  fontSize: 'clamp(1.3rem, 3.6vw, 2.2rem)',
                  fontWeight: 300,
                  color: 'rgba(255, 255, 255, 0.35)',
                  marginBottom: '18px',
                  lineHeight: 1
                }}>:</span>
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* ─── 4b. DESKTOP USECASE ONLY HEADLINE ─── */}
        <div
          style={{
            fontFamily: "'Google Sans', sans-serif",
            fontSize: 'clamp(1.35rem, 3.8vw, 2.4rem)',
            fontWeight: 400,
            lineHeight: 1.35,
            letterSpacing: '0.04em',
            color: '#ffffff',
            display: 'inline',
            whiteSpace: 'normal',
            textShadow: '0 4px 28px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 255, 255, 0.15)'
          }}
        >
          {words.map((word, wIdx) => (
            <motion.span
              key={wIdx}
              initial={{
                opacity: 0,
                scale: 1.05,
                filter: 'blur(16px)'
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)'
              }}
              transition={{
                duration: 2.0,
                ease: LAZY_FOCUS_EASE,
                delay: 0.35 + wIdx * 0.14
              }}
              style={{
                display: 'inline-block',
                whiteSpace: 'nowrap',
                marginRight: '0.34em',
                color: '#ffffff',
                fontFamily: "'Google Sans', sans-serif"
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>

        {/* ─── 5. CLEAN BORDERLESS WIDESCREEN DISPLAY NOTICE BELOW ─── */}
        <motion.div
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.6, ease: LAZY_FOCUS_EASE, delay: 1.8 }}
          style={{
            marginTop: '28px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255, 255, 255, 0.65)',
            fontFamily: "'Google Sans', sans-serif",
            fontSize: 'clamp(0.70rem, 1.3vw, 0.82rem)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
          <span>Widescreen Display Required (1024px+)</span>
        </motion.div>
      </div>
    </div>
  );
}
