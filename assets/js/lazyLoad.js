// Get all image elements with the class "lazy-load"
var images = document.querySelectorAll('img.lazy-load')

// Loop through each image element
images.forEach(function (image) {
    // Set the loading attribute to "lazy"
    image.setAttribute('loading', 'lazy')
})
