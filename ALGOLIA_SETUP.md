# Algolia Search Implementation Analysis & Documentation

## 1. Executive Summary

This document provides a comprehensive analysis and operational guide for the Algolia search
integration in the Optikal Bahari Jekyll project. The implementation replaces the legacy Google
Custom Search with a high-performance, instant search experience powered by Algolia.

**Key Features:**

- **Secure Credential Management:** API keys are strictly isolated in environment variables
  (`.env`), ensuring no sensitive data is hardcoded in the source.
- **Native Jekyll Integration:** Utilizes Jekyll hooks and Liquid templating for seamless build-time
  configuration without external Node.js dependencies for credential injection.
- **Instant Search UI:** Implements `InstantSearch.js` with custom widgets for a responsive,
  real-time search experience.

---

## 2. Architecture & Data Flow

The search pipeline consists of three distinct stages: **Configuration**, **Indexing**, and
**Execution**.

### Data Flow Diagram

1.  **Configuration Source**: `.env` file (Local Environment) ↓
2.  **Build Process (Jekyll)**:
    - `_plugins/dotenv.rb` loads `.env`.
    - **Backend**: Injects Admin keys into `site.config` for the `jekyll-algolia` plugin.
    - **Frontend**: Injects Search keys into `site.data` for Liquid templates. ↓
3.  **Artifact Generation**:
    - `assets/js/algolia-search.js.liquid` is processed.
    - Liquid tags `{{ site.data... }}` are replaced with actual public keys.
    - Output: `_site/assets/js/algolia-search.js` (Pure JS with public keys). ↓
4.  **Search Execution (Browser)**:
    - User loads page → Browser executes `algolia-search.js`.
    - Script initializes Algolia Client with injected keys.
    - Queries sent to Algolia API → JSON Results returned → UI Rendered.

---

## 3. Implementation Components & Modified Files

The following files constitute the complete Algolia implementation:

### Core Configuration

- **[`.env`](.env)**: Stores sensitive credentials (`ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_API_KEY`,
  `ALGOLIA_API_KEY`, `ALGOLIA_INDEX_NAME`). **Git-ignored.**
- **[`_config.yml`](_config.yml)**: Updated to include `jekyll-algolia` plugin configuration and
  build commands.
- **[`Gemfile`](Gemfile)**: Added `jekyll-algolia` dependency.

### Build Pipeline (Middleware)

- **[`_plugins/dotenv.rb`](_plugins/dotenv.rb)**: Ruby script that acts as the bridge between `.env`
  and Jekyll. It uses the `:post_read` hook to securely inject credentials into the site payload
  before templates are rendered.

### Frontend Logic & UI

- **[`assets/js/algolia-search.js.liquid`](assets/js/algolia-search.js.liquid)**: The core logic
  file. Renamed to `.liquid` to enable server-side processing. It initializes `instantsearch.js`,
  configures widgets (SearchBox, Hits), and handles error management.
- **[`_includes/navigation/navbar-search-algolia.html`](_includes/navigation/navbar-search-algolia.html)**:
  The HTML structure for the search bar and results container, conditionally included in the navbar.
- **[`_includes/scripts.html`](_includes/scripts.html)**: Imports Algolia CDN libraries
  (`algoliasearch-lite`, `instantsearch.js`) and the custom search script.

### Styling

- **[`assets/vendor/startbootstrap-clean-blog/scss/_navbar-search-algolia.scss`](assets/vendor/startbootstrap-clean-blog/scss/_navbar-search-algolia.scss)**:
  Custom SCSS for the search bar, ensuring responsiveness and dark mode compatibility.
- **[`assets/vendor/startbootstrap-clean-blog/scss/clean-blog.scss`](assets/vendor/startbootstrap-clean-blog/scss/clean-blog.scss)**:
  Imports the search SCSS module.

---

## 4. Pipeline Operations: Step-by-Step Breakdown

### Phase 1: Configuration & Setup

1.  **Environment Variables**: The system expects a `.env` file at the project root.

    ```env
    # Public (Safe for Frontend)
    ALGOLIA_APP_ID=UWA3AQQKJK
    ALGOLIA_SEARCH_API_KEY=eb94f493bf5806e0348677836f46bfd1
    ALGOLIA_INDEX_NAME=prod_optikalbahari

    # Private (Backend Only - DO NOT EXPOSE)
    ALGOLIA_APPLICATION_ID=UWA3AQQKJK
    ALGOLIA_API_KEY=YOUR_ADMIN_API_KEY
    ```

2.  **Plugin Initialization**: When `jekyll build` or `serve` starts, `_plugins/dotenv.rb` executes
    immediately.
    - It loads variables using the `dotenv` gem.
    - It registers a `Jekyll::Hooks.register :site, :post_read` hook.
    - **Transformation**: `ENV['VAR']` → `site.data['algolia_credentials']['key']`.

### Phase 2: Content Indexing

This process pushes your content (posts/pages) to Algolia's servers.

**Command**: `bundle exec jekyll algolia`

**Operation**:

1.  Jekyll boots up and runs plugins.
2.  `dotenv.rb` injects `ALGOLIA_APPLICATION_ID` and `ALGOLIA_API_KEY` (Admin Key) into
    `site.config['algolia']`.
3.  The `jekyll-algolia` plugin reads this config.
4.  It scans all Markdown files, extracts content, transforms it into JSON records, and sends them
    to the configured Algolia Index.

### Phase 3: Build & Asset Generation

**Command**: `bundle exec jekyll build`

**Operation**:

1.  Jekyll processes `assets/js/algolia-search.js.liquid`.
2.  **Liquid Injection**: The template engine encounters:
    ```javascript
    appId: '{{ site.data.algolia_credentials.application_id }}'
    ```
    It resolves this using the data injected by `dotenv.rb` and writes the literal string value
    (e.g., `'UWA3AQQKJK'`) into the output file.
3.  The resulting `_site/assets/js/algolia-search.js` is a standard JavaScript file ready for the
    browser.

### Phase 4: Runtime Execution

1.  **Loading**: The browser downloads `algoliasearch-lite.umd.js`,
    `instantsearch.production.min.js`, and the generated `algolia-search.js`.
2.  **Initialization**:
    - `instantsearch()` is called with the injected `appId` and `apiKey`.
    - Widgets (`searchBox`, `hits`) are mounted to DOM elements (`#searchbox`, `#hits`).
3.  **Interaction**:
    - User types in `#searchbox`.
    - Algolia API is queried directly from the browser.
    - Results are rendered into `#hits` using the defined templates.

---

## 5. Setup Guide

To replicate or redeploy this environment:

1.  **Install Dependencies**:

    ```bash
    bundle install
    npm install
    ```

2.  **Configure Environment**: Ensure `.env` exists with valid Algolia keys.

3.  **Build Site**:

    ```bash
    bundle exec jekyll build
    # Optional post-processing (minification, etc.)
    npm run postbuild
    ```

4.  **Index Content** (Run this when content changes):
    ```bash
    bundle exec jekyll algolia
    ```

---

## 6. Troubleshooting

- **Search Bar Not Appearing**: Check browser console. If `algoliaConfig` has placeholders, `.env`
  was not loaded correctly during build. Ensure `_plugins/dotenv.rb` is running.
- **"No Results"**: Check if the index is empty. Run `bundle exec jekyll algolia`.
- **Linter Errors in JS**: Ensure the source file is named `.liquid` so the linter ignores the Front
  Matter.
