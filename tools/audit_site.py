import re
import sys
from pathlib import Path

def check_file(path: Path):
    text = path.read_text(encoding='utf8')
    results = []
    results.append(('Exists', True))
    # lang attribute
    results.append(('HTML lang present', bool(re.search(r"<html[^>]*\slang=\"[a-zA-Z-]+\"", text))))
    # title
    results.append(('Title tag', bool(re.search(r"<title>.+</title>", text, re.I))))
    # meta description
    results.append(('Meta description', bool(re.search(r"<meta\s+name=\"description\"", text, re.I))))
    # canonical
    results.append(('Canonical link', bool(re.search(r"<link[^>]*rel=\"canonical\"", text, re.I))))
    # H1 count
    h1s = re.findall(r"<h1\b", text, re.I)
    results.append(('H1 count', len(h1s)))
    # primary CTA presence (Start Free Scan or Try SaaS Detective)
    results.append(('Primary CTA', bool(re.search(r"Start Free Scan|Try SaaS Detective|Scan a Website|Start Free Scan", text))))
    # img alt coverage (report missing alts)
    imgs = re.findall(r"<img[^>]*>", text, re.I)
    missing_alt = 0
    for img in imgs:
        if not re.search(r"\salt=\"[^\"]+\"", img):
            missing_alt += 1
    results.append(('Images missing alt', missing_alt))
    # nav toggle aria
    results.append(('Nav toggle aria-expanded', bool(re.search(r"aria-expanded", text))))
    return results

def main():
    files = ['index.html', 'saas-detective.html', 'pricing.html', 'demo.html']
    base = Path(__file__).resolve().parents[1]
    print('Running lightweight SEO / accessibility checks')
    for f in files:
        p = base / f
        print('\n--', f)
        if not p.exists():
            print('  MISSING')
            continue
        for k,v in check_file(p):
            print(f'  {k}: {v}')

if __name__ == '__main__':
    main()
