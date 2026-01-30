const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')
const crypto = require('crypto')
const glob = require('glob')

const SITE_DIR = '_site'

/**
 * Helper to run command safely
 * @param {string} command
 * @param {string} description
 */
function runCommand(command, description) {
  try {
    console.log(`running: ${description}...`)
    execSync(command, { stdio: 'inherit' })
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    console.error(`Error ${description}: ${error.message}`)
    // We don't exit here to allow other steps to proceed, similar to 'set +e' behavior if intended,
    // but original script had 'set -e'. However, for optional steps (checked by if exists), we might want to continue.
    // The critical/sw/consolidate scripts are conditional in the shell script.
  }
}

async function main() {
  console.log('🚀 Starting post-build optimizations...')

  // 1. Purge CSS (Before Critical and SRI)
  if (fs.existsSync('_scripts/post-built/purge-css.js')) {
    try {
      require.resolve('purgecss')
      const runPurgeCSS = require('./purge-css')
      await runPurgeCSS()
    } catch (e) {
      console.log('⚠️ PurgeCSS skipped (purgecss package not found)')
    }
  } else {
    console.log('⚠️ PurgeCSS skipped (script not found)')
  }

  // 2. Critical CSS
  if (fs.existsSync('_scripts/post-built/critical-css.js')) {
    try {
      require.resolve('critical')
      console.log('📝 Extracting critical CSS...')
      runCommand('node _scripts/post-built/critical-css.js', 'Critical CSS extraction')
    } catch (e) {
      console.log('⚠️ Critical CSS extraction skipped (critical package not found)')
    }
  } else {
    console.log('⚠️ Critical CSS extraction skipped (script not found)')
  }

  // 3. Service Worker
  if (fs.existsSync('_scripts/post-built/generate-sw.js')) {
    try {
      require.resolve('workbox-build')
      console.log('⚙️ Generating service worker...')
      runCommand('node _scripts/post-built/generate-sw.js', 'Service worker generation')
    } catch (e) {
      console.log('⚠️ Service worker generation skipped (workbox-build package not found)')
    }
  } else {
    console.log('⚠️ Service worker generation skipped (script not found)')
  }

  // 4. Image Optimization
  console.log('🖼️ Optimizing images...')
  let cwebpAvailable = false
  try {
    execSync('cwebp -version', { stdio: 'ignore' })
    cwebpAvailable = true
  } catch (e) {
    console.log('⚠️ WebP conversion skipped (cwebp not installed)')
  }

  if (cwebpAvailable) {
    try {
      const images = glob.sync(`${SITE_DIR}/**/*.{jpg,jpeg,png}`)
      let convertedCount = 0
      for (const img of images) {
        const webp = img.replace(/\.(jpg|jpeg|png)$/, '.webp')
        if (!fs.existsSync(webp)) {
          try {
            execSync(`cwebp -q 85 "${img}" -o "${webp}"`, { stdio: 'ignore' })
            convertedCount++
          } catch (err) {
            console.error(`Failed to convert ${img}`)
          }
        }
      }
      console.log(`Converted ${convertedCount} images to WebP.`)
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      console.error(`Error during image optimization: ${error.message}`)
    }
  }

  // 5. Asset Consolidation
  if (fs.existsSync('_scripts/post-built/consolidate-assets.js')) {
    console.log('📦 Consolidating assets...')
    runCommand('node _scripts/post-built/consolidate-assets.js', 'Asset consolidation')
  } else {
    console.log('⚠️ Asset consolidation skipped (script not found)')
  }

  // 6. Security Headers
  console.log('🔒 Adding security headers...')
  try {
    const htmlFiles = glob.sync(`${SITE_DIR}/**/*.html`)
    const headers = '<head><meta http-equiv="X-Content-Type-Options" content="nosniff"><meta http-equiv="X-Frame-Options" content="DENY"><meta http-equiv="X-XSS-Protection" content="1; mode=block">'

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8')
      if (content.includes('<head>')) {
        const newContent = content.replace('<head>', headers)
        fs.writeFileSync(file, newContent)
      }
    }
    console.log(`Updated security headers in ${htmlFiles.length} files.`)
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    console.error(`Error adding security headers: ${error.message}`)
    process.exit(1) // Critical failure
  }

  // 7. SRI Hashes
  console.log('🔐 Generating SRI hashes...')
  try {
    const assets = glob.sync(`${SITE_DIR}/**/*.{css,js}`)
    const integrityFile = path.join(SITE_DIR, 'integrity.txt')

    // Ensure file exists (or clear it if we want fresh start, but append is safer if multiple passes)
    // We will append to match original script logic, but original script logic might be appending duplicates if run twice.
    // Let's ensure directory exists.
    fs.ensureDirSync(path.dirname(integrityFile))

    // To match original script exactly:
    // find _site -name "*.css" -o -name "*.js" | while read file; do ... >> ... done
    // It appends.

    for (const file of assets) {
      const content = fs.readFileSync(file)
      const hash = crypto.createHash('sha384').update(content).digest('base64')
      const relativePath = path.relative(SITE_DIR, file)
      const line = `${relativePath}: sha384-${hash}\n`
      fs.appendFileSync(integrityFile, line)
    }
    console.log(`Generated SRI hashes for ${assets.length} assets.`)
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    console.error(`Error generating SRI hashes: ${error.message}`)
    process.exit(1) // Critical failure
  }

  // 8. HTML Minification
  if (fs.existsSync('_scripts/post-built/minify-html.js')) {
    console.log('📄 Minifying HTML...')
    runCommand('node _scripts/post-built/minify-html.js', 'HTML Minification')
  } else {
    console.log('⚠️ HTML Minification skipped (script not found)')
  }

  console.log('✅ Post-build optimizations complete!')
}

main()
