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
  blurLevel: '6', // '0' = off, '2' = light, '6' = full
};

/**
 * Gets a setting value
 * @param {string} key 
 * @returns {Promise<any>}
 */
const getSetting = async (key) => {
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key] ?? DEFAULT_SETTINGS[key];
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
  try {
    const result = await chrome.storage.local.get(null);
    return { ...DEFAULT_SETTINGS, ...result };
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

