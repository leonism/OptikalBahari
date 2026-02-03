#!/usr/bin/env ruby
require 'fileutils'

class CloudinaryUniversalMigration
  # --------------------------------------------------------------------------
  # CONFIGURATION
  # --------------------------------------------------------------------------
  CLOUD_NAME = 'divkqrf7k'
  BASE_URL = "https://res.cloudinary.com/#{CLOUD_NAME}/image/upload"

  # Scan directories
  BASE_DIR = File.expand_path('../../', __dir__)

  TARGET_DIRECTORIES = [
    File.join(BASE_DIR, '_pages'),
    File.join(BASE_DIR, '_posts'),
    File.join(BASE_DIR, '_includes', 'home')
  ]

  EXTENSIONS = ['.md', '.markdown', '.html']

  def initialize
    @stats = {
      total_files: 0,
      processed_files: 0,
      updated_files: 0,
      images_replaced: 0,
      skipped_files: 0
    }
  end

  def run
    puts "🚀 Starting Cloudinary Universal Image Migration (Fixed Indent)..."
    puts "Scanning Directories:"
    TARGET_DIRECTORIES.each { |d| puts " - #{d}" }
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

      Dir.glob("#{dir}/**/*{#{EXTENSIONS.join(',')}}").each do |file_path|
        @stats[:total_files] += 1
        process_file(file_path)
      end
    end
  end

  def process_file(file_path)
    content = File.read(file_path)

    # 1. Handle Frontmatter vs No Frontmatter (HTML includes)
    frontmatter = ""
    body_content = ""

    # Check if file starts with --- AND has a closing ---
    match_data = content.match(/\A(---\s*\n.*?\n---\s*\n)(.*)/m)

    if match_data
      # It has frontmatter (Standard Jekyll Post/Page)
      frontmatter = match_data[1]
      body_content = match_data[2]
    else
      # It has NO frontmatter (Standard HTML Include/Partial)
      # We treat the whole file as body content
      frontmatter = ""
      body_content = content
    end

    original_body = body_content.dup

    # 2. Universal IMG Regex
    img_regex = /<img\s+[^>]*?>/im

    body_content.gsub!(img_regex) do |img_tag|
      process_single_tag(img_tag)
    end

    # 3. Write back if changes occurred
    if body_content != original_body
      new_file_content = "#{frontmatter}#{body_content}"
      File.write(file_path, new_file_content)
      @stats[:updated_files] += 1
      puts "✅ Updated: #{file_path}"
    else
      @stats[:processed_files] += 1
    end
  end

  def process_single_tag(img_tag)
    # 1. Extract SRC
    raw_src = get_attribute(img_tag, 'src')

    # 2. Clean and Validate
    clean_path = extract_clean_path(raw_src)

    # Must contain 'assets/img' and NOT be cloudinary already
    return img_tag if clean_path.nil?
    return img_tag unless clean_path.include?('assets/img')
    return img_tag if clean_path.include?('cloudinary.com')

    # 3. Extract Public ID
    public_id = clean_path.sub(/^\/?assets\/img\//, '').sub(/\.[^.]*$/, '')

    # 4. Extract other attributes
    alt = get_attribute(img_tag, 'alt') || ""
    css_class = get_attribute(img_tag, 'class')
    raw_width = get_attribute(img_tag, 'width')
    raw_height = get_attribute(img_tag, 'height')

    # Width/Height Logic: Keep only if they are NOT Liquid tags
    width_attr = (raw_width && !raw_width.include?('{')) ? "width=\"#{raw_width.strip}\"" : ""
    height_attr = (raw_height && !raw_height.include?('{')) ? "height=\"#{raw_height.strip}\"" : ""
    class_attr = css_class ? "class=\"#{css_class.split.join(' ')}\"" : ""

    @stats[:images_replaced] += 1

    generate_picture_html(public_id, alt, class_attr, width_attr, height_attr)
  end

  # --------------------------------------------------------------------------
  # INTELLIGENT ATTRIBUTE PARSER
  # --------------------------------------------------------------------------
  def get_attribute(tag, attr_name)
    # STRATEGY 1: LIQUID PRIORITY {{ ... }}
    liquid_regex = /#{attr_name}\s*=\s*["']\s*(\{\{.*?\}\})\s*["']/im
    liquid_match = tag.match(liquid_regex)
    return liquid_match[1] if liquid_match

    # STRATEGY 2: STANDARD HTML FALLBACK " ... "
    standard_regex = /#{attr_name}\s*=\s*["']((?:[^"']|\s)*?)["']/im
    standard_match = tag.match(standard_regex)
    return standard_match[1] if standard_match

    nil
  end

  def extract_clean_path(raw_value)
    return nil unless raw_value

    clean = raw_value.dup
    # Remove {{ }}
    clean.gsub!(/\{\{/, '')
    clean.gsub!(/\}\}/, '')
    # Remove filters (| relative_url, | srcset, etc)
    clean.gsub!(/\|[\s\w_]+/, '')
    # Remove quotes
    clean.gsub!(/['"]/, '')
    # Remove whitespace/newlines
    clean.gsub!(/\s+/, '')

    clean
  end

  def generate_picture_html(public_id, alt, class_attr, width_attr, height_attr)
    sizes = "(max-width: 768px) 100vw, 768px"

    <<~HTML.chomp
<picture>
    <source srcset="#{BASE_URL}/q_auto:eco,f_avif,w_480,dpr_auto/#{public_id} 480w,#{BASE_URL}/q_auto:eco,f_avif,w_768,dpr_auto/#{public_id} 768w,#{BASE_URL}/q_auto:eco,f_avif,w_1200,dpr_auto/#{public_id} 1200w" type="image/avif" sizes="#{sizes}" />
    <source srcset="#{BASE_URL}/q_auto:eco,f_webp,w_480,dpr_auto/#{public_id} 480w,#{BASE_URL}/q_auto:eco,f_webp,w_768,dpr_auto/#{public_id} 768w,#{BASE_URL}/q_auto:eco,f_webp,w_1200,dpr_auto/#{public_id} 1200w" type="image/webp" sizes="#{sizes}" />
    <source srcset="#{BASE_URL}/q_auto:eco,f_jpg,w_480,dpr_auto/#{public_id} 480w,#{BASE_URL}/q_auto:eco,f_jpg,w_768,dpr_auto/#{public_id} 768w,#{BASE_URL}/q_auto:eco,f_jpg,w_1200,dpr_auto/#{public_id} 1200w" type="image/jpeg" sizes="#{sizes}" />
    <img
      src="#{BASE_URL}/q_auto:eco,f_jpg,w_768,dpr_auto/#{public_id}"
      alt="#{alt.strip.gsub(/\s+/, ' ')}"
      loading="lazy"
      decoding="async"
      #{width_attr}
      #{height_attr}
      #{class_attr}
      />
    </picture>
    HTML
  end

  def print_report
    puts "-" * 50
    puts "📊 Universal Migration Report"
    puts "-" * 50
    puts "Total Files Scanned:     #{@stats[:total_files]}"
    puts "Files with Changes:      #{@stats[:updated_files]}"
    puts "Total Images Converted:  #{@stats[:images_replaced]}"
    puts "Skipped (Empty/Err):     #{@stats[:skipped_files]}"
    puts "-" * 50
    puts "Done."
  end
end

if __FILE__ == $0
  migrator = CloudinaryUniversalMigration.new
  migrator.run
end
