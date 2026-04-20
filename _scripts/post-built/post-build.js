/**
 * Post-Build Optimization Script
 * Refactored to only focus on essential pipelines: Consolidation -> Purge CSS -> Compression
 */

const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')
const zlib = require('zlib')
const { promisify } = require('util')
const glob = require('glob')
const crypto = require('crypto')

// Constants
const SITE_DIR = '_site'
const SCRIPTS_DIR = '_scripts/post-built'

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m'
}

/**
 * Displays a colorful CLI progress bar
 * @param {number} current
 * @param {number} total
 * @param {string} taskName
 */
function printProgress(current, total, taskName) {
  const width = 30;
  const percentage = Math.floor((current / total) * 100);
  const filled = Math.floor((width * current) / total);
  const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled));
  
  process.stdout.write(`\r  ${colors.magenta}[${bar}]${colors.reset} ${colors.cyan}${percentage}%${colors.reset} | ${colors.dim}${taskName}${colors.reset}`);
  if (current === total) {
    process.stdout.write('\n');
  }
}

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
    console.log(`  ${colors.dim}Running: ${description}...${colors.reset}`)
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (/** @type {any} */ error) {
    console.error(`  ${colors.red}❌ Error in ${description}: ${error.message}${colors.reset}`)
    return false
  }
}

// ============================================================================
// OPTIMIZATION STEPS
// ============================================================================

function runAssetConsolidation() {
  console.log(`\n${colors.yellow}📦 Step 1/4: Asset Consolidation${colors.reset}`)
  if (!scriptExists('consolidate-assets.js')) return
  runCommand(`node ${path.join(SCRIPTS_DIR, 'consolidate-assets.js')}`, 'Asset consolidation')
}

async function runPurgeCSS() {
  console.log(`\n${colors.yellow}🧹 Step 2/4: Purge Unused CSS${colors.reset}`)
  if (!scriptExists('purge-css.js') || !isPackageAvailable('purgecss')) {
    console.log(`  ${colors.red}⚠️  Required assets missing - skipping${colors.reset}`)
    return
  }
  try {
    const runPurgeCSS = require('./purge-css')
    await runPurgeCSS()
    console.log(`  ${colors.green}✅ PurgeCSS completed${colors.reset}`)
  } catch (/** @type {any} */ error) {
    console.error(`  ${colors.red}❌ PurgeCSS failed: ${error.message}${colors.reset}`)
  }
}

async function runAssetCompression() {
  console.log(`\n${colors.yellow}🗜️  Step 4/4: Asset Compression (.br, .zst)${colors.reset}`)
  const brotliCompress = promisify(zlib.brotliCompress)

  try {
    // Only compress HTML, CSS, JS, SVG, XML (avoid JSON to reduce build time)
    const textAssets = glob.sync(`${SITE_DIR}/**/*.{html,css,js,xml,svg}`)
    let brCount = 0, zstCount = 0
    let current = 0
    const total = textAssets.length

    if (total === 0) {
      console.log(`  ${colors.dim}No assets found to compress.${colors.reset}`)
      return
    }

    if (isCommandAvailable('zstd -V')) {
      console.log(`  ${colors.dim}Running Zstd compression...${colors.reset}`)
      const chunkSize = 50; 
      for (let i = 0; i < total; i += chunkSize) {
        const chunk = textAssets.slice(i, i + chunkSize);
        // CRITICAL FIX: Only compress if file still exists (consolidation might have deleted it)
        const validAssets = chunk.filter(f => fs.existsSync(f) && !f.endsWith('.br') && !f.endsWith('.zst'));
        if (validAssets.length === 0) continue;
        
        try {
          const args = validAssets.map(f => `"${f}"`).join(' ');
          execSync(`zstd -qf -19 -T0 --no-progress ${args}`, { stdio: 'ignore' });
          zstCount += validAssets.length;
        } catch (e) {
          for (const asset of validAssets) {
            try {
              if (fs.existsSync(asset)) {
                execSync(`zstd -qf -19 -T0 --no-progress "${asset}"`, { stdio: 'ignore' });
                zstCount++;
              }
            } catch (err) {}
          }
        }
        printProgress(i + chunk.length, total, `Zstd compressing...`);
      }
    }

    console.log(`  ${colors.dim}Running Brotli compression concurrently...${colors.reset}`)
    const concurrency = 50;
    for (let i = 0; i < total; i += concurrency) {
      const chunk = textAssets.slice(i, i + concurrency);
      
      await Promise.all(chunk.map(async (file) => {
        // CRITICAL FIX: Only compress if file still exists
        if (!fs.existsSync(file) || file.endsWith('.br') || file.endsWith('.zst')) {
          current++;
          return;
        }
        
        try {
          const content = await fs.readFile(file)
          const compressed = await brotliCompress(content, { 
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } // Max quality for production
          })
          await fs.writeFile(`${file}.br`, compressed)
          brCount++
        } catch(e) {}
        current++;
        printProgress(current, total, `Compressing files...`)
      }));
    }

    console.log(`  ${colors.green}✅ Generated ${brCount} Brotli assets${colors.reset}`)
    if (zstCount > 0) {
      console.log(`  ${colors.green}✅ Generated ${zstCount} Zstd assets${colors.reset}`)
    }
  } catch (/** @type {any} */ error) {
    console.error(`  ${colors.red}❌ Asset compression failed: ${error.message}${colors.reset}`)
  }
}

async function runCacheBusting() {
  console.log(`\n${colors.yellow}🔗 Step 3/4: Cache Busting (Hashing)${colors.reset}`)
  const distDir = path.join(SITE_DIR, 'assets', 'dist')
  if (!fs.existsSync(distDir)) {
    console.log(`  ${colors.dim}No dist directory found, skipping hashing.${colors.reset}`)
    return
  }

  const assets = glob.sync(`${distDir}/**/*.{css,js}`)
  /** @type {Record<string, string>} */
  const manifest = {}

  for (const asset of assets) {
    // Skip already hashed files if this runs multiple times
    const ext = path.extname(asset)
    const base = path.basename(asset, ext)
    if (base.match(/\.[a-f0-9]{10}$/)) continue
    
    try {
      const content = fs.readFileSync(asset)
      const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 10)
      
      const newName = `${base}.${hash}${ext}`
      const newPath = path.join(distDir, newName)
      
      fs.renameSync(asset, newPath)
      
      const oldPublicPath = `/assets/dist/${path.basename(asset)}`
      const newPublicPath = `/assets/dist/${newName}`
      manifest[oldPublicPath] = newPublicPath
      console.log(`  ${colors.dim}Hashed: ${path.basename(asset)} -> ${newName}${colors.reset}`)
    } catch (/** @type {any} */ e) {
      console.error(`  ${colors.red}❌ Failed to hash ${asset}: ${e.message}${colors.reset}`)
    }
  }

  if (Object.keys(manifest).length === 0) {
    console.log(`  ${colors.dim}No new assets to hash.${colors.reset}`)
    return
  }

  const htmlFiles = glob.sync(`${SITE_DIR}/**/*.html`)
  console.log(`  ${colors.dim}Updating references in ${htmlFiles.length} HTML files...${colors.reset}`)
  
  let updatedCount = 0
  for (const file of htmlFiles) {
    try {
      let content = fs.readFileSync(file, 'utf8')
      let changed = false
      for (const [oldPath, newPath] of Object.entries(manifest)) {
        if (content.includes(oldPath)) {
          // Use regex to replace to ensure we only replace the exact path
          const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          content = content.replace(new RegExp(escapedOldPath, 'g'), newPath)
          changed = true
        }
      }
      if (changed) {
        fs.writeFileSync(file, content)
        updatedCount++
      }
    } catch (/** @type {any} */ e) {}
  }
  console.log(`  ${colors.green}✅ Cache busting complete (${updatedCount} HTML files updated)${colors.reset}`)
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🚀 Starting Post-Build Optimizations${colors.reset}`)
  console.log(colors.dim + '='.repeat(60) + colors.reset)
  const startTime = Date.now()

  // 1. Combine JS/CSS first so we apply PurgeCSS accurately to the combined CSS.
  runAssetConsolidation()
  
  // 2. Run PurgeCSS on the final styles.min.css only
  await runPurgeCSS()
  
  // 3. Hash files for cache busting
  await runCacheBusting()
  
  // 4. Compress final files into formats natively requested by CF and high-end clients
  await runAssetCompression()

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('\n' + colors.dim + '='.repeat(60) + colors.reset)
  console.log(`${colors.green}🎉 Post-Build Optimizations Complete! (${duration}s)${colors.reset}\n`)
}

main().catch((/** @type {any} */ error) => {
  console.error(`\n${colors.red}❌ Fatal error during post-build: ${error.message}${colors.reset}`)
  process.exit(1)
})
