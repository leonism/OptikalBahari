# Card Skeleton Component Documentation

## Overview

The `card-skeleton.html` component provides an animated loading placeholder that matches the
structure and dimensions of actual card components. It uses Bootstrap 5's placeholder utilities to
create a professional loading experience.

---

## Location

**File:** `_includes/skeletons/card-skeleton.html`

---

## Why Use This Component?

### Problem It Solves

Without loading placeholders:

1. Users see blank space or spinners
2. No indication of what content is loading
3. Potential layout shift when content appears
4. Poor perceived performance

### Solution

The `card-skeleton.html` component:

- Provides immediate visual feedback
- Shows users what type of content is loading
- Prevents layout shift (matches final content dimensions)
- Improves perceived performance
- Creates professional, modern loading experience
- Uses native Bootstrap utilities (no custom CSS needed)

---

## When to Use

Use this component for:

- ✅ **HTMX/AJAX loading states** - While fetching dynamic content
- ✅ **Pagination "Load More"** - Before new posts appear
- ✅ **Search results** - While searching
- ✅ **Category filtering** - During filter operations
- ✅ **Lazy-loaded sections** - Before content hydrates
- ✅ **Fallback states** - When content fails to load

**Do NOT use for:**

- ❌ Static content (use actual cards)
- ❌ Very fast operations (<100ms)
- ❌ Full-page loads (use server-side rendering)
- ❌ Non-card layouts

---

## How to Use

### Basic Usage

```liquid
{% include skeletons/card-skeleton.html %}
```

### Multiple Skeletons

```liquid
<!-- Show 3 skeleton cards while loading -->
{% for i in (1..3) %}
  <div class='col-md-4 mb-3'>
    {% include skeletons/card-skeleton.html %}
  </div>
{% endfor %}
```

### With HTMX (Recommended)

```html
<div hx-get="/api/posts" hx-trigger="load" hx-swap="outerHTML">
  <!-- Show skeletons while loading -->
  <div class="row">
    {% for i in (1..6) %}
    <div class="col-md-4 mb-3">{% include skeletons/card-skeleton.html %}</div>
    {% endfor %}
  </div>
</div>
```

### Load More Button

```html
<button
  hx-get="/posts/page/2"
  hx-target="#posts-container"
  hx-swap="beforeend"
  hx-indicator="#loading-indicator"
>
  Load More
</button>

<div id="loading-indicator" class="htmx-indicator">
  <div class="row">
    {% for i in (1..3) %}
    <div class="col-md-4 mb-3">{% include skeletons/card-skeleton.html %}</div>
    {% endfor %}
  </div>
</div>
```

---

## Component Structure

### HTML Structure

```html
<div class="card shadow h-100 p-0 bg-white rounded hover-zoomin border-0">
  <!-- Image Skeleton -->
  <div class="ratio ratio-16x9 bg-secondary-subtle placeholder-glow">
    <div class="placeholder w-100 h-100"></div>
  </div>

  <!-- Card Body -->
  <div class="card-body">
    <!-- Title Skeleton -->
    <h5 class="card-title placeholder-glow">
      <span class="placeholder col-7"></span>
    </h5>

    <!-- Text Skeleton -->
    <p class="card-text placeholder-glow">
      <span class="placeholder col-12"></span>
      <span class="placeholder col-4"></span>
    </p>

    <!-- Button Skeleton -->
    <a href="#" tabindex="-1" class="btn btn-primary disabled placeholder col-4 rounded-pill"></a>
  </div>
</div>
```

### Key Classes Explained

| Class                         | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `.placeholder`                | Creates the placeholder element           |
| `.placeholder-glow`           | Adds pulsing animation                    |
| `.col-7`, `.col-12`, `.col-4` | Controls placeholder width                |
| `tabindex="-1"`               | Prevents keyboard focus on skeleton       |
| `.disabled`                   | Prevents interaction with skeleton button |
| `.ratio-16x9`                 | Maintains aspect ratio (prevents CLS)     |

---

## How It Works

### Animation

Bootstrap's `.placeholder-glow` creates a subtle pulsing animation:

```css
/* Bootstrap's built-in animation */
.placeholder-glow .placeholder {
  animation: placeholder-glow 2s ease-in-out infinite;
}

@keyframes placeholder-glow {
  50% {
    opacity: 0.2;
  }
}
```

### Accessibility

- **Non-interactive**: `tabindex="-1"` and `.disabled` prevent interaction
- **Semantic HTML**: Uses proper card structure
- **Screen readers**: Can announce loading state with ARIA attributes

---

## Implementation Examples

### Example 1: Pagination with Skeletons

```html
<!-- _includes/pagination/load-more.html -->
<div id="posts-container">
  {% for post in posts %} {% include postcards/post-card.html post=post %} {% endfor %}
</div>

<div class="text-center my-5">
  <button
    class="btn btn-primary rounded-pill"
    hx-get="{{ next_page_url }}"
    hx-target="#posts-container"
    hx-swap="beforeend"
    hx-indicator="#skeleton-loader"
  >
    Load More Posts
  </button>
</div>

<!-- Skeleton Loader (hidden by default) -->
<div id="skeleton-loader" class="htmx-indicator">
  <div class="row">
    {% for i in (1..3) %}
    <div class="col-md-4 mb-3">{% include skeletons/card-skeleton.html %}</div>
    {% endfor %}
  </div>
</div>
```

### Example 2: Search Results

```html
<!-- _includes/search/search-results.html -->
<input
  type="search"
  name="q"
  hx-get="/search"
  hx-trigger="keyup changed delay:500ms"
  hx-target="#search-results"
  hx-indicator="#search-loading"
  placeholder="Search posts..."
/>

<div id="search-loading" class="htmx-indicator mt-4">
  <div class="row">
    {% for i in (1..6) %}
    <div class="col-md-4 mb-3">{% include skeletons/card-skeleton.html %}</div>
    {% endfor %}
  </div>
</div>

<div id="search-results" class="mt-4">
  <!-- Results will appear here -->
</div>
```

### Example 3: Category Filter

```html
<!-- _includes/filters/category-filter.html -->
<div class="btn-group mb-4" role="group">
  <button
    class="btn btn-outline-primary"
    hx-get="/posts/category/all"
    hx-target="#filtered-posts"
    hx-indicator="#filter-loading"
  >
    All
  </button>
  <button
    class="btn btn-outline-primary"
    hx-get="/posts/category/kacamata"
    hx-target="#filtered-posts"
    hx-indicator="#filter-loading"
  >
    Kacamata
  </button>
  <!-- More category buttons -->
</div>

<div id="filter-loading" class="htmx-indicator">
  <div class="row">
    {% for i in (1..6) %}
    <div class="col-md-4 mb-3">{% include skeletons/card-skeleton.html %}</div>
    {% endfor %}
  </div>
</div>

<div id="filtered-posts" class="row">
  <!-- Filtered posts appear here -->
</div>
```

### Example 4: Fallback State

```liquid
<!-- _includes/sections/featured-posts.html -->
<div class='row'>
  {% if featured_posts.size > 0 %}
    {% for post in featured_posts %}
      <div class='col-md-4 mb-3'>
        {% include postcards/post-card.html post=post %}
      </div>
    {% endfor %}
  {% else %}
    <!-- Show skeletons as fallback -->
    {% for i in (1..3) %}
      <div class='col-md-4 mb-3'>
        {% include skeletons/card-skeleton.html %}
      </div>
    {% endfor %}
  {% endif %}
</div>
```

---

## Customization

### Creating Variant Skeletons

You can create different skeleton variants for different card types:

```html
<!-- _includes/skeletons/card-skeleton-compact.html -->
<div class="card shadow p-0 bg-white rounded">
  <div class="card-body">
    <h6 class="placeholder-glow">
      <span class="placeholder col-8"></span>
    </h6>
    <p class="placeholder-glow mb-0">
      <span class="placeholder col-12"></span>
    </p>
  </div>
</div>
```

### Different Animation Styles

Bootstrap also provides `.placeholder-wave`:

```html
<!-- Use wave animation instead of glow -->
<div class="ratio ratio-16x9 bg-secondary-subtle placeholder-wave">
  <div class="placeholder w-100 h-100"></div>
</div>
```

---

## Best Practices

### 1. Match Actual Content Structure

Ensure skeleton matches the real card:

```liquid
<!-- ✅ Good: Skeleton matches real card -->
Skeleton: Image (16x9) + Title (1 line) + Text (2 lines) + Button Real Card: Image (16x9) + Title (1
line) + Text (2 lines) + Button

<!-- ❌ Bad: Skeleton doesn't match -->
Skeleton: Image (1x1) + Title (2 lines) + Text (1 line) Real Card: Image (16x9) + Title (1 line) +
Text (3 lines) + Button
```

### 2. Use Appropriate Count

```liquid
<!-- ✅ Good: Show expected number of items -->
{% for i in (1..6) %}
  <!-- Expecting 6 posts per page -->
  {% include skeletons/card-skeleton.html %}
{% endfor %}

<!-- ❌ Bad: Too many skeletons -->
{% for i in (1..50) %}
  <!-- Overwhelming -->
  {% include skeletons/card-skeleton.html %}
{% endfor %}
```

### 3. Combine with HTMX Indicators

```css
/* Add to your CSS */
.htmx-indicator {
  display: none;
}

.htmx-request .htmx-indicator {
  display: block;
}

.htmx-request.htmx-indicator {
  display: block;
}
```

### 4. Prevent Layout Shift

Ensure skeleton has same dimensions as real content:

```html
<!-- ✅ Good: Same height -->
<div class="card shadow h-100">...</div>
<!-- Real card -->
<div class="card shadow h-100">...</div>
<!-- Skeleton -->

<!-- ❌ Bad: Different heights cause shift -->
<div class="card shadow">...</div>
<!-- Real card -->
<div class="card shadow h-100">...</div>
<!-- Skeleton -->
```

---

## Performance Considerations

### Pros

- ✅ Improves perceived performance
- ✅ No JavaScript required (pure CSS animation)
- ✅ Lightweight (uses Bootstrap classes)
- ✅ Prevents layout shift
- ✅ Better UX than spinners

### Cons

- ⚠️ Adds HTML to initial page load (if server-rendered)
- ⚠️ May not be necessary for very fast operations
- ⚠️ Requires matching real content structure

---

## Browser Support

Bootstrap 5 placeholders work in all modern browsers:

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Chrome Android 88+

---

## Related Documentation

- [Bootstrap Placeholders](https://getbootstrap.com/docs/5.3/components/placeholders/)
- [HTMX Documentation](https://htmx.org/)
- [Image Ratio Component](image-ratio-component.md)
- [Web.dev: Perceived Performance](https://web.dev/rail/)

---

## Changelog

- **2026-01-30**: Component created as part of CLS optimization project
- **2026-01-31**: Documentation created
- **2026-01-31**: Ready for HTMX integration (pending implementation)

---

## Future Enhancements

- [ ] Create variant skeletons (compact, wide, minimal)
- [ ] Integrate with HTMX pagination
- [ ] Add to search functionality
- [ ] Implement in category filtering
- [ ] Add ARIA live regions for screen readers
- [ ] Create skeleton for other component types (lists, tables)
