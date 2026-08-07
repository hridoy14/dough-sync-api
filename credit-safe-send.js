/**
 * Sends prompts through the Powerkits proxy, then hands off to the original
 * background relay so the Lovable chat UI updates (native or DOM fallback).
 */
(function () {
  'use strict';

  var ACTION = 'sendPromptToLovable';
  var TAB_URL_PATTERNS = [
    'https://lovable.dev/*',
    'https://*.lovable.dev/*'
  ];

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

  function parseProjectIdFromUrl(url) {
    if (!url) return '';
    try {
      var u = new URL(url);
      var parts = u.pathname.split('/').filter(Boolean);
      var idx = parts.indexOf('projects');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      idx = parts.indexOf('project');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      return u.searchParams.get('projectId') || u.searchParams.get('project_id') || '';
    } catch (e) { /* ignore */ }
    return '';
  }

  function findLovableTabs() {
    return new Promise(function (resolve) {
      chrome.tabs.query({ url: TAB_URL_PATTERNS }, function (tabs) {
        resolve(tabs || []);
      });
    });
  }

  function pickBestTab(tabs) {
    if (!tabs || !tabs.length) return null;
    var withProject = tabs.find(function (t) {
      return parseProjectIdFromUrl(t.url);
    });
    if (withProject) return withProject;
    var active = tabs.find(function (t) { return t.active; });
    return active || tabs[0];
  }

  function storageGet(keys) {
    return new Promise(function (resolve) {
      chrome.storage.local.get(keys, resolve);
    });
  }

  function isLicenseActive(data) {
    data = data || {};
    if (data.ql_integrity_failed || !data.ql_license_valid) return false;
    var status = String(data.ql_license_status || 'active').toLowerCase();
    if (status === 'revoked' || status === 'expired' || status === 'exhausted') return false;
    if (data.ql_expires_at) {
      var text = String(data.ql_expires_at).trim();
      if (text && !/Z|[+-]\d{2}/.test(text)) text = text.replace(' ', 'T') + 'Z';
      var exp = Date.parse(text);
      if (!isNaN(exp) && exp < Date.now()) return false;
    }
    return true;
  }

  function tokenFromStorageBlob(stored) {
    stored = stored || {};
    var direct =
      looksLikeToken(stored.token_lovable) ||
      looksLikeToken(stored.cookieToken) ||
      looksLikeToken(stored.token) ||
      looksLikeToken(stored.access_token) ||
      '';
    if (direct) return direct;

    if (stored.tokens && typeof stored.tokens === 'object') {
      direct =
        looksLikeToken(stored.tokens.lovable) ||
        looksLikeToken(stored.tokens.token) ||
        looksLikeToken(stored.tokens.access) ||
        '';
      if (direct) return direct;
    }

    var key;
    for (key in stored) {
      if (!Object.prototype.hasOwnProperty.call(stored, key)) continue;
      if (!/token|auth|session|jwt/i.test(key)) continue;
      direct = looksLikeToken(stored[key]) || tokenFromJson(stored[key]);
      if (direct) return direct;
    }

    return '';
  }

  function projectIdFromStorage(stored, tab) {
    stored = stored || {};
    return (
      stored.project_id ||
      stored.projectId ||
      parseProjectIdFromUrl(tab && tab.url) ||
      ''
    );
  }

  function requestTabAuth(tabId) {
    return new Promise(function (resolve) {
      if (!tabId) return resolve({ token: '', projectId: '' });

      chrome.tabs.sendMessage(
        tabId,
        { action: 'getLovableAuth' },
        function (response) {
          if (chrome.runtime.lastError || !response) {
            resolve({ token: '', projectId: '' });
            return;
          }
          resolve({
            token: response.token || response.token_lovable || '',
            projectId: response.projectId || response.project_id || ''
          });
        }
      );
    });
  }

  function scanPageAuth(tabId) {
    return new Promise(function (resolve) {
      if (!tabId || !chrome.scripting || !chrome.scripting.executeScript) {
        resolve({ token: '', projectId: '' });
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          world: 'MAIN',
          func: function () {
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

            function projectIdFromLocation() {
              try {
                var parts = location.pathname.split('/').filter(Boolean);
                var idx = parts.indexOf('projects');
                if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
                idx = parts.indexOf('project');
                if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
                var params = new URLSearchParams(location.search || '');
                return params.get('projectId') || params.get('project_id') || '';
              } catch (e) {
                return '';
              }
            }

            var token = '';
            var i;
            var key;
            var value;
            var prefixes = ['ql_', 'gringow_', 'pk_', 'lovable_', ''];
            var names = [
              'token_lovable',
              'lovable_token',
              'token',
              'auth_token',
              'access_token',
              'session_token'
            ];

            try {
              for (i = 0; i < localStorage.length; i++) {
                key = localStorage.key(i);
                if (!key) continue;
                value = localStorage.getItem(key) || '';
                if (/token|auth|session|jwt|bearer/i.test(key)) {
                  token = looksLikeToken(value) || tokenFromJson(value) || token;
                }
                if (/^sb-.*-auth-token$/i.test(key)) {
                  token = tokenFromJson(value) || token;
                }
              }

              if (!token) {
                var n;
                var p;
                for (n = 0; n < names.length; n++) {
                  for (p = 0; p < prefixes.length; p++) {
                    value = localStorage.getItem(prefixes[p] + names[n]);
                    token = looksLikeToken(value) || tokenFromJson(value);
                    if (token) break;
                  }
                  if (token) break;
                }
              }
            } catch (e) { /* ignore */ }

            return {
              token: token,
              projectId: projectIdFromLocation()
            };
          }
        },
        function (results) {
          if (chrome.runtime.lastError || !results || !results[0] || !results[0].result) {
            resolve({ token: '', projectId: '' });
            return;
          }
          resolve(results[0].result);
        }
      );
    });
  }

  function readCookieToken() {
    return new Promise(function (resolve) {
      if (!chrome.cookies || !chrome.cookies.getAll) {
        resolve('');
        return;
      }

      chrome.cookies.getAll({ url: 'https://lovable.dev/' }, function (cookies) {
        var token = '';
        (cookies || []).forEach(function (cookie) {
          if (token) return;
          if (!cookie || !cookie.value) return;
          if (!/token|auth|session|jwt/i.test(cookie.name)) return;
          token = looksLikeToken(cookie.value) || tokenFromJson(cookie.value) || token;
        });
        resolve(token);
      });
    });
  }

  async function resolveAuth() {
    var stored = await storageGet(null);
    if (!isLicenseActive(stored)) {
      throw new Error('License not active. Activate your Lovable Pro license first.');
    }

    var tabs = await findLovableTabs();
    var tab = pickBestTab(tabs);
    var token = tokenFromStorageBlob(stored);
    var projectId = projectIdFromStorage(stored, tab);

    if (tab && tab.id) {
      var fromTab = await requestTabAuth(tab.id);
      if (!token) token = looksLikeToken(fromTab.token);
      if (!projectId) projectId = fromTab.projectId || '';
    }

    if (tab && tab.id && (!token || !projectId)) {
      var fromPage = await scanPageAuth(tab.id);
      if (!token) token = looksLikeToken(fromPage.token);
      if (!projectId) projectId = fromPage.projectId || '';
    }

    if (!token) {
      token = await readCookieToken();
    }

    if (!projectId && tabs.length) {
      for (var i = 0; i < tabs.length; i++) {
        projectId = parseProjectIdFromUrl(tabs[i].url);
        if (projectId) {
          tab = tabs[i];
          break;
        }
      }
    }

    if (!token || !projectId) {
      throw new Error(
        'Token and projectId are required. Open your Lovable project at lovable.dev/projects/..., log in, then reload that tab once after installing the extension.'
      );
    }

    return { token: token, projectId: projectId, tabId: tab && tab.id };
  }

  async function sendViaProxy(message, files) {
    if (typeof PROXY_COMMAND_URL === 'undefined' || !PROXY_COMMAND_URL) {
      throw new Error('Proxy is not configured.');
    }

    var auth = await resolveAuth();
    var stored = await storageGet(null);
    var headers = { 'Content-Type': 'application/json' };
    if (typeof powerkitsApiHeaders === 'function') {
      Object.assign(headers, powerkitsApiHeaders());
    }

    var body = {
      token_lovable: auth.token,
      projeto_id: auth.projectId,
      mensagem: String(message || '')
    };

    if (stored && stored.ql_license_key) {
      body.ql_license_key = stored.ql_license_key;
    }

    if (files && files.length) {
      body.arquivos = files;
      body.files = files;
    }

    var response = await fetch(PROXY_COMMAND_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    var text = await response.text();
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    if (!response.ok) {
      var errText = (data && (data.error || data.message)) || text || ('HTTP ' + response.status);
      throw new Error(String(errText));
    }

    return data;
  }

  var originalAddListener = chrome.runtime.onMessage.addListener.bind(chrome.runtime.onMessage);

  chrome.runtime.onMessage.addListener = function (listener) {
    originalAddListener(function (request, sender, sendResponse) {
      if (!request || request.action !== ACTION) {
        return listener(request, sender, sendResponse);
      }

      var responded = false;

      function replyOnce(payload) {
        if (responded) return;
        responded = true;
        sendResponse(payload);
      }

      sendViaProxy(request.message, request.files)
        .catch(function () { /* UI relay still runs if proxy fails */ })
        .then(function () {
          try {
            var keepChannel = listener(request, sender, function (relayResponse) {
              replyOnce(relayResponse || { ok: true });
            });
            if (keepChannel !== true) {
              replyOnce({ ok: true });
            }
          } catch (err) {
            replyOnce({
              ok: false,
              error: err && err.message ? err.message : String(err)
            });
          }
        });

      return true;
    });
  };
})();
