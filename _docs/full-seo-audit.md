# 🔎 Full SEO Audit — optikalbahari.com
**Scope:** Technical · On-Page · Semantic HTML · Accessibility · Structured Data · Performance · Content
**Audited:** 2026-04-11 | **Agent:** @[seo] + @[seo-schema]

---

## 📊 SEO Health Score

| Category | Score | Weight | Weighted |
|----------|-------|--------|---------|
| Technical SEO | 68/100 | 22% | 15.0 |
| Content Quality | 74/100 | 23% | 17.0 |
| On-Page SEO | 70/100 | 20% | 14.0 |
| Structured Data | 72/100 | 10% | 7.2 |
| Performance (CWV) | 85/100 | 10% | 8.5 |
| AI Search Readiness | 60/100 | 10% | 6.0 |
| Images | 78/100 | 5% | 3.9 |
| **TOTAL** | | | **71.6 / 100** |

---

## 🔴 CRITICAL Issues (Fix Immediately)

---

### C1 — `<html lang>` is Empty When `page.lang` is Not Set

**File:** `_includes/head.html` line 2

```html
<html lang='{{ page.lang }}'>
```

If any page/post is missing `lang:` in frontmatter, this renders as:

```html
<html lang=''>
```

An **empty `lang` attribute** is worse than no attribute at all. Google and assistive technologies use it to determine reading direction, voice synthesis, and language detection. Empty `lang` causes:
- Screen readers to fall back to OS language (may read Indonesian in English voice)
- Google's language classifier to ignore the declared language
- WCAG 2.1 SC 3.1.1 **Level A** violation

**Pages confirmed missing `lang`:** Two pages have leading-space filenames (` kredit-kacamata-minus.md`, ` optik-yang-menerima-kjp.md`) which indicates filesystem accident — check these were not accidentally created with no `lang` field.

**Fix:** Add a default at the template level:

```diff
- <html lang='{{ page.lang }}'>
+ <html lang='{{ page.lang | default: "id-ID" }}'>
```

---

### C2 — Duplicate `og:title`, `og:description`, `og:url`, `og:site_name` in `<head>`

**Files:** `card-meta.html` (lines 2–5) AND `meta-og.html` (lines 7–10, 29)

Both includes emit the same Open Graph properties on every page:

```html
<!-- card-meta.html outputs: -->
<meta property='og:site_name' content='...'>
<meta property='og:title' content='...'>
<meta property='og:description' content='...'>
<meta property='og:url' content='...'>

<!-- meta-og.html ALSO outputs: -->
<meta property='og:type' content='...'>
<meta property='og:url' content='...'>      ← DUPLICATE
<meta property='og:title' content='...'>    ← DUPLICATE
<meta property='og:site_name' content='...'> ← DUPLICATE
```

Facebook's Open Graph parser uses the **last** declaration when duplicates exist. This means `card-meta.html`'s values (which are less specific — no `| escape` filter, no excerpt logic) will be discarded, but the duplication wastes `<head>` budget, confuses validators, and creates subtle mismatches in social sharing metadata.

**Fix:** Remove OG properties from `card-meta.html`. Keep only `charset`, `viewport`, preconnects, and verification meta tags there. Let `meta-og.html` own all OG properties.

---

### C3 — Two `google-site-verification` Meta Tags

**File:** `_includes/meta/card-meta.html` lines 15 and 18

```html
<meta name='google-site-verification' content='S78mNAZQFqN0fjs9...'>
<meta name='google-site-verification' content='QwzD8MDRyjoNO82p...'>
```

Two different verification codes suggest two different Google Search Console properties were verified at different times. This is **harmless for verification** but signals to Google that the site has had account/ownership changes and may cause data split in GSC.

**Action:** Verify which GSC property is the canonical one and remove the other verification token.

---

## 🟠 HIGH Priority Issues

---

### H1 — `<title>` Tag Truncates at 43 Characters — Too Aggressive

**File:** `_includes/meta/meta-seo.html` line 3

```liquid
{{ page.title | strip_html | truncate: 43 }}
```

Google's title display is approximately **60–70 characters** (pixel-based, roughly 580px). Truncating at 43 chars means titles that could rank for longer keyword phrases are being cut short in both the `<title>` tag and in SERP display.

**Example problem:**
- Actual title: `Periksa Mata Gratis Di Optikal Bahari` (37 chars) ✅
- After ` - Optikal Bahari` suffix: `Periksa Mata Gratis Di Optikal Bahari - Optikal Bahari` (54 chars) ✅ Still fine
- But: `Lensa Photochromic Optikal Bahari: Kelebihan & Cara Memilih` if truncated at 43 → `Lensa Photochromic Optikal Bahari: Kelebih` — cuts mid-word.

**Fix:**

```diff
- {{ page.title | strip_html | truncate: 43 }}
+ {{ page.title | strip_html | truncate: 60 }}
```

---

### H2 — `<h1>` Tag Renders `{{ page.title }}` Without Escaping

**File:** `_includes/cloudinary/masthead.html` line 50

```html
<h1>{{ page.title }}</h1>
```

No `| escape` filter. If a page title contains `&`, `<`, or `>` characters (which some do — e.g., `"Tips & Trik Kacamata"`), these render as raw HTML entities in the DOM. This is both an **XSS risk** (if titles ever come from user input) and an **accessibility issue** (screen readers may vocalize the entities).

**Fix:**

```diff
- <h1>{{ page.title }}</h1>
+ <h1>{{ page.title | escape }}</h1>
```

---

### H3 — `<h2>` Used for Page Subtitle in Masthead — Heading Hierarchy Skips Context

**File:** `_includes/cloudinary/masthead.html` lines 52–59

The masthead uses `<h2>` for the subtitle immediately after `<h1>`. While the heading order is correct (h1 → h2), the subtitle is often the **same text as the description** (`page.description`). This means assistive technologies navigating by heading hear a heading that is identical to the meta description — a repeated content signal.

More critically, the **post/page body content jumps from this h2 straight to h3** (in `periksa-mata-gratis.md` → `<h3 class="card-title">`). There is no `<h2>` used structurally in body content, which creates a heading outline of: `h1 → h2 (subtitle) → h3 → h3 → h3`

Google's structural heading analysis expects: `h1 → h2 (section) → h3 (sub-section)`.

**Fix:** Promote body card titles from `<h3>` to `<h2>` in all page/post content files. The masthead subtitle should use `<p class="lead">` or a styled `<p>` instead of `<h2>`.

---

### H4 — Masthead LCP Image Uses Hidden `<img>` for Onload Trigger — Problematic for CWV

**File:** `_includes/cloudinary/masthead.html` lines 36–41

```html
<img src="...1400w.avif" fetchpriority="high" decoding="sync"
  style="display: none"
  onload="document.getElementById(...).classList.add('is-loaded')..." />
```

A **`display: none` image is not considered an LCP candidate** by browsers, even with `fetchpriority="high"`. The actual LCP element becomes the CSS background image (`--masthead-bg`), which is **not preloadable** by the browser's preload scanner. This hurts your LCP score significantly.

**Fix:** Replace with an actual visible `<img>` used as the masthead content (positioned absolutely or as a background using `object-fit: cover`), or add a `<link rel="preload" as="image">` in `<head>` for the LCP image. The `onload` trigger pattern is fine, but the preload hint must come from `<head>`, not from a hidden image.

---

### H5 — `<footer>` `<ul>` Items Are Wrapped in `<small>` — Incorrect Nesting

**File:** `_includes/footer.html` lines 6–110

```html
<small>
  <ul class="list-inline text-center">
    <li>...</li>
  </ul>
</small>
```

`<small>` is a **phrasing content** element. According to HTML5 spec, it cannot contain **flow content** like `<ul>`. `<ul>` is flow content. This is invalid HTML that browsers fix silently but that validators flag. It also signals to crawlers that the footer navigation is "small print" (legal/disclaimer context) rather than site navigation.

**Fix:** Remove the `<small>` wrapper. Apply font sizing via CSS class instead:

```html
<ul class="list-inline text-center footer-links">
  <li>...</li>
</ul>
```

---

### H6 — `richsnippet-json-ld-review.html` Has Inconsistent Business Data (Two Different Phone Numbers + Geo Coords)

**File:** `_includes/richsnippets/richsnippet-json-ld-review.html` vs `richsnippet-json-ld-optician.html`

| Field | review.html | optician.html |
|-------|------------|--------------|
| `telephone` | `+6281511223900` | `+6281932235445` |
| `geo.latitude` | `-6.1668822` | `-6.1619969` |
| `geo.longitude` | `106.8454955` | `106.857886` |

These are **different phone numbers and different GPS coordinates** for the same business. Google's Knowledge Graph uses these to verify LocalBusiness data. Contradictory structured data causes Google to distrust both and may suppress your local pack appearance.

**Fix:** Standardize phone and coordinates across all LocalBusiness/Optician schema. The `optician.html` coordinates match Google Maps embed in `lokasi.md` — use those.

---

### H7 — `richsnippet-json-ld-article.html` Uses `http://schema.org` (not `https://`)

**File:** `_includes/richsnippets/richsnippet-json-ld-article.html` line 3

```json
"@context": "http://schema.org"
```

All other richsnippet files use `https://schema.org`. Google's structured data parser normalizes both, but Google's Rich Results Test flags the http version as a warning. The inconsistency across snippets on the same page can cause graph resolution issues.

**Fix:** Change to `"https://schema.org"`.

---

## 🟡 MEDIUM Priority Issues

---

### M1 — `<meta name="keywords">` – Liquid Filter Syntax Error (`normalize_whitespace` Applied Incorrectly)

**File:** `_includes/meta/meta-seo.html` line 21

```liquid
content='{{ page.keywords normalize_whitespace | truncate: 160 | escape }}'
```

`normalize_whitespace` must be applied as a filter with a pipe — `| normalize_whitespace` — not as a bare word after the variable. This is a **Liquid syntax error** that Jekyll may silently ignore, rendering the keywords meta with un-normalized whitespace or potentially a blank value.

**Fix:**

```diff
- content='{{ page.keywords normalize_whitespace | truncate: 160 | escape }}'
+ content='{{ page.keywords | normalize_whitespace | truncate: 160 | escape }}'
```

Note: `<meta name="keywords">` has no direct ranking effect on Google, but it's used by Bing and as Algolia indexing signal (per `_config.yml`).

---

### M2 — `og:description` Falls Back to `page.excerpt` (Auto-Generated) on Posts

**File:** `_includes/meta/meta-og.html` line 11

```liquid
content='{% if page.excerpt %}{{ page.excerpt | strip_html | strip_newlines | truncate: 140 }}
         {% else %}{{ site.description }}{% endif %}'
```

`page.excerpt` in Jekyll is the **auto-generated first paragraph** when no `excerpt` frontmatter is set. For posts, this is often the first `<div>` card content — not a well-crafted social description. Meanwhile, `page.description` (which is properly defined in every post's frontmatter) is being ignored entirely by `meta-og.html`.

**Fix:**

```diff
- content='{% if page.excerpt %}{{ page.excerpt | strip_html | strip_newlines | truncate: 140 }}
-          {% else %}{{ site.description }}{% endif %}'
+ content='{% if page.description %}{{ page.description | strip_html | truncate: 140 | escape }}
+          {% elsif page.excerpt %}{{ page.excerpt | strip_html | truncate: 140 | escape }}
+          {% else %}{{ site.description | escape }}{% endif %}'
```

---

### M3 — `lokasi.md` Has Duplicate Frontmatter Key `comments: false`

**File:** `_pages/lokasi.md` lines 12 and 14

```yaml
comments: false   ← line 12
permalink: /lokasi/
comments: false   ← line 14 (duplicate)
```

YAML spec: duplicate keys cause the **second value to overwrite the first**. This is harmless for a `false/false` dupe, but signals copy-paste errors in the file. Jekyll parsers may warn; some strict YAML parsers may throw errors.

**Action:** Remove the duplicate `comments: false` on line 14.

---

### M4 — Footer Social Links Use Outdated Twitter/X Domain

**File:** `_includes/footer.html` line 30

```html
<a href="https://twitter.com/{{ site.twitter_username }}">
```

Twitter rebranded to X.com. The `twitter.com` domain still resolves via redirect, but:
- Social crawlers from X/Twitter use `x.com` URLs for verification
- The `twitter:site` meta tag in `meta-twitter.html` uses `@{{ site.twitter_username }}` which is correct
- The actual link destination (footer) pointing to `twitter.com` is a minor inconsistency

**Fix:** Update footer link to `https://x.com/{{ site.twitter_username }}`.

---

### M5 — `<iframe>` (Google Maps in lokasi.md) Missing `title` Attribute

**File:** `_pages/lokasi.md` line 74

```html
<iframe src="https://www.google.com/maps/embed?..." width="600" height="450"
  allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
```

Missing `title` attribute on `<iframe>` is a **WCAG 2.1 SC 4.1.2 Level A** violation. Screen readers announce iframes by their title. Without it, assistive technology users hear "iframe" with no context.

**Fix:**

```html
<iframe title="Peta Lokasi Optikal Bahari - Jl. Bend. Jago No.447, Kemayoran"
  src="..." ...>
```

---

### M6 — Theme Toggle Input Is `d-none` but Label Is Visible — Accessibility Pattern Incomplete

**File:** `_includes/navigation/navbar-theme-toggle.html` lines 2–7

```html
<input class='form-check-input d-none' type='checkbox'
  id='themeToggle' aria-label='Toggle between light and dark mode'>
<label class='form-check-label' for='themeToggle'>
  <span class='icon-stack toggle-icon' aria-hidden='true'>...</span>
</label>
```

The checkbox is `d-none` (hidden from layout and AT), but the `<label>` is visible and clickable. This means:
- **Keyboard users** cannot focus the checkbox (it is visually hidden via `d-none` which also removes from accessibility tree)
- The `aria-label` on the hidden input is therefore never announced
- Correct pattern: use `visually-hidden` (Bootstrap's screen-reader-only class) instead of `d-none`

**Fix:**

```diff
- <input class='form-check-input d-none' type='checkbox'
+ <input class='form-check-input visually-hidden' type='checkbox'
```

---

### M7 — `richsnippet-json-ld-optician.html` Emits Two Separate Optician Nodes with Duplicate `@context`

**File:** `_includes/richsnippets/richsnippet-json-ld-optician.html`

The file outputs a JSON-LD array with **two separate Optician nodes**, each redeclaring `@context`. One has a full address/geo/sameAs, the other is minimal. This creates two competing `Optician` entities for the same business in Google's Knowledge Graph. Google will try to reconcile them and may pick the wrong one as the canonical.

**Fix:** Merge into a single `Optician` node with all properties. Use `@graph` if co-authoring with other types.

---

### M8 — `card-meta.html` Adds `preconnect` to `fonts.googleapis.com` — But `fonts.html` is Loaded After It

**File:** `_includes/head.html` lines 4–9

```
{% include meta/card-meta.html %}   ← preconnect to fonts.googleapis.com
{% include meta/meta-seo.html %}
...
{% include fonts.html %}            ← actual font request happens here
```

The `preconnect` hint in `card-meta.html` is good practice, but there is no corresponding `preconnect` hint for `fonts.gstatic.com` with the `crossorigin` attribute. Google Fonts CDN uses **two domains** — `fonts.googleapis.com` (CSS) and `fonts.gstatic.com` (actual font files). Missing the `gstatic` preconnect means the font binary download is delayed.

Check `card-meta.html` line 7–11: `preconnect` to `fonts.gstatic.com` with `crossorigin` **does** exist. ✅ Good. But the `dns-prefetch` for GTM (line 13) should also be a `preconnect` for better performance.

---

### M9 — `richsnippet-json-ld-breadcrumb.html`: `@type` Mixes Breadcrumb Parent and Article Type

**File:** `_includes/richsnippets/richsnippet-json-ld-breadcrumb.html` lines 4–8

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",          ← the outer node IS the article
  "mainEntityOfPage": {...},
  "breadcrumb": { ... }            ← breadcrumb is nested inside BlogPosting
}
```

This is structurally valid, but Google prefers **BreadcrumbList** to be its own top-level entity (not nested in BlogPosting) so it can be independently indexed for breadcrumb display in SERPs. Nested breadcrumbs are supported but less reliably picked up.

Also: `page.breadcrumbs` is conditionally populated from frontmatter. Spot-checking the pages shows **no pages define `breadcrumbs:` in their frontmatter**, making the breadcrumb block never render — wasted template logic.

**Action:** Either add `breadcrumbs:` frontmatter to key pages, or remove the dead conditional block.

---

## 🟢 LOW Priority Issues

---

### L1 — `<article>` Used for All Pages — Including Non-Article Content (page.html, post.html)

**Files:** `_layouts/page.html` line 8, `_layouts/post.html` line 13

```html
<article class='col-lg-10 col-md-10 mx-auto'>
  {{ content }}
</article>
```

`<article>` is semantically correct for blog posts. But the `page.html` layout uses the same template for all pages (lokasi, profil, kontak, etc.). A location/contact page is not an "article" — using `<article>` here is semantically incorrect and may confuse crawlers.

**Fix:** In `page.html`, change `<article>` to `<section>` or `<div>`:

```diff
- <article class='col-lg-10 col-md-10 mx-auto'>
+ <section class='col-lg-10 col-md-10 mx-auto' aria-label='{{ page.title | escape }}'>
```

---

### L2 — `<nav>` Missing `<ul>` Direct Child for Top-Level List

**File:** `_includes/navigation/navbar.html` — the collapse div wraps `<ul>` correctly. But: the `navbar-actions-group` div has no semantic role or landmark label.

**Fix:** Add `aria-label` to the actions group to distinguish it from main nav:

```diff
- <div class='navbar-actions-group d-flex align-items-center mx-1 order-lg-3'>
+ <div class='navbar-actions-group d-flex align-items-center mx-1 order-lg-3' role='group' aria-label='Site Actions'>
```

---

### L3 — Footer Copyright Link Wraps Entire Copyright Statement

**File:** `_includes/footer.html` lines 105–108

```html
<a href="{{ '/' | relative_url }}" title="Hak Cipta...">
  Hak Cipta © Optikal Bahari 2026
</a>
```

The copyright notice is an anchor linking to the homepage. This is a redundant link (navbar brand already links home) and the link text is the full copyright statement. Screen readers announce "link: Hak Cipta © Optikal Bahari 2026" — which is confusing. Google's link equity also leaks from the copyright anchor.

**Fix:** Make copyright a `<p>` instead:

```html
<p>Hak Cipta &copy; {{ site.author }} {{ 'now' | date: '%Y' }}</p>
```

---

### L4 — WhatsApp Floating Button Has `<span class='ripple'>` Without `aria-hidden`

**File:** `_includes/wa-body.html` lines 23–25

```html
<span class='ripple'></span>
<span class='ripple'></span>
<span class='ripple'></span>
```

These decorative animation spans are announced by some screen readers as empty list items. They should be `aria-hidden`:

```html
<span class='ripple' aria-hidden='true'></span>
```

---

### L5 — Two Page Files Have Leading Spaces in Filenames

**Files:** ` kredit-kacamata-minus.md` and ` optik-yang-menerima-kjp.md` (note the leading space)

Filenames with leading spaces may generate URLs with `%20` prefix or cause build inconsistencies across different operating systems. These should be renamed to remove the leading space.

---

## 📋 Accessibility Checklist (WCAG 2.1)

| Criterion | Level | Status | Issue |
|-----------|-------|--------|-------|
| 1.1.1 Non-text content (alt text) | A | ✅ | Logo img has alt, card images use `alt` param |
| 1.3.1 Info and Relationships | A | ⚠️ | `<small>` wrapping `<ul>` in footer (H5) |
| 1.4.4 Resize Text | AA | ✅ | No fixed px font sizes detected |
| 2.1.1 Keyboard navigation | A | ⚠️ | Theme toggle input hidden from focus (M6) |
| 2.4.1 Bypass blocks | A | ✅ | `#main-content` id present in default.html |
| 2.4.2 Page titled | A | ✅ | All pages have `<title>` |
| 2.4.6 Headings & Labels | AA | ⚠️ | h1→h3 jump in body content (H3) |
| 3.1.1 Language of Page | A | 🔴 | `lang=''` when page.lang missing (C1) |
| 3.1.2 Language of Parts | AA | ✅ | Not applicable (mono-language) |
| 4.1.2 Name/Role/Value | A | ⚠️ | iframe missing title (M5) |

---

## 📋 Semantic HTML Checklist

| Element | Usage | Verdict |
|---------|-------|---------|
| `<header>` | Masthead — correct ✅ | Good |
| `<nav>` | Navbar with `aria-label` ✅ | Good |
| `<main>` | id `main-content` wraps content ✅ | Good |
| `<article>` | Used for pages too 🟡 | Fix for non-blog pages (L1) |
| `<section>` | Not used — missed opportunity | Use in body cards |
| `<footer>` | Present ✅ | Good |
| `<h1>` | One per page in masthead ✅ | Good |
| `<h2>` | Subtitle in masthead, skipped in body | Restructure (H3) |
| `<h3>` | All card titles — correct subordinate ✅ | Good |
| `<ul>/<li>` | Footer nav uses list ✅ | Good |
| `<small>` | Wraps `<ul>` — invalid nesting 🔴 | Fix (H5) |
| `<figure>/<figcaption>` | Not used for images | Consider for card images |

---

## 🎯 Prioritized Fix Plan

| Priority | Issue | File | Effort |
|----------|-------|------|--------|
| 🔴 C1 | Add `lang` default to `<html>` | `head.html` | 1 line |
| 🔴 C2 | Remove duplicate OG tags from `card-meta.html` | `card-meta.html` | Delete 3 lines |
| 🔴 C3 | Consolidate GSC verification tokens | `card-meta.html` | 1 line |
| 🟠 H1 | Increase `<title>` truncation to 60 chars | `meta-seo.html` | 1 line |
| 🟠 H2 | Escape `page.title` in `<h1>` | `masthead.html` | 1 line |
| 🟠 H3 | Promote body h3 to h2, demote masthead h2 to `<p class="lead">` | All page content | Many files |
| 🟠 H4 | Fix LCP preload — add `<link rel="preload">` in head | `head.html` | 3 lines |
| 🟠 H5 | Remove `<small>` wrapping `<ul>` in footer | `footer.html` | Refactor |
| 🟠 H6 | Standardize phone/geo in all LocalBusiness schema | `review.html` | Fix coords |
| 🟠 H7 | Fix `http://schema.org` → `https://` in article schema | `richsnippet-json-ld-article.html` | 1 line |
| 🟡 M1 | Fix `normalize_whitespace` Liquid filter syntax | `meta-seo.html` | 1 char |
| 🟡 M2 | Use `page.description` first in OG meta | `meta-og.html` | 3 lines |
| 🟡 M3 | Remove duplicate `comments: false` | `lokasi.md` | 1 line |
| 🟡 M4 | Update Twitter link to x.com | `footer.html` | 1 line |
| 🟡 M5 | Add `title` to Google Maps iframe | `lokasi.md` | 1 attr |
| 🟡 M6 | Change theme toggle from `d-none` to `visually-hidden` | `navbar-theme-toggle.html` | 1 word |
| 🟡 M7 | Merge duplicate Optician nodes | `richsnippet-json-ld-optician.html` | Refactor |
| 🟡 M9 | Add `breadcrumbs:` to key pages or remove dead block | Multiple | Config |
| 🟢 L1 | Use `<section>` instead of `<article>` in page.html | `page.html` | 2 lines |
| 🟢 L2 | Add `role/aria-label` to navbar actions group | `navbar.html` | 1 attr |
| 🟢 L3 | Remove link wrapper from copyright text | `footer.html` | Refactor |
| 🟢 L4 | Add `aria-hidden` to ripple spans | `wa-body.html` | 3 attrs |
| 🟢 L5 | Rename files with leading space in filename | FS | Rename |
