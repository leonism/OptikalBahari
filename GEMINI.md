# Project Context: Optikal Bahari

## Project Overview

This project is a static website for **Optikal Bahari**, an optical store based in Kemayoran,
Jakarta. It is built using **Jekyll**, a Ruby-based static site generator. The site provides
information about eye exams, glasses, contact lenses, and includes a blog with articles related to
eye health and eyewear trends.

The codebase is customized from the "Clean Blog" Jekyll theme, utilizing Bootstrap for styling and
Liquid for templating. It features extensive optimizations for performance, including asset
compression (Brotli/Gzip) and minification.

## Tech Stack

- **Static Site Generator:** Jekyll (v4.4.1)
- **Language:** Ruby, Liquid (Templating), SCSS/Sass (Styling)
- **Framework:** Bootstrap 5 (with premium custom SCSS)
- **Asset Management:** Cloudinary (Production) / Local (Development) hybrid
- **Search Engine:** Algolia InstantSearch (with local JS libraries)
- **Data Pipeline:** Apify (Reviews Scraper) -> Cloudflare KV/Worker -> Jekyll Build
- **Key Plugins:**
  - `jekyll-paginate-v2` (Advanced Pagination for posts and reviews)
  - `jekyll-algolia` (Search indexing)
  - `jekyll-seo-tag` (SEO)
  - `jekyll-sitemap` (Sitemap generation)
  - `jekyll-minifier` (HTML/JS/CSS minification)
  - `jekyll-archives` (Category/Tag archives)

## Building and Running

### Prerequisites

- Ruby (check version with `ruby -v` or `.ruby-version`)
- Bundler (`gem install bundler`)
- Environment variables in `.env` (Cloudinary, Algolia, etc.)

### Development Commands

- **Install Dependencies:**
  ```bash
  bundle install
  ```
- **Start Local Server:**

  ```bash
  bundle exec jekyll serve
  ```

  - With auto-reload: `bundle exec jekyll serve --livereload`
  - With drafts: `bundle exec jekyll serve --drafts`

- **Clean Build Artifacts:**
  ```bash
  bundle exec jekyll clean
  ```

### Maintenance Commands

- **Index Search Content:**
  ```bash
  ruby _scripts/algolia/algolia-index.rb
  ```
- **Migrate Images to Cloudinary:**
  ```bash
  ruby _scripts/migrate_to_cloudinary.rb
  ```

### Production Build

To build the site for production (enables optimizations and minification):

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

_Note: The `_config.yml` defines a custom build command that also runs a post-build script:_

```bash
bundle exec jekyll build && bash _scripts/post-built/post-build.sh
```

## Project Structure

- **`_config.yml`**: Main configuration (site settings, plugins, search attributes).
- **`_posts/`**: Blog posts (Markdown). Naming: `YYYY-MM-DD-title.md`.
- **`_pages/`**: Static pages (Markdown).
- **`_drafts/`**: Unpublished posts.
- **`_layouts/`**: HTML templates (`default`, `post`, `page`, `testimoni`).
- **`_includes/`**: Reusable partials (header, footer, navigation, search).
  - `_includes/cloudinary/`: Cloudinary-specific components.
- **`_plugins/`**: Custom Ruby logic.
  - `fetch_reviews.rb`: Injects remote Google reviews into site collections.
  - `algolia_hooks.rb`: Customizes indexing for search.
- **`_scripts/`**: Automation scripts (algolia, building, cleanup).
- **`_docs/`**: Deep-dive documentation for integrations.
- **`assets/`**: Styles (SCSS), Scripts (JS), and original images.

## Third-Party Services Implementation

### 1. Cloudinary Integration

- **Purpose**: Automatic image optimization, responsive resizing, and AVIF/WebP delivery.
- **Usage**:
  - Use `{% include cloudinary_image.html %}` for most images.
  - Use `{{ path | cloudinary_url }}` for backgrounds.
- **Environment**: Automatically switches to local assets in `development` mode for speed.

### 2. Algolia Search

- **Trigger**: `Cmd/Ctrl + K` or search icon in navbar.
- **Features**: Instant overlay modal, rich results with thumbnails, and category/tag filtering.
- **Maintenance**: Must run `algolia-index.rb` whenever content changes to sync the index.

### 3. Automated Google Reviews

- **Pipeline**: Apify Scraper -> Cloudflare KV -> Jekyll Plugin.
- **Display**: Virtual collection `reviews` is generated at build time.
- **Location**: Managed in `/testimoni/` with Masonry grid layout.

## Advanced Components

### jekyll-paginate-v2

- Used for paginating both blog posts and Google reviews.
- Supports pagination in subdirectories (e.g., `/testimoni/page/2/`).
- **Note**: Requires local build or CI pipeline as GitHub Pages doesn't support the V2 plugin.

### Image Ratio Wrapper (`image-ratio.html`)

- **Location**: `_includes/cloudinary/image-ratio.html`.
- **Function**: Reserves space for images using Bootstrap `.ratio` to prevent **Cumulative Layout
  Shift (CLS)**.
- **Usage**: Mandatory for all card images and hero banners to maintain Core Web Vitals.

## Development Conventions

- **Content:**
  - Pages go in `_pages/`, posts in `_posts/` with standard front matter.
  - Reviews are fetched dynamically; do not edit review markdown files directly.
- **Styling:**
  - Standard SCSS in `_sass/`. Custom premium styles in `_navbar-search-algolia.scss`.
  - Use Bootstrap utility classes for layout (e.g., `.ratio`, `.object-fit-cover`).
- **Assets:**
  - Always provide `alt` tags and `width`/`height` for images.
  - Use the `image-ratio.html` component for all featured images.
- **Performance:**
  - The site targets **100/100 Lighthouse scores**.
  - Always verify CLS and LCP after adding new visual components.
