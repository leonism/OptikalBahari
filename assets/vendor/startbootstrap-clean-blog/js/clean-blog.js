(function () {
  'use strict'

  document.addEventListener('DOMContentLoaded', function () {
    const mainNav = document.querySelector('#mainNav')
    if (!mainNav) return

    // Floating label form group handling
    document.body.addEventListener('input', function (e) {
      const target = e.target
      if (target instanceof HTMLElement && target.closest('.floating-label-form-group')) {
        const group = target.closest('.floating-label-form-group')
        if (group && target instanceof HTMLInputElement && target.value.length > 0) {
          group.classList.add('floating-label-form-group-with-value')
        } else if (group) {
          group.classList.remove('floating-label-form-group-with-value')
        }
      }
    })

    document.body.addEventListener('focusin', function (e) {
      const target = e.target
      if (target instanceof HTMLElement && target.closest('.floating-label-form-group')) {
        const group = target.closest('.floating-label-form-group')
        if (group) group.classList.add('floating-label-form-group-with-focus')
      }
    })

    document.body.addEventListener('focusout', function (e) {
      const target = e.target
      if (target instanceof HTMLElement && target.closest('.floating-label-form-group')) {
        const group = target.closest('.floating-label-form-group')
        if (group) group.classList.remove('floating-label-form-group-with-focus')
      }
    })

    // Navigation scroll handling
    let previousTop = 0
    const navHeight = (mainNav instanceof HTMLElement) ? mainNav.offsetHeight : 0

    window.addEventListener('scroll', function () {
      const currentTop = window.scrollY

      if (currentTop < previousTop) {
        // Scrolling Up
        if (currentTop > 0 && mainNav.classList.contains('is-fixed')) {
          mainNav.classList.add('is-visible')
        } else {
          mainNav.classList.remove('is-visible', 'is-fixed')
        }
      } else {
        // Scrolling Down
        mainNav.classList.remove('is-visible')
        if (currentTop > navHeight && !mainNav.classList.contains('is-fixed')) {
          mainNav.classList.add('is-fixed')
        }
      }
      previousTop = currentTop
    })

    // Click outside to close navbar
    document.addEventListener('click', function (e) {
      const toggler = document.querySelector('.navbar-toggler')
      const collapse = document.querySelector('.navbar-collapse')
      const search = document.querySelector('#search-google')

      if (!(toggler instanceof HTMLElement) || !(collapse instanceof HTMLElement)) return

      const target = e.target
      if (!(target instanceof Node)) return

      const isClickInsideToggler = toggler.contains(target)
      const isClickInsideCollapse = collapse.contains(target)
      const isClickInsideSearch = search && (search.contains(target) || search === target)

      if (!isClickInsideToggler && !isClickInsideCollapse && !isClickInsideSearch && collapse.classList.contains('show')) {
        // Simulate a click on the toggler to close it using Bootstrap's native behavior
        // Or directly use Bootstrap's collapse API if available, but clicking the toggler is safer for compatibility
        toggler.click()
      }
    })

    // Theme toggle handling
    /** @type {HTMLInputElement | null} */
    const themeToggle = document.querySelector('#themeToggle')
    const currentTheme = localStorage.getItem('theme')

    if (currentTheme === 'dark') {
      document.body.classList.add('dark-mode')
      // Also set the attribute for bootstrap or other CSS that might use it
      document.documentElement.setAttribute('data-bs-theme', 'dark')
      if (themeToggle) themeToggle.checked = true
    }

    if (themeToggle) {
      themeToggle.addEventListener('change', function () {
        if (themeToggle.checked) {
          document.body.classList.add('dark-mode')
          document.documentElement.setAttribute('data-bs-theme', 'dark')
          localStorage.setItem('theme', 'dark')
        } else {
          document.body.classList.remove('dark-mode')
          document.documentElement.removeAttribute('data-bs-theme')
          localStorage.setItem('theme', 'light')
        }
      })
    }
  })
})()
