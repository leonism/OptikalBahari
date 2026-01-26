const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const cheerio = require('cheerio')
const CleanCSS = require('clean-css')
const Terser = require('terser')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const argv = yargs(hideBin(process.argv))
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
const BACKUP_DIR = '_site_backup'

const log = (msg) => console.log(`[Consolidate] ${msg}`)
const debug = (msg) => argv.verbose && console.log(`[Consolidate] [DEBUG] ${msg}`)
const error = (msg) => console.error(`[Consolidate] [ERROR] ${msg}`)

async function main() {
  try {
    log('Starting asset consolidation...')

    if (argv.dryRun) {
      log('DRY RUN MODE: No files will be modified.')
    }

    // 1. Prepare Directories
    if (!argv.dryRun) {
      await fs.ensureDir(DIST_DIR)
      await fs.ensureDir(BACKUP_DIR)
    }

    // 2. Find HTML Files
    const htmlFiles = glob.sync(`${SITE_DIR}/**/*.html`)
    if (htmlFiles.length === 0) {
      log('No HTML files found. Exiting.')
      return
    }
    log(`Found ${htmlFiles.length} HTML files.`)

    // 3. Analyze Assets from index.html (Source of Truth for ordering)
    // We assume index.html contains the superset/standard set of assets.
    const indexFile = htmlFiles.find((f) => f.endsWith('index.html')) || htmlFiles[0]
    log(`Using ${indexFile} as the reference for asset discovery.`)

    const indexContent = await fs.readFile(indexFile, 'utf8')
    const $ = cheerio.load(indexContent)

    const cssFiles = []
    const jsFiles = []

    // Find CSS
    $('link[rel="stylesheet"], link[rel="preload"][as="style"]').each((i, el) => {
      const href = $(el).attr('href')
      if (href && isLocalAsset(href)) {
        const resolved = resolvePath(href)
        // Avoid duplicates
        if (!cssFiles.includes(resolved)) {
          cssFiles.push(resolved)
        }
      }
    })

    // Also check noscript tags for stylesheets not present elsewhere (edge case)
    $('noscript').each((i, el) => {
      const $noscript = cheerio.load($(el).html())
      $noscript('link[rel="stylesheet"]').each((j, link) => {
        const href = $(link).attr('href')
        if (href && isLocalAsset(href)) {
          const resolved = resolvePath(href)
          if (!cssFiles.includes(resolved)) {
            cssFiles.push(resolved)
          }
        }
      })
    })

    // Find JS
    $('script[src]').each((i, el) => {
      const src = $(el).attr('src')
      if (src && isLocalAsset(src)) {
        jsFiles.push(resolvePath(src))
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
          rawCss += content + '\n'
        } catch (e) {
          error(`Failed to read CSS file: ${file} - ${e.message}`)
        }
      }

      const output = new CleanCSS({}).minify(rawCss)
      if (output.errors.length > 0) {
        output.errors.forEach((e) => error(`CleanCSS Error: ${e}`))
      }
      if (output.warnings.length > 0) {
        output.warnings.forEach((w) => debug(`CleanCSS Warning: ${w}`))
      }
      finalCss = output.styles

      if (!argv.dryRun) {
        await fs.writeFile(path.join(DIST_DIR, 'styles.min.css'), finalCss)
        log(`Written styles.min.css to ${DIST_DIR}`)
      }
    }

    // 5. Process JS
    if (jsFiles.length > 0) {
      log('Merging and minifying JS...')
      let rawJs = {} // Terser expects an object for source maps if we wanted them, but string works too usually.
      // Actually Terser.minify takes string or object.
      // To preserve order, we concatenate first.
      let combinedJs = ''
      for (const file of jsFiles) {
        try {
          const content = await fs.readFile(file, 'utf8')
          combinedJs += content + ';\n' // Add semicolon to prevent concatenation issues
        } catch (e) {
          error(`Failed to read JS file: ${file} - ${e.message}`)
        }
      }

      try {
        const result = await Terser.minify(combinedJs, { compress: true, mangle: true })
        if (result.error) throw result.error

        if (!argv.dryRun) {
          await fs.writeFile(path.join(DIST_DIR, 'scripts.min.js'), result.code)
          log(`Written scripts.min.js to ${DIST_DIR}`)
        }
      } catch (e) {
        error(`Terser Minification Failed: ${e.message}`)
      }
    }

    // 6. Update HTML Files
    log('Updating HTML references...')

    for (const file of htmlFiles) {
      const originalHtml = await fs.readFile(file, 'utf8')

      // Backup
      if (!argv.dryRun) {
        const backupPath = path.join(BACKUP_DIR, path.relative(SITE_DIR, file))
        await fs.ensureDir(path.dirname(backupPath))
        await fs.writeFile(backupPath, originalHtml)
      }

      const $page = cheerio.load(originalHtml)
      let modified = false

      // Replace CSS
      // Strategy: Remove all matched CSS links, insert the new one at the position of the first one found.
      if (cssFiles.length > 0) {
        let firstCssIndex = -1
        let parent = null

        // Find all matching links (stylesheet and preload)
        const cssLinks = $page('link[rel="stylesheet"], link[rel="preload"][as="style"]').filter((i, el) => {
          const href = $page(el).attr('href')
          return href && cssFiles.includes(resolvePath(href))
        })

        // Also find noscript tags containing these links
        const noscriptsToRemove = []
        $page('noscript').each((i, el) => {
          const html = $page(el).html()
          // Simple check: if the noscript contains any of the bundled filenames
          // This is a bit loose but efficient.
          // Better: check if it contains hrefs to the files.
          let hasBundled = false
          for (const cssFile of cssFiles) {
            const filename = path.basename(cssFile)
            if (html.includes(filename)) {
              hasBundled = true
              break
            }
          }
          if (hasBundled) {
            noscriptsToRemove.push(el)
          }
        })

        if (cssLinks.length > 0) {
          // Insert new link before the first occurrence
          const firstLink = cssLinks.first()

          // Use standard blocking load for robustness, or maintain preload pattern?
          // User asked for "single tags pointing to the new minified files".
          // Standard link is safest for a bundle.
          firstLink.before('<link rel="stylesheet" href="/assets/dist/styles.min.css">')

          cssLinks.remove()

          // Remove associated noscript tags as we are using a standard link now (works without JS)
          $(noscriptsToRemove).remove()

          modified = true
        }
      }

      // Replace JS
      if (jsFiles.length > 0) {
        const jsScripts = $page('script[src]').filter((i, el) => {
          const src = $page(el).attr('src')
          return src && jsFiles.includes(resolvePath(src))
        })

        if (jsScripts.length > 0) {
          // Check for defer/async on the first script to preserve loading behavior?
          // The user's scripts usually have defer. We should apply defer.
          const lastScript = jsScripts.last() // Usually scripts are at the bottom.
          // If we put it where the last one was, we ensure DOM is ready if they relied on position.
          // But if they had `defer`, position doesn't matter much.
          // Let's replace the *last* script with the bundle, and remove others.

          lastScript.after('<script defer src="/assets/dist/scripts.min.js"></script>')
          jsScripts.remove()
          modified = true
        }
      }

      if (modified && !argv.dryRun) {
        await fs.writeFile(file, $page.html())
        debug(`Updated ${file}`)
      }
    }

    log('Consolidation complete.')
  } catch (e) {
    error(`Fatal Error: ${e.stack}`)
    process.exit(1)
  }
}

function isLocalAsset(url) {
  // Check if url starts with /assets/ or assets/ or ./assets/
  // Ignore http/https
  if (url.match(/^https?:\/\//)) return false
  if (url.match(/^\/\//)) return false // Protocol-relative
  return true
}

function resolvePath(url) {
  // Convert URL to filesystem path in _site
  // Remove query params
  let cleanUrl = url.split('?')[0]

  if (cleanUrl.startsWith('/')) {
    return path.join(SITE_DIR, cleanUrl)
  } else {
    // Relative path? Assuming root relative for simplicity as Jekyll typically generates /assets/...
    // If it's "assets/...", it's relative to current page.
    // This is tricky. But most Jekyll themes use absolute paths /assets/...
    return path.join(SITE_DIR, cleanUrl)
  }
}

main()
