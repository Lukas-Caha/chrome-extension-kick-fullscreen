/**
 * Draggable Feature
 */

const makeDraggable = (el, handle) => {
  let isDragging = false;
  let startX, startY;
  let parentRect, parentWidth, parentHeight;

  const onMouseDown = (e) => {
    isDragging = true;
    
    const rect = el.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    // Cache parent bounds once — they don't change during a single drag
    parentRect = el.parentElement.getBoundingClientRect();
    parentWidth = el.parentElement.clientWidth;
    parentHeight = el.parentElement.clientHeight;
    
    el.classList.add('is-dragging');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    e.preventDefault(); // Prevent text selection
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;

    // Calculate position relative to parent (using bounds cached at drag start)
    let x = e.clientX - startX - parentRect.left;
    let y = e.clientY - startY - parentRect.top;

    // Clamp to parent boundaries for immediate visual feedback
    x = Math.max(0, Math.min(x, parentWidth - el.offsetWidth));
    y = Math.max(0, Math.min(y, parentHeight - el.offsetHeight));

    // Use CSS clamp for dynamic bounding (the 'mix' of px and percentages).
    // This remembers the exact pixel position but guarantees it won't overflow if the parent window (100%) gets smaller!
    el.style.left = `clamp(0px, ${x}px, calc(100% - ${el.offsetWidth}px))`;
    el.style.top = `clamp(0px, ${y}px, calc(100% - ${el.offsetHeight}px))`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  };

  const onMouseUp = async () => {
    if (!isDragging) return;
    
    isDragging = false;
    el.classList.remove('is-dragging');
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Save position to settings
    if (window.KickExt && window.KickExt.settings) {
      await window.KickExt.settings.saveSetting('posX', el.style.left);
      await window.KickExt.settings.saveSetting('posY', el.style.top);
    }
  };

  handle.addEventListener('mousedown', onMouseDown);
  handle.style.cursor = 'grab';
};

// Export to global namespace
window.KickExt = window.KickExt || {};
window.KickExt.draggable = {
  init: makeDraggable
};
