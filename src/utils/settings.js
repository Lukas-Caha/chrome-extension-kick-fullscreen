/**
 * Settings Manager - Handles chrome.storage.local
 */

const DEFAULT_SETTINGS = {
  chatSide: 'right',
  fullscreenEnabled: false,
  enableFullscreenChat: true,
  opacity: 100,
  snapPosition: 'right',
  posX: null, // null means use CSS default (right: 20px)
  posY: null, // null means use CSS default (top: 50px)
  chatHeight: null, // null means use CSS default (65vh)
  chatWidth: null, // null means use CSS default (340px)
  hideLeaderboard: true,
  hideFullscreenChatHeader: false,
  hideModerationBar: false,
  hideUserInfo: false,
  extraSmallFullscreenFont: false,
  enableMentionSound: false,
  blurLevel: '6', // '0' = off, '1' = light, '6' = full
  quickClipboardSnippets: [],
  coopStreamLastUsername: '',
  friendUsernames: [],
};

const SETTING_VALIDATORS = {
  opacity: (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100) ? v : DEFAULT_SETTINGS.opacity,
  blurLevel: (v) => {
    const allowed = ['0', '1', '2', '3', '4', '5', '6'];
    return (typeof v === 'string' && allowed.includes(v)) ? v : DEFAULT_SETTINGS.blurLevel;
  },
  posX: (v) => (v === null || (typeof v === 'number' && Number.isFinite(v))) ? v : DEFAULT_SETTINGS.posX,
  posY: (v) => (v === null || (typeof v === 'number' && Number.isFinite(v))) ? v : DEFAULT_SETTINGS.posY,
  chatHeight: (v) => (v === null || (typeof v === 'number' && Number.isFinite(v))) ? v : DEFAULT_SETTINGS.chatHeight,
  chatWidth: (v) => (v === null || (typeof v === 'number' && Number.isFinite(v))) ? v : DEFAULT_SETTINGS.chatWidth,
};

const sanitizeSettings = (merged) => {
  const out = { ...merged };
  for (const key of Object.keys(SETTING_VALIDATORS)) {
    if (key in out) {
      out[key] = SETTING_VALIDATORS[key](out[key]);
    }
  }
  return out;
};

/**
 * Gets a setting value
 * @param {string} key 
 * @returns {Promise<any>}
 */
const getSetting = async (key) => {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    return DEFAULT_SETTINGS[key];
  }
  try {
    const result = await chrome.storage.local.get([key]);
    let value = result[key] ?? DEFAULT_SETTINGS[key];
    if (key in SETTING_VALIDATORS) {
      value = SETTING_VALIDATORS[key](value);
    }
    return value;
  } catch (error) {
    console.error('Kick Extension Settings Error:', error);
    return DEFAULT_SETTINGS[key];
  }
};

/**
 * Saves a setting value
 * @param {string} key 
 * @param {any} value 
 */
const saveSetting = async (key, value) => {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    return;
  }
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error('Kick Extension Settings Error:', error);
  }
};

/**
 * Gets all settings merged with defaults
 * @returns {Promise<Object>}
 */
const getAllSettings = async () => {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    return DEFAULT_SETTINGS;
  }
  try {
    const result = await chrome.storage.local.get(null);
    return sanitizeSettings({ ...DEFAULT_SETTINGS, ...result });
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
};

// Export to global namespace
window.KickExt = window.KickExt || {};
window.KickExt.settings = {
  getSetting,
  saveSetting,
  getAllSettings,
  defaults: DEFAULT_SETTINGS,
};

