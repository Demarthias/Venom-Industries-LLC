// Venom Industries — Cloudflare Worker
// Routes: / → homepage | /about → about | /saas-detective → product | /privacy → privacy | /terms → terms

function html(content) {
  return new Response(content, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ─────────────────────────────────────────────
// SHARED: fonts, CSS variables, nav, footer
// ─────────────────────────────────────────────

const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet" />
`;

const BASE_CSS = `
  :root {
    --bg:      #07080d;
    --surface: #0e0f18;
    --border:  #1a1b2e;
    --accent:  #c8f135;
    --accent-dim: rgba(200,241,53,0.1);
    --blue:    #4fc4f7;
    --text:    #eeeef5;
    --muted:   #5a5b78;
    --card:    #0c0d18;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(200,241,53,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(200,241,53,0.02) 1px, transparent 1px);
    background-size: 72px 72px;
    pointer-events: none; z-index: 0;
  }
  a { color: inherit; text-decoration: none; }

  /* NAV */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 20px 48px;
    display: flex; align-items: center; justify-content: space-between;
    transition: background 0.4s, border-color 0.4s;
    border-bottom: 1px solid transparent;
  }
  nav.scrolled {
    background: rgba(7,8,13,0.92);
    backdrop-filter: blur(20px);
    border-color: var(--border);
  }
  .logo {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 1rem; letter-spacing: -0.01em;
    color: var(--text); text-decoration: none;
    display: flex; align-items: center; gap: 10px;
  }
  .logo-mark {
    width: 30px; height: 30px; background: var(--accent);
    border-radius: 7px; display: flex; align-items: center;
    justify-content: center; font-size: 0.9rem; flex-shrink: 0;
  }
  .nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
  .nav-links a { font-size: 0.875rem; color: var(--muted); transition: color 0.2s; }
  .nav-links a:hover, .nav-links a.active { color: var(--text); }
  .btn-nav {
    font-family: 'DM Mono', monospace; font-size: 0.72rem; font-weight: 500;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--bg); background: var(--accent);
    padding: 10px 20px; border-radius: 6px; border: none;
    cursor: pointer; transition: opacity 0.2s, transform 0.15s;
    text-decoration: none; display: inline-block;
  }
  .btn-nav:hover { opacity: 0.85; transform: translateY(-1px); }
  .nav-toggle {
    display: none; background: none; border: 1px solid var(--border);
    color: var(--text); cursor: pointer; padding: 8px 10px;
    font-size: 1.2rem; line-height: 1; border-radius: 6px; margin-left: auto;
  }
  .nav-toggle:hover { border-color: var(--accent); color: var(--accent); }
  .btn-outline {
    font-family: 'DM Mono', monospace; font-size: 0.72rem; font-weight: 500;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text); background: transparent;
    padding: 10px 20px; border-radius: 6px;
    border: 1px solid var(--border); cursor: pointer;
    transition: border-color 0.2s; display: inline-block;
  }
  .btn-outline:hover { border-color: var(--muted); }

  /* FOOTER */
  site-footer {
    display: block; position: relative; z-index: 1;
    border-top: 1px solid var(--border);
    padding: 48px;
  }
  .footer-inner {
    max-width: 1100px; margin: 0 auto;
    display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 48px;
  }
  .footer-brand-name {
    font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1rem;
    margin-bottom: 10px; display: flex; align-items: center; gap: 10px;
  }
  .footer-brand-desc { font-size: 0.82rem; color: var(--muted); line-height: 1.65; max-width: 240px; }
  .footer-col-title {
    font-family: 'DM Mono', monospace; font-size: 0.62rem;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 16px;
  }
  .footer-col a {
    display: block; font-size: 0.82rem; color: var(--muted);
    margin-bottom: 10px; transition: color 0.2s;
  }
  .footer-col a:hover { color: var(--text); }
  .footer-bottom {
    max-width: 1100px; margin: 32px auto 0;
    padding-top: 24px; border-top: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 12px;
  }
  .footer-copy { font-family: 'DM Mono', monospace; font-size: 0.62rem; color: var(--muted); letter-spacing: 0.04em; }
  .footer-copy span { color: var(--accent); }

  /* ANIMATIONS */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* SECTION UTILS */
  .section-label {
    font-family: 'DM Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 16px;
  }
  .section-title {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 20px;
  }
  .section-sub { font-size: 1rem; color: var(--muted); line-height: 1.7; font-weight: 300; }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    nav { padding: 18px 24px; flex-wrap: wrap; }
    .nav-toggle { display: block; }
    .nav-links {
      display: none; width: 100%;
      flex-direction: column; align-items: stretch; gap: 0;
      padding: 8px 0 4px; order: 99; margin-top: 14px;
      border-top: 1px solid var(--border);
    }
    .nav-links li { list-style: none; }
    .nav-links a { display: block; padding: 14px 4px; font-size: 1rem; border-bottom: 1px solid var(--border); }
    .nav-links li:last-child a { border-bottom: none; }
    nav.nav-open .nav-links { display: flex; }
    .footer-inner { grid-template-columns: 1fr 1fr; gap: 32px; }
    site-footer { padding: 40px 24px; }
  }
  @media (max-width: 480px) {
    .footer-inner { grid-template-columns: 1fr; }
  }
`;

const NAV = (active) => `
<nav id="nav">
  <a href="/" class="logo">
    <div class="logo-mark">V</div>
    Venom Industries
  </a>
  <ul class="nav-links">
    <li><a href="/" ${active==='home'?'class="active"':''}>Home</a></li>
    <li><a href="/saas-detective" ${active==='sd'?'class="active"':''}>SaaS Detective</a></li>
    <li><a href="/blog" ${active==='blog'?'class="active"':''}>Blog</a></li>
    <li><a href="/about" ${active==='about'?'class="active"':''}>About</a></li>
  </ul>
  <a href="/saas-detective" class="btn-nav">Get SaaS Detective</a>
  <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">☰</button>
</nav>`;

const FOOTER = `
<site-footer>
  <div class="footer-inner">
    <div>
      <div class="footer-brand-name">
        <div class="logo-mark" style="width:24px;height:24px;font-size:0.75rem;">V</div>
        Venom Industries
      </div>
      <p class="footer-brand-desc">Building software tools that give founders, marketers, and sales teams an unfair advantage.</p>
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Products</div>
      <a href="/saas-detective">SaaS Detective</a>
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Company</div>
      <a href="/about">About</a>
      <a href="/blog">Blog</a>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
    </div>
    <div class="footer-col">
      <div class="footer-col-title">Contact</div>
      <a href="mailto:grayson@venom-industries.com">grayson@venom-industries.com</a>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-copy">© 2026 <span>Venom Industries LLC</span> — All rights reserved.</div>
    <div class="footer-copy">Built in the US &nbsp;·&nbsp; Payments secured by <span>Stripe</span></div>
  </div>
</site-footer>`;

const NAV_SCRIPT = `
<script>
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 70);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  reveals.forEach(el => observer.observe(el));
  const navToggle = document.getElementById('navToggle');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.textContent = open ? '✕' : '☰';
    });
    nav.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.textContent = '☰';
      });
    });
  }
</script>`;

// ─────────────────────────────────────────────
// PAGE: HOMEPAGE
// ─────────────────────────────────────────────

const HOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Venom Industries — Software That Gives You the Edge</title>
  <meta name="description" content="Venom Industries builds intelligence tools for founders, marketers, and sales teams who refuse to operate blind. Home of SaaS Detective." />
  <meta property="og:title" content="Venom Industries — Software That Gives You the Edge" />
  <meta property="og:description" content="We build tools that surface what your competitors hide and the web runs on. Home of SaaS Detective." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://venom-industries.com/" />
  ${FONTS}
  <style>
    ${BASE_CSS}

    /* HERO */
    .hero {
      position: relative; z-index: 1;
      min-height: 100vh;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 140px 24px 80px;
      text-align: center;
    }
    .hero-glow {
      position: absolute; width: 900px; height: 600px;
      background: radial-gradient(ellipse, rgba(200,241,53,0.06) 0%, transparent 65%);
      top: 35%; left: 50%; transform: translateX(-50%);
      pointer-events: none;
    }
    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: 'DM Mono', monospace; font-size: 0.65rem;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--accent); border: 1px solid rgba(200,241,53,0.2);
      background: rgba(200,241,53,0.05); padding: 7px 14px;
      border-radius: 100px; margin-bottom: 36px;
      animation: fadeUp 0.5s ease both;
    }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }
    h1 {
      font-family: 'Syne', sans-serif; font-weight: 800;
      font-size: clamp(2.8rem, 7.5vw, 5.6rem);
      line-height: 1.03; letter-spacing: -0.035em;
      max-width: 860px; margin-bottom: 28px;
      animation: fadeUp 0.5s 0.1s ease both;
    }
    h1 em { font-style: normal; color: var(--accent); }
    .hero-sub {
      font-size: clamp(1rem, 2vw, 1.2rem); font-weight: 300;
      color: var(--muted); max-width: 520px; line-height: 1.75;
      margin-bottom: 48px;
      animation: fadeUp 0.5s 0.2s ease both;
    }
    .hero-actions {
      display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
      justify-content: center; margin-bottom: 18px;
      animation: fadeUp 0.5s 0.3s ease both;
    }
    .btn-hero {
      font-family: 'DM Mono', monospace; font-size: 0.8rem; font-weight: 500;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--bg); background: var(--accent);
      padding: 15px 32px; border-radius: 7px; border: none;
      cursor: pointer; transition: opacity 0.2s, transform 0.15s;
      text-decoration: none; display: inline-block;
    }
    .btn-hero:hover { opacity: 0.85; transform: translateY(-2px); }
    .hero-note { font-size: 0.78rem; color: var(--muted); animation: fadeUp 0.5s 0.35s ease both; }

    /* TRUST BAR */
    .trust-bar {
      position: relative; z-index: 1;
      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
      padding: 28px 48px;
      display: flex; align-items: center; justify-content: center;
      gap: 0; flex-wrap: wrap;
    }
    .trust-item {
      text-align: center; padding: 0 48px;
      border-right: 1px solid var(--border);
    }
    .trust-item:last-child { border-right: none; }
    .trust-num {
      font-family: 'Syne', sans-serif; font-weight: 800;
      font-size: 2.4rem; letter-spacing: -0.04em; color: var(--text);
      line-height: 1; margin-bottom: 6px;
    }
    .trust-num span { color: var(--accent); }
    .trust-label { font-size: 0.78rem; color: var(--muted); font-weight: 300; }

    /* WHAT WE DO */
    .what {
      position: relative; z-index: 1;
      max-width: 1100px; margin: 0 auto; padding: 120px 48px;
    }
    .what-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
    .what-text { max-width: 480px; }
    .what-text h2 { margin-bottom: 24px; }
    .what-text p { color: var(--muted); line-height: 1.75; font-weight: 300; margin-bottom: 16px; }
    .what-points { list-style: none; margin-top: 32px; }
    .what-points li {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 14px 0; border-bottom: 1px solid var(--border);
      font-size: 0.9rem; color: var(--muted); line-height: 1.6;
    }
    .what-points li:last-child { border-bottom: none; }
    .what-points li strong { color: var(--text); font-weight: 600; }
    .point-icon { color: var(--accent); font-size: 1rem; flex-shrink: 0; margin-top: 2px; }
    .what-visual {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 40px 36px;
      box-shadow: 0 0 0 1px rgba(200,241,53,0.05), 0 40px 80px rgba(0,0,0,0.4);
    }
    .visual-tag {
      font-family: 'DM Mono', monospace; font-size: 0.6rem;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--muted); margin-bottom: 20px;
    }
    .visual-row {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 0; border-bottom: 1px solid var(--border);
    }
    .visual-row:last-child { border-bottom: none; }
    .visual-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .visual-name { font-size: 0.85rem; font-weight: 500; flex: 1; }
    .visual-cat {
      font-family: 'DM Mono', monospace; font-size: 0.6rem;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
    }
    .visual-badge {
      font-family: 'DM Mono', monospace; font-size: 0.58rem;
      background: var(--accent-dim); color: var(--accent);
      border: 1px solid rgba(200,241,53,0.2); padding: 2px 8px; border-radius: 4px;
    }

    /* PRODUCTS */
    .products {
      position: relative; z-index: 1;
      background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
      padding: 120px 48px;
    }
    .products-inner { max-width: 1100px; margin: 0 auto; }
    .products-header { margin-bottom: 56px; max-width: 520px; }
    .product-card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 40px;
      display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center;
      transition: border-color 0.25s, box-shadow 0.25s;
      max-width: 780px;
    }
    .product-card:hover {
      border-color: rgba(200,241,53,0.3);
      box-shadow: 0 0 40px rgba(200,241,53,0.04);
    }
    .product-icon {
      width: 52px; height: 52px; background: var(--accent);
      border-radius: 12px; display: flex; align-items: center;
      justify-content: center; font-size: 1.5rem; margin-bottom: 20px;
    }
    .product-name {
      font-family: 'Syne', sans-serif; font-weight: 800;
      font-size: 1.5rem; letter-spacing: -0.02em;
      margin-bottom: 10px;
    }
    .product-desc { font-size: 0.92rem; color: var(--muted); line-height: 1.7; max-width: 460px; margin-bottom: 24px; font-weight: 300; }
    .product-tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .product-tag {
      font-family: 'DM Mono', monospace; font-size: 0.6rem;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--muted); background: var(--surface);
      border: 1px solid var(--border); padding: 4px 10px; border-radius: 4px;
    }
    .product-cta { flex-shrink: 0; text-align: center; }
    .product-cta .btn-nav { display: block; margin-bottom: 10px; white-space: nowrap; }
    .product-cta-free { font-size: 0.72rem; color: var(--muted); }
    .product-status {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: 'DM Mono', monospace; font-size: 0.6rem;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: #4ade80; margin-bottom: 16px;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: pulse 2.5s infinite; }

    /* MISSION */
    .mission {
      position: relative; z-index: 1;
      max-width: 1100px; margin: 0 auto; padding: 120px 48px;
      text-align: center;
    }
    .mission h2 { max-width: 680px; margin: 0 auto 24px; }
    .mission p { max-width: 540px; margin: 0 auto; color: var(--muted); line-height: 1.8; font-weight: 300; }

    /* NEWSLETTER */
    .newsletter-section {
      position: relative; z-index: 1;
      background: var(--surface); border-top: 1px solid var(--border);
      padding: 100px 48px; text-align: center;
    }
    .newsletter-inner { max-width: 560px; margin: 0 auto; }
    .newsletter-inner h2 { margin-bottom: 16px; }
    .newsletter-inner p { color: var(--muted); line-height: 1.7; font-weight: 300; margin-bottom: 36px; }

    /* BLOG TEASER */
    .blog-teaser { position: relative; z-index: 1; padding: 120px 48px; max-width: 1100px; margin: 0 auto; }
    .blog-teaser-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 32px; margin-bottom: 48px; flex-wrap: wrap; }
    .blog-teaser-header-text { max-width: 520px; }
    .blog-teaser-all { font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); white-space: nowrap; }
    .blog-teaser-all:hover { opacity: 0.8; }
    .blog-teaser-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .blog-teaser-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 14px;
      padding: 28px 26px 24px; display: flex; flex-direction: column; gap: 14px;
      transition: border-color 0.2s, transform 0.2s;
      text-decoration: none; color: inherit;
    }
    .blog-teaser-card:hover { border-color: rgba(200,241,53,0.3); transform: translateY(-2px); }
    .blog-teaser-meta { display: flex; align-items: center; gap: 10px; font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .blog-teaser-tag { color: var(--accent); background: var(--accent-dim); border: 1px solid rgba(200,241,53,0.18); padding: 3px 8px; border-radius: 4px; }
    .blog-teaser-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.05rem; letter-spacing: -0.02em; line-height: 1.3; color: var(--text); }
    .blog-teaser-excerpt { font-size: 0.83rem; color: var(--muted); line-height: 1.65; font-weight: 300; flex: 1; }
    .blog-teaser-cta { font-family: 'DM Mono', monospace; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-top: 4px; }

    /* RESPONSIVE */
    @media (max-width: 900px) {
      .what-grid { grid-template-columns: 1fr; gap: 48px; }
      .product-card { grid-template-columns: 1fr; }
      .product-cta { text-align: left; }
      .blog-teaser-grid { grid-template-columns: 1fr; }
      .blog-teaser { padding: 80px 24px; }
    }
    @media (max-width: 768px) {
      .trust-bar { padding: 24px; }
      .trust-item { padding: 0 24px; }
      .what, .products-inner, .mission { padding: 80px 24px; }
      .products { padding: 80px 24px; }
      .newsletter-section { padding: 80px 24px; }
    }
    @media (max-width: 580px) {
      .trust-bar { flex-direction: column; gap: 0; }
      .trust-item { border-right: none; border-bottom: 1px solid var(--border); padding: 24px 0; width: 100%; }
      .trust-item:last-child { border-bottom: none; }
    }
  </style>
</head>
<body>

${NAV('home')}

<!-- HERO -->
<section class="hero">
  <div class="hero-glow"></div>
  <div class="badge"><div class="badge-dot"></div>Venom Industries LLC — Est. 2026</div>
  <h1>Software built to give you an <em>unfair advantage.</em></h1>
  <p class="hero-sub">We build intelligence tools for founders, marketers, and sales teams who refuse to operate blind. Know more. Move faster. Win more.</p>
  <div class="hero-actions">
    <a href="/saas-detective" class="btn-hero">See Our Products</a>
    <a href="/about" class="btn-outline">Who We Are</a>
  </div>
  <p class="hero-note">Proudly indie &nbsp;·&nbsp; Built in the US &nbsp;·&nbsp; Payments by Stripe</p>
</section>

<!-- TRUST BAR -->
<div class="trust-bar">
  <div class="trust-item reveal">
    <div class="trust-num">175<span>+</span></div>
    <div class="trust-label">Tool signatures detected</div>
  </div>
  <div class="trust-item reveal">
    <div class="trust-num">45<span>+</span></div>
    <div class="trust-label">Technology categories</div>
  </div>
  <div class="trust-item reveal">
    <div class="trust-num">&lt;1<span>s</span></div>
    <div class="trust-label">Time to detect any stack</div>
  </div>
  <div class="trust-item reveal">
    <div class="trust-num">0</div>
    <div class="trust-label">Bytes of browsing data collected</div>
  </div>
</div>

<!-- WHAT WE DO -->
<div class="what">
  <div class="what-grid">
    <div class="what-text reveal">
      <div class="section-label">What we do</div>
      <h2 class="section-title">We make invisible intelligence visible.</h2>
      <p>Every website your competitors run, every prospect you're selling to, every brand you admire — they're all running on a stack of tools that tell a story. We build software that reads that story instantly.</p>
      <p>No guesswork. No manual research. Just signal.</p>
      <ul class="what-points">
        <li>
          <span class="point-icon">→</span>
          <span><strong>Competitive intelligence</strong> — know exactly what your competitors pay for and how they operate.</span>
        </li>
        <li>
          <span class="point-icon">→</span>
          <span><strong>Pre-call research</strong> — walk into any sales call knowing the prospect's full tech stack.</span>
        </li>
        <li>
          <span class="point-icon">→</span>
          <span><strong>Stack validation</strong> — see what tools high-performing businesses actually use before you spend a dollar.</span>
        </li>
      </ul>
    </div>
    <div class="reveal">
      <div class="what-visual">
        <div class="visual-tag">Live scan result — shopify.com</div>
        <div class="visual-row">
          <div class="visual-dot" style="background:#4ade80;"></div>
          <div class="visual-name">Shopify</div>
          <div class="visual-cat">E-Commerce</div>
          <div class="visual-badge">DETECTED</div>
        </div>
        <div class="visual-row">
          <div class="visual-dot" style="background:#4fc4f7;"></div>
          <div class="visual-name">Google Analytics</div>
          <div class="visual-cat">Analytics</div>
          <div class="visual-badge">DETECTED</div>
        </div>
        <div class="visual-row">
          <div class="visual-dot" style="background:#fb923c;"></div>
          <div class="visual-name">Klaviyo</div>
          <div class="visual-cat">Email</div>
          <div class="visual-badge">DETECTED</div>
        </div>
        <div class="visual-row">
          <div class="visual-dot" style="background:#a78bfa;"></div>
          <div class="visual-name">React</div>
          <div class="visual-cat">Framework</div>
          <div class="visual-badge">DETECTED</div>
        </div>
        <div class="visual-row">
          <div class="visual-dot" style="background:#fb923c;"></div>
          <div class="visual-name">HubSpot</div>
          <div class="visual-cat">CRM</div>
          <div class="visual-badge">DETECTED</div>
        </div>
        <div class="visual-row">
          <div class="visual-dot" style="background:#4fc4f7;"></div>
          <div class="visual-name">Meta Pixel</div>
          <div class="visual-cat">Advertising</div>
          <div class="visual-badge">DETECTED</div>
        </div>
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <div style="font-family:'DM Mono',monospace;font-size:0.62rem;color:var(--muted);">7 tools detected</div>
          <div style="font-family:'DM Mono',monospace;font-size:0.62rem;color:var(--accent);">Scan complete ✓</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PRODUCTS -->
<div class="products">
  <div class="products-inner">
    <div class="products-header reveal">
      <div class="section-label">Our products</div>
      <h2 class="section-title">Tools we've built</h2>
      <p class="section-sub">Every product we ship is something we'd use ourselves. No fluff, no feature bloat — just sharp tools that do one thing extremely well.</p>
    </div>

    <div class="product-card reveal">
      <div>
        <div class="product-status"><span class="status-dot"></span>Live · Active</div>
        <div class="product-icon">🔍</div>
        <div class="product-name">SaaS Detective</div>
        <p class="product-desc">A Chrome extension that instantly reveals the tech stack and SaaS tools behind any website. One click. Any site. Under a second. 175+ tool signatures across 45+ categories — analytics, CRM, payments, frameworks, and more.</p>
        <div class="product-tags">
          <span class="product-tag">Chrome Extension</span>
          <span class="product-tag">175+ Signatures</span>
          <span class="product-tag">Free + Pro</span>
          <span class="product-tag">Privacy First</span>
        </div>
      </div>
      <div class="product-cta">
        <a href="/saas-detective" class="btn-nav">Learn More</a>
        <div class="product-cta-free">Free plan available</div>
      </div>
    </div>
  </div>
</div>

<!-- MISSION -->
<div class="mission">
  <div class="section-label reveal">Our mission</div>
  <h2 class="section-title reveal">"Information asymmetry is the most valuable edge in business.<br/>We close that gap."</h2>
  <p class="reveal">We're a small, focused software company. No VC funding, no bloated team, no roadmap driven by committee. Just sharp products that solve real problems — built fast, maintained with care, and priced honestly.</p>
</div>

<!-- BLOG TEASER -->
<div class="blog-teaser">
  <div class="blog-teaser-header reveal">
    <div class="blog-teaser-header-text">
      <div class="section-label">Latest from the blog</div>
      <h2 class="section-title">Stack intel, no filler.</h2>
      <p class="section-sub">Tech-stack breakdowns, founder tooling guides, and competitive research — written and edited by us.</p>
    </div>
    <a href="/blog" class="blog-teaser-all">All posts →</a>
  </div>
  <div class="blog-teaser-grid">
    <a href="/blog/framer-vs-webflow-2026" class="blog-teaser-card reveal">
      <div class="blog-teaser-meta"><span class="blog-teaser-tag">Featured</span><span>May 6, 2026 · 9 min</span></div>
      <h3 class="blog-teaser-title">Framer vs Webflow in 2026: We Scanned 1,000+ Sites and the Data Is Clear</h3>
      <p class="blog-teaser-excerpt">One builder is quietly winning the market, the other is bleeding share. We used SaaS Detective to scan over a thousand sites — here's what adoption actually looks like.</p>
      <span class="blog-teaser-cta">Read the breakdown →</span>
    </a>
    <a href="/blog/founder-stack-2026" class="blog-teaser-card reveal">
      <div class="blog-teaser-meta"><span class="blog-teaser-tag">Tools</span><span>May 6, 2026 · 11 min</span></div>
      <h3 class="blog-teaser-title">The Lean Founder Stack 2026: 10 Tools Under $100/mo That Replace Enterprise Software</h3>
      <p class="blog-teaser-excerpt">The fastest-growing solo SaaS businesses aren't running 40 tools — they've found 10 that compose perfectly. The exact stack winning in 2026.</p>
      <span class="blog-teaser-cta">Read the stack →</span>
    </a>
    <a href="/blog/how-to-see-tech-stack.html" class="blog-teaser-card reveal">
      <div class="blog-teaser-meta"><span class="blog-teaser-tag">Tech Intel</span><span>Apr 7, 2026 · 8 min</span></div>
      <h3 class="blog-teaser-title">How to See What Tech Stack a Website Uses</h3>
      <p class="blog-teaser-excerpt">The exact methods professionals use to reverse-engineer any website's technology — frameworks, CMS, analytics, payments — using free tools.</p>
      <span class="blog-teaser-cta">Read the post →</span>
    </a>
  </div>
</div>

<!-- NEWSLETTER -->
<div class="newsletter-section">
  <div class="newsletter-inner reveal">
    <div class="section-label">Stay sharp</div>
    <h2 class="section-title">The Stack Report</h2>
    <p>Every week: the exact tools powering a company you know. Steal their playbook. Free, forever.</p>
    <iframe src="https://subscribe-forms.beehiiv.com/b991d699-eb84-4cdc-ac37-7f4994063a80"
      frameborder="0" scrolling="no"
      style="width:100%;max-width:480px;height:160px;background:transparent;border:none;display:block;margin:0 auto;">
    </iframe>
  </div>
</div>

${FOOTER}
${NAV_SCRIPT}
</body>
</html>`;

// ─────────────────────────────────────────────
// PAGE: SAAS DETECTIVE
// ─────────────────────────────────────────────

const SD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SaaS Detective — Reveal Any Website's Tech Stack Instantly</title>
  <meta name="description" content="One click on any website reveals every tool, platform, and framework powering it. 175+ signatures, 45+ categories. Free Chrome extension." />
  <meta property="og:title" content="SaaS Detective — Reveal Any Website's Tech Stack Instantly" />
  <meta property="og:description" content="One click on any website reveals every tool, platform, and framework powering it. 175+ signatures across 45+ categories." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://venom-industries.com/saas-detective" />
  ${FONTS}
  <style>
    ${BASE_CSS}

    /* HERO */
    .hero {
      position: relative; z-index: 1;
      padding: 160px 48px 100px;
      max-width: 1100px; margin: 0 auto;
      display: grid; grid-template-columns: 1fr 360px; gap: 80px; align-items: center;
    }
    .hero-glow {
      position: fixed; width: 700px; height: 500px;
      background: radial-gradient(ellipse, rgba(200,241,53,0.05) 0%, transparent 65%);
      top: 20%; right: 0; pointer-events: none; z-index: 0;
    }
    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: 'DM Mono', monospace; font-size: 0.65rem;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--accent); border: 1px solid rgba(200,241,53,0.2);
      background: rgba(200,241,53,0.05); padding: 7px 14px;
      border-radius: 100px; margin-bottom: 28px; display: inline-flex;
      animation: fadeUp 0.4s ease both;
    }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }
    h1 {
      font-family: 'Syne', sans-serif; font-weight: 800;
      font-size: clamp(2.4rem, 5vw, 4rem);
      line-height: 1.05; letter-spacing: -0.03em;
      margin-bottom: 24px; animation: fadeUp 0.4s 0.1s ease both;
    }
    h1 em { font-style: normal; color: var(--accent); }
    .hero-sub {
      font-size: 1.05rem; font-weight: 300; color: var(--muted);
      line-height: 1.75; margin-bottom: 40px;
      animation: fadeUp 0.4s 0.2s ease both;
    }
    .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; animation: fadeUp 0.4s 0.3s ease both; }
    .btn-cta {
      font-family: 'DM Mono', monospace; font-size: 0.78rem; font-weight: 500;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--bg); background: var(--accent);
      padding: 14px 28px; border-radius: 7px; border: none;
      cursor: pointer; transition: opacity 0.2s, transform 0.15s;
      text-decoration: none; display: inline-block;
    }
    .btn-cta:hover { opacity: 0.85; transform: translateY(-2px); }
    .hero-note { font-size: 0.78rem; color: var(--muted); margin-top: 14px; animation: fadeUp 0.4s 0.35s ease both; }
    .hero-proof {
      margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border);
      display: flex; gap: 24px; flex-wrap: wrap;
      animation: fadeUp 0.4s 0.4s ease both;
    }
    .proof-item { font-size: 0.8rem; color: var(--muted); display: flex; align-items: center; gap: 6px; }
    .proof-item span { color: var(--accent); font-weight: 700; }

    /* POPUP MOCKUP */
    .mockup {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 0 0 1px rgba(200,241,53,0.06), 0 40px 80px rgba(0,0,0,0.6);
      animation: fadeUp 0.5s 0.2s ease both;
    }
    .mockup-bar {
      background: var(--surface); padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
    }
    .mockup-title {
      font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.8rem;
      display: flex; align-items: center; gap: 7px;
    }
    .mockup-icon {
      width: 18px; height: 18px; background: var(--accent); border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.6rem; color: var(--bg);
    }
    .mockup-url {
      font-family: 'DM Mono', monospace; font-size: 0.6rem; color: var(--muted);
      background: var(--bg); border: 1px solid var(--border);
      padding: 3px 9px; border-radius: 100px;
    }
    .mockup-body { padding: 12px 14px; }
    .m-cat {
      font-family: 'DM Mono', monospace; font-size: 0.56rem;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--muted); margin: 10px 0 6px;
    }
    .m-cat:first-child { margin-top: 0; }
    .m-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 5px; padding: 5px 9px;
      font-size: 0.7rem; font-weight: 500; margin: 0 3px 4px 0;
    }
    .m-dot { width: 5px; height: 5px; border-radius: 50%; }
    .m-chip.locked { opacity: 0.5; filter: blur(2px); cursor: default; }
    .mockup-upgrade {
      background: rgba(200,241,53,0.06); border: 1px solid rgba(200,241,53,0.15);
      border-radius: 7px; padding: 10px 12px; margin: 10px 0;
      text-align: center;
    }
    .mockup-upgrade-text { font-size: 0.68rem; color: var(--accent); font-weight: 600; margin-bottom: 6px; }
    .mockup-upgrade-btn {
      background: var(--accent); color: var(--bg);
      border: none; border-radius: 4px; padding: 5px 12px;
      font-family: 'DM Mono', monospace; font-size: 0.6rem;
      font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
    }
    .mockup-footer {
      border-top: 1px solid var(--border); padding: 9px 14px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .m-count { font-family: 'DM Mono', monospace; font-size: 0.58rem; color: var(--muted); }
    .m-count em { color: var(--accent); font-style: normal; }

    /* STATS STRIP */
    .stats-strip {
      position: relative; z-index: 1;
      display: flex; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    }
    .stat {
      flex: 1; text-align: center; padding: 56px 24px;
      border-right: 1px solid var(--border);
    }
    .stat:last-child { border-right: none; }
    .stat-num {
      font-family: 'Syne', sans-serif; font-weight: 800;
      font-size: 2.6rem; letter-spacing: -0.04em; line-height: 1;
      margin-bottom: 8px;
    }
    .stat-num span { color: var(--accent); }
    .stat-label { font-size: 0.78rem; color: var(--muted); font-weight: 300; }

    /* SECTION */
    .section { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 100px 48px; }
    .section-alt { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
    .section-alt .section { padding: 100px 48px; }

    /* WHO */
    .who-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 48px; }
    .who-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 12px;
      padding: 28px; transition: border-color 0.25s;
    }
    .who-card:hover { border-color: rgba(200,241,53,0.25); }
    .who-icon { font-size: 1.6rem; margin-bottom: 14px; display: block; }
    .who-card h3 { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 8px; }
    .who-card p { font-size: 0.85rem; color: var(--muted); line-height: 1.65; font-weight: 300; }

    /* HOW IT WORKS */
    .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 48px; }
    .step {
      background: var(--card); border: 1px solid var(--border);
      padding: 36px 28px; transition: border-color 0.25s;
    }
    .step:first-child { border-radius: 12px 0 0 12px; }
    .step:last-child { border-radius: 0 12px 12px 0; }
    .step:hover { border-color: rgba(200,241,53,0.25); }
    .step-num { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 18px; }
    .step-icon { font-size: 1.8rem; margin-bottom: 16px; display: block; }
    .step h3 { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 8px; }
    .step p { font-size: 0.85rem; color: var(--muted); line-height: 1.65; font-weight: 300; }

    /* CATEGORIES */
    .cat-cloud { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 36px; }
    .cat-pill {
      background: var(--card); border: 1px solid var(--border); border-radius: 6px;
      padding: 7px 14px; font-size: 0.8rem; color: var(--muted);
      transition: border-color 0.2s, color 0.2s;
    }
    .cat-pill:hover { border-color: rgba(200,241,53,0.3); color: var(--text); }

    /* PRICING */
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 48px; }
    .plan {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 32px 28px; position: relative;
      transition: border-color 0.25s;
    }
    .plan.featured { border-color: var(--accent); }
    .plan-badge {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: var(--accent); color: var(--bg);
      font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 500;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 4px 14px; border-radius: 100px; white-space: nowrap;
    }
    .plan-name { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
    .plan-price { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 3rem; letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px; }
    .plan-price sup { font-size: 1.2rem; vertical-align: top; margin-top: 8px; display: inline-block; }
    .plan-period { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: var(--muted); margin-bottom: 8px; }
    .plan-save { font-family: 'DM Mono', monospace; font-size: 0.6rem; color: var(--accent); background: var(--accent-dim); border: 1px solid rgba(200,241,53,0.15); padding: 3px 10px; border-radius: 4px; display: inline-block; margin-bottom: 20px; }
    .plan-desc { font-size: 0.82rem; color: var(--muted); margin-bottom: 24px; font-weight: 300; line-height: 1.6; }
    .plan-features { list-style: none; margin-bottom: 28px; }
    .plan-features li { font-size: 0.83rem; color: var(--muted); padding: 7px 0; border-bottom: 1px solid var(--border); display: flex; gap: 10px; align-items: flex-start; }
    .plan-features li:last-child { border-bottom: none; }
    .plan-features li strong { color: var(--text); font-weight: 600; }
    .check { color: var(--accent); flex-shrink: 0; margin-top: 1px; }
    .cross { color: var(--muted); flex-shrink: 0; margin-top: 1px; opacity: 0.5; }
    .btn-plan {
      display: block; width: 100%; text-align: center;
      font-family: 'DM Mono', monospace; font-size: 0.7rem; font-weight: 500;
      letter-spacing: 0.08em; text-transform: uppercase;
      padding: 13px; border-radius: 7px; border: none; cursor: pointer;
      transition: opacity 0.2s, transform 0.15s; text-decoration: none;
    }
    .btn-plan-free { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
    .btn-plan-free:hover { border-color: var(--muted); }
    .btn-plan-pro { background: var(--accent); color: var(--bg); }
    .btn-plan-pro:hover { opacity: 0.87; transform: translateY(-1px); }
    .plan-note { font-size: 0.72rem; color: var(--muted); text-align: center; margin-top: 8px; }
    .pricing-sub { font-size: 0.82rem; color: var(--muted); margin-top: 24px; text-align: center; }
    .pricing-sub a { color: var(--accent); text-decoration: underline; }

    /* STAT STRIP */
    .pricing-stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
      margin: 40px 0 8px;
      border: 1px solid var(--border); border-radius: 12px;
      background: var(--card); overflow: hidden;
    }
    .pricing-stat {
      padding: 22px 16px; text-align: center;
      border-right: 1px solid var(--border);
    }
    .pricing-stat:last-child { border-right: none; }
    .pricing-stat-num {
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.8rem;
      letter-spacing: -0.03em; color: var(--text); line-height: 1;
    }
    .pricing-stat-num em { font-style: normal; color: var(--accent); }
    .pricing-stat-label {
      font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--muted); margin-top: 10px;
    }

    /* COMPARISON TABLE */
    .compare-wrap { margin-top: 56px; }
    .compare-title {
      font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--muted); text-align: center; margin-bottom: 20px;
    }
    .compare-table {
      width: 100%; max-width: 760px; margin: 0 auto;
      border-collapse: collapse;
      background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
    }
    .compare-table th, .compare-table td {
      padding: 14px 18px; text-align: left; font-size: 0.85rem;
      border-bottom: 1px solid var(--border);
    }
    .compare-table th {
      font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--muted); font-weight: 500;
      background: var(--surface);
    }
    .compare-table th.col-feature { width: 50%; }
    .compare-table th.col-pro { color: var(--accent); }
    .compare-table td.cell-value { text-align: center; width: 25%; color: var(--text); font-weight: 500; }
    .compare-table td.cell-value.dim { color: var(--muted); font-weight: 300; }
    .compare-table tr:last-child th, .compare-table tr:last-child td { border-bottom: none; }
    .compare-table .compare-check { color: var(--accent); font-weight: 700; }
    .compare-table .compare-cross { color: var(--muted); opacity: 0.5; }

    @media (max-width: 900px) {
      .pricing-stats { grid-template-columns: repeat(2, 1fr); }
      .pricing-stat:nth-child(2) { border-right: none; }
      .pricing-stat:nth-child(1), .pricing-stat:nth-child(2) { border-bottom: 1px solid var(--border); }
      .compare-table th, .compare-table td { padding: 10px 12px; font-size: 0.78rem; }
    }

    /* TRIAL CTA */
    .trial-cta-card {
      margin: 32px auto 0; max-width: 760px;
      background: var(--card); border: 1px solid var(--border); border-radius: 14px;
      padding: 28px 32px;
      display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center;
    }
    .trial-cta-card.has-result { grid-template-columns: 1fr; text-align: center; }
    .trial-cta-text h3 { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.15rem; letter-spacing: -0.02em; margin: 0 0 6px; }
    .trial-cta-text p { font-size: 0.85rem; color: var(--muted); margin: 0; line-height: 1.5; }
    .trial-form { display: flex; gap: 8px; align-items: stretch; }
    .trial-form input {
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
      padding: 11px 14px; font-family: inherit; font-size: 0.88rem; color: var(--text);
      min-width: 240px; outline: none; transition: border-color 0.15s;
    }
    .trial-form input:focus { border-color: var(--accent); }
    .trial-form button {
      background: var(--accent); color: var(--bg); border: none; border-radius: 8px;
      padding: 11px 22px; font-family: 'DM Mono', monospace; font-size: 0.7rem;
      font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      cursor: pointer; transition: opacity 0.15s, transform 0.15s;
    }
    .trial-form button:hover:not(:disabled) { opacity: 0.87; transform: translateY(-1px); }
    .trial-form button:disabled { opacity: 0.5; cursor: wait; }
    .trial-result { display: none; }
    .trial-result.show { display: block; }
    .trial-result-key {
      font-family: monospace; font-size: 1.05rem; font-weight: 700; letter-spacing: 0.08em;
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 14px 20px; margin: 16px auto; max-width: 360px;
    }
    .trial-result-steps { font-size: 0.82rem; color: var(--muted); margin: 8px 0 0; line-height: 1.7; }
    .trial-error { color: #f87171; font-size: 0.85rem; margin-top: 10px; display: none; }
    .trial-error.show { display: block; }

    @media (max-width: 700px) {
      .trial-cta-card { grid-template-columns: 1fr; text-align: center; }
      .trial-form { flex-direction: column; }
      .trial-form input { min-width: auto; width: 100%; }
    }

    /* FAQ */
    .faq-list { margin-top: 40px; max-width: 680px; }
    .faq-item { border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; background: var(--card); overflow: hidden; }
    .faq-q {
      width: 100%; background: none; border: none; padding: 18px 22px;
      text-align: left; font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
      font-weight: 600; color: var(--text); cursor: pointer;
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
    }
    .faq-q:hover { color: var(--accent); }
    .faq-arrow { color: var(--muted); font-size: 0.9rem; transition: transform 0.2s; flex-shrink: 0; }
    .faq-a { padding: 0 22px; max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.2s; font-size: 0.85rem; color: var(--muted); line-height: 1.75; }
    .faq-item.open .faq-a { max-height: 300px; padding-bottom: 18px; }
    .faq-item.open .faq-arrow { transform: rotate(180deg); }

    /* BLOG TEASER */
    .blog-teaser { position: relative; z-index: 1; padding: 100px 48px; max-width: 1100px; margin: 0 auto; border-top: 1px solid var(--border); }
    .blog-teaser-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 32px; margin-bottom: 40px; flex-wrap: wrap; }
    .blog-teaser-header-text { max-width: 520px; }
    .blog-teaser-all { font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); white-space: nowrap; text-decoration: none; }
    .blog-teaser-all:hover { opacity: 0.8; }
    .blog-teaser-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .blog-teaser-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 14px;
      padding: 28px 26px 24px; display: flex; flex-direction: column; gap: 14px;
      transition: border-color 0.2s, transform 0.2s; text-decoration: none; color: inherit;
    }
    .blog-teaser-card:hover { border-color: rgba(200,241,53,0.3); transform: translateY(-2px); }
    .blog-teaser-meta { display: flex; align-items: center; gap: 10px; font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .blog-teaser-tag { color: var(--accent); background: var(--accent-dim); border: 1px solid rgba(200,241,53,0.18); padding: 3px 8px; border-radius: 4px; }
    .blog-teaser-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.05rem; letter-spacing: -0.02em; line-height: 1.3; color: var(--text); }
    .blog-teaser-excerpt { font-size: 0.83rem; color: var(--muted); line-height: 1.65; font-weight: 300; flex: 1; }
    .blog-teaser-cta { font-family: 'DM Mono', monospace; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-top: 4px; }

    /* FINAL CTA */
    .final-cta {
      position: relative; z-index: 1; text-align: center;
      padding: 140px 48px; overflow: hidden;
    }
    .final-glow {
      position: absolute; width: 700px; height: 400px;
      background: radial-gradient(ellipse, rgba(200,241,53,0.07) 0%, transparent 70%);
      top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;
    }
    .final-cta h2 { max-width: 640px; margin: 0 auto 20px; }
    .final-cta h2 em { font-style: normal; color: var(--accent); }
    .final-cta p { color: var(--muted); margin-bottom: 40px; font-weight: 300; }
    .final-actions { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }

    /* RESPONSIVE */
    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; padding: 140px 24px 60px; }
      .pricing-grid { grid-template-columns: 1fr; max-width: 400px; }
      .who-grid { grid-template-columns: 1fr; }
      .steps { grid-template-columns: 1fr; }
      .step:first-child { border-radius: 12px 12px 0 0; }
      .step:last-child { border-radius: 0 0 12px 12px; }
      .blog-teaser-grid { grid-template-columns: 1fr; }
      .blog-teaser { padding: 80px 24px; }
    }
    @media (max-width: 768px) {
      .stats-strip { flex-direction: column; }
      .stat { border-right: none; border-bottom: 1px solid var(--border); padding: 36px 24px; }
      .stat:last-child { border-bottom: none; }
      .section { padding: 72px 24px; }
      .final-cta { padding: 100px 24px; }
    }
  </style>
</head>
<body>

${NAV('sd')}
<div class="hero-glow"></div>

<!-- HERO -->
<div style="position:relative;z-index:1;">
  <div class="hero">
    <div>
      <div class="badge"><div class="badge-dot"></div>Free Chrome Extension</div>
      <h1>Reveal any website's <em>tech stack</em> in one click.</h1>
      <p class="hero-sub">SaaS Detective scans any page you visit and instantly surfaces every tool, platform, and framework powering it — before you finish reading the URL bar.</p>
      <div class="hero-actions">
        <a href="https://chromewebstore.google.com/detail/saas-detective/efnmaomojnnbkmbhkokoflhogjphegpj" target="_blank" rel="noopener" class="btn-cta">Add to Chrome — Free</a>
        <a href="#pricing" class="btn-outline">See Pricing</a>
      </div>
      <p class="hero-note">No account required &nbsp;·&nbsp; Works on any website &nbsp;·&nbsp; Private by design</p>
      <div class="hero-proof">
        <div class="proof-item"><span>175+</span> tool signatures</div>
        <div class="proof-item"><span>45+</span> categories</div>
        <div class="proof-item"><span>&lt;1s</span> detection time</div>
        <div class="proof-item"><span>0</span> bytes of browsing data collected</div>
      </div>
    </div>
    <div class="mockup">
      <div class="mockup-bar">
        <div class="mockup-title"><div class="mockup-icon">🔍</div>SaaS Detective</div>
        <div class="mockup-url">shopify.com</div>
      </div>
      <div class="mockup-body">
        <div class="m-cat">E-Commerce</div>
        <span class="m-chip"><div class="m-dot" style="background:#4ade80;"></div>Shopify</span>
        <div class="m-cat">Analytics</div>
        <span class="m-chip"><div class="m-dot" style="background:#4fc4f7;"></div>Google Analytics</span>
        <span class="m-chip"><div class="m-dot" style="background:#4fc4f7;"></div>Segment</span>
        <div class="m-cat">Email</div>
        <span class="m-chip"><div class="m-dot" style="background:#fb923c;"></div>Klaviyo</span>
        <div class="m-cat">CRM · <span style="color:var(--accent);font-size:0.56rem;">2 PRO TOOLS</span></div>
        <span class="m-chip locked"><div class="m-dot" style="background:#a78bfa;"></div>████████</span>
        <span class="m-chip locked"><div class="m-dot" style="background:#a78bfa;"></div>███████</span>
        <div class="mockup-upgrade">
          <div class="mockup-upgrade-text">+4 Pro tools detected</div>
          <button class="mockup-upgrade-btn">Upgrade — from $5/mo</button>
        </div>
      </div>
      <div class="mockup-footer">
        <div class="m-count"><em>4</em> tools detected</div>
        <div class="m-count">Scan complete ✓</div>
      </div>
    </div>
  </div>
</div>

<!-- STATS -->
<div class="stats-strip">
  <div class="stat reveal"><div class="stat-num">175<span>+</span></div><div class="stat-label">Tool signatures</div></div>
  <div class="stat reveal"><div class="stat-num">45<span>+</span></div><div class="stat-label">Categories covered</div></div>
  <div class="stat reveal"><div class="stat-num">&lt;1<span>s</span></div><div class="stat-label">Time to detect</div></div>
  <div class="stat reveal"><div class="stat-num">0</div><div class="stat-label">Browsing data collected</div></div>
</div>

<!-- WHO -->
<div class="section">
  <div class="section-label">Who it's for</div>
  <h2 class="section-title reveal">Stop walking in blind.</h2>
  <p class="section-sub reveal">Every website you visit is a data point. SaaS Detective turns it into actionable intelligence.</p>
  <div class="who-grid">
    <div class="who-card reveal">
      <span class="who-icon">🎯</span>
      <h3>Sales Professionals</h3>
      <p>Know what CRM, analytics, and ad platforms your prospect runs before you dial. Walk into discovery calls with context. Close with confidence.</p>
    </div>
    <div class="who-card reveal">
      <span class="who-icon">🚀</span>
      <h3>Founders & Strategists</h3>
      <p>See the exact toolset behind businesses you admire or compete with. Validate stack decisions with real-world signal instead of guesswork.</p>
    </div>
    <div class="who-card reveal">
      <span class="who-icon">🏢</span>
      <h3>Agencies & Consultants</h3>
      <p>Audit any prospect's stack before the first meeting. Spot outdated tools and integration gaps. Show up as the expert who already did the homework.</p>
    </div>
    <div class="who-card reveal">
      <span class="who-icon">⚙️</span>
      <h3>Developers & Engineers</h3>
      <p>Identify frameworks, libraries, CDNs, and infrastructure on any site in seconds — no digging through source code, no guessing.</p>
    </div>
  </div>
</div>

<!-- HOW IT WORKS -->
<div class="section-alt">
  <div class="section">
    <div class="section-label">How it works</div>
    <h2 class="section-title reveal">Three seconds from curious to informed.</h2>
    <div class="steps">
      <div class="step reveal">
        <div class="step-num">01</div>
        <span class="step-icon">🌐</span>
        <h3>Browse any website</h3>
        <p>Visit a competitor, a prospect, a brand you're studying — SaaS Detective works on the entire web, on any page, instantly.</p>
      </div>
      <div class="step reveal">
        <div class="step-num">02</div>
        <span class="step-icon">🔍</span>
        <h3>Click the icon</h3>
        <p>Click the SaaS Detective icon in your Chrome toolbar. A two-pass scanner checks HTML patterns and JavaScript globals simultaneously.</p>
      </div>
      <div class="step reveal">
        <div class="step-num">03</div>
        <span class="step-icon">⚡</span>
        <h3>See the full stack</h3>
        <p>Every detected tool appears immediately, grouped by category with descriptions and alternatives. No page reload. No waiting.</p>
      </div>
    </div>
  </div>
</div>

<!-- CATEGORIES -->
<div class="section">
  <div class="section-label">Coverage</div>
  <h2 class="section-title reveal">Every layer of the modern web stack.</h2>
  <p class="section-sub reveal">45+ categories covering every tool category that matters in 2026.</p>
  <div class="cat-cloud reveal">
    <span class="cat-pill">Analytics</span>
    <span class="cat-pill">CRM</span>
    <span class="cat-pill">E-Commerce</span>
    <span class="cat-pill">Email Marketing</span>
    <span class="cat-pill">Live Chat</span>
    <span class="cat-pill">Heatmaps</span>
    <span class="cat-pill">Session Replay</span>
    <span class="cat-pill">Payments</span>
    <span class="cat-pill">Advertising</span>
    <span class="cat-pill">Retargeting</span>
    <span class="cat-pill">A/B Testing</span>
    <span class="cat-pill">Push Notifications</span>
    <span class="cat-pill">Marketing Automation</span>
    <span class="cat-pill">CMS</span>
    <span class="cat-pill">Website Builders</span>
    <span class="cat-pill">Frameworks</span>
    <span class="cat-pill">Libraries</span>
    <span class="cat-pill">CSS</span>
    <span class="cat-pill">Hosting</span>
    <span class="cat-pill">CDN</span>
    <span class="cat-pill">Storage</span>
    <span class="cat-pill">Security</span>
    <span class="cat-pill">Compliance</span>
    <span class="cat-pill">Error Tracking</span>
    <span class="cat-pill">Observability</span>
    <span class="cat-pill">Forms</span>
    <span class="cat-pill">Scheduling</span>
    <span class="cat-pill">Video</span>
    <span class="cat-pill">No-Code</span>
    <span class="cat-pill">Automation</span>
    <span class="cat-pill">Customer Success</span>
    <span class="cat-pill">Sales Intelligence</span>
    <span class="cat-pill">Reviews</span>
    <span class="cat-pill">Community</span>
    <span class="cat-pill">Courses</span>
    <span class="cat-pill">Maps</span>
    <span class="cat-pill">Communications</span>
    <span class="cat-pill">Support</span>
    <span class="cat-pill">Native Ads</span>
    <span class="cat-pill">Referral</span>
    <span class="cat-pill">Search</span>
    <span class="cat-pill">Fonts</span>
    <span class="cat-pill">Icons</span>
    <span class="cat-pill">Comments</span>
    <span class="cat-pill">Data Platform</span>
  </div>
</div>

<!-- PRICING -->
<div class="section-alt" id="pricing">
  <div class="section">
    <div class="section-label">Pricing</div>
    <h2 class="section-title reveal">Simple. Honest. No surprises.</h2>
    <p class="section-sub reveal">Start free. Upgrade when you need more. Cancel anytime.</p>

    <!--
      TODO (sd-pricing): replace data-installs="—" with the live Chrome Web Store install count
      (e.g. "1,200+"). Found in the CWS dashboard. Until then this card just reads "Built for".
    -->
    <div class="pricing-stats reveal">
      <div class="pricing-stat">
        <div class="pricing-stat-num"><em>175<sup style="font-size:1rem;">+</sup></em></div>
        <div class="pricing-stat-label">Tool signatures</div>
      </div>
      <div class="pricing-stat">
        <div class="pricing-stat-num"><em>45<sup style="font-size:1rem;">+</sup></em></div>
        <div class="pricing-stat-label">Categories detected</div>
      </div>
      <div class="pricing-stat">
        <div class="pricing-stat-num"><em>100%</em></div>
        <div class="pricing-stat-label">Client-side &amp; private</div>
      </div>
      <div class="pricing-stat" data-installs="—">
        <div class="pricing-stat-num">Founders<br>&amp; sales</div>
        <div class="pricing-stat-label">Built for</div>
      </div>
    </div>

    <div class="pricing-grid">

      <!-- FREE -->
      <div class="plan reveal">
        <div class="plan-name">Free</div>
        <div class="plan-price"><sup>$</sup>0</div>
        <div class="plan-period">forever</div>
        <p class="plan-desc">Detect the 50 most common tools on any website. No account, no credit card, no catch.</p>
        <ul class="plan-features">
          <li><span class="check">✓</span> <span>50 tool signatures</span></li>
          <li><span class="check">✓</span> <span>All 45+ categories visible</span></li>
          <li><span class="check">✓</span> <span>Tool descriptions</span></li>
          <li><span class="check">✓</span> <span>Competitor alternatives</span></li>
          <li><span class="check">✓</span> <span>One-click visit links</span></li>
          <li><span class="cross">—</span> <span>Full 175+ tool library</span></li>
        </ul>
        <a href="https://chromewebstore.google.com/detail/saas-detective/efnmaomojnnbkmbhkokoflhogjphegpj" target="_blank" rel="noopener" class="btn-plan btn-plan-free">Add to Chrome — Free</a>
      </div>

      <!-- PRO MONTHLY -->
      <div class="plan reveal">
        <div class="plan-name">Pro · Monthly</div>
        <div class="plan-price"><sup>$</sup>7<span style="font-size:1.4rem;">.99</span></div>
        <div class="plan-period">per month · cancel anytime</div>
        <p class="plan-desc">Full access to every signature. No commitment, cancel whenever.</p>
        <ul class="plan-features">
          <li><span class="check">✓</span> <span><strong>175+ tool signatures</strong></span></li>
          <li><span class="check">✓</span> <span>All 45+ categories</span></li>
          <li><span class="check">✓</span> <span>Tool descriptions + alternatives</span></li>
          <li><span class="check">✓</span> <span>One-click visit links</span></li>
          <li><span class="check">✓</span> <span>Priority support</span></li>
          <li><span class="check">✓</span> <span>All future signatures</span></li>
        </ul>
        <a href="https://buy.stripe.com/aFaaEZ76edBi8aQ5wD1Jm00" target="_blank" rel="noopener" class="btn-plan btn-plan-pro" data-stripe-checkout data-plan="monthly" data-price="7.99">Get Pro — $7.99/mo</a>
      </div>

      <!-- PRO ANNUAL -->
      <div class="plan featured reveal">
        <div class="plan-badge">Best Value</div>
        <div class="plan-name">Pro · Annual</div>
        <div class="plan-price"><sup>$</sup>59<span style="font-size:1.4rem;">.99</span></div>
        <div class="plan-period">per year · one-time charge</div>
        <div class="plan-save">Save 37% — $5/mo equivalent</div>
        <p class="plan-desc">Everything in Pro. Best price. One payment, full year of access.</p>
        <ul class="plan-features">
          <li><span class="check">✓</span> <span><strong>175+ tool signatures</strong></span></li>
          <li><span class="check">✓</span> <span>All 45+ categories</span></li>
          <li><span class="check">✓</span> <span>Tool descriptions + alternatives</span></li>
          <li><span class="check">✓</span> <span>One-click visit links</span></li>
          <li><span class="check">✓</span> <span>Priority support</span></li>
          <li><span class="check">✓</span> <span>All future signatures</span></li>
        </ul>
        <a href="https://buy.stripe.com/8x2bJ3bmu8gYgHm1gn1Jm06" target="_blank" rel="noopener" class="btn-plan btn-plan-pro" data-stripe-checkout data-plan="yearly" data-price="59.99">Get Pro — $59.99/yr</a>
        <p class="plan-note">License key delivered instantly to your email.</p>
      </div>

    </div>
    <p class="pricing-sub">Also available: <a href="https://buy.stripe.com/3cIdRb76e9l28aQcZ51Jm04" data-stripe-checkout data-plan="3month" data-price="19.99">3-month ($19.99)</a> · <a href="https://buy.stripe.com/6oU00lduC54M0Io5wD1Jm05" data-stripe-checkout data-plan="6month" data-price="34.99">6-month ($34.99)</a> &nbsp;·&nbsp; Payments secured by Stripe &nbsp;·&nbsp; License key delivered instantly</p>

    <div class="trial-cta-card reveal" id="trialCard">
      <div class="trial-cta-text">
        <h3>Not sure yet? Try Pro free for 7 days.</h3>
        <p>Full access to all 175+ signatures. No credit card. We'll email your key.</p>
      </div>
      <form class="trial-form" id="trialForm" novalidate>
        <input type="email" id="trialEmail" placeholder="you@company.com" required autocomplete="email" />
        <button type="submit" id="trialSubmit">Start free trial</button>
      </form>
      <div class="trial-error" id="trialError"></div>
      <div class="trial-result" id="trialResult">
        <h3 style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.25rem;margin:0 0 4px;">Your trial is active.</h3>
        <p style="font-size:.85rem;color:var(--muted);margin:0;">7 days of full Pro access. Save this key — we've also sent it to your inbox.</p>
        <div class="trial-result-key" id="trialResultKey">—</div>
        <p class="trial-result-steps">Open the SaaS Detective extension → Options → paste your key → Activate.</p>
      </div>
    </div>

    <div class="compare-wrap reveal">
      <div class="compare-title">What you get</div>
      <table class="compare-table">
        <thead>
          <tr>
            <th class="col-feature">Feature</th>
            <th class="col-free">Free</th>
            <th class="col-pro">Pro</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Tool signatures detected</td><td class="cell-value dim">50 most common</td><td class="cell-value"><strong>All 175+</strong></td></tr>
          <tr><td>Categories covered</td><td class="cell-value">45+</td><td class="cell-value">45+</td></tr>
          <tr><td>One-click visit links</td><td class="cell-value"><span class="compare-check">✓</span></td><td class="cell-value"><span class="compare-check">✓</span></td></tr>
          <tr><td>Tool descriptions &amp; alternatives</td><td class="cell-value"><span class="compare-check">✓</span></td><td class="cell-value"><span class="compare-check">✓</span></td></tr>
          <tr><td>CRM, A/B testing, sales intel signatures</td><td class="cell-value"><span class="compare-cross">—</span></td><td class="cell-value"><span class="compare-check">✓</span></td></tr>
          <tr><td>Customer success, native ads, compliance</td><td class="cell-value"><span class="compare-cross">—</span></td><td class="cell-value"><span class="compare-check">✓</span></td></tr>
          <tr><td>All future signature additions</td><td class="cell-value"><span class="compare-cross">—</span></td><td class="cell-value"><span class="compare-check">✓</span></td></tr>
          <tr><td>Priority support</td><td class="cell-value"><span class="compare-cross">—</span></td><td class="cell-value"><span class="compare-check">✓</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- FAQ -->
<div class="section">
  <div class="section-label">FAQ</div>
  <h2 class="section-title reveal">Common questions.</h2>
  <div class="faq-list">
    <div class="faq-item">
      <button class="faq-q" aria-expanded="false">How does SaaS Detective detect tools? <span class="faq-arrow">▾</span></button>
      <div class="faq-a">SaaS Detective runs a two-pass scan entirely in your browser. First it checks the page HTML for known script patterns and URLs. Then it injects a sandboxed script to check JavaScript global variables. Nothing leaves your device — no page data is ever sent to our servers.</div>
    </div>
    <div class="faq-item">
      <button class="faq-q" aria-expanded="false">Does it work on every website? <span class="faq-arrow">▾</span></button>
      <div class="faq-a">It works on the vast majority of public websites. Some sites with strict Content Security Policies may limit the JavaScript global variable check, but the HTML pattern scan always runs. Detection accuracy is high across all major platforms.</div>
    </div>
    <div class="faq-item">
      <button class="faq-q" aria-expanded="false">Is my browsing data private? <span class="faq-arrow">▾</span></button>
      <div class="faq-a">Yes — completely. All scanning is client-side. We never transmit, log, or store which sites you visit. The only network request SaaS Detective makes is license validation (Pro users only) — and that only sends your license key, nothing about the sites you visit.</div>
    </div>
    <div class="faq-item">
      <button class="faq-q" aria-expanded="false">What's the difference between Free and Pro? <span class="faq-arrow">▾</span></button>
      <div class="faq-a">Free detects the 50 most common tools — covering the basics like Google Analytics, Shopify, React, Stripe, HubSpot, and more. Pro unlocks all 175+ signatures, including every category: CRM, A/B testing, customer success, sales intelligence, native ads, compliance tools, and everything we add in future updates.</div>
    </div>
    <div class="faq-item">
      <button class="faq-q" aria-expanded="false">How do I get my license key? <span class="faq-arrow">▾</span></button>
      <div class="faq-a">After checkout via Stripe, your license key is delivered instantly to your email. Open the SaaS Detective extension, click Options, paste the key in the License Key field, and hit Activate. Takes about 10 seconds.</div>
    </div>
    <div class="faq-item">
      <button class="faq-q" aria-expanded="false">Can I cancel? <span class="faq-arrow">▾</span></button>
      <div class="faq-a">Monthly Pro can be cancelled anytime from your Stripe billing portal — no questions asked. The 3-month, 6-month, and annual plans are one-time charges with no recurring billing, so there's nothing to cancel. Your access is active for the full period you paid for.</div>
    </div>
  </div>
</div>

<!-- BLOG TEASER -->
<div class="blog-teaser">
  <div class="blog-teaser-header reveal">
    <div class="blog-teaser-header-text">
      <div class="section-label">From the blog</div>
      <h2 class="section-title">Deeper reads on tech-stack research.</h2>
      <p class="section-sub">Real data, real comparisons, and the exact playbooks behind every signature in the extension.</p>
    </div>
    <a href="/blog" class="blog-teaser-all">All posts →</a>
  </div>
  <div class="blog-teaser-grid">
    <a href="/blog/framer-vs-webflow-2026" class="blog-teaser-card reveal">
      <div class="blog-teaser-meta"><span class="blog-teaser-tag">Featured</span><span>May 6, 2026 · 9 min</span></div>
      <h3 class="blog-teaser-title">Framer vs Webflow in 2026: We Scanned 1,000+ Sites and the Data Is Clear</h3>
      <p class="blog-teaser-excerpt">One builder is quietly winning the market, the other is bleeding share. The numbers behind the no-code debate.</p>
      <span class="blog-teaser-cta">Read the breakdown →</span>
    </a>
    <a href="/blog/founder-stack-2026" class="blog-teaser-card reveal">
      <div class="blog-teaser-meta"><span class="blog-teaser-tag">Tools</span><span>May 6, 2026 · 11 min</span></div>
      <h3 class="blog-teaser-title">The Lean Founder Stack 2026: 10 Tools Under $100/mo</h3>
      <p class="blog-teaser-excerpt">The exact 10-tool stack winning for indie SaaS founders right now — and what each tool costs.</p>
      <span class="blog-teaser-cta">Read the stack →</span>
    </a>
    <a href="/blog/best-chrome-extensions-tech-stack.html" class="blog-teaser-card reveal">
      <div class="blog-teaser-meta"><span class="blog-teaser-tag">Tools</span><span>May 2, 2026 · 9 min</span></div>
      <h3 class="blog-teaser-title">Best Chrome Extensions for Researching Tech Stacks</h3>
      <p class="blog-teaser-excerpt">A ranked comparison of every extension that does tech-stack detection — what each catches and which to trust.</p>
      <span class="blog-teaser-cta">Read the ranking →</span>
    </a>
  </div>
</div>

<!-- FINAL CTA -->
<div class="final-cta">
  <div class="final-glow"></div>
  <div class="section-label">Get started</div>
  <h2 class="section-title reveal">Your competitors are using tools<br/><em>you don't know about yet.</em></h2>
  <p class="reveal">Start detecting their stack for free. No account required.</p>
  <div class="final-actions reveal">
    <a href="https://chromewebstore.google.com/detail/saas-detective/efnmaomojnnbkmbhkokoflhogjphegpj" target="_blank" rel="noopener" class="btn-cta">Add to Chrome — It's Free</a>
    <a href="#pricing" class="btn-outline">See Pricing</a>
  </div>
</div>

${FOOTER}

<script>
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-q').setAttribute('aria-expanded','false'); });
      if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
    });
  });
</script>
<script>
  (function () {
    var TRACK_URL = 'https://saas-detective-licensing.kubegrayson.workers.dev/track';
    var KEY = 'sd_ga_client_id';
    var clientId;
    try {
      clientId = localStorage.getItem(KEY);
      if (!clientId) {
        clientId = Math.random().toString(36).slice(2) + '.' + Date.now();
        localStorage.setItem(KEY, clientId);
      }
    } catch (_) {
      clientId = 'anon.' + Date.now();
    }
    var TRIAL_URL = 'https://saas-detective-licensing.kubegrayson.workers.dev/trial/start';
    var trialForm = document.getElementById('trialForm');
    if (trialForm) {
      trialForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = (document.getElementById('trialEmail').value || '').trim();
        var btn = document.getElementById('trialSubmit');
        var errorEl = document.getElementById('trialError');
        errorEl.classList.remove('show');
        if (!email || email.indexOf('@') < 0) {
          errorEl.textContent = 'Please enter a valid email.';
          errorEl.classList.add('show');
          return;
        }
        btn.disabled = true;
        btn.textContent = 'Starting…';
        try {
          var res = await fetch(TRIAL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, client_id: clientId }),
          });
          var data = await res.json().catch(function () { return {}; });
          if (res.ok && data.ok && data.key) {
            document.getElementById('trialResultKey').textContent = data.key;
            document.getElementById('trialCard').classList.add('has-result');
            trialForm.style.display = 'none';
            document.getElementById('trialResult').classList.add('show');
            try {
              fetch(TRACK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: clientId, events: [{ name: 'trial_form_submitted', params: { location: 'marketing_site', email_sent: data.email_sent ? 1 : 0 } }] }),
                keepalive: true,
              });
            } catch (_) {}
          } else if (res.status === 409) {
            errorEl.textContent = 'A trial has already been issued for this email. Check your inbox or contact support.';
            errorEl.classList.add('show');
          } else {
            errorEl.textContent = (data && data.error) ? data.error : 'Could not start trial. Please try again.';
            errorEl.classList.add('show');
          }
        } catch (_) {
          errorEl.textContent = 'Network error. Please try again.';
          errorEl.classList.add('show');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Start free trial';
        }
      });
    }
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[data-stripe-checkout]');
      if (!a) return;
      try {
        var u = new URL(a.href);
        if (!u.searchParams.get('client_reference_id')) {
          u.searchParams.set('client_reference_id', clientId);
          a.href = u.toString();
        }
      } catch (_) {}
      var params = {
        plan: a.getAttribute('data-plan') || 'unknown',
        price: a.getAttribute('data-price') || '',
        location: 'marketing_site'
      };
      try {
        fetch(TRACK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, events: [{ name: 'begin_checkout', params: params }] }),
          keepalive: true
        });
      } catch (_) {}
    }, true);
  })();
</script>
${NAV_SCRIPT}
</body>
</html>`;

// ─────────────────────────────────────────────
// PAGE: ABOUT
// ─────────────────────────────────────────────

const ABOUT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>About — Venom Industries</title>
  <meta name="description" content="Venom Industries is an indie software company building intelligence tools for founders, marketers, and sales teams." />
  ${FONTS}
  <style>
    ${BASE_CSS}
    .page-hero {
      position: relative; z-index: 1;
      padding: 160px 48px 100px; max-width: 1100px; margin: 0 auto;
    }
    .page-hero h1 {
      font-family: 'Syne', sans-serif; font-weight: 800;
      font-size: clamp(2.4rem, 5vw, 4rem);
      letter-spacing: -0.03em; line-height: 1.06; margin-bottom: 24px;
      max-width: 700px; animation: fadeUp 0.5s ease both;
    }
    h1 em { font-style: normal; color: var(--accent); }
    .page-hero p {
      font-size: 1.1rem; color: var(--muted); line-height: 1.75;
      max-width: 540px; font-weight: 300;
      animation: fadeUp 0.5s 0.1s ease both;
    }
    .about-body { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 0 48px 120px; }
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; margin-bottom: 80px; }
    .about-text h2 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.8rem; letter-spacing: -0.02em; margin-bottom: 20px; }
    .about-text p { font-size: 0.92rem; color: var(--muted); line-height: 1.8; margin-bottom: 16px; font-weight: 300; }
    .about-text p strong { color: var(--text); font-weight: 600; }
    .values-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 36px;
    }
    .values-title { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 24px; }
    .value-item { padding: 16px 0; border-bottom: 1px solid var(--border); }
    .value-item:last-child { border-bottom: none; padding-bottom: 0; }
    .value-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: var(--text); }
    .value-desc { font-size: 0.83rem; color: var(--muted); line-height: 1.65; }
    .divider { border: none; border-top: 1px solid var(--border); margin: 64px 0; }
    .contact-section h2 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.8rem; letter-spacing: -0.02em; margin-bottom: 16px; }
    .contact-section p { font-size: 0.92rem; color: var(--muted); line-height: 1.75; max-width: 480px; font-weight: 300; margin-bottom: 24px; }
    .contact-link {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: 'DM Mono', monospace; font-size: 0.78rem; font-weight: 500;
      letter-spacing: 0.06em; color: var(--accent); border: 1px solid rgba(200,241,53,0.25);
      background: var(--accent-dim); padding: 12px 20px; border-radius: 7px;
      transition: background 0.2s;
    }
    .contact-link:hover { background: rgba(200,241,53,0.15); }
    @media (max-width: 768px) {
      .page-hero { padding: 140px 24px 60px; }
      .about-body { padding: 0 24px 80px; }
      .about-grid { grid-template-columns: 1fr; gap: 40px; }
    }
  </style>
</head>
<body>
${NAV('about')}

<div class="page-hero">
  <div class="section-label">About us</div>
  <h1>We build software for people who play to <em>win.</em></h1>
  <p>Venom Industries is an indie software company. We build sharp, focused tools that give founders, marketers, and sales teams an information edge over the competition.</p>
</div>

<div class="about-body">
  <div class="about-grid">
    <div class="about-text reveal">
      <h2>Why we exist</h2>
      <p>Information asymmetry is the most valuable edge in business. The people who know more — about their competitors, their prospects, the market — win more. That's not a theory. It's just how business works.</p>
      <p>Most of that intelligence is sitting right there on the open web. Every website your competitor runs tells you exactly <strong>what they're investing in, what's working, and how they operate.</strong> The problem is nobody has time to manually dig through it.</p>
      <p>We automate that. We build tools that surface the signal instantly — so you can stop operating on gut instinct and start making decisions based on real data.</p>
      <p>We're not a venture-backed startup optimizing for hockey-stick growth metrics. We're an independent company that builds software we'd want to use ourselves, prices it honestly, and supports customers like humans.</p>
    </div>
    <div class="values-card reveal">
      <div class="values-title">What we believe</div>
      <div class="value-item">
        <div class="value-name">Software should do one thing extremely well</div>
        <div class="value-desc">We'd rather ship one sharp tool than a bloated platform. Focus compounds.</div>
      </div>
      <div class="value-item">
        <div class="value-name">Privacy is non-negotiable</div>
        <div class="value-desc">We build products where user data stays with the user. Your browsing is yours. Always.</div>
      </div>
      <div class="value-item">
        <div class="value-name">Honest pricing, no tricks</div>
        <div class="value-desc">No fake discounts, no dark patterns. You see what it costs. You decide. Done.</div>
      </div>
      <div class="value-item">
        <div class="value-name">Ship fast, support well</div>
        <div class="value-desc">Small team means short feedback loops. When something breaks or something's needed, we move.</div>
      </div>
    </div>
  </div>

  <hr class="divider" />

  <div class="contact-section reveal">
    <h2>Get in touch</h2>
    <p>Questions about a product, a license issue, a partnership, or just want to say hi — we actually read and respond to email.</p>
    <a href="mailto:grayson@venom-industries.com" class="contact-link">grayson@venom-industries.com →</a>
  </div>
</div>

${FOOTER}
${NAV_SCRIPT}
</body>
</html>`;

// ─────────────────────────────────────────────
// PAGE: PRIVACY
// ─────────────────────────────────────────────

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — Venom Industries</title>
  ${FONTS}
  <style>
    ${BASE_CSS}
    .doc-page { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 160px 48px 120px; }
    .doc-page h1 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2.4rem; letter-spacing: -0.03em; margin-bottom: 8px; }
    .doc-date { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: var(--muted); margin-bottom: 48px; }
    .doc-page h2 { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.2rem; margin: 40px 0 12px; }
    .doc-page p, .doc-page li { font-size: 0.9rem; color: var(--muted); line-height: 1.8; margin-bottom: 12px; }
    .doc-page ul { padding-left: 20px; margin-bottom: 12px; }
    .doc-page strong { color: var(--text); }
    @media (max-width: 768px) { .doc-page { padding: 140px 24px 80px; } }
  </style>
</head>
<body>
${NAV('')}
<div class="doc-page">
  <h1>Privacy Policy</h1>
  <div class="doc-date">Last updated: May 2026 &nbsp;·&nbsp; Venom Industries LLC</div>

  <p>SaaS Detective is built with privacy as a core design principle, not an afterthought. This policy explains exactly what we collect, why, and what we never do.</p>

  <h2>1. What we do NOT collect</h2>
  <ul>
    <li>We do <strong>not</strong> collect, store, or transmit your browsing history.</li>
    <li>We do <strong>not</strong> record which websites you visit or what tools they use.</li>
    <li>We do <strong>not</strong> collect your name, email address, or any personally identifying information unless you voluntarily provide it (e.g., for a Pro license purchase).</li>
    <li>We do <strong>not</strong> sell any data to any third party. Ever.</li>
  </ul>

  <h2>2. How detection works</h2>
  <p>All technology detection happens <strong>entirely within your browser</strong> on the active tab. When you click the SaaS Detective icon, the extension scans the current page's HTML and JavaScript — locally, on your device — using bundled signature definitions. No page content is transmitted to any external server.</p>

  <h2>3. Anonymous analytics</h2>
  <p>To improve the extension, we collect anonymous, non-personal usage events such as:</p>
  <ul>
    <li>Extension install and update events</li>
    <li>Scan completion events (tool count only — not which sites or tools)</li>
    <li>Feature interactions (button clicks, upgrade prompts)</li>
  </ul>
  <p>These events are tied to a randomly generated, non-identifiable client ID stored locally on your device. This ID cannot be used to identify you or linked to your browsing activity. Analytics are sent to a Cloudflare Workers endpoint operated by Venom Industries LLC.</p>

  <h2>4. License validation (Pro users only)</h2>
  <p>If you have a Pro license, the extension periodically sends your license key to our validation server to confirm it remains active. No browsing data, no page content, and no personally identifying information is included in this request.</p>

  <h2>5. Permissions explained</h2>
  <ul>
    <li><strong>activeTab</strong> — Grants temporary access to the current page only when you click the extension icon. Required for scanning.</li>
    <li><strong>scripting</strong> — Allows the extension to inject a detection script into the active tab. Required for JavaScript global variable detection.</li>
    <li><strong>storage</strong> — Saves your category preferences and license status locally. Nothing is shared.</li>
    <li><strong>alarms</strong> — Used for periodic license revalidation (Pro only). No browsing data involved.</li>
    <li><strong>host_permissions (http/https)</strong> — Required for the extension to scan any website you choose to visit.</li>
  </ul>

  <h2>6. GDPR / EU users</h2>
  <p>Because we do not collect personal data, Venom Industries LLC does not act as a data processor under GDPR with respect to SaaS Detective's core functionality. The anonymous client ID stored locally on your device is not considered personal data as it cannot identify you.</p>

  <h2>7. Contact</h2>
  <p>Questions about this policy: <a href="mailto:grayson@venom-industries.com" style="color:var(--accent);">grayson@venom-industries.com</a></p>
</div>
${FOOTER}
${NAV_SCRIPT}
</body>
</html>`;

// ─────────────────────────────────────────────
// PAGE: TERMS
// ─────────────────────────────────────────────

const TERMS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Terms of Service — Venom Industries</title>
  ${FONTS}
  <style>
    ${BASE_CSS}
    .doc-page { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 160px 48px 120px; }
    .doc-page h1 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2.4rem; letter-spacing: -0.03em; margin-bottom: 8px; }
    .doc-date { font-family: 'DM Mono', monospace; font-size: 0.68rem; color: var(--muted); margin-bottom: 48px; }
    .doc-page h2 { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.2rem; margin: 40px 0 12px; }
    .doc-page p, .doc-page li { font-size: 0.9rem; color: var(--muted); line-height: 1.8; margin-bottom: 12px; }
    .doc-page ul { padding-left: 20px; margin-bottom: 12px; }
    .doc-page strong { color: var(--text); }
    @media (max-width: 768px) { .doc-page { padding: 140px 24px 80px; } }
  </style>
</head>
<body>
${NAV('')}
<div class="doc-page">
  <h1>Terms of Service</h1>
  <div class="doc-date">Last updated: May 2026 &nbsp;·&nbsp; Venom Industries LLC</div>

  <p>By installing or using SaaS Detective ("the Extension"), you agree to the following terms. If you do not agree, do not use the Extension.</p>

  <h2>1. License to use</h2>
  <p>Venom Industries LLC grants you a personal, non-exclusive, non-transferable license to use SaaS Detective for your own lawful purposes. You may not resell, sublicense, or redistribute the Extension or your Pro license key.</p>

  <h2>2. Acceptable use</h2>
  <p>You agree to use the Extension only on websites you are authorized to access. You may not use SaaS Detective to facilitate unauthorized access, automated scraping at scale, or any activity that violates applicable law.</p>

  <h2>3. "As-is" disclaimer</h2>
  <p>The Extension is provided "AS IS" without warranty of any kind. Websites change frequently — detection accuracy is not guaranteed for all sites at all times. Venom Industries LLC makes no representations about the completeness or accuracy of results.</p>

  <h2>4. Pro licenses</h2>
  <p>Pro license keys are for individual use only. Sharing license keys is prohibited. Venom Industries LLC reserves the right to revoke keys used in violation of these terms without refund.</p>
  <p>Monthly plans may be cancelled at any time via your Stripe billing portal. 3-month, 6-month, and annual plans are one-time charges — access is active for the full paid period with no recurring billing.</p>

  <h2>4. Limitation of liability</h2>
  <p>To the maximum extent permitted by law, Venom Industries LLC shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Extension or reliance on its results.</p>

  <h2>5. Governing law</h2>
  <p>These terms are governed by the laws of the United States.</p>

  <h2>6. Changes</h2>
  <p>We may update these terms occasionally. Continued use of the Extension after changes constitutes acceptance of the updated terms.</p>

  <h2>7. Contact</h2>
  <p><a href="mailto:grayson@venom-industries.com" style="color:var(--accent);">grayson@venom-industries.com</a></p>
</div>
${FOOTER}
${NAV_SCRIPT}
</body>
</html>`;

// ─────────────────────────────────────────────
// WORKER ROUTER
// ─────────────────────────────────────────────

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (path === '/')                return html(HOME_HTML);
    if (path === '/saas-detective')  return html(SD_HTML);
    if (path === '/about')           return html(ABOUT_HTML);
    if (path === '/privacy')         return html(PRIVACY_HTML);
    if (path === '/terms')           return html(TERMS_HTML);

    // Legacy redirects
    if (path === '/SaaS-Detective' || path === '/SaaS-Detective-') {
      return Response.redirect('https://venom-industries.com/saas-detective', 301);
    }
    if (path === '/privacy.html')    return Response.redirect('https://venom-industries.com/privacy', 301);
    if (path === '/terms.html')      return Response.redirect('https://venom-industries.com/terms', 301);

    return new Response('Not Found', { status: 404 });
  }
};
