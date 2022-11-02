---
layout: page
title: Cek Mata Gratis
subtitle: 'Periksa mata gratis di Optikal Bahari'
description: Periksa mata gratis dengan komputer di Jakarta
keywords: 'periksa mata, periksa mata gratis, periksa mata jakarta'
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/posts/021.jpg
permalink: /cek-mata-gratis/
---


<div class="card shadow p-3 mb-5 bg-white rounded">
    <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-5.jpg" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.jpg">
    <div class="card-body">
      <h3 class="card-title">Cek Mata Gratis</h3>
      <p class="card-text">Apakah penglihatan anda mulai terganggu? Mulai sering mengalami pandangan kabur dan kurang jelas? Banyak hal yang bisa menyebabkan penurunan kualitas penglihatan anda, mulai dari terlalu seringnya dihadapan monitor, terlalu sering main handphone, sampai dengan menurunnya kapasitas penglihatan seiring dengan bertambahnya usia. Di Optikal Bahari kami menyediakan beragam jenis tipe Lensa dan Frame bingkai kacamata dari mulai harga yang terjangkau sampai dengan harga menengah ke atas. Baca lebih lanjut untuk tahu alasan kenapa beli kacamata di Optikal Bahari.</p>
    </div>
</div>


{% include home-cards.html %}

<div class="card-deck mb-3">
  <div class="card shadow p-3 mb-5 bg-white rounded">
		  <img src="{{"/assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-9.jpg" | relative_url }}" class="card-img-top" alt="tips-kacamata-2.jpg">
    <div class="card-body">
      <h3 class="card-title">Segera Kunjungi Optikal Bahari</h3>
      <p class="card-text">Jadi tunggu apa lagi? Segera kunjungi Optikal Bahari di Bendungan Jago Kemayoran, Jakarta Pusat. Dan dapatkan banyak kemudahan untuk memilii kacamata idaman kamu dengan harga terjangkau. Untuk dapat info terbaru seputaran Promo yang kami berikan, kamu juga bisa bergabung dengan Fanpage
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


<div class="mapouter">
				<div class="gmap_canvas">
					<iframe width="600" height="500" id="gmap_canvas" src="https://maps.google.com/maps?q=optikal%20bahari&t=&z=13&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0">
					</iframe>
					<a href="https://www.whatismyip-address.com/divi-discount/"></a>
					</div>
					<style>
						.mapouter {
							position:relative;
							text-align:right;
							height:500px;
							width:600px;
							}
						.gmap_canvas {
							overflow:hidden;
							background:none!important;
							height:500px;
							width:500px;
							}
					</style>
				</div>
			</div>	