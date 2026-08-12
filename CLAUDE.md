# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

`venom-industries.com` — the marketing, checkout, and content site for SaaS Detective (a Chrome extension). Plain static HTML/CSS/JS. No framework, no build step, no package manager, no tests. You edit the `.html` file and that is the deploy artifact.

## Deploying is a push

GitHub Pages serves this repo's `main` branch directly (see `CNAME` → `venom-industries.com`). There is no workflow, no staging environment, and no build gate. **A commit pushed to `main` is live on the public site within about a minute.**

Consequences that matter:
- Treat every edit here as a production edit. There is nowhere to try it first.
- Never `git push` unless explicitly asked, even when the change is obviously correct.
- Never commit half-finished work "to come back to." It ships.

## Sibling repositories this site is coupled to

These are separate git repos on the same machine. Changes here often require a mirrored change there, and nothing enforces it:

| Path | What it is |
|---|---|
| `../SaaS-Detective` | The Chrome extension itself |
| `../saas-detective-licensing` | Cloudflare Worker: licensing, Stripe, checkout sessions, email |

### The numbers that must match the extension

`saas-detective.html` hardcodes the extension's capability claims. The source of truth is `../SaaS-Detective/src/signatures.ts` and the constants at the top of `../SaaS-Detective/src/popup.ts`. Current canonical values: **800+ signatures, 64 categories**, and on the free tier **8 tools revealed per scan** (`FREE_LIMIT`, which slices the detected-tool list — it is not a cap on the number of scans) plus **25 history entries** (`HISTORY_LIMIT_FREE`; Pro gets 50). If you change them in one place, change them in both — stale numbers here are a false advertising claim, not a typo.

`FREE_LIMIT` was 50 until 2026-08-09. PostHog showed the busiest page anyone had ever scanned held 29 tools, so across 235 free scans the gate had fired exactly zero times and the `tool_limit_hit` event had never once been emitted — the free tier was functionally unlimited while Pro was sold on "unlocks all 800+ signatures". 8 was chosen from the measured distribution: it gates the ~16% of scans carrying 9+ tools and leaves the rest untouched. If you change it again, re-check that distribution rather than picking a round number.

### The checkout contract

`checkout.html` uses Stripe **Embedded Checkout**, not payment links. It POSTs to `/checkout/create-session` on the licensing Worker. Its `PLANS` object is keyed `1mo` / `3mo` / `6mo` / `12mo`, and those exact keys are a three-way contract:
- the extension builds upgrade URLs as `checkout.html?plan=<key>`,
- the Worker maps the key to a Stripe price,
- each term has its own `thankyou-*.html` landing page.

Adding or renaming a plan means touching all four surfaces plus a new thank-you page. Changing a displayed price without changing the Stripe price silently misstates the charge, and the billing disclosure text in `PLANS[].disclosure` restates the amount too — update it with the price.

**Stripe webhook endpoints and dashboard configuration are changed by hand, in the Stripe dashboard, by the project owner.** Do not script, automate, or "helpfully" reconfigure them; give dashboard instructions instead.

## Analytics

**Two systems run in parallel here — check both before touching tracking.**

*PostHog* is the primary product analytics. Events post to `api.venom-industries.com`, a reverse proxy, **not** to `*.posthog.com` directly. This is deliberate: the audience for a privacy-focused extension runs uBlock and Privacy Badger, which drop direct PostHog calls and would silently zero out the funnel. Do not "fix" this by pointing it at the standard endpoint.

*GA4* also runs, for Google Ads conversion tracking. It is inconsistently deployed and that is worth knowing before you assume a page is instrumented: `saas-detective.html` and the `thankyou-*.html` pages carry `gtag`, while `index.html` and `checkout.html` do not. Server-side, the licensing Worker sends the site's GA4 events itself via `fireVenomWebGA4Event` (measurement ID `G-JGHX274MQ3`, authenticated with `GA_VENOM_WEB_SECRET`) — separate credentials from the extension's GA4 path. So a conversion may be recorded from the Worker even where the page has no tag.

`checkout.html` fires the PostHog funnel events (`checkout_plan_selected` and friends). When editing that file, check whether a capture call needs to move with the code — a double-fired or dropped event here corrupts conversion data with no visible symptom.

## Content

- `blog/` holds 19 standalone posts. Each is a full HTML page carrying its own `<head>`, styles, and CTA block — there is no template or partial. Copy the nearest existing post as the starting point rather than writing one from scratch.
- Every post ends with a `<section class="sd-optin">` email capture block, inserted before `<footer>`. It is **self-contained by design** — its own `<style>` and `<script>`, written with literal hex colors rather than CSS custom properties, because several posts don't define `--fh` / `--accent2`. Copying a post carries the block with it; update the `source: '<slug>'` string in the copy or the new post's signups will be attributed to the old one. It POSTs to the licensing Worker's `/subscribe`, which relies on that Worker's `Access-Control-Allow-Origin: *`.
- `sitemap.xml` is **hand-maintained** (27 URLs). A new page that isn't added to it will not be indexed. Nothing generates or validates this.
- **`subscribe.html` is the paid-plan picker, not an email signup**, despite the name — the footer links to it as "Pricing". Email capture is the `sd-optin` block described above. Don't wire a signup form to `subscribe.html`.
- `index.html` carries an `impact-site-verification` meta tag for the Impact affiliate network. Don't strip unrecognized `<meta>` verification tags when tidying `<head>` — they are load-bearing and re-verification is manual.
