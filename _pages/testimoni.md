---
layout: page
title: Testimoni Pelanggan, Bukti Kepercayaan dan Kepuasan
subtitle:
  'Berikut adalah sebagian dari testimoni & review yang diberikan oleh para pelanggan setia kami di
  halaman Google My Business Optikal Bahari sebagai referensi'
description:
  'Berikut adalah sebagian dari testimoni & review yang diberikan oleh para pelanggan setia kami di
  halaman Google My Business Optikal Bahari sebagai referensi'
keywords: 'Testimoni, Optikal Bahari, Kemayoran, Optik Kacamata, Gratis'
lang: id-ID
author: Optikal Bahari
categories: [Info]
tags: [layanan, optikal]
background: /assets/img/posts/hijabi-girls-01/kacamata-untuk-hijabers-013.webp
permalink: /testimoni/
comments: false
---

<div class="card-deck mb-3">
  <div class="card p-3 mb-5">
    {% include cloudinary/cloudinary-card-image.html src='assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-4.webp' alt='Periksakan Mata Anda Secara Rutin' ratio='16x9' class='card-img-top' %}
    <div class="card-body">
      <h3 class="card-title">
        Testimoni Pelanggan dan Konsumen Kami: Bukti Kepercayaan dan Kepuasan
      </h3>
      <p class="card-text text-start">
        Di tengah perubahan zaman dan derasnya arus informasi di era digital ini, menjaga konsistensi layanan dan kualitas bukan perkara mudah. Namun, dengan pengalaman lebih dari 40+ tahun di bisnis optik & kacamata, kami telah mempelajari banyak hal berharga dalam mewujudkannya. Namun, dengan pengalaman dan strategi yang tepat, Optikal Bahari berkomitmen untuk terus memberikan layanan dan kualitas terbaik bagi pelanggan.
      </p>
      <p class="card-text text-start">
        Testimoni-testimoni ini merupakan bukti nyata dari kepercayaan dan kepuasan pelanggan terhadap Optikal Bahari. Kami berkomitmen untuk selalu memberikan pelayanan terbaik dan produk berkualitas tinggi kepada seluruh pelanggan. Berikut adalah beberapa testimoni dari pelanggan setia kami, yang juga dapat Anda lihat secara online di
        <a
          href="https://search.google.com/local/reviews?placeid=ChIJDYWGN6T1aS4RjK50wCfHApg"
          title="Optikal Bahari Google My Busiess Review Page"
          class="GoogleMyBusiness"
          id="OptikalBahariGMB">Google My Business Optikal Bahari</a>
        dengan hasil 5 bintang dari 511 ulasan konsumen:
      </p>
    </div>
  </div>
</div>
<!-- Sorting Controls -->
<div class="d-flex justify-content-center align-items-center mb-4">
  <div class="d-flex flex-nowrap gap-2 align-items-center filter-controls">
    <!-- Items Per Page Dropdown -->
    <div class="dropdown">
      <button class="btn btn-outline-secondary dropdown-toggle rounded-pill btn-testimonial-control" type="button" id="limitDropdown" data-bs-toggle="dropdown" aria-expanded="false">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        <span class="limit-label">Tampilkan: 20</span>
      </button>
      <ul class="dropdown-menu shadow-sm border-0" aria-labelledby="limitDropdown" id="limit-options">
        <li><a class="dropdown-item" href="#" data-limit="10">10</a></li>
        <li><a class="dropdown-item" href="#" data-limit="20">20</a></li>
        <li><a class="dropdown-item" href="#" data-limit="30">30</a></li>
        <li><a class="dropdown-item" href="#" data-limit="40">40</a></li>
        <li><a class="dropdown-item" href="#" data-limit="50">50</a></li>
      </ul>
    </div>
    <!-- Sorting Controls -->
    <div class="dropdown">
      <button class="btn btn-outline-secondary dropdown-toggle rounded-pill btn-testimonial-control" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="17" y1="12" x2="7" y2="12"></line><line x1="12" y1="18" x2="12" y2="18"></line></svg>
        <span class="sort-label">Terbaru</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0" aria-labelledby="sortDropdown" id="sort-options">
        <li><a class="dropdown-item" href="#" data-sort="date-desc">Terbaru</a></li>
        <li><a class="dropdown-item" href="#" data-sort="date-asc">Terlama</a></li>
        <li><a class="dropdown-item" href="#" data-sort="rating-desc">Rating Tertinggi</a></li>
        <li><a class="dropdown-item" href="#" data-sort="rating-asc">Rating Terendah</a></li>
        <li><a class="dropdown-item" href="#" data-sort="with-photos">Dengan Photo</a></li>
      </ul>
    </div>
  </div>
</div>
<!-- Loading & Error States -->
<div id="reviews-loading" class="py-2">
  <div class="masonry-grid review-skeleton">
    {% for i in (1..6) %}
    <div class="masonry-item">
      <div class="card h-100 p-4 border-0 shadow-sm">
        <div class="d-flex align-items-center mb-3">
          <div class="skeleton-block skeleton-avatar me-3"></div>
          <div class="skeleton-block skeleton-title"></div>
        </div>
        <div class="skeleton-block skeleton-stars"></div>
        <div class="skeleton-block skeleton-text"></div>
        <div class="skeleton-block skeleton-text"></div>
        <div class="skeleton-block skeleton-text"></div>
      </div>
    </div>
    {% endfor %}
  </div>
</div>
<div id="reviews-error" class="alert alert-danger text-center py-4 d-none" role="alert">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:2em;height:2em;display:block;margin:0 auto 0.75rem" aria-hidden="true" focusable="false"><path fill="currentColor" d="M256 0c14.7 0 28.2 8.1 35.2 21l216 400c6.7 12.4 6.4 27.4-.8 39.5S486.1 480 472 480L40 480c-14.1 0-27.2-7.4-34.4-19.5s-7.5-27.1-.8-39.5l216-400c7-12.9 20.5-21 35.2-21zm0 352a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm0-192c-18.2 0-32.7 15.5-31.4 33.7l7.4 104c.9 12.5 11.4 22.3 23.9 22.3 12.6 0 23-9.7 23.9-22.3l7.4-104c1.3-18.2-13.1-33.7-31.4-33.7z"/></svg>
  <h5>Maaf, Terjadi Kesalahan</h5>
  <p>Gagal memuat data ulasan. Silakan coba muat ulang halaman.</p>
  <button class="btn btn-danger mt-2 rounded-pill px-4" id="retry-fetch">Coba Lagi</button>
</div>
<!-- Reviews Container -->
<div class="review-masonry-container mb-5 d-none" id="reviews-container-wrapper">
  <div class="masonry-grid" id="reviews-grid">
  </div>
</div>
<!-- Pagination Container -->
<nav aria-label="Review pagination" class="mb-5 mt-4 d-none" id="reviews-pagination-container">
  <ul class="pagination justify-content-center" id="reviews-pagination">
  </ul>
</nav>
<div class="card p-3 mb-5">
  {% include cloudinary/cloudinary-card-image.html src='assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-5.webp' alt='Testimoni Konsumen Optikal Bahari' ratio='16x9' class='card-img-top' %}
  <div class="card-body">
    <h3 class="card-title">
      Bukti Nyata Kepercayaan dan Kepuasan: Suara Pelanggan Optikal Bahari
    </h3>
    <p class="card-text text-start">
      Bagi Optikal Bahari, testimoni-testimoni ini bukan sekadar pujian, melainkan amanah dan tanggung jawab untuk terus memberikan yang terbaik. Kami berkomitmen untuk selalu menjaga kualitas layanan dan produk, serta meningkatkannya dari waktu ke waktu. Komitmen ini didasari oleh keyakinan kami bahwa setiap pelanggan berhak mendapatkan pengalaman terbaik dalam memenuhi kebutuhan kacamata mereka. Kami percaya bahwa kepuasan pelanggan adalah kunci utama dalam membangun bisnis yang berkelanjutan dan terpercaya.
    </p>
    <p class="card-text text-start">
      Oleh karena itu, kami ingin mengucapkan terima kasih kepada seluruh pelanggan yang telah memberikan testimoni dan kepercayaannya kepada Optikal Bahari. Kami akan terus berusaha keras untuk memberikan pelayanan dan produk terbaik, demi menghadirkan senyuman dan kebahagiaan bagi setiap pelanggan yang datang kepada kami.
    </p>
    <p class="card-text text-start">
      Testimoni-testimoni di atas merupakan bukti nyata dari kepercayaan dan kepuasan pelanggan terhadap Optikal Bahari. Kami berkomitmen untuk selalu memberikan pelayanan terbaik dan produk berkualitas tinggi kepada seluruh pelanggan. Jadi tunggu apalagi, segera datang ke Optikal Bahari dan dapatkan banyak penawaran menarik untuk Kacamata & Produk Lensa anda. Untuk respond yang lebih cepat, silahkan menghubungi kami di nomor HP/WA ini.
      <a
        href="https://api.whatsapp.com/send?phone=6281932235445&text=Hallo%2C+saya+butuh+informasi+lebih+lanjut+mengenai+Optikal+Bahari"
        id="WhatsAppClick"
        class="WhatsAppCall"
        title="Call WhatsApp">+6281932235445
      </a>
      atau kunjungi
      <a
        href="https://www.facebook.com/optikalbahari"
        id="FBClick"
        title="Facebook Page Optikal Bahari"
        class="FacebookPage">Facebook Fan</a>
      Page kami.
      <em>(Optikal Bahari)</em>
    </p>
  </div>
</div>
