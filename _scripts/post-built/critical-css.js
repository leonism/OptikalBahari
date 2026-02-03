/**
 * Generate critical CSS for all HTML files
 * Fixed for Node.js ESM compatibility + TypeScript Linting
 */
async function generateCriticalCSS() {
  try {
    // Dynamic imports for ESM compatibility
    const { generate } = await import('critical')
    const { glob } = await import('glob')

    const files = await glob('_site/**/*.html')

    console.log(`🔍 Scanning ${files.length} files for critical CSS...`)

    for (const file of files) {
      // @ts-ignore - The library supports Promises at runtime, but types expect a callback.
      await generate({
        inline: true,
        base: '_site/',
        src: file.replace('_site/', ''),
        dest: file, // Overwrite the original HTML
        width: 1300,
        height: 900,
        minify: true,
        extract: true,
        ignore: ['@font-face'],
      })
    }

    console.log(`✓ Critical CSS generated for ${files.length} files`)
  } catch (err) {
    console.error('❌ Error generating critical CSS:', err)
    process.exit(1)
  }
}

generateCriticalCSS()
