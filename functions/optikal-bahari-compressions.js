export default {
  /**
   * @param {Request} request
   * @param {any} env
   * @param {any} ctx
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const acceptEncoding = request.headers.get("Accept-Encoding") || "";

    // 1. Priority List
    const compressionTypes = [
      { extension: ".zst", encoding: "zstd" },
      { extension: ".br",  encoding: "br"   },
      { extension: ".gz",  encoding: "gzip" }
    ];

    const isCompressible = /\.(js|css|html)$/.test(url.pathname) || url.pathname.endsWith("/");

    let response;

    if (isCompressible) {
      // Filter types supported by the browser
      const supportedTypes = compressionTypes.filter(t => acceptEncoding.includes(t.encoding));

      // Loop through supported types until we find a file that actually exists
      for (const type of supportedTypes) {
        const compressedUrl = url.pathname.endsWith("/")
          ? `${request.url}index.html${type.extension}`
          : `${request.url}${type.extension}`;

        const compressedRes = await fetch(new Request(compressedUrl, request));

        if (compressedRes.ok) {
          response = new Response(compressedRes.body, compressedRes);
          response.headers.set("Content-Encoding", type.encoding);
          response.headers.set("Vary", "Accept-Encoding");
          break; // Found one! Exit the loop.
        }
      }
    }

    // 2. Fallback to original if nothing was found
    if (!response) {
      response = await fetch(request);
    }

    // 3. Security Hardening (HTML only)
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      const secureResponse = new Response(response.body, response);
      secureResponse.headers.set("X-Frame-Options", "DENY");
      secureResponse.headers.set("X-Content-Type-Options", "nosniff");
      secureResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      // Add your CSP here
      return secureResponse;
    }

    return response;
  }
};
