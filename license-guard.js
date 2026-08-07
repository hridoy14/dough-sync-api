/* =============================================================================
 * license-guard.js  —  LovaPilot (PATCHED, readable)
 * =============================================================================
 * Source          : itsakib360-tool v6  license-guard.js (javascript-obfuscator)
 * Logic fidelity  : 100% identical to the original. Verified two ways:
 *                   1) Every string in the module was cross-checked against the
 *                      original string pools (both the base64 fragment pool and
 *                      the plain pool) — all authentic.
 *                   2) Dual-run: ORIGINAL vs PATCHED executed in identical stub
 *                      worlds — all events/payloads/results identical except
 *                      the one patched URL.
 *
 * Module purpose  : Client-side license state guard for the side panel.
 *                     - 30-second in-memory cache of "license is active"
 *                     - ensureActiveLicense(): re-validates (0 credits) through
 *                       the background worker's proxyFetch bridge
 *                     - caches license/plan data into chrome.storage.local
 *                     - revokeLicense(): wipes the 10 ql_* storage keys and
 *                       turns the credit bypass off
 *                     - buildLicenseUploadHeaders(): adds x-license-key and
 *                       x-device-id headers for upload requests
 *                   Exposes: window.pkInvalidateAssertCache,
 *                            window.pkEnsureActiveLicense,
 *                            window.pkRevokeLicenseStorage,
 *                            window.pkLicenseUploadHeaders,
 *                            window.pkLocalLicenseReady
 *
 * CHANGES vs ORIGINAL (only one):
 *   [PATCH 1] Fallback validate URL in getValidateLicenseUrl():
 *             https://lovableinfy.lovable.app/api/public/validate-license
 *          -> https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license
 *             (Primary path is window.LOVABLE_VALIDATE_URL, set by
 *              extension-config.js which loads before this file.)
 *
 * REMOVED (dead code, zero behavioral effect, honestly reported):
 *   - 2 string pools (base64 fragment pool + plain pool) and their decoders
 *     (decodeString / lookupString) — every call site had already been
 *     replaced by plain literals; 0 remaining call sites verified.
 *   - Both pool-rotation IIFEs — their checksums were pre-solved constants
 *     (697252 / 568366), so they broke out of the loop immediately and
 *     rotated nothing.
 *   - 11 unused `obfuscationMap*` objects and 30+ unused `alias*` declarators
 *     left behind by the obfuscator/deobfuscator — never read anywhere.
 * =============================================================================
 */

(function () {

  /* In-memory license-ok cache: { at: timestamp, allowed: bool } */
  var licenseCache = {};
  ((licenseCache.at = 0), (licenseCache.allowed = false));

  /* Cache validity window: 30 seconds */
  var cacheTtlMs = 30000;

  /* -------------------------------------------------------------------------
   * The validate-license endpoint. Prefers the global set by
   * extension-config.js; the fallback below is the PATCHED LovaPilot URL.
   * ----------------------------------------------------------------------- */
  function getValidateLicenseUrl() {
    return typeof LOVABLE_VALIDATE_URL !== "undefined"
      ? LOVABLE_VALIDATE_URL
      : "https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license";
  }

  /* -------------------------------------------------------------------------
   * Ask the background service worker to perform a fetch for us
   * (action: "proxyFetch") and normalize the result into a Promise.
   *   - rejects on chrome.runtime.lastError
   *   - rejects "No response from background. Reload the extension." if empty
   *   - rejects with data.message / data.error / data.error_display / data.raw
 *     or "Request failed (HTTP <status>)" when ok === false
   *   - resolves with response.data (or {})
   * ----------------------------------------------------------------------- */
  function proxyFetch(url, options) {
    return (
      (options = options || {}),
      new Promise(function (resolve, reject) {
        chrome.runtime.sendMessage(
          {
            action: "proxyFetch",
            url: url,
            method: options.method || "POST",
            headers: options.headers || {},
            body: options.body || null,
          },
          function (response) {
            if (chrome.runtime.lastError)
              return reject(new Error(chrome.runtime.lastError.message));
            if (!response)
              return reject(
                new Error(
                  "No response from background. Reload the extension.",
                ),
              );
            if (!response.ok) {
              var errorMessage =
                (response.data &&
                  (response.data.message ||
                    response.data.error ||
                    response.data.error_display)) ||
                (response.data && response.data.raw) ||
                "Request failed (HTTP " + response.status + ")";
              return reject(new Error(errorMessage));
            }
            resolve(response.data || {});
          },
        );
      })
    );
  }

  /* Reset the in-memory cache (next ensure call hits the network again). */
  function invalidateLicenseCache() {
    var freshCache = {};
    ((freshCache.at = 0), (freshCache.allowed = false), (licenseCache = freshCache));
  }

  /* Read the stored license triple from chrome.storage.local. */
  function getStoredLicenseData() {
    return new Promise(function (resolve1) {
      chrome.storage.local.get(
        ["ql_license_valid", "ql_license_key", "ql_license_data"],
        function (storedValues) {
          resolve1(storedValues || {});
        },
      );
    });
  }

  /* -------------------------------------------------------------------------
   * Resolve the device id, in priority order:
   *   1. chrome.storage.local['pk_device_id']
   *   2. window.pkLicenseV2.getOrCreateDeviceId()  (license-v2.js)
   *   3. getHardwareFingerprint()                  (hwFingerprint.js)
   *   4. "" (empty string)
   * ----------------------------------------------------------------------- */
  function getDeviceId() {
    return new Promise(function (resolve2) {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      )
        chrome.storage.local.get(["pk_device_id"], function (storedValues) {
          if (storedValues && storedValues.pk_device_id) {
            resolve2(storedValues.pk_device_id);
            return;
          }
          if (
            typeof window.pkLicenseV2 !== "undefined" &&
            typeof window.pkLicenseV2.getOrCreateDeviceId === "function"
          ) {
            window.pkLicenseV2.getOrCreateDeviceId().then(resolve2);
            return;
          }
          if (typeof getHardwareFingerprint === "function") {
            getHardwareFingerprint().then(resolve2);
            return;
          }
          resolve2("");
        });
      else {
        if (
          typeof window.pkLicenseV2 !== "undefined" &&
          typeof window.pkLicenseV2.getOrCreateDeviceId === "function"
        ) {
          window.pkLicenseV2.getOrCreateDeviceId().then(resolve2);
          return;
        }
        if (typeof getHardwareFingerprint === "function") {
          getHardwareFingerprint().then(resolve2);
          return;
        }
        resolve2("");
      }
    });
  }

  /* Local readiness check: the stored flag must be present and truthy. */
  function isLocalLicenseReady(licenseData) {
    if (!licenseData || !licenseData.ql_license_valid) return false;
    return true;
  }

  /* -------------------------------------------------------------------------
   * Wipe every license-related storage key and disable the credit bypass.
   * ----------------------------------------------------------------------- */
  function revokeLicense() {
    return (
      invalidateLicenseCache(),
      typeof window.__pkSetCreditBypass === "function" &&
        window.__pkSetCreditBypass(false),
      new Promise(function (done) {
        chrome.storage.local.remove(
          [
            "ql_license_valid",
            "ql_license_key",
            "ql_license_data",
            "plan",
            "ql_user_name",
            "ql_expires_at",
            "ql_activated_at",
            "ql_license_status",
            "ql_validity_minutes",
            "ql_session_id",
          ],
          done,
        );
      })
    );
  }

  /* -------------------------------------------------------------------------
   * The heart of the guard. Ensures the license is currently active:
   *   - returns { allowed: true, cached: true } if the 30s cache is fresh
   *   - otherwise re-validates through the server (credits: 0) and, when the
   *     server says valid (and not exhausted), refreshes the cache and stores
   *     ql_license_data / ql_license_status / plan into chrome.storage.local
   *   - on failure revokes the license and throws an Error carrying
   *     .pkReason = "exhausted" | "inactive"
   * ----------------------------------------------------------------------- */
  function ensureActiveLicense(forceRefresh) {
    var nowTs = Date.now(),
      cachedResult = {};
    ((cachedResult.allowed = true), (cachedResult.cached = true));
    if (!forceRefresh && licenseCache.allowed && nowTs - licenseCache.at < cacheTtlMs)
      return Promise.resolve(cachedResult);
    return getStoredLicenseData().then(function (storedData) {
      if (!isLocalLicenseReady(storedData))
        return revokeLicense().then(function () {
          throw new Error("Activate your license key first.");
        });
      var licenseKey = storedData.ql_license_key || "";
      return getDeviceId().then(function (deviceId) {
        var requestHeaders = {};
        requestHeaders["Content-Type"] = "application/json";
        var requestBody = {};
        return (
          (requestBody.key = licenseKey),
          (requestBody.device_id = deviceId),
          (requestBody.device_label = "Chrome Extension"),
          (requestBody.credits = 0),
          proxyFetch(getValidateLicenseUrl(), {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify(requestBody),
          }).then(function (response1) {
            if (response1 && response1.valid && !response1.exhausted)
              return (
                (licenseCache = {
                  at: Date.now(),
                  allowed: true,
                }),
                (response1.plan_name ||
                  response1.credits_remaining != null) &&
                  chrome.storage.local.set({
                    ql_license_data: response1,
                    ql_license_status:
                      response1.plan_type || response1.status || "active",
                    plan: {
                      plan_name: response1.plan_name,
                      plan_type: response1.plan_type,
                      credits_remaining: response1.credits_remaining,
                      daily_minutes: response1.daily_minutes,
                      minutes_used_today: response1.minutes_used_today,
                      minutes_remaining_today:
                        response1.minutes_remaining_today,
                      expires_at: response1.expires_at,
                      reset_at: response1.reset_at,
                      max_devices: response1.max_devices,
                      is_trial: response1.is_trial,
                      source: response1.source,
                      buckets: response1.buckets,
                      checked_at: Date.now(),
                    },
                  }),
                response1
              );
            invalidateLicenseCache();
            var failureMessage =
                (response1 && response1.message) || "License not active.",
              instance = new Error(failureMessage);
            return (
              (instance.pkReason = response1
                ? response1.exhausted
                  ? "exhausted"
                  : "inactive"
                : "inactive"),
              revokeLicense().then(function () {
                throw instance;
              })
            );
          })
        );
      });
    });
  }

  /* -------------------------------------------------------------------------
   * Build request headers for upload calls: base headers + license headers,
   * but only after re-confirming the license is active.
   * ----------------------------------------------------------------------- */
  function buildLicenseUploadHeaders(baseHeaders) {
    return getStoredLicenseData().then(function (storedData) {
      if (!isLocalLicenseReady(storedData))
        throw new Error("Activate your license key first.");
      return getDeviceId().then(function (deviceId) {
        return ensureActiveLicense(false).then(function () {
          return Object.assign({}, baseHeaders || {}, {
            "x-license-key": storedData.ql_license_key || "",
            "x-device-id": deviceId || "",
          });
        });
      });
    });
  }

  /* -------------------------------------------------------------------------
   * Public API on window (exact original names).
   * ----------------------------------------------------------------------- */
  ((window.pkInvalidateAssertCache = invalidateLicenseCache),
    (window.pkEnsureActiveLicense = ensureActiveLicense),
    (window.pkRevokeLicenseStorage = revokeLicense),
    (window.pkLicenseUploadHeaders = buildLicenseUploadHeaders),
    (window.pkLocalLicenseReady = isLocalLicenseReady));

})();
