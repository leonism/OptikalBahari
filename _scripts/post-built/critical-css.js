/**
 * Generate critical CSS for all HTML files
 */
async function generateCriticalCSS() {
  try {
    const { generate } = await import('critical')
    const { glob } = await import('glob')

    const files = await glob('_site/**/*.html')

    for (const file of files) {
      // @ts-ignore - critical.generate returns a Promise when no callback is provided
      await generate({
        inline: true,
        base: '_site/',
        src: file.replace('_site/', ''),
        dest: file,
        width: 1300,
        height: 900,
        minify: true,
        extract: true,
        ignore: ['@font-face'],
      })
    }

    console.log(`✓ Critical CSS generated for ${files.length} files`)
  } catch (/** @type {any} */ err) {
    console.error('Error generating critical CSS:', err)
    process.exit(1)
  }
}

generateCriticalCSS()
