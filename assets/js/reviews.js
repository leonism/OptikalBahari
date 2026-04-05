/**
 * Optikal Bahari - Testimonial Review Module
 * -----------------------------------------
 * Handles fetching Google Business Reviews, sorting them,
 * and providing a paginated Masonry-style layout.
 *
 * Features:
 * - Direct API Fetch from /api/reviews.json
 * - Dynamic Sorting (Date, Rating)
 * - Custom Pagination with Smooth Scrolling
 * - Google Overall Rating Summary Card
 */

/**
 * @typedef {Object} Review
 * @property {string} [name]
 * @property {number} [stars]
 * @property {string} [text]
 * @property {string} [publishedAtDate]
 * @property {string} [reviewerPhotoUrl]
 * @property {string[]} [reviewImageUrls]
 * @property {string} [reviewUrl]
 * @property {string} [totalScore]
 */

// --- Global State ---
/** @type {Review[]} */
let allReviews = [] // Raw storage for all fetched reviews
/** @type {Review[]} */
let currentSortedReviews = [] // Reviews currently filtered/sorted
let currentPage = 1 // Active pagination page
const ITEMS_PER_PAGE = 20 // Number of reviews per page

/**
 * Initialize application on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchReviews()
  setupEventListeners()
  initReviewModal()
})

/**
 * Attach global event listeners
 */
function setupEventListeners() {
  // Sorting dropdown clicks
  const sortOptions = document.getElementById('sort-options')
  if (sortOptions) {
    sortOptions.addEventListener('click', (e) => {
      const target = e.target
      if (target instanceof HTMLElement && target.classList.contains('dropdown-item')) {
        e.preventDefault()
        const sortType = target.getAttribute('data-sort')
        if (sortType) {
          sortReviews(sortType, e)
        }
      }
    })
  }

  // Retry button for error states
  const retryBtn = document.getElementById('retry-fetch')
  if (retryBtn) {
    retryBtn.addEventListener('click', fetchReviews)
  }
}

/**
 * Toggles the "See more" state for a review card
 * @param {HTMLElement} btn
 */
function toggleReadMore(btn) {
  const cardBody = btn.closest('.card-body') || btn.closest('.card')
  if (!cardBody) return

  const moreText = cardBody.querySelector('.more-text')
  const dots = cardBody.querySelector('.dots')

  if (moreText && dots) {
    if (moreText.classList.contains('d-none')) {
      moreText.classList.remove('d-none')
      dots.classList.add('d-none')
      btn.innerText = 'See less'
    } else {
      moreText.classList.add('d-none')
      dots.classList.remove('d-none')
      btn.innerText = 'See more'
    }
  }
}

/**
 * Initializes and appends the review modal to the body
 */
function initReviewModal() {
  if (document.getElementById('review-modal')) return

  const modalHtml = `
    <div id="review-modal" class="review-modal-overlay d-none" onclick="if(event.target === this) closeReviewModal()">
      <div class="review-modal-container">
        <button class="review-modal-close" onclick="closeReviewModal()">&times;</button>
        <div id="review-modal-content"></div>
      </div>
    </div>
  `
  document.body.insertAdjacentHTML('beforeend', modalHtml)
}

/**
 * Opens the review modal for a specific review index
 * @param {number} index
 */
function openReviewModal(index) {
  const review = currentSortedReviews[index]
  if (!review) return

  const modalContent = document.getElementById('review-modal-content')
  const modal = document.getElementById('review-modal')
  if (!modalContent || !modal) return

  const name = review.name || 'Anonymous'
  const initials = name.charAt(0).toUpperCase()
  const photoUrl = review.reviewerPhotoUrl
  const avatarColor = getAvatarColor(initials)

  // Stars
  const stars = review.stars || 5
  let starsHtml = ''
  for (let i = 1; i <= 5; i++) {
    starsHtml += i <= stars ? '<i class="fas fa-star" style="color: #ff9800;"></i>' : '<i class="far fa-star" style="color: #ff9800;"></i>'
  }

  // Avatar URL Optimization
  const optimizedAvatarUrl = optimizeGoogleImageUrl(photoUrl || '', 96)

  // Avatar HTML Generation
  const avatarHtml =
    optimizedAvatarUrl && optimizedAvatarUrl !== 'null'
      ? `<img src="${optimizedAvatarUrl}" alt="${name}" class="rounded-circle" width="48" height="48" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="rounded-circle text-white d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: ${avatarColor}; font-size: 1.2rem; font-weight: bold; display: none !important;">${initials}</div>`
      : `<div class="rounded-circle text-white d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: ${avatarColor}; font-size: 1.2rem; font-weight: bold;">${initials}</div>`

  // Images - Click to open original
  let imagesHtml = ''
  const imageUrls = Array.isArray(review.reviewImageUrls) ? review.reviewImageUrls : []
  if (imageUrls.length > 0) {
    imagesHtml = `<div class="review-modal-images mt-3">
      ${imageUrls.map((url) => `<a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${optimizeGoogleImageUrl(url, 800)}" class="img-fluid rounded mb-2" alt="Review Image"></a>`).join('')}
    </div>`
  }

  modalContent.innerHTML = `
    <div class="card p-4 border-0">
      <div class="d-flex align-items-center mb-3">
        <div class="me-3">${avatarHtml}</div>
        <div>
          <h5 class="mb-0" style="color: #1976d2; font-weight: 700; font-size: 1.1rem;">${name}</h5>
          <div class="small text-muted">reviewed <span style="color: #1976d2;">Bahari Optical</span></div>
        </div>
      </div>
      <div class="mb-2">${starsHtml}</div>
      <div class="review-modal-text text-muted" style="font-size: 1rem; line-height: 1.6;">
        ${review.text ? review.text : '<em>Customer left rating star only</em>'}
      </div>
      ${imagesHtml}
      <div class="mt-4 pt-3 border-top">
        <a href="${review.reviewUrl || '#'}" target="_blank" rel="noopener noreferrer" class="text-decoration-none d-flex align-items-center" style="color: #1976d2; font-size: 0.9rem;">
          <img src="https://www.google.com/favicon.ico" width="20" height="20" class="me-2" alt="Google"> View on Google
        </a>
      </div>
    </div>
  `

  modal.classList.remove('d-none')
  document.body.style.overflow = 'hidden' // Prevent scroll
}

/**
 * Closes the review modal
 */
function closeReviewModal() {
  const modal = document.getElementById('review-modal')
  if (modal) {
    modal.classList.add('d-none')
    document.body.style.overflow = '' // Restore scroll
  }
}

/**
 * Fetches data from the API and manages UI states
 */
async function fetchReviews() {
  const els = getUIElements()

  // Reset UI State to "Loading"
  setUIState('loading')

  try {
    const response = await fetch('/api/reviews.json')
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)

    const data = await response.json()
    if (!Array.isArray(data)) throw new Error('Invalid data format received')

    allReviews = data

    // Format score with .0 suffix for visual consistency
    const firstScore = data[0] ? (parseFloat(data[0].totalScore) || 5.0).toFixed(1) : '5.0'

    // Sort by Date (Newest) initially and render
    sortReviews('date-desc')

    // UI state success is handled by renderReviews internally via its called path
    setUIState('success')
    renderReviews(firstScore)
  } catch (error) {
    console.error('Testimonial error:', error)
    setUIState('error')
  }
}

/**
 * Handles sorting logic and updates UI
 * @param {string} sortType - Type of sorting ('date-desc', 'rating-asc', etc)
 * @param {Event} [event] - Optional click event for updating UI text
 */
function sortReviews(sortType, event) {
  if (event) event.preventDefault()

  // Update dropdown button text dynamically
  if (event && event.target instanceof HTMLElement) {
    const btn = document.getElementById('sortDropdown')
    if (btn) btn.innerHTML = `<i class="fas fa-sort me-2"></i> ${event.target.innerText}`
  }

  // Handle "With Photos" filter separately as it changes the base array
  if (sortType === 'with-photos') {
    currentSortedReviews = allReviews.filter((r) => Array.isArray(r.reviewImageUrls) && r.reviewImageUrls.length > 0)
    // Default to date-desc for photo view
    currentSortedReviews.sort((a, b) => {
      const timeA = a.publishedAtDate ? new Date(a.publishedAtDate).getTime() : 0
      const timeB = b.publishedAtDate ? new Date(b.publishedAtDate).getTime() : 0
      return timeB - timeA
    })
  } else {
    // Perform sorting on the full reviews array
    currentSortedReviews = [...allReviews].sort((a, b) => {
      const timeA = a.publishedAtDate ? new Date(a.publishedAtDate).getTime() : 0
      const timeB = b.publishedAtDate ? new Date(b.publishedAtDate).getTime() : 0

      switch (sortType) {
        case 'date-desc':
          return timeB - timeA
        case 'date-asc':
          return timeA - timeB
        case 'rating-desc':
          return (b.stars || 0) - (a.stars || 0)
        case 'rating-asc':
          return (a.stars || 0) - (b.stars || 0)
        default:
          return 0
      }
    })
  }

  // Reset to first page whenever sorting changes
  currentPage = 1
  renderReviews()
}

/**
 * Navigates to a specific page and scrolls the user back to the top of the grid
 * @param {number} page
 * @param {Event} [event]
 */
function goToPage(page, event) {
  if (event) event.preventDefault()
  currentPage = page
  renderReviews()

  // Smooth scroll back to the review container top
  const gridWrapper = document.getElementById('reviews-container-wrapper')
  if (gridWrapper) {
    const offset = 100
    const scrollPos = gridWrapper.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top: scrollPos, behavior: 'smooth' })
  }
}

/**
 * Main rendering function to build the review grid HTML
 * @param {string} [customScore]
 */
function renderReviews(customScore) {
  const gridEl = document.getElementById('reviews-grid')
  if (!gridEl) return

  // Clear existing content
  gridEl.innerHTML = ''

  // Calculate slice for current page
  const start = (currentPage - 1) * ITEMS_PER_PAGE
  const pageReviews = currentSortedReviews.slice(start, start + ITEMS_PER_PAGE)

  // 1. Add Summary Card (Only on the first page)
  if (currentPage === 1 && currentSortedReviews.length > 0) {
    const score = customScore || (currentSortedReviews[0].totalScore ? parseFloat(currentSortedReviews[0].totalScore).toFixed(1) : '5.0')
    gridEl.innerHTML += createSummaryCardTemplate(score)
  }

  // 2. Loop through and add paginated review cards
  pageReviews.forEach((review) => {
    gridEl.innerHTML += createReviewCardTemplate(review)
  })

  // 3. Update Pagination UI
  renderPagination()
}

// --- HTML Templates (Keeps logic leaner) ---

/**
 * @param {string} score
 */

function createSummaryCardTemplate(score) {
  return `
    <div class="masonry-item review-card-animation">
      <div class="card h-100 p-4 text-center shadow-sm" style="background-color:#ffffff;">
        <h2 class="display-3 mb-1" style="font-weight:800; color:#1976d2;">${score}</h2>
        <div class="mb-0 text-warning">
          <i class="fa-solid fa-star fs-4"></i>
          <i class="fa-solid fa-star fs-4"></i>
          <i class="fa-solid fa-star fs-4"></i>
          <i class="fa-solid fa-star fs-4"></i>
          <i class="fa-solid fa-star fs-4"></i>
        </div>
        <h5 class="card-title mt-1" style="font-weight: 700; color: #5f6368;">Google Overall Rating<br>Bahari Optical</h5>
      </div>
    </div>`
}
/**
 * @param {Review} review
 */
function createReviewCardTemplate(review) {
  const name = review.name || 'Anonymous'
  const initials = name.charAt(0).toUpperCase()
  const photoUrl = review.reviewerPhotoUrl
  const avatarColor = getAvatarColor(initials)

  // Custom Stars Generation
  const stars = review.stars || 5
  let starsHtml = ''
  for (let i = 1; i <= 5; i++) {
    starsHtml += i <= stars ? '<i class="fa-solid fa-star" style="color:#ff9800;"></i>' : '<i class="fa-regular fa-star" style="color: #ff9800;"></i>'
  }

  // Review Text Truncation
  const fullText = review.text || ''
  const charLimit = 200
  let displayBodyHtml = ''

  if (fullText) {
    if (fullText.length > charLimit) {
      const visibleText = fullText.substring(0, charLimit)
      const hiddenText = fullText.substring(charLimit)
      displayBodyHtml = `
        ${visibleText}<span class="dots">...</span>
        <span class="more-text d-none">${hiddenText}</span>
        <button onclick="toggleReadMore(this)" class="btn btn-link p-0 ms-1" style="font-size: 0.9rem; text-decoration:none; color: #1976d2; vertical-align: baseline;">See more</button>
      `
    } else {
      displayBodyHtml = fullText
    }
  } else {
    displayBodyHtml = '<em class="opacity-75">Customer only left rating star without comments.</em>'
  }

  // Find index of this review in the currentSortedReviews array
  const reviewIndex = currentSortedReviews.indexOf(review)

  // Optimize avatar and review images
  const optimizedAvatarUrl = optimizeGoogleImageUrl(photoUrl || '', 96)

  // Review Images Handling
  let imagesHtml = ''
  const imageUrls = Array.isArray(review.reviewImageUrls) ? review.reviewImageUrls : []

  if (imageUrls.length === 1) {
    const thumbUrl = optimizeGoogleImageUrl(imageUrls[0], 600)
    imagesHtml = `<img src="${thumbUrl}" class="img-fluid rounded mt-2 mb-1 clickable-img" alt="Review Image" loading="lazy" style="width: 100%; max-height: 300px; object-fit: cover;" onclick="openReviewModal(${reviewIndex})">`
  } else if (imageUrls.length > 1) {
    const thumbnails = imageUrls
      .map((url) => {
        const thumbUrl = optimizeGoogleImageUrl(url, 200) // Small square thumbs
        return `<div class="review-thumbnail-wrapper" onclick="openReviewModal(${reviewIndex})">
          <img src="${thumbUrl}" class="rounded flex-shrink-0" alt="Review Image" loading="lazy">
        </div>`
      })
      .join('')
    imagesHtml = `<div class="d-flex flex-wrap gap-2 mt-2 mb-1 review-images-grid">${thumbnails}</div>`
  }

  // Fallback for missing avatar photos
  const avatarHtml =
    optimizedAvatarUrl && optimizedAvatarUrl !== 'null'
      ? `<img src="${optimizedAvatarUrl}" alt="${name}" class="rounded-circle" width="48" height="48" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="rounded-circle text-white d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: ${avatarColor}; font-size:1.2rem; font-weight:bold; display:none !important;">
        ${initials}</div>`
      : `<div class="rounded-circle text-white d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: ${avatarColor}; font-size:1.2rem; font-weight:bold;">${initials}</div>`

  return `
    <div class="masonry-item review-card-animation">
      <div class="card h-100 p-4" style="background-color:#ffffff; transition:transform 0.3s ease, box-shadow 0.3s ease;">
        <div class="d-flex align-items-center mb-2">
          <div class="me-3">
            ${avatarHtml}
          </div>
          <div>
            <h5 class="mb-0" style="color:#1976d2; font-weight:700; font-size:1.1rem;">
              ${name}
            </h5>
          </div>
        </div>
        <div class="mb-1">
          ${starsHtml}
        </div>
        <div class="card-text text-muted mb-1" style="font-size:1rem; line-height:1.3;">
          ${displayBodyHtml}
        </div>
          ${imagesHtml}
        <div class="mt-auto pt-1">
          <a href="${review.reviewUrl || '#'}" target="_blank" rel="noopener noreferrer" class="text-decoration-none d-flex align-items-center" style="color:#1976d2; font-size:0.9rem;">
            <img src="https://www.google.com/favicon.ico" width="24" height="24" class="me-2" alt="Google">
            View on Google
          </a>
        </div>
      </div>
    </div>`
}

// --- Pagination & Utilities ---

function renderPagination() {
  const container = document.getElementById('reviews-pagination')
  if (!container) return

  const totalPages = Math.ceil(currentSortedReviews.length / ITEMS_PER_PAGE)
  if (totalPages <= 1) return (container.innerHTML = '')

  let html = ''

  // 1. Previous Button
  const prevDisabled = currentPage === 1 ? 'disabled' : ''
  const prevAction = currentPage > 1 ? `onclick="goToPage(${currentPage - 1}, event)"` : ''
  html += `<li class="page-item ${prevDisabled}"><a class="btn btn-primary rounded-pill mx-1 text-white ${prevDisabled}" href="#" ${prevAction}>« Prev</a></li>`

  // 2. Page Range Calculation
  const maxTrail = 2
  let start = Math.max(1, currentPage - maxTrail)
  let end = Math.min(totalPages, currentPage + maxTrail)

  // Ensure 5 buttons are shown if possible
  if (currentPage <= maxTrail) end = Math.min(totalPages, 1 + maxTrail * 2)
  if (currentPage > totalPages - maxTrail) start = Math.max(1, totalPages - maxTrail * 2)

  // First page ellipsis
  if (start > 1) {
    html += `<li class="page-item"><a class="btn btn-primary rounded-pill mx-1 text-white" href="#" onclick="goToPage(1, event)">1</a></li>`
    if (start > 2) html += `<li class="page-item disabled"><span class="btn btn-primary rounded-pill mx-1 text-white bg-transparent border-0 opacity-50">...</span></li>`
  }

  // Numbered pages
  for (let i = start; i <= end; i++) {
    const activeClass = i === currentPage ? 'active' : ''
    html += `<li class="page-item ${activeClass}"><a class="btn btn-primary rounded-pill mx-1 text-white ${activeClass}" href="#" onclick="goToPage(${i}, event)">${i}</a></li>`
  }

  // Last page ellipsis
  if (end < totalPages) {
    if (end < totalPages - 1) html += `<li class="page-item disabled"><span class="btn btn-primary rounded-pill mx-1 text-white bg-transparent border-0 opacity-50">...</span></li>`
    html += `<li class="page-item"><a class="btn btn-primary rounded-pill mx-1 text-white" href="#" onclick="goToPage(${totalPages}, event)">${totalPages}</a></li>`
  }

  // Next button
  const nextDisabled = currentPage === totalPages ? 'disabled' : ''
  const nextAction = currentPage < totalPages ? `onclick="goToPage(${currentPage + 1}, event)"` : ''
  html += `<li class="page-item ${nextDisabled}"><a class="btn btn-primary rounded-pill mx-1 text-white ${nextDisabled}" href="#" ${nextAction}>Next »</a></li>`

  container.innerHTML = html
}

/**
 * Helper to manage UI loading/success/error states
 * @param {'loading' | 'success' | 'error'} state
 */
function setUIState(state) {
  const els = getUIElements()
  const dNone = 'd-none'

  // Reset all
  if (els.loading) els.loading.classList.add(dNone)
  if (els.error) els.error.classList.add(dNone)
  if (els.gridWrapper) els.gridWrapper.classList.add(dNone)
  if (els.paginationWrapper) els.paginationWrapper.classList.add(dNone)

  if (state === 'loading') {
    if (els.loading) els.loading.classList.remove(dNone)
  } else if (state === 'success') {
    if (els.gridWrapper) els.gridWrapper.classList.remove(dNone)
    if (els.paginationWrapper) els.paginationWrapper.classList.remove(dNone)
  } else if (state === 'error') {
    if (els.error) els.error.classList.remove(dNone)
  }
}

/**
 * Utility to grab relevant DOM elements
 */
function getUIElements() {
  return {
    loading: document.getElementById('reviews-loading'),
    error: document.getElementById('reviews-error'),
    grid: document.getElementById('reviews-grid'),
    gridWrapper: document.getElementById('reviews-container-wrapper'),
    paginationWrapper: document.getElementById('reviews-pagination-container'),
  }
}

/**
 * Deterministically generates an avatar color from a character
 * @param {string} char
 */
function getAvatarColor(char) {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ff9800', '#ff5722', '#795548', '#607d8b']
  const index = char.charCodeAt(0) % colors.length
  return colors[index]
}

/**
 * Optimizes image URLs from Google domains by appending/replacing resizing parameters (e.g., =s400).
 * @param {string} url
 * @param {number} size
 * @returns {string}
 */
function optimizeGoogleImageUrl(url, size) {
  if (!url || typeof url !== 'string' || url === 'null') return url

  // Only apply to Google domains that support resizing params
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    const cleanUrl = url.split('=')[0] // Strip any existing params
    return `${cleanUrl}=s${size}-c` // Force requested size + crop for consistency
  }
  return url
}
