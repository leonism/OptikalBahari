require 'digest'
require 'yaml'
require 'set'
require 'fileutils'
require 'zlib'
require 'brotli'

module AssetProcessor
  class UsageAnalyzer
    def initialize(site_dir)
      @site_dir = site_dir
      @used_assets = Set.new
      @asset_patterns = [
        /(?:href|src|data-src)=["']([^"']*\/(?:assets|css|js)\/[^"']*)["']/,
        /url\(["']?([^"')]*\/(?:assets|css|js)\/[^"')]*)["']?\)/,
        /import\s+["']([^"']*\/(?:assets|css|js)\/[^"']*)["']/
      ]
    end

    def analyze_usage
      puts "🔍 Analyzing asset usage..."

      # Scan all HTML, CSS, JS, and Markdown files
      scan_files([
        File.join(@site_dir, '**', '*.html'),
        File.join(@site_dir, '**', '*.css'),
        File.join(@site_dir, '**', '*.js'),
        File.join(@site_dir, '**', '*.scss'),
        File.join(@site_dir, '**', '*.md')
      ])

      # Always include critical assets
      add_critical_assets

      puts "📊 Found #{@used_assets.size} referenced assets"
      @used_assets
    end

    private

    def scan_files(patterns)
      patterns.each do |pattern|
        Dir.glob(pattern).each do |file|
          next if File.directory?(file)
          scan_file_content(file)
        end
      end
    end

    def scan_file_content(file_path)
      content = File.read(file_path)

      @asset_patterns.each do |pattern|
        content.scan(pattern) do |match|
          asset_path = match[0]
          # Normalize path (remove leading slash, resolve relative paths)
          normalized_path = normalize_asset_path(asset_path, file_path)
          @used_assets.add(normalized_path) if normalized_path
        end
      end
    rescue => e
      puts "⚠️  Warning: Could not scan #{file_path}: #{e.message}"
    end

    def normalize_asset_path(path, source_file)
      # Remove leading slash and site URL
      clean_path = path.gsub(/^\/?/, '')

      # Skip external URLs
      return nil if clean_path.match?(/^https?:\/\//)

      # Convert to site-relative path
      if clean_path.start_with?('assets/')
        clean_path
      else
        # Handle relative paths
        File.join(File.dirname(source_file.gsub(@site_dir + '/', '')), clean_path)
      end
    end

    def add_critical_assets
      # Always include main CSS and JS files
      critical_assets = [
        'assets/main.css',
        'assets/js/scripts.js',
        'assets/vendor/bootstrap/css/bootstrap.min.css',
        'assets/vendor/bootstrap/js/bootstrap.bundle.min.js',
        'assets/vendor/jquery/jquery.min.js',
        'assets/vendor/fontawesome-free/css/all.min.css',
        'assets/vendor/font-awesome-4.5.0/css/font-awesome.min.css',
        'assets/vendor/startbootstrap-clean-blog/js/clean-blog.js'
      ]

      critical_assets.each { |asset| @used_assets.add(asset) }
    end
  end

  class SmartCache
    def initialize(cache_file = '.smart_asset_cache.yml')
      @cache_file = cache_file
      @cache = load_cache
    end

    def load_cache
      return {} unless File.exist?(@cache_file)
      YAML.load_file(@cache_file) || {}
    rescue
      {}
    end

    def save_cache
      File.write(@cache_file, @cache.to_yaml)
    end

    def file_changed?(file_path)
      return true unless File.exist?(file_path)

      stat = File.stat(file_path)
      cache_key = file_path
      cached_data = @cache[cache_key]

      return true unless cached_data

      # Check multiple factors for change detection
      cached_data['mtime'] != stat.mtime.to_f ||
      cached_data['size'] != stat.size ||
      cached_data['content_hash'] != calculate_content_hash(file_path)
    end

    def update_cache(file_path, processed_files = [])
      stat = File.stat(file_path)
      @cache[file_path] = {
        'mtime' => stat.mtime.to_f,
        'size' => stat.size,
        'content_hash' => calculate_content_hash(file_path),
        'processed_files' => processed_files,
        'processed_at' => Time.now.to_f
      }
    end

    def get_processed_files(file_path)
      @cache.dig(file_path, 'processed_files') || []
    end

    private

    def calculate_content_hash(file_path)
      Digest::SHA256.file(file_path).hexdigest
    rescue
      nil
    end
  end

  class OptimizedProcessor
    def initialize(site)
      @site = site
      @site_dir = site.dest
      @cache = SmartCache.new
      @manifest = load_manifest
      @stats = {
        processed: 0,
        skipped: 0,
        hashed: 0,
        compressed: 0,
        total_size_before: 0,
        total_size_after: 0,
        processing_time: 0
      }
    end

    def process
      start_time = Time.now
      puts "🚀 Starting optimized asset processing..."

      # Step 1: Analyze which assets are actually used
      analyzer = UsageAnalyzer.new(@site_dir)
      used_assets = analyzer.analyze_usage

      # Step 2: Process only used assets
      process_used_assets(used_assets)

      # Step 3: Clean up unused processed assets
      cleanup_unused_assets(used_assets)

      # Step 4: Update HTML references
      update_html_references

      # Step 5: Save manifest and cache
      save_manifest
      @cache.save_cache

      @stats[:processing_time] = Time.now - start_time
      display_stats
    end

    private

    def process_used_assets(used_assets)
      puts "⚡ Processing #{used_assets.size} used assets..."

      used_assets.each do |asset_path|
        full_path = File.join(@site_dir, asset_path)
        next unless File.exist?(full_path)

        if should_process?(full_path)
          process_file(full_path, asset_path)
        else
          @stats[:skipped] += 1
          # Still add to manifest if already processed
          add_existing_to_manifest(asset_path)
        end
      end
    end

    def should_process?(file_path)
      # Skip if file hasn't changed
      return false unless @cache.file_changed?(file_path)

      # Skip non-processable files
      ext = File.extname(file_path).downcase
      processable_extensions = %w[.css .js .png .jpg .jpeg .gif .webp .svg .ico .woff .woff2 .ttf .eot]
      processable_extensions.include?(ext)
    end

    def process_file(file_path, asset_path)
      @stats[:processed] += 1
      @stats[:total_size_before] += File.size(file_path)

      processed_files = []

      # Hash the file for cache busting
      if should_hash?(file_path)
        hashed_path = hash_file(file_path, asset_path)
        processed_files << hashed_path if hashed_path
        file_path = File.join(@site_dir, hashed_path) if hashed_path
      end

      # Compress the file
      if should_compress?(file_path)
        compressed_files = compress_file(file_path)
        processed_files.concat(compressed_files)
      end

      # Update cache
      @cache.update_cache(File.join(@site_dir, asset_path), processed_files)

      @stats[:total_size_after] += File.size(file_path) if File.exist?(file_path)
    end

    def should_hash?(file_path)
      ext = File.extname(file_path).downcase
      hashable_extensions = %w[.css .js .png .jpg .jpeg .gif .webp .svg .ico]
      hashable_extensions.include?(ext)
    end

    def should_compress?(file_path)
      ext = File.extname(file_path).downcase
      compressible_extensions = %w[.css .js .html .svg .txt .xml .json]
      compressible_extensions.include?(ext) && File.size(file_path) > 1024 # Only compress files > 1KB
    end

    def hash_file(file_path, asset_path)
      return nil unless File.exist?(file_path)

      content_hash = Digest::SHA256.file(file_path).hexdigest[0, 8]
      ext = File.extname(asset_path)
      base_name = File.basename(asset_path, ext)
      dir_name = File.dirname(asset_path)

      hashed_filename = "#{base_name}-#{content_hash}#{ext}"
      hashed_path = File.join(dir_name, hashed_filename)
      hashed_full_path = File.join(@site_dir, hashed_path)

      # Copy original to hashed version
      FileUtils.cp(file_path, hashed_full_path)

      # Update manifest
      @manifest[asset_path] = hashed_path

      @stats[:hashed] += 1
      hashed_path
    end

    def compress_file(file_path)
      return [] unless File.exist?(file_path)

      compressed_files = []
      original_content = File.read(file_path)

      # Brotli compression
      begin
        brotli_content = Brotli.deflate(original_content, quality: 6)
        brotli_path = "#{file_path}.br"
        File.write(brotli_path, brotli_content)
        compressed_files << File.basename(brotli_path)
        @stats[:compressed] += 1
      rescue => e
        puts "⚠️  Brotli compression failed for #{file_path}: #{e.message}"
      end

      # Gzip compression
      begin
        gzip_content = Zlib::Deflate.deflate(original_content, Zlib::BEST_COMPRESSION)
        gzip_path = "#{file_path}.gz"
        File.write(gzip_path, gzip_content)
        compressed_files << File.basename(gzip_path)
        @stats[:compressed] += 1
      rescue => e
        puts "⚠️  Gzip compression failed for #{file_path}: #{e.message}"
      end

      compressed_files
    end

    def cleanup_unused_assets(used_assets)
      # Remove processed versions of assets that are no longer used
      @manifest.keys.each do |original_path|
        unless used_assets.include?(original_path)
          hashed_path = @manifest[original_path]
          full_hashed_path = File.join(@site_dir, hashed_path)

          [full_hashed_path, "#{full_hashed_path}.br", "#{full_hashed_path}.gz"].each do |file|
            File.delete(file) if File.exist?(file)
          end

          @manifest.delete(original_path)
        end
      end
    end

    def add_existing_to_manifest(asset_path)
      cached_files = @cache.get_processed_files(asset_path)
      return if cached_files.empty?

      # Check if hashed version exists
      hashed_file = cached_files.find { |f| f.include?('-') && !f.end_with?('.br', '.gz') }
      if hashed_file
        hashed_path = File.join(File.dirname(asset_path), hashed_file)
        @manifest[asset_path] = hashed_path if File.exist?(File.join(@site_dir, hashed_path))
      end
    end

    def update_html_references
      return if @manifest.empty?

      puts "🔄 Updating asset references in HTML files..."

      Dir.glob(File.join(@site_dir, '**', '*.html')).each do |html_file|
        content = File.read(html_file)
        modified = false

        @manifest.each do |original, hashed|
          if content.include?(original)
            content.gsub!(original, hashed)
            modified = true
          end
        end

        File.write(html_file, content) if modified
      end
    end

    def load_manifest
      manifest_path = File.join(@site_dir, 'assets', 'manifest.json')
      return {} unless File.exist?(manifest_path)

      JSON.parse(File.read(manifest_path))
    rescue
      {}
    end

    def save_manifest
      return if @manifest.empty?

      manifest_dir = File.join(@site_dir, 'assets')
      FileUtils.mkdir_p(manifest_dir)

      manifest_path = File.join(manifest_dir, 'manifest.json')
      manifest_data = {
        'assets' => @manifest,
        'generated_at' => Time.now.iso8601,
        'version' => '2.0'
      }

      File.write(manifest_path, JSON.pretty_generate(manifest_data))
    end

    def display_stats
      puts "\n📈 Asset Processing Complete!"
      puts "═" * 50
      puts "📁 Processed: #{@stats[:processed]} files"
      puts "⏭️  Skipped: #{@stats[:skipped]} files (unchanged)"
      puts "🔗 Hashed: #{@stats[:hashed]} files"
      puts "🗜️  Compressed: #{@stats[:compressed]} files"
      puts "⏱️  Processing time: #{@stats[:processing_time].round(2)}s"

      if @stats[:total_size_before] > 0
        savings = ((@stats[:total_size_before] - @stats[:total_size_after]).to_f / @stats[:total_size_before] * 100)
        puts "💾 Size reduction: #{format_bytes(@stats[:total_size_before] - @stats[:total_size_after])} (#{savings.round(1)}%)"
      end

      puts "✅ Manifest saved with #{@manifest.size} asset mappings"
      puts "═" * 50
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

# Jekyll Hook
Jekyll::Hooks.register :site, :post_write do |site|
  processor = AssetProcessor::OptimizedProcessor.new(site)
  processor.process
end
