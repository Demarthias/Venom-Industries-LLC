#!/usr/bin/env bash
# ============================================================
# venom-pages.sh
# Run from root of Venom-Industries-LLC repo.
# Replaces stale pages + fixes all nav links sitewide.
# ============================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         VENOM — PAGE REPLACEMENT DEPLOY      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Replace thankyou.html with version that has intake form ──
echo "▶ 1 — Deploying thank you + intake form..."
cp ~/thankyou-v2.html ./thankyou.html
echo "   ✓"

# ── 2. Fix all nav links sitewide ──
echo "▶ 2 — Fixing all nav + CTA links sitewide..."
python3 - <<'PYEOF'
import os, re, glob

files = glob.glob('./**/*.html', recursive=True)
files = [f for f in files if '.git' not in f and os.path.isfile(f)]

fixes = {
    # contact
    'href="contact.html"':          'href="/contact/"',
    'href="/contact.html"':         'href="/contact/"',
    'href="../contact.html"':       'href="/contact/"',
    # audit
    'href="audit.html"':            'href="/audit.html"',
    'href="../audit.html"':         'href="/audit.html"',
    # blog
    'href="blog.html"':             'href="/blog.html"',
    'href="../blog.html"':          'href="/blog.html"',
    # about
    'href="about/"':                'href="/about/"',
    'href="../about/"':             'href="/about/"',
    # saas detective
    'href="saas-detective.html"':   'href="/saas-detective.html"',
    'href="../saas-detective.html"':'href="/saas-detective.html"',
    # privacy / terms
    'href="privacy.html"':          'href="/privacy.html"',
    'href="../privacy.html"':       'href="/privacy.html"',
    'href="terms.html"':            'href="/terms.html"',
    'href="../terms.html"':         'href="/terms.html"',
    # old affiliate paths
    'href="/go/credit"':            'href="/contact/"',
    'href="/go/proton"':            'href="/contact/"',
    'href="/api/research-panel"':   'href="/contact/"',
    # old pricing
    '$1,500':                       '$500',
    '$3,500':                       '$1,500',
    '50% deposit to book':          'Full payment via Stripe',
    'Balance due on delivery':      '',
    'Book a Sprint Audit — $1,500': 'Book a Sprint Audit — $500',
    'Book a call':                  'Book an audit',
}

changed = 0
for filepath in files:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    original = content
    for old, new in fixes.items():
        content = content.replace(old, new)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        changed += 1
        print(f"   Fixed: {filepath}")

print(f"\n   {changed} files updated ✓")
PYEOF

echo "   ✓"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║              DEPLOY COMPLETE                 ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  1  ✓  Thank you page + intake form          ║"
echo "║  2  ✓  All nav + CTA links fixed sitewide    ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  MANUAL STEP REQUIRED:                       ║"
echo "║  → Set YOUR_FORMSPREE_ID in thankyou.html    ║"
echo "║    Get it free at formspree.io               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Now run:"
echo "  git add -A && git commit -m 'feat: intake form, fix all nav links + pricing' && git push"
echo ""
