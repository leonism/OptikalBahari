#!/usr/bin/env ruby

require 'base64'
require 'cloudinary'
require 'cloudinary/uploader'
require 'cloudinary/utils'
require 'json'
require 'find'
require 'colorize'
require 'dotenv/load'
require 'fileutils'
require 'open-uri'

class CloudinarySync
  def initialize
    Dotenv.load

    Cloudinary.config(
      cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
      api_key:    ENV['CLOUDINARY_API_KEY'],
      api_secret: ENV['CLOUDINARY_API_SECRET'],
      secure:     true
    )

    @base_path = File.expand_path('../../assets/img/', __dir__)
    @mapping_file_path = File.join(File.dirname(__FILE__), 'mapping-cloudinary-urls.json')

    @local_files = []
    @remote_resources = {}
    @mapping = {}

    @stats = { uploaded: 0, downloaded: 0, skipped: 0, failed: 0 }
  end

  def run
    print_header "🚀 Starting Bidirectional Cloudinary Sync"

    return unless validate_config

    # Phase 1: Knowledge Gathering
    scan_local_files
    fetch_remote_resources

    # Phase 2: Execution
    upload_missing_to_cloud
    download_missing_to_local

    # Phase 3: Documentation
    generate_mapping_file
    show_summary
  end

  private

  # ==========================================
  # PHASE 1: GATHERING DATA
  # ==========================================

  def scan_local_files
    puts "🔍 Scanning local directory...".colorize(:blue)
    image_extensions = %w[.jpg .jpeg .png .webp]

    FileUtils.mkdir_p(@base_path) unless Dir.exist?(@base_path)

    Find.find(@base_path) do |path|
      if File.file?(path) && image_extensions.include?(File.extname(path).downcase)
        relative_path = path.sub(@base_path.chomp('/') + '/', '')
        @local_files << relative_path
      end
    end
    puts "   ✅ Found #{@local_files.length} local files".colorize(:green)
  end

  def fetch_remote_resources
    puts "☁️  Fetching inventory from Cloudinary...".colorize(:blue)

    next_cursor = nil
    total_fetched = 0

    begin
      loop do
        response = Cloudinary::Api.resources(
          type: 'upload',
          resource_type: 'image',
          max_results: 500,
          next_cursor: next_cursor
        )

        response['resources'].each do |res|
          # Store resource by public_id
          @remote_resources[res['public_id']] = res
        end

        total_fetched += response['resources'].length
        print "\r   ⏳ Fetched #{total_fetched} remote records...".colorize(:light_black)

        next_cursor = response['next_cursor']
        break unless next_cursor
      end
      puts "\n   ✅ Remote inventory complete: #{total_fetched} files known".colorize(:green)
    rescue => e
      puts "\n   ❌ CRITICAL ERROR: Could not fetch remote list: #{e.message}".colorize(:red)
      puts "      This will cause all files to look 'new' and re-upload.".colorize(:yellow)
      puts "      Check your API Key/Secret permissions (needs Admin API access).".colorize(:yellow)
    end
  end

  # ==========================================
  # PHASE 2: UPLOAD & DOWNLOAD
  # ==========================================

  def upload_missing_to_cloud
    print_header "📤 Syncing Local -> Cloud"

    # SAFETY CHECK: If fetch failed (0 remote files), warn the user
    if @remote_resources.empty? && @local_files.any?
      puts "⚠️  WARNING: No remote files found. Syncing assuming all files are new.".colorize(:yellow)
      puts "    (If you have files online, your API keys might be missing 'List Resources' permission)".colorize(:light_black)
      sleep(2)
    end

    total = @local_files.length

    @local_files.each_with_index do |relative_path, index|
      print_progress(index + 1, total, "Checking: #{truncate(relative_path)}")

      full_path = File.join(@base_path, relative_path)

      # --- ROBUST MATCHING LOGIC ---
      # 1. Clean ID (No extension): "folder/image"
      clean_id = relative_path.sub(/\.[^.]+$/, '')

      # 2. Raw ID (With extension): "folder/image.jpg"
      raw_id = relative_path

      # 3. Sanitized ID (Cloudinary replaces spaces with _): "folder/my_image"
      sanitized_id = clean_id.gsub(' ', '_')

      # Check all possibilities
      existing_resource = @remote_resources[clean_id] ||
                          @remote_resources[raw_id] ||
                          @remote_resources[sanitized_id]

      if existing_resource
        add_to_mapping(relative_path, existing_resource)
        @stats[:skipped] += 1
      else
        print "\n" # Move to new line for upload log
        # Use sanitized_id for upload to prevent infinite loops of renaming
        perform_upload(full_path, sanitized_id, relative_path)
      end
    end
    print "\n"
  end

  def perform_upload(file_path, target_public_id, relative_path)
    puts "   ⬆️  Uploading: #{relative_path}".colorize(:cyan)

    begin
      upload_options = {
        public_id: target_public_id,
        resource_type: 'image',
        overwrite: true,
        unique_filename: false,
        use_filename: false
      }

      if target_public_id.include?('/')
        upload_options[:asset_folder] = File.dirname(target_public_id)
      end

      result = Cloudinary::Uploader.upload(file_path, upload_options)

      @remote_resources[result['public_id']] = result
      add_to_mapping(relative_path, result)
      @stats[:uploaded] += 1
      puts "      ✅ Done".colorize(:green)
    rescue => e
      @stats[:failed] += 1
      puts "      ❌ Error: #{e.message}".colorize(:red)
    end
  end

  def download_missing_to_local
    print_header "📥 Syncing Cloud -> Local"

    total = @remote_resources.length

    @remote_resources.each_with_index do |(public_id, data), index|
      print_progress(index + 1, total, "Scanning: #{truncate(public_id)}")

      format = data['format']
      local_filename = public_id.end_with?(".#{format}") ? public_id : "#{public_id}.#{format}"
      local_full_path = File.join(@base_path, local_filename)

      unless File.exist?(local_full_path)
        print "\n"
        download_file(data['secure_url'], local_full_path, local_filename)
      end
    end
    print "\n"
  end

  def download_file(url, target_path, relative_display_path)
    puts "   ⬇️  Downloading: #{relative_display_path}".colorize(:magenta)

    begin
      FileUtils.mkdir_p(File.dirname(target_path))
      File.open(target_path, "wb") do |saved_file|
        URI.open(url) do |read_file|
          saved_file.write(read_file.read)
        end
      end
      @stats[:downloaded] += 1
      puts "      ✅ Saved".colorize(:green)
    rescue => e
      @stats[:failed] += 1
      puts "      ❌ Failed to download: #{e.message}".colorize(:red)
    end
  end

  # ==========================================
  # PHASE 3: MAPPING & HELPERS
  # ==========================================

  def print_progress(current, total, status = "")
    width = 30
    percent = (current.to_f / total * 100).round(1)
    completed = (width * (current.to_f / total)).to_i
    completed = width if completed > width
    bar = "█" * completed + "░" * (width - completed)
    print "\r   [#{bar.colorize(:green)}] #{percent}% #{status}"
  end

  def truncate(str, length = 30)
    str.length > length ? "#{str[0...length]}..." : str
  end

  def add_to_mapping(relative_path, data)
    @mapping[relative_path] = {
      public_id: data['public_id'],
      secure_url: data['secure_url'],
      url: data['url'],
      format: data['format'],
      width: data['width'],
      height: data['height'],
      bytes: data['bytes'],
      created_at: data['created_at']
    }
  end

  def generate_mapping_file
    print_header "📝 Generating Smart HTML Mapping"

    enhanced_mapping = {}

    @mapping.each do |local_path, data|
      public_id = data[:public_id]
      base_url = "https://res.cloudinary.com/#{ENV['CLOUDINARY_CLOUD_NAME']}/image/upload"

      responsive_urls = {
        avif: generate_variants(base_url, public_id, 'avif'),
        webp: generate_variants(base_url, public_id, 'webp'),
        jpeg: generate_variants(base_url, public_id, 'jpg'),
        fallback: "#{base_url}/q_auto,f_auto,w_768/#{public_id}"
      }

      srcsets = {
        avif: build_srcset(responsive_urls[:avif]),
        webp: build_srcset(responsive_urls[:webp]),
        jpeg: build_srcset(responsive_urls[:jpeg])
      }

      enhanced_mapping[local_path] = {
        original: data,
        responsive_urls: responsive_urls,
        srcsets: srcsets,
        picture_html: generate_picture_html(srcsets, responsive_urls[:fallback], File.basename(local_path, '.*'), data[:width], data[:height])
      }
    end

    File.write(@mapping_file_path, JSON.pretty_generate(enhanced_mapping))
    puts "✅ Saved to #{@mapping_file_path}".colorize(:green)
  end

  def generate_variants(base, pid, fmt)
    {
      '480w' => "#{base}/q_auto,f_#{fmt},w_480/#{pid}",
      '768w' => "#{base}/q_auto,f_#{fmt},w_768/#{pid}",
      '1200w' => "#{base}/q_auto,f_#{fmt},w_1200/#{pid}"
    }
  end

  def build_srcset(variants)
    "#{variants['480w']} 480w, #{variants['768w']} 768w, #{variants['1200w']} 1200w"
  end

  def generate_picture_html(srcsets, fallback, alt, w, h)
    # OUTPUTS A CLEAN SINGLE LINE STRING (Minified HTML)
    # No more \n escape characters in your JSON file!
    html_parts = [
      "<picture>",
      "<source srcset='#{srcsets[:avif]}' type='image/avif' sizes='(max-width: 768px) 100vw, 768px'>",
      "<source srcset='#{srcsets[:webp]}' type='image/webp' sizes='(max-width: 768px) 100vw, 768px'>",
      "<source srcset='#{srcsets[:jpeg]}' type='image/jpeg' sizes='(max-width: 768px) 100vw, 768px'>",
      "<img src='#{fallback}' alt='#{alt}' loading='lazy' decoding='async' width='#{w}' height='#{h}'>",
      "</picture>"
    ]

    html_parts.join("")
  end

  def validate_config
    required = %w[CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET]
    missing = required.select { |k| ENV[k].nil? }

    if missing.any?
      puts "❌ Missing .env vars: #{missing.join(', ')}".colorize(:red)
      return false
    end
    true
  end

  def print_header(text)
    puts "\n" + "="*60
    puts text.colorize(:cyan).bold
    puts "="*60
  end

  def show_summary
    print_header "📊 SYNC SUMMARY"
    puts "📂 Local Files Processed:  #{@local_files.count}"
    puts "⬆️  Uploaded to Cloud:    #{@stats[:uploaded]}".colorize(:green)
    puts "⬇️  Downloaded from Cloud: #{@stats[:downloaded]}".colorize(:magenta)
    puts "⏭️  Skipped (Existing):   #{@stats[:skipped]}".colorize(:blue)
    puts "❌ Errors:               #{@stats[:failed]}".colorize(:red)
    puts "\nDone! 🎉"
  end
end

if __FILE__ == $0
  CloudinarySync.new.run
end
