/* global bootstrap */

document.addEventListener('DOMContentLoaded', function () {
  // Initialize Bootstrap tooltips
  var tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    // @ts-ignore
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
})

// Load images as you scroll (fade-in)
document.addEventListener('DOMContentLoaded', function () {
  const faders = document.querySelectorAll('.fade-in-on-scroll')
  const appearOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  }

  const appearOnScroll = new IntersectionObserver(function (entries, observer) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return

      entry.target.classList.add('is-visible')
      observer.unobserve(entry.target)
    })
  }, appearOptions)

  faders.forEach((fader) => {
    appearOnScroll.observe(fader)
  })
})
