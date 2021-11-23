---
layout: page
title: Kacamata Di Kemayoran, Bendungan Jago, Jakarta Pusat
subtitle: 'Toko Optik Kacamata, Frame Murah Dan Terjangkau'
description: Toko Kacamata & Optik murah dengan koleksi lensa dan frame paling lengkap dan terjangkau di Kemayoran.
keywords: Optikal Bahari, Optik Bahari, Sejarah Optik, Kemayoran, Bendungan Jago, Benjo
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/posts/021.jpg
permalink: /toko-kacamata/
---

<div class="card-deck mb-3">
  <div class="card shadow p-3 mb-5 bg-white rounded">
  <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-7.jpg" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.jpg">
    <div class="card-body">
      <h3 class="card-title">Toko Kacamata Optikal Bahari, Terjangkau Untuk Semua Kalangan</h3>
      <p class="card-text">Sedang mempertimbangkan untuk membeli kacamata baru? Atau mungkin butuh lensa atau bingkai kacamata/frame pengganti karena ukuran mata yang sudah berubah? Atau mungkin sudah bosan dengan model kacamata yang digunakan sekarang? Jangan ragu lagi, segera datang ke Optikal Bahari. Hanya di Optikal Bahari yang koleksi lensa dan frame paling lengkap dengan harga terjangkau. Optikal Bahari juga memberikan layanan Periksa Mata Gratis, pembayaran secara cicilan dan pembayaran menggunakan KJP. Lanjut baca semua keunggulan yang ditawarkan oleh Optikal Bahari.</p>
      </div>
      </div>
</div>

{% include home-cards.html %}

<div class="card-deck mb-3">
  <div class="card shadow p-3 mb-5 bg-white rounded">
  <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-9.jpg" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.jpg">
    <div class="card-body">
      <h3 class="card-title">Segera Kunjungi Optikal Bahari</h3>
      <p class="card-text">Jadi tunggu apa lagi? Segera kunjungi Optikal Bahari di Bendungan Jago Kemayoran, Jakarta Pusat. Dan dapatkan banyak kemudahan untuk memilii kacamata idaman kamu dengan harga terjangkau. Untuk dapat info terbaru seputaran Promo yang kami berikan, kamu juga bisa bergabung dengan Fanpage <a href="https://www.facebook.com/optikalbahari" id="FBClick" title="Facebook Page Optikal Bahari" class="FacebookPage">Facebook @optikalbahari</a> supaya selalu update informasi terkait layanan terbaru dari kami. Untuk respond yang lebih cepat, silahkan menghubungi kami di nomor HP/WA ini <a href="https://api.whatsapp.com/send?phone=6281932235445&text=Hallo%2C+saya+butuh+informasi+lebih+lanjut+mengenai+Optikal+Bahari" id="WhatsAppClick" class="WhatsAppCall" title="Call WhatsApp">+6281932235445</a>.
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
                <p class="card-text">
                    {{ post.description | strip_html | truncatewords: 20 }}.
                </p>
                <p class="card-text">
                    <a class="btn btn-primary rounded-pill" href="{{ post.url | prepend: site.baseurl | replace: '//', '/' }}">Selengkapnya</a>
                </p>
            </div>
            <div class="card-footer">
                <small class="text-muted">
                    Posted by {% if post.author %} {{ post.author }} {% else %} {{ site.author }} {% endif %} on
                    {{ post.date | date: '%B %d, %Y' }} &middot; {% include read_time.html content=post.content %}
                </small>
            </div>
        </div>
        {% endfor %}
    </div>
</section>
