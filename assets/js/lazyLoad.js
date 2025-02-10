// Function to initialize lazy loading for all <img> tags
function initializeLazyLoading() {
    // Get all image elements on the page
    var images = document.querySelectorAll('img')

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
                    if (img.dataset.originalSrc) {
                        img.src = img.dataset.originalSrc
                        img.removeAttribute('data-original-src') // Clean up
                    }

                    img.classList.remove('lazy-loading') // Remove the lazy-loading class
                    observer.unobserve(img) // Stop observing this image
                }
            })
        })

        // Observe each image
        images.forEach((image) => {
            // Store the original src in a data-original-src attribute
            if (image.src && !image.dataset.originalSrc) {
                image.dataset.originalSrc = image.src // Save the original src
                image.src =
                    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' // Placeholder
            }
            observer.observe(image)
        })
    }
}

// Initialize lazy loading on page load
document.addEventListener('DOMContentLoaded', initializeLazyLoading)

// Reinitialize lazy loading for dynamically added content
document.addEventListener('DOMNodeInserted', () => {
    initializeLazyLoading()
})
