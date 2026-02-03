# Updating to `jekyll-paginate-v2`

Since we want to use `jekyll-paginate-v2` for pagination and keep our existing root `index.html`
intact, we'll set up pagination in a subdirectory (e.g., `/posts/`) as a separate page. This
approach works around the limitation of the default `jekyll-paginate` plugin, which only paginates
the root `index.html`, and leverages the more flexible `jekyll-paginate-v2` plugin, which supports
pagination in subdirectories. However, note that `jekyll-paginate-v2` is not supported by GitHub
Pages out of the box, so you'll need to generate the site locally and push the static files to your
repository (more on this later). Here’s how to implement this:

## Step 1: Install `jekyll-paginate-v2`

Update your `Gemfile` to include the plugin:

```ruby
group :jekyll_plugins do
  gem "jekyll-paginate-v2"
end
```

Run `bundle install` to install it.

---

## Step 2: Configure `_config.yml`

Add the pagination settings for `jekyll-paginate-v2`. Since we’re paginating in `/posts/`, configure
it like this:

```yaml
# Site settings
baseurl: '' # Adjust if your site uses a subpath
url: 'http://example.com' # Your site’s URL

# Pagination settings for jekyll-paginate-v2
pagination:
  enabled: true
  per_page: 9 # 9 posts per page (3 per section)
  permalink: '/page/:num/' # URL structure for paginated pages (e.g., /posts/page/2/)
  title: ':title - Page :num' # Page title format
  sort_field: 'date' # Sort posts by date
  sort_reverse: true # Newest first
  trail:
    before: 2 # Show 2 pages before current page in navigation
    after: 2 # Show 2 pages after current page in navigation
```

Remove any `paginate` or `paginate_path` settings if they exist, as those are for `jekyll-paginate`,
not v2.

---

## Step 3: Create `posts/index.html`

Create a file at `posts/index.html` (not in the root) with this content. This will be your paginated
posts page:

```html
---
layout: default # Use your site’s default layout
permalink: /posts/ # Sets the base URL as /posts/
pagination:
  enabled: true # Enable pagination for this page
---

<!-- Section 1: First 3 posts -->
<section id="posts-category1">
  <div class="card-deckrow mb-3 card-deck">
    {% for post in paginator.posts limit:3 offset:0 %}
    <div class="card shadow p-0 mb-3 bg-white rounded hover-zoomin">
      <a
        href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}"
        title="{{ post.title }}"
      >
        {% if post.background %}
        <picture>
          <!-- AVIF format -->
          <source
            srcset="
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_480/bg-index-arch-5   480w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_768/bg-index-arch-5   768w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_1200/bg-index-arch-5 1200w
            "
            type="image/avif"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <!-- WEBP format -->
          <source
            srcset="
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_480/bg-index-arch-5   480w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_768/bg-index-arch-5   768w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_1200/bg-index-arch-5 1200w
            "
            type="image/webp"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <!-- JPEG fallback -->
          <source
            srcset="
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_480/bg-index-arch-5   480w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/bg-index-arch-5   768w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_1200/bg-index-arch-5 1200w
            "
            type="image/jpeg"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <!-- Final fallback with alt and lazy loading -->
          <img
            src="https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/bg-index-arch-5"
            alt="{{ post.title }}"
            loading="lazy"
            decoding="async"
            width="768"
            height="512"
            class="card-img-top img-fluid"
          />
        </picture>
        {% endif %}
      </a>
      <div class="card-body">
        <h5 class="card-title">{{ post.title | truncate: 50 }}</h5>
        <p class="card-text text-left">
          {{ post.description | strip_html | truncate: 100 }}
          <a
            class="btn btn-primary rounded-pill mt-3"
            href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}"
          >
            Lebih Lanjut
          </a>
        </p>
      </div>
      <div class="card-footer">
        <small class="text-muted">
          Posted by {% if post.author %}{{ post.author }}{% else %}{{ site.author }}{% endif %}, on
          {{ post.date | date: '%b %d, %Y' }} · {% include postcards/read_time.html
          content=post.content %}
        </small>
      </div>
    </div>
    {% endfor %}
  </div>
</section>

<!-- Section 2: Next 3 posts -->
<section id="posts-category2">
  <div class="card-deckrow mb-2 card-deck">
    {% for post in paginator.posts limit:3 offset:3 %}
    <div class="card shadow p-0 mb-3 bg-white rounded hover-zoomin">
      <a
        href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}"
        title="{{ post.title }}"
      >
        {% if post.background %}
        <picture>
          <!-- AVIF format -->
          <source
            srcset="
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_480/bg-index-arch-5   480w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_768/bg-index-arch-5   768w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_1200/bg-index-arch-5 1200w
            "
            type="image/avif"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <!-- WEBP format -->
          <source
            srcset="
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_480/bg-index-arch-5   480w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_768/bg-index-arch-5   768w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_1200/bg-index-arch-5 1200w
            "
            type="image/webp"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <!-- JPEG fallback -->
          <source
            srcset="
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_480/bg-index-arch-5   480w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/bg-index-arch-5   768w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_1200/bg-index-arch-5 1200w
            "
            type="image/jpeg"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <!-- Final fallback with alt and lazy loading -->
          <img
            src="https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/bg-index-arch-5"
            alt="{{ post.title }}"
            loading="lazy"
            decoding="async"
            width="768"
            height="512"
            class="card-img-top img-fluid"
          />
        </picture>
        {% endif %}
      </a>
      <div class="card-body">
        <h5 class="card-title">{{ post.title | truncate: 50 }}</h5>
        <p class="card-text text-left">
          {{ post.description | strip_html | truncate: 100 }}
          <a
            class="btn btn-primary rounded-pill mt-3"
            href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}"
          >
            Lebih Lanjut
          </a>
        </p>
      </div>
      <div class="card-footer">
        <small class="text-muted">
          Posted by {% if post.author %}{{ post.author }}{% else %}{{ site.author }}{% endif %} on
          {{ post.date | date: '%B %d, %Y' }} · {% include postcards/read_time.html
          content=post.content %}
        </small>
      </div>
    </div>
    {% endfor %}
  </div>
</section>

<!-- Section 3: Last 3 posts -->
<section id="posts-category3">
  <div class="card-deckrow mb-2 card-deck">
    {% for post in paginator.posts limit:3 offset:6 %}
    <div class="card shadow p-0 mb-3 bg-white rounded hover-zoomin">
      <a
        href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}"
        title="{{ post.title }}"
      >
        {% if post.background %}
        <picture>
          <!-- AVIF format -->
          <source
            srcset="
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_480/bg-index-arch-5   480w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_768/bg-index-arch-5   768w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_avif,w_1200/bg-index-arch-5 1200w
            "
            type="image/avif"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <!-- WEBP format -->
          <source
            srcset="
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_480/bg-index-arch-5   480w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_768/bg-index-arch-5   768w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_webp,w_1200/bg-index-arch-5 1200w
            "
            type="image/webp"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <!-- JPEG fallback -->
          <source
            srcset="
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_480/bg-index-arch-5   480w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/bg-index-arch-5   768w,
              https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_1200/bg-index-arch-5 1200w
            "
            type="image/jpeg"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          <!-- Final fallback with alt and lazy loading -->
          <img
            src="https://res.cloudinary.com/divkqrf7k/image/upload/q_auto,f_jpg,w_768/bg-index-arch-5"
            alt="{{ post.title }}"
            loading="lazy"
            decoding="async"
            width="768"
            height="512"
            class="card-img-top img-fluid"
          />
        </picture>
        {% endif %}
      </a>
      <div class="card-body">
        <h5 class="card-title">{{ post.title | truncate: 50 }}</h5>
        <p class="card-text text-left">
          {{ post.description | strip_html | truncate: 100 }}
          <a
            class="btn btn-primary rounded-pill mt-3"
            href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}"
          >
            Lebih Lanjut
          </a>
        </p>
      </div>
      <div class="card-footer">
        <small class="text-muted">
          Posted by {% if post.author %}{{ post.author }}{% else %}{{ site.author }}{% endif %} on
          {{ post.date | date: '%B %d, %Y' }} · {% include postcards/read_time.html
          content=post.content %}
        </small>
      </div>
    </div>
    {% endfor %}
  </div>
</section>

<!-- Pagination Navigation -->
<nav aria-label="Page navigation" class="mt-4">
  <ul class="pagination justify-content-center">
    <!-- Previous Button -->
    {% if paginator.previous_page %}
    <li class="page-item">
      <a
        class="page-link"
        href="{{ paginator.previous_page_path | prepend: site.baseurl | replace: '//', '/' }}"
        aria-label="Previous"
      >
        <span aria-hidden="true">« Previous</span>
      </a>
    </li>
    {% else %}
    <li class="page-item disabled">
      <span class="page-link">« Previous</span>
    </li>
    {% endif %}

    <!-- Page Numbers with Trail -->
    {% if paginator.page_trail %} {% for trail in paginator.page_trail %} {% if trail.num ==
    paginator.page %}
    <li class="page-item active">
      <span class="page-link">{{ trail.num }}</span>
    </li>
    {% else %}
    <li class="page-item">
      <a class="page-link" href="{{ trail.path | prepend: site.baseurl | replace: '//', '/' }}">
        {{ trail.num }}
      </a>
    </li>
    {% endif %} {% endfor %} {% endif %}

    <!-- Next Button -->
    {% if paginator.next_page %}
    <li class="page-item">
      <a
        class="page-link"
        href="{{ paginator.next_page_path | prepend: site.baseurl | replace: '//', '/' }}"
        aria-label="Next"
      >
        <span aria-hidden="true">Next »</span>
      </a>
    </li>
    {% else %}
    <li class="page-item disabled">
      <span class="page-link">Next »</span>
    </li>
    {% endif %}
  </ul>
</nav>
```

---

### Key Points:

- **Front Matter**: The `pagination: enabled: true` in the front matter tells `jekyll-paginate-v2`
  to paginate this specific page.
- **Permalinks**: The `permalink: /posts/` sets the base URL, and `pagination.permalink` in
  `_config.yml` appends `/page/:num/` for subsequent pages (e.g., `/posts/page/2/`).
- **Offsets**: We use `limit` and `offset` to split the 9 posts into three sections (0-2, 3-5, 6-8).
- **Trail**: The `trail` setting in `_config.yml` limits the page numbers shown in the navigation
  (e.g., showing 2 before and after the current page).

---

### Step 4: Build and Test Locally

Since `jekyll-paginate-v2` isn’t supported by GitHub Pages:

1. Build the site locally: `bundle exec jekyll build`.
2. Check the `_site/posts/` directory. You should see:
   - `index.html` (page 1)
   - `page/2/index.html` (page 2, if you have 10+ posts)
   - And so on…
3. Serve locally to test: `bundle exec jekyll serve`.
4. Visit `http://localhost:4000/posts/` and navigate the pagination.

---

## Step 5: Deploy to GitHub Pages

GitHub Pages won’t run `jekyll-paginate-v2` during its build process, so you need to push the
generated static files:

1. Build the site locally: `bundle exec jekyll build`.
2. Copy the contents of `_site/` to your repository’s root (or a branch like `gh-pages` if you’re
   using that).
3. Commit and push to GitHub:

   ```bash
   git add .
   git commit -m "Update site with pagination"
   git push origin main  # or gh-pages
   ```

4. Configure GitHub Pages to serve from the root or the `gh-pages` branch in your repository
   settings.

---

## Step 6: Link from Root `index.html`

Update your root `index.html` to link to the new posts page, e.g.:

```html
<a href="{{ site.baseurl }}/posts/">View All Posts</a>
```

---

### Notes

- **Post Count**: Ensure you have at least 10 posts to see pagination in action (9 per page means
  page 2 appears with 10+ posts).
- **GitHub Pages Limitation**: If you want GitHub Pages to build the site automatically, you’re
  stuck with `jekyll-paginate` (root-only). Using `jekyll-paginate-v2` requires this local build
  workflow or a CI setup (e.g., GitHub Actions).
- **CI Option**: You could automate this with a GitHub Action to build and deploy the `_site`
  folder—let me know if you’d like a workflow example!

---

## This setup keeps your root `index.html` intact, paginates all posts under `/posts/`, and uses `jekyll-paginate-v2` for flexibility. Test it locally first, and let me know if you hit any snags!
