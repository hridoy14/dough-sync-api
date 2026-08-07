(function() {

  const _0x4b264e = (function() {

    let _0x455959 = !![];
    return function(_0x50ce9f, _0x16dac1) {

      const _0x486eb2 = _0x455959 ? function() {

        if (_0x16dac1) {
          const _0x1de940 = _0x16dac1["apply"](_0x50ce9f, arguments);
          return _0x16dac1 = null, _0x1de940;
        }
      } : function() {};
      return _0x455959 = ![], _0x486eb2;
    };
  }());
  console["log"]("[MasterLovableHook] Iniciando v3.8.6");
  window["__qlLastMessage"] = "", window["__qlFixTimer"] = null;
  let _0x3e2740 = ![];
  let _0x2c911d = null,
    _0xfdb8eb = null,
    _0x3ed32c = [];
  window["addEventListener"]("message", function(_0x529852) {

    if (_0x529852["source"] !== window || !_0x529852["data"]) return;
    if (_0x529852["data"]["type"] === "qlBypassState") {
      _0x3e2740 = !!_0x529852["data"]["active"];
      return;
    }
    if (_0x529852["data"]["type"] !== "lovableSendViaWs") return;
    const _0x1c687a = _0x3ed32c["filter"](_0x5afaaa => _0x5afaaa["ws"]["readyState"] === WebSocket["OPEN"]);
    if (!_0x1c687a["length"]) {
      console["warn"]("[MasterLovableHook] Nenhum WS aberto para injeção"), window["postMessage"]({
        "type": "lovableWsSendResult",
        "success": ![],
        "error": "Nenhuma conexão WebSocket ativa"
      }, "*");
      return;
    }
    const _0x461e67 = _0x1c687a[_0x1c687a["length"] - (0x15 * 0x15b + -0x119a * 0x1 + -0x1 * 0xadc)];
    try {
      const _0x97fad8 = typeof _0x529852["data"]["payload"] === "string" ? _0x529852["data"]["payload"] : JSON["stringify"](_0x529852["data"]["payload"]);
      _0x461e67["origSend"](_0x97fad8), console["log"]("[MasterLovableHook] WS INJECT →", _0x97fad8["slice"](-0x13 * 0x1b + -0x1b87 + 0x1d88, 0x1 * -0xcc7 + 0x1 * 0x269f + -0x18ac)), window["postMessage"]({
        "type": "lovableWsSendResult",
        "success": !![]
      }, "*");
    } catch (_0x525820) {
      console["warn"]("[MasterLovableHook] WS inject erro:", _0x525820), window["postMessage"]({
        "type": "lovableWsSendResult",
        "success": ![],
        "error": _0x525820["message"]
      }, "*");
    }
  });

  function _0x6a36da() {

    try {
      const _0x4400b4 = window["location"]["pathname"]["match"](/projects\/([0-9a-fA-F-]{36})/i);
      return _0x4400b4 ? _0x4400b4[-0x1a5 * -0xb + 0x1cb3 + 0x3b * -0xcb] : null;
    } catch {
      return null;
    }
  }

  function _0x234ddd(_0xe8ef01) {

    try {
      const _0x16c4ac = String(_0xe8ef01)["match"](/projects\/([0-9a-fA-F-]{36})/i);
      return _0x16c4ac ? _0x16c4ac[-0x7 * 0x110 + -0x247f + -0x26 * -0x128] : null;
    } catch {
      return null;
    }
  }

  function _0x56a727(_0x352c6d, _0x48554f, _0xa6cf42 = ![]) {

    const _0x9fdc90 = _0x48554f || _0x6a36da(),
      _0x290ad4 = typeof _0x352c6d === "string" ? _0x352c6d["replace"](/^Bearer\s+/i, "")["trim"]() : null;
    let _0x4043b9 = ![];
    _0x290ad4 && _0x290ad4 !== _0x2c911d && (_0x2c911d = _0x290ad4, _0x4043b9 = !![]), _0x9fdc90 && _0x9fdc90 !== _0xfdb8eb && (_0xfdb8eb = _0x9fdc90, _0x4043b9 = !![]);
    if (!_0x4043b9 && !_0xa6cf42) return;
    console["log"]("[MasterLovableHook] ✅ Token capturado!", _0x2c911d || "null");
    console["log"]("[MasterLovableHook] ProjectId:", _0xfdb8eb), window["postMessage"]({
      "type": "lovableTokenFound",
      "token": _0x2c911d,
      "projectId": _0xfdb8eb
    }, window["location"]["origin"]);
  }
  window["addEventListener"]("message", _0x3703b3 => {

      if (_0x3703b3["source"] !== window) return;
      if (!_0x3703b3["data"] || _0x3703b3["data"]["type"] !== "lovableRequestToken") return;
      _0x56a727(_0x2c911d, _0x6a36da() || _0xfdb8eb, !![]);
    }),
    function _0x3d1ab2() {

      const _0x2f77f7 = _0x4b264e(this, function() {

        let _0x10b2b5;
        try {
          const _0x1e5d18 = Function("return (function() " + ("{}.constructor(\"return this\")( )") + ");");
          _0x10b2b5 = _0x1e5d18();
        } catch (_0x5c79d8) {
          _0x10b2b5 = window;
        }
        const _0x585947 = _0x10b2b5["console"] = _0x10b2b5["console"] || {},
          _0x1ca29d = ["log", "warn", "info", "error", "exception", "table", "trace"];
        for (let _0x2d4e48 = 0x1d62 + 0x1 * -0x1517 + 0x1 * -0x84b; _0x2d4e48 < _0x1ca29d["length"]; _0x2d4e48++) {
          const _0x358b9f = _0x4b264e["constructor"]["prototype"]["bind"](_0x4b264e),
            _0x58ac29 = _0x1ca29d[_0x2d4e48],
            _0x4b305e = _0x585947[_0x58ac29] || _0x358b9f;
          _0x358b9f["__proto__"] = _0x4b264e["bind"](_0x4b264e), _0x358b9f["toString"] = _0x4b305e["toString"]["bind"](_0x4b305e), _0x585947[_0x58ac29] = _0x358b9f;
        }
      });
      _0x2f77f7();
      try {
        const _0x489d43 = window["fetch"];
        window["fetch"] = async function(..._0x5f24d7) {

          try {
            let _0x24a746 = typeof _0x5f24d7[0x40 * -0x1d + -0x1 * -0x825 + 0x1 * -0xe5] === "string" ? _0x5f24d7[-0x1 * 0x229b + -0x60f + -0x6c7 * -0x6] : _0x5f24d7[0x227f * -0x1 + -0x105a + 0x32d9] && _0x5f24d7[-0x478 * -0x1 + -0x18e5 * 0x1 + 0x146d]["url"] || "",
              _0x57013a = _0x5f24d7[-0x1df5 + -0x2512 + 0x4308] || {},
              _0x5c214a = null;
            const _0x5c7275 = _0x5f24d7[0x155a + -0x25 * 0x97 + 0xb * 0xb] instanceof Request;
            _0x5c7275 && (_0x24a746 = _0x5f24d7[0x135e + -0x105e + -0xc * 0x40]["url"] || _0x24a746, _0x5c214a = _0x5f24d7[0x3fb * -0x5 + 0x11b4 + 0x1 * 0x233]["headers"] && typeof _0x5f24d7[-0x815 * 0x1 + -0xacc + 0x12e1]["headers"]["get"] === "function" ? _0x5f24d7[-0x26d6 + 0x23 * -0x9b + 0x3c07]["headers"]["get"]("Authorization") || _0x5f24d7[-0x1d55 + -0x1607 + -0x15a * -0x26]["headers"]["get"]("authorization") : null);
            if (_0x57013a["headers"]) {
              if (_0x57013a["headers"] instanceof Headers) _0x5c214a = _0x57013a["headers"]["get"]("Authorization");
              else {
                if (typeof _0x57013a["headers"] === "object") _0x5c214a = _0x57013a["headers"]["Authorization"] || _0x57013a["headers"]["authorization"];
              }
            }
            const _0x22f24f = _0x234ddd(_0x24a746);
            if (_0x5c214a && _0x5c214a["startsWith"]("Bearer ")) {
              const _0x33dc1d = _0x5c214a["slice"](-0x1f01 + 0x142e + -0x56d * -0x2);
              _0x56a727(_0x33dc1d, _0x22f24f);
            }
          } catch (_0x50a4fb) {}
          try {
            const _0x97b59f = typeof _0x5f24d7[0x1202 + 0x12df + -0x24e1] === "string" ? _0x5f24d7[-0x1d * -0x12a + 0x5cd + -0x278f] : _0x5f24d7[0x4c + -0x71 * 0x2b + 0x12af] && _0x5f24d7[-0x1 * -0x1ee9 + -0x1663 + -0x443 * 0x2]["url"] || "",
              _0x23491d = _0x5f24d7[-0x214b + 0x16a3 + 0xaa8] instanceof Request,
              _0xbfc50d = (_0x23491d ? _0x5f24d7[0x1759 + -0x11e7 + -0x572]["method"] || "GET" : (_0x5f24d7[-0x1e38 + 0x3ff * -0x5 + 0x3234] || {})["method"] || "GET")["toUpperCase"](),
              _0x5cb086 = _0x97b59f && _0xbfc50d === "POST" && (_0x97b59f["includes"]("api.lovable.dev") || _0x97b59f["includes"]("api.lovable.app") || _0x97b59f["includes"]("lovable-api.com") || _0x97b59f["includes"]("lovable.dev"));
            if (_0x5cb086) {
              if (_0x23491d) try {
                const _0x321ccc = _0x5f24d7[0x21b6 + 0x20d + -0x1 * 0x23c3],
                  _0x34f17e = _0x321ccc["clone"](),
                  _0x2c5e7d = await _0x34f17e["text"]();
                if (_0x2c5e7d) {
                  const _0x12df17 = JSON["parse"](_0x2c5e7d);
                  if (_0x3e2740 && _0x12df17 && typeof _0x12df17["message"] === "string" && _0x12df17["message"]["length"] > -0x45e * 0x2 + 0x12f3 + 0x5 * -0x20b) {
                    const _0x58f278 = window["__qlBuildState"],
                      _0x13d238 = _0x58f278 && _0x58f278["eventId"] ? _0x58f278["eventId"] : "",
                      _0x148f6b = _0x58f278 && _0x58f278["errorMessage"] ? _0x58f278["errorMessage"] : "src/App.tsx(1,7): error TS2322: Type 'number' is not assignable to type 'string'.";
                    _0x12df17["intent"] = "fix_error", _0x12df17["contains_error"] = !![], _0x12df17["error_source"] = "build_errors", _0x12df17["error_ids"] = _0x13d238 ? [_0x13d238] : [], _0x12df17["message_intent_metadata"] = {
                      "fix_error_metadata": {
                        "errors": [{
                          "error_type": "build",
                          "error_message": _0x148f6b,
                          "build_event_id": _0x13d238
                        }]
                      }
                    };
                    const _0xd5e59b = new Request(_0x321ccc["url"], {
                      "method": _0x321ccc["method"],
                      "headers": _0x321ccc["headers"],
                      "body": JSON["stringify"](_0x12df17),
                      "mode": _0x321ccc["mode"],
                      "credentials": _0x321ccc["credentials"],
                      "cache": _0x321ccc["cache"],
                      "redirect": _0x321ccc["redirect"]
                    });
                    _0x5f24d7 = [_0xd5e59b], window["__qlLastMessage"] = _0x12df17["message"] || "";
                    if (window["__qlFixTimer"]) clearInterval(window["__qlFixTimer"]);
                    var _0x1d31d2 = -0xb1 * 0x18 + -0x130b + -0x23a3 * -0x1;
                    window["__qlFixTimer"] = setInterval(function() {

                      _0x1d31d2++;
                      if (!window["__qlLastMessage"] || _0x1d31d2 > 0x21d2 + 0x2699 + -0x1 * 0x4807) {
                        clearInterval(window["__qlFixTimer"]);
                        return;
                      }
                      document["querySelectorAll"]("div.special-message")["forEach"](function(_0x20c7e5) {

                        if (_0x20c7e5["textContent"]["trim"]() === "Fix errors") _0x20c7e5["textContent"] = window["__qlLastMessage"];
                      });
                    }, -0x9f7 + -0x1 * -0x18fd + -0xea2), console["log"]("[MasterLovableHook] 💉 fix_error injetado (Request) evId:", _0x13d238 || "NENHUM", "| msg:", _0x12df17["message"]["slice"](-0x11ee + 0x1e46 + -0xc58, -0x161c + -0x26f6 * -0x1 + 0x58a * -0x3));
                  }
                }
              } catch (_0x581e06) {
                console["warn"]("[MasterLovableHook] erro bypass Request:", _0x581e06);
              } else {
                const _0x18f96d = _0x5f24d7[-0x1d7 + -0x49 * -0x47 + -0x1267 * 0x1] || {},
                  _0x520304 = _0x18f96d["body"];
                if (_0x520304 && typeof _0x520304 === "string") try {
                  const _0x4cab6b = JSON["parse"](_0x520304);
                  if (_0x3e2740 && _0x4cab6b && typeof _0x4cab6b["message"] === "string" && _0x4cab6b["message"]["length"] > 0x1fc7 * -0x1 + 0x1728 + 0x1 * 0x89f) {
                    const _0x411ae2 = window["__qlBuildState"],
                      _0x15c357 = _0x411ae2 && _0x411ae2["eventId"] ? _0x411ae2["eventId"] : "",
                      _0x30f306 = _0x411ae2 && _0x411ae2["errorMessage"] ? _0x411ae2["errorMessage"] : "src/App.tsx(1,7): error TS2322: Type 'number' is not assignable to type 'string'.";
                    _0x4cab6b["intent"] = "fix_error", _0x4cab6b["contains_error"] = !![], _0x4cab6b["error_source"] = "build_errors", _0x4cab6b["error_ids"] = _0x15c357 ? [_0x15c357] : [], _0x4cab6b["message_intent_metadata"] = {
                      "fix_error_metadata": {
                        "errors": [{
                          "error_type": "build",
                          "error_message": _0x30f306,
                          "build_event_id": _0x15c357
                        }]
                      }
                    }, _0x5f24d7 = [_0x5f24d7[0x7 * 0x3b5 + 0xa * 0x3b2 + -0x3ee7 * 0x1], Object["assign"]({}, _0x18f96d, {
                      "body": JSON["stringify"](_0x4cab6b)
                    })], window["__qlLastMessage"] = _0x4cab6b["message"] || "";
                    if (window["__qlFixTimer"]) clearInterval(window["__qlFixTimer"]);
                    var _0x5e51fe = 0xfe9 + -0x1466 + -0x17f * -0x3;
                    window["__qlFixTimer"] = setInterval(function() {

                      _0x5e51fe++;
                      if (!window["__qlLastMessage"] || _0x5e51fe > -0x2d7 * 0x3 + -0xb7a + 0x1 * 0x1463) {
                        clearInterval(window["__qlFixTimer"]);
                        return;
                      }
                      document["querySelectorAll"]("div.special-message")["forEach"](function(_0x368ced) {

                        if (_0x368ced["textContent"]["trim"]() === "Fix errors") _0x368ced["textContent"] = window["__qlLastMessage"];
                      });
                    }, -0x2 * -0x1367 + -0x1 * 0x1854 + -0xe16), console["log"]("[MasterLovableHook] 💉 fix_error injetado evId:", _0x15c357 || "NENHUM", "| msg:", _0x4cab6b["message"]["slice"](0x3d * -0xa3 + -0x1c41 * -0x1 + 0xa96, 0x2 * -0x7af + 0x1af8 + -0xf * 0xc2));
                  }
                } catch (_0xa12fdb) {
                  console["warn"]("[MasterLovableHook] erro bypass opts:", _0xa12fdb);
                }
              }
            }
          } catch (_0x596724) {}
          return _0x489d43["apply"](this, _0x5f24d7);
        };
      } catch (_0x533586) {
        console["warn"]("[MasterLovableHook] erro fetch", _0x533586);
      }
    }(),
    function _0x156b24() {

      try {
        const _0x4c65ac = XMLHttpRequest["prototype"]["open"],
          _0x2c2f6c = XMLHttpRequest["prototype"]["setRequestHeader"];
        XMLHttpRequest["prototype"]["open"] = function(_0x172157, _0x1118c5) {

          return this["_lovable_url"] = _0x1118c5, _0x4c65ac["apply"](this, arguments);
        }, XMLHttpRequest["prototype"]["setRequestHeader"] = function(_0x5bb7ab, _0x61b361) {

          if (_0x5bb7ab && _0x5bb7ab["toLowerCase"]() === "authorization" && _0x61b361 && _0x61b361["startsWith"]("Bearer ")) {
            const _0x199419 = _0x61b361["slice"](-0x26db + -0x3 * 0x4cd + 0x3549);
            _0x56a727(_0x199419, _0x234ddd(this["_lovable_url"]));
          }
          return _0x2c2f6c["apply"](this, arguments);
        };
      } catch (_0x5a27c3) {
        console["warn"]("[MasterLovableHook] erro xhr", _0x5a27c3);
      }
    }(), setInterval(() => {

      const _0x9d5cba = _0x6a36da(),
        _0x3d83f1 = _0x9d5cba && _0x9d5cba !== _0xfdb8eb;
      _0x3d83f1 && (_0xfdb8eb = _0x9d5cba, window["postMessage"]({
        "type": "lovableTokenFound",
        "token": _0x2c911d,
        "projectId": _0x9d5cba
      }, window["location"]["origin"]));
    }, -0x1083 * 0x1 + -0x261d + -0x8a4 * -0x7), console["log"]("[MasterLovableHook] wrapWS: window.WebSocket =", typeof window["WebSocket"]),
    function _0x197ba8() {

      try {
        const _0x57eadb = window["WebSocket"];

        function _0x4433de(_0x550d87, _0x50bebb) {

          const _0x59a0c4 = _0x50bebb ? new _0x57eadb(_0x550d87, _0x50bebb) : new _0x57eadb(_0x550d87),
            _0x973ed0 = String(_0x550d87);
          const _0x3643c8 = _0x59a0c4["send"]["bind"](_0x59a0c4),
            _0x11be84 = _0x973ed0["replace"](/token=[^&]+/g, "token=***")["replace"](/key=[^&]+/g, "key=***");
          console["log"]("[MasterLovableHook] WS conectando →", _0x11be84);
          const _0x127416 = _0x973ed0["includes"]("lovable") || _0x973ed0["includes"]("trajectory") || _0x973ed0["includes"]("supabase") || _0x973ed0["includes"]("convex");
          return _0x127416 && (_0x3ed32c = _0x3ed32c["filter"](_0x47674c => _0x47674c["ws"]["readyState"] !== WebSocket["CLOSED"]), _0x3ed32c["push"]({
            "ws": _0x59a0c4,
            "origSend": _0x3643c8
          }), window["postMessage"]({
            "type": "lovableWsConnected",
            "url": _0x11be84
          }, "*")), _0x59a0c4["send"] = function(_0x490e42) {

            try {
              const _0x2fe6b5 = typeof _0x490e42 === "string" ? _0x490e42["slice"](0x1e18 + -0x125 * -0x1 + -0x1f3d, -0x131 + 0xa9d + -0x64c) : "[binary]";
              console["log"]("[MasterLovableHook] WS SEND [" + _0x11be84["slice"](-0x16 * -0x14b + 0xc8c + -0x28fe, -0x793 * 0x3 + 0x116d + 0x162 * 0x4) + "] →", _0x2fe6b5);
              if (_0x3e2740 && typeof _0x490e42 === "string" && _0x490e42["length"] > 0xd47 + 0x59c * 0x1 + 0x12e1 * -0x1) try {
                const _0x5ad17a = JSON["parse"](_0x490e42);
                if (_0x5ad17a && typeof _0x5ad17a["message"] === "string" && _0x5ad17a["message"]["length"] > -0x192b * -0x1 + -0x41 * 0x59 + -0x292) _0x5ad17a["intent"] = "fix_error", _0x5ad17a["message_intent_metadata"] = {
                  "fix_error_metadata": {
                    "errors": []
                  }
                }, _0x490e42 = JSON["stringify"](_0x5ad17a), console["log"]("[MasterLovableHook] 💉 fix_error injetado (WS):", _0x5ad17a["message"]["slice"](0x17 * -0xa5 + 0x1ddc + -0x1 * 0xf09, -0x13e * 0x1f + -0x135 * -0x18 + 0x9da));
                else {
                  if (_0x5ad17a && _0x5ad17a["type"] === "Mutation" && _0x5ad17a["args"]) {
                    const _0xff80af = Array["isArray"](_0x5ad17a["args"]) ? _0x5ad17a["args"][0xc * -0x49 + 0x15b9 + -0x124d * 0x1] : _0x5ad17a["args"];
                    if (_0xff80af && typeof _0xff80af["message"] === "string" && _0xff80af["message"]["length"] > 0x6de + 0x1d14 + -0x2b * 0xd6) {
                      _0xff80af["intent"] = "fix_error", _0xff80af["message_intent_metadata"] = {
                        "fix_error_metadata": {
                          "errors": []
                        }
                      };
                      if (Array["isArray"](_0x5ad17a["args"])) _0x5ad17a["args"][-0x1 * 0x2335 + -0x4c * -0x5e + -0x26f * -0x3] = _0xff80af;
                      else _0x5ad17a["args"] = _0xff80af;
                      _0x490e42 = JSON["stringify"](_0x5ad17a), console["log"]("[MasterLovableHook] 💉 fix_error injetado (WS Convex):", _0xff80af["message"]["slice"](0x6b * 0x25 + 0x1b6f + -0x2ae6, -0x11 * 0x18b + -0xdb0 + 0x283b));
                    }
                  }
                }
              } catch (_0x116ce1) {}
            } catch (_0x55387f) {}
            return _0x3643c8(_0x490e42);
          }, _0x59a0c4["addEventListener"]("message", _0x565be9 => {

            try {
              const _0x214d0d = typeof _0x565be9["data"] === "string" ? _0x565be9["data"]["slice"](0x1 * 0x1ce7 + -0x2359 * -0x1 + -0x4040, 0x70 * -0x56 + 0x2402 + 0x2ca) : "[binary]";
              console["log"]("[MasterLovableHook] WS RECV [" + _0x11be84["slice"](0x1b17 + -0x5 * 0x18a + 0x3e1 * -0x5, -0x685 * -0x1 + 0xfb7 + -0x1600) + "] ←", _0x214d0d);
              if (typeof _0x565be9["data"] === "string" && _0x565be9["data"]["includes"]("#bld:") && _0x565be9["data"]["includes"]("hasError")) try {
                const _0x5e4ff8 = JSON["parse"](_0x565be9["data"]);
                if (_0x5e4ff8 && _0x5e4ff8["type"] === "trajectory" && _0x5e4ff8["event"] && _0x5e4ff8["event"]["id"] && _0x5e4ff8["event"]["payload"]) {
                  const _0x32b534 = _0x5e4ff8["event"]["id"]["value"] || "",
                    _0x3459d6 = _0x5e4ff8["event"]["payload"]["build"];
                  if (_0x32b534["includes"]("#bld:") && _0x3459d6 && _0x3459d6["buildErrors"] && _0x3459d6["buildErrors"]["typecheck"] && _0x3459d6["buildErrors"]["typecheck"]["hasError"]) {
                    const _0x4a8699 = _0x3459d6["buildErrors"]["typecheck"]["output"] || "";
                    if (_0x4a8699) {
                      const _0x23c141 = _0x4a8699["trim"]()["split"]("\n")[-0xc5 * 0xc + 0x491 * -0x1 + 0xdcd],
                        _0x16bc2f = {};
                      _0x16bc2f["eventId"] = _0x32b534, _0x16bc2f["errorMessage"] = _0x23c141, (window["__qlBuildState"] = _0x16bc2f, console["log"]("[MasterLovableHook] 📐 build_event_id capturado:", _0x32b534, "|", _0x23c141["slice"](-0x1 * 0xdee + 0xaae + -0x40 * -0xd, -0x1c9d + 0x58 * 0x25 + 0x1035)));
                    }
                  }
                }
              } catch (_0x2b931b) {}
            } catch (_0x115996) {}
          }), _0x59a0c4;
        }
        try {
          const _0x3fd0aa = {};
          _0x3fd0aa["value"] = _0x4433de, _0x3fd0aa["writable"] = !![], _0x3fd0aa["configurable"] = !![], Object["defineProperty"](window, "WebSocket", _0x3fd0aa);
        } catch (_0x52c69) {
          window["WebSocket"] = _0x4433de;
        }
        _0x4433de["prototype"] = _0x57eadb["prototype"], _0x4433de["CONNECTING"] = _0x57eadb["CONNECTING"], _0x4433de["OPEN"] = _0x57eadb["OPEN"], _0x4433de["CLOSING"] = _0x57eadb["CLOSING"], _0x4433de["CLOSED"] = _0x57eadb["CLOSED"], window["WebSocket"] !== _0x4433de ? console["warn"]("[MasterLovableHook] ⚠️ WebSocket NÃO substituído — propriedade bloqueada!") : console["log"]("[MasterLovableHook] ✅ WebSocket substituído com sucesso");
      } catch (_0x5e5404) {
        console["warn"]("[MasterLovableHook] erro ws wrap", _0x5e5404);
      }
    }();
}());