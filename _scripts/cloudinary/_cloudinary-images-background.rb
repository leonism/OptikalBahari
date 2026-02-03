#!/usr/bin/env ruby

require 'fileutils'

class CloudinaryBackgroundMigration
  # Configuration
  CLOUD_NAME = 'divkqrf7k'

  # Uses the 1200w size with f_auto (Best for retina mobile & browser compatibility)
  URL_PREFIX = "https://res.cloudinary.com/#{CLOUD_NAME}/image/upload/q_auto,f_auto,w_1200/"

  TARGET_DIRECTORIES = ['_posts', '_pages']
  EXTENSIONS = ['.md', '.markdown']

  def initialize
    @stats = {
      total_files: 0,
      processed_files: 0,
      updated_files: 0,
      skipped_files: 0,
      already_cloudinary: 0,
      no_background: 0
    }
  end

  def run
    puts "🚀 Starting Cloudinary Background Migration..."
    puts "Target Directories: #{TARGET_DIRECTORIES.join(', ')}"
    puts "Cloudinary Prefix: #{URL_PREFIX}"
    puts "-" * 50

    scan_and_process_files
    print_report
  end

  private

  def scan_and_process_files
    TARGET_DIRECTORIES.each do |dir|
      unless Dir.exist?(dir)
        puts "⚠️ Directory not found: #{dir}"
        next
      end

      # Recursively find all markdown files
      Dir.glob("#{dir}/**/*{#{EXTENSIONS.join(',')}}").each do |file_path|
        @stats[:total_files] += 1
        process_file(file_path)
      end
    end
  end

  def process_file(file_path)
    content = File.read(file_path)

    # 1. Check for valid YAML frontmatter (content between two "---")
    match_data = content.match(/\A---\s*\n(.*?)\n---\s*\n/m)

    unless match_data
      @stats[:skipped_files] += 1
      return
    end

    frontmatter = match_data[1]
    remaining_content = match_data.post_match

    # 2. Look for 'background' field
    # Regex captures: Group 1 (Key), Group 2 (Quote), Group 3 (Value), Group 4 (Quote)
    bg_match = frontmatter.match(/^(\s*background:\s*)(['"]?)(.*?)(['"]?)\s*$/)

    if bg_match
      quote_start   = bg_match[2]
      current_value = bg_match[3]
      quote_end     = bg_match[4]

      # A. Skip if already on Cloudinary
      if current_value.include?('cloudinary.com')
        @stats[:already_cloudinary] += 1
        return
      end

      # B. Check if it matches local asset path (assets/img/...)
      if current_value =~ /^\/?assets\/img\/(.*)$/i
        relative_path = $1

        # Strip extension to match Cloudinary public_id format
        clean_path = relative_path.sub(/\.[^.]*$/, '')

        # Construct the new URL
        new_url = "#{URL_PREFIX}#{clean_path}"

        # Perform the replacement safely within the frontmatter string
        # We escape the old value to ensure the regex doesn't break on special chars
        search_pattern = /^(\s*background:\s*)#{Regexp.escape(quote_start)}#{Regexp.escape(current_value)}#{Regexp.escape(quote_end)}/

        # \1 puts the "background: " part back, then we append the new URL
        new_frontmatter = frontmatter.sub(search_pattern, "\\1#{new_url}")

        # Reconstruct and write file
        new_file_content = "---\n#{new_frontmatter}\n---\n#{remaining_content}"
        File.write(file_path, new_file_content)

        @stats[:updated_files] += 1
        puts "✅ Updated: #{file_path}"
        puts "   Old: #{current_value}"
        puts "   New: #{new_url}"
      else
        # Value exists but isn't a local asset path we recognize
        @stats[:skipped_files] += 1
      end
    else
      @stats[:no_background] += 1
    end

    @stats[:processed_files] += 1
  end

  def print_report
    puts "-" * 50
    puts "📊 Migration Report"
    puts "-" * 50
    puts "Total Files Scanned:     #{@stats[:total_files]}"
    puts "Files Processed:         #{@stats[:processed_files]}"
    puts "Files Updated:           #{@stats[:updated_files]}"
    puts "Already on Cloudinary:   #{@stats[:already_cloudinary]}"
    puts "No Background Field:     #{@stats[:no_background]}"
    puts "Skipped (Other reasons): #{@stats[:skipped_files]}"
    puts "-" * 50
    puts "Done."
  end
end

# Execution
if __FILE__ == $0
  migrator = CloudinaryBackgroundMigration.new
  migrator.run
end
