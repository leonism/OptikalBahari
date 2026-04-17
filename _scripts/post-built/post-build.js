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
  console.log(`\n${colors.yellow}📦 Step 1/3: Asset Consolidation${colors.reset}`)
  if (!scriptExists('consolidate-assets.js')) return
  runCommand(`node ${path.join(SCRIPTS_DIR, 'consolidate-assets.js')}`, 'Asset consolidation')
}

async function runPurgeCSS() {
  console.log(`\n${colors.yellow}🧹 Step 2/3: Purge Unused CSS${colors.reset}`)
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
  console.log(`\n${colors.yellow}🗜️  Step 3/3: Asset Compression (.br, .zst)${colors.reset}`)
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
      const chunkSize = 50; // Smaller chunk size for better reliability
      for (let i = 0; i < total; i += chunkSize) {
        const chunk = textAssets.slice(i, i + chunkSize);
        const validAssets = chunk.filter(f => !f.endsWith('.br') && !f.endsWith('.zst'));
        if (validAssets.length === 0) continue;
        
        try {
          const args = validAssets.map(f => `"${f}"`).join(' ');
          // Added --no-progress to keep logs clean, -19 for max compression
          execSync(`zstd -qf -19 -T0 --no-progress ${args}`, { stdio: 'ignore' });
          zstCount += validAssets.length;
        } catch (e) {
          // Fallback to individual compression if batch fails
          for (const asset of validAssets) {
            try {
              execSync(`zstd -qf -19 -T0 --no-progress "${asset}"`, { stdio: 'ignore' });
              zstCount++;
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
        if (file.endsWith('.br') || file.endsWith('.zst')) {
          current++;
          return;
        }
        
        try {
          const content = await fs.readFile(file)
          const compressed = await brotliCompress(content, { 
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } // Level 9 is faster but still great
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
  
  // 3. Compress final files into formats natively requested by CF and high-end clients
  await runAssetCompression()

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('\n' + colors.dim + '='.repeat(60) + colors.reset)
  console.log(`${colors.green}🎉 Post-Build Optimizations Complete! (${duration}s)${colors.reset}\n`)
}

main().catch((/** @type {any} */ error) => {
  console.error(`\n${colors.red}❌ Fatal error during post-build: ${error.message}${colors.reset}`)
  process.exit(1)
})
