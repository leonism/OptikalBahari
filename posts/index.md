---
layout: page
lang: id-ID
title: Seputaran Trend Kacamata Beserta Tips & Triks
subtitle: Artikel Terdini & Terkini Seputaran Info, Trend Kacamata, Kesehatan Mata, Tips & Trik Hanya Untuk Anda
description: Artikel Terdini & Terkini Seputaran Info, Trend Kacamata, Kesehatan Mata, Tips & Trik Hanya Untuk Anda
keywords: Optikal Bahari, Optik, Kacamata, Kemayoran, Bendungan Jago
permalink: /posts/
background: /assets/img/bg-splash-index-01.webp
pagination:
  enabled: true # Enable pagination for this page
  permalink: 'page/:num/'
---

<!-- Section 1: First 3 posts -->
<section id="posts-category-section-1">
    <div class="container">
        <div class="row">
            {% assign posts = paginator.posts | slice: 0, 3 %}
            {% for post in posts %}
            <div
                class="col-12 {% if forloop.index == 1 %}col-md-12 col-lg-4{% else %}col-md-6 col-lg-4{% endif %} mb-5">
                <div class="card shadow p-0 bg-white rounded hover-zoomin">
                    <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}" title="{{ post.title }}">
                        {% if post.background contains 'http' %}
                        <img
                            itemprop="image"
                            src="{{ post.background }}"
                            class="card-img-top img-fluid"
                            alt="{{ post.title }}" />
                        {% else %}
                        <img
                            itemprop="image"
                            src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                            class="card-img-top img-fluid"
                            alt="{{ post.title }}" />
                        {% endif %}
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">
                            {{ post.title | truncate: 50 }}
                        </h5>
                        <p class="card-text">
                            {{ post.description | strip_html | truncate: 100 }}
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
    </div>
</section>

<!-- Section 2: Next 3 posts -->
<section id="posts-category-section-2">
    <div class="container">
        <div class="row">
            {% assign posts = paginator.posts | slice: 3, 3 %}
            {% for post in posts %}
            <div
                class="col-12 {% if forloop.index == 1 %}col-md-12 col-lg-4{% else %}col-md-6 col-lg-4{% endif %} mb-5">
                <div class="card shadow p-0 bg-white rounded hover-zoomin">
                    <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}" title="{{ post.title }}">
                        {% if post.background contains 'http' %}
                        <img
                            itemprop="image"
                            src="{{ post.background }}"
                            class="card-img-top img-fluid"
                            alt="{{ post.title }}" />
                        {% else %}
                        <img
                            itemprop="image"
                            src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                            class="card-img-top img-fluid"
                            alt="{{ post.title }}" />
                        {% endif %}
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">{{ post.title | truncate: 50 }}</h5>
                        <p class="card-text">
                            {{ post.description | strip_html | truncate: 100 }}
                        </p>
                        <a class="btn btn-primary rounded-pill mt-3 text-white"
                            href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
                            Lebih Lanjut
                        </a>
                    </div>
                    <div class="card-footer">
                        <small class="text-muted">Posted by {{ post.author | default: site.author }}, on
                            {{ post.date | date: '%b %d, %Y' }} ·
                            {% include postcards/read_time.html content=post.content %}
                        </small>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>
</section>

<!-- Section 3: Last 3 posts -->
<section id="posts-category-section-3">
    <div class="container">
        <div class="row">
            {% assign posts = paginator.posts | slice: 6, 3 %}
            {% for post in posts %}
            <div
                class="col-12 {% if forloop.index == 1 %}col-md-12 col-lg-4{% else %}col-md-6 col-lg-4{% endif %} mb-5">
                <div class="card shadow p-0 bg-white rounded hover-zoomin">
                    <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}" title="{{ post.title }}">
                        {% if post.background contains 'http' %}
                            <img
                                itemprop="image"
                                imgsrc="{{ post.background }}"
                                src="{{ post.background }}"
                                class="card-img-top img-fluid"
                                alt="{{ post.title }}" />
                            {% else %}
                            <img
                                itemprop="image"
                                imgsrc="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                                src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                                class="card-img-top img-fluid"
                                alt="{{ post.title }}" />
                        {% endif %}
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">
                            {{ post.title | truncate: 50 }}
                        </h5>
                        <p class="card-text">
                            {{ post.description | strip_html | truncate: 100 }}
                        </p>
                        <a class="btn btn-primary rounded-pill mt-3 text-white"
                            href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
                            Lebih Lanjut
                        </a>
                    </div>
                    <div class="card-footer">
                        <small class="text-muted">Posted by
                            {{ post.author | default: site.author }}, on
                                {{ post.date | date: '%b %d, %Y' }} ·
                            {% include postcards/read_time.html content=post.content %}
                        </small>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>
</section>

{% include navigation/pagination.html paginate_path="/posts/page/:num/" %}
