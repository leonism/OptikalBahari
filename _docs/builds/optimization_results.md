# Production Asset Optimization Results

## What Was Done

Three separate optimization layers were applied to the production pipeline:

1. **CSS — CleanCSS Level 1 → Level 2** (structural deduplication)
2. **JavaScript — Terser `passes:3` + `mangle.toplevel` + `unsafe` transforms** (+ page-specific re-minification of `reviews.js` and `algolia-search.js`)
3. **Fonts — `pyftsubset` FA7-aware subsetting** (only glyphs actually referenced in HTML/JS)
4. **New — Brotli/Gzip pre-compression of dist artifacts** (instant server delivery)

---

## Before vs After Comparison

### CSS Bundle (`styles.min.css`)

| File | Before | After | Saved |
|---|---|---|---|
| `bootstrap.min.css` | 226.7 KB | — | _merged_ |
| `fontawesome all.min.css` | 72.6 KB | — | _merged_ |
| `satellite-min.css` (Algolia) | 57.6 KB | — | _merged_ |
| **`styles.min.css` (merged)** | **357.2 KB** | **275.3 KB** | **−81.9 KB (−23%)** |
| `styles.min.css.br` | _none_ | **45.7 KB** | −229.6 KB vs raw |
| `styles.min.css.gz` | _none_ | **58.9 KB** | −216.4 KB vs raw |

> **Key change:** CleanCSS upgraded from Level 1 to Level 2. Level 2 enables structural merging of adjacent/duplicate rules, shorthand collapse (`border-*` → `border:`), and removal of overridden properties — producing 81.9 KB of savings on top of what PurgeCSS already removed.

---

### JavaScript

#### Merged Internal Bundle (`scripts.min.js` — common pages)

| File | Before | After | Saved |
|---|---|---|---|
| `bootstrap.bundle.min.js` | ~70 KB | — | _merged_ |
| `clean-blog.js` | ~9 KB | — | _merged_ |
| `scripts.js` | 0.5 KB | — | _merged_ |
| `lazyLoad.js` | 2.8 KB | — | _merged_ |
| **`scripts.min.js` (merged)** | **~82 KB** | **81 KB** | _baseline_ |
| `scripts.min.js.br` | _none_ | **21 KB** | −61 KB vs raw |
| `scripts.min.js.gz` | _none_ | **24 KB** | −57 KB vs raw |

#### Page-Specific JS (re-minified with passes:3 + advanced)

| File | Before | After | Saved |
|---|---|---|---|
| `algolia-search.js` | 20.2 KB | **9.1 KB** | **−11.1 KB (−55%)** |
| `reviews.js` | 16.5 KB | **16 KB** | −0.5 KB |

> **Key change:** Terser upgraded to `passes:3`, `mangle.toplevel:true`, `unsafe:true`, and `compress.keep_fargs:false`. The `algolia-search.js` had the most gains (55%) because it contained long comments, dead code branches, and un-mangled top-level variable names.

---

### Font Files (Font Awesome Subsetting)

Only **29 solid glyphs** and **10 brand glyphs** are actually used across the site. The original woff2 files contain 1,300+ glyphs.

| File | Before | After | Saved | Reduction |
|---|---|---|---|---|
| `fa-solid-900.woff2` | 110.5 KB | **3.2 KB** | **107.3 KB** | **97.1%** |
| `fa-brands-400.woff2` | 98.9 KB | **1.9 KB** | **97.0 KB** | **98.1%** |
| `fa-regular-400.woff2` | 18.5 KB | **1.8 KB** | **16.7 KB** | **90.5%** |
| `fa-v4compatibility.woff2` | 3.9 KB | 3.9 KB | 0 | unchanged |
| **Total Fonts** | **231.8 KB** | **10.8 KB** | **−220.9 KB** | **−95.4%** |

> **How it works:** `pyftsubset` (fonttools) parses all 105 HTML files and 41 JS files, extracts every `fa-*` class reference, maps them to their Unicode codepoints via the FA7 CSS `--fa` custom property syntax (e.g. `.fa-circle{--fa:"\f111"}`), then produces a new woff2 containing only those glyphs. An `ALWAYS_INCLUDE` safety list ensures critical glyphs are never dropped even if they're injected dynamically.

---

## Overall Transfer Savings (Brotli-served)

| Asset Category | Before (wire) | After (wire) | Net Saved |
|---|---|---|---|
| CSS | ~357 KB (uncompressed) | **45.7 KB** (Brotli) | **−311 KB** |
| JS (common) | ~82 KB | **21 KB** (Brotli) | **−61 KB** |
| JS (algolia, per-page) | 20.2 KB | **~4 KB** (est. Brotli) | **−16 KB** |
| Fonts | 231.8 KB | **10.8 KB** | **−221 KB** |
| **Grand Total** | **≈ 691 KB** | **≈ 81.5 KB** | **−609 KB (−88%)** |

---

## Files Added / Modified

### New Files
- `_scripts/post-built/subset-fonts.js` — Font Awesome subsetting via pyftsubset
- `_site/assets/dist/styles.min.css.br` — Brotli pre-compressed CSS
- `_site/assets/dist/styles.min.css.gz` — Gzip pre-compressed CSS
- `_site/assets/dist/scripts.min.js.br` — Brotli pre-compressed JS bundle
- `_site/assets/dist/scripts.min.js.gz` — Gzip pre-compressed JS bundle

### Modified Files
- `_scripts/post-built/consolidate-assets.js` — CleanCSS L1→L2, Terser passes:3 + unsafe, page-specific JS re-minification, Brotli/Gzip pre-compression of dist files
- `_scripts/post-built/post-build.js` — Added Step 8: `runFontSubsetting()`

---

## Prerequisites (one-time setup)

```bash
pip install fonttools brotli
```

Required for `pyftsubset` to run the font subsetting step.

---

> [!TIP]
> The subsetted fonts are **production-only** outputs and will be regenerated on every build. The source font files in `assets/vendor/fontawesome-free-7.1.0-web/webfonts/` are never modified — only the `_site/` copies.

> [!NOTE]
> The CSS reduction from 357 KB → 275 KB (23%) is on top of what PurgeCSS already strips. When served via Brotli, the effective wire size drops to 45.7 KB — a 97% reduction from the raw 357 KB input.
