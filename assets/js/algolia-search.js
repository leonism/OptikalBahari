document.addEventListener('DOMContentLoaded', function() {
  // Check if Algolia configuration is present
  // In a real implementation, you might fetch these from a config object injected by Jekyll
  // For now, we check if the containers exist
  
  const searchContainer = document.getElementById('algolia-search-container');
  if (!searchContainer) return;

  // Configuration from environment variables
  const algoliaConfig = {
    appId: process.env.ALGOLIA_APP_ID,
    apiKey: process.env.ALGOLIA_SEARCH_API_KEY,
    indexName: process.env.ALGOLIA_INDEX_NAME
  };

  // Check if credentials are placeholders or missing
  if (!algoliaConfig.appId || algoliaConfig.appId === 'YOUR_ALGOLIA_APP_ID') {
    console.warn('Algolia Search: Please configure your App ID and API Key in assets/js/algolia-search.js or _config.yml');
    // Optional: Render a warning in the UI for development
    // document.getElementById('searchbox').innerHTML = '<small class="text-danger">Algolia not configured</small>';
    return;
  }

  const search = instantsearch({
    indexName: algoliaConfig.indexName,
    searchClient: algoliasearch(algoliaConfig.appId, algoliaConfig.apiKey),
    searchFunction(helper) {
      const container = document.querySelector('#hits');
      if (helper.state.query) {
        container.classList.add('has-results');
        helper.search();
      } else {
        container.classList.remove('has-results');
        container.innerHTML = ''; // Clear results when query is empty
      }
    }
  });

  // Search Box Widget
  search.addWidgets([
    instantsearch.widgets.searchBox({
      container: '#searchbox',
      placeholder: 'Cari Optikal Bahari...',
      showReset: true,
      showSubmit: true,
      showLoadingIndicator: true,
      cssClasses: {
        root: 'custom-search-box',
        form: 'form-inline',
        input: 'form-control form-control-sm rounded-pill border custom-search',
        submit: 'btn btn-link search-btn',
        reset: 'btn btn-link reset-btn'
      }
    })
  ]);

  // Hits Widget
  search.addWidgets([
    instantsearch.widgets.hits({
      container: '#hits',
      templates: {
        empty: '<div class="p-3 text-center text-muted">No results found for "<strong>{{query}}</strong>"</div>',
        item: `
          <a href="{{url}}" class="result-item">
            <h4>{{#helpers.highlight}}{ "attribute": "title" }{{/helpers.highlight}}</h4>
            <p>{{#helpers.snippet}}{ "attribute": "content" }{{/helpers.snippet}}</p>
          </a>
        `
      },
      cssClasses: {
        list: 'list-unstyled m-0',
        item: 'border-bottom'
      }
    })
  ]);

  // Configure Hits to be hidden initially and handling styling
  search.on('render', function() {
    const hitsContainer = document.querySelector('#hits');
    const searchInput = document.querySelector('.ais-SearchBox-input');
    
    // Hide hits if input is empty (handled by searchFunction, but double check)
    if (searchInput && searchInput.value.trim() === '') {
      hitsContainer.classList.remove('has-results');
    }
  });

  search.start();
});
