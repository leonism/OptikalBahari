#!/usr/bin/env ruby

require 'fileutils'

def fix_liquid_syntax(file_path)
  content = File.read(file_path)
  original_content = content.dup

  # Fix malformed width and height attributes with incomplete Liquid syntax
  # Pattern: width="{{ " or height="{{ " (incomplete Liquid variables)
  content.gsub!(/\s+(width|height)="\{\{\s*"/, '')

  # Also fix any standalone {{ " patterns that might be left
  content.gsub!(/\{\{\s*"\s*/, '')

  # Return true if changes were made
  if content != original_content
    File.write(file_path, content)
    return true
  end

  false
end

def process_files(directory_patterns)
  fixed_count = 0
  error_count = 0

  directory_patterns.each do |pattern|
    Dir.glob(pattern).each do |file_path|
      next unless File.file?(file_path)

      begin
        if fix_liquid_syntax(file_path)
          puts "Fixed Liquid syntax: #{File.basename(file_path)}"
          fixed_count += 1
        end
      rescue => e
        puts "Error processing #{File.basename(file_path)}: #{e.message}"
        error_count += 1
      end
    end
  end

  puts "\n=== Liquid Syntax Fix Summary ==="
  puts "Files fixed: #{fixed_count}"
  puts "Errors: #{error_count}"
end

# Process multiple directories and file types
patterns = [
  "/Volumes/DATA/Jekyll/OptikalBahari/_posts/*.html",
  "/Volumes/DATA/Jekyll/OptikalBahari/_pages/*.md",
  "/Volumes/DATA/Jekyll/OptikalBahari/_includes/**/*.html",
  "/Volumes/DATA/Jekyll/OptikalBahari/_drafts/*.html"
]

process_files(patterns)
