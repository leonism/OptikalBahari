---
layout: testimonials
title: Testimoni Pelanggan, Bukti Kepercayaan dan Kepuasan
subtitle:
  'Berikut adalah sebagian dari testimoni & review yang diberikan oleh para pelanggan setia kami di
  Google Business Optikal Bahari.'
description:
  'Berikut adalah sebagian dari testimoni & review yang diberikan oleh para pelanggan setia kami di
  Google Business Optikal Bahari.'
keywords: Optikal Bahari, Optik, Kacamata, Kemayoran, Bendungan Jago
permalink: /testimoni/
background: /assets/img/posts/hijabi-girls-01/kacamata-untuk-hijabers-010.webp
pagination:
  enabled: true
  collection: reviews
  per_page: 9 # Note: this value is controlled by site.reviews_per_page in _config.yml
  permalink: 'page/:num/'
---

<div class="container container-overlap py-5">
  <div class="reviews-grid">
    
    {% if paginator.page == 1 %}
    <!-- Summary Card (Visible on first page) -->
    <div class="card review-card summary-card shadow-sm border-0 p-4">
      <div class="card-body">
        <div class="rating-big">5.0</div>
        <div class="stars-big text-warning">
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
        </div>
        <div class="summary-text">Google Overall Rating<br>Bahari Optical</div>
      </div>
    </div>
    {% endif %}

    {% for review in paginator.documents %}
    <!-- Review Card -->
    <div class="card review-card shadow-sm border-0 h-auto">
      <div class="card-body">
        <div class="d-flex align-items-center mb-3">
          {% if review.photo %}
            <img src="{{ review.photo }}" class="reviewer-photo me-3" alt="{{ review.title }}" loading="lazy">
          {% else %}
            <div class="reviewer-photo me-3 d-flex align-items-center justify-content-center bg-primary text-white fs-5">
              {{ review.title | split: ' ' | last | slice: 0 }}
            </div>
          {% endif %}
          <div>
            <h6 class="mb-0 text-primary fw-bold">{{ review.title | replace: "Review by ", "" }}</h6>
            <div class="star-rating">
              {% for i in (1..review.stars) %}<i class="fas fa-star"></i>{% endfor %}
            </div>
          </div>
        </div>

        <div class="review-text">
          {{ review.text | truncate: 500 }}
        </div>

        {% if review.images.size > 0 %}
        <div class="row g-1 mt-3">
          {% for img in review.images limit:4 %}
          <div class="col-6">
            <img src="{{ img }}" class="img-fluid rounded" style="aspect-ratio: 1; object-fit: cover;" loading="lazy">
          </div>
          {% endfor %}
        </div>
        {% endif %}

        {% if review.owner_response %}
        <div class="owner-response">
          <strong>Balasan Optikal Bahari:</strong><br>
          {{ review.owner_response }}
        </div>
        {% endif %}

        <div class="mt-3 border-top pt-3">
          <a href="{{ review.review_url }}" target="_blank" class="google-link">
            <i class="fab fa-google text-primary"></i> View on Google
          </a>
        </div>
      </div>
    </div>
    {% endfor %}

  </div>

  {% if paginator.total_pages > 1 %}
    {% include navigation/pagination.html paginate_path="/testimoni/page/:num/" base_url="/testimoni/" %}
  {% endif %}
  
  <div class="card shadow-lg p-4 mt-5 rounded-4 border-0">
    <div class="row align-items-center">
      <div class="col-md-4">
        {% include cloudinary/card_image.html src='assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-5.webp' alt='Toko Optik Kemayoran' ratio='1x1' class='img-fluid rounded-4' %}
      </div>
      <div class="col-md-8">
        <h3 class="card-title fw-bold">
          Bukti Nyata Kepercayaan dan Kepuasan: Suara Pelanggan Optikal Bahari
        </h3>
        <p class="card-text text-start text-muted mt-3">
          Bagi Optikal Bahari, testimoni-testimoni ini bukan sekadar pujian, melainkan amanah dan tanggung jawab untuk terus memberikan yang terbaik. Kami berkomitmen untuk selalu menjaga kualitas layanan dan produk.
        </p>
        <p class="card-text text-start">
          Segera hubungi kami untuk respond lebih cepat:
          <a
            href="https://api.whatsapp.com/send?phone=6281932235445&text=Hallo%2C+saya+butuh+informasi+lebih+lanjut+mengenai+Optikal+Bahari"
            id="WhatsAppClick"
            class="btn btn-success btn-lg rounded-pill"
            title="Hubungi WhatsApp"><i class="fab fa-whatsapp me-2"></i>+6281932235445
          </a>
        </p>
      </div>
    </div>
  </div>
</div>
