---
layout: page
title: Cek Mata Gratis
subtitle: 'Periksa mata gratis di Optikal Bahari'
description: Di Optikal Bahari kami menyediakan beragam jenis tipe Lensa dan Frame bingkai kacamata dari mulai harga yang terjangkau sampai dengan harga menengah ke atas.
keywords: 'periksa mata, periksa mata gratis, periksa mata jakarta'
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/posts/021.webp
permalink: /cek-mata-gratis/
comments: false
---


<div class="card shadow p-3 mb-5 bg-white rounded">
    <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-5.webp" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.webp">
    <div class="card-body">
      <h3 class="card-title">
            Cek Mata Gratis di Optikal Bahari
      </h3>
        <p class="card-text text-left">
            Pernahkah Anda merasa penglihatan Anda tidak setajam dulu? Seringkah Anda mengalami pandangan kabur dan kurang jelas saat membaca buku, melihat layar komputer, atau bahkan saat mengemudi? Jika ya, Anda tidak sendirian. Banyak orang mengalami penurunan kualitas penglihatan karena berbagai faktor, seperti terlalu sering di depan monitor, terlalu sering bermain handphone, dan bertambahnya usia. Berikut beberapa faktor penurunan daya penglihatan mata Anda.
        </p>
        <ul>
                <li>
                    <strong>Paparan Ultra Violet:</strong> Paparan sinar biru dari layar komputer dan gadget dapat menyebabkan kelelahan mata dan kerusakan retina.
                </li>
                <li>
                    <strong>Penggunaan gadget berlebihan:</strong> Memandangi layar handphone dalam waktu lama dapat menyebabkan mata kering dan tegang.
                </li>
                <li>
                    <strong>Usia:</strong> Seiring bertambahnya usia, kemampuan mata untuk fokus dan melihat detail berkurang.
                </li>
                <li>
                    <strong>Penyakit tertentu:</strong> Diabetes, katarak, dan glaukoma dapat menyebabkan kerusakan mata dan penurunan penglihatan.
                </li>
            </ul>
        <h3 class="card-title">
            Apa yang Dapat Dilakukan?
        </h3>
        <p class="card-text text-left">
            Kabar baiknya adalah Anda tidak perlu khawatir! Optikal Bahari hadir sebagai solusi terbaik untuk kebutuhan penglihatan Anda. Kami menyediakan berbagai jenis lensa dan frame bingkai kacamata dari mulai harga terjangkau hingga menengah ke atas.
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
                    {{ post.date | date: '%B %d, %Y' }} &middot; {% include read_time.html content=post.content %}
                </small>
            </div>
        </div>
        {% endfor %}
    </div>
</section>
