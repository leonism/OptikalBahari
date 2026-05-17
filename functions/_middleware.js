// functions/_middleware.js
// Global middleware for Cloudflare Pages

/** @param {any} context */
async function handleCompression(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const acceptEncoding = request.headers.get("Accept-Encoding") || "";

  // Priority List for compression
  const compressionTypes = [
    { extension: ".zst", encoding: "zstd" },
    { extension: ".br",  encoding: "br"   },
    { extension: ".gz",  encoding: "gzip" }
  ];

  const isCompressible = /\.(js|css|html)$/.test(url.pathname) || url.pathname.endsWith("/");

  if (isCompressible) {
    const supportedTypes = compressionTypes.filter(t => acceptEncoding.includes(t.encoding));

    for (const type of supportedTypes) {
      const compressedPath = url.pathname.endsWith("/")
        ? `${url.pathname}index.html${type.extension}`
        : `${url.pathname}${type.extension}`;

      const compressedUrl = new URL(compressedPath, url.origin);
      const compressedRes = await fetch(new Request(compressedUrl.toString(), request));

      if (compressedRes.ok) {
        const response = new Response(compressedRes.body, compressedRes);
        
        // Ensure the correct Content-Type is set for the underlying file type
        let contentType = "text/html; charset=utf-8";
        if (url.pathname.endsWith(".js")) contentType = "application/javascript; charset=utf-8";
        else if (url.pathname.endsWith(".css")) contentType = "text/css; charset=utf-8";
        else if (url.pathname.endsWith(".xml")) contentType = "application/xml; charset=utf-8";
        else if (url.pathname.endsWith(".json")) contentType = "application/json; charset=utf-8";
        else if (url.pathname.endsWith(".txt")) contentType = "text/plain; charset=utf-8";

        response.headers.set("Content-Type", contentType);
        response.headers.set("Content-Encoding", type.encoding);
        response.headers.set("Vary", "Accept-Encoding");
        return response;
      }
    }
  }

  return next();
}

/** @param {any} context */
async function handleMarkdownNegotiation(context) {
  const { request, next } = context;
  const acceptHeader = request.headers.get("Accept") || "";

  if (acceptHeader.includes("text/markdown")) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path.endsWith("/") || path.endsWith(".html")) {
      let mdPath = path;
      if (path === "/") mdPath = "/index.md";
      else if (path.endsWith("/")) mdPath = `${path}index.md`;
      else if (path.endsWith(".html")) mdPath = path.replace(".html", ".md");

      const mdUrl = new URL(mdPath, url.origin);
      const mdResponse = await fetch(mdUrl.toString(), {
        method: request.method,
        headers: request.headers
      });

      if (mdResponse.ok) {
        const newResponse = new Response(mdResponse.body, mdResponse);
        newResponse.headers.set("Content-Type", "text/markdown; charset=utf-8");
        newResponse.headers.set("x-markdown-tokens", "true");
        newResponse.headers.set("Vary", "Accept");
        return newResponse;
      }
    }
  }
  
  const response = await next();
  const newResponse = new Response(response.body, response);
  newResponse.headers.append("Vary", "Accept");
  return newResponse;
}

/** @param {any} context */
async function handleSecurityHeaders(context) {
  const { next } = context;
  const response = await next();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return response;
  }

  const newResponse = new Response(response.body, response);
  newResponse.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  newResponse.headers.set("X-Frame-Options", "SAMEORIGIN");
  newResponse.headers.set("X-Content-Type-Options", "nosniff");
  newResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  newResponse.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  const url = new URL(context.request.url);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    newResponse.headers.append("Link", '</llms.txt>; rel="service-doc"');
  }

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://*.google.com https://*.google.co.id",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://widgets.sociablekit.com https://static.cloudflareinsights.com https://cdn.jsdelivr.net https://analytics.ahrefs.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://assets.optikalbahari.com https://res.cloudinary.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://www.google.com https://www.google.co.id https://*.sociablekit.com https://*.googleusercontent.com",
    "font-src 'self' data: https://fonts.gstatic.com https://ka-f.fontawesome.com",
    "connect-src 'self' https://*.algolia.net https://*.algolianet.com https://*.algolia.io https://*.google-analytics.com https://*.analytics.google.com https://*.google.com https://*.google.co.id https://stats.g.doubleclick.net https://maps.googleapis.com https://*.sociablekit.com https://*.cloudflareinsights.com https://cloudflareinsights.com https://analytics.ahrefs.com",
    "frame-src 'self' https://www.google.com https://www.googletagmanager.com https://widgets.sociablekit.com",
    "upgrade-insecure-requests",
  ].join("; ");

  newResponse.headers.set("Content-Security-Policy", csp);
  newResponse.headers.delete("X-Powered-By");
  newResponse.headers.set("Server", "Cloudflare");

  return newResponse;
}

export const onRequest = [handleSecurityHeaders, handleMarkdownNegotiation, handleCompression];
