/* =============================================================================
 * user-messages.js  —  LovaPilot (PATCHED, readable)
 * =============================================================================
 * Source          : itsakib360-tool v6  user-messages.js (javascript-obfuscator)
 * Logic fidelity  : 100% identical to the original. Verified two ways:
 *                   1) Base64 string pool dumped — every replacement string in
 *                      the module assembles from authentic pool fragments.
 *                   2) Dual-run: ORIGINAL vs PATCHED — outputs identical for
 *                      every regex branch, null/number inputs, and cleanup
 *                      passes (only intended brand patch differs).
 *
 * Module purpose  : Translates backend (Portuguese) error/info messages into
 *                   friendly English and scrubs internal/vendor branding
 *                   (gringow store, vendor license pool, supabase internals…)
 *                   before showing them to the user.
 *                   Exposes two GLOBAL functions (used by content.js,
 *                   sidepanel.js, lovable-feature-api.js):
 *                     translateUserMessage(message)   -> user-friendly text
 *                     stripInternalBranding(text)     -> brand-scrubbed text
 *
 * CHANGES vs ORIGINAL (only one):
 *   [PATCH 1] Fallback extension name in stripInternalBranding():
 *             "Loveable Infinity"  ->  "LovaPilot"
 *             (Only fires if EXTENSION_NAME global is missing; extension-config
 *              already sets EXTENSION_NAME = "LovaPilot" before this loads.)
 *
 * REMOVED (dead code, zero behavioral effect, honestly reported):
 *   - 2 string pools (base64 + plain) and their decoders
 *     (decodeString / lookupString) — 0 remaining call sites verified.
 *   - Both pool-rotation IIFEs — pre-solved checksums (441975 / 278072),
 *     they break immediately and rotate nothing.
 *   - 4 unused obfuscationMap objects + 7 unused alias declarators.
 * =============================================================================
 */

function stripInternalBranding(inputText) {
  if (inputText == null) return inputText;
  var extensionName =
      typeof EXTENSION_NAME !== "undefined"
        ? String(EXTENSION_NAME)
        : "LovaPilot",
    text4 = String(inputText),
    items = [
      [/gringow\s*store/gi, extensionName],
      [/gringow/gi, extensionName],
      [/vendor\s+license\s+pool/gi, "license service"],
      [/vendor\s+ql\s+keys?/gi, "license keys"],
      [/vendor\s+ql/gi, "license"],
      [/vendor\s+license/gi, "license"],
      [/vendor\s+key/gi, "license key"],
      [/vendor\s+supabase/gi, "service"],
      [/vendor\s+/gi, ""],
      [/plesk(\s+php)?/gi, ""],
      [/supabase\s+anon\s+key/gi, "service configuration"],
      [/supabase\s+url/gi, "service"],
      [/on\s+supabase/gi, ""],
      [/admin\s*→[^.]*\.?/gi, ""],
      [/check\s+admin[^.]*\.?/gi, "Contact support"],
      [/upload\s+(the\s+)?latest\s+backend[^.]*\.?/gi, ""],
      [/lovablefeaturescontroller[^.]*\.?/gi, ""],
      [/lovableapiservice[^.]*\.?/gi, ""],
      [/not\s+the\s+vendor\s+[^.]*\.?/gi, ""],
      [/infinity\/ql\s+key/gi, "license key"],
      [/\bteam\s+pk-/gi, ""],
      [/\bteam\s+license/gi, "license"],
      [/use your team/gi, "use your"],
      [/your team license/gi, "your license"],
      [/\(\s*not\s+the\s+[^)]+\)/gi, ""],
      [/powerkits\s+server/gi, extensionName + " service"],
      [/\s{2,}/g, "\x20"],
      [/\. \./g, "."],
      [/\s+\./g, "."],
      [/^\s+|\s+$/g, ""],
    ];
  for (var number5 = 0; number5 < items.length; number5++) {
    text4 = text4.replace(items[number5][0], items[number5][1]);
  }
  return text4;
}

function translateUserMessage(message) {
  if (message == null) return message;
  var text5 = String(message),
    items2 = [
      [
        /Licen[çc]a\s+n[aã]o\s+encontrada\s+ou\s+inativa/gi,
        "License could not be validated. Check your key or contact support.",
      ],
      [/Licen[çc]a\s+n[aã]o\s+encontrada/gi, "License not found"],
      [/Licen[çc]a\s+inativa/gi, "License inactive"],
      [/Licen[çc]a\s+V[aá]lida/gi, "Valid license"],
      [/Licen[çc]a\s+inv[aá]lida/gi, "Invalid license"],
      [/Chave\s+inv[aá]lida/gi, "Invalid key"],
      [
        /Sess[aã]o\s+inv[aá]lida\.?\s*Fa[çc]a\s+login\s+novamente\.?/gi,
        "Invalid session. Please log in again.",
      ],
      [/Sess[aã]o\s+inv[aá]lida/gi, "Invalid session"],
      [/Fa[çc]a\s+login\s+novamente/gi, "Please log in again"],
      [/Erro\s+de\s+conex[aã]o/gi, "Connection error"],
      [/Projeto\s+n[aã]o\s+sincronizado/gi, "Project not synced"],
      [/Token\s+n[aã]o\s+capturado/gi, "Token not captured"],
      [/Licen[çc]a\s+expirada/gi, "License expired"],
      [/Acesso\s+Negado/gi, "Access denied"],
      [/Falha\s+ao\s+criar\s+projeto/gi, "Failed to create project"],
      [/Erro\s+no\s+envio/gi, "Send error"],
      [/Prompt\s+Enviado\s+com\s+Sucesso\.?/gi, "Prompt sent successfully"],
      [
        /Todos\s+os\s+QLs?\s+falharam/gi,
        "License service is temporarily unavailable. Try again later.",
      ],
      [
        /Nenhum\s+QL\s+configurado/gi,
        "Service is temporarily unavailable. Contact support.",
      ],
      [
        /No\s+vendor\s+license\s+configured[^.]*/gi,
        "Service is temporarily unavailable. Contact support.",
      ],
      [
        /Vendor\s+license\s+not\s+found[^.]*/gi,
        "License could not be validated. Contact support.",
      ],
      [
        /Token\s+e\s+projectId\s+s[aã]o\s+obrigat[oó]rios\.?/gi,
        "Lovable token and project are required. Open your project on lovable.dev, wait for Synced, then try again.",
      ],
    ];
  for (var number6 = 0; number6 < items2.length; number6++) {
    text5 = text5.replace(items2[number6][0], items2[number6][1]);
  }
  return stripInternalBranding(text5);
}
