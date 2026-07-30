/**
 * Kick Extension - Navbar Button Injector
 * Injects a Settings gear icon into Kick.com top navigation bar (right side next to 7TV / profile).
 */

(function () {
  window.KickExt = window.KickExt || {};

  const BUTTON_ID = 'kick-ext-nav-settings-btn';

  /**
   * Finds the right-hand actions container inside Kick's top navbar.
   * Ensures we select the right div (DIV element, NOT the left collapse button).
   */
  const getRightNavContainer = () => {
    const nav = document.querySelector('nav');
    if (!nav) return null;

    // Search for div children of nav or divs containing right-side controls
    const divs = Array.from(nav.querySelectorAll('div'));
    
    // 1. Try finding div containing 7TV or Kicks top nav or profile avatar
    const rightByControl = divs.find(d => 
      d.querySelector('.seventv-kick-settings-module-root, #seventv-kick-settings-button, [data-testid="kicks-top-nav"]')
    );
    if (rightByControl) return rightByControl;

    // 2. Fallback to direct rightmost flex container div inside nav (not a button)
    const directFlexDivs = divs.filter(d => 
      d.tagName === 'DIV' && 
      d.classList.contains('flex') && 
      d.classList.contains('items-center') &&
      !d.classList.contains('grow') &&
      !d.classList.contains('grow-0')
    );
    if (directFlexDivs.length > 0) {
      return directFlexDivs[directFlexDivs.length - 1];
    }

    // 3. Fallback: last div inside nav
    const allDivs = nav.querySelectorAll('div');
    return allDivs.length > 0 ? allDivs[allDivs.length - 1] : null;
  };

  /**
   * Attempts to inject the settings button into Kick's navbar right container.
   */
  const injectNavButton = () => {
    if (document.getElementById(BUTTON_ID)) return;

    const targetContainer = getRightNavContainer();
    if (!targetContainer || targetContainer.tagName !== 'DIV') return;

    // Create button element (Basic clean square styling centered without state-layer-surface artifacting)
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.className = 'flex shrink-0 items-center justify-center rounded-md font-semibold transition-all duration-150 focus:outline-none active:scale-95 bg-transparent hover:bg-neutral-800/70 text-neutral-300 hover:text-white size-9 text-sm leading-none';
    btn.title = 'Kick Extension Settings';
    btn.setAttribute('aria-label', 'Kick Extension Settings');

    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#53fc18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: auto;">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.KickExt.inPageSettingsModal) {
        window.KickExt.inPageSettingsModal.toggle();
      }
    });

    // Append to end of container — never insertBefore existing elements.
    // Inserting before 7TV's button displaced it in the DOM and broke
    // 7TV's emote preview tooltips on initial page load (before F5).
    targetContainer.appendChild(btn);
  };

  /**
   * Initializes observer and injection.
   */
  const init = () => {
    setTimeout(injectNavButton, 2500);

    // Subscribe to shared body observer (Rule 1 & 2)
    if (window.KickExt.sharedBodyObserver) {
      window.KickExt.sharedBodyObserver.subscribe((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.tagName === 'NAV' || node.querySelector?.('nav')) {
              // Delay injection to avoid React hydration mismatch 
              // and crashing 7TV's initialization sequence on initial load.
              setTimeout(injectNavButton, 2500);
              return;
            }
          }
        }
      });
    }
  };

  window.KickExt.navButtonInjector = {
    init,
    inject: injectNavButton
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
