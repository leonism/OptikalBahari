#!/usr/bin/env ruby
require 'find'

# --- Configuration ---
DOMAIN_REGEX = %r{^https?://(www\.)?optikalbahari\.com}i
SKIP_DIRS = %w[.git _site node_modules .github vendor]
TARGET_EXTENSIONS = %w[.md .markdown .html]
IGNORED_FILE_EXTS = %w[
  .jpg .jpeg .png .gif .svg .webp .ico
  .css .js .json .xml .txt .pdf .zip
]

def needs_fixing?(url)
  return false if url.nil? || url.strip.empty?

  # 1. Clean the URL of anchors/params
  clean_url = url.split('#').first
  clean_url = clean_url.split('?').first if clean_url

  return false if clean_url.nil? || clean_url.empty?

  # 2. Skip if it already ends in slash
  return false if clean_url.end_with?('/')

  # 3. Skip if it looks like a file (image.png)
  return false if IGNORED_FILE_EXTS.any? { |ext| clean_url.downcase.end_with?(ext) }

  # 4. Check if it is internal
  is_relative = clean_url.start_with?('/')
  is_internal_absolute = clean_url.match?(DOMAIN_REGEX)

  return (is_relative || is_internal_absolute)
end

def add_slash(url)
  if url.include?('#')
    path, suffix = url.split('#', 2)
    return "#{path}/##{suffix}"
  elsif url.include?('?')
    path, suffix = url.split('?', 2)
    return "#{path}/?#{suffix}"
  else
    return "#{url}/"
  end
end

def process_file(filepath)
  # Force UTF-8 to handle any weird characters
  content = File.read(filepath, encoding: 'UTF-8')
  original_content = content.dup

  # --- PATTERN 1: Markdown Links [Text](URL) ---
  content.gsub!(/(\[.*?\])\((.*?)\)/) do |m|
    link_text = Regexp.last_match(1)
    url = Regexp.last_match(2)

    if needs_fixing?(url)
      new_url = add_slash(url)
      puts "   🛠  Fixed Markdown: #{url} -> #{new_url}"
      "#{link_text}(#{new_url})"
    else
      m
    end
  end

  # --- PATTERN 2: HTML Tags <a href="URL"> ---
  content.gsub!(/href=(["'])(.*?)\1/) do |m|
    quote = Regexp.last_match(1)
    url = Regexp.last_match(2)

    if needs_fixing?(url)
      new_url = add_slash(url)
      puts "   🛠  Fixed HTML: #{url} -> #{new_url}"
      "href=#{quote}#{new_url}#{quote}"
    else
      m
    end
  end

  if content != original_content
    File.write(filepath, content, encoding: 'UTF-8')
    true
  else
    false
  end
rescue StandardError => e
  puts "   ⚠️  Error processing file: #{filepath}"
  puts "      #{e.message}"
  false
end

puts "🚀 Starting Trailing Slash Fixer V3..."
puts "📂 Working Directory: #{Dir.pwd}"

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
puts "   - Files Modified: #{fixed_count}"
puts "   - Status: #{fixed_count > 0 ? 'Changes applied. Check git diff.' : 'No internal links found needing fixes.'}"
