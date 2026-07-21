// =============================================
// sidepanel.js — Chrome Side Panel Main Logic
// =============================================
// Extension: dough-sync-api
// Version: 5.0.0
//
// PURPOSE:
//   This is the main JavaScript file for the Chrome Side Panel.
//   It runs inside the sidepanel.html iframe and provides:
//   - License validation
//   - Prompt sending via WebSocket bypass
//   - File attachment and upload
//   - Chat history management
//   - Speech recognition
//   - Shield mode (blocks Lovable input)
//   - Native chat mode toggle
//   - Project download
//   - Notifications
//   - Update checking
//
// COMMUNICATION:
//   - chrome.runtime.sendMessage → background.js
//   - chrome.tabs.sendMessage → content.js (in active Lovable tab)
//   - chrome.scripting.executeScript → inject shield into Lovable page
//
// API ENDPOINTS USED:
//   - https://dough-sync-api.vercel.app/api/session-start  (validate + session)
//   - https://dough-sync-api.vercel.app/api/heartbeat      (keep alive)
//   - https://bcrzdgkyydfutrbcbbrt.supabase.co/rest/v1/... (Supabase REST)
//   - https://bcrzdgkyydfutrbcbbrt.supabase.co/functions/... (Edge Functions)
//   - https://api.lovable.dev/projects/... (Lovable API)
// =============================================

(function () {
  "use strict";

  // =============================================
  // CONFIGURATION
  // =============================================

  // Supabase configuration
  const SP_SUPABASE_URL = "https://bcrzdgkyydfutrbcbbrt.supabase.co";
  const SP_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcnpkZ2t5eWRmdXRyYmNiYnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzI0NDcsImV4cCI6MjA5ODE0ODQ0N30.EqPZXQ9eukJPWIMSUrMd84XqpEKGEMzL88XT0Y-TwJ8";

  // Vercel API endpoints (your dough-sync-api)
  const SP_API_BASE = "https://dough-sync-api.vercel.app/api";
  const SP_VALIDATE_URL = SP_API_BASE + "/session-start";
  const SP_SESSION_START_URL = SP_API_BASE + "/session-start";
  const SP_HEARTBEAT_URL = SP_API_BASE + "/heartbeat";
  const SP_SESSION_END_URL = SP_API_BASE + "/session-end";

  // Supabase Edge Functions
  const SP_OPTIMIZE_URL = SP_SUPABASE_URL + "/functions/v1/optimize-prompt";
  const SP_REMOVE_WATERMARK_URL = SP_SUPABASE_URL + "/functions/v1/remove-watermark";
  const SP_PROXY_COMMAND_URL = SP_SUPABASE_URL + "/functions/v1/proxy-command";

  // Supabase REST API endpoints
  const SP_NOTIFICATIONS_URL = SP_SUPABASE_URL + "/rest/v1/notifications?select=*&order=created_at.desc&limit=20";
  const SP_VERSIONS_URL = SP_SUPABASE_URL + "/rest/v1/extension_versions?select=version,changelog,file_path,is_alert_active&order=created_at.desc&limit=1&is_alert_active=eq.true";
  const SP_USER_ROLES_URL = SP_SUPABASE_URL + "/rest/v1/user_roles?select=role";
  const SP_LICENSES_URL = SP_SUPABASE_URL + "/rest/v1/licenses";
  const SP_FEATURE_FLAGS_URL = SP_SUPABASE_URL + "/rest/v1/feature_flags";
  const SP_STORAGE_UPLOAD_URL = SP_SUPABASE_URL + "/storage/v1/object/prompt-images/";
  const SP_STORAGE_PUBLIC_URL = SP_SUPABASE_URL + "/storage/v1/object/public/prompt-images/";

  // =============================================
  // CONSTANTS
  // =============================================

  const SP_MAX_FILES = 15;
  const SP_MAX_FILE_SIZE = 20971520; // 20MB
  const SP_HISTORY_KEY = "ql_chat_history";
  const SP_MAX_HISTORY = 200;
  const SP_VERSION = "5.0.0";

  // =============================================
  // GLOBAL STATE
  // =============================================

  let spSessionId = null;
  let spUserName = null;
  let spExpiresAt = null;
  let spLicenseStatus = null;
  let spHeartbeatInterval = null;
  let spDeviceId = null;
  let spIsReseller = false;
  let spSpeechRecognition = null;
  let spIsRecording = false;
  let spAttachedFiles = [];
  let spActiveTab = "prompt";
  let spChatHistory = [];

  // =============================================
  // SAFE PROXY FETCH (with extension context check)
  // =============================================
  // Sends request via background.js to bypass CORS.
  // Falls back to direct fetch if background fails.
  function spSafeProxyFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          return reject(new Error("Extension context invalidated"));
        }
        chrome.runtime.sendMessage({
          action: "proxyFetch",
          url: url,
          method: options.method || "POST",
          headers: options.headers || {},
          body: options.body || null
        }, response => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (!response) {
            return reject(new Error("No response"));
          }
          if (response.data && typeof response.data === "object") {
            resolve(response.data);
          } else if (!response.ok) {
            reject(new Error("Fetch failed (" + response.status + ")"));
          } else {
            resolve(response.data);
          }
        });
      } catch (error) {
        reject(new Error("Extension context invalidated"));
      }
    });
  }

  // =============================================
  // EXTENSION CONTEXT CHECK
  // =============================================
  function spCheckExtensionContext() {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          return reject(new Error("Extension context invalidated"));
        }
        chrome.runtime.sendMessage({ action: "ping" }, response => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          resolve(response);
        });
      } catch (error) {
        reject(new Error("Extension context invalidated"));
      }
    });
  }

  // =============================================
  // DEVICE ID (uses hwFingerprint.js)
  // =============================================
  function spGetDeviceId() {
    return getHardwareFingerprint();
  }

  // =============================================
  // BUILD SESSION HEADERS (for Lovable API calls)
  // =============================================
  function spBuildSessionHeaders(projectId) {
    return new Promise(function (resolve) {
      var userAgent = navigator.userAgent || "";
      var brands = navigator.userAgentData && navigator.userAgentData.brands ? navigator.userAgentData.brands : [];
      var secChUa = "";
      for (var i = 0; i < brands.length; i++) {
        if (i > 0) secChUa += ", ";
        secChUa += "\"" + brands[i].brand + "\";v=\"" + brands[i].version + "\"";
      }
      var platform = navigator.userAgentData && navigator.userAgentData.platform ? navigator.userAgentData.platform : "Windows";
      var mobile = navigator.userAgentData && navigator.userAgentData.mobile ? "?1" : "?0";
      var languages = navigator.languages && navigator.languages.length ? navigator.languages.slice(0, 3).join(",") : navigator.language || "en-US";

      var headers = {
        "user-agent": userAgent,
        "sec-ch-ua": secChUa,
        "sec-ch-ua-mobile": mobile,
        "sec-ch-ua-platform": "\"" + platform + "\"",
        "accept-language": languages,
        "accept-encoding": "gzip, deflate, br, zstd",
        origin: "https://lovable.dev",
        referer: "https://lovable.dev/projects/" + (projectId || ""),
        priority: "u=1, i",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site"
      };

      try {
        chrome.runtime.sendMessage({ action: "getLovableCookies" }, function (response) {
          if (response && response.cookie) headers.cookie = response.cookie;
          resolve(headers);
        });
      } catch (error) {
        resolve(headers);
      }
    });
  }

  // =============================================
  // SHOW ALERT (side panel alert modal)
  // =============================================
  function spShowAlert(title, message) {
    const existing = document.querySelector(".sp-alert-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "sp-alert-overlay";
    overlay.innerHTML = spTemplateAlert(title, message);
    document.body.appendChild(overlay);

    overlay.querySelector(".sp-alert-ok").addEventListener("click", () => overlay.remove());
    setTimeout(() => overlay.remove(), 4000);
  }

  // =============================================
  // BACK TO POPUP BUTTON
  // =============================================
  /*
  document.getElementById("sp-back-to-popup").addEventListener("click", () => {
    try { chrome.storage.local.set({ ql_sidebar_mode: false }); } catch (e) {}
    try { chrome.runtime.sendMessage({ action: "deactivateSidebar" }); } catch (e) {}
    try { window.close(); } catch (e) {}
  });
*/
  // =============================================
  // BACK TO POPUP & THEME BUTTONS (Safe Check)
  // =============================================
  const backToPopupBtn = document.getElementById("sp-back-to-popup");
  if (backToPopupBtn) {
    backToPopupBtn.addEventListener("click", () => {
      try { chrome.storage.local.set({ ql_sidebar_mode: false }); } catch (e) {}
      try { chrome.runtime.sendMessage({ action: "deactivateSidebar" }); } catch (e) {}
      try { window.close(); } catch (e) {}
    });
  }

  const themeBtn = document.querySelector(".sp-theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("sp-light");
      chrome.storage.local.set({ ql_dark_mode: !isLight });
    });
  }
  // =============================================
  // THEME TOGGLE BUTTON
  // =============================================
   const themeBtn = document.querySelector(".sp-theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("sp-light");
      chrome.storage.local.set({ ql_dark_mode: !isLight });
    });
  }


  // =============================================
  // LOGOUT BUTTON
  // =============================================
  /*
  document.querySelector(".sp-logout-btn").addEventListener("click", async () => {
    if (spHeartbeatInterval) clearInterval(spHeartbeatInterval);

    // Deactivate bypass in content script
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "qlDeactivateBypass" });
      }
    });

    // End session on server
    try {
      const stored = await new Promise(resolve => {
        chrome.storage.local.get(["ql_session_id"], resolve);
      });
      if (stored.ql_session_id) {
        await fetch(SP_SESSION_END_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_token: stored.ql_session_id })
        });
      }
    } catch (error) {}

    // Clear storage and show license gate
    chrome.storage.local.remove([
      "ql_license_valid", "ql_license_key", "ql_session_id",
      "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
    ], () => {
      spUserName = null;
      spExpiresAt = null;
      spLicenseStatus = null;
      spSessionId = null;
      spShowLicenseGate();
    });
  });
*/
  // =============================================
  // LOGOUT BUTTON (Safe Check)
  // =============================================
  const logoutBtn = document.querySelector(".sp-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (spHeartbeatInterval) clearInterval(spHeartbeatInterval);

      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "qlDeactivateBypass" });
        }
      });

      try {
        const stored = await new Promise(resolve => {
          chrome.storage.local.get(["ql_session_id"], resolve);
        });
        if (stored.ql_session_id) {
          await fetch(SP_SESSION_END_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_token: stored.ql_session_id })
          });
        }
      } catch (error) {}

      chrome.storage.local.remove([
        "ql_license_valid", "ql_license_key", "ql_session_id",
        "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
      ], () => {
        spUserName = null;
        spExpiresAt = null;
        spLicenseStatus = null;
        spSessionId = null;
        spShowLicenseGate();
      });
    });
  }
  // =============================================
  // NOTIFICATION PANEL
  // =============================================
  const spNotifPanel = document.getElementById("sp-notif-panel");

  document.querySelector(".sp-notif-btn").addEventListener("click", event => {
    event.stopPropagation();
    const isOpen = spNotifPanel.style.display !== "none";
    spNotifPanel.style.display = isOpen ? "none" : "block";
    if (!isOpen) spLoadNotifications();
  });

  document.getElementById("sp-notif-close").addEventListener("click", () => {
    spNotifPanel.style.display = "none";
  });

  document.getElementById("sp-notif-markread").addEventListener("click", async () => {
    try {
      const notifs = await spSafeProxyFetch(SP_NOTIFICATIONS_URL, {
        method: "GET",
        headers: { apikey: SP_SUPABASE_ANON_KEY }
      });
      if (notifs && notifs.length) {
        chrome.storage.local.set({
          ql_read_notifs: notifs.map(n => n.id)
        });
      }
    } catch (error) {}

    const badge = document.querySelector(".sp-notif-badge");
    if (badge) badge.style.display = "none";
    spNotifPanel.style.display = "none";
  });

  async function spLoadNotifications() {
    const list = document.getElementById("sp-notif-list");
    list.innerHTML = "<p class=\"sp-notif-empty\">Loading...</p>";

    try {
      const notifs = await spSafeProxyFetch(SP_NOTIFICATIONS_URL, {
        method: "GET",
        headers: { apikey: SP_SUPABASE_ANON_KEY }
      });

      if (!notifs || !notifs.length) {
        list.innerHTML = "<p class=\"sp-notif-empty\">No notifications.</p>";
        return;
      }

      chrome.storage.local.set({ ql_read_notifs: notifs.map(n => n.id) });

      const badge = document.querySelector(".sp-notif-badge");
      if (badge) badge.style.display = "none";

      list.innerHTML = notifs.map(n => spTemplateNotifItem(n)).join("");
    } catch (error) {
      list.innerHTML = "<p class=\"sp-notif-empty\">Failed to load.</p>";
    }
  }

  async function spCheckUnreadNotifications() {
    try {
      const notifs = await spSafeProxyFetch(SP_NOTIFICATIONS_URL, {
        method: "GET",
        headers: { apikey: SP_SUPABASE_ANON_KEY }
      });
      if (!notifs || !notifs.length) return;

      chrome.storage.local.get(["ql_read_notifs"], stored => {
        const readIds = stored.ql_read_notifs || [];
        const unreadCount = notifs.filter(n => !readIds.includes(n.id)).length;
        const badge = document.querySelector(".sp-notif-badge");
        if (badge) {
          badge.textContent = unreadCount;
          badge.style.display = unreadCount > 0 ? "flex" : "none";
        }
      });
    } catch (error) {}
  }

  // =============================================
  // UPDATE CHECK
  // =============================================
  async function spCheckForUpdates() {
    try {
      const versions = await spSafeProxyFetch(SP_VERSIONS_URL, {
        method: "GET",
        headers: { apikey: SP_SUPABASE_ANON_KEY }
      });
      if (!versions || !versions.length) return;

      const latest = versions[0];
      if (latest.version !== SP_VERSION && latest.is_alert_active) {
        const banner = document.getElementById("sp-update-banner");
        if (banner) {
          const downloadUrl = latest.file_path
            ? SP_SUPABASE_URL + "/storage/v1/object/public/extension-releases/" + latest.file_path
            : null;
          banner.innerHTML = spTemplateUpdateBanner(latest.version, latest.changelog, downloadUrl);
          banner.style.display = "block";
        }
      }
    } catch (error) {}
  }

  // =============================================
  // RESELLER CHECK
  // =============================================
  async function spCheckResellerRole() {
    try {
      const licenseId = await spGetLicenseId();
      const roles = await spSafeProxyFetch(SP_USER_ROLES_URL + "&license_id=eq." + licenseId, {
        method: "GET",
        headers: { apikey: SP_SUPABASE_ANON_KEY }
      });
      if (roles && Array.isArray(roles) && roles.some(r => r.role === "reseller" || r.role === "admin")) {
        spIsReseller = true;
        const btn = document.getElementById("sp-reseller-btn");
        if (btn) btn.style.display = "block";
      }
    } catch (error) {}
  }

  async function spGetLicenseId() {
    return new Promise(resolve => {
      chrome.storage.local.get(["ql_license_key"], async stored => {
        if (!stored.ql_license_key) return resolve("");
        try {
          const result = await spSafeProxyFetch(
            SP_LICENSES_URL + "?select=id&license_key=eq." + encodeURIComponent(stored.ql_license_key) + "&limit=1",
            { method: "GET", headers: { apikey: SP_SUPABASE_ANON_KEY } }
          );
          resolve(result && result.length && result[0].id ? result[0].id : "");
        } catch (error) {
          resolve("");
        }
      });
    });
  }

  // =============================================
  // LICENSE GATE (Login Screen)
  // =============================================
  function spShowLicenseGate() {
    const body = document.getElementById("sp-body");
    body.innerHTML = spTemplateLicenseGate();
    document.getElementById("sp-validate-btn").addEventListener("click", spHandleValidateClick);
  }

  async function spHandleValidateClick() {
    const input = document.getElementById("sp-license-input");
    const log = document.getElementById("sp-license-log");
    const key = input ? input.value.trim() : "";

    if (!key) {
      log.className = "sp-log sp-log-error";
      log.textContent = "⚠ Enter a key";
      return;
    }

    log.className = "sp-log sp-log-info";
    log.innerHTML = SP_SVG.clock + " Validating...";

    try {
      if (!spDeviceId) spDeviceId = await spGetDeviceId();

      const result = await spSafeProxyFetch(SP_VALIDATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + SP_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          license_key: key,
          device_id: spDeviceId
        })
      });

      if (result.valid || result.success) {
        spSessionId = result.session_id;
        spUserName = result.user_name;
        spExpiresAt = result.expires_at;
        spLicenseStatus = result.status;

        chrome.storage.local.set({
          ql_license_valid: true,
          ql_license_key: key,
          ql_session_id: result.session_id,
          ql_user_name: result.user_name || null,
          ql_expires_at: result.expires_at || null,
          ql_activated_at: result.activated_at || null,
          ql_license_status: result.status || null,
          customer_email: result.customer_email || null,
          project_email: result.project_email || null,
          project_name: result.project_name || null,
          project_id: result.project_id || null,
          browser: result.browser || null,
          os: result.os || null
        }, async () => {
          log.className = "sp-log sp-log-success";
          log.textContent = "✓ " + (result.message || "License validated");

          // Activate bypass in content script
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, { action: "qlActivateBypass" });
            }
          });

          // Start session on Vercel API
          await fetch(SP_SESSION_START_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ license_key: key, device_id: spDeviceId })
          })
            .then(r => r.json())
            .then(data => {
              chrome.storage.local.set({
                ql_session_id: data.session_token || data.session_id || null
              });
            });

          setTimeout(() => {
            spShowMainUI();
            spStartHeartbeat(key);
          }, 800);
        });
      } else {
        log.className = "sp-log sp-log-error";
        log.textContent = "✗ " + (result.message || result.error || "Invalid license");
      }
    } catch (error) {
      log.className = "sp-log sp-log-error";
      log.textContent = " Connection error. Please try again.";
    }
  }

  // =============================================
  // CHAT HISTORY
  // =============================================

  function spLoadChatHistory(callback) {
    chrome.storage.local.get([SP_HISTORY_KEY], stored => {
      spChatHistory = stored[SP_HISTORY_KEY] || [];
      if (callback) callback();
    });
  }

  function spSaveChatHistory() {
    if (spChatHistory.length > SP_MAX_HISTORY) {
      spChatHistory = spChatHistory.slice(-SP_MAX_HISTORY);
    }
    chrome.storage.local.set({ [SP_HISTORY_KEY]: spChatHistory });
  }

  function spAddToChatHistory(text, status) {
    spChatHistory.push({
      text: text,
      timestamp: new Date().toISOString(),
      status: status || "ok"
    });
    spSaveChatHistory();
    spUpdateHistoryBadge();
  }

  function spUpdateHistoryBadge() {
    const badge = document.querySelector(".sp-tab[data-tab=\"history\"] .sp-tab-badge");
    if (badge) badge.textContent = spChatHistory.length;
  }

  function spRenderChatHistory() {
    const content = document.getElementById("sp-tab-content");
    if (!content) return;

    content.innerHTML = spTemplateChatHistory(spChatHistory);

    const messages = content.querySelector(".sp-chat-messages");
    if (messages) messages.scrollTop = messages.scrollHeight;

    const clearBtn = document.getElementById("sp-chat-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        spChatHistory = [];
        spSaveChatHistory();
        spRenderChatHistory();
      });
    }
  }

  function spRenderPromptTab() {
    const content = document.getElementById("sp-tab-content");
    if (!content) return;
    content.innerHTML = spTemplatePromptContent();
  }

  // =============================================
  // TAB SWITCHING
  // =============================================
  function spSwitchTab(tabName) {
    spActiveTab = tabName;
    document.querySelectorAll(".sp-tab").forEach(tab => {
      tab.classList.toggle("sp-tab-active", tab.getAttribute("data-tab") === tabName);
    });

    if (tabName === "history") {
      spLoadChatHistory(() => spRenderChatHistory());
    } else {
      spRenderPromptContent();
    }
  }

  // =============================================
  // MAIN UI (After Login)
  // =============================================
  function spShowMainUI() {
    const userName = spEscapeHtml(spUserName || "User");
    const statusBadge = spTemplateStatusBadge(spLicenseStatus);
    const body = document.getElementById("sp-body");

    spLoadChatHistory(function () {
      body.innerHTML =
        "<div id=\"sp-update-banner\" style=\"display:none\"></div>" +
        "<div class=\"sp-profile-card\">" +
        "<div class=\"sp-profile-top\">" +
        "<span class=\"sp-profile-name\" id=\"sp-name\">" + userName + "</span>" +
        statusBadge +
        "</div>" +
        //SP_SVG.clock + t("sync.waiting") +
        //"<div class=\"sp-sync-status\" id=\"sp-sync\">" + SP_SVG.clock + t("sync.waiting") + "</div>" +
        "<div class=\"sp-sync-status\" id=\"sp-sync\"><span class=\"sp-sync-pulse\"></span> <span>" + SP_SVG.clock + t("sync.waiting") + "</span></div>" +
       // "</div>" +
        // spTemplateTabs(spActiveTab, spChatHistory.length) +
        "<div id=\"sp-tab-content\"></div>";

      // Tab click handlers
     /* document.querySelectorAll(".sp-tab").forEach(tab => {
        tab.addEventListener("click", function () {
          spSwitchTab(tab.getAttribute("data-tab"));
        });
      });
*/
      // Render active tab
      /*
      if (spActiveTab === "history") {
        spRenderChatHistory();
      } else {
        spRenderPromptContent();
      }*/

      // সরাসরি চ্যাট ফিড ও ইনপুট বক্স রেন্ডার করা
      spRenderPromptContent();
      /*
      // Sync status
      spUpdateSyncStatus();
      chrome.storage.onChanged.addListener(changes => {
        if (changes.lovable_projectId || changes.lovable_token) {
          spUpdateSyncStatus();
        }
      });
*/
      // Sync status & Active Token Request
      spUpdateSyncStatus();
      
      // সাইডপ্যানেল ওপেন হলে সাথে সাথে অ্যাক্টিভ ট্যাবে টোকেন রিকোয়েস্ট পাঠাবে
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "qlRequestToken" }).catch(() => {});
        }
      });

      chrome.storage.onChanged.addListener(changes => {
        if (changes.lovable_projectId || changes.lovable_token) {
          spUpdateSyncStatus();
        }
      });

      // Trial countdown
      spUpdateCountdown();

      // Start heartbeat
      chrome.storage.local.get(["ql_license_key", "ql_session_id"], stored => {
        if (stored.ql_license_key) {
          spSessionId = stored.ql_session_id || spSessionId;
          spStartHeartbeat(stored.ql_license_key);
        }
      });

      // Check notifications
      spCheckUnreadNotifications();
      setInterval(spCheckUnreadNotifications, 300000);

      // Check for updates
      spCheckForUpdates();

      // Check reseller role
      spCheckResellerRole();
    });
  }

  // =============================================
  // PROMPT CONTENT (Main Prompt UI)
  // =============================================
  /*
  function spRenderPromptContent() {
    const content = document.getElementById("sp-tab-content");
    if (!content) return;

    content.innerHTML =
      "<textarea class=\"sp-textarea\" id=\"sp-msg\" rows=\"3\" placeholder=\"" + t("prompt.placeholder") + "\" spellcheck=\"false\"></textarea>" +
      "<div id=\"sp-attach-preview\" class=\"sp-attach-preview\" style=\"display:none\"></div>" +
      "<div class=\"sp-action-bar\">" +
        "<div class=\"sp-action-left\">" +
          "<label class=\"sp-toggle\">" +
            "<input type=\"checkbox\" id=\"sp-modo-plano\">" +
            "<span class=\"sp-toggle-slider\"></span>" +
          "</label>" +
          "<span class=\"sp-toggle-label\">" + t("toggle.licenseMode.short") + "</span>" +
        "</div>" +
        "<div class=\"sp-action-center\">" +
          "<button class=\"sp-attach-btn\" id=\"sp-attach-btn\" title=\"" + t("btn.attach.short") + "\"></button>" +
          "<button class=\"sp-tool-btn\" id=\"sp-optimize\" title=\"" + t("btn.optimize") + "\">" + SP_SVG.openai + "</button>" +
          "<button class=\"sp-tool-btn\" id=\"sp-speech\" title=\"" + t("btn.speech.short") + "\">" + SP_SVG.mic + "</button>" +
          "<button class=\"sp-send-btn\" id=\"sp-send\">" + t("btn.send") + "</button>" +
        "</div>" +
      "</div>" +*/
      //"<input type=\"file\" id=\"sp-file-input\" multiple style=\"display:none\" accept=\"*/*\">" +
      //"<div class=\"sp-log\" id=\"sp-log\"></div>" +
     // "<span class=\"sp-shortcuts-title\">" + t("shortcuts.title") + "</span>" +
     // "<div class=\"sp-shortcuts-grid\" id=\"sp-chips\"></div>" +
      //"<button id=\"sp-remove-watermark\" class=\"sp-watermark-btn\">" + t("btn.watermark") + "</button>" +
     // "<button id=\"sp-drop-down\" class=\"sp-watermark-btn\" style=\"display:none;\">Drop Down</button>" +
     // "<button id=\"sp-shield-btn\" class=\"sp-shield-btn\">" +
       // "<span id=\"sp-shield-label\">" + t("btn.shield.on") + "</span>" +
     // "</button>" +
      //"<button id=\"sp-native-chat-btn\" class=\"sp-shield-btn\" style=\"background:linear-gradient(135deg,rgba(124,90,255,0.12),rgba(168,85,247,0.08));border-color:rgba(124,90,255,0.3);color:var(--ql-accent,#67e8f9);margin-top:6px\">" +
       // "<span id=\"sp-native-chat-label\">" + t("btn.nativeChat") + "</span>" +
      //"</button>" +
     // "<button id=\"sp-download-project\" class=\"sp-watermark-btn\" style=\"background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.08));border-color:rgba(59,130,246,0.3);color:#60a5fa;margin-top:6px\">" + t("btn.download") + "</button>" +
      //"<button id=\"sp-quick-init\" class=\"sp-watermark-btn\" style=\"background:linear-gradient(135deg,rgba(250,204,21,0.12),rgba(234,179,8,0.08));border-color:rgba(250,204,21,0.35);color:#facc15;margin-top:6px\">Create New Project</button>" +
     // "<div id=\"sp-download-status\" class=\"sp-log\" style=\"display:none\"></div>";

    // Render chips (quick actions)
    /*
    const chipsContainer = document.getElementById("sp-chips");
    SP_TEMPLATES.forEach(template => {
      const chip = document.createElement("button");
      chip.className = "sp-chip";
      chip.innerHTML = template.icon + " " + template.label;
      chip.title = template.prompt;
      chip.addEventListener("click", () => {
        document.getElementById("sp-msg").value = template.prompt;
      });
      chipsContainer.appendChild(chip);
    });

    // Plan mode toggle
    chrome.storage.local.get(["ql_modo_plano"], stored => {
      if (stored.ql_modo_plano) {
        document.getElementById("sp-modo-plano").checked = true;
      }
    });
    document.getElementById("sp-modo-plano").addEventListener("change", function () {
      chrome.storage.local.set({ ql_modo_plano: this.checked });
      if (this.checked) spShowPlanModeModal();
    });

    // Setup features
    spSetupDragDrop();
    spSetupSpeech();

    const msgInput = document.getElementById("sp-msg");
    if (msgInput) {
      msgInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          spHandleSendClick();
        }
      });
    }

    document.getElementById("sp-send").addEventListener("click", spHandleSendClick);
    document.getElementById("sp-optimize").addEventListener("click", spHandleOptimizeClick);

    spSetupFileAttachment();
    spSetupWatermarkButton();
    spSetupShield();
    spSetupNativeChat();
    spSetupDownloadProject();
    spSetupQuickInit();
  }
*/


    // =============================================
  // PROMPT CONTENT & CONVERSATION FEED (10/10 Pro)
  // =============================================
  // =============================================
  // PROMPT CONTENT & CONVERSATION FEED (10/10 Pro)
  // =============================================
  function spRenderPromptContent() {
    const content = document.getElementById("sp-tab-content");
    if (!content) return;

    // টেমপ্লেট থেকে চ্যাট ফিড কন্টেইনার ও বটম ইনপুট লোড করা
    content.innerHTML = spTemplatePromptContent();

    // চ্যাট ফিডে মেসেজ হিস্ট্রি রেন্ডার করা
    spRenderChatFeed();

    // 1. Plus (+) Tools Popover Toggle
    const plusBtn = document.getElementById("sp-plus-trigger");
    const popoverMenu = document.getElementById("sp-popover-menu");
    
    // 2. Flash (⚡) Shortcuts Popover Toggle
    const shortcutsBtn = document.getElementById("sp-shortcuts-trigger");
    const shortcutsMenu = document.getElementById("sp-shortcuts-popover-menu");

    if (plusBtn && popoverMenu) {
      plusBtn.onclick = function(event) {
        event.stopPropagation();
        if (shortcutsMenu) shortcutsMenu.style.display = "none";
        const isHidden = popoverMenu.style.display === "none" || !popoverMenu.style.display;
        popoverMenu.style.display = isHidden ? "flex" : "none";
      };
    }

    if (shortcutsBtn && shortcutsMenu) {
      shortcutsBtn.onclick = function(event) {
        event.stopPropagation();
        if (popoverMenu) popoverMenu.style.display = "none";
        const isHidden = shortcutsMenu.style.display === "none" || !shortcutsMenu.style.display;
        shortcutsMenu.style.display = isHidden ? "flex" : "none";
      };
    }

    // স্ক্রিনের যেকোনো জায়গায় ক্লিক করলে দুইটা মেনুই অটো বন্ধ হওয়া
    document.onclick = function() {
      if (popoverMenu) popoverMenu.style.display = "none";
      if (shortcutsMenu) shortcutsMenu.style.display = "none";
    };

    // ⚡ শর্টকাট আইটেমে ক্লিক করলে প্রম্পট ইনপুটে বসবে এবং মেনু বন্ধ হবে
    const chipsContainer = document.getElementById("sp-chips");
    if (chipsContainer && typeof SP_TEMPLATES !== "undefined") {
      chipsContainer.innerHTML = "";
      SP_TEMPLATES.forEach(template => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "sp-chip";
        chip.innerHTML = template.icon + " " + template.label;
        chip.title = template.prompt;
        chip.onclick = function(e) {
          e.stopPropagation();
          const msgBox = document.getElementById("sp-msg");
          if (msgBox) msgBox.value = template.prompt;
          if (shortcutsMenu) shortcutsMenu.style.display = "none";
        };
        chipsContainer.appendChild(chip);
      });
    }

    // ইনপুট ইভেন্ট ও বাটন হ্যান্ডলারস
    const msgInput = document.getElementById("sp-msg");
    if (msgInput) {
      msgInput.onkeydown = function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          spHandleSendClick();
        }
      };
    }

    const sendBtn = document.getElementById("sp-send");
    if (sendBtn) sendBtn.onclick = spHandleSendClick;

    const optBtn = document.getElementById("sp-optimize");
    if (optBtn) optBtn.onclick = spHandleOptimizeClick;

    spSetupFileAttachment();
    spSetupWatermarkButton();
    spSetupShield();
    spSetupNativeChat();
    spSetupDownloadProject();
    spSetupQuickInit();
  }

  // চ্যাট হিস্ট্রি ফিডে দেখানোর ফাংশন (Live Conversation Feed)
  function spRenderChatFeed() {
    const feed = document.getElementById("sp-chat-feed");
    if (!feed) return;

    if (!spChatHistory || !spChatHistory.length) {
      feed.innerHTML = 
        '<div style="text-align:center; padding:30px 10px; color:#64748b; font-size:11px;">' +
          '💬 Conversation feed will appear here' +
        '</div>';
      return;
    }

    let html = "";
    for (let i = 0; i < spChatHistory.length; i++) {
      html += spTemplateChatBubble(spChatHistory[i]);
    }
    feed.innerHTML = html;
    feed.scrollTop = feed.scrollHeight;
  }

  // =============================================
  // SPEECH RECOGNITION
  // =============================================
  function spSetupSpeech() {
    const btn = document.getElementById("sp-speech");
    if (!btn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      btn.title = "Speech not supported in this browser";
      btn.style.opacity = "0.4";
      btn.style.cursor = "not-allowed";
      return;
    }

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (spIsRecording && spSpeechRecognition) {
        spSpeechRecognition.stop();
        return;
      }

      try {
        spSpeechRecognition = new SpeechRecognition();

        // Language based on current i18n language
        const langMap = { pt: "pt-BR", en: "en-US", es: "es-ES", he: "he-IL" };
        spSpeechRecognition.lang = langMap[window._ql_lang] || "en-US";
        spSpeechRecognition.continuous = true;
        spSpeechRecognition.interimResults = true;
        spSpeechRecognition.maxAlternatives = 1;

        let finalTranscript = "";
        const msgInput = document.getElementById("sp-msg");

        spSpeechRecognition.onstart = function () {
          spIsRecording = true;
          btn.classList.add("sp-recording");
          btn.style.color = "#ef4444";
          btn.style.animation = "pulse 1s infinite";
          finalTranscript = msgInput ? msgInput.value : "";
          console.log("[SP Speech] Recording started");
        };

        spSpeechRecognition.onresult = function (event) {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }
          if (msgInput) msgInput.value = finalTranscript + interimTranscript;
        };

        spSpeechRecognition.onerror = function (event) {
          console.warn("[SP Speech] Error:", event.error);
          spIsRecording = false;
          btn.classList.remove("sp-recording");
          btn.style.color = "";
          btn.style.animation = "";

          if (event.error === "not-allowed") {
            spShowAlert("Permission Denied", "Please allow microphone access in browser settings.");
          } else if (event.error === "no-speech") {
            spShowAlert("No Audio", "No speech detected. Please try again.");
          } else if (event.error !== "aborted") {
            spShowAlert("Voice Error", "Error: " + event.error);
          }
        };

        spSpeechRecognition.onend = function () {
          spIsRecording = false;
          btn.classList.remove("sp-recording");
          btn.style.color = "";
          btn.style.animation = "";
          if (msgInput) msgInput.value = finalTranscript.trim();
          console.log("[SP Speech] Recording finished");
        };

        spSpeechRecognition.start();
      } catch (error) {
        console.error("[SP Speech] Failed to start:", error);
        spIsRecording = false;
        btn.classList.remove("sp-recording");
        btn.style.color = "";
        btn.style.animation = "";
        spShowAlert("Error", "Could not start speech recognition.");
      }
    });
  }

  // =============================================
  // SYNC STATUS
  // =============================================
  function spUpdateSyncStatus() {
    chrome.storage.local.get(["lovable_projectId", "lovable_token"], stored => {
      const syncEl = document.getElementById("sp-sync");
      if (!syncEl) return;

      if (stored.lovable_projectId && stored.lovable_token) {
        syncEl.className = "sp-sync-status sp-sync-ok";
        syncEl.textContent = t("sync.ok") + " " + t("sync.project") + " " + stored.lovable_projectId.substring(0, 6) + "...";
      } else {
        syncEl.className = "sp-sync-status sp-sync-waiting";
        syncEl.innerHTML = SP_SVG.clock + t("sync.waiting");
      }
    });
  }

  // =============================================
  // TRIAL COUNTDOWN
  // =============================================
  function spUpdateCountdown() {
    if (!spExpiresAt) return;

    const countdownEl = document.getElementById("sp-countdown");
    if (!countdownEl) return;

    countdownEl.style.display = "flex";
    const expiryTime = new Date(spExpiresAt).getTime();
    const totalTime = Math.max(expiryTime - Date.now(), 3600000);

    function updateCountdown() {
      const remaining = expiryTime - Date.now();
      if (remaining <= 0) {
        if (spHeartbeatInterval) clearInterval(spHeartbeatInterval);
        if (window.spCountdownInterval) clearInterval(window.spCountdownInterval);

        chrome.storage.local.remove([
          "ql_license_valid", "ql_license_key", "ql_session_id",
          "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
        ], function () {
          spShowLicenseGate();
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, { action: "qlDeactivateBypass" });
            }
          });
        });
        return;
      }

      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor(remaining % 86400000 / 3600000);
      const minutes = Math.floor(remaining % 3600000 / 60000);
      const seconds = Math.floor(remaining % 60000 / 1000);
      const percentage = Math.max(0, Math.min(100, remaining / totalTime * 100));

      let timeStr = days > 0
        ? days + "d " + hours + "h " + minutes + "m"
        : hours > 0
          ? hours + "h " + minutes + "m " + String(seconds).padStart(2, "0") + "s"
          : minutes + ":" + String(seconds).padStart(2, "0");

      const label = spLicenseStatus === "trial" ? t("countdown.trial") : t("countdown.license");
      const urgentClass = percentage < 20 ? " sp-bar-urgent" : "";

      countdownEl.innerHTML = spTemplateCountdown(label, timeStr, percentage, urgentClass);
    }

    updateCountdown();
    if (window.spCountdownInterval) clearInterval(window.spCountdownInterval);
    window.spCountdownInterval = setInterval(updateCountdown, 1000);
  }

  // =============================================
  // JWT USER ID DECODER
  // =============================================
  function spDecodeJwtUserId(token) {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
      const decoded = JSON.parse(atob(padded));
      return decoded.sub || decoded.user_id || null;
    } catch (error) {
      return null;
    }
  }

  // =============================================
  // IMAGE COMPRESSOR
  // =============================================
  async function spCompressImage(file) {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);

        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(blob => {
          if (!blob) {
            return resolve({ file: file, previewUrl: null });
          }
          resolve({
            file: new File([blob], file.name, { type: outputType }),
            previewUrl: URL.createObjectURL(blob)
          });
        }, outputType, file.type === "image/png" ? undefined : 0.8);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ file: file, previewUrl: null });
      };

      img.src = url;
    });
  }

  // =============================================
  // MIME TYPE DETECTION
  // =============================================
  function spGetMimeType(file) {
    if (file && typeof file.type === "string" && file.type.trim()) {
      return file.type;
    }
    const name = (file && file.name ? file.name : "").toLowerCase();
    const ext = name.includes(".") ? name.split(".").pop() : "";
    const mimeMap = {
      pdf: "application/pdf",
      txt: "text/plain",
      csv: "text/csv",
      json: "application/json",
      zip: "application/zip",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      mp4: "video/mp4",
      webm: "video/webm"
    };
    return mimeMap[ext] || "application/octet-stream";
  }

  // =============================================
  // FILE PATH GENERATOR
  // =============================================
  function spGenerateFilePath(uuid, file) {
    const name = file && file.name ? String(file.name) : "";
    const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    const cleanExt = ext && /^[a-z0-9]{1,10}$/.test(ext) ? ext : "bin";
    return uuid + "." + cleanExt;
  }

  // =============================================
  // UPLOAD FILE TO SUPABASE STORAGE
  // =============================================
  async function spUploadFileToSupabase(file, token) {
    const uuid = crypto.randomUUID();
    const mimeType = spGetMimeType(file);
    const fileName = spGenerateFilePath(uuid, file);
    const filePath = "uploads/" + Date.now() + "-" + fileName;
    const uploadUrl = SP_STORAGE_UPLOAD_URL + filePath;

    await new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", mimeType);
      xhr.setRequestHeader("apikey", SP_SUPABASE_ANON_KEY);
      xhr.setRequestHeader("Authorization", "Bearer " + SP_SUPABASE_ANON_KEY);
      xhr.setRequestHeader("x-upsert", "true");
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed: " + xhr.status));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    });

    return {
      file_id: filePath,
      file_name: file.name || "file",
      public_url: SP_STORAGE_PUBLIC_URL + filePath
    };
  }

  // =============================================
  // RENDER ATTACH PREVIEW
  // =============================================
  function spRenderAttachPreview() {
    const preview = document.getElementById("sp-attach-preview");
    if (!preview) return;

    if (spAttachedFiles.length === 0) {
      preview.style.display = "none";
      preview.innerHTML = "";
      return;
    }

    preview.style.display = "flex";
    preview.innerHTML = spAttachedFiles.map((file, index) => spTemplateAttachItem(file, index)).join("");

    preview.querySelectorAll(".sp-attach-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-idx"));
        if (spAttachedFiles[idx] && spAttachedFiles[idx].previewUrl) {
          URL.revokeObjectURL(spAttachedFiles[idx].previewUrl);
        }
        spAttachedFiles.splice(idx, 1);
        spRenderAttachPreview();
      });
    });
  }

  // =============================================
  // FILE ATTACHMENT SETUP
  // =============================================
  function spSetupFileAttachment() {
    const attachBtn = document.getElementById("sp-attach-btn");
    const fileInput = document.getElementById("sp-file-input");
    if (!attachBtn || !fileInput) return;

    attachBtn.addEventListener("click", () => {
      if (spAttachedFiles.length >= SP_MAX_FILES) {
        spShowAlert("Limit", "Maximum " + SP_MAX_FILES + " files.");
        return;
      }
      fileInput.click();
    });

    fileInput.addEventListener("change", async () => {
      const files = Array.from(fileInput.files || []);
      fileInput.value = "";
      if (!files.length) return;

      const stored = await new Promise(resolve => chrome.storage.local.get(["lovable_token"], resolve));
      let token = stored.lovable_token || "";
      if (!token) {
        spShowAlert("Error", "Token not captured.");
        return;
      }
      if (token.startsWith("Bearer ")) token = token.slice(7);

      for (const file of files) {
        if (spAttachedFiles.length >= SP_MAX_FILES) break;
        if (file.size > SP_MAX_FILE_SIZE) {
          spShowAlert("Too Large", file.name + " exceeds 20MB.");
          continue;
        }

        let processedFile = file;
        let previewUrl = null;
        if (["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
          const compressed = await spCompressImage(file);
          processedFile = compressed.file;
          previewUrl = compressed.previewUrl;
        }

        const idx = spAttachedFiles.length;
        spAttachedFiles.push({
          file_id: null,
          file_name: file.name,
          previewUrl: previewUrl,
          file_type: processedFile.type,
          sizeLabel: spFormatFileSize(processedFile.size),
          uploading: true,
          rawFile: processedFile
        });
        spRenderAttachPreview();

        try {
          const result = await spUploadFileToSupabase(processedFile, token);
          spAttachedFiles[idx].file_id = result.file_id;
          spAttachedFiles[idx].public_url = result.public_url;
          spAttachedFiles[idx].uploading = false;
          spRenderAttachPreview();
        } catch (error) {
          console.warn("[QL] Supabase Storage upload failed:", error.message);
          spAttachedFiles[idx].uploading = false;
          spAttachedFiles[idx].uploadFailed = true;
          spRenderAttachPreview();
          spShowAlert("Upload Error", "Could not upload image: " + (error.message || "unknown error"));
        }
      }
    });
  }

  // =============================================
  // PLAN MODE MODAL
  // =============================================
  function spShowPlanModeModal() {
    const overlay = document.createElement("div");
    overlay.className = "sp-modal-overlay";
    overlay.innerHTML =
      "<div class=\"sp-modal\">" +
      "<div class=\"sp-modal-icon\">⚠️</div>" +
      "<div class=\"sp-modal-title\">Attention — Plan Mode</div>" +
      "<div class=\"sp-modal-body\">" +
      "The <strong>Plan Mode/Think</strong> may consume credits but offers excellent assistance. Use with moderation!" +
      "<div style=\"margin-bottom:14px;\">" +
      "<div class=\"sp-modal-step\">" +
      "<span class=\"sp-modal-step-num\">1</span>" +
      "<span class=\"sp-modal-step-text\">Activate <strong>Plan Mode</strong> and send your prompt via the extension.</span>" +
      "</div>" +
      "<div class=\"sp-modal-step\">" +
      "<span class=\"sp-modal-step-num\">2</span>" +
      "<span class=\"sp-modal-step-text\">Lovable will generate a plan. <strong>Do NOT click the \"Approve\" button</strong> inside Lovable.</span>" +
      "</div>" +
      "<div class=\"sp-modal-step\">" +
      "<span class=\"sp-modal-step-num\">3</span>" +
      "<span class=\"sp-modal-step-text\"><strong>Copy the generated plan</strong> and paste it in the extension's prompt field.</span>" +
      "</div>" +
      "<div class=\"sp-modal-step\">" +
      "<span class=\"sp-modal-step-num\">4</span>" +
      "<span class=\"sp-modal-step-text\"><strong>Turn off Plan Mode</strong> and send the prompt via the extension. No extra credits will be consumed!</span>" +
      "</div>" +
      "<div class=\"sp-modal-check\">" +
      "<input type=\"checkbox\" id=\"sp-modal-dismiss\" />" +
      "<label for=\"sp-modal-dismiss\">Don't show again</label>" +
      "<button class=\"sp-modal-btn\" id=\"sp-modal-ok\">Got it!</button>" +
      "</div>" +
      "</div>";

    document.body.appendChild(overlay);

    document.getElementById("sp-modal-ok").addEventListener("click", function () {
      const dismiss = document.getElementById("sp-modal-dismiss").checked;
      if (dismiss) {
        chrome.storage.local.set({ ql_modo_plano_alert_dismissed: true });
      }
      overlay.remove();
    });

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) overlay.remove();
    });
  }

  // =============================================
  // WATERMARK REMOVAL BUTTON
  // =============================================
  function spSetupWatermarkButton() {
    const btn = document.getElementById("sp-remove-watermark");
    if (!btn) return;

    btn.addEventListener("click", async function () {
      const log = document.getElementById("sp-log");
      btn.disabled = true;
      btn.textContent = "⏳ Sending...";

      try {
        const stored = await new Promise(resolve => {
          chrome.storage.local.get(["lovable_projectId", "lovable_token", "ql_license_key"], resolve);
        });

        const token = stored.lovable_token || "";
        const projectId = stored.lovable_projectId || "";
        const licenseKey = stored.ql_license_key || "";

        if (!projectId || !token) {
          log.className = "sp-log sp-log-error";
          log.textContent = "⚠ Project not synchronized.";
          btn.disabled = false;
          btn.textContent = "🚫 Remove Watermark";
          return;
        }

        const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

        const result = await spSafeProxyFetch(SP_REMOVE_WATERMARK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + SP_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ token: cleanToken, projectId: projectId })
        });

        if (result && (result.error || result.success === false)) {
          throw new Error(result.error || result.error_display || result.message || "Send error");
        }

        log.className = "sp-log sp-log-success";
        log.textContent = "✓ Watermark removed successfully!";
      } catch (error) {
        log.className = "sp-log sp-log-error";
        log.textContent = "✗ " + (error.message || error);
      } finally {
        btn.disabled = false;
        btn.textContent = "🚫 Remove Watermark";
      }
    });
  }

  // =============================================
  // SEND BUTTON HANDLER
  // =============================================
  async function spHandleSendClick() {
    const msg = document.getElementById("sp-msg").value.trim();
    const isPlanMode = document.getElementById("sp-modo-plano").checked;
    const log = document.getElementById("sp-log");
    const sendBtn = document.getElementById("sp-send");

    if (!msg) {
      log.className = "sp-log sp-log-error";
      log.textContent = " Empty prompt";
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = SP_SVG.clock;

    // Check for uploading files
    const uploading = spAttachedFiles.filter(f => f.uploading);
    if (uploading.length > 0) {
      log.className = "sp-log sp-log-error";
      log.innerHTML = SP_SVG.clock + " Wait — " + uploading.length + " file(s) still uploading.";
      sendBtn.disabled = false;
      sendBtn.textContent = t("btn.send");
      return;
    }

    // Check for failed uploads
    const failed = spAttachedFiles.filter(f => f.uploadFailed);
    if (failed.length > 0) {
      log.className = "sp-log sp-log-error";
      log.textContent = "✗ " + failed.length + " file(s) failed to upload. Remove them and try again.";
      sendBtn.disabled = false;
      sendBtn.textContent = t("btn.send");
      return;
    }

    // Build message with file links
    const attached = spAttachedFiles.filter(f => f.public_url && !f.uploading && !f.uploadFailed);
    const hasAttachments = attached.length > 0;
    let finalMessage = msg;

    if (hasAttachments) {
      const urls = attached.map(f => f.public_url).join("\n");
      const prefix = attached.length > 1 ? "Analyze the files in the links:\n" : "Analyze the file in the link: ";
      finalMessage = msg + "\n\n" + prefix + urls;
    }

    if (hasAttachments) {
      log.className = "sp-log sp-log-info";
      log.textContent = "📎 Attaching image link...";
    } else {
      log.className = "sp-log sp-log-info";
      log.innerHTML = SP_SVG.clock + " Sending...";
    }

    try {
      const stored = await new Promise(resolve => chrome.storage.local.get(["lovable_projectId", "lovable_token"], resolve));
      const projectId = stored.lovable_projectId || "";

      if (!projectId) {
        log.className = "sp-log sp-log-error";
        log.textContent = "⚠ Project not synchronized";
        sendBtn.disabled = false;
        sendBtn.textContent = t("btn.send");
        return;
      }

      // Get active Lovable tab
      const tabs = await new Promise(resolve => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
      const tabId = tabs[0] && tabs[0].id;
      if (!tabId) throw new Error("No active Lovable tab found");

      // Send via WebSocket bypass (through content.js)
      await new Promise(function (resolve, reject) {
        chrome.tabs.sendMessage(tabId, {
          action: "qlSendViaWs",
          message: finalMessage
        }, function (response) {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (response && response.ok) {
            resolve();
          } else {
            reject(new Error(response && response.error || "Send via WS failed"));
          }
        });
      });

      log.className = "sp-log sp-log-success";
      log.textContent = hasAttachments ? "✓ Prompt sent! Image attached 😁" : "✓ Prompt sent!";
      spAddToChatHistory(msg, "ok");

      document.getElementById("sp-msg").value = "";
      spAttachedFiles.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      spAttachedFiles = [];
      spRenderAttachPreview();
    } catch (error) {
      log.className = "sp-log sp-log-error";
      log.textContent = "✗ " + (error.message || error);
      spAddToChatHistory(msg, "error");
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = t("btn.send");
    }
  }

  // =============================================
  // OPTIMIZE BUTTON HANDLER
  // =============================================
  async function spHandleOptimizeClick() {
    const msgInput = document.getElementById("sp-msg");
    const optimizeBtn = document.getElementById("sp-optimize");

    if (!msgInput || !msgInput.value.trim()) {
      spShowAlert("Attention", "Enter a prompt before optimizing.");
      return;
    }

    optimizeBtn.classList.add("sp-tool-loading");
    optimizeBtn.disabled = true;

    try {
      const stored = await new Promise(resolve => chrome.storage.local.get(["ql_license_key"], resolve));
      const result = await spSafeProxyFetch(SP_OPTIMIZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + SP_SUPABASE_ANON_KEY,
          "x-license-key": stored.ql_license_key || ""
        },
        body: JSON.stringify({ prompt: msgInput.value.trim() })
      });

      if (result.optimized_prompt) {
        msgInput.value = result.optimized_prompt;
        spShowAlert("Prompt Optimized! ✨", "Your prompt has been improved with AI.");
      } else if (result.error) {
        spShowAlert("Error", result.error);
      }
    } catch (error) {
      spShowAlert("Error", "Failed to optimize: " + (error.message || ""));
    } finally {
      optimizeBtn.classList.remove("sp-tool-loading");
      optimizeBtn.disabled = false;
    }
  }

  // =============================================
  // HEARTBEAT (Keep License Alive)
  // =============================================
  let spHeartbeatFailCount = 0;

  function spStartHeartbeat(licenseKey) {
    if (spHeartbeatInterval) clearInterval(spHeartbeatInterval);
    spHeartbeatFailCount = 0;

    spHeartbeatInterval = setInterval(async () => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          clearInterval(spHeartbeatInterval);
          console.warn("[SP] Heartbeat stopped: extension context invalidated");
          return;
        }

        const result = await spSafeProxyFetch(SP_HEARTBEAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + SP_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            license_key: licenseKey,
            device_id: spDeviceId,
            session_token: spSessionId
          })
        });

        if (!result.valid && !result.success) {
          const isConflict = result.reason === "device_conflict";
          const isExpired = isConflict || result.reason === "expired" || result.reason === "suspended" ||
            (result.message && (result.message.includes("expired") || result.message.includes("suspended")));

          if (isConflict) {
            spHeartbeatFailCount++;
            if (spHeartbeatFailCount < 2) return;
          }

          if (isExpired) {
            clearInterval(spHeartbeatInterval);
            chrome.storage.local.remove([
              "ql_license_valid", "ql_license_key", "ql_session_id",
              "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
            ], () => spShowLicenseGate());

            if (isConflict) {
              setTimeout(() => spShowAlert("Access Denied", result.message), 500);
            }
          }
          return;
        }

        spHeartbeatFailCount = 0;

        if (result.user_name) {
          spUserName = result.user_name;
          const nameEl = document.getElementById("sp-name");
          if (nameEl) nameEl.textContent = result.user_name;
        }
        if (result.expires_at) spExpiresAt = result.expires_at;
        if (result.status) spLicenseStatus = result.status;
      } catch (error) {
        if (error.message && error.message.includes("Extension context invalidated")) {
          clearInterval(spHeartbeatInterval);
          console.warn("[SP] Heartbeat stopped: extension context invalidated");
        }
      }
    }, 60000);
  }

  // =============================================
  // DRAG & DROP
  // =============================================
  function spSetupDragDrop() {
    const msgInput = document.getElementById("sp-msg");
    if (!msgInput) return;

    const container = document.getElementById("sp-body") || msgInput;
    let dragOverlay = null;

    function showDragOverlay() {
      if (dragOverlay) return;
      dragOverlay = document.createElement("div");
      dragOverlay.className = "sp-drag-overlay";
      dragOverlay.innerHTML = "<div class=\"sp-drag-overlay-inner\"> Drop files here</div>";
      document.body.appendChild(dragOverlay);
    }

    function hideDragOverlay() {
      if (dragOverlay) {
        dragOverlay.remove();
        dragOverlay = null;
      }
    }

    container.addEventListener("dragover", function (event) {
      event.preventDefault();
      event.stopPropagation();
      showDragOverlay();
    });

    container.addEventListener("dragleave", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!container.contains(event.relatedTarget)) hideDragOverlay();
    });

    container.addEventListener("drop", async function (event) {
      event.preventDefault();
      event.stopPropagation();
      hideDragOverlay();

      const files = Array.from(event.dataTransfer.files || []);
      if (!files.length) return;
      await spHandleFilesAttach(files);
    });

    msgInput.addEventListener("paste", async function (event) {
      const items = event.clipboardData && event.clipboardData.items;
      if (!items) return;

      const files = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) await spHandleFilesAttach(files);
    });
  }

  async function spHandleFilesAttach(files) {
    if (spAttachedFiles.length >= SP_MAX_FILES) {
      spShowAlert("Limit", "Maximum " + SP_MAX_FILES + " files.");
      return;
    }

    const stored = await new Promise(function (resolve) {
      chrome.storage.local.get(["lovable_token"], resolve);
    });
    let token = stored.lovable_token || "";
    if (!token) {
      spShowAlert("Error", "Token not captured.");
      return;
    }
    if (token.indexOf("Bearer ") === 0) token = token.slice(7);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (spAttachedFiles.length >= SP_MAX_FILES) break;
      if (file.size > SP_MAX_FILE_SIZE) {
        spShowAlert("Too Large", file.name + " exceeds 20MB.");
        continue;
      }

      let processedFile = file;
      let previewUrl = null;
      if (["image/png", "image/jpeg", "image/webp"].indexOf(file.type) >= 0) {
        const compressed = await spCompressImage(file);
        processedFile = compressed.file;
        previewUrl = compressed.previewUrl;
      }

      const idx = spAttachedFiles.length;
      spAttachedFiles.push({
        file_id: null,
        file_name: file.name || "file_" + Date.now(),
        previewUrl: previewUrl,
        file_type: processedFile.type,
        sizeLabel: spFormatFileSize(processedFile.size),
        uploading: true,
        rawFile: processedFile
      });
      spRenderAttachPreview();

      try {
        const result = await spUploadFileToSupabase(processedFile, token);
        spAttachedFiles[idx].file_id = result.file_id;
        spAttachedFiles[idx].public_url = result.public_url;
        spAttachedFiles[idx].uploading = false;
        spRenderAttachPreview();
      } catch (error) {
        spAttachedFiles[idx].uploading = false;
        spAttachedFiles[idx].uploadFailed = true;
        spRenderAttachPreview();
        spShowAlert("Upload Error", "Could not upload image: " + (error.message || "unknown error"));
      }
    }

    const readyCount = spAttachedFiles.filter(f => f.public_url && !f.uploadFailed).length;
    if (readyCount > 0) {
      spShowAlert("Attached 📎", readyCount + " file(s) ready to send!");
    }
  }

  // =============================================
  // DOWNLOAD PROJECT
  // =============================================
  function spSetupDownloadProject() {
    const btn = document.getElementById("sp-download-project");
    if (!btn) return;

    btn.addEventListener("click", async function () {
      const statusEl = document.getElementById("sp-download-status");
      btn.disabled = true;
      btn.textContent = " Preparing...";

      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.className = "sp-log sp-log-info";
        statusEl.textContent = "🔍 Checking token and project...";
      }

      try {
        // Check feature flag
        try {
          const flagResponse = await fetch(SP_FEATURE_FLAGS_URL + "?select=enabled&flag_key=eq.download_files", {
            method: "GET",
            headers: { apikey: SP_SUPABASE_ANON_KEY }
          });
          if (flagResponse.ok) {
            const flagData = await flagResponse.json();
            if (flagData && flagData.length > 0 && flagData[0].enabled === false) {
              throw new Error("Extension resources are disabled.");
            }
          }
        } catch (error) {
          if (error && error.message === "Extension resources are disabled.") throw error;
        }

        const stored = await new Promise(resolve => {
          chrome.storage.local.get(["lovable_token", "lovable_projectId"], resolve);
        });

        let token = stored.lovable_token || "";
        let projectId = stored.lovable_projectId || "";

        if (token.indexOf("Bearer ") === 0) token = token.slice(7);

        // Try to get project ID from active tab URL
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        if (!projectId && activeTab && activeTab.url) {
          const match = activeTab.url.match(/\/projects\/([a-f0-9-]+)/);
          if (match) projectId = match[1];
        }

        if (!projectId) {
          throw new Error("Open a Lovable project page first.");
        }

        // Try to get token from cookies if missing
        if (!token) {
          if (statusEl) statusEl.textContent = "🔄 Trying via cookies...";
          const cookieResult = await new Promise(resolve => {
            chrome.runtime.sendMessage({ action: "readCookies" }, resolve);
          });
          if (cookieResult && cookieResult.success && cookieResult.tokens && cookieResult.tokens.length > 0) {
            token = cookieResult.tokens[0].token;
          }
        }

        if (!token) {
          throw new Error("Token not found. Open a Lovable project and wait for sync.");
        }

        if (statusEl) statusEl.textContent = "📡 Downloading project files...";
        btn.textContent = "📡 Downloading...";

        const downloadResult = await new Promise(resolve => {
          chrome.runtime.sendMessage({
            action: "downloadProject",
            projectId: projectId,
            token: token
          }, resolve);
        });

        if (!downloadResult || !downloadResult.success) {
          throw new Error(downloadResult && downloadResult.error ? downloadResult.error : "Download failed");
        }

        const files = downloadResult.files;
        if (!files || files.length === 0) {
          throw new Error("No files found in the project.");
        }

        if (statusEl) statusEl.textContent = "📦 Creating ZIP with " + files.length + " files...";
        btn.textContent = "📦 Packaging...";

        if (typeof JSZip === "undefined") {
          throw new Error("JSZip library not loaded.");
        }

        const zip = new JSZip();
        const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp", ".tiff"];
        let fileCount = 0;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.name) continue;
          if (file.sizeExceeded) continue;

          if (file.contents && file.binary) {
            zip.file(file.name, file.contents, { base64: true, binary: true });
            fileCount++;
          } else if (!file.contents && imageExtensions.some(ext =>
            file.name.toLowerCase().indexOf(ext, file.name.length - ext.length) !== -1
          )) {
            try {
              const rawResponse = await fetch(
                "https://api.lovable.dev/projects/" + projectId + "/files/raw?path=" + encodeURIComponent(file.name) + "&ref=main",
                {
                  method: "GET",
                  headers: { Authorization: "Bearer " + token, Accept: "*/*" },
                  credentials: "omit",
                  mode: "cors"
                }
              );
              if (rawResponse.ok) {
                zip.file(file.name, await rawResponse.arrayBuffer(), { binary: true });
                fileCount++;
              } else if (file.contents) {
                zip.file(file.name, file.contents);
                fileCount++;
              }
            } catch (error) {
              if (file.contents) {
                zip.file(file.name, file.contents);
                fileCount++;
              }
            }
          } else if (file.contents) {
            zip.file(file.name, file.contents);
            fileCount++;
          }
        }

        if (statusEl) statusEl.textContent = "🗜️ Compressing " + fileCount + " files...";

        const blob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 9 }
        });

        const dateStr = new Date().toISOString().split("T")[0];
        const fileName = "lovable-" + projectId.substring(0, 8) + "-" + dateStr + ".zip";
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (statusEl) {
          statusEl.className = "sp-log sp-log-success";
          statusEl.textContent = "✅ " + fileCount + " files downloaded successfully!";
        }
        btn.textContent = "✅ Download Complete!";

        setTimeout(function () {
          btn.textContent = t("btn.download");
          btn.disabled = false;
          if (statusEl) statusEl.style.display = "none";
        }, 4000);
      } catch (error) {
        if (statusEl) {
          statusEl.className = "sp-log sp-log-error";
          statusEl.textContent = "❌ " + (error.message || error);
          statusEl.style.display = "block";
        }
        btn.textContent = " Failed";
        setTimeout(function () {
          btn.textContent = t("btn.download");
          btn.disabled = false;
        }, 3000);
      }
    });
  }

  // =============================================
  // SHIELD MODE
  // =============================================
  let spShieldActive = false;

  function spSetupShield() {
    const btn = document.getElementById("sp-shield-btn");
    if (!btn) return;

    chrome.storage.local.get(["ql_shield_active"], stored => {
      if (stored.ql_shield_active === true) {
        spShieldActive = true;
        btn.classList.add("sp-shield-active");
        const label = document.getElementById("sp-shield-label");
        if (label) label.textContent = "Deactivate Shield";
        spInjectShield();
      }
    });

    btn.addEventListener("click", () => {
      spShieldActive = !spShieldActive;
      chrome.storage.local.set({ ql_shield_active: spShieldActive });

      const label = document.getElementById("sp-shield-label");
      if (spShieldActive) {
        btn.classList.add("sp-shield-active");
        if (label) label.textContent = "Deactivate Shield";
        spInjectShield();
        spShowAlert("Shield Activated 🛡️", "Lovable input is now blocked.");
      } else {
        btn.classList.remove("sp-shield-active");
        if (label) label.textContent = "Activate Shield";
        spRemoveShield();
        spShowAlert("Shield Deactivated", "Lovable input is now unblocked.");
      }
    });
  }

  function spInjectShield() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) return;

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: function () {
          if (document.getElementById("ql-shield-overlay")) return;

          const form = document.querySelector("form#chat-input");
          if (!form) return;

          const position = getComputedStyle(form).position;
          if (position === "static") form.style.position = "relative";

          const overlay = document.createElement("div");
          overlay.id = "ql-shield-overlay";
          overlay.style.cssText =
            "position:absolute;inset:0;z-index:999999;display:flex;flex-direction:column;" +
            "align-items:center;justify-content:center;gap:8px;border-radius:24px;" +
            "background:rgba(10,10,11,0.88);backdrop-filter:blur(8px);" +
            "border:1.5px solid rgba(124,90,255,0.3);" +
            "box-shadow:0 0 40px -8px rgba(124,90,255,0.25);" +
            "cursor:not-allowed;pointer-events:all;";

          overlay.innerHTML =
            "<svg viewBox=\"0 0 24 24\" width=\"32\" height=\"32\" fill=\"none\" stroke=\"#38bdf8\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"filter:drop-shadow(0 0 12px rgba(56,189,248,0.5))\">" +
            "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg>" +
            "<span style=\"color:#67e8f9;font-size:13px;font-weight:600;font-family:Inter,sans-serif\">🛡️ Protected by dough-sync-api</span>" +
            "<span style=\"color:#71717a;font-size:10px;font-family:Inter,sans-serif\">Use the extension to send prompts</span>";

          ["click", "mousedown", "keydown"].forEach(eventType =>
            overlay.addEventListener(eventType, event => {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
            }, true)
          );

          form.appendChild(overlay);

          form.querySelectorAll("input,button,textarea,[contenteditable]").forEach(el => {
            if (el.id === "ql-shield-overlay") return;
            el.dataset.qlShieldDisabled = el.disabled || "";
            el.setAttribute("tabindex", "-1");
            if (el.tagName !== "DIV") el.disabled = true;
            if (el.contentEditable === "true") {
              el.contentEditable = "false";
              el.dataset.qlShieldEditable = "true";
            }
          });
        }
      }).catch(() => {});
    });
  }

  function spRemoveShield() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) return;

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: function () {
          const overlay = document.getElementById("ql-shield-overlay");
          if (overlay) overlay.remove();

          const form = document.querySelector("form#chat-input");
          if (!form) return;

          form.querySelectorAll("[data-ql-shield-disabled]").forEach(el => {
            const wasDisabled = el.dataset.qlShieldDisabled;
            el.disabled = wasDisabled === "true";
            delete el.dataset.qlShieldDisabled;
            el.removeAttribute("tabindex");
            if (el.dataset.qlShieldEditable === "true") {
              el.contentEditable = "true";
              delete el.dataset.qlShieldEditable;
            }
          });
        }
      }).catch(() => {});
    });
  }

  // =============================================
  // NATIVE CHAT MODE
  // =============================================
  let spNativeChatActive = false;

  function spSetupNativeChat() {
    const btn = document.getElementById("sp-native-chat-btn");
    if (!btn) return;

    chrome.storage.local.get(["ql_native_chat"], stored => {
      if (stored.ql_native_chat === true) {
        spNativeChatActive = true;
        btn.style.background = "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(22,163,74,0.1))";
        btn.style.borderColor = "rgba(34,197,94,0.4)";
        btn.style.color = "#4ade80";
        const label = document.getElementById("sp-native-chat-label");
        if (label) label.textContent = "Return to Extension";
      }
    });

    btn.addEventListener("click", function () {
      spNativeChatActive = !spNativeChatActive;
      chrome.storage.local.set({ ql_native_chat: spNativeChatActive });

      const label = document.getElementById("sp-native-chat-label");
      if (spNativeChatActive) {
        btn.style.background = "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(22,163,74,0.1))";
        btn.style.borderColor = "rgba(34,197,94,0.4)";
        btn.style.color = "#4ade80";
        if (label) label.textContent = "Return to Extension";
        spActivateNativeChat();
        spShowAlert("Native Chat Activated 💬", "Use Lovable's native input with extension features.");
      } else {
        btn.style.background = "linear-gradient(135deg,rgba(124,90,255,0.12),rgba(168,85,247,0.08))";
        btn.style.borderColor = "rgba(124,90,255,0.3)";
        btn.style.color = "var(--ql-accent,#67e8f9)";
        if (label) label.textContent = t("btn.nativeChat");
        spDeactivateNativeChat();
        spShowAlert("Native Chat Deactivated", "Returned to extension mode.");
      }
    });
  }

  function spActivateNativeChat() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "qlActivateNativeChat" }, function () {});
      }
    });
  }

  function spDeactivateNativeChat() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "qlDeactivateNativeChat" }, function () {});
      }
    });
  }

  // =============================================
  // QUICK PROJECT INIT
  // =============================================
  function spSetupQuickInit() {
    const btn = document.getElementById("sp-quick-init");
    if (!btn) return;

    btn.addEventListener("click", async function () {
      const statusEl = document.getElementById("sp-download-status");
      btn.disabled = true;
      btn.innerHTML = SP_SVG.clock + " Waiting for project...";

      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.className = "sp-log sp-log-info";
        statusEl.textContent = "🚀 Typing placeholder and clicking Build...";
      }

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        btn.disabled = false;
        btn.textContent = "Create New Project";
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: "qlQuickProjectInit" }, function (response) {
        if (chrome.runtime.lastError || !response) {
          const errorMsg = chrome.runtime.lastError && chrome.runtime.lastError.message || "No response. Check if you're on Lovable's home screen.";
          if (statusEl) {
            statusEl.className = "sp-log sp-log-error";
            statusEl.textContent = "❌ " + errorMsg;
          }
          btn.textContent = " Failed";
        } else if (response.ok) {
          if (statusEl) {
            statusEl.className = "sp-log sp-log-success";
            statusEl.textContent = "✅ Empty project created! Send your real prompt via the extension.";
          }
          btn.textContent = "✅ Ready!";
        } else {
          if (statusEl) {
            statusEl.className = "sp-log sp-log-error";
            statusEl.textContent = "❌ " + (response.error || "Error");
          }
          btn.textContent = "❌ Failed";
        }

        setTimeout(function () {
          btn.textContent = "Create New Project";
          btn.disabled = false;
          if (statusEl) statusEl.style.display = "none";
        }, 5000);
      });
    });
  }

  // =============================================
  // INITIALIZATION
  // =============================================
  (async function spInitialize() {
    // Get device ID
    spDeviceId = await spGetDeviceId();

    // Apply dark/light mode
    chrome.storage.local.get(["ql_dark_mode"], stored => {
      if (stored.ql_dark_mode === false) {
        document.body.classList.add("sp-light");
      }
    });

    // Check if license is valid
    chrome.storage.local.get([
      "ql_license_valid", "ql_license_key", "ql_user_name",
      "ql_expires_at", "ql_activated_at", "ql_license_status", "ql_session_id"
    ], async stored => {
      if (stored.ql_license_valid) {
        spUserName = stored.ql_user_name || null;
        spExpiresAt = stored.ql_expires_at || null;
        spLicenseStatus = stored.ql_license_status || null;
        spSessionId = stored.ql_session_id || null;

        // Show main UI
        spShowMainUI();

        // Activate bypass in content script
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "qlActivateBypass" });
          }
        });

        // Startup heartbeat if license key exists
        if (stored.ql_license_key) {
          const startupHeartbeat = async (attempt) => {
            try {
              const result = await spSafeProxyFetch(SP_VALIDATE_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + SP_SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                  license_key: stored.ql_license_key,
                  session_id: spSessionId,
                  heartbeat: true,
                  device_id: spDeviceId
                })
              });

              if (result.valid || result.success) {
                spUserName = result.user_name || spUserName;
                spExpiresAt = result.expires_at || spExpiresAt;
                spLicenseStatus = result.status || spLicenseStatus;
                spSessionId = result.session_id || spSessionId;

                chrome.storage.local.set({
                  ql_user_name: spUserName,
                  ql_expires_at: spExpiresAt,
                  ql_license_status: spLicenseStatus,
                  ql_session_id: spSessionId
                });

                const nameEl = document.getElementById("sp-name");
                if (nameEl) nameEl.textContent = spUserName || "User";

                spUpdateCountdown();
              } else if (result.reason === "device_conflict") {
                if (attempt < 2) {
                  setTimeout(() => startupHeartbeat(attempt + 1), 5000);
                  return;
                }
                chrome.storage.local.remove([
                  "ql_license_valid", "ql_license_key", "ql_session_id",
                  "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
                ]);
                spShowLicenseGate();
                setTimeout(() => spShowAlert("Access Denied", result.message), 500);
              } else {
                const isExpired = result.reason === "expired" || result.reason === "suspended" ||
                  (result.message && (result.message.includes("expired") || result.message.includes("suspended")));
                if (isExpired) {
                  chrome.storage.local.remove([
                    "ql_license_valid", "ql_license_key", "ql_session_id",
                    "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
                  ]);
                  spShowLicenseGate();
                }
              }
            } catch (error) {}
          };

          startupHeartbeat(1);
        }
      } else {
        // Show license gate
        spShowLicenseGate();
      }
    });
  })();

})();
    // Plus (+) Button Click Event to Toggle Popover Menu
    const plusBtn = document.getElementById("sp-plus-trigger");
    const popoverMenu = document.getElementById("sp-popover-menu");

    if (plusBtn && popoverMenu) {
      plusBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = popoverMenu.style.display !== "none";
        popoverMenu.style.display = isOpen ? "none" : "flex";
      });

      // স্ক্রিনের অন্য কোথাও ক্লিক করলে মেনু অটো বন্ধ হবে
      document.addEventListener("click", () => {
        popoverMenu.style.display = "none";
      });
    }