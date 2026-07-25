/**
 * Friends Highlight
 * Highlights chat messages from marked friends with a dashed border.
 * Persists list under storage key "friendUsernames" (array of lowercase strings).
 */

const FH_FRIEND_CLASS = 'kick-ext-friend-msg';
const FH_STORAGE_KEY  = 'friendUsernames';

let fhFriendSet = new Set();
let fhChatObserver = null;
let fhCardObserver = null;
let fhObservedChatRoom = null;
let fhRestartTimer = null;

/**
 * Extracts the username of the message sender.
 */
const fhGetUsernameFromEntry = (entry) => {
  const nameBtn = entry.querySelector('button.inline.font-bold[data-prevent-expand]');
  if (nameBtn) {
    return nameBtn.textContent.trim().toLowerCase();
  }

  const byAttr = entry.querySelector('[data-chat-entry-username]');
  if (byAttr) {
    return byAttr.getAttribute('data-chat-entry-username').trim().toLowerCase();
  }

  return null;
};

/**
 * Highlights a single row if the sender is a friend.
 */
const fhHighlightRow = (row) => {
  const username = fhGetUsernameFromEntry(row);
  if (!username) return;

  const isFriend = fhFriendSet.has(username);
  const msgContainer = row.querySelector('div.rounded-lg');
  if (msgContainer) {
    const isMention = [...msgContainer.classList].some(c => c.startsWith('border-green'));
    msgContainer.classList.toggle(FH_FRIEND_CLASS, isFriend && !isMention);
  }
};

/**
 * Scans the entire chat and applies highlights.
 */
const fhApplyHighlights = () => {
  const rows = document.querySelectorAll('#channel-chatroom .group.relative');
  for (const row of rows) {
    fhHighlightRow(row);
  }
};

/**
 * Evaluates newly added DOM nodes for highlighting.
 */
const fhHighlightEntryNode = (node) => {
  const rows = node.classList?.contains('group') && node.classList?.contains('relative')
    ? [node]
    : [...(node.querySelectorAll?.('.group.relative') || [])];

  for (const row of rows) {
    fhHighlightRow(row);
  }
};

/**
 * Checks if a newly added DOM node is or contains a Kick User Card, and injects our friend toggle star button.
 */
const fhCheckForUserCard = (node) => {
  const card = node.querySelector?.('.bg-surface-highest') || (node.classList?.contains('bg-surface-highest') ? node : null);
  if (!card) return;

  // Verify it is a user card by checking for the username link and Follow button container.
  // React renders the card progressively — some elements may not exist yet.
  const userLink = card.querySelector('a[href^="https://kick.com/"]');
  const followBtn = card.querySelector('button[aria-label="Follow"], button[aria-label="Unfollow"]');
  const buttonRow = followBtn?.parentElement;

  if (!userLink || !buttonRow) {
    if (!card.dataset.kickExtFhRetried) {
      card.dataset.kickExtFhRetried = 'true';
      setTimeout(() => {
        fhCheckForUserCard(card);
        // Clear flag shortly after so future card mounts/clicks can retry too
        setTimeout(() => {
          delete card.dataset.kickExtFhRetried;
        }, 100);
      }, 200); // 200ms gives React plenty of time
    }
    return;
  }

  // Clear retry flag on success
  delete card.dataset.kickExtFhRetried;

  const username = (userLink.title || userLink.textContent).trim();
  if (!username) return;

  // Avoid double injection
  if (card.querySelector('.kick-ext-friend-toggle')) return;

  // Create our friend toggle button — matches Kick's current pill-button style
  const toggleBtn = document.createElement('button');
  toggleBtn.className = [
    'group inline-flex gap-1.5 items-center justify-center rounded font-semibold box-border',
    'relative transition-all betterhover:active:scale-[0.98] disabled:pointer-events-none',
    'select-none whitespace-nowrap',
    'state-layer-surface bg-secondary-base text-secondary-onSecondary',
    'focus-visible:bg-secondary-base disabled:bg-disabled-base',
    'px-3 py-2.5 text-base kick-ext-friend-toggle'
  ].join(' ');

  // SVG stars (20×20 for visual parity with Follow/Mute pill buttons)
  const starOutline = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  const starFilled = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FEB635" stroke="#FEB635" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

  const nameLower = username.toLowerCase();
  let isFriend = fhFriendSet.has(nameLower);

  const updateButtonState = () => {
    toggleBtn.innerHTML = isFriend ? starFilled : starOutline;
    toggleBtn.title = isFriend ? 'Remove from Friends' : 'Add to Friends';
    if (isFriend) {
      toggleBtn.style.color = '#FEB635';
    } else {
      toggleBtn.style.color = 'white';
    }
  };

  updateButtonState();

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFriend) {
      fhRemoveFriend(nameLower);
      isFriend = false;
    } else {
      fhAddFriend(nameLower);
      isFriend = true;
    }
    updateButtonState();

    // Also update friend list in Settings Panel if it's currently open
    const listDiv = document.querySelector('#kick-ext-sp-friend-list');
    if (listDiv) {
      const friends = fhGetFriends();
      listDiv.textContent = friends.length > 0 ? `Friends: ${friends.join(', ')}` : 'No friends added.';
    }
  });

  buttonRow.appendChild(toggleBtn);
};

/**
 * Starts the MutationObservers.
 * - fhChatObserver: scoped to #channel-chatroom — handles message highlighting only.
 * - fhCardObserver: scoped to document.body — handles user card star button injection.
 *   Created once and never torn down (user cards appear throughout the page lifetime).
 */
const fhStartObserver = () => {
  if (fhChatObserver) return;

  // Observer 1: chat messages — scoped tightly to the chatroom element
  fhChatObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) {
          fhHighlightEntryNode(node);
        }
      }
    }
  });

  const chatRoom = document.querySelector('#channel-chatroom');
  if (chatRoom) {
    fhObservedChatRoom = chatRoom;
    fhChatObserver.observe(chatRoom, { childList: true, subtree: true });
  }

  // Observer 2: user cards — watches body-level additions for portals/modals.
  // Guard: only one instance ever. Quick .bg-surface-highest check prevents
  // processing chat message nodes unnecessarily.
  if (!fhCardObserver) {
    fhCardObserver = (mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;

          // Direct .bg-surface-highest match (legacy path)
          if (
            node.classList?.contains('bg-surface-highest') ||
            node.querySelector?.('.bg-surface-highest')
          ) {
            fhCheckForUserCard(node);
            continue;
          }

          // New Kick layout: #user-identity is added first, card content rendered progressively
          if (node.id === 'user-identity' || node.querySelector?.('#user-identity')) {
            const target = node.id === 'user-identity' ? node : node.querySelector('#user-identity');
            // Try immediately in case card is already populated
            const card = target.querySelector('.bg-surface-highest');
            if (card) {
              fhCheckForUserCard(card);
            } else {
              // React hasn't rendered the card yet — retry shortly
              setTimeout(() => {
                const c = target.querySelector('.bg-surface-highest');
                if (c) fhCheckForUserCard(c);
              }, 150);
            }
          }
        }
      }
    };
    // Subscribe to shared body observer — replaces standalone body MutationObserver.
    // fhCardObserver is intentionally never unsubscribed (user cards appear throughout the page lifetime).
    window.KickExt.sharedBodyObserver.subscribe(fhCardObserver);
  }
};

/**
 * Disconnects the chat observer (fhChatObserver).
 * fhCardObserver is intentionally kept alive — user cards appear throughout the page.
 */
const fhStopObserver = () => {
  if (fhChatObserver) {
    fhChatObserver.disconnect();
    fhChatObserver = null;
  }
  fhObservedChatRoom = null;
};

/**
 * Persists the current friend list.
 */
const fhSaveFriends = () => {
  chrome.storage.local.set({ [FH_STORAGE_KEY]: [...fhFriendSet] });
};

/**
 * Public APIs
 */
const fhAddFriend = (rawUsername) => {
  const name = rawUsername.trim().toLowerCase();
  if (!name || fhFriendSet.has(name)) return false;
  fhFriendSet.add(name);
  fhSaveFriends();
  fhApplyHighlights();
  return true;
};

const fhRemoveFriend = (rawUsername) => {
  const name = rawUsername.trim().toLowerCase();
  if (!fhFriendSet.has(name)) return false;
  fhFriendSet.delete(name);
  fhSaveFriends();
  fhApplyHighlights();
  return true;
};

const fhGetFriends = () => [...fhFriendSet];

const fhInit = async () => {
  try {
    const result = await chrome.storage.local.get({ [FH_STORAGE_KEY]: [] });
    fhFriendSet = new Set((result[FH_STORAGE_KEY] || []).map((u) => u.toLowerCase()));
  } catch (e) {
    fhFriendSet = new Set();
    console.error('Kick Extension [friendsHighlight]: failed to read storage', e);
  }

  fhApplyHighlights();
  fhStartObserver();
  console.log(`Kick Extension: Friends Highlight initialized with ${fhFriendSet.size} friends.`);
};

// Listen for storage changes from popup or other contexts
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[FH_STORAGE_KEY]) {
      const newFriends = changes[FH_STORAGE_KEY].newValue || [];
      fhFriendSet = new Set(newFriends.map((u) => u.toLowerCase()));
      fhApplyHighlights();
    }
  });
}

// Export to extension namespace
window.KickExt = window.KickExt || {};
window.KickExt.friendsHighlight = {
  init: fhInit,
  addFriend: fhAddFriend,
  removeFriend: fhRemoveFriend,
  getFriends: fhGetFriends,
  applyHighlights: fhApplyHighlights,
};

const FH_RESTART_DEBOUNCE_MS = 300;

/**
 * Schedules a debounced observer restart.
 * All restart triggers (SPA navigation, fullscreen) funnel through here so they don't
 * repeatedly rescan the chat on every DOM mutation.
 * @param {boolean} force - If true, restarts even if the chatRoom element hasn't changed.
 */
const fhScheduleObserverRestart = (force = false) => {
  if (fhRestartTimer) window.clearTimeout(fhRestartTimer);

  fhRestartTimer = window.setTimeout(() => {
    fhRestartTimer = null;
    const chatRoom = document.querySelector('#channel-chatroom');
    if (!chatRoom) return;
    if (!force && chatRoom === fhObservedChatRoom && fhChatObserver) return;
    fhStopObserver();
    fhStartObserver();
    fhApplyHighlights();
  }, FH_RESTART_DEBOUNCE_MS);
};

// Re-attach observer when navigation or fullscreen changes the chat room element
try {
  if (window.KickExt.sharedBodyObserver) {
    window.KickExt.sharedBodyObserver.subscribe(() => fhScheduleObserverRestart(false));
  }
} catch (e) {
  console.warn('Kick Extension [friendsHighlight]: failed to hook observer re-attachment', e);
}

const fhHandleFullscreenChange = () => {
  fhScheduleObserverRestart(true);
};
document.addEventListener('fullscreenchange', fhHandleFullscreenChange);
document.addEventListener('webkitfullscreenchange', fhHandleFullscreenChange);

// ---------------------------------------------------------------------------
// Polling Fallback for User Profile Card Detection
// ---------------------------------------------------------------------------
// MutationObservers can miss the card opening when React updates #user-identity
// in-place rather than adding/removing nodes. This lightweight interval catches
// any card that the observer missed and injects the friend star.
setInterval(() => {
  const identityEl = document.querySelector('#user-identity');
  if (!identityEl) return;
  const card = identityEl.querySelector('.bg-surface-highest');
  if (!card) return;
  if (card.querySelector('.kick-ext-friend-toggle')) return; // already injected
  const followBtn = card.querySelector('button[aria-label="Follow"], button[aria-label="Unfollow"]');
  const userLink = card.querySelector('a[href^="https://kick.com/"]');
  if (!followBtn || !userLink) return; // card not fully rendered yet
  fhCheckForUserCard(card);
}, 300);

// Auto bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fhInit);
} else {
  fhInit();
}
