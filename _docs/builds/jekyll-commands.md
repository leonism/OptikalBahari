# List of **Jekyll commands** for `building`, `serving`, and `managing` static site:

## **1. Basic Commands**

| Command                                      | Description                                              |
| -------------------------------------------- | -------------------------------------------------------- |
| `jekyll new <site-name>`                     | Creates a new Jekyll site                                |
| `jekyll build` or `bundle exec jekyll build` | Builds the site into `_site/`                            |
| `jekyll serve` or `bundle exec jekyll serve` | Starts a local server (default: `http://localhost:4000`) |
| `jekyll clean`                               | Deletes `_site/` and other cached files                  |

## **2. Development Server Options**

| Command                      | Description                          |
| ---------------------------- | ------------------------------------ |
| `jekyll serve --livereload`  | Auto-refresh browser on changes      |
| `jekyll serve --drafts`      | Includes draft posts (`_drafts/`)    |
| `jekyll serve --incremental` | Faster builds (partial regeneration) |
| `jekyll serve --port 5000`   | Uses a custom port (e.g., `5000`)    |

## **3. Content Creation**

| Command                       | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `jekyll post "My Post Title"` | _(Requires plugin)_ Creates a new post in `_posts/` |
| `jekyll page "about.md"`      | _(Requires plugin)_ Creates a new page              |

## **4. Advanced Build Options**

| Command                  | Description                     |
| ------------------------ | ------------------------------- |
| `jekyll build --watch`   | Rebuilds on file changes        |
| `jekyll build --profile` | Shows build performance metrics |
| `jekyll build --trace`   | Debug with full backtrace       |

## **5. Plugin & Dependency Management**

| Command                    | Description                  |
| -------------------------- | ---------------------------- |
| `bundle install`           | Installs gems from `Gemfile` |
| `bundle update`            | Updates gems                 |
| `bundle exec jekyll serve` | Runs Jekyll with Bundler     |

## **6. Environment-Specific Builds**

| Command                              | Description                                      |
| ------------------------------------ | ------------------------------------------------ |
| `JEKYLL_ENV=production jekyll build` | Builds for production (uses `production` config) |

### **Common Workflow Example**

1. **Create a new site**:

   ```bash
   jekyll new my-blog && cd my-blog
   ```

2. **Run locally with auto-reload**:

   ```bash
   bundle exec jekyll serve --livereload
   ```

3. **Add a new post**: Manually create `_posts/YYYY-MM-DD-title.md` or use a plugin like
   `jekyll-compose`.

4. **Build for production**:
   ```bash
   JEKYLL_ENV=production jekyll build
   ```

---

### **Troubleshooting**

- **"Command not found"**: Ensure Jekyll is installed (`gem install jekyll bundler`).
- **Dependency issues**: Use `bundle exec` prefix or run `bundle install`.
- **Broken links**: Check with `jekyll doctor` (requires `jekyll-seo-tag` plugin).
