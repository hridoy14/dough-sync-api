// =============================================
// license-fix.js
// License fix and device management utilities
// =============================================

(function() {
  'use strict';

  console.log('[license-fix] Loaded');

  // =============================================
  // LICENSE STATUS CHECK
  // =============================================

  const LICENSE_ENDPOINTS = {
    validate: 'https://dough-sync-api.vercel.app/api/session-start',
    heartbeat: 'https://dough-sync-api.vercel.app/api/heartbeat'
  };

  // =============================================
  // DEVICE FINGERPRINT
  // =============================================

  function getDeviceId() {
    try {
      if (typeof getHardwareFingerprint === 'function') {
        return getHardwareFingerprint();
      }
    } catch (e) {}

    // Fallback
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      navigator.hardwareConcurrency || 2
    ];
    const str = components.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return 'device-' + Math.abs(hash).toString(36);
  }

  // =============================================
  // LICENSE VALIDATION
  // =============================================

  async function validateLicense(licenseKey) {
    try {
      const response = await fetch(LICENSE_ENDPOINTS.validate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: licenseKey,
          device_id: getDeviceId()
        })
      });

      return await response.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // =============================================
  // HEARTBEAT
  // =============================================

  async function sendHeartbeat(licenseKey, sessionId, sessionToken) {
    try {
      const response = await fetch(LICENSE_ENDPOINTS.heartbeat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: licenseKey,
          device_id: getDeviceId(),
          session_id: sessionId,
          session_token: sessionToken,
          heartbeat: true
        })
      });

      return await response.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // =============================================
  // DEVICE CONFLICT HANDLER
  // =============================================

  function handleDeviceConflict() {
    chrome.storage.local.remove([
      'ql_license_valid',
      'ql_license_key',
      'ql_session_id',
      'ql_user_name',
      'ql_expires_at',
      'ql_activated_at',
      'ql_license_status'
    ]);

    console.log('[license-fix] Device conflict - license cleared');
  }

  // =============================================
  // EXPORT TO GLOBAL SCOPE
  // =============================================

  window.LicenseFix = {
    validateLicense: validateLicense,
    sendHeartbeat: sendHeartbeat,
    handleDeviceConflict: handleDeviceConflict,
    getDeviceId: getDeviceId
  };

})();
