/**
 * Generate critical CSS for all HTML files
 * Fixed for Chromium Crash (Signal 11) on macOS
 */
async function generateCriticalCSS() {
  try {
    const { generate } = await import('critical')
    const { glob } = await import('glob')

    const files = await glob('_site/**/*.html')

    console.log(`🔍 Scanning ${files.length} files for critical CSS...`)

    for (const file of files) {
      const relativePath = file.replace('_site/', '')

      // @ts-ignore
      await generate({
        inline: true,
        base: '_site/',
        src: relativePath,
        target: relativePath,
        width: 1300,
        height: 900,
        extract: true,
        ignore: ['@font-face'],
        // 🛡️ CRASH PREVENTION SETTINGS
        puppeteer: {
          headless: 'new', // Use the new Headless mode (more stable)
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Prevent shared memory crashes
            '--disable-gpu', // Disable GPU hardware acceleration (common cause of SIGSEGV)
            '--disable-web-security',
          ],
        },
      })
    }

    console.log(`✓ Critical CSS generated for ${files.length} files`)
  } catch (err) {
    console.error('❌ Error generating critical CSS:', err)
    process.exit(1)
  }
}

generateCriticalCSS()
