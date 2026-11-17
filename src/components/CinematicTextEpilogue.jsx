import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CINEMATIC TEXT EPILOGUE — 3-SECTION AUTOSCROLLING SLIDESHOW
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SECTION 1: THE PROBLEM (5 beats)
 *   - Title: "THE PROBLEM" in WHITE font only
 *   - Base text: White
 *   - Danger alerts: Red (#ff3344)
 *
 * SECTION 2: THE SOLUTION (6 beats)
 *   - Title: "THE SOLUTION" in WHITE font only
 *   - Base text: White
 *   - Highlighted achievements & capabilities: NASA Emerald Green (#00ea88)
 *
 * SECTION 3: THE IMPACT (3 beats)
 *   - Title: "THE IMPACT" in WHITE font only
 *   - Base text: White
 *   - Highlighted stakes & closer: NASA Emerald Green (#00ea88)
 *
 * Orchestration:
 *   - Pure Autoscroll: Words appear with cinematic letter/word blur-to-focus arrival.
 *   - After text settles, pauses for 3.0 seconds of calm reading time.
 *   - Smoothly advances to next beat automatically.
 *   - Manual wheel/touch scroll disabled to prevent accidental fast-skipping.
 *   - After final Impact beat, automatically transitions to Promo Moon Countdown.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Relaxed deceleration curve for dreamy cinematic de-blur focus
const LAZY_FOCUS_EASE = [0.16, 1, 0.3, 1];

/**
 * FocusWords: Preserves the authentic cinematic blur-to-focus arrival for each word
 */
function FocusWords({
  text,
  baseDelay = 0,
  stagger = 0.12,
  duration = 1.9,
  color = '#ffffff',
  fontSize = 'clamp(0.92rem, 1.8vw, 1.25rem)',
  fontWeight = 300,
  letterSpacing = '0.12em',
  highlightText = null,
  highlightColor = '#00ea88',
  highlightWeight = null
}) {
  const words = text.split(' ');

  return (
    <span
      style={{
        display: 'inline',
        whiteSpace: 'normal',
        fontSize,
        letterSpacing,
        lineHeight: 1.55
      }}
    >
      {words.map((word, wIdx) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9°&%-]/g, '');
        const isHighlighted =
          highlightText &&
          highlightText
            .split(' ')
            .some((hw) => hw.replace(/[^a-zA-Z0-9°&%-]/g, '') === cleanWord);

        const targetColor = isHighlighted ? highlightColor : color;
        // Exact same font-weight: green font NEVER defaults to bold
        const targetWeight =
          highlightWeight !== null && highlightWeight !== undefined
            ? highlightWeight
            : fontWeight;

        return (
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
              duration,
              ease: LAZY_FOCUS_EASE,
              delay: baseDelay + wIdx * stagger
            }}
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              marginRight: '0.32em',
              color: targetColor,
              fontWeight: targetWeight,
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
              willChange: 'filter, opacity, transform',
              transform: 'translateZ(0)',
              textShadow: 'none',
              background: 'transparent'
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
}

// Global Step Mapping
// Step 0:       "THE PROBLEM" title
// Steps 1–5:   Problem beats 1–5
// Step 6:       "THE SOLUTION" title
// Steps 7–12:  Solution beats 1–6
// Step 13:      "THE IMPACT" title
// Steps 14–16: Impact beats 1–3
const MAX_STEP = 16;

function getSection(step) {
  if (step <= 5) return 'problem';
  if (step <= 12) return 'solution';
  return 'impact';
}

function getSectionTitle(step) {
  if (step <= 5) return 'THE PROBLEM';
  if (step <= 12) return 'THE SOLUTION';
  return 'THE IMPACT';
}

function isTitleStep(step) {
  return step === 0 || step === 6 || step === 13;
}

function getBeatIndex(step) {
  if (step <= 5) return step;
  if (step <= 12) return step - 6;
  return step - 13;
}

// Autoscroll dwell time per step:
// Animation duration + exactly 3.0 seconds reading wait before auto-transitioning
function getStepDuration(step) {
  switch (step) {
    case 0:
      return 2200; // Title: THE PROBLEM (dwell ~2.2s)
    case 1:
      return 5200; // Problem Beat 1 (~2.2s anim + 3s wait)
    case 2:
      return 5200; // Problem Beat 2 (~2.2s anim + 3s wait)
    case 3:
      return 5800; // Problem Beat 3 (~2.8s anim + 3s wait)
    case 4:
      return 6800; // Problem Beat 4 (~3.8s anim + 3s wait)
    case 5:
      return 5400; // Problem Beat 5 (~2.4s anim + 3s wait)
    case 6:
      return 2200; // Title: THE SOLUTION (dwell ~2.2s)
    case 7:
      return 5200; // Solution Beat 1 (~2.2s anim + 3s wait)
    case 8:
      return 5600; // Solution Beat 2 (~2.6s anim + 3s wait)
    case 9:
      return 5800; // Solution Beat 3 (~2.8s anim + 3s wait)
    case 10:
      return 5800; // Solution Beat 4 (~2.8s anim + 3s wait)
    case 11:
      return 5400; // Solution Beat 5 (~2.4s anim + 3s wait)
    case 12:
      return 5600; // Solution Beat 6 (~2.6s anim + 3s wait)
    case 13:
      return 2200; // Title: THE IMPACT (dwell ~2.2s)
    case 14:
      return 5400; // Impact Beat 1 (~2.4s anim + 3s wait)
    case 15:
      return 5200; // Impact Beat 2 (~2.2s anim + 3s wait)
    case 16:
      return 5800; // Impact Beat 3 (~2.8s anim + 3s wait -> transition)
    default:
      return 5000;
  }
}

/**
 * Slide beat container with authentic cinematic de-blur and glide
 */
function SlideContainer({ children, slideKey, direction = 'column', minH = '170px' }) {
  return (
    <motion.div
      key={slideKey}
      initial={{ opacity: 0, filter: 'blur(14px)', scale: 1.02 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
      transition={{ duration: 0.8, ease: LAZY_FOCUS_EASE }}
      style={{
        maxWidth: '960px',
        textAlign: 'center',
        padding: '0 20px',
        minHeight: minH,
        display: 'flex',
        flexDirection: direction,
        alignItems: 'center',
        justifyContent: 'center',
        gap: direction === 'column' ? 'clamp(12px, 2.2vh, 20px)' : undefined,
        willChange: 'filter, opacity, transform',
        transform: 'translateZ(0)'
      }}
    >
      {children}
    </motion.div>
  );
}

export default function CinematicTextEpilogue({ onComplete }) {
  const [step, setStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const hasFinishedRef = useRef(false);
  const lastScrollTimeRef = useRef(0);
  const scrollLockMs = 380; // Allows fast, controlled manual scrolling (~2.5 beats/sec)

  // Transition into the Promo Moon Countdown immediately with zero dead lag
  const handleFinalRedirect = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsExiting(true);

    if (onComplete) onComplete();
  }, [onComplete]);

  // Fast manual scroll forward
  const handleManualNext = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < scrollLockMs || isExiting) return;
    lastScrollTimeRef.current = now;

    setStep((prev) => {
      if (prev >= MAX_STEP) {
        handleFinalRedirect();
        return MAX_STEP;
      }
      return prev + 1;
    });
  }, [isExiting, handleFinalRedirect]);

  // Fast manual scroll backward
  const handleManualPrev = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < scrollLockMs || isExiting) return;
    lastScrollTimeRef.current = now;

    setStep((prev) => Math.max(0, prev - 1));
  }, [isExiting]);

  // Autoscroll Ticker: normally automatic progression with 3s reading dwell
  useEffect(() => {
    if (isExiting) return;

    const duration = getStepDuration(step);
    const timer = setTimeout(() => {
      if (step >= MAX_STEP) {
        handleFinalRedirect();
      } else {
        setStep((s) => s + 1);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [step, isExiting, handleFinalRedirect]);

  // Scroll, Wheel, Touch, and Keyboard Listeners for Fast Manual Viewing
  useEffect(() => {
    let accumulatedDelta = 0;
    let wheelTimeout = null;

    const handleWheel = (e) => {
      accumulatedDelta += e.deltaY;
      if (wheelTimeout) clearTimeout(wheelTimeout);

      if (Math.abs(accumulatedDelta) >= 35) {
        if (accumulatedDelta > 0) {
          handleManualNext();
        } else {
          handleManualPrev();
        }
        accumulatedDelta = 0;
      } else {
        wheelTimeout = setTimeout(() => {
          accumulatedDelta = 0;
        }, 180);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) > 30) {
        if (deltaY > 0) {
          handleManualNext();
        } else {
          handleManualPrev();
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.code === 'Escape') {
        handleFinalRedirect();
        return;
      }
      if (['ArrowDown', 'PageDown', 'Space', 'Enter'].includes(e.code)) {
        handleManualNext();
      } else if (['ArrowUp', 'PageUp'].includes(e.code)) {
        handleManualPrev();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [handleManualNext, handleManualPrev, handleFinalRedirect]);

  const currentTitle = getSectionTitle(step);
  const isCenteredTitle = isTitleStep(step);
  const section = getSection(step);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000000',
        color: '#ffffff',
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
        padding: 'clamp(20px, 4vh, 44px) clamp(20px, 5vw, 60px)',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default'
      }}
    >
      <div
        style={{
          maxWidth: '1020px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '420px',
          position: 'relative'
        }}
      >
        {/* ══════════════════════════════════════════════════════════════════
            SECTION TITLE ("THE PROBLEM", "THE SOLUTION", "THE IMPACT")
            - STRICT USER RULE: Written in WHITE FONT ONLY (#ffffff)
            - Glides upward smoothly when section beats begin
            ══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTitle}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{
              opacity: 1,
              y: isCenteredTitle ? 0 : -42,
              filter: 'blur(0px)'
            }}
            exit={{ opacity: 0, y: -60, filter: 'blur(8px)' }}
            transition={{ duration: 1.4, ease: LAZY_FOCUS_EASE }}
            style={{
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
              fontSize: 'clamp(0.80rem, 1.4vw, 0.98rem)',
              fontWeight: 400,
              letterSpacing: '0.36em',
              textTransform: 'uppercase',
              color: '#ffffff', // STRICT WHITE FONT FOR ALL TITLES
              marginBottom: isCenteredTitle ? '0px' : 'clamp(24px, 4vh, 38px)',
              textShadow: '0 2px 14px rgba(255, 255, 255, 0.15)',
              transition: 'margin-bottom 1.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {currentTitle}
          </motion.div>
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════════
            AUTOSCROLLING SLIDESHOW BEATS
            ══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {/* ─────────────────────────────────────────────────────────────
              SECTION 1: THE PROBLEM (Steps 1–5)
              White text with Red (#ff3344) danger alerts
              ───────────────────────────────────────────────────────────── */}

          {/* PROBLEM BEAT 1 */}
          {step === 1 && (
            <SlideContainer slideKey="p1">
              <FocusWords
                text="NASA IS HEADING TO THE MOON'S SOUTH POLE WHERE WATER ICE HOLDS THE KEY TO HUMANITY'S FUTURE IN SPACE."
                baseDelay={0.15}
                stagger={0.14}
                duration={2.1}
                fontSize="clamp(1.1rem, 2.2vw, 1.65rem)"
                fontWeight={300}
                letterSpacing="0.14em"
                color="rgba(255, 255, 255, 0.95)"
              />
            </SlideContainer>
          )}

          {/* PROBLEM BEAT 2: ENTIRE TEXT IN RED */}
          {step === 2 && (
            <SlideContainer slideKey="p2">
              <FocusWords
                text="CRATERS HUNDREDS OF METERS DEEP. PERMANENT SHADOWS. AT -240°C, SUNLIGHT VANISHES IN SECONDS."
                baseDelay={0.15}
                stagger={0.13}
                duration={2.0}
                fontSize="clamp(1.05rem, 2.1vw, 1.58rem)"
                fontWeight={300}
                letterSpacing="0.13em"
                color="#ff3344"
              />
            </SlideContainer>
          )}

          {/* PROBLEM BEAT 3: WHITE TOP, RED BELOW */}
          {step === 3 && (
            <SlideContainer slideKey="p3" direction="column" minH="190px">
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="SOLAR-POWERED ROVERS ENTERING THE DARK FACE"
                  baseDelay={0.15}
                  stagger={0.14}
                  duration={2.0}
                  fontSize="clamp(1.08rem, 2.2vw, 1.6rem)"
                  fontWeight={300}
                  letterSpacing="0.16em"
                  color="rgba(255, 255, 255, 0.92)"
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="DEATH WITHIN MINUTES."
                  baseDelay={1.3}
                  stagger={0.24}
                  duration={2.3}
                  fontSize="clamp(1.3rem, 2.8vw, 2.15rem)"
                  fontWeight={300}
                  letterSpacing="0.22em"
                  color="#ff3344"
                />
              </div>
            </SlideContainer>
          )}

          {/* PROBLEM BEAT 4: 3-TIER STACK */}
          {step === 4 && (
            <SlideContainer slideKey="p4" direction="column" minH="220px">
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="MOUNTAINS BLOCKING DIRECT-TO-EARTH SIGNALS."
                  baseDelay={0.15}
                  stagger={0.12}
                  duration={1.9}
                  fontSize="clamp(1.0rem, 2.0vw, 1.48rem)"
                  fontWeight={300}
                  letterSpacing="0.13em"
                  color="rgba(255, 255, 255, 0.9)"
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="NO SOLAR POWER. NO REAL-TIME RESCUE."
                  baseDelay={1.1}
                  stagger={0.15}
                  duration={2.1}
                  fontSize="clamp(1.08rem, 2.2vw, 1.62rem)"
                  fontWeight={300}
                  letterSpacing="0.16em"
                  color="#ff3344"
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="COMPLETELY ALONE."
                  baseDelay={2.2}
                  stagger={0.26}
                  duration={2.4}
                  fontSize="clamp(1.3rem, 2.8vw, 2.15rem)"
                  fontWeight={300}
                  letterSpacing="0.22em"
                  color="#ff3344"
                />
              </div>
            </SlideContainer>
          )}

          {/* PROBLEM BEAT 5 */}
          {step === 5 && (
            <SlideContainer slideKey="p5" direction="column" minH="190px">
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="ONE WRONG PATH AND THE ENTIRE MISSION IS"
                  baseDelay={0.15}
                  stagger={0.14}
                  duration={2.0}
                  fontSize="clamp(1.08rem, 2.2vw, 1.6rem)"
                  fontWeight={300}
                  letterSpacing="0.16em"
                  color="rgba(255, 255, 255, 0.92)"
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="LOST FOREVER."
                  baseDelay={1.3}
                  stagger={0.26}
                  duration={2.4}
                  fontSize="clamp(1.28rem, 2.7vw, 2.1rem)"
                  fontWeight={300}
                  letterSpacing="0.22em"
                  color="#ff3344"
                />
              </div>
            </SlideContainer>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 2: THE SOLUTION (Steps 7–12)
              Clean, majestic pure white typography
              ───────────────────────────────────────────────────────────── */}

          {/* SOLUTION BEAT 1 */}
          {step === 7 && (
            <SlideContainer slideKey="s1">
              <FocusWords
                text="WE DIDN'T JUST STUDY THE PROBLEM. WE BUILT THE ENTIRE MISSION CONTROL."
                baseDelay={0.15}
                stagger={0.14}
                duration={2.1}
                fontSize="clamp(1.1rem, 2.2vw, 1.65rem)"
                fontWeight={300}
                letterSpacing="0.14em"
                color="#ffffff"
              />
            </SlideContainer>
          )}

          {/* SOLUTION BEAT 2 */}
          {step === 8 && (
            <SlideContainer slideKey="s2">
              <FocusWords
                text="POWERED BY NASA JPL DE441 EPHEMERIS. REAL SUN AND EARTH POSITIONS FOR EVERY HOUR FROM 2026 TO 2030. SUB-ARCSECOND ACCURACY."
                baseDelay={0.15}
                stagger={0.12}
                duration={2.0}
                fontSize="clamp(1.0rem, 2.0vw, 1.5rem)"
                fontWeight={300}
                letterSpacing="0.13em"
                color="#ffffff"
              />
            </SlideContainer>
          )}

          {/* SOLUTION BEAT 3 */}
          {step === 9 && (
            <SlideContainer slideKey="s3" direction="column" minH="200px">
              <div style={{ textAlign: 'center', maxWidth: '940px' }}>
                <FocusWords
                  text="A FULL 3D LUNAR SOUTH POLE BUILT FROM LOLA LASER ALTIMETRY. MELOSH CRATER PHYSICS. HAPKE REGOLITH SHADING."
                  baseDelay={0.15}
                  stagger={0.12}
                  duration={2.0}
                  fontSize="clamp(1.0rem, 2.0vw, 1.5rem)"
                  fontWeight={300}
                  letterSpacing="0.13em"
                  color="#ffffff"
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="NOT A RENDER. A SIMULATION."
                  baseDelay={1.6}
                  stagger={0.22}
                  duration={2.3}
                  fontSize="clamp(1.22rem, 2.5vw, 1.95rem)"
                  fontWeight={300}
                  letterSpacing="0.2em"
                  color="#ffffff"
                />
              </div>
            </SlideContainer>
          )}

          {/* SOLUTION BEAT 4 */}
          {step === 10 && (
            <SlideContainer slideKey="s4">
              <FocusWords
                text="SHADOW-DODGE PATHFINDING THAT AVOIDS DEADLY TERRAIN SHADOWS IN REAL TIME. AUTONOMOUS HAZARD DETECTION WITH FLASH LIDAR POINT CLOUDS. FUEL-OPTIMAL DESCENT GUIDANCE."
                baseDelay={0.15}
                stagger={0.11}
                duration={2.0}
                fontSize="clamp(0.96rem, 1.9vw, 1.42rem)"
                fontWeight={300}
                letterSpacing="0.12em"
                color="#ffffff"
              />
            </SlideContainer>
          )}

          {/* SOLUTION BEAT 5 */}
          {step === 11 && (
            <SlideContainer slideKey="s5">
              <FocusWords
                text="ALL 6 NASA CANDIDATE WATER ICE SITES. EVERY CRATER. EVERY MOUNTAIN. 72-HOUR SOLAR POWER FORECASTS. MULTI-SITE TRADE STUDY RANKING."
                baseDelay={0.15}
                stagger={0.12}
                duration={2.0}
                fontSize="clamp(1.0rem, 2.0vw, 1.48rem)"
                fontWeight={300}
                letterSpacing="0.13em"
                color="#ffffff"
              />
            </SlideContainer>
          )}

          {/* SOLUTION BEAT 6 */}
          {step === 12 && (
            <SlideContainer slideKey="s6" direction="column" minH="190px">
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="ONE BROWSER. ZERO GUESSWORK."
                  baseDelay={0.15}
                  stagger={0.18}
                  duration={2.2}
                  fontSize="clamp(1.1rem, 2.2vw, 1.65rem)"
                  fontWeight={300}
                  letterSpacing="0.16em"
                  color="#ffffff"
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="THE ROVER SURVIVES."
                  baseDelay={1.4}
                  stagger={0.26}
                  duration={2.4}
                  fontSize="clamp(1.28rem, 2.7vw, 2.1rem)"
                  fontWeight={300}
                  letterSpacing="0.22em"
                  color="#00ea88"
                />
              </div>
            </SlideContainer>
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECTION 3: THE IMPACT (Steps 14–16)
              Clean, majestic pure white typography
              ───────────────────────────────────────────────────────────── */}

          {/* IMPACT BEAT 1 */}
          {step === 14 && (
            <SlideContainer slideKey="i1">
              <FocusWords
                text="WATER ICE ON THE MOON ISN'T JUST SCIENCE. IT'S ROCKET FUEL. DRINKING WATER. OXYGEN. IT'S THE GATEWAY TO MARS."
                baseDelay={0.15}
                stagger={0.14}
                duration={2.1}
                fontSize="clamp(1.1rem, 2.2vw, 1.65rem)"
                fontWeight={300}
                letterSpacing="0.14em"
                color="#ffffff"
              />
            </SlideContainer>
          )}

          {/* IMPACT BEAT 2 */}
          {step === 15 && (
            <SlideContainer slideKey="i2">
              <FocusWords
                text="THIS BROWSER GIVES EVERY MISSION THE TOOLS TO REACH IT SAFELY."
                baseDelay={0.15}
                stagger={0.16}
                duration={2.2}
                fontSize="clamp(1.08rem, 2.2vw, 1.62rem)"
                fontWeight={300}
                letterSpacing="0.14em"
                color="#ffffff"
              />
            </SlideContainer>
          )}

          {/* IMPACT BEAT 3 */}
          {step === 16 && (
            <SlideContainer slideKey="i3" direction="column" minH="180px">
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="THE FUTURE OF HUMAN SPACE EXPLORATION"
                  baseDelay={0.15}
                  stagger={0.16}
                  duration={2.2}
                  fontSize="clamp(1.15rem, 2.3vw, 1.75rem)"
                  fontWeight={300}
                  letterSpacing="0.18em"
                  color="#ffffff"
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <FocusWords
                  text="STARTS HERE."
                  baseDelay={1.4}
                  stagger={0.24}
                  duration={2.4}
                  fontSize="clamp(1.35rem, 2.9vw, 2.3rem)"
                  fontWeight={300}
                  letterSpacing="0.22em"
                  color="#00ea88"
                />
              </div>
            </SlideContainer>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
