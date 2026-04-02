/**
 * @typedef {Object} Env
 * @property {string} [CLOUDINARY_CLOUD_NAME]
 */

/**
 * @param {import("@cloudflare/workers-types").EventContext<Env, any, any>} context
 */
export async function onRequest(context) {
  const response = await context.next()
  const url = new URL(context.request.url)

  // Skip middleware for specific paths if needed (e.g., if we want legacy behavior elsewhere)
  // But for this project, we want global security.

  const newResponse = new Response(/** @type {any} */ (response.body), /** @type {any} */ (response))

  // 1. Mandatory Security Headers
  newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
  newResponse.headers.set('X-Content-Type-Options', 'nosniff')
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  newResponse.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // 2. ENHANCED CONTENT SECURITY POLICY
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://*.google.com https://*.google.co.id",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://widgets.sociablekit.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://assets.optikalbahari.com https://res.cloudinary.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://www.google.com https://www.google.co.id https://*.sociablekit.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://*.algolia.net https://maps.googleapis.com https://www.google.com https://www.google.co.id https://*.sociablekit.com",
    "frame-src 'self' https://www.google.com https://www.googletagmanager.com https://widgets.sociablekit.com",
    'upgrade-insecure-requests',
  ].join('; ')

  newResponse.headers.set('Content-Security-Policy', csp)

  // 3. Performance & Cleanup
  newResponse.headers.delete('X-Powered-By')
  newResponse.headers.set('Server', 'Cloudflare')

  // Optional: Add a header to indicate this is served via Pages Functions
  newResponse.headers.set('X-Served-By', 'Cloudflare-Pages-Functions')

  return newResponse
}
