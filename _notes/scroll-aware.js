/*!
 * Start Bootstrap - Clean Blog v5.0.8 (https://startbootstrap.com/template-overviews/clean-blog)
 * Copyright 2013-2019 Start Bootstrap
 * Licensed under MIT (https://github.com/BlackrockDigital/startbootstrap-clean-blog/blob/master/LICENSE)
 */

!(function (o) {
    'use strict'

    // Attach event listeners to the body element for input, focus, and blur events on elements with the class .floating-label-form-group
    o('body')
        .on('input propertychange', '.floating-label-form-group', function (i) {
            // Toggle the class 'floating-label-form-group-with-value' based on whether the input field has a value
            o(this).toggleClass('floating-label-form-group-with-value', !!o(i.target).val())
        })
        .on('focus', '.floating-label-form-group', function () {
            // Add the class 'floating-label-form-group-with-focus' when the element gains focus
            o(this).addClass('floating-label-form-group-with-focus')
        })
        .on('blur', '.floating-label-form-group', function () {
            // Remove the class 'floating-label-form-group-with-focus' when the element loses focus
            o(this).removeClass('floating-label-form-group-with-focus')
        })

    // Check if the window width is greater than 992 pixels (typically for larger screens like desktops)
    if (992 < o(window).width()) {
        // Store the height of the navigation bar in the variable 's'
        var s = o('#mainNav').height()

        // Attach a scroll event listener to the window
        o(window).on('scroll', { previousTop: 0 }, function () {
            // Get the current scroll position
            var i = o(window).scrollTop()

            // If the user scrolls up and the scroll position is greater than zero
            if (i < this.previousTop) {
                if (0 < i && o('#mainNav').hasClass('is-fixed')) {
                    // Add the class 'is-visible' to make the navigation bar visible
                    o('#mainNav').addClass('is-visible')
                } else {
                    // Remove the classes 'is-visible' and 'is-fixed' from the navigation bar
                    o('#mainNav').removeClass('is-visible is-fixed')
                }
            } else {
                // If the user scrolls down
                o('#mainNav').removeClass('is-visible')
                if (s < i && !o('#mainNav').hasClass('is-fixed')) {
                    // Add the class 'is-fixed' to keep the navigation bar fixed at the top of the screen
                    o('#mainNav').addClass('is-fixed')
                }
            }

            // Update the previous scroll position
            this.previousTop = i
        })
    }
})(jQuery)
