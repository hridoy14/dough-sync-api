(function () {
  // =============================================
  // MasterLovableHook v5.0.0
  // Credit bypass hook for Lovable
  // =============================================

  console.log("[MasterLovableHook] Iniciando v5.0.0");

  // =============================================
  // GLOBAL STATE
  // =============================================

  window.__qlLastMessage = "";
  window.__qlFixTimer = null;

  let bypassActive = false;            // whether bypass is active
  let cachedToken = null;              // cached auth token
  let cachedProjectId = null;          // cached project ID
  let openWebSockets = [];             // list of active WebSocket connections

  // =============================================
  // LISTEN FOR MESSAGES FROM CONTENT SCRIPT
  // =============================================

  window.addEventListener("message", function (event) {
    if (event.source !== window || !event.data) {
      return;
    }

    // Bypass state toggle
    if (event.data.type === "qlBypassState") {
      bypassActive = !!event.data.active;
      return;
    }

    // Only handle WebSocket injection requests
    if (event.data.type !== "lovableSendViaWs") {
      return;
    }

    // Find active WebSocket connections
    const activeWebSockets = openWebSockets.filter(wsEntry => wsEntry.ws.readyState === WebSocket.OPEN);
    if (!activeWebSockets.length) {
      console.warn("[MasterLovableHook] Nenhum WS aberto para injeção");
      window.postMessage({
        type: "lovableWsSendResult",
        success: false,
        error: "Nenhuma conexão WebSocket ativa"
      }, "*");
      return;
    }

    // Use the most recently opened WebSocket
    const selectedWs = activeWebSockets[activeWebSockets.length - 1];
    try {
      const messageData = typeof event.data.payload === "string" ? event.data.payload : JSON.stringify(event.data.payload);
      selectedWs.origSend(messageData);
      console.log("[MasterLovableHook] WS INJECT →", messageData.slice(0, 300));
      window.postMessage({
        type: "lovableWsSendResult",
        success: true
      }, "*");
    } catch (error) {
      console.warn("[MasterLovableHook] WS inject erro:", error);
      window.postMessage({
        type: "lovableWsSendResult",
        success: false,
        error: error.message
      }, "*");
    }
  });

  // =============================================
  // PROJECT ID EXTRACTION HELPERS
  // =============================================

  // Extract project ID from current URL pathname
  function getProjectIdFromPathname() {
    try {
      const match = window.location.pathname.match(/projects\/([0-9a-fA-F-]{36})/i);
      if (match) {
        return match[1];
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  // Extract project ID from any URL string
  function extractProjectIdFromString(url) {
    try {
      const match = String(url).match(/projects\/([0-9a-fA-F-]{36})/i);
      if (match) {
        return match[1];
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  // =============================================
  // TOKEN CAPTURE & BROADCAST
  // =============================================

  function captureToken(token, projectId, forceBroadcast = false) {
    const effectiveProjectId = projectId || getProjectIdFromPathname();
    const cleanToken = typeof token === "string" ? token.replace(/^Bearer\s+/i, "").trim() : null;

    let changed = false;

    // Update cached token if changed
    if (cleanToken && cleanToken !== cachedToken) {
      cachedToken = cleanToken;
      changed = true;
    }

    // Update cached project ID if changed
    if (effectiveProjectId && effectiveProjectId !== cachedProjectId) {
      cachedProjectId = effectiveProjectId;
      changed = true;
    }

    // Only broadcast if something changed or forced
    if (!changed && !forceBroadcast) {
      return;
    }

    console.log("[MasterLovableHook] ✅ Token capturado!", cachedToken || "null");
    console.log("[MasterLovableHook] ProjectId:", cachedProjectId);

    window.postMessage({
      type: "lovableTokenFound",
      token: cachedToken,
      projectId: cachedProjectId
    }, window.location.origin);
  }

  // Listen for token requests from content script
  window.addEventListener("message", event => {
    if (event.source !== window) {
      return;
    }
    if (!event.data || event.data.type !== "lovableRequestToken") {
      return;
    }
    captureToken(cachedToken, getProjectIdFromPathname() || cachedProjectId, true);
  });

  // =============================================
  // FETCH HOOK
  // =============================================

  (function hookFetch() {
    try {
      const originalFetch = window.fetch;

      window.fetch = async function (...args) {
        // --- Token extraction from Authorization header ---
        try {
          let url = typeof args[0] === "string" ? args[0] : args[0] && args[0].url || "";
          let options = args[1] || {};
          let authValue = null;

          const isRequestInstance = args[0] instanceof Request;
          if (isRequestInstance) {
            url = args[0].url || url;
            authValue = args[0].headers && typeof args[0].headers.get === "function" ? args[0].headers.get("Authorization") || args[0].headers.get("authorization") : null;
          }

          if (options.headers) {
            if (options.headers instanceof Headers) {
              authValue = options.headers.get("Authorization");
            } else if (typeof options.headers === "object") {
              authValue = options.headers.Authorization || options.headers.authorization;
            }
          }

          const extractedProjectId = extractProjectIdFromString(url);

          if (authValue && authValue.startsWith("Bearer ")) {
            const token = authValue.slice(7);
            captureToken(token, extractedProjectId);
          }
        } catch (error) {}

        // --- Credit bypass via fix_error injection ---
        try {
          const url = typeof args[0] === "string" ? args[0] : args[0] && args[0].url || "";
          const isRequestInstance = args[0] instanceof Request;
          const method = (isRequestInstance ? args[0].method || "GET" : (args[1] || {}).method || "GET").toUpperCase();
          const isLovablePost = url && method === "POST" && (url.includes("api.lovable.dev") || url.includes("api.lovable.app") || url.includes("lovable-api.com") || url.includes("lovable.dev"));

          if (isLovablePost) {
            if (isRequestInstance) {
              try {
                const request = args[0];
                const cloned = request.clone();
                const bodyText = await cloned.text();

                if (bodyText) {
                  const bodyJson = JSON.parse(bodyText);

                  if (bypassActive && bodyJson && typeof bodyJson.message === "string" && bodyJson.message.length > 0) {
                    const buildState = window.__qlBuildState;
                    const eventId = buildState && buildState.eventId ? buildState.eventId : "";
                    const errorMessage = buildState && buildState.errorMessage ? buildState.errorMessage : "src/App.tsx(1,7): error TS2322: Type 'number' is not assignable to type 'string'.";

                    bodyJson.intent = "fix_error";
                    bodyJson.contains_error = true;
                    bodyJson.error_source = "build_errors";
                    bodyJson.error_ids = eventId ? [eventId] : [];
                    bodyJson.message_intent_metadata = {
                      fix_error_metadata: {
                        errors: [{
                          error_type: "build",
                          error_message: errorMessage,
                          build_event_id: eventId
                        }]
                      }
                    };

                    const modifiedRequest = new Request(request.url, {
                      method: request.method,
                      headers: request.headers,
                      body: JSON.stringify(bodyJson),
                      mode: request.mode,
                      credentials: request.credentials,
                      cache: request.cache,
                      redirect: request.redirect
                    });

                    args = [modifiedRequest];
                    window.__qlLastMessage = bodyJson.message || "";

                    if (window.__qlFixTimer) {
                      clearInterval(window.__qlFixTimer);
                    }

                    var counter = 0;
                    window.__qlFixTimer = setInterval(function () {
                      counter++;
                      if (!window.__qlLastMessage || counter > 100) {
                        clearInterval(window.__qlFixTimer);
                        return;
                      }
                      document.querySelectorAll("div.special-message").forEach(function (element) {
                        if (element.textContent.trim() === "Fix errors") {
                          element.textContent = window.__qlLastMessage;
                        }
                      });
                    }, 100);

                    console.log("[MasterLovableHook] 💉 fix_error injetado (Request) evId:", eventId || "NENHUM", "| msg:", bodyJson.message.slice(0, 60));
                  }
                }
              } catch (error) {
                console.warn("[MasterLovableHook] erro bypass Request:", error);
              }
            } else {
              const options = args[1] || {};
              const body = options.body;

              if (body && typeof body === "string") {
                try {
                  const bodyJson = JSON.parse(body);

                  if (bypassActive && bodyJson && typeof bodyJson.message === "string" && bodyJson.message.length > 0) {
                    const buildState = window.__qlBuildState;
                    const eventId = buildState && buildState.eventId ? buildState.eventId : "";
                    const errorMessage = buildState && buildState.errorMessage ? buildState.errorMessage : "src/App.tsx(1,7): error TS2322: Type 'number' is not assignable to type 'string'.";

                    bodyJson.intent = "fix_error";
                    bodyJson.contains_error = true;
                    bodyJson.error_source = "build_errors";
                    bodyJson.error_ids = eventId ? [eventId] : [];
                    bodyJson.message_intent_metadata = {
                      fix_error_metadata: {
                        errors: [{
                          error_type: "build",
                          error_message: errorMessage,
                          build_event_id: eventId
                        }]
                      }
                    };

                    args = [args[0], Object.assign({}, options, {
                      body: JSON.stringify(bodyJson)
                    })];

                    window.__qlLastMessage = bodyJson.message || "";

                    if (window.__qlFixTimer) {
                      clearInterval(window.__qlFixTimer);
                    }

                    var counter = 0;
                    window.__qlFixTimer = setInterval(function () {
                      counter++;
                      if (!window.__qlLastMessage || counter > 100) {
                        clearInterval(window.__qlFixTimer);
                        return;
                      }
                      document.querySelectorAll("div.special-message").forEach(function (element) {
                        if (element.textContent.trim() === "Fix errors") {
                          element.textContent = window.__qlLastMessage;
                        }
                      });
                    }, 100);

                    console.log("[MasterLovableHook] 💉 fix_error injetado evId:", eventId || "NENHUM", "| msg:", bodyJson.message.slice(0, 60));
                  }
                } catch (error) {
                  console.warn("[MasterLovableHook] erro bypass opts:", error);
                }
              }
            }
          }
        } catch (error) {}

        return originalFetch.apply(this, args);
      };
    } catch (error) {
      console.warn("[MasterLovableHook] erro fetch", error);
    }
  })();

  // =============================================
  // XHR HOOK
  // =============================================

  (function hookXHR() {
    try {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

      XMLHttpRequest.prototype.open = function (method, url) {
        this._lovable_url = url;
        return originalOpen.apply(this, arguments);
      };

      XMLHttpRequest.prototype.setRequestHeader = function (headerName, headerValue) {
        if (headerName && headerName.toLowerCase() === "authorization" && headerValue && headerValue.startsWith("Bearer ")) {
          const token = headerValue.slice(7);
          captureToken(token, extractProjectIdFromString(this._lovable_url));
        }
        return originalSetRequestHeader.apply(this, arguments);
      };
    } catch (error) {
      console.warn("[MasterLovableHook] erro xhr", error);
    }
  })();

  // =============================================
  // PERIODIC PROJECT ID CHECK
  // =============================================

  setInterval(() => {
    const projectId = getProjectIdFromPathname();
    const projectIdChanged = projectId && projectId !== cachedProjectId;

    if (projectIdChanged) {
      cachedProjectId = projectId;
      window.postMessage({
        type: "lovableTokenFound",
        token: cachedToken,
        projectId: projectId
      }, window.location.origin);
    }
  }, 1500);

  // =============================================
  // WEBSOCKET WRAPPER
  // =============================================

  console.log("[MasterLovableHook] wrapWS: window.WebSocket =", typeof window.WebSocket);

  (function wrapWebSocket() {
    try {
      const OriginalWebSocket = window.WebSocket;

      function HookedWebSocket(url, protocols) {
        const ws = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);
        const urlString = String(url);
        const origSend = ws.send.bind(ws);
        const sanitizedUrl = urlString.replace(/token=[^&]+/g, "token=***").replace(/key=[^&]+/g, "key=***");

        console.log("[MasterLovableHook] WS conectando →", sanitizedUrl);

        // Track Lovable-related WebSockets
        const isLovableWs = urlString.includes("lovable") || urlString.includes("trajectory") || urlString.includes("supabase") || urlString.includes("convex");

        if (isLovableWs) {
          openWebSockets = openWebSockets.filter(entry => entry.ws.readyState !== WebSocket.CLOSED);
          openWebSockets.push({
            ws: ws,
            origSend: origSend
          });

          window.postMessage({
            type: "lovableWsConnected",
            url: sanitizedUrl
          }, "*");
        }

        // Override send method
        ws.send = function (data) {
          try {
            const displayData = typeof data === "string" ? data.slice(0, 800) : "[binary]";
            console.log("[MasterLovableHook] WS SEND [" + sanitizedUrl.slice(0, 60) + "] →", displayData);

            if (bypassActive && typeof data === "string" && data.length > 2) {
              try {
                const parsed = JSON.parse(data);

                // Standard message injection
                if (parsed && typeof parsed.message === "string" && parsed.message.length > 0) {
                  parsed.intent = "fix_error";
                  parsed.message_intent_metadata = {
                    fix_error_metadata: {
                      errors: []
                    }
                  };
                  data = JSON.stringify(parsed);
                  console.log("[MasterLovableHook] 💉 fix_error injetado (WS):", parsed.message.slice(0, 80));

                  // Convex Mutation format
                } else if (parsed && parsed.type === "Mutation" && parsed.args) {
                  const innerArgs = Array.isArray(parsed.args) ? parsed.args[0] : parsed.args;

                  if (innerArgs && typeof innerArgs.message === "string" && innerArgs.message.length > 0) {
                    innerArgs.intent = "fix_error";
                    innerArgs.message_intent_metadata = {
                      fix_error_metadata: {
                        errors: []
                      }
                    };

                    if (Array.isArray(parsed.args)) {
                      parsed.args[0] = innerArgs;
                    } else {
                      parsed.args = innerArgs;
                    }

                    data = JSON.stringify(parsed);
                    console.log("[MasterLovableHook] 💉 fix_error injetado (WS Convex):", innerArgs.message.slice(0, 80));
                  }
                }
              } catch (error) {}
            }
          } catch (error) {}

          return origSend(data);
        };

        // Listen for build error events from WebSocket
        ws.addEventListener("message", event => {
          try {
            const displayData = typeof event.data === "string" ? event.data.slice(0, 300) : "[binary]";
            console.log("[MasterLovableHook] WS RECV [" + sanitizedUrl.slice(0, 60) + "] ←", displayData);

            // Capture build error event ID
            if (typeof event.data === "string" && event.data.includes("#bld:") && event.data.includes("hasError")) {
              try {
                const parsed = JSON.parse(event.data);

                if (parsed && parsed.type === "trajectory" && parsed.event && parsed.event.id && parsed.event.payload) {
                  const eventIdValue = parsed.event.id.value || "";
                  const buildPayload = parsed.event.payload.build;

                  if (eventIdValue.includes("#bld:") && buildPayload && buildPayload.buildErrors && buildPayload.buildErrors.typecheck && buildPayload.buildErrors.typecheck.hasError) {
                    const typecheckOutput = buildPayload.buildErrors.typecheck.output || "";

                    if (typecheckOutput) {
                      const firstLine = typecheckOutput.trim().split("\n")[0];
                      window.__qlBuildState = {
                        eventId: eventIdValue,
                        errorMessage: firstLine
                      };
                      console.log("[MasterLovableHook] 📐 build_event_id capturado:", eventIdValue, "|", firstLine.slice(0, 80));
                    }
                  }
                }
              } catch (error) {}
            }
          } catch (error) {}
        });

        return ws;
      }

      // Replace global WebSocket
      try {
        Object.defineProperty(window, "WebSocket", {
          value: HookedWebSocket,
          writable: true,
          configurable: true
        });
      } catch (error) {
        window.WebSocket = HookedWebSocket;
      }

      // Preserve prototype and constants
      HookedWebSocket.prototype = OriginalWebSocket.prototype;
      HookedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      HookedWebSocket.OPEN = OriginalWebSocket.OPEN;
      HookedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
      HookedWebSocket.CLOSED = OriginalWebSocket.CLOSED;

      // Verify replacement
      if (window.WebSocket !== HookedWebSocket) {
        console.warn("[MasterLovableHook] ⚠️ WebSocket NÃO substituído — propriedade bloqueada!");
      } else {
        console.log("[MasterLovableHook] ✅ WebSocket substituído com sucesso");
      }
    } catch (error) {
      console.warn("[MasterLovableHook] erro ws wrap", error);
    }
  })();
})();
