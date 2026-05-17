/* global bootstrap */

document.addEventListener('DOMContentLoaded', function () {
  // --- 1. Site-Wide Skeleton Cleanup (PRIORITY #1) ---
  // We want to clear skeletons as soon as the page is "visually ready"
  // Primary: window.load (all assets)
  // Fallback: 2 seconds (safe window for structural paint)
  var skeletonsCleared = false
  var clearSkeletons = function () {
    if (skeletonsCleared) return
    skeletonsCleared = true

    // Give a tiny moment for the shimmer to feel intentional
    setTimeout(function () {
      var selectors = '.loading-skeleton, .review-skeleton, .masthead.loading-skeleton'
      document.querySelectorAll(selectors).forEach(function (el) {
        el.classList.remove('loading-skeleton', 'review-skeleton')
        // Special case for masthead
        if (el.id === 'masthead-hdr') el.classList.add('is-loaded')
      })
    }, 400)
  }

  // Bind to both for maximum reliability
  window.addEventListener('load', clearSkeletons)
  setTimeout(clearSkeletons, 1800) // Slightly faster fallback for mobile visibility

  // --- 2. Initialize Bootstrap tooltips ---
  try {
    /** @type {HTMLElement[]} */
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    
    // @ts-ignore
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        // @ts-ignore
        return new bootstrap.Tooltip(tooltipTriggerEl)
      })
    }
  } catch (e) {
    console.warn('Tooltip initialization failed', e)
  }

  // --- 3. Intersection Observer (Lazy Loading Elements) ---
  if ('IntersectionObserver' in window) {
    var observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    }

    var imageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target
          setTimeout(function () {
            img.classList.remove('loading')
            img.classList.add('loaded')
          }, 150)
          observer.unobserve(img)
        }
      })
    }, observerOptions)

    document.querySelectorAll('.blur-target').forEach(function (img) {
      imageObserver.observe(img)
    })
  } else {
    // Fallback for older browsers
    document.querySelectorAll('.blur-target').forEach(function (img) {
      img.classList.remove('loading')
      img.classList.add('loaded')
    })
  }

  // --- 4. WebMCP Integration ---
  if (typeof navigator !== 'undefined' && navigator.modelContext && typeof navigator.modelContext.registerTool === 'function') {
    try {
      var webmcpAbortController = new AbortController();
      
      // Register a tool to fetch page content in Markdown format
      navigator.modelContext.registerTool({
        name: 'get_page_markdown',
        description: 'Fetch the raw markdown content of any page or post on Optikal Bahari by path.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path of the page or post to fetch (e.g., "/", "/about/").'
            }
          },
          required: ['path']
        },
        execute: async function(params) {
          try {
            var path = params.path || '/';
            // We implemented markdown negotiation in Cloudflare middleware
            var res = await fetch(path, { headers: { 'Accept': 'text/markdown' } });
            if (!res.ok) {
              return 'Error: Failed to fetch ' + path + ' (Status: ' + res.status + ')';
            }
            var text = await res.text();
            return text;
          } catch (e) {
            return 'Error: ' + e.toString();
          }
        }
      }, { signal: webmcpAbortController.signal });

    } catch (e) {
      console.warn('WebMCP initialization failed', e);
    }
  } else if (typeof navigator !== 'undefined' && navigator.modelContext && typeof navigator.modelContext.provideContext === 'function') {
    // Fallback for an alternative proposed API signature (provideContext)
    try {
      navigator.modelContext.provideContext({
        tools: [
          {
            name: 'get_page_markdown',
            description: 'Fetch the raw markdown content of any page or post on Optikal Bahari by path.',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'The path of the page or post to fetch (e.g., "/", "/about/").'
                }
              },
              required: ['path']
            },
            execute: async function(params) {
              try {
                var path = params.path || '/';
                var res = await fetch(path, { headers: { 'Accept': 'text/markdown' } });
                if (!res.ok) {
                  return { error: 'Failed to fetch ' + path + ' (Status: ' + res.status + ')' };
                }
                var text = await res.text();
                return { text: text };
              } catch (e) {
                return { error: e.toString() };
              }
            }
          }
        ]
      });
    } catch (e) {
      console.warn('WebMCP provideContext failed', e);
    }
  }

})
