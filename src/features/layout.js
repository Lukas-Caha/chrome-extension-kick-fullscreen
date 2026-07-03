/**
 * Layout Features - Chat Positioning
 */

const CHAT_SIDE_CLASS = 'ext-chat-left';

/**
 * Moves the chat to the left side by adding a class to the body
 */
const moveChatLeft = () => {
  document.body.classList.add(CHAT_SIDE_CLASS);
};

/**
 * Moves the chat back to the original right side
 */
const moveChatRight = () => {
  document.body.classList.remove(CHAT_SIDE_CLASS);
};

/**
 * Toggles the chat side
 */
const toggleChatSide = () => {
  document.body.classList.toggle(CHAT_SIDE_CLASS);
};

// Export to global namespace
window.KickExt = window.KickExt || {};
window.KickExt.layout = {
  moveChatLeft,
  moveChatRight,
  toggleChatSide,
};
