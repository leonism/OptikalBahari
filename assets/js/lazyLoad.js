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
          const dataSrc = img.getAttribute('data-src')
          if (dataSrc) {
            img.setAttribute('src', dataSrc)
            img.removeAttribute('data-src') // Clean up
          }

          // Restore the srcset from the data-srcset attribute
          const dataSrcset = img.getAttribute('data-srcset')
          if (dataSrcset) {
            img.setAttribute('srcset', dataSrcset)
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
      // Store the original src in a data-src attribute if not already done
      const currentSrc = image.getAttribute('src')
      const dataSrc = image.getAttribute('data-src')
      const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

      if (currentSrc && !dataSrc && currentSrc !== placeholder) {
        image.setAttribute('data-src', currentSrc) // Save the original src
        image.setAttribute('src', placeholder) // Placeholder
      }

      // Store the original srcset in a data-srcset attribute if not already done
      const currentSrcset = image.getAttribute('srcset')
      const dataSrcset = image.getAttribute('data-srcset')
      if (currentSrcset && !dataSrcset) {
        image.setAttribute('data-srcset', currentSrcset) // Save the original srcset
        image.setAttribute('srcset', '') // Clear the srcset
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
