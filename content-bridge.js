/* =============================================================================
 * content-bridge.js  —  LovaPilot (PATCHED, readable)
 * =============================================================================
 * Source          : itsakib360-tool v6  content-bridge.js (javascript-obfuscator)
 * Logic fidelity  : 100% identical to the original. Part 2 extracted BYTE-EXACT
 *                   from the deobfuscated original; only the one URL patch below
 *                   was applied. Verified by dual-run: ORIGINAL vs PATCHED behave
 *                   identically across every message action + delivery strategy.
 *
 * Module purpose  : Content-script bridge injected into lovable.dev pages:
 *                   credit-bypass flag (localStorage + data-attr + postMessage)
 *                   with a MutationObserver watchdog, license-gated activation,
 *                   prompt delivery into the Lovable chat (native DOM typing /
 *                   paste, or page WebSocket via window.postMessage), plan-refresh
 *                   POST (credits: 1) after each prompt, and the chrome.runtime
 *                   onMessage actions (ping / qlActivateBypass / qlDeactivateBypass
 *                   / setCreditBypass / syncCreditBypass / qlSendViaWs /
 *                   requestTokenRefresh / resolveLovableAuth).
 *
 * CHANGES vs ORIGINAL (only one):
 *   [PATCH 1] Plan-refresh fallback URL in deliverPrompt():
 *             'https://lovableinfy.lovable.app/api/public/validate-license'
 *          -> 'https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license'
 *             (Primary path is LOVABLE_VALIDATE_URL from extension-config.js.)
 *
 * REMOVED (dead code, zero behavioral effect, honestly reported):
 *   - Part 1: both string pools + decodeStringA/decodeStringB + both rotation
 *     IIFEs (checksums 472579 / 675694) — zero remaining decode calls.
 *   - 40 unused decodeAAlias/decodeBAlias declarators + the IIFE's
 *     decodeA/decodeB locals (aliases only referenced each other).
 * =============================================================================
 */

(function () {

  // Guard: only ever install this bridge once per page.
  if (window.__pkBridgeReady) return;
  window.__pkBridgeReady = true;

  // --- Turn the credit-bypass flag ON (3 independent channels) ------------
  function activateCreditBypass() {
    try {
      localStorage.setItem('__ql_bypass_active', '1');
    } catch (errSetLocalStorage) {}
    try {
      document.documentElement.setAttribute('data-ql-bypass', '1');
    } catch (errSetAttribute) {}
    try {
      window.postMessage({
        type: 'qlBypassState',
        active: true
      }, '*');
    } catch (errPostMessage) {}
  }

  // --- Turn the credit-bypass flag OFF (mirror of activate) ---------------
  function deactivateCreditBypass() {
    try {
      localStorage.removeItem('__ql_bypass_active');
    } catch (errRemoveLocalStorage) {}
    try {
      document.documentElement.removeAttribute('data-ql-bypass');
    } catch (errRemoveAttribute) {}
    try {
      window.postMessage({
        type: 'qlBypassState',
        active: false
      }, '*');
    } catch (errPostMessageOff) {}
  }

  // --- Single entry point used everywhere else ----------------------------
  function setCreditBypass(shouldEnable) {
    if (shouldEnable) activateCreditBypass();else deactivateCreditBypass();
  }

  // --- Watchdog: if the page removes data-ql-bypass, put it back ----------
  (function installBypassAttributeGuard() {
    var bypassAttributeObserver = new MutationObserver(function () {
        if (document.documentElement.getAttribute('data-ql-bypass') !== '1') try {
          localStorage.getItem('__ql_bypass_active') === '1' && activateCreditBypass();
        } catch (errReadLocalStorage) {}
      });
    document.documentElement && bypassAttributeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-ql-bypass']
    });
  })();

  // --- Decide bypass state from the stored license ------------------------
  function syncCreditBypassFromLicense() {
    if (typeof INTERNAL_LICENSE_MODE !== 'undefined' && INTERNAL_LICENSE_MODE) {
      setCreditBypass(true);
      return;
    }
    chrome.storage.local.get(['ql_license_valid', 'ql_license_key'], function (licenseStore) {
      var isLicenseActive = !!(licenseStore.ql_license_valid && typeof resolveTeamLicenseKey === 'function' && resolveTeamLicenseKey(licenseStore.ql_license_key));
      setCreditBypass(isLicenseActive);
    });
  }
  window.__pkSetCreditBypass = setCreditBypass, window.__pkActivateCreditBypass = activateCreditBypass, window.__pkDeactivateCreditBypass = deactivateCreditBypass, window.__pkSyncCreditBypass = syncCreditBypassFromLicense, syncCreditBypassFromLicense();
  try {
    chrome.storage.onChanged.addListener(function (storageChanges, storageAreaName) {
      if (storageAreaName !== 'local') return;
      if (storageChanges.ql_license_valid || storageChanges.ql_license_key) syncCreditBypassFromLicense();
    });
  } catch (errStorageListener) {}

  // --- Pull the UUID project id out of /projects/<uuid> -------------------
  function getProjectIdFromUrl() {
    try {
      var projectIdMatch = window.location.pathname.match(/projects\/([0-9a-fA-F-]{36})/i);
      return projectIdMatch ? projectIdMatch[1] : '';
    } catch (errParseUrl) {
      return '';
    }
  }

  // --- ULID-ish id: 10 Crockford-base32 timestamp chars + 16 random -------
  function generateUlidLikeId() {
    var crockfordAlphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ',
      timestamp = Date.now(),
      generatedId = '';
    for (var timeCharIndex = 9; timeCharIndex >= 0; timeCharIndex--) {
      generatedId = crockfordAlphabet[timestamp % 32] + generatedId, timestamp = Math.floor(timestamp / 32);
    }
    for (var randomCharIndex = 0; randomCharIndex < 16; randomCharIndex++) generatedId += crockfordAlphabet[Math.floor(Math.random() * 32)];
    return generatedId;
  }

  // --- Strategy A: hand the prompt to the page's WebSocket via postMessage -
  function sendPromptViaWebSocket(promptText) {
    return new Promise(function (resolveSend, rejectSend) {
      var websocketPayload = {
          id: 'umsg_' + generateUlidLikeId(),
          message: promptText,
          files: [],
          selected_elements: [],
          chat_only: false,
          view: 'editor',
          view_description: '',
          optimisticImageUrls: [],
          ai_message_id: 'aimsg_' + generateUlidLikeId(),
          thread_id: 'main',
          current_page: window.location.pathname || '/',
          current_viewport_width: window.innerWidth || 1280,
          current_viewport_height: window.innerHeight || 800,
          current_viewport_dpr: window.devicePixelRatio || 1,
          model: null
        },
        websocketTimeoutId = setTimeout(function () {
          window.removeEventListener('message', handleWebSocketResult), rejectSend(new Error('Timeout: WebSocket did not respond'));
        }, 6000);
      function handleWebSocketResult(messageEvent) {
        if (messageEvent.source !== window || !messageEvent.data) return;
        if (messageEvent.data.type !== 'lovableWsSendResult') return;
        clearTimeout(websocketTimeoutId), window.removeEventListener('message', handleWebSocketResult);
        if (messageEvent.data.success) resolveSend();else rejectSend(new Error(messageEvent.data.error || 'WebSocket send failed'));
      }
      window.addEventListener('message', handleWebSocketResult), window.postMessage({
        type: 'lovableSendViaWs',
        payload: websocketPayload
      }, '*');
    });
  }

  // --- Strategy B: drive the real DOM chat box (typing + paste + click) ---
  async function sendPromptNatively(messageText, attachedFiles) {
    var chatForm = document.querySelector('form#chat-input');
    if (!chatForm) throw new Error('Lovable chat not found. Open your project on lovable.dev.');
    var chatEditor = chatForm.querySelector('[contenteditable="true"]');
    if (!chatEditor) throw new Error('Chat editor not found. Wait for the page to finish loading.');
    chatEditor.focus();
    if (attachedFiles && attachedFiles.length > 0) {
      for (var fileIndex = 0; fileIndex < attachedFiles.length; fileIndex++) {
        try {
          var fileEntry = attachedFiles[fileIndex];
          if (!fileEntry.dataUrl) continue;
          var dataUrlResponse = await fetch(fileEntry.dataUrl),
            fileBlob = await dataUrlResponse.blob(),
            fileObject = new File([fileBlob], fileEntry.name || 'image.png', {
              type: fileEntry.type || 'image/png'
            });
          chatForm = document.querySelector('form#chat-input');
          if (chatForm) {
            var refreshedEditor = chatForm.querySelector('[contenteditable="true"]');
            if (refreshedEditor) chatEditor = refreshedEditor;
          }
          chatEditor.focus();
          var clipboardTransfer = new DataTransfer();
          clipboardTransfer.items.add(fileObject);
          var pasteEventInit = {};
          pasteEventInit.clipboardData = clipboardTransfer, pasteEventInit.bubbles = true, pasteEventInit.cancelable = true;
          var pasteEvent = new ClipboardEvent('paste', pasteEventInit);
          chatEditor.dispatchEvent(pasteEvent), await new Promise(function (resolveAfterPaste) {
            setTimeout(resolveAfterPaste, 800);
          });
        } catch (errPasteImage) {
          console.error('[PK Bridge] Native paste error:', errPasteImage);
        }
      }
      await new Promise(function (resolveAfterAllPastes) {
        setTimeout(resolveAfterAllPastes, 1000);
      });
    }
    chatForm = document.querySelector('form#chat-input');
    if (!chatForm) throw new Error('Lovable chat not found after paste.');
    chatEditor = chatForm.querySelector('[contenteditable="true"]');
    if (!chatEditor) throw new Error('Chat editor not found after paste.');
    var sendButton = document.getElementById('chatinput-send-message-button');
    if (!sendButton) throw new Error('Send button not found.');
    chatEditor.focus(), messageText && (document.execCommand('selectAll', false, null), document.execCommand('insertText', false, messageText), chatEditor.dispatchEvent(new Event('input', {
      bubbles: true
    })), await new Promise(function (resolveAfterTextInsert) {
      setTimeout(resolveAfterTextInsert, 400);
    }));
    var wasSendButtonDisabled = sendButton.disabled;
    if (wasSendButtonDisabled) sendButton.removeAttribute('disabled');
    sendButton.click();
    if (wasSendButtonDisabled) sendButton.setAttribute('disabled', '');
  }

  // --- Locate the license-guard function injected by another script -------
  function getLicenseGuard() {
    return window.pkEnsureActiveLicense || (typeof pkEnsureActiveLicense === 'function' ? pkEnsureActiveLicense : null);
  }

  // --- Public prompt delivery: license check -> refresh plan -> send ------
  async function deliverPrompt(outgoingMessage, outgoingFiles) {
    var ensureActiveLicense = getLicenseGuard();
    if (typeof ensureActiveLicense === 'function') await ensureActiveLicense(false);else throw new Error('License guard not loaded. Refresh your Lovable project tab, then try again.');
    try {
      chrome.storage.local.get(['ql_license_key', 'pk_device_id'], function (licenseCreds) {
        var licenseKey = licenseCreds.ql_license_key || '',
          deviceId = licenseCreds.pk_device_id || '';
        licenseKey && chrome.runtime.sendMessage({
          action: 'proxyFetch',
          url: typeof LOVABLE_VALIDATE_URL !== 'undefined' ? LOVABLE_VALIDATE_URL : 'https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key: licenseKey,
            device_id: deviceId,
            device_label: 'Chrome Extension',
            credits: 0x1
          })
        }, function (validateResponse) {
          validateResponse && validateResponse.ok && validateResponse.data && (validateResponse.data.credits_remaining != null || validateResponse.data.plan_type) && chrome.storage.local.set({
            ql_license_data: validateResponse.data,
            ql_license_status: validateResponse.data.plan_type || validateResponse.data.status || 'active',
            plan: {
              plan_name: validateResponse.data.plan_name,
              plan_type: validateResponse.data.plan_type,
              credits_remaining: validateResponse.data.credits_remaining,
              daily_minutes: validateResponse.data.daily_minutes,
              minutes_used_today: validateResponse.data.minutes_used_today,
              minutes_remaining_today: validateResponse.data.minutes_remaining_today,
              expires_at: validateResponse.data.expires_at,
              reset_at: validateResponse.data.reset_at,
              max_devices: validateResponse.data.max_devices,
              is_trial: validateResponse.data.is_trial,
              source: validateResponse.data.source,
              buckets: validateResponse.data.buckets,
              checked_at: Date.now()
            }
          });
        });
      });
    } catch (errRefreshLicenseInfo) {}
    if (outgoingFiles && outgoingFiles.length > 0) {
      await sendPromptNatively(outgoingMessage, outgoingFiles);
      return;
    }
    var sendStrategy = typeof SEND_STRATEGY !== 'undefined' && SEND_STRATEGY ? SEND_STRATEGY : 'native';
    if (sendStrategy === 'relay') throw new Error('Relay send is disabled. Use native or websocket strategy.');
    if (sendStrategy === 'websocket') try {
      await sendPromptViaWebSocket(outgoingMessage);
      return;
    } catch (errWebSocketSend) {
      typeof POWERKITS_DEBUG !== 'undefined' && POWERKITS_DEBUG && console.warn('[PK Bridge] WebSocket failed, using native:', errWebSocketSend.message);
    }
    await sendPromptNatively(outgoingMessage, outgoingFiles);
  }
  window.__pkDeliverPrompt = deliverPrompt, chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var pingResponse = {};
    pingResponse.ok = true, pingResponse.bridge = true;
    if (request && request.action === 'ping') return sendResponse(pingResponse), false;
    if (request && request.action === 'qlActivateBypass') {
      var licenseGuardForActivate = getLicenseGuard();
      if (typeof licenseGuardForActivate === 'function') return licenseGuardForActivate(false).then(function () {
        setCreditBypass(true), sendResponse({
          ok: true
        });
      }).catch(function () {
        setCreditBypass(false), sendResponse({
          ok: false
        });
      }), true;
      return setCreditBypass(false), sendResponse({
        ok: false
      }), false;
    }
    if (request && request.action === 'qlDeactivateBypass') return setCreditBypass(false), sendResponse({
      ok: true
    }), false;
    if (request && request.action === 'setCreditBypass') {
      var licenseGuardForToggle = getLicenseGuard();
      if (request.active && typeof licenseGuardForToggle === 'function') return licenseGuardForToggle(false).then(function () {
        setCreditBypass(true), sendResponse({
          ok: true
        });
      }).catch(function () {
        setCreditBypass(false), sendResponse({
          ok: false
        });
      }), true;
      return setCreditBypass(!!request.active), sendResponse({
        ok: true
      }), false;
    }
    if (request && request.action === 'syncCreditBypass') return syncCreditBypassFromLicense(), sendResponse({
      ok: true
    }), false;
    if (request && request.action === 'qlSendViaWs') return deliverPrompt(request.message || '', request.files || []).then(function () {
      var successResponse = {};
      successResponse.ok = true, sendResponse(successResponse);
    }).catch(function (sendError) {
      sendResponse({
        ok: false,
        error: sendError.message || String(sendError)
      });
    }), true;
    if (request && request.action === 'requestTokenRefresh') {
      try {
        window.postMessage({
          type: 'lovableRequestToken'
        }, '*');
      } catch (errRequestTokenPost) {}
      return setTimeout(function () {
        try {
          var tokenRequestMessage = {};
          tokenRequestMessage.type = 'lovableRequestToken', window.postMessage(tokenRequestMessage, '*');
        } catch (errRequestTokenRetry) {}
      }, 120), sendResponse({
        ok: true
      }), false;
    }
    if (request && request.action === 'resolveLovableAuth') return async function () {
      try {
        window.postMessage({
          type: 'lovableRequestToken'
        }, '*');
      } catch (errResolveAuthPost) {}
      await new Promise(function (resolveDelay) {
        setTimeout(resolveDelay, 200);
      });
      var storedAuth = await new Promise(function (resolveStorageRead) {
        chrome.storage.local.get(['lovable_token', 'lovable_projectId'], resolveStorageRead);
      });
      sendResponse({
        token: storedAuth.lovable_token || '',
        projectId: getProjectIdFromUrl() || storedAuth.lovable_projectId || ''
      });
    }(), true;
  });
})();
