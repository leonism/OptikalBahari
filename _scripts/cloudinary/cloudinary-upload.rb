#!/usr/bin/env ruby

require 'base64'
require 'dotenv'
require 'cloudinary'
require 'cloudinary/uploader'
require 'cloudinary/api'
require 'json'
require 'find'
require 'fileutils'
require 'thread'
require 'set'
require 'time'
require 'optparse'

# ============================================================
# Paths
# ============================================================

PROJECT_ROOT = File.expand_path('../..', __dir__)
ASSETS_DIR = File.join(PROJECT_ROOT, 'assets', 'img')

OUTPUT_FILE = File.join(PROJECT_ROOT, 'mapping-cloudinary-urls.json')
CHECKPOINT_FILE = File.join(PROJECT_ROOT, '.cloudinary-upload-checkpoint.json')

Dotenv.load(File.join(PROJECT_ROOT, '.env'))

# ============================================================
# CLI Options
# ============================================================

OPTIONS = {
  dry_run: false,
  force: false,
  threads: 4
}

OptionParser.new do |opts|
  opts.banner = "Usage: ruby cloudinary-upload.rb [options]"

  opts.on('--dry-run', 'Simulate uploads') { OPTIONS[:dry_run] = true }
  opts.on('--force', 'Reupload even if exists') { OPTIONS[:force] = true }
  opts.on('--threads N', Integer, 'Worker threads') { |n| OPTIONS[:threads] = n }
end.parse!

# ============================================================
# ENV Validation
# ============================================================

%w[CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET].each do |k|
  abort "❌ Missing ENV var: #{k}" unless ENV[k]
end

# ============================================================
# Cloudinary Config
# ============================================================

Cloudinary.config do |c|
  c.cloud_name = ENV['CLOUDINARY_CLOUD_NAME']
  c.api_key = ENV['CLOUDINARY_API_KEY']
  c.api_secret = ENV['CLOUDINARY_API_SECRET']
  c.secure = true
end

# ============================================================
# Constants
# ============================================================

RESPONSIVE_WIDTHS = [480, 768, 1200]
FORMATS = { avif: 'avif', webp: 'webp', jpeg: 'jpg' }

RATE_LIMIT_DELAY = 0.15

# ============================================================
# Simple Progress
# ============================================================

class Progress
  def initialize(total)
    @total = total
    @done = 0
    @start = Time.now
    @mutex = Mutex.new
  end

  def tick
    @mutex.synchronize do
      @done += 1
      elapsed = Time.now - @start
      rate = @done / elapsed
      eta = ((@total - @done) / rate).round rescue 0

      print "\r📊 #{@done}/#{@total} | ETA: #{eta}s"
    end
  end
end

# ============================================================
# Rate limiter
# ============================================================

def throttle
  sleep RATE_LIMIT_DELAY
end

# ============================================================
# Main
# ============================================================

class CloudinaryUploader

  def initialize
    @existing_ids = Set.new
    @results = load_mapping
    @checkpoint = load_checkpoint
    @queue = Queue.new
  end

  # --------------------------------------------------------

  def run
    banner
    fetch_existing_assets
    scan_files
    progress = Progress.new(@queue.size)

    workers = OPTIONS[:threads].times.map do
      Thread.new do
        loop do
          begin
            item = @queue.pop(true)
          rescue ThreadError
            break
          end

          process_file(item)
          progress.tick
        end
      end
    end

    workers.each(&:join)

    save_mapping
    clear_checkpoint

    puts "\n🎉 Upload complete!"
  end

  # --------------------------------------------------------

  def banner
    puts "🚀 Cloudinary Bulk Upload"
    puts "=" * 60
    puts "Threads: #{OPTIONS[:threads]}"
    puts "Dry run: #{OPTIONS[:dry_run]}"
    puts "Force: #{OPTIONS[:force]}"
    puts "=" * 60
  end

  # --------------------------------------------------------

  def fetch_existing_assets
    puts "☁️ Fetching remote assets..."

    cursor = nil

    loop do
      throttle
      res = Cloudinary::Api.resources(
        max_results: 500,
        next_cursor: cursor
      )

      res['resources'].each do |r|
        @existing_ids << r['public_id']
      end

      cursor = res['next_cursor']
      break unless cursor
    end

    puts "✅ #{@existing_ids.size} remote files indexed"
  end

  # --------------------------------------------------------

  def scan_files
    Find.find(ASSETS_DIR) do |path|
      next if File.directory?(path)
      next unless path =~ /\.(png|jpg|jpeg|webp)$/i

      relative = path.sub("#{ASSETS_DIR}/", '')
      public_id = relative.sub(/\.[^.]+$/, '')

      next if @checkpoint.include?(public_id)

      @queue << {
        path: path,
        relative: relative,
        public_id: public_id
      }
    end

    puts "🔍 #{@queue.size} files queued"
  end

  # --------------------------------------------------------

  def process_file(item)
    path = item[:path]
    public_id = item[:public_id]
    foldered_id = public_id

    if @existing_ids.include?(foldered_id) && !OPTIONS[:force]
      resource = Cloudinary::Api.resource(foldered_id)
    else
      unless OPTIONS[:dry_run]
        throttle
        resource = Cloudinary::Uploader.upload(
          path,
          public_id: foldered_id,
          overwrite: OPTIONS[:force],
          resource_type: :image
        )
      else
        resource = Cloudinary::Api.resource(foldered_id) rescue nil
      end
    end

    if resource
      @results[File.basename(path)] = build_mapping(foldered_id, resource)
    end

    save_checkpoint(foldered_id)

  rescue => e
    puts "\n❌ #{public_id}: #{e.message}"
  end

  # --------------------------------------------------------

  def build_mapping(public_id, r)
    cloud = ENV['CLOUDINARY_CLOUD_NAME']

    responsive = {}
    srcsets = {}

    FORMATS.each do |k, fmt|
      urls = {}

      RESPONSIVE_WIDTHS.each do |w|
        urls["#{w}w"] =
          "https://res.cloudinary.com/#{cloud}/image/upload/q_auto,f_#{fmt},w_#{w}/#{public_id}"
      end

      responsive[k.to_s] = urls
      srcsets[k.to_s] = urls.map { |k2, v| "#{v} #{k2}" }.join(', ')
    end

    fallback =
      "https://res.cloudinary.com/#{cloud}/image/upload/q_auto,f_auto,w_768/#{public_id}"

    {
      "original" => {
        "public_id" => r['public_id'],
        "secure_url" => r['secure_url'],
        "url" => r['url'],
        "format" => r['format'],
        "width" => r['width'],
        "height" => r['height'],
        "bytes" => r['bytes'],
        "created_at" => r['created_at']
      },
      "responsive_urls" => responsive.merge("fallback" => fallback),
      "srcsets" => srcsets,
      "picture_html" => picture_html(public_id, srcsets, fallback, r['width'], r['height'])
    }
  end

  # --------------------------------------------------------

  def picture_html(id, srcsets, fallback, w, h)
    <<~HTML
    <picture>
      <source srcset="#{srcsets['avif']}" type="image/avif">
      <source srcset="#{srcsets['webp']}" type="image/webp">
      <source srcset="#{srcsets['jpeg']}" type="image/jpeg">
      <img src="#{fallback}" alt="#{id}" loading="lazy" decoding="async" width="#{w}" height="#{h}">
    </picture>
    HTML
  end

  # --------------------------------------------------------

  def load_checkpoint
    File.exist?(CHECKPOINT_FILE) ? JSON.parse(File.read(CHECKPOINT_FILE)) : []
  end

  def save_checkpoint(id)
    data = load_checkpoint
    data << id
    File.write(CHECKPOINT_FILE, JSON.pretty_generate(data.uniq))
  end

  def clear_checkpoint
    FileUtils.rm_f(CHECKPOINT_FILE)
  end

  # --------------------------------------------------------

  def load_mapping
    File.exist?(OUTPUT_FILE) ? JSON.parse(File.read(OUTPUT_FILE)) : {}
  end

  def save_mapping
    File.write(OUTPUT_FILE, JSON.pretty_generate(@results))
  end
end

# ============================================================
# Run
# ============================================================

CloudinaryUploader.new.run
