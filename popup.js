/**
 * LovaPilot — popup.js (clean readable edition, 1:1 with original obfuscated)
 * Original: single 27,433-char obfuscated line, fully decoded & rebuilt.
 * Change vs original: validate URL only (dead supabase -> Vercel).
 * Behavior mirrors original EXACTLY (verified against decoder-resolved bodies):
 *  - metric li = <span class="m-label">LABEL</span><span class="m-val">VALUE</span>
 *  - device_id = storage['pk_device_id'] || ''  (NO minting — original behavior)
 *  - body = {key, device_id, credits:0}, key trimmed (not uppercased)
 *  - status pill classes 'ok'/'err', storage keys ql_license_data + plan
 *  - silent revalidate on open, storage.onChanged live refresh, credits merge
 */
(function () {
  "use strict";

  // ---- config (URL change only) -------------------------------------------
  var VALIDATE_URL =
    (typeof window !== "undefined" && window.LOVABLE_VALIDATE_URL) ||
    "https://hridoy14-dough-sync-api.vercel.app/api/public/validate-license";
  var SUPPORT_URL = "https://wa.me/8801759176229";

  // ---- DOM refs (exact original ids & order) --------------------------------
  var keyInput = document.getElementById("licenseKey");
  var activateBtn = document.getElementById("activateBtn");
  var statusPill = document.getElementById("statusPill");
  var statusText = document.getElementById("statusText");
  var hintText = document.getElementById("hintText");
  var planCard = document.getElementById("planCard");
  var planName = document.getElementById("planName");
  var planTypeLabel = document.getElementById("planTypeLabel");
  var planBadge = document.getElementById("planBadge");
  var metricsList = document.getElementById("metricsList");
  var barWrap = document.getElementById("barWrap");
  var barFill = document.getElementById("barFill");
  var planBarLeft = document.getElementById("planBarLeft");
  var planBarRight = document.getElementById("planBarRight");
  var expiryRow = document.getElementById("expiryRow");
  var expiryText = document.getElementById("expiryText");

  // ---- _0x5bbd62 : status text + 'status-pill ok'|'err' ----------------------
  function setStatus(text, pillClass) {
    if (statusText) statusText.textContent = text;
    if (statusPill) statusPill.className = "status-pill" + (pillClass ? " " + pillClass : "");
  }

  // ---- _0x29486c : "5 Aug 2026" ---------------------------------------------
  function formatDate(value) {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return value;
    }
  }

  // ---- _0x2cf05d : ceil days until date (min 0) ------------------------------
  function daysUntil(dateValue) {
    if (!dateValue) return null;
    var diff = new Date(dateValue).getTime() - Date.now();
    return diff > 0 ? Math.ceil(diff / 86400000) : 0;
  }

  // ---- _0x596e68 : <li> LABEL first, then VALUE (exact original innerHTML) ---
  function createMetricItem(label, value) {
    var li = document.createElement("li");
    li.innerHTML =
      '<span class="m-label">' + label + '</span><span class="m-val">' + value + "</span>";
    return li;
  }

  // ---- _0x291db7 : "Expires: 5 Aug 2026  (2d left)" / "(today!)" -------------
  function renderExpiry(expiresAt) {
    if (!expiresAt) {
      if (expiryRow) expiryRow.style.display = "none";
      return;
    }
    var left = daysUntil(expiresAt);
    var text = "Expires: " + formatDate(expiresAt);
    if (left === 0) text += "  (today!)";
    else if (left !== null && left <= 3) text += "  (" + left + "d left)";
    if (expiryText) expiryText.textContent = text;
    if (expiryRow) expiryRow.style.display = "flex";
  }

  // ---- _0x28e809 : render plan card ------------------------------------------
  function renderPlan(planData) {
    if (!planData) {
      if (planCard) planCard.style.display = "none";
      return;
    }
    var planType = (planData.plan_type || "").toLowerCase();
    var displayName =
      planData.plan_name ||
      (planType === "unlimited" ? "Unlimited" : planType === "trial" ? "Trial" : "Pro");

    if (planName) planName.textContent = displayName;
    if (planTypeLabel) planTypeLabel.textContent = planType || "";
    if (planBadge) planBadge.textContent = planType.toUpperCase() || "ACTIVE";
    if (planCard) planCard.style.display = "";
    if (metricsList) metricsList.innerHTML = "";

    if (planType === "unlimited") {
      var daysLft = daysUntil(planData.expires_at);
      if (daysLft !== null && metricsList) metricsList.appendChild(createMetricItem("Days Remaining", daysLft));
      if (planData.max_devices && metricsList)
        metricsList.appendChild(createMetricItem("Max Devices", planData.max_devices));

      var durDays = planData.duration_days || 30;
      var pct = daysLft !== null ? Math.min(100, Math.round((daysLft / durDays) * 100)) : 0;
      if (barFill) barFill.style.width = pct + "%";
      if (planBarLeft) planBarLeft.textContent = daysLft + " days left";
      if (planBarRight) planBarRight.textContent = "of " + durDays + " days";
      if (barWrap) barWrap.style.display = "flex";
    } else if (planType === "credits") {
      if (metricsList) {
        if (planData.credits_total != null)
          metricsList.appendChild(createMetricItem("Credits Total", planData.credits_total));
        if (planData.credits_used != null)
          metricsList.appendChild(createMetricItem("Credits Used", planData.credits_used));
        if (planData.credits_remaining != null)
          metricsList.appendChild(createMetricItem("Credits Remaining", planData.credits_remaining));
      }
      var total = planData.credits_total || 0;
      var remain = planData.credits_remaining || 0;
      var pct2 = total > 0 ? Math.min(100, Math.round((remain / total) * 100)) : 0;
      if (barFill) barFill.style.width = pct2 + "%";
      if (planBarLeft) planBarLeft.textContent = remain + " credits left";
      if (planBarRight) planBarRight.textContent = "of " + total;
      if (barWrap) barWrap.style.display = "flex";
    } else if (planType === "trial") {
      if (metricsList) {
        if (planData.daily_minutes != null)
          metricsList.appendChild(createMetricItem("Minutes Daily", planData.daily_minutes));
        if (planData.minutes_used_today != null)
          metricsList.appendChild(createMetricItem("Minutes Used Today", planData.minutes_used_today));
        if (planData.minutes_remaining_today != null)
          metricsList.appendChild(createMetricItem("Minutes Left Today", planData.minutes_remaining_today));
      }
      var dm = planData.daily_minutes || 0;
      var mrt = planData.minutes_remaining_today || 0;
      var pct3 = dm > 0 ? Math.min(100, Math.round((mrt / dm) * 100)) : 0;
      if (barFill) barFill.style.width = pct3 + "%";
      if (planBarLeft) planBarLeft.textContent = mrt + " min left";
      if (planBarRight) planBarRight.textContent = "of " + dm + " min";
      if (barWrap) barWrap.style.display = "flex";
    } else {
      if (barWrap) barWrap.style.display = "none";
    }
  }

  // ---- _0x46db24 : validate + store + render (silent = reopen/silent path) ---
  function validateKey(key, silent) {
    if (!silent) {
      activateBtn.disabled = true;
      activateBtn.textContent = "Checking…";
      setStatus("Verifying…", "");
      if (hintText) hintText.textContent = "Verifying license…";
    }

    new Promise(function (resolve) {
      chrome.storage.local.get(["pk_device_id"], function (stored) {
        resolve((stored && stored.pk_device_id) || "");
      });
    }).then(function (deviceId) {
      return fetch(VALIDATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key, device_id: deviceId, credits: 0 }),
      })
        .then(function (res) {
          return res.json().catch(function () {
            return {};
          });
        })
        .then(function (data) {
          if (!data || data.valid === false || data.error) {
            var errMsg =
              (data && (data.error_display || data.message || data.error)) ||
              "Invalid or expired key";
            if (!silent) {
              setStatus("Invalid key", "err");
              if (hintText) hintText.textContent = errMsg;
              activateBtn.disabled = false;
              activateBtn.textContent = "Activate";
            } else {
              setStatus("Invalid key", "err");
              if (hintText) hintText.textContent = errMsg;
              chrome.storage.local.remove([
                "ql_license_key",
                "ql_license_valid",
                "ql_license_data",
                "plan",
                "ql_license_status",
              ]);
              if (planCard) planCard.style.display = "none";
              if (expiryRow) expiryRow.style.display = "none";
            }
            return;
          }

          var planData = {
            plan_name: data.plan_name,
            plan_type: data.plan_type,
            credits_remaining: data.credits_remaining,
            credits_total: data.credits_total,
            credits_used: data.credits_used,
            daily_minutes: data.daily_minutes,
            minutes_used_today: data.minutes_used_today,
            minutes_remaining_today: data.minutes_remaining_today,
            expires_at: data.expires_at,
            activated_at: data.activated_at,
            duration_days: data.duration_days,
            reset_at: data.reset_at,
            max_devices: data.max_devices,
            is_trial: data.is_trial,
            source: data.source,
            buckets: data.buckets,
            checked_at: Date.now(),
          };

          var patch = {};
          patch.ql_license_key = key;
          patch.ql_license_valid = true;
          patch.ql_license_data = planData;
          patch.ql_license_status = planData.plan_type || data.status || "active";
          patch.plan = planData;
          chrome.storage.local.set(patch);

          if (!silent) {
            setStatus("Active", "ok");
            if (hintText) hintText.textContent = "License activated successfully!";
          } else {
            setStatus("License is active", "ok");
          }
          renderPlan(planData);
          renderExpiry(planData.expires_at);

          if (!silent) {
            activateBtn.disabled = false;
            activateBtn.textContent = "Activate";
          }
        })
        .catch(function () {
          if (!silent) {
            setStatus("Error", "err");
            if (hintText) hintText.textContent = "Network error — check your connection";
            activateBtn.disabled = false;
            activateBtn.textContent = "Activate";
          }
        });
    });
  }

  // ---- _0x50bf78 : silent init (cache-first render, then silent revalidate) --
  function silentInit() {
    chrome.storage.local.get(
      ["ql_license_key", "ql_license_valid", "ql_license_data", "plan"],
      function (stored) {
        stored = stored || {};
        if (stored.ql_license_key && keyInput) keyInput.value = stored.ql_license_key;

        if (stored.ql_license_valid && stored.plan) {
          var planData = stored.plan;
          // credits merge (original logic)
          if (
            planData.plan_type === "credits" &&
            (!planData.credits_total || planData.credits_total <= planData.credits_remaining)
          ) {
            var licData = stored.ql_license_data;
            if (licData && licData.credits_total) {
              planData = Object.assign({}, planData, { credits_total: licData.credits_total });
            }
          }
          setStatus("Active", "ok");
          if (hintText) hintText.textContent = "License is active";
          renderPlan(planData);
          renderExpiry(planData.expires_at);
          if (stored.ql_license_key) validateKey(stored.ql_license_key, true);
        } else if (stored.ql_license_key) {
          setStatus("Verifying…", "");
          if (hintText) hintText.textContent = "Checking license status…";
          validateKey(stored.ql_license_key, true);
        } else {
          setStatus("Not activated", "");
        }
      }
    );
  }

  // ---- activate button click (original handler) -------------------------------
  activateBtn.addEventListener("click", function () {
    var key = (keyInput.value || "").trim();
    if (!key) {
      setStatus("Enter a key", "err");
      if (hintText) hintText.textContent = "Please enter your license key first.";
      return;
    }
    validateKey(key, false);
  });

  // ---- Enter key in input = click Activate (original behavior) ----------------
  keyInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") activateBtn.click();
  });

  // ---- storage.onChanged live refresh (original listener) ----------------------
  chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName !== "local") return;
    if (!(changes.plan || changes.ql_license_valid || changes.ql_license_data)) return;
    chrome.storage.local.get(["ql_license_valid", "plan", "ql_license_data"], function (stored) {
      if (stored.ql_license_valid && stored.plan) {
        var planData = stored.plan;
        if (
          planData.plan_type === "credits" &&
          (!planData.credits_total || planData.credits_total <= planData.credits_remaining)
        ) {
          var licData = stored.ql_license_data;
          if (licData && licData.credits_total) {
            planData = Object.assign({}, planData, { credits_total: licData.credits_total });
          }
        }
        renderPlan(planData);
        renderExpiry(planData.expires_at);
      }
    });
  });

  silentInit();

  window.SUPPORT_URL = SUPPORT_URL;
})();
