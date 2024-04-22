// postcss.config.js

module.exports = {
	plugins: [
		require("postcss-import"),
		require("cssnano"),
		require("autoprefixer"),
		...(process.env.JEKYLL_ENV == "production"
			? [require("cssnano")({ preset: "default" })]
			: []),
	],
};
