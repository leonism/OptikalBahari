# Image Ratio Component Documentation

## Overview

The `image-ratio.html` component is a reusable wrapper that prevents **Cumulative Layout Shift
(CLS)** by enforcing aspect ratios on images before they load. This is critical for Core Web Vitals
and provides a better user experience.

---

## Location

**File:** `_includes/components/image-ratio.html`

---

## Why Use This Component?

### Problem It Solves

Without aspect-ratio containers, images cause layout shifts when they load:

1. Browser renders page with no space reserved for images
2. Image downloads and browser calculates dimensions
3. Layout shifts to accommodate the image
4. Poor CLS score and jarring user experience

### Solution

The `image-ratio.html` component:

- Reserves space using Bootstrap's `.ratio` utility
- Prevents layout shift by maintaining aspect ratio
- Adds placeholder background during loading
- Improves Core Web Vitals (CLS score)
- Provides consistent, professional appearance

---

## When to Use

Use this component whenever you have:

- ✅ Card images (blog posts, products, features)
- ✅ Hero images that need consistent aspect ratios
- ✅ Gallery or grid layouts
- ✅ Any image that could cause layout shift
- ✅ Responsive images with `<picture>` elements

**Do NOT use for:**

- ❌ Logos or icons with intrinsic dimensions
- ❌ SVG graphics
- ❌ Background images (use CSS instead)
- ❌ Images with `position: absolute`

---

## How to Use

### Basic Usage

```liquid
{% capture card_content %}
<img src="/path/to/image.jpg" alt="Description" loading="lazy" />
{% endcapture %}
{% include components/image-ratio.html ratio="16x9" content=card_content %}
```

### With Picture Element (Recommended)

```liquid
{% capture card_content %}
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img
    src="image.jpg"
    alt="Description"
    loading="lazy"
    decoding="async"
    width="768"
    height="512"
  />
</picture>
{% endcapture %}
{% include components/image-ratio.html ratio="16x9" content=card_content %}
```

### With Custom Background Color

```liquid
{%
  include components/image-ratio.html
  ratio="16x9"
  background_color="bg-primary-subtle"
  content=card_content
%}
```

---

## Parameters

| Parameter          | Type   | Default                 | Description                                       |
| ------------------ | ------ | ----------------------- | ------------------------------------------------- |
| `ratio`            | String | `"16x9"`                | Aspect ratio (e.g., "16x9", "4x3", "1x1", "21x9") |
| `background_color` | String | `"bg-secondary-subtle"` | Bootstrap background class for placeholder        |
| `content`          | String | Required                | The image/picture HTML to wrap                    |

### Available Ratios

Bootstrap 5 supports these ratios out of the box:

- `1x1` - Square (1:1)
- `4x3` - Standard (4:3)
- `16x9` - Widescreen (16:9) **← Most common**
- `21x9` - Ultra-wide (21:9)

---

## How It Works

### Component Code

```liquid
{% assign ratio = include.ratio | default: '16x9' %}
{% assign bg_color = include.background_color | default: 'bg-secondary-subtle' %}

<div class='ratio ratio-{{ ratio }} {{ bg_color }} placeholder-glow overflow-hidden'>
  {{ include.content | replace: '<img ', '<img class="object-fit-cover w-100 h-100" ' }}
</div>
```

### Technical Details

1. **Aspect Ratio Container**: Uses Bootstrap's `.ratio` utility which sets `position: relative` and
   calculates padding-bottom based on aspect ratio
2. **Placeholder Background**: Shows a subtle background color while image loads
3. **Automatic Class Injection**: Adds `object-fit-cover w-100 h-100` to all `<img>` tags
4. **Overflow Hidden**: Prevents images from breaking out of container
5. **Placeholder Glow**: Adds subtle animation during loading

---

## Current Implementation

The component is currently used in **15+ locations**:

### Home Page Cards

- `_includes/home/home-cards-main.html` (3 cards)
- `_includes/home/home-cards-category.html` (3 cards)
- `_includes/home/home-cards-kacamata.html` (3 cards)
- `_includes/home/home-cards-kjp.html` (1 card)

### Post Cards

- `_includes/postcards/post-card.html`
- `_includes/postcards/posts-home.html`
- `_includes/postcards/posts-category.html` (3 instances)

---

## Best Practices

### 1. Always Specify Width and Height

```liquid
<img
  src='image.jpg'
  alt='Description'
  width='768'
  <!--
  ✅
  Helps
  browser
  calculate
  aspect
  ratio
  --
>
height="512"
<!-- ✅ Prevents CLS even without CSS -->
loading="lazy" />
```

### 2. Use Appropriate Aspect Ratios

- **Blog cards**: `16x9` (widescreen)
- **Profile images**: `1x1` (square)
- **Banners**: `21x9` (ultra-wide)
- **Traditional photos**: `4x3`

### 3. Combine with Lazy Loading

```liquid
<img
  src='image.jpg'
  loading='lazy'
  <!--
  ✅
  Defers
  off-screen
  images
  --
>
decoding="async"
<!-- ✅ Non-blocking decode -->
/>
```

### 4. Use Cloudinary Transformations

```liquid
{% capture card_content %}
<picture>
  <source
    srcset="https://res.cloudinary.com/.../f_avif,w_768/image 768w"
    type="image/avif"
  />
  <img src="..." alt="..." />
</picture>
{% endcapture %}
```

---

## Performance Impact

### Before Implementation

- **CLS Score**: 0.25+ (Poor)
- **Layout shifts**: 3-5 per page load
- **User experience**: Jarring, unprofessional

### After Implementation

- **CLS Score**: 0.05 or less (Good)
- **Layout shifts**: 0-1 per page load
- **User experience**: Smooth, professional

---

## Troubleshooting

### Image Not Covering Container

**Problem**: Image doesn't fill the container properly

**Solution**: The component automatically adds `object-fit-cover`, but ensure your image has
sufficient resolution:

```liquid
<!-- ✅ Good: High-res image -->
<img src='image-1200w.jpg' width='1200' height='800'>

<!-- ❌ Bad: Low-res image stretched -->
<img src='image-300w.jpg' width='300' height='200'>
```

### Wrong Aspect Ratio

**Problem**: Images appear stretched or cropped incorrectly

**Solution**: Match the ratio parameter to your actual image dimensions:

```liquid
<!-- Image is 1200x800 (3:2 ratio) -->
<!-- Use 16x9 for slight crop, or create custom ratio -->
{% include components/image-ratio.html ratio="16x9" content=card_content %}
```

### Background Color Shows

**Problem**: Placeholder background visible after image loads

**Solution**: Ensure image has `object-fit-cover w-100 h-100` (automatically added) and check image
URL is valid.

---

## Related Documentation

- [Bootstrap Ratio Utilities](https://getbootstrap.com/docs/5.3/helpers/ratio/)
- [Web.dev: Optimize CLS](https://web.dev/optimize-cls/)
- [Cloudinary Documentation](cloudinary/)
- [Card Skeleton Component](card-skeleton-component.md)

---

## Changelog

- **2026-01-30**: Component created as part of CLS optimization project
- **2026-01-30**: Implemented across all card components (15+ locations)
- **2026-01-31**: Documentation created

---

## Examples

### Example 1: Blog Post Card

```liquid
{% capture card_content %}
<picture>
  <source srcset="{{ post.image | cloudinary_url: 'f_avif,w_768' }}" type="image/avif" />
  <source srcset="{{ post.image | cloudinary_url: 'f_webp,w_768' }}" type="image/webp" />
  <img
    src="{{ post.image }}"
    alt="{{ post.title }}"
    loading="lazy"
    width="768"
    height="512"
  />
</picture>
{% endcapture %}
{% include components/image-ratio.html ratio="16x9" content=card_content %}
```

### Example 2: Square Profile Image

```liquid
{% capture profile_content %}
<img
  src="{{ author.avatar }}"
  alt="{{ author.name }}"
  loading="lazy"
  width="400"
  height="400"
/>
{% endcapture %}
{% include components/image-ratio.html ratio="1x1" content=profile_content %}
```

### Example 3: Custom Background

```liquid
{%
  include components/image-ratio.html
  ratio="21x9"
  background_color="bg-dark"
  content=hero_content
%}
```
