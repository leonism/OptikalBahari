export default {
	async fetch(req, env, ctx) {
		const url = new URL(req.url);
		if (!url.pathname.startsWith('/assets/img')) return fetch(req);

		const sizes = [320, 640, 960, 1280, 2560];
		const size = sizes.find((size) => req.headers.get('CF-Device-Width') <= size) || 2560;
		const newURL = `${url.origin}${url.pathname.replace('.webp', `-${size}.webp`)}`;

		return fetch(newURL);
	},
};
