$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

/*!
 * Start Bootstrap - Clean Blog v5.0.8 (https://startbootstrap.com/template-overviews/clean-blog)
 * Copyright 2013-2019 Start Bootstrap
 * Licensed under MIT (https://github.com/BlackrockDigital/startbootstrap-clean-blog/blob/master/LICENSE)
 */

!(function (o) {
    'use strict'
    o('body')
        .on('input propertychange', '.floating-label-form-group', function (i) {
            o(this).toggleClass(
                'floating-label-form-group-with-value',
                !!o(i.target).val()
            )
        })
        .on('focus', '.floating-label-form-group', function () {
            o(this).addClass('floating-label-form-group-with-focus')
        })
        .on('blur', '.floating-label-form-group', function () {
            o(this).removeClass('floating-label-form-group-with-focus')
        })
    if (992 < o(window).width()) {
        var s = o('#mainNav').height()
        o(window).on('scroll', { previousTop: 0 }, function () {
            var i = o(window).scrollTop()
            i < this.previousTop
                ? 0 < i && o('#mainNav').hasClass('is-fixed')
                    ? o('#mainNav').addClass('is-visible')
                    : o('#mainNav').removeClass('is-visible is-fixed')
                : i > this.previousTop &&
                  (o('#mainNav').removeClass('is-visible'),
                  s < i &&
                      !o('#mainNav').hasClass('is-fixed') &&
                      o('#mainNav').addClass('is-fixed')),
                (this.previousTop = i)
        })
    }
})(jQuery)

document.addEventListener('DOMContentLoaded', () => {
    const images = [
        {
            // path: '/assets/img/splash-screen/bg-splash-post-00.webp',
            path: "{{"/assets/img/splash-screen/bg-splash-post-00.webp" | prepend: site.baseurl }}",
            sizes: [480, 640, 1024, 1920],
        },
        {
            // path: '/assets/img/splash-screen/bg-splash-post-01.webp',
            path: "{{"/assets/img/splash-screen/bg-splash-post-01.webp" | prepend: site.baseurl }}",
            sizes: [480, 640, 1024, 1920],
        },
        {
            // path: '/assets/img/splash-screen/bg-splash-post-02.webp',
            path: "{{"/assets/img/splash-screen/bg-splash-post-02.webp" | prepend: site.baseurl }}",
            sizes: [480, 640, 1024, 1920],
        },
        {
            // path: '/assets/img/splash-screen/bg-splash-post-03.webp',
            path: "{{"/assets/img/splash-screen/bg-splash-post-03.webp" | prepend: site.baseurl }}",
            sizes: [480, 640, 1024, 1920],
        },
        {
            // path: '/assets/img/splash-screen/bg-splash-post-04.webp',
            path: "{{"/assets/img/splash-screen/bg-splash-post-04.webp" | prepend: site.baseurl }}",
            sizes: [480, 640, 1024, 1920],
        },
        {
            // path: '/assets/img/splash-screen/bg-splash-post-05.webp',
            path: "{{"/assets/img/splash-screen/bg-splash-post-05.webp" | relative_url }}",
            sizes: [480, 640, 1024, 1920],
        },
        {
            // path: '/assets/img/splash-screen/bg-splash-post-06.webp',
            path: "{{"/assets/img/splash-screen/bg-splash-post-06.webp" | relative_url }}",
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
