/* global bootstrap */

document.addEventListener('DOMContentLoaded', function () {
  // --- 1. Site-Wide Skeleton Cleanup (PRIORITY #1) ---
  // We want to clear skeletons as soon as the page is "visually ready"
  // Primary: window.load (all assets)
  // Fallback: 2 seconds (safe window for structural paint)
  var skeletonsCleared = false
  var clearSkeletons = function () {
    if (skeletonsCleared) return
    skeletonsCleared = true

    // Give a tiny moment for the shimmer to feel intentional
    setTimeout(function () {
      var selectors = '.loading-skeleton, .review-skeleton, .masthead.loading-skeleton'
      document.querySelectorAll(selectors).forEach(function (el) {
        el.classList.remove('loading-skeleton', 'review-skeleton')
        // Special case for masthead
        if (el.id === 'masthead-hdr') el.classList.add('is-loaded')
      })
    }, 400)
  }

  // Bind to both for maximum reliability
  window.addEventListener('load', clearSkeletons)
  setTimeout(clearSkeletons, 1800) // Slightly faster fallback for mobile visibility

  // --- 2. Initialize Bootstrap tooltips ---
  try {
    /** @type {HTMLElement[]} */
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    
    // @ts-ignore
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        // @ts-ignore
        return new bootstrap.Tooltip(tooltipTriggerEl)
      })
    }
  } catch (e) {
    console.warn('Tooltip initialization failed', e)
  }

  // --- 3. Intersection Observer (Lazy Loading Elements) ---
  if ('IntersectionObserver' in window) {
    var observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    }

    var imageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target
          setTimeout(function () {
            img.classList.remove('loading')
            img.classList.add('loaded')
          }, 150)
          observer.unobserve(img)
        }
      })
    }, observerOptions)

    document.querySelectorAll('.blur-target').forEach(function (img) {
      imageObserver.observe(img)
    })
  } else {
    // Fallback for older browsers
    document.querySelectorAll('.blur-target').forEach(function (img) {
      img.classList.remove('loading')
      img.classList.add('loaded')
    })
  }
})
