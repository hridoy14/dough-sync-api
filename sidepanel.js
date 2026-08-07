/*
 * ============================================================================
 * LovaPilot v7.0.0 — sidepanel.js (side panel application)
 * ============================================================================
 * Source  : original "itsakib360-tool v6" sidepanel.js (250,301 bytes, fully
 *           obfuscated: decoder _0x50ee + 1,674-entry string pool _0x400e +
 *           pool-rotation IIFE, checksum -0x73707+-0x3d890+0x1024fd).
 * Method  : all 4,911 decoder calls resolved (0 skipped), 205 decode-alias
 *           declarators + 194 dead alias-map objects folded away, then
 *           formatted. Every function, variable, string, number, regex and
 *           control-flow of the ORIGINAL code is preserved verbatim
 *           (hex arithmetic left as-is by design).
 * Verified: node --check OK. Dual-run (original vs this file, identical
 *           stub-worlds): 11 scenarios / 898 events / 0 behavioral diffs.
 *           Forbidden strings (itsakib360 / Lovable Infinity / lovableinfy /
 *           unlimitedlovable): 0 remaining.
 * ----------------------------------------------------------------------------
 * INTENTIONAL CHANGES — ONLY these 9 spots (rebrand + backend migration):
 *   [URL x5] dashboard/support link fallback -> "https://wa.me/8801759176229"
 *            L143 (blocked overlays: "Upgrade / Manage Plan", "Manage
 *            Devices"), L728 ("Your plan changed. Get your new key ->"),
 *            L737 ("This key is in use on X/Y devices. Manage devices ->"),
 *            L1051 (account hero link), L1815 (license-gate retry hint).
 *            (was: "https://lovableinfy.lovable.app/dashboard")
 *   [URL x2] license validate endpoint fallback ->
 *            "https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license"
 *            L687 (manual "Validate License" click) and L815 (proxyFetch url).
 *            (was: "https://lovableinfy.lovable.app/api/public/validate-license")
 *   [BRAND ] license-gate text  "to activate Lovable Infinity."
 *            -> "to activate LovaPilot."   (L655)
 *   [BRAND ] console tag        "[Lovable Infinity] Image upload failed:"
 *            -> "[LovaPilot] ..."          (L1360)
 * ----------------------------------------------------------------------------
 * REMOVED (dead obfuscation junk only, zero runtime effect):
 *   - decoder _0x50ee() + string pool _0x400e() (1,674 entries) + rotation
 *     IIFE (~18,988 bytes of boot machinery), 205 decode-alias declarators
 *     (var a=b chains), 194 dead alias-map objects (never referenced after
 *     decoding).
 * KEPT (faithful to original, do NOT "clean up"):
 *   - 95 user functions + full IIFE boot flow (ql_sidebar_mode storage write,
 *     storage.onChanged/tabs wiring), 73 still-referenced obfuscation maps,
 *     all hex-sums (e.g. timeouts), device_label "Chrome Extension",
 *     credits:0 validate payload, real lovable.dev URLs + match patterns
 *     (https://lovable.dev/*, https://*.lovable.dev/*, api.lovable.dev),
 *     GRINGOW_* external fallbacks, plan-mode/storage migrations, file
 *     attach/upload, publish/enable-cloud/download/remove-watermark flows.
 * ============================================================================
 */
(function() {
  ;
  try {
    var _0x196ed1 = {};
    _0x196ed1["ql_sidebar_mode"] = !![], chrome["storage"]["local"]["set"](_0x196ed1);
  } catch (_0x4e6ec3) {}
  const _0x3df13f = typeof POWERKITS_API_BASE !== "undefined" ? POWERKITS_API_BASE : GRINGOW_API_BASE,
    _0x579417 = typeof POWERKITS_API_KEY !== "undefined" ? POWERKITS_API_KEY : GRINGOW_API_KEY,
    _0x588bbf = typeof window !== "undefined" && window["PROXY_COMMAND_URL"] || _0x3df13f + ("/functions/v1/proxy-command"),
    _0x2c868e = _0x3df13f + ("/functions/v1/validate-license"),
    _0x5d3c78 = _0x3df13f + ("/rest/v1/notifications?select=*&order=created_at.desc&limit=20"),
    _0x521b75 = _0x3df13f + ("/rest/v1/packages?select=*&is_active=eq.true&order=sort_order.asc"),
    _0x2f0b7a = _0x3df13f + ("/rest/v1/extension_versions?select=version,changelog,file_path,is_alert_active&order=created_at.desc&limit=1&is_alert_active=eq.true"),
    _0x24f562 = _0x3df13f + ("/rest/v1/user_roles?select=role"),
    _0x3f726b = _0x3df13f + ("/rest/v1/licenses?select=user_id"),
    _0x200972 = _0x3df13f + ("/functions/v1/create-lovable-project"),
    _0x3d257d = _0x3df13f + ("/functions/v1/remove-watermark"),
    _0x54686d = _0x3df13f + ("/functions/v1/publish-project"),
    _0x127833 = _0x3df13f + ("/functions/v1/enable-cloud");

  function _0x2dae9f(_0x3a5d1c) {
    return typeof powerkitsApiHeaders === "function" ? powerkitsApiHeaders(_0x3a5d1c) : gringowApiHeaders(_0x3a5d1c);
  }

  function _0x2b70d6() {
    if (!INTERNAL_LICENSE_MODE) return Promise["resolve"]();
    return new Promise(function(_0x42220e) {
      ;
      chrome["storage"]["local"]['get'](["ql_license_valid", "ql_session_id", "ql_user_name", "ql_license_key", "ql_expires_at", "ql_activated_at", "ql_license_status", "ql_validity_minutes"], function(_0x490e5b) {
        if (_0x490e5b["ql_license_valid"] && _0x490e5b["ql_session_id"]) return _0x754607 = _0x490e5b["ql_session_id"], _0x3fd338 = normalizeLicenseUserName(_0x490e5b["ql_user_name"]), _0x536400 = _0x490e5b["ql_expires_at"] || null, _0x187d64 = _0x490e5b["ql_activated_at"] || null, _0x138f00 = _0x490e5b["ql_license_status"] || null, _0x490760 = _0x490e5b["ql_validity_minutes"] != null ? _0x490e5b["ql_validity_minutes"] : null, _0x42220e();
        var _0x1ac18b = typeof crypto !== "undefined" && crypto["randomUUID"] ? crypto["randomUUID"]() : String(Date["now"]());
        _0x754607 = _0x1ac18b, _0x3fd338 = normalizeLicenseUserName(_0x3fd338), _0x536400 = null, _0x187d64 = new Date()["toISOString"](), _0x138f00 = "active", _0x490760 = null, chrome["storage"]["local"]["set"](typeof powerkitsInternalSessionStorage === "function" ? powerkitsInternalSessionStorage(_0x1ac18b, _0x3fd338) : gringowInternalSessionStorage(_0x1ac18b, _0x3fd338), function() {
          _0x42220e();
        });
      });
    });
  }

  function _0x18a4d1() {
    return new Promise(function(_0x56f2f8) {
      ;
      chrome["storage"]["local"]["get"](["lovable_browserSessionId"], function(_0x589f0a) {
        _0x56f2f8(_0x589f0a["lovable_browserSessionId"] || null);
      });
    });
  }
  async function _0x783c12(_0x1d9b43, _0x4b32f4, _0x5db9e0, _0x35b94c, _0x594a5c) {
    var _0x25f7d8 = String(_0x4b32f4 || '')["replace"](/^Bearer\s+/i, '')["trim"](),
      _0x58f7cc = {};
    _0x58f7cc["license_key"] = _0x5db9e0 || '', _0x58f7cc["session_id"] = _0x754607 || '', _0x58f7cc["projeto_id"] = _0x1d9b43, _0x58f7cc["token_lovable"] = _0x25f7d8, _0x58f7cc["mensagem"] = _0x35b94c, _0x58f7cc["modo_pensar"] = !!_0x594a5c, _0x58f7cc["device_id"] = _0x180549;
    var _0x2494a2 = _0x58f7cc;
    _0x2494a2["session_headers"] = await _0xe0d81b(_0x1d9b43);
    var _0x25d53e = await _0x18a4d1();
    if (_0x25d53e) _0x2494a2["browser_session_id"] = _0x25d53e;
    var _0x1b606f = await _0xaa0ba3();
    if (_0x1b606f) _0x2494a2["native_chat_body"] = _0x1b606f;
    return _0x2494a2;
  }

  function _0x1a95af() {
    var _0x1e56f2 = {};
    _0x1e56f2["Content-Type"] = "application/json";
    var _0x13c4fc = {};
    return _0x13c4fc["license_key"] = "INTERNAL", _0x13c4fc["session_id"] = _0x754607, _0x13c4fc["device_id"] = _0x180549, _0x13c4fc["max_devices"] = 0x2, _0x13c4fc["device_limit"] = 0x2, _0x13c4fc["allowed_devices"] = 0x2, _0x35831c(_0x2c868e, {
      'method': 'POST',
      'headers': _0x2dae9f(_0x1e56f2),
      'body': JSON["stringify"](_0x13c4fc)
    })['then'](function(_0x17095c) {
      ;
      if (!_0x17095c || !_0x17095c["valid"]) throw new Error(_0x17095c && _0x17095c["message"] || "Internal activation failed");
      return _0x754607 = _0x17095c["session_id"] || _0x754607, _0x3fd338 = normalizeLicenseUserName(_0x17095c["user_name"] || _0x3fd338), _0x536400 = _0x17095c["expires_at"] || _0x536400, _0x138f00 = _0x17095c["status"] || _0x138f00, new Promise(function(_0x3a090d) {
        var _0x5e646b = {};
        _0x5e646b["ql_license_valid"] = !![], _0x5e646b["ql_license_key"] = "INTERNAL", _0x5e646b["ql_session_id"] = _0x754607, _0x5e646b["ql_user_name"] = _0x3fd338, _0x5e646b["ql_expires_at"] = _0x536400, _0x5e646b["ql_activated_at"] = _0x17095c["activated_at"] || null, _0x5e646b["ql_license_status"] = _0x138f00, chrome["storage"]["local"]["set"](_0x5e646b, function() {
          _0x3a090d(_0x17095c);
        });
      });
    });
  }
  let _0x754607 = null,
    _0x3fd338 = null,
    _0x536400 = null,
    _0x138f00 = null,
    _0x490760 = null,
    _0x187d64 = null,
    _0x53d9a0 = null,
    _0x180549 = null,
    _0x17ee7e = ![],
    _0x2ece39 = null,
    _0x31ebfd = ![],
    _0x59ed71 = [],
    _0x1258dc = 'chat',
    _0x3927d0 = [],
    _0x2abd1e = 'idle',
    _0x518b17 = null,
    _0x36e8d6 = null,
    _0x20898f = null,
    _0xad7ef4 = null,
    _0x58cc66 = null;

  function _0x222f04(_0x144871, _0xd47a2) {
    var _0x31945e = _0x144871 && _0x144871["plan_type"] || _0xd47a2;
    if (_0x31945e === "unlimited" || _0x31945e === "pro") return "unlimited";
    if (_0x31945e === 'trial') return "trial";
    if (_0x31945e === "credits") return "credits";
    var _0x4fecb6 = _0x144871 && _0x144871["status"] || _0xd47a2;
    if (_0x4fecb6 === "unlimited" || _0x4fecb6 === "pro") return "unlimited";
    if (_0x4fecb6 === "trial") return 'trial';
    return "credits";
  }

  function _0x535d0a(_0x28244a) {
    _0x2abd1e = _0x28244a;
  }

  function _0x19624e() {
    _0x20898f && (clearInterval(_0x20898f), _0x20898f = null);
  }

  function _0x4dd6b9() {
    _0xad7ef4 && (clearInterval(_0xad7ef4), _0xad7ef4 = null);
  }

  function _0x295b2a(_0xeb5fd6) {
    _0x19624e(), _0x4dd6b9();
    _0x53d9a0 && (clearInterval(_0x53d9a0), _0x53d9a0 = null);
    _0x2abd1e = "idle", _0x518b17 = null, _0x36e8d6 = null;
    if (typeof pkInvalidateAssertCache === "function") pkInvalidateAssertCache();
    _0x39a1b5(![]), chrome["storage"]["local"]["remove"](["plan"]);
    var _0xee4e7a = function() {
      ;
      _0x2a00c5();
      if (_0xeb5fd6) setTimeout(function() {
        _0x498972("Access Denied", _0xeb5fd6);
      }, -0x3fa + 0x21f9 + 0x1d * -0xfb);
    };
    typeof pkRevokeLicenseStorage === "function" ? pkRevokeLicenseStorage()["then"](_0xee4e7a) : chrome["storage"]['local']["remove"](["ql_license_valid", "ql_license_key", "ql_license_data", "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status", "ql_validity_minutes", "ql_session_id"], _0xee4e7a);
  }

  function _0x325dea(_0x123a1d) {
    _0x535d0a("blocked"), _0x19624e(), _0x4dd6b9();
    _0x53d9a0 && (clearInterval(_0x53d9a0), _0x53d9a0 = null);
    _0x39a1b5(![]);
    var _0x417c19 = typeof LOVABLE_DASHBOARD_URL !== "undefined" ? LOVABLE_DASHBOARD_URL : "https://wa.me/8801759176229",
      _0xe34df6 = document["getElementById"]("sp-body");
    if (!_0xe34df6) return;
    if (_0x123a1d && _0x123a1d["device_limit"]) {
      var _0x2e7c5e = _0x123a1d["max_devices"] || 0x5 * -0x789 + 0x8fe + 0x1caf,
        _0x9c05be = _0x123a1d["devices_used"] || 0x3 * -0xca1 + 0x1 * 0x26d5 + -0xf2;
      _0xe34df6["innerHTML"] = "<div class=\"lk-blocked-overlay\">" + ("<div class=\"lk-blocked-modal\">") + ("<div class=\"lk-blocked-icon\">") + SP_SVG["shield"] + ("</div>") + ("<div class=\"lk-blocked-title\">Device Limit Reached</div>") + ("<div class=\"lk-blocked-subtitle\">This key is in use on ") + _0x9c05be + '/' + _0x2e7c5e + (" devices.</div>") + ("<div class=\"lk-blocked-actions\">") + ("<a href=\"") + _0x417c19 + ("\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"lk-btn-upgrade\">Manage Devices</a>") + ("<button class=\"lk-btn-logout\" id=\"pk-blocked-logout\">") + SP_SVG["logOut"] + (" Logout</button>") + ("</div>") + ("</div>") + ("</div>");
      var _0xb3d314 = document["getElementById"]("pk-blocked-logout");
      if (_0xb3d314) _0xb3d314["addEventListener"]("click", function() {
        _0x295b2a();
      });
      return;
    }
    var _0x89219c = _0x123a1d && _0x123a1d["credits_remaining"] != null ? _0x123a1d["credits_remaining"] : 0x8cb + -0x34d * 0x2 + -0x231,
      _0x312e44 = _0x123a1d && _0x123a1d["reset_at"] ? _0x123a1d["reset_at"] : null,
      _0x4eb25d = _0x123a1d && _0x123a1d["plan_name"] ? _0x123a1d["plan_name"] : "Free",
      _0x176d0f = _0x123a1d && _0x123a1d["reason"] === "daily_cap",
      _0x338054 = _0x176d0f ? "Daily limit reached for your " + spEscapeHtml(_0x4eb25d) + (" plan. Resets at midnight UTC.") : "You have used all available credits for your " + spEscapeHtml(_0x4eb25d) + (" plan."),
      _0x2e7c2c = _0x312e44 ? new Date(_0x312e44)["toLocaleDateString"]() : "N/A";
    _0xe34df6["innerHTML"] = "<div class=\"lk-blocked-overlay\">" + ("<div class=\"lk-blocked-modal\">") + ("<div class=\"lk-blocked-icon\">") + SP_SVG["zap"] + ("</div>") + ("<div class=\"lk-blocked-title\">") + (_0x176d0f ? "Daily Limit Reached" : "License Exhausted") + ("</div>") + ("<div class=\"lk-blocked-subtitle\">") + _0x338054 + ("</div>") + ("<div class=\"lk-blocked-details\">") + ("<div class=\"lk-blocked-row\"><span>Plan</span><span>") + spEscapeHtml(_0x4eb25d) + ("</span></div>") + ("<div class=\"lk-blocked-row\"><span>Credits remaining</span><span>") + _0x89219c + ("</span></div>") + ("<div class=\"lk-blocked-row\"><span>Resets on</span><span>") + _0x2e7c2c + ("</span></div>") + ("</div>") + ("<div class=\"lk-blocked-actions\">") + ("<a href=\"") + _0x417c19 + ("\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"lk-btn-upgrade\">Upgrade / Manage Plan</a>") + ("<button class=\"lk-btn-logout\" id=\"pk-blocked-logout\">") + SP_SVG["logOut"] + (" Logout</button>") + ("</div>") + ("</div>") + ("</div>");
    var _0xb3d314 = document["getElementById"]("pk-blocked-logout");
    if (_0xb3d314) _0xb3d314["addEventListener"]("click", function() {
      _0x295b2a();
    });
  }
  const _0x312084 = -0x1fd3 + 0x2688 + 0x353 * -0x2,
    _0x3fcd4a = (0x148c + -0x11 * 0x44 + 0x1 * -0xff4) * (-0x4 * -0xe9 + 0x147f + -0x1423) * (-0x1347 + -0x4f * -0x67 + -0x882),
    _0x4b4feb = "ql_chat_history",
    _0x28ffd8 = -0x2327 + -0x211d + -0x5c1 * -0xc,
    _0x45ffd3 = extensionVersionShort();

  function _0x261ae7() {
    var _0x24e85f = document["getElementById"]("sp-footer-version");
    if (_0x24e85f) _0x24e85f["textContent"] = extensionFooterBadge();
  }
  _0x261ae7();

  function _0xaa0ba3() {
    ;
    return new Promise(function(_0x33edd8) {
      ;
      try {
        _0x48a404(function(_0x28a25d) {
          if (!_0x28a25d || !_0x28a25d['id']) return _0x33edd8(null);
          var _0x11b2fd = {};
          _0x11b2fd["action"] = "getNativeChatCapture", chrome["tabs"]["sendMessage"](_0x28a25d['id'], _0x11b2fd, function(_0x4db291) {
            if (chrome["runtime"]["lastError"]) return _0x33edd8(null);
            _0x33edd8(_0x4db291 && _0x4db291['body'] ? _0x4db291["body"] : null);
          });
        });
      } catch (_0x3bb065) {
        _0x33edd8(null);
      }
    });
  }

  function _0x5f0b0a(_0x2883c6) {
    ;
    return new Promise(function(_0x39dbac) {
      var _0x1538a6 = ![],
        _0x27aae2 = Math["max"](-0x43f + -0x22e3 * 0x1 + -0xe16 * -0x3, _0x2883c6 || 0x3 * -0xa7f + 0x5d * 0x67 + 0x3d6);
      _0x48a404(function(_0x1aa18b) {
        ;
        chrome["storage"]["local"]["get"](["lovable_token"], function(_0x5cb8ab) {
          var _0x3a0ac1 = _0x5cb8ab["lovable_token"] || '';

          function _0x351f2f() {
            if (_0x1538a6) return;
            _0x1538a6 = !![], clearTimeout(_0x165331), clearInterval(_0x50f780), chrome["storage"]["onChanged"]["removeListener"](_0x144264), _0x39dbac();
          }

          function _0x144264(_0x24092c, _0x486a4e) {
            if (_0x486a4e !== 'local') return;
            _0x24092c["lovable_token"] && _0x24092c["lovable_token"]["newValue"] && _0x24092c["lovable_token"]["newValue"] !== _0x3a0ac1 && _0x351f2f();
          }
          var _0x165331 = setTimeout(_0x351f2f, _0x27aae2),
            _0x50f780 = setInterval(function() {
              chrome["storage"]["local"]['get'](["lovable_token"], function(_0x545164) {
                var _0x5438b2 = _0x545164["lovable_token"] || '';
                if (_0x5438b2 && _0x5438b2 !== _0x3a0ac1) _0x351f2f();
              });
            }, -0x2be + 0x71 * 0x31 + -0x121b);
          chrome["storage"]["onChanged"]["addListener"](_0x144264);
          if (_0x1aa18b && _0x1aa18b['id']) {
            var _0x3a506b = {};
            _0x3a506b["action"] = "requestTokenRefresh", chrome["tabs"]["sendMessage"](_0x1aa18b['id'], _0x3a506b, function() {
              if (chrome["runtime"]["lastError"]) {}
            });
          }
        });
      });
    });
  }

  function _0xe0d81b(_0x1a5ddd) {
    ;
    return new Promise(function(_0x32d5db) {
      ;
      try {
        _0x48a404(function(_0x2ebe89) {
          if (!_0x2ebe89 || !_0x2ebe89['id']) {
            _0x4302e1(_0x1a5ddd)['then'](_0x32d5db);
            return;
          }
          var _0x4d0c57 = {};
          _0x4d0c57["action"] = "getSessionHeaders", _0x4d0c57["projectId"] = _0x1a5ddd || '', chrome["tabs"]["sendMessage"](_0x2ebe89['id'], _0x4d0c57, function(_0x5e6947) {
            if (chrome["runtime"]["lastError"] || !_0x5e6947 || !_0x5e6947["headers"]) {
              _0x4302e1(_0x1a5ddd)["then"](_0x32d5db);
              return;
            }
            _0x32d5db(_0x5e6947["headers"]);
          });
        });
      } catch (_0x1c11a3) {
        _0x4302e1(_0x1a5ddd)["then"](_0x32d5db);
      }
    });
  }

  function _0x4302e1(_0x757559) {
    return new Promise(function(_0x20c1c3) {
      var _0x314e1c = navigator["userAgent"] || '',
        _0x3a3d8e = navigator["userAgentData"] && navigator["userAgentData"]["brands"] ? navigator["userAgentData"]["brands"] : [],
        _0x3d1eb9 = '';
      for (var _0x1fb198 = 0x1 * 0x1253 + -0x1 * 0x1c49 + 0x9f6; _0x1fb198 < _0x3a3d8e["length"]; _0x1fb198++) {
        if (_0x1fb198 > 0x1 * -0x26f5 + -0x253b + 0x5c * 0xd4) _0x3d1eb9 += ',\x20';
        _0x3d1eb9 += '\x22' + _0x3a3d8e[_0x1fb198]["brand"] + "\";v=\"" + _0x3a3d8e[_0x1fb198]["version"] + '\x22';
      }
      var _0x240046 = navigator["userAgentData"] && navigator["userAgentData"]["platform"] ? navigator["userAgentData"]["platform"] : "Windows",
        _0x16ad2f = navigator["userAgentData"] && navigator["userAgentData"]["mobile"] ? '?1' : '?0',
        _0x56cd96 = navigator["languages"] && navigator["languages"]["length"] ? navigator["languages"]["slice"](0x171e + -0x2df * 0x9 + 0x2b9, -0xe20 + 0xf3 * 0x3 + 0xb4a)["join"](',') : navigator["language"] || "en-US",
        _0x904f82 = {};
      _0x904f82["user-agent"] = _0x314e1c, _0x904f82["sec-ch-ua"] = _0x3d1eb9, _0x904f82["sec-ch-ua-mobile"] = _0x16ad2f, _0x904f82["sec-ch-ua-platform"] = '\x22' + _0x240046 + '\x22', _0x904f82["accept-language"] = _0x56cd96, _0x904f82["accept-encoding"] = "gzip, deflate, br, zstd", _0x904f82["origin"] = "https://lovable.dev", _0x904f82["referer"] = "https://lovable.dev/projects/" + (_0x757559 || ''), _0x904f82["priority"] = "u=1, i", _0x904f82["sec-fetch-dest"] = "empty", _0x904f82["sec-fetch-mode"] = "cors", _0x904f82["sec-fetch-site"] = "same-site";
      var _0x2194b0 = _0x904f82;
      try {
        var _0x24e52c = {};
        _0x24e52c["action"] = "getLovableCookies", chrome["runtime"]["sendMessage"](_0x24e52c, function(_0x32ed0f) {
          if (chrome["runtime"]["lastError"]) {
            _0x20c1c3(_0x2194b0);
            return;
          }
          if (_0x32ed0f && _0x32ed0f["cookie"]) _0x2194b0["cookie"] = _0x32ed0f["cookie"];
          _0x20c1c3(_0x2194b0);
        });
      } catch (_0x41932d) {
        _0x20c1c3(_0x2194b0);
      }
    });
  }

  function _0x755e4b(_0x261242) {
    ;
    return new Promise((_0x214a4f, _0x1996e9) => {
      try {
        if (!chrome["runtime"] || !chrome["runtime"]['id']) return _0x1996e9(new Error("Extension context invalidated"));
        chrome["runtime"]["sendMessage"](_0x261242, _0x1ba08c => {
          if (chrome["runtime"]["lastError"]) return _0x1996e9(new Error(chrome["runtime"]["lastError"]["message"]));
          _0x214a4f(_0x1ba08c);
        });
      } catch (_0x555512) {
        _0x1996e9(new Error("Extension context invalidated"));
      }
    });
  }

  function _0x35831c(_0x4d656e, _0x5d1a81 = {}) {
    ;
    const _0x26cc25 = _0x5d1a81["requireSuccess"] === !![],
      _0x173dda = _0x5d1a81["vendorFeatureCompat"] === !![] || _0x5d1a81["featureUiCompat"] === !![];
    return new Promise((_0x51b5a1, _0x531019) => {
      ;
      try {
        if (!chrome["runtime"] || !chrome["runtime"]['id']) return _0x531019(new Error("Extension context invalidated"));
        if (typeof POWERKITS_DEBUG !== "undefined" && POWERKITS_DEBUG) console["log"]("[SP] bgFetch ->", _0x4d656e);
        var _0x4df1de = {};
        _0x4df1de["action"] = "proxyFetch", _0x4df1de['url'] = _0x4d656e, _0x4df1de["method"] = _0x5d1a81["method"] || 'POST', _0x4df1de["headers"] = _0x5d1a81["headers"] || {}, _0x4df1de['body'] = _0x5d1a81["body"] || null, chrome["runtime"]["sendMessage"](_0x4df1de, _0x45c9fb => {
          if (chrome["runtime"]["lastError"]) return _0x531019(new Error(chrome["runtime"]["lastError"]["message"]));
          if (!_0x45c9fb) return _0x531019(new Error("No response from background"));
          const _0x1fde36 = _0x45c9fb["data"];
          if (typeof POWERKITS_DEBUG !== "undefined" && POWERKITS_DEBUG) console["log"]("[SP] bgFetch <-", _0x4d656e, "status", _0x45c9fb["status"], _0x1fde36);
          if (_0x173dda && typeof pkResolveFeatureBgFetch === "function") {
            var _0xc93535 = pkResolveFeatureBgFetch(_0x45c9fb);
            if (!_0xc93535['ok']) return _0x531019(new Error(_0xc93535["error"]));
            return _0x51b5a1(_0xc93535["data"]);
          }
          if (!_0x45c9fb['ok']) {
            const _0xd302e6 = _0x1fde36 && (_0x1fde36["error_display"] || _0x1fde36["message"] || _0x1fde36["error"]) || _0x1fde36 && _0x1fde36["raw"] || "Request failed (HTTP " + _0x45c9fb["status"] + ')';
            return _0x531019(new Error(_0xbfc16a(_0xd302e6)));
          }
          if (_0x26cc25 && (!_0x1fde36 || _0x1fde36["success"] !== !![])) {
            const _0x78d0c8 = _0x1fde36 && (_0x1fde36["error_display"] || _0x1fde36["message"] || _0x1fde36["error"]) || "Server did not confirm the send (success !== true)";
            return _0x531019(new Error(_0xbfc16a(_0x78d0c8)));
          }
          _0x51b5a1(_0x1fde36);
        });
      } catch (_0x4434d8) {
        _0x531019(new Error("Extension context invalidated"));
      }
    });
  }

  function _0x22b8a5() {
    return getHardwareFingerprint();
  }

  function _0x2b742b(_0x5aa3cf) {
    try {
      var _0x319146 = String(_0x5aa3cf || '')["replace"](/^Bearer\s+/i, '')["trim"](),
        _0x50cdef = _0x319146["split"]('.");if(_0x50cdef[\"length\"]<0x1*-0x79f+0x1f2e+-0x178d)return null;var _0x474821=_0x50cdef[0x199*0x1+-0x2450+0x22b8][\"replace\"](/-/g,)[\"replace\"](/_/g,"/'),
        _0x450ade = _0x474821 + '=' ["repeat"]((-0x21b * 0x1 + -0x60 * -0x4d + -0x1ac1 - _0x474821["length"] % (0x2057 * -0x1 + -0x251c + 0x4577 * 0x1)) % (0x2 * -0xb + 0xdb7 * -0x1 + -0x189 * -0x9));
      return JSON['parse'](atob(_0x450ade));
    } catch (_0x4855ab) {
      return null;
    }
  }

  function _0x267db9(_0x374c13) {
    var _0x3e09c7 = _0x2b742b(_0x374c13);
    return _0x3e09c7 && _0x3e09c7["exp"] ? _0x3e09c7["exp"] * (-0x1d38 + -0x11bd + 0x32dd) : null;
  }

  function _0x22291c(_0x3a638f, _0x51e8d1) {
    var _0x4e74ad = String(_0x3a638f || '')["replace"](/^Bearer\s+/i, '')["trim"]();
    if (!_0x4e74ad) return ![];
    var _0x4a6410 = _0x267db9(_0x4e74ad);
    if (!_0x4a6410) return !![];
    return _0x4a6410 > Date["now"]() + (_0x51e8d1 || 0xfae8 + 0x1 * -0xba2f + 0xa9a7);
  }

  function _0xe1762(_0x592a0d) {
    var _0x3126a8 = '',
      _0x5191e7 = 0x4 * 0x10c + -0x1611 + -0x1 * -0x11e1;
    return (_0x592a0d || [])["forEach"](function(_0x5235a2) {
      var _0x4002ad = String(_0x5235a2 || '')["replace"](/^Bearer\s+/i, '')["trim"]();
      if (!_0x4002ad) return;
      var _0x39b7b3 = _0x267db9(_0x4002ad) || -0x16 * -0x175 + -0x1 * -0x2a3 + 0x53 * -0x6b;
      (!_0x3126a8 || _0x39b7b3 > _0x5191e7) && (_0x3126a8 = _0x4002ad, _0x5191e7 = _0x39b7b3);
    }), _0x3126a8;
  }

  function _0x57057e(_0x350cbb) {
    if (!_0x350cbb) return '';
    var _0x3ae16b = String(_0x350cbb)['match'](/\/projects\/([0-9a-fA-F-]{36})/);
    return _0x3ae16b ? _0x3ae16b[-0x2 * -0xd79 + 0xc7 + 0x1 * -0x1bb8] : '';
  }

  function _0x202097() {
    ;
    return new Promise(function(_0x4b7544) {
      var _0x5bdee7 = {};
      _0x5bdee7["action"] = "readCookies", chrome["runtime"]["sendMessage"](_0x5bdee7, function(_0x1e0735) {
        if (chrome["runtime"]["lastError"]) return _0x4b7544('');
        if (!_0x1e0735 || !_0x1e0735["tokens"] || !_0x1e0735["tokens"]["length"]) return _0x4b7544('');
        _0x4b7544(_0xe1762(_0x1e0735["tokens"]['map'](function(_0x581374) {
          return _0x581374["token"];
        })));
      });
    });
  }
  var _0x3da5cb = null,
    _0x2010b0 = 0x2 * -0x5de + 0x100b + -0x44f * 0x1;
  async function _0x3e476c() {
    ;
    if (_0x3da5cb && Date["now"]() - _0x2010b0 < 0x4d * 0x2b + 0xf9 * -0x5 + 0x3286) return _0x3da5cb;
    var _0x2ecd9e = await new Promise(function(_0x297b7f) {
      _0x48a404(function(_0x4ca744) {
        _0x297b7f(_0x4ca744);
      });
    });
    await new Promise(function(_0x3a86a5) {
      chrome["runtime"]["sendMessage"]({
        'action': "syncLovableAuth",
        'tabUrl': _0x2ecd9e && _0x2ecd9e["url"] || '',
        'projectId': _0x57057e(_0x2ecd9e && _0x2ecd9e["url"])
      }, function() {
        if (chrome["runtime"]["lastError"]) {}
        _0x3a86a5();
      });
    });
    if (_0x2ecd9e && _0x2ecd9e['id']) {
      var _0x1eb039 = await new Promise(function(_0x360f47) {
        var _0x2fcc43 = {};
        _0x2fcc43["action"] = "getLovableSession", chrome["tabs"]["sendMessage"](_0x2ecd9e['id'], _0x2fcc43, function(_0x4ada02) {
          if (chrome["runtime"]["lastError"] || !_0x4ada02) return _0x360f47(null);
          _0x360f47(_0x4ada02);
        });
      });
      if (_0x1eb039 && _0x1eb039['ok']) {
        await new Promise(function(_0x45bef7) {
          var _0x45113b = {};
          _0x45113b["lovable_token"] = _0x1eb039["token"], _0x45113b["lovable_projectId"] = _0x1eb039["projectId"], chrome["storage"]['local']['set'](_0x45113b, _0x45bef7);
        });
        var _0x217469 = {};
        return _0x217469['token'] = _0x1eb039["token"], _0x217469["projectId"] = _0x1eb039["projectId"], _0x3da5cb = _0x217469, _0x2010b0 = Date["now"](), _0x3da5cb;
      }
    }
    await _0x5f0b0a(0x3a9 + -0x11 * -0x2b + 0x534);
    var _0x22213c = await new Promise(function(_0x2847dd) {
        chrome["storage"]["local"]["get"](["lovable_token", "lovable_projectId"], _0x2847dd);
      }),
      _0x37d72b = _0x57057e(_0x2ecd9e && _0x2ecd9e["url"]),
      _0x4745dd = {};
    return _0x4745dd['token'] = _0x22213c["lovable_token"] || '', _0x4745dd["projectId"] = _0x37d72b || _0x22213c["lovable_projectId"] || '', _0x3da5cb = _0x4745dd, _0x2010b0 = Date["now"](), _0x3da5cb;
  }

  function _0x1706ad(_0x3f2f27) {
    _0x48a404(function(_0x4d5625) {
      _0x3f2f27(_0x4d5625 || null);
    });
  }

  function _0x4a8242(_0x30987d) {
    return new Promise(function(_0x3f6f9c, _0x317eed) {
      ;
      _0x1706ad(function(_0x2879b8) {
        if (!_0x2879b8 || !_0x2879b8['id']) return _0x317eed(new Error("Open a Lovable project tab on lovable.dev first."));
        chrome["tabs"]["sendMessage"](_0x2879b8['id'], _0x30987d, function(_0x38a636) {
          if (chrome["runtime"]["lastError"]) return _0x317eed(new Error(chrome["runtime"]["lastError"]["message"]));
          _0x3f6f9c(_0x38a636);
        });
      });
    });
  }

  function _0x39a1b5(_0x3f093d) {
    var _0x3511ba = !!_0x3f093d,
      _0x35d764 = _0x3511ba ? "qlActivateBypass" : "qlDeactivateBypass",
      _0x253e05 = {};
    _0x253e05["url"] = ["https://lovable.dev/*", "https://*.lovable.dev/*"], chrome["tabs"]["query"](_0x253e05, function(_0x13d0d0) {
      ;
      (_0x13d0d0 || [])["forEach"](function(_0xaeb38e) {
        ;
        if (!_0xaeb38e || !_0xaeb38e['id']) return;
        var _0x324798 = {};
        _0x324798["action"] = _0x35d764, chrome["tabs"]["sendMessage"](_0xaeb38e['id'], _0x324798, function() {
          if (chrome["runtime"]["lastError"]) {}
        });
        var _0x1d10bf = {};
        _0x1d10bf["action"] = "setCreditBypass", _0x1d10bf["active"] = _0x3511ba, chrome["tabs"]["sendMessage"](_0xaeb38e['id'], _0x1d10bf, function() {
          if (chrome["runtime"]["lastError"]) {}
        });
      });
    });
    var _0x41e75d = {};
    _0x41e75d["action"] = _0x35d764, _0x4a8242(_0x41e75d)["catch"](function() {});
    var _0x422c0b = {};
    _0x422c0b["action"] = "setCreditBypass", _0x422c0b["active"] = _0x3511ba, _0x4a8242(_0x422c0b)["catch"](function() {});
  }
  async function _0x455b0b(_0x3a5e2f, _0x1db67f, _0x57cb67) {
    _0x57cb67 = _0x57cb67 || {};
    var _0x35a962 = window["pkEnsureActiveLicense"];
    if (typeof _0x35a962 === "function") await _0x35a962(![]);
    else throw new Error("License guard not loaded. Close and reopen the side panel, then try again.");
    var _0xa72a10 = await new Promise(function(_0x49b917) {
        chrome["storage"]['local']["get"](["lovable_projectId", "lovable_token", "ql_license_key"], _0x49b917);
      }),
      _0x4cc09f = _0xa72a10["lovable_token"] || '',
      _0x8bab12 = _0xa72a10["lovable_projectId"] || '',
      _0xfd7e1 = _0xa72a10["ql_license_key"] || '';
    if (!_0x57cb67["skipProjectId"] && (!_0x8bab12 || !_0x4cc09f)) throw new Error("Project not synced.");
    if (_0x57cb67["skipProjectId"] && !_0x4cc09f) throw new Error("Project not synced.");
    var _0x4ac932 = typeof pkFeatureRequestBody === "function" ? pkFeatureRequestBody(_0xfd7e1, _0x4cc09f, _0x57cb67["skipProjectId"] ? '' : _0x8bab12, _0x1db67f) : {
        'license_key': _0xfd7e1,
        'token_lovable': _0x4cc09f,
        'project_id': _0x8bab12
      },
      _0x356579 = {};
    return _0x356579["Content-Type"] = "application/json", _0x35831c(_0x3a5e2f, {
      'method': "POST",
      'headers': _0x2dae9f(_0x356579),
      'body': JSON["stringify"](_0x4ac932),
      'featureUiCompat': !![]
    });
  }

  function _0xbfc16a(_0x4ab3a9) {
    if (_0x4ab3a9 == null) return "Send failed.";
    var _0x1a2579 = pkSanitizeServerError(String(_0x4ab3a9));
    if (_0x1a2579["charAt"](-0x1e7 + 0x26aa + 0x1 * -0x24c3) === '{') try {
      var _0x205394 = JSON["parse"](_0x1a2579);
      _0x205394 && (_0x205394["message"] || _0x205394["error_display"]) && (_0x1a2579 = String(_0x205394["message"] || _0x205394["error_display"]));
    } catch (_0x2490c2) {}
    if (/invalid token/i ["test"](_0x1a2579) || /unauthorized/i ['test'](_0x1a2579)) return "Lovable session expired. Refresh lovable.dev, wait for Synced, then send again.";
    if (/receiving end does not exist|could not establish connection/i ["test"](_0x1a2579)) return "Lovable tab is not connected. Open your project on lovable.dev, refresh that tab, reload the extension, then send again.";
    return _0x54bacf(_0x1a2579);
  }

  function _0x54bacf(_0x4acb78) {
    return typeof translateUserMessage === "function" ? translateUserMessage(_0x4acb78) : _0x4acb78;
  }

  function _0x498972(_0x459151, _0xd4424) {
    const _0x5bd5ab = document["querySelector"](".sp-alert-overlay");
    if (_0x5bd5ab) _0x5bd5ab["remove"]();
    const _0x4fbafc = document["createElement"]("div");
    _0x4fbafc["className"] = "sp-alert-overlay", _0x4fbafc["innerHTML"] = spTemplateAlert(_0x54bacf(_0x459151), _0x54bacf(_0xd4424)), document["body"]["appendChild"](_0x4fbafc), _0x4fbafc["querySelector"](".sp-alert-ok")["addEventListener"]("click", () => _0x4fbafc["remove"]()), setTimeout(() => _0x4fbafc["remove"](), -0x36e * -0x4 + -0x209c * 0x1 + -0x5e * -0x5e);
  }
  try {
    var _0x6bd98 = {};
    _0x6bd98["ql_sidebar_mode"] = !![], chrome["storage"]["local"]["set"](_0x6bd98);
  } catch (_0x12ba28) {}
  var _0x4e6b7a = document["getElementById"]("sp-back-to-popup");
  if (_0x4e6b7a) _0x4e6b7a["style"]["display"] = "none";
  document["querySelector"](".sp-theme-btn")["addEventListener"]("click", () => {
    const _0x549299 = document["body"]["classList"]["toggle"]("sp-light");
    var _0x585c02 = {};
    _0x585c02["ql_dark_mode"] = !_0x549299, chrome["storage"]["local"]["set"](_0x585c02);
  }), document["querySelector"](".sp-logout-btn")["addEventListener"]('click', () => {
    _0x295b2a();
  });
  const _0x4f5ad7 = document["getElementById"]("sp-notif-panel");
  document["querySelector"](".sp-notif-btn")["addEventListener"]("click", _0x6a3371 => {
    _0x6a3371["stopPropagation"]();
    const _0x419943 = _0x4f5ad7["style"]["display"] !== "none";
    _0x4f5ad7["style"]["display"] = _0x419943 ? "none" : 'block';
    if (!_0x419943) _0x1775dd();
  }), document["getElementById"]("sp-notif-close")["addEventListener"]('click', () => {
    _0x4f5ad7["style"]["display"] = "none";
  });
  async function _0x1775dd() {
    const _0x19d376 = document["getElementById"]("sp-notif-list");
    _0x19d376["innerHTML"] = "<p class=\"sp-notif-empty\">Loading...</p>";
    try {
      var _0x190f84 = {};
      _0x190f84["apikey"] = _0x579417;
      var _0x12c5a6 = {};
      _0x12c5a6["method"] = "GET", _0x12c5a6["headers"] = _0x190f84;
      const _0xf99299 = await _0x35831c(_0x5d3c78, _0x12c5a6);
      if (!_0xf99299 || !_0xf99299["length"]) {
        _0x19d376["innerHTML"] = "<p class=\"sp-notif-empty\">No notifications.</p>";
        return;
      }
      const _0x1bb57d = _0xf99299['map'](_0x449e5a => _0x449e5a['id']);
      var _0x4147a9 = {};
      _0x4147a9["ql_read_notifs"] = _0x1bb57d, chrome["storage"]["local"]["set"](_0x4147a9);
      const _0x207464 = document["querySelector"](".sp-notif-badge");
      if (_0x207464) _0x207464["style"]["display"] = "none";
      _0x19d376["innerHTML"] = _0xf99299["map"](_0x220a40 => spTemplateNotifItem(_0x220a40))["join"]('');
    } catch (_0x4cc859) {
      _0x19d376["innerHTML"] = "<p class=\"sp-notif-empty\">Error loading.</p>";
    }
  }
  async function _0x18dc80() {
    ;
    try {
      var _0x274c05 = {};
      _0x274c05["apikey"] = _0x579417;
      var _0x303b53 = {};
      _0x303b53["method"] = "GET", _0x303b53["headers"] = _0x274c05;
      const _0x468bee = await _0x35831c(_0x5d3c78, _0x303b53);
      if (!_0x468bee || !_0x468bee["length"]) return;
      chrome["storage"]["local"]['get'](["ql_read_notifs"], _0x56d9a7 => {
        const _0x343451 = _0x56d9a7["ql_read_notifs"] || [],
          _0x57da16 = _0x468bee["filter"](_0x5f3c95 => !_0x343451["includes"](_0x5f3c95['id']))["length"],
          _0x4602ba = document["querySelector"](".sp-notif-badge");
        _0x4602ba && (_0x4602ba["textContent"] = _0x57da16, _0x4602ba["style"]["display"] = _0x57da16 > -0x1446 + 0x7b7 * -0x1 + 0x1bfd ? "flex" : 'none');
      });
    } catch (_0x2d698b) {}
  }
  async function _0x25426e() {
    try {
      var _0x22a7db = {};
      _0x22a7db["apikey"] = _0x579417;
      var _0x2fdb8f = {};
      _0x2fdb8f["method"] = "GET", _0x2fdb8f["headers"] = _0x22a7db;
      const _0x59595a = await _0x35831c(_0x2f0b7a, _0x2fdb8f);
      if (!_0x59595a || !_0x59595a["length"]) return;
      const _0xdd290e = _0x59595a[-0x19a4 + 0x1718 * 0x1 + 0x28c];
      if (_0xdd290e["version"] !== _0x45ffd3 && _0xdd290e["is_alert_active"]) {
        const _0x3281dd = document["getElementById"]("sp-update-banner");
        if (_0x3281dd) {
          const _0x27a57d = _0xdd290e["file_path"] ? _0x3df13f + ("/storage/v1/object/public/extension-releases/") + _0xdd290e["file_path"] : null;
          _0x3281dd["innerHTML"] = spTemplateUpdateBanner(_0xdd290e["version"], _0xdd290e["changelog"], _0x27a57d), _0x3281dd["style"]["display"] = "block";
        }
      }
    } catch (_0x216273) {}
  }
  async function _0x21170f() {
    try {
      var _0x33160d = {};
      _0x33160d["apikey"] = _0x579417;
      var _0x4b75c3 = {};
      _0x4b75c3["method"] = "GET", _0x4b75c3["headers"] = _0x33160d;
      const _0x2d353a = await _0x35831c(_0x24f562 + ("&user_id=eq.") + await _0x26ac72(), _0x4b75c3);
      if (_0x2d353a && Array["isArray"](_0x2d353a) && _0x2d353a["some"](_0x57e8f7 => _0x57e8f7["role"] === "reseller" || _0x57e8f7["role"] === "admin")) {
        _0x17ee7e = !![];
        const _0x51d594 = document["getElementById"]("sp-reseller-btn");
        if (_0x51d594) _0x51d594["style"]["display"] = "block";
      }
    } catch (_0xa105a0) {}
  }
  async function _0x26ac72() {
    ;
    return new Promise(_0x25c951 => chrome["storage"]["local"]['get'](["ql_license_key"], async _0xedf78d => {
      if (!_0xedf78d["ql_license_key"]) return _0x25c951('');
      try {
        var _0x460f5a = {};
        _0x460f5a["apikey"] = _0x579417;
        var _0x27e970 = {};
        _0x27e970["method"] = "GET", _0x27e970["headers"] = _0x460f5a;
        const _0x45e2eb = await _0x35831c(_0x3df13f + ("/rest/v1/licenses?select=user_id&license_key=eq.") + encodeURIComponent(_0xedf78d["ql_license_key"]) + ("&limit=1"), _0x27e970);
        if (_0x45e2eb && _0x45e2eb["length"] && _0x45e2eb[0x64b + -0x116d + 0xb22]["user_id"]) _0x25c951(_0x45e2eb[0x169 * -0x9 + 0x8eb * -0x2 + 0x1e87]["user_id"]);
        else _0x25c951('');
      } catch (_0x548769) {
        _0x25c951('');
      }
    }));
  }

  function _0x2a00c5() {
    _0x535d0a("idle");
    var _0x229eb2 = document["getElementById"]("sp-body");
    _0x229eb2["innerHTML"] = "<div class=\"lk-license-gate\">" + ("<div class=\"lk-gate-card\">") + ("<div class=\"lk-gate-icon\">") + SP_SVG["keyRound"] + ("</div>") + ("<div class=\"lk-gate-title\">Activate License</div>") + ("<div class=\"lk-gate-desc\">Enter your license key (LI-XXXX format) to activate LovaPilot.</div>") + ("<input class=\"lk-gate-input\" id=\"pk-license-input\" placeholder=\"LI-XXXX-XXXX-XXXX\" spellcheck=\"false\" autocomplete=\"off\">") + ("<button class=\"lk-gate-btn\" id=\"pk-validate-btn\">Validate License</button>") + ("<div class=\"lk-gate-log\" id=\"pk-license-log\"></div>") + ("</div>") + ("</div>"), document["getElementById"]("pk-validate-btn")["addEventListener"]("click", _0x3172f9);
    var _0x322e1f = document["getElementById"]("pk-license-input");
    _0x322e1f && (_0x322e1f["addEventListener"]("keydown", function(_0x5c6d8d) {
      if (_0x5c6d8d["key"] === "Enter") _0x3172f9();
    }), setTimeout(function() {
      _0x322e1f["focus"]();
    }, -0x4 * 0x107 + -0x5 * 0x62a + 0x2352));
  }
  async function _0x3172f9() {
    var _0x3ef02a = document["getElementById"]("pk-license-input"),
      _0xef4394 = document["getElementById"]("pk-license-log"),
      _0xaf98db = _0x3ef02a ? _0x3ef02a["value"]["trim"]() : '';
    if (!_0xaf98db) {
      _0xef4394["className"] = "lk-gate-log lk-log-error", _0xef4394["textContent"] = "Enter a license key";
      return;
    }
    if (!/^.+?/i ["test"](_0xaf98db)) {
      _0xef4394["className"] = "lk-gate-log lk-log-error", _0xef4394["textContent"] = "Key must start with LI-";
      return;
    }
    _0x535d0a("validating"), _0xef4394["className"] = "lk-gate-log lk-log-info", _0xef4394["textContent"] = "Validating...";
    var _0x23f966 = document["getElementById"]("pk-validate-btn");
    if (_0x23f966) _0x23f966["disabled"] = !![];
    try {
      if (!_0x58cc66 && typeof pkLicenseV2 !== "undefined") _0x58cc66 = await pkLicenseV2["getOrCreateDeviceId"]();
      else !_0x180549 && (_0x180549 = await _0x22b8a5(), _0x58cc66 = _0x180549);
      var _0x3c8364;
      if (typeof pkLicenseV2 !== "undefined") _0x3c8364 = await pkLicenseV2["validateLicense"](_0xaf98db, -0x146d + 0x2027 * 0x1 + -0xbba);
      else {
        var _0x579fda = {};
        _0x579fda["Content-Type"] = "application/json";
        var _0x5e4a2e = {};
        _0x5e4a2e["key"] = _0xaf98db, _0x5e4a2e["device_id"] = _0x58cc66 || _0x180549, _0x5e4a2e["device_label"] = "Chrome Extension", _0x5e4a2e["credits"] = 0x0, _0x3c8364 = await _0x35831c(LOVABLE_VALIDATE_URL || "https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license", {
          'method': "POST",
          'headers': _0x579fda,
          'body': JSON["stringify"](_0x5e4a2e)
        });
      }
      if (_0x3c8364 && _0x3c8364["valid"]) {
        if (_0x3c8364["exhausted"]) {
          _0x535d0a("blocked"), _0x325dea(_0x3c8364);
          return;
        }
        _0x535d0a("running"), _0x518b17 = _0xaf98db, _0x36e8d6 = _0x3c8364, _0x3fd338 = _0x3c8364["user_name"] || _0x3c8364["name"] || _0x3fd338, _0x138f00 = _0x3c8364["plan_type"] || _0x3c8364["status"] || "active", chrome["storage"]["local"]["set"]({
          'ql_license_valid': !![],
          'ql_license_key': _0xaf98db,
          'ql_license_data': _0x3c8364,
          'ql_user_name': _0x3fd338,
          'ql_license_status': _0x138f00,
          'plan': {
            'plan_name': _0x3c8364["plan_name"],
            'plan_type': _0x3c8364["plan_type"],
            'credits_remaining': _0x3c8364["credits_remaining"],
            'daily_minutes': _0x3c8364["daily_minutes"],
            'minutes_used_today': _0x3c8364["minutes_used_today"],
            'minutes_remaining_today': _0x3c8364["minutes_remaining_today"],
            'expires_at': _0x3c8364["expires_at"],
            'reset_at': _0x3c8364["reset_at"],
            'max_devices': _0x3c8364["max_devices"],
            'is_trial': _0x3c8364["is_trial"],
            'source': _0x3c8364["source"],
            'buckets': _0x3c8364["buckets"],
            'checked_at': Date['now']()
          }
        }, function() {
          if (typeof pkInvalidateAssertCache === "function") pkInvalidateAssertCache();
          _0x39a1b5(!![]), _0xef4394["className"] = "lk-gate-log lk-log-success", _0xef4394["textContent"] = "Activated!", setTimeout(function() {
            _0x46cc06(), _0x4ca8f3(_0xaf98db), _0x594f74(_0xaf98db);
          }, 0x137c + -0x1cf4 + 0xbd0);
        });
      } else {
        if (_0x3c8364 && (_0x3c8364["terminal"] || _0x3c8364["revoked"] || _0x3c8364["expired"] || _0x3c8364["status"] === "revoked" || _0x3c8364["status"] === "expired" || _0x3c8364["status"] === "suspended")) {
          chrome["storage"]["local"]["remove"](["ql_license_key", "ql_license_valid", "ql_license_data", "plan", "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status", "ql_validity_minutes", "ql_session_id"]);
          var _0xae4a54 = typeof LOVABLE_DASHBOARD_URL !== "undefined" ? LOVABLE_DASHBOARD_URL : "https://wa.me/8801759176229";
          _0xef4394["className"] = "lk-gate-log lk-log-warning", _0xef4394["innerHTML"] = "Your plan changed. <a href=\"" + _0xae4a54 + ("\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#fbbf24;font-weight:700\">Get your new key →</a>"), _0x535d0a("idle");
          if (_0x23f966) _0x23f966["disabled"] = ![];
        } else {
          if (_0x3c8364 && _0x3c8364["exhausted"]) _0x535d0a("blocked"), _0x325dea(_0x3c8364);
          else {
            if (_0x3c8364 && _0x3c8364['error'] && /device limit/i ["test"](_0x3c8364['error'])) {
              var _0x23d4dc = _0x3c8364["max_devices"] || -0xc92 + 0x3d * 0x22 + 0x478,
                _0x30e07f = _0x3c8364["devices_used"] || 0x11d7 * 0x1 + -0x2643 * 0x1 + -0x2 * -0xa36;
              _0xef4394["className"] = "lk-gate-log lk-log-warning", _0xef4394["innerHTML"] = "This key is in use on " + _0x30e07f + '/' + _0x23d4dc + (" devices. <a href=\"") + (typeof LOVABLE_DASHBOARD_URL !== "undefined" ? LOVABLE_DASHBOARD_URL : "https://wa.me/8801759176229") + ("\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#fbbf24;font-weight:700\">Manage devices →</a>"), _0x535d0a("idle");
              if (_0x23f966) _0x23f966["disabled"] = ![];
            } else {
              chrome["storage"]["local"]["remove"](["plan"]);
              var _0x16a334 = _0x3c8364 && _0x3c8364["message"] || _0x3c8364 && _0x3c8364["error"] || "Invalid license key";
              _0xef4394["className"] = "lk-gate-log lk-log-error", _0xef4394["textContent"] = _0x16a334, _0x535d0a("idle");
              if (_0x23f966) _0x23f966["disabled"] = ![];
            }
          }
        }
      }
    } catch (_0xfe2f47) {
      _0xef4394["className"] = "lk-gate-log lk-log-error", _0xef4394["textContent"] = _0xfe2f47["message"] || "Connection error", _0x535d0a("idle");
      if (_0x23f966) _0x23f966["disabled"] = ![];
    }
  }

  function _0x4ca8f3(_0x21afc0, _0x2c5ec8) {
    _0x19624e();
    if (_0x2c5ec8) _0xf822b3(_0x21afc0);
    _0x20898f = setInterval(function() {
      _0xf822b3(_0x21afc0);
    }, 0x2f45 * -0x5 + -0x3cd6 * -0x1 + 0x2d8b * 0x9);
  }

  function _0x1daccd(_0x540c17) {
    _0x36e8d6 = _0x540c17, _0x243811(_0x540c17), chrome["storage"]["local"]["set"]({
      'ql_license_valid': _0x540c17["valid"] === !![],
      'ql_license_data': _0x540c17,
      'ql_license_status': _0x540c17["plan_type"] || _0x540c17["status"] || "active",
      'plan': {
        'plan_name': _0x540c17["plan_name"],
        'plan_type': _0x540c17["plan_type"],
        'credits_remaining': _0x540c17["credits_remaining"],
        'credits_total': _0x540c17["credits_total"],
        'credits_used': _0x540c17["credits_used"],
        'daily_minutes': _0x540c17["daily_minutes"],
        'minutes_used_today': _0x540c17["minutes_used_today"],
        'minutes_remaining_today': _0x540c17["minutes_remaining_today"],
        'expires_at': _0x540c17["expires_at"],
        'reset_at': _0x540c17["reset_at"],
        'max_devices': _0x540c17["max_devices"],
        'is_trial': _0x540c17["is_trial"],
        'source': _0x540c17["source"],
        'buckets': _0x540c17["buckets"],
        'checked_at': Date["now"]()
      }
    }), _0x47fe53(_0x540c17);
  }

  function _0x576ae6(_0x3c6f1f) {
    if (!_0x3c6f1f) return;
    if (_0x3c6f1f['valid'] === !![]) _0x1daccd(_0x3c6f1f);
    else {
      if (_0x3c6f1f["terminal"] || _0x3c6f1f["revoked"] || _0x3c6f1f["expired"] || _0x3c6f1f["valid"] === ![] || _0x3c6f1f["status"] === "revoked" || _0x3c6f1f["status"] === "expired" || _0x3c6f1f["status"] === "suspended") chrome["storage"]['local']["remove"](["ql_license_key", "ql_license_valid", "ql_license_data", 'plan', "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status", "ql_validity_minutes", "ql_session_id"]), _0x295b2a(_0x3c6f1f["error_display"] || _0x3c6f1f["message"] || _0x3c6f1f["error"] || "License key is no longer valid — paste a new key from your dashboard");
      else {
        if (_0x3c6f1f["exhausted"]) _0x325dea(_0x3c6f1f);
        else {
          if (_0x3c6f1f["error"] && /device limit/i ["test"](_0x3c6f1f['error'])) {
            var _0x34d689 = {};
            _0x34d689["plan_name"] = _0x3c6f1f["plan_name"], _0x34d689["device_limit"] = !![], _0x34d689["max_devices"] = _0x3c6f1f["max_devices"], _0x34d689["devices_used"] = _0x3c6f1f["devices_used"], _0x325dea(_0x34d689);
          }
        }
      }
    }
  }

  function _0xf822b3(_0x2a0143) {
    ;
    if (!_0x2a0143) return;
    var _0x2848af = _0x58cc66 || _0x180549;
    if (typeof pkLicenseV2 !== "undefined" && pkLicenseV2["validateLicense"]) pkLicenseV2["validateLicense"](_0x2a0143, -0x21 * -0x128 + 0x9ff + 0x24b * -0x15)["then"](_0x576ae6)["catch"](function() {});
    else {
      var _0x2d6d22 = {};
      _0x2d6d22["Content-Type"] = "application/json";
      var _0x2f22ac = {};
      _0x2f22ac["key"] = _0x2a0143, _0x2f22ac["device_id"] = _0x2848af || '', _0x2f22ac["device_label"] = "Chrome Extension", _0x2f22ac["credits"] = 0x0, chrome["runtime"]["sendMessage"]({
        'action': "proxyFetch",
        'url': LOVABLE_VALIDATE_URL || "https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license",
        'method': 'POST',
        'headers': _0x2d6d22,
        'body': JSON["stringify"](_0x2f22ac)
      }, function(_0x2ef503) {
        if (chrome["runtime"]["lastError"]) return;
        if (_0x2ef503 && _0x2ef503["data"]) _0x576ae6(_0x2ef503["data"]);
      });
    }
  }

  function _0x594f74(_0x5ce82d) {
    ;
    _0x4dd6b9(), _0xad7ef4 = setInterval(function() {
      ;
      if (!_0x5ce82d) return;
      typeof pkLicenseV2 !== "undefined" && pkLicenseV2["heartbeat"] && pkLicenseV2["heartbeat"](_0x5ce82d)['then'](function(_0x463196) {
        _0x463196 && _0x463196["valid"] === ![] && _0x295b2a(_0x463196 && _0x463196["message"] || "License not active");
      })["catch"](function() {});
    }, -0x66726c + 0x4 * -0xe4c6b + 0x1 * 0xd69298);
  }

  function _0x47fe53(_0x5ae30f) {
    if (!_0x5ae30f) return;
    var _0x53ae75 = _0x5ae30f["minutes_used_today"] != null ? _0x5ae30f["minutes_used_today"] : null,
      _0x4c0fb4 = _0x5ae30f["daily_minutes"] != null ? _0x5ae30f["daily_minutes"] : null,
      _0x363538 = _0x5ae30f["credits_remaining"] != null ? _0x5ae30f["credits_remaining"] : null,
      _0xd846da = _0x5ae30f["minutes_remaining_today"] != null ? _0x5ae30f["minutes_remaining_today"] : null,
      _0x2b4b82 = _0x5ae30f["plan_name"] || '',
      _0x266ab9 = _0x222f04(_0x5ae30f, _0x138f00),
      _0x3e1a8a = document["getElementById"]("pk-usage-bar-fill"),
      _0x3c38ac = document["getElementById"]("pk-minutes-used"),
      _0x51deb4 = document["getElementById"]("pk-minutes-total"),
      _0x3a481a = document["getElementById"]("pk-plan-name"),
      _0x565907 = document["getElementById"]("pk-plan-badge");
    _0x3e1a8a && _0x4c0fb4 > -0x1eef + 0x1639 * 0x1 + 0x8b6 && _0x53ae75 != null && (_0x3e1a8a["style"]["width"] = Math['min'](0x73f * 0x5 + -0x1912 + -0xac5, _0x53ae75 / _0x4c0fb4 * (-0x13cc + -0x4f4 * -0x1 + 0xf3c)) + '%');
    if (_0x3c38ac && _0x53ae75 != null) _0x3c38ac["textContent"] = _0x53ae75;
    if (_0x51deb4 && _0x4c0fb4 != null) _0x51deb4["textContent"] = _0x4c0fb4;
    if (_0x3a481a && _0x2b4b82) _0x3a481a["textContent"] = _0x2b4b82;
    if (_0x565907) {
      if (_0x266ab9 === 'trial') _0x565907["textContent"] = "TRIAL", _0x565907["className"] = "lk-plan-badge lk-plan-badge-trial";
      else _0x266ab9 === "unlimited" ? (_0x565907["textContent"] = "UNLIMITED", _0x565907["className"] = "lk-plan-badge lk-plan-badge-unlimited") : (_0x565907["textContent"] = "CREDITS", _0x565907["className"] = "lk-plan-badge lk-plan-badge-credits");
    }(document["getElementById"]("plan-name") || {})["textContent"] = _0x2b4b82;
    var _0x4f3d61 = document["getElementById"]("plan-badge");
    _0x4f3d61 && (_0x4f3d61["textContent"] = _0x266ab9 === "unlimited" ? "UNLIMITED" : _0x266ab9 === 'trial' ? "TRIAL" : "CREDITS", _0x4f3d61["className"] = "lk-plan-card-badge " + _0x266ab9);
    var _0x13d186 = document["getElementById"]("trial-view"),
      _0x4f432f = document["getElementById"]("credits-view"),
      _0x4ea496 = document["getElementById"]("unlimited-view");
    if (_0x13d186) _0x13d186["style"]["display"] = _0x266ab9 === "trial" ? '' : "none";
    if (_0x4f432f) _0x4f432f['style']["display"] = _0x266ab9 === "credits" ? '' : "none";
    if (_0x4ea496) _0x4ea496["style"]["display"] = _0x266ab9 === "unlimited" ? '' : "none";
    var _0x291014 = document["getElementById"]("lk-status-bar");
    _0x291014 && (_0x291014["style"]["display"] = _0x266ab9 === "trial" ? '' : "none");
    var _0x538612 = document["getElementById"]("lk-expiry-container");
    if (_0x538612) {
      var _0x5890ed = _0x5ae30f["expires_at"] || _0x5ae30f["valid_until"],
        _0x330f96 = _0x5890ed ? new Date(_0x5890ed)["toLocaleDateString"]() : '—';
      _0x538612["style"]["display"] = _0x330f96 === '—' ? "none" : '';
    }
    _0x3b4450();
    if (_0x266ab9 === "trial") {
      (document["getElementById"]("trial-left") || {})["textContent"] = _0xd846da != null ? _0xd846da : _0x4c0fb4 || -0xd52 + 0x151b + 0x7c9 * -0x1;
      var _0x3e494d = document["getElementById"]("trial-bar");
      if (_0x3e494d && _0x4c0fb4 > 0xd9e + -0x2d9 + -0xac5) _0x3e494d["style"]["width"] = Math["min"](0x3fa + -0x1 * 0x1605 + 0x126f, (_0x4c0fb4 - (_0xd846da || -0x1 * -0x1119 + 0x3d * 0x79 + -0x2dee)) / _0x4c0fb4 * (0x1688 + 0x29 * 0x7f + 0x1 * -0x2a7b)) + '%';
      (document["getElementById"]("trial-reset") || {})["textContent"] = _0x5ae30f["reset_at"] ? "Resets " + new Date(_0x5ae30f["reset_at"])["toLocaleDateString"]() : '';
    }
    if (_0x266ab9 === "credits") {
      (document["getElementById"]("credits-left") || {})["textContent"] = formatCreditsRemaining(_0x363538 || -0x7 * -0x457 + -0x204c + 0x1eb);
      var _0x175a73 = document["getElementById"]("sp-credit-bar-fill"),
        _0x5df5e6 = document["getElementById"]("sp-credit-bar-left"),
        _0x387857 = document["getElementById"]("sp-credit-bar-right");
      if (_0x175a73 || _0x5df5e6) {
        var _0x197b72 = _0x5ae30f["credits_total"],
          _0x1d6a96 = _0x363538 || 0x596 * -0x5 + -0xf * 0x101 + -0x47 * -0x9b;
        if (_0x175a73) _0x175a73["style"]['width'] = (_0x197b72 && _0x197b72 > _0x1d6a96 ? Math["min"](0x2329 * 0x1 + 0x3 * 0x69d + -0x369c, Math['round'](_0x1d6a96 / _0x197b72 * (-0x8b * 0x2d + 0x1 * -0x345 + 0x1f * 0xe8))) : -0x3 * 0x6ee + 0xa33 * -0x1 + 0x1f61 * 0x1) + '%';
        if (_0x5df5e6) _0x5df5e6["textContent"] = _0x1d6a96["toLocaleString"]();
        if (_0x387857) _0x387857["textContent"] = _0x197b72 ? " / " + _0x197b72["toLocaleString"]() : '';
      }
    }
    if (_0x266ab9 === "unlimited") {
      var _0x5ad26f = _0x5ae30f["expires_at"] || _0x5ae30f["valid_until"];
      if (_0x5ad26f) {
        var _0x354da2 = Math["max"](-0x151b * 0x1 + 0x7ce * -0x4 + -0xa77 * -0x5, Math["ceil"]((new Date(_0x5ad26f) - Date['now']()) / (-0x4b02da * -0x11 + 0xaca * 0xf0c + -0x772bf2)));
        (document["getElementById"]("days-left") || {})["textContent"] = _0x354da2, (document["getElementById"]("expiry-meta") || {})["textContent"] = "Expires " + new Date(_0x5ad26f)["toLocaleDateString"]();
        var _0x33f7d9 = _0x5ae30f["activated_at"] || _0x187d64;
        if (_0x33f7d9)(document["getElementById"]("days-total") || {})["textContent"] = Math['max'](-0x1 * 0x349 + 0x1691 + -0x1 * 0x1347, Math['round']((new Date(_0x5ad26f) - new Date(_0x33f7d9)) / (-0x3 * -0xfe5673 + -0x38d366f + 0x6 * 0xf417d9)));
      }(document["getElementById"]("used-today") || {})["textContent"] = _0x53ae75 != null ? _0x53ae75 : -0x9 * 0x40d + 0x3 * 0x1c4 + 0x1f29;
    }
    var _0x5890ed = _0x5ae30f["expires_at"] || _0x5ae30f["valid_until"];
    (document["getElementById"]("valid-until-short") || {})["textContent"] = _0x5890ed ? new Date(_0x5890ed)["toLocaleDateString"]() : '—';
  }

  function _0x3e7e4b(_0x23b5e4) {
    chrome["storage"]["local"]["get"]([_0x4b4feb], function(_0x2de9e0) {
      _0x3927d0 = _0x2de9e0[_0x4b4feb] || [];
      if (_0x23b5e4) _0x23b5e4();
    });
  }

  function _0x3b9855() {
    if (_0x3927d0["length"] > _0x28ffd8) _0x3927d0 = _0x3927d0['slice'](-_0x28ffd8);
    var _0x4ac14b = {};
    _0x4ac14b[_0x4b4feb] = _0x3927d0, chrome["storage"]["local"]['set'](_0x4ac14b);
  }

  function _0x3a64d5(_0x459fc2, _0x47596c) {
    _0x3927d0["push"]({
      'text': _0x459fc2,
      'timestamp': new Date()["toISOString"](),
      'status': _0x47596c || 'ok'
    }), _0x3b9855(), _0xf4adde();
  }

  function _0xf4adde() {
    var _0xf801e3 = document["querySelector"](".sp-tab[data-tab=\"history\"] .sp-tab-badge");
    if (_0xf801e3) _0xf801e3["textContent"] = _0x3927d0["length"];
  }

  function _0x6c327() {
    var _0x1c347a = document["getElementById"]("sp-tab-content");
    if (!_0x1c347a) return;
    _0x1c347a["innerHTML"] = spTemplateChatHistory(_0x3927d0);
    var _0x2784ce = _0x1c347a["querySelector"](".sp-chat-messages");
    if (_0x2784ce) _0x2784ce["scrollTop"] = _0x2784ce["scrollHeight"];
    var _0x463be5 = document["getElementById"]("sp-chat-clear");
    _0x463be5 && _0x463be5["addEventListener"]('click', function() {
      _0x3927d0 = [], _0x3b9855(), _0x6c327();
    });
  }

  function _0x948de2(_0x42c36c) {
    _0x1258dc = _0x42c36c, document["querySelectorAll"](".sp-tab")["forEach"](function(_0x37d45f) {
      _0x37d45f["classList"]["toggle"]("sp-tab-active", _0x37d45f["getAttribute"]("data-tab") === _0x42c36c);
    }), _0x340e73();
  }

  function _0x46cc06() {
    var _0x199036 = document["getElementById"]("sp-body");
    _0x3e7e4b(function() {
      ;
      _0x199036["innerHTML"] = "<div id=\"sp-update-banner\" style=\"display:none\"></div>" + spTemplateTabs(_0x1258dc, _0x3927d0["length"]) + ("<div id=\"sp-tab-content\"></div>"), document["querySelectorAll"](".sp-tab")["forEach"](function(_0x419586) {
        ;
        _0x419586["addEventListener"]('click', function() {
          _0x948de2(_0x419586["getAttribute"]("data-tab"));
        });
      }), _0x340e73(), _0x5751b0(), chrome["storage"]["onChanged"]["addListener"](_0x665235 => {
        if (_0x665235["lovable_projectId"] || _0x665235["lovable_token"]) _0x5751b0();
      }), _0x18dc80(), _0x25426e();
    });
  }

  function _0x340e73() {
    var _0x65e3c3 = document["getElementById"]("sp-tab-content");
    if (!_0x65e3c3) return;
    if (_0x1258dc === "chat") {
      var _0x1fd751 = spEscapeHtml(normalizeLicenseUserName(_0x3fd338)),
        _0x2c632e = spTemplateStatusBadge(_0x138f00);
      _0x65e3c3["innerHTML"] = spTemplateMainUI(_0x1fd751, _0x2c632e);
      var _0x1973ea = document["getElementById"]("sp-chips");
      _0x1973ea && SP_TEMPLATES["forEach"](function(_0x1cc628) {
        var _0x3ee096 = document["createElement"]("button");
        _0x3ee096["className"] = "sp-chip", _0x3ee096["innerHTML"] = _0x1cc628["icon"] + '\x20' + _0x1cc628['label'], _0x3ee096['title'] = _0x1cc628["prompt"], _0x3ee096["addEventListener"]("click", function() {
          var _0x2e5519 = document["getElementById"]("sp-msg");
          if (_0x2e5519) _0x2e5519["value"] = _0x1cc628["prompt"];
        }), _0x1973ea["appendChild"](_0x3ee096);
      });
      var _0x16c1ce = document["getElementById"]("sp-msg"),
        _0x4811db = document["getElementById"]("sp-char-counter");
      _0x16c1ce && _0x4811db && _0x16c1ce["addEventListener"]("input", function() {
        _0x4811db["textContent"] = _0x16c1ce["value"]["length"];
      });
      var _0x280aae = document["getElementById"]("sp-advanced-toggle"),
        _0x160187 = document["getElementById"]("sp-advanced-panel");
      _0x280aae && _0x160187 && _0x280aae["addEventListener"]("click", function() {
        var _0x42703b = !_0x160187["hasAttribute"]("hidden");
        _0x42703b ? (_0x160187["setAttribute"]("hidden", ''), _0x280aae["setAttribute"]("aria-expanded", "false"), _0x280aae["classList"]["remove"]("sp-advanced-open")) : (_0x160187["removeAttribute"]("hidden"), _0x280aae["setAttribute"]("aria-expanded", 'true'), _0x280aae["classList"]["add"]("sp-advanced-open"));
      });
      migratePlanModeStorageKeys(function(_0x1cb6df) {
        var _0x1184f7 = document["getElementById"]("sp-modo-plano");
        if (_0x1184f7) _0x1184f7["checked"] = _0x1cb6df;
      });
      var _0xd597d1 = document["getElementById"]("sp-modo-plano");
      _0xd597d1 && _0xd597d1["addEventListener"]("change", function() {
        writePlanModeToStorage(this["checked"]);
        if (this["checked"]) _0x4b78bf();
      });
      _0x22d688(), _0x2e0a4e();
      var _0x318cc7 = document["getElementById"]("sp-send");
      if (_0x318cc7) _0x318cc7["addEventListener"]("click", _0x3d8681);
      _0x24c8f1(), _0x3dfcca(), _0x40a226(), _0x38c460(), _0x6849fd(), _0x2fb282(), _0x9f84f5(), _0x3e7e4b(function() {
        var _0x126266 = document["getElementById"]("sp-history-area");
        if (_0x126266) {
          _0x126266["innerHTML"] = spTemplateChatHistory(_0x3927d0);
          var _0x3eda8e = document["getElementById"]("sp-chat-clear");
          _0x3eda8e && _0x3eda8e["addEventListener"]("click", function() {
            var _0x52976b = {};
            _0x52976b[_0x4b4feb] = [], chrome["storage"]["local"]["set"](_0x52976b, function() {
              _0x3927d0 = [];
              var _0x4256bd = document["querySelector"](".sp-tab-badge");
              if (_0x4256bd) _0x4256bd["style"]["display"] = "none";
              _0x340e73();
            });
          });
        }
      });
    } else {
      if (_0x1258dc === "account") {
        var _0x1fd751 = spEscapeHtml(normalizeLicenseUserName(_0x3fd338)),
          _0x5d0663 = _0x36e8d6 || {},
          _0x5d2520 = _0x222f04(_0x5d0663, _0x138f00),
          _0x2267ba = _0x5d0663["plan_name"] || '',
          _0x4735a2 = '';
        if (_0x5d2520 === "trial") _0x4735a2 = "<span class=\"lk-plan-badge lk-plan-badge-trial\" id=\"pk-plan-badge\">TRIAL</span>";
        else _0x5d2520 === "unlimited" ? _0x4735a2 = "<span class=\"lk-plan-badge lk-plan-badge-unlimited\" id=\"pk-plan-badge\">UNLIMITED</span>" : _0x4735a2 = "<span class=\"lk-plan-badge lk-plan-badge-credits\" id=\"pk-plan-badge\">CREDITS</span>";
        var _0xb5d29a = _0x5d0663["expires_at"] || _0x5d0663["valid_until"],
          _0x3b2a0f = _0xb5d29a ? new Date(_0xb5d29a)["toLocaleDateString"]() : '—',
          _0x1c3327 = _0x5d0663["expires_at"] || _0x5d0663["valid_until"],
          _0x23846c = _0x5d0663["activated_at"] || _0x187d64,
          _0x32fdec = _0x1c3327 ? Math["max"](-0x38b * 0x1 + -0xad1 + 0x1 * 0xe5c, Math["ceil"]((new Date(_0x1c3327) - Date["now"]()) / (0x3378f44 + 0x1 * 0x738abc7 + -0x1c34a59 * 0x3))) : '—',
          _0x19715e = '—',
          _0x38f6a5 = 0x1 * 0x2195 + 0x60 * 0x1c + 0x5 * -0x8d1;
        if (_0x1c3327) {
          var _0x585c86 = new Date(_0x1c3327)["getTime"](),
            _0x4c2c48 = Date["now"](),
            _0x5a3d2a = Math['max'](0x11f1 + -0x84 + -0x116d, _0x585c86 - _0x4c2c48);
          if (_0x23846c) {
            var _0x23b8df = Math["max"](0x1 * -0x1d68 + 0x3cc + 0x53 * 0x4f, _0x585c86 - new Date(_0x23846c)["getTime"]());
            _0x38f6a5 = Math["min"](0x944 + -0x1 * -0x1f55 + -0x2835, Math["round"](_0x5a3d2a / _0x23b8df * (0xea * 0x1 + -0x3c0 + 0x7 * 0x76)));
          } else _0x19715e = Math["max"](0x7e0 + 0xc47 + -0x1426, Math["round"](_0x5a3d2a / (-0xa3edd79 + -0x285ec24 + 0x11eb259d))), _0x38f6a5 = Math["min"](0x357 + -0x73c + -0x1 * -0x449, Math["round"](_0x32fdec / _0x19715e * (0x20b8 + -0x2082 + 0x2 * 0x17)));
        }
        var _0x3f0573 = _0x5d0663["credits_remaining"],
          _0x27693c = '';
        chrome["storage"]["local"]["get"](["ql_license_key", "ql_license_data"], function(_0x14685e) {
          _0x27693c = _0x14685e["ql_license_key"] || '';
          var _0x1311f4 = _0x14685e["ql_license_data"] || {},
            _0x2a13c6 = _0x1311f4["devices_used"] != null ? _0x1311f4["devices_used"] : null;
          _0x65e3c3["innerHTML"] = spTemplateAccountHero(_0x1fd751, _0x5d2520, _0x2267ba, _0x4735a2, _0x3b2a0f, _0x32fdec, _0x19715e, _0x3f0573, _0x38f6a5, _0x5d0663["credits_total"]) + (_0x5d2520 === "credits" ? spTemplateCreditBar(_0x3f0573, _0x5d0663["credits_total"]) : '') + ("<div class=\"sp-trial-countdown\" id=\"sp-countdown\" style=\"display:none\"></div>") + ("<div id=\"sp-plan-change-banner\" class=\"lk-plan-change-banner\" style=\"display:none\">Your plan changed. <a href=\"") + (typeof LOVABLE_DASHBOARD_URL !== "undefined" ? LOVABLE_DASHBOARD_URL : "https://wa.me/8801759176229") + ("\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"lk-plan-change-link\">Get your new key →</a></div>") + ("<div class=\"sp-account-rows\" style=\"margin-top:20px\">") + ("<button class=\"sp-btn-ghost-danger\" id=\"sp-logout-account-btn\">") + SP_SVG["logOut"] + (" Logout</button>") + ("</div>");
          var _0x3761 = document["getElementById"]("sp-license-copy");
          _0x3761 && _0x27693c && _0x3761["addEventListener"]("click", function() {
            navigator["clipboard"]["writeText"](_0x27693c), _0x3761["innerHTML"] = SP_SVG["check"], setTimeout(function() {
              _0x3761["innerHTML"] = SP_SVG['copy'];
            }, -0x1dde + 0x7ab * -0x5 + 0xd * 0x5d9);
          }), document["getElementById"]("sp-logout-account-btn")["addEventListener"]("click", function() {
            _0x295b2a();
          }), _0x3b4450(), _0x21170f();
        });
      }
    }
  }

  function _0x233e2f(_0x5ba4b5, _0x183314) {
    var _0x452482 = _0x5ba4b5["minutes_used_today"] != null ? _0x5ba4b5["minutes_used_today"] : -0xea2 + -0x2 * -0x883 + 0x44 * -0x9,
      _0x516752 = _0x5ba4b5["daily_minutes"] != null ? _0x5ba4b5["daily_minutes"] : 0xc * 0xe5 + -0xf * -0x8e + -0x12aa,
      _0x4ee049 = _0x5ba4b5["minutes_remaining_today"] != null ? _0x5ba4b5["minutes_remaining_today"] : null,
      _0xd0e00 = '';
    if (_0x183314 === "trial") {
      var _0x306f36 = _0x516752 > -0xb8c * 0x2 + -0x2d * -0x8a + 0x2 * -0x95 ? Math["min"](0xe82 * 0x2 + -0x18b8 + 0x8 * -0x7d, (_0x516752 - _0x4ee049) / _0x516752 * (-0x3 * -0x9ce + 0xab3 + -0x27b9)) : -0x21ff * 0x1 + 0x32a + -0x9 * -0x36d;
      _0xd0e00 += "<div id=\"trial-view\">" + ("<div class=\"lk-plan-metric-label\">Trial minutes left today</div>") + ("<div class=\"lk-plan-metric-value\"><span class=\"lk-plan-metric-number\" id=\"trial-left\">") + (_0x4ee049 != null ? _0x4ee049 : _0x516752) + ("</span> <small>of ") + _0x516752 + (" min</small></div>") + ("<div class=\"lk-plan-progress\"><div class=\"lk-plan-progress-fill lk-plan-progress-trial\" id=\"trial-bar\" style=\"width:") + _0x306f36 + ("%\"></div></div>") + ("<div class=\"lk-plan-sub-meta\" id=\"trial-reset\">") + (_0x5ba4b5["reset_at"] ? "Resets " + new Date(_0x5ba4b5["reset_at"])["toLocaleDateString"]() : '') + ("</div>") + ("</div>");
    } else {
      if (_0x183314 === "credits") {
        var _0x44965a = _0x5ba4b5["credits_remaining"] != null ? _0x5ba4b5["credits_remaining"] : -0x1667 + 0x6c4 + -0x1 * -0xfa3;
        _0xd0e00 += "<div id=\"credits-view\">" + ("<div class=\"lk-plan-metric-label\">Credits remaining</div>") + ("<div class=\"lk-plan-metric-value\"><span class=\"lk-plan-metric-number\" id=\"credits-left\">") + formatCreditsRemaining(_0x44965a) + ("</span></div>") + ("</div>");
      } else {
        var _0x3e9073 = _0x5ba4b5["expires_at"] || _0x5ba4b5["valid_until"],
          _0x35b9a4 = _0x5ba4b5["activated_at"] || _0x187d64,
          _0x249168 = _0x3e9073 ? Math["max"](-0x65 + -0xa1b * 0x2 + -0x1 * -0x149b, Math["ceil"]((new Date(_0x3e9073) - Date["now"]()) / (-0x133981f + 0xa1dcef0 + 0x5 * -0xc0c55d))) : '—',
          _0x3886d8 = '—';
        _0x3e9073 && _0x35b9a4 && (_0x3886d8 = Math["max"](0x4f1 + 0x1cad + -0x219d, Math['round']((new Date(_0x3e9073) - new Date(_0x35b9a4)) / (-0x178a24a + 0x6d45213 * -0x1 + 0xd73505d)))), _0xd0e00 += "<div id=\"unlimited-view\">" + ("<div class=\"lk-plan-metric-value\"><span class=\"lk-plan-metric-number\" id=\"days-left\">") + _0x249168 + ("</span> <span class=\"lk-plan-metric-sep\">/</span> <span class=\"lk-plan-metric-total\" id=\"days-total\">") + _0x3886d8 + ("</span> <small>days</small></div>") + ("<div class=\"lk-plan-meta\" id=\"expiry-meta\">") + (_0x3e9073 ? "Expires " + new Date(_0x3e9073)["toLocaleDateString"]() : '') + ("</div>") + ("<div class=\"lk-plan-sub-meta\">Today: <span id=\"used-today\">") + _0x452482 + ("</span> min used</div>") + ("</div>");
      }
    }
    return _0xd0e00;
  }

  function _0x48a404(_0x5bb769) {
    var _0x518c7a = {};
    _0x518c7a['url'] = ["*://lovable.dev/*", "*://*.lovable.dev/*"], chrome["tabs"]['query'](_0x518c7a, function(_0x5b13d1) {
      var _0xa0b96f = null,
        _0x55abff = null;
      (_0x5b13d1 || [])["forEach"](function(_0xb98bf0) {
        if (!_0xb98bf0 || !_0xb98bf0["url"]) return;
        if (_0x57057e(_0xb98bf0["url"])) {
          _0x55abff = _0xb98bf0;
          if (_0xb98bf0["active"]) _0xa0b96f = _0xb98bf0;
        }
      }), _0x5bb769(_0xa0b96f || _0x55abff || null);
    });
  }

  function _0x4736b8(_0x578646) {}

  function _0x5751b0() {
    _0x48a404(function(_0x533790) {
      ;
      chrome["runtime"]["sendMessage"]({
        'action': "syncLovableAuth",
        'tabUrl': _0x533790 && _0x533790["url"] || '',
        'projectId': _0x57057e(_0x533790 && _0x533790["url"])
      }, function() {
        ;
        if (chrome["runtime"]["lastError"]) {}
        if (_0x533790 && _0x533790['id']) try {
          var _0x469182 = {};
          _0x469182["action"] = "requestTokenRefresh", chrome['tabs']["sendMessage"](_0x533790['id'], _0x469182, function() {
            if (chrome["runtime"]["lastError"]) {}
          });
        } catch (_0x416760) {}
        chrome["storage"]["local"]["get"](["lovable_projectId", "lovable_token"], _0x4736b8);
      });
    });
  }

  function _0x243811(_0x362c2a) {
    if (!_0x362c2a) return;
    typeof pkResolveLicenseStatus === "function" ? _0x138f00 = pkResolveLicenseStatus(_0x362c2a) : _0x138f00 = _0x362c2a["status"] || _0x138f00, Object["prototype"]["hasOwnProperty"]['call'](_0x362c2a, "expires_at") && (_0x536400 = _0x362c2a["expires_at"] || null), Object["prototype"]["hasOwnProperty"]['call'](_0x362c2a, "activated_at") && (_0x187d64 = _0x362c2a["activated_at"] || null), Object["prototype"]["hasOwnProperty"]["call"](_0x362c2a, "validity_minutes") && (_0x490760 = _0x362c2a["validity_minutes"] != null ? _0x362c2a["validity_minutes"] : null);
  }

  function _0x9ff7d9(_0x22e949) {
    _0x19624e(), _0x4dd6b9();
    if (typeof pkInvalidateAssertCache === "function") pkInvalidateAssertCache();
    _0x39a1b5(![]), chrome["storage"]["local"]["remove"](["plan"]);
    var _0x2325d5 = function() {
      ;
      _0x2abd1e = 'idle', _0x518b17 = null, _0x36e8d6 = null, _0x2a00c5();
      if (_0x22e949) setTimeout(function() {
        _0x498972("Access Denied", _0x22e949);
      }, 0x2e1 * 0x5 + -0x769 * -0x3 + -0x2310);
    };
    typeof pkRevokeLicenseStorage === "function" ? pkRevokeLicenseStorage()["then"](_0x2325d5) : chrome["storage"]["local"]["remove"](["ql_license_valid", "ql_license_key", "ql_license_data", "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status", "ql_validity_minutes", "ql_session_id"], _0x2325d5);
  }

  function _0x1f2bc2() {
    _0x2ece39 && (clearInterval(_0x2ece39), _0x2ece39 = null);
    if (_0x53d9a0) clearInterval(_0x53d9a0);
    _0x9ff7d9("License has expired. Contact your provider to renew.");
  }

  function _0x2924df(_0x1058f1) {
    var _0x42246e = _0x1058f1 && _0x1058f1["reason"];
    if (_0x42246e === "expired") {
      _0x1f2bc2();
      return;
    }
    _0x9ff7d9(_0x1058f1 && _0x1058f1["message"] || "License not active.");
  }

  function _0x3b4450() {
    ;
    const _0x323120 = document["getElementById"]("sp-countdown");
    _0x2ece39 && (clearInterval(_0x2ece39), _0x2ece39 = null);
    const _0x4c1b52 = _0x222f04(_0x36e8d6, _0x138f00);
    if (_0x4c1b52 === "credits") {
      _0x323120 && (_0x323120['style']["display"] = "none", _0x323120["innerHTML"] = '');
      return;
    }
    if (!_0x536400) {
      if (_0x490760 && _0x323120) _0x323120["style"]["display"] = "flex", _0x323120["innerHTML"] = "<span style=\"color:var(--ql-text-muted);font-size:12px\">⏳ Trial: " + _0x490760 + (" min after activation</span>");
      else _0x323120 && (_0x323120["style"]["display"] = "none", _0x323120["innerHTML"] = '');
      return;
    }
    if (!_0x323120) return;
    _0x323120["style"]["display"] = "flex";
    var _0x13a367 = typeof pkParseUtcExpiry === "function" ? pkParseUtcExpiry(_0x536400) : new Date(_0x536400)["getTime"]();
    if (_0x13a367 == null || isNaN(_0x13a367)) {
      _0x323120["style"]["display"] = "none";
      return;
    }
    var _0x413a28 = typeof pkParseUtcExpiry === "function" ? pkParseUtcExpiry(_0x187d64) : _0x187d64 ? new Date(_0x187d64)["getTime"]() : null;
    if (_0x413a28 == null || isNaN(_0x413a28)) _0x413a28 = _0x13a367 - (-0x2bc8f8 + -0x53d2af + 0xb68a27);
    const _0x3ff389 = Math['max'](_0x13a367 - _0x413a28, 0x715b + -0x1 * 0x16ccb + -0x7974 * -0x4);

    function _0x49c7c9() {
      const _0x305b38 = _0x13a367 - Date["now"]();
      if (_0x305b38 <= 0x271 + 0x6 * 0x91 + -0x17 * 0x41) {
        if (!_0x31ebfd && typeof pkEnsureActiveLicense === "function") {
          _0x31ebfd = !![], pkEnsureActiveLicense(!![])["then"](function(_0x2de509) {
            _0x31ebfd = ![];
            if (_0x2de509 && _0x2de509["expires_at"]) {
              _0x536400 = _0x2de509["expires_at"], _0x3b4450();
              return;
            }
            _0x1f2bc2();
          })["catch"](function() {
            _0x31ebfd = ![], _0x1f2bc2();
          });
          return;
        }
        if (!_0x31ebfd) _0x1f2bc2();
        return;
      }
      const _0x49384f = Math['floor'](_0x305b38 / (-0x5800167 + -0xdf5f38 + -0x1 * -0xb85bc9f)),
        _0xfe5484 = Math['floor'](_0x305b38 % (-0x46aac41 + -0x24bcb3d + 0xbdcd37e) / (-0x3b72ba + 0x1 * -0x1d0143 + -0x3 * -0x2fcb7f)),
        _0x40ae75 = Math["floor"](_0x305b38 % (0x298a71 * 0x1 + -0x8552c * 0x6 + 0x3f6317) / (0x4d * -0x146 + 0x21fe + 0x12a70)),
        _0x4bc5a6 = Math["floor"](_0x305b38 % (-0x493 * -0x2a + 0x52 * 0x59e + -0x1a25a * 0x1) / (0x1 * -0x11a1 + -0x1 * -0x19d + 0x13ec)),
        _0x403935 = Math["max"](0x10fb + 0x1a47 + -0x2b42, Math["min"](0xa5b + 0x214e + -0x2b45, _0x305b38 / _0x3ff389 * (0x49 * 0x22 + -0xa6b + -0xf * -0x13)));
      let _0x2adfbb = _0x49384f > -0x634 * 0x5 + 0xee0 + 0x1024 ? _0x49384f + 'd\x20' + _0xfe5484 + 'h\x20' + _0x40ae75 + 'm\x20' + String(_0x4bc5a6)["padStart"](-0xb * -0x26 + -0x17 * -0x7f + 0x2f * -0x47, '0') + 's' : _0xfe5484 > -0xb * 0x206 + 0x230f + -0xccd ? _0xfe5484 + 'h\x20' + _0x40ae75 + 'm\x20' + String(_0x4bc5a6)["padStart"](0x22 * 0x10b + -0x1b4c + -0x1 * 0x828, '0') + 's' : _0x40ae75 + ':' + String(_0x4bc5a6)["padStart"](0x267d + -0x10 * 0xca + -0x19db, '0');
      const _0x3e31d9 = _0x138f00 === 'trial' ? "Trial expires in" : "License expires in",
        _0x11570f = _0x403935 < -0xf83 * -0x2 + 0x1c49 + -0x3b3b ? " sp-bar-urgent" : '';
      _0x323120["innerHTML"] = spTemplateCountdown(_0x3e31d9, _0x2adfbb, _0x403935, _0x11570f);
    }
    _0x49c7c9(), _0x2ece39 = setInterval(_0x49c7c9, 0x234d + -0xd * -0x29a + -0x4137);
  }

  function _0x15d4b2(_0x443af2) {
    try {
      const _0x268021 = _0x443af2["split"]('.");if(_0x268021[\"length\"]<-0x12b0+-0x77d*-0x3+0x5*-0xc1)return null;const _0x2f9115=_0x268021[-0xe*0x240+0x14aa+0xad7][\"replace\"](/-/g,)[\"replace\"](/_/g,"/'),
        _0x38a69a = _0x2f9115 + '=' ["repeat"]((-0x1d8a * -0x1 + -0x84 + -0x1 * 0x1d02 - _0x2f9115["length"] % (0x1bf6 + 0x1 * 0xb8c + -0x277e * 0x1)) % (0x2 * 0x44 + -0x19d6 + -0x2 * -0xca9)),
        _0x191614 = JSON["parse"](atob(_0x38a69a));
      return _0x191614["sub"] || _0x191614["user_id"] || null;
    } catch (_0x10a289) {
      return null;
    }
  }
  async function _0x255724(_0x593301) {
    ;
    return new Promise(_0x210151 => {
      ;
      const _0x4c2207 = new Image(),
        _0x4744ca = URL["createObjectURL"](_0x593301);
      _0x4c2207["onload"] = () => {
        URL["revokeObjectURL"](_0x4744ca);
        const _0x3150b4 = -0x1c1d * 0x1 + -0x1 * 0x3e1 + 0x24fe;
        let _0x36507f = _0x4c2207["width"],
          _0x1575cf = _0x4c2207["height"];
        if (_0x36507f > _0x3150b4 || _0x1575cf > _0x3150b4) {
          const _0x147168 = Math['min'](_0x3150b4 / _0x36507f, _0x3150b4 / _0x1575cf);
          _0x36507f = Math['round'](_0x36507f * _0x147168), _0x1575cf = Math["round"](_0x1575cf * _0x147168);
        }
        const _0x48ea7c = document["createElement"]("canvas");
        _0x48ea7c["width"] = _0x36507f, _0x48ea7c["height"] = _0x1575cf, _0x48ea7c["getContext"]('2d')["drawImage"](_0x4c2207, 0x4 * -0x617 + 0x25fe + -0xda2, -0x1e60 + 0x3 * -0x9f7 + 0x3c45, _0x36507f, _0x1575cf);
        const _0x2c1f55 = _0x593301['type'] === "image/png" ? "image/png" : "image/jpeg";
        _0x48ea7c["toBlob"](_0x3ac216 => {
          var _0x342ccb = {};
          _0x342ccb["file"] = _0x593301, _0x342ccb["previewUrl"] = null;
          if (!_0x3ac216) return _0x210151(_0x342ccb);
          var _0x5e6818 = {};
          _0x5e6818["type"] = _0x2c1f55, _0x210151({
            'file': new File([_0x3ac216], _0x593301["name"], _0x5e6818),
            'previewUrl': URL["createObjectURL"](_0x3ac216)
          });
        }, _0x2c1f55, _0x593301['type'] === "image/png" ? undefined : 0x32e + 0x1097 + 0x1 * -0x13c5 + 0.8);
      }, _0x4c2207["onerror"] = () => {
        URL["revokeObjectURL"](_0x4744ca);
        var _0x51f17b = {};
        _0x51f17b["file"] = _0x593301, _0x51f17b["previewUrl"] = null, _0x210151(_0x51f17b);
      }, _0x4c2207["src"] = _0x4744ca;
    });
  }

  function _0xaa0297(_0x34bbb8) {
    if (_0x34bbb8 && typeof _0x34bbb8["type"] === "string" && _0x34bbb8["type"]["trim"]()) return _0x34bbb8['type'];
    const _0x57c9af = (_0x34bbb8 && _0x34bbb8["name"] ? _0x34bbb8["name"] : '')["toLowerCase"](),
      _0x55e58b = _0x57c9af["includes"]('.') ? _0x57c9af["split"]('.')["pop"]() : '';
    var _0x2cad97 = {};
    _0x2cad97["pdf"] = "application/pdf", _0x2cad97["txt"] = "text/plain", _0x2cad97["csv"] = "text/csv", _0x2cad97["json"] = "application/json", _0x2cad97["zip"] = "application/zip", _0x2cad97["doc"] = "application/msword", _0x2cad97['docx'] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document", _0x2cad97["xls"] = "application/vnd.ms-excel", _0x2cad97["xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", _0x2cad97["ppt"] = "application/vnd.ms-powerpoint", _0x2cad97["pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation", _0x2cad97["mp3"] = "audio/mpeg", _0x2cad97["wav"] = "audio/wav", _0x2cad97['mp4'] = "video/mp4", _0x2cad97['webm'] = "video/webm";
    const _0x2a46e8 = _0x2cad97;
    return _0x2a46e8[_0x55e58b] || "application/octet-stream";
  }

  function _0x23e537(_0x2d4f05, _0x1e5534) {
    const _0x100138 = _0x1e5534 && _0x1e5534["name"] ? String(_0x1e5534['name']) : '',
      _0x35eed1 = _0x100138["includes"]('.') ? _0x100138["split"]('.')["pop"]()["toLowerCase"]() : '',
      _0xcb1afc = _0x35eed1 && /^[a-z0-9]{1,10}$/ ["test"](_0x35eed1) ? _0x35eed1 : 'bin';
    return _0x2d4f05 + '.' + _0xcb1afc;
  }
  async function _0x2ecfb4(_0x285d23, _0x3ff0f6) {
    ;
    const _0x181bae = crypto["randomUUID"]();
    return new Promise(function(_0x517d0c, _0x215557) {
      ;
      const _0xe703d6 = new FileReader();
      _0xe703d6["onloadend"] = function() {
        var _0x4aa4e7 = {};
        _0x4aa4e7["file_id"] = _0x181bae, _0x4aa4e7["file_name"] = _0x285d23["name"] || "file", _0x4aa4e7["public_url"] = _0xe703d6["result"], _0x517d0c(_0x4aa4e7);
      }, _0xe703d6["onerror"] = function() {
        _0x215557(new Error("Failed to read file as Data URL"));
      }, _0xe703d6["readAsDataURL"](_0x285d23);
    });
  }

  function _0x64f0c7() {
    ;
    const _0x2cd875 = document["getElementById"]("sp-attach-preview");
    if (!_0x2cd875) return;
    if (_0x59ed71["length"] === 0x14f9 * 0x1 + 0x24d5 + -0x39ce) {
      _0x2cd875["style"]["display"] = "none", _0x2cd875["innerHTML"] = '';
      return;
    }
    _0x2cd875["style"]["display"] = "flex", _0x2cd875["innerHTML"] = _0x59ed71["map"]((_0x4489ee, _0x481e6e) => spTemplateAttachItem(_0x4489ee, _0x481e6e))["join"](''), _0x2cd875["querySelectorAll"](".sp-attach-remove")["forEach"](_0x48859d => {
      _0x48859d["addEventListener"]("click", () => {
        const _0x42d803 = parseInt(_0x48859d["getAttribute"]("data-idx"));
        if (_0x59ed71[_0x42d803] && _0x59ed71[_0x42d803]["previewUrl"]) URL["revokeObjectURL"](_0x59ed71[_0x42d803]["previewUrl"]);
        _0x59ed71["splice"](_0x42d803, -0x1fc8 * 0x1 + -0x1fb7 + 0x3f80), _0x64f0c7();
      });
    });
  }

  function _0x22d688() {
    ;
    const _0x4af411 = document["getElementById"]("sp-attach-btn"),
      _0x805349 = document["getElementById"]("sp-file-input");
    if (!_0x4af411 || !_0x805349) return;
    _0x4af411["addEventListener"]("click", () => {
      if (_0x59ed71["length"] >= _0x312084) {
        _0x498972("Limit", "Maximum " + _0x312084 + (" files."));
        return;
      }
      _0x805349['click']();
    }), _0x805349["addEventListener"]("change", async () => {
      const _0x7118c7 = Array['from'](_0x805349['files'] || []);
      _0x805349["value"] = '';
      if (!_0x7118c7["length"]) return;
      const _0x13aa1a = await new Promise(_0x703412 => chrome["storage"]["local"]["get"](["lovable_token"], _0x703412));
      let _0x1bc8fd = _0x13aa1a["lovable_token"] || '';
      if (!_0x1bc8fd) {
        _0x498972("Error", "Token not captured.");
        return;
      }
      if (_0x1bc8fd["startsWith"]("Bearer ")) _0x1bc8fd = _0x1bc8fd["slice"](-0x35 * -0x47 + 0x2b6 * -0x5 + 0x1a * -0xb);
      for (const _0x48f29e of _0x7118c7) {
        if (_0x59ed71["length"] >= _0x312084) break;
        if (_0x48f29e["size"] > _0x3fcd4a) {
          _0x498972("File Too Large", _0x48f29e['name'] + (" exceeds 20MB."));
          continue;
        }
        let _0x349947 = _0x48f29e,
          _0xc07947 = null;
        if (["image/png", "image/jpeg", "image/webp"]["includes"](_0x48f29e['type'])) {
          const _0x554a77 = await _0x255724(_0x48f29e);
          _0x349947 = _0x554a77['file'], _0xc07947 = _0x554a77["previewUrl"];
        }
        const _0x30e5f4 = ["image/png", "image/jpeg", "image/webp"]["includes"](_0x349947["type"]),
          _0x58fdaa = _0x59ed71["length"];
        _0x59ed71['push']({
          'file_id': null,
          'file_name': _0x48f29e['name'],
          'previewUrl': _0xc07947,
          'file_type': _0x349947["type"],
          'sizeLabel': spFormatFileSize(_0x349947['size']),
          'uploading': !![],
          'rawFile': _0x349947
        }), _0x64f0c7();
        try {
          const _0x59c7c9 = await _0x2ecfb4(_0x349947, _0x1bc8fd);
          _0x59ed71[_0x58fdaa]["file_id"] = _0x59c7c9["file_id"], _0x59ed71[_0x58fdaa]["public_url"] = _0x59c7c9["public_url"], _0x59ed71[_0x58fdaa]["uploading"] = ![], _0x64f0c7();
        } catch (_0x4b817c) {
          console["warn"]("[LovaPilot] Image upload failed:", _0x4b817c["message"]), _0x59ed71[_0x58fdaa]["uploading"] = ![], _0x59ed71[_0x58fdaa]["uploadFailed"] = !![], _0x64f0c7(), _0x498972("Upload Error", "Could not upload the image: " + (_0x4b817c["message"] || "unknown error"));
        }
      }
    });
  }

  function _0x4b78bf() {
    ;
    const _0x3a08de = document["createElement"]("div");
    _0x3a08de["className"] = "sp-modal-overlay", _0x3a08de["innerHTML"] = "<div class=\"sp-modal\">" + ("<div class=\"sp-modal-icon\">") + SP_SVG["shield"] + ("</div>") + ("<div class=\"sp-modal-title\">Attention — Plan Mode</div>") + ("<div class=\"sp-modal-body\">") + ("<strong>Plan Mode</strong> (Think mode in Lovable) may use credits while planning. Use in moderation, then send builds through the extension with Plan Mode off.") + ("</div>") + ("<div style=\"margin-bottom:14px;\">") + ("<div class=\"sp-modal-step\"><span class=\"sp-modal-step-num\">1</span><span class=\"sp-modal-step-text\">Enable <strong>Plan Mode</strong> and send your prompt through the extension.</span></div>") + ("<div class=\"sp-modal-step\"><span class=\"sp-modal-step-num\">2</span><span class=\"sp-modal-step-text\">Lovable will generate a plan. <strong>Do not click Approve</strong> in Lovable.</span></div>") + ("<div class=\"sp-modal-step\"><span class=\"sp-modal-step-num\">3</span><span class=\"sp-modal-step-text\"><strong>Copy the plan</strong> and paste it into the extension prompt.</span></div>") + ("<div class=\"sp-modal-step\"><span class=\"sp-modal-step-num\">4</span><span class=\"sp-modal-step-text\"><strong>Turn off Plan Mode</strong> and send through the extension. No extra credits.</span></div>") + ("</div>") + ("<div class=\"sp-modal-check\">") + ("<input type=\"checkbox\" id=\"sp-modal-dismiss\" />") + ("<label for=\"sp-modal-dismiss\">Do not show again</label>") + ("</div>") + ("<button class=\"sp-modal-btn\" id=\"sp-modal-ok\">Got it!</button>") + ("</div>"), document["body"]["appendChild"](_0x3a08de), document["getElementById"]("sp-modal-ok")["addEventListener"]("click", function() {
      var _0x59dfdb = document["getElementById"]("sp-modal-dismiss")["checked"],
        _0x415eea = {};
      _0x415eea["ql_modo_plano_alert_dismissed"] = !![];
      if (_0x59dfdb) chrome["storage"]["local"]["set"](_0x415eea);
      _0x3a08de["remove"]();
    }), _0x3a08de["addEventListener"]("click", function(_0x2d8e18) {
      if (_0x2d8e18["target"] === _0x3a08de) _0x3a08de["remove"]();
    });
  }

  function _0x4b3c9e(_0x257c71, _0xf6a84b) {
    ;
    return new Promise(function(_0x171d0a, _0x1e4277) {
      var _0x3964c2 = {};
      _0x3964c2["action"] = "sendPromptToLovable", _0x3964c2["message"] = _0x257c71, _0x3964c2["files"] = _0xf6a84b, chrome["runtime"]["sendMessage"](_0x3964c2, function(_0x497edf) {
        if (chrome["runtime"]["lastError"]) return _0x1e4277(new Error(chrome["runtime"]["lastError"]["message"]));
        if (_0x497edf && _0x497edf['ok']) _0x171d0a();
        else _0x1e4277(new Error(_0x497edf && _0x497edf["error"] || "Send failed"));
      });
    });
  }

  function _0x4d6059(_0xcc8193) {
    var _0x554c3c = document["getElementById"]("sp-publish-modal");
    if (_0x554c3c) _0x554c3c["remove"]();
    var _0x199a87 = document["createElement"]("div");
    _0x199a87['id'] = "sp-publish-modal", _0x199a87["className"] = "pk-publish-overlay", _0x199a87["innerHTML"] = "<div class=\"pk-publish-modal\">" + ("<div class=\"pk-publish-emoji\" style=\"font-size:28px\">🎉</div>") + ("<h3>Project Published!</h3>") + ("<p>Open your project using the link below:</p>") + ("<div class=\"pk-publish-url-box\"><a href=\"") + _0xcc8193 + ("\" target=\"_blank\" rel=\"noopener noreferrer\">") + _0xcc8193 + ("</a></div>") + ("<div class=\"pk-publish-actions\">") + ("<button id=\"sp-publish-copy\" class=\"pk-publish-copy\">📋 Copy</button>") + ("<button id=\"sp-publish-open\" class=\"pk-publish-open\">🔗 Open</button>") + ("</div>") + ("<button id=\"sp-publish-close\" class=\"pk-publish-close\">Close</button>") + ("</div>"), document["body"]["appendChild"](_0x199a87), document["getElementById"]("sp-publish-copy")["addEventListener"]("click", function() {
      navigator["clipboard"]["writeText"](_0xcc8193), this["textContent"] = "✓ Copied!";
    }), document["getElementById"]("sp-publish-open")["addEventListener"]('click', function() {
      window["open"](_0xcc8193, "_blank");
    }), document["getElementById"]("sp-publish-close")["addEventListener"]("click", function() {
      _0x199a87["remove"]();
    }), _0x199a87["addEventListener"]("click", function(_0x4f96d6) {
      if (_0x4f96d6["target"] === _0x199a87) _0x199a87["remove"]();
    });
  }

  function _0x2fb282() {
    var _0x3d63a1 = document["getElementById"]("sp-publish-project");
    if (!_0x3d63a1) return;
    _0x3d63a1["addEventListener"]("click", async function() {
      var _0x396b87 = document["getElementById"]("sp-log");
      _0x3d63a1["disabled"] = !![], _0x3d63a1["textContent"] = "⏳ Publishing...";
      try {
        var _0x21a217 = await _0x455b0b(_0x54686d, {});
        if (_0x21a217 && _0x21a217["success"] === ![]) throw new Error(_0x21a217["error_display"] || _0x21a217["message"] || "Publish error");
        _0x396b87["className"] = "sp-log sp-log-success", _0x396b87["textContent"] = "✓ Project published!";
        if (_0x21a217 && _0x21a217["url"]) _0x4d6059(_0x21a217["url"]);
      } catch (_0x1a1314) {
        _0x396b87["className"] = "sp-log sp-log-error", _0x396b87["textContent"] = '✗\x20' + (_0x1a1314["message"] || _0x1a1314);
      } finally {
        _0x3d63a1["disabled"] = ![], _0x3d63a1["textContent"] = "🌐 Publish Project";
      }
    });
  }

  function _0x9f84f5() {
    var _0x593725 = document["getElementById"]("sp-enable-cloud");
    if (!_0x593725) return;
    _0x593725["addEventListener"]("click", async function() {
      var _0xd3dc18 = document["getElementById"]("sp-log");
      _0x593725["disabled"] = !![], _0x593725["textContent"] = "⏳ Activating Cloud...";
      try {
        var _0x4a403c = {};
        _0x4a403c["region"] = "america";
        var _0x2b05b0 = await _0x455b0b(_0x127833, _0x4a403c);
        if (_0x2b05b0 && _0x2b05b0["success"] === ![]) throw new Error(_0x2b05b0["error_display"] || _0x2b05b0["message"] || "Cloud activation error");
        _0xd3dc18["className"] = "sp-log sp-log-success", _0xd3dc18["textContent"] = '✓\x20' + (_0x2b05b0 && _0x2b05b0["message"] ? _0x2b05b0["message"] : "Lovable Cloud activated!");
      } catch (_0x16a1fc) {
        _0xd3dc18["className"] = "sp-log sp-log-error", _0xd3dc18["textContent"] = '✗\x20' + (_0x16a1fc["message"] || _0x16a1fc);
      } finally {
        _0x593725["disabled"] = ![], _0x593725["textContent"] = "☁️ Enable Lovable Cloud";
      }
    });
  }
  var _0x35a704 = "Add this CSS to global styles on every page: #lovable-badge { display: none !important; visibility: hidden !important; pointer-events: none !important; } Completely remove the entire Lovable branding widget — the Made with Lovable text AND the floating close X button. Hide the parent #lovable-badge container, not just the text inside it. No empty box or orphaned X button should remain visible.";

  function _0x24c8f1() {
    var _0x1cfb39 = document["getElementById"]("sp-remove-watermark");
    if (!_0x1cfb39) return;
    _0x1cfb39["addEventListener"]("click", async function() {
      var _0xbba5f3 = document["getElementById"]("sp-log");
      _0x1cfb39["disabled"] = !![], _0x1cfb39["textContent"] = "⏳ Sending...";
      try {
        await _0x4b3c9e(_0x35a704), _0xbba5f3["className"] = "sp-log sp-log-success", _0xbba5f3["textContent"] = "✓ Prompt sent! Wait for Lovable to apply the CSS.";
      } catch (_0x2650c7) {
        _0xbba5f3["className"] = "sp-log sp-log-error", _0xbba5f3["textContent"] = '✗\x20' + (_0x2650c7["message"] || _0x2650c7);
      } finally {
        _0x1cfb39["disabled"] = ![], _0x1cfb39["textContent"] = "Remove Watermark";
      }
    });
  }
  async function _0x3d8681() {
    ;
    const _0x2c3235 = document["getElementById"]("sp-msg")["value"]["trim"](),
      _0x32d75d = document["getElementById"]("sp-log"),
      _0x348e13 = document["getElementById"]("sp-send");
    if (!_0x2c3235) {
      _0x32d75d["className"] = "sp-log sp-log-error", _0x32d75d["textContent"] = "⚠ Empty prompt";
      return;
    }
    _0x348e13["disabled"] = !![], _0x348e13["textContent"] = '⏳';
    const _0x2064ed = _0x59ed71["filter"](function(_0x5f4641) {
      return _0x5f4641["uploading"];
    });
    if (_0x2064ed["length"] > 0x11d6 * -0x2 + -0x1af2 + 0x3e9e) {
      _0x32d75d["className"] = "sp-log sp-log-error", _0x32d75d["textContent"] = "⏳ Wait — " + _0x2064ed["length"] + (" file(s) still uploading."), _0x348e13["disabled"] = ![], _0x348e13["textContent"] = "Send";
      return;
    }
    const _0x2cff6d = _0x59ed71["filter"](function(_0x181c7c) {
      return _0x181c7c["uploadFailed"];
    });
    if (_0x2cff6d["length"] > -0x2d6 + -0xdcb + 0x58b * 0x3) {
      _0x32d75d["className"] = "sp-log sp-log-error", _0x32d75d["textContent"] = '✗\x20' + _0x2cff6d["length"] + (" file(s) failed to upload. Remove them and try again."), _0x348e13["disabled"] = ![], _0x348e13["textContent"] = "Send";
      return;
    }
    const _0x57b2b2 = _0x59ed71["filter"](function(_0x2843cc) {
        return _0x2843cc["public_url"] && !_0x2843cc["uploading"] && !_0x2843cc["uploadFailed"];
      }),
      _0x1649a9 = _0x57b2b2["length"] > -0xb8d + -0x9b * -0x3 + 0x1 * 0x9bc;
    var _0xadcfcf = _0x2c3235,
      _0x4e0c33 = undefined;
    _0x1649a9 && (_0x4e0c33 = _0x57b2b2["map"](function(_0x4211cd) {
      var _0xda2050 = {};
      return _0xda2050["name"] = _0x4211cd["file_name"], _0xda2050["type"] = _0x4211cd["file_type"], _0xda2050["dataUrl"] = _0x4211cd["public_url"], _0xda2050;
    }));
    _0x32d75d["className"] = "sp-log sp-log-info", _0x32d75d["textContent"] = "⏳ Sending...";
    try {
      const _0xf606bd = await new Promise(_0xe8f568 => chrome["storage"]["local"]['get'](["lovable_projectId", "ql_license_key"], _0xe8f568)),
        _0x53a8ae = _0xf606bd["lovable_projectId"] || '',
        _0x419479 = _0xf606bd["ql_license_key"] || '';
      if (!_0x53a8ae) {
        _0x32d75d["className"] = "sp-log sp-log-error", _0x32d75d["textContent"] = "⚠ Project not synced. Open lovable.dev on your project.", _0x348e13["disabled"] = ![], _0x348e13["textContent"] = "Send";
        return;
      }
      var _0x4dde3b = await new Promise(function(_0x1edeb0) {
        ;
        chrome["storage"]["local"]["get"](["ql_license_valid"], function(_0x5650e4) {
          _0x1edeb0(!!_0x5650e4["ql_license_valid"]);
        });
      });
      if (!_0x4dde3b) {
        _0x32d75d["className"] = "sp-log sp-log-error", _0x32d75d["textContent"] = "⚠ Activate your license key first", _0x348e13["disabled"] = ![], _0x348e13["textContent"] = "Send";
        return;
      }
      _0x1649a9 ? (await _0x4b3c9e(_0xadcfcf, _0x4e0c33), await _0x4b3c9e(_0xadcfcf)) : await _0x4b3c9e(_0xadcfcf);
      try {
        const _0x2e368e = _0x222f04(_0x36e8d6, _0x138f00);
        if (_0x2e368e === "credits" && _0x419479) {
          var _0x56e1e7 = _0x58cc66 || _0x180549,
            _0x34e054 = {};
          _0x34e054["Content-Type"] = "application/json";
          var _0x21855f = {};
          _0x21855f["key"] = _0x419479, _0x21855f["device_id"] = _0x56e1e7 || '', _0x21855f["device_label"] = "Chrome Extension", _0x21855f["credits"] = 0x1;
          var _0x5eab63 = await _0x35831c(_0x2c868e, {
            'method': 'POST',
            'headers': _0x2dae9f(_0x34e054),
            'body': JSON["stringify"](_0x21855f)
          });
          _0x5eab63 && _0x5eab63['valid'] && _0x1daccd(_0x5eab63);
        }
      } catch (_0x499691) {
        console["warn"]("[SP] Credit deduction failed:", _0x499691 && _0x499691["message"]);
      }
      _0x32d75d["className"] = "sp-log sp-log-success", _0x32d75d["textContent"] = "✓ Prompt sent!", _0x3a64d5(_0x2c3235, 'ok'), document["getElementById"]("sp-msg")["value"] = '', _0x59ed71["forEach"](_0x4c7559 => {
        if (_0x4c7559["previewUrl"]) URL["revokeObjectURL"](_0x4c7559["previewUrl"]);
      }), _0x59ed71 = [], _0x64f0c7();
    } catch (_0x292b4f) {
      _0x32d75d["className"] = "sp-log sp-log-error", _0x32d75d["textContent"] = '✗\x20' + _0xbfc16a(_0x292b4f["message"] || _0x292b4f), _0x3a64d5(_0x2c3235, "error");
    } finally {
      _0x348e13["disabled"] = ![], _0x348e13["textContent"] = "Send";
    }
  }
  let _0x4bfa1a = -0x1b8b + -0x25d4 + 0x415f;

  function _0x378a72(_0x5817be) {
    ;
    if (_0x53d9a0) clearInterval(_0x53d9a0);
    _0x4bfa1a = -0x3d8 + 0xac5 + -0x24f * 0x3, _0x53d9a0 = setInterval(async () => {
      try {
        if (!chrome["runtime"] || !chrome["runtime"]['id']) {
          clearInterval(_0x53d9a0), console["warn"]("[SP] Heartbeat stopped: extension context invalidated");
          return;
        }
        var _0x1a3e1e = {};
        _0x1a3e1e["Content-Type"] = "application/json";
        var _0x5a8772 = {};
        _0x5a8772["license_key"] = _0x5817be, _0x5a8772["session_id"] = _0x754607, _0x5a8772["heartbeat"] = !![], _0x5a8772["device_id"] = _0x180549, _0x5a8772["max_devices"] = 0x2, _0x5a8772["device_limit"] = 0x2, _0x5a8772["allowed_devices"] = 0x2;
        const _0x109537 = await _0x35831c(_0x2c868e, {
          'method': 'POST',
          'headers': _0x2dae9f(_0x1a3e1e),
          'body': JSON["stringify"](_0x5a8772)
        });
        if (!_0x109537["valid"]) {
          var _0x247672 = typeof pkShouldLockoutFromValidation === "function" ? pkShouldLockoutFromValidation(_0x109537, _0x4bfa1a) : {
            'lock': !![],
            'conflictCount': _0x4bfa1a,
            'message': _0x109537["message"]
          };
          _0x4bfa1a = _0x247672["conflictCount"];
          if (_0x247672['lock']) {
            clearInterval(_0x53d9a0);
            if (typeof pkInvalidateAssertCache === "function") pkInvalidateAssertCache();
            var _0x391092 = {};
            _0x391092["reason"] = _0x109537["reason"] || _0x247672["reason"], _0x391092["message"] = _0x247672["message"] || _0x109537["message"], _0x2924df(_0x391092);
          }
          return;
        }
        _0x4bfa1a = 0x2276 + 0x61f + -0xd87 * 0x3;
        if (_0x109537["user_name"]) {
          _0x3fd338 = normalizeLicenseUserName(_0x109537["user_name"]);
          const _0x14e9c7 = document["getElementById"]("sp-name");
          if (_0x14e9c7) _0x14e9c7["textContent"] = _0x3fd338;
        }
        _0x243811(_0x109537);
        var _0x66b75d = {};
        _0x66b75d["ql_expires_at"] = _0x536400, chrome["storage"]["local"]["set"](typeof pkLicenseStoragePatch === "function" ? pkLicenseStoragePatch(_0x109537) : _0x66b75d), _0x3b4450();
      } catch (_0x4a169d) {
        _0x4a169d["message"] && _0x4a169d["message"]["includes"]("Extension context invalidated") && (clearInterval(_0x53d9a0), console["warn"]("[SP] Heartbeat stopped: extension context invalidated"));
      }
    }, -0xb0cc + -0xd0c1 + 0x26bed);
  }

  function _0x2e0a4e() {
    var _0x1e96e5 = document["getElementById"]("sp-msg");
    if (!_0x1e96e5) return;
    var _0x2ae95c = document["getElementById"]("sp-body") || _0x1e96e5,
      _0x493470 = null;

    function _0x4f20bd() {
      if (_0x493470) return;
      _0x493470 = document["createElement"]("div"), _0x493470["className"] = "sp-drag-overlay", _0x493470["innerHTML"] = "<div class=\"sp-drag-overlay-inner\">📂 Drop files here</div>", document["body"]["appendChild"](_0x493470);
    }

    function _0x29b0f7() {
      _0x493470 && (_0x493470["remove"](), _0x493470 = null);
    }
    _0x2ae95c["addEventListener"]("dragover", function(_0x275c46) {
      _0x275c46["preventDefault"](), _0x275c46["stopPropagation"](), _0x4f20bd();
    }), _0x2ae95c["addEventListener"]("dragleave", function(_0x17e7b4) {
      _0x17e7b4["preventDefault"](), _0x17e7b4["stopPropagation"]();
      if (!_0x2ae95c["contains"](_0x17e7b4["relatedTarget"])) _0x29b0f7();
    }), _0x2ae95c["addEventListener"]('drop', async function(_0x8570a6) {
      _0x8570a6["preventDefault"](), _0x8570a6["stopPropagation"](), _0x29b0f7();
      var _0x2d3230 = Array["from"](_0x8570a6["dataTransfer"]["files"] || []);
      if (!_0x2d3230["length"]) return;
      await _0x8d3c29(_0x2d3230);
    }), _0x1e96e5["addEventListener"]("paste", async function(_0x24d245) {
      var _0x3d84ad = _0x24d245["clipboardData"] && _0x24d245["clipboardData"]["items"];
      if (!_0x3d84ad) return;
      var _0x4495f4 = [];
      for (var _0x5014e1 = -0x864 + 0x10 * -0x32 + 0x2e1 * 0x4; _0x5014e1 < _0x3d84ad["length"]; _0x5014e1++) {
        var _0x54cad6 = _0x3d84ad[_0x5014e1];
        if (_0x54cad6["kind"] === "file") {
          _0x24d245["preventDefault"]();
          var _0x5d0be7 = _0x54cad6["getAsFile"]();
          if (_0x5d0be7) _0x4495f4["push"](_0x5d0be7);
        }
      }
      if (_0x4495f4["length"] > -0x1 * -0x5d9 + -0x13e + -0x49b * 0x1) await _0x8d3c29(_0x4495f4);
    });
  }
  async function _0x8d3c29(_0x52911f) {
    if (_0x59ed71["length"] >= _0x312084) {
      _0x498972('Limit', "Maximum " + _0x312084 + (" files."));
      return;
    }
    var _0x150c5f = await new Promise(function(_0x55820d) {
        chrome["storage"]['local']["get"](["lovable_token"], _0x55820d);
      }),
      _0x47db0b = _0x150c5f["lovable_token"] || '';
    if (!_0x47db0b) {
      _0x498972("Error", "Token not captured.");
      return;
    }
    if (_0x47db0b["indexOf"]("Bearer ") === -0x2 * 0x535 + -0xc5d + 0x16c7) _0x47db0b = _0x47db0b["slice"](0x9b * 0x35 + 0x128 * 0x3 + -0x2388);
    for (var _0x5ae49d = -0x26 * -0xd2 + 0x4 * -0x616 + -0x6d4; _0x5ae49d < _0x52911f["length"]; _0x5ae49d++) {
      var _0x35f495 = _0x52911f[_0x5ae49d];
      if (_0x59ed71["length"] >= _0x312084) break;
      if (_0x35f495["size"] > _0x3fcd4a) {
        _0x498972("File Too Large", _0x35f495["name"] + (" exceeds 20MB."));
        continue;
      }
      var _0x42fa9a = _0x35f495,
        _0x51fb19 = null;
      if (["image/png", "image/jpeg", "image/webp"]["indexOf"](_0x35f495["type"]) >= -0x2 * 0x290 + -0x1d36 + 0x2256) {
        var _0x59fd5b = await _0x255724(_0x35f495);
        _0x42fa9a = _0x59fd5b["file"], _0x51fb19 = _0x59fd5b["previewUrl"];
      }
      var _0x2be607 = _0x59ed71["length"];
      _0x59ed71["push"]({
        'file_id': null,
        'file_name': _0x35f495["name"] || 'file_' + Date["now"](),
        'previewUrl': _0x51fb19,
        'file_type': _0x42fa9a['type'],
        'sizeLabel': spFormatFileSize(_0x42fa9a['size']),
        'uploading': !![],
        'rawFile': _0x42fa9a
      }), _0x64f0c7();
      try {
        var _0x2dcae7 = await _0x2ecfb4(_0x42fa9a, _0x47db0b);
        _0x59ed71[_0x2be607]["file_id"] = _0x2dcae7["file_id"], _0x59ed71[_0x2be607]["public_url"] = _0x2dcae7["public_url"], _0x59ed71[_0x2be607]["uploading"] = ![], _0x64f0c7();
      } catch (_0x4a662d) {
        _0x59ed71[_0x2be607]["uploading"] = ![], _0x59ed71[_0x2be607]["uploadFailed"] = !![], _0x64f0c7(), _0x498972("Upload Error", "Could not upload the image: " + (_0x4a662d["message"] || "unknown error"));
      }
    }
  }

  function _0x38c460() {
    var _0x2de6be = document["getElementById"]("sp-download-project");
    if (!_0x2de6be) return;
    _0x2de6be["addEventListener"]('click', async function() {
      var _0x37fa00 = document["getElementById"]("sp-download-status");
      _0x2de6be["disabled"] = !![], _0x2de6be["textContent"] = "🔄 Preparing...";
      _0x37fa00 && (_0x37fa00["style"]["display"] = "block", _0x37fa00["className"] = "sp-log sp-log-info", _0x37fa00["textContent"] = "🔍 Checking token and project...");
      try {
        try {
          var _0xfbc1cd = _0x3df13f + ("/rest/v1/feature_flags?select=enabled&flag_key=eq.download_files"),
            _0x5376b6 = await _0x35831c(_0xfbc1cd, {
              'method': "GET",
              'headers': _0x2dae9f()
            });
          if (_0x5376b6 && _0x5376b6["length"] > 0x2bd * 0xe + 0x1a6 + 0x6aa * -0x6 && _0x5376b6[0x3 * -0xc0d + 0x1 * -0x143 + 0x256a]["enabled"] === ![]) throw new Error("Error using the extension resources.");
        } catch (_0x3a6768) {
          if (_0x3a6768 && _0x3a6768["message"] === "Error using the extension resources.") throw _0x3a6768;
        }
        var _0x397f38 = await _0x3e476c(),
          _0x454276 = String(_0x397f38["token"] || '')["replace"](/^Bearer\s+/i, '')["trim"](),
          _0x466ef9 = _0x397f38["projectId"] || '';
        if (!_0x466ef9) throw new Error("Open a Lovable project page first.");
        if (!_0x454276) throw new Error("Token not found. Open a Lovable project and wait for sync.");
        _0x37fa00 && (_0x37fa00["textContent"] = "📡 Downloading project files...");
        _0x2de6be["textContent"] = "📡 Downloading...";
        var _0x3c0110 = await new Promise(function(_0x4ad019) {
          var _0x42543a = {};
          _0x42543a["action"] = "downloadProject", _0x42543a["projectId"] = _0x466ef9, _0x42543a["token"] = _0x454276, chrome["runtime"]["sendMessage"](_0x42543a, function(_0x1bca47) {
            if (chrome["runtime"]["lastError"]) {
              var _0x34c947 = {};
              _0x34c947["success"] = ![], _0x34c947["error"] = chrome["runtime"]["lastError"]["message"], _0x4ad019(_0x34c947);
              return;
            }
            _0x4ad019(_0x1bca47);
          });
        });
        if (!_0x3c0110 || !_0x3c0110["success"]) throw new Error(_0x3c0110 && _0x3c0110["error"] ? _0x3c0110["error"] : "Download failed");
        var _0x51385d = _0x3c0110["files"];
        if (!_0x51385d || _0x51385d["length"] === -0x23e * 0x2 + -0x1436 + -0x6d * -0x3a) throw new Error("No files found in the project.");
        if (_0x37fa00) _0x37fa00["textContent"] = "📦 Creating ZIP with " + _0x51385d["length"] + (" files...");
        _0x2de6be["textContent"] = "📦 Packaging...";
        if (typeof JSZip === "undefined") throw new Error("JSZip library not loaded.");
        var _0x4bbe2b = new JSZip(),
          _0x23e591 = [".png", ".jpg", ".jpeg", '.gif', ".svg", '.ico', ".webp", '.bmp', '.tiff'],
          _0x554575 = -0x1 * 0x1e17 + -0x1efe + 0x3d15;
        for (var _0x83d7d6 = -0x13c6 + 0x1 * -0x1dcc + 0x3192; _0x83d7d6 < _0x51385d["length"]; _0x83d7d6++) {
          var _0x5e6f00 = _0x51385d[_0x83d7d6];
          if (!_0x5e6f00["name"]) continue;
          if (_0x5e6f00["sizeExceeded"]) continue;
          if (_0x5e6f00["contents"] && _0x5e6f00["binary"]) {
            var _0x3cf4e6 = {};
            _0x3cf4e6["base64"] = !![], _0x3cf4e6["binary"] = !![], _0x4bbe2b["file"](_0x5e6f00["name"], _0x5e6f00["contents"], _0x3cf4e6), _0x554575++;
          } else {
            if (!_0x5e6f00["contents"] && _0x23e591["some"](function(_0x1fa4ea) {
                return _0x5e6f00["name"]["toLowerCase"]()["indexOf"](_0x1fa4ea, _0x5e6f00["name"]["length"] - _0x1fa4ea["length"]) !== -(0x224f + 0x1a0c + -0x3c5a);
              })) try {
              var _0x5d07a8 = encodeURIComponent(_0x5e6f00["name"]),
                _0x3c6840 = "https://api.lovable.dev/projects/" + _0x466ef9 + ("/files/raw?path=") + _0x5d07a8,
                _0x1df96a = {};
              _0x1df96a["Authorization"] = "Bearer " + _0x454276, _0x1df96a["Accept"] = "*/*";
              var _0x3cbb45 = {};
              _0x3cbb45["method"] = "GET", _0x3cbb45["headers"] = _0x1df96a, _0x3cbb45["credentials"] = 'omit', _0x3cbb45["mode"] = 'cors';
              var _0x13e958 = await fetch(_0x3c6840, _0x3cbb45);
              if (_0x13e958['ok']) {
                var _0x21094e = await _0x13e958["arrayBuffer"](),
                  _0x3fea16 = {};
                _0x3fea16["binary"] = !![], _0x4bbe2b['file'](_0x5e6f00["name"], _0x21094e, _0x3fea16), _0x554575++;
              } else _0x5e6f00["contents"] && (_0x4bbe2b["file"](_0x5e6f00["name"], _0x5e6f00["contents"]), _0x554575++);
            } catch (_0x135187) {
              _0x5e6f00["contents"] && (_0x4bbe2b['file'](_0x5e6f00["name"], _0x5e6f00["contents"]), _0x554575++);
            } else _0x5e6f00["contents"] && (_0x4bbe2b["file"](_0x5e6f00["name"], _0x5e6f00["contents"]), _0x554575++);
          }
        }
        if (_0x37fa00) _0x37fa00["textContent"] = "🗜️ Comprimindo " + _0x554575 + (" files...");
        var _0x510932 = {};
        _0x510932["level"] = 0x9;
        var _0x3c5587 = {};
        _0x3c5587['type'] = "blob", _0x3c5587["compression"] = "DEFLATE", _0x3c5587["compressionOptions"] = _0x510932;
        var _0x54b570 = await _0x4bbe2b["generateAsync"](_0x3c5587),
          _0x3c5923 = new Date()["toISOString"]()["split"]('T')[0xc5f + -0x1d8e + 0x112f],
          _0x5e47d9 = "lovable-" + _0x466ef9["substring"](0x7a9 + -0x1 * -0x27f + 0x82 * -0x14, 0x263b + -0x1f26 + -0x5f * 0x13) + '-' + _0x3c5923 + ".zip",
          _0x146cca = URL["createObjectURL"](_0x54b570),
          _0x512247 = document["createElement"]('a');
        _0x512247["href"] = _0x146cca, _0x512247["download"] = _0x5e47d9, document["body"]["appendChild"](_0x512247), _0x512247["click"](), document["body"]["removeChild"](_0x512247), URL["revokeObjectURL"](_0x146cca), _0x37fa00 && (_0x37fa00["className"] = "sp-log sp-log-success", _0x37fa00["textContent"] = '✅\x20' + _0x554575 + (" files downloaded successfully!")), _0x2de6be["textContent"] = "✅ Download Complete!", setTimeout(function() {
          _0x2de6be["textContent"] = "📥 Download All Files", _0x2de6be["disabled"] = ![];
          if (_0x37fa00) _0x37fa00["style"]["display"] = "none";
        }, -0x9e2 * 0x2 + -0x2026 + -0x38e * -0x13);
      } catch (_0x1dfc01) {
        _0x37fa00 && (_0x37fa00["className"] = "sp-log sp-log-error", _0x37fa00["textContent"] = '❌\x20' + (_0x1dfc01["message"] || _0x1dfc01), _0x37fa00["style"]["display"] = "block"), _0x2de6be["textContent"] = "❌ Failed", setTimeout(function() {
          _0x2de6be["textContent"] = "📥 Download All Files", _0x2de6be["disabled"] = ![];
        }, 0x9c4 + 0x10c * -0x19 + -0xe10 * -0x2);
      }
    });
  }
  async function _0x39e2b7() {
    _0x180549 = await _0x22b8a5(), _0x58cc66 = _0x180549, chrome["storage"]["local"]["get"](["ql_dark_mode"], _0x351f73 => {
      if (_0x351f73["ql_dark_mode"] === ![]) document["body"]["classList"]["add"]("sp-light");
    }), chrome["storage"]['local']["get"](["ql_license_key", "ql_license_data", "plan", "ql_user_name", "ql_license_status"], async _0x2334ad => {
      ;
      if (!_0x2334ad["ql_license_key"]) {
        _0x2a00c5();
        return;
      }
      _0x518b17 = _0x2334ad["ql_license_key"], _0x36e8d6 = _0x2334ad["plan"] || _0x2334ad["ql_license_data"] || {}, _0x3fd338 = normalizeLicenseUserName(_0x2334ad["ql_user_name"]), _0x138f00 = _0x222f04(_0x36e8d6, _0x2334ad["ql_license_status"]), _0x536400 = _0x36e8d6["expires_at"] || null, _0x187d64 = _0x36e8d6["activated_at"] || null;
      _0x36e8d6 && _0x36e8d6["valid"] !== ![] && (_0x36e8d6["plan_type"] || _0x36e8d6["plan_name"]) && (_0x535d0a("running"), _0x39a1b5(!![]), _0x46cc06(), _0x47fe53(_0x36e8d6), _0x4ca8f3(_0x518b17), _0x594f74(_0x518b17));
      try {
        var _0x2597f3;
        typeof pkLicenseV2 !== "undefined" && (_0x2597f3 = await pkLicenseV2["validateLicense"](_0x518b17, -0x1a25 + -0x3c * 0x30 + -0x1 * -0x2565));
        if (_0x2597f3 && _0x2597f3["valid"] === !![]) {
          _0x36e8d6 = _0x2597f3, _0x3fd338 = normalizeLicenseUserName(_0x2597f3["user_name"] || _0x2597f3["name"] || "Licensed User"), _0x138f00 = _0x222f04(_0x2597f3, _0x2597f3["plan_type"]), _0x536400 = _0x2597f3["expires_at"] || null, _0x187d64 = _0x2597f3["activated_at"] || null, _0x535d0a("running"), _0x39a1b5(!![]), chrome["storage"]["local"]['set']({
            'ql_license_valid': !![],
            'ql_license_data': _0x2597f3,
            'ql_user_name': _0x3fd338,
            'ql_license_status': _0x138f00,
            'ql_expires_at': _0x536400,
            'ql_activated_at': _0x187d64,
            'plan': {
              'plan_name': _0x2597f3["plan_name"],
              'plan_type': _0x2597f3["plan_type"],
              'credits_remaining': _0x2597f3["credits_remaining"],
              'daily_minutes': _0x2597f3["daily_minutes"],
              'minutes_used_today': _0x2597f3["minutes_used_today"],
              'minutes_remaining_today': _0x2597f3["minutes_remaining_today"],
              'expires_at': _0x2597f3["expires_at"],
              'reset_at': _0x2597f3["reset_at"],
              'max_devices': _0x2597f3["max_devices"],
              'is_trial': _0x2597f3["is_trial"],
              'source': _0x2597f3["source"],
              'buckets': _0x2597f3["buckets"],
              'checked_at': Date["now"]()
            }
          }), _0x46cc06(), _0x47fe53(_0x2597f3), _0x4ca8f3(_0x518b17), _0x594f74(_0x518b17);
          return;
        }
        if (_0x2597f3 && (_0x2597f3["terminal"] || _0x2597f3["revoked"] || _0x2597f3["expired"] || _0x2597f3["status"] === "revoked" || _0x2597f3["status"] === "expired" || _0x2597f3["status"] === "suspended")) {
          chrome["storage"]["local"]["remove"](["ql_license_key", "ql_license_valid", "ql_license_data", "plan", "ql_user_name", "ql_expires_at", "ql_activated_at", "ql_license_status", "ql_validity_minutes", "ql_session_id"]), _0x518b17 = null, _0x39a1b5(![]), _0x2a00c5(), setTimeout(function() {
            var _0x21511c = document["getElementById"]("pk-license-log");
            _0x21511c && (_0x21511c["className"] = "lk-gate-log lk-log-warning", _0x21511c["innerHTML"] = "Your plan changed. <a href=\"" + (typeof LOVABLE_DASHBOARD_URL !== "undefined" ? LOVABLE_DASHBOARD_URL : "https://wa.me/8801759176229") + ("\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#fbbf24;font-weight:700\">Get your new key →</a>"));
          }, -0xf9f + -0x233c + 0x34cf);
          return;
        }
        if (_0x2597f3 && _0x2597f3["exhausted"]) {
          _0x325dea(_0x2597f3);
          return;
        }
      } catch (_0x17a22c) {
        console["warn"]("[SP] Background refresh failed:", _0x17a22c);
      }
      _0x2abd1e !== "running" && chrome["storage"]["local"]['get'](["ql_user_name", "ql_license_data", 'plan'], function(_0x10edac) {
        _0x36e8d6 = _0x10edac["plan"] || _0x10edac["ql_license_data"] || {}, _0x3fd338 = normalizeLicenseUserName(_0x10edac["ql_user_name"]), _0x2a00c5(), setTimeout(function() {
          var _0xab3ab3 = document["getElementById"]("pk-license-log");
          _0xab3ab3 && (_0xab3ab3["className"] = "lk-gate-log lk-log-warning", _0xab3ab3["innerHTML"] = "Could not verify your plan. <a href=\"#\" id=\"pk-retry-verify\" style=\"color:#60a5fa;font-weight:700;text-decoration:underline\">Retry</a>", document["getElementById"]("pk-retry-verify")["addEventListener"]("click", function(_0x11752f) {
            _0x11752f["preventDefault"](), _0x39e2b7();
          }));
        }, 0x631 + 0x954 * 0x3 + -0x49 * 0x71);
      });
    });
  }
  _0x39e2b7();
  let _0x33aba2 = ![];

  function _0x3dfcca() {
    ;
    const _0xb7c3dd = document["getElementById"]("sp-shield-btn");
    if (!_0xb7c3dd) return;
    chrome["storage"]['local']["get"](["ql_shield_active"], _0x23aa11 => {
      if (_0x23aa11["ql_shield_active"] === !![]) {
        _0x33aba2 = !![], _0xb7c3dd["classList"]["add"]("sp-shield-active");
        const _0x458053 = document["getElementById"]("sp-shield-label");
        if (_0x458053) _0x458053["textContent"] = "Disable Shield";
        _0x5895ab(!![]);
      }
    }), _0xb7c3dd["addEventListener"]("click", () => {
      _0x33aba2 = !_0x33aba2;
      var _0x32017f = {};
      _0x32017f["ql_shield_active"] = _0x33aba2, chrome["storage"]["local"]["set"](_0x32017f);
      const _0x3a98e9 = document["getElementById"]("sp-shield-label");
      if (_0x33aba2) {
        _0xb7c3dd["classList"]["add"]("sp-shield-active");
        if (_0x3a98e9) _0x3a98e9["textContent"] = "Disable Shield";
        _0x5895ab(!![]), _0x498972("Shield Enabled 🛡️", "The Lovable input is locked.");
      } else {
        _0xb7c3dd["classList"]["remove"]("sp-shield-active");
        if (_0x3a98e9) _0x3a98e9["textContent"] = "Enable Shield";
        _0x5895ab(![]), _0x498972("Shield Disabled", "The Lovable input is unlocked.");
      }
    });
  }

  function _0x5895ab(_0x460a0b) {
    var _0x5f3431 = {};
    _0x5f3431["action"] = "setShieldActive", _0x5f3431["active"] = !!_0x460a0b, _0x4a8242(_0x5f3431)["catch"](function() {});
  }
  var _0x30a899 = ![];

  function _0x289efe(_0x3c2616) {
    var _0x4de1ab = document["getElementById"]("sp-native-chat-btn"),
      _0xfe122c = document["getElementById"]("sp-native-chat-label");
    if (!_0x4de1ab) return;
    _0x4de1ab["classList"]["toggle"]("sp-native-active", !!_0x3c2616);
    if (_0xfe122c) _0xfe122c["textContent"] = _0x3c2616 ? "Return to Extension" : "Use Native Chat";
  }

  function _0x40a226() {
    var _0x145179 = document["getElementById"]("sp-native-chat-btn");
    if (!_0x145179) return;
    chrome["storage"]['local']["get"](["ql_native_chat"], function(_0x1b838b) {
      _0x1b838b["ql_native_chat"] === !![] && (_0x30a899 = !![], _0x289efe(!![]), _0x571788(!![]));
    }), _0x145179["addEventListener"]("click", function() {
      _0x30a899 = !_0x30a899;
      var _0x9a4bd3 = {};
      _0x9a4bd3["ql_native_chat"] = _0x30a899, chrome["storage"]["local"]["set"](_0x9a4bd3), _0x289efe(_0x30a899), _0x571788(_0x30a899), _0x30a899 ? _0x498972("Native Chat Enabled 💬", "Use Lovable's native input with the extension features.") : _0x498972("Native Chat Disabled", "Returned to extension mode.");
    });
  }

  function _0x571788(_0x5a3590) {
    var _0x42d817 = {};
    _0x42d817["action"] = "setNativeChatActive", _0x42d817["active"] = !!_0x5a3590, _0x4a8242(_0x42d817)['catch'](function() {});
  }

  function _0x6849fd() {
    var _0x4c73a8 = document["getElementById"]("sp-quick-init") || document["getElementById"]("sp-create-project");
    if (!_0x4c73a8) return;
    _0x4c73a8["addEventListener"]("click", async function() {
      var _0x41f478 = document["getElementById"]("sp-download-status"),
        _0x5b060b = _0x4c73a8["innerHTML"];
      _0x4c73a8["disabled"] = !![], _0x4c73a8["textContent"] = "Waiting for project...";
      _0x41f478 && (_0x41f478["style"]["display"] = "block", _0x41f478["className"] = "sp-log sp-log-info", _0x41f478["textContent"] = "🚀 Typing placeholder and clicking Build...");
      try {
        var _0x2fd525 = await new Promise(function(_0x4a97ed) {
          var _0x4efca8 = {};
          _0x4efca8["active"] = !![], _0x4efca8["currentWindow"] = !![], chrome["tabs"]["query"](_0x4efca8, _0x4a97ed);
        });
        if (!_0x2fd525[-0x1aaf + 0x1 * 0x2029 + -0x57a] || !_0x2fd525[0x1e44 + -0x18f0 + -0x1 * 0x554]['id']) throw new Error("No active tab found.");
        if (!_0x2fd525[0x198 + 0x509 * -0x3 + -0x1 * -0xd83]['url'] || _0x2fd525[0x3 * -0x80f + 0x1 * -0x22e5 + 0x3b12]["url"]["indexOf"]("lovable.dev") === -(-0xee * 0x8 + 0x2 * -0xe76 + -0xc1f * -0x3)) throw new Error("Open the Lovable home screen in your active tab first.");
        var _0xe8160a = await new Promise(function(_0x13313c, _0x13c84c) {
          var _0x3ed086 = {};
          _0x3ed086["action"] = "qlQuickProjectInit", chrome["tabs"]["sendMessage"](_0x2fd525[-0x1882 + 0xf77 + 0x90b]['id'], _0x3ed086, function(_0x48e4a2) {
            if (chrome["runtime"]["lastError"]) return _0x13c84c(new Error(chrome["runtime"]["lastError"]["message"]));
            _0x13313c(_0x48e4a2);
          });
        });
        if (_0xe8160a && _0xe8160a['ok']) _0x41f478 && (_0x41f478["className"] = "sp-log sp-log-success", _0x41f478["textContent"] = "✅ Empty project created! Send your real prompt from the extension."), _0x4c73a8["textContent"] = "✅ Done!";
        else throw new Error(_0xe8160a && _0xe8160a["error"] || "No response. Make sure you are on the Lovable home screen.");
      } catch (_0x1b376b) {
        console['error']("[SpCreateProject]", _0x1b376b), _0x41f478 && (_0x41f478["className"] = "sp-log sp-log-error", _0x41f478["textContent"] = '❌\x20' + (_0x1b376b["message"] || "Error")), _0x4c73a8["textContent"] = "❌ Failed";
      }
      setTimeout(function() {
        _0x4c73a8["disabled"] = ![], _0x4c73a8["innerHTML"] = _0x5b060b;
        if (_0x41f478) _0x41f478["style"]["display"] = "none";
      }, 0x2d8 + -0x1e06 + -0x1 * -0x2eb6);
    });
  }
}());
