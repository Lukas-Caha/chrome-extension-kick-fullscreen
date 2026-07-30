// blurEngine.js — unified blur interface.
// Uses native CSS backdrop-filter via --kick-ext-blur custom property.
// Firefox has supported backdrop-filter by default since v103.
// The canvas-based fallback was removed because reading from the <video>
// element in a requestAnimationFrame loop caused video playback stuttering
// and excessive GPU usage on integrated graphics.

/**
 * Apply (or clear) the blur effect on the chat overlay.
 *
 * @param {HTMLElement} overlay  - The #kick-ext-chat-overlay element.
 * @param {HTMLVideoElement} video - The stream <video> element (no longer used, kept for API compatibility).
 * @param {number} radiusPx      - Blur radius in pixels (0 = off).
 */
function setBlur(overlay, video, radiusPx) {
  // Clean up any lingering canvas from previous versions
  overlay.querySelector('#kick-ext-blur-canvas')?.remove();

  // Set the CSS variable for the blur radius
  document.documentElement.style.setProperty('--kick-ext-blur', `${radiusPx}px`);

  // Toggle the .kick-ext-blur-active class on overlay AND body.
  // Without this, CSS backdrop-filter: blur(0px) would still force the browser
  // to create a GPU compositing layer for the overlay, costing ~15-20% GPU
  // even when blur is completely off.
  const active = radiusPx > 0;
  overlay.classList.toggle('kick-ext-blur-active', active);
  document.body.classList.toggle('kick-ext-blur-active', active);
}

function stopCanvasBlur() {
  // No-op, kept for API compatibility
}

window.KickExt = window.KickExt || {};
window.KickExt.blurEngine = { setBlur, stopCanvasBlur };

