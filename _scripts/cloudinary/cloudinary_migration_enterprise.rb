#!/usr/bin/env ruby
# frozen_string_literal: true

# Enterprise-grade Cloudinary API Migration Script
# Converts conventional path-based image references to Cloudinary API-based calls
# with responsive picture elements for optimal performance and SEO

require 'json'
require 'fileutils'
require 'pathname'
require 'logger'

class CloudinaryMigrationEnterprise
  CLOUD_NAME = 'divkqrf7k'  # Updated to match mapping file
  TARGET_DIRECTORIES = %w[posts _posts _pages _includes _drafts _docs . ].freeze
  FILE_EXTENSIONS = %w[.md .html].freeze
  BACKUP_SUFFIX = '.backup'

  # Responsive breakpoints for different screen sizes
  RESPONSIVE_WIDTHS = [480, 768, 1200].freeze

  # Image formats in order of preference (best to fallback)
  IMAGE_FORMATS = %w[avif webp jpg].freeze

  def initialize(mapping_file = 'mapping-cloudinary-urls.json')
    @script_dir = File.dirname(__FILE__)
    @project_root = File.expand_path('..', @script_dir)
    @mapping_file = File.join(@script_dir, mapping_file)
    @logger = setup_logger
    @mapping_data = load_mapping_data
    @stats = {
      files_processed: 0,
      markdown_replacements: 0,
      html_replacements: 0,
      errors: 0
    }
  end

  def migrate!
    @logger.info "Starting Cloudinary migration process..."
    @logger.info "Project root: #{@project_root}"
    @logger.info "Mapping file: #{@mapping_file}"
    @logger.info "Target directories: #{TARGET_DIRECTORIES.join(', ')}"

    validate_environment!

    TARGET_DIRECTORIES.each do |dir|
      process_directory(dir)
    end

    print_summary
    @logger.info "Migration completed successfully!"
  rescue => e
    @logger.error "Migration failed: #{e.message}"
    @logger.error e.backtrace.join("\n")
    exit 1
  end

  private

  def setup_logger
    logger = Logger.new(STDOUT)
    logger.level = Logger::INFO
    logger.formatter = proc do |severity, datetime, progname, msg|
      "[#{datetime.strftime('%Y-%m-%d %H:%M:%S')}] #{severity}: #{msg}\n"
    end
    logger
  end

  def load_mapping_data
    unless File.exist?(@mapping_file)
      raise "Mapping file not found: #{@mapping_file}"
    end

    @logger.info "Loading mapping data from #{@mapping_file}..."
    JSON.parse(File.read(@mapping_file))
  rescue JSON::ParserError => e
    raise "Invalid JSON in mapping file: #{e.message}"
  end

  def validate_environment!
    @logger.info "Validating environment..."

    unless Dir.exist?(@project_root)
      raise "Project root directory not found: #{@project_root}"
    end

    TARGET_DIRECTORIES.each do |dir|
      dir_path = File.join(@project_root, dir)
      unless Dir.exist?(dir_path)
        @logger.warn "Target directory not found: #{dir_path}"
      end
    end

    @logger.info "Environment validation completed"
  end

  def process_directory(directory)
    dir_path = File.join(@project_root, directory)
    return unless Dir.exist?(dir_path)

    @logger.info "Processing directory: #{directory}"

    Dir.glob(File.join(dir_path, '**', '*')).each do |file_path|
      next unless File.file?(file_path)
      next unless FILE_EXTENSIONS.include?(File.extname(file_path).downcase)

      process_file(file_path)
    end
  end

  def process_file(file_path)
    @logger.debug "Processing file: #{file_path}"

    begin
      content = File.read(file_path, encoding: 'UTF-8')
      original_content = content.dup

      # Process markdown key-value pairs
      content = process_markdown_images(content, file_path)

      # Process HTML img tags
      content = process_html_images(content, file_path)

      if content != original_content
        backup_file(file_path)
        File.write(file_path, content, encoding: 'UTF-8')
        @stats[:files_processed] += 1
        @logger.info "Updated: #{relative_path(file_path)}"
      end

    rescue => e
      @stats[:errors] += 1
      @logger.error "Error processing #{file_path}: #{e.message}"
    end
  end

  def process_markdown_images(content, file_path)
    # Process frontmatter background values specifically
    content = process_frontmatter_background(content, file_path)

    # Match patterns like: background: /assets/img/posts/example/image.webp
    # Also match: image: /assets/img/..., cover: /assets/img/..., etc.
    pattern = /^(\s*)(\w+):\s*(['"]?)(\/assets\/img\/[^\s'"]+)\3/

    content.gsub(pattern) do |match|
      indent = $1
      key = $2
      quote = $3
      image_path = $4

      cloudinary_url = find_best_cloudinary_url(image_path)

      if cloudinary_url
        @stats[:markdown_replacements] += 1
        @logger.debug "Markdown replacement: #{image_path} -> #{cloudinary_url}"
        "#{indent}#{key}: #{quote}#{cloudinary_url}#{quote}"
      else
        @logger.warn "No Cloudinary mapping found for: #{image_path} in #{relative_path(file_path)}"
        match
      end
    end
  end

  def process_html_images(content, file_path)
    # Match HTML img tags with various formats, including Jekyll liquid syntax
    # This pattern matches both regular src and Jekyll liquid syntax like {{ '/path' | relative_url }}
    # Updated to handle Jekyll liquid syntax with nested quotes and multi-line img tags
    img_pattern = /<img[^>]*?src\s*=\s*(['"])([^\1]*?(?:\{\{[^}]*\}\}[^\1]*?)*?)\1[^>]*?>/mi

    content.gsub(img_pattern) do |match|
      img_tag = match
      quote_char = $1
      src_url = $2

      # Extract image path (remove Jekyll liquid filters)
      clean_path = extract_clean_image_path(src_url)

      # Only process if it's an assets/img path
      next img_tag unless clean_path.include?('/assets/img/')

      # Extract attributes from the original img tag
      attributes = extract_img_attributes(img_tag)

      picture_element = generate_responsive_picture(clean_path, attributes)

      if picture_element
        @stats[:html_replacements] += 1
        @logger.debug "HTML replacement: #{clean_path} -> responsive picture element"
        picture_element
      else
        @logger.warn "No Cloudinary mapping found for: #{clean_path} in #{relative_path(file_path)}"
        img_tag
      end
    end
  end

  def extract_clean_image_path(src_url)
    # Handle post.background references first (most specific)
    if src_url.match?(/\{\{\s*post\.background/) || src_url.match?(/\{\{\s*include\.post\.background/)
      return '/assets/img/post-background-placeholder'
    end

    # Handle quoted liquid syntax with filters
    quoted_match = src_url.match(/\{\{\s*["']([^"']+)["'][^}]*\}\}/)
    if quoted_match
      path = quoted_match[1]
      return path if path.include?('/assets/img/')
    end

    # Handle unquoted liquid syntax (variables, etc.)
    unquoted_match = src_url.match(/\{\{\s*([^}]+?)\s*\}\}/)
    if unquoted_match
      content = unquoted_match[1].strip
      # Skip complex expressions with filters or operations
      return '' if content.include?('|') || content.include?('prepend') || content.include?('replace')
      return content
    end

    # Handle regular paths
    return src_url if src_url.include?('/assets/img/')

    return ''
  end

  def extract_img_attributes(img_tag)
    attributes = {}

    # Extract common attributes
    img_tag.scan(/(\w+)\s*=\s*['"]([^'"]*)['"]/) do |attr, value|
      case attr.downcase
      when 'alt'
        attributes[:alt] = value
      when 'title'
        attributes[:title] = value
      when 'class'
        attributes[:class] = value
      when 'width'
        attributes[:width] = value
      when 'height'
        attributes[:height] = value
      end
    end

    attributes
  end

  def process_frontmatter_background(content, file_path)
    # Specifically handle frontmatter background values
    # Match: background: /assets/img/posts/path/image.webp
    frontmatter_pattern = /^(\s*background:\s*)(\/assets\/img\/[^\s]+)/

    content.gsub(frontmatter_pattern) do |match|
      prefix = $1
      image_path = $2

      cloudinary_url = find_best_cloudinary_url_for_background(image_path)

      if cloudinary_url
        @stats[:markdown_replacements] += 1
        @logger.info "Frontmatter background replacement: #{image_path} -> #{cloudinary_url}"
        # Ensure proper spacing - keep one space after colon
        "background: #{cloudinary_url}"
      else
        @logger.warn "No Cloudinary mapping found for background: #{image_path} in #{relative_path(file_path)}"
        match
      end
    end
  end

  def find_best_cloudinary_url_for_background(image_path)
    # Remove leading slash and normalize path
    normalized_path = image_path.sub(/^\/*/, '')

    # For background images, prefer high-quality AVIF format at 1200w
    mapping_entry = find_mapping_entry(normalized_path)
    return nil unless mapping_entry

    # Return the best quality URL for background images
    mapping_entry['responsive_urls']['avif']['1200w'] ||
    mapping_entry['responsive_urls']['webp']['1200w'] ||
    mapping_entry['responsive_urls']['jpeg']['1200w'] ||
    mapping_entry['fallback']
  end

  def find_best_cloudinary_url(image_path)
    # Remove leading slash and normalize path
    normalized_path = image_path.sub(/^\/*/, '')

    # Try exact match first
    if @mapping_data[normalized_path]
      return @mapping_data[normalized_path]['responsive_urls']['avif']['768w'] ||
             @mapping_data[normalized_path]['responsive_urls']['webp']['768w'] ||
             @mapping_data[normalized_path]['fallback']
    end

    # Try to find by filename
    filename = File.basename(normalized_path)
    @mapping_data.each do |key, data|
      if File.basename(key) == filename
        return data['responsive_urls']['avif']['768w'] ||
               data['responsive_urls']['webp']['768w'] ||
               data['fallback']
      end
    end

    nil
  end

  def generate_responsive_picture(image_path, attributes)
    # Remove leading slash and normalize path
    normalized_path = image_path.sub(/^\/*/, '')

    # Find mapping data
    mapping_entry = find_mapping_entry(normalized_path)
    return nil unless mapping_entry

    public_id = mapping_entry['public_id']
    width = attributes[:width] || '768'
    height = attributes[:height] || '512'
    alt_text = attributes[:alt] || 'Image'
    css_class = attributes[:class] || ''
    title = attributes[:title]

    picture_html = []
    picture_html << '<picture>'

    # Generate sources for each format
    IMAGE_FORMATS.each do |format|
      next if format == 'jpg' # Skip JPEG for sources, it's the fallback

      srcset_urls = RESPONSIVE_WIDTHS.map do |width|
        url = "https://res.cloudinary.com/#{CLOUD_NAME}/image/upload/q_auto,f_#{format},w_#{width}/#{public_id}"
        "#{url} #{width}w"
      end

      mime_type = format == 'jpg' ? 'image/jpeg' : "image/#{format}"

      picture_html << "  <!-- #{format.upcase} format -->"
      picture_html << '  <source'
      picture_html << '    srcset="'
      picture_html << "      #{srcset_urls.join(',')}"
      picture_html << '    "'
      picture_html << "    type=\"#{mime_type}\""
      picture_html << '    sizes="(max-width: 768px) 100vw, 768px"'
      picture_html << '  />'
      picture_html << ''
    end

    # JPEG fallback source
    jpeg_srcset = RESPONSIVE_WIDTHS.map do |width|
      url = "https://res.cloudinary.com/#{CLOUD_NAME}/image/upload/q_auto,f_jpg,w_#{width}/#{public_id}"
      "#{url} #{width}w"
    end

    picture_html << '  <!-- JPEG fallback -->'
    picture_html << '  <source'
    picture_html << '    srcset="'
    picture_html << "      #{jpeg_srcset.join(',')}"
    picture_html << '    "'
    picture_html << '    type="image/jpeg"'
    picture_html << '    sizes="(max-width: 768px) 100vw, 768px"'
    picture_html << '  />'
    picture_html << ''

    # Final fallback img tag
    fallback_url = "https://res.cloudinary.com/#{CLOUD_NAME}/image/upload/q_auto,f_jpg,w_768/#{public_id}"

    img_attrs = []
    img_attrs << "src=\"#{fallback_url}\""
    img_attrs << "alt=\"#{alt_text}\""
    img_attrs << "loading=\"lazy\""
    img_attrs << "decoding=\"async\""
    img_attrs << "width=\"#{width}\""
    img_attrs << "height=\"#{height}\""
    img_attrs << "class=\"#{css_class}\"" unless css_class.empty?
    img_attrs << "title=\"#{title}\"" if title

    picture_html << '  <!-- Final fallback with alt and lazy loading -->'
    picture_html << '  <img'
    img_attrs.each do |attr|
      picture_html << "    #{attr}"
    end
    picture_html << '  />'
    picture_html << '</picture>'

    picture_html.join("\n")
  end

  def find_mapping_entry(image_path)
    # Remove leading slash and normalize path
    normalized_path = image_path.sub(/^\/*/, '')

    # Try exact match first
    return @mapping_data[normalized_path] if @mapping_data[normalized_path]

    # Extract base information
    base_name = File.basename(normalized_path, '.*')
    dir_path = File.dirname(normalized_path)
    dir_path = '' if dir_path == '.'

    # For assets/img paths, convert to posts path format
    if normalized_path.start_with?('assets/img/posts/')
      posts_path = normalized_path.sub('assets/img/', '')

      # Try exact match with posts path
      return @mapping_data[posts_path] if @mapping_data[posts_path]

      # Try with different extensions
      posts_base = File.basename(posts_path, '.*')
      posts_dir = File.dirname(posts_path)
      posts_dir = '' if posts_dir == '.'

      %w[.jpg .jpeg .png .webp .avif].each do |ext|
        test_path = posts_dir.empty? ? "#{posts_base}#{ext}" : "#{posts_dir}/#{posts_base}#{ext}"
        return @mapping_data[test_path] if @mapping_data[test_path]
      end
    end

    # Try to find by filename with different extensions
    %w[.jpg .jpeg .png .webp .avif].each do |ext|
      test_path = dir_path.empty? ? "#{base_name}#{ext}" : "#{dir_path}/#{base_name}#{ext}"
      return @mapping_data[test_path] if @mapping_data[test_path]
    end

    # Try to find by filename only (in case directory structure differs)
    filename = File.basename(normalized_path)
    @mapping_data.each do |key, data|
      return data if File.basename(key) == filename
    end

    # Try filename without extension
    @mapping_data.each do |key, data|
      return data if File.basename(key, '.*') == base_name
    end

    nil
  end

  def backup_file(file_path)
    backup_path = file_path + BACKUP_SUFFIX
    FileUtils.cp(file_path, backup_path)
    @logger.debug "Created backup: #{backup_path}"
  end

  def relative_path(file_path)
    Pathname.new(file_path).relative_path_from(Pathname.new(@project_root)).to_s
  end

  def print_summary
    @logger.info "\n" + "=" * 60
    @logger.info "MIGRATION SUMMARY"
    @logger.info "=" * 60
    @logger.info "Files processed: #{@stats[:files_processed]}"
    @logger.info "Markdown image replacements: #{@stats[:markdown_replacements]}"
    @logger.info "HTML image replacements: #{@stats[:html_replacements]}"
    @logger.info "Total replacements: #{@stats[:markdown_replacements] + @stats[:html_replacements]}"
    @logger.info "Errors encountered: #{@stats[:errors]}"
    @logger.info "=" * 60

    if @stats[:files_processed] > 0
      @logger.info "\nBackup files created with .backup extension"
      @logger.info "Review changes and remove backups when satisfied"
    end
  end
end

# CLI interface
if __FILE__ == $0
  begin
    mapping_file = ARGV[0] || 'mapping-cloudinary-urls.json'
    migrator = CloudinaryMigrationEnterprise.new(mapping_file)
    migrator.migrate!
  rescue Interrupt
    puts "\nMigration interrupted by user"
    exit 1
  rescue => e
    puts "Error: #{e.message}"
    exit 1
  end
end
