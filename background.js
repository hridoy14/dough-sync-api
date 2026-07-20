// 🤖 Dough SYNC v5.0.0 - Background Service Worker (Complete)

const CONFIG = {
  SUPABASE_URL:  "https://bcrzdgkyydfutrbcbbrt.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcnpkZ2t5eWRmdXRyYmNiYnJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU3MjQ0NywiZXhwIjoyMDk4MTQ4NDQ3fQ.i5TMH90-qKETrhDRG_AYSLICWSQIq4QgSh2ymH-IOPA",
  LICENSE_API: 'https://bcrzdgkyydfutrbcbbrt.supabase.co/functions/v1/validate-license',
  SESSION_START_URL: 'https://bcrzdgkyydfutrbcbbrt.supabase.co/functions/v1/session-start',
  HEARTBEAT_URL: 'https://bcrzdgkyydfutrbcbbrt.supabase.co/functions/v1/heartbeat',
  WHATSAPP: 'wa.me/8801759176229',
  VERSION: '5.0.0'
};

let licenseData = null;

// ==================== ON STARTUP ====================
chrome.runtime.onStartup.addListener(async () => {
  try {
    const data = await chrome.storage.local.get(["ql_license_key", "device_id", "ql_session_id"]);
    if (!data.ql_license_key || !data.device_id) return;

    await fetch(CONFIG.SESSION_START_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: data.ql_license_key,
        device_id: data.device_id
      })
    });
  } catch (err) {
    console.error("[Background] Session start failed:", err);
  }
});

// ==================== HEARTBEAT ====================
setInterval(async () => {
  try {
    const data = await chrome.storage.local.get(["ql_license_key", "device_id", "ql_session_id"]);
    if (!data.ql_license_key || !data.device_id) return;

    await fetch(CONFIG.HEARTBEAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        license_key: data.ql_license_key,
        device_id: data.device_id,
        session_token: data.ql_session_id
      })
    });
  } catch (err) {
    console.warn("[Background] Heartbeat failed:", err.message || err);
  }
}, 60000);
/* 
// ==================== SIDEBAR MODE (OLD - DISABLED)  ====================
chrome.storage.local.get(["ql_sidebar_mode"], (result) => {
  const mode = result.ql_sidebar_mode || false;
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: mode }).catch(() => {});
}); 
*/

// ====================  SIDEBAR MODE (FIXED)  ====================
chrome.storage.local.get(["ql_sidebar_mode"], (result) => {
  const mode = result.ql_sidebar_mode || false;
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: mode }).catch(() => {});
  }
});
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.ql_sidebar_mode) {
    const mode = changes.ql_sidebar_mode.newValue || false;
    //chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: mode }).catch(() => {});
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) { chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: mode }).catch(() => {}); }
  }
});

// ==================== MESSAGE LISTENER ====================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // lovableSync
  if (msg.action === "lovableSync") {
    const saveData = {};
    if (msg.token) saveData.lovable_token = msg.token;
    if (msg.projectId) saveData.lovable_projectId = msg.projectId;
    if (Object.keys(saveData).length > 0) {
      chrome.storage.local.set(saveData);
    }
    return false;
  }

  // activateSidebar
  if (msg.action === "activateSidebar") {
    chrome.storage.local.set({ ql_sidebar_mode: true });
   // chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
   if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) { chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {}); }
    if (sender.tab && sender.tab.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id })
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: true, deferred: true, message: err.message }));
    } else {
      sendResponse({ ok: true, deferred: true });
    }
    return true;
  }

  // deactivateSidebar
  if (msg.action === "deactivateSidebar") {
    chrome.storage.local.set({ ql_sidebar_mode: false });
    //chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
    //if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) { chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {}); }
   if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) { chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {}); }
    sendResponse({ ok: true });
    return false;
  }

  // openSidePanel
  if (msg.action === "openSidePanel") {
    if (sender.tab && sender.tab.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id })
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: false, error: err.message }));
    } else {
      sendResponse({ ok: false, error: "No tab context" });
    }
    return true;
  }

  // proxyFetch
  if (msg.action === "proxyFetch") {
    (async () => {
      try {
        const fetchOpts = {
          method: msg.method || "POST",
          headers: msg.headers || {}
        };
        // Only include body if it exists and is not null
        if (msg.body) {
          fetchOpts.body = msg.body;
        }
        const res = await fetch(msg.url, fetchOpts);
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        sendResponse({ ok: res.ok, status: res.status, data });
      } catch (err) {
        sendResponse({ ok: false, status: 0, data: { error: err.message } });
      }
    })();
    return true;
  }



  /*
  if (msg.action === "proxyFetch") {
    (async () => {
      try {
        const res = await fetch(msg.url, {
          method: msg.method || "POST",
          headers: msg.headers || {},
          body: msg.body || null
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        sendResponse({ ok: res.ok, status: res.status, data });
      } catch (err) {
        sendResponse({ ok: false, status: 0, data: { error: err.message } });
      }
    })();
    return true;
  }
*/
  // readCookies
  if (msg.action === "readCookies") {
    readLovableCookies(sendResponse);
    return true;
  }

  // getLovableCookies
  if (msg.action === "getLovableCookies") {
    getAllLovableCookies(sendResponse);
    return true;
  }

  // downloadProject
  if (msg.action === "downloadProject") {
    handleDownloadProject(msg, sendResponse);
    return true;
  }

  // saveProjectEmail
  if (msg.action === "saveProjectEmail") {
    chrome.storage.local.set({ project_email: msg.email });
    sendResponse({ success: true });
    return true;
  }

  return false;
});

// ==================== HELPER FUNCTIONS ====================

function readLovableCookies(sendResponse) {
  const cookieNames = [
    "lovable-session-id.id",
    "lovable-session-id.custom",
    "lovable-session-id.refresh",
    "lovable-session-id.sig",
    //new add
    "lovable-session-id-v2",
    "lovable-auth",
    "lovable-session-id.refresh",
    "lovable-session-id.sig"
  ];
  let tokens = [];
  let completed = 0;

  cookieNames.forEach(name => {
    chrome.cookies.get({ url: "https://lovable.dev", name }, cookie => {
      completed++;
      if (cookie && cookie.value && cookie.value.startsWith("eyJ")) {
        tokens.push({ token: cookie.value, cookieName: name, httpOnly: cookie.httpOnly });
      }
      if (completed === cookieNames.length) {
        sendResponse({ success: tokens.length > 0, tokens });
      }
    });
  });
}

function getAllLovableCookies(sendResponse) {
  chrome.cookies.getAll({ domain: "lovable.dev" }, cookies => {
    let result = [];
    if (cookies && cookies.length) {
      cookies.forEach(c => {
        if (c.name && c.value) result.push(`${c.name}=${c.value}`);
      });
    }
    sendResponse({ success: true, cookie: result.join("; ") });
  });
}

// https://lovable-api.com/projects/${msg.projectId}/source-code
async function handleDownloadProject(msg, sendResponse) {
  try {
    const url = `https://api.lovable.dev/projects/${msg.projectId}/git/files?ref=main`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${msg.token}`,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      sendResponse({ success: false, error: `API returned ${res.status}` });
      return;
    }

    const data = await res.json();
    sendResponse({ success: true, files: data.files || [] });
  } catch (err) {
    sendResponse({ success: false, error: err.message || "Download failed" });
  }
}

console.log("[Background] Dough SYNC v5.0.0 - Background ready!");