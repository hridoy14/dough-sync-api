// =============================================
// license-fix.js
// Generic license validation for both floating UI and side panel
// Works independently of content.js validateLicense()
// =============================================

(function () {
  // =============================================
  // CONFIGURATION
  // =============================================

  // API endpoint for license validation
  var VALIDATION_API_URL = "https://dough-sync-api.vercel.app/api/session-start";

  // API authorization key (Anon Key for Supabase/Vercel)
  var API_AUTH_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcnpkZ2t5eWRmdXRyYmNiYnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzI0NDcsImV4cCI6MjA5ODE0ODQ0N30.EqPZXQ9eukJPWIMSUrMd84XqpEKGEMzL88XT0Y-TwJ8";

  // Validation lock flag (prevents double-clicks)
  var isValidationInProgress = false;

  // =============================================
  // HELPER: Safe querySelector
  // =============================================

  function safeQuerySelector(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  // =============================================
  // HELPER: Get validation context (floating vs side panel)
  // =============================================

  function getValidationContext() {
    // Check if side panel validate button exists
    var sidePanelBtn = safeQuerySelector("#sp-validate-btn");

    return {
      isSidePanel: !!sidePanelBtn,
      // Use side panel button if exists, otherwise floating UI button
      btn: sidePanelBtn || safeQuerySelector("#ql-validate-btn"),
      // Input field (side panel or floating)
      inp: safeQuerySelector(sidePanelBtn ? "#sp-license-input" : "#ql-license-input"),
      // Log display element
      log: safeQuerySelector(sidePanelBtn ? "#sp-license-log" : "#ql-license-log"),
      // CSS class prefixes
      logBase: sidePanelBtn ? "sp-log" : "ql-log",
      logSuccess: sidePanelBtn ? "sp-log-success" : "ql-log-success",
      logError: sidePanelBtn ? "sp-log-error" : "ql-log-error",
      logInfo: sidePanelBtn ? "sp-log-info" : "ql-log-info"
    };
  }

  // =============================================
  // HELPER: Show validation message
  // =============================================

  function showValidationMessage(message, className) {
    var context = getValidationContext();

    // Create log element if it doesn't exist but button does
    if (!context.log && context.btn) {
      context.log = document.createElement("div");
      context.log.id = context.isSidePanel ? "sp-license-log" : "ql-license-log";
      context.btn.insertAdjacentElement("afterend", context.log);
    }

    // Exit if no log element
    if (!context.log) {
      return;
    }

    // Apply styling and message
    context.log.className = context.logBase + " " + (className || context.logInfo);
    context.log.textContent = message;
    context.log.style.cssText += ";display:block!important;visibility:visible!important;opacity:1!important;min-height:18px!important;margin-top:10px!important;padding:8px 10px!important;border-radius:10px!important;background:rgba(255,255,255,.08)!important;color:inherit!important;position:relative!important;z-index:999999!important;";
  }

  // =============================================
  // HELPER: Get device ID (hardware fingerprint)
  // =============================================

  function getDeviceIdForValidation() {
    return new Promise(function (resolve) {
      // Try hardware fingerprint first
      try {
        if (typeof getHardwareFingerprint === "function") {
          Promise.resolve(getHardwareFingerprint()).then(function (fp) {
            resolve(fp || "device-generic");
          }).catch(function () {
            resolve("device-generic");
          });
          return;
        }
      } catch (error) {}

      // Fallback: use stored device ID or generate new one
      try {
        chrome.storage.local.get(["ql_device_id_fallback"], function (result) {
          if (result && result.ql_device_id_fallback) {
            return resolve(result.ql_device_id_fallback);
          }
          // Generate new device ID
          var newDeviceId = "device-" + Date.now() + "-" + Math.random().toString(16).slice(2);
          chrome.storage.local.set({
            ql_device_id_fallback: newDeviceId
          }, function () {
            resolve(newDeviceId);
          });
        });
      } catch (error) {
        resolve("device-generic");
      }
    });
  }

  // =============================================
  // HELPER: Send validation request
  // =============================================

  function sendValidationRequest(requestOptions) {
    return new Promise(function (resolve, reject) {
      // Try background proxy first (CORS bypass)
      try {
        chrome.runtime.sendMessage({
          action: "proxyFetch",
          url: VALIDATION_API_URL,
          method: "POST",
          headers: requestOptions.headers,
          body: requestOptions.body
        }, function (response) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response) {
            reject(new Error("No response from background"));
            return;
          }
          resolve(response.data || {});
        });
        return;
      } catch (error) {}

      // Fallback: direct fetch
      fetch(VALIDATION_API_URL, requestOptions).then(function (response) {
        return response.text().then(function (text) {
          try {
            return JSON.parse(text);
          } catch (parseError) {
            return {
              valid: false,
              message: text || "HTTP " + response.status
            };
          }
        });
      }).then(resolve).catch(reject);
    });
  }

  // =============================================
  // MAIN: Perform license validation
  // =============================================

  async function performLicenseValidation() {
    // Prevent double validation
    if (isValidationInProgress) {
      return;
    }

    // Get UI context
    var context = getValidationContext();
    if (!context.btn) {
      return;
    }

    // Get license key from input
    var licenseKey = context.inp ? String(context.inp.value || "").trim() : "";
    if (!licenseKey) {
      showValidationMessage("\u26a0 Enter a key", context.logError);
      if (context.inp) {
        context.inp.focus();
      }
      return;
    }

    // Lock validation
    isValidationInProgress = true;
    var originalButtonText = context.btn.textContent || "Validate License";
    context.btn.disabled = true;
    context.btn.textContent = "Validating...";
    showValidationMessage("\u23f3 Validating...", context.logInfo);

    try {
      // Get device ID
      var deviceId = await getDeviceIdForValidation();

      // Send validation request
      var validationResult = await sendValidationRequest({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + API_AUTH_KEY
        },
        body: JSON.stringify({
          license_key: licenseKey,
          device_id: deviceId
        })
      });

      // Handle successful validation
              if (validationResult && (validationResult.valid || validationResult.success)) {
        chrome.storage.local.set({
          ql_license_valid: true,
          ql_license_key: licenseKey,
          license_key: licenseKey,
          device_id: deviceId,
          ql_device_id_fallback: deviceId,
          ql_session_id: validationResult.session_id || null,
          ql_user_name: validationResult.user_name || null,
          ql_expires_at: validationResult.expires_at || null,
          ql_activated_at: validationResult.activated_at || null,
          ql_license_status: validationResult.status || null,
          customer_email: validationResult.customer_email || null,
          project_email: validationResult.project_email || null,
          project_name: validationResult.project_name || null,
          project_id: validationResult.project_id || null,
          browser: validationResult.browser || null,
          os: validationResult.os || null
        }, function () {
          // Show success message
          showValidationMessage("\u2713 " + (validationResult.message || "License valid"), context.logSuccess);

          // Activate bypass and show main UI
          try {
            if (typeof activateBypass === "function") {
              activateBypass();
            }
            if (typeof showMainUI === "function") {
              if (context.isSidePanel) {
                showMainUI();
              } else {
                var floatingContainer = document.getElementById("ql-floating");
                if (floatingContainer) {
                  showMainUI(floatingContainer);
                }
              }
            }
            if (typeof startHeartbeat === "function") {
              startHeartbeat(validationResult.license_key || licenseKey);
            }
          } catch (error) {}

          // Reload if still on license gate
          setTimeout(function () {
            try {
              if (document.querySelector("#sp-body .sp-license-gate,#ql-body .ql-license-gate")) {
                location.reload();
              }
            } catch (error) {}
          }, 900);
        });
      } else {
        // Show error message
        showValidationMessage(
          "\u2717 " + (validationResult && (validationResult.message || validationResult.error || validationResult.raw) || "Invalid license"),
          context.logError
        );
      }
    } catch (error) {
      console.error("[License validation]", error);
      showValidationMessage("\u2717 Connection error. Please try again.", context.logError);
    } finally {
      // Unlock validation
      isValidationInProgress = false;
      var contextAfter = getValidationContext();
      if (contextAfter.btn) {
        contextAfter.btn.disabled = false;
        contextAfter.btn.textContent = originalButtonText;
      }
    }
  }

  // =============================================
  // HELPER: Bind validation button click handler
  // =============================================

  function bindValidationButton() {
    var context = getValidationContext();
    if (!context.btn) {
      return;
    }

    // Ensure button is clickable
    context.btn.disabled = false;
    context.btn.style.pointerEvents = "auto";
    context.btn.style.cursor = "pointer";
    context.btn.style.position = context.btn.style.position || "relative";
    context.btn.style.zIndex = "999999";

    // Prevent double-binding
    if (context.btn.dataset.genericValidateBound === "1") {
      return;
    }

    context.btn.dataset.genericValidateBound = "1";
    context.btn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      performLicenseValidation();
    }, true);
  }

  // =============================================
  // GLOBAL: Document click listener (capture phase)
  // =============================================

  document.addEventListener("click", function (event) {
    var target = event.target && event.target.closest && event.target.closest("#sp-validate-btn,#ql-validate-btn");
    if (!target) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    performLicenseValidation();
  }, true);

  // =============================================
  // GLOBAL: Document keydown listener (Enter key)
  // =============================================

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") {
      return;
    }
    var isInput = event.target && event.target.matches && event.target.matches("#sp-license-input,#ql-license-input");
    if (!isInput) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    performLicenseValidation();
  }, true);

  // =============================================
  // MUTATION OBSERVER: Watch for dynamically added buttons
  // =============================================

  try {
    new MutationObserver(bindValidationButton).observe(
      document.documentElement || document.body,
      { childList: true, subtree: true }
    );
  } catch (error) {}

  // =============================================
  // INITIALIZATION: Bind on DOM ready
  // =============================================

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindValidationButton);
  } else {
    bindValidationButton();
  }

  // Periodic re-binding (every 500ms) for dynamically added elements
  setInterval(bindValidationButton, 500);

})();
