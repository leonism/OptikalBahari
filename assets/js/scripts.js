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
})
