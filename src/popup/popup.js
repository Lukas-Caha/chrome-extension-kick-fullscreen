// Popup Script for Kick Extension
const isKickUrl = (url) => {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'kick.com' || hostname.endsWith('.kick.com');
  } catch {
    return false;
  }
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load current settings from storage
    const settings = await chrome.storage.local.get({
        opacity: 100,
        enableFullscreenChat: true
    });

    // 2. Initialize UI elements
    const btnOpenInpageModal = document.getElementById('btn-open-inpage-modal');
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    const toggleEnableFsChat = document.getElementById('toggle-enable-fs-chat');
    const btnReset = document.getElementById('btn-reset');

    // Set initial values
    if (opacitySlider && opacityValue) {
        opacitySlider.value = settings.opacity;
        opacityValue.textContent = `${settings.opacity}%`;
    }

    if (toggleEnableFsChat) {
        toggleEnableFsChat.checked = settings.enableFullscreenChat !== false;
    }

    // Helper to send setting updates to content script
    const updateSetting = async (key, value) => {
        await chrome.storage.local.set({ [key]: value });
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && isKickUrl(tab.url)) {
            chrome.tabs.sendMessage(tab.id, { action: 'updateSetting', key, value }).catch(() => {});
        }
    };

    // Open In-Page Modal button
    if (btnOpenInpageModal) {
        btnOpenInpageModal.addEventListener('click', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && isKickUrl(tab.url)) {
                chrome.tabs.sendMessage(tab.id, { action: 'openInPageSettingsModal' }).catch(() => {});
                window.close();
            } else {
                alert('Please open Kick.com to view in-page settings.');
            }
        });
    }

    // Toggle FS Chat
    if (toggleEnableFsChat) {
        toggleEnableFsChat.addEventListener('change', () => {
            updateSetting('enableFullscreenChat', toggleEnableFsChat.checked);
        });
    }

    // Opacity slider
    if (opacitySlider) {
        opacitySlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (opacityValue) opacityValue.textContent = `${val}%`;
            updateSetting('opacity', val);
        });
    }

    // Reset position button
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && isKickUrl(tab.url)) {
                chrome.tabs.sendMessage(tab.id, { action: 'resetPosition' }).catch(() => {});
            }
        });
    }
});
