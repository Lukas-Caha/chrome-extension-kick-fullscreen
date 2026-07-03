/**
 * Transparency Feature
 */

/**
 * Sets the transparency of the fullscreen chat overlay
 * @param {number} value - 0 to 100
 * @param {boolean} saveToStorage - Whether to persist the setting
 */
const setChatTransparency = async (value, saveToStorage = true) => {
  const alpha = Math.max(0, Math.min(100, value)) / 100;
  
  // Dynamic panel boost logic:
  // If chat is very transparent (< 50%), panels get a stronger boost (+45%) for readability.
  // If chat is more opaque (>= 50%), panels get a lighter boost (+25%) to avoid turning pure black.
  const panelBoost = alpha < 0.5 ? 0.45 : 0.25;
  const panelAlpha = Math.min(1.0, alpha + panelBoost);

  // Apply to document root
  document.documentElement.style.setProperty('--kick-ext-bg-alpha', alpha);
  document.documentElement.style.setProperty('--kick-ext-panel-alpha', panelAlpha);
  
  // Save to settings if available
  if (saveToStorage && window.KickExt && window.KickExt.settings) {
    await window.KickExt.settings.saveSetting('opacity', value);
  }
};

// Export to global namespace
window.KickExt = window.KickExt || {};
window.KickExt.transparency = {
  setChatTransparency
};
