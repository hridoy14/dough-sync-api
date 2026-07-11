// =============================================
// i18n.js — STUB VERSION FOR TESTING
// Minimal t() and langSw() functions
// Replace with full i18n.js when ready
// =============================================

function langSw() {
  return 'EN';
}

const i18n_strings = {
  'license.title': 'License Validation',        
  'license.desc': 'Enter your license key to activate',  
  'license.input.placeholder': 'INFINITY-XXXX-XXXX-XXXX',  
  'license.validate': 'Validate License',
  'license.validating': 'Validating...',
  'license.invalid': 'Invalid license key',
  'license.valid': 'License validated successfully!',
  'tab.prompt': 'Prompt',
  'tab.history': 'History',
  'header.sidepanel': 'Side Panel',
  'header.theme': 'Theme',
  'sync.ok': 'Connected to',
  'sync.project': 'project',
  'sync.waiting': 'Waiting for connection...',
  'btn.download': 'Download Source Code',
  'btn.native.chat': 'Use Default Chat',
  'btn.shield.on': 'Activate Shield',
  'btn.shield.off': 'Deactivate Shield',
  'btn.ok': 'OK',
  'mode.plano': 'Plan Mode',
  'shortcuts.title': 'Quick Actions',
  'notif.title': 'Notifications',
  'notif.loading': 'Loading...',
  'notif.empty': 'No notifications',
  'online.count': 'Online',
  'countdown.expired': 'License Expired',
  'countdown.trial': 'Trial Remaining',
  'countdown.license': 'License Active',
  'expired.title': 'License Expired',
  'expired.message': 'Your license has expired. Please contact support to renew.',
  'expired.close': 'Close',
  'prompt.fix.label': 'Fix',
  'prompt.fix.text': 'Fix all bugs and errors in this code',
  'prompt.refactor.label': 'Refactor',
  'prompt.refactor.text': 'Refactor this code for better performance',
  'prompt.errors.label': 'Debug',
  'prompt.errors.text': 'Find and fix all errors',
  'prompt.optimize.label': 'Optimize',
  'prompt.optimize.text': 'Optimize this code for better performance',
  'prompt.comments.label': 'Comment',
  'prompt.comments.text': 'Add detailed comments to this code',
  'prompt.seo.label': 'SEO',
  'prompt.seo.text': 'Improve SEO for this page',
  'prompt.test.label': 'Test',
  'prompt.test.text': 'Add unit tests for this code',
  'prompt.translate.label': 'Translate',
  'prompt.translate.text': 'Translate this to English',
  'prompt.review.label': 'Review',
  'prompt.review.text': 'Review this code for best practices'
  
};

function t(key) {
  return i18n_strings[key] || key;
}

