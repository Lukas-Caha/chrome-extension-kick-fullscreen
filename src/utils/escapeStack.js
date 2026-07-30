// Shared Escape-key priority stack.
// Panels/overlays register themselves when opened and unregister when closed.
// Only the most recently opened one responds to a given Escape press.
const escStack = [];

const pushEscapeHandler = (closeFn) => {
  escStack.push(closeFn);
};

const popEscapeHandler = (closeFn) => {
  const idx = escStack.lastIndexOf(closeFn);
  if (idx !== -1) escStack.splice(idx, 1);
};

document.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  if (escStack.length === 0) return;
  const topHandler = escStack[escStack.length - 1];
  e.stopPropagation();
  topHandler();
}, { capture: true });

window.KickExt = window.KickExt || {};
window.KickExt.escapeStack = { pushEscapeHandler, popEscapeHandler };
