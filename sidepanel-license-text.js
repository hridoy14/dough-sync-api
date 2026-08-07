/* LovaPilot — rewrite license-gate text and remove LI-XXXX format requirement */
(function () {
  const NEW_DESC = 'Enter your license key (https://wa.me/8801759176229)';
  const NEW_PLACEHOLDER = 'Enter your license key';

  function patch(root) {
    if (!root || !root.querySelectorAll) return;

    // Replace input placeholder(s)
    root.querySelectorAll('input[placeholder]').forEach((el) => {
      const p = el.getAttribute('placeholder') || '';
      if (/LI-/i.test(p) || /XXXX/.test(p)) {
        el.setAttribute('placeholder', NEW_PLACEHOLDER);
      }
    });

    // Replace description / hint text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const targets = [];
    let n;
    while ((n = walker.nextNode())) {
      const t = n.nodeValue;
      if (!t) continue;
      if (/LI-XXXX/i.test(t) || /Lovable Infinity/i.test(t) || /must start with/i.test(t) || /start with LI/i.test(t)) {
        targets.push(n);
      }
    }
    targets.forEach((node) => {
      const parent = node.parentNode;
      if (!parent) return;
      // Replace entire text with new description, but preserve link
      if (parent.tagName && parent.tagName.toLowerCase() !== 'a') {
        parent.innerHTML =
          'Enter your license key (<a href="https://wa.me/8801759176229" target="_blank" rel="noopener" style="color:var(--ql-accent,#2dd4a8);text-decoration:underline">WhatsApp</a>)';
      }
    });
  }

  function run() {
    patch(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes && m.addedNodes.forEach((node) => {
        if (node.nodeType === 1) patch(node);
      });
    }
    // Also re-check placeholders/text on any change
    patch(document.body);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
