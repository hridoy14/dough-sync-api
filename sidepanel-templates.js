/* =============================================================================
 * sidepanel-templates.js  —  LovaPilot (PATCHED, readable)
 * =============================================================================
 * Source          : itsakib360-tool v6  sidepanel-templates.js (javascript-obfuscator)
 * Logic fidelity  : 100% identical to the original. Part 2 of the deobfuscated
 *                   original was extracted BYTE-EXACT (including the original's
 *                   pre-existing mojibake arrow/ellipsis sequences in two UI
 *                   strings), then only the 3 brand/URL patches below applied.
 *                   Verified by dual-run: ORIGINAL vs PATCHED outputs identical
 *                   for every builder/helper (masked at the 3 patch spots).
 *
 * Module purpose  : HTML template / view layer of the side panel:
 *                   SP_SVG icon set, SP_TEMPLATES (9 quick prompts), escaping /
 *                   URL-sanitizer / format helpers, and all spTemplate* builders.
 *
 * CHANGES vs ORIGINAL (only three):
 *   [PATCH 1] License gate text: "activate Lovable Infinity." -> "activate LovaPilot."
 *   [PATCH 2] Support-link fallback: 'https://discord.gg/9ZBezyTEu5'
 *                                  -> 'https://wa.me/8801759176229'
 *             (Primary path is DISCORD_SUPPORT_URL; extension-config already
 *              sets it to the wa.me link. Fallback fires only if config missing.)
 *   [PATCH 3] Advanced Options section label: "Infinity Features" -> "LovaPilot Features"
 *
 * REMOVED (dead code, zero behavioral effect, honestly reported):
 *   - Part 1 decoder machinery: 1200-entry base64 pool, decodeString(),
 *     getStringPool(), the rotation IIFE, and 'var decode = decodeString'.
 *     The rotation checksum (296408) genuinely rotates the pool at load, but
 *     with zero remaining decode calls the result is never read anywhere.
 *   - 21 unused 'var decodeAliasN = decodeString' declarators that the
 *     obfuscator injected into functions (never referenced afterwards).
 * =============================================================================
 */


/* ---------------------------------------------------------------------------
 * SP_SVG — inline SVG icon set for the side panel (12-14 px, Feather style,
 * stroke="currentColor"). The obfuscator expanded the original object literal
 * into property-by-property assignments; that exact shape is preserved.
 * ------------------------------------------------------------------------- */
var spSvgIcons = {};
spSvgIcons.sparkles = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>', spSvgIcons.mic = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>', spSvgIcons.wrench = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>', spSvgIcons.edit = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>', spSvgIcons.shield = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', spSvgIcons.zap = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', spSvgIcons.msgSq = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', spSvgIcons.trendUp = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>', spSvgIcons.palette = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>', spSvgIcons.box = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>', spSvgIcons.search = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>', spSvgIcons.file = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', spSvgIcons.x = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', spSvgIcons.check = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', spSvgIcons.xCircle = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>', spSvgIcons.keyRound = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>', spSvgIcons.globe = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', spSvgIcons.cloud = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>', spSvgIcons.trash = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', spSvgIcons.download = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>', spSvgIcons.plus = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>', spSvgIcons.logOut = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>', spSvgIcons.arrowRight = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>', spSvgIcons.copy = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>', spSvgIcons.bell = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>', spSvgIcons.moon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>', spSvgIcons.headphones = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v3a9 9 0 0 0 18 0v-3"/><path d="M21 16v2a2 2 0 0 1-2 2h-2"/><path d="M3 16v2a2 2 0 0 0 2 2h2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', spSvgIcons.chevronDown = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>', spSvgIcons.sidePanel = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>', spSvgIcons.paperclip = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>', spSvgIcons.messageSquare = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', spSvgIcons.user = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', spSvgIcons.clock = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', spSvgIcons.checkCheck = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>';
const SP_SVG = spSvgIcons;

/* ---------------------------------------------------------------------------
 * SP_TEMPLATES — the 9 quick-shortcut prompts, each { icon, label, prompt }.
 * Again built one property at a time, exactly as the original did.
 * ------------------------------------------------------------------------- */
var spTemplateBugs = {};
spTemplateBugs.icon = SP_SVG.wrench, spTemplateBugs.label = 'Bugs', spTemplateBugs.prompt = 'Analyze the code and identify all bugs, errors, and failures. Fix each one and explain the problem and the solution applied.';
var spTemplateRefactor = {};
spTemplateRefactor.icon = SP_SVG.edit, spTemplateRefactor.label = 'Refactor', spTemplateRefactor.prompt = 'Create a complete step-by-step refactoring and system optimization plan.';
var spTemplateErrors = {};
spTemplateErrors.icon = SP_SVG.shield, spTemplateErrors.label = 'Errors', spTemplateErrors.prompt = 'Implement robust error handling throughout the code.';
var spTemplateOptimize = {};
spTemplateOptimize.icon = SP_SVG.zap, spTemplateOptimize.label = 'Optimize', spTemplateOptimize.prompt = 'Analyze and optimize system performance.';
var spTemplateComments = {};
spTemplateComments.icon = SP_SVG.msgSq, spTemplateComments.label = 'Comments', spTemplateComments.prompt = 'Add clear comments and documentation throughout the code.';
var spTemplateSeo = {};
spTemplateSeo.icon = SP_SVG.trendUp, spTemplateSeo.label = 'SEO', spTemplateSeo.prompt = 'Create a complete SEO creation and optimization plan for this website.';
var spTemplateUi = {};
spTemplateUi.icon = SP_SVG.palette, spTemplateUi.label = 'UI', spTemplateUi.prompt = 'Improve the user interface, making it more modern, responsive, and accessible.';
var spTemplateComponents = {};
spTemplateComponents.icon = SP_SVG.box, spTemplateComponents.label = 'Components', spTemplateComponents.prompt = 'Reorganize the code into reusable components.';
var spTemplateReview = {};
spTemplateReview.icon = SP_SVG.search, spTemplateReview.label = 'Review', spTemplateReview.prompt = 'Perform a complete code review, identifying quality, security, and performance issues.';

/* The ordered list consumed by the shortcuts grid. */
const SP_TEMPLATES = [spTemplateBugs, spTemplateRefactor, spTemplateErrors, spTemplateOptimize, spTemplateComments, spTemplateSeo, spTemplateUi, spTemplateComponents, spTemplateReview];

/* ---------------------------------------------------------------------------
 * XSS-safe HTML escaping: write the value as textContent into a detached div
 * and read back innerHTML, so the browser does the escaping.
 * ------------------------------------------------------------------------- */
function spEscapeHtml(unsafeText) {
  if (!unsafeText) return '';
  const scratchDiv = document.createElement('div');
  return scratchDiv.textContent = String(unsafeText), scratchDiv.innerHTML;
}

/* ---------------------------------------------------------------------------
 * Allow a URL through only when it parses AND uses http:/https:.
 * Anything else (javascript:, data:, malformed) becomes ''.
 * ------------------------------------------------------------------------- */
function spSanitizeUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const parsedUrl = new URL(rawUrl);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' ? rawUrl : '';
  } catch (errParseUrl) {
    return '';
  }
}

/* ---------------------------------------------------------------------------
 * License-gate screen: key input, validate button and a support link that
 * falls back to a hard-coded invite when DISCORD_SUPPORT_URL is undefined.
 * ------------------------------------------------------------------------- */
function spTemplateLicenseGate() {
  return '<div class="sp-license-gate"><div class="sp-gate-card"><div class="sp-lock-icon">' + SP_SVG.keyRound + '</div><p class="sp-gate-title">Activate License</p><p class="sp-gate-desc">Enter your license key (LI-XXXX format) to activate LovaPilot.</p><div class="sp-input-wrap"><span class="sp-input-icon">' + SP_SVG.keyRound + '</span><input class="sp-input" id="sp-license-input" placeholder="LI-XXXX-XXXX-XXXX" spellcheck="false"></div><button class="sp-btn-primary" id="sp-validate-btn">Validate License</button><div class="sp-log" id="sp-license-log"></div></div><div class="sp-gate-support">Need help? <a href="' + (typeof DISCORD_SUPPORT_URL !== 'undefined' ? DISCORD_SUPPORT_URL : 'https://wa.me/8801759176229') + '" target="_blank">Contact support →</a></div></div>';
}

/* ---------------------------------------------------------------------------
 * The complete side-panel body. Both parameters are accepted but never read -
 * kept as-is so the function signature stays identical to the original.
 * ------------------------------------------------------------------------- */
function spTemplateMainUI(unusedArgA, unusedArgB) {
  return '<div id="sp-update-banner" style="display:none"></div><div class="sp-textarea-wrap"><textarea class="sp-textarea" id="sp-msg" rows="3" placeholder="What would you like Lovable to improve?" spellcheck="false"></textarea><span class="sp-textarea-ai-icon">' + SP_SVG.sparkles + '</span><span class="sp-textarea-counter" id="sp-char-counter">0</span></div><div id="sp-attach-preview" class="sp-attach-preview" style="display:none"></div><div class="sp-action-bar"><div class="sp-action-left"><label class="sp-toggle"><input type="checkbox" id="sp-modo-plano"><span class="sp-toggle-slider"></span></label><span class="sp-toggle-label">Plan</span></div><div class="sp-action-center"><button class="sp-tool-btn" id="sp-attach-btn" title="Attach file">' + SP_SVG.paperclip + '</button></div></div><button class="sp-send-btn" id="sp-send">' + SP_SVG.arrowRight + ' Generate</button><input type="file" id="sp-file-input" multiple style="display:none" accept="*/*"><div class="sp-log" id="sp-log"></div><div class="sp-shortcuts-grid" id="sp-chips"></div><button type="button" class="sp-advanced-toggle" id="sp-advanced-toggle" aria-expanded="false" aria-controls="sp-advanced-panel"><span class="sp-advanced-toggle-label">' + SP_SVG.chevronDown + ' Advanced Options</span><span class="sp-advanced-chevron" aria-hidden="true">' + SP_SVG.chevronDown + '</span></button><div class="sp-advanced-panel" id="sp-advanced-panel" hidden><button id="sp-remove-watermark" class="sp-watermark-btn">' + SP_SVG.shield + ' Remove Watermark</button><button id="sp-shield-btn" class="sp-shield-btn"><span id="sp-shield-label">' + SP_SVG.shield + ' Enable Shield</span></button><button id="sp-native-chat-btn" class="sp-watermark-btn sp-btn-feature sp-btn-native-chat"><span id="sp-native-chat-label">' + SP_SVG.messageSquare + ' Use Native Chat</span></button><button id="sp-download-project" class="sp-watermark-btn sp-btn-feature sp-btn-download">' + SP_SVG.download + ' Download Source Code</button><button id="sp-quick-init" class="sp-watermark-btn sp-btn-feature sp-btn-quick-init">' + SP_SVG.plus + ' Create New Project</button><span class="sp-shortcuts-title sp-section-label">LovaPilot Features</span><button id="sp-publish-project" class="sp-watermark-btn sp-btn-feature sp-btn-publish">' + SP_SVG.globe + ' Publish Project</button><button id="sp-enable-cloud" class="sp-watermark-btn sp-btn-feature sp-btn-cloud">' + SP_SVG.cloud + ' Enable Lovable Cloud</button></div><div id="sp-download-status" class="sp-log" style="display:none"></div><div class="sp-chat-divider"></div><div class="sp-chat-history-container" id="sp-history-area"></div>';
}

/* ---------------------------------------------------------------------------
 * TRIAL pill for trial plans, PRO pill for everything else.
 * ------------------------------------------------------------------------- */
function spTemplateStatusBadge(planType) {
  if (planType === 'trial') return '<span class="sp-status-badge sp-badge-test">TRIAL</span>';
  return '<span class="sp-status-badge sp-badge-pro">PRO</span>';
}

/* ---------------------------------------------------------------------------
 * Generic alert card with a check icon and an OK button. Both strings escaped.
 * ------------------------------------------------------------------------- */
function spTemplateAlert(alertTitle, alertMessage) {
  return '<div class="sp-alert-box"><div class="sp-alert-icon">' + SP_SVG.check + '</div><div class="sp-alert-title">' + spEscapeHtml(alertTitle) + '</div><div class="sp-alert-message">' + spEscapeHtml(alertMessage) + '</div><button class="sp-alert-ok">OK</button></div>';
}

/* ---------------------------------------------------------------------------
 * One notification row. The link is passed through spSanitizeUrl first, and
 * only rendered when it survives; title/message/link are all escaped.
 * ------------------------------------------------------------------------- */
function spTemplateNotifItem(notification) {
  const createdDateLabel = new Date(notification.created_at).toLocaleDateString('en-US'),
    safeLink = spSanitizeUrl(notification.link),
    linkHtml = safeLink ? '<a href="' + spEscapeHtml(safeLink) + '" target="_blank" rel="noopener noreferrer" class="sp-notif-link">Open link â†’</a>' : '';
  return '<div class="sp-notif-item"><div class="sp-notif-item-title">' + spEscapeHtml(notification.title) + '</div><div class="sp-notif-item-msg">' + spEscapeHtml(notification.message) + '</div>' + linkHtml + '<div class="sp-notif-item-date">' + createdDateLabel + '</div></div>';
}

/* ---------------------------------------------------------------------------
 * "Update vX available" banner; the download anchor appears only when a
 * downloadUrl was supplied.
 * ------------------------------------------------------------------------- */
function spTemplateUpdateBanner(newVersion, releaseNotes, downloadUrl) {
  return '<div class="pk-update-banner"><div class="pk-update-banner-head"><span class="pk-update-banner-icon">' + SP_SVG.zap + '</span><strong class="pk-update-banner-title">Update v' + newVersion + ' available</strong></div><p class="pk-update-banner-text">' + (releaseNotes || '') + '</p>' + (downloadUrl ? '<a href="' + downloadUrl + '" target="_blank" rel="noopener noreferrer" class="pk-update-banner-dl">Download v' + newVersion + '</a>' : '') + '</div>';
}

/* ---------------------------------------------------------------------------
 * Trial countdown row (clock icon, label, remaining time) plus a progress bar
 * whose width is progressPercent and whose class is caller-controlled.
 * ------------------------------------------------------------------------- */
function spTemplateCountdown(countdownLabel, countdownTime, progressPercent, progressBarClass) {
  return '<div class="sp-countdown-row"><span class="sp-countdown-icon">' + SP_SVG.clock + '</span><span class="sp-countdown-label">' + countdownLabel + '</span><span class="sp-countdown-time">' + countdownTime + '</span></div><div class="sp-trial-bar"><div class="sp-trial-bar-fill' + progressBarClass + '" style="width:' + progressPercent + '%"></div></div>';
}

/* ---------------------------------------------------------------------------
 * One attachment chip: image thumbnail when previewUrl exists, otherwise a
 * file icon. Adds an 'uploading' modifier class while the upload is running,
 * and a remove button carrying data-idx.
 * ------------------------------------------------------------------------- */
function spTemplateAttachItem(attachment, attachmentIndex) {
  const thumbnailHtml = attachment.previewUrl ? '<img class="sp-attach-thumb" src="' + attachment.previewUrl + '" alt="">' : '<div class="sp-attach-icon">' + SP_SVG.file + '</div>';
  return '<div class="sp-attach-item' + (attachment.uploading ? ' sp-attach-uploading' : '') + '\x22>' + thumbnailHtml + '<div class="sp-attach-info"><span class="sp-attach-name" title="' + spEscapeHtml(attachment.file_name) + '\x22>' + spEscapeHtml(attachment.file_name) + '</span><span class="sp-attach-size">' + spEscapeHtml(attachment.sizeLabel) + '</span></div><button class="sp-attach-remove" data-idx="' + attachmentIndex + '\x22>' + SP_SVG.x + '</button></div>';
}

/* ---------------------------------------------------------------------------
 * Human-readable size: B under 1 KiB, KB under 1 MiB, otherwise MB (1 dp).
 * ------------------------------------------------------------------------- */
function spFormatFileSize(sizeInBytes) {
  if (sizeInBytes < 1024) return sizeInBytes + '\x20B';
  if (sizeInBytes < 1048576) return (sizeInBytes / 1024).toFixed(1) + ' KB';
  return (sizeInBytes / 1048576).toFixed(1) + '\x20MB';
}

/* ---------------------------------------------------------------------------
 * Chat / Account tab bar. The chat tab shows a badge when the count is > 0.
 * ------------------------------------------------------------------------- */
function spTemplateTabs(activeTab, chatBadgeCount) {
  var badgeHtml = chatBadgeCount > 0 ? '<span class="sp-tab-badge">' + chatBadgeCount + '</span>' : '';
  return '<div class="sp-tabs"><button class="sp-tab' + (activeTab === 'chat' ? ' sp-tab-active' : '') + '" data-tab="chat">' + SP_SVG.messageSquare + ' Chat ' + badgeHtml + '</button><button class="sp-tab' + (activeTab === 'account' ? ' sp-tab-active' : '') + '" data-tab="account">' + SP_SVG.user + ' Account</button></div>';
}

/* ---------------------------------------------------------------------------
 * Empty state shown when there is no chat history yet.
 * ------------------------------------------------------------------------- */
function spTemplateChatEmpty() {
  return '<div class="sp-chat-empty"><div class="sp-chat-empty-icon">' + SP_SVG.messageSquare + '</div><div class="sp-chat-empty-title">No messages</div><div class="sp-chat-empty-desc">Your sent prompts will appear here as history.</div></div>';
}

/* ---------------------------------------------------------------------------
 * Friendly date divider label. Compares midnight-to-midnight so the result is
 * unaffected by the time of day: 'Today', 'Yesterday', the weekday name when
 * under a week old, otherwise the locale date.
 * ------------------------------------------------------------------------- */
function spFormatChatDate(timestamp) {
  var messageDate = new Date(timestamp),
    now = new Date(),
    todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    messageMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate()),
    daysAgo = (todayMidnight - messageMidnight) / 86400000;
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][messageDate.getDay()];
  return messageDate.toLocaleDateString('en-US');
}

/* ---------------------------------------------------------------------------
 * Zero-padded 24-hour HH:MM.
 * ------------------------------------------------------------------------- */
function spFormatChatTime(timeValue) {
  var timeDate = new Date(timeValue);
  return String(timeDate.getHours()).padStart(2, '0') + ':' + String(timeDate.getMinutes()).padStart(2, '0');
}

/* ---------------------------------------------------------------------------
 * One chat bubble. status === 'error' switches the class, icon and label;
 * body text longer than 300 chars is truncated with an ellipsis while the
 * title attribute keeps the full (escaped) text.
 * ------------------------------------------------------------------------- */
function spTemplateChatBubble(message) {
  var statusClass = message.status === 'error' ? 'sp-chat-status-err' : 'sp-chat-status-ok',
    statusIcon = message.status === 'error' ? SP_SVG.xCircle : SP_SVG.check,
    statusLabel = message.status === 'error' ? 'Error' : 'Sent',
    bodyHtml = message.text.length > 300 ? spEscapeHtml(message.text.substring(0, 300)) + 'â€¦' : spEscapeHtml(message.text);
  return '<div class="sp-chat-bubble" title="' + spEscapeHtml(message.text) + '\x22>' + bodyHtml + '<div class="sp-chat-meta"><span class="sp-chat-status ' + statusClass + '\x22>' + statusIcon + '\x20' + statusLabel + '</span><span class="sp-chat-time">' + spFormatChatTime(message.timestamp) + '</span><span class="sp-chat-check">' + SP_SVG.checkCheck + '</span></div></div>';
}

/* ---------------------------------------------------------------------------
 * Full history: walks the messages in order, inserting a date divider each
 * time spFormatChatDate() yields a different label, then appends the message
 * count and a Clear button. Falls back to the empty state for no messages.
 * ------------------------------------------------------------------------- */
function spTemplateChatHistory(messages) {
  if (!messages || !messages.length) return spTemplateChatEmpty();
  var html = '<div class="sp-chat-messages">',
    lastDateLabel = '';
  for (var messageIndex = 0; messageIndex < messages.length; messageIndex++) {
    var currentMessage = messages[messageIndex],
      currentDateLabel = spFormatChatDate(currentMessage.timestamp);
    currentDateLabel !== lastDateLabel && (html += '<div class="sp-chat-date-divider"><span class="sp-chat-date-label">' + currentDateLabel + '</span></div>', lastDateLabel = currentDateLabel), html += spTemplateChatBubble(currentMessage);
  }
  return html += '</div>', html += '<div class="sp-chat-actions"><span class="sp-chat-count">' + messages.length + ' message' + (messages.length === 1 ? '' : 's') + '</span><button class="sp-chat-clear" id="sp-chat-clear">' + SP_SVG.trash + ' Clear</button></div>', html;
}

/* ---------------------------------------------------------------------------
 * null / undefined / NaN -> '0', otherwise the value as a string.
 * ------------------------------------------------------------------------- */
function formatCreditsRemaining(credits) {
  if (credits == null || isNaN(credits)) return '0';
  return String(credits);
}

/* ---------------------------------------------------------------------------
 * Account tab header with an SVG progress ring.
 *   plan type 'credits' -> ring shows creditsRemaining / creditsTotal and the
 *                           subtitle reads "N credits remaining"
 *   any other plan       -> ring shows daysPercent with a days-left label and
 *                           the subtitle shows the expiry date
 * The ring uses a purple->red linearGradient (#7c3aed -> #ff4d6a).
 * ------------------------------------------------------------------------- */
function spTemplateAccountHero(planName, planType2, userName, statusBadgeHtml, expiryLabel, daysLeftLabel, unusedHeroArg, creditsRemaining, daysPercent, creditsTotal) {
  var ringHtml = '';
  if (planType2 === 'credits') {
    var creditsPercent = 100;
    creditsTotal && creditsTotal > 0 && creditsRemaining != null && (creditsPercent = Math.min(100, Math.round(creditsRemaining / creditsTotal * 100)));
    var creditsRemainingLabel = creditsRemaining != null ? creditsRemaining.toLocaleString() : '0',
      creditsTotalLabel = creditsTotal ? creditsTotal.toLocaleString() : '';
    ringHtml = '<div class="sp-account-hero-ring sp-ring-credits"><svg width="56" height="56" viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--ql-border)" stroke-width="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#ringGrad)" stroke-width="3" stroke-dasharray="' + creditsPercent + ', 100" stroke-linecap="round"/><defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#ff4d6a"/></linearGradient></defs></svg><div class="sp-ring-credits-text"><span class="sp-ring-credits-num">' + creditsRemainingLabel + '</span><span class="sp-ring-credits-sep"> / </span><span class="sp-ring-credits-total">' + creditsTotalLabel + '</span></div></div>';
  } else ringHtml = '<div class="sp-account-hero-ring"><svg width="56" height="56" viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--ql-border)" stroke-width="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#ringGrad)" stroke-width="3" stroke-dasharray="' + (daysPercent != null ? daysPercent : 0) + ', 100" stroke-linecap="round"/><defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#ff4d6a"/></linearGradient></defs></svg><span class="sp-ring-label">' + daysLeftLabel + '<small>d</small></span></div>';
  return '<div class="sp-card sp-account-hero"><div class="sp-account-hero-left"><div class="sp-profile-top"><span class="sp-profile-name" id="sp-name">' + planName + '</span>' + statusBadgeHtml + '</div><div class="sp-profile-plan" id="pk-plan-name">' + spEscapeHtml(userName) + '</div>' + (planType2 === 'credits' ? '<div class="sp-profile-expiry">' + (creditsRemaining != null ? formatCreditsRemaining(creditsRemaining) : '0') + ' credits remaining</div>' : '<div class="sp-profile-expiry" id="lk-expiry-container">Expires <strong id="valid-until-short">' + expiryLabel + '</strong></div>') + '</div>' + ringHtml + '</div>';
}

/* ---------------------------------------------------------------------------
 * License card: key masked to its first 8 chars followed by ********, a copy
 * button, the expiry row (skipped entirely for 'credits' plans) and the
 * device count ('-' when unknown).
 * ------------------------------------------------------------------------- */
function spTemplateLicenseDetails(licenseKey, expiryText, deviceCount, licensePlanType) {
  var maskedKey = licenseKey ? licenseKey.substring(0, 8) + '********' : '-',
    rowsHtml = '<div class="sp-license-row"><span class="sp-license-label">Key</span><span class="sp-license-value">' + maskedKey + '</span><button class="sp-license-copy" id="sp-license-copy" title="Copy">' + SP_SVG.copy + '</button></div>';
  return licensePlanType !== 'credits' && (rowsHtml += '<div class="sp-license-row"><span class="sp-license-label">Expires</span><span class="sp-license-value" id="license-expires">' + expiryText + '</span></div>'), rowsHtml += '<div class="sp-license-row"><span class="sp-license-label">Devices</span><span class="sp-license-value" id="license-devices">' + (deviceCount != null ? deviceCount : '-') + '</span></div>', '<div class="sp-card sp-license-card"><div class="sp-card-title">License</div>' + rowsHtml + '</div>';
}

/* ---------------------------------------------------------------------------
 * Credits progress bar. The percentage is only computed when a sensible max
 * is supplied (max > left); otherwise the bar is shown full at 100%.
 * ------------------------------------------------------------------------- */
function spTemplateCreditBar(creditsLeft, creditsMax) {
  var barPercent = creditsMax && creditsMax > creditsLeft ? Math.min(100, Math.round(creditsLeft / creditsMax * 100)) : 100;
  return '<div class="sp-credit-bar-wrap" id="sp-credit-bar"><div class="sp-credit-bar-label"><span id="sp-credit-bar-left">' + (creditsLeft != null ? creditsLeft.toLocaleString() : '0') + '</span><span id="sp-credit-bar-right">' + (creditsMax ? ' / ' + creditsMax.toLocaleString() : '') + '</span></div><div class="lk-plan-progress"><div class="lk-plan-progress-fill" id="sp-credit-bar-fill" style="width:' + barPercent + '%"></div></div></div>';
}

/* ---------------------------------------------------------------------------
 * Three stat cards - Credits / Prompts / Projects - each falling back to '-'.
 * ------------------------------------------------------------------------- */
function spTemplateUsageStats(usageCredits, usagePrompts, usageProjects) {
  return '<div class="sp-card sp-usage-card"><div class="sp-usage-col"><span class="sp-usage-value">' + (usageCredits != null ? usageCredits.toLocaleString() : '-') + '</span><span class="sp-usage-label">Credits</span></div><div class="sp-usage-col"><span class="sp-usage-value">' + (usagePrompts != null ? usagePrompts : '-') + '</span><span class="sp-usage-label">Prompts</span></div><div class="sp-usage-col"><span class="sp-usage-value">' + (usageProjects != null ? usageProjects : '-') + '</span><span class="sp-usage-label">Projects</span></div></div>';
}
