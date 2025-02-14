/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// export default {
// 	async fetch(request, env, ctx) {
// 		return new Response('Hello World!');
// 	},
// };

export default {
	async fetch(request, env, ctx) {
		// Parse the request URL
		const url = new URL(request.url);

		// Extract the image path (e.g., /assets/img/bg-about.webp)
		const imagePath = url.pathname;

		// Check if the request is for an image
		if (!imagePath.startsWith('/assets/img/') || !/\.(jpg|jpeg|png|webp)$/i.test(imagePath)) {
			return new Response('Not an image request', { status: 400 });
		}

		// Construct the origin URL for the image
		const originUrl = `https://optikalbahari.com${imagePath}`;

		// Try to fetch the image from the cache
		const cache = caches.default;
		let response = await cache.match(request);

		if (!response) {
			// Fetch the image from the origin server
			response = await fetch(originUrl);

			// Cache the image at the edge
			ctx.waitUntil(cache.put(request, response.clone()));

			return response;
		}

		// Return the cached response
		return response;
	},
};
