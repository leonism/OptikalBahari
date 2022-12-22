---
layout: page
title: Toko Kacamata Di Kemayoran, Bendungan Jago, Jakarta Pusat
subtitle: 'Toko Optik Kacamata, Frame Murah Dan Terjangkau'
description: Toko Kacamata & Optik murah dengan koleksi lensa dan frame paling lengkap dan terjangkau di Kemayoran.
keywords: Optikal Bahari, Optik Bahari, Sejarah Optik, Kemayoran, Bendungan Jago, Benjo
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/posts/029.jpg
permalink: /toko-kacamata/
---

<div class="card-deck mb-3">
  <div class="card shadow p-3 mb-5 bg-white rounded">
  <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-7.jpg" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.jpg">
    <div class="card-body">
      <h3 class="card-title">Toko Kacamata Optikal Bahari, Terjangkau Untuk Semua Kalangan</h3>
      <p class="card-text">
      Optikal Bahari menyediakan beragam pilihan lensa dan frame kacamata dengan harga terjangkau yang cocok untuk setiap kebutuhan dan gaya kamu. Kami mengerti bahwa membeli kacamata bukanlah hal yang dikategorikan mudah, oleh karena itu kami memberikan layanan pembayaran dengan cicilan yang memudahkan Anda dalam membeli kacamata yang diinginkan. Selain itu, kami juga menerima pembayaran menggunakan KJP untuk membantu Anda yang membutuhkan kacamata namun tidak memiliki uang yang cukup. Jangan ragu untuk mengunjungi Optikal Bahari dan temui staff ramah kami yang siap membantu Anda dengan sepenuh hati.
      </p>
      <p>
      Selain itu, di Optikal Bahari kami juga menyediakan layanan periksa mata gratis dengan menggunakan alat komputer yang terbaru. Proses pemeriksaan ini akan memberikan hasil yang akurat dan membantu Anda untuk mengetahui apakah ada perubahan pada ukuran mata atau tidak. Hal ini sangat penting untuk dilakukan secara rutin agar Anda dapat terus memantau kondisi mata dan memperbaiki penglihatan Anda dengan cara yang tepat. Kunjungi Optikal Bahari sekarang juga untuk memeriksa kondisi mata dan memastikan penglihatan Anda selalu dalam keadaan yang optimal.
      </p>
      </div>
      </div>
</div>

{% include home-cards.html %}

<div class="card-deck mb-3">
  <div class="card shadow p-3 mb-5 bg-white rounded">
  <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-9.jpg" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.jpg">
    <div class="card-body">
      <h3 class="card-title">Segera Kunjungi Optikal Bahari</h3>
      <p class="card-text">
        Kami tahu bahwa memilih kacamata yang tepat bukanlah hal yang mudah, terutama karena ada banyak pilihan yang tersedia di pasaran. Namun, di Optikal Bahari kami memiliki staff yang terlatih dan ramah yang akan membantu Anda dalam memilih kacamata yang paling sesuai dengan kebutuhan dan gaya Anda. Kami juga selalu memberikan saran yang terbaik kepada pelanggan kami agar dapat memilih kacamata yang paling sesuai dengan kebutuhan dan budget mereka. Jadi, jangan ragu untuk mengunjungi Optikal Bahari dan temui staff ramah kami yang siap membantu Anda.
      </p>
      <p class="card-text">Jadi tunggu apa lagi? Segera kunjungi Optikal Bahari di Bendungan Jago Kemayoran, Jakarta Pusat. Dan dapatkan banyak kemudahan untuk memiliki kacamata idaman kamu dengan harga terjangkau. Untuk dapat info terbaru seputaran Promo yang kami berikan, kamu juga bisa bergabung dengan Fanpage <a href="https://www.facebook.com/optikalbahari" id="FBClick" title="Facebook Page Optikal Bahari" class="FacebookPage">Facebook @optikalbahari</a> supaya selalu update informasi terkait layanan terbaru dari kami. Untuk respond yang lebih cepat, silahkan menghubungi kami di nomor HP/WA ini <a href="https://api.whatsapp.com/send?phone=6281932235445&text=Hallo%2C+saya+butuh+informasi+lebih+lanjut+mengenai+Optikal+Bahari" id="WhatsAppClick" class="WhatsAppCall" title="Call WhatsApp">+6281932235445</a>.
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
