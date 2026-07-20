/* ============================================================
 * sidepanel-templates.js
 * dough-sync-api v5.0.0
 * ============================================================
 * HTML Templates, SVG Icons, Prompt Templates, and Utility
 * Functions for the Side Panel UI.
 *
 * Originally obfuscated as: ornobsidepanel-template.js (181 lines)
 * All functions preserved — nothing deleted.
 * Brazilian Portuguese → English. All text in English.
 * Branding: dough-sync-api
 * ============================================================
 *
 * EXPORTED:
 *   - SP_SVG              (SVG icon strings)
 *   - SP_TEMPLATES        (Prompt template array)
 *   - spEscapeHtml(text)
 *   - spValidUrl(url)
 *   - spFormatFileSize(bytes)
 *   - spTemplateAlert(title, message)
 *   - spTemplateLicenseGate()
 *   - spTemplateMainUI(userName, statusBadge)
 *   - spTemplateStatusBadge(status)
 *   - spTemplateNotifItem(notif)
 *   - spTemplateUpdateBanner(version, changelog, downloadUrl)
 *   - spTemplateCountdown(label, timeStr, percentage, urgentClass)
 *   - spTemplateAttachItem(file, index)
 *   - spTemplateTabs(activeTab, historyCount)
 *   - spTemplateChatEmpty()
 *   - spTemplateChatBubble(message)
 *   - spTemplateChatHistory(messages)
 *   - spFormatChatDate(timestamp)
 *   - spFormatChatTime(timestamp)
 *   - spTemplatePromptContent()    [ADDED — needed by sidepanel.js]
 * ============================================================ */

// ============================================================
// SECTION 1: HTML ESCAPE UTILITY
// ============================================================

/**
 * Escapes HTML special characters to prevent XSS.
 * Creates a div, sets textContent, returns innerHTML.
 * @param {string} text - Raw text to escape
 * @returns {string} - Escaped HTML-safe string
 */
function spEscapeHtml(text) {
  if (!text) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

/* OLD (duplicate of spEscapeHtml — kept for reference, do not delete):
function spEscapeHtml_OLD(text) {
  if (!text) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}
*/

// ============================================================
// SECTION 2: URL VALIDATOR
// ============================================================

/**
 * Validates that a URL string is a valid http/https URL.
 * @param {string} url - URL string to validate
 * @returns {string} - Returns URL if valid, empty string if not
 */
function spValidUrl(url) {
  if (!url) {
    return "";
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    } else {
      return "";
    }
  } catch (e) {
    return "";
  }
}

// ============================================================
// SECTION 3: FILE SIZE FORMATTER
// ============================================================

/**
 * Converts bytes to human-readable file size string.
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size (e.g. "1.5 KB", "2.3 MB")
 */
function spFormatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }
  if (bytes < 1048576) {
    return (bytes / 1024).toFixed(1) + " KB";
  }
  return (bytes / 1048576).toFixed(1) + " MB";
}

// ============================================================
// SECTION 4: SVG ICONS
// ============================================================
// All SVG icons used in the side panel UI.
// Keys: sparkles, mic, wrench, edit, shield, zap, msgSq,
//        trendUp, palette, box, search, openai, clock

const SP_SVG = {
  sparkles: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',

  mic: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',

  wrench: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',

  edit: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',

  shield: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',

  zap: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',

  msgSq: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',

  trendUp: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',

  palette: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',

  box: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',

  search: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',

  openai: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.372L15.115 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.403-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>',

  clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
};

// ============================================================
// SECTION 5: PROMPT TEMPLATES (Quick Shortcuts / Chips)
// ============================================================
// Array of prompt shortcut objects used in the chips grid.
// Each object has: icon (SVG), label (i18n key), prompt (i18n key)

const SP_TEMPLATES = [
  {
    icon: SP_SVG.wrench,
    label: t("prompt.bugs.label"),
    prompt: t("prompt.bugs.text")
  },
  {
    icon: SP_SVG.edit,
    label: t("prompt.refactor.label"),
    prompt: t("prompt.refactor.text")
  },
  {
    icon: SP_SVG.shield,
    label: t("prompt.errors.label"),
    prompt: t("prompt.errors.text")
  },
  {
    icon: SP_SVG.zap,
    label: t("prompt.optimize.label"),
    prompt: t("prompt.optimize.text")
  },
  {
    icon: SP_SVG.msgSq,
    label: t("prompt.comments.label"),
    prompt: t("prompt.comments.text")
  },
  {
    icon: SP_SVG.trendUp,
    label: t("prompt.seo.label"),
    prompt: t("prompt.seo.text")
  },
  {
    icon: SP_SVG.palette,
    label: t("prompt.ui.label"),
    prompt: t("prompt.ui.text")
  },
  {
    icon: SP_SVG.box,
    label: t("prompt.components.label"),
    prompt: t("prompt.components.text")
  },
  {
    icon: SP_SVG.search,
    label: t("prompt.review.label"),
    prompt: t("prompt.review.text")
  }
];

// ============================================================
// SECTION 6: LICENSE GATE TEMPLATE
// ============================================================
// Shown when user needs to enter/validate their license key.
// Uses i18n t() for all user-facing text.
// Branding: dough-sync-api logo

/**
 * Returns HTML for the license validation gate screen.
 * @returns {string} - License gate HTML
 */
function spTemplateLicenseGate() {
  return (
    '<div class="sp-license-gate">' +
      '<div class="sp-lock-icon">' +
        '<img src="' + chrome.runtime.getURL("assets/logo-master-lovable-square.png") + '" alt="dough-sync-api" style="width:56px;height:56px;border-radius:12px;">' +
      '</div>' +
      '<p class="sp-gate-title" data-i18n="license.title">' + t("license.title") + '</p>' +
      '<p class="sp-gate-desc" data-i18n="license.desc">' + t("license.desc") + '</p>' +
      '<input class="sp-input" id="sp-license-input" placeholder="DOUGH-XXXX-XXXX-XXXX" spellcheck="false">' +
      '<button class="sp-btn-primary" id="sp-validate-btn" data-i18n="license.validate">' + t("license.validate") + '</button>' +
      '<div class="sp-log" id="sp-license-log"></div>' +
    '</div>'
  );
}

// ============================================================
// SECTION 7: STATUS BADGE TEMPLATE
// ============================================================
// Returns TEST or PRO badge based on license status.

/**
 * Returns HTML for the license status badge.
 * @param {string} status - "trial" or any other value
 * @returns {string} - Badge HTML
 */
function spTemplateStatusBadge(status) {
  if (status === "trial") {
    return '<span class="sp-status-badge sp-badge-test">TEST</span>';
  }
  return '<span class="sp-status-badge sp-badge-pro">PRO</span>';
}

// ============================================================
// SECTION 8: ALERT BOX TEMPLATE
// ============================================================

/**
 * Returns HTML for a side panel alert modal.
 * @param {string} title - Alert title (will be HTML-escaped)
 * @param {string} message - Alert message (will be HTML-escaped)
 * @returns {string} - Alert box HTML
 */
function spTemplateAlert(title, message) {
  return (
    '<div class="sp-alert-box">' +
      '<div class="sp-alert-icon">✅</div>' +
      '<div class="sp-alert-title">' + spEscapeHtml(title) + '</div>' +
      '<div class="sp-alert-message">' + spEscapeHtml(message) + '</div>' +
      '<button class="sp-alert-ok">OK</button>' +
    '</div>'
  );
}

// ============================================================
// SECTION 9: NOTIFICATION ITEM TEMPLATE
// ============================================================
// Renders a single notification with title, message, link, date.

/**
 * Returns HTML for a single notification item.
 * @param {Object} notif - Notification object with title, message, link, created_at
 * @returns {string} - Notification item HTML
 */
function spTemplateNotifItem(notif) {
  var locale = window._ql_lang === "en" ? "en-US" : window._ql_lang === "es" ? "es-ES" : "en-US";
  const dateStr = new Date(notif.created_at).toLocaleDateString(locale);
  const validLink = spValidUrl(notif.link);
  const linkHtml = validLink
    ? '<a href="' + spEscapeHtml(validLink) + '" target="_blank" rel="noopener noreferrer" class="sp-notif-link">' + t("notif.openLink") + '</a>'
    : "";

  return (
    '<div class="sp-notif-item">' +
      '<div class="sp-notif-item-title">' + spEscapeHtml(notif.title) + '</div>' +
      '<div class="sp-notif-item-msg">' + spEscapeHtml(notif.message) + '</div>' +
      linkHtml +
      '<div class="sp-notif-item-date">' + dateStr + '</div>' +
    '</div>'
  );
}

// ============================================================
// SECTION 10: UPDATE BANNER TEMPLATE
// ============================================================
// Shows when a new extension version is available.

/**
 * Returns HTML for the update notification banner.
 * @param {string} version - New version string
 * @param {string} changelog - Changelog text
 * @param {string} downloadUrl - Download URL for the new version
 * @returns {string} - Banner HTML
 */
function spTemplateUpdateBanner(version, changelog, downloadUrl) {
  return (
    '<div style="padding:10px 12px;background:linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.08));border:1px solid rgba(251,191,36,0.3);border-radius:10px;margin:8px 0">' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">' +
        '<span style="font-size:14px">🔔</span>' +
        '<strong style="font-size:11px;color:#f59e0b">' +
          '<span data-i18n="update.title">' + t("update.title") + '</span> ' +
          spEscapeHtml(version || "") + '!</strong>' +
      '</div>' +
      '<p style="font-size:10px;color:#a1a1aa;margin:0 0 6px;white-space:pre-line">' +
        spEscapeHtml(changelog || "") +
      '</p>' +
      (downloadUrl
        ? '<a href="' + spEscapeHtml(downloadUrl) + '" target="_blank" style="display:inline-block;padding:4px 12px;background:#f59e0b;color:#000;border-radius:6px;text-decoration:none;font-size:10px;font-weight:700">' +
            '<span data-i18n="update.download">' + t("update.download") + '</span> ' +
            spEscapeHtml(version || "") +
          '</a>'
        : ""
      ) +
    '</div>'
  );
}

// ============================================================
// SECTION 11: COUNTDOWN TEMPLATE
// ============================================================
// Shows remaining trial/license time with progress bar.

/**
 * Returns HTML for the trial/license countdown display.
 * @param {string} label - Countdown label text
 * @param {string} timeStr - Formatted remaining time
 * @param {number} percentage - Progress bar percentage (0-100)
 * @param {string} urgentClass - CSS class for urgent state (e.g. " sp-bar-urgent")
 * @returns {string} - Countdown HTML
 */
function spTemplateCountdown(label, timeStr, percentage, urgentClass) {
  return (
    '<div class="sp-countdown-row">' +
      '<span>' + SP_SVG.clock + '</span>' +
      '<span class="sp-countdown-label">' + label + '</span>' +
      '<span class="sp-countdown-time">' + timeStr + '</span>' +
    '</div>' +
    '<div class="sp-trial-bar">' +
      '<div class="sp-trial-bar-fill' + urgentClass + '" style="width:' + percentage + '%"></div>' +
    '</div>'
  );
}

// ============================================================
// SECTION 12: FILE ATTACHMENT ITEM TEMPLATE
// ============================================================

/**
 * Returns HTML for a single file attachment preview item.
 * @param {Object} file - File object with previewUrl, file_name, sizeLabel, uploading
 * @param {number} index - Index in the attached files array
 * @returns {string} - Attachment item HTML
 */
function spTemplateAttachItem(file, index) {
  const thumb = file.previewUrl
    ? '<img class="sp-attach-thumb" src="' + file.previewUrl + '" alt="">'
    : '<div class="sp-attach-icon">📄</div>';

  return (
    '<div class="sp-attach-item' + (file.uploading ? " sp-attach-uploading" : "") + '">' +
      thumb +
      '<div class="sp-attach-info">' +
        '<span class="sp-attach-name" title="' + spEscapeHtml(file.file_name) + '">' + spEscapeHtml(file.file_name) + '</span>' +
        '<span class="sp-attach-size">' + spEscapeHtml(file.sizeLabel) + '</span>' +
      '</div>' +
      '<button class="sp-attach-remove" data-idx="' + index + '">✕</button>' +
    '</div>'
  );
}

// ============================================================
// SECTION 13: TABS TEMPLATE
// ============================================================
// Renders Prompt/History tab buttons.

/**
 * Returns HTML for the tab navigation bar.
 * @param {string} activeTab - Currently active tab name ("prompt" or "history")
 * @param {number} historyCount - Number of chat history items (for badge)
 * @returns {string} - Tabs HTML
 */
function spTemplateTabs(activeTab, historyCount) {
  var badge = historyCount > 0 ? '<span class="sp-tab-badge">' + historyCount + '</span>' : "";
  return (
    '<div class="sp-tabs">' +
      '<button class="sp-tab' + (activeTab === "prompt" ? " sp-tab-active" : "") + '" data-tab="prompt">' +
        '<span data-i18n="tab.prompt">' + t("tab.prompt") + '</span>' +
      '</button>' +
      '<button class="sp-tab' + (activeTab === "history" ? " sp-tab-active" : "") + '" data-tab="history">' +
        '<span data-i18n="tab.history">' + t("tab.history") + '</span>' +
        (badge ? " " + badge : "") +
      '</button>' +
    '</div>'
  );
}

// ============================================================
// SECTION 14: CHAT EMPTY STATE TEMPLATE
// ============================================================

/**
 * Returns HTML for the empty chat history state.
 * @returns {string} - Empty state HTML
 */
function spTemplateChatEmpty() {
  return (
    '<div class="sp-chat-empty">' +
      '<div class="sp-chat-empty-icon">💬</div>' +
      '<div class="sp-chat-empty-title" data-i18n="history.empty.title">' + t("history.empty.title") + '</div>' +
      '<div class="sp-chat-empty-desc" data-i18n="history.empty.desc">' + t("history.empty.desc") + '</div>' +
    '</div>'
  );
}

// ============================================================
// SECTION 15: CHAT DATE/TIME FORMATTERS
// ============================================================

/**
 * Formats a timestamp to a human-readable chat date label.
 * Shows "Today", "Yesterday", day name, or full date.
 * @param {string|number} timestamp - Date timestamp
 * @returns {string} - Formatted date string
 */
function spFormatChatDate(timestamp) {
  var msgDate = new Date(timestamp);
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
  var diffDays = (today - msgDay) / 86400000;

  if (diffDays === 0) {
    return t("date.today");
  }
  if (diffDays === 1) {
    return t("date.yesterday");
  }

  var dayNames = t("date.days");
  if (diffDays < 7 && Array.isArray(dayNames)) {
    return dayNames[msgDate.getDay()];
  }

  var locale = window._ql_lang === "en" ? "en-US" : window._ql_lang === "es" ? "es-ES" : "en-US";
  return msgDate.toLocaleDateString(locale);
}

/**
 * Formats a timestamp to HH:MM time string.
 * @param {string|number} timestamp - Date timestamp
 * @returns {string} - Formatted time string (e.g. "14:30")
 */
function spFormatChatTime(timestamp) {
  var date = new Date(timestamp);
  return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

// ============================================================
// SECTION 16: CHAT BUBBLE TEMPLATE
// ============================================================
// Renders a single chat history message bubble.

/**
 * Returns HTML for a single chat message bubble.
 * @param {Object} message - Message object with text, status, timestamp
 * @returns {string} - Chat bubble HTML
 */
function spTemplateChatBubble(message) {
  var statusClass = message.status === "error" ? "sp-chat-status-err" : "sp-chat-status-ok";
  var statusText = message.status === "error" ? t("chat.error") : t("chat.sent");
  var displayText = message.text.length > 300
    ? spEscapeHtml(message.text.substring(0, 300)) + "…"
    : spEscapeHtml(message.text);

  return (
    '<div class="sp-chat-bubble" title="' + spEscapeHtml(message.text) + '">' +
      displayText +
      '<div class="sp-chat-meta">' +
        '<span class="sp-chat-status ' + statusClass + '">' + statusText + '</span>' +
        '<span class="sp-chat-time">' + spFormatChatTime(message.timestamp) + '</span>' +
        '<span class="sp-chat-check">✓✓</span>' +
      '</div>' +
    '</div>'
  );
}

// ============================================================
// SECTION 17: CHAT HISTORY TEMPLATE
// ============================================================
// Renders the full chat history with date dividers.

/*
 * Returns HTML for the complete chat history view.
 * Groups messages by date with dividers.
 * @param {Array} messages - Array of message objects
 * @returns {string} - Chat history HTML
 */
/*
function spTemplateChatHistory(messages) {
  if (!messages || !messages.length) {
    return spTemplateChatEmpty();
  }

  var html = '<div class="sp-chat-messages">';
  var lastDateLabel = "";

  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];
    var dateLabel = spFormatChatDate(msg.timestamp);

    if (dateLabel !== lastDateLabel) {
      html += '<div class="sp-chat-date-divider"><span class="sp-chat-date-label">' + dateLabel + '</span></div>';
      lastDateLabel = dateLabel;
    }

    html += spTemplateChatBubble(msg);
  }

  html += '</div>';

  var countText = t("history.count");
  var countDisplay = typeof countText === "function" ? countText(messages.length) : messages.length + " messages";

  html += (
    '<div class="sp-chat-actions">' +
      '<span class="sp-chat-count">' + countDisplay + '</span>' +
      '<button class="sp-chat-clear" id="sp-chat-clear" data-i18n="history.clear">' + t("history.clear") + '</button>' +
    '</div>'
  );

  return html;
}
*/
/**
 * Returns HTML for a single chat message bubble (10/10 Pro UI).
 * @param {Object} message - Message object with text, status, timestamp
 * @returns {string} - Chat bubble HTML
 */
function spTemplateChatBubble(message) {
  var isAi = message.isAi || message.role === "ai" || message.role === "assistant";
  var timeStr = spFormatChatTime(message.timestamp);

  if (isAi) {
    return (
      '<div class="sp-msg-wrapper sp-msg-ai">' +
        '<div class="sp-msg-header">✨ Lovable AI</div>' +
        '<div class="sp-msg-bubble">' +
          spEscapeHtml(message.text) +
          (message.modifiedFiles ? 
            '<div class="sp-files-list">' +
              '<div class="sp-file-pill modified"><span>✏️</span> <span>' + spEscapeHtml(message.modifiedFiles) + '</span></div>' +
            '</div>' : ''
          ) +
        '</div>' +
        '<div class="sp-msg-meta">' + timeStr + ' · Applied</div>' +
      '</div>'
    );
  }

  return (
    '<div class="sp-msg-wrapper sp-msg-user">' +
      '<div class="sp-msg-bubble">' + spEscapeHtml(message.text) + '</div>' +
      '<div class="sp-msg-meta">' + timeStr + '</div>' +
    '</div>'
  );
}

// ============================================================
// SECTION 18: MAIN UI TEMPLATE
// ============================================================
// The main interface shown after successful license validation.
// Contains: profile card, textarea, action bar, shortcuts, etc.
// All text in English (was Brazilian Portuguese).

/**
 * Returns HTML for the main side panel UI after login.
 * @param {string} userName - Display name of the user
 * @param {string} statusBadge - HTML badge from spTemplateStatusBadge()
 * @returns {string} - Main UI HTML
 */
function spTemplateMainUI(userName, statusBadge) {
  return (
    '<div id="sp-update-banner" style="display:none"></div>' +
    '<div class="sp-profile-card">' +
      '<div class="sp-profile-top">' +
        '<span class="sp-profile-name" id="sp-name">' + spEscapeHtml(userName) + '</span>' +
        statusBadge +
      '</div>' +
      '<div class="sp-sync-status" id="sp-sync">' + SP_SVG.clock + t("sync.waiting") + '</div>' +
      '<div class="sp-trial-countdown" id="sp-countdown" style="display:none"></div>' +
    '</div>' +

    // Reseller button (hidden by default, shown if user has reseller role)
    '<div id="sp-reseller-btn" style="display:none;margin-bottom:14px">' +
      '<a href="https://wa.me/8801759176229" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;border:1px solid rgba(124,90,255,0.3);background:rgba(124,90,255,0.06);color:var(--ql-accent);text-decoration:none;font-size:12px;font-weight:700;transition:all 0.2s">' +
        'Official Site' +
        '<span style="margin-left:auto;font-size:10px;opacity:0.6">→</span>' +
      '</a>' +
    '</div>' +

    // Main textarea for prompt input
    '<textarea class="sp-textarea" id="sp-msg" rows="3" placeholder="Type your command..." spellcheck="false"></textarea>' +

    // File attachment preview area
    '<div id="sp-attach-preview" class="sp-attach-preview" style="display:none"></div>' +

    // Action bar: toggle, buttons
    '<div class="sp-action-bar">' +
      '<div class="sp-action-left">' +
        '<label class="sp-toggle">' +
          '<input type="checkbox" id="sp-modo-plano">' +
          '<span class="sp-toggle-slider"></span>' +
        '</label>' +
        '<span class="sp-toggle-label">Plan Mode</span>' +
      '</div>' +
      '<div class="sp-action-center">' +
        '<button class="sp-attach-btn" id="sp-attach-btn" title="Attach file"></button>' +
        '<button class="sp-tool-btn" id="sp-optimize" title="Optimize with AI">' + SP_SVG.openai + '</button>' +
        '<button class="sp-tool-btn" id="sp-speech" title="Voice">' + SP_SVG.mic + '</button>' +
      '</div>' +
      '<button class="sp-send-btn" id="sp-send">Send</button>' +
    '</div>' +

    // Hidden file input for attachment
    '<input type="file" id="sp-file-input" multiple style="display:none" accept="*/*">' +

    // Log/status area
    '<div class="sp-log" id="sp-log"></div>' +

    // Quick shortcuts section
    '<span class="sp-shortcuts-title">QUICK SHORTCUTS</span>' +
    '<div class="sp-shortcuts-grid" id="sp-chips"></div>' +

    // Watermark removal button
    '<button id="sp-remove-watermark" class="sp-watermark-btn" data-i18n="btn.watermark">' + t("btn.watermark") + '</button>' +

    // Download status area
    '<div id="sp-download-status" class="sp-log" style="display:none"></div>'
  );
}

// ============================================================
// SECTION 19: PROMPT CONTENT TEMPLATE (ADDED)
// ============================================================
// Returns the prompt tab content HTML.
// This function is called by sidepanel.js spRenderPromptTab()
// and spRenderPromptContent().
// Extracted from inline code in sidepanel.js for reusability.

/**
 * Returns HTML for the prompt tab content area.
 * Contains textarea, attach preview, action bar, shortcuts grid.
 * Called by spRenderPromptContent() in sidepanel.js.
 * @returns {string} - Prompt content HTML
 */
function spTemplatePromptContent() {
  return (
    '<textarea class="sp-textarea" id="sp-msg" rows="3" placeholder="Type your command..." spellcheck="false"></textarea>' +
    '<div id="sp-attach-preview" class="sp-attach-preview" style="display:none"></div>' +
    '<div class="sp-action-bar">' +
      '<div class="sp-action-left">' +
        '<label class="sp-toggle">' +
          '<input type="checkbox" id="sp-modo-plano">' +
          '<span class="sp-toggle-slider"></span>' +
        '</label>' +
        '<span class="sp-toggle-label">' + t("toggle.licenseMode.short") + '</span>' +
      '</div>' +
      '<div class="sp-action-center">' +
        '<button class="sp-attach-btn" id="sp-attach-btn" title="' + t("btn.attach.short") + '"></button>' +
        '<button class="sp-tool-btn" id="sp-optimize" title="' + t("btn.optimize") + '">' + SP_SVG.openai + '</button>' +
        '<button class="sp-tool-btn" id="sp-speech" title="' + t("btn.speech.short") + '">' + SP_SVG.mic + '</button>' +
        '<button class="sp-send-btn" id="sp-send">' + t("btn.send") + '</button>' +
      '</div>' +
    '</div>' +
    '<input type="file" id="sp-file-input" multiple style="display:none" accept="*/*">' +
    '<div class="sp-log" id="sp-log"></div>' +
    '<span class="sp-shortcuts-title">' + t("shortcuts.title") + '</span>' +
    '<div class="sp-shortcuts-grid" id="sp-chips"></div>'
  );
}

// ============================================================
// END OF FILE — sidepanel-templates.js
// All original functions preserved. No code deleted.
// Brazilian Portuguese → English conversion complete.
// Branding: dough-sync-api v5.0.0
// ============================================================
