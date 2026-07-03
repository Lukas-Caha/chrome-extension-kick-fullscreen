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

  // Verify it is a user card by checking for the username link and Follow/Report buttons
  const userLink = card.querySelector('a[href^="https://kick.com/"]');
  const actionRow = card.querySelector('div.flex.h-8.items-center.justify-between');
  if (!userLink || !actionRow) return;

  const username = (userLink.title || userLink.textContent).trim();
  if (!username) return;

  // Avoid double injection
  if (card.querySelector('.kick-ext-friend-toggle')) return;

  // Find the left button group containing the Follow button
  const leftButtonGroup = actionRow.querySelector('.flex.items-center.gap-1');
  if (!leftButtonGroup) return;

  // Create our friend toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = [
    'group relative box-border flex shrink-0 grow-0 select-none items-center justify-center gap-2',
    'whitespace-nowrap rounded font-semibold ring-0 transition-all focus-visible:outline-none',
    'active:scale-[0.95] disabled:pointer-events-none [&_svg]:size-[1em] state-layer-surface',
    'bg-secondary-base text-secondary-onSecondary [&_svg]:fill-current focus-visible:bg-secondary-base',
    'disabled:bg-disabled-base size-8 text-sm leading-none kick-ext-friend-toggle'
  ].join(' ');

  // SVG stars
  const starOutline = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
  const starFilled = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FEB635" stroke="#FEB635" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

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

  leftButtonGroup.appendChild(toggleBtn);
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
    fhChatObserver.observe(chatRoom, { childList: true, subtree: true });
  }

  // Observer 2: user cards — watches body-level additions for portals/modals.
  // Guard: only one instance ever. Quick .bg-surface-highest check prevents
  // processing chat message nodes unnecessarily.
  if (!fhCardObserver) {
    fhCardObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && (
            node.classList?.contains('bg-surface-highest') ||
            node.querySelector?.('.bg-surface-highest')
          )) {
            fhCheckForUserCard(node);
          }
        }
      }
    });
    fhCardObserver.observe(document.body, { childList: true, subtree: true });
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

// Export to extension namespace
window.KickExt = window.KickExt || {};
window.KickExt.friendsHighlight = {
  init: fhInit,
  addFriend: fhAddFriend,
  removeFriend: fhRemoveFriend,
  getFriends: fhGetFriends,
  applyHighlights: fhApplyHighlights,
};

// Re-attach observer when navigation or fullscreen changes the chat room element
try {
  if (window.KickExt.createObserver) {
    window.KickExt.createObserver(document.body, () => {
      if (!document.querySelector('#channel-chatroom')) return;
      fhStopObserver();
      fhStartObserver();
      fhApplyHighlights();
    }, { childList: true, subtree: false });
  }
} catch (e) {
  console.warn('Kick Extension [friendsHighlight]: failed to hook observer re-attachment', e);
}

// Auto bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fhInit);
} else {
  fhInit();
}
