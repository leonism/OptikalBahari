/**
 * WebMCP Implementation for Optikal Bahari
 * Exposes site tools to AI agents via the browser's Model Context API.
 * @see https://webmachinelearning.github.io/webmcp/
 */

(function() {
  const nav = /** @type {any} */ (navigator);
  if (!nav.modelContext || !nav.modelContext.provideContext) {
    console.debug('WebMCP: Model Context API not supported in this browser.');
    return;
  }

  const tools = [
    {
      name: 'fetch_reviews',
      description: 'Fetch verified customer reviews and testimonials for Optikal Bahari.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            description: 'Number of reviews to fetch (max 60)',
            default: 10
          }
        }
      },
      async execute({ limit = 10 }) {
        try {
          const response = await fetch('/api/reviews.json');
          const reviews = await response.json();
          return {
            content: [{ type: 'text', text: JSON.stringify(reviews.slice(0, limit), null, 2) }]
          };
        } catch (error) {
          const e = /** @type {Error} */ (error);
          return {
            content: [{ type: 'text', text: 'Error fetching reviews: ' + e.message }],
            isError: true
          };
        }
      }
    },
    {
      name: 'get_site_info',
      description: 'Get detailed information about Optikal Bahari\'s clinical services, lens technology, and interest-free financing.',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      async execute() {
        try {
          const response = await fetch('/llms.txt');
          const info = await response.text();
          return {
            content: [{ type: 'text', text: info }]
          };
        } catch (error) {
          const e = /** @type {Error} */ (error);
          return {
            content: [{ type: 'text', text: 'Error fetching site info: ' + e.message }],
            isError: true
          };
        }
      }
    }
  ];

  nav.modelContext.provideContext({
    serverInfo: {
      name: 'optikal-bahari-webmcp',
      version: '1.0.0'
    },
    tools
  }).then(() => {
    console.log('WebMCP: Site tools successfully registered with the browser.');
  }).catch(/** @param {any} err */ err => {
    console.error('WebMCP: Failed to provide context:', err);
  });
})();
