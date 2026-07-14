// =============================================
// hwFingerprint.js — Hardware Fingerprinting Module
// =============================================
// Extension: dough-sync-api
// Version: 5.0.0
//
// PURPOSE:
//   Generates a unique hardware fingerprint for each device.
//   Used for license binding (one license = one device).
//
// FINGERPRINT COMPONENTS:
//   1. Screen info (width, height, color depth, pixel ratio)
//   2. Navigator info (platform, cores, memory, touch, languages)
//   3. Timezone
//   4. WebGL renderer & vendor (GPU info)
//   5. Canvas fingerprint (2D rendering hash)
//   6. Audio fingerprint (offline audio context)
//   7. Font detection (installed fonts check)
//
// STORAGE:
//   chrome.storage.local.get(["ql_hw_fingerprint"])  — Load cached fingerprint
//   chrome.storage.local.set({ql_hw_fingerprint})    — Save generated fingerprint
//
// FALLBACK:
//   If fingerprint generation fails, uses crypto.randomUUID()
// =============================================

// =============================================
// GENERATE HARDWARE FINGERPRINT
// =============================================
// Collects all hardware/browser characteristics
// and returns a SHA-256 hash as the unique ID.
async function generateHardwareFingerprint() {
  const fingerprintComponents = [];

  // -------------------------------------------
  // 1. Screen Information
  // -------------------------------------------
  try {
    fingerprintComponents.push(
      "screen:" + screen.width + "x" + screen.height,
      "depth:" + screen.colorDepth,
      "pixelRatio:" + window.devicePixelRatio
    );
  } catch (error) {
    // Screen API not available
  }

  // -------------------------------------------
  // 2. Navigator / Browser Information
  // -------------------------------------------
  try {
    fingerprintComponents.push("platform:" + navigator.platform);
    fingerprintComponents.push("cores:" + (navigator.hardwareConcurrency || "unknown"));
    fingerprintComponents.push("memory:" + (navigator.deviceMemory || "unknown"));
    fingerprintComponents.push("maxTouchPoints:" + (navigator.maxTouchPoints || 0));
    fingerprintComponents.push("langs:" + (navigator.languages || [navigator.language]).join(","));
  } catch (error) {
    // Navigator API not available
  }

  // -------------------------------------------
  // 3. Timezone
  // -------------------------------------------
  try {
    fingerprintComponents.push("tz:" + Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch (error) {
    // Intl API not available
  }

  // -------------------------------------------
  // 4. WebGL GPU Information
  // -------------------------------------------
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

      if (debugInfo) {
        fingerprintComponents.push("gpu:" + gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
        fingerprintComponents.push("gpuVendor:" + gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
      }

      fingerprintComponents.push("glVersion:" + gl.getParameter(gl.VERSION));
      fingerprintComponents.push("maxTexture:" + gl.getParameter(gl.MAX_TEXTURE_SIZE));
      fingerprintComponents.push("maxViewport:" + gl.getParameter(gl.MAX_VIEWPORT_DIMS).join(","));
    }
  } catch (error) {
    // WebGL not available
  }

  // -------------------------------------------
  // 5. Canvas 2D Fingerprint
  // -------------------------------------------
  // Draws specific text with specific colors and fonts,
  // then hashes the rendered output. Different devices
  // render slightly differently due to font rendering engines.
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("QLFingerprint", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("QLFingerprint", 4, 17);

      fingerprintComponents.push("canvas:" + canvas.toDataURL().substring(0, 100));
    }
  } catch (error) {
    // Canvas 2D not available
  }

  // -------------------------------------------
  // 6. Audio Fingerprint
  // -------------------------------------------
  // Uses OfflineAudioContext to generate audio,
  // then analyzes the output. Different audio
  // processing implementations produce different results.
  try {
    const audioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
    const oscillator = audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    oscillator.connect(compressor);
    compressor.connect(audioContext.destination);
    oscillator.start(0);

    const renderedBuffer = await new Promise((resolve, reject) => {
      audioContext.startRendering().then(resolve).catch(reject);
      setTimeout(() => reject(new Error("timeout")), 1000);
    });

    const channelData = renderedBuffer.getChannelData(0);
    let audioSum = 0;

    for (let i = 4500; i < 5000; i++) {
      audioSum += Math.abs(channelData[i]);
    }

    fingerprintComponents.push("audio:" + audioSum.toFixed(6));
  } catch (error) {
    // Audio API not available
  }

  // -------------------------------------------
  // 7. Font Detection
  // -------------------------------------------
  // Tests which fonts are installed by measuring
  // text width with different font families.
  // Installed fonts produce different measurements.
  try {
    const testFonts = [
      "monospace", "sans-serif", "serif",
      "Courier New", "Georgia", "Helvetica", "Times New Roman",
      "Trebuchet MS", "Verdana", "Impact", "Comic Sans MS",
      "Segoe UI", "Tahoma", "Calibri", "Consolas",
      "Lucida Console", "Palatino Linotype"
    ];

    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      const baseMeasurements = {};
      const baseFonts = ["monospace", "sans-serif", "serif"];
      const testString = "mmmmmmmmmmlli";

      // Measure base font widths
      baseFonts.forEach(font => {
        ctx.font = "72px " + font;
        baseMeasurements[font] = ctx.measureText(testString).width;
      });

      const detectedFonts = [];

      // Test each font against base fonts
      testFonts.forEach(font => {
        let isDetected = false;

        baseFonts.forEach(baseFont => {
          ctx.font = "72px '" + font + "'," + baseFont;
          if (ctx.measureText(testString).width !== baseMeasurements[baseFont]) {
            isDetected = true;
          }
        });

        if (isDetected) {
          detectedFonts.push(font);
        }
      });

      fingerprintComponents.push("fonts:" + detectedFonts.join("|"));
    }
  } catch (error) {
    // Font detection failed
  }

  // -------------------------------------------
  // 8. Generate SHA-256 Hash
  // -------------------------------------------
  // Combine all components with separator,
  // encode to bytes, then hash with SHA-256.
  const combinedString = fingerprintComponents.join("||");
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(combinedString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");

  return hashHex;
}

// =============================================
// CACHED FINGERPRINT STORAGE
// =============================================
// Stores the generated fingerprint to avoid
// regenerating it on every call.
let cachedFingerprint = null;

// =============================================
// GET HARDWARE FINGERPRINT (Main Function)
// =============================================
// Returns the device's unique fingerprint.
// Uses caching and chrome.storage for persistence.
// Falls back to random UUID if generation fails.
async function getHardwareFingerprint() {
  // Return cached value if available
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  return new Promise(async (resolve) => {
    // Try to load from chrome storage
    chrome.storage.local.get(["ql_hw_fingerprint"], async (result) => {
      if (result.ql_hw_fingerprint) {
        // Use stored fingerprint
        cachedFingerprint = result.ql_hw_fingerprint;
        resolve(cachedFingerprint);
      } else {
        // Generate new fingerprint
        try {
          const fingerprint = await generateHardwareFingerprint();
          cachedFingerprint = fingerprint;

          // Save to chrome storage
          chrome.storage.local.set({
            ql_hw_fingerprint: fingerprint
          });

          resolve(fingerprint);
        } catch (error) {
          // Fallback: use random UUID
          const fallbackId = crypto.randomUUID();
          cachedFingerprint = fallbackId;

          chrome.storage.local.set({
            ql_hw_fingerprint: fallbackId
          });

          resolve(fallbackId);
        }
      }
    });
  });
}
