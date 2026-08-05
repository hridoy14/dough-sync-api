/**
 * Sidepanel footer — show Connected only when license is active.
 */
(function () {
  'use strict';

  var BADGE_ID = 'sp-footer-connection';
  var STORAGE_KEYS = [
    'ql_license_valid',
    'ql_license_status',
    'ql_expires_at',
    'ql_integrity_failed'
  ];

  function parseExpiry(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'number' && !isNaN(value)) return value;
    var text = String(value).trim();
    if (!text) return null;
    if (!/Z|[+-]\d{2}/.test(text)) {
      text = text.replace(' ', 'T');
      if (text.indexOf('T') === -1) text += 'T00:00:00';
      text += 'Z';
    }
    var time = Date.parse(text);
    return isNaN(time) ? null : time;
  }

  function isLicenseActive(data) {
    data = data || {};
    if (data.ql_integrity_failed) return false;
    if (typeof window.pkIsIntegrityOk === 'function' && !window.pkIsIntegrityOk()) return false;
    if (!data.ql_license_valid) return false;

    var status = String(data.ql_license_status || 'active').toLowerCase();
    if (status === 'revoked' || status === 'expired' || status === 'exhausted') return false;

    var expiresAt = parseExpiry(data.ql_expires_at);
    if (expiresAt != null && expiresAt < Date.now()) return false;

    return true;
  }

  function applyBadge(active) {
    var el = document.getElementById(BADGE_ID);
    if (!el) return;
    el.textContent = active ? 'Connected' : 'Not active';
    el.classList.toggle('sp-footer-badge-ok', active);
    el.classList.toggle('sp-footer-badge-off', !active);
  }

  function refreshFromStorage() {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      applyBadge(false);
      return;
    }
    chrome.storage.local.get(STORAGE_KEYS, function (data) {
      applyBadge(isLicenseActive(data));
    });
  }

  function init() {
    var ready = window.__qlIntegrityReady;
    if (ready && typeof ready.finally === 'function') {
      ready.finally(refreshFromStorage);
    } else if (ready && typeof ready.then === 'function') {
      ready.then(refreshFromStorage, refreshFromStorage);
    } else {
      refreshFromStorage();
    }

    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== 'local') return;
      for (var i = 0; i < STORAGE_KEYS.length; i++) {
        if (Object.prototype.hasOwnProperty.call(changes, STORAGE_KEYS[i])) {
          refreshFromStorage();
          return;
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
