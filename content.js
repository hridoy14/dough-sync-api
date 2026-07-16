// =============================================
// dough-sync-api Extension — Content Script
// Version: 5.00
// =============================================

console.log("[ContentScript] dough-sync-api Extension started");

// =============================================
// CONFIGURATION
// =============================================

const SUPABASE_URL = "https://bcrzdgkyydfutrbcbbrt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcnpkZ2t5eWRmdXRyYmNiYnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzI0NDcsImV4cCI6MjA5ODE0ODQ0N30.EqPZXQ9eukJPWIMSUrMd84XqpEKGEMzL88XT0Y-TwJ8";

const API_BASE_URL = "https://dough-sync-api.vercel.app/";

const VALIDATE_URL = SUPABASE_URL + "/functions/v1/validate-license";
const OPTIMIZE_URL = SUPABASE_URL + "/functions/v1/optimize-prompt";
const PROXY_COMMAND_URL = SUPABASE_URL + "/functions/v1/proxy-command";
const REMOVE_WATERMARK_URL = SUPABASE_URL + "/functions/v1/remove-watermark";

const SESSION_START_URL = API_BASE_URL + "api/session-start";
const HEARTBEAT_URL = API_BASE_URL + "api/heartbeat";

const NOTIFICATIONS_URL = SUPABASE_URL + "/rest/v1/notifications?select=*&order=created_at.desc&limit=20";
const VERSIONS_URL = SUPABASE_URL + "/rest/v1/extension_versions?select=version,changelog,file_path,is_alert_active&order=created_at.desc&limit=1&is_alert_active=eq.true";
const USER_ROLES_URL = SUPABASE_URL + "/rest/v1/user_roles?select=role";
const FEATURE_FLAGS_URL = SUPABASE_URL + "/rest/v1/feature_flags?select=enabled&flag_key=eq.download_files";

const EXTENSION_VERSION = "5.00";
const WHATSAPP_SUPPORT_LINK = "https://wa.me/8801759176229";
const EXTENSION_NAME = "dough-sync-api";

const CURRENT_EXT_VERSION = "5.00";

// =============================================
// NEW: HELPER FUNCTIONS (verified 2026-07-10)
// =============================================

// Extract project ID from Lovable URLs
function extractProjectId(url) {
  const match = url.match(/projects\/([a-f0-9-]{36})/i);
  return match ? match[1] : null;
}

// Extract token from WebSocket URL query param (?token=JWT)
function extractTokenFromWsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('token') || null;
  } catch (e) {
    return null;
  }
}

// Verified HTML selectors for Lovable (2026-07-10)
// Lovable uses <div contenteditable="true"> NOT <textarea>
const LOVABLE_SELECTORS = {
  chatForm: "form#chat-input",
  chatEditor: "div[contenteditable='true'][role='textbox']",
  chatEditorAlt: "[contenteditable='true']",
  sendButton: "#chatinput-send-message-button",
  stopButton: "button[aria-label='Stop generating']"
};

// Verified cookie names for token capture (2026-07-10)
// Primary: _lovable-session-id-v2 (Firebase JWT)
// Secondary: lovable-auth (API token)
const LOVABLE_COOKIE_NAMES = {
  primary: "_lovable-session-id-v2",
  secondary: "lovable-auth",
  refresh: "lovable-session-id.refresh",
  signature: "lovable-session-id.sig"
};

// =============================================
// NEW: WEBSOCKET HOOK (verified 2026-07-10)
// WS URL: wss://api.lovable.dev/projects/{id}/ws/trajectory?token={JWT}
// Auth via query param, NOT Bearer header!
// =============================================

async function parseWebSocketMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch (e) { return { raw: data }; }
  }
  if (data instanceof ArrayBuffer) {
    try {
      const text = new TextDecoder().decode(data);
      try { return JSON.parse(text); } catch { return { raw: text, binary: true }; }
    } catch (e) { return { raw: "binary_data", size: data.byteLength }; }
  }
  if (data instanceof Blob) {
    const text = await data.text();
    try { return JSON.parse(text); } catch { return { raw: text }; }
  }
  return { raw: String(data) };
}

const wsUrlPatterns = [
  /^wss?:\/\/api\.lovable\.dev/i,
  /^wss?:\/\/[^.]+\.lovable\.dev/i,
  /^wss?:\/\/lovable-api\.com/i,
  /^wss?:\/\/[^.]+\.lovable\.app/i
];

function shouldHookWS(url) {
  return wsUrlPatterns.some(p => p.test(url));
}

const OriginalWS = window.WebSocket;
class HookedWebSocket extends OriginalWS {
  constructor(url, protocols) {
    super(url, protocols);
    this._url = url;
    this.addEventListener("open", () => console.log("[WS-Hook] Connected:", url));
    this.addEventListener("message", async (event) => {
      try {
        const data = await parseWebSocketMessage(event.data);
        if (data.token || data.access_token || data.sessionToken) {
          window.postMessage({
            type: "lovableTokenFound",
            token: data.token || data.access_token || data.sessionToken,
            projectId: extractProjectId(this._url)
          }, window.location.origin);
        }
      } catch (e) {}
    });
  }
  send(data) {
    let modifiedData = data;
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      modifiedData = typeof data === "string" ? JSON.stringify(parsed) : data;
    } catch (e) {}
    return super.send(modifiedData);
  }
}

window.WebSocket = function(url, protocols) {
  if (shouldHookWS(url)) return new HookedWebSocket(url, protocols);
  return new OriginalWS(url, protocols);
};
window.WebSocket.prototype = OriginalWS.prototype;

// Also extract token from WebSocket URL query param
(function hookWsUrlToken() {
  const origOpen = OriginalWS.prototype.open || OriginalWS.open;
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "lovableRequestToken") {
      const wsUrls = document.querySelectorAll ? [] : [];
      // Check if any WebSocket has token in URL
      try {
        const wsList = performance.getEntriesByType("resource").filter(e => e.name.includes("lovable.dev") && e.name.includes("ws"));
        wsList.forEach(entry => {
          const token = extractTokenFromWsUrl(entry.name);
          if (token) {
            window.postMessage({ type: "lovableTokenFound", token, projectId: extractProjectId(entry.name) }, "*");
          }
        });
      } catch (e) {}
    }
  });
})();

// =============================================
// NEW: MULTI-SOURCE TOKEN CAPTURE (verified 2026-07-10)
// Priority: _lovable-session-id-v2 > lovable-auth > localStorage > IndexedDB
// =============================================

async function captureTokenMultiSource() {
  const sources = [];

  // Source 1: chrome.cookies API - Primary cookie first
  try {
    const primaryCookie = await new Promise(resolve => {
      chrome.cookies.get({ url: "https://lovable.dev", name: LOVABLE_COOKIE_NAMES.primary }, resolve);
    });
    if (primaryCookie && primaryCookie.value) {
      sources.push({ source: "chrome.cookies.primary", name: LOVABLE_COOKIE_NAMES.primary, value: primaryCookie.value });
    }

    const secondaryCookie = await new Promise(resolve => {
      chrome.cookies.get({ url: "https://lovable.dev", name: LOVABLE_COOKIE_NAMES.secondary }, resolve);
    });
    if (secondaryCookie && secondaryCookie.value) {
      sources.push({ source: "chrome.cookies.secondary", name: LOVABLE_COOKIE_NAMES.secondary, value: secondaryCookie.value });
    }

    const allCookies = await chrome.cookies.getAll({ domain: ".lovable.dev" });
    allCookies.forEach(c => {
      if (c.value && (c.value.includes("eyJ") || c.value.includes("token")) &&
          !sources.some(s => s.name === c.name)) {
        sources.push({ source: "chrome.cookies", name: c.name, value: c.value });
      }
    });
  } catch (e) {}

  // Source 2: localStorage
  try {
    Object.keys(localStorage).forEach(key => {
      const value = localStorage.getItem(key);
      if (value && (value.includes("eyJ") || value.includes("token"))) {
        sources.push({ source: "localStorage", name: key, value });
      }
    });
  } catch (e) {}

  // Source 3: sessionStorage
  try {
    Object.keys(sessionStorage).forEach(key => {
      const value = sessionStorage.getItem(key);
      if (value && (value.includes("eyJ") || value.includes("token"))) {
        sources.push({ source: "sessionStorage", name: key, value });
      }
    });
  } catch (e) {}

  // Source 4: window globals
  try {
    ["lovableToken", "token", "authToken", "sessionToken", "lovableSession", "lovableAuth"]
      .forEach(g => {
        if (window[g] && typeof window[g] === "string") {
          sources.push({ source: "window." + g, value: window[g] });
        }
      });
  } catch (e) {}

  // Source 5: IndexedDB - Complete version
  try {
    const databases = await indexedDB.databases();
    for (const dbInfo of databases) {
      if (!dbInfo.name) continue;
      const dbResult = await new Promise((resolve, reject) => {
        const req = indexedDB.open(dbInfo.name);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      for (const storeName of Array.from(dbResult.objectStoreNames)) {
        const transaction = dbResult.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const data = await new Promise((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        if (Array.isArray(data)) {
          for (const record of data) {
            if (typeof record === "object" && record !== null) {
              for (const val of Object.values(record)) {
                if (typeof val === "string" && val.length > 20) {
                  if (val.includes("eyJ") || val.includes("Bearer ") || /token|auth|session/i.test(val)) {
                    sources.push({ source: "indexedDB", name: dbInfo.name + "/" + storeName, value: val });
                  }
                }
              }
            } else if (typeof record === "string" && record.length > 20) {
              if (record.includes("eyJ") || record.includes("Bearer ")) {
                sources.push({ source: "indexedDB", name: dbInfo.name + "/" + storeName, value: record });
              }
            }
          }
        }
        dbResult.close();
      }
    }
  } catch (e) { console.warn("[TokenCapture] IndexedDB error:", e); }

  // Source 6: Performance API
  try {
    performance.getEntriesByType("resource").forEach(entry => {
      if (entry.name.includes("lovable.dev") && entry.name.includes("token=")) {
        const match = entry.name.match(/token=([^&]+)/);
        if (match) sources.push({ source: "performance", value: match[1] });
      }
    });
  } catch (e) {}

  return sources;
}

function isValidToken(token) {
  if (!token || typeof token !== "string") return false;
  if (token.startsWith("eyJ") && token.split(".").length === 3) return true;
  if (token.startsWith("Bearer ")) return true;
  if (token.length > 30 && /^[A-Za-z0-9._-]+$/.test(token)) return true;
  if (/^[A-Za-z0-9+/=_-]{20,}$/.test(token)) return true;
  return false;
}

async function ensureFreshToken() {
  const sources = await captureTokenMultiSource();
  // Priority: primary cookie first
  for (const source of sources) {
    if (source.source === "chrome.cookies.primary" && isValidToken(source.value)) {
      try {
        const payload = decodeJwtPayload(source.value);
        if (payload && payload.exp && payload.exp * 1000 < Date.now()) continue;
        return source.value;
      } catch { return source.value; }
    }
  }
  for (const source of sources) {
    if (isValidToken(source.value)) {
      try {
        const payload = decodeJwtPayload(source.value);
        if (payload && payload.exp && payload.exp * 1000 < Date.now()) continue;
        return source.value;
      } catch { return source.value; }
    }
  }
  return null;
}

// =============================================
// NEW: VERIFIED API ENDPOINTS (2026-07-10)
// ---------------------------------------------
// FILES: GET /projects/{id}/git/files?ref={sha}
// FILE:  GET /projects/{id}/git/file?path=...&ref={sha}
// CHAT:  POST /projects/{id}/chat
// GIT:   GET /workspaces/{ws}/projects/{id}/gitsync
// CLOUD: GET /projects/{id}/cloud/status?env=prod
// CREDIT: GET /workspaces/{ws}/credit-balance
// =============================================

async function downloadProjectMultiEndpoint(projectId, ref = 'main') {
  const token = await ensureFreshToken();
  if (!token) throw new Error("No valid token");

  const filesResponse = await fetch(
    "https://api.lovable.dev/projects/" + projectId + "/git/files?ref=" + ref,
    { method: "GET", headers: { "Authorization": "Bearer " + token, "Accept": "application/json" }, credentials: "include" }
  );
  if (!filesResponse.ok) throw new Error("Failed to get files list");
  const filesList = await filesResponse.json();

  const downloadedFiles = [];
  for (const file of filesList) {
    const fileResponse = await fetch(
      "https://api.lovable.dev/projects/" + projectId + "/git/file?path=" + encodeURIComponent(file.path) + "&ref=" + ref,
      { method: "GET", headers: { "Authorization": "Bearer " + token, "Accept": "application/json" }, credentials: "include" }
    );
    if (fileResponse.ok) {
      downloadedFiles.push({ name: file.path, contents: await fileResponse.text(), binary: false });
    }
  }
  return downloadedFiles;
}

async function downloadProjectReliable(projectId, ref = 'main') {
  const token = await ensureFreshToken();
  const filesList = await chrome.runtime.sendMessage({
    action: "proxyFetch",
    url: "https://api.lovable.dev/projects/" + projectId + "/git/files?ref=" + ref,
    method: "GET",
    headers: { "Authorization": "Bearer " + token, "Accept": "application/json", "Origin": "https://lovable.dev" }
  });
  const downloadedFiles = [];
  for (const file of filesList.data) {
    const fileData = await chrome.runtime.sendMessage({
      action: "proxyFetch",
      url: "https://api.lovable.dev/projects/" + projectId + "/git/file?path=" + encodeURIComponent(file.path) + "&ref=" + ref,
      method: "GET",
      headers: { "Authorization": "Bearer " + token, "Origin": "https://lovable.dev" }
    });
    downloadedFiles.push({ name: file.path, contents: fileData.data, binary: false });
  }
  return downloadedFiles;
}

async function downloadProjectWithRetry(projectId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try { return await downloadProjectReliable(projectId); }
    catch (e) { if (attempt === maxRetries) throw e; await new Promise(r => setTimeout(r, 2000 * attempt)); }
  }
}

async function sendChatMessage(projectId, message) {
  const token = await ensureFreshToken();
  if (!token) throw new Error("No valid token");
  const response = await fetch(
    "https://api.lovable.dev/projects/" + projectId + "/chat",
    {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Accept": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: message, model: null })
    }
  );
  if (!response.ok) throw new Error("Chat message failed");
  return await response.json();
}

async function getCreditBalance(workspaceId) {
  const token = await ensureFreshToken();
  if (!token) throw new Error("No valid token");
  const response = await fetch(
    "https://api.lovable.dev/workspaces/" + workspaceId + "/credit-balance",
    { method: "GET", headers: { "Authorization": "Bearer " + token, "Accept": "application/json" }, credentials: "include" }
  );
  if (!response.ok) throw new Error("Failed to get credit balance");
  return await response.json();
}

async function getGitSyncStatus(workspaceId, projectId) {
  const token = await ensureFreshToken();
  if (!token) throw new Error("No valid token");
  const response = await fetch(
    "https://api.lovable.dev/workspaces/" + workspaceId + "/projects/" + projectId + "/gitsync",
    { method: "GET", headers: { "Authorization": "Bearer " + token, "Accept": "application/json" }, credentials: "include" }
  );
  if (!response.ok) throw new Error("Failed to get git sync status");
  return await response.json();
}

async function getCloudStatus(projectId, env = 'prod') {
  const token = await ensureFreshToken();
  if (!token) throw new Error("No valid token");
  const response = await fetch(
    "https://api.lovable.dev/projects/" + projectId + "/cloud/status?env=" + env,
    { method: "GET", headers: { "Authorization": "Bearer " + token, "Accept": "application/json" }, credentials: "include" }
  );
  if (!response.ok) throw new Error("Failed to get cloud status");
  return await response.json();
}

// =============================================
// NEW: SHIELD MODE ENHANCED (verified 2026-07-10)
// =============================================

function findChatInput() {
  // Verified selectors in priority order (2026-07-10)
  for (const selector of [
    LOVABLE_SELECTORS.chatEditor,
    LOVABLE_SELECTORS.chatForm,
    LOVABLE_SELECTORS.chatEditorAlt,
    "[data-testid='chat-input']",
    "textarea[placeholder*='message']",
    "textarea[placeholder*='prompt']",
    "div[role='textbox']",
    "form textarea",
    "form input[type='text']"
  ]) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function setupShieldMonitor() {
  const observer = new MutationObserver(() => {
    if (qlShieldActive && !document.getElementById("ql-shield-overlay")) {
      injectShieldOverlay();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function blockAtInputLevel() {
  document.addEventListener("keydown", (e) => {
    if (!qlShieldActive) return;
    const target = e.target;
    if ((target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable) &&
        (target.closest("[class*='chat']") || target.closest("[class*='input']"))) {
      e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation(); return false;
    }
  }, true);
  ["paste", "input", "beforeinput"].forEach(t => {
    document.addEventListener(t, (e) => {
      if (!qlShieldActive) return;
      if (e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
        e.preventDefault(); e.stopImmediatePropagation();
      }
    }, true);
  });
}

function applyShieldStyles() {
  const style = document.createElement("style");
  style.id = "ql-shield-styles";
  style.textContent =
    "form#chat-input, textarea[placeholder*='message'], textarea[placeholder*='prompt'], " +
    "[contenteditable='true'], div[role='textbox'] { " +
    "pointer-events: none !important; opacity: 0.5 !important; " +
    "user-select: none !important; cursor: not-allowed !important; } " +
    "form#chat-input::after { content: 'Protected by " + EXTENSION_NAME + "'; " +
    "display: block; position: absolute; background: #1e293b; color: white; padding: 8px; border-radius: 6px; }";
  document.head.appendChild(style);
}

// =============================================
// NEW: UI PERSISTENCE (verified 2026-07-10)
// No Shadow DOM needed - Lovable doesn't use it
// =============================================

function setupUIPersistence() {
  const observer = new MutationObserver(() => {
    if (!document.getElementById("ql-floating")) {
      // qlBootstrap() will automatically re-create
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function styleOverrideAll(element) {
  Object.assign(element.style, {
    position: "fixed", top: "80px", right: "20px",
    zIndex: "2147483647", display: "block", visibility: "visible", opacity: "1"
  });
}

// =============================================
// NEW: COOKIE MONITORING (verified 2026-07-10)
// =============================================

function monitorCookieChanges() {
  if (window.cookieStore) {
    cookieStore.addEventListener("change", (event) => {
      event.changed.forEach(c => {
        if (c.domain.includes("lovable")) {
          console.log("[Cookie] Changed:", c.name, c.value);
          if (c.name === LOVABLE_COOKIE_NAMES.primary || c.name === LOVABLE_COOKIE_NAMES.secondary) {
            window.postMessage({ type: "lovableTokenFound", token: c.value, projectId: null }, "*");
          }
        }
      });
      event.deleted.forEach(c => console.log("[Cookie] Deleted:", c.name));
    });
  }
  // Fallback: poll localStorage
  setInterval(() => {
    Object.keys(localStorage).forEach(key => {
      const value = localStorage.getItem(key);
      if (value && (value.includes("eyJ") || value.includes("token"))) {
        window.postMessage({ type: "lovableTokenFound", token: value, projectId: null }, "*");
      }
    });
  }, 5000);
}

// =============================================
// BYPASS FUNCTIONS
// =============================================

function activateBypass() {
  try {
    localStorage.setItem("__ql_bypass_active", "1");
  } catch (error) {}
  window.postMessage({
    type: "qlBypassState",
    active: true
  }, "*");
}

function deactivateBypass() {
  try {
    localStorage.removeItem("__ql_bypass_active");
  } catch (error) {}
  window.postMessage({
    type: "qlBypassState",
    active: false
  }, "*");
}

// =============================================
// SESSION HEADERS BUILDER
// =============================================

function buildSessionHeaders(projectId) {
  return new Promise(function (resolve) {
    var userAgent = navigator.userAgent || "";
    var brands = navigator.userAgentData && navigator.userAgentData.brands ? navigator.userAgentData.brands : [];
    var secChUa = "";
    for (var i = 0; i < brands.length; i++) {
      if (i > 0) {
        secChUa += ", ";
      }
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
      chrome.runtime.sendMessage({
        action: "getLovableCookies"
      }, function (response) {
        if (response && response.cookie) {
          headers.cookie = response.cookie;
        }
        resolve(headers);
      });
    } catch (error) {
      resolve(headers);
    }
  });
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function escapeHtml(text) {
  if (!text) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function sanitizeUrl(url) {
  if (!url) {
    return "";
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return "";
  } catch (error) {
    return "";
  }
}

function decodeJwtPayload(token) {
  try {
    const cleaned = String(token || "").replace(/^Bearer\s+/i, "").trim();
    const parts = cleaned.split(".");
    if (parts.length < 2) {
      return null;
    }
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch (error) {
    return null;
  }
}

function decodeJwtUserId(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload !== "object") {
    return null;
  }
  return payload.sub || payload.user_id || null;
}

// =============================================
// BACKGROUND FETCH (via bgFetch)
// =============================================
/*
function bgFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: "proxyFetch",
      url: url,
      method: options.method || "POST",
      headers: options.headers || {},
      body: options.body || null
    }, response => {
      if (chrome.runtime.lastError) {
        console.error("[bgFetch] runtime error:", chrome.runtime.lastError.message);
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (!response) {
        return reject(new Error("No response from background"));
      }
      if (response.data && typeof response.data === "object") {
        if (!response.ok) {
          const errorMsg = response.data.error || response.data.message || response.data.detail || JSON.stringify(response.data);
          console.error("[bgFetch] HTTP " + response.status + " →", response.data);
          return reject(new Error("HTTP " + response.status + ": " + errorMsg));
        }
        resolve(response.data);
      } else if (!response.ok) {
        reject(new Error("Fetch failed via background (status " + response.status + ")"));
      } else {
        resolve(response.data);
      }
    });
  });
}
*/

function bgFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Check extension context before sending message
      if (!chrome.runtime || !chrome.runtime.id) {
        console.warn("[bgFetch] Extension context invalidated — skipping fetch");
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
          console.error("[bgFetch] runtime error:", chrome.runtime.lastError.message);
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!response) {
          return reject(new Error("Sem resposta do background"));
        }
        if (response.data && typeof response.data === "object") {
          if (!response.ok) {
            const errorMsg = response.data.error || response.data.message || response.data.detail || JSON.stringify(response.data);
            console.error("[bgFetch] HTTP " + response.status + " →", response.data);
            return reject(new Error("HTTP " + response.status + ": " + errorMsg));
          }
          resolve(response.data);
        } else if (!response.ok) {
          reject(new Error("Fetch failed via background (status " + response.status + ")"));
        } else {
          resolve(response.data);
        }
      });
    } catch (e) {
      console.warn("[bgFetch] Context invalidated:", e);
      reject(new Error("Extension context invalidated"));
    }
  });
}



// =============================================
// GLOBAL STATE
// =============================================

let qlSessionId = null;
let qlHeartbeatInterval = null;
let qlUserName = null;
let qlExpiresAt = null;
let qlActivatedAt = null;
let qlLicenseStatus = null;
let qlOnlineCount = 0;
let qlMinimized = false;
let qlHeight = 520;
let qlSpeechRecognition = null;
let qlIsRecording = false;
let qlDeviceId = null;
let qlShieldActive = false;
let qlSidebarActivateTimer = null;
let qlActiveTab = "prompt";
let qlChatHistory = [];
let qlExpiredHandled = false;

const QL_HISTORY_KEY = "ql_chat_history";
const QL_MAX_HISTORY = 200;

// =============================================
// DEVICE ID
// =============================================

function getDeviceId() {
  return getHardwareFingerprint();
}

// =============================================
// UI CREATION
// =============================================

function createUI() {
  if (document.getElementById("ql-floating")) {
    return;
  }
  chrome.storage.local.get(["ql_sidebar_mode", "ql_native_chat"], settings => {
    if (settings.ql_sidebar_mode === true) {
      console.log("[ContentScript] Sidebar mode active, skipping floating UI");
      return;
    }
    if (settings.ql_native_chat === true) {
      console.log("[ContentScript] Native chat mode active, skipping floating UI");
      return;
    }
    _buildFloatingUI();
  });
}

function _qlOpenSidePanel() {
  chrome.runtime.sendMessage({
    action: "openSidePanel"
  });
  var notice = document.createElement("div");
  notice.textContent = "Click the extension icon ↗ to open the panel";
  notice.style.cssText = "position:fixed;top:16px;right:16px;z-index:2147483647;background:#0f172a;color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;font-family:sans-serif;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.4);";
  document.body.appendChild(notice);
  setTimeout(function () {
    if (notice.parentNode) {
      notice.parentNode.removeChild(notice);
    }
  }, 4000);
}

function _buildFloatingUI() {
  if (document.getElementById("ql-floating")) {
    return;
  }
  const container = document.createElement("div");
  container.id = "ql-floating";
  const leftPos = Math.max(10, window.innerWidth - 400);
  container.style.left = leftPos + "px";
  container.style.top = "80px";
  document.body.appendChild(container);

  container.addEventListener("click", function (event) {
    var target = event.target;
    while (target && target !== container) {
      if (target.id === "ql-validate-btn") {
        validateLicense();
        return;
      }
      if (target.id === "ql-sidepanel-btn") {
        _qlOpenSidePanel();
        return;
      }
      target = target.parentElement;
    }
  });

  deactivateBypass();

  chrome.storage.local.get([
    "ql_license_valid", "ql_license_key", "ql_minimized", "ql_height",
    "ql_dark_mode", "ql_user_name", "ql_expires_at", "ql_activated_at",
    "ql_license_status", "ql_session_id"
  ], async settings => {
    qlMinimized = settings.ql_minimized || false;
    qlHeight = settings.ql_height || 520;

    if (settings.ql_dark_mode === false) {
      container.classList.add("ql-light");
    }
    if (qlMinimized) {
      container.classList.add("ql-minimized");
    }

    qlDeviceId = await getDeviceId();

    if (settings.ql_license_valid) {
      qlUserName = settings.ql_user_name || null;
      qlExpiresAt = settings.ql_expires_at || null;
      qlActivatedAt = settings.ql_activated_at || null;
      qlLicenseStatus = settings.ql_license_status || null;
      qlSessionId = settings.ql_session_id || null;

      showMainUI(container);
      activateBypass();

      if (settings.ql_license_key) {
        const startupHeartbeat = (attempt) => {
         /* fetch(VALIDATE_URL,*/ fetch(HEARTBEAT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              license_key: settings.ql_license_key,
              session_id: settings.ql_session_id,
              heartbeat: true,
              device_id: qlDeviceId
            })
          }).then(res => res.json()).then(data => {
            console.log("[QL] Startup heartbeat (attempt " + attempt + "):", JSON.stringify(data));
            if (data.valid) {
              qlUserName = data.user_name || qlUserName;
              qlExpiresAt = data.expires_at || qlExpiresAt;
              qlActivatedAt = data.activated_at || qlActivatedAt;
              qlLicenseStatus = data.status || qlLicenseStatus;
              qlSessionId = data.session_id || qlSessionId;

              try {
                  chrome.storage.local.set({
                    ql_user_name: qlUserName,
                    ql_expires_at: qlExpiresAt,
                    ql_activated_at: qlActivatedAt,
                    ql_license_status: qlLicenseStatus,
                    ql_session_id: qlSessionId
                  });
                } catch (e) { console.warn('[QL] Context invalidated'); }

              activateBypass();

              const profileName = document.querySelector(".ql-profile-name");
              if (profileName) {
                profileName.textContent = qlUserName || "User";
              }
              updateTrialCountdown();

             } else if (data.reason === "device_conflict") {
              if (attempt < 2) {
                setTimeout(() => startupHeartbeat(attempt + 1), 5000);
                return;
              }
              try {
                chrome.storage.local.remove([
                  "ql_license_valid", "ql_license_key", "ql_session_id",
                  "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
                ]);
              } catch (e) {
                console.warn("[QL] Context invalidated during startup heartbeat storage.remove");
              }
              deactivateBypass();
              /*
            } else if (data.reason === "device_conflict") {
              if (attempt < 2) {
                setTimeout(() => startupHeartbeat(attempt + 1), 5000);
                return;
              }
              chrome.storage.local.remove([
                "ql_license_valid", "ql_license_key", "ql_session_id",
                "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
              ]);
              deactivateBypass();
              */
              const floating = document.getElementById("ql-floating");
              if (floating) {
                showLicenseGate(floating);
              }
              setTimeout(() => showCustomAlert("Access Denied", data.message), 500);
            } else if (data.reason === "rate_limited") {
              if (attempt < 2) {
                setTimeout(() => startupHeartbeat(attempt + 1), 30000);
                return;
              }
            } else {
              chrome.storage.local.remove([
                "ql_license_valid", "ql_license_key", "ql_session_id",
                "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
              ]);
              deactivateBypass();
              const floating = document.getElementById("ql-floating");
              if (floating) {
                showLicenseGate(floating);
              }
            }
          }).catch(() => {
            if (attempt < 2) {
              setTimeout(() => startupHeartbeat(attempt + 1), 10000);
            } else {
              deactivateBypass();
            }
          });
        };
        startupHeartbeat(1);
      }
    } else {
      showLicenseGate(container);
    }

    setupDrag();
    setupResize();
  });
}

// =============================================
// LICENSE GATE UI
// =============================================

function showLicenseGate(container) {
  container.innerHTML = templateLicenseGate(qlMinimized);
  setTimeout(() => {
    const buyBtn = document.getElementById("ql-buy-license-btn");
    if (buyBtn) {
      buyBtn.addEventListener("click", () => window.open(WHATSAPP_SUPPORT_LINK, "_blank", "noopener,noreferrer"));
    }
    setupMinimize();
  }, 50);
}

// =============================================
// LICENSE VALIDATION
// =============================================

async function validateLicense() {
  const input = document.getElementById("ql-license-input");
  const log = document.getElementById("ql-license-log");
  const key = input ? input.value.trim().toUpperCase() : "";

  if (!key) {
    if (log) {
      log.className = "ql-log-error";
      log.innerText = "⚠ Enter a key";
    }
    return;
  }

  if (log) {
    log.className = "ql-log-info";
    log.innerHTML = SVG_ICONS.clock + " Validating...";
  }

  try {
    if (!qlDeviceId) {
      qlDeviceId = await getDeviceId();
    }

    const response = await fetch(SESSION_START_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        license_key: key,
        device_id: qlDeviceId
      })
    });

    const data = await response.json();

    if (data.valid || data.success) {
      qlExpiredHandled = false;
      qlSessionId = data.session_id;
      qlUserName = data.user_name;
      qlExpiresAt = data.expires_at;
      qlActivatedAt = data.activated_at;
      qlLicenseStatus = data.status;
      qlOnlineCount = data.online_count || 0;

    try {
        chrome.storage.local.set({
          license_valid: true,
          ql_license_key: key,
          ql_license_id: data.license_id || null,
          ql_session_id: data.session_id,
          ql_user_name: data.user_name || null,
          ql_expires_at: data.expires_at || null,
          ql_activated_at: data.activated_at || null,
          ql_license_status: data.status || null
        }, () => {
          activateBypass();
          if (log) {
            log.className = "ql-log-success";
            log.innerText = "✓ " + (data.message || "License validated");
          }
          try {
            if (typeof QLSounds !== "undefined") {
              QLSounds.activation();
            }
          } catch (error) {}

          setTimeout(() => {
            const floating = document.getElementById("ql-floating");
            if (floating) {
              showMainUI(floating);
            }
            startHeartbeat(key);
          }, 800);
        });
      } catch (e) { console.warn('[QL] Context invalidated'); }

    } else if (log) {
      log.className = "ql-log-error";
      log.innerText = " " + (data.message || data.error || "Invalid license");
    }
  } catch (error) {
    if (log) {
      log.className = "ql-log-error";
      log.innerText = "✗ Connection error";
 }
  }
}


// =============================================
// MAIN UI
// =============================================

function showMainUI(container) {
  const userName = qlUserName || "User";
  const statusBadge = qlLicenseStatus === "trial"
    ? "<span class=\"ql-status-badge ql-badge-test\">TEST</span>"
    : "<span class=\"ql-status-badge ql-badge-pro\">ACTIVE</span>";

  container.innerHTML = templateMainUI(userName, statusBadge, qlMinimized);
  container.style.height = qlHeight + "px";

  setTimeout(() => {
    updateSyncStatus();
    setupSend();
    setupStorageWatch();
    setupMinimize();
    setupSuggestionChips();
    setupWatermarkButton();
    updateTrialCountdown();
    setupDrag();
    setupResize();
    setupDarkMode();
    setupOptimize();
    setupSpeech();
    setupNotifications();
    setupModoPlano();
    setupFileAttachment();
    setupShield();
    setupTabs();
    loadChatHistory();
    setupNativeChatButton();
    setupClipboardPaste();
    setupDownloadProject();
    checkForUpdatePopup();
    checkResellerRolePopup();

    chrome.storage.local.get(["ql_license_key", "ql_session_id"], settings => {
      if (settings.ql_license_key) {
        qlSessionId = settings.ql_session_id || qlSessionId;
        startHeartbeat(settings.ql_license_key);
      }
    });

    var sidepanelBtn = document.getElementById("ql-sidepanel-btn");
    if (sidepanelBtn) {
      sidepanelBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        _qlOpenSidePanel();
      });
    }

    const logoutBtn = document.getElementById("ql-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (qlHeartbeatInterval) {
          clearInterval(qlHeartbeatInterval);
        }

        /*
        chrome.storage.local.remove([
          "ql_license_valid", "ql_license_key", "ql_session_id",
          "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
        ], () => {
          deactivateBypass();
         
           
          qlUserName = null;
          qlExpiresAt = null;
          qlActivatedAt = null;
          qlLicenseStatus = null;
          qlSessionId = null;
          showLicenseGate(container);
        });
      });
    }
  }, 30);
}
 */

  try {
    chrome.storage.local.remove([
      "ql_license_valid", "ql_license_key", "ql_session_id",
      "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
    ], () => {
      deactivateBypass();
    });
  } catch (e) { console.warn('[QL] Context invalidated'); }

  qlUserName = null;
  qlExpiresAt = null;
  qlActivatedAt = null;
  qlLicenseStatus = null;
  qlSessionId = null;
  showLicenseGate(container);
  });
  }
}, 30);
}
// =============================================
// CUSTOM ALERT
// =============================================

function showCustomAlert(title, message) {
  try {
    if (typeof QLSounds !== "undefined" && QLSounds.errorFromMessage) {
      var combined = (title || "") + " " + (message || "");
      if (/error|fail|denied|invalid|expir|limit|payment|rate|token|credit|sess|erro|falha|negad|inv[áa]lid|limite|cr[eé]dito/i.test(combined)) {
        QLSounds.errorFromMessage(combined);
      }
    }
  } catch (error) {}

  const alert = document.getElementById("ql-custom-alert");
  if (!alert) {
    return;
  }
  const alertTitle = alert.querySelector(".ql-alert-title");
  const alertMessage = alert.querySelector(".ql-alert-message");
  const alertOkBtn = alert.querySelector(".ql-alert-ok-btn");

  if (alertTitle) {
    alertTitle.textContent = title;
  }
  if (alertMessage) {
    alertMessage.textContent = message;
  }
  alert.style.display = "flex";

  if (alertOkBtn) {
    alertOkBtn.onclick = () => {
      alert.style.display = "none";
    };
  }

  setTimeout(() => {
    alert.style.display = "none";
  }, 4000);
}

// =============================================
// OPTIMIZE PROMPT
// =============================================

function setupOptimize() {
  const btn = document.getElementById("ql-optimize-btn");
  if (!btn) {
    return;
  }

  btn.addEventListener("click", async () => {
    const input = document.getElementById("ql-msg");
    if (!input || !input.value.trim()) {
      showCustomAlert("Attention", "Enter a prompt before optimizing.");
      return;
    }

    const prompt = input.value.trim();
    btn.classList.add("ql-tool-loading");
    btn.disabled = true;

    const settings = await new Promise(resolve => chrome.storage.local.get(["ql_license_key"], resolve));
    const licenseKey = settings.ql_license_key || "";

    try {
      const result = await bgFetch(OPTIMIZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          "x-license-key": licenseKey
        },
        body: JSON.stringify({
          prompt: prompt
        })
      });

      if (result.optimized_prompt) {
        input.value = result.optimized_prompt;
        showCustomAlert("Prompt Optimized! ✨", "Your prompt was enhanced with AI and is ready to send.");
      } else if (result.error) {
        showCustomAlert("Error", result.error);
      }
    } catch (error) {
      console.error("[Optimize] error:", error);
      showCustomAlert("Error", "Failed to connect to the optimizer: " + (error.message || ""));
    } finally {
      btn.classList.remove("ql-tool-loading");
      btn.disabled = false;
    }
  });
}

// =============================================
// SPEECH RECOGNITION
// =============================================

function setupSpeech() {
  const btn = document.getElementById("ql-speech-btn");
  if (!btn) {
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btn.title = "Speech not supported in this browser";
    btn.style.opacity = "0.4";
    btn.style.cursor = "not-allowed";
    return;
  }

  btn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    if (qlIsRecording && qlSpeechRecognition) {
      qlSpeechRecognition.stop();
      return;
    }

    try {
      qlSpeechRecognition = new SpeechRecognition();
      qlSpeechRecognition.lang = "en-US";
      qlSpeechRecognition.continuous = true;
      qlSpeechRecognition.interimResults = true;
      qlSpeechRecognition.maxAlternatives = 1;

      let finalTranscript = "";
      const input = document.getElementById("ql-msg");

      qlSpeechRecognition.onstart = () => {
        qlIsRecording = true;
        btn.classList.add("ql-recording");
        finalTranscript = input ? input.value : "";
        console.log("[QL Speech] Recording started");
      };

      qlSpeechRecognition.onresult = event => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
        if (input) {
          input.value = finalTranscript + interimTranscript;
        }
      };

      qlSpeechRecognition.onerror = event => {
        console.warn("[QL Speech] Error:", event.error);
        qlIsRecording = false;
        btn.classList.remove("ql-recording");

        if (event.error === "not-allowed") {
          showCustomAlert("Permission Denied", "Allow microphone access in your browser settings.");
        } else if (event.error === "no-speech") {
          showCustomAlert("No Audio", "No speech detected. Try again.");
        } else if (event.error !== "aborted") {
          showCustomAlert("Voice Error", "Error: " + event.error);
        }
      };

      qlSpeechRecognition.onend = () => {
        qlIsRecording = false;
        btn.classList.remove("ql-recording");
        if (input) {
          input.value = finalTranscript.trim();
        }
        console.log("[QL Speech] Recording finished");
      };

      qlSpeechRecognition.start();
    } catch (error) {
      console.error("[QL Speech] Failed to start:", error);
      qlIsRecording = false;
      btn.classList.remove("ql-recording");
      showCustomAlert("Error", "Could not start speech recognition.");
    }
  });
}

// =============================================
// NOTIFICATIONS
// =============================================

function setupNotifications() {
  const notifBtn = document.querySelector(".ql-notif-btn");
  const notifPanel = document.getElementById("ql-notif-panel");
  const notifClose = document.getElementById("ql-notif-close");

  if (!notifBtn || !notifPanel) {
    return;
  }

  notifBtn.addEventListener("click", event => {
    event.stopPropagation();
    const isOpen = notifPanel.style.display !== "none";
    notifPanel.style.display = isOpen ? "none" : "block";
    if (!isOpen) {
      loadNotifications();
    }
  });

  if (notifClose) {
    notifClose.addEventListener("click", event => {
      event.stopPropagation();
      notifPanel.style.display = "none";
    });
  }

  checkUnreadNotifications();
}

async function loadNotifications() {
  const list = document.getElementById("ql-notif-list");
  if (!list) {
    return;
  }

  list.innerHTML = "<p class=\"ql-notif-empty\">Loading...</p>";

  try {
    const data = await bgFetch(NOTIFICATIONS_URL, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY
      }
    });

    if (!data || data.length === 0) {
      list.innerHTML = "<p class=\"ql-notif-empty\">No notifications.</p>";
      return;
    }

    const readIds = data.map(item => item.id);
   try {
  chrome.storage.local.set({
    ql_read_notifs: readIds
  });
} catch (e) { console.warn('[QL] Context invalidated'); }
    const badge = document.querySelector(".ql-notif-badge");
    if (badge) {
      badge.style.display = "none";
    }

    list.innerHTML = data.map(item => {
      const date = new Date(item.created_at).toLocaleDateString("en-US");
      const link = sanitizeUrl(item.link);
      const linkHtml = link
        ? "<a href=\"" + escapeHtml(link) + "\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"ql-notif-link\">Open link →</a>"
        : "";
      return "<div class=\"ql-notif-item\"><div class=\"ql-notif-item-title\">" + escapeHtml(item.title) + "</div><div class=\"ql-notif-item-msg\">" + escapeHtml(item.message) + "</div>" + linkHtml + "<div class=\"ql-notif-item-date\">" + date + "</div></div>";
    }).join("");
  } catch (error) {
    list.innerHTML = "<p class=\"ql-notif-empty\">Error loading.</p>";
  }
}

async function checkUnreadNotifications() {
  try {
    const data = await bgFetch(NOTIFICATIONS_URL, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY
      }
    });

    if (!data || data.length === 0) {
      return;
    }

    chrome.storage.local.get(["ql_read_notifs"], settings => {
      const readIds = settings.ql_read_notifs || [];
      const unreadCount = data.filter(item => !readIds.includes(item.id)).length;
      const badge = document.querySelector(".ql-notif-badge");

      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.style.display = "flex";
        } else {
          badge.style.display = "none";
        }
      }
    });
  } catch (error) {}
}

// =============================================
// SUGGESTION CHIPS
// =============================================

function setupSuggestionChips() {
  const chipsContainer = document.getElementById("ql-chips");
  if (!chipsContainer) {
    return;
  }

  PROMPT_TEMPLATES.forEach(template => {
    const chip = document.createElement("button");
    chip.className = "ql-chip";
    chip.innerHTML = template.icon + " " + template.label;
    chip.title = template.prompt;
    chip.addEventListener("click", () => {
      const input = document.getElementById("ql-msg");
      if (input) {
        input.value = template.prompt;
      }
    });
    chipsContainer.appendChild(chip);
  });
}

// =============================================
// WATERMARK BUTTON
// =============================================

var WATERMARK_PROMPT = "use css to completely hide the lovable badge (Made with Lovable)";

function setupWatermarkButton() {
  var btn = document.getElementById("ql-remove-watermark");
  if (!btn) {
    return;
  }

  btn.addEventListener("click", async function () {
    var log = document.getElementById("ql-log");
    btn.disabled = true;
    btn.textContent = "⏳ Sending...";

    try {
      await sendNativeToLovable(WATERMARK_PROMPT);
      if (log) {
        log.className = "ql-log-success";
        log.innerText = "✓Prompt sent! Wait for Lovable to apply the CSS.";
      }
    } catch (error) {
      if (log) {
        log.className = "ql-log-error";
        log.innerText = "✗ " + (error.message || error);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Remove Watermark";
    }
  });
}

// =============================================
// TRIAL COUNTDOWN
// =============================================

function updateTrialCountdown() {
  if (!qlExpiresAt) {
    return;
  }

  const countdownEl = document.getElementById("ql-trial-countdown");
  if (!countdownEl) {
    return;
  }

  countdownEl.style.display = "block";
  const startTime = Date.now();

  function updateCountdown() {
    const expiryTime = new Date(qlExpiresAt).getTime();
    const totalTime = Math.max(expiryTime - startTime, 3600000);
    const remaining = expiryTime - Date.now();

    if (remaining <= 0) {
      countdownEl.innerHTML = "<span class=\"ql-countdown-expired\">" + t("countdown.expired") + "</span><div class=\"ql-trial-bar\"><div class=\"ql-trial-bar-fill ql-bar-expired\" style=\"width:0%\"></div></div>";
      handleLicenseExpired();
      return;
    }

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor(remaining % 86400000 / 3600000);
    const minutes = Math.floor(remaining % 3600000 / 60000);
    const seconds = Math.floor(remaining % 60000 / 1000);
    const percentage = Math.max(0, Math.min(100, remaining / totalTime * 100));

    let timeStr = "";
    if (days > 0) {
      timeStr = days + "d " + hours + "h " + minutes + "m";
    } else if (hours > 0) {
      timeStr = hours + "h " + minutes + "m " + String(seconds).padStart(2, "0") + "s";
    } else {
      timeStr = minutes + ":" + String(seconds).padStart(2, "0");
    }

    const urgentClass = percentage < 20 ? " ql-bar-urgent" : "";
    const label = qlLicenseStatus === "trial" ? t("countdown.trial") : t("countdown.license");

    countdownEl.innerHTML = "<div class=\"ql-countdown-row\"><span class=\"ql-countdown-icon\">" + SVG_ICONS.clock + "</span><span class=\"ql-countdown-label\">" + label + "</span><span class=\"ql-countdown-time\">" + timeStr + "</span></div><div class=\"ql-trial-bar\"><div class=\"ql-trial-bar-fill" + urgentClass + "\" style=\"width:" + percentage + "%\"></div></div>";
  }

  updateCountdown();

  if (window.qlCountdownInterval) {
    clearInterval(window.qlCountdownInterval);
  }
  window.qlCountdownInterval = setInterval(updateCountdown, 1000);
}

// =============================================
// MINIMIZE
// =============================================

function setupMinimize() {
  const btn = document.getElementById("ql-minimize");
  if (!btn) {
    return;
  }

  btn.addEventListener("click", event => {
    event.stopPropagation();
    const container = document.getElementById("ql-floating");
    if (!container) {
      return;
    }

    qlMinimized = !qlMinimized;
    container.classList.toggle("ql-minimized", qlMinimized);
    btn.textContent = qlMinimized ? "□" : "−";
    /*
    chrome.storage.local.set({
      ql_minimized: qlMinimized
    });
  });
  */
try {
    chrome.storage.local.set({
      ql_minimized: qlMinimized
    });
  } catch (e) { console.warn('[QL] Context invalidated'); }
  });

}

// =============================================
// DARK MODE
// =============================================

function setupDarkMode() {
  const btn = document.querySelector(".ql-icon-btn[title=\"Theme\"]");
  if (!btn) {
    return;
  }

  btn.addEventListener("click", event => {
    event.stopPropagation();
    const container = document.getElementById("ql-floating");
    if (!container) {
      return;
    }

    const isLight = container.classList.toggle("ql-light");
    try {
      chrome.storage.local.set({
        ql_dark_mode: !isLight
      });
    } catch (e) { console.warn('[QL] Context invalidated'); }
      });
}

// =============================================
// PLAN MODE
// =============================================

function setupModoPlano() {
  const toggle = document.getElementById("ql-modo-plano");
  if (!toggle) {
    return;
  }

 try {
  chrome.storage.local.get(["ql_modo_plano"], settings => {
    if (settings.ql_modo_plano === true) {
      toggle.checked = true;
    }
  });
} catch (e) { console.warn('[QL] Context invalidated'); }

  toggle.addEventListener("change", () => {
    try {
      chrome.storage.local.set({
        ql_modo_plano: toggle.checked
      });
    } catch (e) { console.warn('[QL] Context invalidated'); }
    if (toggle.checked) {
      showModoPlanoAlert();
    }
  });
}

function showModoPlanoAlert() {
  const existing = document.querySelector(".ql-modo-plano-overlay");
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement("div");
  overlay.className = "ql-modo-plano-overlay";
  overlay.innerHTML = "<div class=\"ql-modo-plano-modal\"><div class=\"ql-modo-plano-icon\">️</div><div class=\"ql-modo-plano-title\">Attention — Plan Mode</div><div class=\"ql-modo-plano-body\">The <strong>Plan/Think Mode</strong> may consume credits, but offers helpful guidance. Use in moderation!</div><div class=\"ql-modo-plano-steps\"><div class=\"ql-modo-plano-step\"><span class=\"ql-modo-plano-step-num\">1</span><span class=\"ql-modo-plano-step-text\">Enable <strong>Plan Mode</strong> to generate a plan.</span></div><div class=\"ql-modo-plano-step\"><span class=\"ql-modo-plano-step-num\">2</span><span class=\"ql-modo-plano-step-text\">In Lovable, <strong>do not click the Approve button</strong>; just copy the new plan.</span></div><div class=\"ql-modo-plano-step\"><span class=\"ql-modo-plano-step-num\">3</span><span class=\"ql-modo-plano-step-text\">Paste the copied plan into the extension prompt.</span></div><div class=\"ql-modo-plano-step\"><span class=\"ql-modo-plano-step-num\">4</span><span class=\"ql-modo-plano-step-text\"><strong>Turn off Plan Mode</strong> and send via the extension; no extra credits will be consumed.</span></div><div class=\"ql-modo-plano-check\"><input type=\"checkbox\" id=\"ql-modo-plano-dismiss\" /><label for=\"ql-modo-plano-dismiss\">Don't show again</label><button class=\"ql-modo-plano-btn\" id=\"ql-modo-plano-ok\">Got it!</button>";

  const container = document.getElementById("ql-floating");
  if (container) {
    container.appendChild(overlay);
  } else {
    document.body.appendChild(overlay);
  }

  requestAnimationFrame(() => overlay.classList.add("ql-modo-plano-visible"));

  const hide = () => {
    overlay.classList.remove("ql-modo-plano-visible");
    setTimeout(() => overlay.remove(), 180);
  };

  const okBtn = overlay.querySelector("#ql-modo-plano-ok");
  if (okBtn) {
    okBtn.addEventListener("click", () => {
      const dismiss = overlay.querySelector("#ql-modo-plano-dismiss");
      if (dismiss && dismiss.checked) {
       try {
        chrome.storage.local.set({
          ql_modo_plano_alert_dismissed: true
        });
      } catch (e) { console.warn('[QL] Context invalidated'); }
      }
      hide();
    });
  }

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      hide();
    }
  });
}

// =============================================
// SHIELD
// =============================================

function setupShield() {
  const btn = document.getElementById("ql-shield-btn");
  if (!btn) {
    return;
  }

  chrome.storage.local.get(["ql_shield_active"], settings => {
    if (settings.ql_shield_active === true) {
      qlShieldActive = true;
      btn.classList.add("ql-shield-active");
      const label = document.getElementById("ql-shield-label");
      if (label) {
        label.textContent = "Deactivate Shield";
      }
      injectShieldOverlay();
    }
  });

  btn.addEventListener("click", () => {
    qlShieldActive = !qlShieldActive;
        try {
      chrome.storage.local.set({
        ql_shield_active: qlShieldActive
      });
} catch (e) { console.warn('[QL] Context invalidated'); }
    const label = document.getElementById("ql-shield-label");
    if (qlShieldActive) {
      btn.classList.add("ql-shield-active");
      if (label) {
        label.textContent = "Deactivate Shield";
      }
      injectShieldOverlay();
      showCustomAlert("Shield Activated 🛡️", "Lovable input is blocked. Use the extension to send prompts.");
    } else {
      btn.classList.remove("ql-shield-active");
      if (label) {
        label.textContent = "Activate Shield";
      }
      removeShieldOverlay();
      showCustomAlert("Shield Deactivated", "Lovable input is unlocked again.");
    }
  });
}

function injectShieldOverlay() {
  if (document.getElementById("ql-shield-overlay")) {
    return;
  }

  // --- OLD: const form = document.querySelector("form#chat-input"); ---
  // Using verified selector
  const form = document.querySelector(LOVABLE_SELECTORS.chatForm);
  if (!form) {
    setTimeout(injectShieldOverlay, 1000);
    return;
  }

  const computedPosition = getComputedStyle(form).position;
  if (computedPosition === "static") {
    form.style.position = "relative";
  }

  const overlay = document.createElement("div");
  overlay.id = "ql-shield-overlay";
  overlay.className = "ql-shield-overlay";
  overlay.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg><span class=\"ql-shield-overlay-text\">🛡️ Protected by " + EXTENSION_NAME + " Extension</span><span class=\"ql-shield-overlay-sub\">Use the extension to send prompts</span>";

  overlay.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  overlay.addEventListener("mousedown", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);

  overlay.addEventListener("keydown", event => {
    event.preventDefault();
    event.stopPropagation();
  }, true);

  form.appendChild(overlay);

  const elements = form.querySelectorAll("input, button, textarea, [contenteditable]");
  elements.forEach(el => {
    if (el.id !== "ql-shield-overlay") {
      el.dataset.qlShieldDisabled = el.disabled || "";
      el.dataset.qlShieldTabindex = el.getAttribute("tabindex") || "";
      el.setAttribute("tabindex", "-1");
      if (el.tagName !== "DIV") {
        el.disabled = true;
      }
      if (el.contentEditable === "true") {
        el.contentEditable = "false";
        el.dataset.qlShieldEditable = "true";
      }
    }
  });
}

function removeShieldOverlay() {
  const overlay = document.getElementById("ql-shield-overlay");
  if (overlay) {
    overlay.remove();
  }

  // --- OLD: const form = document.querySelector("form#chat-input"); ---
  const form = document.querySelector(LOVABLE_SELECTORS.chatForm);
  if (!form) {
    return;
  }

  const disabledElements = form.querySelectorAll("[data-ql-shield-disabled]");
  disabledElements.forEach(el => {
    const wasDisabled = el.dataset.qlShieldDisabled;
    if (wasDisabled === "true") {
      el.disabled = true;
    } else if (wasDisabled === "" || wasDisabled === "false") {
      el.disabled = false;
    }
    delete el.dataset.qlShieldDisabled;

    const originalTabindex = el.dataset.qlShieldTabindex;
    if (originalTabindex) {
      el.setAttribute("tabindex", originalTabindex);
    } else {
      el.removeAttribute("tabindex");
    }
    delete el.dataset.qlShieldTabindex;

    if (el.dataset.qlShieldEditable === "true") {
      el.contentEditable = "true";
      delete el.dataset.qlShieldEditable;
    }
  });
}

// =============================================
// HEARTBEAT
// =============================================

let qlHbConflictCount = 0;
let qlHbNetworkFailCount = 0;

function startHeartbeat(licenseKey) {
  if (qlHeartbeatInterval) {
    clearInterval(qlHeartbeatInterval);
  }

  qlHbConflictCount = 0;
  qlHbNetworkFailCount = 0;

  qlHeartbeatInterval = setInterval(async () => {
    try {
      // Check if extension context is still valid before making API calls
      if (chrome.runtime && chrome.runtime.id) {
        // Context is valid, proceed
      } else {
        // Extension context invalidated — stop heartbeat immediately
        clearInterval(qlHeartbeatInterval);
        qlHeartbeatInterval = null;
        console.warn("[QL] Extension context invalidated — heartbeat stopped");
        return;
      }

      const data = await bgFetch(HEARTBEAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          license_key: licenseKey,
          session_id: qlSessionId,
          session_token: qlSessionId,
          heartbeat: true,
          device_id: qlDeviceId
        })
      });

      if (!data.valid && !data.success) {
        const isConflict = data.reason === "device_conflict";
        const isExpired = data.reason === "expired" || data.reason === "suspended" ||
          (data.message && (data.message.includes("expirada") || data.message.includes("suspensa")));

        if (isConflict) {
          qlHbConflictCount++;
          if (qlHbConflictCount < 2) {
            return;
          }
        }

        if (isConflict || isExpired) {
          clearInterval(qlHeartbeatInterval);
          qlHeartbeatInterval = null;
          deactivateBypass();
          try {
            chrome.storage.local.remove([
              "ql_license_valid", "ql_license_key", "ql_session_id",
              "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
            ]);
          } catch (e) {
            console.warn("[QL] Context invalidated during storage.remove");
          }
          const floating = document.getElementById("ql-floating");
          if (floating) {
            showLicenseGate(floating);
          }
          if (isConflict) {
            setTimeout(() => showCustomAlert("Acesso Negado", data.message), 500);
          }
        }
        return;
      }

      qlHbConflictCount = 0;
      qlHbNetworkFailCount = 0;

      qlOnlineCount = data.online_count || 0;
      const onlineCountEl = document.getElementById("ql-online-count");
      if (onlineCountEl) {
        onlineCountEl.textContent = qlOnlineCount;
      }

      if (data.expires_at) {
        qlExpiresAt = data.expires_at;
      }
      if (data.status) {
        qlLicenseStatus = data.status;
      }
      if (data.activated_at) {
        qlActivatedAt = data.activated_at;
      }

      try {
        chrome.storage.local.set({
          ql_license_status: qlLicenseStatus,
          ql_expires_at: qlExpiresAt,
          ql_activated_at: qlActivatedAt
        });
      } catch (e) {
        console.warn("[QL] Context invalidated during heartbeat storage.set");
      }

      if (data.user_name) {
        qlUserName = data.user_name;
        try {
          chrome.storage.local.set({
            ql_user_name: qlUserName
          });
        } catch (e) {
          console.warn("[QL] Context invalidated during heartbeat storage.set (user_name)");
        }
        const profileName = document.querySelector(".ql-profile-name");
        if (profileName) {
          profileName.textContent = data.user_name;
        }
      }
    } catch (error) {
      console.warn("[QL] Heartbeat error", error);
      qlHbNetworkFailCount++;
      if (qlHbNetworkFailCount >= 5) {
        deactivateBypass();
        qlHbNetworkFailCount = 0;
      }
    }
  }, 60000);
}



/*
function startHeartbeat(licenseKey) {
  if (qlHeartbeatInterval) {
    clearInterval(qlHeartbeatInterval);
  }

  qlHbConflictCount = 0;
  qlHbNetworkFailCount = 0;

  qlHeartbeatInterval = setInterval(async () => {
    try {
      const data = await bgFetch(HEARTBEAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          license_key: licenseKey,
          session_id: qlSessionId,
          session_token: qlSessionId,
          heartbeat: true,
          device_id: qlDeviceId
        })
      });

      if (!data.valid && !data.success) {
        const isConflict = data.reason === "device_conflict";
        const isExpired = data.reason === "expired" || data.reason === "suspended" ||
          (data.message && (data.message.includes("expirada") || data.message.includes("suspensa")));

        if (isConflict) {
          qlHbConflictCount++;
          if (qlHbConflictCount < 2) {
            return;
          }
        }

        if (isConflict || isExpired) {
          clearInterval(qlHeartbeatInterval);
          deactivateBypass();
          chrome.storage.local.remove([
            "ql_license_valid", "ql_license_key", "ql_session_id",
            "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
          ], () => {
            const floating = document.getElementById("ql-floating");
            if (floating) {
              showLicenseGate(floating);
            }
            if (isConflict) {
              setTimeout(() => showCustomAlert("Access Denied", data.message), 500);
            }
          });
        }
        return;
      }

      qlHbConflictCount = 0;
      qlHbNetworkFailCount = 0;

      qlOnlineCount = data.online_count || 0;
      const onlineCountEl = document.getElementById("ql-online-count");
      if (onlineCountEl) {
        onlineCountEl.textContent = qlOnlineCount;
      }

      if (data.expires_at) {
        qlExpiresAt = data.expires_at;
      }
      if (data.status) {
        qlLicenseStatus = data.status;
      }
      if (data.activated_at) {
        qlActivatedAt = data.activated_at;
      }

      try {
  chrome.storage.local.set({
    ql_license_status: qlLicenseStatus,
    ql_expires_at: qlExpiresAt,
    ql_activated_at: qlActivatedAt
  });
} catch (e) { console.warn('[QL] Context invalidated'); }

      if (data.user_name) {
        qlUserName = data.user_name;
        try {
  chrome.storage.local.set({
    ql_user_name: qlUserName
  });
} catch (e) { console.warn('[QL] Context invalidated'); }
        const profileName = document.querySelector(".ql-profile-name");
        if (profileName) {
          profileName.textContent = data.user_name;
        }
      }
    } catch (error) {
      console.warn("[QL] Heartbeat error", error);
      qlHbNetworkFailCount++;
      if (qlHbNetworkFailCount >= 5) {
        deactivateBypass();
        qlHbNetworkFailCount = 0;
      }
    }
  }, 60000);
}
*/
// =============================================
// LICENSE EXPIRED HANDLER
// =============================================

function handleLicenseExpired() {
  if (qlExpiredHandled) {
    return;
  }
  qlExpiredHandled = true;

  if (qlHeartbeatInterval) {
    clearInterval(qlHeartbeatInterval);
  }
  if (window.qlCountdownInterval) {
    clearInterval(window.qlCountdownInterval);
  }

  const overlay = document.createElement("div");
  overlay.className = "ql-sweetalert-overlay";
  overlay.innerHTML = templateExpiredOverlay();

  const container = document.getElementById("ql-floating");
  if (container) {
    container.appendChild(overlay);
  }

  requestAnimationFrame(() => overlay.classList.add("ql-sweetalert-visible"));

  const closeBtn = overlay.querySelector("#ql-sweetalert-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      overlay.classList.remove("ql-sweetalert-visible");
      setTimeout(() => {
        overlay.remove();
        chrome.storage.local.remove([
          "ql_license_valid", "ql_license_key", "ql_session_id",
          "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status"
        ], () => {
          if (container) {
            showLicenseGate(container);
          }
        });
      }, 300);
    });
  }
}

// =============================================
// BOOTSTRAP
// =============================================

function qlBootstrap() {
  if (document.getElementById("ql-floating")) {
    return;
  }
  if (!document.body) {
    var observer = new MutationObserver(function () {
      if (document.body) {
        observer.disconnect();
        qlBootstrap();
      }
    });
    observer.observe(document.documentElement, {
      childList: true
    });
    return;
  }
  createUI();
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(qlBootstrap, 50);
} else {
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(qlBootstrap, 50);
  });
}

var qlRetryCount = 0;
var qlRetryDelays = [300, 600, 1000, 1500, 2000, 3000, 4000, 5000];

function qlRetryInit() {
  if (document.getElementById("ql-floating") || qlRetryCount >= qlRetryDelays.length) {
    return;
  }
  var delay = qlRetryDelays[qlRetryCount];
  qlRetryCount++;
  setTimeout(function () {
    if (!document.getElementById("ql-floating") && document.body) {
      createUI();
    }
    qlRetryInit();
  }, delay);
}

qlRetryInit();

// =============================================
// STORAGE CHANGE LISTENER
// =============================================

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") {
    return;
  }

  if (changes.ql_sidebar_mode) {
    if (changes.ql_sidebar_mode.newValue === true) {
      if (qlSidebarActivateTimer) {
        clearTimeout(qlSidebarActivateTimer);
        qlSidebarActivateTimer = null;
      }

      const floating = document.getElementById("ql-floating");
      if (floating) {
        floating.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        floating.style.opacity = "0";
        floating.style.transform = "scale(0.95)";
        setTimeout(() => {
          if (qlHeartbeatInterval) {
            clearInterval(qlHeartbeatInterval);
          }
          if (window.qlCountdownInterval) {
            clearInterval(window.qlCountdownInterval);
          }
          floating.remove();
        }, 350);
      }
    } else if (changes.ql_sidebar_mode.newValue === false) {
      setTimeout(() => {
        _buildFloatingUI();
        setTimeout(() => {
          const floating = document.getElementById("ql-floating");
          if (floating) {
            floating.style.opacity = "0";
            floating.style.transform = "scale(0.95) translateX(20px)";
            requestAnimationFrame(() => {
              floating.style.transition = "opacity 0.4s ease, transform 0.4s ease";
              floating.style.opacity = "1";
              floating.style.transform = "scale(1) translateX(0)";
            });
          }
        }, 50);
      }, 100);
    }
  }
});

// =============================================
// SYNC STATUS
// =============================================

function updateSyncStatus() {
  chrome.storage.local.get(["lovable_projectId", "lovable_token"], settings => {
    const statusEl = document.getElementById("ql-sync-status");
    if (!statusEl) {
      return;
    }

    if (settings.lovable_projectId && settings.lovable_token) {
      statusEl.className = "ql-sync-status ql-sync-ok";
      const shortId = settings.lovable_projectId.substring(0, 6);
      statusEl.innerHTML = "<span class=\"ql-sync-text\">" + t("sync.ok") + " " + t("sync.project") + " " + shortId + "...</span>";
    } else {
      statusEl.className = "ql-sync-status ql-sync-waiting";
      statusEl.innerHTML = "<span class=\"ql-sync-text\">" + SVG_ICONS.clock + t("sync.waiting") + "</span>";
    }
  });
}

function setupStorageWatch() {
  chrome.storage.onChanged.addListener(changes => {
    if (changes.lovable_projectId || changes.lovable_token) {
      updateSyncStatus();
    }
  });
}

// =============================================
// TOKEN REQUEST
// =============================================

function requestLatestTokenFromHook(timeout = 1200) {
  return new Promise(resolve => {
    let resolved = false;

    function finish(value) {
      if (resolved) {
        return;
      }
      resolved = true;
      clearTimeout(timer);
      chrome.storage.onChanged.removeListener(storageListener);
      resolve(value);
    }

    function storageListener(changes, area) {
      if (area !== "local") {
        return;
      }
      if (changes.lovable_token && changes.lovable_token.newValue) {
        finish(true);
      }
    }

    const timer = setTimeout(() => finish(false), Math.max(300, timeout));
    chrome.storage.onChanged.addListener(storageListener);

    try {
      window.postMessage({
        type: "lovableRequestToken"
      }, "*");
      setTimeout(() => window.postMessage({
        type: "lovableRequestToken"
      }, "*"), 120);
    } catch (error) {
      finish(false);
    }
  });
}

// =============================================
// CHAT HISTORY
// =============================================

function loadChatHistory(callback) {
  try {
    chrome.storage.local.get([QL_HISTORY_KEY], settings => {
      qlChatHistory = settings[QL_HISTORY_KEY] || [];
      updateHistoryBadge();
      if (callback) {
        callback();
      }
    });
  } catch (e) {
    console.warn('[QL] Context invalidated — please reload page');
    qlChatHistory = [];
    if (callback) callback();
  }
}

/*function loadChatHistory(callback) {
  chrome.storage.local.get([QL_HISTORY_KEY], settings => {
    qlChatHistory = settings[QL_HISTORY_KEY] || [];
    updateHistoryBadge();
    if (callback) {
      callback();
    }
  });
}
*/
/*function saveChatHistory() {
  if (qlChatHistory.length > QL_MAX_HISTORY) {
    qlChatHistory = qlChatHistory.slice(-QL_MAX_HISTORY);
  }
  chrome.storage.local.set({
    [QL_HISTORY_KEY]: qlChatHistory
  });
}
*/
function saveChatHistory() {
  if (qlChatHistory.length > QL_MAX_HISTORY) {
    qlChatHistory = qlChatHistory.slice(-QL_MAX_HISTORY);
  }
  try {
    chrome.storage.local.set({
      [QL_HISTORY_KEY]: qlChatHistory
    });
  } catch (e) {
    console.warn('[QL] Context invalidated, extension reload needed');
  }
}

function addToChatHistory(text, status) {
  qlChatHistory.push({
    text: text,
    timestamp: new Date().toISOString(),
    status: status || "ok"
  });
  saveChatHistory();
  updateHistoryBadge();
}

function updateHistoryBadge() {
  const badge = document.getElementById("ql-history-badge");
  if (!badge) {
    return;
  }
  if (qlChatHistory.length > 0) {
    badge.textContent = qlChatHistory.length;
    badge.style.display = "inline-flex";
  } else {
    badge.style.display = "none";
  }
}

function formatChatDate(timestamp) {
  var date = new Date(timestamp);
  var today = new Date();
  var todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  var diffDays = (todayStart - dateStart) / 86400000;

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
  }
  return date.toLocaleDateString("en-US");
}

function formatChatTime(timestamp) {
  var date = new Date(timestamp);
  return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

function renderHistoryView() {
  const content = document.getElementById("ql-tab-content");
  if (!content) {
    return;
  }

  if (!qlChatHistory.length) {
    content.innerHTML = "<div class=\"ql-chat-empty\"><div style=\"font-size:28px;margin-bottom:8px\">💬</div><div style=\"font-size:13px;font-weight:600;color:var(--ql-text-primary,#f4f4f5)\">No messages</div><div style=\"font-size:11px;color:var(--ql-text-muted,#71717a);margin-top:4px\">Your sent prompts will appear here.</div></div>";
    return;
  }

  let html = "<div class=\"ql-chat-messages\">";
  let lastDate = "";

  for (let i = 0; i < qlChatHistory.length; i++) {
    const msg = qlChatHistory[i];
    const dateLabel = formatChatDate(msg.timestamp);

    if (dateLabel !== lastDate) {
      html += "<div class=\"ql-chat-date-divider\"><span class=\"ql-chat-date-label\">" + dateLabel + "</span></div>";
      lastDate = dateLabel;
    }

    const statusClass = msg.status === "error" ? "ql-chat-status-err" : "ql-chat-status-ok";
    const statusText = msg.status === "error" ? "✗ Error" : "✓ Sent";
    const truncated = msg.text.length > 300 ? escapeHtml(msg.text.substring(0, 300)) + "…" : escapeHtml(msg.text);

    html += "<div class=\"ql-chat-bubble\" title=\"" + escapeHtml(msg.text) + "\">" + truncated + "<div class=\"ql-chat-meta\"><span class=\"" + statusClass + "\">" + statusText + "</span><span class=\"ql-chat-time\">" + formatChatTime(msg.timestamp) + "</span></div></div>";
  }

  html += "</div>";
  html += "<div class=\"ql-chat-actions\"><span class=\"ql-chat-count\">" + qlChatHistory.length + " message" + (qlChatHistory.length === 1 ? "" : "s") + "</span><button class=\"ql-chat-clear\" id=\"ql-chat-clear\">🗑 Clear</button></div>";

  content.innerHTML = html;

  const messagesContainer = content.querySelector(".ql-chat-messages");
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  const clearBtn = document.getElementById("ql-chat-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      qlChatHistory = [];
      saveChatHistory();
      updateHistoryBadge();
      renderHistoryView();
    });
  }
}

function renderPromptView() {
  const content = document.getElementById("ql-tab-content");
  if (!content) {
    return;
  }

 // content.innerHTML = "<textarea id=\"ql-msg\" rows=\"3\" placeholder=\"Type your command...\" spellcheck=\"false\"></textarea><div id=\"ql-attach-preview\" class=\"ql-attach-preview\" style=\"display:none\"></div><div class=\"ql-action-bar\"><div class=\"ql-action-left\"><label class=\"ql-toggle\"><input type=\"checkbox\" id=\"ql-modo-plano\"><span class=\"ql-toggle-slider\"></span></label><span class=\"ql-toggle-label-inline\">Plan Mode</span></div><div class=\"ql-action-center\"><button id=\"ql-attach-btn\" class=\"ql-attach-btn\" title=\"Attach file (max. 10)\"></button><button id=\"ql-optimize-btn\" class=\"ql-tool-btn\" title=\"Optimize with AI\">" + SVG_ICONS.openai + "</button><button id=\"ql-native-chat-btn\" class=\"ql-native-chat-btn\">Use Default Chat</button><button id=\"ql-download-project\" class=\"ql-watermark-btn\" style=\"background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.08));border-color:rgba(59,130,246,0.3);color:#60a5fa;margin-top:6px\">Download Source Code</button><div id=\"ql-download-status\" style=\"display:none\"></div>" + SVG_ICONS.mic + "</div></div>";
   content.innerHTML = "<textarea id=\"ql-msg\" rows=\"3\" placeholder=\"Type your command...\" spellcheck=\"false\"></textarea><div id=\"ql-attach-preview\" class=\"ql-attach-preview\" style=\"display:none\"></div><input type=\"file\" id=\"ql-file-input\" multiple style=\"display:none\" accept=\"image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/json,text/csv,application/zip,application/x-zip-compressed\"><div class=\"ql-action-bar\"><div class=\"ql-action-left\"><label class=\"ql-toggle\"><input type=\"checkbox\" id=\"ql-modo-plano\"><span class=\"ql-toggle-slider\"></span></label><span class=\"ql-toggle-label-inline\">Plan Mode</span></div><div class=\"ql-action-center\"><button id=\"ql-attach-btn\" class=\"ql-attach-btn\" title=\"Attach file (max. 10)\"></button><button id=\"ql-optimize-btn\" class=\"ql-tool-btn\" title=\"Optimize with AI\">" + SVG_ICONS.openai + "</button><button id=\"ql-native-chat-btn\" class=\"ql-native-chat-btn\">Use Default Chat</button><button id=\"ql-download-project\" class=\"ql-watermark-btn\" style=\"background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.08));border-color:rgba(59,130,246,0.3);color:#60a5fa;margin-top:6px\">Download Source Code</button><div id=\"ql-download-status\" style=\"display:none\"></div>" + SVG_ICONS.mic + "</div></div>";
// Add Send button
content.innerHTML += '<button id="ql-send" style="background:#6366f1;color:white;border:none;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-top:12px;width:100%">Send</button>';
  setupSend();
  setupSuggestionChips();
  setupWatermarkButton();
  setupOptimize();
  setupSpeech();
  setupModoPlano();
  setupFileAttachment();
  setupShield();
  setupNativeChatButton();
  setupClipboardPaste();
  setupDownloadProject();
}

function setupTabs() {
  const tabs = document.querySelectorAll(".ql-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabName = tab.getAttribute("data-tab");
      qlActiveTab = tabName;
      document.querySelectorAll(".ql-tab").forEach(t => t.classList.toggle("ql-tab-active", t.getAttribute("data-tab") === tabName));

      if (tabName === "history") {
        loadChatHistory(() => renderHistoryView());
      } else {
        renderPromptView();
      }
    });
  });
}

// =============================================
// ULID GENERATOR
// =============================================

function _qlUlid() {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let timestamp = Date.now();
  let result = "";

  for (let i = 9; i >= 0; i--) {
    result = chars[timestamp % 32] + result;
    timestamp = Math.floor(timestamp / 32);
  }
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * 32)];
  }
  return result;
}

// =============================================
// WEBSOCKET SEND
// =============================================

function sendViaWs(message, projectId) {
  return new Promise(function (resolve, reject) {
    const payload = {
      id: "umsg_" + _qlUlid(),
      message: message,
      files: [],
      selected_elements: [],
      chat_only: false,
      view: "editor",
      view_description: "",
      optimisticImageUrls: [],
      ai_message_id: "aimsg_" + _qlUlid(),
      thread_id: "main",
      current_page: window.location.pathname || "/",
      current_viewport_width: window.innerWidth || 1280,
      current_viewport_height: window.innerHeight || 800,
      current_viewport_dpr: window.devicePixelRatio || 1,
      model: null
    };

    var timeout = setTimeout(function () {
      window.removeEventListener("message", messageListener);
      reject(new Error("Timeout: WS did not respond"));
    }, 6000);

    function messageListener(event) {
      if (event.source !== window || !event.data) {
        return;
      }
      if (event.data.type !== "lovableWsSendResult") {
        return;
      }
      clearTimeout(timeout);
      window.removeEventListener("message", messageListener);

      if (event.data.success) {
        resolve();
      } else {
        reject(new Error(event.data.error || "WS send failed"));
      }
    }

    window.addEventListener("message", messageListener);
    window.postMessage({
      type: "lovableSendViaWs",
      payload: payload
    }, "*");
  });
}

// =============================================
// CHROME MESSAGE LISTENER
// =============================================

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (sender.id !== chrome.runtime.id) {
    return;
  }

  if (message.action === "qlSendViaWs") {
    sendNativeToLovable(message.message).then(function () {
      sendResponse({
        ok: true
      });
    }).catch(function (error) {
      sendResponse({
        ok: false,
        error: error.message
      });
    });
    return true;
  }

  if (message.action === "qlActivateNativeChat") {
    activateNativeChat();
    sendResponse({
      ok: true
    });
    return true;
  }

  if (message.action === "qlDeactivateNativeChat") {
    deactivateNativeChat();
    sendResponse({
      ok: true
    });
    return true;
  }

  if (message.action === "qlActivateBypass") {
    activateBypass();
    sendResponse({
      ok: true
    });
    return true;
  }

  if (message.action === "qlDeactivateBypass") {
    deactivateBypass();
    sendResponse({
      ok: true
    });
    return true;
  }

  if (message.action === "qlQuickProjectInit") {
    quickProjectInit().then(function () {
      sendResponse({
        ok: true
      });
    }).catch(function (error) {
      sendResponse({
        ok: false,
        error: error.message
      });
    });
    return true;
  }

  if (message.action === "qlRequestToken") {
    requestLatestTokenFromHook().then(function () {
      sendResponse({
        ok: true
      });
    }).catch(function () {
      sendResponse({
        ok: false
      });
    });
    return true;
  }
});

// =============================================
// QUICK PROJECT INIT
// =============================================

async function quickProjectInit() {
  if (window.location.pathname.match(/\/projects\/[a-f0-9-]{36}/i)) {
    throw new Error("Use this button on Lovable home screen, without an open project.");
  }

  // --- OLD: const form = document.querySelector("form#chat-input"); ---
  const form = document.querySelector(LOVABLE_SELECTORS.chatForm);
  if (!form) {
    throw new Error("Form not found. Make sure you are on the Lovable home screen.");
  }

  // --- OLD: const editor = form.querySelector("[contenteditable=\"true\"]"); ---
  const editor = form.querySelector(LOVABLE_SELECTORS.chatEditor) || form.querySelector(LOVABLE_SELECTORS.chatEditorAlt);
  if (!editor) {
    throw new Error("Text field not found.");
  }

  // --- Already correct: #chatinput-send-message-button ---
  const sendBtn = document.getElementById("chatinput-send-message-button");
  if (!sendBtn) {
    throw new Error("Create button not found.");
  }

  editor.focus();
  document.execCommand("selectAll", false, null);
  document.execCommand("insertText", false, ".");
  await new Promise(resolve => setTimeout(resolve, 300));

  if (sendBtn.disabled) {
    sendBtn.removeAttribute("disabled");
  }
  sendBtn.click();

  const created = await new Promise(function (resolve) {
    const timeout = 25000;
    const startTime = Date.now();
    const interval = setInterval(function () {
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        resolve(false);
        return;
      }
      const stopBtn = document.querySelector(LOVABLE_SELECTORS.stopButton);
      // --- OLD: const stopBtn = document.querySelector("button[aria-label=\"Stop generating\"]"); ---
      if (stopBtn && !stopBtn.disabled) {
        clearInterval(interval);
        stopBtn.click();
        resolve(true);
      }
    }, 200);
  });

  if (!created) {
    throw new Error("Timeout waiting for Stop. Check if a project was created in your list.");
  }
}

// =============================================
// FILE ATTACHMENT
// =============================================

const MAX_FILES = 10;
const MAX_FILE_SIZE = 20971520;
let qlAttachedFiles = [];

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }
  if (bytes < 1048576) {
    return (bytes / 1024).toFixed(1) + " KB";
  }
  return (bytes / 1048576).toFixed(1) + " MB";
}

function isImageType(mimeType) {
  return ["image/png", "image/jpeg", "image/webp"].includes(mimeType);
}

async function compressImage(file) {
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
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const quality = file.type === "image/png" ? undefined : 0.8;

      canvas.toBlob(blob => {
        if (!blob) {
          return resolve({
            file: file,
            previewUrl: null
          });
        }
        const compressed = new File([blob], file.name, {
          type: outputType
        });
        const previewUrl = URL.createObjectURL(blob);
        resolve({
          file: compressed,
          previewUrl: previewUrl
        });
      }, outputType, quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        file: file,
        previewUrl: null
      });
    };

    img.src = url;
  });
}

function getMimeType(file) {
  if (file && typeof file.type === "string" && file.type.trim()) {
    return file.type;
  }
  const name = (file && file.name ? file.name : "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";
  const mimeMap = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif"
  };
  return mimeMap[ext] || "application/octet-stream";
}

function generateFilePath(uuid, file) {
  const name = file && file.name ? String(file.name) : "";
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  const cleanExt = ext && /^[a-z0-9]{1,10}$/.test(ext) ? ext : "png";
  const timestamp = Date.now();
  return "uploads/" + timestamp + "-" + uuid + "." + cleanExt;
}

async function uploadFileDirect(file, token) {
  const uuid = crypto.randomUUID();
  const mimeType = getMimeType(file);
  const filePath = generateFilePath(uuid, file);
  // const uploadUrl = SUPABASE_URL + "/storage/v1/object/prompt-images/" + filePath 
   const uploadUrl = SUPABASE_URL + "/storage/v1/object/uploads/" + filePath;

  await new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Authorization", "Bearer " + SUPABASE_ANON_KEY);
    xhr.setRequestHeader("x-upsert", "true");

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true);
      } else {
        reject(new Error("Upload failed: " + xhr.status + " " + (xhr.responseText || "")));
      }
    };

    xhr.onerror = function () {
      reject(new Error("Network error on upload"));
    };

    xhr.send(file);
  });

  var publicUrl = SUPABASE_URL + "/storage/v1/object/public/prompt-images/" + filePath;
  return {
    file_id: filePath,
    file_name: file.name || "file",
    public_url: publicUrl
  };
}

function renderAttachPreview() {
  const preview = document.getElementById("ql-attach-preview");
  if (!preview) {
    return;
  }

  if (qlAttachedFiles.length === 0) {
    preview.style.display = "none";
    preview.innerHTML = "";
    return;
  }

  preview.style.display = "flex";
  preview.innerHTML = qlAttachedFiles.map((file, index) => {
    const thumb = file.previewUrl
      ? "<img class=\"ql-attach-thumb\" src=\"" + file.previewUrl + "\" alt=\"\">"
      : "<div class=\"ql-attach-icon\">📄</div>";
    const uploadingClass = file.uploading ? " ql-attach-uploading" : "";

    return "<div class=\"ql-attach-item" + uploadingClass + "\" data-idx=\"" + index + "\">" + thumb + "<div class=\"ql-attach-info\"><span class=\"ql-attach-name\" title=\"" + escapeHtml(file.file_name) + "\">" + escapeHtml(file.file_name) + "</span><span class=\"ql-attach-size\">" + escapeHtml(file.sizeLabel) + "</span></div><button class=\"ql-attach-remove\" data-idx=\"" + index + "\">✕</button></div>";
  }).join("");

  preview.querySelectorAll(".ql-attach-remove").forEach(btn => {
    btn.addEventListener("click", event => {
      event.stopPropagation();
      const idx = parseInt(btn.getAttribute("data-idx"));
      if (qlAttachedFiles[idx] && qlAttachedFiles[idx].previewUrl) {
        URL.revokeObjectURL(qlAttachedFiles[idx].previewUrl);
      }
      qlAttachedFiles.splice(idx, 1);
      renderAttachPreview();
    });
  });
}

function setupFileAttachment() {
  const attachBtn = document.getElementById("ql-attach-btn");
  const fileInput = document.getElementById("ql-file-input");

  if (!attachBtn || !fileInput) {
    return;
  }

  attachBtn.addEventListener("click", () => {
    if (qlAttachedFiles.length >= MAX_FILES) {
      showCustomAlert("Limit", "Maximum of " + MAX_FILES + " files.");
      return;
    }
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    const files = Array.from(fileInput.files || []);
    fileInput.value = "";

    if (!files.length) {
      return;
    }

    const settings = await new Promise(resolve => chrome.storage.local.get(["lovable_token"], resolve));
    let token = settings.lovable_token || "";

    if (!token) {
      showCustomAlert("Error", "Token not captured. Browse Lovable to sync.");
      return;
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    for (const file of files) {
      if (qlAttachedFiles.length >= MAX_FILES) {
        showCustomAlert("Limit", "Maximum of " + MAX_FILES + " files reached.");
        break;
      }

      if (file.size > MAX_FILE_SIZE) {
        showCustomAlert("File too large", file.name + " exceeds 20MB.");
        continue;
      }

      let processedFile = file;
      let previewUrl = null;

      if (isImageType(file.type)) {
        const compressed = await compressImage(file);
        processedFile = compressed.file;
        previewUrl = compressed.previewUrl;
      }

      const idx = qlAttachedFiles.length;
      qlAttachedFiles.push({
        file_id: null,
        file_name: file.name,
        previewUrl: previewUrl,
        file_type: processedFile.type,
        sizeLabel: formatFileSize(processedFile.size),
        uploading: true,
        rawFile: processedFile
      });
      renderAttachPreview();

      try {
        const result = await uploadFileDirect(processedFile, token);
        qlAttachedFiles[idx].file_id = result.file_id;
        qlAttachedFiles[idx].public_url = result.public_url;
        qlAttachedFiles[idx].uploading = false;
        renderAttachPreview();
      } catch (error) {
        console.warn("[QL Upload] Failed to upload to Supabase Storage:", error.message);
        qlAttachedFiles[idx].uploading = false;
        qlAttachedFiles[idx].uploadFailed = true;
        renderAttachPreview();
        showCustomAlert("Upload error", "Could not upload the image: " + (error.message || "unknown error"));
      }
    }
  });
}

// =============================================
// SEND TO LOVABLE
// =============================================

async function sendNativeToLovable(message) {
  // --- OLD: const form = document.querySelector("form#chat-input"); ---
  // Using verified selectors from LOVABLE_SELECTORS
  const form = document.querySelector(LOVABLE_SELECTORS.chatForm);
  if (!form) {
    throw new Error("Lovable chat not found. Open a project.");
  }

  // --- OLD: const editor = form.querySelector("[contenteditable=\"true\"]"); ---
  // Using verified selector: Lovable uses <div contenteditable>, NOT <textarea>
  const editor = form.querySelector(LOVABLE_SELECTORS.chatEditor) || form.querySelector(LOVABLE_SELECTORS.chatEditorAlt);
  if (!editor) {
    throw new Error("Chat editor not found on the page.");
  }

  // --- OLD: const sendBtn = document.getElementById("chatinput-send-message-button"); ---
  // Already correct - verified selector
  const sendBtn = document.getElementById("chatinput-send-message-button");
  if (!sendBtn) {
    throw new Error("Send button not found.");
  }

  editor.focus();
  document.execCommand("selectAll", false, null);
  document.execCommand("insertText", false, message);
  await new Promise(resolve => setTimeout(resolve, 200));

  const wasDisabled = sendBtn.disabled;
  if (wasDisabled) {
    sendBtn.removeAttribute("disabled");
  }
  sendBtn.click();
  if (wasDisabled) {
    sendBtn.setAttribute("disabled", "");
  }
}

// =============================================
// SEND BUTTON SETUP
// =============================================

function setupSend() {
  const sendBtn = document.getElementById("ql-send");
  if (!sendBtn) {
    return;
  }

  sendBtn.addEventListener("click", async () => {
    var input = document.getElementById("ql-msg");
    const message = input ? (input.value || "").trim() : "";
    const log = document.getElementById("ql-log");

    if (!message) {
      if (log) {
        log.className = "ql-log-error";
        log.innerText = "⚠ Empty prompt";
      }
      return;
    }

    const attachedFiles = qlAttachedFiles.filter(function (file) {
      return file.public_url && !file.uploading && !file.uploadFailed;
    });
    const hasAttachments = attachedFiles.length > 0;

    var finalMessage = message;
    if (hasAttachments) {
      var urls = attachedFiles.map(function (file) {
        return file.public_url;
      }).join("\n");
      var prefix = attachedFiles.length > 1 ? "Analyze the files at the links:\n" : "Analyze the file at the link: ";
      finalMessage = message + "\n\n" + prefix + urls;
    }

    try {
      if (log) {
        log.className = "ql-log-info";
        log.innerHTML = hasAttachments ? "📎 Sending with image..." : SVG_ICONS.clock + " Sending prompt...";
      }

      sendBtn.classList.add("ql-sending");
      sendBtn.disabled = true;

      //await sendNativeToLovable(finalMessage);


     // First try WebSocket bypass (no credit charge)
     /* 
try {
  const storageData = await new Promise(resolve => 
    chrome.storage.local.get(["lovable_projectId"], resolve)
  );
  const lovable_projectId = storageData.lovable_projectId || null;
  
  await sendViaWs(finalMessage, lovable_projectId);
} catch (wsError) {
  // Fallback to DOM injection if WS fails
  await sendNativeToLovable(finalMessage);
}*/

// DOM injection — reliable, message will go
await sendNativeToLovable(finalMessage);
// WebSocket bypass in background — no credit charge
try {
  const storageData = await new Promise(resolve =>
    chrome.storage.local.get(["lovable_projectId"], resolve)
  );
  const projectId = storageData.lovable_projectId || null;
  sendViaWs(finalMessage, projectId).catch(() => {});
} catch (e) {}

      if (log) {
        log.className = "ql-log-success";
        log.innerText = hasAttachments ? "✓ Prompt sent! with image" : "✓ Prompt sent!";
      }

      try {
        if (typeof QLSounds !== "undefined") {
          QLSounds.promptSent();
        }
      } catch (error) {}

      addToChatHistory(message, "ok");

      var msgInput = document.getElementById("ql-msg");
      if (msgInput) {
        msgInput.value = "";
      }

      qlAttachedFiles.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
      qlAttachedFiles = [];
      renderAttachPreview();
    } catch (error) {
      if (log) {
        log.className = "ql-log-error";
        log.innerText = "✗ " + (error.message || error);
      }
      addToChatHistory(message, "error");
    } finally {
      sendBtn.classList.remove("ql-sending");
      sendBtn.disabled = false;
    }
  });
}

// =============================================
// DRAG SETUP
// =============================================

let _dragCleanup = null;
let _resizeCleanup = null;

function setupDrag() {
  if (_dragCleanup) {
    _dragCleanup();
    _dragCleanup = null;
  }

  const container = document.getElementById("ql-floating");
  const header = document.getElementById("ql-header");
  if (!container || !header) {
    return;
  }

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  function handlePointerDown(event) {
    var target = event.target;
    while (target && target !== header) {
      var tag = target.nodeName;
      if (tag === "BUTTON" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "A") {
        return;
      }
      target = target.parentElement;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const rect = container.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    isDragging = true;

    try {
      header.setPointerCapture(event.pointerId);
    } catch (error) {}

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  }

  function handlePointerMove(event) {
    if (!isDragging) {
      return;
    }
    document.body.style.userSelect = "none";

    let newLeft = startLeft + (event.clientX - startX);
    let newTop = startTop + (event.clientY - startY);

    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - container.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - container.offsetHeight));

    container.style.left = newLeft + "px";
    container.style.top = newTop + "px";
  }

  function handlePointerUp(event) {
    if (!isDragging) {
      return;
    }
    isDragging = false;
    document.body.style.userSelect = "";

    try {
      header.releasePointerCapture(event.pointerId);
    } catch (error) {}

    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.body.style.userSelect = "";
  }

  header.addEventListener("pointerdown", handlePointerDown, {
    passive: false
  });

  _dragCleanup = function () {
    header.removeEventListener("pointerdown", handlePointerDown);
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };
}

// =============================================
// RESIZE SETUP
// =============================================

function setupResize() {
  if (_resizeCleanup) {
    _resizeCleanup();
    _resizeCleanup = null;
  }

  const container = document.getElementById("ql-floating");
  const resizeHandle = document.getElementById("ql-resize-handle");
  if (!container || !resizeHandle) {
    return;
  }

  let isResizing = false;
  let startClientY = 0;
  let startHeight = 0;

  function handlePointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    isResizing = true;
    startClientY = event.clientY;
    startHeight = container.offsetHeight;

    try {
      resizeHandle.setPointerCapture(event.pointerId);
    } catch (error) {}

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.body.style.userSelect = "none";
  }

  function handlePointerMove(event) {
    if (!isResizing) {
      return;
    }

    let newHeight = startHeight + (event.clientY - startClientY);
    newHeight = Math.max(200, Math.min(newHeight, window.innerHeight * 0.8));
    container.style.height = newHeight + "px";
  }

  function handlePointerUp(event) {
    if (!isResizing) {
      return;
    }
    isResizing = false;
    qlHeight = container.offsetHeight;

    try {
  chrome.storage.local.set({
    ql_height: qlHeight
  });
} catch (e) { console.warn('[QL] Context invalidated'); }

    try {
      resizeHandle.releasePointerCapture(event.pointerId);
    } catch (error) {}

    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.body.style.userSelect = "";
  }

  resizeHandle.addEventListener("pointerdown", handlePointerDown, {
    passive: false
  });

  _resizeCleanup = function () {
    resizeHandle.removeEventListener("pointerdown", handlePointerDown);
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };
}

// =============================================
// CLIPBOARD PASTE & DRAG DROP
// =============================================

function setupClipboardPaste() {
  var input = document.getElementById("ql-msg");
  if (!input) {
    return;
  }

  var container = document.getElementById("ql-floating") || input;
  var dragOverlay = null;

  function showDragOverlay() {
    if (dragOverlay) {
      return;
    }
    dragOverlay = document.createElement("div");
    dragOverlay.className = "ql-drag-overlay";
    dragOverlay.innerHTML = "<div class=\"ql-drag-overlay-inner\">📂 Drop files here</div>";

    var floating = document.getElementById("ql-floating");
    if (floating) {
      floating.appendChild(dragOverlay);
    }
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
    if (!container.contains(event.relatedTarget)) {
      hideDragOverlay();
    }
  });

  container.addEventListener("drop", async function (event) {
    event.preventDefault();
    event.stopPropagation();
    hideDragOverlay();

    var files = Array.from(event.dataTransfer.files || []);
    if (!files.length) {
      return;
    }
    await handleFilesAttach(files);
  });

  input.addEventListener("paste", async function (event) {
    var items = event.clipboardData && event.clipboardData.items;
    if (!items) {
      return;
    }

    var files = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.kind === "file") {
        event.preventDefault();
        var file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      await handleFilesAttach(files);
    }
  });
}

async function handleFilesAttach(files) {
  if (qlAttachedFiles.length >= MAX_FILES) {
    showCustomAlert("Limit", "Maximum " + MAX_FILES + " files.");
    return;
  }

  var settings = await new Promise(function (resolve) {
    chrome.storage.local.get(["lovable_token"], resolve);
  });
  var token = settings.lovable_token || "";

  if (!token) {
    showCustomAlert("Error", "Token not captured.");
    return;
  }

  if (token.indexOf("Bearer ") === 0) {
    token = token.slice(7);
  }

  for (var i = 0; i < files.length; i++) {
    var file = files[i];

    if (qlAttachedFiles.length >= MAX_FILES) {
      break;
    }
    if (file.size > MAX_FILE_SIZE) {
      showCustomAlert("Too large", file.name + " exceeds 20MB.");
      continue;
    }

    var processedFile = file;
    var previewUrl = null;

    if (isImageType(file.type)) {
      var compressed = await compressImage(file);
      processedFile = compressed.file;
      previewUrl = compressed.previewUrl;
    }

    var idx = qlAttachedFiles.length;
    qlAttachedFiles.push({
      file_id: null,
      file_name: file.name || "file_" + Date.now(),
      previewUrl: previewUrl,
      file_type: processedFile.type,
      sizeLabel: formatFileSize(processedFile.size),
      uploading: true,
      rawFile: processedFile
    });
    renderAttachPreview();

    try {
      var result = await uploadFileDirect(processedFile, token);
      qlAttachedFiles[idx].file_id = result.file_id;
      qlAttachedFiles[idx].uploading = false;
      renderAttachPreview();
    } catch (error) {
      qlAttachedFiles[idx].uploading = false;
      qlAttachedFiles[idx].file_id = "local_direct_" + crypto.randomUUID();
      qlAttachedFiles[idx].uploadFailed = true;
      renderAttachPreview();
    }
  }

  showCustomAlert("Attached 📎", files.length + " file(s) added!");
}

// =============================================
// UPDATE & VERSION CHECK
// =============================================

const VERSIONS_URL_POPUP = SUPABASE_URL + "/rest/v1/extension_versions?select=version,changelog,file_path,is_alert_active&order=created_at.desc&limit=1&is_alert_active=eq.true";
const USER_ROLES_URL_POPUP = SUPABASE_URL + "/rest/v1/user_roles?select=role";

function setupDownloadProject() {
  var btn = document.getElementById("ql-download-project");
  if (!btn) {
    return;
  }

  btn.addEventListener("click", async function () {
    var statusEl = document.getElementById("ql-download-status");
    btn.disabled = true;
    btn.textContent = "Preparing...";

    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.className = "ql-log-info";
      statusEl.textContent = "Checking token and project...";
    }

    try {
      // Feature flag check
      try {
        var flagUrl = SUPABASE_URL + "/rest/v1/feature_flags?select=enabled&flag_key=eq.download_files";
        var flagData = await bgFetch(flagUrl, {
          method: "GET",
          headers: {
            apikey: SUPABASE_ANON_KEY
          }
        });
        if (flagData && flagData.length > 0 && flagData[0].enabled === false) {
          throw new Error("Error using extension features.");
        }
      } catch (error) {
        if (error && error.message === "Error using extension features.") {
          throw error;
        }
      }

      var settings = await new Promise(function (resolve) {
        chrome.storage.local.get(["lovable_token", "lovable_projectId"], resolve);
      });
      var token = settings.lovable_token || "";
      var projectId = settings.lovable_projectId || "";

      if (token.indexOf("Bearer ") === 0) {
        token = token.slice(7);
      }

      if (!projectId) {
        throw new Error("Open a Lovable project page first.");
      }

      if (!token) {
        var cookieResult = await new Promise(function (resolve) {
          chrome.runtime.sendMessage({
            action: "readCookies"
          }, function (response) {
            resolve(response);
          });
        });

        if (cookieResult && cookieResult.success && cookieResult.tokens && cookieResult.tokens.length > 0) {
          token = cookieResult.tokens[0].token;
        }
      }

      if (!token) {
        throw new Error("Token not found. Open a project on Lovable and wait for sync.");
      }

      btn.textContent = "Downloading...";
      if (statusEl) {
        statusEl.textContent = "Downloading project files...";
      }

      var downloadResult = await new Promise(function (resolve) {
        chrome.runtime.sendMessage({
          action: "downloadProject",
          projectId: projectId,
          token: token
        }, function (response) {
          resolve(response);
        });
      });

      if (!downloadResult || !downloadResult.success) {
        throw new Error(downloadResult && downloadResult.error ? downloadResult.error : "Download failed");
      }

      var files = downloadResult.files;
      if (!files || files.length === 0) {
        throw new Error("No files found in the project.");
      }

      if (statusEl) {
        statusEl.textContent = "Creating ZIP with " + files.length + " files...";
      }

      btn.textContent = "Packaging...";

      if (typeof JSZip === "undefined") {
        throw new Error("JSZip not loaded. Use the Side Panel.");
      }

      var zip = new JSZip();
      var imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp", ".tiff"];
      var fileCount = 0;

      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.name || file.sizeExceeded) {
          continue;
        }

        if (file.contents && file.binary) {
          zip.file(file.name, file.contents, {
            base64: true,
            binary: true
          });
          fileCount++;
        } else if (!file.contents && imageExtensions.some(function (ext) {
          return file.name.toLowerCase().endsWith(ext);
        })) {
          // --- OLD ENDPOINT: /files/raw?path= (might be deprecated) ---
          // var rawResponse = await fetch("https://api.lovable.dev/projects/" + projectId + "/files/raw?path=" + encodeURIComponent(file.name), {
          //   method: "GET", headers: { Authorization: "Bearer " + token }, credentials: "omit", mode: "cors"
          // });
          // --- NEW VERIFIED ENDPOINT: /git/file?path=&ref= ---
          try {
            var rawResponse = await fetch("https://api.lovable.dev/projects/" + projectId + "/git/file?path=" + encodeURIComponent(file.name) + "&ref=main", {
              method: "GET",
              headers: {
                Authorization: "Bearer " + token,
                "Accept": "application/json"
              },
              credentials: "include",
              mode: "cors"
            });

            if (rawResponse.ok) {
              zip.file(file.name, await rawResponse.arrayBuffer(), {
                binary: true
              });
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

      var blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "lovable-" + projectId.substring(0, 8) + "-" + new Date().toISOString().split("T")[0] + ".zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      if (statusEl) {
        statusEl.className = "ql-log-success";
        statusEl.textContent = fileCount + " files downloaded!";
      }

      btn.textContent = "Download Complete!";
      setTimeout(function () {
        btn.textContent = "Download Source Code";
        btn.disabled = false;
        if (statusEl) {
          statusEl.style.display = "none";
        }
      }, 4000);
    } catch (error) {
      if (statusEl) {
        statusEl.className = "ql-log-error";
        statusEl.textContent = error.message || error;
        statusEl.style.display = "block";
      }

      btn.textContent = "Failed";
      setTimeout(function () {
        btn.textContent = "Download Source Code";
        btn.disabled = false;
      }, 3000);
    }
  });
}

async function checkForUpdatePopup() {
  try {
    var data = await bgFetch(VERSIONS_URL_POPUP, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY
      }
    });

    if (!data || !data.length) {
      return;
    }

    var latest = data[0];
    if (latest.version !== CURRENT_EXT_VERSION && latest.is_alert_active) {
      var banner = document.getElementById("ql-update-banner");
      if (banner) {
        var downloadUrl = latest.file_path ? SUPABASE_URL + "/storage/v1/object/public/extension-releases/" + latest.file_path : null;

        banner.innerHTML = "<div style=\"padding:10px 12px;background:linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.08));border:1px solid rgba(251,191,36,0.3);border-radius:10px;margin:8px 0\"><div style=\"display:flex;align-items:center;gap:6px;margin-bottom:4px\"><span style=\"font-size:14px\">&#128276;</span><strong style=\"font-size:11px;color:#f59e0b\">New update v" + escapeHtml(latest.version) + "!</strong></div><p style=\"font-size:10px;color:#a1a1aa;margin:0 0 6px;white-space:pre-line\">" + escapeHtml(latest.changelog || "") + "</p>" + (downloadUrl ? "<a href=\"" + escapeHtml(downloadUrl) + "\" target=\"_blank\" style=\"display:inline-block;padding:4px 12px;background:#f59e0b;color:#000;border-radius:6px;text-decoration:none;font-size:10px;font-weight:700\">Download v" + escapeHtml(latest.version) + "</a>" : "") + "</div>";
        banner.style.display = "block";
      }
    }
  } catch (error) {}
}

async function checkResellerRolePopup() {
  try {
    var settings = await new Promise(function (resolve) {
      chrome.storage.local.get(["ql_license_id"], resolve);
    });

    if (!settings.ql_license_id) {
      return;
    }

    var roles = await bgFetch(SUPABASE_URL + "/rest/v1/user_roles?select=role&license_id=eq." + encodeURIComponent(settings.ql_license_id), {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY
      }
    });

    if (roles && Array.isArray(roles) && roles.some(function (role) {
      return role.role === "reseller" || role.role === "admin";
    })) {
      var resellerBtn = document.getElementById("ql-reseller-btn");
      if (resellerBtn) {
        resellerBtn.style.display = "block";
      }
    }
  } catch (error) {}
}

// =============================================
// NATIVE CHAT MODE
// =============================================

let qlNativeChatActive = false;
let qlNativeChatCleanup = null;

function activateNativeChat() {
  qlNativeChatActive = true;
 try {
  chrome.storage.local.set({
    ql_native_chat: true
  });
} catch (e) { console.warn('[QL] Context invalidated'); }

  const container = document.getElementById("ql-floating");
  if (container) {
    container.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    container.style.opacity = "0";
    container.style.transform = "scale(0.95) translateX(20px)";
    setTimeout(() => {
      container.style.display = "none";
    }, 350);
  }

  injectNativeChatOverlay();
}

function deactivateNativeChat() {
  qlNativeChatActive = false;
try {
  chrome.storage.local.set({
    ql_native_chat: false
  });
} catch (e) { console.warn('[QL] Context invalidated'); }

  if (qlNativeChatCleanup) {
    qlNativeChatCleanup();
    qlNativeChatCleanup = null;
  }

  const badge = document.getElementById("ql-native-badge");
  if (badge) {
    badge.remove();
  }

  const returnBtn = document.getElementById("ql-native-return-btn");
  if (returnBtn) {
    returnBtn.remove();
  }

  const sendBtn = document.getElementById("chatinput-send-message-button");
  if (sendBtn) {
    sendBtn.classList.remove("ql-native-send-active");
    sendBtn.style.animation = "";
  }

  const container = document.getElementById("ql-floating");
  if (container) {
    container.style.display = "";
    container.style.opacity = "0";
    container.style.transform = "scale(0.95)";
    requestAnimationFrame(() => {
      container.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      container.style.opacity = "1";
      container.style.transform = "scale(1) translateX(0)";
    });
  } else {
    _buildFloatingUI();
  }
}

function injectNativeChatOverlay() {
  // --- OLD: const form = document.querySelector("form#chat-input"); ---
  const form = document.querySelector(LOVABLE_SELECTORS.chatForm);
  if (!form) {
    setTimeout(injectNativeChatOverlay, 500);
    return;
  }

  if (!document.getElementById("ql-native-badge")) {
    const position = getComputedStyle(form).position;
    if (position === "static") {
      form.style.position = "relative";
    }

    const badge = document.createElement("div");
    badge.id = "ql-native-badge";
    badge.className = "ql-native-badge";
    badge.innerHTML = "⚡ <span>" + EXTENSION_NAME + " Extension</span>";
    form.appendChild(badge);
  }

  if (!document.getElementById("ql-native-return-btn")) {
    const returnBtn = document.createElement("button");
    returnBtn.id = "ql-native-return-btn";
    returnBtn.className = "ql-native-return-btn";
    returnBtn.innerHTML = "← Back to Extension";
    returnBtn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      deactivateNativeChat();
    });
    form.parentElement.insertBefore(returnBtn, form.nextSibling);
  }

  const sendBtn = document.getElementById("chatinput-send-message-button");
  if (sendBtn) {
    sendBtn.classList.add("ql-native-send-active");
  }

  function handleClickCapture() {
    if (!qlNativeChatActive) {
      return;
    }
    // --- OLD: const editor = form.querySelector("[contenteditable=\"true\"]"); ---
    const editor = form.querySelector(LOVABLE_SELECTORS.chatEditor) || form.querySelector(LOVABLE_SELECTORS.chatEditorAlt);
    const text = editor ? (editor.innerText || editor.textContent || "").trim() : "";
    if (text) {
      addToChatHistory(text, "ok");
    }
  }

  function handleSubmitCapture() {
    if (!qlNativeChatActive) {
      return;
    }
    // --- OLD: const editor = form.querySelector("[contenteditable=\"true\"]"); ---
    const editor = form.querySelector(LOVABLE_SELECTORS.chatEditor) || form.querySelector(LOVABLE_SELECTORS.chatEditorAlt);
    const text = editor ? (editor.innerText || editor.textContent || "").trim() : "";
    if (text) {
      addToChatHistory(text, "ok");
    }
  }

  function handleKeydownCapture(event) {
    if (!qlNativeChatActive) {
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      // --- OLD: const editor = form.querySelector("[contenteditable=\"true\"]"); ---
      const editor = form.querySelector(LOVABLE_SELECTORS.chatEditor) || form.querySelector(LOVABLE_SELECTORS.chatEditorAlt);
      const text = editor ? (editor.innerText || editor.textContent || "").trim() : "";
      if (text) {
        addToChatHistory(text, "ok");
      }
    }
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", handleClickCapture, true);
  }
  form.addEventListener("submit", handleSubmitCapture, true);
  form.addEventListener("keydown", handleKeydownCapture, true);

  qlNativeChatCleanup = function () {
    if (sendBtn) {
      sendBtn.removeEventListener("click", handleClickCapture, true);
    }
    form.removeEventListener("submit", handleSubmitCapture, true);
    form.removeEventListener("keydown", handleKeydownCapture, true);
  };
}

async function sendViaNativeChat(message, projectId) {
  addToChatHistory(message, "ok");
}

function showNativeSendingOverlay(show) {
  const overlayId = "ql-native-sending-overlay";
  const existing = document.getElementById(overlayId);

  if (!show) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  if (existing) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = overlayId;
  overlay.className = "ql-native-sending-overlay";
  overlay.innerHTML = "<div class=\"ql-spinner\"></div> Sending prompt...";
  document.body.appendChild(overlay);
}

function showNativeChatToast(message, type) {
  const existing = document.getElementById("ql-native-toast");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.id = "ql-native-toast";
  toast.className = "ql-native-toast ql-native-toast-" + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("ql-native-toast-visible"));
  setTimeout(() => {
    toast.classList.remove("ql-native-toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setupNativeChatButton() {
  const btn = document.getElementById("ql-native-chat-btn");
  if (!btn) {
    return;
  }

  btn.addEventListener("click", () => {
    activateNativeChat();
  });
}

chrome.storage.local.get(["ql_native_chat"], settings => {
  if (settings.ql_native_chat === true) {
    qlNativeChatActive = true;
    setTimeout(() => {
      const container = document.getElementById("ql-floating");
      if (container) {
        container.style.display = "none";
      }
      injectNativeChatOverlay();
    }, 500);
  }
});

// =============================================
// TOKEN FROM LOVABLE
// =============================================

window.addEventListener("message", event => {
  if (!event.data || event.data.type !== "lovableTokenFound") {
    return;
  }
  if (event.origin !== "https://lovable.dev") {
    return;
  }

  const updates = {};

  if (event.data.token && typeof event.data.token === "string") {
    updates.lovable_token = event.data.token.replace(/^Bearer\s+/i, "").trim();
  }
  if (event.data.projectId && typeof event.data.projectId === "string") {
    updates.lovable_projectId = event.data.projectId;
  }

  if (!Object.keys(updates).length) {
    return;
  }

  try {
  chrome.storage.local.set(updates, () => {
    updateSyncStatus();
    setTimeout(updateSyncStatus, 200);
    setTimeout(updateSyncStatus, 800);
  });
} catch (e) { console.warn('[QL] Context invalidated'); }
});

// =============================================
// BRANDING REPLACEMENT
// =============================================

(() => {
  const supportLink = WHATSAPP_SUPPORT_LINK;
  const replacements = [
    [/Developed by Gringow Store/g, "Developed by " + EXTENSION_NAME],
    [/Por:\s*@dynhosilvaoficial/g, "Developed by " + EXTENSION_NAME],
    [/Lovable Hut BD Extension/g, EXTENSION_NAME + " Extension"],
    [/Lovable Hut BD Extension/g, EXTENSION_NAME + " Extension"]
  ];

  let replaced = false;

  function replaceText() {
    replaced = false;
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let node;
      while (node = walker.nextNode()) {
        nodes.push(node);
      }

      for (const textNode of nodes) {
        let value = textNode.nodeValue;
        for (const [pattern, replacement] of replacements) {
          value = value.replace(pattern, replacement);
        }
        if (value !== textNode.nodeValue) {
          textNode.nodeValue = value;
        }
      }

      for (const link of document.querySelectorAll("a")) {
        const text = (link.textContent || "").toLowerCase();
        const href = (link.getAttribute("href") || "").toLowerCase();
        if (text.includes("support") || text.includes("WHTSAPP") || text.includes("license") || href.includes("WHTSAPP") || href.includes("support")) {
          link.setAttribute("href", supportLink);
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }
      }
    } catch (error) {}
  }

  function scheduleReplace() {
    if (!replaced) {
      replaced = true;
      setTimeout(replaceText, 50);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleReplace, {
      once: true
    });
  } else {
    scheduleReplace();
  }

  try {
    new MutationObserver(scheduleReplace).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  } catch (error) {}
})();

// =============================================
// FOOTER BRANDING
// =============================================

(() => {
  const brandName = "Developed by " + EXTENSION_NAME;
  const supportLink = WHATSAPP_SUPPORT_LINK;
  const patterns = [
    /Developed\s+by\s+Infinity\s+Lovable/gi,
    /Developed\s+by\s+Lovable\s+Infinity/gi,
    /Infinity\s+Lovable/gi,
    /Lovable\s+Infinity/gi,
    /Por:\s*@dynhosilvaoficial/gi,
    /@dynhosilvaoficial/gi
  ];

  function replaceBranding() {
    try {
      const selectors = ["#ql-footer .ql-badge-mz", ".ql-badge-mz", ".ql-footer .ql-badge-mz", ".sp-footer-badge", "#sp-footer-badge"];
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach(el => {
          el.textContent = el.classList && el.classList.contains("sp-footer-badge") ? brandName + " • v" + EXTENSION_VERSION : brandName;
        });
      }

      const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        let value = node.nodeValue;
        for (const pattern of patterns) {
          value = value.replace(pattern, brandName);
        }
        if (value !== node.nodeValue) {
          node.nodeValue = value;
        }
      }

      document.querySelectorAll("[data-i18n=\"footer.brand\"]").forEach(el => {
        el.removeAttribute("data-i18n");
        el.textContent = brandName;
      });

      document.querySelectorAll("a").forEach(link => {
        const text = (link.textContent || "").toLowerCase();
        const href = (link.getAttribute("href") || "").toLowerCase();
        if (text.includes("support") || text.includes("WHTSAPP") || text.includes("license") || href.includes("WHTSAPP") || href.includes("support")) {
          link.href = supportLink;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
      });
    } catch (error) {}
  }

  const runReplacements = () => {
    replaceBranding();
    setTimeout(replaceBranding, 100);
    setTimeout(replaceBranding, 500);
    setTimeout(replaceBranding, 1500);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runReplacements, {
      once: true
    });
  } else {
    runReplacements();
  }

  try {
    new MutationObserver(() => {
      clearTimeout(window.__gringowFooterTimer);
      window.__gringowFooterTimer = setTimeout(replaceBranding, 30);
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  } catch (error) {}
})();
