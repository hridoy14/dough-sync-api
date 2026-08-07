/**
 * Lovable Pro — runtime integrity verification.
 * Build release sets INTEGRITY_DEV_SKIP=false and generates integrity-manifest.json hashes.
 */
(function (global) {
  'use strict';

  var INTEGRITY_DEV_SKIP = true;
  var MANIFEST_FILE = 'integrity-manifest.json';
  var STORAGE_KEY = 'ql_integrity_failed';

  global.__qlIntegrityOk = INTEGRITY_DEV_SKIP;
  global.__qlIntegrityFailed = false;
  global.__qlIntegrityReady = INTEGRITY_DEV_SKIP
    ? Promise.resolve(true)
    : null;

  function getRuntime() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome;
    }
    return null;
  }

  function sha256Hex(buffer) {
    return crypto.subtle.digest('SHA-256', buffer).then(function (hash) {
      return Array.from(new Uint8Array(hash))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  function failIntegrity(reason) {
    global.__qlIntegrityOk = false;
    global.__qlIntegrityFailed = true;

    var rt = getRuntime();
    if (!rt || !rt.storage || !rt.storage.local) return;

    rt.storage.local.set({
      ql_integrity_failed: true,
      ql_integrity_reason: String(reason || 'tamper'),
      ql_license_valid: false,
      ql_license_key: '',
      ql_license_data: null,
      plan: null
    });

    try {
      if (rt.action && rt.action.setBadgeText) {
        rt.action.setBadgeText({ text: '!' });
        rt.action.setBadgeBackgroundColor({ color: '#ef4444' });
      }
    } catch (e) { /* ignore */ }
  }

  function verifyManifest(manifest) {
    var rt = getRuntime();
    if (!manifest || manifest.skip === true) {
      global.__qlIntegrityOk = true;
      return Promise.resolve(true);
    }

    if (!rt || !manifest.files || !manifest.files.length) {
      failIntegrity('no_manifest');
      return Promise.resolve(false);
    }

    var checks = manifest.files.map(function (entry) {
      var url = rt.runtime.getURL(entry.path);
      return fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error('missing:' + entry.path);
          return res.arrayBuffer();
        })
        .then(function (buf) { return sha256Hex(buf); })
        .then(function (hex) {
          if (hex !== entry.sha256) {
            throw new Error('hash:' + entry.path);
          }
        });
    });

    return Promise.all(checks).then(function () {
      global.__qlIntegrityOk = true;
      global.__qlIntegrityFailed = false;
      if (rt.storage && rt.storage.local) {
        rt.storage.local.set({ ql_integrity_failed: false, ql_integrity_reason: '' });
      }
      return true;
    }).catch(function (err) {
      failIntegrity(err && err.message ? err.message : 'verify_failed');
      return false;
    });
  }

  function loadAndVerify() {
    if (INTEGRITY_DEV_SKIP) {
      global.__qlIntegrityOk = true;
      return Promise.resolve(true);
    }

    var rt = getRuntime();
    if (!rt) {
      global.__qlIntegrityOk = true;
      return Promise.resolve(true);
    }

    return fetch(rt.runtime.getURL(MANIFEST_FILE))
      .then(function (res) {
        if (!res.ok) throw new Error('manifest_missing');
        return res.json();
      })
      .then(verifyManifest)
      .catch(function (err) {
        failIntegrity(err && err.message ? err.message : 'manifest_error');
        return false;
      });
  }

  global.pkVerifyIntegrity = loadAndVerify;
  global.pkIsIntegrityOk = function () {
    return !!global.__qlIntegrityOk && !global.__qlIntegrityFailed;
  };

  global.__qlIntegrityReady = loadAndVerify();
})(typeof self !== 'undefined' ? self : window);
