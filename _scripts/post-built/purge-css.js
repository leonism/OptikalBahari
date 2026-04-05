const fs = require('fs-extra')
const path = require('path')

const SITE_DIR = '_site'

async function runPurgeCSS() {
  console.log('🧹 Purging unused CSS...')

  try {
    const { PurgeCSS } = await import('purgecss')
    
    const purgecssResult = await new PurgeCSS().purge({
      content: [`${SITE_DIR}/**/*.html`, `${SITE_DIR}/**/*.js`],
      css: [`${SITE_DIR}/**/*.css`],
      safelist: {
        standard: ['html', 'body', 'fa-star', 'fa-solid', 'fa-regular', 'fas', 'far', 'rounded-circle', 'text-warning', 'text-muted', 'card', 'card-body', 'card-title', 'card-text'],
        deep: [
          /show$/,
          /fade$/,
          /active$/,
          /disabled$/,
          /collapsing/,
          /collapsed/,
          /collapse/,
          /navbar/,
          /nav-/,
          /modal/,
          /dropdown/,
          /btn/,
          /form-/,
          /input-/,
          /alert/,
          /badge/,
          /card/,
          /carousel/,
          /pagination/,
          /popover/,
          /tooltip/,
          /progress/,
          /spinner/,
          /toast/,
          /sticky-/,
          /fixed-/,
          /offcanvas/,
          /accordion/,
          /list-group/,
          /breadcrumb/,
          /close/,
          /visually-hidden/,
          /pointer/,
          /scrollbar/,
          // Font Awesome and Bootstrap specifics
          /^fa-/,
          /^fas$/,
          /^far$/,
          /^fa$/,
          /^fs-/,
          /^ms-/,
          /^me-/,
          /^mt-/,
          /^mb-/,
          /^mx-/,
          /^my-/,
          /^m-/,
          /^pt-/,
          /^pb-/,
          /^ps-/,
          /^pe-/,
          /^p-/,
          /^d-/,
          /^text-/,
          /^bg-/,
          /^display-/,
          /^masonry-/,
          /^fw-/,
          /^opacity-/,
          /^rounded-/,
          /^shadow-/,
          /^border-/,
        ],
      },
    })

    for (const result of purgecssResult) {
      const { file, css } = result
      if (file) {
        const sizeBefore = (fs.statSync(file).size / 1024).toFixed(2)
        await fs.writeFile(file, css)
        const sizeAfter = (fs.statSync(file).size / 1024).toFixed(2)
        console.log(`✅ Purged ${path.relative(SITE_DIR, file)}: ${sizeBefore}KB -> ${sizeAfter}KB`)
      }
    }

    console.log('✨ PurgeCSS complete!')
  } catch (error) {
    console.error('❌ PurgeCSS failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  runPurgeCSS()
}

module.exports = runPurgeCSS
