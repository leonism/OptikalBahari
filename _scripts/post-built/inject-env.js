/**
 * Inject Environment Variables Script
 * Replaces process.env.VAR in built files with actual values from .env
 */

const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
require('dotenv').config()

const SITE_DIR = '_site'

async function injectEnv() {
  console.log('  Running: Environment Variable Injection...')
  
  // Define variables to replace
  const envVars = {
    'process.env.ALGOLIA_APP_ID': process.env.ALGOLIA_APP_ID || 'YOUR_ALGOLIA_APP_ID',
    'process.env.ALGOLIA_SEARCH_API_KEY': process.env.ALGOLIA_SEARCH_API_KEY || 'YOUR_ALGOLIA_SEARCH_API_KEY',
    'process.env.ALGOLIA_INDEX_NAME': process.env.ALGOLIA_INDEX_NAME || 'YOUR_ALGOLIA_INDEX_NAME'
  }

  try {
    // Find all JS files in _site/assets/js
    const files = glob.sync(`${SITE_DIR}/assets/js/**/*.js`)
    
    let count = 0
    
    for (const file of files) {
      let content = await fs.readFile(file, 'utf8')
      let modified = false
      
      for (const [key, value] of Object.entries(envVars)) {
        if (content.includes(key)) {
          // Replace all occurrences
          const regex = new RegExp(key.replace(/\./g, '\\.'), 'g')
          content = content.replace(regex, `'${value}'`)
          modified = true
        }
      }
      
      if (modified) {
        await fs.writeFile(file, content, 'utf8')
        count++
      }
    }
    
    console.log(`  ✅ Injected environment variables into ${count} file(s)`)
    
  } catch (error) {
    console.error(`  ❌ Environment injection failed: ${error.message}`)
  }
}

if (require.main === module) {
  injectEnv()
}

module.exports = injectEnv
