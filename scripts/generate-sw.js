const workboxBuild = require('workbox-build');

workboxBuild.generateSW({
  globDirectory: '_site/',
  globPatterns: [
    '**/*.{html,js,css,webp,jpg,jpeg,png,svg,woff,woff2}'
  ],
  swDest: '_site/sw.js',
  runtimeCaching: [{
    urlPattern: /^https:\/\/res\.cloudinary\.com\//,
    handler: 'CacheFirst',
    options: {
      cacheName: 'cloudinary-images',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      }
    }
  }]
});