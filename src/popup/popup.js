// Popup Script for Kick Extension
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load current settings from storage
    const settings = await chrome.storage.local.get({
        opacity: 100,
        chatSide: 'right',
        hideLeaderboard: true,
        hideFullscreenChatHeader: false,
        hideModerationBar: false,
        hideUserInfo: false,
        enableFullscreenChat: true,
        enableMentionSound: false
    });

    // 2. Initialize UI elements
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const toggleLeaderboard = document.getElementById('toggle-leaderboard');
    const toggleFsHeader = document.getElementById('toggle-fs-header');
    const toggleModBar = document.getElementById('toggle-mod-bar');
    const toggleUserInfo = document.getElementById('toggle-user-info');
    const toggleEnableFsChat = document.getElementById('toggle-enable-fs-chat');
    const toggleMentionSound = document.getElementById('toggle-mention-sound');
    const btnReset = document.getElementById('btn-reset');

    // Set initial values
    opacitySlider.value = settings.opacity;
    opacityValue.textContent = `${settings.opacity}%`;

    if (settings.chatSide === 'left') {
        btnLeft.classList.add('active');
        btnRight.classList.remove('active');
    } else {
        btnRight.classList.add('active');
        btnLeft.classList.remove('active');
    }

    toggleLeaderboard.checked = settings.hideLeaderboard;
    toggleFsHeader.checked = settings.hideFullscreenChatHeader;
    toggleModBar.checked = settings.hideModerationBar;
    toggleUserInfo.checked = settings.hideUserInfo;
    toggleEnableFsChat.checked = settings.enableFullscreenChat;
    if (toggleMentionSound) toggleMentionSound.checked = settings.enableMentionSound;

    // 3. Event Listeners
    opacitySlider.addEventListener('input', (e) => {
        const val = e.target.value;
        opacityValue.textContent = `${val}%`;
        updateSetting('opacity', parseInt(val));
    });

    btnLeft.addEventListener('click', () => {
        btnLeft.classList.add('active');
        btnRight.classList.remove('active');
        updateSetting('chatSide', 'left');
    });

    btnRight.addEventListener('click', () => {
        btnRight.classList.add('active');
        btnLeft.classList.remove('active');
        updateSetting('chatSide', 'right');
    });

    toggleLeaderboard.addEventListener('change', (e) => {
        updateSetting('hideLeaderboard', e.target.checked);
    });

    toggleFsHeader.addEventListener('change', (e) => {
        updateSetting('hideFullscreenChatHeader', e.target.checked);
    });

    toggleModBar.addEventListener('change', (e) => {
        updateSetting('hideModerationBar', e.target.checked);
    });

    toggleUserInfo.addEventListener('change', (e) => {
        updateSetting('hideUserInfo', e.target.checked);
    });

    toggleEnableFsChat.addEventListener('change', (e) => {
        updateSetting('enableFullscreenChat', e.target.checked);
    });

    if (toggleMentionSound) {
        toggleMentionSound.addEventListener('change', (e) => {
            updateSetting('enableMentionSound', e.target.checked);
        });
    }

    btnReset.addEventListener('click', () => {
        if (confirm('Reset chat position and layout?')) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs && tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'resetPosition' }, () => {
                        // Suppress connection errors when content script is not loaded
                        const err = chrome.runtime.lastError;
                    });
                }
            });
            window.close();
        }
    });

    // Helper to save and notify
    function updateSetting(key, value) {
        chrome.storage.local.set({ [key]: value }, () => {
            // Notify content script
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs && tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: 'updateSetting', 
                        key: key, 
                        value: value 
                    }, () => {
                        // Suppress connection errors when content script is not loaded
                        const err = chrome.runtime.lastError;
                    });
                }
            });
        });
    }
});
