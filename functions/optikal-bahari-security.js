export default {
  /**
   * @param {Request} request
   * @param {any} env
   * @param {any} ctx
   */
  async fetch(request, env, ctx) {
    const response = await fetch(request)
    const contentType = response.headers.get('content-type') || ''

    if (!contentType.includes('text/html')) {
      return response
    }

    const newResponse = new Response(response.body, response)

    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
    newResponse.headers.set('X-Content-Type-Options', 'nosniff')
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    newResponse.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://*.google.com https://*.google.co.id",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://widgets.sociablekit.com https://static.cloudflareinsights.com https://cdn.jsdelivr.net https://analytics.ahrefs.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://assets.optikalbahari.com https://res.cloudinary.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://www.google.com https://www.google.co.id https://*.sociablekit.com https://*.googleusercontent.com",
      "font-src 'self' data: https://fonts.gstatic.com https://ka-f.fontawesome.com",
      // FIXED connect-src: Added broad wildcards for Google, Algolia IO, and Ahrefs
      "connect-src 'self' https://*.algolia.net https://*.algolianet.com https://*.algolia.io https://*.google-analytics.com https://*.analytics.google.com https://*.google.com https://*.google.co.id https://stats.g.doubleclick.net https://maps.googleapis.com https://*.sociablekit.com https://*.cloudflareinsights.com https://cloudflareinsights.com https://analytics.ahrefs.com",
      "frame-src 'self' https://www.google.com https://www.googletagmanager.com https://widgets.sociablekit.com",
      'upgrade-insecure-requests',
    ].join('; ')

    newResponse.headers.set('Content-Security-Policy', csp)
    newResponse.headers.delete('X-Powered-By')
    newResponse.headers.set('Server', 'Cloudflare')
    return newResponse
  },
}
