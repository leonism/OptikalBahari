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

    // 3. Global Asset Discovery
    log('Discovering assets across all pages...')
    /** @type {Set<string>} */
    const cssFilesSet = new Set()
    /** @type {Set<string>} */
    const jsFilesSet = new Set()
    /** @type {Set<string>} */
    const keepFilesSet = new Set() // Assets referenced but explicitly excluded from merge

    for (const file of htmlFiles) {
      const content = await fs.readFile(file, 'utf8')
      const $ = cheerio.load(content)

      // Find CSS
      $('link[rel="stylesheet"], link[rel="preload"][as="style"]').each((i, el) => {
        const href = $(el).attr('href')
        if (href && isLocalAsset(href)) {
          const resolved = resolvePath(href, file, SITE_DIR)
          if (resolved.endsWith('styles.min.css')) return
          
          if ($(el).attr('data-merge') === 'false') {
            keepFilesSet.add(resolved)
          } else if (fs.existsSync(resolved)) {
            cssFilesSet.add(resolved)
          }
        }
      })

      // Find JS
      $('script[src]').each((i, el) => {
        const src = $(el).attr('src')
        if (src && isLocalAsset(src)) {
          const resolved = resolvePath(src, file, SITE_DIR)
          if (resolved.endsWith('scripts.min.js')) return
          
          if ($(el).attr('data-merge') === 'false') {
            keepFilesSet.add(resolved)
          } else if (fs.existsSync(resolved)) {
            jsFilesSet.add(resolved)
          }
        }
      })
    }

    const cssFiles = Array.from(cssFilesSet)
    const jsFiles = Array.from(jsFilesSet)
    const keepFiles = Array.from(keepFilesSet)

    log(`Identified ${cssFiles.length} CSS and ${jsFiles.length} JS files to merge. Keeping ${keepFiles.length} files as-is.`)

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
          error(`Failed to read CSS file: ${file}`)
        }
      }
      const output = new CleanCSS({ level: 1, rebase: false }).minify(rawCss)
      finalCss = output.styles
      if (finalCss.includes('@font-face')) {
        finalCss = finalCss.replace(/@font-face\s*{([^}]+)}/g, (match, contents) => {
          return contents.includes('font-display') ? 
            `@font-face{${contents.replace(/font-display\s*:\s*([^;]+)/, 'font-display:swap')}}` : 
            `@font-face{font-display:swap;${contents}}`
        })
      }
      if (!argv.dryRun) await fs.writeFile(path.join(DIST_DIR, 'styles.min.css'), finalCss)
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
          error(`Failed to read JS file: ${file}`)
        }
      }
      try {
        const result = await terserMinify(combinedJs, {
          compress: { drop_console: true, drop_debugger: true },
          mangle: true,
        })
        if (result.code && !argv.dryRun) await fs.writeFile(path.join(DIST_DIR, 'scripts.min.js'), result.code)
      } catch (/** @type {any} */ e) {
        error(`Terser Minification Failed: ${e.message}`)
      }
    }

    // 6. Update HTML References and Minify
    log('Updating HTML references and applying final minification...')
    for (const file of htmlFiles) {
      const originalHtml = await fs.readFile(file, 'utf8')
      const $page = cheerio.load(originalHtml)
      let modified = false

      // Update CSS
      if (cssFiles.length > 0) {
        const cssLinks = $page('link[rel="stylesheet"], link[rel="preload"][as="style"]').filter((i, el) => {
          const href = $page(el).attr('href')
          if (!href || $page(el).attr('data-merge') === 'false') return false
          const resolved = resolvePath(href, file, SITE_DIR)
          return cssFiles.includes(resolved)
        })
        if (cssLinks.length > 0) {
          cssLinks.first().before(`<link rel="stylesheet" href="/assets/dist/styles.min.css">`)
          cssLinks.remove()
          modified = true
        }
      }

      // Update JS
      if (jsFiles.length > 0) {
        const jsScripts = $page('script[src]').filter((i, el) => {
          const src = $page(el).attr('src')
          if (!src || $page(el).attr('data-merge') === 'false') return false
          const resolved = resolvePath(src, file, SITE_DIR)
          return jsFiles.includes(resolved) || src.includes('scripts.min.js')
        })
        if (jsScripts.length > 0) {
          jsScripts.last().after('<script defer src="/assets/dist/scripts.min.js"></script>')
          jsScripts.remove()
          modified = true
        }
      }

      // GTM Fix
      const gtmScripts = $page('script:not([src])').filter((i, el) => {
        const content = $page(el).html()
        return !!(content && (content.includes('gtm.start') || content.includes('GTM-')))
      })
      if (gtmScripts.length > 0) {
        gtmScripts.each((i, el) => {
          let content = $page(el).html() || ''
          content = content.replace(/['"]https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=['"]/g, "'https://www.google' + 'tagmanager.com/gtm.js?id='")
          const lazyGTM = `<script>let gtmFired=false;function fireGTM(){if(gtmFired)return;gtmFired=true;${content}}['scroll','mousemove','touchstart','keydown'].forEach(e=>document.addEventListener(e,fireGTM,{passive:true,once:true}));if(window.requestIdleCallback)window.requestIdleCallback(()=>setTimeout(fireGTM,3000));else setTimeout(fireGTM,3500);</script>`
          $page('body').append('\n' + lazyGTM + '\n')
          $page(el).remove()
        })
        modified = true
      }

      if (!argv.dryRun) {
        try {
          const minified = await htmlMinify($page.html(), {
            collapseWhitespace: true,
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
          })
          await fs.writeFile(file, minified)
        } catch (/** @type {any} */ e) {
          await fs.writeFile(file, $page.html())
        }
      }
    }

    // 7. Surgical Cleanup
    log('Cleaning up consolidated assets...')
    let deletedCount = 0
    // Only delete files that were actually merged and aren't in the keep list
    const filesToDelete = [...cssFiles, ...jsFiles].filter(f => !keepFilesSet.has(f))
    
    for (const file of filesToDelete) {
      const sidecars = [file, `${file}.br`, `${file}.gz`, `${file}.zst`]
      for (const sidecar of sidecars) {
        if (fs.existsSync(sidecar)) {
          try {
            if (!argv.dryRun) await fs.unlink(sidecar)
            deletedCount++
          } catch (/** @type {any} */ e) {}
        }
      }
    }

    log(`Removed ${deletedCount} merged asset files.`)
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
  return !url.match(/^https?:\/\//) && !url.match(/^\/\//)
}

/**
 * @param {string} url
 * @param {string} sourceFile
 * @param {string} siteDir
 * @returns {string}
 */
function resolvePath(url, sourceFile, siteDir) {
  let cleanUrl = url.split('?')[0]
  return cleanUrl.startsWith('/') ? path.join(siteDir, cleanUrl) : path.join(path.dirname(sourceFile), cleanUrl)
}

main()
