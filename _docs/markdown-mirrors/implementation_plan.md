# Markdown Mirror System – Implementation Plan

A production-grade system to generate AI-optimized plain-text `.md` endpoints alongside every HTML page, plus a dynamic `llms.txt` index for LLM/RAG pipeline discovery.

## Phase 1 Research Summary

| Item | Value |
|------|-------|
| Jekyll | 4.4.1 |
| Ruby | 2.6.10 |
| Permalink | `/:title/` (clean URLs, no `.html`) |
| Layout chain | `default.html` → `compress.html` |
| Collections | `posts` (output), `reviews` (output) |
| Existing `llms.txt` | Static hand-crafted file (will be **replaced**) |
| Existing `llms-full.txt` | Static hand-crafted file (**preserved as-is**) |

---

## User Review Required

> [!IMPORTANT]
> The existing `llms.txt` will be overwritten with a dynamic Liquid-driven version that auto-generates the post/page index. The existing `llms-full.txt` will **not** be touched.

> [!WARNING]
> The permalink pattern is `/:title/` (trailing slash, no `.html` extension). Mirror files will be written to `_site/<title>/index.md` to match the URL structure, making the mirror accessible at `/<title>/index.md`.

---

## Proposed Changes

### Component 1: Dynamic LLM Index

#### [MODIFY] [llms.txt](file:///Volumes/DATA/Jekyll/OptikalBahari/llms.txt)

Replace the static content with a Liquid template that:
- Sets `layout: null` and `permalink: /llms.txt` for plain-text output
- Preserves the existing executive summary header (entity metadata, services, contact info)
- Appends a dynamic `## Content Index` section via `{% for post in site.posts %}` loop
- Links each entry to its `.md` mirror: `* [Title]({{ site.url }}/{{ post.slug }}/index.md)`
- Also includes pages from `_pages/` collection

---

### Component 2: Ruby Generator Plugin

#### [NEW] [llm_mirror_generator.rb](file:///Volumes/DATA/Jekyll/OptikalBahari/_plugins/llm_mirror_generator.rb)

A Jekyll Generator plugin that runs during `jekyll build`:

```ruby
# Strategy:
# 1. Hook into Jekyll::Generator (priority :low, runs after content is rendered)
# 2. For each post and page with output=true:
#    - Extract the raw Markdown source (pre-layout, post-Liquid)
#    - Preserve original YAML frontmatter
#    - Write to _site/<url>/index.md
# 3. Use FileUtils.mkdir_p for directory safety
# 4. Wrap in begin/rescue to never break the main build
```

**Key design decisions:**
- Uses `Jekyll::Generator` (not hooks) for reliable access to documents before HTML layout wrapping
- Reads the **original `.content`** (Markdown after Liquid processing) rather than stripping HTML from rendered output
- Adds a small header comment to each `.md` file identifying it as an AI mirror
- Skips `404.md`, `sitemap.xml`, and other non-content pages

---

### Component 3: Discovery Link in HTML Head

#### [MODIFY] [head.html](file:///Volumes/DATA/Jekyll/OptikalBahari/_includes/head.html)

Inject a `<link rel="alternate">` tag before `</head>`:

```html
<link rel="alternate" type="text/markdown" href="{{ page.url | append: 'index.md' | relative_url }}" title="Markdown version">
```

This signals to AI crawlers that a Markdown mirror exists for the current page.

---

## Open Questions

> [!IMPORTANT]
> **URL mapping**: Since permalinks use `/:title/` (e.g., `/lensa-photocromic-optik-bahari/`), the mirror will be at `/lensa-photocromic-optik-bahari/index.md`. Is this acceptable, or do you prefer a flat structure like `/md/lensa-photocromic-optik-bahari.md`?

---

## Verification Plan

### Automated Tests
1. `bundle exec jekyll build --trace` — confirm clean exit code 0
2. `find _site -name "index.md" | head -10` — confirm `.md` mirrors exist
3. `cat _site/llms.txt` — confirm dynamic index renders correctly
4. Browser agent: navigate to `localhost:4000/llms.txt`, click a link, verify raw Markdown

### Manual Verification
- Inspect `_site` directory structure for correct `.md` file placement
- Verify the `<link rel="alternate">` tag in rendered HTML source
