/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIVERSAL CROSS-BROWSER FULLSCREEN UTILITY
 * ═══════════════════════════════════════════════════════════════════════════
 * Handles all browsers and devices:
 * - Desktop: Chrome, Edge, Safari, Firefox, Opera, Brave
 * - Mobile: iOS Safari (iPhone / iPad), Android Chrome, Samsung Internet
 * - Vendor prefixes: webkit, moz, ms
 * - Fallbacks: document.documentElement -> document.body -> video.webkitEnterFullscreen
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function isFullscreenActive() {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

export function requestUniversalFullscreen(preferredElement) {
  if (typeof document === 'undefined') return Promise.resolve(false);

  // If already in fullscreen, nothing to do
  if (isFullscreenActive()) return Promise.resolve(true);

  const docEl = preferredElement || document.documentElement || document.body;

  // Modern HTML5 Fullscreen API with navigation UI hidden to eliminate address/search bars
  if (docEl.requestFullscreen) {
    return docEl
      .requestFullscreen({ navigationUI: 'hide' })
      .then(() => true)
      .catch((err) => {
        if (document.documentElement && docEl !== document.documentElement && document.documentElement.requestFullscreen) {
          return document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => true).catch(() => false);
        }
        if (document.body && document.body.requestFullscreen && docEl !== document.body) {
          return document.body.requestFullscreen({ navigationUI: 'hide' }).then(() => true).catch(() => false);
        }
        return false;
      });
  }

  // WebKit (Safari, iPadOS Safari)
  if (docEl.webkitRequestFullscreen) {
    try {
      docEl.webkitRequestFullscreen();
      return Promise.resolve(true);
    } catch (e) {}
  }
  if (document.documentElement && document.documentElement.webkitRequestFullscreen) {
    try {
      document.documentElement.webkitRequestFullscreen();
      return Promise.resolve(true);
    } catch (e) {}
  }
  if (docEl.webkitRequestFullScreen) {
    try {
      docEl.webkitRequestFullScreen();
      return Promise.resolve(true);
    } catch (e) {}
  }
  if (document.documentElement && document.documentElement.webkitRequestFullScreen) {
    try {
      document.documentElement.webkitRequestFullScreen();
      return Promise.resolve(true);
    } catch (e) {}
  }

  // Firefox
  if (docEl.mozRequestFullScreen) {
    try {
      docEl.mozRequestFullScreen();
      return Promise.resolve(true);
    } catch (e) {}
  }

  // IE / Legacy Edge
  if (docEl.msRequestFullscreen) {
    try {
      docEl.msRequestFullscreen();
      return Promise.resolve(true);
    } catch (e) {}
  }

  // Body fallback for WebKit
  if (document.body) {
    if (document.body.webkitRequestFullscreen) {
      try {
        document.body.webkitRequestFullscreen();
        return Promise.resolve(true);
      } catch (e) {}
    }
  }

  return Promise.resolve(false);
}

export function requestVideoFullscreen(videoEl) {
  if (!videoEl) return Promise.resolve(false);

  // iOS Safari (iPhone / iPad) native video fullscreen
  if (typeof videoEl.webkitEnterFullscreen === 'function') {
    try {
      videoEl.webkitEnterFullscreen();
      return Promise.resolve(true);
    } catch (e) {}
  }

  // WebKit video fullscreen
  if (typeof videoEl.webkitRequestFullscreen === 'function') {
    try {
      videoEl.webkitRequestFullscreen();
      return Promise.resolve(true);
    } catch (e) {}
  }

  // Standard element fullscreen
  return requestUniversalFullscreen(videoEl);
}
