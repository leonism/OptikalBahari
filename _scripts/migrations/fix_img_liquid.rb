#!/usr/bin/env ruby
require 'find'

# --- Configuration ---
# Only scan these specific directories
TARGET_DIRS = %w[_pages _posts]
# Only scan markdown files
TARGET_EXTENSIONS = %w[.markdown .md]

def process_file(filepath)
  content = File.read(filepath, encoding: 'UTF-8')
  original_content = content.dup

  # Regex Breakdown:
  # 1. src=              -> Matches the src attribute start
  # 2. (["'])            -> Capture Group 1: Opening quote (" or ')
  # 3. (.*?)             -> Capture Group 2: The image path
  # 4. \1                -> Match the closing quote (same as Group 1)
  # 5. \s*\|\s*relative_url -> Matches the pipe and filter name (ignoring spaces)
  # 6. \s*}}             -> Matches the closing brackets
  # 7. "                 -> Matches the trailing quote from the broken pattern

  pattern = /src=(["'])(.*?)\1\s*\|\s*relative_url\s*}}"/

  # Perform the replacement
  content.gsub!(pattern) do |match|
    path = $2

    # The Fix:
    # Input:  src="/path/img.webp" | relative_url }}"
    # Output: src="{{ "/path/img.webp" | relative_url }}"

    # Note: We wrap the path in double quotes inside the Liquid tag
    new_tag = %[src="{{ "#{path}" | relative_url }}"]

    puts "   🔧 Fixed in #{File.basename(filepath)}: #{path}"
    new_tag
  end

  if content != original_content
    File.write(filepath, content, encoding: 'UTF-8')
    return true
  else
    return false
  end
rescue StandardError => e
  puts "   ⚠️  Error reading #{filepath}: #{e.message}"
  false
end

puts "🚀 Starting Broken Image Liquid Tag Fixer..."

# 1. Filter directories that actually exist to avoid crashing
dirs_to_scan = TARGET_DIRS.select { |d| Dir.exist?(d) }

if dirs_to_scan.empty?
  puts "   ❌  Target directories (#{TARGET_DIRS.join(', ')}) not found!"
  exit
end

puts "📂 Scanning directories: #{dirs_to_scan.join(', ')}"

scanned_count = 0
fixed_count = 0
files_changed = []

# 2. Walk through the specific directories
Find.find(*dirs_to_scan) do |path|
  if File.file?(path) && TARGET_EXTENSIONS.include?(File.extname(path))
    scanned_count += 1
    if process_file(path)
      fixed_count += 1
      files_changed << path
    end
  end
end

puts "\n📊 REPORT:"
puts "   --------------------------------------------------"
puts "   Files Scanned: #{scanned_count}"
puts "   Files Fixed:   #{fixed_count}"
puts "   --------------------------------------------------"

if fixed_count > 0
  puts "   📝 List of Modified Files:"
  files_changed.each { |f| puts "      - #{f}" }
  puts "\n   ✅ Changes applied. Run 'git diff' to verify."
else
  puts "   ✅ No broken patterns found."
end
