/**
 * Theme Engine (Silver, Burgundy, Rainbow)
 * Injects dynamic theme styles and overrides Kick's brand colors across the page.
 */

window.KickExt = window.KickExt || {};

/**
 * Silver Theme Override
 * Injects a <style> tag directly into the document to override Kick's
 * brand green (#53fc18) with silver, bypassing Tailwind @layer cascade issues.
 * Encapsulated inside window.KickExt.theme to allow toggling it dynamically.
 */
window.KickExt.theme = (() => {
  const SILVER = '#b0b8c4';
  const SILVER_GRADIENT = 'linear-gradient(135deg, #64748b 0%, #94a3b8 25%, #e2e8f0 45%, #94a3b8 65%, #64748b 100%)';
  const SILVER_GRADIENT_HOVER = 'linear-gradient(135deg, #586979 0%, #94a3b8 25%, #cbd5e1 45%, #94a3b8 65%, #586979 100%)';

  const BURGUNDY = '#e11d48';
  const BURGUNDY_TEXT = '#e11d48';
  const BURGUNDY_HOVER = '#be123c';

  const RAINBOW_GRADIENT = 'linear-gradient(135deg, #ff0055 0%, #ff5000 20%, #ffcc00 40%, #00e676 60%, #00b0ff 80%, #d500f9 100%)';
  const RAINBOW_GRADIENT_HOVER = 'linear-gradient(135deg, #d500f9 0%, #00b0ff 20%, #00e676 40%, #ffcc00 60%, #ff5000 80%, #ff0055 100%)';

  const THEMES = {
    silver: {
      logo: 'images/kick-logo-silver.png',
      textColor: SILVER,
      fillColor: SILVER,
      fillStyle: 'url(#chrome-gradient)',
      giftStopColor: '#94a3b8',
      borderColor: SILVER,
      stopColor: '#cbd5e1',
      bgVal: SILVER_GRADIENT,
      bgHoverVal: SILVER_GRADIENT_HOVER,
      bgFallbackColor: SILVER,
      bgTextColor: '#0f172a',
      borderStyle: '1px solid rgba(255,255,255,0.2)',
      gradientStops: `
        <stop offset="0%" stop-color="#64748b"/>
        <stop offset="25%" stop-color="#94a3b8"/>
        <stop offset="45%" stop-color="#e2e8f0"/>
        <stop offset="65%" stop-color="#94a3b8"/>
        <stop offset="100%" stop-color="#64748b"/>
      `,
      accent: '#cbd5e1',
      accentText: '#0f172a',
      isRainbow: false
    },
    burgundy: {
      logo: 'images/kick-logo-burgundy.svg',
      textColor: BURGUNDY_TEXT,
      fillColor: BURGUNDY,
      fillStyle: BURGUNDY,
      giftStopColor: BURGUNDY,
      borderColor: BURGUNDY,
      stopColor: BURGUNDY,
      bgVal: BURGUNDY,
      bgHoverVal: BURGUNDY_HOVER,
      bgFallbackColor: BURGUNDY,
      bgTextColor: '#0f172a',
      borderStyle: '1px solid rgba(255,255,255,0.1)',
      gradientStops: `<stop offset="0%" stop-color="#e11d48"/><stop offset="100%" stop-color="#e11d48"/>`,
      accent: '#e11d48',
      accentText: '#0f172a',
      isRainbow: false
    },
    rainbow: {
      logo: 'images/kick-logo-rainbow.svg',
      textColor: '#ffffff',
      fillColor: '#00e676',
      fillStyle: 'url(#chrome-gradient)',
      giftStopColor: '#00e676',
      borderColor: '#00e676',
      stopColor: '#00e676',
      bgVal: RAINBOW_GRADIENT,
      bgHoverVal: RAINBOW_GRADIENT_HOVER,
      bgFallbackColor: '#00e676',
      bgTextColor: '#0f172a',
      borderStyle: '1px solid rgba(255,255,255,0.1)',
      gradientStops: `
        <stop offset="0%" stop-color="#ff0055"/>
        <stop offset="20%" stop-color="#ff5000"/>
        <stop offset="40%" stop-color="#ffcc00"/>
        <stop offset="60%" stop-color="#00e676"/>
        <stop offset="80%" stop-color="#00b0ff"/>
        <stop offset="100%" stop-color="#d500f9"/>
      `,
      accent: '#53FC18',
      accentText: '#0f172a',
      isRainbow: true
    },
    green: {
      accent: '#53FC18',
      accentText: '#0f172a'
    }
  };

  let rafScheduled = false;
  // Debounced re-apply: coalesces bursts of chat/DOM mutations (which can
  // fire many times per second) into at most one full re-scan per animation
  // frame, instead of one full document scan per mutation.
  const scheduleApplyAllSilver = () => {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      applyAllSilver();
    });
  };
  let activeTheme = 'green';

  // --- CSS for backgrounds, borders, hover states ---
  const silverCSS = `
    /* --- Silver Theme Overrides --- */
    body.kick-ext-theme-silver {
      --color-primary: 203 213 225 !important;
      --color-primary-base: 203 213 225 !important;
      --primary: #cbd5e1 !important;
      --primary-base: #cbd5e1 !important;
      --text-primary-base: #cbd5e1 !important;
      --bg-primary-base: #cbd5e1 !important;
      --color-brand: 203 213 225 !important;
      --brand: #cbd5e1 !important;
      --tw-text-opacity: 1 !important;
    }

    body.kick-ext-theme-silver .bg-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-silver .bg-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-silver .bg-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-silver [class*="bg-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-silver [class*="bg-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      background: ${SILVER_GRADIENT} !important;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
      color: #0f172a !important;
      text-shadow: none !important;
    }
    body.kick-ext-theme-silver .bg-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]) *, body.kick-ext-theme-silver .bg-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]) *, body.kick-ext-theme-silver .bg-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]) *,
    body.kick-ext-theme-silver [class*="bg-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) *, body.kick-ext-theme-silver [class*="bg-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) * {
      color: #0f172a !important;
      text-shadow: none !important;
    }

    body.kick-ext-theme-silver .bg-green-500:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-silver [class~="bg-green-500"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      background-color: ${SILVER} !important;
    }

    body.kick-ext-theme-silver .bg-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover, body.kick-ext-theme-silver .bg-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover, body.kick-ext-theme-silver .bg-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover,
    body.kick-ext-theme-silver [class*="bg-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover, body.kick-ext-theme-silver [class*="bg-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover {
      background: ${SILVER_GRADIENT_HOVER} !important;
    }

    body.kick-ext-theme-silver .text-primary-onPrimary:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-silver [class*="onPrimary"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      color: #0f172a !important;
      background: none !important;
      -webkit-background-clip: unset !important;
      background-clip: unset !important;
      text-shadow: none !important;
    }

    body.kick-ext-theme-silver .text-primary-base, body.kick-ext-theme-silver [class*="text-brand"], body.kick-ext-theme-silver .text-green-500, body.kick-ext-theme-silver [class*="text-green-"],
    body.kick-ext-theme-silver [style*="rgb(83, 252, 24)"], body.kick-ext-theme-silver [style*="rgb(83,252,24)"], body.kick-ext-theme-silver [style*="rgb(83, 252, 24"], body.kick-ext-theme-silver [style*="83, 252, 24"], body.kick-ext-theme-silver [style*="83,252,24"], body.kick-ext-theme-silver [style*="53fc18"], body.kick-ext-theme-silver [style*="53FC18"],
    body.kick-ext-theme-silver #chat-input-wrapper [class*="text-green"], body.kick-ext-theme-silver #chat-input-wrapper [class*="text-brand"] {
      color: ${SILVER} !important;
    }
    body.kick-ext-theme-silver #chat-input-wrapper [class*="border-green"], body.kick-ext-theme-silver #chat-input-wrapper [class*="border-brand"] {
      border-color: ${SILVER} !important;
    }

    body.kick-ext-theme-silver .border-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-silver .border-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-silver .border-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-silver .border-green-500:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-silver [class*="border-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-silver [class*="border-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-silver [class*="border-green-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      border-color: ${SILVER} !important;
    }

    body.kick-ext-theme-silver [class*="fill-primary"],
    body.kick-ext-theme-silver .fill-primary-base,
    body.kick-ext-theme-silver .\\!fill-primary-base,
    body.kick-ext-theme-silver [class~="!fill-primary-base"],
    body.kick-ext-theme-silver svg[class*="fill-primary"],
    body.kick-ext-theme-silver circle[cx="3"][cy="3"][r="3"],
    body.kick-ext-theme-silver circle[fill="current"] {
      fill: url(#chrome-gradient) !important;
      color: #cbd5e1 !important;
    }

    body.kick-ext-theme-silver svg.stroke-brand,
    body.kick-ext-theme-silver svg.stroke-primary,
    body.kick-ext-theme-silver [stroke="#53fc18"],
    body.kick-ext-theme-silver [stroke="#53FC18"] {
      stroke: #cbd5e1 !important;
    }

    body.kick-ext-theme-silver #kick-ext-chat-handle:hover {
      background: rgba(203, 213, 225, 0.4) !important;
    }
    body.kick-ext-theme-silver #kick-ext-chat-resize-handle:hover::after {
      background: #cbd5e1 !important;
    }

    body.kick-ext-theme-silver .text-surface-onSurfacePrimary,
    body.kick-ext-theme-silver [class*="text-surface-onSurfacePrimary"],
    body.kick-ext-theme-silver [class*="onSurfacePrimary"]:not([class*="bg-"]):not([class*="border-"]),
    body.kick-ext-theme-silver a[data-state="active"]:not([data-testid="sidebar-home"]):not([class*="text-white"]),
    body.kick-ext-theme-silver [data-testid*="-tab"][data-state="active"]:not([class*="text-white"]) {
      background: linear-gradient(135deg, #94a3b8 0%, #cbd5e1 25%, #f8fafc 45%, #cbd5e1 65%, #94a3b8 100%) !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      color: transparent !important;
      font-weight: 700 !important;
    }

    body.kick-ext-theme-silver .bg-surface-onSurfacePrimary:not(.size-3),
    body.kick-ext-theme-silver [class*="bg-surface-onSurfacePrimary"]:not(.size-3) {
      background: linear-gradient(135deg, #64748b 0%, #94a3b8 25%, #e2e8f0 45%, #94a3b8 65%, #64748b 100%) !important;
      background-color: #cbd5e1 !important;
    }

    body.kick-ext-theme-silver .border-surface-onSurfacePrimary,
    body.kick-ext-theme-silver [class*="border-surface-onSurfacePrimary"],
    body.kick-ext-theme-silver a[data-state="active"]:not([data-testid="sidebar-home"]):not([class*="border-transparent"]):not([class*="border-none"]),
    body.kick-ext-theme-silver [data-testid*="-tab"][data-state="active"]:not([class*="border-transparent"]):not([class*="border-none"]) {
      border-color: #cbd5e1 !important;
    }

    body.kick-ext-theme-silver stop[stop-color*="1EFF00"], body.kick-ext-theme-silver stop[stop-color*="1eff00"],
    body.kick-ext-theme-silver stop[stop-color*="00FF8C"], body.kick-ext-theme-silver stop[stop-color*="00ff8c"],
    body.kick-ext-theme-silver stop[stop-color*="53fc18"], body.kick-ext-theme-silver stop[stop-color*="53FC18"],
    body.kick-ext-theme-silver stop[stop-color*="rgb(83"] {
      stop-color: #cbd5e1 !important;
    }

    /* --- Burgundy Theme Overrides (Plain Solid Color) --- */
    body.kick-ext-theme-burgundy {
      --color-primary: 225 29 72 !important;
      --color-primary-base: 225 29 72 !important;
      --primary: #e11d48 !important;
      --primary-base: #e11d48 !important;
      --text-primary-base: #e11d48 !important;
      --bg-primary-base: #e11d48 !important;
      --color-brand: 225 29 72 !important;
      --brand: #e11d48 !important;
      --tw-text-opacity: 1 !important;
    }

    body.kick-ext-theme-burgundy .bg-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-burgundy .bg-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-burgundy .bg-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-burgundy [class*="bg-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-burgundy [class*="bg-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      background: ${BURGUNDY} !important;
      background-color: ${BURGUNDY} !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      color: #0f172a !important;
      text-shadow: none !important;
    }
    body.kick-ext-theme-burgundy .bg-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]) *, body.kick-ext-theme-burgundy .bg-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]) *, body.kick-ext-theme-burgundy .bg-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]) *,
    body.kick-ext-theme-burgundy [class*="bg-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) *, body.kick-ext-theme-burgundy [class*="bg-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) * {
      color: #0f172a !important;
      text-shadow: none !important;
    }

    body.kick-ext-theme-burgundy .bg-green-500:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-burgundy [class~="bg-green-500"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      background-color: ${BURGUNDY} !important;
    }

    body.kick-ext-theme-burgundy .bg-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover, body.kick-ext-theme-burgundy .bg-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover, body.kick-ext-theme-burgundy .bg-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover,
    body.kick-ext-theme-burgundy [class*="bg-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover, body.kick-ext-theme-burgundy [class*="bg-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover {
      background: ${BURGUNDY_HOVER} !important;
      background-color: ${BURGUNDY_HOVER} !important;
    }

    body.kick-ext-theme-burgundy .text-primary-onPrimary:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-burgundy [class*="onPrimary"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      color: #0f172a !important;
      background: none !important;
      -webkit-background-clip: unset !important;
      background-clip: unset !important;
      text-shadow: none !important;
    }

    body.kick-ext-theme-burgundy .text-primary-base, body.kick-ext-theme-burgundy [class*="text-brand"], body.kick-ext-theme-burgundy .text-green-500, body.kick-ext-theme-burgundy [class*="text-green-"],
    body.kick-ext-theme-burgundy [style*="rgb(83, 252, 24)"], body.kick-ext-theme-burgundy [style*="rgb(83,252,24)"], body.kick-ext-theme-burgundy [style*="rgb(83, 252, 24"], body.kick-ext-theme-burgundy [style*="83, 252, 24"], body.kick-ext-theme-burgundy [style*="83,252,24"], body.kick-ext-theme-burgundy [style*="53fc18"], body.kick-ext-theme-burgundy [style*="53FC18"],
    body.kick-ext-theme-burgundy #chat-input-wrapper [class*="text-green"], body.kick-ext-theme-burgundy #chat-input-wrapper [class*="text-brand"] {
      color: ${BURGUNDY_TEXT} !important;
    }
    body.kick-ext-theme-burgundy #chat-input-wrapper [class*="border-green"], body.kick-ext-theme-burgundy #chat-input-wrapper [class*="border-brand"] {
      border-color: ${BURGUNDY_TEXT} !important;
    }

    body.kick-ext-theme-burgundy .border-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-burgundy .border-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-burgundy .border-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-burgundy .border-green-500:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-burgundy [class*="border-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-burgundy [class*="border-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-burgundy [class*="border-green-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      border-color: ${BURGUNDY} !important;
    }

    body.kick-ext-theme-burgundy [class*="fill-primary"],
    body.kick-ext-theme-burgundy .fill-primary-base,
    body.kick-ext-theme-burgundy .\\!fill-primary-base,
    body.kick-ext-theme-burgundy [class~="!fill-primary-base"],
    body.kick-ext-theme-burgundy svg[class*="fill-primary"],
    body.kick-ext-theme-burgundy circle[cx="3"][cy="3"][r="3"],
    body.kick-ext-theme-burgundy circle[fill="current"] {
      fill: ${BURGUNDY} !important;
      color: ${BURGUNDY} !important;
    }

    body.kick-ext-theme-burgundy svg.stroke-brand,
    body.kick-ext-theme-burgundy svg.stroke-primary,
    body.kick-ext-theme-burgundy [stroke="#53fc18"],
    body.kick-ext-theme-burgundy [stroke="#53FC18"] {
      stroke: #e11d48 !important;
    }

    body.kick-ext-theme-burgundy #kick-ext-chat-handle:hover {
      background: rgba(225, 29, 72, 0.4) !important;
    }
    body.kick-ext-theme-burgundy #kick-ext-chat-resize-handle:hover::after {
      background: #e11d48 !important;
    }

    body.kick-ext-theme-burgundy .text-surface-onSurfacePrimary,
    body.kick-ext-theme-burgundy [class*="text-surface-onSurfacePrimary"],
    body.kick-ext-theme-burgundy [class*="onSurfacePrimary"]:not([class*="bg-"]):not([class*="border-"]),
    body.kick-ext-theme-burgundy a[data-state="active"]:not([data-testid="sidebar-home"]):not([class*="text-white"]),
    body.kick-ext-theme-burgundy [data-testid*="-tab"][data-state="active"]:not([class*="text-white"]) {
      color: ${BURGUNDY} !important;
      background: none !important;
      -webkit-background-clip: unset !important;
      background-clip: unset !important;
      font-weight: 700 !important;
    }

    body.kick-ext-theme-burgundy .bg-surface-onSurfacePrimary:not(.size-3),
    body.kick-ext-theme-burgundy [class*="bg-surface-onSurfacePrimary"]:not(.size-3) {
      background: ${BURGUNDY} !important;
      background-color: ${BURGUNDY} !important;
    }

    body.kick-ext-theme-burgundy .border-surface-onSurfacePrimary,
    body.kick-ext-theme-burgundy [class*="border-surface-onSurfacePrimary"],
    body.kick-ext-theme-burgundy a[data-state="active"]:not([data-testid="sidebar-home"]):not([class*="border-transparent"]):not([class*="border-none"]),
    body.kick-ext-theme-burgundy [data-testid*="-tab"][data-state="active"]:not([class*="border-transparent"]):not([class*="border-none"]) {
      border-color: ${BURGUNDY} !important;
    }

    body.kick-ext-theme-burgundy stop[stop-color*="1EFF00"], body.kick-ext-theme-burgundy stop[stop-color*="1eff00"],
    body.kick-ext-theme-burgundy stop[stop-color*="00FF8C"], body.kick-ext-theme-burgundy stop[stop-color*="00ff8c"],
    body.kick-ext-theme-burgundy stop[stop-color*="53fc18"], body.kick-ext-theme-burgundy stop[stop-color*="53FC18"],
    body.kick-ext-theme-burgundy stop[stop-color*="rgb(83"] {
      stop-color: ${BURGUNDY} !important;
    }

    /* --- Rainbow Theme Overrides --- */
    body.kick-ext-theme-rainbow {
      --color-primary: 0 230 118 !important;
      --color-primary-base: 0 230 118 !important;
      --primary: #00e676 !important;
      --primary-base: #00e676 !important;
      --text-primary-base: #00e676 !important;
      --bg-primary-base: #00e676 !important;
      --color-brand: 0 230 118 !important;
      --brand: #00e676 !important;
      --tw-text-opacity: 1 !important;
    }

    body.kick-ext-theme-rainbow .bg-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-rainbow .bg-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-rainbow .bg-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-rainbow [class*="bg-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-rainbow [class*="bg-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      background: ${RAINBOW_GRADIENT} !important;
      box-shadow: 0 0 10px rgba(0,230,118,0.3) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
      color: #0f172a !important;
      text-shadow: none !important;
    }
    body.kick-ext-theme-rainbow .bg-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]) *, body.kick-ext-theme-rainbow .bg-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]) *, body.kick-ext-theme-rainbow .bg-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]) *,
    body.kick-ext-theme-rainbow [class*="bg-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) *, body.kick-ext-theme-rainbow [class*="bg-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) * {
      color: #0f172a !important;
      text-shadow: none !important;
    }

    body.kick-ext-theme-rainbow .bg-green-500:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-rainbow [class~="bg-green-500"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      background: ${RAINBOW_GRADIENT} !important;
    }

    body.kick-ext-theme-rainbow .bg-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover, body.kick-ext-theme-rainbow .bg-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover, body.kick-ext-theme-rainbow .bg-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover,
    body.kick-ext-theme-rainbow [class*="bg-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover, body.kick-ext-theme-rainbow [class*="bg-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]):hover {
      background: ${RAINBOW_GRADIENT_HOVER} !important;
    }

    body.kick-ext-theme-rainbow .text-primary-onPrimary:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-rainbow [class*="onPrimary"]:not(:disabled):not([disabled]):not([aria-disabled="true"]) {
      color: #0f172a !important;
      background: none !important;
      -webkit-background-clip: unset !important;
      background-clip: unset !important;
      text-shadow: none !important;
    }

    body.kick-ext-theme-rainbow .text-primary-base, body.kick-ext-theme-rainbow [class*="text-brand"], body.kick-ext-theme-rainbow .text-green-500, body.kick-ext-theme-rainbow [class*="text-green-"],
    body.kick-ext-theme-rainbow [style*="rgb(83, 252, 24)"], body.kick-ext-theme-rainbow [style*="rgb(83,252,24)"], body.kick-ext-theme-rainbow [style*="rgb(83, 252, 24"], body.kick-ext-theme-rainbow [style*="83, 252, 24"], body.kick-ext-theme-rainbow [style*="83,252,24"], body.kick-ext-theme-rainbow [style*="53fc18"], body.kick-ext-theme-rainbow [style*="53FC18"] {
      color: #ffffff !important;
    }
    body.kick-ext-theme-rainbow #chat-input-wrapper [class*="text-green"], body.kick-ext-theme-rainbow #chat-input-wrapper [class*="text-brand"] {
      background: ${RAINBOW_GRADIENT} !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      color: transparent !important;
    }
    body.kick-ext-theme-rainbow #chat-input-wrapper [class*="border-green"], body.kick-ext-theme-rainbow #chat-input-wrapper [class*="border-brand"] {
      border-color: #00e676 !important;
    }

    @keyframes ke-rainbow-border {
      0%   { border-color: #ff0055; }
      17%  { border-color: #ff5000; }
      33%  { border-color: #ffcc00; }
      50%  { border-color: #00e676; }
      67%  { border-color: #00b0ff; }
      83%  { border-color: #d500f9; }
      100% { border-color: #ff0055; }
    }

    body.kick-ext-theme-rainbow .border-brand:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-rainbow .border-primary:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-rainbow .border-primary-base:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-rainbow .border-green-500:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-rainbow [class*="border-brand"]:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-rainbow [class*="border-primary-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]), body.kick-ext-theme-rainbow [class*="border-green-"]:not(:disabled):not([disabled]):not([aria-disabled="true"]),
    body.kick-ext-theme-rainbow [class*="border-l-"] {
      animation: ke-rainbow-border 4s linear infinite !important;
    }

    body.kick-ext-theme-rainbow [class*="fill-primary"],
    body.kick-ext-theme-rainbow .fill-primary-base,
    body.kick-ext-theme-rainbow .\\!fill-primary-base,
    body.kick-ext-theme-rainbow [class~="!fill-primary-base"],
    body.kick-ext-theme-rainbow svg[class*="fill-primary"],
    body.kick-ext-theme-rainbow circle[cx="3"][cy="3"][r="3"],
    body.kick-ext-theme-rainbow circle[fill="current"] {
      fill: url(#chrome-gradient) !important;
      color: #00e676 !important;
    }

    body.kick-ext-theme-rainbow svg.stroke-brand,
    body.kick-ext-theme-rainbow svg.stroke-primary,
    body.kick-ext-theme-rainbow [stroke="#53fc18"],
    body.kick-ext-theme-rainbow [stroke="#53FC18"] {
      stroke: #00e676 !important;
    }

    body.kick-ext-theme-rainbow #kick-ext-chat-handle:hover {
      background: linear-gradient(135deg, rgba(255, 0, 85, 0.4) 0%, rgba(255, 80, 0, 0.4) 20%, rgba(255, 204, 0, 0.4) 40%, rgba(0, 230, 118, 0.4) 60%, rgba(0, 176, 255, 0.4) 80%, rgba(213, 0, 249, 0.4) 100%) !important;
    }
    body.kick-ext-theme-rainbow #kick-ext-chat-resize-handle:hover::after {
      background: #00e676 !important;
    }

    body.kick-ext-theme-rainbow .text-surface-onSurfacePrimary,
    body.kick-ext-theme-rainbow [class*="text-surface-onSurfacePrimary"],
    body.kick-ext-theme-rainbow [class*="onSurfacePrimary"]:not([class*="bg-"]):not([class*="border-"]),
    body.kick-ext-theme-rainbow a[data-state="active"]:not([data-testid="sidebar-home"]):not([class*="text-white"]),
    body.kick-ext-theme-rainbow [data-testid*="-tab"][data-state="active"]:not([class*="text-white"]),
    body.kick-ext-theme-rainbow a[href*="/category/"],
    body.kick-ext-theme-rainbow a[href*="/category/"] *,
    body.kick-ext-theme-rainbow div:not(#channel-chatroom *):not(#kick-ext-chat-overlay *)[style*="translateY"] {
      background: ${RAINBOW_GRADIENT} !important;
      -webkit-background-clip: text !important;
      background-clip: text !important;
      color: transparent !important;
    }

    body.kick-ext-theme-rainbow .bg-surface-onSurfacePrimary:not(.size-3),
    body.kick-ext-theme-rainbow [class*="bg-surface-onSurfacePrimary"]:not(.size-3) {
      background: ${RAINBOW_GRADIENT} !important;
    }

    body.kick-ext-theme-rainbow .border-surface-onSurfacePrimary,
    body.kick-ext-theme-rainbow [class*="border-surface-onSurfacePrimary"],
    body.kick-ext-theme-rainbow a[data-state="active"]:not([data-testid="sidebar-home"]):not([class*="border-transparent"]):not([class*="border-none"]),
    body.kick-ext-theme-rainbow [data-testid*="-tab"][data-state="active"]:not([class*="border-transparent"]):not([class*="border-none"]) {
      border-color: #00e676 !important;
    }

    body.kick-ext-theme-rainbow stop[stop-color*="1EFF00"], body.kick-ext-theme-rainbow stop[stop-color*="1eff00"],
    body.kick-ext-theme-rainbow stop[stop-color*="00FF8C"], body.kick-ext-theme-rainbow stop[stop-color*="00ff8c"],
    body.kick-ext-theme-rainbow stop[stop-color*="53fc18"], body.kick-ext-theme-rainbow stop[stop-color*="53FC18"],
    body.kick-ext-theme-rainbow stop[stop-color*="rgb(83"] {
      stop-color: #00e676 !important;
    }

    /* Common Gift shop / Kicks icon SVG */
    [data-testid="gift-shop-button"] svg path:not([fill="black"]),
    [data-testid="gift-shop-button"] svg rect:not([fill="black"]),
    [data-testid="gift-shop-button"] svg circle:not([fill="black"]),
    path[fill*="21129_281951"] {
      fill: url(#chrome-gradient) !important;
    }
  `;

  const SELECTORS_TEXT = [
    '.text-primary-base',
    '[class~="text-primary-base"]',
    '[class*="text-brand"]',
    '.text-green-500',
    '[class*="text-green-"]',
  ];
  const SELECTORS_FILL = [
    '[class*="fill-primary"]',
    '.fill-primary-base',
    '.\\!fill-primary-base',
    '[class~="!fill-primary-base"]',
    'circle[cx="3"][cy="3"][r="3"]',
    'circle[fill="current"]',
    '[fill*="#1EFF00"]',
    '[fill*="#00FF8C"]',
    '[fill="#53fc18"]',
    '[fill="#53FC18"]',
    'path[fill="#53fc18"]',
    'path[fill="#53FC18"]',
  ];
  const SELECTORS_RGB = [
    '[class*="text-"][class*="rgb(83"]',
    '[style*="rgb(83, 252, 24)"]',
    '[style*="rgb(83,252,24)"]',
    '[style*="rgb(83, 252, 24"]',
    '[style*="rgb(83,252,24"]',
    '[style*="83, 252, 24"]',
    '[style*="83,252,24"]',
    '[style*="53fc18"]',
    '[style*="53FC18"]',
  ];
  const SELECTORS_BG = [
    '.bg-brand',
    '.bg-primary',
    '.bg-primary-base',
    '[class*="bg-brand"]',
    '[class*="bg-primary-"]',
    '.bg-green-500',
    '[class~="bg-green-500"]',
    '.bg-surface-onSurfacePrimary:not(.size-3)',
    '[class*="bg-surface-onSurfacePrimary"]:not(.size-3)',
  ];
  const SELECTORS_BORDER = [
    '.border-brand',
    '.border-primary',
    '.border-primary-base',
    '.border-green-500',
    '[class*="border-brand"]',
    '[class*="border-primary-"]',
    '[class*="border-green-"]',
  ];
  const SELECTORS_LOGO = [
    'img[src*="kick-logo"]',
    'img[alt*="Kick Logo"]',
    'img[alt="Kick"]',
  ];

  function replaceKickLogo(el) {
    if (el.dataset.kickExtLogoReplaced && el.dataset.kickExtLogoTheme === activeTheme) return;
    if (el.dataset.keOrigSrc === undefined) {
      el.dataset.keOrigSrc = el.src || '';
    }
    if (el.dataset.keOrigSrcset === undefined && el.hasAttribute('srcset')) {
      el.dataset.keOrigSrcset = el.getAttribute('srcset') || '';
    }
    el.dataset.kickExtLogoReplaced = 'true';
    el.dataset.kickExtLogoTheme = activeTheme;
    try {
      let logoFile = THEMES[activeTheme]?.logo || 'images/kick-logo-silver.png';
      el.src = chrome.runtime.getURL(logoFile);
      if (el.hasAttribute('srcset')) {
        el.removeAttribute('srcset');
      }
    } catch (e) { }
  }

  function applySilverToElement(el) {
    if (el.closest('[class*="bg-brand"], [class*="bg-primary-"], .bg-primary-base, [data-testid="sidebar-home"]')) {
      return;
    }
    if (el.className && typeof el.className === 'string' && el.className.includes('onPrimary')) {
      return;
    }
    if (el.closest('#kick-ext-coop-prompt, #kick-ext-qc-panel, #channel-chatroom, #kick-ext-chat-overlay')) {
      return;
    }
    if (el.id && typeof el.id === 'string' && el.id.startsWith('kick-ext-')) {
      return;
    }
    el.dataset.kickExtSilverText = 'true';
    const theme = THEMES[activeTheme];
    const isRainbowGradientTextTarget = el.closest('#chat-command-suggestion-panel, #chat-input-wrapper') ||
      el.matches('a[href*="/category/"]') ||
      el.closest('a[href*="/category/"]') ||
      ((el.matches('[style*="translateY"]') || el.closest('[style*="translateY"]')) && !el.closest('#channel-chatroom, #kick-ext-chat-overlay'));

    if (theme?.isRainbow && isRainbowGradientTextTarget) {
      el.style.setProperty('background', theme.bgVal, 'important');
      el.style.setProperty('-webkit-background-clip', 'text', 'important');
      el.style.setProperty('background-clip', 'text', 'important');
      el.style.setProperty('color', 'transparent', 'important');
    } else {
      el.style.removeProperty('background');
      el.style.removeProperty('-webkit-background-clip');
      el.style.removeProperty('background-clip');
      const color = theme?.textColor || SILVER;
      el.style.setProperty('color', color, 'important');
    }
  }

  function applySilverFill(el) {
    if (el.closest('[class*="size-[calc"], [data-state="closed"], [data-testid="sidebar-home"]')) {
      return;
    }
    const theme = THEMES[activeTheme];
    const color = theme?.fillColor || SILVER;
    const fillStyle = theme?.fillStyle || 'url(#chrome-gradient)';
    el.dataset.kickExtSilverFill = 'true';
    el.style.setProperty('color', color, 'important');
    el.style.setProperty('fill', fillStyle, 'important');
    if (el.tagName === 'svg' || el.tagName === 'path' || el.tagName === 'circle') {
      if (!el.dataset.kickExtOriginalFill && el.hasAttribute('fill')) {
        el.dataset.kickExtOriginalFill = el.getAttribute('fill');
      }
      el.setAttribute('fill', color);
    }
    el.querySelectorAll('path, circle, rect, polygon, g').forEach(child => {
      if (!child.dataset.kickExtOriginalFill && child.hasAttribute('fill')) {
        child.dataset.kickExtOriginalFill = child.getAttribute('fill');
      }
      child.style.setProperty('fill', fillStyle, 'important');
      child.style.setProperty('color', color, 'important');
    });
  }

  function applyGiftShopSilver() {
    const targets = [
      ...document.querySelectorAll('[data-testid="gift-shop-button"]'),
      ...document.querySelectorAll('path[fill*="21129_281951"]').values()
        .map(p => p.closest('svg'))
        .filter(Boolean),
    ];
    const theme = THEMES[activeTheme];
    const stopColor = theme?.giftStopColor || '#94a3b8';
    const fillStyle = theme?.fillStyle || 'url(#chrome-gradient)';
    targets.forEach(container => {
      if (container.dataset.kickExtGiftSilver) return;
      container.dataset.kickExtGiftSilver = 'true';
      container.querySelectorAll('path, rect, circle, polygon').forEach(el => {
        const fillVal = (el.getAttribute('fill') || '').toLowerCase();
        if (fillVal === 'black' || fillVal === '#000000' || fillVal === '#000') return;
        if (!el.dataset.kickExtOriginalFill && el.hasAttribute('fill')) {
          el.dataset.kickExtOriginalFill = el.getAttribute('fill');
        }
        el.style.setProperty('fill', fillStyle, 'important');
      });
      container.querySelectorAll('stop').forEach(stop => {
        if (!stop.dataset.kickExtOriginalColor) {
          stop.dataset.kickExtOriginalColor = stop.getAttribute('stop-color') || '#53fc18';
        }
        if (!stop.dataset.kickExtOriginalOpacity && stop.hasAttribute('stop-opacity')) {
          stop.dataset.kickExtOriginalOpacity = stop.getAttribute('stop-opacity');
        }
        stop.setAttribute('stop-color', stopColor);
        stop.style.setProperty('stop-color', stopColor, 'important');
        stop.style.setProperty('stop-opacity', '1', 'important');
      });
    });
  }

  function applySilverBorder(el) {
    if (el.closest('[data-testid="sidebar-home"]')) return;
    el.dataset.kickExtSilverBorder = 'true';
    const theme = THEMES[activeTheme];
    if (theme?.isRainbow) {
      // Don't set inline border-color — let the CSS @keyframes animation cycle through rainbow colors
      el.style.removeProperty('border-color');
      return;
    }
    const color = theme?.borderColor || SILVER;
    el.style.setProperty('border-color', color, 'important');
  }

  function applySilverStops() {
    const stopColor = THEMES[activeTheme]?.stopColor || '#cbd5e1';
    document.querySelectorAll('stop').forEach(stop => {
      if (stop.closest('[class*="size-[calc"], [data-state="closed"], [data-testid="sidebar-home"]')) {
        return;
      }
      const color = (stop.getAttribute('stop-color') || stop.style.stopColor || '').toLowerCase();
      if (color.includes('1eff00') || color.includes('00ff8c') || color.includes('53fc18') || color.includes('rgb(83')) {
        if (!stop.dataset.kickExtOriginalColor) {
          stop.dataset.kickExtOriginalColor = stop.getAttribute('stop-color') || '#53fc18';
        }
        if (!stop.dataset.kickExtOriginalOpacity && stop.hasAttribute('stop-opacity')) {
          stop.dataset.kickExtOriginalOpacity = stop.getAttribute('stop-opacity');
        }
        stop.setAttribute('stop-color', stopColor);
        stop.style.setProperty('stop-color', stopColor, 'important');
      }
    });
  }

  let claimButtonObserver = null;
  let watchedClaimButtons = new WeakSet();

  function ensureClaimButtonWatched(el) {
    if (watchedClaimButtons.has(el)) return;
    if (!claimButtonObserver) {
      claimButtonObserver = new MutationObserver(() => scheduleApplyAllSilver());
    }
    claimButtonObserver.observe(el, { attributes: true, attributeFilter: ['disabled', 'aria-disabled'] });
    watchedClaimButtons.add(el);
  }

  function applySilverBg(el) {
    if (el.tagName === 'BUTTON' && el.classList.contains('bg-primary-base')) {
      ensureClaimButtonWatched(el);
    }
    if (el.dataset.kickExtSilverBg) return;
    if (el.className && typeof el.className === 'string' && el.className.includes('text-primary-onPrimary') && !el.className.includes('bg-')) {
      return;
    }
    if (el.tagName === 'BUTTON' && (el.disabled || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true')) {
      return;
    }
    el.dataset.kickExtSilverBg = 'true';

    const theme = THEMES[activeTheme] || THEMES.silver;
    const bgVal = theme.bgVal;
    const bgHoverVal = theme.bgHoverVal;
    const color = theme.bgFallbackColor;
    const textColor = theme.bgTextColor;
    const borderStyle = theme.borderStyle;

    if ((el.classList.contains('bg-green-500') || (el.className && typeof el.className === 'string' && el.className.includes('bg-surface-onSurfacePrimary'))) && !el.classList.contains('bg-primary-base') && !el.classList.contains('bg-primary') && !el.classList.contains('size-3')) {
      el.style.setProperty('background', bgVal, 'important');
      el.style.setProperty('background-color', color, 'important');
      return;
    }

    el.style.setProperty('background', bgVal, 'important');
    el.style.setProperty('box-shadow', '0 1px 3px rgba(0,0,0,0.3)', 'important');
    el.style.setProperty('border', borderStyle, 'important');
    el.style.setProperty('color', textColor, 'important');
    el.style.setProperty('text-shadow', 'none', 'important');

    el.querySelectorAll('*').forEach(child => {
      child.style.setProperty('color', textColor, 'important');
      child.style.setProperty('text-shadow', 'none', 'important');
    });

    el.addEventListener('mouseenter', () => {
      if (!THEMES[activeTheme] || activeTheme === 'green') return;
      el.style.setProperty('background', bgHoverVal, 'important');
    });
    el.addEventListener('mouseleave', () => {
      if (!THEMES[activeTheme] || activeTheme === 'green') return;
      el.style.setProperty('background', bgVal, 'important');
    });
  }

  function cleanupStaleSilverStyles() {
    document.querySelectorAll('a[style*="color"], a[style*="border"], [data-testid*="-tab"][style*="color"], [data-testid*="-tab"][style*="border"], [class*="onSurfacePrimary"][style*="color"], [class*="onSurfacePrimary"][style*="border"]').forEach(el => {
      const styleAttr = el.getAttribute('style') || '';
      if (styleAttr.includes(SILVER) || styleAttr.includes(BURGUNDY) || styleAttr.includes('176, 184, 196') || styleAttr.includes('rgb(176') || styleAttr.includes('rgb(225, 29, 72)') || styleAttr.includes('rgb(128, 0, 32)')) {
        el.style.removeProperty('color');
        el.style.removeProperty('border-color');
        delete el.dataset.kickExtSilverText;
        delete el.dataset.kickExtSilverBorder;
      }
    });

    const allTextSel = SELECTORS_TEXT.concat(SELECTORS_RGB).join(', ');
    const allBorderSel = SELECTORS_BORDER.join(', ');
    document.querySelectorAll('[data-kick-ext-silver-text]').forEach(el => {
      if (!el.matches(allTextSel) && !el.closest('#chat-command-suggestion-panel, #chat-input-wrapper, a[href*="/category/"]')) {
        el.style.removeProperty('color');
        el.style.removeProperty('background');
        el.style.removeProperty('-webkit-background-clip');
        el.style.removeProperty('background-clip');
        delete el.dataset.kickExtSilverText;
      }
    });
    document.querySelectorAll('[data-kick-ext-silver-border]').forEach(el => {
      if (!el.matches(allBorderSel)) {
        el.style.removeProperty('border-color');
        el.style.removeProperty('border-image');
        delete el.dataset.kickExtSilverBorder;
      }
    });

    const allBgSel = SELECTORS_BG.join(', ');
    document.querySelectorAll('[data-kick-ext-silver-bg]').forEach(el => {
      const isDisabledBtn = el.tagName === 'BUTTON' && (el.disabled || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true');
      if (!el.matches(allBgSel) || isDisabledBtn) {
        delete el.dataset.kickExtSilverBg;
        el.style.removeProperty('background');
        el.style.removeProperty('background-color');
        el.style.removeProperty('box-shadow');
        el.style.removeProperty('border');
        el.style.removeProperty('color');
        el.style.removeProperty('text-shadow');
        el.querySelectorAll('*').forEach(child => {
          child.style.removeProperty('color');
          child.style.removeProperty('text-shadow');
        });
      }
    });

    const allFillSel = SELECTORS_FILL.join(', ');
    document.querySelectorAll('[data-kick-ext-silver-fill]').forEach(el => {
      if (!el.matches(allFillSel)) {
        if (el.dataset.kickExtOriginalFill) {
          el.setAttribute('fill', el.dataset.kickExtOriginalFill);
          delete el.dataset.kickExtOriginalFill;
        } else {
          el.removeAttribute('fill');
        }
        el.style.removeProperty('fill');
        el.style.removeProperty('color');
        delete el.dataset.kickExtSilverFill;
      }
    });
  }

  function applyAllSilver() {
    if (!THEMES[activeTheme] || activeTheme === 'green') return;
    cleanupStaleSilverStyles();

    try {
      const allTextSelectors = SELECTORS_TEXT.concat(SELECTORS_RGB).concat(['a[href*="/category/"]']).join(', ');
      document.querySelectorAll(allTextSelectors).forEach(applySilverToElement);
      document.querySelectorAll('[style*="color"]').forEach(el => {
        const styleAttr = (el.getAttribute('style') || '').toLowerCase();
        if (styleAttr.includes('83, 252, 24') || styleAttr.includes('83,252,24') || styleAttr.includes('53fc18')) {
          applySilverToElement(el);
        }
      });
    } catch (e) { }
    try {
      document.querySelectorAll(SELECTORS_FILL.join(', ')).forEach(applySilverFill);
    } catch (e) { }
    try {
      document.querySelectorAll(SELECTORS_BORDER.join(', ')).forEach(applySilverBorder);
    } catch (e) { }
    try {
      applySilverStops();
    } catch (e) { }
    try {
      applyGiftShopSilver();
    } catch (e) { }
    try {
      document.querySelectorAll(SELECTORS_BG.join(', ')).forEach(applySilverBg);
    } catch (e) { }
    try {
      document.querySelectorAll(SELECTORS_LOGO.join(', ')).forEach(replaceKickLogo);
    } catch (e) { }
  }

  function initDefs(theme = 'silver') {
    const svgNS = "http://www.w3.org/2000/svg";
    let svgDefs = document.getElementById('kick-ext-chrome-defs');
    let stopsHtml = THEMES[theme]?.gradientStops || THEMES.silver.gradientStops;
    if (!svgDefs) {
      svgDefs = document.createElementNS(svgNS, "svg");
      svgDefs.id = 'kick-ext-chrome-defs';
      svgDefs.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;';
      svgDefs.innerHTML = `<defs><linearGradient id="chrome-gradient" x1="0%" y1="0%" x2="100%" y2="100%">${stopsHtml}</linearGradient></defs>`;
      (document.body || document.documentElement).appendChild(svgDefs);
    } else {
      const grad = svgDefs.querySelector('#chrome-gradient');
      if (grad) grad.innerHTML = stopsHtml;
    }
  }

  function initCSS() {
    if (document.getElementById('kick-ext-silver-theme')) return;
    const style = document.createElement('style');
    style.id = 'kick-ext-silver-theme';
    style.textContent = silverCSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeTheme() {
    const overrideThemeClasses = Object.keys(THEMES).filter(t => t !== 'green').map(t => 'kick-ext-theme-' + t);
    document.body.classList.remove(...overrideThemeClasses);
    if (window.KickExt.sharedBodyObserver) {
      window.KickExt.sharedBodyObserver.unsubscribe(scheduleApplyAllSilver);
    }
    if (claimButtonObserver) {
      claimButtonObserver.disconnect();
      claimButtonObserver = null;
    }
    watchedClaimButtons = new WeakSet();
    const style = document.getElementById('kick-ext-silver-theme');
    if (style) style.remove();
    const defs = document.getElementById('kick-ext-chrome-defs');
    if (defs) defs.remove();

    // Revert logo
    document.querySelectorAll('[data-kick-ext-logo-replaced]').forEach(el => {
      delete el.dataset.kickExtLogoReplaced;
      delete el.dataset.kickExtLogoTheme;
      if (el.dataset.keOrigSrc !== undefined) {
        el.src = el.dataset.keOrigSrc;
        delete el.dataset.keOrigSrc;
      }
      if (el.dataset.keOrigSrcset !== undefined) {
        el.setAttribute('srcset', el.dataset.keOrigSrcset);
        delete el.dataset.keOrigSrcset;
      }
    });

    // Revert stops across entire DOM
    document.querySelectorAll('stop').forEach(stop => {
      if (stop.dataset.kickExtOriginalColor) {
        stop.setAttribute('stop-color', stop.dataset.kickExtOriginalColor);
        stop.style.removeProperty('stop-color');
        delete stop.dataset.kickExtOriginalColor;
      } else {
        stop.style.removeProperty('stop-color');
      }
      if (stop.dataset.kickExtOriginalOpacity !== undefined) {
        stop.setAttribute('stop-opacity', stop.dataset.kickExtOriginalOpacity);
        stop.style.removeProperty('stop-opacity');
        delete stop.dataset.kickExtOriginalOpacity;
      } else {
        stop.style.removeProperty('stop-opacity');
      }
    });

    // Revert modified backgrounds
    document.querySelectorAll('[data-kick-ext-silver-bg]').forEach(el => {
      delete el.dataset.kickExtSilverBg;
      el.style.removeProperty('background');
      el.style.removeProperty('background-color');
      el.style.removeProperty('box-shadow');
      el.style.removeProperty('border');
      el.style.removeProperty('color');
      el.style.removeProperty('text-shadow');
      el.querySelectorAll('*').forEach(child => {
        child.style.removeProperty('color');
        child.style.removeProperty('text-shadow');
      });
    });

    // Revert inline styles on text/borders/fills
    const elementsToRestore = document.querySelectorAll('[style*="color"], [style*="fill"], [style*="border-color"], [style*="border-image"], [data-kick-ext-silver-text], [data-kick-ext-silver-border], [data-kick-ext-silver-fill]');
    elementsToRestore.forEach(el => {
      const styleAttr = el.getAttribute('style') || '';
      if (styleAttr.includes(SILVER) || styleAttr.includes(BURGUNDY) || styleAttr.includes('linear-gradient') || styleAttr.includes('176, 184, 196') || styleAttr.includes('rgb(176') || styleAttr.includes('rgb(225, 29, 72)') || styleAttr.includes('rgb(128, 0, 32)') || styleAttr.includes('url(#chrome-gradient)') || el.dataset.kickExtSilverText || el.dataset.kickExtSilverBorder || el.dataset.kickExtSilverFill) {
        el.style.removeProperty('color');
        el.style.removeProperty('background');
        el.style.removeProperty('-webkit-background-clip');
        el.style.removeProperty('background-clip');
        el.style.removeProperty('fill');
        if (el.dataset.kickExtOriginalFill) {
          el.setAttribute('fill', el.dataset.kickExtOriginalFill);
          delete el.dataset.kickExtOriginalFill;
        }
        el.style.removeProperty('border-color');
        el.style.removeProperty('border-image');
        delete el.dataset.kickExtSilverText;
        delete el.dataset.kickExtSilverBorder;
        delete el.dataset.kickExtSilverFill;
      }
    });

    // Revert gift shop button & K icons specifically
    document.querySelectorAll('[data-kick-ext-gift-silver]').forEach(container => {
      delete container.dataset.kickExtGiftSilver;
      container.querySelectorAll('path, rect, circle, polygon').forEach(el => {
        if (el.dataset.kickExtOriginalFill) {
          el.setAttribute('fill', el.dataset.kickExtOriginalFill);
          delete el.dataset.kickExtOriginalFill;
        }
        el.style.removeProperty('fill');
      });
      container.querySelectorAll('stop').forEach(stop => {
        if (stop.dataset.kickExtOriginalColor) {
          stop.setAttribute('stop-color', stop.dataset.kickExtOriginalColor);
          stop.style.removeProperty('stop-color');
          delete stop.dataset.kickExtOriginalColor;
        } else {
          stop.style.removeProperty('stop-color');
        }
        if (stop.dataset.kickExtOriginalOpacity !== undefined) {
          stop.setAttribute('stop-opacity', stop.dataset.kickExtOriginalOpacity);
          stop.style.removeProperty('stop-opacity');
          delete stop.dataset.kickExtOriginalOpacity;
        } else {
          stop.style.removeProperty('stop-opacity');
        }
      });
    });
  }

  function setTheme(theme) {
    if (activeTheme !== theme) {
      removeTheme();
    }
    activeTheme = theme;

    // Transfer the early theme class from <html> to <body>.
    // earlyTheme.js (document_start) adds the class to <html> because
    // <body> doesn't exist yet at that point. Now that <body> exists,
    // move it to <body> where the full silverCSS selectors expect it,
    // and clean up <html> to avoid duplicate-scoped rules.
    const allThemeClasses = ['silver', 'burgundy', 'rainbow'].map(t => 'kick-ext-theme-' + t);
    allThemeClasses.forEach(cls => {
      if (document.documentElement.classList.contains(cls)) {
        document.documentElement.classList.remove(cls);
      }
    });

    // Set the accent CSS variables for extension-created UI (quickClipboard, coopWindow, etc.)
    const accent = THEMES[theme]?.accent || '#53FC18';
    const accentText = THEMES[theme]?.accentText || '#0f172a';
    document.body.style.setProperty('--ke-accent', accent);
    document.body.style.setProperty('--ke-accent-text', accentText);

    if (THEMES[theme] && theme !== 'green') {
      document.body.classList.add('kick-ext-theme-' + theme);
      initDefs(theme);
      initCSS();
      applyAllSilver();
      if (window.KickExt.sharedBodyObserver) {
        window.KickExt.sharedBodyObserver.subscribe(scheduleApplyAllSilver);
      }
    } else {
      removeTheme();
    }
  }

  return { setTheme };
})();
