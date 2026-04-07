/**
 * Font Subsetting Script
 *
 * Scans all HTML/JS in _site to find every Font Awesome icon class
 * actually referenced, then uses pyftsubset (fonttools) to carve out
 * a minimal woff2 that contains only those glyphs.
 *
 * Requires: pip install fonttools brotli  (one-time)
 * Safety:   original files are left untouched; subsetted files are
 *           placed next to them with a ".subset.woff2" suffix, then
 *           atomically renamed to replace the originals.
 */

'use strict'

const fs = require('fs-extra')
const path = require('path')
const { execSync, spawnSync } = require('child_process')
const { glob } = require('glob')

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SITE_DIR = '_site'
const SOURCE_WEBFONTS = 'assets/vendor/fontawesome-free-7.1.0-web/webfonts'
const DIST_WEBFONTS = path.join(SITE_DIR, 'assets/vendor/fontawesome-free-7.1.0-web/webfonts')

// Map from FontAwesome CSS class prefix  →  Unicode range heuristic
// FA7 switched from :before{content:"\f111"} to CSS custom props {--fa:"\f111"}
// All icon definitions are in the all.min.css file (solid, brands, regular combined).
const FA_CSS = {
  all: path.join(SITE_DIR, 'assets/vendor/fontawesome-free-7.1.0-web/css/all.min.css'),
}

const FONT_FILES = {
  solid: 'fa-solid-900',
  brands: 'fa-brands-400',
  regular: 'fa-regular-400',
}

// Brand icon names (will be mapped to fa-brands-400 font file)
const BRAND_ICONS = new Set([
  'facebook', 'facebook-f', 'facebook-square', 'instagram', 'instagram-square',
  'twitter', 'twitter-square', 'x-twitter', 'youtube', 'youtube-square',
  'pinterest', 'pinterest-p', 'pinterest-square', 'google', 'google-plus',
  'linkedin', 'linkedin-in', 'github', 'github-square', 'tiktok', 'whatsapp',
  'telegram', 'reddit', 'reddit-square', 'snapchat', 'vimeo', 'vimeo-square',
])

// Always include these glyphs even if not found via scanning
// (safety net for dynamically injected icons + FA4/FA5 alias names)
// Solid icons used on this site and their Unicode codepoints:
//   f002=search/magnifying-glass, f00d=times/xmark, f053=chevron-left, f054=chevron-right
//   f078=chevron-down, f0a9=circle-arrow-right, f0b0=filter, f111=circle, f185=sun
//   f186=moon, f274=calendar-check, f2a8=low-vision, f3c5=map-marker-alt
//   f58a=calendar-day (actually f783), f783=calendar-day
//   f00d=times(alias), e06c=triangle-exclamation (FA6 free range)
//   f06e=eye, f00e=search-plus, f005=star, f07b=folder
//   f058=circle-check, f015=home
const ALWAYS_INCLUDE = {
  solid: [
    'f002', // magnifying-glass (search)
    'f00d', // xmark (times)
    'f053', // chevron-left
    'f054', // chevron-right
    'f078', // chevron-down
    'f0a9', // circle-arrow-right
    'f0b0', // filter
    'f058', // circle-check
    'f111', // circle
    'f185', // sun
    'f186', // moon
    'f274', // calendar-check
    'f2a8', // low-vision
    'f3c5', // location-pin (map-marker-alt)
    'f783', // calendar-day
    'f06e', // eye
    'f005', // star
    'f071', // triangle-exclamation (FA5 name)
    'f015', // home
    'e06c', // triangle-exclamation (FA6+ PUA range)
    'f508', // glasses
    'f084', // key
    'f4fc', // user-glasses
  ],
  brands: [
    'f39e', // facebook-f
    'f16d', // instagram
    'f231', // pinterest-p
    'e61b', // x-twitter
    'f167', // youtube
    'f1a0', // google
    'f09a', // facebook (square)
    'f0d5', // google-plus
  ],
  regular: [],
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** @param {string} msg */ const log  = (msg) => console.log(`[FontSubset] ${msg}`)
/** @param {string} msg */ const warn = (msg) => console.warn(`[FontSubset] ⚠️  ${msg}`)
/** @param {string} msg */ const err  = (msg) => console.error(`[FontSubset] ❌ ${msg}`)

function isPyftsubsetAvailable() {
  try {
    execSync('pyftsubset --help', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Parse a FA7 CSS file and return a Map of iconName → { unicode, isBrand }
 * FA7 uses CSS custom properties:  .fa-search{--fa:"\\f002"}
 * The backslash is the CSS escape sequence for the Unicode codepoint.
 * @param {string} cssPath
 * @returns {Map<string, {unicode: string, isBrand: boolean}>}
 */
function parseIconMap(cssPath) {
  /** @type {Map<string, {unicode: string, isBrand: boolean}>} */
  const map = new Map()
  if (!fs.existsSync(cssPath)) return map
  const css = fs.readFileSync(cssPath, 'utf8')

  // Pattern 1: FA7 custom property using CSS escape:
  //   .fa-search{--fa:"\\f002"}  — the actual file content has a single backslash
  // We need to match the literal string: --fa:"\ followed by hex digits
  const re1 = /\.fa-([\w-]+)\{--fa:"\\([0-9a-fA-F]{3,6})"/g
  let m
  while ((m = re1.exec(css)) !== null) {
    const name = m[1]
    const unicode = m[2].toLowerCase()
    const isBrand = BRAND_ICONS.has(name)
    if (!map.has(name)) {
      map.set(name, { unicode, isBrand })
    }
  }

  // Pattern 2: Compound selectors: .fa-old,.fa-new{--fa:"\\f002"}
  // (catches alias names that appear before the comma)
  const re2 = /\.fa-([\w-]+),(?:\.[\w-]+)*\{--fa:"\\([0-9a-fA-F]{3,6})"/g
  while ((m = re2.exec(css)) !== null) {
    const name = m[1]
    if (!map.has(name)) {
      map.set(name, { unicode: m[2].toLowerCase(), isBrand: BRAND_ICONS.has(name) })
    }
  }

  // Pattern 3: Legacy :before content (FA5/FA6 fallback)
  const re3 = /\.fa-([\w-]+)::?before\{[^}]*content:"\\([0-9a-fA-F]{3,6})"[^}]*\}/g
  while ((m = re3.exec(css)) !== null) {
    const name = m[1]
    if (!map.has(name)) {
      map.set(name, { unicode: m[2].toLowerCase(), isBrand: BRAND_ICONS.has(name) })
    }
  }

  return map
}


/**
 * Scan all HTML and JS in _site for used fa-* class names.
 * Returns Set<string> of bare icon names (e.g. "circle-arrow-right").
 * @param {string[]} files
 * @returns {Set<string>}
 */
function scanUsedIcons(files) {
  const used = new Set()
  const re = /\bfa-([\w-]+)/g
  // Style class words to skip (not icon names)
  const SKIP = new Set([
    'solid','regular','brands','fa','stack','stack-1x','stack-2x','lg','sm','xs',
    '1x','2x','3x','4x','5x','6x','7x','8x','9x','10x','inverse','fw','spin',
    'pulse','rotate-90','rotate-180','rotate-270','flip-horizontal','flip-vertical',
    'flip-both','border','pull-left','pull-right','beat','shake','bounce','fade',
    'spin-pulse','beat-fade','flip',
  ])
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8')
      let m
      while ((m = re.exec(content)) !== null) {
        const name = m[1]
        if (!SKIP.has(name)) used.add(name)
      }
    } catch {}
  }
  return used
}

/**
 * Build the unicode list that pyftsubset needs.
 * @param {Set<string>} usedIconNames
 * @param {Map<string, {unicode: string, isBrand: boolean}>} iconMap
 * @param {string[]} alwaysInclude  array of hex strings e.g. ['f002']
 * @param {boolean} brandsOnly   if true, only include brand icons; otherwise only solid/regular
 * @returns {string}  comma-separated "U+F002,U+E09B,..."
 */
function buildUnicodeList(usedIconNames, iconMap, alwaysInclude, brandsOnly) {
  const codepoints = new Set(alwaysInclude.map((h) => h.replace(/^U\+/i, '').toLowerCase()))

  for (const name of usedIconNames) {
    const entry = iconMap.get(name)
    if (!entry) continue
    // Route icon to correct font file
    if (brandsOnly && entry.isBrand) codepoints.add(entry.unicode)
    if (!brandsOnly && !entry.isBrand) codepoints.add(entry.unicode)
  }

  if (codepoints.size === 0) return ''
  return [...codepoints].map((h) => `U+${h.toUpperCase()}`).join(',')
}

/**
 * Run pyftsubset to create a subsetted woff2.
 * @param {string} srcWoff2
 * @param {string} destWoff2
 * @param {string} unicodes  comma-separated U+ list
 */
function subsetFont(srcWoff2, destWoff2, unicodes) {
  const tmp = `${destWoff2}.tmp`
  const args = [
    srcWoff2,
    `--unicodes=${unicodes}`,
    `--output-file=${tmp}`,
    '--flavor=woff2',
    '--with-zopfli',           // maximum Brotli compression
    '--desubroutinize',        // reduces CFF table size
    '--no-hinting',            // strip hinting for web
    '--layout-features=*',     // keep all OT features
    '--name-IDs=*',            // keep all name records
  ]

  const result = spawnSync('pyftsubset', args, { stdio: ['ignore', 'pipe', 'pipe'] })
  if (result.status !== 0) {
    // --with-zopfli might not be available; try without it
    const args2 = args.filter((a) => a !== '--with-zopfli')
    const r2 = spawnSync('pyftsubset', args2, { stdio: ['ignore', 'pipe', 'pipe'] })
    if (r2.status !== 0) {
      warn(`pyftsubset failed for ${path.basename(srcWoff2)}: ${r2.stderr.toString()}`)
      if (fs.existsSync(tmp)) fs.removeSync(tmp)
      return false
    }
  }

  // Atomically replace only if smaller
  if (!fs.existsSync(tmp)) return false
  const origSize = fs.statSync(destWoff2).size
  const newSize = fs.statSync(tmp).size
  if (newSize < origSize) {
    fs.moveSync(tmp, destWoff2, { overwrite: true })
    const saved = ((origSize - newSize) / 1024).toFixed(1)
    log(
      `${path.basename(destWoff2)}: ${(origSize / 1024).toFixed(1)} KB → ` +
      `${(newSize / 1024).toFixed(1)} KB  (saved ${saved} KB / ` +
      `${(((origSize - newSize) / origSize) * 100).toFixed(1)}%)`
    )
    return true
  } else {
    warn(`Subset of ${path.basename(srcWoff2)} is not smaller — keeping original.`)
    fs.removeSync(tmp)
    return false
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log('Starting Font Awesome subsetting...')

  if (!isPyftsubsetAvailable()) {
    warn('pyftsubset not found. Run: pip install fonttools brotli')
    return
  }

  // 1. Collect all HTML + JS files to scan
  const htmlFiles = await glob(`${SITE_DIR}/**/*.html`, { absolute: false })
  const jsFiles = await glob(`${SITE_DIR}/**/*.js`, { absolute: false })
  const allFiles = [...htmlFiles, ...jsFiles]

  log(`Scanning ${htmlFiles.length} HTML + ${jsFiles.length} JS files for icon usage...`)

  // 2. Scan for used icon names
  const usedIcons = scanUsedIcons(allFiles)
  log(`Found ${usedIcons.size} distinct icon names — parsing unicode codepoints...`)

  // 3. Parse FA7 unified CSS to get icon → { unicode, isBrand } mapping
  const iconMap = parseIconMap(FA_CSS.all)
  log(`Parsed icon map — ${iconMap.size} icons found in FA7 CSS`)

  // Debug: show which used icons were resolved
  const resolved = [...usedIcons].filter((n) => iconMap.has(n))
  const unresolved = [...usedIcons].filter((n) => !iconMap.has(n))
  log(`Resolved: ${resolved.join(', ')}`)
  if (unresolved.length > 0) {
    log(`Unresolved (will rely on ALWAYS_INCLUDE): ${unresolved.join(', ')}`)
  }

  // 4. Build separate unicode lists for solid and brands font files
  const solidUnicodes = buildUnicodeList(usedIcons, iconMap, ALWAYS_INCLUDE.solid, false)
  const brandsUnicodes = buildUnicodeList(usedIcons, iconMap, ALWAYS_INCLUDE.brands, true)
  const regularUnicodes = buildUnicodeList(usedIcons, iconMap, ALWAYS_INCLUDE.regular, false)

  const solidCount = (solidUnicodes.match(/U\+/g) || []).length
  const brandsCount = (brandsUnicodes.match(/U\+/g) || []).length
  log(`Solid: ${solidCount} glyphs | Brands: ${brandsCount} glyphs`)

  // 5. Subset each font
  const configs = [
    { face: 'solid', unicodes: solidUnicodes },
    { face: 'brands', unicodes: brandsUnicodes },
    { face: 'regular', unicodes: regularUnicodes },
  ]

  let totalSaved = 0
  for (const { face, unicodes } of configs) {
    if (!unicodes) {
      log(`Skipping ${face} — no glyphs identified`)
      continue
    }

    const filename = `${FONT_FILES[/** @type {keyof typeof FONT_FILES} */ (face)]}.woff2`
    const srcFile = path.join(SOURCE_WEBFONTS, filename)
    const destFile = path.join(DIST_WEBFONTS, filename)

    if (!fs.existsSync(srcFile)) {
      // Fallback: subset the _site copy itself
      if (!fs.existsSync(destFile)) { warn(`Source not found: ${srcFile}`); continue }
    }

    const src = fs.existsSync(srcFile) ? srcFile : destFile
    const beforeSize = fs.existsSync(destFile) ? fs.statSync(destFile).size : 0

    const ok = subsetFont(src, destFile, unicodes)
    if (ok && beforeSize > 0) {
      totalSaved += beforeSize - fs.statSync(destFile).size
    }
  }

  log(`Font subsetting complete. Total saved: ${(totalSaved / 1024).toFixed(1)} KB`)
}

main().catch((e) => {
  err(e.message)
  process.exit(1)
})

module.exports = main
