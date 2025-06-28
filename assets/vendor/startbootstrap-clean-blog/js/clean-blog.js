;(function (a) {
  'use strict'
  a('body')
    .on('input propertychange', '.floating-label-form-group', function (b) {
      a(this).toggleClass('floating-label-form-group-with-value', !!a(b.target).val())
    })
    .on('focus', '.floating-label-form-group', function () {
      a(this).addClass('floating-label-form-group-with-focus')
    })
    .on('blur', '.floating-label-form-group', function () {
      a(this).removeClass('floating-label-form-group-with-focus')
    })
  let b = a('#mainNav').height()
  ;(a(window).on('scroll', { previousTop: 0 }, function () {
    let c = a(window).scrollTop()
    ;(c < this.previousTop
      ? 0 < c && a('#mainNav').hasClass('is-fixed')
        ? a('#mainNav').addClass('is-visible')
        : a('#mainNav').removeClass('is-visible is-fixed')
      : (a('#mainNav').removeClass('is-visible'),
        c > b && !a('#mainNav').hasClass('is-fixed') && a('#mainNav').addClass('is-fixed')),
      (this.previousTop = c))
  }),
    a(document).ready(function () {
      a(document).click(function (b) {
        let c = a('.navbar-toggler'),
          d = a('.navbar-collapse'),
          e = a('#search-google')
        c.is(b.target) ||
          d.is(b.target) ||
          0 !== d.has(b.target).length ||
          e.is(b.target) ||
          0 !== e.has(b.target).length ||
          !d.hasClass('show') ||
          c.click()
      })
      const b = localStorage.getItem('theme')
      ;('dark' === b && (a('body').addClass('dark-mode'), a('#themeToggle').prop('checked', !0)),
        a('#themeToggle').on('change', function () {
          ;(a('body').toggleClass('dark-mode'),
            localStorage.setItem('theme', a(this).is(':checked') ? 'dark' : 'light'))
        }))
    }))
})(jQuery)
