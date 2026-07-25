/**
 * earlyTheme.js — Flash-of-Wrong-Theme (FOWT) Prevention
 *
 * This script runs at document_start (before any page rendering) in the
 * ISOLATED world, so it has access to chrome.storage but executes before
 * Kick's React SPA paints its default green UI.
 *
 * Strategy:
 *   1. PRIMARY (synchronous): Read the theme from localStorage, which is a
 *      synchronous mirror of chrome.storage.local written by the main
 *      content script and popup. This is instant — zero async delay.
 *   2. FALLBACK (async): On first-ever install when no localStorage mirror
 *      exists yet, fall back to chrome.storage.local.get() async. This still
 *      has a small delay but is better than waiting until document_idle.
 *
 * The class is added to document.documentElement (<html>) because
 * document.body does NOT exist yet at document_start.
 *
 * The companion earlyTheme.css (loaded declaratively via manifest.json)
 * provides a critical CSS subset that matches both html.kick-ext-theme-*
 * and body.kick-ext-theme-* selectors, so the theme overrides are visible
 * the instant the class is present — before any JS runs.
 */

(function () {
  'use strict';

  // These must match the THEMES keys in content.js exactly.
  const VALID_THEMES = ['silver', 'burgundy', 'rainbow'];
  const STORAGE_KEY = 'kick-ext-theme';

  /**
   * Apply the theme class to <html> so earlyTheme.css rules activate
   * immediately. The main content.js (document_idle) will detect this
   * class and skip re-adding it to avoid flicker.
   */
  function applyEarlyTheme(theme) {
    if (!VALID_THEMES.includes(theme)) return;
    // 'green' is the native default — no class needed (no override CSS).
    const className = 'kick-ext-theme-' + theme;
    if (!document.documentElement.classList.contains(className)) {
      document.documentElement.classList.add(className);
    }
  }

  // --- Primary path: synchronous localStorage read ---
  // This value is mirrored from chrome.storage.local by the main content
  // script (on initial load) and by the popup (on theme change), so it is
  // available instantly on every subsequent page load after first install.
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_THEMES.includes(stored)) {
      applyEarlyTheme(stored);
      return; // Done — no need for async fallback.
    }
  } catch (e) {
    // localStorage can throw in some security contexts; fall through to
    // the async path.
  }

  // --- Fallback path: async chrome.storage read (first-ever run only) ---
  // On fresh install, no localStorage mirror exists yet. Read from
  // chrome.storage.local and apply as soon as the promise resolves.
  // This is still faster than waiting for document_idle + a second async
  // storage call inside content.js.
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('theme', (result) => {
      if (chrome.runtime.lastError) return;
      const theme = result.theme;
      if (theme && VALID_THEMES.includes(theme)) {
        applyEarlyTheme(theme);
        // Also seed the localStorage mirror so subsequent loads are instant.
        try {
          localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
          // Ignore — not critical, will be seeded by content.js later.
        }
      }
    });
  }
})();
