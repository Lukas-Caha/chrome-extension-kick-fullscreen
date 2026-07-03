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

// Export to global namespace
window.KickExt = window.KickExt || {};
window.KickExt.createObserver = createObserver;
