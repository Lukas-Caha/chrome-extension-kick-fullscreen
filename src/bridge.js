/**
 * Console Bridge
 * Exposes the extension's internal API to the page (Main World)
 * Since core logic is in the Isolated World, this script sends events back to it.
 */

window.KickExt = window.KickExt || {};

// Layout Bridge
window.KickExt.layout = {
  toggleChatSide: () => {
    window.dispatchEvent(new CustomEvent('KickExt:toggleChatSide'));
  },
  moveChatLeft: () => {
    window.dispatchEvent(new CustomEvent('KickExt:moveChatLeft'));
  },
  moveChatRight: () => {
    window.dispatchEvent(new CustomEvent('KickExt:moveChatRight'));
  }
};

// Fullscreen Bridge
window.KickExt.fullscreen = {
  enter: () => window.dispatchEvent(new CustomEvent('KickExt:enterFullscreen')),
  exit: () => window.dispatchEvent(new CustomEvent('KickExt:exitFullscreen')),
  toggle: () => window.dispatchEvent(new CustomEvent('KickExt:toggleFullscreen'))
};

// Transparency Bridge
window.KickExt.setTransparency = (val) => {
  window.dispatchEvent(new CustomEvent('KickExt:setTransparency', { detail: val }));
};

// Position Bridge
window.KickExt.resetChatPosition = () => {
  window.dispatchEvent(new CustomEvent('KickExt:resetPosition'));
};

// Portals Bridge: Handle elements moved to fullscreen container
// This prevents errors when React/7TV tries to modify/remove an element that we moved.

// Helper to check if a node (or its ancestors) is inside the chat overlay or tooltip container
const isInsideOverlayOrTooltip = (node) => {
    let parent = node;
    while (parent) {
        if (parent.id === 'kick-ext-chat-overlay' || parent.id === 'seventv-tooltip-container') {
            return true;
        }
        parent = parent.parentNode;
    }
    return false;
};

const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function(child) {
    if (child && child.parentNode && child.parentNode !== this) {
        if (isInsideOverlayOrTooltip(child.parentNode)) {
            try {
                return child.parentNode.removeChild(child);
            } catch (e) {
                console.warn('Kick Extension: removeChild proxy fallback', e);
            }
        }
    }
    return originalRemoveChild.apply(this, arguments);
};

const originalInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function(newChild, referenceChild) {
    if (referenceChild && referenceChild.parentNode && referenceChild.parentNode !== this) {
        if (isInsideOverlayOrTooltip(referenceChild.parentNode)) {
            try {
                return referenceChild.parentNode.insertBefore(newChild, referenceChild);
            } catch (e) {
                console.warn('Kick Extension: insertBefore proxy fallback', e);
            }
        }
    }
    return originalInsertBefore.apply(this, arguments);
};

const originalReplaceChild = Node.prototype.replaceChild;
Node.prototype.replaceChild = function(newChild, oldChild) {
    if (oldChild && oldChild.parentNode && oldChild.parentNode !== this) {
        if (isInsideOverlayOrTooltip(oldChild.parentNode)) {
            try {
                return oldChild.parentNode.replaceChild(newChild, oldChild);
            } catch (e) {
                console.warn('Kick Extension: replaceChild proxy fallback', e);
            }
        }
    }
    return originalReplaceChild.apply(this, arguments);
};

console.log('Kick Extension: Console bridge active.');
