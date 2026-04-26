/**
 * Algolia InstantSearch Integration for Optikal Bahari
 * Provides overlay search with filtering, sorting, and responsive design
 *
 * @author Optikal Bahari Development Team
 * @version 1.4.0
 */

/* global algoliasearch, instantsearch */

;(function () {
  'use strict'

  // Logger utility for consistent debugging
  const Logger = {
    /**
     * @param {any} msg
     * @param {...any} args
     */
    log: (msg, ...args) => console.log(`[Algolia] ${msg}`, ...args),
    /**
     * @param {any} msg
     * @param {...any} args
     */
    warn: (msg, ...args) => console.warn(`[Algolia] ⚠️ ${msg}`, ...args),
    /**
     * @param {any} msg
     * @param {...any} args
     */
    error: (msg, ...args) => console.error(`[Algolia] ❌ ${msg}`, ...args),
  }

  /**
   * @typedef {Object} AlgoliaConfig
   * @property {string} appId
   * @property {string} apiKey
   * @property {string} indexName
   * @property {number} hitsPerPage
   */

  /**
   * Retrieve Algolia configuration from window or meta tags
   * @returns {AlgoliaConfig}
   */
  function getAlgoliaConfig() {
    const windowConfig = /** @type {any} */ (window).ALGOLIA_CONFIG
    if (windowConfig) {
      Logger.log('Configuration loaded from window object')
      return windowConfig
    }

    Logger.log('Configuration loaded from meta tags (fallback)')
    const appIdEl = document.querySelector('meta[name="algolia-app-id"]')
    const apiKeyEl = document.querySelector('meta[name="algolia-api-key"]')
    const indexNameEl = document.querySelector('meta[name="algolia-index-name"]')
    const hitsPerPageEl = document.querySelector('meta[name="algolia-hits-per-page"]')

    return {
      appId: appIdEl ? appIdEl.getAttribute('content') || '' : '',
      apiKey: apiKeyEl ? apiKeyEl.getAttribute('content') || '' : '',
      indexName: indexNameEl ? indexNameEl.getAttribute('content') || '' : '',
      hitsPerPage: parseInt((hitsPerPageEl ? hitsPerPageEl.getAttribute('content') : '10') || '10', 10),
    }
  }

  /** @type {AlgoliaConfig} */
  const CONFIG = getAlgoliaConfig()

  /**
   * @typedef {Object} DOMElements
   * @property {HTMLElement|null} overlay
   * @property {HTMLElement|null} trigger
   * @property {HTMLElement|null} closeBtn
   * @property {HTMLElement|null} clearBtn
   * @property {HTMLInputElement|null} searchInput
   * @property {HTMLElement|null} filterToggle
   * @property {HTMLElement|null} filtersContainer
   * @property {HTMLElement|null} hitsContainer
   */

  /** @type {DOMElements} */
  const DOM = {
    overlay: null,
    trigger: null,
    closeBtn: null,
    clearBtn: null,
    searchInput: null,
    filterToggle: null,
    filtersContainer: null,
    hitsContainer: null,
  }

  /** @type {any} */
  let searchClient
  /** @type {any} */
  let search
  let selectedHitIndex = -1

  /**
   * Detect Safari browser
   * @returns {boolean}
   */
  function isSafari() {
    const ua = navigator.userAgent.toLowerCase()
    return ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1
  }

  /**
   * Initialize the search functionality
   */
  function init() {
    Logger.log('Initializing...')

    // Check if Algolia configuration exists
    if (!CONFIG.appId || CONFIG.appId === '') {
      Logger.warn('Configuration missing. Search disabled.')
      return
    }

    // Cache DOM elements
    cacheDOMElements()

    // Verify required DOM elements exist
    if (!DOM.overlay) {
      Logger.error('Search overlay element (#algolia-search-overlay) not found!')
      return
    }
    if (!DOM.trigger) {
      Logger.error('Search trigger element (#algolia-search-trigger) not found!')
      return
    }

    // Initialize Algolia client
    initializeAlgolia()

    // Setup event listeners
    setupEventListeners()

    // Setup keyboard shortcuts
    setupKeyboardShortcuts()

    // Safari-specific adjustments
    if (isSafari()) {
      Logger.log('Safari detected. Applying compatibility fixes.')
      applySafariFixes()
    }

    Logger.log('Initialization complete.')
  }

  /**
   * Cache all DOM elements
   */
  function cacheDOMElements() {
    DOM.overlay = document.getElementById('algolia-search-overlay')
    DOM.trigger = document.getElementById('algolia-search-trigger')
    DOM.closeBtn = document.getElementById('algolia-close-search')
    DOM.clearBtn = document.getElementById('algolia-clear-input')
    DOM.searchInput = /** @type {HTMLInputElement} */ (document.getElementById('algolia-search-input'))
    DOM.filterToggle = document.getElementById('algolia-filter-toggle')
    DOM.filtersContainer = document.getElementById('algolia-filters-container')
    DOM.hitsContainer = document.getElementById('algolia-hits')
  }

  /**
   * Initialize Algolia InstantSearch
   */
  function initializeAlgolia() {
    try {
      const _window = /** @type {any} */ (window)
      if (typeof _window.algoliasearch === 'undefined' || typeof _window.instantsearch === 'undefined') {
        throw new Error('Algolia libraries not loaded. Check script includes.')
      }

      Logger.log('Connecting to Algolia index:', CONFIG.indexName)

      // Create search client
      searchClient = _window.algoliasearch(CONFIG.appId, CONFIG.apiKey)

      // Initialize InstantSearch
      search = _window.instantsearch({
        indexName: CONFIG.indexName,
        searchClient: searchClient,
        routing: false,
        /** @param {any} helper */
        searchFunction(helper) {
          const searchBody = /** @type {HTMLElement | null} */ (document.querySelector('.algolia-search-body'))
          const filtersContainer = /** @type {HTMLElement | null} */ (document.getElementById('algolia-filters-container'))
          const stats = /** @type {HTMLElement | null} */ (document.getElementById('algolia-stats'))
          const pagination = /** @type {HTMLElement | null} */ (document.getElementById('algolia-pagination'))

          if (helper.state.query === '') {
            if (searchBody) searchBody.style.display = 'none'
            if (filtersContainer) filtersContainer.style.display = 'none'
            if (stats) stats.style.display = 'none'
            if (pagination) pagination.style.display = 'none'
            return
          }

          if (searchBody) searchBody.style.display = 'block'
          if (filtersContainer) filtersContainer.style.display = '' // Revert to default
          if (stats) stats.style.display = 'block'
          if (pagination) pagination.style.display = 'block'
          helper.search()
        },
      })

      // Add all widgets
      addSearchWidgets()

      // Start search
      search.start()
      Logger.log('InstantSearch started')
    } catch (error) {
      Logger.error('Failed to initialize Algolia:', error)
    }
  }

  /**
   * Add all InstantSearch widgets
   */
  function addSearchWidgets() {
    if (!search) return

    // Stats Widget
    search.addWidgets([
      /** @type {any} */ (window).instantsearch.widgets.stats({
        container: '#algolia-stats',
        templates: {
          /**
           * @param {any} data
           * @param {any} params
           */
          text(data, { html }) {
            let text = ''
            if (data.hasManyResults) {
              text = `${data.nbHits.toLocaleString('id-ID')} hasil`
            } else if (data.hasOneResult) {
              text = '1 hasil'
            } else {
              text = 'Tidak ada hasil'
            }
            return html`${text} <span class="search-time">(${data.processingTimeMS}ms)</span>`
          },
        },
      }),
    ])

    // Hits Widget (Results)
    search.addWidgets([
      /** @type {any} */ (window).instantsearch.widgets.hits({
        container: '#algolia-hits',
        templates: {
          /**
           * @param {any} hit
           * @param {any} params
           */
          item(hit, { html, components }) {
            // Determine image URL - support multiple common frontmatter fields
            const rawImageUrl = hit.image || hit.header_image || hit.background || hit.thumbnail || hit.preview_image || ''

            // Cloudinary Thumbnail Logic (Ported from _includes/cloudinary/cloudinary-thumbnail-image.html)
            /** @param {string} url */
            const getCloudinaryUrl = (url) => {
              if (!url) return ''
              const cloudName = 'divkqrf7k'
              const customDomain = 'assets.optikalbahari.com'
              const params = 'c_limit,w_400,h_225,q_auto:eco,f_auto,e_sharpen:60'
              let id = url

              // Handle full URLs
              if (id.startsWith('http')) {
                // If it's not our cloud, return original
                if (!id.includes(cloudName) && !id.includes(customDomain)) return id
                // Strip domain and version
                id = id.replace(new RegExp(`^https?://(res\\.cloudinary\\.com/${cloudName}|${customDomain.replace(/\./g, '\\.')})/image/upload/(v\\d+/)?`), '')
              }

              // Common cleanups matching Ruby plugin
              id = id.replace(/^\//, '') // Strip leading slash
              id = id.replace(/^(.*\/)?assets\/img\//, '') // Strip assets/img/
              id = id.replace(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i, '') // Strip extension

              return `https://${customDomain}/image/upload/${params}/${id}`
            }

            const imageUrl = getCloudinaryUrl(rawImageUrl)

            // Determine excerpt/description with broad fallbacks
            const fallbackDescription = hit.description || hit.subtitle || hit.summary || ''

            return html`
              <article class="search-hit" data-hit-url="${hit.url}">
                <a href="${hit.url}" class="hit-link">
                  <div class="hit-image">
                    ${imageUrl
                      ? html`<img
                          src="${imageUrl}"
                          alt="${hit.title || 'Article'}"
                          class="blur-target"
                          loading="lazy"
                          decoding="async"
                          width="400"
                          height="225"
                          style="object-fit: cover; width: 100%; height: 100%; transition: opacity 0.5s ease;"
                        />`
                      : html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:2em;height:2em;opacity:0.3" aria-hidden="true"><path fill="currentColor" d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-128-192zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"/></svg>`}
                  </div>
                  <div class="hit-content">
                    <h3 class="hit-title">
                      ${components.Highlight({ hit, attribute: 'title' })}
                    </h3>
                    <p class="hit-excerpt">
                      ${hit._snippetResult && hit._snippetResult.excerpt 
                        ? components.Snippet({ hit, attribute: 'excerpt' }) 
                        : fallbackDescription}
                    </p>
                  </div>
                </a>
              </article>
            `
          },
          /**
           * @param {any} results
           * @param {any} params
           */
          empty(results, { html }) {
            return html`
              <div class="search-empty-state text-center py-5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:3em;height:3em;display:block;margin:0 auto 1rem;opacity:0.25" aria-hidden="true"><path fill="currentColor" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
                <h3 class="h5">Tidak ada hasil ditemukan</h3>
                <p class="text-muted small">Coba ubah kata kunci pencarian Anda.</p>
              </div>
            `
          },
        },
        cssClasses: {
          list: 'search-hits-list',
          item: 'search-hit-item',
        },
      }),
    ])

    // Reset selection when results change
    search.on('render', () => {
      selectedHitIndex = -1
    })

    // Pagination Widget
    search.addWidgets([
      /** @type {any} */ (window).instantsearch.widgets.pagination({
        container: '#algolia-pagination',
        scrollTo: false,
        padding: 1,
        templates: {
          previous: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" style="width:0.625em;height:1em;fill:currentColor" aria-hidden="true"><path fill="currentColor" d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg>',
          next: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" style="width:0.625em;height:1em;fill:currentColor" aria-hidden="true"><path fill="currentColor" d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"/></svg>',
        },
      }),
    ])

    // Category Facet Widget
    search.addWidgets([
      /** @type {any} */ (window).instantsearch.widgets.refinementList({
        container: '#algolia-categories-filter',
        attribute: 'categories',
        limit: 5,
        showMore: true,
        templates: {
          /** @param {any} html */
          header: (html) => html`<h4 class="facet-header">Kategori</h4>`,
        },
        cssClasses: {
          root: 'facet-widget',
          list: 'facet-list list-unstyled',
          item: 'facet-item mb-1',
          label: 'facet-label d-flex align-items-center cursor-pointer',
          checkbox: 'facet-checkbox form-check-input me-2',
          count: 'facet-count badge rounded-pill bg-light text-dark ms-auto',
          showMore: 'facet-show-more btn btn-sm btn-link p-0 mt-2 text-decoration-none',
        },
      }),
    ])

    // Tags Facet Widget
    search.addWidgets([
      /** @type {any} */ (window).instantsearch.widgets.refinementList({
        container: '#algolia-tags-filter',
        attribute: 'tags',
        limit: 5,
        showMore: true,
        templates: {
          /** @param {any} html */
          header: (html) => html`<h4 class="facet-header">Tag</h4>`,
        },
        cssClasses: {
          root: 'facet-widget',
          list: 'facet-list list-unstyled',
          item: 'facet-item mb-1',
          label: 'facet-label d-flex align-items-center cursor-pointer',
          checkbox: 'facet-checkbox form-check-input me-2',
          count: 'facet-count badge rounded-pill bg-light text-dark ms-auto',
          showMore: 'facet-show-more btn btn-sm btn-link p-0 mt-2 text-decoration-none',
        },
      }),
    ])

    // Sort By Widget
    search.addWidgets([
      /** @type {any} */ (window).instantsearch.widgets.sortBy({
        container: '#algolia-sort-select',
        items: [
          { label: 'Paling Relevan', value: CONFIG.indexName },
          { label: 'Terbaru', value: `${CONFIG.indexName}_date_desc` },
          { label: 'Terlama', value: `${CONFIG.indexName}_date_asc` },
        ],
        cssClasses: {
          root: 'sort-select',
          select: 'form-select form-select-sm',
        },
      }),
    ])

    // Configure search box behavior
    search.addWidgets([
      /** @type {any} */ (window).instantsearch.widgets.configure({
        hitsPerPage: CONFIG.hitsPerPage,
        attributesToSnippet: ['excerpt:30'],
        snippetEllipsisText: '...',
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      }),
    ])
  }

  /**
   * Setup event listeners with robust error handling
   */
  function setupEventListeners() {
    // Open search overlay
    if (DOM.trigger) {
      /** @param {Event} e */
      const openHandler = (e) => {
        Logger.log('Search trigger activated', e.type)
        if (e.cancelable) e.preventDefault()
        openSearchOverlay()
      }

      DOM.trigger.addEventListener('click', openHandler)
      // Redundant event for Safari/Mobile
      DOM.trigger.addEventListener('touchstart', openHandler, { passive: false })
    }

    // Close search overlay
    if (DOM.closeBtn) {
      /** @param {Event} e */
      const closeHandler = (e) => {
        if (e.cancelable) e.preventDefault()
        closeSearchOverlay()
      }
      DOM.closeBtn.addEventListener('click', closeHandler)
      DOM.closeBtn.addEventListener('touchstart', closeHandler, { passive: false })
    }

    // Close on backdrop click
    if (DOM.overlay) {
      DOM.overlay.addEventListener('click', (e) => {
        if (e.target === DOM.overlay) {
          closeSearchOverlay()
        }
      })
    }

    // Clear search input
    if (DOM.clearBtn) {
      DOM.clearBtn.addEventListener('click', clearSearch)
    }

    // Filter toggle logic
    if (DOM.filterToggle && DOM.filtersContainer) {
      DOM.filterToggle.addEventListener('click', () => {
        if (DOM.filterToggle && DOM.filtersContainer) {
          const isActive = DOM.filterToggle.classList.toggle('active')
          DOM.filtersContainer.classList.toggle('active', isActive)
        }
      })
    }

    // Auto-show/hide clear button based on input
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', (e) => {
        const target = /** @type {HTMLInputElement} */ (e.target)
        if (DOM.clearBtn) {
          DOM.clearBtn.style.display = target.value ? 'block' : 'none'
        }
      })

      // Connect search input to InstantSearch
      DOM.searchInput.addEventListener('input', (e) => {
        const target = /** @type {HTMLInputElement} */ (e.target)
        if (search) {
          search.helper.setQuery(target.value).search()
        }
      })

      // Keyboard navigation for results
      DOM.searchInput.addEventListener('keydown', (e) => {
        const hits = document.querySelectorAll('.search-hit-item')
        if (hits.length === 0) return

        if (e.key === 'ArrowDown') {
          e.preventDefault()
          updateSelectedHit(Math.min(selectedHitIndex + 1, hits.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          updateSelectedHit(Math.max(selectedHitIndex - 1, 0))
        } else if (e.key === 'Enter' && selectedHitIndex >= 0) {
          e.preventDefault()
          const activeHit = /** @type {HTMLElement} */ (hits[selectedHitIndex].querySelector('.hit-link'))
          if (activeHit) activeHit.click()
        }
      })
    }
  }

  /**
   * Apply specific fixes for Safari
   */
  function applySafariFixes() {
    // 1. Force cursor pointer on trigger to ensure tap highlight works
    if (DOM.trigger) {
      DOM.trigger.style.cursor = 'pointer'
    }

    // 2. Add empty onclick to body to enable delegation if needed
    document.body.setAttribute('onclick', 'void(0)')
  }

  /**
   * Update the visual selection of a hit
   * @param {number} index
   */
  function updateSelectedHit(index) {
    const hits = document.querySelectorAll('.search-hit-item')
    hits.forEach((hit, i) => {
      if (i === index) {
        hit.classList.add('selected')
        hit.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      } else {
        hit.classList.remove('selected')
      }
    })
    selectedHitIndex = index
  }

  /**
   * Setup keyboard shortcuts
   */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K to toggle search
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        if (isSearchOpen()) {
          closeSearchOverlay()
        } else {
          openSearchOverlay()
        }
      }

      // ESC to close search
      if (e.key === 'Escape' && isSearchOpen()) {
        closeSearchOverlay()
      }
    })
  }

  /**
   * Open search overlay
   */
  function openSearchOverlay() {
    Logger.log('Opening search overlay')
    if (!DOM.overlay) return

    DOM.overlay.classList.add('active')
    DOM.overlay.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
    selectedHitIndex = -1

    // Focus on search input after animation
    setTimeout(() => {
      if (DOM.searchInput) {
        DOM.searchInput.focus()
      }
    }, 100)
  }

  /**
   * Close search overlay
   */
  function closeSearchOverlay() {
    Logger.log('Closing search overlay')
    if (!DOM.overlay) return

    DOM.overlay.classList.remove('active')
    DOM.overlay.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
  }

  /**
   * Clear search
   */
  function clearSearch() {
    if (search) {
      search.helper.setQuery('').search()
    }
    if (DOM.searchInput) {
      DOM.searchInput.value = ''
      DOM.searchInput.focus()
    }
    if (DOM.clearBtn) {
      DOM.clearBtn.style.display = 'none'
    }
  }

  /**
   * Check if search overlay is open
   * @returns {boolean | null}
   */
  function isSearchOpen() {
    return DOM.overlay && DOM.overlay.classList.contains('active')
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
