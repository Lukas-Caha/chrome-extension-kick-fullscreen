/**
 * Coop Stream Window
 * Alt+N opens a small prompt to type a streamer's username, then shows
 * their live stream in a small floating, draggable, resizable window using
 * Kick's official embed player (player.kick.com). Works in both normal and
 * fullscreen mode. Closing it (×) fully destroys the iframe and DOM node —
 * nothing keeps running or decoding once it's closed.
 */

const CW_PROMPT_ID = 'kick-ext-coop-prompt';
const CW_WINDOW_ID = 'kick-ext-coop-window';
const CW_STORAGE_KEY = 'coopStreamLastUsername';

let cwPrompt = null;
let cwWindow = null;
let cwResizeObserver = null;

// ---------------------------------------------------------------------
// Overlay parent helper (same top-layer reasoning as quickClipboard.js —
// fullscreen only renders elements that live inside the fullscreenElement)
// ---------------------------------------------------------------------

const cwGetOverlayParent = () => {
    return document.fullscreenElement || document.webkitFullscreenElement || document.body;
};

// ---------------------------------------------------------------------
// Prompt (Alt+N entrypoint)
// ---------------------------------------------------------------------

const cwClosePrompt = () => {
    if (!cwPrompt) return;
    cwPrompt.remove();
    cwPrompt = null;
};

const cwOpenPrompt = async () => {
    if (cwPrompt) {
        cwPrompt.querySelector('input').focus();
        return;
    }

    const lastName = (await window.KickExt.settings.getSetting(CW_STORAGE_KEY)) || '';

    cwPrompt = document.createElement('div');
    cwPrompt.id = CW_PROMPT_ID;
    cwPrompt.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(14, 14, 16, var(--kick-ext-bg-alpha));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        z-index: 2147483647;
        backdrop-filter: blur(var(--kick-ext-blur));
        -webkit-backdrop-filter: blur(var(--kick-ext-blur));
        padding: 12px;
        display: flex;
        gap: 8px;
        align-items: center;
        color: #fff;
        font-family: inherit;
    `;

    cwPrompt.innerHTML = `
        <span style="font-size:13px;font-weight:600;white-space:nowrap;">🎮 Coop stream:</span>
        <input id="kick-ext-coop-input" placeholder="streamer username" value="${lastName}"
            style="background:rgba(26, 27, 30, var(--kick-ext-panel-alpha));border:1px solid rgba(255, 255, 255, 0.1);color:#fff;border-radius:6px;padding:6px 8px;font-size:12px;width:160px;">
        <button id="kick-ext-coop-go" style="background:var(--ke-accent, #4ADE80);color:#0f172a;border:none;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;">Open</button>
        <button id="kick-ext-coop-cancel" style="background:none;border:none;color:#a3a3a3;font-size:16px;cursor:pointer;">×</button>
    `;

    cwGetOverlayParent().appendChild(cwPrompt);

    const input = cwPrompt.querySelector('#kick-ext-coop-input');
    input.focus();
    input.select();

    const submit = async () => {
        const username = input.value.trim().toLowerCase();
        if (!username) return;
        await window.KickExt.settings.saveSetting(CW_STORAGE_KEY, username);
        cwClosePrompt();
        cwOpenStreamWindow(username);
    };

    cwPrompt.querySelector('#kick-ext-coop-go').addEventListener('click', submit);
    cwPrompt.querySelector('#kick-ext-coop-cancel').addEventListener('click', cwClosePrompt);
    input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') cwClosePrompt();
    });
    cwPrompt.addEventListener('click', (e) => e.stopPropagation());
};

// ---------------------------------------------------------------------
// Floating stream window
// ---------------------------------------------------------------------

const cwCloseStreamWindow = () => {
    if (!cwWindow) return;
    if (cwResizeObserver) {
        cwResizeObserver.unobserve(cwWindow);
    }
    const iframe = cwWindow.querySelector('iframe');
    if (iframe) {
        // Force the embed to unload immediately rather than relying on GC
        // timing — this is what actually stops playback/decoding.
        iframe.src = 'about:blank';
        iframe.remove();
    }
    cwWindow.remove();
    cwWindow = null;
    console.log('Kick Extension [coopWindow]: stream window terminated, no residual playback.');
};

const cwMakeDraggable = (win, handle) => {
    let startX, startY, startLeft, startTop, dragging = false;

    const onMouseMove = (e) => {
        if (!dragging) return;
        win.style.left = `${startLeft + (e.clientX - startX)}px`;
        win.style.top = `${startTop + (e.clientY - startY)}px`;
        win.style.right = 'auto';
    };

    const onMouseUp = () => {
        dragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', (e) => {
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = win.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    });
};

const cwOpenStreamWindow = (username) => {
    if (cwWindow) cwCloseStreamWindow();

    cwWindow = document.createElement('div');
    cwWindow.id = CW_WINDOW_ID;
    cwWindow.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        width: 420px;
        height: 268px;
        min-width: 240px;
        min-height: 160px;
        background: rgba(14, 14, 16, var(--kick-ext-bg-alpha));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        z-index: 2147483647;
        backdrop-filter: blur(var(--kick-ext-blur));
        -webkit-backdrop-filter: blur(var(--kick-ext-blur));
        display: flex;
        flex-direction: column;
        overflow: hidden;
        resize: both;
        contain: content;
    `;

    cwWindow.innerHTML = `
        <div id="kick-ext-coop-handle" style="display:flex;align-items:center;justify-content:space-between;height:30px;padding:0 10px;background:rgba(26, 27, 30, var(--kick-ext-panel-alpha));border-bottom:1px solid rgba(255, 255, 255, 0.1);cursor:move;flex-shrink:0;box-sizing:border-box;">
            <span style="font-size:12px;font-weight:600;color:#fff;">🎮 ${username}</span>
            <button id="kick-ext-coop-close" style="background:none;border:none;color:#a3a3a3;font-size:16px;cursor:pointer;line-height:1;">×</button>
        </div>
        <iframe
            src="https://player.kick.com/${encodeURIComponent(username)}?autoplay=true&muted=true"
            style="flex:1;width:100%;border:none;"
            allow="autoplay; fullscreen">
        </iframe>
    `;

    cwGetOverlayParent().appendChild(cwWindow);

    cwWindow.querySelector('#kick-ext-coop-close').addEventListener('click', cwCloseStreamWindow);
    cwMakeDraggable(cwWindow, cwWindow.querySelector('#kick-ext-coop-handle'));

    cwWindow.addEventListener('click', (e) => e.stopPropagation());

    if (!cwResizeObserver) {
        cwResizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const rect = entry.target.getBoundingClientRect();
                const width = rect.width;
                const videoWidth = Math.max(0, width - 2); // subtract 1px border on each side
                const videoHeight = videoWidth * (9 / 16);
                const targetHeight = Math.round(30 + videoHeight + 2); // 30px header + videoHeight + 2px borders
                
                if (Math.abs(rect.height - targetHeight) > 1.5) {
                    entry.target.style.height = `${targetHeight}px`;
                }
            }
        });
    }
    cwResizeObserver.observe(cwWindow);
};

// ---------------------------------------------------------------------
// Keep the window/prompt anchored to the fullscreen target if fullscreen
// toggles while open (same top-layer reasoning as quickClipboard.js).
// ---------------------------------------------------------------------

const cwReparentToFullscreen = () => {
    if (typeof chrome !== 'undefined' && !chrome.runtime?.id) {
        document.removeEventListener('fullscreenchange', cwReparentToFullscreen);
        document.removeEventListener('webkitfullscreenchange', cwReparentToFullscreen);
        return;
    }
    const parent = cwGetOverlayParent();
    if (cwWindow && cwWindow.parentNode !== parent && !cwWindow.contains(parent)) {
        parent.appendChild(cwWindow);
    }
    if (cwPrompt && cwPrompt.parentNode !== parent && !cwPrompt.contains(parent)) {
        parent.appendChild(cwPrompt);
    }
};
document.addEventListener('fullscreenchange', cwReparentToFullscreen);
document.addEventListener('webkitfullscreenchange', cwReparentToFullscreen);

// ---------------------------------------------------------------------
// Global shortcut: Alt+N opens the streamer-name prompt.
// ---------------------------------------------------------------------

document.addEventListener('keydown', function keyHandler(e) {
    if (typeof chrome !== 'undefined' && !chrome.runtime?.id) {
        document.removeEventListener('keydown', keyHandler, { capture: true });
        return;
    }
    if (e.repeat) return;
    if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        cwOpenPrompt();
    }
}, { capture: true });
