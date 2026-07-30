# Kick Extension Development Log
**Date:** 2026-07-30
**Status:** Beta - Code Review Fixes V2
**Last Backup:** 2026-07-30 - BACKUP48(code_review_fixes_V2)

### 65. Code Review Fixes V2 (12 Verified Issues)
- **friendsHighlight.js:** Added safe timer (`fhFallbackPollTimer`) and context invalidation check (`chrome.runtime.id`) to background polling, pausing on `document.hidden`.
- **fullscreen.js:** Added `{ capture: true }` to global keydown listeners to match initialization.
- **fullscreen.js:** Improved close button detection on profile banners using `aria-label` and `svg` queries instead of just `.absolute`.
- **fullscreen.js:** Awaited `applyFontScale()` to prevent font size flashing during fullscreen transition.
- **popup.js:** Replaced spoofable `includes('kick.com')` URL checking with secure `isKickUrl` helper.
- **settings.js:** Added type validation (`SETTING_VALIDATORS`) and `sanitizeSettings()` to `getAllSettings` and `getSetting` to prevent broken state (e.g. `opacity` or `blurLevel` corruption).
- **content.js:** Added `Number.isFinite` guard for `blurLevel` before passing it to the blur engine to prevent `NaNpx` CSS injection.
- **inPageSettingsModal.js:** Modal now dynamically reparents to fullscreen overlay using `getModalOverlayParent()` and reacts to `fullscreenchange` events.
- **z-index Safety:** Reduced extreme `z-index` from INT_MAX (`2147483647`) to `2147483000` in `quickClipboard.js` and `coopWindow.js` to prevent global UI conflicts.
- **coopWindow.js:** Added proper `sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"` attribute to the Kick player iframe.
- **Localization:** Translated remaining Czech comments and UI strings (in `popup.html`, `popup.js`, `resizable.js`, `fullscreen.js`, `mentionSound.js`, `friendsHighlight.js`, `chatSettingsInjector.js`) to English.
- **escapeStack.js:** Implemented a central priority stack so hitting Escape closes only the most recently opened panel (Quick Clipboard, Coop Window, or Profile Banner) instead of all simultaneously.
- **Backup:** BACKUP48(code_review_fixes_V2) created.

### 64. Fast Fade Panel Hide Animation & Performance Optimization (BACKUP46)
- **Bug Fix (Panel Closing Artifacts):** Addressed a visual artifact ("dark line") left behind when closing chat panels (Settings, Gift Shop, Points) in the fullscreen overlay. The artifact was caused by the lingering padding and `backdrop-filter` of the panel wrapper during its shrink animation.
- **Fix:** Refined `.bg-surface-base[style*="max-height: 0"]` rule to smoothly and quickly hide panels. Overrode Kick's native 350ms height transition with a fast 150ms slide-down, while simultaneously fading opacity and background color to transparent. Removed `backdrop-filter` immediately upon closing.
- **Optimization (Gifted Subs Blur):** Replaced the unconditional GPU-intensive `backdrop-filter: blur(6px)` and `will-change: backdrop-filter` on the gifted subs marquee in `chat.css` with a dynamic rule that respects the user's blur settings (`.kick-ext-blur-active` and `var(--kick-ext-blur)`), significantly improving Firefox compositor performance.
- **Backup:** BACKUP46(animation_and_blur_fixes) created.

### 63. Complete Theme Subsystem Removal & Legacy Documentation (BACKUP43)
- **Theme Engine Removal:** Removed all custom color theme engine scripts (`src/features/theme.js`, `src/content/earlyTheme.js`, `src/styles/earlyTheme.css`).
- **UI Cleanups:** Removed theme toggle controls and theme preview cards from Toolbar Popup (`popup.html`, `popup.js`, `popup.css`), In-Chat Settings Panel (`chatSettingsInjector.js`), and In-Page Settings Modal (`inPageSettingsModal.js`).
- **Style Cleanups:** Stripped all theme-specific CSS overrides from `base.css`, `settings-panel.css`, `inPageModal.css`, and `popup.css`.
- **Button Colors:** Restored default Kick bright green (`#53FC18`) for buttons in Coop Stream Window (`coopWindow.js`) and Quick Clipboard (`quickClipboard.js`).
- **Image Assets Preserved:** Renamed `images` folder to `imagesNotUsed` (containing `kick-logo-silver.png`, `kick-logo-burgundy.svg`, `kick-logo-rainbow.svg`) to preserve all vector and raster assets without deletion.
- **Legacy Documentation:** Created `HowThemesWereDonePreviously.md` detailing the former 4-layer theme engine, FOWT prevention, SVG defs injection, logo swapping, debounced mutation scanning, and selector gotchas.
- **Backup Consolidation:** Moved all theme-featuring backups (`BACKUP35`, `BACKUP37`, `BACKUP38`, `BACKUP39`, `BACKUP41`) into `archive/backups_with_themes/`.
- **Backup:** BACKUP43(removed_themes) created.

### 62. Split Oversized Files (content.js, base.css) Into Feature Modules
// [REMOVED - Theme engine removed on 2026-07-27] Extracted theme engine from `src/content/content.js` into new feature module `src/features/theme.js` (1,039 lines). `content.js` (218 lines) now serves purely as orchestrator for event listeners, popup communication, and initial settings application.
- **Stylesheet Modularization:** Split `src/styles/base.css` (1,083 lines total) into feature-focused CSS stylesheets:
  - `src/styles/panels.css`: Floating panels glass effect, 7TV emote menu/autocomplete layout, compact mode, and stacking/z-index elevations.
  - `src/styles/chat.css`: Chat message hover glass effect, gifted subs marquee, chat settings height clamps, and Ghost Mode overlay rules.
  // [REMOVED - Theme overrides removed on 2026-07-27] `src/styles/settings-panel.css`: In-chat settings panel controls, sliders, toggles, shortcuts guide, and theme overrides.
  - `src/styles/fullscreen.css`: Extra small font scaling and fullscreen profile banner positioning.
  - `src/styles/compat.css`: Mo'Kick extension compatibility rules.
  // [REMOVED - Theme overrides removed on 2026-07-27] `src/styles/base.css`: Retained core overlay shell, left-side chat alignment, friend message borders, `:root` CSS variables, and global theme overrides.
// [REMOVED - theme.js removed on 2026-07-27] Registered `src/features/theme.js` and all 5 new CSS stylesheets in `manifest.json`.
- **Files:** `src/content/content.js` [MODIFIED], `src/features/theme.js` [NEW], `src/styles/base.css` [MODIFIED], `src/styles/panels.css` [NEW], `src/styles/chat.css` [NEW], `src/styles/settings-panel.css` [NEW], `src/styles/fullscreen.css` [NEW], `src/styles/compat.css` [NEW], `manifest.json` [MODIFIED]
- **Backup:** BACKUP42(file_structure_refactor) created.

### 61. Architectural Review & Dead Asset Cleanup
- **Dead Asset Cleanup:** Removed unused directory `sound/` (and duplicate `mention-ding.ogg`). Removed unreferenced images `images/kick-logo-burgundy.png` and `images/kick-logo-silver.svg`. Cleaned up `manifest.json` `web_accessible_resources` array.
// [REMOVED - Theme checks removed on 2026-07-27] Replaced hardcoded theme string comparisons (`silver`, `burgundy`, `rainbow`) in `src/content/content.js` with table-driven checks against `THEMES` (`!THEMES[activeTheme] || activeTheme === 'green'`), ensuring `'green'` remains excluded from active theme override gates. Dynamically derived theme class names in `removeTheme()`.
// [REMOVED - Dynamic logo revert removed on 2026-07-27] Updated `replaceKickLogo()` to capture `el.src` into `el.dataset.keOrigSrc` and `srcset` into `el.dataset.keOrigSrcset` before replacement. Updated `removeTheme()` to restore `src`/`srcset` from dataset attributes upon theme removal instead of hardcoding `/img/kick-logo.svg`.
- **Scope Discipline & Namespace Safety:** Enforced strict scope discipline and confirmed attribute namespace safety (`data-ke-orig-*`) against external/inline style rules.
- **Files:** `manifest.json` [MODIFIED], `src/content/content.js` [MODIFIED], `sound/` [DELETED], `images/kick-logo-burgundy.png` [DELETED], `images/kick-logo-silver.svg` [DELETED]
- **Backup:** BACKUP40(refactoring_cleaning) created.

### 60. Rainbow Theme Category & Viewer Count Scoped Styling
// [REMOVED - Theme feature removed on 2026-07-27] Resolved an issue where broad substring selector `[style*="translateY"]` in `applyAllSilver()` ran on chat elements in `#channel-chatroom`, causing chat font colors to be overridden in Silver, Burgundy, and Rainbow themes.
// [REMOVED - Theme feature removed on 2026-07-27] Scoped Rainbow Styling (Category & Viewer Count):
//   - Added an explicit chat room guard in `applySilverToElement()` (`if (el.closest('#channel-chatroom, #kick-ext-chat-overlay')) return;`) to ensure chat zprávy/elements are never recolored by theme font re-scans.
//   - Removed global `[style*="translateY"]` from `applyAllSilver()` document query.
//   - Scoped Rainbow theme gradient text styling (`background: ${RAINBOW_GRADIENT} !important; -webkit-background-clip: text; color: transparent !important;`) strictly to category links (`a[href*="/category/"]`) and viewer count numbers (`div:not(#channel-chatroom *):not(#kick-ext-chat-overlay *)[style*="translateY"]`).
- **Files:** `src/content/content.js` [MODIFIED]
- **Backup:** Updated latest backup `archive/BACKUP39_fullscreen_panels_and_colors_fix`.

### 59. Fullscreen Panels Gap & Visibility Fixes
- **Bug Fix (Panel Borders in Fullscreen):** Fixed persistent 2px floating border lines when panels are closed in fullscreen chat by animating `.bg-surface-base` opacity to 0 precisely at the end of Kick's native 350ms `max-height` transition.
- **Bug Fix (Settings Panel Overflow & Cutoff):** Restored positioning overrides (`bottom: 80px !important`, `transform: none !important`) for absolute panels (`#chat-settings-panel`, `#rewards-panel`, `#chat-emotes-picker-panel`, `#chat-command-suggestion-panel`) to prevent Kick's native `-translate-y` from pushing them off-screen in small overlay windows. Adjusted the inner `max-height` clamp to `calc(var(--kick-ext-overlay-h) - 180px)` and `- 150px` to ensure the header and chat top handle never get clipped.
- **Bug Fix (Gift Shop Small Height):** Separated the `relative` `#gift-shop-panel` from the absolute positioning overrides. Removed its rigid height constraints and instead applied a gentler clamp (`- 130px`) to its inner scroll container, allowing it to natively fill the available chat input container space via flexbox without overflowing the chat window.
- **Files:** `src/styles/base.css` [MODIFIED]
- **Backup:** BACKUP39_fullscreen_panels_and_colors_fix created.

### 58. Color Themes Engine (Burgundy & Rainbow), Settings Layout & Feature UI Theme Integration
// [REMOVED - Theme feature removed on 2026-07-27] Expanded `window.KickExt.theme` to support solid Burgundy (`#800020`) and vibrant Rainbow themes along with Silver and Default Green. Integrated SVG logos (`images/kick-logo-burgundy.svg` and `images/kick-logo-rainbow.svg`) and dynamic control recoloring.
// [REMOVED - Theme feature removed on 2026-07-27] Updated Brand Color options to a full-width 4-column grid layout (`Green`, `Silver`, `Burgundy`, `Rainbow`), preventing overflow in toolbar popup and text wrapping in settings panel. Switches, toggles, slider thumbs, and active button states dynamically inherit active theme styling.
// [REMOVED - Theme feature removed on 2026-07-27] Added `--ke-accent` and `--ke-accent-text` CSS variables to `setTheme()`, connecting Quick Clipboard buttons/checkboxes (`quickClipboard.js`) and Coop Stream prompt buttons (`coopWindow.js`) to active theme colors with zero functional logic changes.
// [REMOVED - Theme feature removed on 2026-07-27] Fixed mention message left-border highlights in Rainbow theme using `@keyframes ke-rainbow-border` color-cycling animation (4s linear loop), preserving Kick's native rounded corners (`rounded-lg` / `border-radius: 0.5rem`) without `border-image` clipping issues.
// [REMOVED - Theme feature removed on 2026-07-27] Added inline style selectors `[style*="rgb(83, 252, 24)"]` and `[style*="53fc18"]` to `SELECTORS_RGB` and theme CSS overrides in `content.js` so search/category autocomplete match highlights dynamically inherit active theme colors instead of staying native Kick green.
- **Files:** `src/content/content.js` [MODIFIED], `src/features/chatSettingsInjector.js` [MODIFIED], `src/features/quickClipboard.js` [MODIFIED], `src/features/coopWindow.js` [MODIFIED], `src/styles/base.css` [MODIFIED], `src/popup/popup.html` [MODIFIED], `src/popup/popup.js` [MODIFIED], `src/popup/popup.css` [MODIFIED], `images/kick-logo-burgundy.svg` [NEW], `images/kick-logo-rainbow.svg` [NEW], `manifest.json` [MODIFIED]
- **Backup:** BACKUP37(color_themes_and_fixes) updated and renamed.

### 57. CSS Deduplication & Friends Highlight Debounce Refactor
- **Bug Fix & Cleanup (`base.css`):** Removed duplicated CSS block (older CRLF version) from `src/styles/base.css`, ensuring each rule exists only once while preserving newer selectors (`circle[cx="3"]...`). Normalized all line endings to LF.
- **Performance Optimization (`friendsHighlight.js`):** Refactored MutationObserver lifecycle and `sharedBodyObserver` subscription to prevent excessive full-chat rescans (`fhApplyHighlights`) on every DOM mutation.
  - Added `fhObservedChatRoom` state tracking and `fhRestartTimer`.
  - Implemented `fhScheduleObserverRestart(force)` with a 300ms debounce window matching `mentionSound.js`.
  - Non-forced restarts only re-initialize when the `#channel-chatroom` DOM element actually changes.
- **Files:** `src/styles/base.css` [MODIFIED], `src/features/friendsHighlight.js` [MODIFIED]
- **Backup:** BACKUP36(claude_fix_bridge_fs_fh) created.

### 56. Coop Stream Window, Quick Clipboard, Fullscreen & Blur Fixes
- **Feature (Coop Stream Window):** Added a floating, draggable, and resizable Co-op Stream Window feature (`Alt+N`) allowing users to watch multiple streams or co-op broadcasts simultaneously within Kick.
- **Feature (Quick Clipboard):** Implemented and refined the Quick Clipboard feature (`src/features/quickClipboard.js`), enabling fast copy/paste of frequently used text, emotes, or commands directly in chat.
- **Bug Fixes (Fullscreen & Blur):**
  - Fixed Fullscreen Chat functionality and overlay transitions.
  - Fixed Blur setting refresh so background blur intensity changes update immediately without requiring a page reload.
- **Files:** `src/features/coopWindow.js` [NEW], `src/features/quickClipboard.js` [MODIFIED], `src/features/fullscreen.js` [MODIFIED], `src/features/chatSettingsInjector.js` [MODIFIED], `manifest.json` [MODIFIED]
- **Backup:** BACKUP32(coop_stream_window_clipboard_blur_and_fullscreen_fixes) created.

### 55. Quick Clipboard Feature
- **Feature:** Added Quick Clipboard feature for storing and inserting quick chat snippets.
- **Backup:** BACKUP31(quick_clipboard) created.

### 54. Shared Observer & Sound Duration Optimization
- **Optimization:** Improved shared MutationObserver logic and refined mention notification sound duration.
- **Backup:** BACKUP30(shared_observer_and_sound_duration) created.

### 53. Mention Sound Replay Fix
- **Fix:** Fixed mention sound replay issues during chat updates.
- **Backup:** BACKUP29(mention-sound-fix-new) created.

### 52. Command Transparency
- **Feature:** Added transparency handling for chat commands and overlays.
- **Backup:** BACKUP28(command_transparency) created.

### 51. Mention Sound Double Play Fix
- **Fix:** Prevented double triggering of mention sound notifications on message render.
- **Backup:** BACKUP27(mention_sound_double_play_fix) created.

### 50. Adjusting Light Blur Intensity
- **Feature:** Reduced the intensity of the "Light" blur effect in the extension's settings by half, changing the value from `2px` to `1px` across all relevant configuration files to make the background blur more subtle.
- **Files:** `src/features/chatSettingsInjector.js` [MODIFIED], `src/styles/base.css` [MODIFIED], `src/utils/settings.js` [MODIFIED]
- **Backup:** BACKUP26(light_blur_intensity) created.

### 49. Fullscreen Profile Banner & Project Structure Clean-up
- **Feature:** Added support for viewing full-sized profile banners within the fullscreen chat overlay. Ensures banners are displayed correctly with proper scaling, z-index, and close behavior inside the overlay.
- **Organization:** Consolidated project structure by moving all legacy backup folders (`BACKUP1` through `backup24(profile_banner)`), temporary scripts, and old artifacts into a single `_archive` directory. The root directory is now clean, containing only active source code (`src/`), assets (`icons/`), logs (`Log/`), and `manifest.json`.
- **Files:** `src/features/fullscreen.js` [MODIFIED], `src/styles/base.css` [MODIFIED]
- **Backup:** BACKUP25(clean_structure_and_banner) created.

### 48. Performance Optimization & Mention Sound Replay Fixes
- **Feature:** Refactored multiple extension features to achieve minimal CPU and rendering overhead, and fixed the mention sound playing repeatedly during scroll or show/hide transitions.
- **Optimizations implemented:**
  - **Tighter Observers:** MutationObservers in `mentionSound.js`, `friendsHighlight.js`, and `chatSettingsInjector.js` now observe only the `#channel-chatroom` container directly instead of the entire `document.documentElement`.
  - **Dynamic Reconnects:** Implemented a lightweight body-level observer using the global `createObserver` hook to disconnect the old observer and attach a fresh one when the `#channel-chatroom` container is dynamically recreated (stream navigation, fullscreen toggles, show/hide chat).
  - **No Polling:** Replaced the 500ms `setInterval` polling in `fullscreen.js` with a MutationObserver on style attributes to detect changes to Kick's CSS variables, avoiding layout thrashing.
  - **Cached Layout Reads:** Cached parent bounding rects on `mousedown` in `draggable.js` to avoid calling `getBoundingClientRect()` on every `mousemove` frame.
  - **Passive Listeners:** Registered interaction/scroll listeners with `{ passive: true }` to prevent UI thread blocking.
  - **Cleaned Logs:** Removed high-frequency `console.log` statements from transparency and layout adjustments.
- **Sound Replay Fixes:**
  - Added scroll-based sound suppression: Registered capturing scroll listeners on `window` to disable sounds for 1000ms during/after scrolling, preventing old mentions from replaying when scrolled back into view.
  - Added quiet window: Reset the 3-second quiet timer (`msInitializedTime`) whenever the chatroom is recreated, preventing sound trigger during show/hide or navigation history loads.
- **Files:** `src/features/mentionSound.js` [MODIFIED], `src/features/fullscreen.js` [MODIFIED], `src/features/draggable.js` [MODIFIED], `src/features/chatSettingsInjector.js` [MODIFIED], `src/features/friendsHighlight.js` [MODIFIED]
- **Backup:** BACKUP23(optimalizace) created.

### 47. Sound on Mention/Reply
- **Feature:** Added a "Sound on Mention/Reply" notification feature that plays a soft beep sound when the user gets mentioned or replied to in chat.
- **UI Integration:** Added a toggle "Sound on Mention/Reply" in both the Extension Popup (`popup.html`/`popup.js`) and the in-chat Extension Settings panel (`chatSettingsInjector.js`).
- **Technical approach:**
  - Implemented in `src/features/mentionSound.js` using a custom `MutationObserver` on the chatroom container to detect new messages.
  - Used Web Audio API's `AudioContext`, `OscillatorNode`, and `GainNode` to play a synthesized sound (rising sine wave from 600Hz to 1200Hz over 0.2s, with smooth gain ramping) to avoid needing external audio files.
  - Implemented duplicate prevention using a persistent memory set (`msPlayedIds`) of message IDs (based on metadata or text fingerprint) to avoid double playing when elements are re-rendered/re-loaded.
  - Integrates with the storage key `enableMentionSound` for cross-context synchronization.
- **Files:** `src/features/mentionSound.js` [NEW], `src/popup/popup.html` [MODIFIED], `src/popup/popup.js` [MODIFIED], `src/features/chatSettingsInjector.js` [MODIFIED], `manifest.json` [MODIFIED]
- **Backup:** BACKUP22(mention_sound) created.

### 46. Fullscreen Quick Mod Actions Fix & Extra Small Font Option
- **Bug 1 (Mod Actions):** "Quick Mod Actions" toggle in Kick did not work when the chat was in fullscreen mode. The CSS variable (`--chatroom-mod-actions-display`) that Kick uses to show/hide the mod buttons was applied to the original chat wrapper, which was left behind when the chat was moved to the fullscreen overlay.
- **Fix 1:** Implemented a sync mechanism (`syncModActionsDisplay`) in `fullscreen.js` that checks the original chat wrapper (`placeholder.parentElement`) for the CSS variable using `getComputedStyle` and mirrors it to `#kick-ext-chat-overlay` every 500ms. This restores full mod action functionality in the fullscreen overlay.
- **Feature 2 (Extra Small Font):** Added support for an "Extra Small Font" option specifically for fullscreen chat. When triggered, it adds the `kick-ext-extra-small-font` class to the body, which reduces message padding to 1px, forces text to 11px (below Kick's native 12px limit), and shrinks badges and emotes to match.
- **Files:** `src/features/fullscreen.js` [MODIFIED], `src/styles/base.css` [MODIFIED]
- **Backup:** BACKUP21(modfix_smallfont) created. 1.0 release folder updated.

### 45. Chat Settings Panel — Header Visibility Fix (Height Clamp & Flexbox Layout)
- **Bug:** When the fullscreen chat overlay height was small, the settings panel's header containing the "Back" and "Close" buttons was cut off and hidden.
- **Cause:** The settings panel container (`.bg-surface-base`) lacked `overflow: hidden` and flexbox wrapping constraint, causing the entire container (including the header) to scroll out of view when content overflowed, or overflow the top of the chat container.
- **Fix:**
  - Added `#chat-settings-panel { bottom: 80px !important; }` to position the panel stably above the input toolbar.
  - Configured `.bg-surface-base` with `display: flex !important; flex-direction: column !important; overflow: hidden !important;` to lock the header pinned to the top of the settings panel.
  - Set the scrollable content area `.min-h-0.flex-1.overflow-y-auto` to `flex: 1 1 0% !important; min-height: 0 !important;` to make it the only scrollable element.
- **Files:** `src/styles/base.css` [MODIFIED], `1.0/src/styles/base.css` [MODIFIED], `BACKUP19(fixed_all_hopefully)/src/styles/base.css` [MODIFIED]
- **Backup:** BACKUP19(fixed_all_hopefully) and 1.0 release folder updated.

### 44. Reverted to BACKUP17(ghost_mode)
- **Action:** Reverted the entire workspace `src` folder and root `manifest.json` back to the state in `BACKUP17(ghost_mode)`.
- **Reason:** Reverted per user request to resolve visual/logic conflicts, remove the Friends Highlight feature, and start clean from the Ghost Mode overlay baseline.
- **Lost from BACKUP17(highlights):**
  - **Friends Highlight feature:** Gold box-shadow overlay and username extraction (`friendsHighlight.js`), storage keys (`friendUsernames`), tag-based settings UI in the popup and in-chat panel, and CSS classes/selectors (`.kick-ext-friend-msg`).
  - **Enable Fullscreen Chat Toggle:** Setting option (`enableFullscreenChat`), keyboard shortcut (`Alt+F`), and real-time transition hooks in `fullscreen.js` and `chatSettingsInjector.js`.
  - **Keyboard Shortcuts (Alt+F, Alt++, Alt+-)**: Fullscreen opacity control (+/- 10%) and toggle shortcuts.
  - **Shortcuts UI Panel:** The `Shortcuts (Fullscreen)` guide section at the bottom of the popup window.
- **Backup Status:** Current state matches `BACKUP17(ghost_mode)`. `BACKUP17(highlights)` remains preserved in case recovery is needed.

### 43. Friends Highlight
- **Feature:** Added a "Friends Highlight" feature allowing users to specify a list of usernames. Messages from these users in chat are highlighted with a subtle gold box-shadow outline.
- **UI Integration:** Integrated into the popup settings and the in-chat "Extension Settings" menu. Users can add or remove friends from the list via a tag-based UI.
- **Persistence & Sync:** Friends list is saved to `chrome.storage.local`. Changes in the popup instantly sync with the content script via message passing and apply highlights immediately without needing a page refresh.
- **Technical approach:**
  - Uses `MutationObserver` (`fhChatObserver`) to watch for new messages and extract the username by selecting the `<button class="inline font-bold" data-prevent-expand="true">` element.
  - Applies a `.kick-ext-friend-msg` CSS class to the `.group.relative` message row.
  - Used `box-shadow: inset 0 0 0 1px rgba(232, 200, 74, 0.55)` instead of `outline` to prevent clipping caused by Kick's `overflow: hidden` on chat containers.
  - Prefixed all identifiers in `friendsHighlight.js` with `fh` to avoid global namespace collisions with other content scripts (e.g., `chatSettingsInjector.js`).
- **Files:** `src/features/friendsHighlight.js` [NEW], `src/features/chatSettingsInjector.js` [MODIFIED], `src/styles/base.css` [MODIFIED], `src/popup/popup.html` [MODIFIED], `src/popup/popup.js` [MODIFIED], `src/content/content.js` [MODIFIED], `manifest.json` [MODIFIED], `src/utils/settings.js` [MODIFIED]
- **Backup:** BACKUP17(highlights) created

### 42. Ghost Chat Mode (Click-Through Overlay)
- **Feature:** Added a "Ghost Chat Mode" (click-through overlay) to the fullscreen chat overlay. This allows users to make the overlay click-through and semi-transparent, so they can watch the stream and interact with elements behind the chat while keeping the chat visible.
- **Icon / Trigger:** A ghost icon button (`#kick-ext-ghost-btn`) is added to the top-right of the drag handle bar. Clicking it toggles ghost mode. A keyboard shortcut `Alt+G` also toggles it (only active when in fullscreen).
- **Technical approach:**
  - Toggles the `.kick-ext-ghost-mode` class on the `#kick-ext-chat-overlay` container.
  - Applying this class sets `pointer-events: none` on the overlay, making it click-through, and drops the opacity to `0.45` (hovering over it increases opacity to `0.65` for readability).
  - Explicitly overrides `pointer-events: auto` on the drag handle (`#kick-ext-chat-handle`) and the ghost button itself, so the user can drag it, hover over it, and click the ghost button to disable the mode.
  - Reset: exiting fullscreen automatically disables ghost mode (`isGhostMode = false`) to prevent starting in ghost mode next time.
- **Files:** `src/features/fullscreen.js` [MODIFIED], `src/styles/base.css` [MODIFIED]
- **Backup:** BACKUP17(ghost_mode) created

### 41. Native Chat Settings Menu Integration & Extension Settings Panel
- **Feature:** Added native integration for extension settings. A new "Extension Settings" option is injected into Kick's native Chat Settings panel (`#chat-settings-panel`). Clicking this option transitions the panel into a custom settings view with a back button, featuring an opacity slider, chat position toggle, hide switches (Leaderboard, Moderation Bar, Fullscreen Header, User Info), and a position reset button.
- **Scope:** Accessible in both normal mode and fullscreen overlay mode.
- **Technical approach:**
  1. Used a `MutationObserver` to watch for the mounting of Kick's chat settings panel.
  2. Injected the "Extension Settings" list item safely.
  3. Replaced panel content dynamically upon click, preserving the original panel elements for clean restoration when clicking the back button.
  4. Added a CSS height clamp rule (`max-height: clamp(...)`) to prevent the panel from overflowing and covering the chat input toolbar when the overlay chat size is small.
  5. Scopes modifications to prevent duplicate injection using the `data-kick-ext-injected` guard attribute.
- **Bug Fix:** Fixed `base.css` encoding issues (was saved as UTF-16, now UTF-8 without BOM) which caused "Could not load file for content script" manifest errors.
- **Files:** `src/features/chatSettingsInjector.js` [NEW], `src/styles/base.css` [MODIFIED], `manifest.json` [MODIFIED]
- **Backup:** BACKUP (oldest backup) updated

### 40. 7TV Emote Menu — Button Coverage Fix (CSS Variable Scope + Clamp Formula)
- **Bug:** At medium overlay sizes (~300px) and especially when the overlay was positioned near the top of the screen, the 7TV emote menu covered the emote toggle button in the input toolbar.
- **Root cause 1 — CSS variable not cascading:** `--kick-ext-overlay-h` was set on `#kick-ext-chat-overlay`, but `#seventv-root` (where the menu lives) is a **sibling**, not a child. CSS custom properties only cascade downward (parent → child), so `#seventv-root` always saw the fallback `65vh` instead of the real overlay height. The `clamp()` formula was effectively ignored.
- **Root cause 2 — Clamp minimum too high:** Even with a correct variable, `clamp(220px, ...)` forced the menu to at least 220px. For a 300px overlay, the safe max is ~195px (overlay minus input area), so 220px overflowed and covered the button.
- **Fix 1:** `--kick-ext-overlay-h` is now set on `document.documentElement` (`<html>`) — the shared ancestor of both siblings — so it cascades correctly to all elements.
- **Fix 2:** Clamp updated to `clamp(60px, calc(var(--kick-ext-overlay-h, 65vh) - 105px), 360px)`. The `105px` subtraction (input ~90px + handle 12px + buffer) ensures the menu can never reach the toggle button regardless of overlay position. Removed the separate `body.kick-ext-emote-compact` max-height override — the formula now scales automatically at all sizes.
- **Files:** `src/styles/base.css`, `src/features/fullscreen.js`, `src/features/resizable.js`
- **Backup:** BACKUP16(fixed_emoteMenu_claude) updated

### 39. Fix 7TV Emote Preview Tooltip — Stale Fullscreen Position
- **Bug:** After exiting fullscreen, the 7TV emote hover preview (tooltip) appeared at the position it had during fullscreen. It showed correctly once, then stopped working entirely.
- **Root cause:** 7TV controls tooltip visibility via an `active` attribute (`active="true"/"false"`) managed by Vue reactivity — NOT via `display`. Previous fix set `display: none` which desynced Vue's internal state: 7TV set `display: block` on first hover (overriding ours), but on mouseleave it didn't clean up the conflicting inline style → second hover never worked.
- **Fix:** Do NOT touch `display` at all. Instead, reset `left` and `top` to `-9999px` on the tooltip container when exiting fullscreen. Stale coordinates are pushed off-screen invisibly, and 7TV's JS overwrites them with correct values on the next emote hover naturally.
- **Files:** `src/features/fullscreen.js`
- **Backup:** BACKUP16(fixed_emoteMenu_claude) updated

### 38. ResizeObserver Loop Errors — Filtered from Debug Console
- **Bug:** Debug console was spammed with `ResizeObserver loop completed with undelivered notifications` errors after the emote menu CSS was applied.
- **Cause:** These are a harmless browser-level quirk, not actual extension errors. They were triggered by external scripts (7TV, Kick) and captured by our global `error` event listener.
- **Fix:** Added early-return filter in the `window.addEventListener('error', ...)` handler in `bridge.js` to silently skip any error whose message contains `'ResizeObserver loop'`.
- **Files:** `src/content/bridge.js`
- **Backup:** BACKUP16(fixed_emoteMenu_claude) updated

### 37. 7TV Emote Menu — Compact Mode for Small Chat Overlay
- **Feature:** When the fullscreen chat overlay is resized to a small height (< 360px), the 7TV emote menu now enters compact mode: it caps at 220px total height, and the header (provider tabs + search bar) stays pinned via `position: sticky` while the emote grid scrolls underneath. At normal overlay sizes, the menu scales naturally between 220–500px using a CSS `clamp()` based on the `--kick-ext-overlay-h` CSS variable.
- **Technical approach:** Avoided `display: flex` override (it triggered ResizeObserver loops in 7TV's internal watchers). Instead used `overflow-y: auto` on `.seventv-emote-menu` + `position: sticky; top: 0` on `.seventv-emote-menu-header` — clean and non-invasive.
- **JS:** `body.kick-ext-emote-compact` class is toggled in real time during resize (`resizable.js`) and initialized on fullscreen entry / cleaned up on exit (`fullscreen.js`). Threshold: overlay height < 360px.
- **CSS variable:** `--kick-ext-overlay-h` is set on `#kick-ext-chat-overlay` element directly so CSS `clamp()` can use it.
- **Files:** `src/styles/base.css`, `src/features/resizable.js`, `src/features/fullscreen.js`
- **Backup:** BACKUP16(fixed_emoteMenu_claude) updated

### 36. 7TV Emote Menu Fullscreen Toggle Fix
- **Action:** Fixed the critical bug where the 7TV emote menu would break (its trigger button stopped responding completely) after opening it in fullscreen chat, closing it, and then exiting fullscreen mode.
- **Cause:** 7TV uses Vue 3 Teleport. When we were moving individual `.floating-container` elements into our chat overlay and back, Vue's internal virtual DOM node tracker lost trace of them. When the menu closed, Vue attempted to run `removeChild` on the original parent (`#seventv-root`) which no longer had it, triggering an unhandled exception that broke all subsequent 7TV clicks.
- **Fix:** 
  1. Instead of moving individual `.floating-container` children, we now move the entire `#seventv-root` element (the Vue app mounting point) into the fullscreen chat overlay on fullscreen entry, and restore it to `document.body` on exit. This keeps all Vue vnodes and teleports completely intact.
  2. DOM operation proxies (`removeChild`, `insertBefore`, `replaceChild`) in `bridge.js` were improved to safely restore parents before proceeding, preventing further DOM structure mismatches.
  3. Added high z-index overrides in `base.css` (`z-index: 100000000 !important`) scoped under `:fullscreen #seventv-root` and its `.floating-container` children to ensure the emote menu always displays on top of the transparent chat overlay.
- **Files:** `src/content/bridge.js`, `src/features/fullscreen.js`, `src/styles/base.css`
- **Backup:** BACKUP16(fixed_emoteMenu_claude)

### 35. Backup Before Autocomplete Fix
- **Action:** Created backup of current state before working on autocomplete fix (Gemini).
- **Backup:** BACKUP15(autocomplete_fix_gemini)

### 34. Performance: 7TV Observer Optimization
- **Action:** Optimalizace `observe7TV()` — největší žrout zdrojů v celém projektu.
- **Původní stav:** `MutationObserver` na `document.body` se `subtree: true` běžel celou dobu, i mimo fullscreen. Každá DOM mutace na Kick.com (chat zprávy, animace) ho spouštěla.
- **Oprava:**
  1. **Lazy start/stop** — observer se spouští jen při vstupu do fullscreen (`start7TVObserver()`), zastavuje při exitu (`stop7TVObserver()`).
  2. **Filtrování v callbacku** — `is7TVNode()` kontroluje jestli přidaný node obsahuje `seventv-*` třídy, `floating-container`, nebo `#seventv-tooltip-container`. Chat zprávy pro observer jsou neviditelné.
  3. **Tooltip fix** — `#seventv-tooltip-container` se při exitu z fullscreenu vrací do `document.body` bez `display:none` a bez mazání pozice — 7TV ho sám repositionuje při dalším hover.
- **Files:** `src/features/fullscreen.js`
- **Backup:** BACKUP14(claude_performance_fix)

### 33. Dual Resize Handles + Corner Resize
- **Action:** Přidán kompletní resize systém z levého dolního rohu (šířka + výška) s možností zmenšení až na 75px na výšku. Ponechán i původní bottom-edge resize (pouze výška). Upraven drag handle — odstraněn text "Chat Overlay", zúžen na 12px úchyt s tenkou lištou. Odstraněn `!important` z `width` v CSS pro dynamické nastavení šířky.
- **Files:** `src/features/resizable.js`, `src/features/fullscreen.js`, `src/styles/base.css`, `src/utils/settings.js`
- **Backup:** BACKUP13(fixed_resizable)

### 32. Fix Cursor Position After Fullscreen Exit
- **Action:** Fixed the bug where the cursor jumped to the start of the chat input after exiting fullscreen mode, causing text to be typed at the wrong position.
- **Cause:** `input.focus()` triggered a Kick re-render that reset the cursor position to the beginning.
- **Fix:** After `input.focus()`, explicitly set cursor to end using `setSelectionRange(input.value.length, input.value.length)` for textarea and `Range` + `collapse(false)` for contenteditable divs.
- **Files:** `src/features/fullscreen.js`
- **Backup:** BACKUP12(fixed_preview)

### 29. Fix Opacity Slider & Toggle Buttons Broken by DOM Cleanup
- **Action:** Fixed the opacity slider and toggle on/off buttons (leaderboard, mod bar, user info) that stopped working after aggressive DOM cleanup in `exitFullscreenChat`.
- **Cause:** `querySelectorAll('.floating-container')` was too broad and removed Kick/extension UI elements that also used this class.
- **Fix:** Changed cleanup to only remove elements that explicitly contain 7TV-specific classes (`seventv-emote-menu`, `seventv-autocomplete-list`). Also added back `originalParents` restoration logic.
- **Files:** `src/features/fullscreen.js`
- **Backup:** BACKUP12(fixed_preview)

### 28. Fix Autocomplete Position Bug After Fullscreen Exit
- **Action:** Fixed the bug where the 7TV emote preview menu remained stuck at fullscreen coordinates and unresponsive after exiting fullscreen mode.
- **Fix:** Changed `exitFullscreenChat` to no longer aggressively remove all 7TV floating containers, which interfered with 7TV's internal state.
- **Logic:** Instead, restore elements to original parents, strip stale inline positioning styles, focus the input, and trigger a native trusted `input` event using `execCommand` to force 7TV to recalculate the position naturally in normal mode.
- **Files:** `src/features/fullscreen.js`
- **Backup:** BACKUP12(fixed_preview) vytvořen

### 27. Hide User Info Toggle (Gifted Sub / User Header)
- **Action:** Přidán nový přepínač "Hide User Info" do popup nastavení, který skryje/zobrazí hlavičku s informacemi o uživateli (gifted sub progress bar, profilovka, jméno) v overlay chatu.
- **CSS Selector:** `.z-absolute.relative.bg-surface-lowest.\!z-[102].overflow-visible.rounded-none.p-2` — cílí na progress bar kontejner s číslem (např. "500").
- **Chování:** Třída `kick-ext-hide-user-info` se přidá/odebere z `<body>` podle toggle stavu. CSS pravidlo v `base.css` skryje element pomocí `display: none !important`.
- **Files:** `src/popup/popup.html`, `src/popup/popup.js`, `src/content/content.js`, `src/styles/base.css`
- **Backup:** BACKUP11(fixed_kicks_gifted) vytvořen

### 26. 7TV Emote Menu — Fix Page Jump Bug in Normal Mode
- **Action:** Opraven bug, kdy kliknutí na 7TV emote tlačítko v normálním (non-fullscreen) režimu způsobilo skok stránky místo otevření menu.
- **Cause:** Globální CSS selektory (unscoped) v `base.css` vynucovaly `position: absolute !important` na všech `.seventv-emote-menu` prvcích na celé stránce. Mimo overlay to rozbíjelo 7TV normální positioning (menu se pozicovalo relativně k neočekávanému rodiči), což způsobovalo skok stránky.
- **Fix:** Všechny 7TV pozicovací CSS rulety (lines 321-345) jsou nyní scoped pod `#kick-ext-chat-overlay`, takže neovlivňují normální režim.
- **Files:** `src/styles/base.css`
- **Backup:** BACKUP10(fixed_reply_hover_still_blur) aktualizován

### 25. Performance & Dynamic Opacity Overhaul
- **Action:** Kompletní optimalizace výkonu a sjednocení CSS pro panely a hover efekty.
- **Dynamics Opacity:** V `transparency.js` přidána podmínka — pod 50 % opacity chatu dostávají panely boost +45 %, nad 50 % jen +25 % (proměnná `--kick-ext-panel-alpha`).
- **Blur Optimalizace:** Snížen blur ze 8-10px na jednotných 6px u všech panelů. Přidáno `will-change: backdrop-filter` pro lepší GPU plánování.
- **Sjednocení CSS:** Všechny panely (emote picker, settings, mention, rewards, 7TV, autocomplete, chat paused button) sloučeny do jednoho CSS bloku.
- **Odstraněn `backdrop-filter` z hoveru:** `backdrop-filter` způsoboval ghosting (zpožděné mizení hover efektu). Hover zpráv teď používá jen `background-color` — okamžité, bez GPU prodlevy.
- **Barva hoveru:** Upravena z `rgba(120, 120, 120, 0.18)` na `rgba(30, 30, 30, 0.45)` pro lepší viditelnost.
- **Files:** `src/styles/base.css`, `src/features/transparency.js`
- **Backup:** BACKUP10(fixed_reply_hover_still_blur) aktualizován

### 24. Reply Message Hover Fix - Frosted Glass Effect
- **Action:** Opraven hover efekt u reply zpráv ve fullscreen chatu. Kick u reply zpráv používá wrapper s `div[type="button"]` a třídu `betterhover:group-hover:bg-surface-highest`, která se aktivuje na `group-hover` a dává plnou tmavou barvu. Původní selektor s `>` (direct child) na reply nereagoval.
- **Fix:** Přidány CSS selektory v `src/styles/base.css`, které cílí na reply kontejner `.flex.w-full.min-w-0.shrink-0.flex-col.break-words.rounded-lg` a `.betterhover\:group-hover\:bg-surface-highest` uvnitř `.group.relative`. Při hoveru se nyní aplikuje stejný glass efekt jako u normálních zpráv (`rgba(75,75,75,0.20)` + `backdrop-filter: blur(6px)`).
- **File:** `src/styles/base.css`
- **Backup:** BACKUP10(fixed_reply_hover_still_blur)

### 23. Reverted to BACKUP9.5
- **Action:** Smazán BACKUP10. Current workspace revertnut na BACKUP9.5 (všechny soubory kromě `base.css` byly již identické, `base.css` nahrazen z BACKUP9.5).
- **Důvod:** BACKUP10 měl kompletně přepsaný hover systém na `::before` overlay, který nefungoval konzistentně pro reply zprávy. BACKUP9.5 používá původní glassmorphism hover (`rgba(75, 75, 75, 0.20)` + `backdrop-filter: blur(6px)`) s přímým `background-color` na `.group.relative:hover > .w-full.min-w-0.shrink-0.break-words.rounded-lg`.
- **Ztraceno z BACKUP10:** Mo'Kick kompatibilita, globální z-index vrstvení, 7TV elevation nad toolbar, wildcard `[class*="bg-surface-"]` selektory, CSS proměnné (`--kick-ext-border-alpha`, atd.), žádný `backdrop-filter`.
- **Co zůstává:** Všechny JS soubory, popup, manifest i ostatní featury jsou identické mezi 9.5 a 10.
- **Backup:** BACKUP10 smazán.

### 21. Unified Hover System + Performance Overhaul
- **Action:** Complete rewrite of the message hover system to fix reply message inconsistency and remove all GPU-heavy effects.
- **Hover System:** Replaced direct `background-color` swaps with `::before` pseudo-element overlay layer. Uses `z-index: -1` (behind text) + `z-index: 0` on container (local stacking context). Targets `> div[class*="rounded-lg"]` to unify normal and reply messages.
- **Bug Fixes:** Reply messages (flex container wrapping reply header + content) now hover identically to normal messages. Wildcard `[class*="bg-surface-"]` override catches complex Tailwind variants like `betterhover:group-hover:bg-surface-highest`.
- **Performance:** Removed ALL `backdrop-filter` / `-webkit-backdrop-filter` from overlay, panels, menus, autocomplete, and hover. Replaced with `rgba(8,8,12)` background + border + shadow for fake glass depth.
- **Variables:** Added `--kick-ext-hover-overlay: 0.30` (hover), `--kick-ext-panel-overlay: 0.40` (panels/menus), `--kick-ext-border-alpha`, `--kick-ext-shadow-intensity`. All centralized in `:root`.
- **Transitions:** Reduced to single-property `background-color` / `opacity` at 0.12s–0.15s.
- **Selector Strategy:** Attribute selectors `[class*="..."]` for robust background overrides. `> div[class*="rounded-lg"]` for unified message targeting.
- **File:** `src/styles/base.css`
- **Backup:** BACKUP10 created.

### 20. Glassmorphism Message Hover Effect
- **Action:** Replaced the old `.chat-entry:hover` background rule with a new frosted glass hover effect.
- **Selector:** `#kick-ext-chat-overlay #channel-chatroom .group.relative:hover > .w-full.min-w-0.shrink-0.break-words.rounded-lg`
- **Strategy:** Scoped entirely within overlay + chatroom. Hovers `.group.relative` (message row) and styles the inner message bubble via direct child combinator. Chains Tailwind utility classes to uniquely target only the message container — avoids affecting action buttons, menus, or unrelated rounded elements.
- **Visuals:** `rgba(75, 75, 75, 0.20)` (light gray, not black) + `backdrop-filter: blur(6px)` + `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06)`. Smooth 0.25s transition. `z-index: 2` prevents virtualization flicker.
- **File:** `src/styles/base.css`
- **Backup:** BACKUP9.5 created.

### 19. Reverted Gifted Sub Notification Rule
- **Action:** Removed the `#kick-ext-chat-overlay #channel-chatroom .bg-surface-base:not(button)` rule (gifted sub blur + darkening) and restored current `base.css` from BACKUP9.
- **Reason:** User decided to scrap this addition.
- **Status:** Current codebase is now identical to BACKUP9.

### 18. Chat Paused Button Transparency
- **Action:** Applied the 40% opacity boost + blur(8px) to the "Chat paused for scrolling" button inside the overlay.
- **Selector:** `#kick-ext-chat-overlay #channel-chatroom button.bg-surface-base`

### 17. Overlay Background Blur
- **Action:** Added subtle `backdrop-filter: blur(2px)` to the overlay container (`#kick-ext-chat-overlay`) to softly blur the page/stream background behind the transparent chat.
- **Note:** Blur is visible thanks to the existing `rgba(10, 10, 10, var(--kick-ext-bg-alpha))` semi-transparent background. Normal Kick chat is not affected.

### 16. Rewards Panel Transparency Fix
- **Action:** Applied the 40% opacity boost logic to the `#rewards-panel` to ensure consistency with other overlay panels.
- **Implementation:** Added CSS rule in `base.css` to override default background with `rgba(10, 10, 10, var(--kick-ext-bg-alpha) + 0.40)`.

---

### 15. Backup Synchronization
- **Action:** Synchronized BACKUP9 with the latest codebase changes (content.js, popup.js, base.css).
- **Status:** BACKUP9 is now up-to-date with the current development state.

---

## 🚀 Recent Changes & Important Updates


### 17. Friends Highlight Feature & User Card Toggle (BACKUP19)
- **Problem:** Users want to mark/designate certain chatters as "friends" and see their messages outlined, but this can clash with Kick's default green border highlight for mentions (leading to double-borders or visual overlapping).
- **Solution:** 
    - Created a new script [friendsHighlight.js](file:///c:/Users/savag/Desktop/KickExtension/src/features/friendsHighlight.js) that handles friend list storage via `chrome.storage.local` (key: `friendUsernames`, case-insensitive array).
    - Implemented a `MutationObserver` on the entire document root (`document.documentElement`) to watch for both new chat messages and portal popups.
    - Highlights friend messages with a `1px dashed rgba(255, 255, 255, 0.4)` border on their actual `div.rounded-lg` bubble container.
    - If a friend's message is a mention (which has Kick's native green solid border), the dashed highlight is completely suppressed (removed) both in JavaScript (class toggle check) and CSS overrides, ensuring zero visual conflict or overlap.
    - Injected a custom **star toggle button** next to the Follow button in Kick's native User Card profile popup. Clicking the star toggles the friend status (gold filled star for friends, white outline for non-friends) in real-time.
    - Injected a temporary **Manage Friends (Temp)** control section inside the Extension Settings panel for manual add/remove/list operations.
    - Registered `src/features/friendsHighlight.js` in [manifest.json](file:///c:/Users/savag/Desktop/KickExtension/manifest.json).

### 14. Moderation Bar Toggle Support
- **Problem:** Moderátoři (nebo uživatelé s nainstalovaným rozšířením Mo'Kick) mají v chatu zobrazenou lištu s moderátorskými tlačítky (např. kouzelná hůlka, koš, bublina, trychtýř), která v překryvném chatu (overlayi) zabírá vertikální místo, i když zrovna nemoderují.
- **Solution:** 
    - Přidal jsem novou možnost do nastavení rozšíření (popupu): **Hide Moderation Bar**.
    - Přidal jsem nastavení `hideModerationBar` (výchozí `false`) do `DEFAULT_SETTINGS` v [settings.js](file:///c:/Users/savag\Desktop\KickExtension\src\utils\settings.js).
    - Vytvořil jsem nový CSS selektor v [base.css](file:///c:/Users/savag\Desktop\KickExtension\src\styles\base.css#L214-L217), který skrývá tuto lištu (třída `.flex.items-center.justify-evenly.border-b-2`) uvnitř overlaye, pokud je na `body` aplikována třída `kick-ext-hide-mod-bar`.
    - Propojil jsem uložení, změnu a inicializaci nastavení v popupu (`popup.html` / `popup.js`) s chováním v content skriptu (`content.js`), kde se třída na body okamžitě mění na základě volby uživatele.

### 13. Settings Sync & Startup Bug Fix
- **Problem:** Po načtení stránky (zejména na úvodní stránce kick.com nebo při SPA navigaci) byla průhlednost chatu ignorována a chat zůstal 100% neprůhledný (plný), ačkoliv v nastavení (popupu) ukazoval slider správnou uloženou hodnotu (např. 36 %). Bylo to způsobeno tím, že inicializace průhlednosti čekala na element chatu (`waitForElement`), což na stránkách bez chatu selhalo (timeout 10s) a kód se již nespustil.
- **Solution:** 
    - Zcela jsem odstranil nespolehlivý 10sekundový timeout blok s `waitForElement`.
    - Průhlednost se nyní aplikuje **okamžitě** při načtení skriptu přímo na root dokumentu (`document.documentElement`), což funguje bez ohledu na to, zda chat již existuje, nebo na jaké stránce se nacházíme.
    - Přidal jsem parametr `saveToStorage` (výchozí `true`) do `setChatTransparency()`. Při startu voláme `setChatTransparency(value, false)`, což zabraňuje zbytečnému přepisování/ukládání stejné hodnoty do Chrome úložiště na každém loadu.
    - Sjednotil jsem aplikaci `hideLeaderboard` třídy na body hned při startu.

### 12. Overlay Transparency & Contrast Alignment (40% Opacity Boost)
- **Problem:** Panel zmiňování uživatelů (`#chat-mention-panel`), Gift Shop panel (`#gift-shop-panel`) a 7TV našeprávač/menu (`.seventv-autocomplete-list` / `.seventv-emote-menu`) měly nevhodná pozadí – buď byly zcela průhledné (splývaly s chatem), nebo byly zcela tmavé bez ohledu na nastavenou průhlednost chatu.
- **Solution:** 
    - Přidal jsem tyto prvky do pravidel ztmavení v [base.css](file:///c:/Users/savag/Desktop/KickExtension/src/styles/base.css#L184-L191).
    - Sjednotil jsem jejich offset průhlednosti na **40 %** (`+ 0.40`), což zajišťuje optimální kontrast a plnou čitelnost textu i prvků nad částečně průhledným chatem.

### 11. Unified Transparency & Background Fix
- **Problem:** Message input area appeared darker than the rest of the chat overlay even at the same opacity level. This was caused by overlapping background layers (stacking) and slightly different base RGB values (10,10,10 vs 20,20,20).
- **Solution:** 
    - Sjednotil jsem základní barvu pozadí na `rgba(10, 10, 10, ...)`.
    - Nastavil jsem všechny vnitřní kontejnery Kicku (`#channel-chatroom`, `.bg-surface-lowest`, atd.) na `background-color: transparent !important`.
    - Průhlednost se teď aplikuje pouze jednou na hlavní kontejner overlaye, čímž se eliminovalo ztmavnutí způsobené vrstvením a barva je nyní dokonale konzistentní v celém okně chatu.

### 1. Transparency Support
- **What:** Chat overlay background is now transparent without affecting text/emotes.
- **How:** Uses `setChatTransparency(0-100)` which controls the `--kick-ext-bg-alpha` CSS variable.
- **Implementation:** Custom `rgba()` overrides for Kick's internal background classes (`bg-surface-lowest`, etc.).

### 2. Draggable Overlay
- **What:** The chat can be moved anywhere on the screen via a handle.
- **Handle:** Top bar with "Chat Overlay" title and green status icon.
- **Clamping:** Automatically stays within the viewport boundaries.
- **Persistence:** Position (`posX`, `posY`) is saved to `chrome.storage.local`.

### 3. Clean Fullscreen Chat (Leaderboard Hide)
- **What:** The "Top Gifted / Leaderboard" header is automatically hidden when in fullscreen mode to save space.
- **Scope:** This only affects the floating overlay; the normal chat leaderboard remains visible.

### 4. Vertical Resizing
- **What:** Ability to change the height of the chat overlay by dragging its bottom edge.
- **Handle:** A subtle resize bar at the bottom that lights up on hover.
- **Persistence:** Height is saved to `chrome.storage.local`.
- **Reset:** `window.KickExt.resetChatPosition()` also resets the height to default.

### 5. 7TV & Autocomplete Support (Fullscreen)
- **Problem:** External menus (7TV, BTTV, Kick Native) are hidden during browser fullscreen.
- **Solution:** 
    - **Portals:** A `MutationObserver` teleports menus and autocomplete lists into the overlay.
    - **Autocomplete:** Monitoring of chat input to show/hide the autocomplete menu (triggered by `:`).
    - **Stuck Menu Fix:** Added a visibility check (`getComputedStyle`) to prevent hidden elements from being re-moved by the observer.
    - **Aggressive Cleanup:** Added input listeners (Backspace/Delete) to force-hide the menu when the trigger character is deleted.
    - **Emote Preview Tooltip:** Teleportation of `#seventv-tooltip-container` directly into the fullscreen container when active during fullscreen, and restoring it back to `body` on exit. This maintains 7TV's absolute positioning math relative to the viewport while displaying correctly inside the top layer.
- **Technical Safeguard:** Implemented a `removeChild` proxy in `bridge.js` to prevent 7TV/Kick logic from crashing when removing elements that were moved to the overlay.
- **Styling:** Custom CSS positions the autocomplete list specifically above the chat input area with a premium blur effect.

### 6. Layout & Input Fixes
- **Height:** Reduced default height to `65vh` to allow more vertical movement.
- **Flex Fix:** Message list now correctly shrinks when the overlay is small.
- **Input Monitoring:** Dynamic attachment of listeners to the chat input (supports both standard and React-based editors).

### 7. Mo'Kick & Dynamic Tooltips Compatibility
- **Problem:** Dynamic popups, menus, and tooltips (such as Mo'Kick's action button labels like "Copy Text" or Kick's native "Reply" labels) rendered behind our fullscreen overlay due to lower relative z-indices. Because the chat overlay background is transparent, they prosvítaly (protruded behind) the emotes and text instead of appearing in front.
- **Solution:** Added global z-index elevation rules in `base.css` targeting all Radix Portals, Radix Poppers, tippy boxes, and elements containing `mokick` or `mo-kick` inside `.ext-fullscreen-active` or `body`. Elevating them to `z-index: 100000000 !important` ensures they render perfectly in the front-most layer over the overlay.
- **Hover Stacking:** Configured chat rows (`.chat-entry:hover`) to dynamically elevate their z-index (`99 !important`) when hovered, ensuring child tooltips and menus render above neighboring row emotes.

### 8. Automatic Fullscreen System
- **What:** Chat triggers automatically when entering browser fullscreen.
- **Technical:** Attached directly to `document.fullscreenElement`.

### 9. Hide Fullscreen Chat Header Toggle
- **What:** New setting in extension popup to hide the internal chat header bar (back arrow, "Chat" text, grid button) inside the fullscreen overlay.
- **Scope:** Only affects the fullscreen overlay; normal chat is never touched.
- **Implementation:** JavaScript-based detection of the header `div` by its content ("Chat" span) and classes (`border-b-2`, `items-center`, `justify-between`). Uses `MutationObserver` to handle React re-renders.
- **Persistence:** Setting `hideFullscreenChatHeader` saved to `chrome.storage.local`.
- **Toggle:** Works in real-time while fullscreen is active; header is restored on exit.

### 10. 7TV Menu Z-Index Fix & UI Cleanup
- **Problem:** 7TV emote menu rendered behind Kick's input toolbar buttons (hammer, basket, etc.)
- **Solution:** Added global z-index elevation rules in `base.css` targeting `.seventv-emote-menu`, `.seventv-emote-menu-container`, and `.seventv-emote-menu-wrapper` with `z-index: 10000000 !important` and `position: absolute !important`. Additional rules force the toolbar down to `z-index: 1` and give `.seventv-emote-menu` an extreme `z-index: 99999999`.
- **UI Cleanup:** Removed "Chat Height" slider from popup UI and logic per user request.
- **Icon Fix:** Generated placeholder PNG icons (`icon16.png`, `icon32.png`, `icon128.png`) to resolve `Could not load icon` manifest error.
- **Console Spam Fix:** Decoupled transparency style application from DOM mutation observer loop to prevent repeated console logs.
- **Scope:** Affects normal and fullscreen chat modes.

---

## 🛠 Useful Console Commands

| Action | Command |
| :--- | :--- |
| **Set Transparency** | `window.KickExt.setTransparency(50)` |
| **Reset Position** | `window.KickExt.resetChatPosition()` |
| **Toggle Chat Side** | `window.KickExt.layout.toggleChatSide()` |
| **View All Settings** | `window.KickExt.getSettings()` |

---

## 🛠 Project Structure
- `src/features/transparency.js` - Alpha control.
- `src/features/draggable.js` - Mouse move logic.
- `src/features/fullscreen.js` - Overlay orchestration.
- `src/styles/base.css` - Complex CSS overrides.

---

## ⚠️ Notes for Next Steps
- **Snapping:** Not implemented yet.
- **Resizing:** Currently fixed width (`340px`) and fixed height (`65vh`).
- **Mobile/Responsive:** Targeted at desktop browsers.

---

## 📅 June 10, 2026 - Fixes & Tweaks
- **Fullscreen Chat Position (4K Fix):** Fixed an issue where the chat window would remain off-screen when moving from a 4K to a FullHD monitor. Replaced absolute pixel saving with a dynamic `clamp(0px, Xpx, calc(100% - width))` mix in both `draggable.js` and `resizable.js`, which ensures the chat is always visible while remembering the user's preferred position.

---

## 📅 June 25, 2026 - Blur Toggle & Mention Sound Fix
- **Dynamic Blur Control:** Added a new setting `blurLevel` (off, light, full) allowing the user to control the intensity of the chat overlay blur effect. This is linked via CSS variables (`--kick-ext-blur`).
- **Mention Sound Dedup Fix:** Refactored `mentionSound.js` to prevent double-ding issues. Introduced a short-lived cooldown map (2000ms) and checks if the chat is scrolled to the bottom. This prevents the sound from re-playing when browsing chat history while allowing back-to-back genuine mentions.
- **Fullscreen Observer Reconnect:** Added logic to restart the mention sound observer on `fullscreenchange` events, ensuring the notification sound keeps working when the chat is re-parented into the fullscreen overlay.

---

## 📅 June 26, 2026 - Advanced Mention Sound Reliability & Toggle
- **AudioContext & Autoplay Fix:** Completely rewrote the audio playback system in `mentionSound.js` to use the Web Audio API (`AudioContext`). Implemented an audio unlocking mechanism on user interaction (clicks/keypresses) to bypass strict browser autoplay policies that were blocking the notification sound.
- **Robust Message Queueing:** Introduced a queueing and retry system for processing chat rows. This correctly handles Kick's multi-stage DOM mutations (where the `.border-green` class is added *after* the initial row creation), ensuring no mentions are missed.
- **Mention Sound Toggle:** Added a new popup setting `enableMentionSound` to let users completely toggle the notification sound on or off.

---

## 📅 June 28, 2026 - Shared Observer & Mention Sound Duration (BACKUP30)
- **Shared Observer Architecture:** Unified DOM monitoring across features to reduce performance overhead and CPU usage during active chat streams.
- **Sound Duration Control:** Added configuration to customize the duration/clip length of the mention notification sound (`mentionSoundDuration`).

---

## 📅 July 2, 2026 - Quick Clipboard Feature (BACKUP31)
- **Quick Clipboard Panel (`quickClipboard.js`):** Implemented a floating, draggable quick-access panel toggled via `Alt+V` allowing users to save frequently used messages, commands, and snippets.
- **Interactive Snippet Management:** Users can add, edit, delete, and instantly insert/send snippets into the Kick chat input (`#channel-chatroom textarea` and `[contenteditable="true"]`).
- **Dynamic Placeholders & Auto-Send:** Supports custom placeholder variables (`{variable}`) that open an interactive prompt before insertion, alongside a per-snippet toggle for automatic sending upon click.
- **Fullscreen Integration:** Automatically detects browser fullscreen events (`fullscreenchange`) and re-parents the clipboard panel into `document.fullscreenElement` so it stays above chat during live stream viewing.

---

## 📅 July 10, 2026 - Coop Stream Window, Clipboard, Blur & Fullscreen Fixes (BACKUP32)
- **Coop Stream Window Support (`coopWindow.js`):** Added management for co-op stream windows (`#coop-stream-window`), enabling interactive picture-in-picture stream positioning with custom prompts (`cwPrompt`).
- **Clipboard & Blur Adjustments:** Refined background blur styling (`--kick-ext-panel-alpha`) and ensured clipboard panel interactions remain isolated without leaking keydowns/clicks into Kick's global shortcuts.
- **Fullscreen Stability (`fullscreen.js`):** Improved DOM handling and z-index stacking when transitioning between normal and fullscreen modes to prevent overlay flickering and external menu overlap.

---

## 📅 July 17, 2026 - Pinned Message & Fullscreen Profile Banner Fixes (BACKUP33)
- **Fullscreen Pinned Message Fix (`fullscreen.js`):** Resolved an issue where the pinned chat message was incorrectly recognized as a user profile card and offset to the right. Added an explicit exclusion for pinned message containers in the card detection check (`isProfileCard`).
- **Profile Banner Star Injection (`friendsHighlight.js`):** Fixed the missing "friend star" button on user profile cards due to Kick's updated DOM structure and layout.
  - Implemented a polling fallback (every 300ms) to check for card presence, ensuring the star is successfully injected on the first click even when React renders card contents progressively.
  - Enlarged the star icon SVG to 20x20 and optimized button padding to match Kick's new pill-shaped Follow and Mute button styling.
- **Glass Effect on Fullscreen Profile Card (`base.css`):** Scoped the fullscreen profile card background to receive standard glassmorphism blur and transparency settings while maintaining fully opaque content.
- **Backup:** `BACKUP33(fix_profile_banner)` created.

---

## 📅 July 17, 2026 - Quick Clipboard Hover and Click Fixes (BACKUP34)
- **Clipboard Closing on Hover/Mutation Fix (`quickClipboard.js`):** Resolved an issue where the clipboard panel would close automatically when the mouse was moved. Removed the global `#chat-settings-panel` querySelector check in `qcObserverCallback` which closed the clipboard on *any* DOM mutation (such as hover class changes or new chat messages) if the settings panel was in the DOM.
- **Clipboard Closing on Chat Area Click Fix (`quickClipboard.js`):** Replaced the global `#chat-settings-panel` querySelector check in the document `click` listener with localized `e.target.closest` checks. This prevents the clipboard from closing when clicking to focus the chat input or clicking chat messages, while still closing it if the user clicks a button or interacts with the chat settings panel itself.
- **Backup:** `BACKUP34(quick_clipboard_hover_and_click_fixes)` created.

---

## 📅 July 21, 2026 - Burgundy Theme Engine & Vector SVG Integration (BACKUP37)
- **Modular Burgundy Theme Engine (`content.js`):** Extended the extension's theme framework to support a plain, solid Burgundy color palette (`#800020` / `#66001a` hover) across primary action buttons, badges, navigation highlights, SVG stop colors, and borders.
- **Vector SVG Logo Replacement:** Configured Kick's main site header logo to swap to the high-contrast vector `images/kick-logo-burgundy.svg` asset when Burgundy theme is selected. Registered the SVG in `manifest.json` under `web_accessible_resources`.
- **In-Chat & Extension Popup Alignment:** Added the Burgundy option to the Appearance section in both the in-chat settings panel (`chatSettingsInjector.js`) and extension toolbar popup (`popup.html`, `popup.js`, `popup.css`), ensuring instant theme switching and settings synchronization across UI surfaces.
- **Backup:** `BACKUP37(burgundy_theme_and_fixes)` created.

---

## 📅 July 27, 2026 - Navbar Settings Button & 7TV Fixes (BACKUP44)
- **Navbar Settings Injection:** Rewrote `navButtonInjector.js` to place the settings gear icon in Kick's top right navigation bar (next to the profile/7TV section) instead of hijacking the left sidebar collapse button.
- **7TV Svelte Compatibility:** Discovered that immediately appending to Kick's React-managed navbar during initial load crashed 7TV's Svelte application, disabling emote hover tooltips. Added a `setTimeout(..., 2500)` delay to allow frameworks to hydrate safely before inserting the extension's button.
- **UI & Modal Polish:** Removed outdated `cursor: move` drag logic from the settings modal header. Adjusted modal sidebar background transparency to display correctly inside the parent modal blur context. Replaced all emoji icons in the UI with cleaner vector SVGs.
- **Theme Removal:** Completely stripped all old theme features across the codebase (Silver, Burgundy, etc.) per user request, defaulting the UI to a clean, single styling approach.
- **Backup:** `BACKUP44(nav_button_fix)` created.

---

## 📅 July 29, 2026 - Firefox 7TV Stacking & Blur Fixes (BACKUP45)
- **Firefox Nested Blur Bug:** Addressed a critical Firefox rendering bug (Bug 1746241) where elements nested inside a container with `backdrop-filter` fail to render their own blur. Moved the main chat overlay's background and `backdrop-filter` to a pseudo-element (`::before`), allowing the settings panel to successfully apply its own glassmorphism blur in Firefox.
- **7TV Firefox Stacking Fix:** Fixed a Firefox compositor bug (Bug 1606992) where `backdrop-filter` forced 7TV's emote and autocomplete menus to render behind Kick's chat messages due to 3D transforms (`translateY`) on the messages overriding z-index. Created a Firefox-specific exception (`@-moz-document`) to disable `backdrop-filter` on 7TV menus and apply a solid dark background (`#121212`) to guarantee they always stay on top.
- **7TV Root Elevation:** Added global `z-index: 100000000 !important` and explicit fallbacks (`:-moz-full-screen`, `body.ext-fullscreen-active`) for `#seventv-root` to ensure it always renders above the extension's chat overlay regardless of theater mode or native fullscreen status.
- **Backup:** `BACKUP45(firefox_blur_7tv_fix)` created.
