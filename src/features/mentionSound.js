/**
 * Mention Sound Feature
 * Plays a soft notification sound when the user is mentioned or replied to.
 */

const MS_STORAGE_KEY = 'enableMentionSound';
let msEnabled = false;
let msChatObserver = null;
let msObservedChatRoom = null;
let msInitializedTime = Date.now();

// Single shared AudioContext - created once, reused forever after the page has a user gesture.
let msAudioCtx = null;
let msAudioUnlocked = false;

const getAudioCtx = () => {
    if (!msAudioCtx) {
        msAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return msAudioCtx;
};

const unlockAudio = async () => {
    try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        msAudioUnlocked = ctx.state === 'running';
    } catch (e) {
        console.warn('Kick Extension: AudioContext unlock failed', e);
    }
};

const playSound = () => {
    if (!msEnabled) return;
    try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                msAudioUnlocked = ctx.state === 'running';
            }).catch(() => {});
            // If the browser still has audio locked, scheduling the oscillator now is wasted.
            if (!msAudioUnlocked) return;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    } catch(e) {
        console.warn('Kick Extension: AudioContext error', e);
    }
};

let lastSoundTime = 0;

// Persistent set of message identities that already triggered or were intentionally suppressed.
// Stored in memory so it survives fullscreen DOM teardown/rebuild and chat panel hide/show.
const msPlayedIds = new Set();
const MAX_PLAYED_IDS = 1500;

// Short-lived cooldown map: fallback fingerprint -> timestamp of last play.
// This protects against double-ding when Kick rebuilds a row but no real message ID is available.
const msRecentlyPlayed = new Map();
const MS_COOLDOWN_MS = 2000;

const wasRecentlyPlayed = (id) => {
    const t = msRecentlyPlayed.get(id);
    return t !== undefined && (Date.now() - t) < MS_COOLDOWN_MS;
};

const markRecentlyPlayed = (id) => {
    msRecentlyPlayed.set(id, Date.now());
    if (msRecentlyPlayed.size > 200) {
        const cutoff = Date.now() - MS_COOLDOWN_MS;
        for (const [k, v] of msRecentlyPlayed) {
            if (v < cutoff) msRecentlyPlayed.delete(k);
        }
    }
};

const markIdAsPlayed = (id) => {
    msPlayedIds.add(id);
    if (msPlayedIds.size > MAX_PLAYED_IDS) {
        const oldest = msPlayedIds.values().next().value;
        msPlayedIds.delete(oldest);
    }
};

const getMessageContainer = (row) => {
    return row.querySelector('.w-full.min-w-0.shrink-0.break-words.rounded-lg') ||
        row.querySelector('.flex.w-full.min-w-0.shrink-0.flex-col.break-words.rounded-lg') ||
        row.querySelector('div.rounded-lg');
};

const hasMentionBorder = (el) => {
    return !!el && [...el.classList].some((c) => c.startsWith('border-green'));
};

const isMentionRow = (row) => {
    return hasMentionBorder(getMessageContainer(row));
};

const getFallbackMessageParts = (row) => {
    const msgContainer = getMessageContainer(row);
    if (!msgContainer) return null;

    const senderEl = row.querySelector('button.inline.font-bold') || row.querySelector('[data-chat-entry-username]');
    const sender = senderEl ? (senderEl.getAttribute('data-chat-entry-username') || senderEl.textContent).trim().toLowerCase() : '';
    const tsEl = row.querySelector('span.text-neutral') || row.querySelector('.text-neutral');
    const ts = tsEl ? tsEl.textContent.trim() : '';
    const textContent = msgContainer.textContent.trim().replace(/\s+/g, ' ');
    if (!sender || !textContent) return null;

    return {
        sender,
        ts,
        textContent,
        key: `${sender}_${ts}_${textContent}`,
    };
};

const getFallbackOccurrenceIndex = (row, fallbackKey) => {
    const chatRoom = row.closest('#channel-chatroom') || document.querySelector('#channel-chatroom');
    const rows = chatRoom ? [...chatRoom.querySelectorAll('.group.relative')] : [row];
    let occurrence = 0;

    for (const candidate of rows) {
        const parts = getFallbackMessageParts(candidate);
        if (parts?.key !== fallbackKey) continue;
        if (candidate === row) return occurrence;
        occurrence += 1;
    }

    return 0;
};

const getMessageIdentity = (row) => {
    let msgId = row.getAttribute('data-chat-entry-id') || row.getAttribute('data-id') || row.id;
    if (msgId) return { id: `stable:${msgId}`, stable: true };

    const childWithId = row.querySelector('[data-chat-entry-id], [data-id], [id^="message-"]');
    if (childWithId) {
        msgId = childWithId.getAttribute('data-chat-entry-id') || childWithId.getAttribute('data-id') || childWithId.id;
        if (msgId) return { id: `stable:${msgId}`, stable: true };
    }

    const parts = getFallbackMessageParts(row);
    if (!parts) return null;

    const occurrence = getFallbackOccurrenceIndex(row, parts.key);
    return { id: `fallback:${parts.key}#${occurrence}`, stable: false };
};

/**
 * Marks all currently visible mention rows as already handled so reconnects, initial loads,
 * and fullscreen chat rebuilds don't replay old highlighted messages.
 */
const populateExistingMessageIds = () => {
    if (!msEnabled) return;
    try {
        const rows = document.querySelectorAll('#channel-chatroom .group.relative');
        for (const row of rows) {
            if (!isMentionRow(row)) continue;
            const identity = getMessageIdentity(row);
            if (identity?.id) markIdAsPlayed(identity.id);
        }
    } catch (e) {
        console.warn('Kick Extension: Error populating existing message IDs', e);
    }
};

/**
 * Collects all .group.relative chat rows from a single changed DOM node.
 */
const collectChatRows = (node) => {
    const rows = [];
    if (node.nodeType !== 1) return rows;

    if (node.classList?.contains('group') && node.classList?.contains('relative')) {
        rows.push(node);
    }
    node.querySelectorAll?.('.group.relative').forEach((r) => rows.push(r));

    const parentRow = node.closest?.('.group.relative');
    if (parentRow) rows.push(parentRow);

    return rows;
};

let msLastScrollTime = 0;
let msWasAtBottom = true;
const MS_SCROLL_QUIET_MS = 700;
const MS_INITIAL_QUIET_MS = 3000;
const MS_ROW_SETTLE_MS = 80;
const MS_MAX_ROW_RETRIES = 5;

const getScrollContainer = () => {
    const chatRoom = msObservedChatRoom || document.querySelector('#channel-chatroom');
    if (!chatRoom) return null;
    return chatRoom.querySelector('#chatroom-messages') || chatRoom.querySelector('[data-simplebar] .simplebar-content-wrapper') || chatRoom;
};

const computeAtBottom = () => {
    const container = getScrollContainer();
    if (!container) return true;
    return (container.scrollHeight - container.scrollTop - container.clientHeight) < 80;
};

const updateScrollState = () => {
    msLastScrollTime = Date.now();
    msWasAtBottom = computeAtBottom();
};

const getSuppressReason = (meta) => {
    const now = Date.now();
    if (now - msInitializedTime < MS_INITIAL_QUIET_MS) return 'initial-quiet';
    if (meta?.forceSuppress) return meta.forceSuppress;
    if (now - msLastScrollTime < MS_SCROLL_QUIET_MS && !msWasAtBottom) return 'scrolling-history';
    if (!meta?.wasAtBottom) return 'not-at-bottom';
    return null;
};

const msPendingRows = new Map();
let msFlushTimer = null;

const scheduleFlush = () => {
    if (msFlushTimer) return;
    msFlushTimer = window.setTimeout(flushPendingRows, MS_ROW_SETTLE_MS);
};

const queueRow = (row, meta = {}) => {
    if (!row || !row.isConnected) return;

    const existing = msPendingRows.get(row) || { retries: 0, wasAtBottom: false, forceSuppress: null };
    existing.wasAtBottom = existing.wasAtBottom || !!meta.wasAtBottom;
    existing.forceSuppress = existing.forceSuppress || meta.forceSuppress || null;
    existing.retries = Math.max(existing.retries || 0, meta.retries || 0);
    msPendingRows.set(row, existing);
    scheduleFlush();
};

const retryRowIfNeeded = (row, meta) => {
    if (!row.isConnected || meta.retries >= MS_MAX_ROW_RETRIES) return;
    queueRow(row, { ...meta, retries: meta.retries + 1 });
};

const evaluateRow = (row, meta) => {
    const msgContainer = getMessageContainer(row);
    const identity = getMessageIdentity(row);

    // Kick often adds the row, content, and highlight classes in separate steps.
    // Wait a few short ticks before deciding this row is definitely not actionable.
    if (!msgContainer || !identity) {
        retryRowIfNeeded(row, meta);
        return false;
    }

    if (!isMentionRow(row)) {
        retryRowIfNeeded(row, meta);
        return false;
    }

    if (msPlayedIds.has(identity.id)) return false;

    const suppressReason = getSuppressReason(meta);
    if (suppressReason) {
        markIdAsPlayed(identity.id);
        return false;
    }

    if (!identity.stable && wasRecentlyPlayed(identity.id)) return false;

    markIdAsPlayed(identity.id);
    markRecentlyPlayed(identity.id);
    return true;
};

function flushPendingRows() {
    msFlushTimer = null;
    if (!msEnabled || msPendingRows.size === 0) {
        msPendingRows.clear();
        return;
    }

    const pending = [...msPendingRows.entries()];
    msPendingRows.clear();

    let shouldPlay = false;
    for (const [row, meta] of pending) {
        if (evaluateRow(row, meta)) shouldPlay = true;
    }

    if (shouldPlay && (Date.now() - lastSoundTime > 300)) {
        playSound();
        lastSoundTime = Date.now();
    }
}

const msStartObserver = () => {
    if (!msEnabled || msChatObserver) return;

    const chatRoom = document.querySelector('#channel-chatroom');
    if (!chatRoom) return;

    msObservedChatRoom = chatRoom;
    msInitializedTime = Date.now();
    msWasAtBottom = computeAtBottom();
    populateExistingMessageIds();

    chatRoom.addEventListener('scroll', updateScrollState, { capture: true, passive: true });
    window.addEventListener('scroll', updateScrollState, { capture: true, passive: true });

    msChatObserver = new MutationObserver((mutations) => {
        if (!msEnabled) return;

        const allRows = new Set();
        let sawClassChange = false;

        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                sawClassChange = true;
                for (const row of collectChatRows(m.target)) allRows.add(row);
                continue;
            }

            for (const node of m.addedNodes) {
                for (const row of collectChatRows(node)) allRows.add(row);
            }
        }

        if (allRows.size === 0) return;

        const inInitialQuiet = Date.now() - msInitializedTime < MS_INITIAL_QUIET_MS;
        const largeHistoryBatch = allRows.size > 12 && (inInitialQuiet || !msWasAtBottom);
        const forceSuppress = inInitialQuiet ? 'initial-quiet' : (!msWasAtBottom ? 'not-at-bottom' : (largeHistoryBatch ? 'history-batch' : null));

        for (const row of allRows) {
            queueRow(row, {
                wasAtBottom: msWasAtBottom,
                forceSuppress,
                // Attribute-only mention updates are usually the final piece, so one retry is enough.
                retries: sawClassChange ? 1 : 0,
            });
        }
    });

    msChatObserver.observe(chatRoom, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
    });
};

const msStopObserver = () => {
    if (msChatObserver) {
        msChatObserver.disconnect();
        msChatObserver = null;
    }

    if (msObservedChatRoom) {
        msObservedChatRoom.removeEventListener('scroll', updateScrollState, { capture: true });
        msObservedChatRoom = null;
    }

    window.removeEventListener('scroll', updateScrollState, { capture: true });
    msPendingRows.clear();
    if (msFlushTimer) {
        window.clearTimeout(msFlushTimer);
        msFlushTimer = null;
    }
};

const updateObserverState = () => {
    if (msEnabled) {
        msStartObserver();
    } else {
        msStopObserver();
    }
};

const init = async () => {
    msInitializedTime = Date.now();

    document.addEventListener('pointerdown', unlockAudio, { capture: true, passive: true });
    document.addEventListener('keydown', unlockAudio, { capture: true, passive: true });

    try {
        const result = await chrome.storage.local.get({ [MS_STORAGE_KEY]: false });
        msEnabled = result[MS_STORAGE_KEY];
    } catch(e) {
        console.warn('Kick Extension: failed to read mention sound storage', e);
    }

    updateObserverState();

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'updateSetting' && message.key === MS_STORAGE_KEY) {
            const oldVal = msEnabled;
            msEnabled = message.value;
            if (msEnabled && !oldVal) {
                msInitializedTime = Date.now();
                unlockAudio();
            }
            updateObserverState();
        }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes[MS_STORAGE_KEY]) {
            const oldVal = msEnabled;
            msEnabled = changes[MS_STORAGE_KEY].newValue;
            if (msEnabled && !oldVal) {
                msInitializedTime = Date.now();
                unlockAudio();
            }
            updateObserverState();
        }
    });

    console.log('Kick Extension: Mention Sound initialized, enabled:', msEnabled);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

let msReconnectTimer = null;
const scheduleObserverReconnect = () => {
    if (!msEnabled || msReconnectTimer) return;
    msReconnectTimer = window.setTimeout(() => {
        msReconnectTimer = null;
        const chatRoom = document.querySelector('#channel-chatroom');
        if (!chatRoom || chatRoom === msObservedChatRoom) return;
        msStopObserver();
        msStartObserver();
    }, 250);
};

try {
    if (window.KickExt.createObserver) {
        window.KickExt.createObserver(document.body, scheduleObserverReconnect, { childList: true, subtree: true });
    }
} catch (e) {
    console.warn('Kick Extension [mentionSound]: failed to hook observer re-attachment', e);
}

const msHandleFullscreenChange = () => {
    if (!msEnabled) return;
    setTimeout(() => {
        msStopObserver();
        msStartObserver();
    }, 500);
};
document.addEventListener('fullscreenchange', msHandleFullscreenChange);
document.addEventListener('webkitfullscreenchange', msHandleFullscreenChange);

