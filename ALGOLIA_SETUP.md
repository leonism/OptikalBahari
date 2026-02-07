# Algolia Search Setup & Configuration

This project uses [Algolia](https://www.algolia.com/) for fast, relevant search functionality. The
integration has been secured to use environment variables, preventing sensitive API keys from being
exposed in the source code.

## 🚀 Quick Setup

### 1. Create an Algolia Account

1.  Go to [Algolia](https://www.algolia.com/) and create an application.
2.  Navigate to the **API Keys** section of your dashboard.
3.  You will need:
    - **Application ID**
    - **Search-Only API Key** (for the frontend)
    - **Admin API Key** (for indexing content)
    - **Index Name** (e.g., `optikal_bahari`)

### 2. Configure Environment Variables

Create a `.env` file in the root directory of the project (this file is git-ignored).

```bash
touch .env
```

Add your credentials to `.env`:

```env
# Frontend Configuration (InstantSearch.js)
ALGOLIA_APP_ID=your_application_id
ALGOLIA_SEARCH_API_KEY=your_search_only_api_key
ALGOLIA_INDEX_NAME=optikal_bahari

# Backend Configuration (Jekyll Algolia Plugin)
# Used for indexing content via `jekyll algolia` command
ALGOLIA_APPLICATION_ID=your_application_id
ALGOLIA_API_KEY=your_admin_api_key
```

> **⚠️ Security Warning:** Never commit your `.env` file or your Admin API Key to version control.

### 3. Build the Site

The project uses a post-build script to inject these environment variables into the frontend
JavaScript.

```bash
# Standard build command
bundle exec jekyll build
# Post-build optimization & injection
npm run postbuild
```

Or using the convenience script (if available):

```bash
bash _scripts/post-built/post-build.sh
```

---

## 🛠️ How It Works

### 1. Secure Credential Injection

Instead of hardcoding keys in JavaScript files, the codebase uses placeholders
`process.env.VARIABLE`.

- **Source File:** `assets/js/algolia-search.js`

  ```javascript
  const algoliaConfig = {
    appId: process.env.ALGOLIA_APP_ID,
    apiKey: process.env.ALGOLIA_SEARCH_API_KEY,
    indexName: process.env.ALGOLIA_INDEX_NAME,
  }
  ```

- **Injection Script:** `_scripts/post-built/inject-env.js` This Node.js script runs after the
  Jekyll build. It reads the `.env` file and replaces the `process.env.*` placeholders in
  `_site/assets/js/**/*.js` with the actual values.

### 2. Jekyll Configuration

The `_config.yml` has been updated to rely on environment variables for the `jekyll-algolia` plugin.

```yaml
algolia:
  # Credentials are loaded from environment variables
  index_name: 'optikal_bahari'
```

### 3. Dependency Management

- **`dotenv` (Ruby Gem):** Loaded via `_plugins/dotenv.rb` to ensure Jekyll can access `.env`
  variables during development/build.
- **`dotenv` (NPM Package):** Used by the post-build scripts to read `.env` values.

---

## 📦 Indexing Content

To push your Jekyll posts and pages to Algolia, run:

```bash
bundle exec jekyll algolia
```

_Note: This requires the `ALGOLIA_API_KEY` (Admin Key) to be set in your `.env` file._

---

## 🔄 Reverting to Google Search

If you need to switch back to the original Google Custom Search:

1.  **Update Navbar:** Edit `_includes/navigation/navbar.html`:

    ```html
    <!-- Comment out Algolia -->
    <!-- {% include navigation/navbar-search-algolia.html %} -->

    <!-- Uncomment Google Search -->
    {% include navigation/navbar-search-google.html %}
    ```

2.  **Update Styles:** Edit `assets/vendor/startbootstrap-clean-blog/scss/clean-blog.scss`:
    ```scss
    // @import "navbar-search-algolia";
    @import 'navbar-search';
    ```
