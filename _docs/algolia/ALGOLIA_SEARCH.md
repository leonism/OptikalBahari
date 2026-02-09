# Algolia Search Integration

## Overview

This document describes the Algolia InstantSearch integration for Optikal Bahari, providing advanced
search capabilities with real-time results, filtering, and sorting.

## Features

- **Instant Search**: Real-time search results as you type
- **Rich Results**: Display thumbnails, excerpts, and metadata
- **Advanced Filtering**: Filter by categories, tags, and authors
- **Flexible Sorting**: Sort by relevance, date, or title
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark Mode Support**: Full theme integration
- **Keyboard Navigation**: Shortcuts for power users (Cmd/Ctrl+K to open)
- **Accessibility**: ARIA labels and semantic HTML
- **Indonesian Locale**: All UI text in Bahasa Indonesia

## Architecture

### Components

1. **`navbar-search-algolia.html`**: Rounded search trigger icon in navbar
2. **`navbar-overlay-algolia.html`**: Responsive search overlay modal
3. **`algolia-search.js`**: JavaScript controller using local libraries
4. **`_navbar-search-algolia.scss`**: Design system-compliant styles
5. **`algolia_hooks.rb`**: Custom indexing hooks plugin

### Data Flow

```
User Input → Algolia Client → InstantSearch Widgets → UI Update
                ↓
        Algolia Cloud Index
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
ALGOLIA_APPLICATION_ID=UWA3AQQKJK
ALGOLIA_SEARCH_API_KEY=eb94f493bf5806e0348677836f46bfd1
ALGOLIA_ADMIN_API_KEY=9b8ff524249f8bb5768bc98d2b4bef86
ALGOLIA_INDEX_NAME=prod_optikalbahari
```

**⚠️ Security Note**: Never commit `.env` to version control. The `ALGOLIA_ADMIN_API_KEY` should be
kept secret.

### `_config.yml`

The Algolia configuration section includes:

- **application_id**: Your Algolia app ID
- **index_name**: Name of the search index
- **search_only_api_key**: Public search-only API key (safe for frontend)
- **nodes_to_index**: HTML elements to index from content
- **files_to_exclude**: Files to skip during indexing
- **settings**: Index configuration (searchable attributes, facets, ranking, etc.)

See `_config.yml` lines 200-248 for full configuration.

## Indexing Content

### Manual Indexing

To index or re-index your content to Algolia:

```bash
# Using the Ruby script (recommended)
ruby _scripts/algolia/algolia-index.rb

# Or directly
bundle exec jekyll algolia
```

The script will:

1. Load environment variables from `.env`
2. Build the Jekyll site in production mode
3. Upload all indexable content to Algolia
4. Display statistics and completion status

### When to Re-index

Re-index your content when:

- You add, update, or delete posts/pages
- You change Algolia configuration in `_config.yml`
- You modify indexing hooks in `_plugins/algolia_hooks.rb`
- Search results seem outdated

### Automated Indexing (CI/CD)

For automated indexing on deployment, add this to your CI/CD workflow:

```yaml
- name: Index to Algolia
  env:
    ALGOLIA_APPLICATION_ID: ${{ secrets.ALGOLIA_APPLICATION_ID }}
    ALGOLIA_API_KEY: ${{ secrets.ALGOLIA_ADMIN_API_KEY }}
  run: |
    bundle exec jekyll algolia
```

## Usage

### Opening Search

Users can open the search overlay in multiple ways:

1. **Click** the search button in the navbar
2. **Keyboard shortcut**: `Cmd/Ctrl + K`

### Search Features

- **Instant Results**: Results appear as you type
- **Highlighting**: Matched keywords are highlighted in yellow
- **Filtering**: Use checkboxes to filter by categories or tags
- **Sorting**: Choose from "Paling Relevan", "Terbaru", or "Terlama"
- **Pagination**: Navigate through multiple result pages
- **Meta Information**: Each result shows date, category, and author

### Closing Search

- Click the **ESC** button
- Press the **ESC** key
- Click outside the modal overlay

## Customization

### Adding Custom Attributes

Edit `_plugins/algolia_hooks.rb` to add custom fields to your index:

```ruby
module Jekyll
  module Algolia
    module Hooks
      def self.before_indexing_each(record, node, context)
        # Add custom field
        record[:custom_field] = record[:your_field]

        # Return modified record
        record
      end
    end
  end
end
```

### Modifying Search UI

Edit `assets/js/algolia-search.js` to customize:

- Widget templates
- Number of results per page
- Facet limits
- Sort options
- UI text and labels

### Styling

All styles are in `assets/vendor/startbootstrap-clean-blog/scss/_navbar-search-algolia.scss`.

Key customization points:

- **Colors**: Modify color variables for light/dark themes
- **Sizing**: Adjust modal width, hit card dimensions
- **Typography**: Change font sizes and weights
- **Animations**: Modify transition timings and effects

## Keyboard Shortcuts

| Shortcut       | Action                      |
| -------------- | --------------------------- |
| `Cmd/Ctrl + K` | Open search overlay         |
| `ESC`          | Close search overlay        |
| `↑` `↓`        | Navigate results            |
| `Enter`        | Open selected result        |
| `Tab`          | Navigate interface elements |

## Troubleshooting

### No Results Showing

**Possible causes:**

1. **Content not indexed**
   - Run: `./_scripts/algolia/algolia-index.sh`
   - Check Algolia Dashboard for records

2. **Incorrect API keys**
   - Verify keys in `.env` match your Algolia app
   - Ensure `ALGOLIA_SEARCH_API_KEY` is the search-only key (not admin key)

3. **JavaScript errors**
   - Check browser console for errors
   - Verify Algolia CDN scripts are loading

### Search Overlay Not Opening

**Possible causes:**

1. **Algolia not configured**
   - Ensure environment variables are set
   - Verify `_config.yml` has Algolia configuration

2. **JavaScript not loaded**
   - Check that `algolia-search.js` is included
   - Verify CDN scripts are accessible

3. **DOM elements missing**
   - Ensure `_navbar-search-algolia.html` is included in layout
   - Check browser console for JavaScript errors

### Styling Issues

**Solutions:**

1. **SCSS not compiled**
   - Ensure `_navbar-search-algolia.scss` is imported in `clean-blog.scss`
   - Clear Jekyll cache: `bundle exec jekyll clean`

2. **CSS variables undefined**
   - Check `_variables.scss` has all required color variables
   - Verify Bootstrap version compatibility

3. **Dark mode not working**
   - Ensure `[data-bs-theme="dark"]` selector is applied correctly
   - Check that dark mode color variables are defined

### Performance Issues

**Solutions:**

1. **Reduce hits per page**
   - Lower `hitsPerPage` in `_config.yml` (default: 10)

2. **Limit facet values**
   - Reduce `maxValuesPerFacet` in settings

3. **Optimize index size**
   - Exclude unnecessary content via `files_to_exclude`
   - Shorten excerpts in `algolia_hooks.rb`

4. **Use replica indices**
   - Create replicas for pre-sorted results instead of runtime sorting

### Local Libraries

The following libraries are served locally for performance and privacy:

- `/assets/vendor/startbootstrap-clean-blog/js/algoliasearch-lite.umd.js`
- `/assets/vendor/startbootstrap-clean-blog/js/instantsearch.js`

## SEO Considerations

- Search works client-side only (JavaScript required)
- Not indexable by search engines
- Consider maintaining HTML search results page for SEO
- Algolia can help with site search analytics

## Analytics

Monitor search usage in the Algolia Dashboard:

1. Go to https://www.algolia.com/apps/UWA3AQQKJK/analytics
2. View search analytics, top searches, no-result searches
3. Monitor API usage and quota
4. Review search performance metrics

## Cost & Limits

**Free Tier Limits** (Community Plan):

- 10,000 search requests/month
- 10,000 records
- 100KB/record limit

Monitor your usage in the Algolia Dashboard to avoid overages.

## Further Resources

- [Algolia InstantSearch.js Documentation](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/js/)
- [Jekyll Algolia Plugin](https://community.algolia.com/jekyll-algolia/)
- [Algolia Dashboard](https://www.algolia.com/dashboard)
- [InstantSearch Widgets](https://www.algolia.com/doc/api-reference/widgets/js/)

## Support

For issues or questions:

- Check this documentation
- Review Algolia documentation
- Check browser console for errors
- Contact development team

## License

This implementation is part of the Optikal Bahari project and follows the same license.
