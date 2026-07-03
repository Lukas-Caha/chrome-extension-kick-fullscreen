/**
 * Observer Utilities
 */

/**
 * Creates a MutationObserver on a target element
 * @param {Element} target - The element to observe
 * @param {Function} callback - Function to run on mutation
 * @param {Object} options - MutationObserver options
 * @returns {MutationObserver}
 */
const createObserver = (target, callback, options = { childList: true, subtree: true }) => {
  if (!target) return null;

  const observer = new MutationObserver((mutations) => {
    callback(mutations, observer);
  });

  observer.observe(target, options);
  return observer;
};

// ---------------------------------------------------------------------------
// Shared Body-Level MutationObserver
// ---------------------------------------------------------------------------
// Consolidates ALL document.body observers into a single MutationObserver
// instance. Previously every feature created its own body observer with
// subtree:true, causing the browser to run 5-6 separate observer callbacks
// for every single DOM mutation (= every chat message). Now there is exactly
// ONE observer; each feature subscribes a callback to it.
//
// Usage:
//   window.KickExt.sharedBodyObserver.subscribe(myCallback);
//   window.KickExt.sharedBodyObserver.unsubscribe(myCallback);
//
// The callback receives the standard MutationObserver mutations array.
// Each subscriber is responsible for its own filtering.
// ---------------------------------------------------------------------------

const _bodySubscribers = new Set();
let _sharedBodyMO = null;

const _ensureSharedBodyObserver = () => {
  if (_sharedBodyMO) return;
  _sharedBodyMO = new MutationObserver((mutations) => {
    for (const cb of _bodySubscribers) {
      try {
        cb(mutations);
      } catch (e) {
        console.error('KickExt [sharedBodyObserver] subscriber error:', e);
      }
    }
  });
  _sharedBodyMO.observe(document.body, { childList: true, subtree: true });
};

const subscribeBodyObserver = (callback) => {
  if (!callback || _bodySubscribers.has(callback)) return;
  _bodySubscribers.add(callback);
  _ensureSharedBodyObserver();
};

const unsubscribeBodyObserver = (callback) => {
  _bodySubscribers.delete(callback);
};

// Export to global namespace
window.KickExt = window.KickExt || {};
window.KickExt.createObserver = createObserver;
window.KickExt.sharedBodyObserver = {
  subscribe: subscribeBodyObserver,
  unsubscribe: unsubscribeBodyObserver,
};
