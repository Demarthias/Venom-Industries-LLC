#!/usr/bin/env bash
# ============================================================
# venom-deploy.sh
# Run from the root of your Venom-Industries-LLC repo.
# ============================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        VENOM DEPLOY — CONTACT + PAGES        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Copy new contact page ──
echo "▶ 1 — Deploying new contact page..."
mkdir -p ./contact
cp ~/contact-index.html ./contact/index.html
echo "   ✓"

# ── 2. Copy thank you page ──
echo "▶ 2 — Deploying thank you page..."
cp ~/thankyou.html ./thankyou.html
echo "   ✓"

# ── 3. Fix audit.html nav link (was 404) ──
echo "▶ 3 — Fixing audit.html nav link..."
python3 - <<'PYEOF'
import os, glob

files = glob.glob('./**/*.html', recursive=True)
files = [f for f in files if '.git' not in f and os.path.isfile(f)]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    original = content
    # Fix any broken audit links
    content = content.replace('href="/audit"', 'href="/audit.html"')
    content = content.replace('href="audit"', 'href="/audit.html"')
    # Fix SaaS Detective links
    content = content.replace('href="/saas-detective"', 'href="/saas-detective.html"')
    content = content.replace('href="saas-detective"', 'href="/saas-detective.html"')
    # Fix software dev button that opens old payment link
    content = content.replace('href="/go/credit"', 'href="/contact/"')
    content = content.replace('href="/api/research-panel"', 'href="/contact/"')
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   Fixed links: {filepath}")
print("   ✓")
PYEOF

# ── 4. Fix privacy + terms to point to correct pages ──
echo "▶ 4 — Verifying privacy and terms links..."
python3 - <<'PYEOF'
import os, glob

files = glob.glob('./**/*.html', recursive=True)
files = [f for f in files if '.git' not in f and os.path.isfile(f)]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    original = content
    content = content.replace('href="/privacy"', 'href="/privacy.html"')
    content = content.replace('href="/terms"', 'href="/terms.html"')
    content = content.replace('href="privacy"', 'href="/privacy.html"')
    content = content.replace('href="terms"', 'href="/terms.html"')
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   Fixed: {filepath}")
print("   ✓")
PYEOF

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║              DEPLOY COMPLETE                 ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  1  ✓  New contact page with Stripe links    ║"
echo "║  2  ✓  Thank you page with auto-redirect     ║"
echo "║  3  ✓  Audit + SaaS Detective nav links      ║"
echo "║  4  ✓  Privacy + Terms links verified        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "IMPORTANT — Do this in Stripe dashboard:"
echo "  For each payment link → Settings → After payment"
echo "  Set redirect URL to: https://venom-industries.com/thankyou.html"
echo ""
echo "Now run:"
echo "  git add -A && git commit -m 'feat: new contact page, Stripe links, thank you page' && git push"
echo ""
