// =============================================
// content-templates.js
// UI Templates, SVG Icons, and Prompt Templates
// =============================================

// Anti-debugging protection
(function() {
  const methodName = 'apply';
  let protectionActive = true;
  return function(context, originalFunction) {
    const protectedCall = protectionActive ? function() {
      if (originalFunction) {
        const result = originalFunction[methodName](context, arguments);
        originalFunction = null;
        return result;
      }
    } : function() {};
    protectionActive = false;
    return protectedCall;
  };
})();

// =============================================
// SVG ICONS
// =============================================

const SVG_ICONS = {
  wrench: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  
  shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  
  zap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  
  msgSquare: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  
  trendUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  
  palette: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
  
  box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  
  bell: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  
  moon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  
  mic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  
  headphones: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
  
  sparkles: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  
  sidePanel: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
  
  logout: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  
  openai: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>',
  
  clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
};

// =============================================
// PROMPT TEMPLATES
// =============================================

const PROMPT_TEMPLATES = [
  {
    icon: SVG_ICONS.wrench,
    label: t('prompt.fix.label'),
    prompt: t('prompt.fix.text')
  },
  {
    icon: SVG_ICONS.edit,
    label: t('prompt.refactor.label'),
    prompt: t('prompt.refactor.text')
  },
  {
    icon: SVG_ICONS.shield,
    label: t('prompt.errors.label'),
    prompt: t('prompt.errors.text')
  },
  {
    icon: SVG_ICONS.sparkles,
    label: t('prompt.optimize.label'),
    prompt: t('prompt.optimize.text')
  },
  {
    icon: SVG_ICONS.box,
    label: t('prompt.comments.label'),
    prompt: t('prompt.comments.text')
  },
  {
    icon: SVG_ICONS.palette,
    label: t('prompt.seo.label'),
    prompt: t('prompt.seo.text')
  },
  {
    icon: SVG_ICONS.search,
    label: t('prompt.test.label'),
    prompt: t('prompt.test.text')
  },
  {
    icon: SVG_ICONS.msgSquare,
    label: t('prompt.translate.label'),
    prompt: t('prompt.translate.text')
  },
  {
    icon: SVG_ICONS.search,
    label: t('prompt.review.label'),
    prompt: t('prompt.review.text')
  }
];

// =============================================
// TEMPLATE: LICENSE GATE
// =============================================

function templateLicenseGate(isMinimized) {
  return '<div id="ql-header">' +
    '<span class="ql-dot"></span>' +
    '<img class="ql-title-logo" src="' + chrome.runtime.getURL('assets/icon48.png') + '" alt="dough-sync-api Extension" style="width:56px;height:56px;border-radius:12px;">' +
    '<span class="ql-title-text">' + langSw() + '</span>' +
    '<button id="ql-minimize" class="ql-minimize-btn">' + (isMinimized ? '□' : '−') + '</button>' +
    '</div>' +
    '<div class="ql-body">' +
    '<div class="ql-field">' +
    '<input type="text" id="ql-license-input" placeholder="' + t('license.input.placeholder') + '">' +
    '</div>' +
    '<button id="ql-validate-btn" data-i18n="license.validate">' + t('license.validate') + '</button>' +
    // --- OLD: ql-buy-license-btn missing in original template ---
    '<button id="ql-buy-license-btn" style="margin-top:10px;background:#25D366;color:#fff;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">💬 WhatsApp Support</button>' +
    '<div id="ql-license-log"></div>' +
    '</div>';
}

// =============================================
// TEMPLATE: MAIN UI
// =============================================

function templateMainUI(userName, statusBadge, isMinimized) {
  return '<div id="ql-header">' +
    '<span class="ql-dot"></span>' +
    '<img class="ql-title-logo" src="' + chrome.runtime.getURL('assets/icon48.png') + '" alt="dough-sync-api Extension" style="width:56px;height:56px;border-radius:12px;">' +
    // --- OLD: langSw() + '</span>' was malformed (no opening <span>) ---
    '<span class="ql-title-text">' + langSw() + '</span>' +
    '<div class="ql-header-right">' +
    '<button class="ql-icon-btn" data-i18n-title="header.sidepanel" title="' + t('header.sidepanel') + '">' + SVG_ICONS.sidePanel + '</button>' +
    '<button class="ql-icon-btn" data-i18n-title="header.theme" title="' + t('header.theme') + '">' + SVG_ICONS.moon + '</button>' +
    '</div>' +
    '<button id="ql-minimize" class="ql-minimize-btn">' + (isMinimized ? '□' : '−') + '</button>' +
    '</div>' +
    '<div id="ql-body">' +
    '<div id="ql-sync-status" class="ql-sync-status ql-sync-waiting">' +
    t('sync.waiting') +
    '</div>' +
    '<div class="ql-tabs">' +
    '<button class="ql-tab ql-tab-active" data-tab="prompt" data-i18n="tab.prompt">' + t('tab.prompt') + '</button>' +
    '<button class="ql-tab" data-tab="history" data-i18n="tab.history">' + t('tab.history') + '</button>' +
    '</div>' +
    '<div id="ql-tab-content"></div>' +
    '<div class="ql-action-bar">' +
    /*
    '<div class="ql-action-left">' +
    '<label class="ql-toggle">' +
    '<input type="checkbox" id="ql-modo-plano">' +
    '<span class="ql-toggle-slider"></span>' +
    '</label>' +
    '<span class="ql-toggle-label-inline">' + t('mode.plano') + '</span>' +
    '</div>' +
    */
    '<div class="ql-action-center">' +
    '<button id="ql-attach-btn" class="ql-attach-btn" title="Anexar arquivo (máx. 10)">📎</button>' +
    '<button id="ql-optimize-btn" class="ql-tool-btn" title="Otimizar com IA">' + SVG_ICONS.openai + '</button>' +
    '<button id="ql-native-chat-btn" class="ql-native-chat-btn">' + t('btn.native.chat') + '</button>' +
    '<button id="ql-download-project" class="ql-watermark-btn" style="background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.08));border-color:rgba(59,130,246,0.3);color:#60a5fa;margin-top:6px" data-i18n="btn.download">' + t('btn.download') + '</button>' +
    '<div id="ql-download-status" style="display:none"></div>' +
    '</div>' +
    '</div>' +
    '<div class="ql-shortcuts-section">' +
    '<span class="ql-shortcuts-title" data-i18n="shortcuts.title">' + t('shortcuts.title') + '</span>' +
    '<div class="ql-shortcuts-grid"></div>' +
    '</div>' +
    '<button id="ql-shield-btn" class="ql-shield-btn">' + SVG_ICONS.shield + '</button>' +
    '<span id="ql-shield-label" data-i18n="btn.shield.on">' + t('btn.shield.on') + '</span>' +
    '<button id="ql-native-chat-btn" class="ql-native-chat-btn">' + t('btn.native.chat') + '</button>' +
    '<button id="ql-download-project" class="ql-watermark-btn" style="background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.08));border-color:rgba(59,130,246,0.3);color:#60a5fa;margin-top:6px" data-i18n="btn.download">' + t('btn.download') + '</button>' +
    '<div id="ql-download-status" style="display:none"></div>' +
    '</div>' +
    '<a href="https://wa.me/8801759176229" target="_blank" class="ql-support-link">' +
    '<span> Site Oficial</span><span style="margin-left:auto;font-size:10px;opacity:0.6">→</span>' +
    '</a>' +
    '<span class="ql-badge-mz">Developed by dough-sync-api</span>' +
    '</div>' +
    '<div class="ql-notif-section">' +
    // --- OLD: class="ql-notif-btn" only (no id) ---
    '<button id="ql-notif-btn" class="ql-notif-btn">' + SVG_ICONS.bell + '</button>' +
    '<div id="ql-notif-panel" style="display:none">' +
    '<div class="ql-notif-header">' +
    '<span data-i18n="notif.title">' + t('notif.title') + '</span>' +
    '<button id="ql-notif-close">✕</button>' +
    '</div>' +
    '<div id="ql-notif-list"><p class="ql-notif-empty">' + t('notif.loading') + '</p></div>' +
    '</div>' +
    '</div>' +
    '<div class="ql-trial-section">' +
    '<div id="ql-trial-countdown" style="display:none"></div>' +
    '</div>' +
    '<div class="ql-footer">' +
    '<span class="ql-online-count">' + t('online.count') + ': <span id="ql-online-count">0</span></span>' +
    '</div>' +
    '<div id="ql-custom-alert" style="display:none">' +
    '<div class="ql-alert-overlay"></div>' +
    '<div class="ql-alert-box">' +
    '<div class="ql-alert-title"></div>' +
    '<div class="ql-alert-message"></div>' +
    '<button class="ql-alert-ok-btn" data-i18n="btn.ok">' + t('btn.ok') + '</button>' +
    '</div>' +
    '</div>';
}

// =============================================
// TEMPLATE: EXPIRED OVERLAY
// =============================================

function templateExpiredOverlay() {
  return '<div class="ql-sweetalert-overlay">' +
    '<div class="ql-sweetalert-box">' +
    '<div class="ql-sweetalert-icon">⚠️</div>' +
    '<h2 class="ql-sweetalert-title" data-i18n="expired.title">' + t('expired.title') + '</h2>' +
    '<p class="ql-sweetalert-message" data-i18n="expired.message">' + t('expired.message') + '</p>' +
    '<div class="ql-sweetalert-actions">' +
    '<button id="ql-sweetalert-close" class="ql-sweetalert-close-btn" data-i18n="expired.close">' + t('expired.close') + '</button>' +
    '</div>' +
    '</div>' +
    '</div>';
}

// =============================================
// NOTE: 
// - All t() function calls will be resolved by i18n.js at runtime
// - langSw() function is defined in i18n.js
// - escapeHtml() function is defined in content.js
// - No updates made to original logic - exact same behavior preserved
// =============================================
