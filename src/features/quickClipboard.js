/**
 * Quick Clipboard Feature
 * Alt+V toggles a floating panel with saved messages/commands.
 * Clicking a saved item inserts it into the chat input and, if the snippet
 * is marked as auto-send, immediately sends it. Works identically in both
 * normal and fullscreen chat mode, since the panel is a standalone
 * fixed-position element re-parented into whichever container is the
 * current browser fullscreen target.
 */

const QC_PANEL_ID = 'kick-ext-quick-clipboard';
const QC_STORAGE_KEY = 'quickClipboardSnippets';

let qcPanel = null;
let qcOpeningTimestamp = 0;
let qcSnippets = [];

// ---------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------

const qcLoadSnippets = async () => {
    qcSnippets = (await window.KickExt.settings.getSetting(QC_STORAGE_KEY)) || [];
};

const qcSaveSnippets = async () => {
    await window.KickExt.settings.saveSetting(QC_STORAGE_KEY, qcSnippets);
};

const qcGenId = () => `qc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------
// Chat input helpers
// (Intentionally duplicated from fullscreen.js's private getChatInput
// rather than shared, so this feature has no load-order dependency on
// fullscreen.js. Same selector, same logic.)
// ---------------------------------------------------------------------

const qcGetChatInput = () => {
    return document.querySelector('#channel-chatroom textarea') ||
        document.querySelector('#channel-chatroom [contenteditable="true"]');
};

const qcInsertAndSend = (text, autoSend) => {
    const input = qcGetChatInput();
    if (!input) {
        console.warn('Kick Extension [quickClipboard]: chat input not found');
        return;
    }

    input.focus();

    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
        // Native value setter bypasses React's controlled-input value tracking,
        // so we dispatch a manual 'input' event afterwards to notify React.
        const proto = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        nativeSetter.call(input, text);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (input.isContentEditable) {
        // Select all existing content first so the snippet replaces it
        // instead of being appended after whatever was already typed.
        const range = document.createRange();
        range.selectNodeContents(input);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        // execCommand fires native 'beforeinput'/'input' events that Kick's
        // rich-text editor listens for, unlike directly touching textContent.
        document.execCommand('insertText', false, text);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (!autoSend) return;

    setTimeout(() => {
        input.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true,
        }));
    }, 0);
};

// ---------------------------------------------------------------------
// Placeholder resolution
// Snippets can contain {name} placeholders, e.g. "!timeout @{user} 600".
// Before inserting, each unique placeholder is prompted for a value.
// ---------------------------------------------------------------------

// Extracts unique placeholder names from text. Returns [] if none found.
const qcExtractPlaceholders = (text) => {
    const regex = /\{([^}]+)\}/g;
    const seen = new Set();
    const placeholders = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (!seen.has(match[1])) {
            seen.add(match[1]);
            placeholders.push(match[1]);
        }
    }
    return placeholders;
};

// Builds an inline form inside the panel's list area for filling placeholders.
const qcShowPlaceholderForm = (snippet) => {
    if (!qcPanel) return;
    const list = qcPanel.querySelector('#kick-ext-qc-list');
    const placeholders = qcExtractPlaceholders(snippet.text);

    // Save current list content so Cancel can restore it
    const savedHTML = list.innerHTML;
    list.innerHTML = '';

    const form = document.createElement('div');
    form.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:8px;';

    // Preview of the command template
    const preview = document.createElement('div');
    preview.style.cssText = 'font-size:11px;color:#a3a3a3;padding:4px 0;word-break:break-all;';
    preview.textContent = snippet.text;
    form.appendChild(preview);

    // Create an input for each placeholder
    const inputs = [];
    for (const name of placeholders) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

        const lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:11px;color:#a3a3a3;';
        lbl.textContent = `{${name}}`;

        const input = document.createElement('input');
        input.placeholder = name;
        input.dataset.name = name;
        input.style.cssText = 'background:rgba(14, 14, 16, var(--kick-ext-bg-alpha, 0.95));border:1px solid #2a2d32;color:#fff;border-radius:6px;padding:6px 8px;font-size:12px;';

        wrapper.appendChild(lbl);
        wrapper.appendChild(input);
        form.appendChild(wrapper);
        inputs.push(input);
    }

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;';

    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Send';
    sendBtn.style.cssText = 'flex:1;background:var(--ke-accent, #4ADE80);color:#0f172a;border:none;border-radius:6px;padding:7px;font-size:12px;font-weight:600;cursor:pointer;';
    sendBtn.addEventListener('click', () => {
        let result = snippet.text;
        for (const input of inputs) {
            const val = input.value;
            if (!val && !val.trim()) { input.focus(); return; }
            result = result.replaceAll(`{${input.dataset.name}}`, val);
        }
        // Restore list and send
        qcRenderList();
        qcInsertAndSend(result, !!snippet.autoSend);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'flex:1;background:#2a2d32;color:#fff;border:none;border-radius:6px;padding:7px;font-size:12px;cursor:pointer;';
    cancelBtn.addEventListener('click', () => {
        qcRenderList(); // restore the list
    });

    btnRow.appendChild(sendBtn);
    btnRow.appendChild(cancelBtn);
    form.appendChild(btnRow);

    // Handle Enter key to submit
    form.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            sendBtn.click();
        }
    });
    form.addEventListener('click', (e) => e.stopPropagation());

    list.appendChild(form);
    if (inputs.length > 0) inputs[0].focus();
};

// ---------------------------------------------------------------------
// Panel building
// ---------------------------------------------------------------------

const qcPositionAboveChat = (panel) => {
    // Use the chat-input-wrapper (the visible bordered box) as the reference
    // for width and horizontal alignment, so the panel matches the field exactly.
    const wrapper = document.querySelector('#chat-input-wrapper');
    if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        panel.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
        panel.style.left = rect.left + 'px';
        panel.style.right = 'auto';
        panel.style.width = rect.width + 'px';
    } else {
        // Fallback: bottom-right corner above where chat usually is
        panel.style.bottom = '120px';
        panel.style.right = '20px';
    }
};

// ---------------------------------------------------------------------
// Drag logic
// ---------------------------------------------------------------------

const qcMakeDraggable = (panel, handle) => {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        panel.style.left = (startLeft + dx) + 'px';
        panel.style.top = (startTop + dy) + 'px';
    };

    const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', (e) => {
        // Don't drag when clicking the close button
        if (e.target.id === 'kick-ext-qc-close') return;
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        // Switch from bottom/right anchoring to top/left for free dragging
        panel.style.top = rect.top + 'px';
        panel.style.left = rect.left + 'px';
        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        e.preventDefault();

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
};

// ---------------------------------------------------------------------
// Panel building
// ---------------------------------------------------------------------

const qcBuildPanel = () => {
    const panel = document.createElement('div');
    panel.id = QC_PANEL_ID;
    panel.style.cssText = `
        position: fixed;
        width: 300px;
        max-height: 70vh;
        background: rgba(14, 14, 16, var(--kick-ext-bg-alpha, 0.95));
        border: 1px solid #2a2d32;
        border-radius: 10px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        font-family: inherit;
        color: #fff;
        overflow: hidden;
        backdrop-filter: blur(var(--kick-ext-blur, 0px));
        -webkit-backdrop-filter: blur(var(--kick-ext-blur, 0px));
    `;

    panel.innerHTML = `
        <div id="kick-ext-qc-header" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #2a2d32;cursor:grab;user-select:none;background:rgba(20, 20, 22, 0.75);">
            <span style="font-size:13px;font-weight:600;">Quick Clipboard</span>
            <button id="kick-ext-qc-close" style="background:none;border:none;color:#a3a3a3;font-size:16px;cursor:pointer;line-height:1;padding:2px 6px;">×</button>
        </div>
        <div id="kick-ext-qc-list" style="flex:1;overflow-y:auto;padding:6px;background:rgba(10, 10, 10, var(--kick-ext-panel-alpha, 1));"></div>
        <div style="border-top:1px solid #2a2d32;padding:8px;background:rgba(20, 20, 22, 0.75);">
            <button id="kick-ext-qc-add-toggle" style="width:100%;background:var(--ke-accent, #4ADE80);color:#0f172a;border:none;border-radius:6px;padding:7px;font-size:12px;font-weight:600;cursor:pointer;">+ Add snippet</button>
            <div id="kick-ext-qc-form" style="display:none;margin-top:8px;flex-direction:column;gap:6px;">
                <input id="kick-ext-qc-label" placeholder="Name (e.g. Spam warning)" style="background:rgba(14, 14, 16, var(--kick-ext-bg-alpha, 0.95));border:1px solid #2a2d32;color:#fff;border-radius:6px;padding:6px 8px;font-size:12px;">
                <textarea id="kick-ext-qc-text" placeholder="Message / command text..." rows="2" style="background:rgba(14, 14, 16, var(--kick-ext-bg-alpha, 0.95));border:1px solid #2a2d32;color:#fff;border-radius:6px;padding:6px 8px;font-size:12px;resize:vertical;"></textarea>
                <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#a3a3a3;">
                    <input type="checkbox" id="kick-ext-qc-autosend" checked style="accent-color:var(--ke-accent, #4ADE80);">
                    Auto-send on click
                </label>
                <button id="kick-ext-qc-save" style="background:#2a2d32;color:#fff;border:none;border-radius:6px;padding:6px;font-size:12px;cursor:pointer;">Save</button>
            </div>
        </div>
    `;

    return panel;
};

const qcRenderList = () => {
    if (!qcPanel) return;
    const list = qcPanel.querySelector('#kick-ext-qc-list');
    list.innerHTML = '';

    if (qcSnippets.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:16px 8px;text-align:center;color:#666;font-size:12px;';
        empty.textContent = 'No saved snippets yet.';
        list.appendChild(empty);
        return;
    }

    for (const snippet of qcSnippets) {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:6px;padding:8px;border-radius:6px;cursor:pointer;';
        item.addEventListener('mouseenter', () => { item.style.background = 'rgba(26, 27, 30, var(--kick-ext-panel-alpha, 1))'; });
        item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });

        const textWrap = document.createElement('div');
        textWrap.style.cssText = 'min-width:0;flex:1;';

        const label = document.createElement('div');
        label.style.cssText = 'font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        label.textContent = (snippet.autoSend ? '▶ ' : '📋 ') + snippet.label;

        const preview = document.createElement('div');
        preview.style.cssText = 'font-size:11px;color:#a3a3a3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        preview.textContent = snippet.text;

        textWrap.appendChild(label);
        textWrap.appendChild(preview);

        // --- Action buttons wrapper ---
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;align-items:center;flex-shrink:0;';

        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.title = 'Edit';
        editBtn.style.cssText = 'background:none;border:none;color:#666;font-size:14px;cursor:pointer;padding:4px 6px;';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            qcShowEditForm(list, item, snippet);
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑';
        delBtn.title = 'Delete';
        delBtn.style.cssText = 'background:none;border:none;color:#666;font-size:16px;cursor:pointer;padding:4px 6px;';
        delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            qcSnippets = qcSnippets.filter((s) => s.id !== snippet.id);
            await qcSaveSnippets();
            qcRenderList();
        });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        item.addEventListener('click', () => {
            const placeholders = qcExtractPlaceholders(snippet.text);
            if (placeholders.length > 0) {
                qcShowPlaceholderForm(snippet);
            } else {
                qcInsertAndSend(snippet.text, !!snippet.autoSend);
            }
        });

        item.appendChild(textWrap);
        item.appendChild(actions);
        list.appendChild(item);
    }
};

// Replaces a snippet row with an inline edit form
const qcShowEditForm = (list, itemEl, snippet) => {
    const form = document.createElement('div');
    form.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:6px;background:rgba(26, 27, 30, var(--kick-ext-panel-alpha, 1));';

    const nameInput = document.createElement('input');
    nameInput.value = snippet.label;
    nameInput.placeholder = 'Name';
    nameInput.style.cssText = 'background:rgba(14, 14, 16, var(--kick-ext-bg-alpha, 0.95));border:1px solid #2a2d32;color:#fff;border-radius:6px;padding:6px 8px;font-size:12px;';

    const textInput = document.createElement('textarea');
    textInput.value = snippet.text;
    textInput.placeholder = 'Message / command text...';
    textInput.rows = 2;
    textInput.style.cssText = 'background:rgba(14, 14, 16, var(--kick-ext-bg-alpha, 0.95));border:1px solid #2a2d32;color:#fff;border-radius:6px;padding:6px 8px;font-size:12px;resize:vertical;';

    const autoSendLabel = document.createElement('label');
    autoSendLabel.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:11px;color:#a3a3a3;';
    const autoSendCheck = document.createElement('input');
    autoSendCheck.type = 'checkbox';
    autoSendCheck.checked = !!snippet.autoSend;
    autoSendCheck.style.cssText = 'accent-color:var(--ke-accent, #4ADE80);';
    autoSendLabel.appendChild(autoSendCheck);
    autoSendLabel.appendChild(document.createTextNode('Auto-send on click'));

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:6px;';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = 'flex:1;background:var(--ke-accent, #4ADE80);color:#0f172a;border:none;border-radius:6px;padding:6px;font-size:12px;font-weight:600;cursor:pointer;';
    saveBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const newLabel = nameInput.value.trim();
        const newText = textInput.value.trim();
        if (!newLabel || !newText) return;
        snippet.label = newLabel;
        snippet.text = newText;
        snippet.autoSend = autoSendCheck.checked;
        await qcSaveSnippets();
        qcRenderList();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'flex:1;background:#2a2d32;color:#fff;border:none;border-radius:6px;padding:6px;font-size:12px;cursor:pointer;';
    cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        qcRenderList(); // just re-render to cancel
    });

    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);

    form.appendChild(nameInput);
    form.appendChild(textInput);
    form.appendChild(autoSendLabel);
    form.appendChild(btnRow);

    // Stop events from leaking
    form.addEventListener('click', (e) => e.stopPropagation());
    form.addEventListener('keydown', (e) => e.stopPropagation());

    // Replace the item row with the edit form
    list.replaceChild(form, itemEl);
    nameInput.focus();
};

// ---------------------------------------------------------------------
// Open / close / positioning
// ---------------------------------------------------------------------

// Browser Fullscreen API only renders elements that live INSIDE the current
// fullscreenElement (top-layer restriction) — same reason 7TV's root has to
// be teleported in fullscreen.js. So the panel must be parented there too.
const qcGetOverlayParent = () => {
    return document.fullscreenElement || document.webkitFullscreenElement || document.body;
};

const qcClosePanel = () => {
    if (!qcPanel) return;
    qcPanel.remove();
    qcPanel = null;
};

const qcOpenPanel = () => {
    qcOpeningTimestamp = Date.now();
    // Close Kick settings panel if open to prevent overlap
    const settingsPanel = document.querySelector('#chat-settings-panel');
    if (settingsPanel) {
        const closeBtn = settingsPanel.querySelector('button');
        if (closeBtn) closeBtn.click();
    }

    if (qcPanel) {
        const parent = qcGetOverlayParent();
        if (qcPanel.parentNode !== parent) parent.appendChild(qcPanel);
        return;
    }

    qcPanel = qcBuildPanel();
    qcGetOverlayParent().appendChild(qcPanel);
    qcPositionAboveChat(qcPanel);
    qcRenderList();

    // Make the header draggable
    const header = qcPanel.querySelector('#kick-ext-qc-header');
    qcMakeDraggable(qcPanel, header);

    qcPanel.querySelector('#kick-ext-qc-close').addEventListener('click', qcClosePanel);

    const toggleBtn = qcPanel.querySelector('#kick-ext-qc-add-toggle');
    const form = qcPanel.querySelector('#kick-ext-qc-form');
    toggleBtn.addEventListener('click', () => {
        const isOpen = form.style.display === 'flex';
        form.style.display = isOpen ? 'none' : 'flex';
        toggleBtn.textContent = isOpen ? '+ Add snippet' : '– Close form';
    });

    qcPanel.querySelector('#kick-ext-qc-save').addEventListener('click', async () => {
        const labelInput = qcPanel.querySelector('#kick-ext-qc-label');
        const textInput = qcPanel.querySelector('#kick-ext-qc-text');
        const autoSendInput = qcPanel.querySelector('#kick-ext-qc-autosend');

        const label = labelInput.value.trim();
        const text = textInput.value.trim();
        if (!label || !text) return;

        qcSnippets.push({ id: qcGenId(), label, text, autoSend: autoSendInput.checked });
        await qcSaveSnippets();

        labelInput.value = '';
        textInput.value = '';
        autoSendInput.checked = true;
        form.style.display = 'none';
        toggleBtn.textContent = '+ Add snippet';

        qcRenderList();
    });

    // Stop clicks/keys inside the panel (e.g. typing in the add-snippet form)
    // from leaking into Kick's own global listeners underneath.
    qcPanel.addEventListener('click', (e) => e.stopPropagation());
    qcPanel.addEventListener('keydown', (e) => e.stopPropagation());
};

const qcTogglePanel = () => {
    if (qcPanel) {
        qcClosePanel();
    } else {
        qcOpenPanel();
    }
};

// When fullscreen changes: if entering, re-parent the panel into the
// fullscreen element so it stays visible. If leaving, close the panel
// (the browser swallows the Escape keydown when exiting fullscreen,
// so our keydown handler never fires — this is the safety net).
const qcHandleFullscreenChange = () => {
    if (!qcPanel) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl) {
        fsEl.appendChild(qcPanel);
        qcPositionAboveChat(qcPanel);
    } else {
        qcClosePanel();
    }
};
document.addEventListener('fullscreenchange', qcHandleFullscreenChange);
document.addEventListener('webkitfullscreenchange', qcHandleFullscreenChange);

// ---------------------------------------------------------------------
// Global shortcut: Alt+V toggles the panel, Escape closes it.
// ---------------------------------------------------------------------

document.addEventListener('keydown', function keyHandler(e) {
    if (typeof chrome !== 'undefined' && !chrome.runtime?.id) {
        document.removeEventListener('keydown', keyHandler, { capture: true });
        document.removeEventListener('fullscreenchange', qcHandleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', qcHandleFullscreenChange);
        return;
    }
    if (e.repeat) return;

    if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        qcTogglePanel();
        return;
    }

    if (e.key === 'Escape' && qcPanel) {
        qcClosePanel();
    }
}, { capture: true });

document.addEventListener('click', (e) => {
    if (!qcPanel) return;
    if (qcPanel.contains(e.target)) return;
    if (e.target.closest('#chat-settings-panel') || e.target.closest('button')) {
        qcClosePanel();
    }
}, { capture: true });

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------

const qcObserverCallback = (mutations) => {
    if (typeof chrome !== 'undefined' && !chrome.runtime?.id) {
        if (window.KickExt?.sharedBodyObserver) {
            window.KickExt.sharedBodyObserver.unsubscribe(qcObserverCallback);
        }
        return;
    }
    if (!qcPanel) return;
    if (Date.now() - qcOpeningTimestamp < 300) return;

    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.id === 'chat-settings-panel' || node.querySelector?.('#chat-settings-panel')) {
                qcClosePanel();
                return;
            }
        }
    }
};

const qcInit = async () => {
    await qcLoadSnippets();

    if (window.KickExt?.sharedBodyObserver) {
        window.KickExt.sharedBodyObserver.subscribe(qcObserverCallback);
    }

    console.log('Kick Extension: Quick Clipboard initialized,', qcSnippets.length, 'snippets loaded.');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', qcInit);
} else {
    qcInit();
}
