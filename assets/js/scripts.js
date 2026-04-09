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

  // Global Skeleton Cleanup
  // Removes loading-skeleton from any element once the window is fully loaded
  window.addEventListener('load', function () {
    setTimeout(function () {
      document.querySelectorAll('.loading-skeleton, .review-skeleton').forEach(function (el) {
        el.classList.remove('loading-skeleton', 'review-skeleton')
      })
    }, 500) // Small delay to let the shimmer be seen and then fade out
  })
})
