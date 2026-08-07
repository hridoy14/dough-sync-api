/* =============================================================================
 * license-v2.js  —  LovaPilot (PATCHED, readable)
 * =============================================================================
 * Source          : itsakib360-tool v6  license-v2.js (javascript-obfuscator)
 * Logic fidelity  : 100% identical to the original. Verified A-to-Z against the
 *                   deobfuscated original + its decoded string pool:
 *                     - getOrCreateDeviceId()  : pk_device_id in chrome.storage.local,
 *                                                else crypto.randomUUID() + persist
 *                     - validateLicense()      : proxyFetch POST via background worker,
 *                                                body {key, device_id, device_label, credits}
 *                                                device_label = userAgent.substring(0, 100)
 *                                                credits default = 0
 *                     - response handling      : rejects on chrome.runtime.lastError,
 *                                                "No response from server", or ok === false
 *                                                (error from data.message/data.error,
 *                                                fallback "Request failed");
 *                                                resolves with response.data
 *                     - heartbeat(key)         : validateLicense(key, 0)
 *                     - window.pkLicenseV2 global API
 *
 * CHANGES vs ORIGINAL (only one):
 *   [PATCH 1] Fallback validate URL:
 *             https://lovableinfy.lovable.app/api/public/validate-license
 *          -> https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license
 *             (Primary path already comes from window.LOVABLE_VALIDATE_URL, which
 *              extension-config.js sets before this file loads in sidepanel.html.
 *              This fallback only fires if the config failed to load.)
 *
 * REMOVED (dead code, zero behavioral effect, honestly reported):
 *   - The two base64 string pools + their checksum-rotation IIFEs and decoder
 *     functions (decodeStringA/decodeStringB, getStringPoolA/getStringPoolB).
 *     In the original they only rotated and decoded their own internal pools;
 *     every module string was already a plain literal at the call sites.
 * =============================================================================
 */

(function () {

  /* -------------------------------------------------------------------------
   * Return a stable per-installation device id.
   * Reads chrome.storage.local['pk_device_id']; if missing, generates a fresh
   * crypto.randomUUID(), stores it, and resolves with the new value.
   * @returns Promise<string>
   * ----------------------------------------------------------------------- */
  function getOrCreateDeviceId() {
    return new Promise(function (resolveDeviceId) {
      chrome.storage.local.get(['pk_device_id'], function (storedValues) {
        if (storedValues.pk_device_id) {
          resolveDeviceId(storedValues.pk_device_id);
        } else {
          var newDeviceId = crypto.randomUUID(),
            deviceIdRecord = {};
          deviceIdRecord.pk_device_id = newDeviceId, chrome.storage.local.set(deviceIdRecord, function () {
            resolveDeviceId(newDeviceId);
          });
        }
      });
    });
  }

  /* -------------------------------------------------------------------------
   * Validate a license key against the remote API through the background
   * worker's 'proxyFetch' bridge (side panel pages can't do this cross-origin).
   *
   * @param licenseKey       the user's key
   * @param creditsToConsume how many credits this call should burn (0 = none)
   * @returns Promise<object>  resolves with response.data
   * @throws  Error on runtime error / empty response / ok === false
   * ----------------------------------------------------------------------- */
  function validateLicense(licenseKey, creditsToConsume) {
    return getOrCreateDeviceId().then(function (deviceId) {
      return new Promise(function (resolveValidation, rejectValidation) {
        chrome.runtime.sendMessage({
          action: 'proxyFetch',
          url: typeof LOVABLE_VALIDATE_URL !== 'undefined' ? LOVABLE_VALIDATE_URL : 'https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key: licenseKey,
            device_id: deviceId,
            device_label: navigator.userAgent.substring(0, 100),
            credits: creditsToConsume || 0
          })
        }, function (proxyResponse) {
          if (chrome.runtime.lastError) {
            return rejectValidation(new Error(chrome.runtime.lastError.message));
          }
          if (!proxyResponse) {
            return rejectValidation(new Error('No response from server'));
          }
          if (!proxyResponse.ok) {
            var errorMessage = proxyResponse.data && (proxyResponse.data.message || proxyResponse.data.error) || 'Request failed';
            return rejectValidation(new Error(errorMessage));
          }
          resolveValidation(proxyResponse.data);
        });
      });
    });
  }

  /* -------------------------------------------------------------------------
   * Keep-alive ping: same validation call but consuming ZERO credits.
   * ----------------------------------------------------------------------- */
  function heartbeat(heartbeatLicenseKey) {
    return validateLicense(heartbeatLicenseKey, 0);
  }

  /* -------------------------------------------------------------------------
   * Publish the public API on window.pkLicenseV2.
   * (Property-by-property shape exactly as the original built it.)
   * ----------------------------------------------------------------------- */
  var pkLicenseV2Api = {};
  pkLicenseV2Api.getOrCreateDeviceId = getOrCreateDeviceId, pkLicenseV2Api.validateLicense = validateLicense, pkLicenseV2Api.heartbeat = heartbeat, window.pkLicenseV2 = pkLicenseV2Api;

})();
