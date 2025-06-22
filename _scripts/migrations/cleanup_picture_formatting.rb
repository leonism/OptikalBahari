#!/usr/bin/env ruby

# Picture Element Cleanup Script
# This script cleans up messy picture element formatting in HTML and Markdown files
# Removes escaped newlines, fixes indentation, and ensures proper HTML structure

require 'fileutils'
require 'logger'

# Configuration
TARGET_DIRECTORIES = ['_posts', '_pages', '_drafts', '_docs', '.']
FILE_EXTENSIONS = ['.md', '.html']
BACKUP_SUFFIX = '.backup'

# Setup logging
logger = Logger.new(STDOUT)
logger.level = Logger::INFO
logger.formatter = proc do |severity, datetime, progname, msg|
  "[#{datetime.strftime('%Y-%m-%d %H:%M:%S')}] #{severity}: #{msg}\n"
end

class PictureCleanup
  def initialize(logger)
    @logger = logger
    @files_processed = 0
    @cleanups_made = 0
    @errors = 0
  end

  def process_directories
    @logger.info "Starting picture element cleanup..."
    @logger.info "Target directories: #{TARGET_DIRECTORIES.join(', ')}"
    @logger.info "File extensions: #{FILE_EXTENSIONS.join(', ')}"
    @logger.info "=" * 60

    TARGET_DIRECTORIES.each do |dir|
      next unless Dir.exist?(dir)
      process_directory(dir)
    end

    @logger.info "=" * 60
    @logger.info "Files processed: #{@files_processed}"
    @logger.info "Picture cleanups made: #{@cleanups_made}"
    @logger.info "Errors encountered: #{@errors}"
    @logger.info "=" * 60
    @logger.info "Picture cleanup completed successfully!"
  end

  private

  def process_directory(dir)
    @logger.info "Processing directory: #{dir}"

    Dir.glob(File.join(dir, '**', '*')).each do |file_path|
      next unless File.file?(file_path)
      next unless FILE_EXTENSIONS.include?(File.extname(file_path))
      next if file_path.include?(BACKUP_SUFFIX)

      process_file(file_path)
    end
  end

  def process_file(file_path)
    begin
      content = File.read(file_path, encoding: 'UTF-8')
      original_content = content.dup

      # Clean up picture elements
      content = cleanup_picture_elements(content)

      if content != original_content
        # Create backup
        backup_path = "#{file_path}#{BACKUP_SUFFIX}"
        FileUtils.cp(file_path, backup_path) unless File.exist?(backup_path)

        # Write cleaned content
        File.write(file_path, content, encoding: 'UTF-8')

        @cleanups_made += 1
        @logger.info "✓ Cleaned picture elements in: #{file_path}"
      end

      @files_processed += 1

    rescue => e
      @errors += 1
      @logger.error "✗ Error processing #{file_path}: #{e.message}"
    end
  end

  def cleanup_picture_elements(content)
    # Pattern to match picture elements with messy formatting
    picture_pattern = /<picture>.*?<\/picture>/m

    content.gsub(picture_pattern) do |picture_match|
      clean_picture_element(picture_match)
    end
  end

  def clean_picture_element(picture_html)
    # Remove escaped newlines and fix formatting
    cleaned = picture_html.dup

    # Fix escaped newlines in srcset attributes
    cleaned = cleaned.gsub(/\\n\s*/, ' ')

    # Fix img tag attributes with escaped newlines
    cleaned = cleaned.gsub(/\\n\s*(alt|loading|decoding|width|height|class|title)=/, ' \1=')

    # Clean up srcset attributes - normalize URLs and widths
    cleaned = cleaned.gsub(/srcset="\s*([^"]+)\s*"/) do |match|
      srcset_content = $1
      # Extract URLs and widths, removing any line breaks or extra formatting
      urls_and_widths = srcset_content.gsub(/\s+/, ' ').strip.split(/,\s*/).map(&:strip)

      # Format each URL and width pair properly
      formatted_srcset = urls_and_widths.map do |url_width|
        if url_width =~ /(.*?)\s+(\d+w)/
          url = $1.strip
          width = $2
          "#{url} #{width}"
        else
          url_width # Keep as is if it doesn't match the pattern
        end
      end

      "srcset=\"#{formatted_srcset.join(',')}\n    \""
    end

    # Fix source tag closing - ensure proper self-closing
    cleaned = cleaned.gsub(/<source([^>]*?)\s*\/?\s*>/, '<source\1 />')

    # Remove duplicate closing tags in img elements
    cleaned = cleaned.gsub(/\s*\/\s*\/>/, ' />')

    # Fix img tag closing - ensure proper self-closing
    cleaned = cleaned.gsub(/<img([^>]*?)\s*\/?\s*>/, '<img\1 />')

    # Clean up img tag attributes formatting
    cleaned = cleaned.gsub(/<img\s+([^>]+)\s*\/>/) do |img_match|
      attrs = $1

      # Parse attributes properly
      attr_regex = /([\w\-]+)\s*=\s*["']([^"']*)["']/
      attr_matches = attrs.scan(attr_regex)

      # Format the img tag properly with each attribute on its own line
      if attr_matches.length > 0
        formatted_attrs = attr_matches.map do |name, value|
          "#{name}=\"#{value}\""
        end

        "<img\n    #{formatted_attrs.join("\n    ")}\n  />"
      else
        '<img />'
      end
    end

    # Ensure proper indentation for the entire picture element
    lines = cleaned.split("\n")
    indented_lines = lines.map.with_index do |line, index|
      if index == 0 || line.strip.empty?
        line
      elsif line.strip == '</picture>'
        line.gsub(/^\s*/, '')
      else
        # Ensure consistent 2-space indentation for content inside picture
        stripped = line.strip
        next line if stripped.empty?

        if stripped.start_with?('<!--') || stripped.start_with?('<source') || stripped.start_with?('<img')
          "  #{stripped}"
        else
          "    #{stripped}"
        end
      end
    end

    indented_lines.join("\n")
  end
end

# Run the cleanup
cleanup = PictureCleanup.new(logger)
cleanup.process_directories
