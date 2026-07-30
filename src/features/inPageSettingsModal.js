/**
 * Kick Extension - In-Page Settings Modal Feature
 * Draggable & Resizable settings modal directly on Kick.com
 */

(function () {
  window.KickExt = window.KickExt || {};

  let modalBackdrop = null;
  let modalElement = null;
  let activeTab = 'overlay';

  // Clean SVG Icons (Outline Feather/Lucide style, 1.8px stroke)
  const ICONS = {
    chat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    layout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
    friends: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    shortcuts: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="10" y1="12" x2="10.01" y2="12"/><line x1="14" y1="12" x2="14.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/></svg>`,
    close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  const getModalOverlayParent = () =>
    document.fullscreenElement || document.webkitFullscreenElement || document.body;

  const handleFullscreenChange = () => {
    if (!modalElement || !modalElement.classList.contains('active')) return;
    const overlayParent = getModalOverlayParent();
    if (modalBackdrop.parentNode !== overlayParent) overlayParent.appendChild(modalBackdrop);
    if (modalElement.parentNode !== overlayParent) overlayParent.appendChild(modalElement);
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

  /**
   * Generates the modal DOM structure.
   */
  const createModalDOM = () => {
    if (document.getElementById('kick-ext-inpage-settings-modal')) return;

    // Backdrop
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'kick-ext-inpage-settings-modal-backdrop';

    // Modal Container
    modalElement = document.createElement('div');
    modalElement.id = 'kick-ext-inpage-settings-modal';

    modalElement.innerHTML = `
      <div class="kick-ext-modal-header" id="kick-ext-modal-header">
        <div class="kick-ext-modal-header-title">
          <div class="kick-ext-modal-header-icon"></div>
          <span>Kick Extension Settings</span>
        </div>
        <button class="kick-ext-modal-close-btn" id="kick-ext-modal-close" title="Close Settings">${ICONS.close}</button>
      </div>

      <div class="kick-ext-modal-body">
        <div class="kick-ext-modal-sidebar">
          <button class="kick-ext-sidebar-item active" data-tab="overlay">
            <span class="kick-ext-sidebar-icon">${ICONS.chat}</span>
            <span>Chat Overlay</span>
          </button>
          <button class="kick-ext-sidebar-item" data-tab="layout">
            <span class="kick-ext-sidebar-icon">${ICONS.layout}</span>
            <span>Layout</span>
          </button>
          <button class="kick-ext-sidebar-item" data-tab="friends">
            <span class="kick-ext-sidebar-icon">${ICONS.friends}</span>
            <span>Friends</span>
          </button>
          <button class="kick-ext-sidebar-item" data-tab="shortcuts">
            <span class="kick-ext-sidebar-icon">${ICONS.shortcuts}</span>
            <span>Shortcuts</span>
          </button>
        </div>

        <div class="kick-ext-modal-content">
          <!-- Chat Overlay Pane -->
          <div class="kick-ext-tab-pane active" id="pane-overlay">
            <div class="kick-ext-pane-title">Chat Overlay Settings</div>
            <div class="kick-ext-pane-desc">Configure fullscreen chat overlay behavior and appearance</div>

            <div class="kick-ext-modal-setting-item">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Enable Fullscreen Chat</div>
                <div class="kick-ext-modal-setting-sub">Enable custom chat overlay when stream is in fullscreen</div>
              </div>
              <label class="kick-ext-switch">
                <input type="checkbox" id="modal-toggle-enable-fs-chat">
                <span class="kick-ext-slider"></span>
              </label>
            </div>

            <div class="kick-ext-modal-setting-item block-layout">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Chat Opacity</div>
                <div class="kick-ext-modal-setting-sub">Adjust transparency of chat background</div>
              </div>
              <div class="kick-ext-range-container">
                <input type="range" id="modal-opacity-slider" min="0" max="100" value="100">
                <span class="kick-ext-range-value" id="modal-opacity-val">100%</span>
              </div>
            </div>

            <div class="kick-ext-modal-setting-item">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Blur Effect</div>
                <div class="kick-ext-modal-setting-sub">Background blur strength for chat</div>
              </div>
              <div class="kick-ext-btn-group">
                <button class="kick-ext-btn-group-btn" data-blur="0" id="modal-blur-0">Off</button>
                <button class="kick-ext-btn-group-btn" data-blur="1" id="modal-blur-1">Light</button>
                <button class="kick-ext-btn-group-btn" data-blur="6" id="modal-blur-6">Full</button>
              </div>
            </div>

            <div class="kick-ext-modal-setting-item">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Extra Small Font (Fullscreen)</div>
                <div class="kick-ext-modal-setting-sub">Use compact font size in fullscreen mode</div>
              </div>
              <label class="kick-ext-switch">
                <input type="checkbox" id="modal-toggle-extra-small-font">
                <span class="kick-ext-slider"></span>
              </label>
            </div>

            <div class="kick-ext-modal-setting-item">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Sound on Mention / Reply</div>
                <div class="kick-ext-modal-setting-sub">Play audio ding when someone mentions your username</div>
              </div>
              <label class="kick-ext-switch">
                <input type="checkbox" id="modal-toggle-mention-sound">
                <span class="kick-ext-slider"></span>
              </label>
            </div>
          </div>

          <!-- Layout Pane -->
          <div class="kick-ext-tab-pane" id="pane-layout">
            <div class="kick-ext-pane-title">Layout & Hiding Options</div>
            <div class="kick-ext-pane-desc">Customize which UI components are visible</div>

            <div class="kick-ext-modal-setting-item">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Chat Side Position</div>
                <div class="kick-ext-modal-setting-sub">Dock normal stream chat on left or right</div>
              </div>
              <div class="kick-ext-btn-group">
                <button class="kick-ext-btn-group-btn" id="modal-side-left">Left</button>
                <button class="kick-ext-btn-group-btn" id="modal-side-right">Right</button>
              </div>
            </div>

            <div class="kick-ext-modal-setting-item">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Hide Leaderboard</div>
                <div class="kick-ext-modal-setting-sub">Hide top gifter / sub leaderboard above chat</div>
              </div>
              <label class="kick-ext-switch">
                <input type="checkbox" id="modal-toggle-leaderboard">
                <span class="kick-ext-slider"></span>
              </label>
            </div>

            <div class="kick-ext-modal-setting-item">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Hide Fullscreen Chat Header</div>
                <div class="kick-ext-modal-setting-sub">Hide top header bar inside fullscreen chat overlay</div>
              </div>
              <label class="kick-ext-switch">
                <input type="checkbox" id="modal-toggle-fs-header">
                <span class="kick-ext-slider"></span>
              </label>
            </div>

            <div class="kick-ext-modal-setting-item">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Hide Moderation Bar</div>
                <div class="kick-ext-modal-setting-sub">Hide mod action bar in chat</div>
              </div>
              <label class="kick-ext-switch">
                <input type="checkbox" id="modal-toggle-mod-bar">
                <span class="kick-ext-slider"></span>
              </label>
            </div>

            <div class="kick-ext-modal-setting-item">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Hide Kicks / User Info</div>
                <div class="kick-ext-modal-setting-sub">Hide Kicks badges and channel reward info</div>
              </div>
              <label class="kick-ext-switch">
                <input type="checkbox" id="modal-toggle-user-info">
                <span class="kick-ext-slider"></span>
              </label>
            </div>

            <div class="kick-ext-modal-setting-item" style="margin-top: 16px;">
              <div class="kick-ext-modal-setting-info">
                <div class="kick-ext-modal-setting-label">Reset Fullscreen Chat Layout</div>
                <div class="kick-ext-modal-setting-sub">Restore default position & size for overlay chat</div>
              </div>
              <button class="kick-ext-add-friend-btn" id="modal-btn-reset-layout" style="background:#24272c; color:#efefef; border:1px solid rgba(255,255,255,0.2);">Reset Layout</button>
            </div>
          </div>

          <!-- Friends Pane -->
          <div class="kick-ext-tab-pane" id="pane-friends">
            <div class="kick-ext-pane-title">Manage Friends</div>
            <div class="kick-ext-pane-desc">Highlight messages from specified friends in chat</div>

            <div class="kick-ext-friends-container">
              <div class="kick-ext-friend-input-wrapper">
                <input type="text" id="modal-friend-input" class="kick-ext-friend-input" placeholder="Enter Kick username...">
                <button id="modal-btn-add-friend" class="kick-ext-add-friend-btn">+ Add Friend</button>
              </div>
              <div class="kick-ext-friends-pills-list" id="modal-friends-list"></div>
            </div>
          </div>

          <!-- Shortcuts Pane -->
          <div class="kick-ext-tab-pane" id="pane-shortcuts">
            <div class="kick-ext-pane-title">Keyboard Shortcuts</div>
            <div class="kick-ext-pane-desc">Quick shortcuts available on Kick.com</div>

            <table class="kick-ext-shortcuts-table">
              <tr>
                <td><span class="kick-ext-shortcut-badge">Alt + F</span></td>
                <td>Toggle Fullscreen Chat Overlay</td>
              </tr>
              <tr>
                <td><span class="kick-ext-shortcut-badge">Alt + G</span></td>
                <td>Toggle Ghost Mode</td>
              </tr>
              <tr>
                <td><span class="kick-ext-shortcut-badge">Alt + / Alt -</span></td>
                <td>Adjust Chat Opacity (10%)</td>
              </tr>
              <tr>
                <td><span class="kick-ext-shortcut-badge">Alt + V</span></td>
                <td>Toggle Quick Clipboard</td>
              </tr>
              <tr>
                <td><span class="kick-ext-shortcut-badge">Alt + N</span></td>
                <td>Toggle Coop Stream Window</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <div class="kick-ext-modal-resizer" id="kick-ext-modal-resizer"></div>
    `;

    const overlayParent = getModalOverlayParent();
    overlayParent.appendChild(modalBackdrop);
    overlayParent.appendChild(modalElement);

    setupEventListeners();
  };

  /**
   * Sets up drag, resize, sidebar navigation, and setting controls.
   */
  const setupEventListeners = () => {
    const closeBtn = document.getElementById('kick-ext-modal-close');
    const resizer = document.getElementById('kick-ext-modal-resizer');

    // Close button & backdrop click
    closeBtn.addEventListener('click', () => hideModal());
    modalBackdrop.addEventListener('click', () => hideModal());

    // Sidebar navigation
    const sidebarItems = modalElement.querySelectorAll('.kick-ext-sidebar-item');
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // --- Resizing Logic (Scoped to mousedown, rule 5 & 12) ---
    resizer.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      let startW = modalElement.offsetWidth;
      let startH = modalElement.offsetHeight;
      let startMouseX = e.clientX;
      let startMouseY = e.clientY;

      const onResizeMove = (moveEvent) => {
        moveEvent.stopPropagation();
        moveEvent.preventDefault();
        const newW = Math.max(520, startW + (moveEvent.clientX - startMouseX));
        const newH = Math.max(400, startH + (moveEvent.clientY - startMouseY));
        modalElement.style.width = `${newW}px`;
        modalElement.style.height = `${newH}px`;
      };

      const onResizeUp = (upEvent) => {
        if (upEvent) {
          upEvent.stopPropagation();
          upEvent.preventDefault();
        }
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeUp);
      };

      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeUp);
    });

    // --- Setting Control Event Listeners ---
    bindSettingControl('modal-toggle-enable-fs-chat', 'enableFullscreenChat', 'checkbox');
    bindSettingControl('modal-toggle-extra-small-font', 'extraSmallFullscreenFont', 'checkbox');
    bindSettingControl('modal-toggle-mention-sound', 'enableMentionSound', 'checkbox');
    bindSettingControl('modal-toggle-leaderboard', 'hideLeaderboard', 'checkbox');
    bindSettingControl('modal-toggle-fs-header', 'hideFullscreenChatHeader', 'checkbox');
    bindSettingControl('modal-toggle-mod-bar', 'hideModerationBar', 'checkbox');
    bindSettingControl('modal-toggle-user-info', 'hideUserInfo', 'checkbox');

    // Opacity slider
    const opacitySlider = document.getElementById('modal-opacity-slider');
    const opacityVal = document.getElementById('modal-opacity-val');
    opacitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      opacityVal.textContent = `${val}%`;
      updateSetting('opacity', val);
    });

    // Blur buttons
    ['modal-blur-0', 'modal-blur-1', 'modal-blur-6'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const blur = btn.getAttribute('data-blur');
        document.querySelectorAll('#pane-overlay .kick-ext-btn-group-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateSetting('blurLevel', blur);
      });
    });

    // Side buttons
    const sideLeft = document.getElementById('modal-side-left');
    const sideRight = document.getElementById('modal-side-right');
    sideLeft.addEventListener('click', () => {
      sideLeft.classList.add('active');
      sideRight.classList.remove('active');
      updateSetting('chatSide', 'left');
    });
    sideRight.addEventListener('click', () => {
      sideRight.classList.add('active');
      sideLeft.classList.remove('active');
      updateSetting('chatSide', 'right');
    });

    // Friends management
    const friendInput = document.getElementById('modal-friend-input');
    const addFriendBtn = document.getElementById('modal-btn-add-friend');

    const handleAddFriend = async () => {
      const name = friendInput.value.trim().toLowerCase();
      if (!name) return;
      const settings = await window.KickExt.settings.getAllSettings();
      const current = settings.friendUsernames || [];
      if (!current.includes(name)) {
        const updated = [...current, name];
        await window.KickExt.settings.saveSetting('friendUsernames', updated);
        renderFriendsList(updated);
      }
      friendInput.value = '';
    };

    addFriendBtn.addEventListener('click', handleAddFriend);
    friendInput.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') handleAddFriend();
    });

    // Reset Layout button
    document.getElementById('modal-btn-reset-layout').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('KickExt:resetPosition'));
    });
  };

  /**
   * Helper to bind a checkbox control to setting updates.
   */
  const bindSettingControl = (elementId, settingKey, type) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.addEventListener('change', () => {
      const val = type === 'checkbox' ? el.checked : el.value;
      updateSetting(settingKey, val);
    });
  };

  /**
   * Saves setting and notifies background/content listeners.
   */
  const updateSetting = async (key, value) => {
    await window.KickExt.settings.saveSetting(key, value);
    window.postMessage({ type: 'KICK_EXT_UPDATE_SETTING', key, value }, window.location.origin);
  };

  /**
   * Switches active sidebar tab.
   */
  const switchTab = (tabName) => {
    activeTab = tabName;
    modalElement.querySelectorAll('.kick-ext-sidebar-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
    });
    modalElement.querySelectorAll('.kick-ext-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabName}`);
    });
  };

  /**
   * Renders friend username badge pills.
   */
  const renderFriendsList = (friendsArray = []) => {
    const listEl = document.getElementById('modal-friends-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (friendsArray.length === 0) {
      listEl.innerHTML = '<span style="font-size:12px; color:#94969b;">No friends added yet. Type a username above to highlight them in chat.</span>';
      return;
    }

    friendsArray.forEach(username => {
      const pill = document.createElement('div');
      pill.className = 'kick-ext-friend-pill';
      
      const spanName = document.createElement('span');
      spanName.textContent = username;
      
      const spanDelete = document.createElement('span');
      spanDelete.className = 'kick-ext-friend-pill-delete';
      spanDelete.title = 'Remove friend';
      spanDelete.innerHTML = ICONS.close;
      
      pill.appendChild(spanName);
      pill.appendChild(spanDelete);
      pill.querySelector('.kick-ext-friend-pill-delete').addEventListener('click', async () => {
        const settings = await window.KickExt.settings.getAllSettings();
        const updated = (settings.friendUsernames || []).filter(u => u !== username);
        await window.KickExt.settings.saveSetting('friendUsernames', updated);
        renderFriendsList(updated);
      });
      listEl.appendChild(pill);
    });
  };

  /**
   * Populates modal input states from saved settings.
   */
  const syncSettingsToUI = async () => {
    const s = await window.KickExt.settings.getAllSettings();

    document.getElementById('modal-toggle-enable-fs-chat').checked = s.enableFullscreenChat !== false;
    document.getElementById('modal-toggle-extra-small-font').checked = !!s.extraSmallFullscreenFont;
    document.getElementById('modal-toggle-mention-sound').checked = !!s.enableMentionSound;
    document.getElementById('modal-toggle-leaderboard').checked = s.hideLeaderboard !== false;
    document.getElementById('modal-toggle-fs-header').checked = !!s.hideFullscreenChatHeader;
    document.getElementById('modal-toggle-mod-bar').checked = !!s.hideModerationBar;
    document.getElementById('modal-toggle-user-info').checked = !!s.hideUserInfo;

    const op = s.opacity ?? 100;
    document.getElementById('modal-opacity-slider').value = op;
    document.getElementById('modal-opacity-val').textContent = `${op}%`;

    const blur = s.blurLevel ?? '6';
    document.querySelectorAll('#pane-overlay .kick-ext-btn-group-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-blur') === blur);
    });

    const side = s.chatSide ?? 'right';
    document.getElementById('modal-side-left').classList.toggle('active', side === 'left');
    document.getElementById('modal-side-right').classList.toggle('active', side === 'right');

    renderFriendsList(s.friendUsernames || []);
  };

  const showModal = async () => {
    createModalDOM();
    await syncSettingsToUI();
    const overlayParent = getModalOverlayParent();
    if (modalBackdrop.parentNode !== overlayParent) overlayParent.appendChild(modalBackdrop);
    if (modalElement.parentNode !== overlayParent) overlayParent.appendChild(modalElement);
    modalBackdrop.classList.add('active');
    modalElement.classList.add('active');
  };

  const hideModal = () => {
    if (modalBackdrop) modalBackdrop.classList.remove('active');
    if (modalElement) modalElement.classList.remove('active');
  };

  const toggleModal = () => {
    if (modalElement && modalElement.classList.contains('active')) {
      hideModal();
    } else {
      showModal();
    }
  };

  window.KickExt.inPageSettingsModal = {
    show: showModal,
    hide: hideModal,
    toggle: toggleModal
  };

})();
