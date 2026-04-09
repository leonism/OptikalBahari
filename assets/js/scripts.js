/* global bootstrap */

document.addEventListener('DOMContentLoaded', function () {
  // Initialize Bootstrap tooltips
  /** @type {HTMLElement[]} */
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))

  // @ts-ignore
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    // @ts-ignore
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })

  // Load images as you scroll (Intersection Observer)
  var observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
  }

  var imageObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var img = entry.target
        // Added a slight delay for a smoother premium feel
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

  // --- Site-Wide Skeleton Cleanup ---
  // We want to clear skeletons as soon as the page is "visually ready"
  // Primary: window.load (all assets)
  // Fallback: 2 seconds (safe window for structural paint)
  var skeletonsCleared = false
  var clearSkeletons = function () {
    if (skeletonsCleared) return
    skeletonsCleared = true

    // Give a tiny moment for the shimmer to feel intentional
    setTimeout(function () {
      const selectors = '.loading-skeleton, .review-skeleton, .masthead.loading-skeleton'
      document.querySelectorAll(selectors).forEach(function (el) {
        el.classList.remove('loading-skeleton', 'review-skeleton')
        // Special case for masthead
        if (el.id === 'masthead-hdr') el.classList.add('is-loaded')
      })
    }, 400)
  }

  // Bind to both for maximum reliability
  window.addEventListener('load', clearSkeletons)
  setTimeout(clearSkeletons, 2000) // Much faster fallback for mobile visibility
})
