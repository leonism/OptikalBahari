const fs = require('fs-extra');
const path = require('path');

const SITE_DIR = '_site';

async function main() {
  console.log('🚀 Starting HTML minification...');

  const { glob } = await import('glob');
  const { minify } = await import('html-minifier-terser');

  const htmlFiles = await glob(`${SITE_DIR}/**/*.html`);
  let totalOriginalSize = 0;
  let totalMinifiedSize = 0;

  for (const file of htmlFiles) {
    try {
      const originalHtml = await fs.readFile(file, 'utf8');
      const originalSize = Buffer.byteLength(originalHtml, 'utf8');
      totalOriginalSize += originalSize;

      const minifiedHtml = await minify(originalHtml, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        removeAttributeQuotes: true
      });

      const minifiedSize = Buffer.byteLength(minifiedHtml, 'utf8');
      totalMinifiedSize += minifiedSize;

      await fs.writeFile(file, minifiedHtml);
    } catch (e) {
      console.error(`Error minifying ${file}: ${e.message}`);
    }
  }

  const saved = totalOriginalSize - totalMinifiedSize;
  const savedPercent = totalOriginalSize > 0 ? ((saved / totalOriginalSize) * 100).toFixed(2) : 0;

  console.log(`✅ HTML Minification complete.`);
  console.log(`   Original size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(`   Minified size: ${(totalMinifiedSize / 1024).toFixed(2)} KB`);
  console.log(`   Saved: ${(saved / 1024).toFixed(2)} KB (${savedPercent}%)`);
}

main();
