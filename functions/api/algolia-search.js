export async function onRequest(context) {
  try {
    const { request, env } = context;

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Read the request body to get the search parameters
    const algoliaRequest = await request.json();

    // Retrieve Algolia credentials from environment variables
    const ALGOLIA_APPLICATION_ID = env.ALGOLIA_APPLICATION_ID;
    const ALGOLIA_SEARCH_API_KEY = env.ALGOLIA_SEARCH_API_KEY;
    const ALGOLIA_INDEX_NAME = env.ALGOLIA_INDEX_NAME;

    if (!ALGOLIA_APPLICATION_ID || !ALGOLIA_SEARCH_API_KEY || !ALGOLIA_INDEX_NAME) {
      console.error('Algolia credentials are not set in environment variables.');
      return new Response('Server configuration error.', { status: 500 });
    }

    // Construct the Algolia API URL
    const algoliaApiUrl = `https://${ALGOLIA_APPLICATION_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX_NAME}/query`;

    // Forward the request to Algolia
    const algoliaResponse = await fetch(algoliaApiUrl, {
      method: 'POST',
      headers: {
        'X-Algolia-Application-Id': ALGOLIA_APPLICATION_ID,
        'X-Algolia-API-Key': ALGOLIA_SEARCH_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(algoliaRequest),
    });

    // Read Algolia's response
    const algoliaData = await algoliaResponse.json();

    // Return Algolia's response to the client
    return new Response(JSON.stringify(algoliaData), {
      status: algoliaResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Consider restricting this in production
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Algolia proxy function error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
