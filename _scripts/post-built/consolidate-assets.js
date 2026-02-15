const fs = require('fs-extra')
const path = require('path')

async function main() {
  const { glob } = await import('glob')
  const cheerio = await import('cheerio')
  const { minify: terserMinify } = await import('terser')
  const { default: yargs } = await import('yargs/yargs')
  const { hideBin } = await import('yargs/helpers')
  const CleanCSS = require('clean-css')

  const argv = await yargs(hideBin(process.argv))
    .option('dry-run', {
      alias: 'd',
      type: 'boolean',
      description: 'Run without making changes',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Enable verbose logging',
    }).argv

  const SITE_DIR = '_site'
  const ASSETS_DIR = path.join(SITE_DIR, 'assets')
  const DIST_DIR = path.join(ASSETS_DIR, 'dist')

  /** @param {string} msg */
  const log = (msg) => console.log(`[Consolidate] ${msg}`)
  /** @param {string} msg */
  const debug = (msg) => argv.verbose && console.log(`[Consolidate] [DEBUG] ${msg}`)
  /** @param {string} msg */
  const error = (msg) => console.error(`[Consolidate] [ERROR] ${msg}`)

  try {
    log('Starting asset consolidation...')

    if (argv.dryRun) {
      log('DRY RUN MODE: No files will be modified.')
    }

    // 1. Prepare Directories
    if (!argv.dryRun) {
      await fs.ensureDir(DIST_DIR)
    }

    // 2. Find HTML Files
    const htmlFiles = await glob(`${SITE_DIR}/**/*.html`)
    if (htmlFiles.length === 0) {
      log('No HTML files found. Exiting.')
      return
    }
    log(`Found ${htmlFiles.length} HTML files.`)

    // 3. Analyze Assets from index.html (Source of Truth for ordering)
    const indexFile = htmlFiles.find((f) => f.endsWith('index.html')) || htmlFiles[0]
    log(`Using ${indexFile} as the reference for asset discovery.`)

    const indexContent = await fs.readFile(indexFile, 'utf8')
    const $ = cheerio.load(indexContent)

    /** @type {string[]} */
    const cssFiles = []
    /** @type {string[]} */
    const jsFiles = []

    // Helper to process CSS hrefs
    /** @param {string | undefined} href */
    const processCssHref = (href) => {
      if (href && isLocalAsset(href)) {
        const resolved = resolvePath(href, indexFile, SITE_DIR)
        // Skip if it is the consolidated file itself (to avoid loop if it exists)
        if (resolved.endsWith('styles.min.css')) return

        const exists = fs.existsSync(resolved)
        debug(`[Analysis] href: ${href} -> resolved: ${resolved} -> exists: ${exists}`)
        if (exists && !cssFiles.includes(resolved)) {
          cssFiles.push(resolved)
        }
      }
    }

    // Find CSS
    $('link[rel="stylesheet"], link[rel="preload"][as="style"]').each((i, el) => {
      const href = $(el).attr('href')
      processCssHref(href)
    })

    // Also check noscript tags
    $('noscript').each((i, el) => {
      const html = $(el).html()
      // Simple regex to find hrefs in link tags within noscript
      if (html) {
        const matches = html.match(/href=["']([^"']+)["']/g)
        if (matches) {
          matches.forEach((match) => {
            const href = match.replace(/href=["']|["']/g, '')
            if (href.endsWith('.css')) {
              processCssHref(href)
            }
          })
        }
      }
    })

    // Find JS
    $('script[src]').each((i, el) => {
      const src = $(el).attr('src')
      if (src && isLocalAsset(src)) {
        jsFiles.push(resolvePath(src, indexFile, SITE_DIR))
      }
    })

    log(`Identified ${cssFiles.length} CSS files and ${jsFiles.length} JS files to merge.`)
    debug(`CSS: ${JSON.stringify(cssFiles)}`)
    debug(`JS: ${JSON.stringify(jsFiles)}`)

    // 4. Process CSS
    let finalCss = ''
    if (cssFiles.length > 0) {
      log('Merging and minifying CSS...')
      let rawCss = ''
      for (const file of cssFiles) {
        try {
          const content = await fs.readFile(file, 'utf8')

          // Rebase URLs
          const rebasedContent = content.replace(/url\s*\((?:'|")?([^\)'"]+)(?:'|")?\)/g, (match, url) => {
            url = url.trim()
            if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('//') || url.startsWith('/')) {
              return match
            }

            // Calculate new relative path
            const sourceDir = path.dirname(file)
            const absoluteTarget = path.resolve(sourceDir, url)
            let newUrl = path.relative(DIST_DIR, absoluteTarget)

            // Normalize path separators for URL
            newUrl = newUrl.split(path.sep).join('/')

            const replacement = `url('${newUrl}')`
            debug(`Rebased: ${url} -> ${newUrl}`)
            return replacement
          })

          rawCss += rebasedContent + '\n'
        } catch (/** @type {any} */ e) {
          error(`Failed to read CSS file: ${file} - ${e.message}`)
        }
      }

      const originalSize = Buffer.byteLength(rawCss, 'utf8')
      // Use level 1 optimization to avoid stripping @font-face rules
      // Disable rebasing since we did it manually
      const output = new CleanCSS({
        level: 1,
        rebase: false,
      }).minify(rawCss)

      if (output.errors.length > 0) {
        output.errors.forEach((e) => error(`CleanCSS Error: ${e}`))
      }
      if (output.warnings.length > 0) {
        output.warnings.forEach((w) => debug(`CleanCSS Warning: ${w}`))
      }
      finalCss = output.styles

      // 4.1 Ensure font-display: swap is present in all @font-face rules
      if (finalCss.includes('@font-face')) {
        log('Ensuring font-display: swap in all @font-face rules...')
        finalCss = finalCss.replace(/@font-face\s*{([^}]+)}/g, (match, contents) => {
          if (contents.includes('font-display')) {
            // Replace existing font-display value with swap
            return `@font-face{${contents.replace(/font-display\s*:\s*([^;]+)/, 'font-display:swap')}}`
          } else {
            // Add font-display: swap if missing
            return `@font-face{font-display:swap;${contents}}`
          }
        })
      }

      const minifiedSize = Buffer.byteLength(finalCss, 'utf8')
      const saved = originalSize - minifiedSize
      const savedPercent = originalSize > 0 ? ((saved / originalSize) * 100).toFixed(2) : 0

      log(`CSS Optimization: ${(originalSize / 1024).toFixed(2)} KB -> ${(minifiedSize / 1024).toFixed(2)} KB (Saved ${savedPercent}%)`)

      if (!argv.dryRun) {
        await fs.writeFile(path.join(DIST_DIR, 'styles.min.css'), finalCss)
        log(`Written styles.min.css to ${DIST_DIR}`)
      }
    }

    // 5. Process JS
    if (jsFiles.length > 0) {
      log('Merging and minifying JS...')
      let combinedJs = ''
      for (const file of jsFiles) {
        try {
          const content = await fs.readFile(file, 'utf8')
          combinedJs += content + ';\n'
        } catch (/** @type {any} */ e) {
          error(`Failed to read JS file: ${file} - ${e.message}`)
        }
      }

      const originalSize = Buffer.byteLength(combinedJs, 'utf8')

      try {
        const result = await terserMinify(combinedJs, {
          compress: {
            drop_console: true, // Remove console logs
            drop_debugger: true,
          },
          mangle: true,
        })

        if (!result.code) throw new Error('Minification failed')

        const minifiedSize = Buffer.byteLength(result.code, 'utf8')
        const saved = originalSize - minifiedSize
        const savedPercent = originalSize > 0 ? ((saved / originalSize) * 100).toFixed(2) : 0

        log(`JS Optimization: ${(originalSize / 1024).toFixed(2)} KB -> ${(minifiedSize / 1024).toFixed(2)} KB (Saved ${savedPercent}%)`)

        if (!argv.dryRun) {
          await fs.writeFile(path.join(DIST_DIR, 'scripts.min.js'), result.code)
          log(`Written scripts.min.js to ${DIST_DIR}`)
        }
      } catch (/** @type {any} */ e) {
        error(`Terser Minification Failed: ${e.message}`)
      }
    }

    // 6. Update HTML References
    log('Updating HTML references...')

    for (const file of htmlFiles) {
      const originalHtml = await fs.readFile(file, 'utf8')
      const $page = cheerio.load(originalHtml)
      let modified = false

      // Replace CSS
      if (cssFiles.length > 0) {
        const cssLinks = $page('link[rel="stylesheet"], link[rel="preload"][as="style"]').filter((i, el) => {
          const href = $page(el).attr('href')
          return !!(href && cssFiles.includes(resolvePath(href, file, SITE_DIR)))
        })

        /** @type {any[]} */
        const noscriptsToRemove = []
        $page('noscript').each((i, el) => {
          const html = $page(el).html()
          let hasBundled = false
          if (html) {
            for (const cssFile of cssFiles) {
              const filename = path.basename(cssFile)
              if (html.includes(filename)) {
                hasBundled = true
                break
              }
            }
          }
          if (hasBundled) {
            noscriptsToRemove.push(el)
          }
        })

        if (cssLinks.length > 0) {
          const firstLink = cssLinks.first()
          // Use non-blocking loading pattern
          const nonBlockingCss = `
<link rel="preload" href="/assets/dist/styles.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/dist/styles.min.css"></noscript>`.trim()

          firstLink.before(nonBlockingCss)
          cssLinks.remove()
          $page(noscriptsToRemove).remove()
          modified = true
        }
      }

      // Replace JS
      if (jsFiles.length > 0) {
        const jsScripts = $page('script[src]').filter((i, el) => {
          const src = $page(el).attr('src')
          if (!src) return false

          const resolved = resolvePath(src, file, SITE_DIR)

          // Match known source files
          if (jsFiles.includes(resolved)) return true

          // Match existing consolidated file
          if (src.includes('scripts.min.js')) return true

          return false
        })

        if (jsScripts.length > 0) {
          const lastScript = jsScripts.last()
          lastScript.after('<script defer src="/assets/dist/scripts.min.js"></script>')
          jsScripts.remove()
          modified = true
        }
      }

      if (modified) {
        if (!argv.dryRun) {
          await fs.writeFile(file, $page.html())
          debug(`Updated ${file}`)
        } else {
          debug(`[DRY RUN] Would update ${file}`)
        }
      }
    }

    log('Consolidation complete.')
  } catch (/** @type {any} */ e) {
    error(`Fatal Error: ${e.stack}`)
    process.exit(1)
  }
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isLocalAsset(url) {
  if (url.match(/^https?:\/\//)) return false
  if (url.match(/^\/\//)) return false
  return true
}

/**
 * @param {string} url
 * @param {string} sourceFile
 * @param {string} siteDir
 * @returns {string}
 */
function resolvePath(url, sourceFile, siteDir) {
  let cleanUrl = url.split('?')[0]
  if (cleanUrl.startsWith('/')) {
    return path.join(siteDir, cleanUrl)
  } else {
    return path.join(path.dirname(sourceFile), cleanUrl)
  }
}

main()
