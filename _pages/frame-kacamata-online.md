---
layout: page
title: Frame Kacamata Online Di Kemayoran
subtitle: Frame & Kacamata Terabru, Murah Dan Terjangkau
description:
  Dapatkan koleksi Frame Kacamata Minus dan Frame bingkai kacamata, mulai harga murah sampai dengan
  harga menengah ke atas.
keywords:
  'frame kacamata online, frame murah, kacamata, Sejarah Optik, Kemayoran, Bendungan Jago, Benjo'
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/posts/021.webp
permalink: /frame-kacamata-online/
comments: false
---

<div class="card-deck mb-3">
  <div class="card shadow p-3 mb-5 bg-white rounded">
  <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-5.webp" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.webp">
    <div class="card-body">
      <h3 class="card-title">Koleksi Frame kacamata Minus</h3>
      <p class="card-text text-left">Apakah penglihatan anda mulai terganggu? Mulai sering mengalami pandangan kabur dan kuran jelas? Banyak hal yang bisa menyebabkan penurunan kualitas penglihatan anda, mulai dari terlalu seringnya dihadapan monitor, terlalu sering main handphone, sampai dengan menurunnya kapasitas penglihatan seiring dengan bertambahnya usia. Di Optikal Bahari kami menyediakan beragam jenis tipe Lensa dan Frame bingkai kacamata dari mulai harga yang terjangkau sampai dengan harga menengah ke atas. Baca lebih lanjut untuk tahu alasan kenapa beli kacamata di Optikal Bahari.</p>
    </div>
   </div>
</div>

{% include home/home-cards.html %}

<div class="card-deck mb-3">
  <div class="card shadow p-3 mb-5 bg-white rounded">
		  <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-9.webp" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.webp">
    <div class="card-body">
      <h3 class="card-title">Segera Kunjungi Optikal Bahari</h3>
      <p class="card-text text-left">Jadi tunggu apa lagi? Segera kunjungi Optikal Bahari di Bendungan Jago Kemayoran, Jakarta Pusat. Dan dapatkan banyak kemudahan untuk memiliki kacamata idaman kamu dengan harga terjangkau. Untuk dapat info terbaru seputaran Promo yang kami berikan, kamu juga bisa bergabung dengan Fanpage
    <a href="https://www.facebook.com/optikalbahari" id="FBClick" title="Facebook Page Optikal Bahari" class="FacebookPage">Facebook @optikalbahari</a> supaya selalu update informasi terkait layanan terbaru dari kami. Untuk respond
    yang lebih cepat, silahkan menghubungi kami di nomor HP/WA ini <a href="https://api.whatsapp.com/send?phone=6281932235445&text=Hallo%2C+saya+butuh+informasi+lebih+lanjut+mengenai+Optikal+Bahari" id="WhatsAppClick" class="WhatsAppCall" title="Call WhatsApp">+6281932235445</a>.
    <em>(Optikal Bahari)</em></p>
	</div>
   </div>
</div>

<section id="posts-category">
    <div class="card-deck">
		{% for post in site.categories.Lensa limit : 3 %}
        <div class="card shadow p-3 mb-5 bg-white rounded">
            <a href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">
                {% if page.background %}
                    <img src="{{ post.background | prepend: site.baseurl | replace: '//', '/' }}" class="card-img-top" alt="{{ post.title }}"></a>
                {% endif %}
            <div class="card-body">
                <h5 class="card-title">
                    {{ post.title }}
                </h5>
                <p class="card-text text-left">
                    {{ post.description | strip_html | truncatewords: 20 }}.
                </p>
                <p class="card-text text-left">
                    <a class="btn btn-primary rounded-pill" href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">Selengkapnya</a>
                </p>
            </div>
            <div class="card-footer">
                <small class="text-muted">
                    Posted by {% if post.author %} {{ post.author }} {% else %} {{ site.author }} {% endif %} on
                    {{ post.date | date: '%B %d, %Y' }} &middot; {% include postcards/read_time.html content=post.content %}
                </small>
            </div>
        </div>
        {% endfor %}
    </div>
</section>
