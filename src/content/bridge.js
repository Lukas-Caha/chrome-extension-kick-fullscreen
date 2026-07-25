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

// ---------------------------------------------------------------------------
// Portals Bridge: Handle elements moved to fullscreen container / overlays.
// ---------------------------------------------------------------------------
// Kick's React tree (and 7TV's Vue tree) sometimes tries to removeChild /
// insertBefore / replaceChild a node relative to the parent it *thinks* the
// node still lives in. When the extension relocates that same live DOM node
// elsewhere (fullscreen chat overlay, 7TV teleport target, profile banner),
// the framework's assumption is stale and the native call throws.
//
// Previously this was handled by patching Node.prototype.removeChild /
// insertBefore / replaceChild globally, for every node on the page. That
// meant every single DOM write anywhere on kick.com — including React's own
// hot reconciliation path for chat messages — paid the cost of this safety
// net, even though it is only ever needed for the handful of nodes the
// extension actually relocates.
//
// Instead, only elements the extension has explicitly tagged with
// [data-ke-portaled="true"] (set by the isolated-world content scripts at
// the moment they move a node — see fullscreen.js) get the special
// handling. Everything else takes the fast path straight through to the
// original native method with a single cheap attribute check and nothing
// else — effectively zero overhead compared to the unpatched native call.
// ---------------------------------------------------------------------------

const KE_PORTAL_ATTR = 'data-ke-portaled';

const isPortaled = (node) =>
    !!node && node.nodeType === 1 && node.hasAttribute(KE_PORTAL_ATTR);

const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function (child) {
    if (!isPortaled(child) || !child.parentNode || child.parentNode === this) {
        // Fast path: not one of our relocated nodes (or already correctly
        // parented) — behave exactly like the native method.
        return originalRemoveChild.call(this, child);
    }

    try {
        // Move child back to the expected parent first, so removeChild is native and clean
        this.appendChild(child);
    } catch (err) {
        console.warn('Kick Extension: removeChild proxy move-back error', err);
    }
    try {
        return originalRemoveChild.call(this, child);
    } catch (e) {
        console.warn('Kick Extension: removeChild proxy fallback', e);
        if (child && child.parentNode) {
            try {
                return child.parentNode.removeChild(child);
            } catch (fallbackErr) { }
        }
        return child;
    }
};

const originalInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function (newChild, referenceChild) {
    if (!isPortaled(referenceChild) || !referenceChild.parentNode || referenceChild.parentNode === this) {
        return originalInsertBefore.call(this, newChild, referenceChild);
    }

    try {
        this.appendChild(referenceChild);
    } catch (err) {
        console.warn('Kick Extension: insertBefore proxy move-back error', err);
    }
    try {
        return originalInsertBefore.call(this, newChild, referenceChild);
    } catch (e) {
        console.warn('Kick Extension: insertBefore proxy fallback', e);
        if (referenceChild && referenceChild.parentNode) {
            try {
                return referenceChild.parentNode.insertBefore(newChild, referenceChild);
            } catch (fallbackErr) { }
        }
        try {
            return this.appendChild(newChild);
        } catch (err) { }
        return newChild;
    }
};

const originalReplaceChild = Node.prototype.replaceChild;
Node.prototype.replaceChild = function (newChild, oldChild) {
    if (!isPortaled(oldChild) || !oldChild.parentNode || oldChild.parentNode === this) {
        return originalReplaceChild.call(this, newChild, oldChild);
    }

    try {
        this.appendChild(oldChild);
    } catch (err) {
        console.warn('Kick Extension: replaceChild proxy move-back error', err);
    }
    try {
        return originalReplaceChild.call(this, newChild, oldChild);
    } catch (e) {
        console.warn('Kick Extension: replaceChild proxy fallback', e);
        if (oldChild && oldChild.parentNode) {
            try {
                return oldChild.parentNode.replaceChild(newChild, oldChild);
            } catch (fallbackErr) { }
        }
        try {
            return this.appendChild(newChild);
        } catch (err) { }
        return newChild;
    }
};

console.log('Kick Extension: Console bridge active (targeted portal patching).');
