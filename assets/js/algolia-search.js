/**
 * Algolia InstantSearch Integration for Optikal Bahari
 * Provides overlay search with filtering, sorting, and responsive design
 *
 * @author Optikal Bahari Development Team
 * @version 1.3.1
 */

/* global algoliasearch, instantsearch */

;(function () {
  'use strict'

  /**
   * @typedef {Object} AlgoliaConfig
   * @property {string} appId
   * @property {string} apiKey
   * @property {string} indexName
   * @property {number} hitsPerPage
   */

  /** @type {AlgoliaConfig} */
  const CONFIG = /** @type {any} */ (window).ALGOLIA_CONFIG || {
    appId: '',
    apiKey: '',
    indexName: '',
    hitsPerPage: 10,
  }

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
   * Initialize the search functionality
   */
  function init() {
    // Check if Algolia configuration exists
    if (!CONFIG.appId || CONFIG.appId === '') {
      console.warn('Algolia configuration not found. Search disabled.')
      return
    }

    // Cache DOM elements
    cacheDOMElements()

    // Verify required DOM elements exist
    if (!DOM.overlay || !DOM.trigger) {
      console.warn('Required DOM elements not found. Search disabled.')
      return
    }

    // Initialize Algolia client
    initializeAlgolia()

    // Setup event listeners
    setupEventListeners()

    // Setup keyboard shortcuts
    setupKeyboardShortcuts()

    console.log('\u2705 Algolia search initialized successfully (v1.3.1)')
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
        throw new Error('Algolia libraries not loaded')
      }

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
    } catch (error) {
      console.error('Failed to initialize Algolia:', error)
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

            // Cloudinary Thumbnail Logic (Ported from _includes/cloudinary/thumbnail_image.html)
            const getCloudinaryUrl = (url) => {
              if (!url) return ''
              const cloudName = 'divkqrf7k'
              const params = 'c_limit,w_400,h_225,q_auto:eco,f_auto,e_sharpen:60'
              let id = url

              // Handle full URLs
              if (id.startsWith('http')) {
                // If it's not our cloud, return original
                if (!id.includes(cloudName)) return id
                // Strip domain and version
                id = id.replace(new RegExp(`^https?://res\\.cloudinary\\.com/${cloudName}/image/upload/(v\\d+/)?`), '')
              }

              // Common cleanups matching Ruby plugin
              id = id.replace(/^\//, '') // Strip leading slash
              id = id.replace(/^(.*\/)?assets\/img\//, '') // Strip assets/img/
              id = id.replace(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i, '') // Strip extension

              return `https://res.cloudinary.com/${cloudName}/image/upload/${params}/${id}`
            }

            const imageUrl = getCloudinaryUrl(rawImageUrl)

            // Determine excerpt/description with broad fallbacks
            const excerpt = components.Snippet({ hit, attribute: 'excerpt' })
            const content = components.Snippet({ hit, attribute: 'content' })
            const fallbackDescription = hit.description || hit.subtitle || hit.summary || ''

            return html`
              <article class="search-hit" data-hit-url="${hit.url}">
                <a href="${hit.url}" class="hit-link">
                  <div class="hit-image">
                    ${imageUrl
                      ? html`<img
                          src="${imageUrl}"
                          alt="${hit.title || 'Article'}"
                          loading="lazy"
                          decoding="async"
                          width="400"
                          height="225"
                          style="object-fit: cover; width: 100%; height: 100%;"
                          onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20viewBox%3D%220%200%2080%2080%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Cpath%20d%3D%22M40%2030v20M30%2040h20%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E'"
                        />`
                      : html`<i class="fas fa-image"></i>`}
                  </div>
                  <div class="hit-content">
                    <h3 class="hit-title">${components.Highlight({ hit, attribute: 'title' })}</h3>
                    <p class="hit-excerpt">${hit._snippetResult && hit._snippetResult.excerpt && hit._snippetResult.excerpt.value ? excerpt : hit._snippetResult && hit._snippetResult.content && hit._snippetResult.content.value ? content : fallbackDescription}</p>
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
                <i class="fas fa-search fa-3x mb-3 opacity-25"></i>
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
          previous: '<i class="fas fa-chevron-left" aria-hidden="true"></i>',
          next: '<i class="fas fa-chevron-right" aria-hidden="true"></i>',
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
   * Setup event listeners
   */
  function setupEventListeners() {
    // Open search overlay
    if (DOM.trigger) {
      DOM.trigger.addEventListener('click', openSearchOverlay)
    }

    // Close search overlay
    if (DOM.closeBtn) {
      DOM.closeBtn.addEventListener('click', closeSearchOverlay)
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
