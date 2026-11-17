import React, { useState, useRef, useEffect, useCallback } from 'react';
import { isFullscreenActive, requestUniversalFullscreen, requestVideoFullscreen } from '../utils/fullscreenHelper';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CINEMATIC VIPER TOUR THEATER (PURE FULLSCREEN CINEMATIC EXPERIENCE)
 * ═══════════════════════════════════════════════════════════════════════════
 * - Continuous uninterrupted video playback (no pause/resume).
 * - Time bar, progress scrubber, and 1× / 2× speed buttons completely removed.
 * - Unobstructed full-screen cinematic visuals.
 * - Top-right:
 *     1. Mute / Unmute Button: Instant audio toggle with matching speaker icon
 *        and 'M' keyboard shortcut.
 *     2. VideoRing radial timeline Skip button appears after 5 SECONDS
 *        in a super slow-mo cinematic fade-in and de-blur effect.
 * - Smooth 1.2s cinematic blur/fade-out on completion / Skip click.
 * - Absolute silence on clicks (zero robotic sound effects).
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Seek flash icons (for arrow key scrubbing)
const ARR_L = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="10,4 6,8 10,12" />
  </svg>
);
const ARR_R = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,4 10,8 6,12" />
  </svg>
);

export default function ViperTourTheater({ onComplete, isActive = true }) {
  const rootRef = useRef(null);
  const playerWrapRef = useRef(null);
  const videoRef = useRef(null);

  // Playback & Audio state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [muteHovered, setMuteHovered] = useState(false);

  // Skip button reveals after 5 seconds in super slow-mo cinematic fade
  const [skipRevealed, setSkipRevealed] = useState(false);
  const [ringHovered, setRingHovered] = useState(false);

  // Controls visibility & cinematic transitions
  const [controlsRevealed, setControlsRevealed] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [seekFlash, setSeekFlash] = useState(null); // { dir: 'back' | 'fwd', label: '−10s' | '+10s' }
  const [edgeFlash, setEdgeFlash] = useState(null); // 'left' | 'right'

  // Dynamic Orientation & Video Fit Mode:
  // In portrait / standing mode: default to 'contain' (zoomed out so entire 16:9 lunar view is clear & uncropped)
  // In landscape mode: default to 'cover' (fills entire edge-to-edge screen)
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const [userFitOverride, setUserFitOverride] = useState(null); // null | 'cover' | 'contain'
  const [fitHovered, setFitHovered] = useState(false);

  useEffect(() => {
    const handleOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleOrientation();
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Strict Landscape Lock: Defaults to edge-to-edge cinematic 'cover'
  const effectiveFitMode = userFitOverride ?? 'cover';

  // Request native hardware landscape orientation lock where supported
  useEffect(() => {
    if (!isActive) return;
    try {
      if (window.screen?.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(() => {});
      } else if (window.screen?.lockOrientation) {
        window.screen.lockOrientation('landscape');
      }
    } catch (e) {}

    return () => {
      try {
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        } else if (window.screen?.unlockOrientation) {
          window.screen.unlockOrientation();
        }
      } catch (e) {}
    };
  }, [isActive]);

  // VideoRing radial timeline ring
  const ringProgressCircleRef = useRef(null);
  const ringRafRef = useRef(0);

  // Timers
  const controlsTimeoutRef = useRef(null);
  const seekTimeoutRef = useRef(null);
  const skipTimerRef = useRef(null);
  const endingHandledRef = useRef(false);

  const videoSrc = '/assets/videos/viper-landing-site-tour.mp4';

  // Toggle Mute function (silent audio toggle)
  const toggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !vid.muted;
    vid.muted = nextMuted;
    setIsMuted(nextMuted);
  }, []);

  // Tap anywhere fallback: unpauses and unmutes without accidentally toggling mute back off
  const handleTapAnywhere = useCallback((e) => {
    if (e.target && e.target.closest && e.target.closest('button')) return;
    const vid = videoRef.current;
    if (vid) {
      if (vid.paused) {
        vid.muted = false;
        vid.volume = 1.0;
        vid.play().catch(() => {});
        setIsMuted(false);
      } else if (vid.muted) {
        vid.muted = false;
        vid.volume = 1.0;
        setIsMuted(false);
      }
    }
  }, []);

  // Toggle Video Fit / Zoom Mode (contain vs cover)
  const toggleFitMode = useCallback(() => {
    setUserFitOverride((prev) => {
      const current = prev ?? (isPortrait ? 'contain' : 'cover');
      return current === 'contain' ? 'cover' : 'contain';
    });
  }, [isPortrait]);

  // Reveal controls on mouse move and auto-hide after 2.8s
  const showControls = useCallback(() => {
    setControlsRevealed(true);
    if (playerWrapRef.current) {
      playerWrapRef.current.classList.remove('hide-cursor');
    }
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsRevealed(false);
      if (playerWrapRef.current) {
        playerWrapRef.current.classList.add('hide-cursor');
      }
    }, 2800);
  }, []);

  // Smooth cinematic fade-out transition into 3D browser
  const triggerSmoothTransition = useCallback(() => {
    if (endingHandledRef.current) return;
    endingHandledRef.current = true;
    setIsFadingOut(true);

    // After 1.2s smooth fade-out, redirect to 3D browser
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 1200);
  }, [onComplete]);

  // Skip button click: completely silent smooth redirect
  const handleSkip = useCallback(() => {
    triggerSmoothTransition();
  }, [triggerSmoothTransition]);

  // Video ended naturally: automatically trigger smooth fade-out and redirect
  const handleEnded = useCallback(() => {
    triggerSmoothTransition();
  }, [triggerSmoothTransition]);

  // Seek relative delta via arrow keys
  const seekRelative = useCallback((delta) => {
    const vid = videoRef.current;
    if (!vid) return;
    const dur = vid.duration || 0;
    const nextTime = Math.max(0, Math.min(dur, vid.currentTime + delta));
    vid.currentTime = nextTime;
    setCurrentTime(nextTime);

    const dir = delta < 0 ? 'back' : 'fwd';
    setSeekFlash({ dir, label: delta < 0 ? '−10s' : '+10s' });
    setEdgeFlash(delta < 0 ? 'left' : 'right');
    showControls();

    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      setSeekFlash(null);
      setEdgeFlash(null);
    }, 720);
  }, [showControls]);

  // VideoRing radial timeline ring via rAF
  useEffect(() => {
    const size = 52;
    const ringWidth = 2.5;
    const radius = Math.max(1, size / 2 - ringWidth / 2 - 0.5);
    const circumference = 2 * Math.PI * radius;

    const circle = ringProgressCircleRef.current;
    if (circle) {
      circle.style.strokeDasharray = String(circumference);
      circle.style.strokeDashoffset = String(circumference);
    }

    const tick = () => {
      const vid = videoRef.current;
      if (vid && vid.duration && circle) {
        const pct = Math.max(0, Math.min(1, vid.currentTime / vid.duration));
        circle.style.strokeDashoffset = String(circumference * (1 - pct));
      }
      ringRafRef.current = requestAnimationFrame(tick);
    };

    ringRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (ringRafRef.current) cancelAnimationFrame(ringRafRef.current);
    };
  }, []);

  // Reveal Skip button after 5 seconds of active playback
  useEffect(() => {
    if (!isActive) return;
    skipTimerRef.current = setTimeout(() => {
      setSkipRevealed(true);
    }, 5000);

    return () => {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    };
  }, [isActive]);

  // Handle active playback and keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const vid = videoRef.current;
    if (vid) {
      // Prioritize unmuted sound with full volume
      vid.muted = false;
      vid.volume = 1.0;
      setIsMuted(false);

      if (vid.paused) {
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              vid.muted = false;
              vid.volume = 1.0;
              setIsMuted(false);
            })
            .catch((err) => {
              console.warn('[ViperTour] Browser restricted audio autoplay, starting muted fallback:', err);
              vid.muted = true;
              setIsMuted(true);
              vid.play().catch(() => {});
            });
        }
      }
    }

    showControls();

    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFitMode();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'Escape':
          handleSkip();
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    };
  }, [isActive, seekRelative, showControls, handleSkip, toggleMute, toggleFitMode]);

  // Video time & metadata handlers
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (vid) {
      setCurrentTime(vid.currentTime);
      if (vid.currentTime >= 5 && !skipRevealed) {
        setSkipRevealed(true);
      }
      if ((!duration || isNaN(duration)) && vid.duration) {
        setDuration(vid.duration);
      }
    }
  };

  const handleLoadedMeta = () => {
    const vid = videoRef.current;
    if (vid) {
      if (vid.duration) setDuration(vid.duration);
      setIsMuted(vid.muted);
    }
  };

  // VideoRing dimensions
  const ringSize = 52;
  const ringWidth = 2.5;
  const ringCenter = ringSize / 2;
  const ringRadius = Math.max(1, ringCenter - ringWidth / 2 - 0.5);

  return (
    <div
      ref={rootRef}
      className="framer-vp-container"
      onMouseMove={showControls}
      onTouchStart={showControls}
      onClick={handleTapAnywhere}
      onTouchEnd={handleTapAnywhere}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        minHeight: '100%',
        backgroundColor: '#000000',
        zIndex: isActive ? 99999 : 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: 'none',
        opacity: isActive ? (isFadingOut ? 0 : 1) : 0,
        filter: isFadingOut ? 'blur(14px)' : 'none',
        transform: isFadingOut ? 'scale(1.03)' : 'none',
        transition: isFadingOut
          ? 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
          : 'opacity 0.4s ease',
        pointerEvents: isActive && !isFadingOut ? 'auto' : 'none'
      }}
    >
      <div
        ref={playerWrapRef}
        className="vp-player-wrap"
        style={{
          position: 'fixed',
          top: isPortrait ? '50%' : 0,
          left: isPortrait ? '50%' : 0,
          right: isPortrait ? 'auto' : 0,
          bottom: isPortrait ? 'auto' : 0,
          width: isPortrait ? '100dvh' : '100vw',
          height: isPortrait ? '100dvw' : '100dvh',
          transform: isPortrait ? 'translate(-50%, -50%) rotate(90deg)' : 'none',
          transformOrigin: 'center center',
          overflow: 'hidden',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.35s ease'
        }}
      >
        {/* ─── MAIN NATIVE VIDEO ELEMENT (Strict Landscape Edge-to-Edge Coverage) ─── */}
        <div
          className="vp-media"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <video
            id="viper-tour-video"
            ref={videoRef}
            src={videoSrc}
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMeta}
            onDurationChange={handleLoadedMeta}
            onEnded={handleEnded}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              minWidth: '100%',
              minHeight: '100%',
              objectFit: effectiveFitMode,
              objectPosition: 'center center',
              backgroundColor: '#000000',
              display: 'block',
              zIndex: 1,
              transition: 'object-fit 0.25s ease'
            }}
          />
        </div>

        {/* ─── TOP-RIGHT CONTROLS HUD (Zoom/Fit Toggle + Mute Button + 5s Slow-Mo Skip Button) ─── */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            right: '28px',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {/* MUTE / UNMUTE BUTTON (Instant audio toggle + 'M' key shortcut) */}
          <div
            style={{
              position: 'relative',
              opacity: controlsRevealed || muteHovered ? 1 : 0.45,
              transform: controlsRevealed || muteHovered ? 'translateY(0)' : 'translateY(-2px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease'
            }}
            onMouseEnter={() => setMuteHovered(true)}
            onMouseLeave={() => setMuteHovered(false)}
          >
            {/* Tooltip on hover */}
            <div
              style={{
                position: 'absolute',
                right: '58px',
                top: '50%',
                transform: muteHovered ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.95)',
                background: 'rgba(15, 12, 8, 0.92)',
                border: '1px solid rgba(245, 185, 66, 0.3)',
                borderRadius: '999px',
                padding: '5px 14px',
                color: '#FFF6E8',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                opacity: muteHovered ? 1 : 0,
                transition:
                  'opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}
            >
              {isMuted ? 'Unmute (M)' : 'Mute (M)'}
            </div>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              style={{
                position: 'relative',
                width: '46px',
                height: '46px',
                padding: 0,
                margin: 0,
                border: isMuted ? '1px solid rgba(239, 68, 68, 0.65)' : '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: '50%',
                background: isMuted ? 'rgba(180, 25, 25, 0.55)' : 'rgba(18, 12, 6, 0.85)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: muteHovered
                  ? '0 0 0 2px rgba(245, 185, 66, 0.6), 0 8px 28px rgba(0,0,0,0.5)'
                  : '0 8px 28px rgba(0,0,0,0.4)',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                color: isMuted ? '#FCA5A5' : '#FFF6E8',
                transform: muteHovered ? 'scale(1.06)' : 'scale(1)',
                transition:
                  'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease'
              }}
            >
              {isMuted ? (
                // Muted Speaker Icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                // Active Speaker Icon with Sound Waves (exactly like browser tab)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          </div>

          {/* VIDEORING SKIP BUTTON (Reveals after 5s in super slow-mo cinematic fade) */}
          <div
            className="vp-ring-wrap"
            style={{
              position: 'relative',
              opacity: skipRevealed ? (controlsRevealed || ringHovered ? 1 : 0.45) : 0,
              filter: skipRevealed ? 'blur(0px)' : 'blur(20px)',
              transform: skipRevealed
                ? ringHovered
                  ? 'scale(1.05) translateY(0)'
                  : 'scale(1) translateY(0)'
                : 'scale(0.75) translateY(-14px)',
              pointerEvents: skipRevealed && !isFadingOut ? 'auto' : 'none',
              transition:
                'opacity 2.8s cubic-bezier(0.16, 1, 0.3, 1), filter 2.8s cubic-bezier(0.16, 1, 0.3, 1), transform 2.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={() => setRingHovered(true)}
            onMouseLeave={() => setRingHovered(false)}
          >
            {/* Tooltip on hover: exactly "Skip" */}
            <div
              style={{
                position: 'absolute',
                right: `${ringSize + 12}px`,
                top: '50%',
                transform: ringHovered ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.95)',
                background: 'rgba(15, 12, 8, 0.8)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(245, 185, 66, 0.3)',
                borderRadius: '999px',
                padding: '5px 14px',
                color: '#FFF6E8',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                opacity: ringHovered ? 1 : 0,
                transition:
                  'opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}
            >
              Skip
            </div>

            <button
              type="button"
              onClick={handleSkip}
              aria-label="Skip"
              title="Skip"
              style={{
                position: 'relative',
                width: `${ringSize}px`,
                height: `${ringSize}px`,
                padding: 0,
                margin: 0,
                border: 'none',
                borderRadius: '50%',
                background: 'rgba(18, 12, 6, 0.65)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
                backdropFilter: 'blur(14px) saturate(1.2)',
                boxShadow: ringHovered
                  ? '0 0 0 2px rgba(245, 185, 66, 0.6), 0 8px 32px rgba(245, 185, 66, 0.25), inset 0 0 0 0.5px rgba(255, 246, 232, 0.2)'
                  : '0 8px 32px rgba(0,0,0,0.55), inset 0 0 0 0.5px rgba(255, 246, 232, 0.1)',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                transform: ringHovered ? 'scale(1.05)' : 'scale(1)',
                transition:
                  'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background 0.2s ease'
              }}
            >
              {/* SVG Radial Progress Timeline Ring */}
              <svg
                width={ringSize}
                height={ringSize}
                viewBox={`0 0 ${ringSize} ${ringSize}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: 'rotate(-90deg)',
                  pointerEvents: 'none',
                  overflow: 'visible'
                }}
                aria-hidden="true"
              >
                <circle
                  cx={ringCenter}
                  cy={ringCenter}
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(245, 185, 66, 0.24)"
                  strokeWidth={ringWidth}
                />
                <circle
                  ref={ringProgressCircleRef}
                  cx={ringCenter}
                  cy={ringCenter}
                  r={ringRadius}
                  fill="none"
                  stroke="#F5B942"
                  strokeWidth={ringWidth}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 2.5px #F5B942)'
                  }}
                />
              </svg>

              {/* Skip Icon (Forward arrow + vertical bar) */}
              <span
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF6E8',
                  transform: 'translateX(1px)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.5 5.5v13l9.5-6.5-9.5-6.5zM16.5 5.5h2v13h-2z" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* ─── EDGE FLASHES (On arrow seek) ─── */}
        <div className={`vp-edge-flash vp-edge-left ${edgeFlash === 'left' ? 'flash-in' : ''}`} />
        <div className={`vp-edge-flash vp-edge-right ${edgeFlash === 'right' ? 'flash-in' : ''}`} />

        {/* ─── SEEK INDICATOR (−10s / +10s) ─── */}
        {seekFlash && (
          <div
            className="vp-seek-indicator show"
            style={{
              left: seekFlash.dir === 'back' ? '22%' : 'auto',
              right: seekFlash.dir === 'fwd' ? '22%' : 'auto'
            }}
          >
            {seekFlash.dir === 'back' ? ARR_L : ARR_R}
            <span style={{ marginLeft: '4px' }}>{seekFlash.label}</span>
          </div>
        )}
      </div>

      {/* ─── STYLES ─── */}
      <style>{`
        .framer-vp-container * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
          outline: none;
        }

        .vp-player-wrap.hide-cursor,
        .vp-player-wrap.hide-cursor * {
          cursor: none !important;
        }

        /* Edge Flash */
        .vp-edge-flash {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 10;
        }
        .vp-edge-left {
          left: 0;
          background: linear-gradient(to right, rgba(255, 255, 255, 0.12), transparent);
        }
        .vp-edge-right {
          right: 0;
          background: linear-gradient(to left, rgba(255, 255, 255, 0.12), transparent);
        }
        .vp-edge-flash.flash-in {
          opacity: 1;
        }

        /* Seek Indicator */
        .vp-seek-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%) scale(0.9);
          background: rgba(18, 12, 6, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(245, 185, 66, 0.3);
          border-radius: 99px;
          padding: 10px 18px;
          color: #FFF6E8;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 40;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
        }
        .vp-seek-indicator.show {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
      `}</style>
    </div>
  );
}
