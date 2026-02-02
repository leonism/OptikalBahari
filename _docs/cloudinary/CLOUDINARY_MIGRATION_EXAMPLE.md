# Cloudinary Migration Example

This document shows how to update your existing Jekyll posts and pages to use the new Cloudinary
integration.

## Before: Traditional Image Usage

```html
<!-- Old way: Direct image paths -->
<picture>
  <!-- AVIF format -->
  <source
    srcset="
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_480/posts/beach-retro-girls/beach-retro-girls-025   480w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_768/posts/beach-retro-girls/beach-retro-girls-025   768w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_1200/posts/beach-retro-girls/beach-retro-girls-025 1200w
    "
    type="image/avif"
    sizes="(max-width: 768px) 100vw, 768px"
  />

  <!-- WEBP format -->
  <source
    srcset="
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_480/posts/beach-retro-girls/beach-retro-girls-025   480w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_768/posts/beach-retro-girls/beach-retro-girls-025   768w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_1200/posts/beach-retro-girls/beach-retro-girls-025 1200w
    "
    type="image/webp"
    sizes="(max-width: 768px) 100vw, 768px"
  />

  <!-- JPEG fallback -->
  <source
    srcset="
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_480/posts/beach-retro-girls/beach-retro-girls-025   480w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/posts/beach-retro-girls/beach-retro-girls-025   768w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_1200/posts/beach-retro-girls/beach-retro-girls-025 1200w
    "
    type="image/jpeg"
    sizes="(max-width: 768px) 100vw, 768px"
  />

  <!-- Final fallback with alt and lazy loading -->
  <img
    src="https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/posts/beach-retro-girls/beach-retro-girls-025"
    alt="Apa itu Lensa Photochromic?"
    loading="lazy"
    decoding="async"
    width="768"
    height="512"
    class="card-img-top img-fluid"
  />
</picture>

<!-- Background images in front matter -->
background:
https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_1200/posts/beach-retro-girls/beach-retro-girls-037
```

## After: Cloudinary Integration

### Option 1: Using the Cloudinary Include (Recommended)

```html
<!-- New way: Cloudinary include with responsive images -->
{% include cloudinary_image.html
src="/assets/img/posts/beach-retro-girls/beach-retro-girls-025.webp" alt="Apa itu Lensa
Photochromic?" class="card-img-top img-fluid" preset="card" loading="lazy" %}
```

### Option 2: Using Liquid Filters

```html
<!-- Using Cloudinary filters -->
<picture>
  <!-- AVIF format -->
  <source
    srcset="
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_480/posts/beach-retro-girls/beach-retro-girls-025   480w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_768/posts/beach-retro-girls/beach-retro-girls-025   768w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_1200/posts/beach-retro-girls/beach-retro-girls-025 1200w
    "
    type="image/avif"
    sizes="(max-width: 768px) 100vw, 768px"
  />

  <!-- WEBP format -->
  <source
    srcset="
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_480/posts/beach-retro-girls/beach-retro-girls-025   480w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_768/posts/beach-retro-girls/beach-retro-girls-025   768w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_1200/posts/beach-retro-girls/beach-retro-girls-025 1200w
    "
    type="image/webp"
    sizes="(max-width: 768px) 100vw, 768px"
  />

  <!-- JPEG fallback -->
  <source
    srcset="
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_480/posts/beach-retro-girls/beach-retro-girls-025   480w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/posts/beach-retro-girls/beach-retro-girls-025   768w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_1200/posts/beach-retro-girls/beach-retro-girls-025 1200w
    "
    type="image/jpeg"
    sizes="(max-width: 768px) 100vw, 768px"
  />

  <!-- Final fallback with alt and lazy loading -->
  <img
    src="https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/posts/beach-retro-girls/beach-retro-girls-025"
    alt="Apa itu Lensa Photochromic?"
    loading="lazy"
    decoding="async"
    width="768"
    height="512"
    class="card-img-top img-fluid"
  />
</picture>
```

### Option 3: Using Cloudinary Tag

```html
<!-- Using Cloudinary tag -->
<picture>
  <!-- AVIF format -->
  <source
    srcset="
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_480/posts/beach-retro-girls/beach-retro-girls-025   480w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_768/posts/beach-retro-girls/beach-retro-girls-025   768w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_1200/posts/beach-retro-girls/beach-retro-girls-025 1200w
    "
    type="image/avif"
    sizes="(max-width: 768px) 100vw, 768px"
  />

  <!-- WEBP format -->
  <source
    srcset="
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_480/posts/beach-retro-girls/beach-retro-girls-025   480w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_768/posts/beach-retro-girls/beach-retro-girls-025   768w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_1200/posts/beach-retro-girls/beach-retro-girls-025 1200w
    "
    type="image/webp"
    sizes="(max-width: 768px) 100vw, 768px"
  />

  <!-- JPEG fallback -->
  <source
    srcset="
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_480/posts/beach-retro-girls/beach-retro-girls-025   480w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/posts/beach-retro-girls/beach-retro-girls-025   768w,
      https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_1200/posts/beach-retro-girls/beach-retro-girls-025 1200w
    "
    type="image/jpeg"
    sizes="(max-width: 768px) 100vw, 768px"
  />

  <!-- Final fallback with alt and lazy loading -->
  <img
    src="https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/posts/beach-retro-girls/beach-retro-girls-025"
    alt="Apa itu Lensa Photochromic?"
    loading="lazy"
    decoding="async"
    width="768"
    height="512"
    class="card-img-top img-fluid"
  />
</picture>
```

### Background Images

```yaml
# In front matter - the filter will handle Cloudinary conversion
background: https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_1200/posts/beach-retro-girls/beach-retro-girls-037
```

```css
/* In CSS - use the filter */
.hero-section {
  background-image: url('{{ page.background | cloudinary_preset: "hero" }}');
}
```

## Complete Updated Post Example

```html
---
layout: post
title: Kacamata & Lensa Photocromic Terbaik
subtitle: Bisa Didapatkan di Optikal Bahari
description:
  'Jelajahi koleksi kacamata & lensa photochromic eksklusif terbaru di Optikal Bahari. Temukan gaya
  unik Anda dengan kenyamanan dan kualitas yang tak tertanding'
keywords: 'lensa photochromic, kacamata photochromic, kacamata & lensa photochromic'
lang: id-ID
date: '2020-02-09 08:25:23 +0700'
author: Optikal Bahari
categories: [Lensa]
tags: [lensa, produk]
background: https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_1200/posts/beach-retro-girls/beach-retro-girls-037
comments: true
---

<div class="card-deck mb-3">
  <div class="card shadow p-3 mb-5 bg-white rounded">
    {% include cloudinary_image.html
    src="/assets/img/posts/beach-retro-girls/beach-retro-girls-025.webp" alt="Apa itu Lensa
    Photochromic?" class="card-img-top img-fluid" preset="card" loading="lazy" %}
    <div class="card-body">
      <h3 class="card-title">Apa itu Lensa Photochromic?</h3>
      <p class="card-text text-left">
        Lensa photochromic adalah teknologi revolusioner dalam dunia optik yang menyesuaikan diri
        dengan perubahan cahaya lingkungan secara otomatis.
        <!-- rest of content -->
      </p>
    </div>
  </div>
</div>
```

## Benefits of the Migration

### Performance Improvements

- **Automatic Format Optimization**: WebP/AVIF for modern browsers, JPEG fallback
- **Responsive Images**: Multiple sizes generated automatically
- **CDN Delivery**: Global content delivery network for faster loading
- **Lazy Loading**: Built-in lazy loading support

### SEO Benefits

- **Faster Page Load**: Improved Core Web Vitals
- **Better Mobile Experience**: Optimized images for mobile devices
- **Reduced Bandwidth**: Smaller file sizes without quality loss

### Maintenance Benefits

- **Cloud Storage**: Images stored in Cloudinary, not in your repository
- **Automatic Optimization**: No need to manually optimize images
- **Version Control**: Smaller repository size
- **Backup**: Images safely stored in the cloud

## Migration Steps

1. **Set up Cloudinary** (follow CLOUDINARY_SETUP.md)
2. **Run migration script** to upload existing images
3. **Update templates** to use Cloudinary includes
4. **Test in development** with `JEKYLL_ENV=development`
5. **Deploy to production** with `JEKYLL_ENV=production`

## Gradual Migration Strategy

You can migrate gradually:

1. **Start with new content**: Use Cloudinary includes for new posts
2. **Update high-traffic pages**: Migrate popular posts first
3. **Batch update**: Use find/replace to update multiple files
4. **Keep fallbacks**: Local images remain as backup

## Find and Replace Patterns

### For simple image tags:

```bash
# Find:
<img.*?src="(/assets/img/[^"]+)".*?alt="([^"]+)".*?class="([^"]+)".*?/?>

# Replace with:
{% include cloudinary_image.html src="$1" alt="$2" class="$3" %}
```

### For data-src attributes:

```bash
# Find:
data-src="(/assets/img/[^"]+)"

# Replace with:
data-src="{{ '$1' | cloudinary_url }}"
```

Remember to test thoroughly after any bulk replacements!
