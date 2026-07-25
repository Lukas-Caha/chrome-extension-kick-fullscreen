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
        extraSmallFullscreenFont: false,
        enableMentionSound: false,
        blurLevel: '6',
        theme: 'silver',
        friendUsernames: []
    });

    // 2. Initialize UI elements
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnBlurOff = document.getElementById('btn-blur-off');
    const btnBlurLight = document.getElementById('btn-blur-light');
    const btnBlurFull = document.getElementById('btn-blur-full');
    const toggleExtraSmallFont = document.getElementById('toggle-extra-small-font');
    const btnThemeGreen = document.getElementById('btn-theme-green');
    const btnThemeSilver = document.getElementById('btn-theme-silver');
    const btnThemeBurgundy = document.getElementById('btn-theme-burgundy');
    const btnThemeRainbow = document.getElementById('btn-theme-rainbow');
    const toggleLeaderboard = document.getElementById('toggle-leaderboard');
    const toggleFsHeader = document.getElementById('toggle-fs-header');
    const toggleModBar = document.getElementById('toggle-mod-bar');
    const toggleUserInfo = document.getElementById('toggle-user-info');
    const toggleEnableFsChat = document.getElementById('toggle-enable-fs-chat');
    const toggleMentionSound = document.getElementById('toggle-mention-sound');
    const btnReset = document.getElementById('btn-reset');
    const friendInput = document.getElementById('friend-input');
    const btnAddFriend = document.getElementById('btn-add-friend');
    const btnRemoveFriend = document.getElementById('btn-remove-friend');
    const friendList = document.getElementById('friend-list');

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

    // Blur level initial state
    const currentBlur = settings.blurLevel ?? '6';
    if (btnBlurOff && btnBlurLight && btnBlurFull) {
        btnBlurOff.classList.toggle('active', currentBlur === '0');
        btnBlurLight.classList.toggle('active', currentBlur === '1');
        btnBlurFull.classList.toggle('active', currentBlur === '6');
    }

    if (toggleExtraSmallFont) {
        toggleExtraSmallFont.checked = !!settings.extraSmallFullscreenFont;
    }

    const activeThemeVal = settings.theme ?? 'silver';
    btnThemeGreen?.classList.toggle('active', activeThemeVal === 'green');
    btnThemeSilver?.classList.toggle('active', activeThemeVal === 'silver');
    btnThemeBurgundy?.classList.toggle('active', activeThemeVal === 'burgundy');
    btnThemeRainbow?.classList.toggle('active', activeThemeVal === 'rainbow');
    document.body.classList.remove('theme-silver', 'theme-burgundy', 'theme-rainbow');
    if (activeThemeVal === 'silver') document.body.classList.add('theme-silver');
    if (activeThemeVal === 'burgundy') document.body.classList.add('theme-burgundy');
    if (activeThemeVal === 'rainbow') document.body.classList.add('theme-rainbow');

    toggleLeaderboard.checked = settings.hideLeaderboard;
    toggleFsHeader.checked = settings.hideFullscreenChatHeader;
    toggleModBar.checked = settings.hideModerationBar;
    toggleUserInfo.checked = settings.hideUserInfo;
    toggleEnableFsChat.checked = settings.enableFullscreenChat;
    if (toggleMentionSound) toggleMentionSound.checked = settings.enableMentionSound;

    // Friends list renderer
    let currentFriends = Array.isArray(settings.friendUsernames) ? settings.friendUsernames : [];
    const refreshFriendListUI = () => {
        if (friendList) {
            friendList.textContent = currentFriends.length > 0
                ? `Friends: ${currentFriends.join(', ')}`
                : 'No friends added.';
        }
    };
    refreshFriendListUI();

    // 3. Event Listeners
    opacitySlider.addEventListener('input', (e) => {
        const val = e.target.value;
        opacityValue.textContent = `${val}%`;
        updateSetting('opacity', parseInt(val, 10));
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

    const setBlurActive = (level) => {
        if (btnBlurOff && btnBlurLight && btnBlurFull) {
            btnBlurOff.classList.toggle('active', level === '0');
            btnBlurLight.classList.toggle('active', level === '1');
            btnBlurFull.classList.toggle('active', level === '6');
        }
        updateSetting('blurLevel', level);
    };
    btnBlurOff?.addEventListener('click', () => setBlurActive('0'));
    btnBlurLight?.addEventListener('click', () => setBlurActive('1'));
    btnBlurFull?.addEventListener('click', () => setBlurActive('6'));

    toggleExtraSmallFont?.addEventListener('change', (e) => {
        updateSetting('extraSmallFullscreenFont', e.target.checked);
    });

    btnThemeGreen?.addEventListener('click', () => {
        btnThemeGreen.classList.add('active');
        btnThemeSilver?.classList.remove('active');
        btnThemeBurgundy?.classList.remove('active');
        btnThemeRainbow?.classList.remove('active');
        document.body.classList.remove('theme-silver', 'theme-burgundy', 'theme-rainbow');
        updateSetting('theme', 'green');
    });

    btnThemeSilver?.addEventListener('click', () => {
        btnThemeSilver.classList.add('active');
        btnThemeGreen?.classList.remove('active');
        btnThemeBurgundy?.classList.remove('active');
        btnThemeRainbow?.classList.remove('active');
        document.body.classList.remove('theme-burgundy', 'theme-rainbow');
        document.body.classList.add('theme-silver');
        updateSetting('theme', 'silver');
    });

    btnThemeBurgundy?.addEventListener('click', () => {
        btnThemeBurgundy.classList.add('active');
        btnThemeGreen?.classList.remove('active');
        btnThemeSilver?.classList.remove('active');
        btnThemeRainbow?.classList.remove('active');
        document.body.classList.remove('theme-silver', 'theme-rainbow');
        document.body.classList.add('theme-burgundy');
        updateSetting('theme', 'burgundy');
    });

    btnThemeRainbow?.addEventListener('click', () => {
        btnThemeRainbow.classList.add('active');
        btnThemeGreen?.classList.remove('active');
        btnThemeSilver?.classList.remove('active');
        btnThemeBurgundy?.classList.remove('active');
        document.body.classList.remove('theme-silver', 'theme-burgundy');
        document.body.classList.add('theme-rainbow');
        updateSetting('theme', 'rainbow');
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

    // Friend list actions
    btnAddFriend?.addEventListener('click', () => {
        const name = friendInput?.value?.trim().toLowerCase();
        if (name && !currentFriends.includes(name)) {
            currentFriends.push(name);
            chrome.storage.local.set({ friendUsernames: currentFriends }, () => {
                if (friendInput) friendInput.value = '';
                refreshFriendListUI();
            });
        }
    });

    btnRemoveFriend?.addEventListener('click', () => {
        const name = friendInput?.value?.trim().toLowerCase();
        if (name && currentFriends.includes(name)) {
            currentFriends = currentFriends.filter(f => f !== name);
            chrome.storage.local.set({ friendUsernames: currentFriends }, () => {
                if (friendInput) friendInput.value = '';
                refreshFriendListUI();
            });
        }
    });

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
