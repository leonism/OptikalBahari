/**
 * @param {import("@cloudflare/workers-types").EventContext<any, any, any>} context
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // CONFIGURATION
  // We can use an environment variable (env.CLOUDINARY_CLOUD_NAME) if you prefer,
  // but I'll stick to your provided value for now to match the original worker.
  const CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME || "divkqrf7k";
  const TARGET_HOST = "res.cloudinary.com";

  // 1. Handle base path /image/
  if (url.pathname === "/image/" || url.pathname === "/image") {
    return new Response("Optikal Bahari Assets Server", { status: 200 });
  }

  // 2. Construct the Target URL
  // The Pages function at /functions/image/[[path]].js catches everything under /image/
  // Incoming: https://assets.optikalbahari.com/image/upload/v1/sample.jpg
  // Target:   https://res.cloudinary.com/divkqrf7k/image/upload/v1/sample.jpg
  // Logic: Prepend the cloud name to the pathname.
  const targetUrl = `https://${TARGET_HOST}/${CLOUD_NAME}${url.pathname}${url.search}`;

  // 3. Optional: Add 'Save-Data' awareness for edge-side optimization
  const saveData = request.headers.get("Save-Data") === "on";
  let modifiedTargetUrl = targetUrl;
  if (saveData && targetUrl.includes("q_auto")) {
    // If user has Save-Data on, substitute 'auto:good' with 'auto:eco' if applicable
    modifiedTargetUrl = targetUrl.replace("q_auto:good", "q_auto:eco");
  }

  // 4. Fetch the image from Cloudinary
  // We pass headers to preserve cache behaviors and other metadata
  const imageResponse = await fetch(modifiedTargetUrl, {
    headers: /** @type {any} */ (request.headers),
    method: request.method
  });

  // 5. Return the image to the user
  // We wrap the response to ensure headers are clean for the domain
  const response = new Response(/** @type {any} */ (imageResponse.body), /** @type {any} */ (imageResponse));

  // Ensure caching is set (Cloudinary usually provides excellent headers, but we can override if needed)
  if (imageResponse.ok) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  return response;
}
