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

const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function(child) {
    if (child && child.parentNode && child.parentNode !== this) {
        try {
            // Move child back to the expected parent first, so removeChild is native and clean
            this.appendChild(child);
        } catch (err) {
            console.warn('Kick Extension: removeChild proxy move-back error', err);
        }
    }
    try {
        return originalRemoveChild.apply(this, arguments);
    } catch (e) {
        console.warn('Kick Extension: removeChild proxy fallback', e);
        // Final fallback: remove directly from actual parent if native remove still fails
        if (child && child.parentNode) {
            try {
                return child.parentNode.removeChild(child);
            } catch (fallbackErr) {}
        }
        return child;
    }
};

const originalInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function(newChild, referenceChild) {
    if (referenceChild && referenceChild.parentNode && referenceChild.parentNode !== this) {
        try {
            this.appendChild(referenceChild);
        } catch (err) {
            console.warn('Kick Extension: insertBefore proxy move-back error', err);
        }
    }
    try {
        return originalInsertBefore.apply(this, arguments);
    } catch (e) {
        console.warn('Kick Extension: insertBefore proxy fallback', e);
        if (referenceChild && referenceChild.parentNode) {
            try {
                return referenceChild.parentNode.insertBefore(newChild, referenceChild);
            } catch (fallbackErr) {}
        }
        try {
            return this.appendChild(newChild);
        } catch (err) {}
        return newChild;
    }
};

const originalReplaceChild = Node.prototype.replaceChild;
Node.prototype.replaceChild = function(newChild, oldChild) {
    if (oldChild && oldChild.parentNode && oldChild.parentNode !== this) {
        try {
            this.appendChild(oldChild);
        } catch (err) {
            console.warn('Kick Extension: replaceChild proxy move-back error', err);
        }
    }
    try {
        return originalReplaceChild.apply(this, arguments);
    } catch (e) {
        console.warn('Kick Extension: replaceChild proxy fallback', e);
        if (oldChild && oldChild.parentNode) {
            try {
                return oldChild.parentNode.replaceChild(newChild, oldChild);
            } catch (fallbackErr) {}
        }
        try {
            return this.appendChild(newChild);
        } catch (err) {}
        return newChild;
    }
};

console.log('Kick Extension: Console bridge active.');
