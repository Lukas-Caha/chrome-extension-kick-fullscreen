/**
 * Fullscreen Chat Feature
 */

const OVERLAY_ID = 'kick-ext-chat-overlay';
let isFullscreen = false;
let isGhostMode = false;
let placeholder = null;
let chatHeaderEl = null;

/**
 * Enters fullscreen chat mode automatically when the video goes fullscreen
 */
const enterFullscreenChat = async () => {
  const settings = await window.KickExt.settings.getAllSettings();
  if (settings.enableFullscreenChat === false) return;

  const chat = document.querySelector('#channel-chatroom');
  const fullscreenContainer = document.fullscreenElement || document.webkitFullscreenElement;

  if (!chat || !fullscreenContainer) return;

  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;

    const handle = document.createElement('div');
    handle.id = 'kick-ext-chat-handle';
    handle.innerHTML = `
      <div class="handle-icon"></div>
      <button id="kick-ext-ghost-btn" title="Ghost Mode (Alt+G)" aria-label="Toggle Ghost Mode">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a9 9 0 0 1 9 9v7l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2V11A9 9 0 0 1 12 2zm0 2a7 7 0 0 0-7 7v6.17l.59.59.41-.42.7-.7.71.71L9 19.59l1.59-1.6.71.71.7.7.71-.71.7-.7.71.71.7.7.71-.71.7-.7 1.59 1.59 1.59-1.59.71.71.7.7.41.41.59-.59V11A7 7 0 0 0 12 4zM9.5 11a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
        </svg>
      </button>
    `;
    overlay.appendChild(handle);

    if (window.KickExt.draggable) {
      window.KickExt.draggable.init(overlay, handle);
    }

    // Ghost button click — stop propagation so drag doesn't trigger
    handle.querySelector('#kick-ext-ghost-btn')?.addEventListener('mousedown', e => e.stopPropagation());
    handle.querySelector('#kick-ext-ghost-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGhostMode();
    });
  }

  if (settings.chatHeight) overlay.style.height = settings.chatHeight;
  if (settings.chatWidth) overlay.style.width = settings.chatWidth;

  // Sync --kick-ext-overlay-h on documentElement so the CSS variable cascades to BOTH
  // #kick-ext-chat-overlay AND #seventv-root (they are siblings — custom props only cascade downward).
  const currentH = overlay.style.height || '65vh';
  document.documentElement.style.setProperty('--kick-ext-overlay-h', currentH);
  const currentHpx = parseInt(overlay.style.height) || Math.round(window.innerHeight * 0.65);
  document.body.classList.toggle('kick-ext-emote-compact', currentHpx < 360);

  if (settings.posX && settings.posY) {
    overlay.style.left = settings.posX;
    overlay.style.top = settings.posY;
    overlay.style.right = 'auto';
  } else {
    overlay.style.left = '';
    overlay.style.top = '';
    overlay.style.right = '';
  }

  if (overlay.parentNode !== fullscreenContainer) {
    fullscreenContainer.appendChild(overlay);
  }

  if (chat.parentNode === overlay) return;

  isFullscreen = true;

  if (!placeholder || !document.getElementById('kick-ext-chat-placeholder')) {
    placeholder = document.createElement('div');
    placeholder.id = 'kick-ext-chat-placeholder';
    chat.parentNode.insertBefore(placeholder, chat);
  }

  if (chat.parentNode !== overlay) {
    overlay.appendChild(chat);
  }

  let resizeHandle = document.getElementById('kick-ext-chat-resize-handle');
  if (!resizeHandle) {
    resizeHandle = document.createElement('div');
    resizeHandle.id = 'kick-ext-chat-resize-handle';
    if (window.KickExt.resizable) {
      window.KickExt.resizable.init(overlay, resizeHandle, 'bottom');
    }
  }
  overlay.appendChild(resizeHandle);

  let cornerHandle = document.getElementById('kick-ext-chat-corner-handle');
  if (!cornerHandle) {
    cornerHandle = document.createElement('div');
    cornerHandle.id = 'kick-ext-chat-corner-handle';
    if (window.KickExt.resizable) {
      window.KickExt.resizable.init(overlay, cornerHandle, 'corner');
    }
  }
  overlay.appendChild(cornerHandle);

  document.body.classList.add('ext-fullscreen-active');
  console.log('Kick Extension: Entered Fullscreen Chat (Auto)');

  applyFullscreenChatHeader();
  watchChatHeader();
  watchModActions();
  moveSevenTVRootToFullscreen();
  setupInputMonitor();
  start7TVObserver();
  applyFontScale();
};

// =========================================================================
// Ghost Mode — click-through chat overlay
// =========================================================================

const toggleGhostMode = () => {
  isGhostMode = !isGhostMode;

  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;

  overlay.classList.toggle('kick-ext-ghost-mode', isGhostMode);

  const btn = overlay.querySelector('#kick-ext-ghost-btn');
  if (btn) {
    btn.classList.toggle('active', isGhostMode);
    btn.title = isGhostMode ? 'Ghost Mode ON — click to disable (Alt+G)' : 'Ghost Mode (Alt+G)';
  }

  console.log(`Kick Extension: Ghost Mode ${isGhostMode ? 'ON' : 'OFF'}`);
};

// Adjusts overlay opacity (called by keyboard shortcuts)
const adjustOverlayOpacity = async (delta) => {
  const settings = await window.KickExt.settings.getAllSettings();
  let opacity = settings.opacity ?? 100;
  opacity = Math.max(0, Math.min(100, opacity + delta));
  if (window.KickExt.transparency) {
    await window.KickExt.transparency.setChatTransparency(opacity);
  }
  
  // Update UI components in the injected settings panel if currently open
  const slider = document.getElementById('kick-ext-sp-opacity');
  const opacityVal = document.getElementById('kick-ext-sp-opacity-val');
  if (slider) slider.value = opacity;
  if (opacityVal) opacityVal.textContent = `${opacity}%`;
};

// Keyboard shortcuts (Alt+F, Alt+G, Alt++, Alt+-)
document.addEventListener('keydown', async (e) => {
  const isBrowserFS = !!(document.fullscreenElement || document.webkitFullscreenElement);

  // 1. Alt+F: Toggle Fullscreen Chat option (applies immediately if in browser fullscreen)
  if (e.altKey && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    const settings = await window.KickExt.settings.getAllSettings();
    const newEnableVal = !settings.enableFullscreenChat;
    await window.KickExt.settings.saveSetting('enableFullscreenChat', newEnableVal);
    
    // Update checkbox in Kick settings panel if visible
    const cb = document.getElementById('kick-ext-sp-enable-fs-chat');
    if (cb) cb.checked = newEnableVal;
    
    console.log(`Kick Extension: Fullscreen Chat ${newEnableVal ? 'ENABLED' : 'DISABLED'} via Alt+F`);
    
    if (isBrowserFS) {
      if (newEnableVal) {
        enterFullscreenChat();
      } else {
        exitFullscreenChat();
      }
    }
  }

  // Shortcuts that require the chat overlay to be active (isFullscreen)
  if (isFullscreen) {
    // 1. Enter: Focus chat input if not already typing or interacting with a button
    if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      const activeEl = document.activeElement;
      const tagName = activeEl ? activeEl.tagName.toLowerCase() : '';
      const isInteractive = activeEl && (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'button' ||
        tagName === 'a' ||
        activeEl.isContentEditable ||
        activeEl.getAttribute('role') === 'button'
      );
      
      if (!isInteractive) {
        e.preventDefault();
        const input = getChatInput();
        if (input) {
          input.focus();
        }
      }
    }

    // 2. Alt+G: Toggle Ghost Mode
    if (e.altKey && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      toggleGhostMode();
    }
    
    // 3. Alt++ and Alt+-: Adjust Opacity
    if (e.altKey) {
      if (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault();
        adjustOverlayOpacity(10);
      } else if (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        adjustOverlayOpacity(-10);
      }
    }
  }
});


/**
 * Exits fullscreen chat mode
 */
const exitFullscreenChat = () => {

  if (!isFullscreen) return;

  const chat = document.querySelector('#channel-chatroom');
  const overlay = document.getElementById(OVERLAY_ID);

  isFullscreen = false;

  // Restore #seventv-root back to document.body
  const seventvRoot = document.getElementById('seventv-root');
  if (seventvRoot && seventvRoot.parentNode !== document.body) {
    document.body.appendChild(seventvRoot);
  }

  // Restore 7TV tooltip container to document.body.
  // Reset its left/top to off-screen so stale fullscreen coordinates are never visible.
  // 7TV controls visibility via the 'active' attribute — do NOT touch display.
  // On the next emote hover, 7TV's JS will reposition and show it correctly.
  const tooltip = document.getElementById('seventv-tooltip-container');
  if (tooltip) {
    tooltip.style.left = '-9999px';
    tooltip.style.top = '-9999px';
    if (tooltip.parentNode !== document.body) {
      document.body.appendChild(tooltip);
    }
  }

  if (chat && placeholder && placeholder.parentNode) {
    placeholder.parentNode.insertBefore(chat, placeholder);
    placeholder.remove();
  }

  if (headerObserver) { headerObserver.disconnect(); headerObserver = null; }
  if (chatHeaderEl) { chatHeaderEl.style.display = ''; chatHeaderEl = null; }
  stopModActionsObserver();
  stop7TVObserver();
  cleanupInputMonitor();

  if (overlay) overlay.remove();

  placeholder = null;

  document.body.classList.remove('ext-fullscreen-active');
  document.body.classList.remove('kick-ext-emote-compact');
  document.documentElement.style.removeProperty('--kick-ext-overlay-h');

  // Reset ghost mode on exit so it always starts fresh
  isGhostMode = false;

  console.log('Kick Extension: Exited Fullscreen Chat (Auto)');

  const input = getChatInput();
  if (input) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    window.dispatchEvent(new Event('resize'));

    setTimeout(() => {
      input.focus();
      if (input.tagName === 'TEXTAREA') {
        input.setSelectionRange(input.value.length, input.value.length);
      } else if (input.isContentEditable) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(input);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      // Do NOT restore tooltip.style.display here — 7TV manages tooltip
      // visibility itself on hover. Restoring it here would show stale position.

      input.dispatchEvent(new Event('input', { bubbles: true }));
      window.dispatchEvent(new Event('resize'));
    }, 200);
  }
};

/**
 * Automatically watch for browser fullscreen changes
 */
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    enterFullscreenChat();
  } else {
    exitFullscreenChat();
  }
});
document.addEventListener('webkitfullscreenchange', () => {
  if (document.webkitFullscreenElement) {
    enterFullscreenChat();
  } else {
    exitFullscreenChat();
  }
});

const getChatInput = () => {
  return document.querySelector('#channel-chatroom textarea') ||
    document.querySelector('#channel-chatroom [contenteditable="true"]');
};

// =========================================================================
// 7TV Support — move entire #seventv-root into the fullscreen container
// so that Vue's Teleport targets remain valid inside fullscreen.
// On exit, move #seventv-root back to document.body.
// =========================================================================

const moveSevenTVRootToFullscreen = () => {
  const fullscreenContainer = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fullscreenContainer) return;

  const seventvRoot = document.getElementById('seventv-root');
  if (seventvRoot && seventvRoot.parentNode !== fullscreenContainer) {
    fullscreenContainer.appendChild(seventvRoot);
  }

  const tooltip = document.getElementById('seventv-tooltip-container');
  if (tooltip && tooltip.parentNode !== fullscreenContainer) {
    fullscreenContainer.appendChild(tooltip);
  }
};

// Input monitoring (for autocomplete - still needed to trigger move check)
let inputCheckTimer = null;

const scheduleInputCheck = () => {
  if (inputCheckTimer) clearTimeout(inputCheckTimer);
  inputCheckTimer = setTimeout(() => {
    if (!isFullscreen) return;
    moveSevenTVRootToFullscreen();
  }, 30);
};

const setupInputMonitor = () => {
  const input = getChatInput();
  if (!input || input.dataset.kickExtInputMonitored) return;
  input.dataset.kickExtInputMonitored = 'true';

  input.addEventListener('input', scheduleInputCheck);
  input.addEventListener('keyup', scheduleInputCheck);
  
  // Enter to unfocus when empty in fullscreen
  input.addEventListener('keydown', (e) => {
    if (isFullscreen && e.key === 'Enter' && !e.shiftKey) {
      let isEmpty = false;
      if (input.tagName === 'TEXTAREA') {
        isEmpty = input.value.trim() === '';
      } else {
        const hasText = input.textContent.trim() !== '';
        // Prohlížeče jako Kick používají div/p tagy i když jsou prázdné. Hledáme reálný obsah (obrázky/emoty).
        const hasEmotes = input.querySelector('img') !== null || 
          Array.from(input.querySelectorAll('*')).some(el => 
            typeof el.className === 'string' && el.className.toLowerCase().includes('emote')
          );
        isEmpty = !hasText && !hasEmotes;
      }

      if (isEmpty) {
        e.preventDefault();
        e.stopPropagation();
        input.blur();
      }
    }
  }, { capture: true });
};

const cleanupInputMonitor = () => {
  if (inputCheckTimer) { clearTimeout(inputCheckTimer); inputCheckTimer = null; }
  const input = getChatInput();
  if (input) delete input.dataset.kickExtInputMonitored;
};

// =========================================================================
// 7TV Observer — watches for 7TV DOM changes and ensures #seventv-root stays
// inside the fullscreen container
// =========================================================================

let sevenTVObserver = null;

const start7TVObserver = () => {
  if (sevenTVObserver) return;

  sevenTVObserver = new MutationObserver(() => {
    if (!isFullscreen) return;
    moveSevenTVRootToFullscreen();
    setupInputMonitor();
  });

  sevenTVObserver.observe(document.body, { childList: true, subtree: false });
};

const stop7TVObserver = () => {
  if (sevenTVObserver) {
    sevenTVObserver.disconnect();
    sevenTVObserver = null;
  }
};

const toggleFullscreenChat = () => {
  if (isFullscreen) {
    exitFullscreenChat();
  } else {
    enterFullscreenChat();
  }
};

// =========================================================================
// Mod Actions Sync — syncs the Kick CSS variable to the overlay
// =========================================================================

let modActionsObserver = null;

const syncModActionsDisplay = () => {
  if (!isFullscreen || !placeholder || !placeholder.parentElement) return;
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;
  
  // Kick sets the CSS variable on the wrapper element. We need to mirror it to the overlay.
  const computed = window.getComputedStyle(placeholder.parentElement);
  const modDisplay = computed.getPropertyValue('--chatroom-mod-actions-display');
  
  if (modDisplay && modDisplay.trim() !== '') {
    overlay.style.setProperty('--chatroom-mod-actions-display', modDisplay.trim());
  } else {
    overlay.style.removeProperty('--chatroom-mod-actions-display');
  }
};

const watchModActions = () => {
  if (modActionsObserver) { modActionsObserver.disconnect(); modActionsObserver = null; }
  if (!isFullscreen || !placeholder || !placeholder.parentElement) return;
  
  // Sync once immediately on enter
  syncModActionsDisplay();

  // Watch for style attribute changes on the wrapper — fires only when Kick actually changes the CSS variable
  modActionsObserver = new MutationObserver(syncModActionsDisplay);
  modActionsObserver.observe(placeholder.parentElement, { attributes: true, attributeFilter: ['style'] });
};

const stopModActionsObserver = () => {
  if (modActionsObserver) {
    modActionsObserver.disconnect();
    modActionsObserver = null;
  }
};

/**
 * Finds and hides the chat header bar inside the overlay
 */
const applyFullscreenChatHeader = async () => {
  if (!isFullscreen) return;

  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;

  const chatRoom = document.querySelector('#channel-chatroom');
  if (!chatRoom) return;

  const settings = await window.KickExt.settings.getAllSettings();
  // Cache the value so the mutation observer callback can use it synchronously
  cachedHideFsHeader = settings.hideFullscreenChatHeader;

  if (!chatHeaderEl) {
    // Direct CSS selector is far faster than iterating all divs
    const candidates = chatRoom.querySelectorAll('div.border-b-2.items-center.justify-between');
    for (const div of candidates) {
      const chatSpan = div.querySelector('span.absolute');
      if (chatSpan && chatSpan.textContent.trim() === 'Chat') {
        chatHeaderEl = div;
        break;
      }
    }
  }

  const header = chatHeaderEl;
  if (header && header.isConnected) {
    header.style.display = cachedHideFsHeader ? 'none' : '';
  }
};

let headerObserver = null;
let cachedHideFsHeader = false;
const watchChatHeader = () => {
  if (headerObserver) {
    headerObserver.disconnect();
    headerObserver = null;
  }

  if (!isFullscreen) return;

  const chatRoom = document.querySelector('#channel-chatroom');
  if (!chatRoom) return;

  // Sync callback — uses cachedHideFsHeader instead of awaiting chrome.storage on every mutation
  headerObserver = new MutationObserver(() => {
    if (!isFullscreen) return;
    const header = chatHeaderEl;
    if (header && header.isConnected) {
      if (cachedHideFsHeader && header.style.display !== 'none') {
        header.style.display = 'none';
      }
    } else {
      chatHeaderEl = null;
      applyFullscreenChatHeader();
    }
  });

  headerObserver.observe(chatRoom, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
};

const applyFontScale = async (value) => {
  const isExtraSmall = value ?? (await window.KickExt.settings.getSetting('extraSmallFullscreenFont')) ?? false;
  document.body.classList.toggle('kick-ext-extra-small-font', isExtraSmall);
};

// Export to global namespace
window.KickExt = window.KickExt || {};
window.KickExt.fullscreen = {
  enterFullscreenChat,
  exitFullscreenChat,
  toggleFullscreenChat,
  toggleGhostMode,
  isActive: () => isFullscreen,
  isGhost: () => isGhostMode,
  applyFullscreenChatHeader,
  applyFontScale,
};
