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
    // Tag before moving so bridge.js knows this specific node was relocated
    // and needs the removeChild/insertBefore safety net (see bridge.js).
    chat.setAttribute('data-ke-portaled', 'true');
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
  watchProfileBanner();
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
document.addEventListener('keydown', async function keyHandler(e) {
  if (typeof chrome !== 'undefined' && !chrome.runtime?.id) {
    document.removeEventListener('keydown', keyHandler);
    return;
  }
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
  const overlay = document.getElementById(OVERLAY_ID);
  if (!isFullscreen && !overlay) return;

  const chat = document.querySelector('#channel-chatroom');

  isFullscreen = false;

  // Clean up any active profile banners
  try {
    if (typeof cleanupProfileBanner === 'function') cleanupProfileBanner();
  } catch (e) {
    console.error('Kick Extension: Error cleaning up profile banner on exit', e);
  }

  // Restore #seventv-root back to document.body
  const seventvRoot = document.getElementById('seventv-root');
  if (seventvRoot && seventvRoot.parentNode !== document.body) {
    document.body.appendChild(seventvRoot);
  }
  if (seventvRoot) seventvRoot.removeAttribute('data-ke-portaled');

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
    tooltip.removeAttribute('data-ke-portaled');
  }

  if (chat && placeholder && placeholder.parentNode) {
    placeholder.parentNode.insertBefore(chat, placeholder);
    chat.removeAttribute('data-ke-portaled');
    placeholder.remove();
  }

  if (headerObserver) { headerObserver.disconnect(); headerObserver = null; }
  if (chatHeaderEl) { chatHeaderEl.style.display = ''; chatHeaderEl = null; }
  stopModActionsObserver();
  stop7TVObserver();
  cleanupInputMonitor();
  stopProfileBannerObserver();

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
const handleFullscreenChange = () => {
  if (typeof chrome !== 'undefined' && !chrome.runtime?.id) {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    return;
  }
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    enterFullscreenChat();
  } else {
    exitFullscreenChat();
  }
};
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

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
    seventvRoot.setAttribute('data-ke-portaled', 'true');
    fullscreenContainer.appendChild(seventvRoot);
  }

  const tooltip = document.getElementById('seventv-tooltip-container');
  if (tooltip && tooltip.parentNode !== fullscreenContainer) {
    tooltip.setAttribute('data-ke-portaled', 'true');
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

// =========================================================================
// Profile Banner — detect, relocate & position left of chat overlay
// =========================================================================

let profileBannerObserver = null;
let profileBannerRemovalObserver = null;
let activeProfileBanner = null;
let isRelocatingBanner = false;
let isRestoringBanner = false;
let lastProfileAnchorRect = null;

const PROFILE_BANNER_WIDTH = 356;
const PROFILE_BANNER_GAP = 12;

/**
 * Returns true when `el` looks like a Kick profile card.
 * Relaxed detection: bg-surface-highest + kick.com user link + any avatar image.
 */
const isProfileCard = (el) => {
  if (!el || el.nodeType !== 1) return false;
  if (!el.classList?.contains('bg-surface-highest')) return false;
  // Exclude pinned messages — they share bg-surface-highest, a kick.com link, and img[alt] (emotes)
  if (el.querySelector('[data-testid="pinned-message-content"]')) return false;
  // Profile link to kick.com/username
  const link = el.querySelector('a[href*="kick.com/"]');
  if (!link) return false;
  // Any avatar image
  const avatar = el.querySelector('img[alt]');
  return !!avatar;
};

/** Searches `node` and its descendants for a profile card element. */
const findProfileCardIn = (node) => {
  if (!node || node.nodeType !== 1) return null;
  // Fast path: node itself is the profile card
  if (isProfileCard(node)) return node;
  // Skip leaf nodes — no children means no card inside
  if (!node.firstElementChild) return null;

  // KEY OPTIMISATION: Only pay the cost of querySelectorAll for nodes that
  // could plausibly be profile card containers. Radix portals are always
  // appended at body level OR carry known Radix data-attributes. Regular chat
  // message nodes are deep inside #channel-chatroom and have neither.
  //
  // This handles both Radix rendering stages:
  //   Stage 1 — empty [data-radix-portal] appended to body  → isBodyLevel = true
  //   Stage 2 — [data-radix-popper-content-wrapper] appended inside portal
  //             → isPortalNode = true (has the attribute)
  //   Stage 3 — .bg-surface-highest element appended inside popper
  //             → caught already by isProfileCard(node) at the top
  const parent = node.parentNode;
  const isBodyLevel =
    parent === document.body ||
    parent === document.fullscreenElement ||
    parent === document.webkitFullscreenElement;
  const isPortalNode =
    node.hasAttribute?.('data-radix-portal') ||
    node.hasAttribute?.('data-radix-popper-content-wrapper') ||
    node.id === 'user-identity';

  if (!isBodyLevel && !isPortalNode) return null;

  const all = node.querySelectorAll('.bg-surface-highest');
  if (all) { for (const el of all) { if (isProfileCard(el)) return el; } }
  return null;
};

const rememberProfileAnchor = (event) => {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay?.contains(event.target)) return;

  const trigger = event.target.closest('button.inline.font-bold, button[data-prevent-expand], [data-chat-entry-username], a[href*="kick.com/"]');
  if (!trigger) return;

  lastProfileAnchorRect = trigger.getBoundingClientRect();
};



const positionProfileBanner = () => {
  if (!activeProfileBanner) return;

  const { wrapper } = activeProfileBanner;
  const overlay = document.getElementById(OVERLAY_ID);
  if (!wrapper || !overlay) return;

  const overlayRect = overlay.getBoundingClientRect();
  const anchorRect = lastProfileAnchorRect;
  const wrapperHeight = wrapper.offsetHeight || 260;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = overlayRect.left - PROFILE_BANNER_WIDTH - PROFILE_BANNER_GAP;
  if (left < PROFILE_BANNER_GAP) {
    left = overlayRect.right + PROFILE_BANNER_GAP;
  }
  left = Math.max(PROFILE_BANNER_GAP, Math.min(left, viewportWidth - PROFILE_BANNER_WIDTH - PROFILE_BANNER_GAP));

  const preferredTop = anchorRect
    ? anchorRect.top - 24
    : overlayRect.top;
  const top = Math.max(
    PROFILE_BANNER_GAP,
    Math.min(preferredTop, viewportHeight - wrapperHeight - PROFILE_BANNER_GAP)
  );

  wrapper.style.left = `${Math.round(left)}px`;
  wrapper.style.top = `${Math.round(top)}px`;
};
/** Starts observing for profile banner popups inside fullscreen. */
const watchProfileBanner = () => {
  if (profileBannerObserver) return;
  if (!isFullscreen) return;
  const fsContainer = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fsContainer) return;

  document.addEventListener('pointerdown', rememberProfileAnchor, true);
  document.addEventListener('click', rememberProfileAnchor, true);

  // INITIAL SCAN: If a profile banner is ALREADY open before we enter fullscreen.
  // We iterate direct children of body/fsContainer rather than passing the containers
  // themselves, because findProfileCardIn filters by node.parentNode — and only nodes
  // whose parent IS body/fsContainer pass the portal check.
  let existingCard = null;
  for (const child of document.body.children) {
    existingCard = findProfileCardIn(child);
    if (existingCard) break;
  }
  if (!existingCard && fsContainer !== document.body) {
    for (const child of fsContainer.children) {
      existingCard = findProfileCardIn(child);
      if (existingCard) break;
    }
  }
  if (existingCard && !activeProfileBanner && !isRelocatingBanner) {
    isRelocatingBanner = true;
    setTimeout(() => {
      isRelocatingBanner = false;
      relocateProfileBanner(existingCard);
    }, 20);
  }

  // Subscribe to the shared body observer instead of creating a new MutationObserver.
  // document.body with subtree:true covers fsContainer too (it's a DOM descendant of body
  // even in fullscreen mode — only the rendering layer changes, not the DOM tree).
  //
  // The expensive filtering (skipping chat messages vs. processing portal nodes) is done
  // inside findProfileCardIn itself, which checks parentNode and Radix attributes.
  // This correctly handles both stages of Radix portal rendering without any target filter here.
  profileBannerObserver = (mutations) => {
    if (!isFullscreen) return;
    if (isRestoringBanner) return; // Ignore our own DOM restoration

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const card = findProfileCardIn(node);
        if (card) {
          if (!isRelocatingBanner) {
            isRelocatingBanner = true;
            // Delay moving the element so React finishes its render cycle
            setTimeout(() => {
              isRelocatingBanner = false;
              relocateProfileBanner(card);
            }, 20);
          }
          return;
        }
      }
    }
  };

  window.KickExt.sharedBodyObserver.subscribe(profileBannerObserver);

  console.log('Kick Extension: Profile banner observer started (via sharedBodyObserver)');
};

/** Moves the original profile card into the fullscreen container, left of overlay. */
const relocateProfileBanner = (cardEl) => {
  const fsContainer = document.fullscreenElement || document.webkitFullscreenElement;
  const overlay = document.getElementById(OVERLAY_ID);
  if (!fsContainer || !overlay) return;

  // Clean up any existing banner first
  cleanupProfileBanner();

  // Find the topmost movable container (#user-identity → Radix portal → cursor-auto wrapper)
  let toMove = cardEl;
  const userIdentity = cardEl.closest('#user-identity');

  if (userIdentity) {
    toMove = userIdentity;
  } else {
    const portal = cardEl.closest('[data-radix-portal]');
    if (portal) {
      toMove = portal;
    } else {
      const popperWrapper = cardEl.closest('[data-radix-popper-content-wrapper]');
      if (popperWrapper) {
        // Move the whole popper wrapper, or its portal parent
        toMove = popperWrapper.closest('[data-radix-portal]') || popperWrapper;
      } else {
        const cursorWrap = cardEl.closest('[class*="cursor-auto"]');
        if (cursorWrap && cursorWrap !== document.body) toMove = cursorWrap;
      }
    }
  }

  // Remember original location for cleanup
  const origParent = toMove.parentNode;
  const origNextSibling = toMove.nextSibling;
  if (!origParent) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'kick-ext-fs-profile-banner';

  wrapper.appendChild(toMove);
  toMove.setAttribute('data-ke-portaled', 'true');
  fsContainer.appendChild(wrapper);

  // --- Custom Fullscreen Drag Logic ---
  let isDraggingBanner = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  const onPointerDown = (e) => {
    if (!activeProfileBanner) return;
    const target = e.target;
    // Allow clicking buttons, links, scrollbars, etc.
    if (target.closest('button, a, input, [role="button"], .scrollbar-hide')) return;

    // Stop React from seeing this pointerdown so its native drag logic doesn't fire
    // This prevents React state corruption that breaks normal mode dragging.
    e.preventDefault();
    e.stopPropagation();

    isDraggingBanner = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialLeft = parseInt(wrapper.style.left || 0, 10) || 0;
    initialTop = parseInt(wrapper.style.top || 0, 10) || 0;
  };

  const onPointerMove = (e) => {
    if (!isDraggingBanner || !activeProfileBanner) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    wrapper.style.left = `${initialLeft + dx}px`;
    wrapper.style.top = `${initialTop + dy}px`;
  };

  const onPointerUp = (e) => {
    if (isDraggingBanner) {
      isDraggingBanner = false;
      e.stopPropagation();
    }
  };

  wrapper.addEventListener('pointerdown', onPointerDown, { capture: true });
  document.addEventListener('pointermove', onPointerMove, { capture: true });
  document.addEventListener('pointerup', onPointerUp, { capture: true });

  // Handle clicks on buttons within the relocated wrapper.
  // Because we moved the React node out of its portal, React's event delegation breaks.
  wrapper.addEventListener('click', (e) => {
    if (!activeProfileBanner) return;
    const btn = e.target.closest('button, a');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const { movedElement } = activeProfileBanner;

    // 1. Move it back to original parent FIRST so React's synthetic events work natively
    cleanupProfileBanner();

    // 2. Dispatch the click on the exact button
    const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY });
    btn.dispatchEvent(clickEvent);

    // 3. If it wasn't the Close button, React keeps it open. We bring it back to fullscreen.
    const isCloseBtn = btn.classList.contains('absolute');
    if (!isCloseBtn) {
      setTimeout(() => {
        if (movedElement.isConnected && document.body.contains(movedElement)) {
          relocateProfileBanner(movedElement);
        }
      }, 100);
    }
  }, { capture: true });

  // Store active state
  activeProfileBanner = { wrapper, movedElement: toMove, origParent, origNextSibling, onPointerMove, onPointerUp };
  requestAnimationFrame(positionProfileBanner);

  // Escape key closes banner
  activeProfileBanner._escHandler = (e) => { if (e.key === 'Escape') cleanupProfileBanner(); };
  document.addEventListener('keydown', activeProfileBanner._escHandler);

  // Watch for React-side removal (Kick unmounts the card content)
  profileBannerRemovalObserver = new MutationObserver(() => {
    if (!wrapper.querySelector('.bg-surface-highest')) cleanupProfileBanner();
    else requestAnimationFrame(positionProfileBanner);
  });
  profileBannerRemovalObserver.observe(wrapper, { childList: true, subtree: true });

  console.log('Kick Extension: Profile banner relocated to fullscreen');
};



/** Removes the fullscreen profile banner and restores the moved element. */
const cleanupProfileBanner = () => {
  if (profileBannerRemovalObserver) {
    profileBannerRemovalObserver.disconnect();
    profileBannerRemovalObserver = null;
  }
  if (!activeProfileBanner) return;

  const { wrapper, movedElement, origParent, origNextSibling, _escHandler, onPointerMove, onPointerUp } = activeProfileBanner;
  if (_escHandler) document.removeEventListener('keydown', _escHandler);
  if (onPointerMove) document.removeEventListener('pointermove', onPointerMove, { capture: true });
  if (onPointerUp) document.removeEventListener('pointerup', onPointerUp, { capture: true });

  // Move element back so Kick / React can clean up properly
  if (movedElement && origParent?.isConnected) {
    try {
      isRestoringBanner = true;
      if (origNextSibling?.parentNode === origParent) {
        origParent.insertBefore(movedElement, origNextSibling);
      } else {
        origParent.appendChild(movedElement);
      }
      movedElement.removeAttribute('data-ke-portaled');
    } catch (_) { /* element may already be unmounted */ }
    finally {
      setTimeout(() => { isRestoringBanner = false; }, 0);
    }
  }

  wrapper?.remove();
  activeProfileBanner = null;
};

/** Stops the profile banner observer and cleans up. */
const stopProfileBannerObserver = () => {
  if (profileBannerObserver) {
    window.KickExt.sharedBodyObserver.unsubscribe(profileBannerObserver);
    profileBannerObserver = null;
  }
  document.removeEventListener('pointerdown', rememberProfileAnchor, true);
  document.removeEventListener('click', rememberProfileAnchor, true);
  lastProfileAnchorRect = null;
  cleanupProfileBanner();
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
