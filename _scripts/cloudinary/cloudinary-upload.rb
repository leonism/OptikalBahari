#!/usr/bin/env ruby

require 'dotenv'
require 'base64'
require 'cloudinary'
require 'cloudinary/uploader'
require 'cloudinary/api'
require 'json'
require 'find'
require 'colorize'
require 'fileutils'
require 'thread'
require 'set'
require 'time'

PROJECT_ROOT = File.expand_path('../..', __dir__)
Dotenv.load(File.join(PROJECT_ROOT, '.env'))

# ================= CONFIG =================

THREADS = 6

ASSETS_PATH = File.join(PROJECT_ROOT, 'assets/img')

MAPPING_FILE = File.join(PROJECT_ROOT, '_scripts/cloudinary/mapping-cloudinary-urls.json')

# =========================================


class CloudinaryUploader

  def initialize
    Cloudinary.config(
      cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
      api_key: ENV['CLOUDINARY_API_KEY'],
      api_secret: ENV['CLOUDINARY_API_SECRET'],
      secure: true
    )

    @existing_ids = Set.new
    @mapping = {}
    @mutex = Mutex.new

    @uploaded = 0
    @skipped = 0
    @failed = 0

    @start_time = Time.now
  end

  # ================= RUN =================

  def run
    puts "\n🚀 Starting Cloudinary Upload Process".colorize(:cyan)
    puts "=" * 60

    validate!

    files = scan_images
    total = files.size

    puts "\n☁️ Fetching existing Cloudinary assets...".colorize(:light_blue)
    fetch_existing_assets

    puts "📦 Remote assets found: #{@existing_ids.size}".colorize(:green)
    puts "📁 Local images found: #{total}".colorize(:green)

    queue = Queue.new
    files.each { |f| queue << f }

    workers = THREADS.times.map do
      Thread.new do
        loop do
          begin
            file = queue.pop(true)
          rescue ThreadError
            break
          end

          upload_file(file)
          print_progress(total)
        end
      end
    end

    workers.each(&:join)

    save_mapping
    summary
  end

  # =====================================

  def validate!
    %w[CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET].each do |v|
      if ENV[v].nil? || ENV[v].empty?
        abort "❌ Missing ENV var: #{v}".colorize(:red)
      end
    end

    abort "❌ Assets path not found: #{ASSETS_PATH}" unless Dir.exist?(ASSETS_PATH)

    puts "✅ Configuration OK".colorize(:green)
  end

  # ================= SCAN =================

  def scan_images
    exts = %w[.jpg .jpeg .png .webp .avif]
    files = []

    Find.find(ASSETS_PATH) do |path|
      if File.file?(path) && exts.include?(File.extname(path).downcase)
        files << path
      end
    end

    files
  end

  # ============ FETCH REMOTE ==============

  def fetch_existing_assets
    next_cursor = nil

    loop do
      res = Cloudinary::Api.resources(
        type: 'upload',
        resource_type: 'image',
        max_results: 500,
        next_cursor: next_cursor
      )

      res['resources'].each do |r|
        @existing_ids.add(r['public_id'])
      end

      next_cursor = res['next_cursor']
      break unless next_cursor
    end
  end

  # ============== UPLOAD ==================

  def upload_file(path)
    relative = path.sub("#{ASSETS_PATH}/", '')
    public_id = relative.sub(/\.[^.]+$/, '')

    if @existing_ids.include?(public_id)
      @mutex.synchronize { @skipped += 1 }
      return
    end

    begin
      result = Cloudinary::Uploader.upload(
        path,
        public_id: public_id,
        resource_type: 'image',
        overwrite: false,
        use_filename: false,
        unique_filename: false,
        quality: 'auto',
        fetch_format: 'auto'
      )

      @mutex.synchronize do
        @uploaded += 1
        @mapping[relative] = {
          public_id: result['public_id'],
          secure_url: result['secure_url'],
          width: result['width'],
          height: result['height'],
          bytes: result['bytes'],
          created_at: result['created_at']
        }
      end

    rescue => e
      @mutex.synchronize { @failed += 1 }
      puts "\n❌ Failed: #{relative} => #{e.message}".colorize(:red)
    end
  end

  # ============= PROGRESS =================

  def print_progress(total)
    done = @uploaded + @skipped + @failed
    percent = (done.to_f / total * 100).round(1)

    elapsed = Time.now - @start_time
    rate = done / elapsed if elapsed > 0
    eta = rate ? ((total - done) / rate).round : 0

    bar_width = 40
    filled = (bar_width * done / total.to_f).round
    bar = "█" * filled + "░" * (bar_width - filled)

    print "\r🔄 [#{bar}] #{percent}% | Uploaded: #{@uploaded} Skipped: #{@skipped} Failed: #{@failed} | ETA: #{eta}s"
  end

  # ============== SAVE ====================

  def save_mapping
    File.write(MAPPING_FILE, JSON.pretty_generate(@mapping))
    puts "\n\n📝 Mapping saved: #{MAPPING_FILE}".colorize(:green)
  end

  # ============= SUMMARY ==================

  def summary
    puts "\n" + "=" * 60
    puts "📊 SUMMARY".colorize(:cyan)
    puts "=" * 60
    puts "✅ Uploaded: #{@uploaded}".colorize(:green)
    puts "⏭️ Skipped: #{@skipped}".colorize(:blue)
    puts "❌ Failed: #{@failed}".colorize(:red)
    puts "⏱️ Time: #{(Time.now - @start_time).round}s"
    puts "=" * 60
  end
end


# ================= START =================

if __FILE__ == $0
  CloudinaryUploader.new.run
end
