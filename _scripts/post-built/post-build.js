/**
 * Post-Build Optimization Script
 *
 * This script runs after Jekyll builds the site to apply various optimizations:
 * 1. PurgeCSS - Remove unused CSS
 * 2. Critical CSS - Inline critical CSS for faster rendering
 * 3. Service Worker - Generate PWA service worker
 * 4. Image Optimization - Convert images to WebP format
 * 5. Asset Consolidation - Bundle and optimize assets
 * 6. SRI Hashes - Generate Subresource Integrity hashes
 * 7. HTML Minification - Minify HTML files
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
 * Check if a Node.js package is available
 * @param {string} packageName - Name of the package to check
 * @returns {boolean} True if package is installed
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
 * Check if a script file exists
 * @param {string} scriptName - Name of the script file
 * @returns {boolean} True if script exists
 */
function scriptExists(scriptName) {
  return fs.existsSync(path.join(SCRIPTS_DIR, scriptName))
}

/**
 * Check if a system command is available
 * @param {string} command - Command to check (e.g., 'cwebp -version')
 * @returns {boolean} True if command is available
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
 * Run a shell command safely with error handling
 * @param {string} command - Command to execute
 * @param {string} description - Human-readable description for logging
 * @returns {boolean} True if command succeeded
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
 * Step 1: PurgeCSS - Remove unused CSS to reduce file size
 */
async function runPurgeCSS() {
  console.log('\n📦 Step 1: PurgeCSS')

  if (!scriptExists('purge-css.js')) {
    console.log('  ⚠️  Script not found - skipping')
    return
  }

  if (!isPackageAvailable('purgecss')) {
    console.log('  ⚠️  purgecss package not installed - skipping')
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
 * Step 2: Critical CSS - Extract and inline critical CSS for faster rendering
 */
function runCriticalCSS() {
  console.log('\n📝 Step 2: Critical CSS')

  if (!scriptExists('critical-css.js')) {
    console.log('  ⚠️  Script not found - skipping')
    return
  }

  if (!isPackageAvailable('critical')) {
    console.log('  ⚠️  critical package not installed - skipping')
    return
  }

  const success = runCommand('node _scripts/post-built/critical-css.js', 'Critical CSS extraction')
  if (success) {
    console.log('  ✅ Critical CSS completed')
  }
}

/**
 * Step 3: Service Worker - Generate PWA service worker for offline support
 */
function runServiceWorker() {
  console.log('\n⚙️  Step 3: Service Worker')

  if (!scriptExists('generate-sw.js')) {
    console.log('  ⚠️  Script not found - skipping')
    return
  }

  if (!isPackageAvailable('workbox-build')) {
    console.log('  ⚠️  workbox-build package not installed - skipping')
    return
  }

  const success = runCommand('node _scripts/post-built/generate-sw.js', 'Service worker generation')
  if (success) {
    console.log('  ✅ Service Worker completed')
  }
}

/**
 * Step 4: Image Optimization - Convert images to WebP format
 * Note: Cloudinary handles this automatically for remote images
 */
function runImageOptimization() {
  console.log('\n🖼️  Step 4: Image Optimization')

  // Check if cwebp is available
  if (!isCommandAvailable('cwebp -version')) {
    console.log('  ℹ️  cwebp not installed - skipping (Cloudinary handles WebP automatically)')
    return
  }

  try {
    // Find all JPG and PNG images
    const images = glob.sync(`${SITE_DIR}/**/*.{jpg,jpeg,png}`)
    let convertedCount = 0

    // Convert each image to WebP if not already converted
    for (const img of images) {
      const webp = img.replace(/\.(jpg|jpeg|png)$/, '.webp')

      // Skip if WebP version already exists
      if (fs.existsSync(webp)) continue

      try {
        execSync(`cwebp -q 85 "${img}" -o "${webp}"`, { stdio: 'ignore' })
        convertedCount++
      } catch (error) {
        console.error(`  ⚠️  Failed to convert: ${path.basename(img)}`)
      }
    }

    console.log(`  ✅ Converted ${convertedCount} of ${images.length} images to WebP`)
  } catch (/** @type {any} */ error) {
    console.error(`  ❌ Image optimization failed: ${error.message}`)
  }
}

/**
 * Step 5: Asset Consolidation - Bundle and optimize CSS/JS assets
 */
function runAssetConsolidation() {
  console.log('\n📦 Step 5: Asset Consolidation')

  if (!scriptExists('consolidate-assets.js')) {
    console.log('  ⚠️  Script not found - skipping')
    return
  }

  const success = runCommand('node _scripts/post-built/consolidate-assets.js', 'Asset consolidation')
  if (success) {
    console.log('  ✅ Asset consolidation completed')
  }
}

/**
 * Step 6: SRI Hashes - Generate Subresource Integrity hashes for CSS/JS files
 * Creates integrity.txt file with SHA-384 hashes for all assets
 */
function generateSRIHashes() {
  console.log('\n🔐 Step 6: SRI Hashes')

  try {
    const assets = glob.sync(`${SITE_DIR}/**/*.{css,js}`)
    const integrityFile = path.join(SITE_DIR, 'integrity.txt')

    // Clear existing file or create new one
    fs.ensureDirSync(path.dirname(integrityFile))
    fs.writeFileSync(integrityFile, '') // Start fresh

    // Generate SHA-384 hash for each asset
    for (const file of assets) {
      const content = fs.readFileSync(file)
      const hash = crypto.createHash('sha384').update(content).digest('base64')
      const relativePath = path.relative(SITE_DIR, file)

      fs.appendFileSync(integrityFile, `${relativePath}: sha384-${hash}\n`)
    }

    console.log(`  ✅ Generated SRI hashes for ${assets.length} assets`)
  } catch (/** @type {any} */ error) {
    console.error(`  ❌ SRI hash generation failed: ${error.message}`)
    process.exit(1) // Critical failure - exit build
  }
}

/**
 * Step 7: HTML Minification - Minify HTML files to reduce file size
 */
function runHTMLMinification() {
  console.log('\n📄 Step 7: HTML Minification')

  if (!scriptExists('minify-html.js')) {
    console.log('  ⚠️  Script not found - skipping')
    return
  }

  const success = runCommand('node _scripts/post-built/minify-html.js', 'HTML minification')
  if (success) {
    console.log('  ✅ HTML minification completed')
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main function - orchestrates all post-build optimization steps
 */
async function main() {
  console.log('🚀 Starting Post-Build Optimizations')
  console.log('='.repeat(60))

  const startTime = Date.now()

  // Run all optimization steps in sequence
  await runPurgeCSS() // Step 1: Remove unused CSS
  runCriticalCSS() // Step 2: Inline critical CSS
  runServiceWorker() // Step 3: Generate service worker
  runImageOptimization() // Step 4: Convert images to WebP
  runAssetConsolidation() // Step 5: Bundle assets
  generateSRIHashes() // Step 6: Generate SRI hashes (critical)
  runHTMLMinification() // Step 7: Minify HTML

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Post-Build Optimizations Complete! (${duration}s)`)
}

// Execute main function and handle errors
main().catch((error) => {
  console.error('\n❌ Fatal error during post-build:', error.message)
  process.exit(1)
})
