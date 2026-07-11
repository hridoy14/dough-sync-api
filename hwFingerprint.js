// =============================================
// hwFingerprint.js — STUB VERSION FOR TESTING
// Minimal getHardwareFingerprint() function
// Replace with full hwFingerprint.js when ready
// =============================================

function getHardwareFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 2,
    navigator.deviceMemory || 4
  ];
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'stub-device-' + Math.abs(hash).toString(36) + '-' + Date.now().toString(36);
}
