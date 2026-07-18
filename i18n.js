// =============================================
// i18n.js — Internationalization Module
// =============================================
// Extension: dough-sync-api
// Version: 5.0.0
//
// SUPPORTED LANGUAGES: English (en), Portuguese (pt), Spanish (es), Hebrew (he)
// DEFAULT LANGUAGE: English
// FALLBACK LANGUAGE: English
//
// API/ENDPOINTS USED IN THIS FILE:
//   - chrome.storage.local.get(["ql_lang"])  — Load saved language preference
//   - chrome.storage.local.set({ql_lang})    — Save language preference
//   - sessionStorage.getItem("ql_lang")      — Session language cache
//   - sessionStorage.setItem("ql_lang")      — Session language cache
//
// NO EXTERNAL API CALLS — This file only handles translations and DOM updates.
// All text is stored locally in the TRANSLATIONS object below.
// =============================================

// =============================================
// DEFAULT LANGUAGE (English)
// =============================================
window._ql_lang = "en";

// =============================================
// CLOCK ICON SVG (used in sync status)
// =============================================
const CLOCK_ICON_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

// =============================================
// LANGUAGE INITIALIZATION
// =============================================
// Check sessionStorage for saved language preference
(function initLanguageFromSession() {
  try {
    const savedLang = sessionStorage.getItem("ql_lang");
    if (savedLang === "pt" || savedLang === "en" || savedLang === "es" || savedLang === "he") {
      window._ql_lang = savedLang;
    }
  } catch (error) {
    // sessionStorage not available
  }
})();

// =============================================
// TRANSLATION DICTIONARIES
// =============================================
// All languages use English text for consistency.
// The language switcher (PT/EN/ES/HE) is preserved
// for future localization if needed.
const TRANSLATIONS = {

  // -------------------------------------------
  // English (en) — Default & Primary Language
  // -------------------------------------------
  en: {
    // License
    "license.title": "Activate License",
    "license.desc": "Enter your license key to unlock.",
    "license.validate": "Validate License",
    "license.divider": "official site",

    // Header
    "header.notifications": "Notifications",
    "header.sidepanel": "Open in Side Panel",
    "header.theme": "Theme",
    "header.logout": "Logout",

    // Sync Status
    "sync.waiting": "Waiting for sync...",
    "sync.ok": "✅ Synced!",
    "sync.project": "Project:",

    // Tabs
    "tab.prompt": "Prompt",
    "tab.history": "History",

    // Prompt Input
    "prompt.placeholder": "Enter your command...",

    // Toggles
    "toggle.licenseMode": "Plan Mode",
    "toggle.licenseMode.short": "Plan",

    // Buttons
    "btn.attach": "Attach file (max. 10)",
    "btn.attach.short": "Attach file",
    "btn.optimize": "Optimize with AI",
    "btn.speech": "Voice to text",
    "btn.speech.short": "Voice",
    "btn.send": "Send",
    "btn.watermark": "Remove Watermark",
    "btn.shield.on": "Enable Shield",
    "btn.shield.off": "Disable Shield",
    "btn.nativeChat": "Use Standard Chat",
    "btn.download": "Download Source Code",
    "btn.publish": "🌐 Publish Project",
    "btn.cloud": "☁️ Enable Lovable Cloud",

    // Shortcuts
    "shortcuts.title": "QUICK SHORTCUTS",

    // Footer
    "footer.support": "Support",
    "footer.brand": "Developed by dough-sync-api",

    // Notifications
    "notif.title": "Notifications",
    "notif.loading": "Loading...",
    "notif.none": "No notifications.",
    "notif.error": "Failed to load.",
    "notif.openLink": "Open link →",

    // Loading
    loading: "Loading...",

    // Alerts
    "alert.success": "Success!",
    "btn.ok": "OK",

    // License Expired
    "expired.title": "License Expired!",
    "expired.text": "Your license period has ended. Visit the official site to renew.",
    "expired.renew": "WHATSAPP-+8801759176229",
    "expired.close": "Close",

    // Countdown
    "countdown.trial": "Trial expires in",
    "countdown.license": "License expires in",
    "countdown.expired": "⏰ License expired",

    // Payment
    "pay.title": "Visit the official site",
    "pay.divider": "Official site",

    // History
    "history.empty.title": "No messages",
    "history.empty.desc": "Your sent prompts will appear here as history.",
    "history.clear": "🗑 Clear History",
    "history.count": function (count) {
      return count + " message" + (count === 1 ? "" : "s");
    },

    // Dates
    "date.today": "Today",
    "date.yesterday": "Yesterday",
    "date.days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],

    // Chat Status
    "chat.sent": "✓ Sent",
    "chat.error": "✗ Error",

    // Updates
    "update.title": "New update v",
    "update.download": "Download v",

    // Side Panel
    "sp.backToPopup": "◀ Popup",

    // Shield Overlay
    "shield.overlay.text": "🛡️ Protected by dough-sync-api",
    "shield.overlay.sub": "Use the extension to send prompts",

    // Prompt Templates - Labels
    "prompt.bugs.label": "Bugs",
    "prompt.refactor.label": "Refactor",
    "prompt.errors.label": "Errors",
    "prompt.optimize.label": "Optimize",
    "prompt.comments.label": "Comments",
    "prompt.seo.label": "SEO",
    "prompt.ui.label": "UI",
    "prompt.components.label": "Components",
    "prompt.review.label": "Review",

    // Prompt Templates - Text
    "prompt.bugs.text": "Analyze the code and identify all bugs, errors and failures. Fix each one explaining the problem and the solution applied.",
    "prompt.refactor.text": "Elaborate a complete refactoring and optimization plan for the system in steps.",
    "prompt.errors.text": "Implement robust error handling throughout the code, including try/catch, validations and friendly error messages for the user.",
    "prompt.optimize.text": "Analyze and optimize system performance, identifying bottlenecks, improving queries, reducing re-renders and applying best practices.",
    "prompt.comments.text": "Add clear comments and documentation throughout the code, explaining the logic, parameters and return values of each function.",
    "prompt.seo.text": "Create a complete SEO optimization plan for this site. Include: meta tags analysis (title, description, og:image), headings structure (H1-H6), sitemap.xml, robots.txt, structured data (JSON-LD), performance (Core Web Vitals), accessibility, friendly URLs, canonical tags, alt text on images, lazy loading, and internal link building strategies. Implement all identified improvements.",
    "prompt.ui.text": "Improve the user interface making it more modern, responsive and accessible, following UX/UI best practices.",
    "prompt.components.text": "Reorganize the code separating into reusable, well-structured components with single responsibilities.",
    "prompt.review.text": "Do a complete code review identifying quality, security, performance issues and suggesting improvements."
  },

  // -------------------------------------------
  // Portuguese (pt) — Same as English
  // -------------------------------------------
  pt: {
    "license.title": "Activate License",
    "license.desc": "Enter your license key to unlock.",
    "license.validate": "Validate License",
    "license.divider": "official site",
    "header.notifications": "Notifications",
    "header.sidepanel": "Open in Side Panel",
    "header.theme": "Theme",
    "header.logout": "Logout",
    "sync.waiting": "Waiting for sync...",
    "sync.ok": "✅ Synced!",
    "sync.project": "Project:",
    "tab.prompt": "Prompt",
    "tab.history": "History",
    "prompt.placeholder": "Enter your command...",
    "toggle.licenseMode": "Plan Mode",
    "toggle.licenseMode.short": "Plan",
    "btn.attach": "Attach file (max. 10)",
    "btn.attach.short": "Attach file",
    "btn.optimize": "Optimize with AI",
    "btn.speech": "Voice to text",
    "btn.speech.short": "Voice",
    "btn.send": "Send",
    "btn.watermark": "Remove Watermark",
    "btn.shield.on": "Enable Shield",
    "btn.shield.off": "Disable Shield",
    "btn.nativeChat": "Use Native Chat",
    "btn.download": "Download Source Code",
    "btn.publish": "🌐 Publish Project",
    "btn.cloud": "☁️ Enable Lovable Cloud",
    "shortcuts.title": "QUICK SHORTCUTS",
    "footer.support": "Support",
    "footer.brand": "Developed by dough-sync-api",
    "notif.title": "Notifications",
    "notif.loading": "Loading...",
    "notif.none": "No notifications.",
    "notif.error": "Failed to load.",
    "notif.openLink": "Open link →",
    loading: "Loading...",
    "alert.success": "Success!",
    "btn.ok": "OK",
    "expired.title": "License Expired!",
    "expired.text": "Your license period has ended. Visit the official site to renew.",
    "expired.renew": "WHATSAPP-+8801759176229",
    "expired.close": "Close",
    "countdown.trial": "Trial expires in",
    "countdown.license": "License expires in",
    "countdown.expired": "⏰ License expired",
    "pay.title": "Visit the official site",
    "pay.divider": "Official site",
    "history.empty.title": "No messages",
    "history.empty.desc": "Your sent prompts will appear here as history.",
    "history.clear": " Clear History",
    "history.count": function (count) {
      return count + " message" + (count === 1 ? "" : "s");
    },
    "date.today": "Today",
    "date.yesterday": "Yesterday",
    "date.days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "chat.sent": "✓ Sent",
    "chat.error": "✗ Error",
    "update.title": "New update v",
    "update.download": "Download v",
    "sp.backToPopup": "◀ Popup",
    "shield.overlay.text": "🛡️ Protected by dough-sync-api",
    "shield.overlay.sub": "Use the extension to send prompts",
    "prompt.bugs.label": "Bugs",
    "prompt.refactor.label": "Refactor",
    "prompt.errors.label": "Errors",
    "prompt.optimize.label": "Optimize",
    "prompt.comments.label": "Comments",
    "prompt.seo.label": "SEO",
    "prompt.ui.label": "UI",
    "prompt.components.label": "Components",
    "prompt.review.label": "Review",
    "prompt.bugs.text": "Analyze the code and identify all bugs, errors and failures. Fix each one explaining the problem and the solution applied.",
    "prompt.refactor.text": "Elaborate a complete refactoring and optimization plan for the system in steps.",
    "prompt.errors.text": "Implement robust error handling throughout the code, including try/catch, validations and friendly error messages for the user.",
    "prompt.optimize.text": "Analyze and optimize system performance, identifying bottlenecks, improving queries, reducing re-renders and applying best practices.",
    "prompt.comments.text": "Add clear comments and documentation throughout the code, explaining the logic, parameters and return values of each function.",
    "prompt.seo.text": "Create a complete SEO optimization plan for this site. Include: meta tags analysis (title, description, og:image), headings structure (H1-H6), sitemap.xml, robots.txt, structured data (JSON-LD), performance (Core Web Vitals), accessibility, friendly URLs, canonical tags, alt text on images, lazy loading, and internal link building strategies. Implement all identified improvements.",
    "prompt.ui.text": "Improve the user interface making it more modern, responsive and accessible, following UX/UI best practices.",
    "prompt.components.text": "Reorganize the code separating into reusable, well-structured components with single responsibilities.",
    "prompt.review.text": "Do a complete code review identifying quality, security, performance issues and suggesting improvements."
  },

  // -------------------------------------------
  // Spanish (es) — Same as English
  // -------------------------------------------
  es: {
    "license.title": "Activate License",
    "license.desc": "Enter your license key to unlock.",
    "license.validate": "Validate License",
    "license.divider": "official site",
    "header.notifications": "Notifications",
    "header.sidepanel": "Open in Side Panel",
    "header.theme": "Theme",
    "header.logout": "Logout",
    "sync.waiting": "Waiting for sync...",
    "sync.ok": "✅ Synced!",
    "sync.project": "Project:",
    "tab.prompt": "Prompt",
    "tab.history": "History",
    "prompt.placeholder": "Enter your command...",
    "toggle.licenseMode": "Plan Mode",
    "toggle.licenseMode.short": "Plan",
    "btn.attach": "Attach file (max. 10)",
    "btn.attach.short": "Attach file",
    "btn.optimize": "Optimize with AI",
    "btn.speech": "Voice to text",
    "btn.speech.short": "Voice",
    "btn.send": "Send",
    "btn.watermark": "Remove Watermark",
    "btn.shield.on": "Enable Shield",
    "btn.shield.off": "Disable Shield",
    "btn.nativeChat": "Use Standard Chat",
    "btn.download": "Download Source Code",
    "btn.publish": "🌐 Publish Project",
    "btn.cloud": "☁️ Enable Lovable Cloud",
    "shortcuts.title": "QUICK SHORTCUTS",
    "footer.support": "Support",
    "footer.brand": "Developed by dough-sync-api",
    "notif.title": "Notifications",
    "notif.loading": "Loading...",
    "notif.none": "No notifications.",
    "notif.error": "Failed to load.",
    "notif.openLink": "Open link →",
    loading: "Loading...",
    "alert.success": "Success!",
    "btn.ok": "OK",
    "expired.title": "License Expired!",
    "expired.text": "Your license period has ended. Visit the official site to renew.",
    "expired.renew": "WHATSAPP-+8801759176229",
    "expired.close": "Close",
    "countdown.trial": "Trial expires in",
    "countdown.license": "License expires in",
    "countdown.expired": " License expired",
    "pay.title": "Visit the official site",
    "pay.divider": "Official site",
    "history.empty.title": "No messages",
    "history.empty.desc": "Your sent prompts will appear here as history.",
    "history.clear": "🗑 Clear History",
    "history.count": function (count) {
      return count + " message" + (count === 1 ? "" : "s");
    },
    "date.today": "Today",
    "date.yesterday": "Yesterday",
    "date.days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "chat.sent": "✓ Sent",
    "chat.error": "✗ Error",
    "update.title": "New update v",
    "update.download": "Download v",
    "sp.backToPopup": "◀ Popup",
    "shield.overlay.text": "🛡️ Protected by dough-sync-api",
    "shield.overlay.sub": "Use the extension to send prompts",
    "prompt.bugs.label": "Bugs",
    "prompt.refactor.label": "Refactor",
    "prompt.errors.label": "Errors",
    "prompt.optimize.label": "Optimize",
    "prompt.comments.label": "Comments",
    "prompt.seo.label": "SEO",
    "prompt.ui.label": "UI",
    "prompt.components.label": "Components",
    "prompt.review.label": "Review",
    "prompt.bugs.text": "Analyze the code and identify all bugs, errors and failures. Fix each one explaining the problem and the solution applied.",
    "prompt.refactor.text": "Elaborate a complete refactoring and optimization plan for the system in steps.",
    "prompt.errors.text": "Implement robust error handling throughout the code, including try/catch, validations and friendly error messages for the user.",
    "prompt.optimize.text": "Analyze and optimize system performance, identifying bottlenecks, improving queries, reducing re-renders and applying best practices.",
    "prompt.comments.text": "Add clear comments and documentation throughout the code, explaining the logic, parameters and return values of each function.",
    "prompt.seo.text": "Create a complete SEO optimization plan for this site. Include: meta tags analysis (title, description, og:image), headings structure (H1-H6), sitemap.xml, robots.txt, structured data (JSON-LD), performance (Core Web Vitals), accessibility, friendly URLs, canonical tags, alt text on images, lazy loading, and internal link building strategies. Implement all identified improvements.",
    "prompt.ui.text": "Improve the user interface making it more modern, responsive and accessible, following UX/UI best practices.",
    "prompt.components.text": "Reorganize the code separating into reusable, well-structured components with single responsibilities.",
    "prompt.review.text": "Do a complete code review identifying quality, security, performance issues and suggesting improvements."
  },

  // -------------------------------------------
  // Hebrew (he) — Same as English (RTL handled by CSS)
  // -------------------------------------------
  he: {
    "license.title": "Activate License",
    "license.desc": "Enter your license key to unlock.",
    "license.validate": "Validate License",
    "license.divider": "official site",
    "header.notifications": "Notifications",
    "header.sidepanel": "Open in Side Panel",
    "header.theme": "Theme",
    "header.logout": "Logout",
    "sync.waiting": "Waiting for sync...",
    "sync.ok": "✅ Synced!",
    "sync.project": "Project:",
    "tab.prompt": "Prompt",
    "tab.history": "History",
    "prompt.placeholder": "Enter your command...",
    "toggle.licenseMode": "Plan Mode",
    "toggle.licenseMode.short": "Plan",
    "btn.attach": "Attach file (max. 10)",
    "btn.attach.short": "Attach file",
    "btn.optimize": "Optimize with AI",
    "btn.speech": "Voice to text",
    "btn.speech.short": "Voice",
    "btn.send": "Send",
    "btn.watermark": "Remove Watermark",
    "btn.shield.on": "Enable Shield",
    "btn.shield.off": "Disable Shield",
    "btn.nativeChat": "Use Standard Chat",
    "btn.download": "Download Source Code",
    "btn.publish": "🌐 Publish Project",
    "btn.cloud": "☁️ Enable Lovable Cloud",
    "shortcuts.title": "QUICK SHORTCUTS",
    "footer.support": "Support",
    "footer.brand": "Developed by dough-sync-api",
    "notif.title": "Notifications",
    "notif.loading": "Loading...",
    "notif.none": "No notifications.",
    "notif.error": "Failed to load.",
    "notif.openLink": "Open link →",
    loading: "Loading...",
    "alert.success": "Success!",
    "btn.ok": "OK",
    "expired.title": "License Expired!",
    "expired.text": "Your license period has ended. Visit the official site to renew.",
    "expired.renew": "WHATSAPP-+8801759176229",
    "expired.close": "Close",
    "countdown.trial": "Trial expires in",
    "countdown.license": "License expires in",
    "countdown.expired": " License expired",
    "pay.title": "Visit the official site",
    "pay.divider": "Official site",
    "history.empty.title": "No messages",
    "history.empty.desc": "Your sent prompts will appear here as history.",
    "history.clear": "🗑 Clear History",
    "history.count": function (count) {
      return count + " message" + (count === 1 ? "" : "s");
    },
    "date.today": "Today",
    "date.yesterday": "Yesterday",
    "date.days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "chat.sent": "✓ Sent",
    "chat.error": "✗ Error",
    "update.title": "New update v",
    "update.download": "Download v",
    "sp.backToPopup": "◀ Popup",
    "shield.overlay.text": "🛡️ Protected by dough-sync-api",
    "shield.overlay.sub": "Use the extension to send prompts",
    "prompt.bugs.label": "Bugs",
    "prompt.refactor.label": "Refactor",
    "prompt.errors.label": "Errors",
    "prompt.optimize.label": "Optimize",
    "prompt.comments.label": "Comments",
    "prompt.seo.label": "SEO",
    "prompt.ui.label": "UI",
    "prompt.components.label": "Components",
    "prompt.review.label": "Review",
    "prompt.bugs.text": "Analyze the code and identify all bugs, errors and failures. Fix each one explaining the problem and the solution applied.",
    "prompt.refactor.text": "Elaborate a complete refactoring and optimization plan for the system in steps.",
    "prompt.errors.text": "Implement robust error handling throughout the code, including try/catch, validations and friendly error messages for the user.",
    "prompt.optimize.text": "Analyze and optimize system performance, identifying bottlenecks, improving queries, reducing re-renders and applying best practices.",
    "prompt.comments.text": "Add clear comments and documentation throughout the code, explaining the logic, parameters and return values of each function.",
    "prompt.seo.text": "Create a complete SEO optimization plan for this site. Include: meta tags analysis (title, description, og:image), headings structure (H1-H6), sitemap.xml, robots.txt, structured data (JSON-LD), performance (Core Web Vitals), accessibility, friendly URLs, canonical tags, alt text on images, lazy loading, and internal link building strategies. Implement all identified improvements.",
    "prompt.ui.text": "Improve the user interface making it more modern, responsive and accessible, following UX/UI best practices.",
    "prompt.components.text": "Reorganize the code separating into reusable, well-structured components with single responsibilities.",
    "prompt.review.text": "Do a complete code review identifying quality, security, performance issues and suggesting improvements."
  }
};

// =============================================
// TRANSLATION FUNCTION: t(key)
// =============================================
// Looks up translation key in current language.
// FALLBACK: English (en) — NOT Portuguese.
// If key not found in any dictionary, returns the key itself.
function t(key) {
  const currentLang = window._ql_lang || "en";
  const langDict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  let value = langDict && langDict[key] !== undefined ? langDict[key] : TRANSLATIONS.en ? TRANSLATIONS.en[key] : undefined;

  if (value !== undefined) {
    return value;
  } else {
    return key;
  }
}

// =============================================
// LANGUAGE SWITCHER HTML BUILDER: langSw()
// =============================================
// Returns HTML for PT/EN/ES/HE language buttons.
// Highlights the currently active language.
function langSw() {
  const currentLang = window._ql_lang || "en";

  return '<div class="ql-lang-sw">' +
    '<button class="ql-lang-btn' + (currentLang === "pt" ? " ql-lang-active" : "") + '" data-lang="pt">PT</button>' +
    '<button class="ql-lang-btn' + (currentLang === "en" ? " ql-lang-active" : "") + '" data-lang="en">EN</button>' +
    '<button class="ql-lang-btn' + (currentLang === "es" ? " ql-lang-active" : "") + '" data-lang="es">ES</button>' +
    '<button class="ql-lang-btn' + (currentLang === "he" ? " ql-lang-active" : "") + '" data-lang="he">HE</button>' +
    '</div>';
}

// =============================================
// SET LANGUAGE: setLanguage(lang)
// =============================================
// Changes current language and persists to:
//   1. window._ql_lang (runtime)
//   2. sessionStorage (session cache)
//   3. chrome.storage.local (persistent)
// Then re-applies all translations to the DOM.
function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) {
    return;
  }

  window._ql_lang = lang;

  // Save to sessionStorage
  try {
    sessionStorage.setItem("ql_lang", lang);
  } catch (error) {
    // sessionStorage not available
  }

  // Save to Chrome storage
  try {
    chrome.storage.local.set({
      ql_lang: lang
    });
  } catch (error) {
    // Chrome storage not available
  }

  // Re-apply all translations
  applyTranslations();
}

// =============================================
// BUILD PROMPT TEMPLATES: buildPromptTemplates()
// =============================================
// Returns array of prompt template objects with icons.
// Uses SVG_ICONS from content-templates.js if available,
// falls back to SP_SVG, then empty string.
function buildPromptTemplates() {
  const icons = typeof SVG_ICONS !== "undefined" ? SVG_ICONS :
    typeof SP_SVG !== "undefined" ? {
      wrench: SP_SVG.wrench,
      edit: SP_SVG.edit,
      shield: SP_SVG.shield,
      zap: SP_SVG.zap,
      msgSquare: SP_SVG.msgSq,
      trendUp: SP_SVG.trendUp,
      palette: SP_SVG.palette,
      box: SP_SVG.box,
      search: SP_SVG.search
    } : {};

  return [
    { icon: icons.wrench || "",     label: t("prompt.bugs.label"),       prompt: t("prompt.bugs.text") },
    { icon: icons.edit || "",       label: t("prompt.refactor.label"),   prompt: t("prompt.refactor.text") },
    { icon: icons.shield || "",     label: t("prompt.errors.label"),     prompt: t("prompt.errors.text") },
    { icon: icons.zap || "",        label: t("prompt.optimize.label"),   prompt: t("prompt.optimize.text") },
    { icon: icons.msgSquare || "",  label: t("prompt.comments.label"),   prompt: t("prompt.comments.text") },
    { icon: icons.trendUp || "",    label: t("prompt.seo.label"),        prompt: t("prompt.seo.text") },
    { icon: icons.palette || "",    label: t("prompt.ui.label"),         prompt: t("prompt.ui.text") },
    { icon: icons.box || "",        label: t("prompt.components.label"), prompt: t("prompt.components.text") },
    { icon: icons.search || "",     label: t("prompt.review.label"),     prompt: t("prompt.review.text") }
  ];
}

// =============================================
// RENDER CHIPS: renderChips()
// =============================================
// Creates quick-action chip buttons in both:
//   - Floating UI (#ql-chips)
//   - Side Panel (#sp-chips)
// Each chip shows icon + label, and fills the
// textarea with the prompt text on click.
function renderChips() {
  const templates = buildPromptTemplates();

  // Render in floating UI
  const floatingChips = document.getElementById("ql-chips");
  if (floatingChips) {
    floatingChips.innerHTML = "";
    templates.forEach(function (template) {
      const chip = document.createElement("button");
      chip.className = "ql-chip";
      chip.innerHTML = template.icon + " " + template.label;
      chip.title = template.prompt;
      chip.addEventListener("click", function () {
        const input = document.getElementById("ql-msg");
        if (input) {
          input.value = template.prompt;
        }
      });
      floatingChips.appendChild(chip);
    });
  }

  // Render in side panel
  const sidePanelChips = document.getElementById("sp-chips");
  if (sidePanelChips) {
    sidePanelChips.innerHTML = "";
    templates.forEach(function (template) {
      const chip = document.createElement("button");
      chip.className = "sp-chip";
      chip.innerHTML = template.icon + " " + template.label;
      chip.title = template.prompt;
      chip.addEventListener("click", function () {
        const input = document.getElementById("sp-msg");
        if (input) {
          input.value = template.prompt;
        }
      });
      sidePanelChips.appendChild(chip);
    });
  }
}

// =============================================
// DOM TRANSLATION HELPERS
// =============================================

// Set textContent of element matching selector
function setTextContent(selector, translationKey) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = t(translationKey);
  }
}

// Set placeholder of element matching selector
function setPlaceholder(selector, translationKey) {
  const element = document.querySelector(selector);
  if (element) {
    element.placeholder = t(translationKey);
  }
}

// Set title attribute of element matching selector
function setTitle(selector, translationKey) {
  const element = document.querySelector(selector);
  if (element) {
    element.title = t(translationKey);
  }
}

// Append translated text after last text node
function appendTextAfter(element, translatedText) {
  if (!element) {
    return;
  }
  for (var i = element.childNodes.length - 1; i >= 0; i--) {
    if (element.childNodes[i].nodeType === 3) {
      element.childNodes[i].textContent = " " + translatedText;
      return;
    }
  }
  element.appendChild(document.createTextNode(" " + translatedText));
}

// =============================================
// APPLY TRANSLATIONS: applyTranslations()
// =============================================
// Main function that applies all translations to the DOM.
// Called on:
//   - Language change
//   - Chrome storage load
//   - Dynamic content mutation (via observer)
function applyTranslations() {
  // Set text direction for Hebrew (RTL)
  const floatingUI = document.getElementById("ql-floating");
  if (floatingUI) {
    if (window._ql_lang === "he") {
      floatingUI.dir = "rtl";
      floatingUI.style.textAlign = "right";
    } else {
      floatingUI.dir = "ltr";
      floatingUI.style.textAlign = "left";
    }
  }

  const sidePanelBody = document.getElementById("sp-body");
  if (sidePanelBody) {
    if (window._ql_lang === "he") {
      sidePanelBody.dir = "rtl";
      sidePanelBody.style.textAlign = "right";
    } else {
      sidePanelBody.dir = "ltr";
      sidePanelBody.style.textAlign = "left";
    }
  }

  // Apply data-i18n attributes
  const i18nElements = document.querySelectorAll("[data-i18n]");
  for (var i = 0; i < i18nElements.length; i++) {
    const translatedValue = t(i18nElements[i].getAttribute("data-i18n"));
    if (typeof translatedValue === "string") {
      i18nElements[i].textContent = translatedValue;
    }
  }

  // Apply data-i18n-title attributes
  const i18nTitleElements = document.querySelectorAll("[data-i18n-title]");
  for (var i = 0; i < i18nTitleElements.length; i++) {
    i18nTitleElements[i].title = t(i18nTitleElements[i].getAttribute("data-i18n-title"));
  }

  // Apply data-i18n-placeholder attributes
  const i18nPlaceholderElements = document.querySelectorAll("[data-i18n-placeholder]");
  for (var i = 0; i < i18nPlaceholderElements.length; i++) {
    i18nPlaceholderElements[i].placeholder = t(i18nPlaceholderElements[i].getAttribute("data-i18n-placeholder"));
  }

  // Update active state on language buttons
  const langButtons = document.querySelectorAll(".ql-lang-btn");
  for (var i = 0; i < langButtons.length; i++) {
    langButtons[i].classList.toggle("ql-lang-active", langButtons[i].getAttribute("data-lang") === window._ql_lang);
  }

  // Translate specific elements by selector
  setPlaceholder("#ql-msg", "prompt.placeholder");
  setTextContent(".ql-toggle-label-inline", "toggle.licenseMode");
  setTitle("#ql-attach-btn", "btn.attach");
  setTitle("#ql-optimize-btn", "btn.optimize");
  setTitle("#ql-speech-btn", "btn.speech");
  setTextContent("#ql-send", "btn.send");
  setTextContent(".ql-shortcuts-title", "shortcuts.title");
  setTextContent("#ql-remove-watermark", "btn.watermark");
  appendTextAfter(document.getElementById("ql-native-chat-btn"), t("btn.nativeChat"));
  setTextContent("#ql-download-project", "btn.download");
  setTextContent("#ql-validate-btn", "license.validate");
  setTextContent(".ql-gate-title", "license.title");
  setTextContent(".ql-gate-desc", "license.desc");
  setTitle(".ql-notif-btn", "header.notifications");
  setTitle("#ql-sidepanel-btn", "header.sidepanel");

  // Shield label (dynamic based on active state)
  const shieldLabel = document.getElementById("ql-shield-label");
  if (shieldLabel) {
    const shieldBtn = document.getElementById("ql-shield-btn");
    shieldLabel.textContent = shieldBtn && shieldBtn.classList.contains("ql-shield-active") ? t("btn.shield.off") : t("btn.shield.on");
  }

  // Sync status
  const syncText = document.querySelector("#ql-sync-status .ql-sync-text");
  if (syncText) {
    const syncStatus = document.getElementById("ql-sync-status");
    if (syncStatus && syncStatus.classList.contains("ql-sync-ok")) {
      const projectMatch = syncText.textContent.match(/([a-z0-9]{6})\.\.\./i);
      syncText.textContent = t("sync.ok") + " " + t("sync.project") + (projectMatch ? " " + projectMatch[1] + "..." : "");
    } else {
      syncText.innerHTML = CLOCK_ICON_SVG + t("sync.waiting");
    }
  }

  // Shield overlay
  setTextContent(".ql-shield-overlay-text", "shield.overlay.text");
  setTextContent(".ql-shield-overlay-sub", "shield.overlay.sub");

  // Notifications
  setTextContent(".ql-notif-header span:first-child", "notif.title");
  setTextContent(".sp-notif-header span:first-child", "notif.title");

  // Side Panel translations
  setPlaceholder("#sp-msg", "prompt.placeholder");
  setTextContent(".sp-toggle-label", "toggle.licenseMode.short");
  setTitle("#sp-attach-btn", "btn.attach.short");
  setTitle("#sp-optimize", "btn.optimize");
  setTitle("#sp-speech", "btn.speech.short");
  setTextContent("#sp-send", "btn.send");
  setTextContent(".sp-shortcuts-title", "shortcuts.title");
  setTextContent("#sp-remove-watermark", "btn.watermark");
  setTextContent("#sp-native-chat-label", "btn.nativeChat");
  setTextContent("#sp-download-project", "btn.download");
  setTextContent("#sp-validate-btn", "license.validate");
  setTextContent(".sp-gate-title", "license.title");
  setTextContent(".sp-gate-desc", "license.desc");

  // Side Panel shield label
  const spShieldLabel = document.getElementById("sp-shield-label");
  if (spShieldLabel) {
    const spShieldBtn = document.getElementById("sp-shield-btn");
    spShieldLabel.textContent = spShieldBtn && spShieldBtn.classList.contains("sp-shield-active") ? t("btn.shield.off") : t("btn.shield.on");
  }

  // Side Panel sync status
  const spSync = document.getElementById("sp-sync");
  if (spSync) {
    if (spSync.classList.contains("sp-sync-ok")) {
      const projectMatch = spSync.textContent.match(/([a-z0-9]{6})\.\.\./i);
      spSync.textContent = t("sync.ok") + " " + t("sync.project") + (projectMatch ? " " + projectMatch[1] + "..." : "");
    } else {
      spSync.innerHTML = CLOCK_ICON_SVG + t("sync.waiting");
    }
  }

  // Re-render chips with new language
  renderChips();

  // Setup dynamic translation observers
  setupDynamicTranslationObserver();
}

// =============================================
// DYNAMIC TRANSLATION OBSERVER
// =============================================
// Watches for DOM changes in dynamic containers
// and re-applies translations when content changes.
// Only activates when language is not default (en).
const observedContainers = {};
let translationDebounceTimer = null;

function setupDynamicTranslationObserver() {
  const containerIds = ["ql-tab-content", "sp-tab-content", "sp-body"];

  containerIds.forEach(function (containerId) {
    // Skip if already observing this container
    if (observedContainers[containerId]) {
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    observedContainers[containerId] = true;

    // Only observe if language is not English (default)
    new MutationObserver(function () {
      if (window._ql_lang !== "en") {
        clearTimeout(translationDebounceTimer);
        translationDebounceTimer = setTimeout(applyTranslations, 60);
      }
    }).observe(container, {
      childList: true
    });
  });
}

// =============================================
// LANGUAGE BUTTON CLICK HANDLER
// =============================================
// Listens for clicks on PT/EN/ES/HE buttons
// anywhere in the document (capture phase).
document.addEventListener("click", function (event) {
  let target = event.target;

  // Handle clicks on child elements of language button
  if (!target.classList.contains("ql-lang-btn") && target.parentElement) {
    target = target.parentElement;
  }

  if (target && target.classList && target.classList.contains("ql-lang-btn")) {
    const selectedLang = target.getAttribute("data-lang");
    if (selectedLang) {
      setLanguage(selectedLang);
    }
  }
});

// =============================================
// LANGUAGE SWITCHER STYLES (injected)
// =============================================
// Injects CSS for the PT/EN/ES/HE language switcher buttons.
// Uses a style element appended to <head>.
(function injectLanguageSwitcherStyles() {
  const styleElement = document.createElement("style");
  styleElement.textContent =
    ".ql-lang-sw{" +
      "display:flex;" +
      "align-items:center;" +
      "gap:1px;" +
      "background:rgba(255,255,255,0.06);" +
      "border:1px solid rgba(255,255,255,0.1);" +
      "border-radius:8px;" +
      "padding:2px;" +
      "margin-right:4px;" +
      "flex-shrink:0" +
    "}" +
    ".ql-lang-btn{" +
      "background:none;" +
      "border:none;" +
      "color:rgba(255,255,255,0.4);" +
      "font-size:9px;" +
      "font-weight:700;" +
      "padding:3px 5px;" +
      "border-radius:5px;" +
      "cursor:pointer;" +
      "transition:background 0.15s,color 0.15s;" +
      "letter-spacing:0.5px;" +
      "line-height:1;" +
      "font-family:inherit" +
    "}" +
    ".ql-lang-btn:hover{" +
      "color:rgba(255,255,255,0.85)" +
    "}" +
    ".ql-lang-btn.ql-lang-active{" +
      "background:rgba(124,90,255,0.35);" +
      "color:#fff" +
    "}";

  if (document.head) {
    document.head.appendChild(styleElement);
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      document.head.appendChild(styleElement);
    });
  }
})();

// =============================================
// CHROME STORAGE LANGUAGE PERSISTENCE
// =============================================
// On extension load, checks chrome.storage.local
// for a saved language preference. If found and
// different from current, applies it.
try {
  chrome.storage.local.get(["ql_lang"], function (result) {
    if (result && result.ql_lang && TRANSLATIONS[result.ql_lang] && result.ql_lang !== window._ql_lang) {
      window._ql_lang = result.ql_lang;
      try {
        sessionStorage.setItem("ql_lang", result.ql_lang);
      } catch (error) {
        // sessionStorage not available
      }
      applyTranslations();
    } else if (window._ql_lang !== "en") {
      applyTranslations();
    }
  });
} catch (error) {
  // Chrome storage not available (not in extension context)
}
