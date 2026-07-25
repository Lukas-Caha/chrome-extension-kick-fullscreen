/**
 * Chat Settings Injector
 * Injects an "Extension Settings" item into Kick's native #chat-settings-panel.
 * When clicked, the panel view swaps (same Kick design) to show our settings.
 * Back arrow restores the original Kick menu.
 */

const EXT_ITEM_ATTR = 'data-kick-ext-injected';
const EXT_PANEL_ID  = 'kick-ext-settings-panel';

let panelObserver = null;

// ============================================================
// DOM Helpers
// ============================================================

/**
 * Resolves key DOM nodes inside the live #chat-settings-panel.
 */
const getPanelParts = (panel) => {
  // Kick title span ("Chat Settings")
  const titleSpan     = panel.querySelector('span.text-base.font-semibold');
  // Kick header row (contains title + close button)
  const headerRow     = titleSpan?.closest('.flex.w-full');
  // The div that wraps the <ul> list  →  <div class="min-h-0 flex-1 overflow-y-auto">
  const contentArea   = panel.querySelector('.min-h-0.flex-1.overflow-y-auto');
  // The inner <div class="w-full"> that directly wraps <ul>
  const kickUlWrapper = contentArea?.querySelector(':scope > .w-full');

  return { titleSpan, headerRow, contentArea, kickUlWrapper };
};

// ============================================================
// Settings Panel HTML
// ============================================================

const buildExtPanel = () => {
  const panel = document.createElement('div');
  panel.id = EXT_PANEL_ID;
  panel.style.cssText = 'display:none;width:100%;';

  panel.innerHTML = `
    <div class="kick-ext-sp-content">

      <div class="kick-ext-sp-section-title">Chat Overlay</div>

      <div class="kick-ext-sp-item kick-ext-sp-row">
        <span>Enable Fullscreen Chat</span>
        <label class="kick-ext-sp-switch">
          <input type="checkbox" id="kick-ext-sp-enable-fs-chat">
          <span class="kick-ext-sp-knob"></span>
        </label>
      </div>

      <div class="kick-ext-sp-item">
        <div class="kick-ext-sp-label">
          <span>Opacity</span>
          <span id="kick-ext-sp-opacity-val">100%</span>
        </div>
        <input type="range" id="kick-ext-sp-opacity" min="0" max="100" value="100" class="kick-ext-sp-slider">
      </div>

      <div class="kick-ext-sp-item kick-ext-sp-row">
        <span>Blur Effect</span>
        <div class="kick-ext-sp-btn-group">
          <button id="kick-ext-sp-blur-off"   class="kick-ext-sp-btn">Off</button>
          <button id="kick-ext-sp-blur-light" class="kick-ext-sp-btn">Light</button>
          <button id="kick-ext-sp-blur-full"  class="kick-ext-sp-btn">Full</button>
        </div>
      </div>

      <div class="kick-ext-sp-item kick-ext-sp-row">
        <span>Extra Small Font (Fullscreen)</span>
        <label class="kick-ext-sp-switch">
          <input type="checkbox" id="kick-ext-sp-extra-small-font">
          <span class="kick-ext-sp-knob"></span>
        </label>
      </div>

      <div class="kick-ext-sp-section-title">Notifications</div>

      <div class="kick-ext-sp-item kick-ext-sp-row">
        <span>Sound on Mention/Reply</span>
        <label class="kick-ext-sp-switch">
          <input type="checkbox" id="kick-ext-sp-mention-sound">
          <span class="kick-ext-sp-knob"></span>
        </label>
      </div>

      <div class="kick-ext-sp-section-title">Appearance</div>

      <div class="kick-ext-sp-item" style="padding-top: 6px; padding-bottom: 6px;">
        <div class="kick-ext-sp-label" style="margin-bottom: 6px;">Brand Color</div>
        <div class="kick-ext-sp-btn-group full-width-grid">
          <button id="kick-ext-sp-theme-green"    class="kick-ext-sp-btn">Green</button>
          <button id="kick-ext-sp-theme-silver"   class="kick-ext-sp-btn">Silver</button>
          <button id="kick-ext-sp-theme-burgundy" class="kick-ext-sp-btn">Burgundy</button>
          <button id="kick-ext-sp-theme-rainbow"  class="kick-ext-sp-btn">Rainbow</button>
        </div>
      </div>

      <div class="kick-ext-sp-section-title">Layout</div>

      <div class="kick-ext-sp-item kick-ext-sp-row">
        <span>Chat Position</span>
        <div class="kick-ext-sp-btn-group">
          <button id="kick-ext-sp-left"  class="kick-ext-sp-btn">Left</button>
          <button id="kick-ext-sp-right" class="kick-ext-sp-btn">Right</button>
        </div>
      </div>

      <div class="kick-ext-sp-item kick-ext-sp-row">
        <span>Hide Leaderboard</span>
        <label class="kick-ext-sp-switch">
          <input type="checkbox" id="kick-ext-sp-leaderboard">
          <span class="kick-ext-sp-knob"></span>
        </label>
      </div>

      <div class="kick-ext-sp-item kick-ext-sp-row">
        <span>Hide Fullscreen Header</span>
        <label class="kick-ext-sp-switch">
          <input type="checkbox" id="kick-ext-sp-fs-header">
          <span class="kick-ext-sp-knob"></span>
        </label>
      </div>

      <div class="kick-ext-sp-item kick-ext-sp-row">
        <span>Hide Moderation Bar</span>
        <label class="kick-ext-sp-switch">
          <input type="checkbox" id="kick-ext-sp-mod-bar">
          <span class="kick-ext-sp-knob"></span>
        </label>
      </div>

      <div class="kick-ext-sp-item kick-ext-sp-row">
        <span>Hide Kicks</span>
        <label class="kick-ext-sp-switch">
          <input type="checkbox" id="kick-ext-sp-user-info">
          <span class="kick-ext-sp-knob"></span>
        </label>
      </div>

      <div class="kick-ext-sp-item" style="margin-top:4px;">
        <button id="kick-ext-sp-reset" class="kick-ext-sp-reset-btn">Reset Layout</button>
      </div>

      <div class="kick-ext-sp-section-title" style="margin-top: 12px;">Manage Friends (Temp)</div>
      <div class="kick-ext-sp-item" style="padding-top:4px; padding-bottom:4px;">
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" id="kick-ext-sp-friend-input" placeholder="Username" class="kick-ext-sp-input" style="flex-grow:1; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:6px 10px; color:white; font-size:13px; outline:none; width: 100%;">
        </div>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <button id="kick-ext-sp-add-friend" class="kick-ext-sp-btn" style="flex:1;">Add</button>
          <button id="kick-ext-sp-remove-friend" class="kick-ext-sp-btn" style="flex:1; background:rgba(255, 80, 80, 0.18); border-color:rgba(255, 80, 80, 0.3); color:#ff7070;">Remove</button>
        </div>
        <div id="kick-ext-sp-friend-list" style="font-size:12px; color:rgba(255,255,255,0.6); max-height:80px; overflow-y:auto; word-break:break-all; padding: 4px 6px; background:rgba(255,255,255,0.04); border-radius:4px;"></div>
      </div>

      <div class="kick-ext-sp-section-title" style="margin-top: 12px;">Keyboard Shortcuts</div>
      <div class="kick-ext-sp-shortcuts">
        <div class="kick-ext-sp-shortcut-row">
          <span class="kick-ext-sp-shortcut-key">Alt+F</span>
          <span class="kick-ext-sp-shortcut-desc">Toggle Fullscreen Chat</span>
        </div>
        <div class="kick-ext-sp-shortcut-row">
          <span class="kick-ext-sp-shortcut-key">Alt+G</span>
          <span class="kick-ext-sp-shortcut-desc">Toggle Ghost Mode</span>
        </div>
        <div class="kick-ext-sp-shortcut-row">
          <span class="kick-ext-sp-shortcut-key">Alt++ / Alt+-</span>
          <span class="kick-ext-sp-shortcut-desc">Adjust Opacity (10%)</span>
        </div>
        <div class="kick-ext-sp-shortcut-row">
          <span class="kick-ext-sp-shortcut-key">Alt+V</span>
          <span class="kick-ext-sp-shortcut-desc">Toggle Quick Clipboard</span>
        </div>
        <div class="kick-ext-sp-shortcut-row">
          <span class="kick-ext-sp-shortcut-key">Alt+N</span>
          <span class="kick-ext-sp-shortcut-desc">Coop Stream Window</span>
        </div>
      </div>

    </div>
  `;

  return panel;
};

// ============================================================
// Show / Hide Extension Settings View
// ============================================================

const showExtSettings = async (panel) => {
  const { titleSpan, headerRow, contentArea, kickUlWrapper } = getPanelParts(panel);
  if (!contentArea) return;

  // Load settings
  const s = await window.KickExt.settings.getAllSettings();

  // Ensure our panel exists inside contentArea
  let extPanel = contentArea.querySelector(`#${EXT_PANEL_ID}`);
  if (!extPanel) {
    extPanel = buildExtPanel();
    contentArea.appendChild(extPanel);
  }

  // Populate current values
  const opacitySlider = extPanel.querySelector('#kick-ext-sp-opacity');
  const opacityVal    = extPanel.querySelector('#kick-ext-sp-opacity-val');
  if (opacitySlider) {
    opacitySlider.value = s.opacity ?? 100;
    if (opacityVal) opacityVal.textContent = `${s.opacity ?? 100}%`;
  }

  const btnLeft  = extPanel.querySelector('#kick-ext-sp-left');
  const btnRight = extPanel.querySelector('#kick-ext-sp-right');
  if (btnLeft && btnRight) {
    btnLeft.classList.toggle('active',  s.chatSide === 'left');
    btnRight.classList.toggle('active', s.chatSide !== 'left');
  }

  const elEnableFsChat = extPanel.querySelector('#kick-ext-sp-enable-fs-chat');
  const elExtraSmallFont = extPanel.querySelector('#kick-ext-sp-extra-small-font');
  const elLeaderboard = extPanel.querySelector('#kick-ext-sp-leaderboard');
  const elFsHeader    = extPanel.querySelector('#kick-ext-sp-fs-header');
  const elModBar      = extPanel.querySelector('#kick-ext-sp-mod-bar');
  const elUserInfo    = extPanel.querySelector('#kick-ext-sp-user-info');
  const elMentionSound = extPanel.querySelector('#kick-ext-sp-mention-sound');

  if (elEnableFsChat) elEnableFsChat.checked = s.enableFullscreenChat   ?? true;
  if (elExtraSmallFont) elExtraSmallFont.checked = s.extraSmallFullscreenFont ?? false;
  if (elLeaderboard) elLeaderboard.checked = s.hideLeaderboard         ?? true;
  if (elFsHeader)    elFsHeader.checked    = s.hideFullscreenChatHeader ?? false;
  if (elModBar)      elModBar.checked      = s.hideModerationBar        ?? false;
  if (elUserInfo)    elUserInfo.checked    = s.hideUserInfo             ?? false;
  if (elMentionSound) elMentionSound.checked = s.enableMentionSound     ?? false;

  // Theme buttons
  const themeGreen    = extPanel.querySelector('#kick-ext-sp-theme-green');
  const themeSilver   = extPanel.querySelector('#kick-ext-sp-theme-silver');
  const themeBurgundy = extPanel.querySelector('#kick-ext-sp-theme-burgundy');
  const themeRainbow  = extPanel.querySelector('#kick-ext-sp-theme-rainbow');
  const activeThemeVal = s.theme ?? 'silver';
  if (themeGreen && themeSilver && themeBurgundy && themeRainbow) {
    themeGreen.classList.toggle('active',    activeThemeVal === 'green');
    themeSilver.classList.toggle('active',   activeThemeVal === 'silver');
    themeBurgundy.classList.toggle('active', activeThemeVal === 'burgundy');
    themeRainbow.classList.toggle('active',  activeThemeVal === 'rainbow');
  }

  // Blur level buttons
  const blurOff   = extPanel.querySelector('#kick-ext-sp-blur-off');
  const blurLight = extPanel.querySelector('#kick-ext-sp-blur-light');
  const blurFull  = extPanel.querySelector('#kick-ext-sp-blur-full');
  const currentBlur = s.blurLevel ?? '6';
  if (blurOff && blurLight && blurFull) {
    blurOff.classList.toggle('active',   currentBlur === '0');
    blurLight.classList.toggle('active', currentBlur === '1');
    blurFull.classList.toggle('active',  currentBlur === '6');
  }

  const refreshFriendList = () => {
    const listDiv = extPanel.querySelector('#kick-ext-sp-friend-list');
    if (listDiv && window.KickExt.friendsHighlight) {
      const friends = window.KickExt.friendsHighlight.getFriends();
      listDiv.textContent = friends.length > 0 ? `Friends: ${friends.join(', ')}` : 'No friends added.';
    }
  };

  refreshFriendList();

  // Attach listeners only once
  if (!extPanel.dataset.listenersAttached) {
    extPanel.dataset.listenersAttached = 'true';

    opacitySlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (opacityVal) opacityVal.textContent = `${val}%`;
      applySetting('opacity', val);
    });

    btnLeft?.addEventListener('click',  () => {
      btnLeft.classList.add('active');
      btnRight?.classList.remove('active');
      applySetting('chatSide', 'left');
    });
    btnRight?.addEventListener('click', () => {
      btnRight.classList.add('active');
      btnLeft?.classList.remove('active');
      applySetting('chatSide', 'right');
    });

    themeGreen?.addEventListener('click', () => {
      themeGreen.classList.add('active');
      themeSilver?.classList.remove('active');
      themeBurgundy?.classList.remove('active');
      themeRainbow?.classList.remove('active');
      applySetting('theme', 'green');
    });
    themeSilver?.addEventListener('click', () => {
      themeSilver.classList.add('active');
      themeGreen?.classList.remove('active');
      themeBurgundy?.classList.remove('active');
      themeRainbow?.classList.remove('active');
      applySetting('theme', 'silver');
    });
    themeBurgundy?.addEventListener('click', () => {
      themeBurgundy.classList.add('active');
      themeGreen?.classList.remove('active');
      themeSilver?.classList.remove('active');
      themeRainbow?.classList.remove('active');
      applySetting('theme', 'burgundy');
    });
    themeRainbow?.addEventListener('click', () => {
      themeRainbow.classList.add('active');
      themeGreen?.classList.remove('active');
      themeSilver?.classList.remove('active');
      themeBurgundy?.classList.remove('active');
      applySetting('theme', 'rainbow');
    });

    elEnableFsChat?.addEventListener('change', (e) => applySetting('enableFullscreenChat', e.target.checked));
    elExtraSmallFont?.addEventListener('change', (e) => applySetting('extraSmallFullscreenFont', e.target.checked));
    elLeaderboard?.addEventListener('change', (e) => applySetting('hideLeaderboard',         e.target.checked));
    elFsHeader?.addEventListener('change',    (e) => applySetting('hideFullscreenChatHeader', e.target.checked));
    elModBar?.addEventListener('change',      (e) => applySetting('hideModerationBar',        e.target.checked));
    elUserInfo?.addEventListener('change',    (e) => applySetting('hideUserInfo',             e.target.checked));
    elMentionSound?.addEventListener('change',(e) => applySetting('enableMentionSound',       e.target.checked));

    // Blur level buttons
    const setBlurActive = (level) => {
      blurOff?.classList.toggle('active',   level === '0');
      blurLight?.classList.toggle('active', level === '1');
      blurFull?.classList.toggle('active',  level === '6');
      applySetting('blurLevel', level);
    };
    blurOff?.addEventListener('click',   () => setBlurActive('0'));
    blurLight?.addEventListener('click', () => setBlurActive('1'));
    blurFull?.addEventListener('click',  () => setBlurActive('6'));

    extPanel.querySelector('#kick-ext-sp-reset')?.addEventListener('click', () => {
      if (confirm('Reset chat position and layout?')) {
        window.dispatchEvent(new CustomEvent('KickExt:resetPosition'));
      }
    });

    const friendInput = extPanel.querySelector('#kick-ext-sp-friend-input');
    extPanel.querySelector('#kick-ext-sp-add-friend')?.addEventListener('click', () => {
      const name = friendInput?.value?.trim();
      if (name && window.KickExt.friendsHighlight) {
        window.KickExt.friendsHighlight.addFriend(name);
        if (friendInput) friendInput.value = '';
        refreshFriendList();
      }
    });

    extPanel.querySelector('#kick-ext-sp-remove-friend')?.addEventListener('click', () => {
      const name = friendInput?.value?.trim();
      if (name && window.KickExt.friendsHighlight) {
        window.KickExt.friendsHighlight.removeFriend(name);
        if (friendInput) friendInput.value = '';
        refreshFriendList();
      }
    });
  }

  // ---- Swap view ----
  if (kickUlWrapper) kickUlWrapper.style.display = 'none';
  extPanel.style.display = 'block';

  // Change header title
  if (titleSpan) {
    titleSpan.dataset.origText = titleSpan.dataset.origText || titleSpan.textContent;
    titleSpan.textContent = 'Extension Settings';
  }

  // Inject back button if not already there
  if (headerRow && !headerRow.querySelector('#kick-ext-sp-back')) {
    const backBtn = document.createElement('button');
    backBtn.id = 'kick-ext-sp-back';
    backBtn.title = 'Back';
    backBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="white">
        <path d="M26 3.54L13.2467 16L26 28.46L22.3767 32L6 16L6.0409 15.98L22.3767 0L26 3.54Z"/>
      </svg>`;
    backBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideExtSettings(panel);
    });

    // Insert as first child of the left-side flex div inside the header row
    const titleContainer = titleSpan?.parentElement;
    if (titleContainer) {
      titleContainer.insertBefore(backBtn, titleContainer.firstChild);
    }
  }
};

const hideExtSettings = (panel) => {
  const { titleSpan, headerRow, contentArea, kickUlWrapper } = getPanelParts(panel);

  // Hide our panel
  const extPanel = contentArea?.querySelector(`#${EXT_PANEL_ID}`);
  if (extPanel) extPanel.style.display = 'none';

  // Restore Kick <ul>
  if (kickUlWrapper) kickUlWrapper.style.display = '';

  // Restore title
  if (titleSpan && titleSpan.dataset.origText) {
    titleSpan.textContent = titleSpan.dataset.origText;
  }

  // Remove back button
  headerRow?.querySelector('#kick-ext-sp-back')?.remove();
};

// ============================================================
// Apply + Persist Setting
// ============================================================

const applySetting = (key, value) => {
  // Persist
  window.KickExt.settings.saveSetting(key, value);

  // Apply immediately (we're already in the content script isolated world)
  switch (key) {
    case 'opacity':
      window.KickExt.transparency?.setChatTransparency(value);
      break;
    case 'extraSmallFullscreenFont':
      if (window.KickExt.fullscreen?.applyFontScale) {
        window.KickExt.fullscreen.applyFontScale(value);
      }
      break;
    case 'chatSide':
      if (value === 'left')  window.KickExt.layout?.moveChatLeft();
      else                   window.KickExt.layout?.moveChatRight();
      break;
    case 'hideLeaderboard':
      document.body.classList.toggle('kick-ext-hide-leaderboard', value);
      break;
    case 'hideModerationBar':
      document.body.classList.toggle('kick-ext-hide-mod-bar', value);
      break;
    case 'hideUserInfo':
      document.body.classList.toggle('kick-ext-hide-user-info', value);
      break;
    case 'hideFullscreenChatHeader':
      window.KickExt.fullscreen?.applyFullscreenChatHeader();
      break;
    case 'enableFullscreenChat':
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
      break;
    case 'blurLevel':
      document.documentElement.style.setProperty('--kick-ext-blur', value === '0' ? '0px' : `${value}px`);
      break;
    case 'theme':
      if (window.KickExt.theme) {
        window.KickExt.theme.setTheme(value);
      }
      break;
  }
};

// ============================================================
// Inject <li> into Kick's <ul>
// ============================================================

const injectExtItem = (panel) => {
  const { titleSpan, headerRow } = getPanelParts(panel);
  if (!titleSpan || !headerRow) return;

  const titleText = titleSpan.textContent.trim();
  
  // If we are currently showing our own settings, the title is 'Extension Settings'.
  // Do not inject a duplicate.
  if (titleText === 'Extension Settings') return;

  // If there's a back button (typically when header has more than 1 button),
  // it means we are in a native submenu (Identity, Chat Appearance, Muted Users, etc.).
  // Do not inject.
  const buttons = headerRow.querySelectorAll('button');
  if (buttons.length > 1) return;

  // Double check the title contains settings/nastavení/config/param/einstell to be absolutely sure
  const titleLower = titleText.toLowerCase();
  const isMainTitle = titleLower.includes('settings') || 
                      titleLower.includes('nastaven') || 
                      titleLower.includes('config') || 
                      titleLower.includes('param') || 
                      titleLower.includes('einstell');
  if (!isMainTitle) return;

  // Idempotency — don't inject twice
  if (panel.querySelector(`[${EXT_ITEM_ATTR}]`)) return;

  const ul = panel.querySelector('ul');
  if (!ul) return;

  const li = document.createElement('li');
  li.setAttribute(EXT_ITEM_ATTR, 'true');
  // Match Kick's existing <li> classes exactly
  li.className = [
    'bg-transparent px-1.5 py-1.5 text-sm font-medium',
    'lg:px-2.5 h-10 rounded-sm text-white',
    'focus:bg-transparent focus-visible:outline-none',
    'betterhover:hover:!bg-[#2A2D32]',
    'cursor-pointer transition-colors duration-200 ease-out',
  ].join(' ');

  li.innerHTML = `
    <div class="flex h-full select-none items-center justify-between text-white">
      <div style="display:flex;align-items:center;gap:8px;">
        <!-- Gear icon (Material Design) -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" style="flex-shrink:0;opacity:0.85;">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94
            0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61
            l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96
            c-.5-.38-1.03-.7-1.62-.94L14.4 2.81
            c-.04-.24-.24-.41-.48-.41h-3.84
            c-.24 0-.43.17-.47.41L9.25 5.35
            C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33
            c-.22-.08-.47 0-.59.22L2.74 8.87
            c-.12.21-.08.47.12.61l2.03 1.58
            C4.84 11.36 4.8 11.69 4.8 12s.02.64.07.94
            l-2.03 1.58c-.18.14-.23.41-.12.61
            l1.92 3.32c.12.22.37.29.59.22l2.39-.96
            c.5.38 1.03.7 1.62.94l.36 2.54
            c.05.24.24.41.48.41h3.84
            c.24 0 .44-.17.47-.41l.36-2.54
            c.59-.24 1.13-.56 1.62-.94l2.39.96
            c.22.08.47 0 .59-.22l1.92-3.32
            c.12-.22.07-.47-.12-.61L19.14 12.94z
            M12 15.6c-1.98 0-3.6-1.62-3.6-3.6
            s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
        <span>Extension Settings</span>
      </div>
      <!-- Chevron right (same SVG Kick uses) -->
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="white" class="size-4">
        <path d="M6 3.54L18.7533 16L6 28.46L9.62334 32L26 16L25.9591 15.98L9.62334 0L6 3.54Z"/>
      </svg>
    </div>
  `;

  li.addEventListener('click', () => showExtSettings(panel));
  ul.appendChild(li);
  console.log('Kick Extension: Injected Extension Settings item into chat settings panel');
};

// ============================================================
// MutationObserver — watch for panel mount/unmount & submenu navigation
// ============================================================

const startObserver = () => {
  if (panelObserver) return;

  const checkAndInject = () => {
    const panel = document.querySelector('#chat-settings-panel');
    if (panel) {
      injectExtItem(panel);
    }
  };

  // Subscribe to the shared body observer instead of creating a dedicated MutationObserver.
  // The callback logic is identical — only the observer plumbing changes.
  const cb = (mutations) => {
    for (const m of mutations) {
      // Fast path: check if the panel itself or a wrapper containing it was added
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.id === 'chat-settings-panel' || node.querySelector?.('#chat-settings-panel')) {
          checkAndInject();
          return;
        }
      }
      // Also re-check when content changes inside the panel (submenu navigation back)
      if (m.target?.id === 'chat-settings-panel' || m.target?.closest?.('#chat-settings-panel')) {
        checkAndInject();
        return;
      }
    }
  };

  panelObserver = cb; // Truthy value — guards against double-start same as before
  window.KickExt.sharedBodyObserver.subscribe(cb);

  // Handle case where panel is already in the DOM on script load
  checkAndInject();
};

startObserver();
