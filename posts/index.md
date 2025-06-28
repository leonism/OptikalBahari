---
layout: page
lang: id-ID
title: Seputaran Trend Kacamata Beserta Tips & Triks
subtitle: Artikel Terdini & Terkini Seputaran Info, Trend Kacamata, Kesehatan Mata, Tips & Trik Hanya Untuk Anda
description: Artikel Terdini & Terkini Seputaran Info, Trend Kacamata, Kesehatan Mata, Tips & Trik Hanya Untuk Anda
keywords: Optikal Bahari, Optik, Kacamata, Kemayoran, Bendungan Jago
background: https://res.cloudinary.com/divkqrf7k/image/upload/c_fill,g_face,q_auto:eco/v1750522618/splash-screen/bg-splash-post-02
permalink: /posts/
# permalink: /:title/
pagination:
    enabled: true # Enable pagination for this page
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
                        <img itemprop="image" src="{{ post.background }}"
                            class="card-img-top img-fluid" alt="{{ post.title }}" />
                        {% else %}
                        <img itemprop="image" src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                            class="card-img-top img-fluid" alt="{{ post.title }}" />
                        {% endif %}
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">
                            {{ post.title | truncate: 50 }}
                        </h5>
                        <p class="card-text">
                            {{ post.description | strip_html | truncate: 100 }}
                        </p>
                        <a class="btn btn-primary rounded-pill mt-3"
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
                        <img itemprop="image" src="{{ post.background }}"
                            class="card-img-top img-fluid" alt="{{ post.title }}" />
                        {% else %}
                        <img itemprop="image" src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                            class="card-img-top img-fluid" alt="{{ post.title }}" />
                        {% endif %}
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">{{ post.title | truncate: 50 }}</h5>
                        <p class="card-text">
                            {{ post.description | strip_html | truncate: 100 }}
                        </p>
                        <a class="btn btn-primary rounded-pill mt-3"
                            href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
                            Lebih Lanjut
                        </a>
                    </div>
                    <div class="card-footer">
                        <small class="text-muted">Posted by {{ post.author | default: site.author }}, on
                            {{ post.date | date: '%b %d, %Y' }} ·
                            {% include postcards/read_time.html content=post.content %}</small>
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
                        <img itemprop="image" src="{{ post.background }}"
                            class="card-img-top img-fluid" alt="{{ post.title }}" />
                        {% else %}
                        <img itemprop="image" src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}"
                            class="card-img-top img-fluid" alt="{{ post.title }}" />
                        {% endif %}
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">
                            {{ post.title | truncate: 50 }}
                        </h5>
                        <p class="card-text">
                            {{ post.description | strip_html | truncate: 100 }}
                        </p>
                        <a class="btn btn-primary rounded-pill mt-3"
                            href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
                            Lebih Lanjut
                        </a>
                    </div>
                    <div class="card-footer">
                        <small class="text-muted">Posted by {{ post.author | default: site.author }}, on
                            {{ post.date | date: '%b %d, %Y' }} ·
                            {% include postcards/read_time.html content=post.content %}</small>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>
</section>

<!-- Pagination Navigation -->
<nav aria-label="Page navigation" class="mt-5">
    <ul class="pagination justify-content-center">
        <!-- Previous Button -->
        {% if paginator.previous_page %}
        <li class="page-item">
            <a class="page-link" href="{{ paginator.previous_page_path | relative_url }}"
                title="{{ paginator.previous_page_path | relative_url }}" aria-label="Previous">« Prev</a>
        </li>
        {% else %}
        <li class="page-item disabled"><span class="page-link">« Prev</span></li>
        {% endif %}

        <!-- Page Numbers -->
        {% for page in (1..paginator.total_pages) %}
        {% if page == paginator.page %}
        <li class="page-item active">
            <span class="page-link">{{ page }}</span>
        </li>
        {% else %}
        <li class="page-item">
            {% if page == 1 %}
            <!-- Link to the first page (usually the root URL) -->
            <a class="page-link" href="{{ paginator.previous_page_path | relative_url }}"
                title="{{ paginator.previous_page_path | relative_url }}">{{ page }}</a>
            {% else %}
            <!-- Link to subsequent pages with the correct /posts/page/:num/ structure -->
            <a class="page-link" href="{{ paginator.next_page_path | relative_url }}"
                title="{{ paginator.next_page_path | relative_url }}">{{ page }}</a>
            {% endif %}
        </li>
        {% endif %}
        {% endfor %}

        <!-- Next Button -->
        {% if paginator.next_page %}
        <li class="page-item">
            <a class="page-link" href="{{ paginator.next_page_path | relative_url }}"
                title="{{ paginator.next_page_path | relative_url }}" aria-label="Next">Next »</a>
        </li>
        {% else %}
        <li class="page-item disabled">
            <span class="page-link">Next »</span>
        </li>
        {% endif %}
    </ul>

</nav>
