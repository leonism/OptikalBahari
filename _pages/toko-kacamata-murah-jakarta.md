---
layout: page
title: Toko Kacamata Murah Di Jakarta
subtitle: 'Dan Dapatkan Layanan Periksa Mata Gratis'
description: "Temukan toko kacamata murah di Jakarta hanya di Optikal Bahari. Kami menawarkan berbagai pilihan lensa dan frame dengan harga terjangkau dan kualitas terbaik"
keywords: 'kacamata murah, periksa mata, periksa mata gratis, periksa mata jakarta'
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/posts/010.webp
permalink: /toko-kacamata-murah-di-jakarta/
comments: false
---


<div class="card shadow p-3 mb-5 bg-white rounded">
    <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-5.webp" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.webp">
    <div class="card-body">
      <h3 class="card-title">Toko Kacamata Murah Di Jakarta</h3>
      <p class="card-text text-left">
            Jika Anda sedang mencari toko kacamata dengan harga terjangkau di Jakarta, datanglah ke Optikal Bahari. Kami memiliki berbagai pilihan lensa dan frame yang dapat Anda pilih sesuai dengan kebutuhan dan keinginan Anda. Selain harga yang terjangkau, kami juga menjamin kualitas produk yang kami tawarkan. Jangan ragu untuk datang ke Optikal Bahari dan melihat sendiri pilihan kacamata yang kami tawarkan. Kami yakin bahwa kami dapat memenuhi kebutuhan Anda terkait kacamata dengan harga yang terjangkau di Jakarta.
        </p>
        <p class="card-text text-left">
            Kami memiliki berbagai pilihan lensa dan frame yang dapat dipilih sesuai dengan kebutuhan dan keinginan Anda, dengan harga yang beragam. Namun, kualitas produk yang kami tawarkan tidak perlu diragukan lagi, kami yakin bahwa kacamata yang kami tawarkan akan memenuhi kebutuhan dan keinginan Anda.
            Jangan lupa juga bahwasannya kami menawarkan layanan periksa mata gratis, kacamata bergaransi, bisa membayar melalui cicilan dengan bungan 0% dan tanpa credit card, segera hubungin kami untuk informasi lebih lanjut.
        </p>
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
