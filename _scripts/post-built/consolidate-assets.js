// Dependencies
const fs = require('fs-extra')
const path = require('path')

async function main() {
  const { glob } = await import('glob')
  const cheerio = await import('cheerio')
  const { minify: terserMinify } = await import('terser')
  const { minify: htmlMinify } = await import('html-minifier-terser')
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

  // Constants
  const SITE_DIR = '_site'
  const ASSETS_DIR = path.join(SITE_DIR, 'assets')
  const DIST_DIR = path.join(ASSETS_DIR, 'dist')

  /** @param {string} msg */
  const log = (msg) => console.log(`[Consolidate] ${msg}`)
  /** @param {string} msg */
  const debug = (msg) => (argv.verbose || process.env.DEBUG) && console.log(`[Consolidate] [DEBUG] ${msg}`)
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

    // 3. Global Asset Discovery (Scan ALL HTML files to catch everything)
    log('Discovering assets across all pages...')
    /** @type {Set<string>} */
    const cssFilesSet = new Set()
    /** @type {Set<string>} */
    const jsFilesSet = new Set()

    for (const file of htmlFiles) {
      const content = await fs.readFile(file, 'utf8')
      const $ = cheerio.load(content)

      // Find CSS
      $('link[rel="stylesheet"], link[rel="preload"][as="style"]').each((i, el) => {
        const href = $(el).attr('href')
        if (href && isLocalAsset(href)) {
          const resolved = resolvePath(href, file, SITE_DIR)
          if (resolved.endsWith('styles.min.css')) return
          if (fs.existsSync(resolved)) cssFilesSet.add(resolved)
        }
      })

      // Find JS
      $('script[src]').each((i, el) => {
        const src = $(el).attr('src')
        const dataMerge = $(el).attr('data-merge')
        if (src && isLocalAsset(src) && dataMerge !== 'false') {
          const resolved = resolvePath(src, file, SITE_DIR)
          if (resolved.endsWith('scripts.min.js')) return
          if (fs.existsSync(resolved)) jsFilesSet.add(resolved)
        }
      })
    }

    const cssFiles = Array.from(cssFilesSet)
    const jsFiles = Array.from(jsFilesSet)

    log(`Identified ${cssFiles.length} CSS files and ${jsFiles.length} JS files to merge.`)

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

            const sourceDir = path.dirname(file)
            const absoluteTarget = path.resolve(sourceDir, url)
            let newUrl = path.relative(DIST_DIR, absoluteTarget)
            newUrl = newUrl.split(path.sep).join('/')

            return `url('${newUrl}')`
          })

          rawCss += rebasedContent + '\n'
        } catch (/** @type {any} */ e) {
          error(`Failed to read CSS file: ${file} - ${e.message}`)
        }
      }

      const originalSize = Buffer.byteLength(rawCss, 'utf8')
      const output = new CleanCSS({ level: 1, rebase: false }).minify(rawCss)
      finalCss = output.styles

      // Font-display swap
      if (finalCss.includes('@font-face')) {
        finalCss = finalCss.replace(/@font-face\s*{([^}]+)}/g, (match, contents) => {
          if (contents.includes('font-display')) {
            return `@font-face{${contents.replace(/font-display\s*:\s*([^;]+)/, 'font-display:swap')}}`
          } else {
            return `@font-face{font-display:swap;${contents}}`
          }
        })
      }

      const minifiedSize = Buffer.byteLength(finalCss, 'utf8')
      log(`CSS Optimization: ${(originalSize / 1024).toFixed(2)} KB -> ${(minifiedSize / 1024).toFixed(2)} KB`)

      if (!argv.dryRun) {
        await fs.writeFile(path.join(DIST_DIR, 'styles.min.css'), finalCss)
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
          compress: { drop_console: true, drop_debugger: true },
          mangle: true,
        })

        if (result.code) {
          const minifiedSize = Buffer.byteLength(result.code, 'utf8')
          log(`JS Optimization: ${(originalSize / 1024).toFixed(2)} KB -> ${(minifiedSize / 1024).toFixed(2)} KB`)

          if (!argv.dryRun) {
            await fs.writeFile(path.join(DIST_DIR, 'scripts.min.js'), result.code)
          }
        }
      } catch (/** @type {any} */ e) {
        error(`Terser Minification Failed: ${e.message}`)
      }
    }

    // 6. Update HTML References
    log('Updating HTML references and minifying...')
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

        if (cssLinks.length > 0) {
          const firstLink = cssLinks.first()
          firstLink.before(`<link rel="stylesheet" href="/assets/dist/styles.min.css">`)
          cssLinks.remove()
          modified = true
        }
      }

      // Replace JS
      if (jsFiles.length > 0) {
        const jsScripts = $page('script[src]').filter((i, el) => {
          const src = $page(el).attr('src')
          if (!src) return false
          const resolved = resolvePath(src, file, SITE_DIR)
          return jsFiles.includes(resolved) || src.includes('scripts.min.js')
        })

        if (jsScripts.length > 0) {
          const lastScript = jsScripts.last()
          lastScript.after('<script defer src="/assets/dist/scripts.min.js"></script>')
          jsScripts.remove()
          modified = true
        }
      }

      // GTM Obfuscation & Lazy Loading
      const gtmScripts = $page('script:not([src])').filter((i, el) => {
        const content = $page(el).html()
        return !!(content && (content.includes('gtm.start') || content.includes('GTM-')))
      })

      if (gtmScripts.length > 0) {
        gtmScripts.each((i, el) => {
          let content = $page(el).html() || ''
          content = content.replace(/['"]https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=['"]/g, "'https://www.google' + 'tagmanager.com/gtm.js?id='")
          const lazyGTM = `
<script>
  let gtmFired = false;
  function fireGTM() {
    if (gtmFired) return;
    gtmFired = true;
    ${content}
  }
  ['scroll', 'mousemove', 'touchstart', 'keydown'].forEach(function(e) {
    document.addEventListener(e, fireGTM, { passive: true, once: true });
  });
  if (window.requestIdleCallback) {
    window.requestIdleCallback(function() { setTimeout(fireGTM, 3000); });
  } else {
    setTimeout(fireGTM, 3500);
  }
</script>`.trim()
          $page('body').append('\n' + lazyGTM + '\n')
          $page(el).remove()
        })
        modified = true
      }

      // Minify HTML
      if (!argv.dryRun) {
        try {
          const minifiedHtml = await htmlMinify($page.html(), {
            collapseWhitespace: true,
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
          })
          await fs.writeFile(file, minifiedHtml)
        } catch (/** @type {any} */ e) {
          error(`Failed to minify ${file}: ${e.message}`)
          await fs.writeFile(file, $page.html())
        }
      }
    }

    // 7. Extended Cleanup & Pruning
    log('Cleaning up orphaned source assets...')
    const allMergedFiles = [...cssFiles, ...jsFiles]
    let deletedCount = 0

    // Phase 1: Delete merged files and their sidecars
    for (const file of allMergedFiles) {
      const sidecars = [file, `${file}.br`, `${file}.gz`, `${file}.zst`]
      for (const sidecar of sidecars) {
        if (fs.existsSync(sidecar)) {
          try {
            if (!argv.dryRun) await fs.unlink(sidecar)
            deletedCount++
          } catch (e) {}
        }
      }
    }

    // Phase 2: Sweep and remove remaining original files that were missed but should have been merged
    // (e.g., unhashed versions left behind by AssetProcessor)
    const assetsToPrune = await glob(`${SITE_DIR}/assets/**/*.{css,js}`)
    for (const file of assetsToPrune) {
      const relative = path.relative(SITE_DIR, file)
      // Never delete the consolidated results
      if (relative.startsWith('assets/dist/')) continue
      
      try {
        if (!argv.dryRun) {
          await fs.unlink(file)
          // Also try to delete compressed versions
          for (const ext of ['.br', '.gz', '.zst']) {
            if (fs.existsSync(`${file}${ext}`)) await fs.unlink(`${file}${ext}`)
          }
        }
        deletedCount++
      } catch (e) {}
    }

    log(`Removed ${deletedCount} source/extra asset files.`)
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
    // If it starts with /, it is relative to site root
    return path.join(siteDir, cleanUrl)
  } else {
    // Otherwise it is relative to the current file
    return path.join(path.dirname(sourceFile), cleanUrl)
  }
}

main()
