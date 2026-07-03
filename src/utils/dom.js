/**
 * DOM Utilities
 */

/**
 * Waits for an element to appear in the DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Optional timeout in ms
 * @returns {Promise<Element>}
 */
const waitForElement = (selector, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element);

    const observer = new MutationObserver((mutations, obs) => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    if (timeout) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout: Element ${selector} not found after ${timeout}ms`));
      }, timeout);
    }
  });
};

// Export to global namespace since we are using manifest injection
window.KickExt = window.KickExt || {};
window.KickExt.waitForElement = waitForElement;
