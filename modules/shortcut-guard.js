// modules/shortcut-guard.js
//
// Single source of truth for deciding whether global keyboard shortcuts
// should be active. Keyboard shortcuts depend on a physical keyboard, which
// touch screens don't have, so they are disabled on mobile-sized viewports
// (< 768px). ES modules import these helpers directly; classic scripts reuse
// the same logic through the window globals exposed at the bottom of this
// file (mirrored in script.js for pages that load it without this module).

const MOBILE_VIEWPORT_QUERY = '(max-width: 767px)';

/**
 * Returns true when the current viewport is a mobile-sized screen (< 768px).
 *
 * Degrades safely to `false` when `window` or `window.matchMedia` is
 * unavailable (e.g. unit tests or non-browser environments) so keyboard
 * shortcuts stay enabled rather than breaking.
 */
export function isMobileViewport() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}

/**
 * Keyboard shortcuts are a desktop feature and should only run when a
 * physical keyboard can actually be used, i.e. a non-mobile viewport.
 */
export function areKeyboardShortcutsEnabled() {
  return !isMobileViewport();
}

// Expose on `window` so classic (non-module) scripts share the same check
// instead of duplicating the media-query logic.
if (typeof window !== 'undefined') {
  window.isMobileViewport = isMobileViewport;
  window.areKeyboardShortcutsEnabled = areKeyboardShortcutsEnabled;
}
