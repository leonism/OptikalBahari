# 🛠️ Optikal Bahari: Automated Google Reviews Integration

This system automates the scraping, storage, and display of Google Business reviews for
[optikalbahari.com](https://www.optikalbahari.com). It uses a "Static Site, Dynamic Data" approach:
data is scraped weekly, stored at the edge, and injected into the Jekyll build process to maintain
blazing-fast performance and SEO discovery.

## 🏗️ Architecture Overview

1.  **Scraper (Apify):** A headless browser scrolls through Google Maps once a week to extract 500+
    reviews.
2.  **Storage (Cloudflare KV):** Acts as a high-speed JSON buffer between the scraper and the
    website.
3.  **Bridge (Cloudflare Worker):** Receives the data from Apify via Webhook and pings GitHub to
    start a new build.
4.  **Static Site (Jekyll + Ruby):** During the build, a Ruby plugin fetches the JSON from the
    Worker and generates 50+ paginated pages.
5.  **Frontend (Bootstrap 5):** Responsive cards with optimized SEO meta tags for each page.

---

## 🟢 Phase 1: Apify Scraper Configuration

### 1. Actor Choice

Use the **Google Maps Reviews Scraper** (standard in 2026 for deep extraction).

- **Model:** Pay-per-result (~$0.50 per 1,000 reviews).
- **Target URL:** Your Google Maps "Place ID" URL or direct Business link.

### 2. Task Input Settings

Create a **Task** (saved configuration) with these specific toggles:

- **Max Reviews:** `600` (Covers current 512 + growth).
- **Sort:** `Newest` (Crucial for the "Weekly" feel).
- **Language:** `id-ID` (Ensures Indonesian text isn't auto-translated).
- **Personal Data:** Enable `Include Reviewer Name` and `Reviewer Photo`.
- **Proxy:** Use **Apify Residential Proxy**. _Do not use Datacenter proxies; Google will block the
  scroll halfway through 512 reviews._

### 3. Automation (The Trigger)

- **Schedule:** Set to `0 0 * * 0` (Every Sunday at 00:00).
- **Integration:** Add a **Webhook**.
  - **Event:** `Run Succeeded`.
  - **URL:** Your Cloudflare Worker URL.
  - **Payload:** Default (sends the `datasetId`).

---

## 🔵 Phase 2: Cloudflare Edge (Worker & KV)

The Worker acts as a secure gatekeeper. It holds your Apify API key and handles the data transfer.

### 1. KV Namespace

Create a namespace named `OPT_REVIEWS`. Note the ID, but in 2026, you simply **Bind** it to the
Worker variable `REVIEWS_KV`.

### 2. Worker Logic (`index.js`)

```javascript
export default {
  async fetch(request, env) {
    const { method } = request

    // WEBHOOK HANDLER: Catch data from Apify
    if (method === 'POST') {
      const payload = await request.json()
      const datasetId = payload.resource?.defaultDatasetId

      // 1. Fetch the fresh JSON from Apify
      const apifyRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&format=json`,
        { headers: { Authorization: `Bearer ${env.APIFY_TOKEN}` } }
      )
      const data = await apifyRes.json()

      // 2. Store in KV (Overwrites the old batch)
      await env.REVIEWS_KV.put('latest_reviews', JSON.stringify(data))

      // 3. Trigger GitHub Build
      await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GITHUB_PAT}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'Optikal-Bahari-Worker',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ event_type: 'webhook_reviews_update' }),
      })

      return new Response('Sync Complete', { status: 200 })
    }

    // GET HANDLER: Serve JSON to Jekyll Build
    if (method === 'GET') {
      const data = await env.REVIEWS_KV.get('latest_reviews')
      return new Response(data, {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
  },
}
```

---

## 🔴 Phase 3: Jekyll & Ruby Integration

Jekyll's `jekyll-paginate-v2` is powerful but requires a "Collection" to paginate 500 items. We
create this collection **virtually** so you don't have to commit 512 `.md` files to your repo.

### 1. The Plugin (`_plugins/fetch_reviews.rb`)

```ruby
require 'net/http'
require 'json'

Jekyll::Hooks.register :site, :after_init do |site|
  # Fetch data from the Edge
  url = "https://your-worker.workers.dev/"
  response = Net::HTTP.get(URI(url))
  reviews = JSON.parse(response)

  # Inject into the 'reviews' collection
  reviews.each_with_index do |item, index|
    doc = Jekyll::Document.new(
      File.join(site.source, "_reviews/review-#{index}.md"),
      { site: site, collection: site.collections['reviews'] }
    )
    # Map Apify fields to Jekyll Front Matter
    doc.data.merge!({
      'stars' => item['stars'],
      'author' => item['reviewerName'],
      'content' => item['text'],
      'date' => item['publishedAtDate'],
      'avatar' => item['reviewerPhotoUrl'],
      'photos' => item['reviewImageUrls'] || [],
      'reply' => item['responseFromOwnerText']
    })
    site.collections['reviews'].docs << doc
  end

  # Sort by Newest
  site.collections['reviews'].docs.sort! { |a, b| b.data['date'] <=> a.data['date'] }
end
```

### 2. The Pagination Config (`_config.yml`)

```yaml
pagination:
  enabled: true
  collection: reviews
  per_page: 10
  permalink: '/testimoni/:num/'
  title_suffix: ' - Page :num'
```

---

## 🎨 Phase 4: Frontend & SEO (Bootstrap 5)

### Dynamic Meta Tags

In your `testimoni.html` layout, use the `paginator` object to generate unique SEO signals for all
50+ pages:

```html
<title>
  Testimoni Pelanggan Optikal Bahari {% if paginator.page > 1 %}(Hal {{ paginator.page }}){% endif
  %}
</title>
<meta
  name="description"
  content="Baca {{ site.collections.reviews.size }} ulasan dari pelanggan kami. Halaman {{ paginator.page }} menampilkan testimoni terbaru tentang layanan kacamata kami."
/>
```

### The Card UI

Using Bootstrap 5's Grid and Utility classes:

```html
<div class="row g-4">
  {% for review in paginator.documents %}
  <div class="col-md-6">
    <div class="card h-100 shadow-sm border-0">
      <div class="card-body">
        <div class="d-flex align-items-center mb-3">
          <img src="{{ review.avatar }}" class="rounded-circle me-3" width="45" loading="lazy" />
          <div>
            <h6 class="mb-0">{{ review.author }}</h6>
            <div class="text-warning">{% for i in (1..review.stars) %}★{% endfor %}</div>
          </div>
        </div>
        <p class="card-text">"{{ review.content }}"</p>

        {% if review.photos.size > 0 %}
        <div class="d-flex gap-2 mb-2">
          {% for img in review.photos %}
          <img
            src="{{ img }}"
            class="img-thumbnail"
            style="width: 80px; height: 80px; object-fit: cover;"
          />
          {% endfor %}
        </div>
        {% endif %} {% if review.reply %}
        <div class="p-2 bg-light border-start border-primary border-4 small">
          <strong>Balasan Optikal Bahari:</strong>
          {{ review.reply }}
        </div>
        {% endif %}
      </div>
    </div>
  </div>
  {% endfor %}
</div>
```

---

## 🚀 Future Maintenance Checklist

1.  **Apify Credits:** Every 1,000 reviews costs ~$0.50. Ensure the Apify wallet has a small
    balance.
2.  **GitHub Token:** The `GITHUB_PAT` in Cloudflare Secrets expires according to your GitHub
    settings (usually 1 year). If builds stop triggering, check this first.
3.  **Proxy Health:** If Apify returns 0 results, Google has flagged the residential proxy. Rotate
    the proxy region in Apify Task settings.

**Final Result:** You now have a high-authority testimonial section that updates itself every Sunday
while you sleep. Good job, Gerri!
