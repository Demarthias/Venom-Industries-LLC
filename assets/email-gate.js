/* ============================================================================
   SaaS Detective — Email Gate Modal
   Drop-in script: intercepts all buy.stripe.com clicks, captures email to
   /subscribe endpoint, then redirects to Stripe with prefilled_email.

   Install: add this just before </body> in saas-detective.html
     <script src="/assets/email-gate.js"></script>

   Worker endpoint:  https://saas-detective-licensing.kubegrayson.workers.dev/subscribe
   ========================================================================== */

(function () {
  'use strict';

  if (window.__SD_EMAIL_GATE_INIT__) return;
  window.__SD_EMAIL_GATE_INIT__ = true;

  var WORKER_BASE = 'https://saas-detective-licensing.kubegrayson.workers.dev';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // -- Inject styles ---------------------------------------------------------
  var css =
    '#sd-gate-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.72);' +
    'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
    'display:none;align-items:center;justify-content:center;z-index:99999;' +
    'padding:20px;opacity:0;transition:opacity .18s ease}' +
    '#sd-gate-overlay.is-open{display:flex;opacity:1}' +
    '#sd-gate-card{background:#ffffff;border:1px solid #e2e8f0;' +
    'border-radius:14px;max-width:460px;width:100%;padding:36px 32px 28px;' +
    'box-shadow:0 24px 80px rgba(0,0,0,0.16),0 0 0 1px rgba(0,0,0,0.03);' +
    'position:relative;transform:translateY(8px);transition:transform .22s ease;' +
    'font-family:"DM Mono",ui-monospace,SFMono-Regular,Menlo,monospace;' +
    'color:#0f172a}' +
    '#sd-gate-overlay.is-open #sd-gate-card{transform:translateY(0)}' +
    '#sd-gate-close{position:absolute;top:14px;right:14px;background:transparent;' +
    'border:none;color:#94a3b8;font-size:22px;line-height:1;cursor:pointer;' +
    'padding:6px 10px;border-radius:6px;transition:color .15s,background .15s}' +
    '#sd-gate-close:hover{color:#0f172a;background:rgba(0,0,0,0.04)}' +
    '#sd-gate-card h2{font-family:"Syne",system-ui,sans-serif;font-weight:700;' +
    'font-size:22px;line-height:1.18;margin:0 0 8px;letter-spacing:-0.02em;color:#0f172a}' +
    '#sd-gate-card .sd-gate-sub{color:#64748b;font-size:13px;line-height:1.5;margin:0 0 22px}' +
    '#sd-gate-type-label{display:block;font-size:11px;font-weight:700;letter-spacing:0.08em;' +
    'text-transform:uppercase;color:#64748b;margin-bottom:8px;' +
    'font-family:"DM Mono",ui-monospace,monospace}' +
    '#sd-gate-type-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}' +
    '.sd-gate-type-btn{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;' +
    'padding:11px 14px;color:#64748b;font-family:"DM Mono",ui-monospace,monospace;' +
    'font-size:13px;font-weight:600;letter-spacing:0.04em;cursor:pointer;' +
    'transition:background .15s,border-color .15s,color .15s;text-align:center}' +
    '.sd-gate-type-btn:hover{background:#e2e8f0;color:#0f172a}' +
    '.sd-gate-type-btn.is-selected{background:rgba(37,99,235,0.08);' +
    'border-color:#2563eb;color:#2563eb}' +
    '#sd-gate-card label.sd-gate-field-label{display:block;font-size:11px;' +
    'font-weight:700;letter-spacing:0.08em;text-transform:uppercase;' +
    'color:#64748b;margin-bottom:6px;font-family:"DM Mono",ui-monospace,monospace}' +
    '#sd-gate-card input[type=email]{width:100%;background:#f8fafc;' +
    'border:1px solid #e2e8f0;border-radius:8px;padding:13px 14px;color:#0f172a;' +
    'font-family:inherit;font-size:14px;outline:none;' +
    'transition:border-color .15s,box-shadow .15s;box-sizing:border-box}' +
    '#sd-gate-card input[type=email]:focus{border-color:#2563eb;' +
    'box-shadow:0 0 0 3px rgba(37,99,235,0.12)}' +
    '#sd-gate-card input[type=email]::placeholder{color:#94a3b8}' +
    '#sd-gate-card .sd-gate-checkbox{display:flex;align-items:flex-start;gap:10px;' +
    'margin:16px 0 0;cursor:pointer;user-select:none}' +
    '#sd-gate-card .sd-gate-checkbox input{margin:2px 0 0;accent-color:#2563eb;' +
    'flex-shrink:0;cursor:pointer}' +
    '#sd-gate-card .sd-gate-checkbox-text{font-size:12px;line-height:1.5;color:#475569}' +
    '#sd-gate-card .sd-gate-checkbox-text strong{color:#2563eb;font-weight:700}' +
    '#sd-gate-card button.sd-gate-submit{width:100%;margin-top:22px;' +
    'background:#2563eb;color:#ffffff;border:none;border-radius:8px;' +
    'padding:14px;font-family:"Syne",system-ui,sans-serif;font-weight:700;' +
    'font-size:15px;letter-spacing:0.04em;cursor:pointer;' +
    'transition:background .15s,transform .1s}' +
    '#sd-gate-card button.sd-gate-submit:hover{background:#1d4ed8}' +
    '#sd-gate-card button.sd-gate-submit:active{transform:scale(0.98)}' +
    '#sd-gate-card button.sd-gate-submit:disabled{background:#e2e8f0;' +
    'color:#94a3b8;cursor:not-allowed}' +
    '#sd-gate-card .sd-gate-skip{display:block;text-align:center;margin-top:14px;' +
    'font-size:11px;color:#94a3b8;background:transparent;border:none;cursor:pointer;' +
    'font-family:inherit;letter-spacing:0.04em;text-decoration:underline;' +
    'text-underline-offset:3px;transition:color .15s}' +
    '#sd-gate-card .sd-gate-skip:hover{color:#64748b}' +
    '#sd-gate-card .sd-gate-error{color:#dc2626;font-size:12px;margin-top:10px;display:none}' +
    '#sd-gate-card .sd-gate-error.is-visible{display:block}' +
    '#sd-gate-card .sd-gate-trust{margin-top:18px;padding-top:18px;' +
    'border-top:1px solid #e2e8f0;display:flex;gap:14px;font-size:10px;' +
    'color:#94a3b8;letter-spacing:0.04em;text-transform:uppercase;' +
    'justify-content:center;flex-wrap:wrap}' +
    '#sd-gate-card .sd-gate-trust span::before{content:"\\2713 ";color:#2563eb;margin-right:4px}' +
    '@media (max-width:520px){#sd-gate-card{padding:30px 22px 22px}' +
    '#sd-gate-card h2{font-size:18px}}';

  var styleEl = document.createElement('style');
  styleEl.id = 'sd-email-gate-styles';
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);

  // -- Inject modal HTML ----------------------------------------------------
  var modalHTML =
    '<div id="sd-gate-overlay" role="dialog" aria-modal="true" aria-labelledby="sd-gate-heading">' +
    '  <div id="sd-gate-card">' +
    '    <button id="sd-gate-close" aria-label="Close">✕</button>' +
    '    <h2 id="sd-gate-heading">One last step — where should we send your key?</h2>' +
    '    <p class="sd-gate-sub" id="sd-gate-sub">After checkout your activation key is emailed instantly. Use the same email at Stripe to keep things tidy.</p>' +
    '    <form id="sd-gate-form" novalidate>' +
    '      <span id="sd-gate-type-label" class="sd-gate-type-label">Account type</span>' +
    '      <div id="sd-gate-type-row" role="group" aria-labelledby="sd-gate-type-label">' +
    '        <button type="button" class="sd-gate-type-btn" id="sd-gate-type-personal" aria-pressed="false">Personal</button>' +
    '        <button type="button" class="sd-gate-type-btn" id="sd-gate-type-business" aria-pressed="false">Business</button>' +
    '      </div>' +
    '      <label class="sd-gate-field-label" for="sd-gate-email">Email</label>' +
    '      <input type="email" id="sd-gate-email" name="email" placeholder="you@company.com" autocomplete="email" required />' +
    '      <label class="sd-gate-checkbox">' +
    '        <input type="checkbox" id="sd-gate-newsletter" checked />' +
    '        <span class="sd-gate-checkbox-text">Also send me the <strong>SaaS Detective newsletter</strong> — new signatures, stack-change reports, and curated SaaS deals (1-2 emails/month, unsubscribe anytime).</span>' +
    '      </label>' +
    '      <div class="sd-gate-error" id="sd-gate-error" role="alert"></div>' +
    '      <button type="submit" class="sd-gate-submit" id="sd-gate-submit">Continue to checkout →</button>' +
    '      <button type="button" class="sd-gate-skip" id="sd-gate-skip">skip — go straight to checkout</button>' +
    '    </form>' +
    '    <div class="sd-gate-trust">' +
    '      <span>cancel anytime</span><span>30-day money-back</span>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  var modalWrap = document.createElement('div');
  modalWrap.innerHTML = modalHTML;
  document.body.appendChild(modalWrap.firstElementChild);

  var overlay    = document.getElementById('sd-gate-overlay');
  var closeBtn   = document.getElementById('sd-gate-close');
  var form       = document.getElementById('sd-gate-form');
  var emailInput = document.getElementById('sd-gate-email');
  var newsletterInput = document.getElementById('sd-gate-newsletter');
  var submitBtn  = document.getElementById('sd-gate-submit');
  var skipBtn    = document.getElementById('sd-gate-skip');
  var errorEl    = document.getElementById('sd-gate-error');
  var headingEl  = document.getElementById('sd-gate-heading');
  var subEl      = document.getElementById('sd-gate-sub');
  var personalBtn = document.getElementById('sd-gate-type-personal');
  var businessBtn = document.getElementById('sd-gate-type-business');

  var pendingStripeUrl = null;
  var accountType = null;

  var COPY = {
    personal: {
      heading: 'Personal — enter your email to get your license key',
      sub: 'Your activation key is emailed instantly after checkout.'
    },
    business: {
      heading: 'Business — enter your email to get your license key',
      sub: 'Your license key is emailed instantly to your business address.'
    },
    default: {
      heading: 'Enter your email to get your license key',
      sub: 'After checkout your activation key is emailed instantly. Use the same email at Stripe to keep things tidy.'
    }
  };

  // -- Helpers ---------------------------------------------------------------
  function track(eventName, props) {
    try {
      if (window.posthog && typeof window.posthog.capture === 'function') {
        window.posthog.capture(eventName, props || {});
      }
    } catch (_) {}
  }

  function buildStripeUrl(originalUrl, email, type) {
    try {
      var u = new URL(originalUrl);
      if (email) u.searchParams.set('prefilled_email', email);
      if (type) u.searchParams.set('client_reference_id', type);
      return u.toString();
    } catch (_) {
      return originalUrl;
    }
  }

  function selectAccountType(type) {
    accountType = type;
    personalBtn.classList.toggle('is-selected', type === 'personal');
    businessBtn.classList.toggle('is-selected', type === 'business');
    personalBtn.setAttribute('aria-pressed', type === 'personal' ? 'true' : 'false');
    businessBtn.setAttribute('aria-pressed', type === 'business' ? 'true' : 'false');
    var copy = COPY[type] || COPY.default;
    headingEl.textContent = copy.heading;
    subEl.textContent = copy.sub;
    submitBtn.textContent = 'Continue to ' + type.charAt(0).toUpperCase() + type.slice(1) + ' checkout →';
    errorEl.classList.remove('is-visible');
  }

  function resetModal() {
    accountType = null;
    personalBtn.classList.remove('is-selected');
    businessBtn.classList.remove('is-selected');
    personalBtn.setAttribute('aria-pressed', 'false');
    businessBtn.setAttribute('aria-pressed', 'false');
    headingEl.textContent = COPY.default.heading;
    subEl.textContent = COPY.default.sub;
    submitBtn.textContent = 'Continue to checkout →';
    errorEl.classList.remove('is-visible');
    errorEl.textContent = '';
    emailInput.value = '';
  }

  function openModal(stripeUrl) {
    pendingStripeUrl = stripeUrl;
    resetModal();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { personalBtn.focus(); }, 60);
    track('email_gate_shown', { destination: stripeUrl });
  }

  function closeModal(reason) {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    track('email_gate_closed', { reason: reason || 'unknown' });
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('is-visible');
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Sending you to checkout…' : 'Continue to checkout →';
  }

  function submitForm(e) {
    e.preventDefault();
    errorEl.classList.remove('is-visible');

    if (!accountType) {
      showError('Please choose Personal or Business to continue.');
      return;
    }

    var email = (emailInput.value || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      showError('Please enter a valid email address.');
      emailInput.focus();
      return;
    }

    setLoading(true);
    var newsletterOptIn = !!newsletterInput.checked;

    // Fire-and-forget — redirect immediately, don't block on the worker response.
    // sendBeacon survives page navigation; fetch is the fallback.
    var payload = JSON.stringify({
      email: email,
      account_type: accountType,
      source: newsletterOptIn ? 'checkout-modal-newsletter' : 'checkout-modal',
      client_id: (window.posthog && typeof window.posthog.get_distinct_id === 'function')
        ? window.posthog.get_distinct_id()
        : email
    });
    var sent = navigator.sendBeacon
      ? navigator.sendBeacon(WORKER_BASE + '/subscribe', new Blob([payload], { type: 'application/json' }))
      : false;
    if (!sent) {
      fetch(WORKER_BASE + '/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      }).catch(function () {});
    }

    track('email_gate_submitted', {
      email_domain: email.split('@')[1] || 'unknown',
      newsletter_opt_in: newsletterOptIn,
      account_type: accountType,
      destination: pendingStripeUrl
    });

    track('checkout_begin', {
      email_domain: email.split('@')[1] || 'unknown',
      account_type: accountType,
      destination: pendingStripeUrl,
      skipped_gate: false,
      source: 'web'
    });

    window.location.href = buildStripeUrl(pendingStripeUrl, email, accountType);
  }

  function handleSkip() {
    track('email_gate_skipped', { destination: pendingStripeUrl, account_type: accountType });
    track('checkout_begin', { destination: pendingStripeUrl, account_type: accountType, skipped_gate: true, source: 'web' });
    if (pendingStripeUrl) window.location.href = pendingStripeUrl;
  }

  // -- Wire up events --------------------------------------------------------
  closeBtn.addEventListener('click', function () { closeModal('close-button'); });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal('backdrop');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal('escape');
  });
  personalBtn.addEventListener('click', function () { selectAccountType('personal'); });
  businessBtn.addEventListener('click', function () { selectAccountType('business'); });
  form.addEventListener('submit', submitForm);
  skipBtn.addEventListener('click', handleSkip);

  // -- Intercept all buy.stripe.com links ------------------------------------
  function attachInterceptors() {
    var links = document.querySelectorAll('a[href*="buy.stripe.com"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.dataset.sdGateAttached === '1') continue;
      a.dataset.sdGateAttached = '1';
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        track('clicked_payment_link', {
          plan: this.dataset.plan || 'unknown',
          price: this.dataset.price || 'unknown',
          destination: this.href
        });
        openModal(this.href);
      });
    }
  }

  attachInterceptors();
  if (typeof MutationObserver === 'function') {
    var mo = new MutationObserver(function () { attachInterceptors(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
})();
