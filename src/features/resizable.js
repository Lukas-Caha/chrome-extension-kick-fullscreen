/**
 * Resizable Feature - Support resizing from bottom edge (height) and bottom-left corner (width+height)
 */

const makeResizable = (el, handle, type = 'bottom') => {
  let isResizing = false;
  let startX, startY;
  let startWidth, startHeight;
  let startLeft, startRight;

  const onMouseDown = (e) => {
    isResizing = true;
    
    const parent = el.parentElement || document.body;
    const parentRect = parent.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    startLeft = rect.left - parentRect.left;
    startWidth = rect.width;
    startHeight = rect.height;
    startRight = startLeft + startWidth;

    startX = e.clientX;
    startY = e.clientY;
    
    el.classList.add('is-resizing');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!isResizing) return;

    const parent = el.parentElement || document.body;
    const parentRect = parent.getBoundingClientRect();

    const deltaY = e.clientY - startY;

    // --- Height Resizing (Common) ---
    let newHeight = startHeight + deltaY;
    const minHeight = 75; // Sníženo ze 150 na 75
    const maxHeight = parentRect.height - (el.getBoundingClientRect().top - parentRect.top) - 10;
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
    el.style.height = `${newHeight}px`;
    // Set on documentElement so #seventv-root (sibling of overlay) can read the variable via CSS cascade
    document.documentElement.style.setProperty('--kick-ext-overlay-h', `${newHeight}px`);
    // Toggle compact emote menu mode when overlay is short
    document.body.classList.toggle('kick-ext-emote-compact', newHeight < 360);

    // --- Width Resizing (Only for 'corner' type) ---
    if (type === 'corner') {
      const deltaX = e.clientX - startX;
      let newLeft = startLeft + deltaX;
      let newWidth = startRight - newLeft;

      const minWidth = 200;
      const maxWidth = parentRect.width - 20;

      if (newWidth < minWidth) {
        newWidth = minWidth;
        newLeft = startRight - newWidth;
      } else if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newLeft = startRight - newWidth;
      }

      if (newLeft < 0) {
        newLeft = 0;
        newWidth = startRight;
      }

      el.style.left = `clamp(0px, ${newLeft}px, calc(100% - ${newWidth}px))`;
      el.style.width = `${newWidth}px`;
      el.style.right = 'auto';
    }
  };

  const onMouseUp = async () => {
    if (!isResizing) return;
    
    isResizing = false;
    el.classList.remove('is-resizing');
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (window.KickExt && window.KickExt.settings) {
      await window.KickExt.settings.saveSetting('posX', el.style.left);
      await window.KickExt.settings.saveSetting('posY', el.style.top);
      await window.KickExt.settings.saveSetting('chatWidth', el.style.width);
      await window.KickExt.settings.saveSetting('chatHeight', el.style.height);
    }
  };

  handle.addEventListener('mousedown', onMouseDown);
  handle.style.cursor = (type === 'corner') ? 'nesw-resize' : 'ns-resize';
};

window.KickExt = window.KickExt || {};
window.KickExt.resizable = {
  init: makeResizable
};
