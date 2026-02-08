# Algolia Search - Quick Start Guide

## Prerequisites

- ✅ Algolia account with application created
- ✅ API keys obtained (Application ID, Search-Only API Key, Admin API Key)
- ✅ Jekyll site set up and running
- ✅ Local libraries installed in `assets/vendor/startbootstrap-clean-blog/js/`

## Quick Setup (5 Minutes)

### **Step 1: Add Credentials** (1 min)

Credentials have already been added to `.env`:

```env
ALGOLIA_APPLICATION_ID=UWA3AQQKJK
ALGOLIA_SEARCH_API_KEY=eb94f493bf5806e0348677836f46bfd1
ALGOLIA_ADMIN_API_KEY=9b8ff524249f8bb5768bc98d2b4bef86
ALGOLIA_INDEX_NAME=prod_optikalbahari
```

**✅ Status**: Complete

---

### **Step 2: Install Dependencies** (2 min)

Install the required Ruby gems:

```bash
bundle install
```

This installs:

- `algoliasearch-jekyll` (already in Gemfile)
- All other dependencies

---

### **Step 3: Index Your Content** (2 min)

Run the indexing script to upload your content to Algolia:

```bash
ruby _scripts/algolia/algolia-index.rb
```

Or manually:

```bash
JEKYLL_ENV=production bundle exec jekyll build
bundle exec jekyll algolia
```

**What this does:**

- Builds your Jekyll site
- Extracts content from posts and pages
- Uploads to Algolia with metadata (title, excerpt, categories, tags, etc.)
- Configures search settings

---

### **Step 4: Test Locally** (< 1 min)

Start your Jekyll development server:

```bash
bundle exec jekyll serve
```

Open http://localhost:4000 and:

1. ✅ Look for the search button in the navbar
2. ✅ Click it OR press `Cmd/Ctrl + K`
3. ✅ Type a search query
4. ✅ See instant results appear

---

### **Step 5: Verify Features**

Test each feature:

- [x] Search overlay opens with button click
- [x] Search overlay opens with `Cmd/Ctrl + K`
- [x] Typing shows instant results
- [x] Results show thumbnails, headlines, and excerpts
- [x] Search by Algolia logo in footer
- [x] Filtering by categories/tags works (expandable)
- [x] Pagination matches site design
- [x] Clicking a result navigates to the page
- [x] ESC key closes the overlay
- [x] Dark mode styles apply correctly
- [x] Mobile responsive layout works (with margins)

---

## Deployment

### For Production

1. **Set Environment Variables** on your hosting platform:

   ```
   ALGOLIA_APPLICATION_ID=UWA3AQQKJK
   ALGOLIA_SEARCH_API_KEY=eb94f493bf5806e0348677836f46bfd1
   ALGOLIA_INDEX_NAME=prod_optikalbahari
   ```

2. **Build and Deploy**:

   ```bash
   JEKYLL_ENV=production bundle exec jekyll build
   ```

3. **Index on Deploy** (optional - automate this):
   ```bash
   bundle exec jekyll algolia
   ```

---

## Common Tasks

### Re-index Content

When you add/update posts or pages:

```bash
ruby _scripts/algolia/algolia-index.rb
```

### Clear Jekyll Cache

If styles aren't updating:

```bash
bundle exec jekyll clean
bundle exec jekyll serve
```

### View Algolia Dashboard

Monitor search analytics and index status:

https://www.algolia.com/apps/UWA3AQQKJK/dashboard

---

## Troubleshooting Checklist

### Search Not Working?

**1. Check environment variables are loaded:**

```bash
grep ALGOLIA .env
```

**2. Verify content is indexed:**

- Visit: https://www.algolia.com/apps/UWA3AQQKJK/explorer
- Check for records in `prod_optikalbahari` index

**3. Check browser console:**

- Open DevTools → Console
- Look for JavaScript errors

**4. Verify Jekyll config:**

```bash
bundle exec jekyll doctor
```

---

## Next Steps

### Customize the Search

1. **Adjust UI text**: Edit `assets/js/algolia-search.js`
2. **Modify styles**: Edit
   `assets/vendor/startbootstrap-clean-blog/scss/_navbar-search-algolia.scss`
3. **Change index settings**: Edit `_config.yml` algolia section
4. **Add custom fields**: Edit `_plugins/algolia_hooks.rb`

### Advanced Features

- **Create replica indices** for custom sorting
- **Add synonyms** in Algolia dashboard
- **Configure stop words** for better relevance
- **Set up Rules** for query transformation
- **Enable Analytics** for insights

---

## Configuration Files Reference

| File                                                 | Purpose                          |
| ---------------------------------------------------- | -------------------------------- |
| `.env`                                               | API credentials (do not commit!) |
| `_config.yml`                                        | Algolia index configuration      |
| `_plugins/algolia_hooks.rb`                          | Custom indexing logic            |
| `_scripts/algolia/algolia-index.sh`                  | Indexing automation script       |
| `_includes/navigation/navbar-search-algolia.html`    | Search button                    |
| `_includes/navigation/_navbar-search-algolia.html`   | Search modal                     |
| `assets/js/algolia-search.js`                        | Search controller                |
| `assets/vendor/.../scss/_navbar-search-algolia.scss` | Search styles                    |

---

## Getting Help

**Documentation:**

- See `_docs/ALGOLIA_SEARCH.md` for detailed documentation
- Algolia docs: https://www.algolia.com/doc/

**Common Issues:**

- No results? → Re-run indexing script
- Styles broken? → Clear Jekyll cache
- Overlay won't open? → Check browser console for errors

---

## Success Checklist ✅

- [x] Credentials added to `.env`
- [x] Dependencies installed (`bundle install`)
- [x] Content indexed to Algolia
- [ ] Local testing complete
- [ ] All features verified
- [ ] Production deployment ready
- [ ] Environment variables set on hosting
- [ ] Search working on live site

---

**🎉 Congratulations!** You now have a powerful, instant search experience on your Jekyll site!

For detailed documentation, see `_docs/ALGOLIA_SEARCH.md`.
