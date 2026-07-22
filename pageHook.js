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

  let bypassActive = true;        
  try {
    if (localStorage.getItem("__ql_bypass_active") === "1") {
      bypassActive = true;
      console.log("[MasterLovableHook] ✅ Bypass auto-activated from localStorage");
    }
  } catch (e) {}
      // whether bypass is active
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

  // Extract project ID from any URL string (supports both path and subdomain patterns)
  function extractProjectIdFromString(url) {
    try {
      const str = String(url);
      // Try path pattern first: /projects/{uuid}
      let match = str.match(/projects\/([0-9a-fA-F-]{36})/i);
      if (match) {
        return match[1];
      }
      // Try subdomain pattern: {uuid}.lovableproject.com
      match = str.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
      if (match) {
        return match[1];
      }
      return null;
    } catch {
      return null;
    }
  }


  /*
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
*/
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
        // =============================================
        // ✅ FAST PATH: Extract method and URL quickly
        // =============================================
        let url = "";
        let method = "GET";
        let isRequestInstance = false;

        try {
          isRequestInstance = args[0] instanceof Request;
          if (isRequestInstance) {
            url = args[0].url || "";
            method = (args[0].method || "GET").toUpperCase();
          } else {
            url = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "";
            method = ((args[1] || {}).method || "GET").toUpperCase();
          }
        } catch (e) {}

        // =============================================
        // ✅ KEY FIX: Skip ALL non-POST requests immediately
        // This prevents interference with 50+ CSS/JS/Font asset loads
        // which was causing 63 ERR_CONNECTION_CLOSED errors
        // =============================================
        if (method !== "POST") {
          return originalFetch.apply(this, args);
        }

        // =============================================
        // ✅ KEY FIX: Skip non-Lovable POST requests
        // Only process Lovable API requests
        // =============================================
        const isLovableUrl = url && (
          url.includes("api.lovable.dev") ||
          url.includes("api.lovable.app") ||
          url.includes("lovable-api.com") ||
          url.includes("lovable.dev/projects/")
        );

        if (!isLovableUrl) {
          return originalFetch.apply(this, args);
        }

        // ── From here: only POST requests to Lovable API ──

        // Token extraction from Authorization header
        try {
          let authValue = null;

          if (isRequestInstance) {
            authValue = args[0].headers && typeof args[0].headers.get === "function"
              ? args[0].headers.get("Authorization") || args[0].headers.get("authorization")
              : null;
          }

          const options = args[1] || {};
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


        // Credit bypass via fix_error injection
        try {
          const isLovablePost = url && method === "POST" &&
            (url.includes("/chat") || url.includes("/trajectory") ||
             url.includes("converse") || url.includes("messages")) &&
            !url.includes("extend-lease") &&
            !url.includes("credit-balance");

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
                    const errorMessage = buildState && buildState.errorMessage
                      ? buildState.errorMessage
                      : "src/App.tsx(1,7): error TS2322: Type 'number' is not assignable to type 'string'.";

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

                    if (window.__qlFixTimer) clearInterval(window.__qlFixTimer);

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
                    const errorMessage = buildState && buildState.errorMessage
                      ? buildState.errorMessage
                      : "src/App.tsx(1,7): error TS2322: Type 'number' is not assignable to type 'string'.";

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

                    if (window.__qlFixTimer) clearInterval(window.__qlFixTimer);

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
                  // Type field
                  if (!parsed.type) {
                    parsed.type = "user_message";
                  }

                  // ✅ KEY FIX: Use fix_error intent (same as fetch hook)
                  // "build" intent = credit consumed ❌
                  // "fix_error" intent = FREE ✅
                  const buildState = window.__qlBuildState;
                  const eventId = buildState && buildState.eventId ? buildState.eventId : "";
                  const errorMessage = buildState && buildState.errorMessage
                    ? buildState.errorMessage
                    : "src/App.tsx(1,7): error TS2322: Type 'number' is not assignable to type 'string'.";

                  parsed.intent = "fix_error";           
                  parsed.contains_error = true;          
                  parsed.error_source = "build_errors";
                  parsed.model = null;
                  parsed.error_ids = eventId ? [eventId] : [];
                  parsed.message_intent_metadata = {
                    fix_error_metadata: {
                      errors: [{
                        error_type: "build",
                        error_message: errorMessage,
                        build_event_id: eventId
                      }]
                    }
                  };

                  data = JSON.stringify(parsed);
                  console.log("[MasterLovableHook] 💉 fix_error injetado (WS) evId:", eventId || "NENHUM", "| msg:", parsed.message.slice(0, 80));

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
        /*
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
        });*/
        
        // Listen for build error events from WebSocket
      
        // Listen for build error events from WebSocket
        ws.addEventListener("message", async (event) => {
          try {
            const isBinary = event.data instanceof ArrayBuffer || event.data instanceof Blob;
            const byteSize = isBinary ? (event.data.byteLength || event.data.size || 0) : 0;
            const displayData = typeof event.data === "string"
              ? event.data.slice(0, 300)
              : "[binary " + byteSize + " bytes]";
            console.log("[MasterLovableHook] WS RECV [" + sanitizedUrl.slice(0, 60) + "] ←", displayData);

            let dataStr = null;

            if (typeof event.data === "string") {
              // String message — use directly
              dataStr = event.data;
            } else if (isBinary && byteSize > 5) {
              // Binary message — try multiple decode methods
              let buffer;
              try {
                if (event.data instanceof Blob) {
                  buffer = await event.data.arrayBuffer();
                } else {
                  buffer = event.data;
                }
              } catch (e) {
                console.warn("[MasterLovableHook] ⚠️ Buffer read error:", e.message);
                return;
              }

              // Method 1: Try plain TextDecoder first (maybe already decompressed by WS layer)
              try {
                const plainText = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
                // Check if it looks like valid JSON
                if (plainText && (plainText.trim().startsWith("{") || plainText.trim().startsWith("["))) {
                  dataStr = plainText;
                  console.log("[MasterLovableHook] 📦 Binary decoded as plain text:", dataStr.slice(0, 200));
                }
              } catch (e) {}

              // Method 2: Try DecompressionStream "deflate-raw"
              if (!dataStr && typeof DecompressionStream !== "undefined") {
                try {
                  const ds = new DecompressionStream("deflate-raw");
                  const stream = new Blob([buffer]).stream().pipeThrough(ds);
                  dataStr = await new Response(stream).text();
                  if (dataStr && dataStr.length > 5) {
                    console.log("[MasterLovableHook] 📦 Decompressed (deflate-raw):", dataStr.slice(0, 200));
                  } else {
                    dataStr = null;
                  }
                } catch (e) {
                  console.log("[MasterLovableHook] ⚠️ deflate-raw failed:", e.message);
                }
              }

              // Method 3: Try DecompressionStream "deflate" (with zlib header)
              if (!dataStr && typeof DecompressionStream !== "undefined") {
                try {
                  const ds = new DecompressionStream("deflate");
                  const stream = new Blob([buffer]).stream().pipeThrough(ds);
                  dataStr = await new Response(stream).text();
                  if (dataStr && dataStr.length > 5) {
                    console.log("[MasterLovableHook] 📦 Decompressed (deflate):", dataStr.slice(0, 200));
                  } else {
                    dataStr = null;
                  }
                } catch (e) {
                  console.log("[MasterLovableHook] ⚠️ deflate failed:", e.message);
                }
              }

              // Method 4: Try DecompressionStream "gzip"
              if (!dataStr && typeof DecompressionStream !== "undefined") {
                try {
                  const ds = new DecompressionStream("gzip");
                  const stream = new Blob([buffer]).stream().pipeThrough(ds);
                  dataStr = await new Response(stream).text();
                  if (dataStr && dataStr.length > 5) {
                    console.log("[MasterLovableHook] 📦 Decompressed (gzip):", dataStr.slice(0, 200));
                  } else {
                    dataStr = null;
                  }
                } catch (e) {
                  console.log("[MasterLovableHook] ⚠️ gzip failed:", e.message);
                }
              }

              // Method 5: Force TextDecoder (non-fatal, show raw bytes)
              if (!dataStr) {
                try {
                  const raw = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
                  console.log("[MasterLovableHook] ⚠️ All decompress failed. Raw bytes (first 100):", raw.slice(0, 100));
                  console.log("[MasterLovableHook] ⚠️ First 10 bytes hex:", Array.from(new Uint8Array(buffer).slice(0, 10)).map(b => b.toString(16).padStart(2, "0")).join(" "));
                  dataStr = raw;
                } catch (e) {}
              }
            }

            // =============================================
            // Capture build error event ID
            // =============================================
            if (dataStr && dataStr.includes("#bld:")) {
              console.log("[MasterLovableHook] 🔍 Found #bld: in data! Length:", dataStr.length);
            }

            if (dataStr && dataStr.includes("hasError")) {
              console.log("[MasterLovableHook] 🔍 Found hasError in data!");
            }

            if (dataStr && (dataStr.includes("#bld:") || dataStr.includes("hasError") || dataStr.includes("buildErrors"))) {
              try {
                let parsed;
                const trimmed = dataStr.trim();

                if (trimmed.startsWith("[")) {
                  const arr = JSON.parse(trimmed);
                  for (const item of arr) {
                    if (item && item.event && item.event.id) {
                      parsed = item;
                      break;
                    }
                  }
                  if (!parsed && arr.length > 0) parsed = arr[0];
                } else if (trimmed.startsWith("{")) {
                  parsed = JSON.parse(trimmed);
                }

                if (parsed) {
                  // Check nested structures
                  const eventIdValue = parsed.event && parsed.event.id
                    ? (parsed.event.id.value || parsed.event.id)
                    : "";

                  const payload = parsed.event && parsed.event.payload
                    ? parsed.event.payload
                    : parsed.payload || null;

                  const buildPayload = payload && payload.build ? payload.build : null;

                  if (buildPayload) {
                    const typecheck = buildPayload.buildErrors && buildPayload.buildErrors.typecheck;
                    const runtime = buildPayload.buildErrors && buildPayload.buildErrors.runtime;

                    let errorMessage = "";
                    let hasError = false;

                    if (typecheck && typecheck.hasError) {
                      hasError = true;
                      errorMessage = (typecheck.output || "").trim().split("\n")[0];
                    } else if (runtime && runtime.hasError) {
                      hasError = true;
                      errorMessage = (runtime.output || "").trim().split("\n")[0];
                    }

                    if (hasError) {
                      window.__qlBuildState = {
                        eventId: String(eventIdValue),
                        errorMessage: errorMessage
                      };
                      console.log("[MasterLovableHook] 📐 build_event_id capturado:", eventIdValue, "|", errorMessage.slice(0, 80));
                    }
                  }

                  // Also check for credit_total in realtime patches
                  if (parsed.ops || (parsed.payload && parsed.payload.ops)) {
                    const ops = parsed.ops || (parsed.payload && parsed.payload.ops) || [];
                    for (const op of ops) {
                      if (op.path && op.path.includes("credit_total")) {
                        console.log("[MasterLovableHook] 💰 Credit update:", op.value, "(" + op.op + ")");
                      }
                    }
                  }
                }
              } catch (parseError) {
                console.warn("[MasterLovableHook] ⚠️ JSON parse error:", parseError.message, "| data:", dataStr.slice(0, 100));
              }
            }

          } catch (error) {
            console.warn("[MasterLovableHook] ⚠️ WS message handler error:", error.message);
          }
        });



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
