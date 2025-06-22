# _plugins/compression.rb
# Enterprise-grade asset hashing and compression with intelligent caching

require 'brotli'
require 'zlib'
require 'find'
require 'digest'
require 'json'
require 'fileutils'
require 'yaml'

module AssetProcessor
  class Cache
    CACHE_FILE = '.asset_cache.yml'

    def initialize(site_path)
      @site_path = site_path
      @cache_path = File.join(site_path, CACHE_FILE)
      @cache = load_cache
    end

    def get(file_path)
      @cache[file_path]
    end

    def set(file_path, data)
      @cache[file_path] = data
    end

    def save
      File.write(@cache_path, YAML.dump(@cache))
    end

    def file_changed?(file_path)
      return true unless @cache[file_path]

      cached_mtime = @cache[file_path]['mtime']
      cached_size = @cache[file_path]['size']
      cached_hash = @cache[file_path]['content_hash']

      current_stat = File.stat(file_path)
      return true if current_stat.mtime.to_f != cached_mtime || current_stat.size != cached_size

      # Double-check with content hash for ultimate accuracy
      current_hash = Digest::SHA256.file(file_path).hexdigest
      current_hash != cached_hash
    end

    private

    def load_cache
      return {} unless File.exist?(@cache_path)
      YAML.load_file(@cache_path) || {}
    rescue => e
      puts "⚠️  Cache file corrupted, starting fresh: #{e.message}"
      {}
    end
  end

  class Processor
    COMPRESSIBLE_EXTS = %w[.html .css .js .md .ico .json .xml .svg .txt .jpg .jpeg .png .webp .avif].freeze
    HASHABLE_EXTS = %w[.css .js .jpg .jpeg .png .webp .avif .svg .ico].freeze
    COMPRESSION_QUALITY = {
      brotli: 11,
      gzip: Zlib::BEST_COMPRESSION
    }.freeze

    def initialize(site)
      @site = site
      @site_path = site.dest
      @cache = Cache.new(@site_path)
      @stats = {
        total_files: 0,
        processed_files: 0,
        skipped_files: 0,
        total_original: 0,
        total_brotli: 0,
        total_gzip: 0
      }
      @asset_manifest = {}
    end

    def process
      puts "\n🔨 Starting enterprise-grade asset processing..."

      # Load existing manifest if available
      load_existing_manifest

      # Process all eligible files
      process_files

      # Save manifest and cache
      save_manifest
      @cache.save

      # Update HTML references
      update_html_references

      # Display comprehensive stats
      display_stats
    end

    private

    def load_existing_manifest
      manifest_path = File.join(@site_path, 'assets', 'manifest.json')
      return unless File.exist?(manifest_path)

      @asset_manifest = JSON.parse(File.read(manifest_path))
      puts "📋 Loaded existing manifest with #{@asset_manifest.size} entries"
    rescue => e
      puts "⚠️  Could not load existing manifest: #{e.message}"
      @asset_manifest = {}
    end

    def process_files
      Find.find(@site_path) do |path|
        next if File.directory?(path)
        next unless COMPRESSIBLE_EXTS.include?(File.extname(path))
        next if already_hashed?(path)

        @stats[:total_files] += 1
        relative_path = path.sub(@site_path + '/', '')

        if should_skip_processing?(path, relative_path)
          @stats[:skipped_files] += 1
          add_to_stats_from_cache(path)
          next
        end

        process_file(path, relative_path)
        @stats[:processed_files] += 1
      end
    end

    def already_hashed?(path)
      File.basename(path) =~ /-[a-f0-9]{8}\./
    end

    def should_skip_processing?(path, relative_path)
      return false unless @cache.get(relative_path)
      return false if @cache.file_changed?(path)

      # Check if compressed files still exist
      cached_data = @cache.get(relative_path)
      return false unless cached_data['compressed_files']

      cached_data['compressed_files'].all? { |file| File.exist?(file) }
    end

    def process_file(path, relative_path)
      begin
        content = File.binread(path)
        content_hash = Digest::SHA256.hexdigest(content)
        file_stat = File.stat(path)

        # Handle hashing for cacheable assets
        if HASHABLE_EXTS.include?(File.extname(path))
          hashed_path, hashed_relative_path = create_hashed_version(path, content, relative_path)
          process_path = hashed_path
        else
          process_path = path
          hashed_relative_path = nil
        end

        # Perform compression
        compression_results = compress_file(process_path, content)

        # Update cache
        cache_data = {
          'mtime' => file_stat.mtime.to_f,
          'size' => file_stat.size,
          'content_hash' => content_hash,
          'compressed_files' => compression_results[:files],
          'compression_stats' => compression_results[:stats]
        }

        if hashed_relative_path
          cache_data['hashed_path'] = hashed_relative_path
        end

        @cache.set(relative_path, cache_data)

        # Update stats
        @stats[:total_original] += compression_results[:stats][:original]
        @stats[:total_brotli] += compression_results[:stats][:brotli]
        @stats[:total_gzip] += compression_results[:stats][:gzip]

        puts "   ✅ Processed: #{relative_path}#{hashed_relative_path ? " → #{hashed_relative_path}" : ""}"

      rescue => e
        puts "⚠️  Processing failed for #{path}: #{e.message}"
      end
    end

    def create_hashed_version(path, content, relative_path)
      file_hash = Digest::MD5.hexdigest(content)[0, 8]
      dir = File.dirname(path)
      basename = File.basename(path, File.extname(path))
      ext = File.extname(path)

      hashed_filename = "#{basename}-#{file_hash}#{ext}"
      hashed_path = File.join(dir, hashed_filename)
      hashed_relative_path = hashed_path.sub(@site_path + '/', '')

      # Copy original to hashed version
      FileUtils.cp(path, hashed_path)

      # Store in manifest
      @asset_manifest[relative_path] = {
        'original' => relative_path,
        'hashed' => hashed_relative_path,
        'hash' => file_hash,
        'size' => content.bytesize,
        'timestamp' => Time.now.to_f
      }

      [hashed_path, hashed_relative_path]
    end

    def compress_file(file_path, content = nil)
      content ||= File.binread(file_path)
      file_size = content.bytesize
      compressed_files = []

      # Brotli compression
      brotli_path = "#{file_path}.br"
      if !File.exist?(brotli_path) || File.mtime(file_path) > File.mtime(brotli_path)
        br_compressed = Brotli.deflate(content, quality: COMPRESSION_QUALITY[:brotli])
        File.binwrite(brotli_path, br_compressed)
        br_size = br_compressed.bytesize
      else
        br_size = File.size(brotli_path)
      end
      compressed_files << brotli_path

      # Gzip compression
      gzip_path = "#{file_path}.gz"
      if !File.exist?(gzip_path) || File.mtime(file_path) > File.mtime(gzip_path)
        Zlib::GzipWriter.open(gzip_path, COMPRESSION_QUALITY[:gzip]) { |gz| gz.write(content) }
        gz_size = File.size(gzip_path)
      else
        gz_size = File.size(gzip_path)
      end
      compressed_files << gzip_path

      {
        files: compressed_files,
        stats: {
          original: file_size,
          brotli: br_size,
          gzip: gz_size
        }
      }
    end

    def add_to_stats_from_cache(path)
      relative_path = path.sub(@site_path + '/', '')
      cached_data = @cache.get(relative_path)
      return unless cached_data && cached_data['compression_stats']

      stats = cached_data['compression_stats']
      @stats[:total_original] += stats['original']
      @stats[:total_brotli] += stats['brotli']
      @stats[:total_gzip] += stats['gzip']
    end

    def save_manifest
      return if @asset_manifest.empty?

      manifest_path = File.join(@site_path, 'assets', 'manifest.json')
      FileUtils.mkdir_p(File.dirname(manifest_path))

      # Add metadata to manifest
      manifest_with_meta = {
        'version' => '2.0',
        'generated_at' => Time.now.iso8601,
        'generator' => 'Jekyll Asset Processor Enterprise',
        'assets' => @asset_manifest
      }

      File.write(manifest_path, JSON.pretty_generate(manifest_with_meta))
      puts "\n📋 Asset manifest saved: #{@asset_manifest.size} hashed assets"
    end

    def update_html_references
      return if @asset_manifest.empty?

      html_files = Dir.glob(File.join(@site_path, '**', '*.html'))
      updated_files = 0

      html_files.each do |html_file|
        content = File.read(html_file)
        original_content = content.dup

        @asset_manifest.each do |original_path, asset_info|
          update_patterns = [
            /href=(["'])\/?#{Regexp.escape(original_path)}\1/,
            /src=(["'])\/?#{Regexp.escape(original_path)}\1/,
            /url\((["']?)\/?#{Regexp.escape(original_path)}\1\)/,
            /(["'])\/?#{Regexp.escape(original_path)}\1/
          ]

          update_patterns.each do |pattern|
            content.gsub!(pattern) do |match|
              match.gsub(original_path, asset_info['hashed'])
            end
          end
        end

        if content != original_content
          File.write(html_file, content)
          updated_files += 1
        end
      end

      puts "   🔄 Updated #{updated_files} HTML files with hashed asset references"
    end

    def display_stats
      puts "\n📊 Enterprise Asset Processing Summary:"
      puts "   Total files found: #{@stats[:total_files]}"
      puts "   Files processed: #{@stats[:processed_files]}"
      puts "   Files skipped (cached): #{@stats[:skipped_files]}"

      if @stats[:total_original] > 0
        brotli_savings = ((1 - @stats[:total_brotli].to_f / @stats[:total_original]) * 100).round(2)
        gzip_savings = ((1 - @stats[:total_gzip].to_f / @stats[:total_original]) * 100).round(2)

        puts "   Original size: #{format_bytes(@stats[:total_original])}"
        puts "   Brotli size: #{format_bytes(@stats[:total_brotli])} (#{brotli_savings}% saved)"
        puts "   Gzip size: #{format_bytes(@stats[:total_gzip])} (#{gzip_savings}% saved)"
      end

      efficiency = @stats[:total_files] > 0 ? ((@stats[:skipped_files].to_f / @stats[:total_files]) * 100).round(1) : 0
      puts "   Cache efficiency: #{efficiency}% (#{@stats[:skipped_files]}/#{@stats[:total_files]} files skipped)"
    end

    def format_bytes(bytes)
      units = ['B', 'KB', 'MB', 'GB']
      size = bytes.to_f
      unit_index = 0

      while size >= 1024 && unit_index < units.length - 1
        size /= 1024
        unit_index += 1
      end

      "#{size.round(2)} #{units[unit_index]}"
    end
  end
end

# Jekyll Hook Registration
Jekyll::Hooks.register :site, :post_write do |site|
  # Enable only in production (uncomment if needed)
  # next unless Jekyll.env == "production"

  processor = AssetProcessor::Processor.new(site)
  processor.process
end
