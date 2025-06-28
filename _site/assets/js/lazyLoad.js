// Function to initialize lazy loading for all <img> tags
function initializeLazyLoading() {
  // Get all image elements on the page
  var images = document.querySelectorAll('img.lazy-loading')

  // Check if the browser supports the 'loading' attribute
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading is supported
    images.forEach(function (image) {
      image.setAttribute('loading', 'lazy')
    })
  } else {
    // Fallback for browsers that do not support native lazy loading
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target

          // Restore the original src from the data-src attribute
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src') // Clean up
          }

          // Restore the srcset from the data-srcset attribute
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset
            img.removeAttribute('data-srcset') // Clean up
          }

          img.classList.remove('lazy-loading') // Remove the lazy-loading class
          img.classList.add('loaded') // Add the loaded class
          observer.unobserve(img) // Stop observing this image
        }
      })
    })

    // Observe each image
    images.forEach((image) => {
      // Store the original src in a data-src attribute
      if (image.src && !image.dataset.src) {
        image.dataset.src = image.src // Save the original src
        image.src =
          'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' // Placeholder
      }

      // Store the original srcset in a data-srcset attribute
      if (image.srcset && !image.dataset.srcset) {
        image.dataset.srcset = image.srcset // Save the original srcset
        image.srcset = '' // Clear the srcset
      }

      observer.observe(image)
    })
  }
}

// Initialize lazy loading on page load
document.addEventListener('DOMContentLoaded', initializeLazyLoading)

// Reinitialize lazy loading for dynamically added content
const mutationObserver = new MutationObserver((mutationsList) => {
  mutationsList.forEach((mutation) => {
    if (mutation.type === 'childList') {
      initializeLazyLoading()
    }
  })
})

mutationObserver.observe(document.body, { childList: true, subtree: true })
