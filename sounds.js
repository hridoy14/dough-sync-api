/* ============================================================
 * sounds.js
 * dough-sync-api v5.0.0
 * ============================================================
 * Sound Effects Module — handles audio feedback for user events.
 *
 * Originally obfuscated as: ornobsounds.js (86 lines)
 * All functions preserved — nothing deleted.
 * Brazilian Portuguese → English detection patterns added.
 * Branding: dough-sync-api
 * ============================================================
 *
 * FEATURES:
 *   - Web Audio API tone generation (activation, promptSent)
 *   - MP3 file playback for errors (payment, rateLimit, token)
 *   - Smart error detection from API response messages
 *
 * EXPORTED:
 *   - QLSounds.activation()         — Success tone (3-note ascending)
 *   - QLSounds.promptSent()         — Sent confirmation tone
 *   - QLSounds.errorFromMessage(msg) — Auto-detect error type from message
 *   - QLSounds.payment()            — Payment error sound
 *   - QLSounds.rateLimit()          — Rate limit error sound
 *   - QLSounds.token()              — Token/auth error sound
 *
 * SOUND FILES (placed in /sounds/ folder):
 *   - error-payment.mp3
 *   - error-ratelimit.mp3
 *   - error-token.mp3
 * ============================================================ */

(function (globalContext) {

  // ============================================================
  // SECTION 1: AUDIO CONTEXT MANAGER
  // ============================================================
  // Creates/reuses a single AudioContext instance.
  // Returns null if browser doesn't support Web Audio API.

  var cachedAudioContext = null;

  /**
   * Gets or creates the AudioContext instance.
   * Uses AudioContext or webkitAudioContext (Safari fallback).
   * @returns {AudioContext|null}
   */
  function getAudioContext() {
    if (cachedAudioContext) {
      return cachedAudioContext;
    }

    var AudioContextClass = globalContext.AudioContext || globalContext.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    try {
      cachedAudioContext = new AudioContextClass();
    } catch (e) {
      return null;
    }

    return cachedAudioContext;
  }

  // ============================================================
  // SECTION 2: TONE GENERATOR
  // ============================================================
  // Generates a single tone using Web Audio API oscillator.

  /**
   * Plays a single sine wave tone.
   * @param {number} frequency  - Frequency in Hz (e.g. 440 = A4)
   * @param {number} delay      - Delay before start in seconds
   * @param {number} duration   - Tone duration in seconds
   * @param {number} volume     - Peak volume (0.0 to 1.0, default 0.12)
   */
  function playTone(frequency, delay, duration, volume) {
    var audioCtx = getAudioContext();
    if (!audioCtx) {
      return;
    }

    var startTime = audioCtx.currentTime + delay;
    var oscillator = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    // Envelope: quick attack, exponential decay
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume || 0.12, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Connect: oscillator → gain → speakers
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  }

  // ============================================================
  // SECTION 3: PREDEFINED SOUND EFFECTS
  // ============================================================
  // Multi-tone sequences for success events.

  /**
   * Activation sound — 3-note ascending melody (C5, E5, G5).
   * Played when license is successfully validated.
   */
  function playActivationSound() {
    playTone(523.25, 0,    0.25, 0.1);   // C5
    playTone(659.25, 0.12, 0.25, 0.1);   // E5
    playTone(783.99, 0.24, 0.35, 0.12);  // G5
  }

  /**
   * Prompt sent sound — confirmation melody (A4, E5, A5).
   * Played when a prompt is successfully sent to Lovable.
   */
  function playPromptSentSound() {
    playTone(440,    0,    0.55, 0.06);   // A4
    playTone(659.25, 0.25, 0.85, 0.05);   // E5
    playTone(880,    0.55, 1.2,  0.04);   // A5
  }

  // ============================================================
  // SECTION 4: MP3 FILE PLAYER
  // ============================================================
  // Plays error sound files from the /sounds/ extension folder.

  /**
   * Plays an MP3 sound file from the extension's sounds directory.
   * @param {string} filename - Sound file name (e.g. "error-payment.mp3")
   */
  function playSoundFile(filename) {
    try {
      var soundUrl = chrome.runtime.getURL("sounds/" + filename);
      var audio = new Audio(soundUrl);
      audio.volume = 0.55;
      audio.play().catch(function () {
        // Silently ignore play errors (autoplay policy, etc.)
      });
    } catch (e) {
      // Silently ignore — sound files are optional
    }
  }

  // ============================================================
  // SECTION 5: SMART ERROR DETECTOR
  // ============================================================
  // Analyzes API error messages and plays the appropriate sound.
  // Detects both English and Brazilian Portuguese error patterns.

  /**
   * Analyzes an error message string and plays the matching error sound.
   * Detection patterns cover both English and Portuguese API responses.
   *
   * Error categories:
   *   - Payment errors: "payment required", "pagamento", "crédito", "insufici", " 402"
   *   - Rate limit errors: "rate limit", "muitas tentativas", "too many", " 429"
   *   - Token/auth errors: "token", "sess", "auth", " 401", " 403"
   *
   * @param {string} message - Error message from API response
   */
  function playErrorFromMessage(message) {
    if (!message) {
      return;
    }

    var lowerMsg = (message + "").toLowerCase();

    // --- Payment errors (402 / payment required / insuficiente) ---
    if (
      lowerMsg.indexOf("payment required") !== -1 ||
      lowerMsg.indexOf("pagamento") !== -1 ||
      lowerMsg.indexOf("crédito") !== -1 ||
      lowerMsg.indexOf("credito") !== -1 ||
      lowerMsg.indexOf("insufici") !== -1 ||
      lowerMsg.indexOf(" 402") !== -1 ||
      lowerMsg.indexOf("billing") !== -1 ||
      lowerMsg.indexOf("credit") !== -1
    ) {
      playSoundFile("error-payment.mp3");
      return;
    }

    // --- Rate limit errors (429 / too many requests) ---
    if (
      lowerMsg.indexOf("rate limit") !== -1 ||
      lowerMsg.indexOf("rate-limit") !== -1 ||
      lowerMsg.indexOf("muitas tentativas") !== -1 ||
      lowerMsg.indexOf("too many") !== -1 ||
      lowerMsg.indexOf(" 429") !== -1 ||
      lowerMsg.indexOf("throttl") !== -1
    ) {
      playSoundFile("error-ratelimit.mp3");
      return;
    }

    // --- Token/auth errors (401 / 403) ---
    if (
      lowerMsg.indexOf("token") !== -1 ||
      lowerMsg.indexOf("sess") !== -1 ||
      lowerMsg.indexOf("auth") !== -1 ||
      lowerMsg.indexOf(" 401") !== -1 ||
      lowerMsg.indexOf(" 403") !== -1 ||
      lowerMsg.indexOf("unauthorized") !== -1 ||
      lowerMsg.indexOf("forbidden") !== -1
    ) {
      playSoundFile("error-token.mp3");
      return;
    }
  }

  // ============================================================
  // SECTION 6: PUBLIC API — QLSounds
  // ============================================================
  // Exposed on window/self as QLSounds for use across the extension.

  globalContext.QLSounds = {
    /**
     * Play activation success sound (3-note ascending melody).
     * Called when license validation succeeds.
     */
    activation: playActivationSound,

    /**
     * Play prompt sent confirmation sound.
     * Called when a prompt is successfully sent.
     */
    promptSent: playPromptSentSound,

    /**
     * Auto-detect error type from message and play appropriate sound.
     * @param {string} message - Error message string
     */
    errorFromMessage: playErrorFromMessage,

    /**
     * Play payment required error sound.
     * Called when API returns 402 or payment-related error.
     */
    payment: function () {
      playSoundFile("error-payment.mp3");
    },

    /**
     * Play rate limit exceeded error sound.
     * Called when API returns 429 or rate limit error.
     */
    rateLimit: function () {
      playSoundFile("error-ratelimit.mp3");
    },

    /**
     * Play token/auth error sound.
     * Called when API returns 401/403 or token-related error.
     */
    token: function () {
      playSoundFile("error-token.mp3");
    }
  };

})(typeof window !== "undefined" ? window : self);

// ============================================================
// END OF FILE — sounds.js
// All original functions preserved. No code deleted.
// Brazilian Portuguese → English patterns added.
// Branding: dough-sync-api v5.0.0
// ============================================================
