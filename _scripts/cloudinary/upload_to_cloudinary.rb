#!/usr/bin/env ruby

require 'cloudinary'
require 'cloudinary/uploader'
require 'cloudinary/utils'
require 'json'
require 'find'
require 'colorize'
require 'dotenv/load'
require 'fileutils'

class CloudinaryUploader
  def initialize
    # Load environment variables
    Dotenv.load

    # Configure Cloudinary
    Cloudinary.config(
      cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
      api_key: ENV['CLOUDINARY_API_KEY'],
      api_secret: ENV['CLOUDINARY_API_SECRET'],
      secure: true
    )

    @base_path = File.expand_path('../assets/img/', __dir__)
    @mapping = {}
    @uploaded_count = 0
    @failed_count = 0
    @skipped_count = 0
    @total_files = 0
    @progress_bar_width = 50
  end

  def run
    puts "\n🚀 Starting Cloudinary Upload Process".colorize(:cyan).bold
    puts "="*60

    # Validate configuration
    return unless validate_config

    # Scan for images
    image_files = scan_images
    return if image_files.empty?

    @total_files = image_files.length
    puts "\n📁 Found #{@total_files} image files to upload\n".colorize(:green)

    # Upload images
    upload_images(image_files)

    # Generate mapping file
    generate_mapping_file

    # Show summary
    show_summary
  end

  private

  def validate_config
    missing_vars = []
    missing_vars << 'CLOUDINARY_CLOUD_NAME' unless ENV['CLOUDINARY_CLOUD_NAME']
    missing_vars << 'CLOUDINARY_API_KEY' unless ENV['CLOUDINARY_API_KEY']
    missing_vars << 'CLOUDINARY_API_SECRET' unless ENV['CLOUDINARY_API_SECRET']

    if missing_vars.any?
      puts "❌ Missing environment variables: #{missing_vars.join(', ')}".colorize(:red)
      puts "Please check your .env file".colorize(:yellow)
      return false
    end

    unless Dir.exist?(@base_path)
      puts "❌ Assets directory not found: #{@base_path}".colorize(:red)
      return false
    end

    puts "✅ Configuration validated".colorize(:green)
    true
  end

  def scan_images
    puts "🔍 Scanning for images...".colorize(:blue)

    image_extensions = %w[.jpg .jpeg .png]
    image_files = []

    Find.find(@base_path) do |path|
      if File.file?(path) && image_extensions.include?(File.extname(path).downcase)
        image_files << path
      end
    end

    if image_files.empty?
      puts "❌ No image files found in #{@base_path}".colorize(:red)
    else
      puts "✅ Found #{image_files.length} image files".colorize(:green)
    end

    image_files
  end

  def upload_images(image_files)
    puts "\n📤 Starting sequential upload process...\n".colorize(:cyan)
    @skipped_count = 0

    image_files.each_with_index do |file_path, index|
      begin
        # Generate public_id preserving directory structure
        relative_path = file_path.sub(@base_path.chomp('/') + '/', '')
        # Keep the full path structure in public_id to create folders on Cloudinary
        public_id = relative_path.sub(/\.[^.]+$/, '')

        # Extract folder path for display purposes only
        folder_path = File.dirname(relative_path)
        folder_path = nil if folder_path == '.'

        # Show current file being processed
        filename = File.basename(file_path)
        puts "\n📸 Processing (#{index + 1}/#{@total_files}): #{filename}".colorize(:yellow)
        puts "   📂 Path: #{relative_path}".colorize(:light_blue)
        puts "   🗂️  Folder: #{folder_path || 'root'}".colorize(:light_cyan)
        puts "   🆔 Public ID: #{public_id}".colorize(:light_magenta)

        # Check if asset already exists with identical properties
        if asset_exists_and_identical?(file_path, public_id)
          puts "   ⏭️  Skipped: Asset already exists with identical properties".colorize(:blue)
          @skipped_count += 1
        else
          puts "   📤 Uploading to Cloudinary...".colorize(:cyan)

          # Upload to Cloudinary with folder structure preserved in public_id
          # For dynamic folder mode, we need both public_id and asset_folder
          upload_options = {
            public_id: public_id,
            resource_type: 'image',
            overwrite: true,
            quality: 'auto',
            fetch_format: 'auto',
            use_filename: false,  # Don't use original filename
            unique_filename: false  # Use our specified public_id exactly
          }

          # Add asset_folder for dynamic folder mode to ensure proper folder structure
          # Extract folder path from public_id for asset_folder parameter
          if public_id.include?('/')
            asset_folder_path = File.dirname(public_id)
            upload_options[:asset_folder] = asset_folder_path
          end

          # Note: asset_folder parameter ensures folder structure in Media Library
          # while public_id maintains the delivery URL path

          result = Cloudinary::Uploader.upload(file_path, upload_options)

          # Store mapping data
          @mapping[relative_path] = {
            public_id: result['public_id'],
            secure_url: result['secure_url'],
            url: result['url'],
            format: result['format'],
            width: result['width'],
            height: result['height'],
            bytes: result['bytes'],
            created_at: result['created_at']
          }

          @uploaded_count += 1
          puts "   ✅ Success: #{result['secure_url']}".colorize(:green)
        end

        # Add a small delay to ensure sequential processing
        sleep(0.5)

      rescue => e
        @failed_count += 1
        puts "   ❌ Failed: #{e.message}".colorize(:red)
        puts "   🔍 Error details: #{e.backtrace.first}".colorize(:light_red) if e.backtrace
      end

      # Update progress bar
      update_progress_bar(index + 1)
    end
  end

  def asset_exists_and_identical?(file_path, public_id)
    begin
      puts "   🔍 Checking if asset exists on Cloudinary...".colorize(:light_blue)

      # Get local file properties
      local_file_size = File.size(file_path)

      # Use explicit method to check if asset exists on Cloudinary
      # This method is not rate-limited and gives definitive results
      result = Cloudinary::Uploader.explicit(
        public_id,
        type: 'upload',
        resource_type: 'image'
      )

      # If we get here, the asset exists on Cloudinary
      remote_file_size = result['bytes']
      remote_width = result['width']
      remote_height = result['height']
      remote_format = result['format']

      puts "   📊 Local file: #{local_file_size} bytes".colorize(:light_cyan)
      puts "   ☁️  Remote file: #{remote_file_size} bytes, #{remote_width}x#{remote_height}, #{remote_format}".colorize(:light_cyan)

      # Compare file sizes as primary check
      # If sizes match, we consider them identical to avoid unnecessary uploads
      size_match = (local_file_size == remote_file_size)

      if size_match
        puts "   ✅ Files are identical (same size)".colorize(:green)

        # Store existing asset data in mapping for consistency
        relative_path = file_path.sub(@base_path.chomp('/') + '/', '')
        @mapping[relative_path] = {
          public_id: result['public_id'],
          secure_url: result['secure_url'],
          url: result['url'],
          format: result['format'],
          width: result['width'],
          height: result['height'],
          bytes: result['bytes'],
          created_at: result['created_at']
        }

        return true
      else
        puts "   📝 Files differ (size mismatch: local #{local_file_size} vs remote #{remote_file_size})".colorize(:yellow)
        return false
      end

    rescue Cloudinary::Api::NotFound
      # Asset doesn't exist on Cloudinary
      puts "   📭 Asset not found on Cloudinary".colorize(:light_yellow)
      return false
    rescue => e
      # Any other error, assume asset doesn't exist or needs re-upload
      puts "   ⚠️  Asset doesn't exist or needs re-upload: #{e.message}".colorize(:light_red)
      return false
    end
  end

  def update_progress_bar(current)
    percentage = (current.to_f / @total_files * 100).round(1)
    filled_width = (@progress_bar_width * current / @total_files).round
    empty_width = @progress_bar_width - filled_width

    bar = "#{'█' * filled_width}#{'░' * empty_width}"

    print "\r🔄 Progress: [#{bar.colorize(:cyan)}] #{percentage}% (#{current}/#{@total_files})"
    puts "" if current == @total_files
  end

  def generate_mapping_file
    puts "\n📝 Generating mapping file...".colorize(:blue)

    # Create enhanced mapping with responsive URLs
    enhanced_mapping = {}

    @mapping.each do |local_path, data|
      public_id = data[:public_id]

      # Generate responsive URLs for different formats and sizes using transformation parameters
      base_url = "https://res.cloudinary.com/#{ENV['CLOUDINARY_CLOUD_NAME']}/image/upload"

      # Generate responsive URLs for different formats and sizes

      responsive_urls = {
        avif: {
          '480w' => "#{base_url}/q_auto,f_avif,w_480/#{public_id}",
          '768w' => "#{base_url}/q_auto,f_avif,w_768/#{public_id}",
          '1200w' => "#{base_url}/q_auto,f_avif,w_1200/#{public_id}"
        },
        webp: {
          '480w' => "#{base_url}/q_auto,f_webp,w_480/#{public_id}",
          '768w' => "#{base_url}/q_auto,f_webp,w_768/#{public_id}",
          '1200w' => "#{base_url}/q_auto,f_webp,w_1200/#{public_id}"
        },
        jpeg: {
          '480w' => "#{base_url}/q_auto,f_jpg,w_480/#{public_id}",
          '768w' => "#{base_url}/q_auto,f_jpg,w_768/#{public_id}",
          '1200w' => "#{base_url}/q_auto,f_jpg,w_1200/#{public_id}"
        },
        fallback: "#{base_url}/q_auto,f_auto,w_768/#{public_id}"
      }

      # Generate srcset strings
      srcsets = {
        avif: "#{responsive_urls[:avif]['480w']} 480w, #{responsive_urls[:avif]['768w']} 768w, #{responsive_urls[:avif]['1200w']} 1200w",
        webp: "#{responsive_urls[:webp]['480w']} 480w, #{responsive_urls[:webp]['768w']} 768w, #{responsive_urls[:webp]['1200w']} 1200w",
        jpeg: "#{responsive_urls[:jpeg]['480w']} 480w, #{responsive_urls[:jpeg]['768w']} 768w, #{responsive_urls[:jpeg]['1200w']} 1200w"
      }

      # Generate complete picture element HTML
      picture_html = generate_picture_html(srcsets, responsive_urls[:fallback], File.basename(local_path, '.*'), data[:width], data[:height])

      enhanced_mapping[local_path] = {
        original: data,
        responsive_urls: responsive_urls,
        srcsets: srcsets,
        picture_html: picture_html
      }
    end

    # Save mapping file
    mapping_file = File.join(File.dirname(__FILE__), 'mapping-cloudinary-urls.json')
    File.write(mapping_file, JSON.pretty_generate(enhanced_mapping))

    puts "✅ Mapping file saved: #{mapping_file}".colorize(:green)
  end

  def generate_picture_html(srcsets, fallback_url, alt_text, width, height)
    <<~HTML
      <picture>
        <!-- AVIF format -->
        <source
          srcset="#{srcsets[:avif]}"
          type="image/avif"
          sizes="(max-width: 768px) 100vw, 768px">
        <!-- WebP format -->
        <source
          srcset="#{srcsets[:webp]}"
          type="image/webp"
          sizes="(max-width: 768px) 100vw, 768px">
        <!-- JPEG fallback -->
        <source
          srcset="#{srcsets[:jpeg]}"
          type="image/jpeg"
          sizes="(max-width: 768px) 100vw, 768px">
        <!-- Final fallback with alt and lazy loading -->
        <img
          src="#{fallback_url}"
          alt="#{alt_text}"
          loading="lazy"
          decoding="async"
          width="#{width}"
          height="#{height}">
      </picture>
    HTML
  end

  def show_summary
    puts "\n" + "="*60
    puts "📊 UPLOAD SUMMARY".colorize(:cyan).bold
    puts "="*60
    puts "✅ Successfully uploaded: #{@uploaded_count.to_s.colorize(:green).bold}"
    puts "⏭️  Skipped (already exists): #{@skipped_count.to_s.colorize(:blue).bold}" if @skipped_count > 0
    puts "❌ Failed uploads: #{@failed_count.to_s.colorize(:red).bold}" if @failed_count > 0
    puts "📁 Total files processed: #{@total_files.to_s.colorize(:blue).bold}"

    if @uploaded_count > 0 || @skipped_count > 0
      puts "\n🎉 All images are now optimized and delivered via Cloudinary!".colorize(:green).bold
      puts "📝 Check mapping-cloudinary-urls.json for responsive HTML snippets".colorize(:yellow)
    end

    puts "\n🏁 Upload process completed!".colorize(:cyan).bold
    puts "="*60
  end
end

# Run the uploader
if __FILE__ == $0
  uploader = CloudinaryUploader.new
  uploader.run
end
