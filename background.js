console.log("[Background] LovaPilot service worker started");
function decodeJwtExpMs(token) {
  try {
    var parts = String(token || "")
      .replace(/^Bearer\s+/i, "")
      .trim()
      .split(".");
    if (parts.length < 2) return 0;
    var b64url = parts[1].replace(/-/g, "+").replace(/_/g, "/"),
      b64 = b64url + "=".repeat((4 - (b64url.length % 4)) % 4),
      payload = JSON.parse(atob(b64));
    return payload.exp ? payload.exp * 1000 : 0;
  } catch (err) {
    return 0;
  }
}
function normalizeJwtToken(token) {
  return String(token || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}
function pickBestJwtToken(tokens) {
  (best = ""), (bestExp = 0);
  return (
    (tokens || []).forEach(function (tok) {
      clean = normalizeJwtToken(tok);
      if (!clean || clean.indexOf("eyJ") !== 0 || clean.split(".").length !== 3)
        return;
      var exp = decodeJwtExpMs(clean);
      (!best || exp > bestExp) && ((best = clean), (bestExp = exp));
    }),
    best
  );
}
function extractJwtTokensFromCookies(cookies) {
  tokens = [];
  return (
    (cookies || []).forEach(function (cookie) {
      if (!cookie || !cookie.value) return;
      var val = String(cookie.value).replace(/^"|"$/g, "");
      val.indexOf("eyJ") === 0 &&
        val.split(".").length === 3 &&
        tokens.push(val);
    }),
    tokens
  );
}
function projectIdFromUrl(url) {
  var m = String(url || "").match(/\/projects\/([0-9a-fA-F-]{36})/);
  return m ? m[1] : "";
}
var LOVABLE_TAB_URLS = ["*://lovable.dev/*", "*://*.lovable.dev/*"];
function findLovableProjectTab(callback) {
  chrome.storage.local.get(["lovable_projectId"], function (stored) {
    savedProjectId = stored.lovable_projectId || "";
    chrome.windows.getCurrent(function (win) {
      queryOpts = {};
      (queryOpts.url = LOVABLE_TAB_URLS),
        chrome.tabs.query(queryOpts, function (tabs) {
          (lovableTabs = tabs || []),
            (activeTab = null),
            (matchTab = null),
            (anyProjTab = null),
            (firstTab = null);
          lovableTabs.forEach(function (tab) {
            if (!tab || !tab.url || tab.url.indexOf("lovable.dev") === -1)
              return;
            if (!firstTab) firstTab = tab;
            var projId = projectIdFromUrl(tab.url);
            if (!projId) return;
            if (!anyProjTab) anyProjTab = tab;
            if (savedProjectId && projId === savedProjectId) matchTab = tab;
            if (win && tab.windowId === win.id && tab.active) activeTab = tab;
          }),
            callback(activeTab || matchTab || anyProjTab || firstTab || null);
        });
    });
  });
}
function tabPing(tabId) {
  return new Promise(function (resolve) {
    pingMsg = {};
    (pingMsg.action = "ping"),
      chrome.tabs.sendMessage(tabId, pingMsg, function (resp) {
        if (chrome.runtime.lastError) return resolve(false);
        resolve(!!(resp && resp.ok));
      });
  });
}
var BRIDGE_INJECT_FILES = [
  "extension-config.js",
  "hwFingerprint.js",
  "license-guard.js",
  "user-messages.js",
  "content-bridge.js",
];
function injectContentBridge(tabId) {
  target = {};
  target.tabId = tabId;
  var details = {};
  return (
    (details.target = target),
    (details.files = BRIDGE_INJECT_FILES),
    chrome.scripting.executeScript(details)
  );
}
function sendPromptOnTab(tabId, message, files) {
  return new Promise(function (resolve, reject) {
    chrome.tabs.sendMessage(
      tabId,
      { action: "qlSendViaWs", message: message, files: files },
      function (resp) {
        if (chrome.runtime.lastError)
          return reject(new Error(chrome.runtime.lastError.message));
        if (resp && resp.ok) return resolve(resp);
        reject(new Error((resp && resp.error) || "Send failed"));
      }
    );
  });
}
async function deliverPromptViaTab(prompt, files) {
  tab = await new Promise(function (resolve) {
    findLovableProjectTab(resolve);
  });
  if (!tab || !tab.id)
    throw new Error(
      "Open your Lovable project on lovable.dev (project URL), then try again."
    );
  if (!projectIdFromUrl(tab.url) && tab.url.indexOf("lovable.dev") === -1)
    throw new Error(
      "Open a lovable.dev project tab and refresh it after updating the extension."
    );
  var tabId = tab.id,
    alive = await tabPing(tabId);
  if (!alive)
    try {
      await injectContentBridge(tabId),
        await new Promise(function (resolveWait) {
          setTimeout(resolveWait, 150);
        });
    } catch (err) {
      throw new Error(
        "Could not attach to the Lovable tab. Refresh the project page and try again."
      );
    }
  try {
    return await sendPromptOnTab(tabId, prompt, files);
  } catch (err) {
    var msg = (err && err.message) || "";
    if (
      msg.indexOf("Receiving end") === -1 &&
      msg.indexOf("Could not establish connection") === -1
    )
      throw err;
    return (
      await injectContentBridge(tabId),
      await new Promise(function (resolveWait) {
        setTimeout(resolveWait, 200);
      }),
      await sendPromptOnTab(tabId, prompt, files)
    );
  }
}
function collectLovableCookies(callback) {
  (domains = ["lovable.dev", ".lovable.dev"]),
    (allCookies = []),
    (pending = domains.length);
  if (!pending) return callback(allCookies);
  domains.forEach(function (domain) {
    opts = {};
    (opts.domain = domain),
      chrome.cookies.getAll(opts, function (cookies) {
        if (cookies && cookies.length) allCookies = allCookies.concat(cookies);
        pending -= 1;
        if (pending === 0) callback(allCookies);
      });
  });
}
function syncLovableAuth(url, projectId, callback) {
  collectLovableCookies(function (cookies) {
    (bestCookieToken = pickBestJwtToken(extractJwtTokensFromCookies(cookies))),
      (projIdFromUrl = projectIdFromUrl(url) || projectId || "");
    chrome.storage.local.get(
      ["lovable_token", "lovable_projectId"],
      function (stored) {
        (currentToken = normalizeJwtToken(stored.lovable_token || "")),
          (finalToken = currentToken);
        bestCookieToken &&
          decodeJwtExpMs(bestCookieToken) >= decodeJwtExpMs(currentToken) &&
          (finalToken = bestCookieToken);
        var toStore = {};
        if (finalToken) toStore.lovable_token = finalToken;
        if (projIdFromUrl) toStore.lovable_projectId = projIdFromUrl;
        else {
          if (stored.lovable_projectId)
            toStore.lovable_projectId = stored.lovable_projectId;
        }
        var complete = function (result) {
          if (typeof callback === "function") callback(result);
        };
        if (!Object.keys(toStore).length) {
          complete({
            ok: false,
            token: currentToken,
            projectId: stored.lovable_projectId || "",
          });
          return;
        }
        chrome.storage.local.set(toStore, function () {
          complete({
            ok: !!finalToken,
            token: toStore.lovable_token || currentToken,
            projectId:
              toStore.lovable_projectId || stored.lovable_projectId || "",
            fresh:
              decodeJwtExpMs(toStore.lovable_token || currentToken) >
              Date.now() + 30000,
          });
        });
      }
    );
  });
}
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status !== "complete" || !tab || !tab.url) return;
  if (tab.url.indexOf("lovable.dev") === -1) return;
  syncLovableAuth(tab.url, "", function () {
    try {
      chrome.tabs.sendMessage(
        tabId,
        { action: "requestTokenRefresh" },
        function () {
          if (chrome.runtime.lastError) {
          }
        }
      );
    } catch (err) {}
  });
});
async function enableActionSidePanel() {
  try {
    await chrome.sidePanel.setOptions({
      path: "sidepanel.html",
      enabled: true,
    });
  } catch (err) {
    console.warn(
      "[Background] sidePanel.setOptions:",
      err && err.message ? err.message : err
    );
  }
  try {
    var behavior = {};
    (behavior.openPanelOnActionClick = true),
      await chrome.sidePanel.setPanelBehavior(behavior);
  } catch (err) {
    console.warn(
      "[Background] sidePanel.setPanelBehavior:",
      err && err.message ? err.message : err
    );
  }
}
async function openPowerkitsSidePanel(tab) {
  await enableActionSidePanel();
  if (!tab || !tab.id) throw new Error("Active tab not found.");
  var opts = {};
  return (
    (opts.tabId = tab.id),
    (await chrome.sidePanel.open(opts),
    await chrome.storage.local.set({ ql_sidebar_mode: true }),
    { ok: true })
  );
}
enableActionSidePanel(), chrome.storage.local.set({ ql_sidebar_mode: true });
const VALIDATE_URL =
  "https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license";
let planHeartbeatTimer = null;
function compactNumber(n) {
  if (n == null) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}
function formatCreditsBadge(planType, credits, minutes) {
  if (planType === "unlimited") return { text: "∞", color: "#5B6FED" };
  if (planType === "trial")
    return {
      text: String(minutes ?? 0),
      color: "#FBBF24",
    };
  return { text: compactNumber(credits), color: "#FF6B9D" };
}
function setBadge(planType, credits, minutes) {
  (info = formatCreditsBadge(planType, credits, minutes)), (obj = {});
  (obj.text = info.text),
    (chrome.action.setBadgeText(obj),
    chrome.action.setBadgeBackgroundColor({ color: info.color }));
}
async function planHeartbeat() {
  const stored = await chrome.storage.local.get([
      "ql_license_key",
      "pk_device_id",
    ]),
    key = stored.ql_license_key,
    deviceId = stored.pk_device_id || "";
  if (!key || key === "INTERNAL") return;
  try {
    var body = {};
    (body.key = key), (body.device_id = deviceId), (body.credits = 0);
    const resp = await fetch(VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.status >= 500) return;
    const data = await resp.json();
    if (!data) return;
    if (data.valid === true)
      await chrome.storage.local.set({
        ql_license_valid: true,
        ql_license_data: data,
        ql_license_status: data.plan_type || data.status || "active",
        plan: {
          plan_name: data.plan_name,
          plan_type: data.plan_type,
          credits_remaining: data.credits_remaining,
          daily_minutes: data.daily_minutes,
          minutes_used_today: data.minutes_used_today,
          minutes_remaining_today: data.minutes_remaining_today,
          expires_at: data.expires_at,
          reset_at: data.reset_at,
          max_devices: data.max_devices,
          is_trial: data.is_trial,
          source: data.source,
          buckets: data.buckets,
          checked_at: Date.now(),
        },
      }),
        setBadge(
          data.plan_type,
          data.credits_remaining,
          data.minutes_remaining_today
        );
    else {
      if (
        data.terminal ||
        data.revoked ||
        data.expired ||
        data.status === "revoked" ||
        data.status === "expired" ||
        data.status === "suspended"
      )
        await chrome.storage.local.remove([
          "ql_license_key",
          "ql_license_valid",
          "ql_license_data",
          "plan",
          "ql_user_name",
          "ql_expires_at",
          "ql_activated_at",
          "ql_license_status",
          "ql_validity_minutes",
          "ql_session_id",
        ]),
          chrome.action.setBadgeText({ text: "" });
      else
        data.exhausted
          ? (await chrome.storage.local.remove(["plan"]),
            chrome.action.setBadgeText({ text: "!" }),
            chrome.action.setBadgeBackgroundColor({ color: "#EF4444" }))
          : (await chrome.storage.local.remove(["plan"]),
            chrome.action.setBadgeText({ text: "" }));
    }
  } catch (err) {
    console.warn("[Background] planHeartbeat error:", err);
  }
}
async function restorePlanBadge() {
  const stored = await chrome.storage.local.get(["plan"]);
  stored.plan &&
    stored.plan.plan_type &&
    setBadge(
      stored.plan.plan_type,
      stored.plan.credits_remaining,
      stored.plan.minutes_remaining_today
    );
}
function startPlanHeartbeat() {
  stopPlanHeartbeat(),
    (planHeartbeatTimer = setInterval(planHeartbeat, 3600000)),
    planHeartbeat();
}
function stopPlanHeartbeat() {
  planHeartbeatTimer &&
    (clearInterval(planHeartbeatTimer), (planHeartbeatTimer = null));
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.ql_license_key) {
    if (changes.ql_license_key.newValue) startPlanHeartbeat();
    else stopPlanHeartbeat();
  }
}),
  chrome.runtime.onInstalled.addListener(() => {
    setOpts = {};
    (setOpts.ql_sidebar_mode = true),
      (chrome.storage.local.set(setOpts),
      enableActionSidePanel(),
      restorePlanBadge(),
      chrome.storage.local.get(["ql_license_key"], (stored) => {
        if (stored.ql_license_key) startPlanHeartbeat();
      }));
  }),
  chrome.runtime.onStartup.addListener(() => {
    enableActionSidePanel(),
      restorePlanBadge(),
      chrome.storage.local.get(["ql_license_key"], (stored) => {
        if (stored.ql_license_key) startPlanHeartbeat();
      });
  }),
  chrome.storage.local.get(["ql_sidebar_mode", "ql_license_key"], (stored) => {
    setOpts = {};
    (setOpts.ql_sidebar_mode = true),
      stored.ql_sidebar_mode !== true && chrome.storage.local.set(setOpts),
      (enableActionSidePanel(), restorePlanBadge());
    if (stored.ql_license_key) startPlanHeartbeat();
  }),
  chrome.storage.onChanged.addListener((changes, area) => {
    area === "local" && changes.ql_sidebar_mode && enableActionSidePanel();
  }),
  chrome.action.onClicked.addListener(async (tab) => {
    try {
      await openPowerkitsSidePanel(tab);
    } catch (err) {
      console.error("[Background] action.onClicked sidePanel error:", err);
    }
  }),
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === "lovableSync")
      return (
        chrome.storage.local.get(
          ["lovable_token", "lovable_projectId"],
          function (stored) {
            const toStore = {};
            if (msg.token) {
              var incomingTok = normalizeJwtToken(msg.token),
                curTok = normalizeJwtToken(stored.lovable_token || "");
              incomingTok &&
                (!curTok ||
                  decodeJwtExpMs(incomingTok) >=
                    decodeJwtExpMs(curTok) - 5000) &&
                (toStore.lovable_token = incomingTok);
            }
            if (msg.projectId) toStore.lovable_projectId = msg.projectId;
            if (msg.browserSessionId)
              toStore.lovable_browserSessionId = String(
                msg.browserSessionId
              ).trim();
            Object.keys(toStore).length &&
              chrome.storage.local.set(toStore, function () {});
          }
        ),
        false
      );
    if (msg && msg.action === "activateSidebar")
      return (
        enableActionSidePanel(),
        sender.tab && sender.tab.id
          ? openPowerkitsSidePanel(sender.tab)
              .then(() => {
                var res = {};
                (res.ok = true), sendResponse(res);
              })
              ["catch"]((err) => {
                console.warn(
                  "[Background] sidePanel.open deferred:",
                  err.message
                ),
                  sendResponse({
                    ok: false,
                    deferred: true,
                    message: "Click the extension icon to open the side panel.",
                  });
              })
          : sendResponse({
              ok: false,
              deferred: true,
              message: "Click the extension icon to open the side panel.",
            }),
        true
      );
    var res = {};
    res.ok = true;
    if (msg && msg.action === "deactivateSidebar")
      return sendResponse(res), false;
    if (msg && msg.action === "openSidePanel")
      return (
        sender.tab && sender.tab.id
          ? openPowerkitsSidePanel(sender.tab)
              .then(() => {
                var res = {};
                (res.ok = true), sendResponse(res);
              })
              ["catch"]((err) => {
                console.warn(
                  "[Background] openSidePanel deferred:",
                  err.message
                ),
                  sendResponse({ ok: false, error: err.message });
              })
          : sendResponse({ ok: false, error: "No tab context" }),
        true
      );
    if (msg && msg.action === "proxyFetch")
      return (
        (async () => {
          try {
            typeof POWERKITS_DEBUG !== "undefined" &&
              POWERKITS_DEBUG &&
              console.log("[Background] proxyFetch ->", msg.url);
            var init = {
              method: msg.method || "POST",
              headers: msg.headers || {},
            };
            if (msg.body) init.body = msg.body;
            var resp = await fetch(msg.url, init),
              text = await resp.text(),
              data;
            try {
              data = JSON.parse(text);
            } catch (e) {
              var wrapper = {};
              (wrapper.raw = text), (data = wrapper);
            }
            if (!resp.ok && data && data.raw && typeof data.raw === "string") {
              var body = data.raw.trim();
              if (
                /^error code: 502$/i.test(body) ||
                /^error code: 503$/i.test(body)
              )
                data.error_display =
                  "Service is temporarily unavailable (gateway timeout). Try again in a few minutes.";
              else
                body.length > 120 &&
                  /<!DOCTYPE|<html|cloudflare|bad gateway/i.test(body) &&
                  (data.error_display =
                    "Service is temporarily unavailable. Try again in a few minutes.");
            }
            sendResponse({
              ok: resp.ok,
              status: resp.status,
              data: data,
            });
          } catch (err) {
            console.error("[Background] proxyFetch error:", err),
              sendResponse({
                ok: false,
                status: 0,
                data: {
                  error: err.message || "Fetch failed in background",
                },
              });
          }
        })(),
        true
      );
    if (msg && msg.action === "readCookies")
      return (
        collectLovableCookies(function (cookies) {
          (cookiesTokens = extractJwtTokensFromCookies(cookies)),
            (tokenList = cookiesTokens.map(function (tok, i) {
              return {
                token: tok,
                cookieName: "scan-" + i,
                httpOnly: false,
              };
            }));
          sendResponse({
            success: tokenList.length > 0,
            tokens: tokenList,
          });
        }),
        true
      );
    if (msg && msg.action === "syncLovableAuth")
      return (
        syncLovableAuth(
          msg.tabUrl || "",
          msg.projectId || "",
          function (bridgeList) {
            var resObj = {};
            (resObj.ok = false), sendResponse(bridgeList || resObj);
          }
        ),
        true
      );
    var queryOpts = {};
    queryOpts.domain = "lovable.dev";
    if (msg && msg.action === "getLovableCookies")
      return (
        chrome.cookies.getAll(queryOpts, function (resultCookies) {
          tokens = [];
          if (resultCookies && resultCookies.length)
            for (var idx = 0; idx < resultCookies.length; idx++) {
              var c = resultCookies[idx];
              c &&
                c.name &&
                typeof c.value === "string" &&
                tokens.push(c.name + "=" + c.value);
            }
          sendResponse({ ok: true, cookie: tokens.join(";\x20") });
        }),
        true
      );
    if (msg && msg.action === "sendPromptToLovable")
      return (
        (async function () {
          try {
            await deliverPromptViaTab(msg.message || "", msg.files),
              sendResponse({ ok: true });
          } catch (err) {
            sendResponse({
              ok: false,
              error: err.message || "Send failed",
            });
          }
        })(),
        true
      );
    if (msg && msg.action === "downloadProject")
      return (
        (async function () {
          try {
            var srcUrl =
                "https://lovable-api.com/projects/" +
                msg.projectId +
                "/source-code",
              resp = await fetch(srcUrl, {
                method: "GET",
                headers: {
                  Authorization: "Bearer " + msg.token,
                  Accept: "application/json",
                },
              });
            if (!resp.ok) {
              sendResponse({
                success: false,
                error: "API returned " + resp.status,
              });
              return;
            }
            var data = await resp.json();
            sendResponse({ success: true, files: data.files || [] });
          } catch (err) {
            sendResponse({
              success: false,
              error: err.message || "Download failed",
            });
          }
        })(),
        true
      );
  });
