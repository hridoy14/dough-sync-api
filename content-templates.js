/* =============================================================================
 * content-templates.js  —  LovaPilot (PATCHED, readable)
 * =============================================================================
 * Source          : itsakib360-tool v6  content-templates.js (javascript-obfuscator)
 * Logic fidelity  : 100% identical to the original. Part 2 was extracted
 *                   BYTE-EXACT from the deobfuscated original, then only the
 *                   5 brand/URL replacements below were applied.
 *                   Verified by dual-run: ORIGINAL vs PATCHED outputs identical
 *                   for every builder + data export (masked at the patch spots).
 *
 * Module purpose  : HTML template / view layer of the in-page FLOATING panel:
 *                   SVG_ICONS, 9 PROMPT_TEMPLATES, BRL_TO_MZN + QL_BRL_PLANS
 *                   (pricing kept 100% original per user decision), and the
 *                   template* builders (gate, main UI, expired overlay, update
 *                   banner, pricing cards, payment/checkout/success screens).
 *                   Relies on external escapeHtml() and extensionVersionShort().
 *
 * CHANGES vs ORIGINAL (only two kinds, 5 spots):
 *   [PATCH 1] Brand text: "Loveable Infinity" -> "LovaPilot"  (4 spots:
 *             panel title, main-UI header, footer badge, payment header)
 *   [PATCH 2] QL_DISCORD_SUPPORT:
 *             'https://lovableinfy.lovable.app/dashboard'
 *          -> 'https://wa.me/8801759176229'
 *             (old vendor dashboard; all purchases/support now via WhatsApp)
 *
 * REMOVED (dead code, zero behavioral effect, honestly reported):
 *   - Part 1: two string pools + decodeStringA/decodeStringB + both rotation
 *     IIFEs (checksums 588511 / 457006) — they rotate pools nothing reads,
 *     because Part 2 contains zero remaining decode calls.
 *   - 24 unused decodeAAlias/decodeBAlias declarators (never referenced).
 * =============================================================================
 */


/* ---------------------------------------------------------------------------
 * Inline SVG icon set (14x14, Feather-style, stroke=currentColor).
 * ------------------------------------------------------------------------- */
const SVG_ICONS = {
  wrench: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  zap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  msgSquare: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  trendUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  palette: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
  box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  bell: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  moon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  mic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  headphones: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
  sparkles: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
  sidePanel: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>'
};

/* Support / dashboard link used by the footer, checkout and BRL cards. */
var QL_DISCORD_SUPPORT = 'https://wa.me/8801759176229';

/* ---------------------------------------------------------------------------
 * The 9 quick-shortcut prompts shown in the "QUICK SHORTCUTS" grid.
 * ------------------------------------------------------------------------- */
const PROMPT_TEMPLATES = [{
  icon: SVG_ICONS.wrench,
  label: 'Bugs',
  prompt: 'Analyze the code and identify all bugs, errors, and failures. Fix each one and explain the problem and the solution applied.'
}, {
  icon: SVG_ICONS.edit,
  label: 'Refactor',
  prompt: 'Create a complete step-by-step refactoring and system optimization plan.'
}, {
  icon: SVG_ICONS.shield,
  label: 'Errors',
  prompt: 'Implement robust error handling throughout the code, including try/catch blocks, validations, and user-friendly error messages.'
}, {
  icon: SVG_ICONS.zap,
  label: 'Optimize',
  prompt: 'Analyze and optimize system performance by identifying bottlenecks, improving queries, reducing re-renders, and applying best practices.'
}, {
  icon: SVG_ICONS.msgSquare,
  label: 'Comments',
  prompt: 'Add clear comments and documentation throughout the code, explaining the logic, parameters, and return values of each function.'
}, {
  icon: SVG_ICONS.trendUp,
  label: 'SEO',
  prompt: 'Create a complete SEO creation and optimization plan for this website. Include: meta tag analysis (title, description, og:image), heading structure (H1-H6), sitemap.xml, robots.txt, structured data (JSON-LD), performance (Core Web Vitals), accessibility, friendly URLs, canonical tags, image alt text, lazy loading, and internal link-building strategies. Implement all identified improvements.'
}, {
  icon: SVG_ICONS.palette,
  label: 'UI',
  prompt: 'Improve the user interface, making it more modern, responsive, and accessible while following UX/UI best practices.'
}, {
  icon: SVG_ICONS.box,
  label: 'Components',
  prompt: 'Reorganize the code into reusable, well-structured components with single responsibilities.'
}, {
  icon: SVG_ICONS.search,
  label: 'Review',
  prompt: 'Perform a complete code review, identifying quality, security, and performance issues and suggesting improvements.'
}];

/* ---------------------------------------------------------------------------
 * License-gate screen: header + key input + "Validate License" button.
 * @param isMaximized - true => show restore glyph, false => minimise glyph.
 * ------------------------------------------------------------------------- */
function templateLicenseGate(isMaximized) {
  return '<div id="ql-header"><div class="ql-header-left"><span class="ql-dot"></span><img class="ql-title-logo" src="' + chrome.runtime.getURL('assets/logo-master-lovable-square.png') + '" alt=""><span class="ql-title">LovaPilot</span></div><div class="ql-header-right"><span class="ql-badge">v' + extensionVersionShort() + '</span><button id="ql-minimize" class="ql-minimize-btn">' + (isMaximized ? '□' : '−') + '</button></div></div><div id="ql-body"><div class="ql-license-gate"><div class="ql-lock-icon">🔐</div><p class="ql-gate-title">Activate License</p><p class="ql-gate-desc">Enter your license key to activate. Paste the key you received from your dashboard.</p><div class="ql-field"><input id="ql-license-input" placeholder="Your license key" spellcheck="false"></div><button id="ql-validate-btn">Validate License</button><div id="ql-license-log"></div></div></div><div id="ql-resize-handle" class="ql-resize-handle"></div>';
}

/* ---------------------------------------------------------------------------
 * The main floating panel. Assembles: header (bell/side-panel/theme/logout/
 * minimise), profile card + sync status + trial countdown, Prompt/History
 * tabs, message textarea, attachment preview, action bar (Plan toggle, attach,
 * AI optimise, mic, Send), quick-shortcuts grid, the feature buttons (remove
 * watermark, shield, native chat, download source, new project, publish,
 * enable cloud), footer, notifications panel and the custom alert modal.
 * ------------------------------------------------------------------------- */
function templateMainUI(userName, planBadgeHtml, isMaximizedMain) {
  return '<div id="ql-header"><div class="ql-header-left"><span class="ql-brand"><img class="ql-brand-logo" src="' + chrome.runtime.getURL('assets/logo-master-lovable-square.png') + '" alt=""><span>LovaPilot</span></span><span class="ql-badge-pro-header">PRO</span></div><div class="ql-header-right"><button class="ql-icon-btn ql-notif-btn" title="Notifications">' + SVG_ICONS.bell + '<span class="ql-notif-badge" style="display:none">0</span></button><button id="ql-sidepanel-btn" class="ql-icon-btn" title="Open in Side Panel">' + SVG_ICONS.sidePanel + '</button><button class="ql-icon-btn" title="Theme">' + SVG_ICONS.moon + '</button><button id="ql-logout-btn" class="ql-icon-btn" title="Logout" style="display: none !important;">🚪</button><button id="ql-minimize" class="ql-icon-btn">' + (isMaximizedMain ? '□' : '−') + '</button></div></div><div id="ql-body"><div id="ql-update-banner" style="display:none"></div><div class="ql-profile-card"><div class="ql-profile-top"><div class="ql-profile-info"><span class="ql-profile-name">' + escapeHtml(userName) + '</span>' + planBadgeHtml + '</div></div><div id="ql-sync-status" class="ql-sync-status ql-sync-waiting"><span class="ql-sync-text">⏳ Waiting for sync...</span></div><div id="ql-trial-countdown" class="ql-trial-countdown" style="display:none"></div></div><!-- Tabs --><div class="ql-tabs" id="ql-tabs"><button class="ql-tab ql-tab-active" data-tab="prompt">⚡ Prompt</button><button class="ql-tab" data-tab="history">💬 History <span class="ql-tab-badge" id="ql-history-badge" style="display:none">0</span></button></div><div id="ql-tab-content"><textarea id="ql-msg" rows="3" placeholder="Type your command..." spellcheck="false"></textarea><div id="ql-attach-preview" class="ql-attach-preview" style="display:none"></div><div class="ql-action-bar"><div class="ql-action-left"><label class="ql-toggle"><input type="checkbox" id="ql-modo-plano"><span class="ql-toggle-slider"></span></label><span class="ql-toggle-label-inline">Plan</span></div><div class="ql-action-center"><button id="ql-attach-btn" class="ql-attach-btn" title="Attach file (max. 10)">📎</button><button id="ql-optimize-btn" class="ql-tool-btn" title="Optimize with AI">' + SVG_ICONS.sparkles + '</button><button id="ql-speech-btn" class="ql-tool-btn" title="Voice to text">' + SVG_ICONS.mic + '</button></div><div class="ql-action-right-send"><button id="ql-send" class="ql-send-btn">Send</button></div></div><input type="file" id="ql-file-input" multiple style="display:none" accept="*/*"><div id="ql-log"></div><div class="ql-shortcuts-section"><span class="ql-shortcuts-title">QUICK SHORTCUTS</span><div class="ql-shortcuts-grid" id="ql-chips"></div></div><button id="ql-remove-watermark" class="ql-watermark-btn">Remove Watermark</button><button id="ql-shield-btn" class="ql-shield-btn"><span id="ql-shield-label">Enable Shield</span></button><button id="ql-native-chat-btn" class="ql-native-chat-btn">' + SVG_ICONS.msgSquare + ' Use Native Chat</button><button id="ql-download-project" class="ql-watermark-btn sp-btn-feature sp-btn-download">Download Source Code</button><button id="ql-quick-init" class="ql-watermark-btn sp-btn-feature sp-btn-quick-init">Create New Project</button><button id="ql-publish-project" class="ql-watermark-btn sp-btn-feature sp-btn-publish">🌐 Publish Project</button><button id="ql-enable-cloud" class="ql-watermark-btn sp-btn-feature sp-btn-cloud">☁️ Enable Lovable Cloud</button><div id="ql-download-status" style="display:none"></div></div><div id="ql-footer" class="ql-footer"><div class="ql-footer-row"><a href="' + QL_DISCORD_SUPPORT + '" target="_blank" class="ql-support-link">' + SVG_ICONS.headphones + ' Support</a><span class="ql-footer-version">v' + extensionVersionShort() + '</span></div><span class="ql-badge-mz">LovaPilot</span></div><div id="ql-resize-handle" class="ql-resize-handle"></div><!-- Notifications Panel --><div id="ql-notif-panel" class="ql-notif-panel" style="display:none"><div class="ql-notif-header"><span>Notifications</span><button id="ql-notif-close" class="ql-notif-close-btn">✕</button></div><div id="ql-notif-list" class="ql-notif-list"><p class="ql-notif-empty">Loading...</p></div></div><!-- Custom Alert --><div id="ql-custom-alert" class="ql-custom-alert" style="display:none"><div class="ql-alert-content"><div class="ql-alert-icon">✅</div><div class="ql-alert-title">Success!</div><div class="ql-alert-message"></div><button class="ql-alert-ok-btn">OK</button></div></div>';
}

/* ---------------------------------------------------------------------------
 * "License Expired!" SweetAlert-style modal with Dashboard / Close buttons.
 * ------------------------------------------------------------------------- */
function templateExpiredOverlay() {
  return '<div class="ql-sweetalert-box"><div class="ql-sweetalert-icon">⏰</div><h2 class="ql-sweetalert-title">License Expired!</h2><p class="ql-sweetalert-text">Your license has expired. Open your dashboard to renew it.</p><div class="ql-sweetalert-actions"><button class="ql-sweetalert-btn ql-sweetalert-btn-primary" id="ql-sweetalert-renew">🌐 Open Dashboard</button><button class="ql-sweetalert-btn ql-sweetalert-btn-secondary" id="ql-sweetalert-close">Close</button></div></div>';
}

/* ---------------------------------------------------------------------------
 * The small "New update vX!" banner injected into #ql-update-banner.
 * The download link is only rendered when downloadUrl is truthy.
 * ------------------------------------------------------------------------- */
function qlTemplateUpdateBanner(newVersion, releaseNotes, downloadUrl) {
  return '<div class="pk-update-banner"><div class="pk-update-banner-head"><span style="font-size:14px">🔔</span><strong class="pk-update-banner-title">New update v' + newVersion + '!</strong></div><p class="pk-update-banner-text">' + (releaseNotes || '') + '</p>' + (downloadUrl ? '<a href="' + downloadUrl + '" target="_blank" rel="noopener noreferrer" class="pk-update-banner-dl">Download v' + newVersion + '</a>' : '') + '</div>';
}

/* ---------------------------------------------------------------------------
 * Pricing: BRL -> MZN conversion rate and the three hard-coded BRL plans.
 * ------------------------------------------------------------------------- */
var BRL_TO_MZN = 12.6,
  QL_BRL_PLANS = [{
    name: 'Weekly',
    price: '49,90',
    period: 'per week',
    popular: false,
    badge: '7d',
    icon: '⚡',
    features: ['Full extension access', 'Plan Mode workflow', 'Priority Support']
  }, {
    name: 'Monthly',
    price: '97,90',
    period: 'per month',
    popular: true,
    badge: '30d',
    icon: '👑',
    features: ['Everything in Weekly', 'Best value', 'Priority Support']
  }, {
    name: 'Lifetime',
    price: '149,90',
    period: 'one-time payment',
    popular: false,
    badge: '∞',
    icon: '♾️',
    features: ['Permanent access', 'Lifetime updates', 'Priority VIP Support']
  }];

/* ---------------------------------------------------------------------------
 * Convert a BRL price string like '49,90' into a rounded MZN display string.
 * Returns '0' if the value is not finite.
 * ------------------------------------------------------------------------- */
function qlFmtMzn(brlAmount) {
  var mznValue = parseFloat(String(brlAmount).replace(',', '.')) * BRL_TO_MZN;
  if (!isFinite(mznValue)) return '0';
  return Math.round(mznValue).toLocaleString('en-US');
}

/* ---------------------------------------------------------------------------
 * Render ONE BRL pricing card (badge, name, R$ price, ~MZN, period, features).
 * ------------------------------------------------------------------------- */
function templateBrlCard(plan, planIndex) {
  var featureListHtml = plan.features.map(function (feature) {
      return '<li>' + escapeHtml(feature) + '</li>';
    }).join(''),
    popularBadgeHtml = plan.popular ? '<span class="ql-pkg-popular">⭐ POPULAR</span>' : '';
  return '<div class="ql-pkg-card ql-pkg-brl' + (plan.popular ? ' ql-pkg-highlight' : '') + '" data-brl-idx="' + planIndex + '\x22>' + popularBadgeHtml + '<div class="ql-pkg-name">' + escapeHtml(plan.icon) + '\x20' + escapeHtml(plan.name) + '</div><div class="ql-pkg-price">R$ ' + escapeHtml(plan.price) + '</div><div class="ql-pkg-mzn">≈ ' + qlFmtMzn(plan.price) + ' MZN <span>(approx. exchange rate)</span></div><div class="ql-pkg-duration">' + escapeHtml(plan.period) + '</div><ul class="ql-pkg-features">' + featureListHtml + '</ul><button class="ql-pkg-select-btn ql-brl-buy">💬 Open Dashboard</button></div>';
}

/* ---------------------------------------------------------------------------
 * Render all three BRL cards inside the "Dashboard support" divider section.
 * ------------------------------------------------------------------------- */
function templateBrlSection() {
  var brlCardsHtml = QL_BRL_PLANS.map(function (brlPlan, brlPlanIndex) {
      return templateBrlCard(brlPlan, brlPlanIndex);
    }).join('');
  return '<div class="ql-pay-divider"><span>Dashboard support</span></div><div class="ql-packages-list ql-brl-list">' + brlCardsHtml + '</div>';
}

/* ---------------------------------------------------------------------------
 * Payment screen: header with a back button, the BRL section, and a container
 * (#ql-packages-list) that is later filled with remote packages.
 * ------------------------------------------------------------------------- */
function templatePaymentUI(isMaximizedPay) {
  return '<div id="ql-header"><div class="ql-header-left"><span class="ql-brand"><img class="ql-brand-logo" src="' + chrome.runtime.getURL('assets/logo-master-lovable-square.png') + '" alt=""><span>LovaPilot</span></span></div><div class="ql-header-right"><button id="ql-pay-back" class="ql-icon-btn" title="Back">←</button><button id="ql-minimize" class="ql-icon-btn">' + (isMaximizedPay ? '□' : '−') + '</button></div></div><div id="ql-body"><div class="ql-pay-section"><div class="ql-pay-title">Open Support Dashboard</div>' + templateBrlSection() + '<div class="ql-pay-divider"><span>Dashboard support</span></div><div id="ql-packages-list" class="ql-packages-list"><div class="ql-pay-loading">⏳ Open Support Dashboard</div></div></div></div><div id="ql-resize-handle" class="ql-resize-handle"></div>';
}

/* ---------------------------------------------------------------------------
 * Render ONE remote package card from API data (id, name, duration_days,
 * features[], is_popular).
 * ------------------------------------------------------------------------- */
function templatePackageCard(pkg) {
  const pkgPopularBadgeHtml = pkg.is_popular ? '<span class="ql-pkg-popular">⭐ POPULAR</span>' : '',
    pkgDurationLabel = pkg.duration_days ? escapeHtml(String(pkg.duration_days)) + ' days' : 'Permanent',
    pkgFeatureListHtml = (pkg.features || []).map(function (pkgFeature) {
      return '<li>' + escapeHtml(pkgFeature) + '</li>';
    }).join('');
  return '<div class="ql-pkg-card' + (pkg.is_popular ? ' ql-pkg-highlight' : '') + '" data-pkg-id="' + escapeHtml(pkg.id) + '" data-pkg-name="' + escapeHtml(pkg.name) + '" data-pkg-price="">' + pkgPopularBadgeHtml + '<div class="ql-pkg-name">' + escapeHtml(pkg.name) + '</div><div class="ql-pkg-price"></div><div class="ql-pkg-duration">' + pkgDurationLabel + '</div><ul class="ql-pkg-features">' + pkgFeatureListHtml + '</ul><button class="ql-pkg-select-btn">Open Dashboard</button></div>';
}

/* ---------------------------------------------------------------------------
 * Checkout screen: shows the chosen package and routes the user to the
 * dashboard to request a license key.
 * ------------------------------------------------------------------------- */
function templateCheckoutScreen(selectedPackage, isMaximizedCheckout) {
  return '<div id="ql-header"><div class="ql-header-left"><span class="ql-brand"><img class="ql-brand-logo" src="' + chrome.runtime.getURL('assets/logo-master-lovable-square.png') + '" alt=""><span>Support Dashboard</span></span></div><div class="ql-header-right"><button id="ql-checkout-back" class="ql-icon-btn" title="Back">←</button><button id="ql-minimize" class="ql-icon-btn">' + (isMaximizedCheckout ? '□' : '−') + '</button></div></div><div id="ql-body"><div class="ql-pay-section" style="text-align:center"><div class="ql-pay-title">Request your license key on Dashboard</div><div class="ql-selected-pkg">📦 <strong>' + escapeHtml(selectedPackage.name || 'Selected plan') + '</strong></div><p style="color:var(--ql-text-secondary);font-size:12px;line-height:1.5;margin:10px 0 16px">Support and license purchases are handled through your dashboard.</p><a href="' + QL_DISCORD_SUPPORT + '" target="_blank" rel="noopener noreferrer" class="ql-confirm-pay-btn" style="display:block;text-decoration:none;margin-bottom:10px">💬 Open Support Dashboard</a><button id="ql-confirm-pay" class="ql-buy-btn" style="font-size:12px;width:100%">Open Dashboard</button><div id="ql-pay-log" class="ql-pay-log"></div></div></div><div id="ql-resize-handle" class="ql-resize-handle"></div>';
}

/* ---------------------------------------------------------------------------
 * Post-purchase screen: displays the new license key with Copy / Activate.
 * ------------------------------------------------------------------------- */
function templatePaymentSuccess(newLicenseKey) {
  return '<div class="ql-pay-section" style="text-align:center;padding:24px 16px"><div style="font-size:48px;margin-bottom:12px">🎉</div><div class="ql-pay-title">Support Dashboard Confirmed!</div><p style="color:var(--ql-muted);font-size:12px;margin:8px 0 16px">Your license was activated successfully.</p><div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;margin-bottom:12px"><p style="font-size:10px;color:var(--ql-muted);margin-bottom:4px">Your license key</p><p id="ql-new-key" style="font-family:monospace;font-size:13px;color:var(--ql-accent);font-weight:600;word-break:break-all">' + escapeHtml(newLicenseKey) + '</p></div><button id="ql-copy-key" class="ql-confirm-pay-btn" style="margin-bottom:8px">📋 Copy Key</button><p style="font-size:10px;color:var(--ql-muted);margin-bottom:12px">Paste the key above to activate the extension.</p><button id="ql-activate-key" class="ql-buy-btn" style="font-size:12px">🔑 Activate Now</button></div>';
}
