document.addEventListener('DOMContentLoaded', () => {
  const images = [
    {
      path: '/assets/img/splash-screen/bg-splash-post-00.webp',
      sizes: [480, 640, 1024, 1920],
    },
    {
      path: '/assets/img/splash-screen/bg-splash-post-01.webp',
      sizes: [480, 640, 1024, 1920],
    },
    {
      path: '/assets/img/splash-screen/bg-splash-post-02.webp',
      sizes: [480, 640, 1024, 1920],
    },
    {
      path: '/assets/img/splash-screen/bg-splash-post-03.webp',
      sizes: [480, 640, 1024, 1920],
    },
    {
      path: '/assets/img/splash-screen/bg-splash-post-04.webp',
      sizes: [480, 640, 1024, 1920],
    },
    {
      path: '/assets/img/splash-screen/bg-splash-post-05.webp',
      sizes: [480, 640, 1024, 1920],
    },
    {
      path: '/assets/img/splash-screen/bg-splash-post-06.webp',
      sizes: [480, 640, 1024, 1920],
    },
    // Add more image objects here if needed
  ]

  // Generate a random index each time the page is loaded
  var randomIndex = Math.floor(Math.random() * images.length)
  var randomImage = images[randomIndex]

  // Choose the appropriate image size based on screen width
  var screenWidth = window.innerWidth
  var imageSize
  if (screenWidth < 640) {
    imageSize = randomImage.sizes[0]
  } else if (screenWidth < 1024) {
    imageSize = randomImage.sizes[1]
  } else if (screenWidth < 1920) {
    imageSize = randomImage.sizes[2]
  } else {
    imageSize = randomImage.sizes[3]
  }

  // Construct the image URL with the selected size and cache-busting parameter
  var timestamp = new Date().getTime()
  var imageUrl = randomImage.path + '?w=' + imageSize + '&cache=' + timestamp

  // Set the background-image dynamically
  var masthead = document.querySelector('.masthead')
  masthead.style.backgroundImage = 'url(' + imageUrl + ')'
})
