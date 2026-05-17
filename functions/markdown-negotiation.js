/** @param {{request: Request, next: Function}} context */
export async function onRequest(context) {
  const { request, next } = context;
  const acceptHeader = request.headers.get("Accept") || "";

  // Check if the agent specifically asks for markdown
  if (acceptHeader.includes("text/markdown")) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only attempt markdown negotiation for potential HTML pages
    if (path === "/" || path.endsWith("/") || path.endsWith(".html")) {
      let mdPath = path;

      if (path === "/") {
        mdPath = "/index.md";
      } else if (path.endsWith("/")) {
        mdPath = `${path}index.md`;
      } else if (path.endsWith(".html")) {
        mdPath = path.replace(".html", ".md");
      }

      // Try to fetch the markdown version
      const mdUrl = new URL(mdPath, url.origin);
      const mdResponse = await fetch(mdUrl.toString(), {
        method: request.method,
        headers: request.headers
      });

      if (mdResponse.ok) {
        // Clone response to modify headers
        const newResponse = new Response(mdResponse.body, mdResponse);
        newResponse.headers.set("Content-Type", "text/markdown; charset=utf-8");
        // Optional but recommended for "Markdown for Agents"
        newResponse.headers.set("x-markdown-tokens", "true");
        // Vary on Accept to ensure correct caching
        newResponse.headers.set("Vary", "Accept");
        return newResponse;
      }
    }
  }

  // Fallback to normal processing
  const response = await next();
  // Ensure we signal that this response can vary by Accept
  const newResponse = new Response(response.body, response);
  newResponse.headers.append("Vary", "Accept");
  return newResponse;
}
