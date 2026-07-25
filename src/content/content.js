/**
 * Kick Extension - Content Script
 * Runs in the ISOLATED world.
 */

let chatFound = false;

/**
 * Initializes the chat detection and applies saved settings.
 */
const initChatDetection = async () => {
  const CHAT_SELECTOR = '#channel-chatroom';

  /**
   * Called when chat container is found or DOM changes.
   */
  const handleDetection = async () => {
    const chatElement = document.querySelector(CHAT_SELECTOR);

    if (chatElement) {
      const wasFound = chatFound;
      chatFound = true;

      const settings = await window.KickExt.settings.getAllSettings();

      // 1. Apply side preference (only if not in fullscreen)
      if (!wasFound && !window.KickExt.fullscreen.isActive()) {
        if (settings.chatSide === 'left') {
          window.KickExt.layout.moveChatLeft();
        } else {
          window.KickExt.layout.moveChatRight();
        }
      }

      // 2. Apply leaderboard and moderation bar visibility
      document.body.classList.toggle('kick-ext-hide-leaderboard', settings.hideLeaderboard);
      document.body.classList.toggle('kick-ext-hide-mod-bar', settings.hideModerationBar);
      document.body.classList.toggle('kick-ext-hide-user-info', settings.hideUserInfo);

      // 3. Automatically enter Fullscreen Chat if browser is in fullscreen and chat is enabled
      const isBrowserFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (isBrowserFS && settings.enableFullscreenChat !== false && !window.KickExt.fullscreen.isActive()) {
        window.KickExt.fullscreen.enterFullscreenChat();
      }
    } else if (!chatElement && chatFound) {
      chatFound = false;
    }
  };

  /**
   * Bridge Event Listeners
   * These listen for events sent from bridge.js (MAIN world console).
   */
  window.addEventListener('KickExt:setTransparency', async (e) => {
    window.KickExt.transparency.setChatTransparency(e.detail);
  });

  window.addEventListener('KickExt:resetPosition', async () => {
    await window.KickExt.settings.saveSetting('posX', null);
    await window.KickExt.settings.saveSetting('posY', null);
    await window.KickExt.settings.saveSetting('chatHeight', null);
    const overlay = document.getElementById('kick-ext-chat-overlay');
    if (overlay) {
      overlay.style.left = '';
      overlay.style.top = '';
      overlay.style.right = '';
      overlay.style.bottom = '';
      overlay.style.height = '';
    }
    console.log('Kick Extension: Chat position and height reset to default');
  });

  window.addEventListener('KickExt:toggleChatSide', async () => {
    window.KickExt.layout.toggleChatSide();
    const isLeft = document.body.classList.contains('ext-chat-left');
    await window.KickExt.settings.saveSetting('chatSide', isLeft ? 'left' : 'right');
  });

  window.addEventListener('KickExt:moveChatLeft', async () => {
    window.KickExt.layout.moveChatLeft();
    await window.KickExt.settings.saveSetting('chatSide', 'left');
  });

  window.addEventListener('KickExt:moveChatRight', async () => {
    window.KickExt.layout.moveChatRight();
    await window.KickExt.settings.saveSetting('chatSide', 'right');
  });

  // Fullscreen Events (Read-only status log for console)
  window.addEventListener('KickExt:enterFullscreen', () => {
    console.warn("Kick Extension: Fullscreen is now handled automatically when the video goes fullscreen. Please click the video fullscreen button.");
  });

  window.addEventListener('KickExt:exitFullscreen', () => {
    console.warn("Kick Extension: Fullscreen is now handled automatically when the video goes fullscreen. Please exit browser fullscreen.");
  });

  window.addEventListener('KickExt:toggleFullscreen', () => {
    console.warn("Kick Extension: Fullscreen is now handled automatically when the video goes fullscreen.");
  });

  window.addEventListener('KickExt:requestSettings', async () => {
    const settings = await window.KickExt.settings.getAllSettings();
    console.log('Kick Extension Current Settings:');
    console.table(settings);
  });

  /**
   * Browser Action (Popup) Listener
   * Handles real-time settings updates from the extension popup.
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateSetting') {
      const { key, value } = message;

      if (key === 'opacity') {
        window.KickExt.transparency.setChatTransparency(value);
      } else if (key === 'chatHeight') {
        const overlay = document.getElementById('kick-ext-chat-overlay');
        if (overlay) overlay.style.height = value;
      } else if (key === 'chatSide') {
        if (value === 'left') window.KickExt.layout.moveChatLeft();
        else window.KickExt.layout.moveChatRight();
      } else if (key === 'hideLeaderboard') {
        // This is handled by CSS classes on the body usually, or direct DOM manipulation
        document.body.classList.toggle('kick-ext-hide-leaderboard', value);
      } else if (key === 'hideModerationBar') {
        document.body.classList.toggle('kick-ext-hide-mod-bar', value);
      } else if (key === 'hideUserInfo') {
        document.body.classList.toggle('kick-ext-hide-user-info', value);
      } else if (key === 'hideFullscreenChatHeader') {
        if (window.KickExt.fullscreen.isActive()) {
          window.KickExt.fullscreen.applyFullscreenChatHeader();
        }
      } else if (key === 'enableFullscreenChat') {
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (value) {
          if (isFS && !window.KickExt.fullscreen.isActive()) {
            window.KickExt.fullscreen.enterFullscreenChat();
          }
        } else {
          if (window.KickExt.fullscreen.isActive()) {
            window.KickExt.fullscreen.exitFullscreenChat();
          }
        }
      } else if (key === 'blurLevel') {
        document.documentElement.style.setProperty('--kick-ext-blur', value === '0' ? '0px' : `${value}px`);
      } else if (key === 'extraSmallFullscreenFont') {
        if (window.KickExt.fullscreen?.applyFontScale) {
          window.KickExt.fullscreen.applyFontScale(value);
        }
      } else if (key === 'theme') {
        if (window.KickExt.theme) {
          window.KickExt.theme.setTheme(value);
        }
        // Mirror theme to localStorage so earlyTheme.js can read it
        // synchronously on next page load (FOWT prevention).
        try {
          localStorage.setItem('kick-ext-theme', value);
        } catch (e) { /* localStorage unavailable — non-critical */ }
      }
    } else if (message.action === 'resetPosition') {
      // Trigger the existing reset logic
      window.dispatchEvent(new CustomEvent('KickExt:resetPosition'));
    }
  });

  // Apply initial settings immediately on load to the root/body elements
  (async () => {
    try {
      const initSettings = await window.KickExt.settings.getAllSettings();
      // Apply transparency directly to documentElement (sets CSS variable) without writing back to storage
      if (window.KickExt.transparency) {
        window.KickExt.transparency.setChatTransparency(initSettings.opacity ?? 100, false);
      }

      // Apply initial blur level
      const blurVal = initSettings.blurLevel ?? '6';
      document.documentElement.style.setProperty('--kick-ext-blur', blurVal === '0' ? '0px' : `${blurVal}px`);

      // Apply initial leaderboard class to body if it is active
      document.body.classList.toggle('kick-ext-hide-leaderboard', initSettings.hideLeaderboard);
      // Apply initial moderation bar class to body if it is active
      document.body.classList.toggle('kick-ext-hide-mod-bar', initSettings.hideModerationBar);
      // Apply initial user info class to body if it is active
      document.body.classList.toggle('kick-ext-hide-user-info', initSettings.hideUserInfo);

      // Apply initial theme
      const themeVal = initSettings.theme ?? 'silver';
      if (window.KickExt.theme) {
        window.KickExt.theme.setTheme(themeVal);
      }
      // Seed the localStorage mirror so earlyTheme.js has data on
      // next page load (FOWT prevention). This is the initial write
      // that covers the first-ever-install case.
      try {
        localStorage.setItem('kick-ext-theme', themeVal);
      } catch (e) { /* localStorage unavailable — non-critical */ }
      console.log('Kick Extension: Initial settings applied successfully');
    } catch (error) {
      console.error('Kick Extension: Error during initial settings application', error);
    }
  })();

  // Run handleDetection immediately to check if chat is already there
  handleDetection();

  // Persistent subscription via shared body observer for React rerenders and SPA navigation
  window.KickExt.sharedBodyObserver.subscribe(() => handleDetection());
};

// Bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatDetection);
} else {
  initChatDetection();
}
