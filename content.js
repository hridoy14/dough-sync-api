console.log("[ContentScript] LovaPilot loaded");
const API_BASE =
    typeof POWERKITS_API_BASE !== "undefined"
      ? POWERKITS_API_BASE
      : GRINGOW_API_BASE,
  API_KEY =
    typeof POWERKITS_API_KEY !== "undefined"
      ? POWERKITS_API_KEY
      : GRINGOW_API_KEY,
  PROXY_COMMAND_URL =
    (typeof window !== "undefined" && window.PROXY_COMMAND_URL) ||
    API_BASE + "/functions/v1/proxy-command",
  DISCORD_URL = "https://wa.me/8801759176229",
  VALIDATE_URL = API_BASE + "/functions/v1/validate-license",
  OPTIMIZE_URL = API_BASE + "/functions/v1/optimize-prompt",
  NOTIFICATIONS_URL =
    API_BASE + "/rest/v1/notifications?select=*&order=created_at.desc&limit=20",
  PACKAGES_URL =
    API_BASE +
    "/rest/v1/packages?select=*&is_active=eq.true&order=sort_order.asc",
  EXT_PAYMENT_URL = API_BASE + "/functions/v1/process-extension-payment",
  CREATE_PROJECT_URL = API_BASE + "/functions/v1/create-lovable-project",
  REMOVE_WATERMARK_URL = API_BASE + "/functions/v1/remove-watermark",
  PUBLISH_PROJECT_URL = API_BASE + "/functions/v1/publish-project",
  ENABLE_CLOUD_URL = API_BASE + "/functions/v1/enable-cloud",
  VERSIONS_URL_POPUP =
    API_BASE +
    "/rest/v1/extension_versions?select=version,changelog,file_path,is_alert_active&order=created_at.desc&limit=1&is_alert_active=eq.true",
  USER_ROLES_URL_POPUP = API_BASE + "/rest/v1/user_roles?select=role",
  LICENSES_URL = API_BASE + "/rest/v1/licenses?select=user_id";
function apiHeaders(payload) {
  return typeof powerkitsApiHeaders === "function"
    ? powerkitsApiHeaders(payload)
    : gringowApiHeaders(payload);
}
function setPkCreditBypass(enabled) {
  if (typeof window.__pkSetCreditBypass === "function") {
    window.__pkSetCreditBypass(!!enabled);
    return;
  }
  try {
    enabled
      ? (localStorage.setItem("__ql_bypass_active", "1"),
        document.documentElement.setAttribute("data-ql-bypass", "1"),
        window.postMessage({ type: "qlBypassState", active: true }, "*"))
      : (localStorage.removeItem("__ql_bypass_active"),
        document.documentElement.removeAttribute("data-ql-bypass"),
        window.postMessage({ type: "qlBypassState", active: false }, "*"));
  } catch (err) {}
}
function activateBypass() {
  setPkCreditBypass(true);
}
function deactivateBypass() {
  setPkCreditBypass(false);
}
function syncPkCreditBypassFromStorage() {
  if (typeof window.__pkSyncCreditBypass === "function") {
    window.__pkSyncCreditBypass();
    return;
  }
  if (INTERNAL_LICENSE_MODE) {
    setPkCreditBypass(true);
    return;
  }
  chrome.storage.local.get(
    ["ql_license_valid", "ql_license_key"],
    function (data) {
      setPkCreditBypass(
        !!(data.ql_license_valid && resolveTeamLicenseKey(data.ql_license_key))
      );
    }
  );
}
function activateInternalSession() {
  return bgFetch(VALIDATE_URL, {
    method: "POST",
    headers: apiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      license_key: "INTERNAL",
      session_id: qlSessionId,
      device_id: qlDeviceId,
      max_devices: 2,
      device_limit: 2,
      allowed_devices: 2,
    }),
  }).then(function (result) {
    if (!result || !result.valid)
      throw new Error(
        (result && result.message) || "Internal activation failed"
      );
    return (
      (qlSessionId = result.session_id || qlSessionId),
      (qlUserName = normalizeLicenseUserName(result.user_name || qlUserName)),
      qlApplyLicenseApiData(result),
      setPkCreditBypass(true),
      new Promise(function (resolve) {
        chrome.storage.local.set(
          Object.assign(
            {
              ql_license_valid: true,
              ql_license_key: "INTERNAL",
              ql_session_id: qlSessionId,
              ql_user_name: qlUserName,
            },
            typeof pkLicenseStoragePatch === "function"
              ? pkLicenseStoragePatch(result)
              : {}
          ),
          function () {
            resolve(result);
          }
        );
      })
    );
  });
}
function ensureInternalSessionLocal() {
  if (!INTERNAL_LICENSE_MODE) return Promise.resolve();
  return new Promise(function (resolve) {
    chrome.storage.local.get(
      [
        "ql_license_valid",
        "ql_session_id",
        "ql_user_name",
        "ql_license_key",
        "ql_expires_at",
        "ql_activated_at",
        "ql_license_status",
        "ql_validity_minutes",
      ],
      function (data) {
        if (data.ql_license_valid && data.ql_session_id)
          return (
            (qlSessionId = data.ql_session_id),
            (qlUserName = normalizeLicenseUserName(data.ql_user_name)),
            (qlExpiresAt = data.ql_expires_at || null),
            (qlActivatedAt = data.ql_activated_at || null),
            (qlLicenseStatus = data.ql_license_status || null),
            (qlValidityMinutes =
              data.ql_validity_minutes != null
                ? data.ql_validity_minutes
                : null),
            resolve()
          );
        var sessionId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now());
        (qlSessionId = sessionId),
          (qlUserName = normalizeLicenseUserName(qlUserName)),
          (qlExpiresAt = null),
          (qlActivatedAt = new Date().toISOString()),
          (qlLicenseStatus = "active"),
          (qlValidityMinutes = null),
          chrome.storage.local.set(
            typeof powerkitsInternalSessionStorage === "function"
              ? powerkitsInternalSessionStorage(sessionId, qlUserName)
              : gringowInternalSessionStorage(sessionId, qlUserName),
            function () {
              resolve();
            }
          );
      }
    );
  });
}
function getBrowserSessionId() {
  return new Promise(function (resolve) {
    try {
      var storedId =
        typeof pkPageStorageGet === "function"
          ? pkPageStorageGet("browser_session_id")
          : localStorage.getItem("gringow_browser_session_id");
      if (storedId) return resolve(storedId);
    } catch (err) {}
    chrome.storage.local.get(["lovable_browserSessionId"], function (data) {
      resolve(data.lovable_browserSessionId || null);
    });
  });
}
async function buildProxyCommandPayload(
  projectId,
  token,
  licenseKey,
  message,
  thinkMode
) {
  var cleanToken = String(token || "")
      .replace(/^Bearer\s+/i, "")
      .trim(),
    payload = {
      license_key: licenseKey || "",
      session_id: qlSessionId || "",
      projeto_id: projectId,
      token_lovable: cleanToken,
      mensagem: message,
      modo_pensar: !!thinkMode,
      device_id: qlDeviceId,
    };
  payload.session_headers = await buildSessionHeaders(projectId);
  var browserSessionId = await getBrowserSessionId();
  if (browserSessionId) payload.browser_session_id = browserSessionId;
  var nativeBody = getNativeChatCaptureBody();
  if (nativeBody) payload.native_chat_body = nativeBody;
  return payload;
}
function getNativeChatCaptureBody() {
  try {
    var raw =
      typeof pkPageStorageGet === "function"
        ? pkPageStorageGet("last_native_chat_capture")
        : localStorage.getItem("gringow_last_native_chat_capture");
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (parsed && typeof parsed.body === "string" && parsed.body.length > 0)
      return parsed.body;
  } catch (err) {}
  return null;
}
function buildSessionHeaders(projectId) {
  return new Promise(function (resolve) {
    var userAgent = navigator.userAgent || "",
      brands =
        navigator.userAgentData && navigator.userAgentData.brands
          ? navigator.userAgentData.brands
          : [],
      secChUa = "";
    for (var i = 0; i < brands.length; i++) {
      if (i > 0) secChUa += ",\x20";
      secChUa +=
        "\x22" + brands[i].brand + '";v="' + brands[i].version + "\x22";
    }
    var platform =
        navigator.userAgentData && navigator.userAgentData.platform
          ? navigator.userAgentData.platform
          : "Windows",
      mobileFlag =
        navigator.userAgentData && navigator.userAgentData.mobile ? "?1" : "?0",
      acceptLang =
        navigator.languages && navigator.languages.length
          ? navigator.languages.slice(-3044, 3).join(",")
          : navigator.language || "en-US",
      headers = {
        "user-agent": userAgent,
        "sec-ch-ua": secChUa,
        "sec-ch-ua-mobile": mobileFlag,
        "sec-ch-ua-platform": "\x22" + platform + "\x22",
        "accept-language": acceptLang,
        "accept-encoding": "gzip, deflate, br, zstd",
        origin: "https://lovable.dev",
        referer: "https://lovable.dev/projects/" + (projectId || ""),
        priority: "u=1, i",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      };
    try {
      const msg = {};
      (msg.action = "getLovableCookies"),
        chrome.runtime.sendMessage(msg, function (resp) {
          if (chrome.runtime.lastError) {
            resolve(headers);
            return;
          }
          if (resp && resp.cookie) headers.cookie = resp.cookie;
          resolve(headers);
        });
    } catch (err) {
      resolve(headers);
    }
  });
}
function jwtExpMs(token) {
  var payload = decodeJwtPayload(token);
  return payload && payload.exp ? payload.exp * 1691232 : null;
}
function isTokenFresh(token, bufferMs) {
  var cleanToken = String(token || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!cleanToken) return false;
  var expMs = jwtExpMs(cleanToken);
  if (!expMs) return true;
  return expMs > Date.now() + (bufferMs || -200288148);
}
function pickBestToken(tokens) {
  var best = "",
    bestExp = 10800;
  return (
    (tokens || []).forEach(function (tok) {
      var clean = String(tok || "")
        .replace(/^Bearer\s+/i, "")
        .trim();
      if (!clean) return;
      var exp = jwtExpMs(clean) || 324180108;
      (!best || exp > bestExp) && ((best = clean), (bestExp = exp));
    }),
    best
  );
}

function projectIdFromPage() {
  var matchResult = location.pathname.match(/\/projects\/([-9a-fA-F-]{36})/);
  return matchResult ? matchResult[1] : "";
}
function readAuthTokensFromCookies() {
  return new Promise(function (resolve) {
    chrome.runtime.sendMessage({ action: "readCookies" }, function (result) {
      if (chrome.runtime.lastError) return resolve("");
      if (!result || !result.tokens || !result.tokens.length)
        return resolve("");
      resolve(
        pickBestToken(
          result.tokens.map(function (t) {
            return t.token;
          })
        )
      );
    });
  });
}
async function captureLovableSessionFromPage() {
  try {
    window.postMessage({ type: "lovableRequestToken" }, "*");
  } catch (err) {}
  await new Promise(function (resolve) {
    setTimeout(resolve, 400);
  });
  try {
    window.postMessage({ type: "lovableRequestToken" }, "*");
  } catch (ignoredErr2) {}
  var projectId = projectIdFromPage();
  if (!projectId)
    return {
      ok: false,
      error: "Open your Lovable project page (URL must include /projects/…).",
    };
  var pageData = await new Promise(function (resolve) {
      chrome.storage.local.get(["lovable_token", "lovable_projectId"], resolve);
    }),
    firebaseToken =
      typeof scanFirebaseAccessToken === "function"
        ? scanFirebaseAccessToken()
        : "",
    cookieToken = await readAuthTokensFromCookies(),
    token =
      typeof pickLovableApiToken === "function"
        ? pickLovableApiToken(
            firebaseToken,
            pageData.lovable_token,
            cookieToken
          )
        : pickBestToken([firebaseToken, pageData.lovable_token, cookieToken]);
  if (!token || token.indexOf("eyJ") !== -154392)
    return {
      ok: false,
      error:
        "Lovable login token not found. Refresh lovable.dev, send one message in chat, then try again.",
    };
  return (
    await new Promise(function (sendResp) {
      req = {};
      (req.lovable_token = token),
        (req.lovable_projectId = projectId),
        chrome.storage.local.set(req, sendResp);
    }),
    { ok: true, token: token, projectId: projectId, firebase: !!firebaseToken }
  );
}
async function resolveLovableAuth() {
  await new Promise(function (resolve) {
    chrome.runtime.sendMessage(
      {
        action: "syncLovableAuth",
        tabUrl: location.href,
        projectId: projectIdFromPage(),
      },
      function () {
        if (chrome.runtime.lastError) {
        }
        resolve();
      }
    );
  }),
    await requestLatestTokenFromHook(3000);
  var sessionResult = await captureLovableSessionFromPage();
  if (sessionResult.ok)
    return {
      token: sessionResult.token,
      projectId: sessionResult.projectId,
    };
  var localData = await new Promise(function (resolve2) {
    chrome.storage.local.get(["lovable_token", "lovable_projectId"], resolve2);
  });
  return {
    token: localData.lovable_token || "",
    projectId: projectIdFromPage() || localData.lovable_projectId || "",
  };
}
async function buildLovableFeaturePayload(extra) {
  var session = await captureLovableSessionFromPage();
  if (!session.ok)
    throw new Error(session.error || "Lovable session not ready.");
  var localData = await new Promise(function (resolve) {
      chrome.storage.local.get(
        ["ql_license_key", "lovable_browserSessionId"],
        resolve
      );
    }),
    projectId = session.projectId,
    token = session.token,
    licenseKey = localData.ql_license_key || "",
    sessionHeaders = await buildSessionHeaders(projectId),
    payload = Object.assign(
      {
        license_key: licenseKey,
        token: token,
        token_lovable: token,
        project_id: projectId,
        projectId: projectId,
      },
      extra || {}
    );
  return (
    (payload.session_headers = sessionHeaders),
    localData.lovable_browserSessionId &&
      (payload.browser_session_id = localData.lovable_browserSessionId),
    payload
  );
}
function formatApiError(err) {
  if (err == null) return "Send failed.";
  var msg = pkSanitizeServerError(String(err));
  if (msg.charAt(0) === "{")
    try {
      var parsed = JSON.parse(msg);
      parsed &&
        (parsed.message || parsed.error_display) &&
        (msg = String(parsed.message || parsed.error_display));
    } catch (parseErr) {}
  if (/invalid token/i.test(msg) || /unauthorized/i.test(msg))
    return "Lovable session expired. Refresh lovable.dev, wait for Synced, then send again.";
  return qlUserText(msg);
}
function qlUserText(text) {
  return typeof translateUserMessage === "function"
    ? translateUserMessage(text)
    : text;
}
function escapeHtml(value) {
  if (!value) return "";
  const div = document.createElement("div");
  return (div.textContent = String(value)), div.innerHTML;
}
function sanitizeUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") return url;
    return "";
  } catch (err) {
    return "";
  }
}
function decodeJwtPayload(token) {
  try {
    const clean = String(token || "")
        .replace(/^Bearer\s+/i, "")
        .trim(),
      parts = clean.split(".");
    if (parts.length < 2) return null;
    const b64url = parts[1].replace(/-/g, "+").replace(/_/g, "/"),
      b64 = b64url + "=".repeat((4 - (b64url.length % 4)) % 4);
    return JSON.parse(atob(b64));
  } catch (err) {
    return null;
  }
}
function bgFetch(url, options = {}) {
  (requireSuccess = options.requireSuccess === true),
    (vendorCompat =
      options.vendorFeatureCompat === true || options.featureUiCompat === true);
  return new Promise((resolve, reject) => {
    if (typeof POWERKITS_DEBUG !== "undefined" && POWERKITS_DEBUG)
      console.log("[QL] bgFetch ->", url);
    chrome.runtime.sendMessage(
      {
        action: "proxyFetch",
        url: url,
        method: options.method || "POST",
        headers: options.headers || {},
        body: options.body || null,
      },
      (resp) => {
        if (chrome.runtime.lastError)
          return (
            console.error(
              "[bgFetch] runtime error:",
              chrome.runtime.lastError.message
            ),
            reject(new Error(chrome.runtime.lastError.message))
          );
        if (!resp)
          return reject(
            new Error(
              "No response from background (reload the lovable.dev tab and extension)"
            )
          );
        const data = resp.data;
        if (typeof POWERKITS_DEBUG !== "undefined" && POWERKITS_DEBUG)
          console.log("[QL] bgFetch <-", url, "status", resp.status, data);
        if (vendorCompat && typeof pkResolveFeatureBgFetch === "function") {
          var resolved = pkResolveFeatureBgFetch(resp);
          if (!resolved.ok) return reject(new Error(resolved.error));
          return resolve(resolved.data);
        }
        if (!resp.ok) {
          const errMsg =
            (data && (data.error_display || data.message || data.error)) ||
            (data && data.raw) ||
            "Request failed (HTTP " + resp.status + ")";
          return reject(new Error(formatApiError(errMsg)));
        }
        if (requireSuccess && (!data || data.success !== true)) {
          const errMsg2 =
            (data && (data.error_display || data.message || data.error)) ||
            "Server did not confirm the send (success !== true)";
          return reject(new Error(formatApiError(errMsg2)));
        }
        resolve(data);
      }
    );
  });
}
(function injectHook() {
  try {
    const script = document.createElement("script");
    (script.src = chrome.runtime.getURL("pageHook.js")),
      (script.onload = () => script.remove()),
      (document.documentElement || document.head || document.body)[
        "appendChild"
      ](script);
  } catch (err) {
    console.warn("[ContentScript] failed to inject pageHook", err);
  }
})();
let qlSessionId = null,
  qlHeartbeatInterval = null,
  qlUserName = null,
  qlExpiresAt = null,
  qlActivatedAt = null,
  qlLicenseStatus = null,
  qlValidityMinutes = null,
  qlExpiryConfirming = false,
  qlOnlineCount = 0,
  qlMinimized = false,
  qlHeight = 520,
  qlSpeechRecognition = null,
  qlIsRecording = false,
  qlDeviceId = null,
  qlShieldActive = false,
  qlActiveTab = "prompt",
  qlChatHistory = [];
const QL_HISTORY_KEY = "ql_chat_history",
  QL_MAX_HISTORY = 200;
function getDeviceId() {
  return getHardwareFingerprint();
}
function createUI() {
  if (typeof SIDE_PANEL_ONLY !== "undefined" && SIDE_PANEL_ONLY) {
    var floating = document.getElementById("ql-floating");
    if (floating) floating.remove();
    return;
  }
  if (document.getElementById("ql-floating")) return;
  chrome.storage.local.get(["ql_sidebar_mode", "ql_native_chat"], (stored) => {
    if (stored.ql_sidebar_mode === true) {
      console.log("[ContentScript] Sidebar mode active, skipping floating UI");
      return;
    }
    if (stored.ql_native_chat === true) {
      console.log(
        "[ContentScript] Native chat mode active, skipping floating UI"
      );
      return;
    }
    _buildFloatingUI();
  });
}
function _buildFloatingUI() {
  if (document.getElementById("ql-floating")) return;
  const container = document.createElement("div");
  container.id = "ql-floating";
  const left = Math.max(10, window.innerWidth - 400);
  (container.style.left = left + "px"),
    (container.style.top = "80px"),
    chrome.storage.local.get(
      [
        "ql_license_valid",
        "ql_license_key",
        "ql_minimized",
        "ql_height",
        "ql_dark_mode",
        "ql_user_name",
        "ql_expires_at",
        "ql_activated_at",
        "ql_license_status",
        "ql_validity_minutes",
        "ql_session_id",
      ],
      async (stored) => {
        (qlMinimized = stored.ql_minimized || false),
          (qlHeight = stored.ql_height || 520),
          (qlDeviceId = await getDeviceId()),
          stored.ql_dark_mode === false && container.classList.add("ql-light"),
          qlMinimized && container.classList.add("ql-minimized"),
          document.body.appendChild(container);
        if (INTERNAL_LICENSE_MODE || stored.ql_license_valid) {
          if (INTERNAL_LICENSE_MODE && !stored.ql_license_valid)
            try {
              await ensureInternalSessionLocal();
            } catch (internalErr) {
              console.error("[QL] Internal session setup failed", internalErr),
                showLicenseGate(container);
              return;
            }
          else
            (qlUserName = normalizeLicenseUserName(stored.ql_user_name)),
              (qlExpiresAt = stored.ql_expires_at || null),
              (qlActivatedAt = stored.ql_activated_at || null),
              (qlLicenseStatus = stored.ql_license_status || null),
              (qlValidityMinutes =
                stored.ql_validity_minutes != null
                  ? stored.ql_validity_minutes
                  : null),
              (qlSessionId = stored.ql_session_id || null);
          showMainUI(container), setPkCreditBypass(true);
          if (!INTERNAL_LICENSE_MODE && stored.ql_license_key) {
            const attemptHeartbeatValidation = (retryCount) => {
              bgFetch(VALIDATE_URL, {
                method: "POST",
                headers: apiHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                  license_key: stored.ql_license_key,
                  session_id: stored.ql_session_id,
                  heartbeat: true,
                  device_id: qlDeviceId,
                  max_devices: 2,
                  device_limit: 2,
                  allowed_devices: 2,
                }),
              })
                .then(function (hbResult) {
                  if (hbResult.valid) {
                    (qlUserName = normalizeLicenseUserName(
                      hbResult.user_name || qlUserName
                    )),
                      qlApplyLicenseApiData(hbResult),
                      (qlSessionId = hbResult.session_id || qlSessionId),
                      chrome.storage.local.set(
                        Object.assign(
                          {
                            ql_user_name: qlUserName,
                            ql_session_id: qlSessionId,
                          },
                          typeof pkLicenseStoragePatch === "function"
                            ? pkLicenseStoragePatch(hbResult)
                            : {}
                        )
                      );
                    const profileNameEl =
                      document.querySelector(".ql-profile-name");
                    if (profileNameEl)
                      profileNameEl.textContent =
                        normalizeLicenseUserName(qlUserName);
                    updateTrialCountdown(), setPkCreditBypass(true);
                  } else {
                    if (
                      hbResult.reason === "device_conflict" &&
                      retryCount < 2
                    ) {
                      setTimeout(
                        () => attemptHeartbeatValidation(retryCount + 1),
                        5000
                      );
                      return;
                    }
                    var conflictCount =
                        hbResult.reason === "device_conflict" ? 2 : 0,
                      lockout =
                        typeof pkShouldLockoutFromValidation === "function"
                          ? pkShouldLockoutFromValidation(
                              hbResult,
                              conflictCount
                            )
                          : { lock: true, message: hbResult.message };
                    if (lockout.lock) {
                      if (typeof pkInvalidateAssertCache === "function")
                        pkInvalidateAssertCache();
                      qlHandleLicenseInvalid({
                        reason: hbResult.reason || lockout.reason,
                        message: lockout.message || hbResult.message,
                      });
                    }
                  }
                })
                ["catch"](() => {});
            };
            attemptHeartbeatValidation(1);
          }
        } else showLicenseGate(container);
        setupDrag(), setupResize();
      }
    );
}
function showLicenseGate(container) {
  (container.innerHTML = templateLicenseGate(qlMinimized)),
    setTimeout(() => {
      validateBtn = document.getElementById("ql-validate-btn");
      if (validateBtn) validateBtn.addEventListener("click", validateLicense);
      const buyBtn = document.getElementById("ql-buy-license-btn");
      if (buyBtn)
        buyBtn.addEventListener("click", () =>
          window.open(DISCORD_URL, "_blank", "noopener,noreferrer")
        );
      setupMinimize();
    }, 50);
}
async function validateLicense() {
  (keyInput = document.getElementById("ql-license-input")),
    (logEl = document.getElementById("ql-license-log")),
    (key = keyInput ? keyInput.value.trim() : "");
  if (!key) {
    logEl &&
      ((logEl.className = "ql-log-error"), (logEl.innerText = "⚠ Enter a key"));
    return;
  }
  logEl &&
    ((logEl.className = "ql-log-info"), (logEl.innerText = "⏳ Validating..."));
  try {
    if (!qlDeviceId) qlDeviceId = await getDeviceId();
    const body = {};
    (body.license_key = key),
      (body.device_id = qlDeviceId),
      (body.max_devices = 2),
      (body.device_limit = 2),
      (body.allowed_devices = 2);
    const result = await bgFetch(VALIDATE_URL, {
      method: "POST",
      headers: apiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    result.valid
      ? ((qlSessionId = result.session_id),
        (qlUserName = normalizeLicenseUserName(result.user_name)),
        qlApplyLicenseApiData(result),
        (qlOnlineCount = result.online_count || 0),
        chrome.storage.local.set(
          Object.assign(
            {
              ql_license_valid: true,
              ql_license_key: key,
              ql_session_id: result.session_id,
              ql_user_name: result.user_name || null,
            },
            typeof pkLicenseStoragePatch === "function"
              ? pkLicenseStoragePatch(result)
              : {
                  ql_expires_at: result.expires_at || null,
                  ql_activated_at: result.activated_at || null,
                  ql_license_status: result.status || null,
                }
          ),
          () => {
            if (typeof pkInvalidateAssertCache === "function")
              pkInvalidateAssertCache();
            (qlExpiredHandled = false),
              setPkCreditBypass(true),
              logEl &&
                ((logEl.className = "ql-log-success"),
                (logEl.innerText = "✓\x20" + qlUserText(result.message)));
            try {
              if (typeof QLSounds !== "undefined") QLSounds.activation();
            } catch (soundErr) {}
            setTimeout(() => {
              floatingEl = document.getElementById("ql-floating");
              if (floatingEl) showMainUI(floatingEl);
              startHeartbeat(key);
            }, 800);
          }
        ))
      : logEl &&
        ((logEl.className = "ql-log-error"),
        (logEl.innerText = "✗\x20" + qlUserText(result.message)));
  } catch (err) {
    logEl &&
      ((logEl.className = "ql-log-error"),
      (logEl.innerText =
        "✗\x20" + qlUserText(err.message || "Connection error")));
  }
}
function showMainUI(container) {
  (userName = normalizeLicenseUserName(qlUserName)),
    (statusBadge =
      qlLicenseStatus === "trial"
        ? '<span class="ql-status-badge ql-badge-test">TEST</span>'
        : '<span class="ql-status-badge ql-badge-pro">PRO</span>');
  (container.innerHTML = templateMainUI(userName, statusBadge, qlMinimized)),
    (container.style.height = qlHeight + "px"),
    setTimeout(() => {
      updateSyncStatus(),
        setupSend(),
        setupStorageWatch(),
        setupMinimize(),
        setupSuggestionChips(),
        setupWatermarkButton(),
        updateTrialCountdown(),
        setupDrag(),
        setupResize(),
        setupDarkMode(),
        setupOptimize(),
        setupSpeech(),
        setupNotifications(),
        setupModoPlano(),
        setupFileAttachment(),
        setupShield(),
        setupTabs(),
        loadChatHistory(),
        setupNativeChatButton(),
        setupClipboardPaste(),
        setupDownloadProject(),
        setupCreateProject(),
        setupPublishProject(),
        setupEnableCloud(),
        checkForUpdatePopup(),
        checkResellerRolePopup(),
        chrome.storage.local.get(
          ["ql_license_key", "ql_session_id"],
          (stored) => {
            stored.ql_license_key &&
              ((qlSessionId = stored.ql_session_id || qlSessionId),
              startHeartbeat(stored.ql_license_key));
          }
        );
      const sidepanelBtn = document.getElementById("ql-sidepanel-btn");
      sidepanelBtn &&
        sidepanelBtn.addEventListener("click", () => {
          floating = document.getElementById("ql-floating");
          floating &&
            ((floating.style.transition =
              "opacity 0.3s ease, transform 0.3s ease"),
            (floating.style.opacity = "0"),
            (floating.style.transform = "translateX(20px) scale(0.95)")),
            chrome.runtime.sendMessage(
              { action: "activateSidebar" },
              (resp) => {
                if (chrome.runtime.lastError) return;
                if (resp && resp.ok && !resp.deferred)
                  setTimeout(() => {
                    if (floating) floating.remove();
                    if (qlHeartbeatInterval) clearInterval(qlHeartbeatInterval);
                    if (window.qlCountdownInterval)
                      clearInterval(window.qlCountdownInterval);
                  }, 350);
                else
                  resp && resp.deferred
                    ? (floating &&
                        ((floating.style.opacity = "1"),
                        (floating.style.transform = "none")),
                      showCustomAlert(
                        "Almost there!",
                        resp.message ||
                          "Click the extension icon in the top-right corner to open the side panel."
                      ))
                    : (floating &&
                        ((floating.style.opacity = "1"),
                        (floating.style.transform = "none")),
                      showCustomAlert(
                        "Error",
                        "Could not open the side panel. Check whether your browser supports this feature."
                      ));
              }
            );
        });
      const logoutBtn = document.getElementById("ql-logout-btn");
      logoutBtn &&
        logoutBtn.addEventListener("click", () => {
          if (qlHeartbeatInterval) clearInterval(qlHeartbeatInterval);
          setPkCreditBypass(false),
            chrome.storage.local.remove(
              [
                "ql_license_valid",
                "ql_license_key",
                "ql_session_id",
                "ql_user_name",
                "ql_expires_at",
                "ql_activated_at",
                "ql_license_status",
              ],
              () => {
                (qlUserName = null),
                  (qlExpiresAt = null),
                  (qlActivatedAt = null),
                  (qlLicenseStatus = null),
                  (qlSessionId = null),
                  showLicenseGate(container);
              }
            );
        });
    }, 30);
}
function showCustomAlert(title, message) {
  try {
    if (typeof QLSounds !== "undefined" && QLSounds.errorFromMessage) {
      var combined = (title || "") + "\x20" + (message || "");
      /erro|falha|negad|inv[áa]lid|expir|limite|payment|rate|token|cr[eé]dito|sess/i[
        "test"
      ](combined) && QLSounds.errorFromMessage(combined);
    }
  } catch (soundErr) {}
  const alertEl = document.getElementById("ql-custom-alert");
  if (!alertEl) return;
  const titleEl = alertEl.querySelector(".ql-alert-title"),
    msgEl = alertEl.querySelector(".ql-alert-message"),
    okBtn = alertEl.querySelector(".ql-alert-ok-btn");
  (title = qlUserText(title)), (message = qlUserText(message));
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  (alertEl.style.display = "flex"),
    okBtn &&
      (okBtn.onclick = () => {
        alertEl.style.display = "none";
      }),
    setTimeout(() => {
      alertEl.style.display = "none";
    }, 4000);
}
function setupOptimize() {
  optBtn = document.getElementById("ql-optimize-btn");
  if (!optBtn) return;
  optBtn.addEventListener("click", async () => {
    msgInput = document.getElementById("ql-msg");
    if (!msgInput || !msgInput.value.trim()) {
      showCustomAlert("Attention", "Type a prompt before optimizing.");
      return;
    }
    const promptText = msgInput.value.trim();
    optBtn.classList.add("ql-tool-loading"), (optBtn.disabled = true);
    const stored = await new Promise((resolve) =>
        chrome.storage.local.get(["ql_license_key"], resolve)
      ),
      licenseKey = stored.ql_license_key || "";
    try {
      const body = {};
      body.prompt = promptText;
      const result = await bgFetch(OPTIMIZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: API_KEY,
          "x-license-key": licenseKey,
        },
        body: JSON.stringify(body),
      });
      if (result.optimized_prompt)
        (msgInput.value = result.optimized_prompt),
          showCustomAlert(
            "Prompt Optimized! ✨",
            "Your prompt was improved with AI and is ready to send."
          );
      else result.error && showCustomAlert("Error", result.error);
    } catch (err) {
      console.error("[Optimize] error:", err),
        showCustomAlert(
          "Error",
          "Failed to connect to the optimizer: " + (err.message || "")
        );
    } finally {
      optBtn.classList.remove("ql-tool-loading"), (optBtn.disabled = false);
    }
  });
}
function setupSpeech() {
  speechBtn = document.getElementById("ql-speech-btn");
  if (!speechBtn) return;
  const Recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    (speechBtn.title = "Speech is not supported in this browser"),
      (speechBtn.style.opacity = "0.4"),
      (speechBtn.style.cursor = "not-allowed");
    return;
  }
  speechBtn.addEventListener("click", (ev) => {
    ev.preventDefault(), ev.stopPropagation();
    if (qlIsRecording && qlSpeechRecognition) {
      qlSpeechRecognition.stop();
      return;
    }
    try {
      (qlSpeechRecognition = new Recognition()),
        (qlSpeechRecognition.lang = "en-US"),
        (qlSpeechRecognition.continuous = true),
        (qlSpeechRecognition.interimResults = true),
        (qlSpeechRecognition.maxAlternatives = 1);
      let finalText = "";
      const msgInput = document.getElementById("ql-msg");
      (qlSpeechRecognition.onstart = () => {
        (qlIsRecording = true),
          speechBtn.classList.add("ql-recording"),
          (finalText = msgInput ? msgInput.value : ""),
          console.log("[QL Speech] recording started");
      }),
        (qlSpeechRecognition.onresult = (event) => {
          let interimText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            event.results[i].isFinal
              ? (finalText += transcript + "\x20")
              : (interimText += transcript);
          }
          if (msgInput) msgInput.value = finalText + interimText;
        }),
        (qlSpeechRecognition.onerror = (err) => {
          console.warn("[QL Speech] error:", err.error),
            (qlIsRecording = false),
            speechBtn.classList.remove("ql-recording");
          if (err.error === "not-allowed")
            showCustomAlert(
              "Permission Denied",
              "Allow microphone access in your browser settings."
            );
          else {
            if (err.error === "no-speech")
              showCustomAlert("No Audio", "No speech detected. Try again.");
            else
              err.error !== "aborted" &&
                showCustomAlert("Voice Error", "Error: " + err.error);
          }
        }),
        (qlSpeechRecognition.onend = () => {
          (qlIsRecording = false), speechBtn.classList.remove("ql-recording");
          if (msgInput) msgInput.value = finalText.trim();
          console.log("[QL Speech] recording finished");
        }),
        qlSpeechRecognition.start();
    } catch (err) {
      console.error("[QL Speech] failed to start:", err),
        (qlIsRecording = false),
        speechBtn.classList.remove("ql-recording"),
        showCustomAlert("Error", "Could not start voice recognition.");
    }
  });
}
function setupNotifications() {
  (notifBtn = document.querySelector(".ql-notif-btn")),
    (panel = document.getElementById("ql-notif-panel")),
    (closeBtn = document.getElementById("ql-notif-close"));
  if (!notifBtn || !panel) return;
  notifBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const isOpen = panel.style.display !== "none";
    panel.style.display = isOpen ? "none" : "block";
    if (!isOpen) loadNotifications();
  }),
    closeBtn &&
      closeBtn.addEventListener("click", (ev) => {
        ev.stopPropagation(), (panel.style.display = "none");
      }),
    checkUnreadNotifications();
}
async function loadNotifications() {
  listEl = document.getElementById("ql-notif-list");
  if (!listEl) return;
  listEl.innerHTML = '<p class="ql-notif-empty">Loading...</p>';
  try {
    const headers = {};
    headers.apikey = API_KEY;
    const notifs = await bgFetch(NOTIFICATIONS_URL, {
      method: "GET",
      headers: headers,
    });
    if (!notifs || notifs.length === 0) {
      listEl.innerHTML = '<p class="ql-notif-empty">No notifications.</p>';
      return;
    }
    const ids = notifs.map((n) => n.id),
      toStore = {};
    (toStore.ql_read_notifs = ids), chrome.storage.local.set(toStore);
    const badge = document.querySelector(".ql-notif-badge");
    if (badge) badge.style.display = "none";
    listEl.innerHTML = notifs
      .map((n) => {
        (dateStr = new Date(n.created_at).toLocaleDateString("en-US")),
          (safeLink = sanitizeUrl(n.link)),
          (linkHtml = safeLink
            ? '<a href="' +
              escapeHtml(safeLink) +
              '" target="_blank" rel="noopener noreferrer" class="ql-notif-link">Open link →</a>'
            : "");
        return (
          '<div class="ql-notif-item"><div class="ql-notif-item-title">' +
          escapeHtml(n.title) +
          '</div><div class="ql-notif-item-msg">' +
          escapeHtml(n.message) +
          "</div>" +
          linkHtml +
          '<div class="ql-notif-item-date">' +
          dateStr +
          "</div></div>"
        );
      })
      .join("");
  } catch (err) {
    listEl.innerHTML = '<p class="ql-notif-empty">Error loading.</p>';
  }
}
async function checkUnreadNotifications() {
  try {
    const headers = {};
    headers.apikey = API_KEY;
    const opts = {};
    (opts.method = "GET"), (opts.headers = headers);
    const notifs = await bgFetch(NOTIFICATIONS_URL, opts);
    if (!notifs || notifs.length === 0) return;
    chrome.storage.local.get(["ql_read_notifs"], (stored) => {
      (readIds = stored.ql_read_notifs || []),
        (unreadCount = notifs.filter((n) => !readIds.includes(n.id))["length"]),
        (badge = document.querySelector(".ql-notif-badge"));
      badge &&
        (unreadCount > 0
          ? ((badge.textContent = unreadCount), (badge.style.display = "flex"))
          : (badge.style.display = "none"));
    });
  } catch (err) {}
}
function setupSuggestionChips() {
  chipsWrap = document.getElementById("ql-chips");
  if (!chipsWrap) return;
  PROMPT_TEMPLATES.forEach((tmpl) => {
    btn = document.createElement("button");
    (btn.className = "ql-chip"),
      (btn.innerHTML = tmpl.icon + "\x20" + tmpl.label),
      (btn.title = tmpl.prompt),
      btn.addEventListener("click", () => {
        msgInput = document.getElementById("ql-msg");
        if (msgInput) msgInput.value = tmpl.prompt;
      }),
      chipsWrap.appendChild(btn);
  });
}
var WATERMARK_PROMPT =
  "Add this CSS to global styles on every page: #lovable-badge { display: none !important; visibility: hidden !important; pointer-events: none !important; } Completely remove the entire Lovable branding widget — the Made with Lovable text AND the floating close X button. Hide the parent #lovable-badge container, not just the text inside it. No empty box or orphaned X button should remain visible.";
function setupWatermarkButton() {
  var wmBtn = document.getElementById("ql-remove-watermark");
  if (!wmBtn) return;
  wmBtn.addEventListener("click", async function () {
    var logEl = document.getElementById("ql-log");
    (wmBtn.disabled = true), (wmBtn.textContent = "⏳ Sending...");
    try {
      await deliverPromptToLovable(WATERMARK_PROMPT),
        logEl &&
          ((logEl.className = "ql-log-success"),
          (logEl.innerText =
            "✓ Prompt sent! Wait for Lovable to apply the CSS."));
    } catch (err) {
      logEl &&
        ((logEl.className = "ql-log-error"),
        (logEl.innerText = "✗\x20" + (err.message || err)));
    } finally {
      (wmBtn.disabled = false), (wmBtn.textContent = "Remove Watermark");
    }
  });
}
function showPublishedUrlModal(url) {
  var old = document.getElementById("ql-publish-modal");
  if (old) old.remove();
  var modal = document.createElement("div");
  (modal.id = "ql-publish-modal"),
    (modal.className = "pk-publish-overlay pk-publish-overlay-top"),
    (modal.innerHTML =
      '<div class="pk-publish-modal pk-publish-modal-wide"><div class="pk-publish-emoji">🎉</div><h3>Project Published!</h3><p>Your project is live. Open it from the link below:</p><div class="pk-publish-url-box"><a href="' +
      url +
      '" target="_blank" rel="noopener noreferrer">' +
      url +
      "</a></div>" +
      '<div class="pk-publish-actions"><button id="ql-publish-copy" class="pk-publish-copy">📋 Copy</button>' +
      '<button id="ql-publish-open" class="pk-publish-open">🔗 Open</button>' +
      '</div><button id="ql-publish-close" class="pk-publish-close">Close</button></div>'),
    document.body.appendChild(modal),
    document
      .getElementById("ql-publish-copy")
      .addEventListener("click", function () {
        navigator.clipboard.writeText(url), (this.textContent = "✓ Copied!");
      }),
    document
      .getElementById("ql-publish-open")
      .addEventListener("click", function () {
        window.open(url, "_blank");
      }),
    document
      .getElementById("ql-publish-close")
      .addEventListener("click", function () {
        modal.remove();
      }),
    modal.addEventListener("click", function (ev) {
      if (ev.target === modal) modal.remove();
    });
}
function setupPublishProject() {
  var publishBtn = document.getElementById("ql-publish-project");
  if (!publishBtn) return;
  publishBtn.addEventListener("click", async function () {
    var logEl = document.getElementById("ql-log");
    (publishBtn.disabled = true),
      (publishBtn.textContent = "⏳ Publishing..."),
      await requestLatestTokenFromHook(2500);
    var stored = await new Promise(function (resolve) {
        chrome.storage.local.get(
          ["lovable_projectId", "lovable_token", "ql_license_key"],
          resolve
        );
      }),
      projectId = stored.lovable_projectId || "",
      token = stored.lovable_token || "",
      licenseKey = stored.ql_license_key || "";
    if (!projectId || !token) {
      logEl &&
        ((logEl.className = "ql-log-error"),
        (logEl.innerText = "⚠ Project not synced.")),
        ((publishBtn.disabled = false),
        (publishBtn.textContent = "🌐 Publish Project"));
      return;
    }
    if (token.startsWith("Bearer ")) token = token.slice(7);
    try {
      var body = pkFeatureRequestBody(licenseKey, token, projectId),
        result = await bgFetch(PUBLISH_PROJECT_URL, {
          method: "POST",
          headers: pkFeatureApiHeaders(),
          body: JSON.stringify(body),
          featureUiCompat: true,
        });
      if (result && result.success === false)
        throw new Error(
          result.error_display || result.message || "Publish error"
        );
      logEl &&
        ((logEl.className = "ql-log-success"),
        (logEl.innerText = "✓ Project published!"));
      if (result && result.url) showPublishedUrlModal(result.url);
    } catch (err) {
      logEl &&
        ((logEl.className = "ql-log-error"),
        (logEl.innerText = "✗\x20" + (err.message || err)));
    } finally {
      (publishBtn.disabled = false),
        (publishBtn.textContent = "🌐 Publish Project");
    }
  });
}
function setupEnableCloud() {
  var cloudBtn = document.getElementById("ql-enable-cloud");
  if (!cloudBtn) return;
  cloudBtn.addEventListener("click", async function () {
    var logEl = document.getElementById("ql-log");
    (cloudBtn.disabled = true),
      (cloudBtn.textContent = "⏳ Activating Cloud..."),
      await requestLatestTokenFromHook(2500);
    var stored = await new Promise(function (resolve) {
        chrome.storage.local.get(
          ["lovable_projectId", "lovable_token", "ql_license_key"],
          resolve
        );
      }),
      projectId = stored.lovable_projectId || "",
      token = stored.lovable_token || "",
      licenseKey = stored.ql_license_key || "";
    if (!projectId || !token) {
      logEl &&
        ((logEl.className = "ql-log-error"),
        (logEl.innerText = "⚠ Project not synced.")),
        ((cloudBtn.disabled = false),
        (cloudBtn.textContent = "☁️ Enable Lovable Cloud"));
      return;
    }
    if (token.startsWith("Bearer ")) token = token.slice(7);
    try {
      const extra = {};
      extra.region = "america";
      var body = pkFeatureRequestBody(licenseKey, token, projectId, extra),
        result = await bgFetch(ENABLE_CLOUD_URL, {
          method: "POST",
          headers: pkFeatureApiHeaders(),
          body: JSON.stringify(body),
          featureUiCompat: true,
        });
      if (result && result.success === false)
        throw new Error(
          result.error_display || result.message || "Cloud activation error"
        );
      logEl &&
        ((logEl.className = "ql-log-success"),
        (logEl.innerText =
          "✓\x20" +
          (result && result.message
            ? result.message
            : "Lovable Cloud activated!")));
    } catch (err) {
      logEl &&
        ((logEl.className = "ql-log-error"),
        (logEl.innerText = "✗\x20" + (err.message || err)));
    } finally {
      (cloudBtn.disabled = false),
        (cloudBtn.textContent = "☁️ Enable Lovable Cloud");
    }
  });
}
function qlApplyLicenseApiData(apiData) {
  if (!apiData) return;
  typeof pkResolveLicenseStatus === "function"
    ? (qlLicenseStatus = pkResolveLicenseStatus(apiData))
    : (qlLicenseStatus = apiData.status || qlLicenseStatus),
    Object.prototype.hasOwnProperty.call(apiData, "expires_at") &&
      (qlExpiresAt = apiData.expires_at || null),
    Object.prototype.hasOwnProperty.call(apiData, "activated_at") &&
      (qlActivatedAt = apiData.activated_at || null),
    Object.prototype.hasOwnProperty.call(apiData, "validity_minutes") &&
      (qlValidityMinutes =
        apiData.validity_minutes != null ? apiData.validity_minutes : null);
}
function qlRevokeAndShowLicenseGate(message) {
  chrome.storage.local.get(["ql_license_valid"], function (stored) {
    if (!stored.ql_license_valid) return;
    if (typeof pkInvalidateAssertCache === "function")
      pkInvalidateAssertCache();
    setPkCreditBypass(false);
    var showGate = function () {
      const gateEl = document.getElementById("ql-floating");
      if (gateEl) showLicenseGate(gateEl);
      if (message)
        setTimeout(function () {
          showCustomAlert("Access Denied", message);
        }, 400);
    };
    typeof pkRevokeLicenseStorage === "function"
      ? pkRevokeLicenseStorage().then(showGate)
      : chrome.storage.local.remove(
          [
            "ql_license_valid",
            "ql_license_key",
            "ql_session_id",
            "ql_user_name",
            "ql_expires_at",
            "ql_activated_at",
            "ql_license_status",
            "ql_validity_minutes",
          ],
          showGate
        );
  });
}
function qlHandleLicenseInvalid(info) {
  var reason = info && info.reason;
  if (reason === "expired") {
    handleLicenseExpired();
    return;
  }
  qlRevokeAndShowLicenseGate((info && info.message) || "License not active.");
}
function updateTrialCountdown() {
  if (INTERNAL_LICENSE_MODE) return;
  const countdownEl = document.getElementById("ql-trial-countdown");
  if (!countdownEl) return;
  if (!qlExpiresAt) {
    qlValidityMinutes
      ? ((countdownEl.style.display = "block"),
        (countdownEl.innerHTML =
          '<div class="ql-countdown-row"><span class="ql-countdown-icon">⏳</span><span class="ql-countdown-label">Trial ready:</span><span class="ql-countdown-time">' +
          qlValidityMinutes +
          " min after activation</span></div>"))
      : ((countdownEl.style.display = "none"), (countdownEl.innerHTML = ""));
    return;
  }
  var expiryMs =
    typeof pkParseUtcExpiry === "function"
      ? pkParseUtcExpiry(qlExpiresAt)
      : new Date(qlExpiresAt).getTime();
  if (expiryMs == null || isNaN(expiryMs)) {
    countdownEl.style.display = "none";
    return;
  }
  var activatedMs =
    typeof pkParseUtcExpiry === "function"
      ? pkParseUtcExpiry(qlActivatedAt)
      : qlActivatedAt
      ? new Date(qlActivatedAt).getTime()
      : null;
  if (activatedMs == null || isNaN(activatedMs))
    activatedMs = expiryMs - 3600000;
  var totalMs = Math.max(expiryMs - activatedMs, 60000);
  countdownEl.style.display = "block";
  function tick() {
    const remaining = expiryMs - Date.now();
    if (remaining <= 0) {
      if (!qlExpiryConfirming && typeof pkEnsureActiveLicense === "function") {
        (qlExpiryConfirming = true),
          pkEnsureActiveLicense(true)
            .then(function (renewed) {
              qlExpiryConfirming = false;
              if (renewed && renewed.expires_at) {
                (qlExpiresAt = renewed.expires_at), updateTrialCountdown();
                return;
              }
              handleLicenseExpired();
            })
            ["catch"](function () {
              (qlExpiryConfirming = false), handleLicenseExpired();
            });
        return;
      }
      if (!qlExpiryConfirming) handleLicenseExpired();
      return;
    }
    const days = Math.floor(remaining / 86400000),
      hours = Math.floor((remaining % 86400000) / 3600000),
      mins = Math.floor((remaining % 3600000) / 60000),
      secs = Math.floor((remaining % 60000) / 1000),
      pct = Math.max(0, Math.min(100, (remaining / totalMs) * 100));
    let timeStr = "";
    if (days > 0) timeStr = days + "d\x20" + hours + "h\x20" + mins + "m";
    else {
      if (hours > 0)
        timeStr =
          hours +
          "h\x20" +
          mins +
          "m\x20" +
          String(secs).padStart(2, "0") +
          "s";
      else timeStr = mins + ":" + String(secs).padStart(2, "0");
    }
    const urgentClass = pct < 20 ? " ql-bar-urgent" : "",
      label =
        qlLicenseStatus === "trial" ? "Trial expires in" : "License expires in";
    countdownEl.innerHTML =
      '<div class="ql-countdown-row"><span class="ql-countdown-icon">⏳</span><span class="ql-countdown-label">' +
      label +
      '</span><span class="ql-countdown-time">' +
      timeStr +
      '</span></div><div class="ql-trial-bar"><div class="ql-trial-bar-fill' +
      urgentClass +
      '" style="width:' +
      pct +
      '%"></div></div>';
  }
  tick();
  if (window.qlCountdownInterval) clearInterval(window.qlCountdownInterval);
  window.qlCountdownInterval = setInterval(tick, 1000);
}
function setupMinimize() {
  minBtn = document.getElementById("ql-minimize");
  if (!minBtn) return;
  minBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const panel = document.getElementById("ql-floating");
    if (!panel) return;
    (qlMinimized = !qlMinimized),
      panel.classList.toggle("ql-minimized", qlMinimized),
      (minBtn.textContent = qlMinimized ? "□" : "−"),
      chrome.storage.local.set({ ql_minimized: qlMinimized });
  });
}
function setupDarkMode() {
  darkBtn = document.querySelector('.ql-icon-btn[title="Theme"]');
  if (!darkBtn) return;
  darkBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const root = document.getElementById("ql-floating");
    if (!root) return;
    const isDark = root.classList.toggle("ql-light"),
      toStore = {};
    (toStore.ql_dark_mode = !isDark), chrome.storage.local.set(toStore);
  });
}
function setupModoPlano() {
  toggle = document.getElementById("ql-modo-plano");
  if (!toggle) return;
  migratePlanModeStorageKeys(function (enabled) {
    toggle.checked = enabled;
  }),
    toggle.addEventListener("change", () => {
      writePlanModeToStorage(toggle.checked);
      if (toggle.checked) showModoPlanoAlert();
    });
}
function showModoPlanoAlert() {
  old = document.querySelector(".ql-modo-plano-overlay");
  if (old) old.remove();
  const overlay = document.createElement("div");
  (overlay.className = "ql-modo-plano-overlay"),
    (overlay.innerHTML =
      '<div class="ql-modo-plano-modal"><div class="ql-modo-plano-icon">⚠️</div><div class="ql-modo-plano-title">Attention — Plan Mode</div><div class="ql-modo-plano-body"><strong>Plan Mode</strong> (Think mode in Lovable) may use credits while planning. Use in moderation, then send builds through the extension with Plan Mode off.</div><div class="ql-modo-plano-steps"><div class="ql-modo-plano-step"><span class="ql-modo-plano-step-num">1</span><span class="ql-modo-plano-step-text">Enable <strong>Plan Mode</strong> and send your prompt through the extension.</span></div><div class="ql-modo-plano-step"><span class="ql-modo-plano-step-num">2</span><span class="ql-modo-plano-step-text">Lovable will generate a plan. <strong>Do not click Approve</strong> in Lovable.</span></div><div class="ql-modo-plano-step"><span class="ql-modo-plano-step-num">3</span><span class="ql-modo-plano-step-text"><strong>Copy the plan</strong> and paste it into the extension prompt.</span></div><div class="ql-modo-plano-step"><span class="ql-modo-plano-step-num">4</span><span class="ql-modo-plano-step-text"><strong>Turn off Plan Mode</strong> and send through the extension. No extra credits.</span></div></div><div class="ql-modo-plano-check"><input type="checkbox" id="ql-modo-plano-dismiss" /><label for="ql-modo-plano-dismiss">Do not show again</label></div><button class="ql-modo-plano-btn" id="ql-modo-plano-ok">Got it!</button></div>');
  const container = document.getElementById("ql-floating");
  if (container) container.appendChild(overlay);
  else document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("ql-modo-plano-visible"));
  const close = () => {
      overlay.classList.remove("ql-modo-plano-visible"),
        setTimeout(() => overlay.remove(), 180);
    },
    okBtn = overlay.querySelector("#ql-modo-plano-ok");
  okBtn &&
    okBtn.addEventListener("click", () => {
      (dismissChk = overlay.querySelector("#ql-modo-plano-dismiss")),
        (toStore = {});
      (toStore.ql_modo_plano_alert_dismissed = true),
        (dismissChk && dismissChk.checked && chrome.storage.local.set(toStore),
        close());
    }),
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) close();
    });
}
function setupShield() {
  shieldBtn = document.getElementById("ql-shield-btn");
  if (!shieldBtn) return;
  chrome.storage.local.get(["ql_shield_active"], (stored) => {
    if (stored.ql_shield_active === true) {
      (qlShieldActive = true), shieldBtn.classList.add("ql-shield-active");
      const shieldLabel = document.getElementById("ql-shield-label");
      if (shieldLabel) shieldLabel.textContent = "Disable Shield";
      injectShieldOverlay();
    }
  }),
    shieldBtn.addEventListener("click", () => {
      (qlShieldActive = !qlShieldActive),
        chrome.storage.local.set({ ql_shield_active: qlShieldActive });
      const shieldText = document.getElementById("ql-shield-label");
      if (qlShieldActive) {
        shieldBtn.classList.add("ql-shield-active");
        if (shieldText) shieldText.textContent = "Disable Shield";
        injectShieldOverlay(),
          showCustomAlert(
            "Shield Enabled 🛡️",
            "The Lovable input is locked. Use the extension to send prompts."
          );
      } else {
        shieldBtn.classList.remove("ql-shield-active");
        if (shieldText) shieldText.textContent = "Enable Shield";
        removeShieldOverlay(),
          showCustomAlert(
            "Shield Disabled",
            "The Lovable input is unlocked again."
          );
      }
    });
}
function injectShieldOverlay() {
  if (document.getElementById("ql-shield-overlay")) return;
  const form = document.querySelector("form#chat-input");
  if (!form) {
    setTimeout(injectShieldOverlay, 1000);
    return;
  }
  const pos = getComputedStyle(form).position;
  pos === "static" && (form.style.position = "relative");
  const overlay = document.createElement("div");
  (overlay.id = "ql-shield-overlay"),
    (overlay.className = "ql-shield-overlay"),
    (overlay.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' +
      "</svg>" +
      '<span class="ql-shield-overlay-text">🛡️ Protected by LovaPilot</span>' +
      '<span class="ql-shield-overlay-sub">Use the extension to send prompts</span>'),
    overlay.addEventListener(
      "click",
      (ev) => {
        ev.preventDefault(),
          ev.stopPropagation(),
          ev.stopImmediatePropagation();
      },
      true
    ),
    overlay.addEventListener(
      "mousedown",
      (ev) => {
        ev.preventDefault(),
          ev.stopPropagation(),
          ev.stopImmediatePropagation();
      },
      true
    ),
    overlay.addEventListener(
      "keydown",
      (ev) => {
        ev.preventDefault(), ev.stopPropagation();
      },
      true
    ),
    form.appendChild(overlay);
  const editable = form.querySelectorAll(
    "input, button, textarea, [contenteditable]"
  );
  editable.forEach((el) => {
    if (el.id !== "ql-shield-overlay") {
      (el.dataset.qlShieldDisabled = el.disabled || ""),
        (el.dataset.qlShieldTabindex = el.getAttribute("tabindex") || ""),
        el.setAttribute("tabindex", "-1");
      if (el.tagName !== "DIV") el.disabled = true;
      el.contentEditable === "true" &&
        ((el.contentEditable = "false"),
        (el.dataset.qlShieldEditable = "true"));
    }
  });
}
function removeShieldOverlay() {
  overlay = document.getElementById("ql-shield-overlay");
  if (overlay) overlay.remove();
  const form = document.querySelector("form#chat-input");
  if (!form) return;
  const disabledEls = form.querySelectorAll("[data-ql-shield-disabled]");
  disabledEls.forEach((el) => {
    flag = el.dataset.qlShieldDisabled;
    if (flag === "true") el.disabled = true;
    else {
      if (flag === "" || flag === "false") el.disabled = false;
    }
    delete el.dataset.qlShieldDisabled;
    const tabIndex = el.dataset.qlShieldTabindex;
    if (tabIndex) el.setAttribute("tabindex", tabIndex);
    else el.removeAttribute("tabindex");
    delete el.dataset.qlShieldTabindex,
      el.dataset.qlShieldEditable === "true" &&
        ((el.contentEditable = "true"), delete el.dataset.qlShieldEditable);
  });
}
let qlHbConflictCount = 0;

function startHeartbeat(licenseKey) {
  if (INTERNAL_LICENSE_MODE) return;
  if (qlHeartbeatInterval) clearInterval(qlHeartbeatInterval);
  (qlHbConflictCount = 0),
    (qlHeartbeatInterval = setInterval(async () => {
      try {
        const body = {};
        (body.license_key = licenseKey),
          (body.session_id = qlSessionId),
          (body.heartbeat = true),
          (body.device_id = qlDeviceId),
          (body.max_devices = 2),
          (body.device_limit = 2),
          (body.allowed_devices = 2);
        const result = await bgFetch(VALIDATE_URL, {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(body),
        });
        if (!result.valid) {
          var lockout =
            typeof pkShouldLockoutFromValidation === "function"
              ? pkShouldLockoutFromValidation(result, qlHbConflictCount)
              : {
                  lock: true,
                  conflictCount: qlHbConflictCount,
                  message: result.message,
                };
          qlHbConflictCount = lockout.conflictCount;
          if (lockout.lock) {
            clearInterval(qlHeartbeatInterval);
            if (typeof pkInvalidateAssertCache === "function")
              pkInvalidateAssertCache();
            qlHandleLicenseInvalid({
              reason: result.reason || lockout.reason,
              message: lockout.message || result.message,
            });
          }
          return;
        }
        qlHbConflictCount = 0;
        if (result.user_name)
          qlUserName = normalizeLicenseUserName(result.user_name);
        qlApplyLicenseApiData(result),
          (qlOnlineCount = result.online_count || 0),
          chrome.storage.local.set(
            Object.assign(
              { ql_user_name: qlUserName },
              typeof pkLicenseStoragePatch === "function"
                ? pkLicenseStoragePatch(result)
                : {}
            )
          );
        const onlineEl = document.getElementById("ql-online-count");
        if (onlineEl) onlineEl.textContent = qlOnlineCount;
        const userNameEl = document.querySelector(".ql-profile-name");
        if (userNameEl && result.user_name) userNameEl.textContent = qlUserName;
        updateTrialCountdown();
      } catch (err) {
        console.warn("[QL] Heartbeat error", err);
      }
    }, 60000));
}
let qlExpiredHandled = false;
function handleLicenseExpired() {
  if (INTERNAL_LICENSE_MODE) return;
  if (qlExpiredHandled) return;
  qlExpiredHandled = true;
  if (typeof pkInvalidateAssertCache === "function") pkInvalidateAssertCache();
  if (qlHeartbeatInterval) clearInterval(qlHeartbeatInterval);
  if (window.qlCountdownInterval) clearInterval(window.qlCountdownInterval);
  const overlay = document.createElement("div");
  (overlay.className = "ql-sweetalert-overlay"),
    (overlay.innerHTML = templateExpiredOverlay());
  const container = document.getElementById("ql-floating");
  if (container) container.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("ql-sweetalert-visible"));
  const payBtn = overlay.querySelector("#ql-sweetalert-renew");
  payBtn &&
    payBtn.addEventListener("click", () => {
      overlay.remove();
      if (container) showPaymentUI(container);
    });
  const dismissBtn = overlay.querySelector("#ql-sweetalert-close");
  dismissBtn &&
    dismissBtn.addEventListener("click", () => {
      overlay.classList.remove("ql-sweetalert-visible"),
        setTimeout(() => {
          overlay.remove(),
            setPkCreditBypass(false),
            chrome.storage.local.remove(
              [
                "ql_license_valid",
                "ql_license_key",
                "ql_session_id",
                "ql_user_name",
                "ql_expires_at",
                "ql_activated_at",
                "ql_license_status",
                "ql_validity_minutes",
              ],
              () => {
                if (container) showLicenseGate(container);
              }
            );
        }, 300);
    });
}
async function showPaymentUI(container, pkg) {
  if (pkg) {
    showCheckoutScreen(container, pkg);
    return;
  }
  (container.innerHTML = templatePaymentUI(qlMinimized)),
    setupMinimize(),
    setupDrag(),
    setupResize(),
    document.querySelectorAll(".ql-brl-buy").forEach(function (buyBtn) {
      buyBtn.addEventListener("click", function () {
        var pkgCard = buyBtn.closest(".ql-pkg-brl");
        if (!pkgCard) return;
        var brlIdx = parseInt(pkgCard.getAttribute("data-brl-idx"), 10) || 0,
          plan = QL_BRL_PLANS[brlIdx];
        if (!plan) return;
        var msg =
            "Hello! 👋 I am interested in the *" +
            plan.name +
            "* plan for LovaPilot (R$ " +
            plan.price +
            " - " +
            plan.period +
            ").\n\nOpen Discord support for more information.",
          discordUrl = DISCORD_URL;
        window.open(discordUrl, "_blank", "noopener,noreferrer");
      });
    });
  const backBtn = document.getElementById("ql-pay-back");
  backBtn &&
    backBtn.addEventListener("click", () => {
      chrome.storage.local.get(["ql_license_valid"], (stored) => {
        if (INTERNAL_LICENSE_MODE || stored.ql_license_valid)
          showMainUI(container);
        else showLicenseGate(container);
      });
    });
  try {
    const headers = {};
    headers.apikey = API_KEY;
    const packages = await bgFetch(PACKAGES_URL, {
        method: "GET",
        headers: headers,
      }),
      listEl = document.getElementById("ql-packages-list");
    if (!listEl) return;
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      listEl.innerHTML =
        '<div class="ql-pay-loading">Open Discord Support</div>';
      return;
    }
    (listEl.innerHTML = packages
      .map((pkg) => templatePackageCard(pkg))
      ["join"]("")),
      listEl.querySelectorAll(".ql-pkg-card").forEach((card) => {
        card
          .querySelector(".ql-pkg-select-btn")
          .addEventListener("click", () => {
            pkgInfo = {
              id: card.getAttribute("data-pkg-id"),
              name: card.getAttribute("data-pkg-name"),
              price: card.getAttribute("data-pkg-price"),
            };
            showCheckoutScreen(container, pkgInfo);
          });
      });
  } catch (err) {
    console.error("[QL] Package load error:", err);
    const listEl = document.getElementById("ql-packages-list");
    if (listEl)
      listEl.innerHTML =
        '<div class="ql-pay-loading">Open Discord Support</div>';
  }
}
function showCheckoutScreen(container, pkg) {
  (container.innerHTML = templateCheckoutScreen(pkg, qlMinimized)),
    setupMinimize(),
    setupDrag(),
    setupResize();
  let method = "mpesa";
  const backBtn = document.getElementById("ql-checkout-back");
  backBtn && backBtn.addEventListener("click", () => showPaymentUI(container)),
    document.querySelectorAll(".ql-method-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".ql-method-btn")
          .forEach((b) => b.classList.remove("ql-method-active")),
          btn.classList.add("ql-method-active"),
          (method = btn.getAttribute("data-method"));
        const hint = document.getElementById("ql-phone-hint");
        if (hint)
          hint.textContent =
            method === "mpesa" ? "M-Pesa: 84 or 85" : "e-Mola: 86 or 87";
      });
    });
  const confirmBtn = document.getElementById("ql-confirm-pay");
  confirmBtn &&
    confirmBtn.addEventListener("click", async () => {
      (phoneInput = document.getElementById("ql-pay-phone")),
        (digits =
          phoneInput && phoneInput.value
            ? phoneInput.value.replace(/\D/g, "")
            : ""),
        (payLog = document.getElementById("ql-pay-log"));
      if (!phoneInput) {
        window.open(DISCORD_URL, "_blank", "noopener,noreferrer"),
          payLog &&
            ((payLog.className = "ql-pay-log ql-pay-info"),
            (payLog.textContent = "Opening Discord support..."));
        return;
      }
      if (digits.length !== 9) {
        payLog &&
          ((payLog.className = "ql-pay-log ql-pay-error"),
          (payLog.textContent = "The number must have 9 digits."));
        return;
      }
      const prefix = digits.substring(0, 2);
      if (method === "mpesa" && !["84", "85"].includes(prefix)) {
        payLog &&
          ((payLog.className = "ql-pay-log ql-pay-error"),
          (payLog.textContent = "M-Pesa: use 84 or 85."));
        return;
      }
      if (method === "emola" && !["86", "87"].includes(prefix)) {
        payLog &&
          ((payLog.className = "ql-pay-log ql-pay-error"),
          (payLog.textContent = "e-Mola: use 86 or 87."));
        return;
      }
      (confirmBtn.disabled = true),
        (confirmBtn.textContent = "⏳ Processing..."),
        payLog &&
          ((payLog.className = "ql-pay-log ql-pay-info"),
          (payLog.textContent = "Sending payment request..."));
      try {
        const stored = await new Promise((resolve) =>
            chrome.storage.local.get(["ql_license_key"], resolve)
          ),
          licenseKey = stored.ql_license_key || "",
          result = await bgFetch(EXT_PAYMENT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: API_KEY },
            body: JSON.stringify({
              packageId: pkg.id,
              numero: digits,
              metodo: method,
              license_key: licenseKey || undefined,
            }),
          });
        if (result && result.status === "sucesso") {
          const bodyEl = document.getElementById("ql-body");
          if (bodyEl) {
            bodyEl.innerHTML = templatePaymentSuccess(result.license_key);
            const copyBtn = document.getElementById("ql-copy-key");
            copyBtn &&
              copyBtn.addEventListener("click", () => {
                navigator.clipboard
                  .writeText(result.license_key)
                  .then(() => {
                    (copyBtn.textContent = "✅ Copied!"),
                      setTimeout(() => {
                        copyBtn.textContent = "📋 Copy Key";
                      }, 2000);
                  })
                  ["catch"](() => {
                    newKeyEl = document.getElementById("ql-new-key");
                    if (newKeyEl) {
                      const range = document.createRange();
                      range.selectNodeContents(newKeyEl),
                        window.getSelection().removeAllRanges(),
                        window.getSelection().addRange(range);
                    }
                    copyBtn.textContent = "Selected — Ctrl+C";
                  });
              });
            const activateBtn = document.getElementById("ql-activate-key");
            activateBtn &&
              activateBtn.addEventListener("click", () => {
                chrome.storage.local.set(
                  {
                    ql_license_valid: true,
                    ql_license_key: result.license_key,
                    ql_expires_at: result.expires_at || null,
                    ql_license_status: "active",
                    ql_session_id: null,
                  },
                  () => {
                    (qlExpiresAt = result.expires_at || null),
                      (qlLicenseStatus = "active"),
                      (qlExpiredHandled = false),
                      showMainUI(container),
                      startHeartbeat(result.license_key);
                  }
                );
              });
          }
        } else {
          const errMsg =
            result && result.error
              ? result.error
              : "Discord Support failed. Please try again.";
          payLog &&
            ((payLog.className = "ql-pay-log ql-pay-error"),
            (payLog.textContent = "✗\x20" + errMsg)),
            (confirmBtn.disabled = false),
            (confirmBtn.textContent = "Open Discord Support");
        }
      } catch (err) {
        payLog &&
          ((payLog.className = "ql-pay-log ql-pay-error"),
          (payLog.textContent =
            "✗\x20" + (err.message || "Connection error."))),
          (confirmBtn.disabled = false),
          (confirmBtn.textContent = "Open Discord Support");
      }
    });
}
if (typeof SIDE_PANEL_ONLY !== "undefined" && SIDE_PANEL_ONLY)
  try {
    const obj = {};
    (obj.ql_sidebar_mode = true), chrome.storage.local.set(obj);
  } catch (err) {}
else {
  function qlBootstrap() {
    if (document.getElementById("ql-floating")) return;
    if (!document.body) {
      var observer = new MutationObserver(function () {
        document.body && (observer.disconnect(), qlBootstrap());
      });
      const obsOpts = {};
      (obsOpts.childList = true),
        observer.observe(document.documentElement, obsOpts);
      return;
    }
    createUI();
  }
  document.readyState === "complete" || document.readyState === "interactive"
    ? setTimeout(qlBootstrap, 50)
    : document.addEventListener("DOMContentLoaded", function () {
        setTimeout(qlBootstrap, 50);
      });
  var qlRetryCount = 0,
    qlRetryDelays = [300, 600, 1000, 1500, 2000, 3000, 4000, 5000];
  function qlRetryInit() {
    if (typeof SIDE_PANEL_ONLY !== "undefined" && SIDE_PANEL_ONLY) return;
    if (
      document.getElementById("ql-floating") ||
      qlRetryCount >= qlRetryDelays.length
    )
      return;
    var delay = qlRetryDelays[qlRetryCount];
    qlRetryCount++,
      setTimeout(function () {
        !document.getElementById("ql-floating") && document.body && createUI(),
          qlRetryInit();
      }, delay);
  }
  qlRetryInit(),
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (typeof SIDE_PANEL_ONLY !== "undefined" && SIDE_PANEL_ONLY) return;
      if (changes.ql_sidebar_mode) {
        if (changes.ql_sidebar_mode.newValue === true) {
          const floatingEl = document.getElementById("ql-floating");
          floatingEl &&
            ((floatingEl.style.transition =
              "opacity 0.3s ease, transform 0.3s ease"),
            (floatingEl.style.opacity = "0"),
            (floatingEl.style.transform = "scale(0.95)"),
            setTimeout(() => floatingEl.remove(), 350));
        } else
          changes.ql_sidebar_mode.newValue === false &&
            setTimeout(() => {
              _buildFloatingUI(),
                setTimeout(() => {
                  floatingEl = document.getElementById("ql-floating");
                  floatingEl &&
                    ((floatingEl.style.opacity = "0"),
                    (floatingEl.style.transform =
                      "scale(0.95) translateX(20px)"),
                    requestAnimationFrame(() => {
                      (floatingEl.style.transition =
                        "opacity 0.4s ease, transform 0.4s ease"),
                        (floatingEl.style.opacity = "1"),
                        (floatingEl.style.transform = "scale(1) translateX(0)");
                    }));
                }, 50);
            }, 100);
      }
    });
}
function updateSyncStatus() {
  chrome.runtime.sendMessage(
    {
      action: "syncLovableAuth",
      tabUrl: location.href,
      projectId: projectIdFromPage(),
    },
    function () {
      if (chrome.runtime.lastError) {
      }
      try {
        window.postMessage({ type: "lovableRequestToken" }, "*");
      } catch (err) {}
      chrome.storage.local.get(
        ["lovable_projectId", "lovable_token"],
        (stored) => {
          syncEl = document.getElementById("ql-sync-status");
          if (!syncEl) return;
          var token = stored.lovable_token || "";
          if (stored.lovable_projectId && token && isTokenFresh(token)) {
            syncEl.className = "ql-sync-status ql-sync-ok";
            const shortId = stored.lovable_projectId.substring(0, 6);
            syncEl.innerHTML =
              '<span class="ql-sync-text">✅ Synced! Project: ' +
              shortId +
              "...</span>";
          } else
            stored.lovable_projectId && token
              ? ((syncEl.className = "ql-sync-status ql-sync-waiting"),
                (syncEl.innerHTML =
                  '<span class="ql-sync-text">⚠ Log in on lovable.dev</span>'))
              : ((syncEl.className = "ql-sync-status ql-sync-waiting"),
                (syncEl.innerHTML =
                  '<span class="ql-sync-text">⏳ Waiting for sync...</span>'));
        }
      );
    }
  );
}
function setupStorageWatch() {
  chrome.storage.onChanged.addListener((changes) => {
    (changes.lovable_projectId || changes.lovable_token) && updateSyncStatus();
  });
}

function requestLatestTokenFromHook(timeoutMs = 1200) {
  return new Promise((resolve) => {
    let settled = false;
    function finish(done) {
      if (settled) return;
      (settled = true),
        clearTimeout(timerId),
        chrome.storage.onChanged.removeListener(onTokenChanged),
        resolve(done);
    }
    function onTokenChanged(message, area) {
      if (area !== "local") return;
      message.lovable_token && message.lovable_token.newValue && finish(true);
    }
    const timerId = setTimeout(() => finish(false), Math.max(300, timeoutMs));
    chrome.storage.onChanged.addListener(onTokenChanged);
    try {
      window.postMessage({ type: "lovableRequestToken" }, "*"),
        setTimeout(
          () => window.postMessage({ type: "lovableRequestToken" }, "*"),
          120
        );
    } catch (err) {
      finish(false);
    }
  });
}
function loadChatHistory(cb) {
  chrome.storage.local.get([QL_HISTORY_KEY], (data) => {
    (qlChatHistory = data[QL_HISTORY_KEY] || []), updateHistoryBadge();
    if (cb) cb();
  });
}
function saveChatHistory() {
  if (qlChatHistory.length > QL_MAX_HISTORY)
    qlChatHistory = qlChatHistory.slice(-QL_MAX_HISTORY);
  const obj = {};
  (obj[QL_HISTORY_KEY] = qlChatHistory), chrome.storage.local.set(obj);
}
function addToChatHistory(text, status) {
  qlChatHistory.push({
    text: text,
    timestamp: new Date().toISOString(),
    status: status || "ok",
  }),
    saveChatHistory(),
    updateHistoryBadge();
}
function updateHistoryBadge() {
  badge = document.getElementById("ql-history-badge");
  if (!badge) return;
  qlChatHistory.length > 0
    ? ((badge.textContent = qlChatHistory.length),
      (badge.style.display = "inline-flex"))
    : (badge.style.display = "none");
}
function formatChatDate(ts) {
  var d = new Date(ts),
    now = new Date(),
    today = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    dayOf = new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    diff = (today - dayOf) / 86400000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)
    return [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][d.getDay()];
  return d.toLocaleDateString("en-US");
}
function formatChatTime(ts) {
  var d = new Date(ts);
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}
function renderHistoryView() {
  content = document.getElementById("ql-tab-content");
  if (!content) return;
  if (!qlChatHistory.length) {
    content.innerHTML =
      '<div class="ql-chat-empty"><div style="font-size:28px;margin-bottom:8px">💬</div><div style="font-size:13px;font-weight:600;color:var(--ql-text-primary,#f4f4f5)">No messages</div><div style="font-size:11px;color:var(--ql-text-muted,#71717a);margin-top:4px">Your sent prompts will appear here.</div></div>';
    return;
  }
  let html = '<div class="ql-chat-messages">',
    lastDate = "";
  for (let i = 0; i < qlChatHistory.length; i++) {
    const entry = qlChatHistory[i],
      dateStr = formatChatDate(entry.timestamp);
    dateStr !== lastDate &&
      ((html +=
        '<div class="ql-chat-date-divider"><span class="ql-chat-date-label">' +
        dateStr +
        "</span></div>"),
      (lastDate = dateStr));
    const statusClass =
        entry.status === "error" ? "ql-chat-status-err" : "ql-chat-status-ok",
      statusText = entry.status === "error" ? "✗ Error" : "✓ Sent",
      textHtml =
        entry.text.length > 300
          ? escapeHtml(entry.text.substring(0, 300)) + "…"
          : escapeHtml(entry.text);
    html +=
      '<div class="ql-chat-bubble" title="' +
      escapeHtml(entry.text) +
      "\x22>" +
      textHtml +
      '<div class="ql-chat-meta"><span class="' +
      statusClass +
      "\x22>" +
      statusText +
      '</span><span class="ql-chat-time">' +
      formatChatTime(entry.timestamp) +
      "</span></div></div>";
  }
  (html += "</div>"),
    (html +=
      '<div class="ql-chat-actions"><span class="ql-chat-count">' +
      qlChatHistory.length +
      " message" +
      (qlChatHistory.length === 1 ? "" : "s") +
      '</span><button class="ql-chat-clear" id="ql-chat-clear">🗑 Clear</button></div>'),
    (content.innerHTML = html);
  const msgsEl = content.querySelector(".ql-chat-messages");
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
  const clearBtn = document.getElementById("ql-chat-clear");
  clearBtn &&
    clearBtn.addEventListener("click", () => {
      (qlChatHistory = []),
        saveChatHistory(),
        updateHistoryBadge(),
        renderHistoryView();
    });
}
function renderPromptView() {
  contentEl = document.getElementById("ql-tab-content");
  if (!contentEl) return;
  (contentEl.innerHTML =
    '<textarea id="ql-msg" rows="3" placeholder="Type your command..." spellcheck="false"></textarea><div id="ql-attach-preview" class="ql-attach-preview" style="display:none"></div><div class="ql-action-bar"><div class="ql-action-left">' +
    '<label class="ql-toggle"><input type="checkbox" id="ql-modo-plano"><span class="ql-toggle-slider"></span></label>' +
    '<span class="ql-toggle-label-inline">Plan</span></div><div class="ql-action-center"><button id="ql-attach-btn" class="ql-attach-btn" title="Attach file (max. 10)">📎</button><button id="ql-optimize-btn" class="ql-tool-btn" title="Optimize with AI">' +
    SVG_ICONS.sparkles +
    '</button><button id="ql-speech-btn" class="ql-tool-btn" title="Voice to text">' +
    SVG_ICONS.mic +
    '</button></div><div class="ql-action-right-send">' +
    '<button id="ql-send" class="ql-send-btn">Send</button>' +
    '</div></div><input type="file" id="ql-file-input" multiple style="display:none" accept="*/*"><div id="ql-log"></div><div class="ql-shortcuts-section"><span class="ql-shortcuts-title">QUICK SHORTCUTS</span><div class="ql-shortcuts-grid" id="ql-chips"></div></div><button id="ql-remove-watermark" class="ql-watermark-btn">Remove Watermark</button><button id="ql-shield-btn" class="ql-shield-btn"><span id="ql-shield-label">Enable Shield</span></button>' +
    '<button id="ql-native-chat-btn" class="ql-native-chat-btn">' +
    SVG_ICONS.msgSquare +
    " Use Native Chat</button>" +
    '<button id="ql-download-project" class="ql-watermark-btn sp-btn-feature sp-btn-download">Download Source Code</button>' +
    '<button id="ql-quick-init" class="ql-watermark-btn sp-btn-feature sp-btn-quick-init">Create New Project</button><button id="ql-publish-project" class="ql-watermark-btn sp-btn-feature sp-btn-publish">🌐 Publish Project</button><button id="ql-enable-cloud" class="ql-watermark-btn sp-btn-feature sp-btn-cloud">☁️ Enable Lovable Cloud</button><div id="ql-download-status" style="display:none"></div>'),
    setupSend(),
    setupSuggestionChips(),
    setupWatermarkButton(),
    setupOptimize(),
    setupSpeech(),
    setupModoPlano(),
    setupFileAttachment(),
    setupShield(),
    setupNativeChatButton(),
    setupClipboardPaste(),
    setupDownloadProject(),
    setupCreateProject(),
    setupPublishProject(),
    setupEnableCloud();
}
function setupTabs() {
  tabs = document.querySelectorAll(".ql-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabName = tab.getAttribute("data-tab");
      (qlActiveTab = tabName),
        document
          .querySelectorAll(".ql-tab")
          .forEach((t) =>
            t.classList.toggle(
              "ql-tab-active",
              t.getAttribute("data-tab") === tabName
            )
          ),
        tabName === "history"
          ? loadChatHistory(() => renderHistoryView())
          : renderPromptView();
    });
  });
}
const MAX_FILES = 10,
  MAX_FILE_SIZE = 20971520;
let qlAttachedFiles = [];
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + "\x20B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
function isImageType(type) {
  return ["image/png", "image/jpeg", "image/webp"].includes(type);
}
async function compressImage(file) {
  return new Promise((resolve) => {
    (img = new Image()), (url = URL.createObjectURL(file));
    (img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1280;
      let w = img.width,
        h = img.height;
      if (w > max || h > max) {
        const ratio = Math.min(max / w, max / h);
        (w = Math.round(w * ratio)), (h = Math.round(h * ratio));
      }
      const canvas = document.createElement("canvas");
      (canvas.width = w), (canvas.height = h);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const mime = file.type === "image/png" ? "image/png" : "image/jpeg",
        quality = file.type === "image/png" ? undefined : 0;
      canvas.toBlob(
        (blob) => {
          fallback = {};
          (fallback.file = file), (fallback.previewUrl = null);
          if (!blob) return resolve(fallback);
          const opts = {};
          opts.type = mime;
          const newFile = new File([blob], file.name, opts),
            previewUrl = URL.createObjectURL(blob),
            result = {};
          (result.file = newFile),
            (result.previewUrl = previewUrl),
            resolve(result);
        },
        mime,
        quality
      );
    }),
      (img.onerror = () => {
        URL.revokeObjectURL(url), resolve({ file: file, previewUrl: null });
      }),
      (img.src = url);
  });
}
function decodeJwtUserId(token) {
  payload = decodeJwtPayload(token);
  if (!payload || typeof payload !== "object") return null;
  return payload.sub || payload.user_id || null;
}
async function uploadFileDirect(file, token) {
  fileId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now());
  return new Promise(function (resolve, reject) {
    reader = new FileReader();
    (reader.onloadend = function () {
      resolve({
        file_id: fileId,
        file_name: file.name || "file",
        public_url: reader.result,
      });
    }),
      (reader.onerror = function () {
        reject(new Error("Failed to read file as Data URL"));
      }),
      reader.readAsDataURL(file);
  });
}
function renderAttachPreview() {
  attachPreview = document.getElementById("ql-attach-preview");
  if (!attachPreview) return;
  if (qlAttachedFiles.length === 0) {
    (attachPreview.style.display = "none"), (attachPreview.innerHTML = "");
    return;
  }
  (attachPreview.style.display = "flex"),
    (attachPreview.innerHTML = qlAttachedFiles
      .map((f, idx) => {
        (previewHtml = f.previewUrl
          ? '<img class="ql-attach-thumb" src="' + f.previewUrl + '" alt="">'
          : '<div class="ql-attach-icon">📄</div>'),
          (spinHtml = f.uploading ? " ql-attach-uploading" : "");
        return (
          '<div class="ql-attach-item' +
          spinHtml +
          '" data-idx="' +
          idx +
          "\x22>" +
          previewHtml +
          '<div class="ql-attach-info"><span class="ql-attach-name" title="' +
          escapeHtml(f.file_name) +
          "\x22>" +
          escapeHtml(f.file_name) +
          '</span><span class="ql-attach-size">' +
          escapeHtml(f.sizeLabel) +
          "</span></div>" +
          '<button class="ql-attach-remove" data-idx="' +
          idx +
          '">✕</button>' +
          "</div>"
        );
      })
      .join("")),
    attachPreview.querySelectorAll(".ql-attach-remove").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const idx = parseInt(el.getAttribute("data-idx"));
        qlAttachedFiles[idx] &&
          qlAttachedFiles[idx].previewUrl &&
          URL.revokeObjectURL(qlAttachedFiles[idx].previewUrl),
          qlAttachedFiles.splice(idx, 1),
          renderAttachPreview();
      });
    });
}
function setupFileAttachment() {
  (attachBtn = document.getElementById("ql-attach-btn")),
    (fileInput = document.getElementById("ql-file-input"));
  if (!attachBtn || !fileInput) return;
  attachBtn.addEventListener("click", () => {
    if (qlAttachedFiles.length >= MAX_FILES) {
      showCustomAlert("Limit", "Maximum of " + MAX_FILES + " files.");
      return;
    }
    fileInput.click();
  }),
    fileInput.addEventListener("change", async () => {
      files = Array.from(fileInput.files || []);
      fileInput.value = "";
      if (!files.length) return;
      const stored = await new Promise((resolve) =>
        chrome.storage.local.get(["lovable_token"], resolve)
      );
      let token = stored.lovable_token || "";
      if (!token) {
        showCustomAlert("Error", "Token not captured. Browse Lovable to sync.");
        return;
      }
      if (token.startsWith("Bearer ")) token = token.slice(7);
      for (const f of files) {
        if (qlAttachedFiles.length >= MAX_FILES) {
          showCustomAlert(
            "Limit",
            "Maximum of " + MAX_FILES + " files reached."
          );
          break;
        }
        if (f.size > MAX_FILE_SIZE) {
          showCustomAlert("Large file", f.name + " exceeds 20MB.");
          continue;
        }
        let fileToUse = f,
          previewUrl = null;
        if (isImageType(f.type)) {
          const compressed = await compressImage(f);
          (fileToUse = compressed.file), (previewUrl = compressed.previewUrl);
        }
        const isImg = isImageType(fileToUse.type),
          idx = qlAttachedFiles.length;
        qlAttachedFiles.push({
          file_id: null,
          file_name: f.name,
          previewUrl: previewUrl,
          file_type: fileToUse.type,
          sizeLabel: formatFileSize(fileToUse.size),
          uploading: true,
          rawFile: fileToUse,
        }),
          renderAttachPreview();
        try {
          const uploaded = await uploadFileDirect(fileToUse, token);
          (qlAttachedFiles[idx].file_id = uploaded.file_id),
            (qlAttachedFiles[idx].public_url = uploaded.public_url),
            (qlAttachedFiles[idx].uploading = false),
            renderAttachPreview();
        } catch (err) {
          console.warn(
            "[QL Upload] failed to upload to Supabase Storage:",
            err.message
          ),
            (qlAttachedFiles[idx].uploading = false),
            (qlAttachedFiles[idx].uploadFailed = true),
            renderAttachPreview(),
            showCustomAlert(
              "Upload Error",
              "Could not upload the image: " + (err.message || "unknown error")
            );
        }
      }
    });
}
async function deliverPromptToLovable(prompt, files) {
  if (typeof window.__pkDeliverPrompt === "function")
    return window.__pkDeliverPrompt(prompt, files);
  throw new Error(
    "Extension send bridge not ready. Refresh your Lovable project tab and try again."
  );
}
function setupSend() {
  sendBtn = document.getElementById("ql-send");
  if (!sendBtn) return;
  if (sendBtn.dataset.qlSendBound === "1") return;
  (sendBtn.dataset.qlSendBound = "1"),
    sendBtn.addEventListener("click", async () => {
      var msgInput = document.getElementById("ql-msg");
      const text = msgInput ? (msgInput.value || "").trim() : "",
        logEl = document.getElementById("ql-log");
      if (!text) {
        logEl &&
          ((logEl.className = "ql-log-error"),
          (logEl.innerText = "⚠ Empty prompt"));
        return;
      }
      const stored = await new Promise((resolve) => {
          chrome.storage.local.get(
            ["lovable_projectId", "ql_license_key"],
            resolve
          );
        }),
        projectId = stored.lovable_projectId || projectIdFromPage() || "",
        licenseKey = stored.ql_license_key || "";
      if (!projectId) {
        logEl &&
          ((logEl.className = "ql-log-error"),
          (logEl.innerText =
            "⚠ Open lovable.dev on your project and wait for sync."));
        return;
      }
      var teamKey = resolveTeamLicenseKey(licenseKey);
      if (!teamKey) {
        logEl &&
          ((logEl.className = "ql-log-error"),
          (logEl.innerText =
            "⚠ Activate your license in the side panel first."));
        return;
      }
      const readyFiles = qlAttachedFiles.filter(function (f) {
          return f.public_url && !f.uploading && !f.uploadFailed;
        }),
        hasFiles = readyFiles.length > 0;
      var payload = text;
      hasFiles &&
        (attachments = readyFiles.map(function (f) {
          return {
            name: f.file_name,
            type: f.file_type,
            dataUrl: f.public_url,
          };
        }));
      try {
        hasFiles
          ? logEl &&
            ((logEl.className = "ql-log-info"),
            (logEl.innerText = "📎 Attaching images natively..."))
          : logEl &&
            ((logEl.className = "ql-log-info"),
            (logEl.innerText = "⏳ Sending prompt...")),
          (sendBtn.classList.add("ql-sending"),
          (sendBtn.disabled = true),
          await deliverPromptToLovable(payload, attachments)),
          logEl &&
            (hasFiles
              ? ((logEl.className = "ql-log-success"),
                (logEl.innerText = "✓ Prompt sent! Valid image 😁"))
              : ((logEl.className = "ql-log-success"),
                (logEl.innerText = "✓ Prompt sent!")));
        try {
          if (typeof QLSounds !== "undefined") QLSounds.promptSent();
        } catch (soundErr) {}
        addToChatHistory(text, "ok");
        var msgInput = document.getElementById("ql-msg");
        if (msgInput) msgInput.value = "";
        qlAttachedFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        }),
          (qlAttachedFiles = []),
          renderAttachPreview();
      } catch (err) {
        logEl &&
          ((logEl.className = "ql-log-error"),
          (logEl.innerText = "✗\x20" + formatApiError(err.message || err))),
          addToChatHistory(text, "error");
      } finally {
        sendBtn.classList.remove("ql-sending"), (sendBtn.disabled = false);
      }
    });
}
let _dragCleanup = null,
  _resizeCleanup = null;
function setupDrag() {
  _dragCleanup && (_dragCleanup(), (_dragCleanup = null));
  const floating = document.getElementById("ql-floating"),
    header = document.getElementById("ql-header");
  if (!floating || !header) return;
  let dragging = false,
    startX = 0,
    startY = 0,
    origLeft = 0,
    origTop = 0;
  function onDown(e) {
    if (
      e.target.closest(".ql-minimize-btn") ||
      e.target.closest(".ql-icon-btn") ||
      e.target.closest("button")
    )
      return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const rect = floating.getBoundingClientRect();
    (startX = e.clientX),
      (startY = e.clientY),
      (origLeft = rect.left),
      (origTop = rect.top),
      (dragging = true);
    try {
      header.setPointerCapture(e.pointerId);
    } catch (err) {}
    document.addEventListener("pointermove", onMove),
      document.addEventListener("pointerup", onUp),
      (document.body.style.userSelect = "none");
  }
  function onMove(e) {
    if (!dragging) return;
    let newLeft = origLeft + (e.clientX - startX),
      newTop = origTop + (e.clientY - startY);
    (newLeft = Math.max(
      0,
      Math.min(newLeft, window.innerWidth - floating.offsetWidth)
    )),
      (newTop = Math.max(
        0,
        Math.min(newTop, window.innerHeight - floating.offsetHeight)
      )),
      (floating.style.left = newLeft + "px"),
      (floating.style.top = newTop + "px");
  }
  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    try {
      header.releasePointerCapture(e.pointerId);
    } catch (err) {}
    document.removeEventListener("pointermove", onMove),
      document.removeEventListener("pointerup", onUp),
      (document.body.style.userSelect = "");
  }
  const opts = {};
  (opts.passive = false),
    (header.addEventListener("pointerdown", onDown, opts),
    (_dragCleanup = function () {
      header.removeEventListener("pointerdown", onDown),
        document.removeEventListener("pointermove", onMove),
        document.removeEventListener("pointerup", onUp);
    }));
}
function setupResize() {
  _resizeCleanup && (_resizeCleanup(), (_resizeCleanup = null));
  const floating = document.getElementById("ql-floating"),
    handle = document.getElementById("ql-resize-handle");
  if (!floating || !handle) return;
  let resizing = false,
    startY = 0,
    startH = 0;
  function onDown(e) {
    e.preventDefault(),
      e.stopPropagation(),
      (resizing = true),
      (startY = e.clientY),
      (startH = floating.offsetHeight);
    try {
      handle.setPointerCapture(e.pointerId);
    } catch (err) {}
    document.addEventListener("pointermove", onMove),
      document.addEventListener("pointerup", onUp),
      (document.body.style.userSelect = "none");
  }
  function onMove(e) {
    if (!resizing) return;
    let newH = startH + (e.clientY - startY);
    (newH = Math.max(200, Math.min(newH, window.innerHeight * 0))),
      (floating.style.height = newH + "px");
  }
  function onUp(e) {
    if (!resizing) return;
    (resizing = false),
      (qlHeight = floating.offsetHeight),
      chrome.storage.local.set({
        ql_height: qlHeight,
      });
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch (err) {}
    document.removeEventListener("pointermove", onMove),
      document.removeEventListener("pointerup", onUp),
      (document.body.style.userSelect = "");
  }
  const opts = {};
  (opts.passive = false),
    (handle.addEventListener("pointerdown", onDown, opts),
    (_resizeCleanup = function () {
      handle.removeEventListener("pointerdown", onDown),
        document.removeEventListener("pointermove", onMove),
        document.removeEventListener("pointerup", onUp);
    }));
}
function setupClipboardPaste() {
  var msgInput = document.getElementById("ql-msg");
  if (!msgInput) return;
  var target = document.getElementById("ql-floating") || msgInput,
    dragOverlay = null;
  function showOverlay() {
    if (dragOverlay) return;
    (dragOverlay = document.createElement("div")),
      (dragOverlay.className = "ql-drag-overlay"),
      (dragOverlay.innerHTML =
        '<div class="ql-drag-overlay-inner">📂 Drop files here</div>');
    var container = document.getElementById("ql-floating");
    if (container) container.appendChild(dragOverlay);
  }
  function hideOverlay() {
    dragOverlay && (dragOverlay.remove(), (dragOverlay = null));
  }
  target.addEventListener("dragover", function (ev) {
    ev.preventDefault(), ev.stopPropagation(), showOverlay();
  }),
    target.addEventListener("dragleave", function (ev) {
      ev.preventDefault(), ev.stopPropagation();
      if (!target.contains(ev.relatedTarget)) hideOverlay();
    }),
    target.addEventListener("drop", async function (ev) {
      ev.preventDefault(), ev.stopPropagation(), hideOverlay();
      var files = Array.from(ev.dataTransfer.files || []);
      if (!files.length) return;
      await handleFilesAttach(files);
    }),
    msgInput.addEventListener("paste", async function (ev) {
      var items = ev.clipboardData && ev.clipboardData.items;
      if (!items) return;
      var files = [];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.kind === "file") {
          ev.preventDefault();
          var f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) await handleFilesAttach(files);
    });
}
async function handleFilesAttach(files) {
  if (qlAttachedFiles.length >= MAX_FILES) {
    showCustomAlert("Limit", "Maximum " + MAX_FILES + " files.");
    return;
  }
  var stored = await new Promise(function (resolve) {
      chrome.storage.local.get(["lovable_token"], resolve);
    }),
    token = stored.lovable_token || "";
  if (!token) {
    showCustomAlert("Error", "Token not captured.");
    return;
  }
  if (token.indexOf("Bearer ") === 0) token = token.slice(7);
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (qlAttachedFiles.length >= MAX_FILES) break;
    if (f.size > MAX_FILE_SIZE) {
      showCustomAlert("File Too Large", f.name + " exceeds 20MB.");
      continue;
    }
    var fileToUse = f,
      previewUrl = null;
    if (isImageType(f.type)) {
      var compressed = await compressImage(f);
      (fileToUse = compressed.file), (previewUrl = compressed.previewUrl);
    }
    var idx = qlAttachedFiles.length;
    qlAttachedFiles.push({
      file_id: null,
      file_name: f.name || "file_" + Date.now(),
      previewUrl: previewUrl,
      file_type: fileToUse.type,
      sizeLabel: formatFileSize(fileToUse.size),
      uploading: true,
      rawFile: fileToUse,
    }),
      renderAttachPreview();
    try {
      var uploaded = await uploadFileDirect(fileToUse, token);
      (qlAttachedFiles[idx].file_id = uploaded.file_id),
        (qlAttachedFiles[idx].uploading = false),
        renderAttachPreview();
    } catch (err) {
      (qlAttachedFiles[idx].uploading = false),
        (qlAttachedFiles[idx].file_id = "local_direct_" + crypto.randomUUID()),
        (qlAttachedFiles[idx].uploadFailed = true),
        renderAttachPreview();
    }
  }
}
var CURRENT_EXT_VERSION_POPUP =
  typeof extensionVersionShort === "function"
    ? extensionVersionShort()
    : typeof EXTENSION_VERSION !== "undefined"
    ? EXTENSION_VERSION
    : "0.0.0";
function setupDownloadProject() {
  var downloadBtn = document.getElementById("ql-download-project");
  if (!downloadBtn) return;
  downloadBtn.addEventListener("click", async function () {
    var statusEl = document.getElementById("ql-download-status");
    (downloadBtn.disabled = true),
      (downloadBtn.textContent = "Preparing..."),
      statusEl &&
        ((statusEl.style.display = "block"),
        (statusEl.className = "ql-log-info"),
        (statusEl.textContent = "Checking token and project..."));
    try {
      try {
        const headers = {};
        headers.apikey = API_KEY;
        var flagsUrl =
            API_BASE +
            "/rest/v1/feature_flags?select=enabled&flag_key=eq.download_files",
          flagResult = await bgFetch(flagsUrl, {
            method: "GET",
            headers: headers,
          });
        if (
          flagResult &&
          flagResult.length > 0 &&
          flagResult[0].enabled === false
        )
          throw new Error("Error using the extension resources.");
      } catch (flagErr) {
        if (
          flagErr &&
          flagErr.message === "Error using the extension resources."
        )
          throw flagErr;
      }
      var stored = await new Promise(function (resolve) {
          chrome.storage.local.get(
            ["lovable_token", "lovable_projectId"],
            resolve
          );
        }),
        token = stored.lovable_token || "",
        projId = stored.lovable_projectId || "";
      if (token.indexOf("Bearer ") === 0) token = token.slice(7);
      var projectId = projId;
      if (!projectId) throw new Error("Open a Lovable project page first.");
      if (!token) {
        var cookieResult = await new Promise(function (resolve) {
          chrome.runtime.sendMessage(
            { action: "readCookies" },
            function (resp) {
              if (chrome.runtime.lastError) {
                resolve(null);
                return;
              }
              resolve(resp);
            }
          );
        });
        cookieResult &&
          cookieResult.success &&
          cookieResult.tokens &&
          cookieResult.tokens.length > 0 &&
          (token = cookieResult.tokens[0].token);
      }
      if (!token)
        throw new Error(
          "Token not found. Open a Lovable project and wait for sync."
        );
      downloadBtn.textContent = "Downloading...";
      if (statusEl) statusEl.textContent = "Downloading project files...";
      var dlResult = await new Promise(function (resolve) {
        chrome.runtime.sendMessage(
          { action: "downloadProject", projectId: projectId, token: token },
          function (resp) {
            if (chrome.runtime.lastError) {
              resolve({
                success: false,
                error: chrome.runtime.lastError.message,
              });
              return;
            }
            resolve(resp);
          }
        );
      });
      if (!dlResult || !dlResult.success)
        throw new Error(
          dlResult && dlResult.error ? dlResult.error : "Download failed"
        );
      var files = dlResult.files;
      if (!files || files.length === 0)
        throw new Error("No files found in the project.");
      if (statusEl)
        statusEl.textContent =
          "Creating ZIP with " + files.length + " files...";
      downloadBtn.textContent = "Packaging...";
      if (typeof JSZip === "undefined")
        throw new Error("JSZip not loaded. Use the Side Panel.");
      var zip = new JSZip(),
        imgExts = [
          ".png",
          ".jpg",
          ".jpeg",
          ".gif",
          ".svg",
          ".ico",
          ".webp",
          ".bmp",
          ".tiff",
        ],
        count = 0;
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.name || file.sizeExceeded) continue;
        const zipOpts = {};
        (zipOpts.base64 = true), (zipOpts.binary = true);
        if (file.contents && file.binary)
          zip.file(file.name, file.contents, zipOpts), count++;
        else {
          if (
            !file.contents &&
            imgExts.some(function (ext) {
              return file.name.toLowerCase().endsWith(ext);
            })
          )
            try {
              var fileResp = await fetch(
                "https://api.lovable.dev/projects/" +
                  projectId +
                  "/files/raw?path=" +
                  encodeURIComponent(file.name),
                {
                  method: "GET",
                  headers: { Authorization: "Bearer " + token },
                  credentials: "omit",
                  mode: "cors",
                }
              );
              const opt = {};
              opt.binary = true;
              if (fileResp.ok)
                zip.file(file.name, await fileResp.arrayBuffer(), opt), count++;
              else
                file.contents && (zip.file(file.name, file.contents), count++);
            } catch (err) {
              file.contents && (zip.file(file.name, file.contents), count++);
            }
          else file.contents && (zip.file(file.name, file.contents), count++);
        }
      }
      const zipOpts = {};
      zipOpts.level = 9;
      var zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: zipOpts,
        }),
        aEl = document.createElement("a");
      (aEl.href = URL.createObjectURL(zipBlob)),
        (aEl.download =
          "lovable-" +
          projectId.substring(0, 8) +
          "-" +
          new Date().toISOString().split("T")[0] +
          ".zip"),
        document.body.appendChild(aEl),
        aEl.click(),
        document.body.removeChild(aEl),
        URL.revokeObjectURL(aEl.href),
        statusEl &&
          ((statusEl.className = "ql-log-success"),
          (statusEl.textContent = count + " files downloaded!")),
        (downloadBtn.textContent = "Download Complete!"),
        setTimeout(function () {
          (downloadBtn.textContent = "Download All Files"),
            (downloadBtn.disabled = false);
          if (statusEl) statusEl.style.display = "none";
        }, 4000);
    } catch (err) {
      statusEl &&
        ((statusEl.className = "ql-log-error"),
        (statusEl.textContent = err.message || err),
        (statusEl.style.display = "block")),
        (downloadBtn.textContent = "Failed"),
        setTimeout(function () {
          (downloadBtn.textContent = "Download All Files"),
            (downloadBtn.disabled = false);
        }, 3000);
    }
  });
}
async function checkForUpdatePopup() {
  try {
    const headers = {};
    headers.apikey = API_KEY;
    var versions = await bgFetch(VERSIONS_URL_POPUP, {
      method: "GET",
      headers: headers,
    });
    if (!versions || !versions.length) return;
    var latest = versions[0];
    if (
      latest.version !== CURRENT_EXT_VERSION_POPUP &&
      latest.is_alert_active
    ) {
      var banner = document.getElementById("ql-update-banner");
      if (banner) {
        var downloadUrl = latest.file_path
          ? API_BASE +
            "/storage/v1/object/public/extension-releases/" +
            latest.file_path
          : null;
        (banner.innerHTML = qlTemplateUpdateBanner(
          latest.version,
          latest.changelog || "",
          downloadUrl
        )),
          (banner.style.display = "block");
      }
    }
  } catch (err) {}
}
async function checkResellerRolePopup() {
  try {
    var stored = await new Promise(function (resolve) {
      chrome.storage.local.get(["ql_license_key"], resolve);
    });
    if (!stored.ql_license_key) return;
    const headers = {};
    headers.apikey = API_KEY;
    var license = await bgFetch(
      LICENSES_URL +
        "&license_key=eq." +
        encodeURIComponent(stored.ql_license_key) +
        "&limit=1",
      { method: "GET", headers: headers }
    );
    if (!license || !license.length || !license[0].user_id) return;
    const headers2 = {};
    headers2.apikey = API_KEY;
    var role = license[0].user_id,
      roles = await bgFetch(USER_ROLES_URL_POPUP + "&user_id=eq." + role, {
        method: "GET",
        headers: headers2,
      });
    if (
      roles &&
      Array.isArray(roles) &&
      roles.some(function (r) {
        return r.role === "reseller" || r.role === "admin";
      })
    ) {
      var resellerBadge = document.getElementById("ql-reseller-btn");
      if (resellerBadge) resellerBadge.style.display = "block";
    }
  } catch (err) {}
}
let qlNativeChatActive = false,
  qlNativeChatCleanup = null;
function activateNativeChat() {
  toStore = {};
  (toStore.ql_native_chat = true),
    ((qlNativeChatActive = true), chrome.storage.local.set(toStore));
  const floating = document.getElementById("ql-floating");
  floating &&
    ((floating.style.transition = "opacity 0.3s ease, transform 0.3s ease"),
    (floating.style.opacity = "0"),
    (floating.style.transform = "scale(0.95) translateX(20px)"),
    setTimeout(() => {
      floating.style.display = "none";
    }, 350)),
    injectNativeChatOverlay();
}
function deactivateNativeChat() {
  toStore = {};
  (toStore.ql_native_chat = false),
    ((qlNativeChatActive = false), chrome.storage.local.set(toStore)),
    qlNativeChatCleanup &&
      (qlNativeChatCleanup(), (qlNativeChatCleanup = null));
  const badge = document.getElementById("ql-native-badge");
  if (badge) badge.remove();
  const returnBtn = document.getElementById("ql-native-return-btn");
  if (returnBtn) returnBtn.remove();
  const sendBtn = document.getElementById("chatinput-send-message-button");
  sendBtn &&
    (sendBtn.classList.remove("ql-native-send-active"),
    (sendBtn.style.animation = ""));
  const floating = document.getElementById("ql-floating");
  floating
    ? ((floating.style.display = ""),
      (floating.style.opacity = "0"),
      (floating.style.transform = "scale(0.95)"),
      requestAnimationFrame(() => {
        (floating.style.transition = "opacity 0.4s ease, transform 0.4s ease"),
          (floating.style.opacity = "1"),
          (floating.style.transform = "scale(1) translateX(0)");
      }))
    : _buildFloatingUI();
}
function injectNativeChatOverlay() {
  form = document.querySelector("form#chat-input");
  if (!form) {
    setTimeout(injectNativeChatOverlay, 500);
    return;
  }
  if (!document.getElementById("ql-native-badge")) {
    const pos = getComputedStyle(form).position;
    if (pos === "static") form.style.position = "relative";
    const badge = document.createElement("div");
    (badge.id = "ql-native-badge"),
      (badge.className = "ql-native-badge"),
      (badge.innerHTML = "⚡ <span>Loveable Infinity</span>"),
      form.appendChild(badge);
  }
  if (!document.getElementById("ql-native-return-btn")) {
    const returnBtn = document.createElement("button");
    (returnBtn.id = "ql-native-return-btn"),
      (returnBtn.className = "ql-native-return-btn"),
      (returnBtn.innerHTML = "← Return to Extension"),
      returnBtn.addEventListener("click", (ev) => {
        ev.preventDefault(), ev.stopPropagation(), deactivateNativeChat();
      }),
      form.parentElement.insertBefore(returnBtn, form.nextSibling);
  }
  const sendBtn = document.getElementById("chatinput-send-message-button");
  sendBtn && sendBtn.classList.add("ql-native-send-active");
  function onSendClick() {
    if (!qlNativeChatActive) return;
    const editable = form.querySelector('[contenteditable="true"]'),
      text = editable
        ? (editable.innerText || editable.textContent || "").trim()
        : "";
    if (text) addToChatHistory(text, "ok");
  }
  function onSubmit() {
    if (!qlNativeChatActive) return;
    const editable = form.querySelector('[contenteditable="true"]'),
      text = editable
        ? (editable.innerText || editable.textContent || "").trim()
        : "";
    if (text) addToChatHistory(text, "ok");
  }
  function onKeyDown(ev) {
    if (!qlNativeChatActive) return;
    if (ev.key === "Enter" && !ev.shiftKey) {
      const editable = form.querySelector('[contenteditable="true"]'),
        text = editable
          ? (editable.innerText || editable.textContent || "").trim()
          : "";
      if (text) addToChatHistory(text, "ok");
    }
  }
  if (sendBtn) sendBtn.addEventListener("click", onSendClick, true);
  form.addEventListener("submit", onSubmit, true),
    form.addEventListener("keydown", onKeyDown, true),
    (qlNativeChatCleanup = function () {
      if (sendBtn) sendBtn.removeEventListener("click", onSendClick, true);
      form.removeEventListener("submit", onSubmit, true),
        form.removeEventListener("keydown", onKeyDown, true);
    });
}
async function sendViaNativeChat(text) {
  if (text) addToChatHistory(text, "ok");
}
function showNativeSendingOverlay(show) {
  const overlayId = "ql-native-sending-overlay",
    existing = document.getElementById(overlayId);
  if (!show) {
    if (existing) existing.remove();
    return;
  }
  if (existing) return;
  const overlay = document.createElement("div");
  (overlay.id = overlayId),
    (overlay.className = "ql-native-sending-overlay"),
    (overlay.innerHTML = '<div class="ql-spinner"></div> Sending prompt...'),
    document.body.appendChild(overlay);
}
function showNativeChatToast(title, type) {
  existing = document.getElementById("ql-native-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  (toast.id = "ql-native-toast"),
    (toast.className = "ql-native-toast ql-native-toast-" + type),
    (toast.textContent = qlUserText(title)),
    document.body.appendChild(toast),
    requestAnimationFrame(() => toast.classList.add("ql-native-toast-visible")),
    setTimeout(() => {
      toast.classList.remove("ql-native-toast-visible"),
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
function setupNativeChatButton() {
  const btn = document.getElementById("ql-native-chat-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    activateNativeChat();
  });
}
chrome.runtime.onMessage.addListener(function (msg, area, sendResponse) {
  if (msg && msg.action === "setCreditBypass") {
    if (msg.active && typeof pkEnsureActiveLicense === "function")
      return (
        pkEnsureActiveLicense(false)
          .then(function () {
            setPkCreditBypass(true), sendResponse({ ok: true });
          })
          ["catch"](function () {
            setPkCreditBypass(false), sendResponse({ ok: false });
          }),
        true
      );
    return setPkCreditBypass(!!msg.active), sendResponse({ ok: true }), false;
  }
  if (msg && msg.action === "qlActivateBypass") {
    if (typeof pkEnsureActiveLicense === "function")
      return (
        pkEnsureActiveLicense(false)
          .then(function () {
            setPkCreditBypass(true), sendResponse({ ok: true });
          })
          ["catch"](function () {
            setPkCreditBypass(false), sendResponse({ ok: false });
          }),
        true
      );
    return setPkCreditBypass(false), sendResponse({ ok: false }), false;
  }
  if (msg && msg.action === "qlDeactivateBypass")
    return setPkCreditBypass(false), sendResponse({ ok: true }), false;
  if (msg && msg.action === "syncCreditBypass")
    return syncPkCreditBypassFromStorage(), sendResponse({ ok: true }), false;
  if (msg && msg.action === "setShieldActive") {
    qlShieldActive = !!msg.active;
    if (qlShieldActive) injectShieldOverlay();
    else removeShieldOverlay();
    const okObj = {};
    return (okObj.ok = true), (sendResponse(okObj), false);
  }
  if (msg && msg.action === "setNativeChatActive") {
    if (msg.active) activateNativeChat();
    else deactivateNativeChat();
    const okObj = {};
    return (okObj.ok = true), (sendResponse(okObj), false);
  }
  if (msg && msg.action === "qlActivateNativeChat")
    return activateNativeChat(), sendResponse({ ok: true }), false;
  if (msg && msg.action === "qlDeactivateNativeChat")
    return deactivateNativeChat(), sendResponse({ ok: true }), false;
  if (msg && msg.action === "qlQuickProjectInit")
    return (
      quickProjectInit()
        .then(function () {
          const okObj = {};
          (okObj.ok = true), sendResponse(okObj);
        })
        ["catch"](function (err) {
          sendResponse({ ok: false, error: err.message });
        }),
      true
    );
  if (msg && msg.action === "getNativeChatCapture")
    return sendResponse({ body: getNativeChatCaptureBody() }), false;
  if (msg && msg.action === "requestTokenRefresh") {
    try {
      window.postMessage({ type: "lovableRequestToken" }, "*");
    } catch (err) {}
    return (
      setTimeout(function () {
        try {
          window.postMessage({ type: "lovableRequestToken" }, "*");
        } catch (err) {}
      }, 120),
      sendResponse({ ok: true }),
      false
    );
  }
  if (msg && msg.action === "getSessionHeaders")
    return (
      buildSessionHeaders(msg.projectId || "").then(function (sessionHeaders) {
        const response = {};
        (response.headers = sessionHeaders), sendResponse(response);
      }),
      true
    );
  if (msg && msg.action === "getLovableSession")
    return (
      captureLovableSessionFromPage().then(function (result) {
        sendResponse(result);
      }),
      true
    );
  if (msg && msg.action === "resolveLovableAuth")
    return (
      captureLovableSessionFromPage().then(function (captureResult) {
        if (captureResult.ok) {
          sendResponse({
            token: captureResult.token,
            cookieToken: captureResult.token,
            projectId: captureResult.projectId,
          });
          return;
        }
        sendResponse({
          token: "",
          cookieToken: "",
          projectId: projectIdFromPage() || "",
        });
      }),
      true
    );
}),
  chrome.storage.local.get(["ql_native_chat"], (stored) => {
    stored.ql_native_chat === true &&
      ((qlNativeChatActive = true),
      setTimeout(() => {
        const floatingEl = document.getElementById("ql-floating");
        if (floatingEl) floatingEl.style.display = "none";
        injectNativeChatOverlay();
      }, 500));
  }),
  window.addEventListener("message", (evt) => {
    if (!evt.data || evt.source !== window) return;
    if (
      evt.data.type === "lovableBrowserSession" &&
      evt.data.browserSessionId
    ) {
      chrome.runtime.sendMessage(
        {
          action: "lovableSync",
          browserSessionId: evt.data.browserSessionId,
        },
        function () {
          if (chrome.runtime.lastError) {
          }
        }
      );
      return;
    }
    if (evt.data.type !== "lovableTokenFound") return;
    const tokenData = {};
    evt.data.token &&
      typeof evt.data.token === "string" &&
      (tokenData.lovable_token = evt.data.token
        .replace(/^Bearer\s+/i, "")
        .trim()),
      evt.data.projectId &&
        typeof evt.data.projectId === "string" &&
        (tokenData.lovable_projectId = evt.data.projectId);
    if (!Object.keys(tokenData).length) return;
    chrome.runtime.sendMessage(
      {
        action: "lovableSync",
        token: tokenData.lovable_token,
        projectId: tokenData.lovable_projectId,
      },
      function () {
        if (chrome.runtime.lastError) {
        }
      }
    ),
      chrome.storage.local.set(tokenData, () => {
        updateSyncStatus();
      });
  }),
  location.hostname &&
    location.hostname.indexOf("lovable.dev") !== -1 &&
    syncPkCreditBypassFromStorage(),
  (function initLovableAuthSync() {
    if (!location.hostname || location.hostname.indexOf("lovable.dev") === -1)
      return;
    function syncAuth() {
      chrome.runtime.sendMessage(
        {
          action: "syncLovableAuth",
          tabUrl: location.href,
          projectId: projectIdFromPage(),
        },
        function () {
          if (chrome.runtime.lastError) {
          }
        }
      );
      try {
        window.postMessage({ type: "lovableRequestToken" }, "*");
      } catch (err) {}
    }
    syncAuth(),
      setInterval(syncAuth, 8000),
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) syncAuth();
      });
  })();
function setupCreateProject() {
  var btn =
    document.getElementById("ql-quick-init") ||
    document.getElementById("ql-create-project");
  if (!btn) return;
  btn.addEventListener("click", async function () {
    var statusEl = document.getElementById("ql-download-status"),
      origText = btn.textContent;
    (btn.disabled = true),
      (btn.textContent = "Creating project..."),
      statusEl &&
        ((statusEl.style.display = "block"),
        (statusEl.className = "ql-log-info"),
        (statusEl.textContent = "Typing placeholder and clicking Build..."));
    try {
      await quickProjectInit(),
        statusEl &&
          ((statusEl.className = "ql-log-success"),
          (statusEl.textContent =
            "✅ Empty project created! Send your real prompt from the extension.")),
        (btn.textContent = "✅ Done!"),
        setTimeout(function () {
          (btn.disabled = false), (btn.textContent = origText);
          if (statusEl) statusEl.style.display = "none";
        }, 5000);
    } catch (err) {
      console.error("[CreateProject]", err),
        statusEl &&
          ((statusEl.className = "ql-log-error"),
          (statusEl.textContent = "❌\x20" + (err.message || "Error"))),
        (btn.disabled = false),
        (btn.textContent = origText);
    }
  });
}
async function quickProjectInit() {
  if (window.location.pathname.match(/\/projects\/[a-f0-9-]{36}/i))
    throw new Error(
      "Use this button on the Lovable home screen without a project open."
    );
  const form = document.querySelector("form#chat-input");
  if (!form)
    throw new Error(
      "Chat form not found. Make sure you are on the Lovable home screen."
    );
  const editable = form.querySelector('[contenteditable="true"]');
  if (!editable) throw new Error("Text field not found.");
  const buildBtn = document.getElementById("chatinput-send-message-button");
  if (!buildBtn) throw new Error("Build button not found.");
  editable.focus(),
    document.execCommand("selectAll", false, null),
    document.execCommand("insertText", false, "."),
    await new Promise((resolve) => setTimeout(resolve, 300));
  if (buildBtn.disabled) buildBtn.removeAttribute("disabled");
  buildBtn.click();
  const started = await new Promise(function (resolve) {
    (timeoutMs = 25000),
      (startTime = Date.now()),
      (interval = setInterval(function () {
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval), resolve(false);
          return;
        }
        const stopBtn = document.querySelector(
          'button[aria-label="Stop generating"]'
        );
        stopBtn &&
          !stopBtn.disabled &&
          (clearInterval(interval), stopBtn.click(), resolve(true));
      }, 200));
  });
  if (!started)
    throw new Error(
      "Timeout waiting for Stop. Check whether a project was created in your list."
    );
}
