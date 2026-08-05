/**
 * LovaPilot — extension-config.js (clean readable edition)
 * Original: obfuscator.io obfuscated. Decode verified 100% (16/16 functions).
 * Changes vs original: values updated to LovaPilot backend + Authorization
 * header added for Supabase JWT-verified Edge Functions. NO code deleted.
 */

// ---------------------------------------------------------------------------
// Extension identity and API configuration
// ---------------------------------------------------------------------------
var EXTENSION_NAME = "LovaPilot";
var EXTENSION_VERSION = "7.0.0";
var DEFAULT_LICENSE_USER_NAME = "Licensed User";

var POWERKITS_API_BASE = "https://bcrzdgkyydfutrbcbbrt.supabase.co";
var POWERKITS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcnpkZ2t5eWRmdXRyYmNiYnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzI0NDcsImV4cCI6MjA5ODE0ODQ0N30.EqPZXQ9eukJPWIMSUrMd84XqpEKGEMzL88XT0Y-TwJ8";
var GRINGOW_API_BASE = POWERKITS_API_BASE;
var GRINGOW_API_KEY = POWERKITS_API_KEY;
var DISCORD_SUPPORT_URL = "https://wa.me/8801759176229";
var PROXY_COMMAND_URL = POWERKITS_API_BASE + "/functions/v1/proxy-command";
var SEND_STRATEGY = "native";
var POWERKITS_DEBUG = false;
var LOVABLE_VALIDATE_URL = "https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license";
var LOVABLE_DASHBOARD_URL = "https://unlimitedlovable.xyz/";
var INTERNAL_LICENSE_MODE = false;
var SIDE_PANEL_ONLY = true;

function extensionVersionShort() {
  return typeof EXTENSION_VERSION !== "undefined"
    ? String(EXTENSION_VERSION)
    : "0.0.0";
}

function extensionFooterBadge() {
  var extensionName = typeof EXTENSION_NAME !== "undefined"
    ? String(EXTENSION_NAME)
    : "LovaPilot";
  return extensionName + " • v" + extensionVersionShort();
}

function powerkitsApiHeaders(extraHeaders) {
  var apiKeyHeader = {
    apikey: POWERKITS_API_KEY,
    Authorization: "Bearer " + POWERKITS_API_KEY,
  };
  return Object.assign(apiKeyHeader, extraHeaders || {});
}

function gringowApiHeaders(extraHeaders) {
  return powerkitsApiHeaders(extraHeaders);
}

// ---------------------------------------------------------------------------
// License/session helpers
// ---------------------------------------------------------------------------
function normalizeLicenseUserName(userName) {
  var normalizedName = String(userName || "").trim();
  if (
    !normalizedName ||
    normalizedName.toLowerCase() === "licensed user" ||
    normalizedName.toLowerCase() === "unknown" ||
    /gringow|powerkits/i.test(normalizedName)
  ) {
    return DEFAULT_LICENSE_USER_NAME;
  }
  return normalizedName;
}

function resolveTeamLicenseKey(licenseKey) {
  var normalizedLicenseKey = String(licenseKey || "").trim();
  if (!normalizedLicenseKey || normalizedLicenseKey === "INTERNAL") {
    return "";
  }
  return normalizedLicenseKey;
}

function powerkitsInternalSessionStorage(sessionId, userName) {
  var configuredLicenseKey = resolveTeamLicenseKey("");
  return {
    ql_license_valid: true,
    ql_license_key: configuredLicenseKey || "INTERNAL",
    ql_session_id: sessionId,
    ql_user_name: normalizeLicenseUserName(userName),
    ql_license_status: "active",
    ql_expires_at: null,
    ql_activated_at: new Date().toISOString(),
  };
}

function gringowInternalSessionStorage(sessionId, userName) {
  return powerkitsInternalSessionStorage(sessionId, userName);
}

function pkResolveLicenseStatus(licenseData) {
  if (!licenseData) return "active";
  if (licenseData.plan_type) return licenseData.plan_type;
  if (licenseData.is_trial || licenseData.status === "trial") return "trial";
  return licenseData.status || "active";
}

function pkLicenseStoragePatch(licenseData) {
  if (!licenseData) return {};
  var storagePatch = {
    ql_license_status: pkResolveLicenseStatus(licenseData),
  };
  if (Object.prototype.hasOwnProperty.call(licenseData, "expires_at")) {
    storagePatch.ql_expires_at = licenseData.expires_at || null;
  }
  if (Object.prototype.hasOwnProperty.call(licenseData, "activated_at")) {
    storagePatch.ql_activated_at = licenseData.activated_at || null;
  }
  if (Object.prototype.hasOwnProperty.call(licenseData, "validity_minutes")) {
    storagePatch.ql_validity_minutes =
      licenseData.validity_minutes != null ? licenseData.validity_minutes : null;
  }
  return storagePatch;
}

// ---------------------------------------------------------------------------
// Plan-mode storage compatibility helpers
// ---------------------------------------------------------------------------
function readPlanModeFromStorage(storageValues) {
  storageValues = storageValues || {};
  return !!(
    storageValues.ql_modo_plano ||
    storageValues.ql_license_mode ||
    storageValues.ql_modo_licença
  );
}

function writePlanModeToStorage(isPlanModeEnabled, callback) {
  chrome.storage.local.set(
    { ql_modo_plano: !!isPlanModeEnabled },
    callback,
  );
}

function migratePlanModeStorageKeys(callback) {
  chrome.storage.local.get(
    [
      "ql_modo_plano",
      "ql_license_mode",
      "ql_modo_licença",
      "ql_modo_plano_alert_dismissed",
      "ql_license_mode_alert_dismissed",
    ],
    function (storedValues) {
      var storagePatch = {};
      var isPlanModeEnabled = readPlanModeFromStorage(storedValues);
      if (isPlanModeEnabled && storedValues.ql_modo_plano !== true) {
        storagePatch.ql_modo_plano = true;
      }
      var isPlanModeAlertDismissed = !!(
        storedValues.ql_modo_plano_alert_dismissed ||
        storedValues.ql_license_mode_alert_dismissed
      );
      if (
        isPlanModeAlertDismissed &&
        storedValues.ql_modo_plano_alert_dismissed !== true
      ) {
        storagePatch.ql_modo_plano_alert_dismissed = true;
      }
      if (Object.keys(storagePatch).length) {
        chrome.storage.local.set(storagePatch, function () {
          if (callback) callback(isPlanModeEnabled, isPlanModeAlertDismissed);
        });
      } else if (callback) {
        callback(isPlanModeEnabled, isPlanModeAlertDismissed);
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Page storage and time parsing
// ---------------------------------------------------------------------------
function pkPageStorageGet(storageKey) {
  try {
    return (
      localStorage.getItem("pk_" + storageKey) ||
      localStorage.getItem("gringow_" + storageKey) ||
      ""
    );
  } catch (error) {
    return "";
  }
}

function pkPageStorageSet(storageKey, value) {
  try {
    localStorage.setItem("pk_" + storageKey, value);
  } catch (error) {}
}

function pkParseUtcExpiry(expiryValue) {
  if (expiryValue == null || expiryValue === "") return null;
  if (typeof expiryValue === "number" && !isNaN(expiryValue)) return expiryValue;

  var normalizedExpiry = String(expiryValue).trim();
  if (!normalizedExpiry) return null;
  if (!/Z|[+-]\d{2}:?\d{2}$/.test(normalizedExpiry)) {
    normalizedExpiry = normalizedExpiry.replace(" ", "T") + "Z";
  }

  var expiryMilliseconds = Date.parse(normalizedExpiry);
  return isNaN(expiryMilliseconds) ? null : expiryMilliseconds;
}

// ---------------------------------------------------------------------------
// Final branding/API overrides (LovaPilot edition)
// ---------------------------------------------------------------------------
LOVABLE_VALIDATE_URL = "https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license";
LOVABLE_DASHBOARD_URL = "https://unlimitedlovable.xyz/";
EXTENSION_NAME = "LovaPilot";
SEND_STRATEGY = "native";

try {
  if (typeof window !== "undefined") {
    window.LOVABLE_VALIDATE_URL = LOVABLE_VALIDATE_URL;
    window.EXTENSION_NAME = EXTENSION_NAME;
  }
} catch (error) {}
