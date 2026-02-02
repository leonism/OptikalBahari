#!/usr/bin/env ruby

require 'cloudinary'
require 'cloudinary/uploader'
require 'cloudinary/utils'
require 'json'
require 'find'
require 'colorize'
require 'dotenv/load'
require 'fileutils'
require 'thread' # Required for parallel processing

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

    @base_path = File.expand_path('../../assets/img/', __dir__)

    # Thread-safe storage
    @mapping = {}
    @mutex = Mutex.new # The traffic cop for our threads

    @uploaded_count = 0
    @failed_count = 0
    @skipped_count = 0
    @total_files = 0
    @processed_count = 0 # To track progress across threads
  end

  def run
    puts "\n🚀 Starting Cloudinary Upload Process (Parallel Mode)".colorize(:cyan).bold
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
    puts "\n📤 Starting parallel upload (5 threads)...".colorize(:cyan)

    # Create a queue of work
    queue = Queue.new
    image_files.each { |f| queue << f }

    # Create 5 worker threads
    threads = Array.new(5) do
      Thread.new do
        until queue.empty?
          # Safely pull a file off the queue
          begin
            file_path = queue.pop(true)
            process_single_file(file_path)
          rescue ThreadError
            # Queue was empty, thread can exit
          end
        end
      end
    end

    # Wait for all threads to finish
    threads.each(&:join)
  end

  def process_single_file(file_path)
    begin
      # Generate public_id preserving directory structure
      relative_path = file_path.sub(@base_path.chomp('/') + '/', '')
      public_id = relative_path.sub(/\.[^.]+$/, '')

      # Check if asset already exists (returns data if match, nil if not)
      existing_data = check_if_identical(file_path, public_id)

      if existing_data
        # THREAD SAFETY: Lock before writing to shared counters/mapping
        @mutex.synchronize do
          @skipped_count += 1
          @processed_count += 1
          @mapping[relative_path] = existing_data
          print_progress("⏭️  Skipped", relative_path, :blue)
        end
      else
        # Upload to Cloudinary
        upload_options = {
          public_id: public_id,
          resource_type: 'image',
          overwrite: true,
          quality: 'auto',
          fetch_format: 'auto',
          use_filename: false,
          unique_filename: false
        }

        # Handle dynamic folders
        if public_id.include?('/')
          upload_options[:asset_folder] = File.dirname(public_id)
        end

        result = Cloudinary::Uploader.upload(file_path, upload_options)

        # Prepare data to save
        saved_data = {
          public_id: result['public_id'],
          secure_url: result['secure_url'],
          url: result['url'],
          format: result['format'],
          width: result['width'],
          height: result['height'],
          bytes: result['bytes'],
          created_at: result['created_at']
        }

        # THREAD SAFETY: Lock before writing
        @mutex.synchronize do
          @uploaded_count += 1
          @processed_count += 1
          @mapping[relative_path] = saved_data
          print_progress("✅ Uploaded", relative_path, :green)
        end
      end

    rescue => e
      @mutex.synchronize do
        @failed_count += 1
        @processed_count += 1
        puts "❌ Failed: #{File.basename(file_path)} - #{e.message}".colorize(:red)
      end
    end
  end

  # Helper to print thread-safe progress
  def print_progress(action, path, color)
    # Simple log line instead of complex progress bar to avoid thread collision
    percentage = (@processed_count.to_f / @total_files * 100).round(0)
    puts "[#{percentage}%] #{action}: #{path}".colorize(color)
  end

  # Refactored to return Data or Nil (No side effects!)
  def check_if_identical(file_path, public_id)
    begin
      local_file_size = File.size(file_path)

      # Check Cloudinary explicitly
      result = Cloudinary::Uploader.explicit(
        public_id,
        type: 'upload',
        resource_type: 'image'
      )

      remote_file_size = result['bytes']

      if local_file_size == remote_file_size
        # Return the data structure so the main thread can save it
        return {
          public_id: result['public_id'],
          secure_url: result['secure_url'],
          url: result['url'],
          format: result['format'],
          width: result['width'],
          height: result['height'],
          bytes: result['bytes'],
          created_at: result['created_at']
        }
      end

      return nil # Files differ
    rescue Cloudinary::Api::NotFound
      return nil # Not found
    rescue => e
      return nil # Error implies we should probably re-upload
    end
  end

  def generate_mapping_file
    puts "\n📝 Generating mapping file...".colorize(:blue)

    enhanced_mapping = {}

    @mapping.each do |local_path, data|
      public_id = data[:public_id]
      base_url = "https://res.cloudinary.com/#{ENV['CLOUDINARY_CLOUD_NAME']}/image/upload"

      # Responsive URL generation
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

      srcsets = {
        avif: "#{responsive_urls[:avif]['480w']} 480w, #{responsive_urls[:avif]['768w']} 768w, #{responsive_urls[:avif]['1200w']} 1200w",
        webp: "#{responsive_urls[:webp]['480w']} 480w, #{responsive_urls[:webp]['768w']} 768w, #{responsive_urls[:webp]['1200w']} 1200w",
        jpeg: "#{responsive_urls[:jpeg]['480w']} 480w, #{responsive_urls[:jpeg]['768w']} 768w, #{responsive_urls[:jpeg]['1200w']} 1200w"
      }

      picture_html = generate_picture_html(srcsets, responsive_urls[:fallback], File.basename(local_path, '.*'), data[:width], data[:height])

      enhanced_mapping[local_path] = {
        original: data,
        responsive_urls: responsive_urls,
        srcsets: srcsets,
        picture_html: picture_html
      }
    end

    mapping_file = File.join(File.dirname(__FILE__), 'mapping-cloudinary-urls.json')
    File.write(mapping_file, JSON.pretty_generate(enhanced_mapping))

    puts "✅ Mapping file saved: #{mapping_file}".colorize(:green)
  end

  def generate_picture_html(srcsets, fallback_url, alt_text, width, height)
    <<~HTML
      <picture>
        <source srcset="#{srcsets[:avif]}" type="image/avif" sizes="(max-width: 768px) 100vw, 768px">
        <source srcset="#{srcsets[:webp]}" type="image/webp" sizes="(max-width: 768px) 100vw, 768px">
        <source srcset="#{srcsets[:jpeg]}" type="image/jpeg" sizes="(max-width: 768px) 100vw, 768px">
        <img src="#{fallback_url}" alt="#{alt_text}" loading="lazy" decoding="async" width="#{width}" height="#{height}">
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

if __FILE__ == $0
  uploader = CloudinaryUploader.new
  uploader.run
end
