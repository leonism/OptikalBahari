---
layout: page
title: Tips and Trik Dalam Memilih Kacamata
subtitle: 'Lengkap Semuanya Disini'
description:
  'Tertarik untuk memiliki kacamata yang terlihat keren dan sesuai dengan wajahmu? Baca artikel ini
  untuk mengetahui tips memilih kacamata yang sesuai dengan bentuk wajahmu agar terlihat lebih
  seimbang dan menarik'
keywords: 'Tip, Tricks, Kacamata'
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/bg-tips-trik.webp
permalink: /tips-trik-kacamata/
comments: false
---

<!-- Section 1: Lensa -->
<section id="posts-category-lensa">
  <div class="container">
    <div class="row">
      {% for post in site.categories.Lensa limit:3 offset:0 %}
        {% if forloop.first %}
          <div class="col-12 col-md-12 col-lg-4 mb-5">
        {% else %}
          <div class="col-12 col-md-6 col-lg-4 mb-5">
        {% endif %}
          <div class="card shadow p-0 bg-white rounded hover-zoomin">
            <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}" title="{{ post.title }}">
              {% if post.background %}
                <img
                  itemprop="image"
                  src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                  class="card-img-top img-fluid"
                  loading="lazy"
                  alt="{{ post.title }}" />
              {% endif %}
            </a>
            <div class="card-body">
              <h5 class="card-title">{{ post.title | truncate: 50 }}</h5>
              <p class="card-text text-left">
                {{ post.description | strip_html | truncate: 100 }}
                <a class="btn btn-primary rounded-pill mt-3 align-text-bottom text-decoration-none"
                  href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}"
                  title="{{ post.title }}">
                  Lebih Lanjut
                </a>
              </p>
            </div>
            <div class="card-footer">
              <small class="text-muted">
                Posted by
                <em>
                  {% if post.author %}
                    {{ post.author }}
                  {% else %}
                    {{ site.author }}
                  {% endif %}
                </em>,
                on {{ post.date | date: '%b %d, %Y' }} ·
                {% include postcards/read_time.html content=post.content %}
              </small>
            </div>
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>

<!-- Section 2: Info -->
<section id="posts-category-info">
  <div class="container">
    <div class="row">
      {% for post in site.categories.Info limit:3 offset:0 %}
        {% if forloop.first %}
          <div class="col-12 col-md-12 col-lg-4 mb-5">
        {% else %}
          <div class="col-12 col-md-6 col-lg-4 mb-5">
        {% endif %}
          <div class="card shadow p-0 bg-white rounded hover-zoomin">
            <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}" title="{{ post.title }}">
              {% if post.background %}
                <img
                  itemprop="image"
                  src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                  class="card-img-top img-fluid"
                  loading="lazy"
                  alt="{{ post.title }}" />
              {% endif %}
            </a>
            <div class="card-body">
              <h5 class="card-title">{{ post.title | truncate: 50 }}</h5>
              <p class="card-text text-left">
                {{ post.description | strip_html | truncate: 100 }}
                <a class="btn btn-primary rounded-pill mt-3 align-text-bottom text-decoration-none"
                  href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}"
                  title="{{ post.title }}">
                  Lebih Lanjut
                </a>
              </p>
            </div>
            <div class="card-footer">
              <small class="text-muted">
                Posted by
                <em>
                  {% if post.author %}
                    {{ post.author }}
                  {% else %}
                    {{ site.author }}
                  {% endif %}
                </em>,
                on {{ post.date | date: '%b %d, %Y' }} ·
                {% include postcards/read_time.html content=post.content %}
              </small>
            </div>
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>

<!-- Section 3: Trend -->
<section id="posts-category-trend">
  <div class="container">
    <div class="row">
      {% for post in site.categories.Trend limit:3 offset:0 %}
        {% if forloop.first %}
          <div class="col-12 col-md-12 col-lg-4 mb-5">
        {% else %}
          <div class="col-12 col-md-6 col-lg-4 mb-5">
        {% endif %}
          <div class="card shadow p-0 bg-white rounded hover-zoomin">
            <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}" title="{{ post.title }}">
              {% if post.background %}
                <img
                  itemprop="image"
                  src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                  class="card-img-top img-fluid"
                  loading="lazy"
                  alt="{{ post.title }}" />
              {% endif %}
            </a>
            <div class="card-body">
              <h5 class="card-title">{{ post.title | truncate: 50 }}</h5>
              <p class="card-text text-left">
                {{ post.description | strip_html | truncate: 100 }}
                <a class="btn btn-primary rounded-pill mt-3 align-text-bottom text-decoration-none"
                  href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}"
                  title="{{ post.title }}">
                  Lebih Lanjut
                </a>
              </p>
            </div>
            <div class="card-footer">
              <small class="text-muted">
                Posted by
                <em>
                  {% if post.author %}
                    {{ post.author }}
                  {% else %}
                    {{ site.author }}
                  {% endif %}
                </em>,
                on {{ post.date | date: '%b %d, %Y' }} ·
                {% include postcards/read_time.html content=post.content %}
              </small>
            </div>
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
