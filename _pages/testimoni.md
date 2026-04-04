---
layout: page
title: Testimoni
permalink: /testimoni/
description: Lihat apa yang dikatakan pelanggan kami tentang layanan Optikal Bahari. Testimoni jujur dari ribuan pelanggan yang telah kami layani sejak 1978.
---

<div class="testimoni-header-card card shadow-sm border-0 rounded-4 overflow-hidden mb-5" style="background-color: #ffffff;">
    <div class="card-body p-4 p-md-5">
        <div class="row align-items-center">
            <div class="col-lg-8">
                <h1 class="display-4 mb-3" style="font-weight: 800; color: #1976d2;">Apa Kata Mereka?</h1>
                <p class="lead testimoni-intro-text mb-4" style="color: #5f6368; font-size: 1.25rem;">
                    Kepuasan Anda adalah prioritas utama kami. Berikut adalah ulasan asli dari pelanggan setia Optikal Bahari yang telah merasakan langsung kualitas layanan dan produk kami.
                </p>
                <div class="d-flex align-items-center mb-3">
                    <div class="text-warning me-2">
                        <i class="fas fa-star fa-2x"></i>
                        <i class="fas fa-star fa-2x"></i>
                        <i class="fas fa-star fa-2x"></i>
                        <i class="fas fa-star fa-2x"></i>
                        <i class="fas fa-star fa-2x"></i>
                    </div>
                    <span class="h4 mb-0" style="font-weight: 700; color: #333;">4.9/5.0</span>
                </div>
                <p class="text-muted mb-0">Berdasarkan lebih dari 500 ulasan di Google Maps</p>
            </div>
            <div class="col-lg-4 d-none d-lg-block text-center">
                <i class="fas fa-quote-right fa-10x" style="color: #e3f2fd; opacity: 0.5;"></i>
            </div>
        </div>
    </div>
</div>

<!-- Sorting Controls -->
<div class="d-flex justify-content-between align-items-center mb-4">
  <h4 class="mb-0" style="font-weight: 700; color: #333;">Ulasan Pelanggan</h4>
  <div class="dropdown">
    <button class="btn btn-outline-secondary dropdown-toggle rounded-pill px-4 py-2" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false" style="font-weight: 600;">
      <i class="fas fa-sort me-2"></i> Urutkan
    </button>
    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0" aria-labelledby="sortDropdown" id="sort-options">
      <li><a class="dropdown-item" href="#" data-sort="date-desc">Terbaru</a></li>
      <li><a class="dropdown-item" href="#" data-sort="date-asc">Terlama</a></li>
      <li><a class="dropdown-item" href="#" data-sort="rating-desc">Rating Tertinggi</a></li>
      <li><a class="dropdown-item" href="#" data-sort="rating-asc">Rating Terendah</a></li>
    </ul>
  </div>
</div>

<!-- Loading & Error States -->
<div id="reviews-loading" class="text-center py-5">
  <div class="spinner-border text-danger" role="status" style="width: 3rem; height: 3rem;">
    <span class="visually-hidden">Memuat...</span>
  </div>
  <p class="mt-3 text-muted">Sedang memuat ulasan pelanggan...</p>
</div>

<div id="reviews-error" class="alert alert-danger text-center py-4 d-none" role="alert">
  <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
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

<!-- JavaScript for Dynamic Loading and Rendering (ES5 Compatible) -->
<script>
var allReviews = [];
var currentSortedReviews = [];
var currentPage = 1;
var itemsPerPage = 20;

document.addEventListener('DOMContentLoaded', function() {
  fetchReviews();
  
  var sortOptions = document.getElementById('sort-options');
  if (sortOptions) {
    sortOptions.addEventListener('click', function(e) {
      if (e.target.classList.contains('dropdown-item')) {
        e.preventDefault();
        var sortType = e.target.getAttribute('data-sort');
        sortReviews(sortType, e);
      }
    });
  }

  var paginationContainer = document.getElementById('reviews-pagination');
  if (paginationContainer) {
    paginationContainer.addEventListener('click', function(e) {
      var link = e.target.closest('.review-page-link');
      if (link) {
        e.preventDefault();
        var page = parseInt(link.getAttribute('data-page'));
        if (!isNaN(page)) {
          goToPage(page, e);
        }
      }
    });
  }

  var reviewsGrid = document.getElementById('reviews-grid');
  if (reviewsGrid) {
    reviewsGrid.addEventListener('error', function(e) {
      if (e.target.tagName === 'IMG' && e.target.classList.contains('avatar-img')) {
        e.target.style.display = 'none';
        var fallback = e.target.nextElementSibling;
        if (fallback) {
          fallback.style.display = 'flex';
        }
      }
    }, true);
  }

  var retryBtn = document.getElementById('retry-fetch');
  if (retryBtn) {
    retryBtn.addEventListener('click', fetchReviews);
  }
});

function fetchReviews() {
  var loadingEl = document.getElementById('reviews-loading');
  var errorEl = document.getElementById('reviews-error');
  var containerWrapper = document.getElementById('reviews-container-wrapper');
  var paginationWrapper = document.getElementById('reviews-pagination-container');

  loadingEl.classList.remove('d-none');
  errorEl.classList.add('d-none');
  containerWrapper.classList.add('d-none');
  if(paginationWrapper) paginationWrapper.classList.add('d-none');

  fetch('/api/reviews.json')
    .then(function(response) {
      if (!response.ok) throw new Error('HTTP error! status: ' + response.status);
      return response.json();
    })
    .then(function(data) {
      if (!Array.isArray(data)) throw new Error('Format data tidak sesuai.');

      allReviews = data;
      sortReviews('date-desc');

      loadingEl.classList.add('d-none');
      containerWrapper.classList.remove('d-none');
      if(paginationWrapper) paginationWrapper.classList.remove('d-none');
    })
    .catch(function(error) {
      console.error('Error fetching reviews:', error);
      loadingEl.classList.add('d-none');
      errorEl.classList.remove('d-none');
    });
}

function sortReviews(sortType, event) {
  if (event) event.preventDefault();

  if (event && event.target) {
    var btn = document.getElementById('sortDropdown');
    btn.innerHTML = '<i class="fas fa-sort me-2"></i> ' + event.target.innerText;
  }

  currentSortedReviews = allReviews.slice().sort(function(a, b) {
    switch (sortType) {
      case 'date-desc':
        return new Date(b.publishedAtDate) - new Date(a.publishedAtDate);
      case 'date-asc':
        return new Date(a.publishedAtDate) - new Date(b.publishedAtDate);
      case 'rating-desc':
        return (b.stars || 0) - (a.stars || 0);
      case 'rating-asc':
        return (a.stars || 0) - (b.stars || 0);
      default:
        return 0;
    }
  });

  currentPage = 1;
  renderReviews();
}

function goToPage(page, event) {
  if (event) event.preventDefault();
  currentPage = page;
  renderReviews();

  var gridWrapper = document.getElementById('reviews-container-wrapper');
  if (gridWrapper) {
    var offset = 100;
    var topPos = gridWrapper.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: topPos, behavior: 'smooth' });
  }
}

function renderReviews() {
  var gridEl = document.getElementById('reviews-grid');
  gridEl.innerHTML = '';

  var startIndex = (currentPage - 1) * itemsPerPage;
  var endIndex = startIndex + itemsPerPage;
  var paginatedReviews = currentSortedReviews.slice(startIndex, endIndex);

  if (currentPage === 1 && currentSortedReviews.length > 0) {
    var totalScore = currentSortedReviews[0].totalScore || "5.0";
    var totalReviews = currentSortedReviews[0].reviewsCount || currentSortedReviews.length;
    
    var starsRepeat = '';
    var roundedScore = Math.round(parseFloat(totalScore));
    for (var s = 0; s < roundedScore; s++) {
      starsRepeat += '<i class="fas fa-star fs-4"></i>';
    }

    var summaryCard = '<div class="masonry-item review-card-animation">' +
        '<div class="card shadow-sm border-0 rounded-4 text-center h-100 p-4" style="background-color: #ffffff;">' +
          '<h2 class="display-3 mb-2" style="font-weight: 700; color: #5f6368;">' + totalScore + '</h2>' +
          '<div class="mb-3 text-warning">' +
            starsRepeat +
          '</div>' +
          '<h5 class="card-title" style="font-weight: 700; color: #5f6368;">Google Overall Rating<br>Bahari Optical</h5>' +
        '</div>' +
      '</div>';
    gridEl.innerHTML += summaryCard;
  }

  paginatedReviews.forEach(function(review) {
    var name = review.name || 'Anonymous';
    var initials = name.charAt(0).toUpperCase();
    var avatarColor = getAvatarColor(initials);
    var photoUrl = review.reviewerPhotoUrl;

    var avatarHtml = '';
    if (photoUrl && photoUrl !== 'null') {
      avatarHtml = '<img src="' + photoUrl + '" alt="' + name + '" class="rounded-circle avatar-img" width="48" height="48">' +
                    '<div class="rounded-circle text-white d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: ' + avatarColor + '; font-size: 1.2rem; font-weight: bold; display: none !important;">' + initials + '</div>';
    } else {
      avatarHtml = '<div class="rounded-circle text-white d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: ' + avatarColor + '; font-size: 1.2rem; font-weight: bold;">' + initials + '</div>';
    }

    var stars = review.stars || 5;
    var starsHtml = '';
    for (var i = 1; i <= 5; i++) {
      if (i <= stars) {
        starsHtml += '<i class="fas fa-star" style="color: #ff9800;"></i> ';
      } else {
        starsHtml += '<i class="far fa-star" style="color: #ff9800;"></i> ';
      }
    }

    var imagesHtml = '';
    if (review.reviewImageUrls && review.reviewImageUrls.length > 0) {
      var imgUrl = review.reviewImageUrls[0];
      imagesHtml = '<img src="' + imgUrl + '" class="img-fluid rounded mt-3 mb-2" alt="Review Image" loading="lazy" style="width: 100%; object-fit: cover;">';
    }

    var cardHtml = '<div class="masonry-item review-card-animation">' +
        '<div class="card shadow-sm border-0 rounded-4 h-100 p-4" style="background-color: #ffffff; transition: transform 0.3s ease, box-shadow 0.3s ease;">' +
          '<div class="d-flex align-items-center mb-2">' +
            '<div class="me-3">' + avatarHtml + '</div>' +
            '<div>' +
              '<h5 class="mb-0" style="color: #1976d2; font-weight: 700; font-size: 1.1rem;">' + name + '</h5>' +
            '</div>' +
          '</div>' +
          '<div class="mb-3">' + starsHtml + '</div>' +
          '<p class="card-text text-muted mb-2" style="font-size: 1rem; line-height: 1.5;">' + (review.text || '') + '</p>' +
          imagesHtml +
          '<div class="mt-auto pt-3">' +
            '<a href="' + (review.reviewUrl || '#') + '" target="_blank" rel="noopener noreferrer" class="text-decoration-none d-flex align-items-center" style="color: #1976d2; font-size: 0.9rem;">' +
              '<img src="https://www.google.com/favicon.ico" width="16" height="16" class="me-2" alt="Google"> View on Google' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    gridEl.innerHTML += cardHtml;
  });

  renderPagination();
}

function renderPagination() {
  var paginationContainer = document.getElementById('reviews-pagination');
  if (!paginationContainer) return;

  var totalPages = Math.ceil(currentSortedReviews.length / itemsPerPage);

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  var html = '';

  if (currentPage > 1) {
    html += '<li class="page-item"><a class="btn btn-primary rounded-pill mx-1 text-white review-page-link" href="#" data-page="' + (currentPage - 1) + '">« Prev</a></li>';
  } else {
    html += '<li class="page-item disabled"><span class="btn btn-primary rounded-pill mx-1 disabled text-white">« Prev</span></li>';
  }

  var maxTrail = 2;
  var startPage = Math.max(1, currentPage - maxTrail);
  var endPage = Math.min(totalPages, currentPage + maxTrail);

  if (currentPage <= maxTrail) endPage = Math.min(totalPages, 1 + maxTrail * 2);
  if (currentPage > totalPages - maxTrail) startPage = Math.max(1, totalPages - maxTrail * 2);

  if (startPage > 1) {
    html += '<li class="page-item"><a class="btn btn-primary rounded-pill mx-1 text-white review-page-link" href="#" data-page="1">1</a></li>';
    if (startPage > 2) {
      html += '<li class="page-item disabled"><span class="btn btn-primary rounded-pill mx-1 disabled text-white" style="background-color: transparent !important; border: none; color: #6c757d !important;">...</span></li>';
    }
  }

  for (var i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += '<li class="page-item active"><span class="btn btn-primary rounded-pill mx-1 active text-white">' + i + '</span></li>';
    } else {
      html += '<li class="page-item"><a class="btn btn-primary rounded-pill mx-1 text-white review-page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
    }
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += '<li class="page-item disabled"><span class="btn btn-primary rounded-pill mx-1 disabled text-white" style="background-color: transparent !important; border: none; color: #6c757d !important;">...</span></li>';
    }
    html += '<li class="page-item"><a class="btn btn-primary rounded-pill mx-1 text-white review-page-link" href="#" data-page="' + totalPages + '">' + totalPages + '</a></li>';
  }

  if (currentPage < totalPages) {
    html += '<li class="page-item"><a class="btn btn-primary rounded-pill mx-1 text-white review-page-link" href="#" data-page="' + (currentPage + 1) + '">Next »</a></li>';
  } else {
    html += '<li class="page-item disabled"><span class="btn btn-primary rounded-pill mx-1 disabled text-white">Next »</span></li>';
  }

  paginationContainer.innerHTML = html;
}

function getAvatarColor(char) {
  var colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ff9800', '#ff5722', '#795548', '#607d8b'];
  var index = char.charCodeAt(0) % colors.length;
  return colors[index];
}
</script>

<style>
.masonry-grid {
  column-count: 3;
  column-gap: 1.5rem;
  width: 100%;
}

.masonry-item {
  display: inline-block;
  width: 100%;
  margin-bottom: 1.5rem;
  break-inside: avoid;
}

.review-card-animation {
  animation: fadeIn 0.5s ease-out forwards;
}

.masonry-item .card:hover {
  transform: translateY(-5px);
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1199px) {
  .masonry-grid {
    column-count: 2;
  }
}

@media (max-width: 767px) {
  .masonry-grid {
    column-count: 1;
  }
}

body.dark-mode .testimoni-header-card,
body.dark-mode .testimoni-footer-card,
body.dark-mode .masonry-item .card {
  background-color: #1a2332 !important;
  color: #ffffff !important;
}
body.dark-mode .testimoni-intro-text,
body.dark-mode .masonry-item .card-text {
  color: #d0d0d0 !important;
}
body.dark-mode .masonry-item .card h5 {
  color: #64b5f6 !important;
}
</style>

<div class="card shadow p-3 mb-5 rounded border-0 testimoni-footer-card" style="background-color: #ffffff;">

{% include cloudinary/card_image.html src="assets/img/posts/periksa-mata/periksa-mata-gratis-optikal-bahari-5.webp" alt="Testimoni Konsumen Optikal Bahari" ratio="16x9" class="card-img-top" %}

  <div class="card-body">
    <h3 class="card-title text-center mb-4">
      Bukti Nyata Kepercayaan: Suara Pelanggan Optikal Bahari
    </h3>
    <p class="card-text text-start">
      Bagi Optikal Bahari, testimoni-testimoni ini bukan sekadar pujian, melainkan amanah dan tanggung jawab untuk terus memberikan yang terbaik. Kami berkomitmen untuk selalu menjaga kualitas layanan dan produk, serta meningkatkannya dari waktu ke waktu.
    </p>
    <p class="card-text text-start">
      Terima kasih kepada seluruh pelanggan yang telah memberikan testimoni dan kepercayaannya. Kami akan terus berusaha keras untuk memberikan pelayanan dan produk terbaik. Untuk informasi lebih lanjut atau konsultasi, silahkan menghubungi kami:
    </p>
    <div class="text-center mt-4">
      <a
        href="https://api.whatsapp.com/send?phone=6281932235445&text=Hallo%2C+saya+butuh+informasi+lebih+lanjut+mengenai+Optikal+Bahari"
        id="WhatsAppClick"
        class="btn btn-success btn-lg rounded-pill WhatsAppCall px-5 py-3"
        title="Hubungi Kami via WhatsApp">
        <i class="fab fa-whatsapp me-2"></i> Chat WhatsApp: +6281932235445
      </a>
    </div>
    <p class="card-text text-center mt-4">
      Atau kunjungi <a href="https://www.facebook.com/optikalbahari" target="_blank" class="text-primary fw-bold">Facebook Fan Page</a> kami.
      <br><em>(Optikal Bahari - Profesional Eyecare Since 1978)</em>
    </p>
  </div>
</div>
