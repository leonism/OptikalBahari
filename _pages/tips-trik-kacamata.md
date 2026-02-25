---
layout: page
title: Tips and Trik Dalam Memilih Kacamata
subtitle:
  'Baca artikel ini untuk mengetahui tips memilih kacamata yang sesuai dengan bentuk wajahmu Tip,
  Tricks, Kacamata'
description:
  'Baca artikel ini untuk mengetahui tips memilih kacamata yang sesuai dengan bentuk wajahmu Tip,
  Tricks, Kacamata'
keywords: 'Tip, Tricks, Kacamata'
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/posts/hijabi-girls-01/kacamata-untuk-hijabers-011.webp
permalink: /tips-trik-kacamata/
comments: false
---

<!-- Section 1: Lensa -->
<section id="posts-category-lensa">
    <div class="row">
        {% for post in site.categories.Lensa limit:3 offset:0 %}
          <div
            class="col-12 {% if forloop.index == 1 %}col-md-12 col-lg-4{% else %}col-md-6 col-lg-4{% endif %} mb-5">
            <div class="card shadow p-0 rounded hover-zoomin">
              <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}" title="{{ post.title }}">
                {%- include cloudinary/thumbnail_image.html
                    src=post.background
                    alt=post.title
                    class="card-img-top img-fluid"
                    ratio="ratio-16x9"
                -%}
              </a>
              <div class="card-body">
                <h3 class="card-title">
                    {{ post.title | truncate: 50 }}
                </h3>
                <p class="card-text">
                    {{ post.description | strip_html | truncate: 120 }}
                </p>
                <a class="btn btn-primary rounded-pill mt-3 text-white"
                    href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
                    Lebih Lanjut
                </a>
              </div>
              <div class="card-footer">
                <small class="text-muted">
                    Posted by {{ post.author | default: site.author }}, on
                    {{ post.date | date: '%b %d, %Y' }} ·
                    {% include postcards/read_time.html content=post.content %}
                </small>
              </div>
            </div>
          </div>
        {% endfor %}
      </div>
</section>

<!-- Section 2: Info -->
<section id="posts-category-info">
    <div class="row">
        {% for post in site.categories.Info limit:3 offset:0 %}
          <div class="col-12 {% if forloop.index == 1 %}col-md-12 col-lg-4{% else %}col-md-6 col-lg-4{% endif %} mb-5">
            <div class="card shadow p-0 rounded hover-zoomin">
              <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}" title="{{ post.title }}">
                {%- include cloudinary/thumbnail_image.html
                    src=post.background
                    alt=post.title
                    class="card-img-top img-fluid"
                    ratio="ratio-16x9"
                -%}
              </a>
              <div class="card-body">
                <h3 class="card-title">
                    {{ post.title | truncate: 50 }}
                </h3>
                <p class="card-text">
                    {{ post.description | strip_html | truncate: 120 }}
                </p>
                <a class="btn btn-primary rounded-pill mt-3 text-white"
                    href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
                    Lebih Lanjut
                </a>
              </div>
              <div class="card-footer">
                <small class="text-muted">
                    Posted by {{ post.author | default: site.author }}, on
                    {{ post.date | date: '%b %d, %Y' }} ·
                    {% include postcards/read_time.html content=post.content %}
                </small>
              </div>
            </div>
          </div>
        {% endfor %}
    </div>
</section>

<!-- Section 3: Trend -->
<section id="posts-category-trend">
    <div class="row">
        {% for post in site.categories.Trend limit:3 offset:0 %}
          <div class="col-12 {% if forloop.index == 1 %}col-md-12 col-lg-4{% else %}col-md-6 col-lg-4{% endif %} mb-5">
            <div class="card shadow p-0 rounded hover-zoomin">
              <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}" title="{{ post.title }}">
                {%- include cloudinary/thumbnail_image.html
                    src=post.background
                    alt=post.title
                    class="card-img-top img-fluid"
                    ratio="ratio-16x9"
                -%}
              </a>
              <div class="card-body">
                <h3 class="card-title">
                    {{ post.title | truncate: 50 }}
                </h3>
                <p class="card-text">
                    {{ post.description | strip_html | truncate: 120 }}
                </p>
                <a class="btn btn-primary rounded-pill mt-3 text-white"
                    href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
                    Lebih Lanjut
                </a>
              </div>
              <div class="card-footer">
                <small class="text-muted">
                    Posted by {{ post.author | default: site.author }}, on
                    {{ post.date | date: '%b %d, %Y' }} ·
                    {% include postcards/read_time.html content=post.content %}
                </small>
              </div>
            </div>
          </div>
        {% endfor %}
    </div>
</section>
