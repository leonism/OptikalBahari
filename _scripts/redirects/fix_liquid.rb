#!/usr/bin/env ruby
require 'find'

# --- Configuration ---
# Folders to ignore
SKIP_DIRS = %w[.git _site node_modules .github vendor]
# Files to check
TARGET_EXTENSIONS = %w[.md .markdown]

def process_file(filepath)
  content = File.read(filepath, encoding: 'UTF-8')
  original_content = content.dup

  # Regex Explanation:
  # 1. href=(["'])       -> Matches href=" or href=' (Captures quote in Group 1)
  # 2. (.*?)             -> Matches the URL path (Captures path in Group 2)
  # 3. \1                -> Matches the same closing quote as Group 1
  # 4. \s*\|\s* -> Matches the pipe | with optional spaces
  # 5. relative_url\s* -> Matches the filter name
  # 6. }}"               -> Matches the closing brackets and the trailing quote
  pattern = /href=(["'])(.*?)\1\s*\|\s*relative_url\s*}}"/

  # Perform the replacement
  content.gsub!(pattern) do |match|
    # quote = $1 (We don't strictly need this if we force double quotes in the fix)
    path = $2

    # The Fix:
    # Transforms: href="/path/" | relative_url }}"
    # To:         href="{{ "/path/" | relative_url }}"

    new_tag = %[href="{{ "#{path}" | relative_url }}"]

    puts "   🔧 Fixing: #{path}"
    new_tag
  end

  # Save if changes were made
  if content != original_content
    File.write(filepath, content, encoding: 'UTF-8')
    true
  else
    false
  end
rescue StandardError => e
  puts "   ⚠️  Error reading #{filepath}: #{e.message}"
  false
end

puts "🚀 Starting Liquid Syntax Fixer..."
puts "📂 Scanning: #{Dir.pwd}"

scanned_count = 0
fixed_count = 0

Find.find(Dir.pwd) do |path|
  if File.directory?(path)
    if SKIP_DIRS.include?(File.basename(path))
      Find.prune
    end
  else
    if TARGET_EXTENSIONS.include?(File.extname(path))
      scanned_count += 1
      if process_file(path)
        fixed_count += 1
      end
    end
  end
end

puts "\n📊 Summary:"
puts "   - Files Scanned: #{scanned_count}"
puts "   - Files Fixed:   #{fixed_count}"
puts "   - Status: #{fixed_count > 0 ? 'Syntax errors fixed. Check git diff.' : 'No matching errors found.'}"
