/**
 * Exposes captured Lovable session data to the background proxy sender.
 */
(function () {
  'use strict';

  var STORAGE_KEY_CANDIDATES = [
    'token_lovable',
    'lovable_token',
    'token',
    'auth_token',
    'access_token',
    'session_token',
    'id_token'
  ];

  var STORAGE_PREFIXES = ['ql_', 'gringow_', 'pk_', 'lovable_', ''];

  function looksLikeToken(value) {
    if (!value || typeof value !== 'string') return '';
    var text = value.trim();
    if (text.length < 20) return '';
    if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text)) return text;
    if (/^[A-Za-z0-9_-]{32,}$/.test(text)) return text;
    return '';
  }

  function tokenFromJson(value) {
    if (!value) return '';
    try {
      var parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (!parsed || typeof parsed !== 'object') return '';
      return (
        looksLikeToken(parsed.access_token) ||
        looksLikeToken(parsed.token) ||
        looksLikeToken(parsed.id_token) ||
        looksLikeToken(parsed.session_token) ||
        looksLikeToken(parsed.jwt) ||
        ''
      );
    } catch (e) {
      return '';
    }
  }

  function readLocalStorageToken() {
    try {
      var i;
      var key;
      var value;
      var token = '';

      for (i = 0; i < localStorage.length; i++) {
        key = localStorage.key(i);
        if (!key) continue;
        value = localStorage.getItem(key) || '';

        if (/token|auth|session|jwt|bearer/i.test(key)) {
          token =
            looksLikeToken(value) ||
            tokenFromJson(value) ||
            token;
        }

        if (/^sb-.*-auth-token$/i.test(key)) {
          token = tokenFromJson(value) || token;
        }
      }

      if (token) return token;

      for (i = 0; i < STORAGE_KEY_CANDIDATES.length; i++) {
        var candidate = STORAGE_KEY_CANDIDATES[i];
        var p;
        for (p = 0; p < STORAGE_PREFIXES.length; p++) {
          value = localStorage.getItem(STORAGE_PREFIXES[p] + candidate);
          token = looksLikeToken(value) || tokenFromJson(value);
          if (token) return token;
        }
      }

      if (typeof pkPageStorageGet === 'function') {
        for (i = 0; i < STORAGE_KEY_CANDIDATES.length; i++) {
          value = pkPageStorageGet(STORAGE_KEY_CANDIDATES[i]);
          token = looksLikeToken(value) || tokenFromJson(value);
          if (token) return token;
        }
      }
    } catch (e) { /* ignore */ }

    return '';
  }

  function projectIdFromLocation() {
    try {
      var parts = window.location.pathname.split('/').filter(Boolean);
      var idx = parts.indexOf('projects');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      idx = parts.indexOf('project');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      var params = new URLSearchParams(window.location.search || '');
      return params.get('projectId') || params.get('project_id') || '';
    } catch (e) { /* ignore */ }
    return '';
  }

  function buildAuthResponse(stored) {
    stored = stored || {};
    var token = looksLikeToken(stored.token_lovable) || readLocalStorageToken();
    var projectId =
      stored.project_id ||
      stored.projectId ||
      projectIdFromLocation() ||
      '';

    return {
      ok: true,
      token: token,
      token_lovable: token,
      projectId: projectId,
      project_id: projectId
    };
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request || request.action !== 'getLovableAuth') return;

    chrome.storage.local.get(
      ['token_lovable', 'project_id', 'projectId', 'tokens', 'cookieToken'],
      function (stored) {
        var response = buildAuthResponse(stored);

        if (!response.token && stored && stored.cookieToken) {
          response.token = looksLikeToken(stored.cookieToken) || response.token;
          response.token_lovable = response.token;
        }

        if (!response.token && stored && stored.tokens && typeof stored.tokens === 'object') {
          response.token =
            looksLikeToken(stored.tokens.lovable) ||
            looksLikeToken(stored.tokens.token) ||
            looksLikeToken(stored.tokens.access) ||
            response.token;
          response.token_lovable = response.token;
        }

        sendResponse(response);
      }
    );

    return true;
  });
})();
