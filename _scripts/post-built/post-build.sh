#!/bin/bash
set -e

echo "🚀 Starting post-build optimizations..."

# Check if Node.js dependencies are available
if command -v node >/dev/null 2>&1 && [ -f "node_modules/critical/package.json" ]; then
  echo "📝 Extracting critical CSS..."
  node _scripts/post-built/critical-css.js
else
  echo "⚠️ Critical CSS extraction skipped (dependencies not installed)"
fi

if command -v node >/dev/null 2>&1 && [ -f "node_modules/workbox-build/package.json" ]; then
  echo "⚙️ Generating service worker..."
  node _scripts/post-built/generate-sw.js
else
  echo "⚠️ Service worker generation skipped (dependencies not installed)"
fi

# Continue with other optimizations that don't require Node.js
echo "🖼️ Optimizing images..."
if command -v cwebp >/dev/null 2>&1; then
  find _site -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | while read img; do
    if [ ! -f "${img%.*}.webp" ]; then
      cwebp -q 85 "$img" -o "${img%.*}.webp"
    fi
  done
else
  echo "⚠️ WebP conversion skipped (cwebp not installed)"
fi

echo "🔒 Adding security headers..."
find _site -name "*.html" -exec sed -i '' 's/<head>/<head><meta http-equiv="X-Content-Type-Options" content="nosniff"><meta http-equiv="X-Frame-Options" content="DENY"><meta http-equiv="X-XSS-Protection" content="1; mode=block">/g' {} \;

echo "🔐 Generating SRI hashes..."
find _site -name "*.css" -o -name "*.js" | while read file; do
  hash=$(openssl dgst -sha384 -binary "$file" | openssl base64 -A)
  echo "${file#_site/}: sha384-$hash" >> _site/integrity.txt
done

echo "✅ Post-build optimizations complete!"
