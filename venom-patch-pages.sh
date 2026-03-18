#!/usr/bin/env bash
# venom-patch-pages.sh
# Patches nav + footer on audit.html and saas-detective.html
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        VENOM — PATCH AUDIT + SAAS PAGES      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

python3 - <<'PYEOF'
import re

NEW_NAV = '''  <!-- NAV -->
  <nav id="vnav" style="position:fixed;top:0;left:0;right:0;z-index:500;background:rgba(6,6,8,.88);backdrop-filter:blur(24px);border-bottom:1px solid #1c1c26;transition:background .3s;">
    <div id="vp" style="position:absolute;top:0;left:0;height:2px;width:0;background:linear-gradient(90deg,#b8ff00,rgba(184,255,0,.4));z-index:1;"></div>
    <div style="display:flex;align-items:center;height:64px;max-width:1160px;margin:0 auto;padding:0 2rem;gap:2rem;">
      <a href="/index.html" style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:1.2rem;letter-spacing:.1em;text-transform:uppercase;color:#f0f0fa;text-decoration:none;flex-shrink:0;">VENOM<span style="color:#b8ff00;">.</span>INDUSTRIES</a>
      <ul style="display:flex;align-items:center;gap:2rem;list-style:none;flex:1;" class="venom-nlinks">
        <li><a href="/index.html" style="font-family:'Rajdhani',sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#52526e;text-decoration:none;transition:color .2s;" onmouseover="this.style.color='#f0f0fa'" onmouseout="this.style.color='#52526e'">Home</a></li>
        <li><a href="/audit.html" style="font-family:'Rajdhani',sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#52526e;text-decoration:none;transition:color .2s;" onmouseover="this.style.color='#f0f0fa'" onmouseout="this.style.color='#52526e'">Audit</a></li>
        <li><a href="/blog.html" style="font-family:'Rajdhani',sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#52526e;text-decoration:none;transition:color .2s;" onmouseover="this.style.color='#f0f0fa'" onmouseout="this.style.color='#52526e'">Blog</a></li>
        <li><a href="/about/" style="font-family:'Rajdhani',sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#52526e;text-decoration:none;transition:color .2s;" onmouseover="this.style.color='#f0f0fa'" onmouseout="this.style.color='#52526e'">About</a></li>
        <li><a href="/saas-detective.html" style="font-family:'Rajdhani',sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#52526e;text-decoration:none;transition:color .2s;" onmouseover="this.style.color='#f0f0fa'" onmouseout="this.style.color='#52526e'">SaaS Detective</a></li>
      </ul>
      <div style="margin-left:auto;">
        <a href="/contact/" style="background:#b8ff00;color:#060608;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;padding:.45rem 1.2rem;border-radius:2px;text-decoration:none;transition:all .2s;white-space:nowrap;cursor:none;" onmouseover="this.style.background='#f0f0fa'" onmouseout="this.style.background='#b8ff00'">Book an audit</a>
      </div>
    </div>
  </nav>'''

NEW_FOOTER = '''  <!-- FOOTER -->
  <footer style="border-top:1px solid #1c1c26;padding:3rem 0;margin-top:4rem;">
    <div style="max-width:1160px;margin:0 auto;padding:0 2rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;color:#52526e;font-size:.78rem;flex-wrap:wrap;gap:1rem;">
        <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:1rem;letter-spacing:.1em;color:#f0f0fa;">VENOM<span style="color:#b8ff00;">.</span>INDUSTRIES</span>
        <span>© 2026 Venom Industries LLC · Colorado, USA</span>
        <span>
          <a href="/audit.html" style="color:#52526e;margin-right:1.5rem;text-decoration:none;">Audit</a>
          <a href="/blog.html" style="color:#52526e;margin-right:1.5rem;text-decoration:none;">Blog</a>
          <a href="/privacy.html" style="color:#52526e;margin-right:1.5rem;text-decoration:none;">Privacy</a>
          <a href="/terms.html" style="color:#52526e;text-decoration:none;">Terms</a>
        </span>
      </div>
    </div>
  </footer>'''

NAV_JS = '''
  <script>
    // Nav scroll
    const _vnav = document.getElementById('vnav');
    const _vp = document.getElementById('vp');
    if(_vnav) window.addEventListener('scroll', () => {
      _vnav.style.background = scrollY > 60 ? 'rgba(6,6,8,.98)' : 'rgba(6,6,8,.88)';
      if(_vp) _vp.style.width = Math.min(scrollY/(document.body.scrollHeight-innerHeight)*100,100)+'%';
    });
    // Hide nav links on mobile
    const _nl = document.querySelector('.venom-nlinks');
    if(_nl && window.innerWidth < 900) _nl.style.display = 'none';
  </script>'''

files = ['audit.html', 'saas-detective.html']

for fname in files:
    try:
        with open(fname, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        original = content

        # Remove old nav (everything between <body> opening and first section/main/div with content)
        # Strategy: find <header or <nav at top of body and replace up to first content section
        # Also fix contact links
        content = content.replace('href="/contact.html"', 'href="/contact/"')
        content = content.replace('href="contact.html"', 'href="/contact/"')
        content = content.replace('href="/contact"', 'href="/contact/"')
        # Fix pricing on audit page
        content = content.replace('$1,500', '$500').replace('$3,500', '$1,500')
        content = content.replace('50% deposit to book · Balance due on delivery · ', '')
        content = content.replace('Book a Sprint Audit — $500', 'Book a Sprint Audit — $500')

        # Inject nav scroll JS before </body> if not present
        if 'id="vnav"' not in content:
            # Find opening <body> tag and inject nav after it
            content = re.sub(r'(<body[^>]*>)', r'\1\n' + NEW_NAV, content, count=1)
            print(f"  Nav injected: {fname}")
        else:
            print(f"  Nav already present: {fname}")

        # Replace old footer
        # Remove everything after last </section> or last main content block up to </body>
        # Find existing footer and replace it
        old_footer_pattern = re.compile(
            r'<footer[^>]*>.*?</footer>',
            re.DOTALL | re.IGNORECASE
        )
        if old_footer_pattern.search(content):
            content = old_footer_pattern.sub(NEW_FOOTER.strip(), content)
            print(f"  Footer replaced: {fname}")
        else:
            # No footer tag — inject before </body>
            content = content.replace('</body>', NEW_FOOTER + '\n</body>', 1)
            print(f"  Footer injected: {fname}")

        # Add nav JS before </body>
        if '_vnav' not in content:
            content = content.replace('</body>', NAV_JS + '\n</body>', 1)

        # Add padding-top to first section/header so nav doesn't cover content
        content = re.sub(
            r'(<(?:section|header|main|div)[^>]*style="[^"]*")',
            lambda m: m.group(0),
            content
        )

        if content != original:
            with open(fname, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Saved: {fname}")
        else:
            print(f"  No changes: {fname}")

    except FileNotFoundError:
        print(f"  ! File not found: {fname}")

print("\nDone.")
PYEOF

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║              PATCH COMPLETE                  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Now run:"
echo "  git add -A && git commit -m 'fix: patch nav/footer on audit + saas-detective' && git push"
echo ""
