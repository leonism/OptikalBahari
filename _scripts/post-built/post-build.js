/**
 * Post-Build Optimization Script
 * Updated to resolve TypeScript/JSDoc type checking warnings
 */

const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')
const crypto = require('crypto')
const glob = require('glob')

// Constants
const SITE_DIR = '_site'
const SCRIPTS_DIR = '_scripts/post-built'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * @param {string} packageName
 * @returns {boolean}
 */
function isPackageAvailable(packageName) {
  try {
    require.resolve(packageName)
    return true
  } catch {
    return false
  }
}

/**
 * @param {string} scriptName
 * @returns {boolean}
 */
function scriptExists(scriptName) {
  return fs.existsSync(path.join(SCRIPTS_DIR, scriptName))
}

/**
 * @param {string} command
 * @returns {boolean}
 */
function isCommandAvailable(command) {
  try {
    execSync(command, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * @param {string} command
 * @param {string} description
 * @returns {boolean}
 */
function runCommand(command, description) {
  try {
    console.log(`  Running: ${description}...`)
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (/** @type {any} */ error) {
    console.error(`  ❌ Error in ${description}: ${error.message}`)
    return false
  }
}

// ============================================================================
// OPTIMIZATION STEPS
// ============================================================================

/**
 * Step 1: PurgeCSS
 */
async function runPurgeCSS() {
  console.log('\n📦 Step 1: PurgeCSS')
  if (!scriptExists('purge-css.js') || !isPackageAvailable('purgecss')) {
    console.log('  ⚠️  Required assets missing - skipping')
    return
  }
  try {
    const runPurgeCSS = require('./purge-css')
    await runPurgeCSS()
    console.log('  ✅ PurgeCSS completed')
  } catch (/** @type {any} */ error) {
    console.error(`  ❌ PurgeCSS failed: ${error.message}`)
  }
}

/**
 * Step 2: Critical CSS
 */
function runCriticalCSS() {
  console.log('\n📝 Step 2: Critical CSS')
  const ENABLE_CRITICAL = true

  if (!ENABLE_CRITICAL) {
    console.log('  ℹ️  Critical CSS deactivated - skipping')
    return
  }

  if (!scriptExists('critical-css.js') || !isPackageAvailable('critical')) {
    console.log('  ⚠️  Critical CSS assets missing - skipping')
    return
  }

  try {
    runCommand('node _scripts/post-built/critical-css.js', 'Critical CSS extraction')
  } catch (/** @type {any} */ error) {
    console.log('  ⚠️  Critical CSS failed but continuing: ' + error.message)
  }
}

/**
 * Step 3: Service Worker
 */
function runServiceWorker() {
  console.log('\n⚙️  Step 3: Service Worker')
  if (!scriptExists('generate-sw.js') || !isPackageAvailable('workbox-build')) {
    return
  }
  runCommand('node _scripts/post-built/generate-sw.js', 'Service worker generation')
}

/**
 * Step 4: Image Optimization
 */
function runImageOptimization() {
  console.log('\n🖼️  Step 4: Image Optimization')
  if (!isCommandAvailable('cwebp -version')) return
  try {
    const images = glob.sync(`${SITE_DIR}/**/*.{jpg,jpeg,png}`)
    for (const img of images) {
      const webp = img.replace(/\.(jpg|jpeg|png)$/, '.webp')
      if (fs.existsSync(webp)) continue
      try {
        execSync(`cwebp -q 85 "${img}" -o "${webp}"`, { stdio: 'ignore' })
      } catch (e) {}
    }
  } catch (/** @type {any} */ error) {
    console.error(`  ❌ Image optimization failed: ${error.message}`)
  }
}

/**
 * Step 5: Asset Consolidation
 */
function runAssetConsolidation() {
  console.log('\n📦 Step 5: Asset Consolidation')
  if (!scriptExists('consolidate-assets.js')) return
  runCommand('node _scripts/post-built/consolidate-assets.js', 'Asset consolidation')
}

/**
 * Step 6: SRI Hashes
 */
function generateSRIHashes() {
  console.log('\n🔐 Step 6: SRI Hashes')
  try {
    const assets = glob.sync(`${SITE_DIR}/**/*.{css,js}`)
    const integrityFile = path.join(SITE_DIR, 'integrity.txt')
    fs.ensureDirSync(path.dirname(integrityFile))
    fs.writeFileSync(integrityFile, '')
    for (const file of assets) {
      const content = fs.readFileSync(file)
      const hash = crypto.createHash('sha384').update(content).digest('base64')
      const relativePath = path.relative(SITE_DIR, file)
      fs.appendFileSync(integrityFile, `${relativePath}: sha384-${hash}\n`)
    }
  } catch (/** @type {any} */ error) {
    console.error(`  ❌ SRI hash generation failed: ${error.message}`)
    process.exit(1)
  }
}

/**
 * Step 7: HTML Minification
 */
function runHTMLMinification() {
  console.log('\n📄 Step 7: HTML Minification')
  if (!scriptExists('minify-html.js')) return
  runCommand('node _scripts/post-built/minify-html.js', 'HTML minification')
}

/**
 * Step 8: Asset Pre-Compression
 */
function runAssetCompression() {
  console.log('\n🗜️  Step 8: Asset Pre-Compression (.gz, .br, .zst)')
  const zlib = require('zlib')
  try {
    const textAssets = glob.sync(`${SITE_DIR}/**/*.{html,css,js,json,xml,txt,md,svg}`)
    let gzCount = 0, brCount = 0, zstCount = 0

    for (const file of textAssets) {
      if (file.endsWith('.gz') || file.endsWith('.br') || file.endsWith('.zst')) continue

      const content = fs.readFileSync(file)
      
      // Gzip
      fs.writeFileSync(`${file}.gz`, zlib.gzipSync(content, { level: 9 }))
      gzCount++
      
      // Brotli
      fs.writeFileSync(`${file}.br`, zlib.brotliCompressSync(content, { 
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } 
      }))
      brCount++
      
      // Zstd
      if (isCommandAvailable('zstd -V')) {
        try {
          execSync(`zstd -qf -19 "${file}" -o "${file}.zst"`, { stdio: 'ignore' })
          zstCount++
        } catch(e) {}
      }
    }
    console.log(`  ✅ Generated ${gzCount} Gzip & Brotli pre-compressed assets`)
    if (zstCount > 0) {
      console.log(`  ✅ Generated ${zstCount} Zstd pre-compressed assets`)
    } else {
      console.log(`  ℹ️  Zstd CLI not found; skipped individual .zst asset generation`)
    }
  } catch (/** @type {any} */ error) {
    console.error(`  ❌ Asset compression failed: ${error.message}`)
  }
}

/**
 * Step 9: Build Archiving
 */
function runArchiveGeneration() {
  console.log('\n📦 Step 9: Build Archiving (*.tar.gz, *.tar.br, *.tar.zst)')
  try {
    if (isCommandAvailable('tar --version') || isCommandAvailable('tar -c')) {
      // 1. tar.gz
      execSync(`tar -czf _site.tar.gz ${SITE_DIR}`, { stdio: 'ignore' })
      console.log(`  ✅ Generated _site.tar.gz`)

      // Intermediate uncompressed tar for deriving Brotli & Zstd
      execSync(`tar -cf _site.tar ${SITE_DIR}`, { stdio: 'ignore' })
      const tarContent = fs.readFileSync('_site.tar')
      
      // 2. tar.br
      const zlib = require('zlib')
      fs.writeFileSync('_site.tar.br', zlib.brotliCompressSync(tarContent, { 
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } 
      }))
      console.log(`  ✅ Generated _site.tar.br`)
      
      // 3. tar.zst
      if (isCommandAvailable('zstd -V')) {
        execSync(`zstd -qf -19 _site.tar -o _site.tar.zst`, { stdio: 'ignore' })
        console.log(`  ✅ Generated _site.tar.zst`)
      } else {
        console.log(`  ℹ️  Zstd CLI not found; skipped _site.tar.zst archive generation`)
      }
      
      // Cleanup
      if (fs.existsSync('_site.tar')) fs.unlinkSync('_site.tar')
    } else {
      console.log(`  ⚠️ Tar command not found. Skipping archiving.`)
    }
  } catch (/** @type {any} */ error) {
     console.error(`  ❌ Archive generation failed: ${error.message}`)
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Starting Post-Build Optimizations')
  console.log('='.repeat(60))
  const startTime = Date.now()

  runAssetConsolidation()
  await runPurgeCSS()
  runCriticalCSS()
  runServiceWorker()
  runImageOptimization()
  generateSRIHashes()
  runHTMLMinification()
  
  // NEW STEPS:
  runAssetCompression()
  runArchiveGeneration()

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Post-Build Optimizations Complete! (${duration}s)`)
}

main().catch((/** @type {any} */ error) => {
  console.error('\n❌ Fatal error during post-build:', error.message)
  process.exit(1)
})
