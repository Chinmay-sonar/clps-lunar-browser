/**
 * Comprehensive Mobile & Tablet Device Detection Utility
 * 
 * Strict Requirement:
 * - Detects all mobile phones and tablets (iOS Safari, Android Chrome, iPadOS, etc.)
 * - Immune to user spoofing "Desktop Site" / "Request Desktop Website"
 *   by validating hardware pointer capabilities, touch points, and physical screen bounds.
 * - Allows true laptops and desktop computers (with mouse/trackpad and desktop monitors).
 */

export function isMobileOrTabletDevice() {
  if (typeof window === 'undefined') return false;

  const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();

  // 1. Explicit Mobile / Tablet User-Agent strings
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet|silk/i.test(ua);
  
  // 2. iPadOS spoofing macOS desktop UA
  const isIPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // 3. Hardware Touch & Pointer Profile
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const isHoverNone = window.matchMedia && window.matchMedia('(hover: none)').matches;

  // 4. Physical Screen Dimensions (Immune to browser desktop-mode viewport spoofing)
  const screenMin = Math.min(window.screen.width, window.screen.height);
  const screenMax = Math.max(window.screen.width, window.screen.height);

  // Any phone: physical short dimension is < 600px
  const isPhoneScreen = screenMin < 600;

  // Any tablet: physical short dimension is <= 860px and long dimension <= 1200px
  const isTabletScreen = (screenMin <= 860 && screenMax <= 1200 && hasTouch);

  // Direct UA trigger
  if (isMobileUA || isIPadOS) return true;

  // Touch screen + coarse pointer + non-desktop physical screen
  if (hasTouch && (isCoarsePointer || isHoverNone) && (isPhoneScreen || isTabletScreen || window.innerWidth < 1024)) {
    return true;
  }

  // Small viewport with touch
  if (isPhoneScreen || (window.innerWidth < 1024 && hasTouch)) {
    return true;
  }

  return false;
}
