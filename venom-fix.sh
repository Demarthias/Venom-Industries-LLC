#!/usr/bin/env bash
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        VENOM AUDIT — AUTO-FIX SCRIPT         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

replace_in_html() {
  find . -name "*.html" -not -path "./.git/*" | while read -r file; do
    sed -i.bak "s|$1|$2|g" "$file" && rm -f "$file.bak"
  done
}

echo "▶ 1 — Fixing contact.html → contact/ in all HTML files..."
replace_in_html "contact\.html" "contact/"
echo "   ✓"

echo "▶ 2 — Fixing blog post links..."
python3 - <<'PYEOF'
import re, glob

with open("blog.html", "r") as f:
    content = f.read()

content = re.sub(r'href="#"\s*>\s*(Read the full post)', r'href="blog/saas-debt.html">\1', content, flags=re.IGNORECASE)

def fix_read_link(match):
    full = match.group(0)
    low = full.lower()
    if "saas debt" in low or "hidden cost" in low: return full.replace('href="#"','href="blog/saas-debt.html"')
    elif "lcp" in low: return full.replace('href="#"','href="blog/lcp-lying.html"')
    elif "latency" in low or "gaming" in low: return full.replace('href="#"','href="blog/low-latency.html"')
    elif "ats" in low or "resume" in low or "invisible" in low: return full.replace('href="#"','href="blog/ats-resume.html"')
    elif "security" in low or "header" in low: return full.replace('href="#"','href="blog/security-headers.html"')
    elif "ping" in low or "jitter" in low: return full.replace('href="#"','href="blog/ping-jitter.html"')
    elif "detective" in low: return full.replace('href="#"','href="blog/saas-detective.html"')
    return full

content = re.sub(r'<a\b[^>]*href="#"[^>]*>[\s\S]{0,400}?(?=<a\b|</section|</div)', fix_read_link, content, flags=re.IGNORECASE)

with open("blog.html", "w") as f:
    f.write(content)
print("   ✓")
PYEOF

echo "▶ 3 — Rewriting sitemap..."
cat > ./sitemap.xml << 'SITEMAP'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://venom-industries.com/</loc><lastmod>2026-03-18</lastmod><priority>1.00</priority></url>
  <url><loc>https://venom-industries.com/audit.html</loc><lastmod>2026-03-18</lastmod><priority>0.90</priority></url>
  <url><loc>https://venom-industries.com/saas-detective.html</loc><lastmod>2026-03-18</lastmod><priority>0.85</priority></url>
  <url><loc>https://venom-industries.com/about/</loc><lastmod>2026-03-18</lastmod><priority>0.80</priority></url>
  <url><loc>https://venom-industries.com/blog.html</loc><lastmod>2026-03-18</lastmod><priority>0.80</priority></url>
  <url><loc>https://venom-industries.com/contact/</loc><lastmod>2026-03-18</lastmod><priority>0.75</priority></url>
  <url><loc>https://venom-industries.com/blog/saas-debt.html</loc><lastmod>2026-03-10</lastmod><priority>0.70</priority></url>
  <url><loc>https://venom-industries.com/blog/lcp-lying.html</loc><lastmod>2026-02-28</lastmod><priority>0.70</priority></url>
  <url><loc>https://venom-industries.com/blog/low-latency.html</loc><lastmod>2026-02-14</lastmod><priority>0.70</priority></url>
  <url><loc>https://venom-industries.com/blog/ats-resume.html</loc><lastmod>2026-01-31</lastmod><priority>0.70</priority></url>
  <url><loc>https://venom-industries.com/blog/security-headers.html</loc><lastmod>2026-01-18</lastmod><priority>0.70</priority></url>
  <url><loc>https://venom-industries.com/blog/ping-jitter.html</loc><lastmod>2026-01-05</lastmod><priority>0.70</priority></url>
  <url><loc>https://venom-industries.com/blog/saas-detective.html</loc><lastmod>2025-12-20</lastmod><priority>0.70</priority></url>
  <url><loc>https://venom-industries.com/privacy.html</loc><lastmod>2026-03-14</lastmod><priority>0.30</priority></url>
  <url><loc>https://venom-industries.com/terms.html</loc><lastmod>2026-03-14</lastmod><priority>0.30</priority></url>
</urlset>
SITEMAP
[ -f ./sitemaps.xml ] && rm ./sitemaps.xml
echo "   ✓"

echo "▶ 4 — Fixing email address..."
replace_in_html "kubegrayson@gmail\.com" "grayson@venom-industries.com"
echo "   ✓"

echo "▶ 5 — Fixing pricing..."
python3 - <<'PYEOF'
import re, glob

files = glob.glob('./**/*.html', recursive=True)
files = [f for f in files if '.git' not in f]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    original = content
    content = re.sub(r'\$1,500(?!\s*one-time|\s*/mo)', '$500', content)
    content = re.sub(r'\$3,500', '$1,500', content)
    content = re.sub(r'Book a Sprint Audit.*?\$500', 'Book a Sprint Audit — $500', content)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   Pricing fixed: {filepath}")
print("   ✓")
PYEOF

echo "▶ 6 — Adding OG/Twitter meta tags..."
python3 - <<'PYEOF'
import os

pages = {
    "index.html":          ("Venom Industries — Technical Audits for Agencies & SaaS Teams", "Performance, SEO, security, and code quality. Delivered in 5 days. No retainer required.", "https://venom-industries.com/"),
    "audit.html":          ("Venom-Audit — Complete Technical Site Audit in 5 Days", "Severity-tagged findings with exact fix instructions. From $500.", "https://venom-industries.com/audit.html"),
    "blog.html":           ("The Venom Blog — Performance, SEO & Security Writing", "Technical writing from real audits. No filler, no fluff.", "https://venom-industries.com/blog.html"),
    "saas-detective.html": ("SaaS Detective — Reveal Any Website's Tech Stack", "Free Chrome extension. 80+ tools. Runs entirely in your browser.", "https://venom-industries.com/saas-detective.html"),
    "privacy.html":        ("Privacy Policy — Venom Industries", "How Venom Industries handles your data.", "https://venom-industries.com/privacy.html"),
    "terms.html":          ("Terms of Service — Venom Industries", "Terms governing Venom Industries audits and services.", "https://venom-industries.com/terms.html"),
    "about/index.html":    ("About Venom Industries — Built by Grayson Kube", "Technical audit company built by a self-taught developer. One founder. Five days.", "https://venom-industries.com/about/"),
}

blog_pages = {
    "blog/saas-debt.html":          ("The Hidden Cost of SaaS Debt | Venom Blog", "Bloated toolchains and unaudited dependencies are draining your conversion rates.", "https://venom-industries.com/blog/saas-debt.html"),
    "blog/lcp-lying.html":          ("Why Your LCP Is Lying to You | Venom Blog", "Lab scores and field data diverge. Here's what PageSpeed Insights doesn't tell you.", "https://venom-industries.com/blog/lcp-lying.html"),
    "blog/low-latency.html":        ("Low Latency Is a Choice | Venom Blog", "Gaming companies treat ping as infrastructure. It's an architecture decision.", "https://venom-industries.com/blog/low-latency.html"),
    "blog/ats-resume.html":         ("Your ATS Resume Is Invisible | Venom Blog", "The same principles that make a site crawlable make a resume parseable.", "https://venom-industries.com/blog/ats-resume.html"),
    "blog/security-headers.html":   ("The 30-Minute Security Header Audit | Venom Blog", "4 headers. Under an hour. CSP, HSTS, X-Frame-Options, Referrer-Policy.", "https://venom-industries.com/blog/security-headers.html"),
    "blog/ping-jitter.html":        ("Fixing Ping & Jitter: A Deep Dive | Venom Blog", "Network latency optimization from TCP tuning to edge deployment.", "https://venom-industries.com/blog/ping-jitter.html"),
    "blog/saas-detective.html":     ("Introducing SaaS Detective | Venom Blog", "We built a Chrome extension that reveals any website's tech stack in one click.", "https://venom-industries.com/blog/saas-detective.html"),
}

all_pages = {**pages, **blog_pages}

for filepath, (title, desc, url) in all_pages.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'og:title' in content:
        continue
    og = f'''  <meta property="og:type" content="website"/>
  <meta property="og:title" content="{title}"/>
  <meta property="og:description" content="{desc}"/>
  <meta property="og:url" content="{url}"/>
  <meta property="og:image" content="https://venom-industries.com/assets/og-image.png"/>
  <meta property="og:site_name" content="Venom Industries"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="{title}"/>
  <meta name="twitter:description" content="{desc}"/>
  <meta name="twitter:image" content="https://venom-industries.com/assets/og-image.png"/>'''
    content = content.replace('</head>', og + '\n</head>', 1)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"   OG added: {filepath}")
print("   ✓")
PYEOF

echo "▶ 7 — Adding canonical tags..."
python3 - <<'PYEOF'
import os

pages = {
    "index.html": "https://venom-industries.com/",
    "audit.html": "https://venom-industries.com/audit.html",
    "blog.html": "https://venom-industries.com/blog.html",
    "saas-detective.html": "https://venom-industries.com/saas-detective.html",
    "privacy.html": "https://venom-industries.com/privacy.html",
    "terms.html": "https://venom-industries.com/terms.html",
    "about/index.html": "https://venom-industries.com/about/",
    "contact/index.html": "https://venom-industries.com/contact/",
    "blog/saas-debt.html": "https://venom-industries.com/blog/saas-debt.html",
    "blog/lcp-lying.html": "https://venom-industries.com/blog/lcp-lying.html",
    "blog/low-latency.html": "https://venom-industries.com/blog/low-latency.html",
    "blog/ats-resume.html": "https://venom-industries.com/blog/ats-resume.html",
    "blog/security-headers.html": "https://venom-industries.com/blog/security-headers.html",
    "blog/ping-jitter.html": "https://venom-industries.com/blog/ping-jitter.html",
    "blog/saas-detective.html": "https://venom-industries.com/blog/saas-detective.html",
}

for filepath, url in pages.items():
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'rel="canonical"' in content: continue
    content = content.replace('</head>', f'  <link rel="canonical" href="{url}"/>\n</head>', 1)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"   Canonical: {filepath}")
print("   ✓")
PYEOF

echo "▶ 8 — Adding JSON-LD to homepage..."
python3 - <<'PYEOF'
import json
filepath = "index.html"
with open(filepath, 'r') as f:
    content = f.read()
if 'application/ld+json' not in content:
    ld = {"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Venom Industries LLC","url":"https://venom-industries.com","foundingDate":"2025","founder":{"@type":"Person","name":"Grayson Kube"},"address":{"@type":"PostalAddress","addressRegion":"CO","addressCountry":"US"},"contactPoint":{"@type":"ContactPoint","email":"grayson@venom-industries.com","contactType":"customer service"}},{"@type":"WebSite","name":"Venom Industries","url":"https://venom-industries.com"},{"@type":"ProfessionalService","name":"Venom-Audit","description":"Technical site audit covering performance, SEO, security, and code quality. Delivered in 5 business days.","offers":[{"@type":"Offer","name":"Individual Audit","price":"100","priceCurrency":"USD"},{"@type":"Offer","name":"Sprint Audit","price":"500","priceCurrency":"USD"},{"@type":"Offer","name":"Full Audit","price":"1500","priceCurrency":"USD"}]}]}
    tag = f'\n  <script type="application/ld+json">\n{json.dumps(ld, indent=2)}\n  </script>'
    content = content.replace('</head>', tag + '\n</head>', 1)
    with open(filepath, 'w') as f:
        f.write(content)
    print("   ✓ JSON-LD added to index.html")
else:
    print("   Already present — skipping")
PYEOF

echo "▶ 9 — Cleaning Cloudflare Worker..."
WORKER_FILE=$(find ./workers -name "*.js" 2>/dev/null | head -1)
if [ -n "$WORKER_FILE" ]; then
cat > "$WORKER_FILE" << 'WORKEREOF'
/**
 * Venom Edge Core
 * Analytics logger — logs page data to Google Sheets.
 */
export default {
  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      try {
        const data = await request.json();
        await logToSheet(data, request, env);
        return new Response(JSON.stringify({ status: "logged" }), {
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    }
    return new Response("Venom Edge Online", { status: 200 });
  }
};
async function logToSheet(data, request, env) {
  const country = request.cf?.country || "XX";
  const city = request.cf?.city || "Unknown";
  const region = request.cf?.region || "Unknown";
  const rowValues = [new Date().toISOString(), data.email||"", country, city, region, data.utm_source||"", data.utm_medium||"", data.utm_campaign||"", data.path||"/", data.ref||"direct", data.title||"Unknown", data.screen||"", data.viewport||"", data.tz||"", request.headers.get("User-Agent")||""];
  const token = await getGoogleAuthToken(env);
  const range = `${env.GOOGLE_SHEETS_TAB||"Sheet1"}!A1`;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [rowValues] })
  });
  if (!res.ok) throw new Error(`Sheets error: ${await res.text()}`);
}
async function getGoogleAuthToken(env) {
  const pem = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: clientEmail, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now };
  const enc = s => btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  const sigInput = `${enc(JSON.stringify(header))}.${enc(JSON.stringify(claim))}`;
  const pemClean = pem.replace("-----BEGIN PRIVATE KEY-----","").replace("-----END PRIVATE KEY-----","").replace(/\s/g,"");
  const der = Uint8Array.from(atob(pemClean), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(sigInput));
  const jwt = `${sigInput}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) });
  return (await tokenRes.json()).access_token;
}
WORKEREOF
  echo "   ✓ Worker cleaned: $WORKER_FILE"
else
  echo "   ! No worker JS found — skipping"
fi

echo "▶ 10 — Writing README.md..."
[ -f ./README.TXT ] && rm ./README.TXT
cat > ./README.md << 'READMEEOF'
# Venom Industries LLC

**venom-industries.com** — Technical audits for agencies and SaaS teams.

## Services
- **Venom-Audit** — Performance, SEO, security, code quality. 5-day turnaround. From $500.
- **SaaS Detective** — Free Chrome extension. Reveals any site's tech stack in one click.

## Structure
```
/                    Homepage
/audit.html          Audit product page
/saas-detective.html SaaS Detective page
/blog.html           Blog index
/blog/               Blog posts
/about/              About
/contact/            Contact + booking
/workers/            Cloudflare Worker (analytics)
/assets/             Images + icons
```

## Contact
grayson@venom-industries.com
READMEEOF
echo "   ✓"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║              ALL FIXES APPLIED               ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  1  ✓  contact.html → contact/               ║"
echo "║  2  ✓  Blog links fixed                      ║"
echo "║  3  ✓  sitemap.xml rewritten                 ║"
echo "║  4  ✓  Gmail → grayson@venom-industries.com  ║"
echo "║  5  ✓  Pricing updated                       ║"
echo "║  6  ✓  OG + Twitter meta tags                ║"
echo "║  7  ✓  Canonical tags                        ║"
echo "║  8  ✓  JSON-LD on homepage                   ║"
echo "║  9  ✓  Affiliate links removed from worker   ║"
echo "║  10 ✓  README.md written                     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Now run:"
echo "  git add -A"
echo "  git commit -m \"fix: full audit fixes\""
echo "  git push"
echo ""
