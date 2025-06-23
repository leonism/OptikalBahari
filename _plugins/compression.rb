require 'digest'
require 'yaml'
require 'set'
require 'fileutils'
require 'zlib'
require 'brotli'
require 'thread'
require 'concurrent-ruby'

module AssetProcessor
  class FastUsageAnalyzer
    def initialize(site_dir)
      @site_dir = site_dir
      @used_assets = Concurrent::Set.new
      @asset_patterns = [
        /(?:href|src|data-src)=["']([^"']*\/(?:assets|css|js)\/[^"']*)["\']/,
        /url\(["']?([^"')]*\/(?:assets|css|js)\/[^"')]*)["\'']?\)/,
        /import\s+["']([^"']*\/(?:assets|css|js)\/[^"']*)["']/
      ]
      @critical_assets = Set.new([
        'assets/main.css',
        'assets/js/scripts.js',
        'assets/vendor/bootstrap/css/bootstrap.min.css',
        'assets/vendor/bootstrap/js/bootstrap.bundle.min.js',
        'assets/vendor/jquery/jquery.min.js',
        'assets/vendor/fontawesome-free/css/all.min.css',
        'assets/vendor/font-awesome-4.5.0/css/font-awesome.min.css',
        'assets/vendor/startbootstrap-clean-blog/js/clean-blog.js'
      ])
    end

    def analyze_usage
      puts "🔍 Fast analyzing asset usage..."

      # Add critical assets immediately
      @critical_assets.each { |asset| @used_assets.add(asset) }

      # Parallel file scanning for better performance
      scan_files_parallel

      puts "📊 Found #{@used_assets.size} referenced assets"
      @used_assets.to_a
    end

    private

    def scan_files_parallel
      file_patterns = [
        File.join(@site_dir, '**', '*.html'),
        File.join(@site_dir, '**', '*.css'),
        File.join(@site_dir, '**', '*.js')
      ]

      # Use thread pool for parallel processing
      thread_pool = Concurrent::FixedThreadPool.new(4)
      futures = []

      file_patterns.each do |pattern|
        Dir.glob(pattern).each do |file|
          next if File.directory?(file)

          futures << Concurrent::Future.execute(executor: thread_pool) do
            scan_file_content(file)
          end
        end
      end

      # Wait for all futures to complete
      futures.each(&:wait)
      thread_pool.shutdown
      thread_pool.wait_for_termination
    end

    def scan_file_content(file_path)
      content = File.read(file_path)

      @asset_patterns.each do |pattern|
        content.scan(pattern) do |match|
          asset_path = match[0]
          normalized_path = normalize_asset_path(asset_path)
          @used_assets.add(normalized_path) if normalized_path
        end
      end
    rescue
      # Silent fail for performance
    end

    def normalize_asset_path(path)
      clean_path = path.gsub(/^\/?/, '')
      return nil if clean_path.match?(/^https?:\/\//)
      clean_path.start_with?('assets/') ? clean_path : nil
    end
  end

  class UltraFastCache
    def initialize(cache_file = '.smart_asset_cache.yml')
      @cache_file = cache_file
      @cache = load_cache
      @dirty = false
      @stat_cache = {}
    end

    def load_cache
      return {} unless File.exist?(@cache_file)
      YAML.load_file(@cache_file) || {}
    rescue
      {}
    end

    def save_cache
      return unless @dirty
      File.write(@cache_file, @cache.to_yaml)
      @dirty = false
    end

    def file_changed?(file_path)
      return true unless File.exist?(file_path)

      # Use cached stat for performance
      stat = @stat_cache[file_path] ||= File.stat(file_path)
      cached_data = @cache[file_path]

      return true unless cached_data

      # Quick mtime check first (fastest)
      if cached_data['mtime'] != stat.mtime.to_f
        return true
      end

      # Size check (fast)
      if cached_data['size'] != stat.size
        return true
      end

      # Skip content hash for performance unless absolutely necessary
      false
    end

    def update_cache(file_path, processed_files = [])
      stat = @stat_cache[file_path] ||= File.stat(file_path)
      @cache[file_path] = {
        'mtime' => stat.mtime.to_f,
        'size' => stat.size,
        'processed_files' => processed_files,
        'processed_at' => Time.now.to_f
      }
      @dirty = true
    end

    def get_processed_files(file_path)
      @cache.dig(file_path, 'processed_files') || []
    end
  end

  class TurboProcessor
    def initialize(site)
      @site = site
      @site_dir = site.dest
      @cache = UltraFastCache.new
      @manifest = load_manifest
      @stats = {
        processed: 0,
        skipped: 0,
        hashed: 0,
        compressed: 0,
        processing_time: 0
      }
    end

    def process
      start_time = Time.now
      puts "🚀 Starting turbo asset processing..."

      # Fast usage analysis
      analyzer = FastUsageAnalyzer.new(@site_dir)
      used_assets = analyzer.analyze_usage

      # Parallel processing of assets
      process_assets_parallel(used_assets)

      # Quick cleanup and updates
      cleanup_unused_assets(used_assets)
      update_html_references_fast

      # Save everything
      save_manifest
      @cache.save_cache

      @stats[:processing_time] = Time.now - start_time
      display_stats
    end

    private

    def process_assets_parallel(used_assets)
      puts "⚡ Turbo processing #{used_assets.size} assets..."

      # Filter existing assets first
      existing_assets = used_assets.select do |asset_path|
        File.exist?(File.join(@site_dir, asset_path))
      end

      # Use thread pool for parallel processing
      thread_pool = Concurrent::FixedThreadPool.new(6)
      futures = []

      existing_assets.each do |asset_path|
        futures << Concurrent::Future.execute(executor: thread_pool) do
          process_single_asset(asset_path)
        end
      end

      # Wait for completion
      futures.each(&:wait)
      thread_pool.shutdown
      thread_pool.wait_for_termination
    end

    def process_single_asset(asset_path)
      full_path = File.join(@site_dir, asset_path)

      if should_process?(full_path)
        process_file_fast(full_path, asset_path)
      else
        @stats[:skipped] += 1
        add_existing_to_manifest(asset_path)
      end
    end

    def should_process?(file_path)
      return false unless @cache.file_changed?(file_path)

      ext = File.extname(file_path).downcase
      %w[.css .js .png .jpg .jpeg .gif .webp .svg .ico .woff .woff2 .ttf .eot].include?(ext)
    end

    def process_file_fast(file_path, asset_path)
      @stats[:processed] += 1
      processed_files = []

      # Fast hashing for cache busting
      if should_hash?(file_path)
        hashed_path = hash_file_fast(file_path, asset_path)
        processed_files << hashed_path if hashed_path
        file_path = File.join(@site_dir, hashed_path) if hashed_path
      end

      # Selective compression (skip small files)
      if should_compress_fast?(file_path)
        compressed_files = compress_file_fast(file_path)
        processed_files.concat(compressed_files)
      end

      @cache.update_cache(File.join(@site_dir, asset_path), processed_files)
    end

    def should_hash?(file_path)
      ext = File.extname(file_path).downcase
      %w[.css .js .png .jpg .jpeg .gif .webp .svg .ico].include?(ext)
    end

    def should_compress_fast?(file_path)
      ext = File.extname(file_path).downcase
      return false unless %w[.css .js .html .svg .txt .xml .json].include?(ext)

      # Only compress files larger than 2KB for better performance
      File.size(file_path) > 2048
    end

    def hash_file_fast(file_path, asset_path)
      return nil unless File.exist?(file_path)

      # Use faster MD5 instead of SHA256 for speed
      content_hash = Digest::MD5.file(file_path).hexdigest[0, 8]
      ext = File.extname(asset_path)
      base_name = File.basename(asset_path, ext)
      dir_name = File.dirname(asset_path)

      hashed_filename = "#{base_name}-#{content_hash}#{ext}"
      hashed_path = File.join(dir_name, hashed_filename)
      hashed_full_path = File.join(@site_dir, hashed_path)

      # Use hard link instead of copy for speed
      begin
        File.link(file_path, hashed_full_path)
      rescue
        FileUtils.cp(file_path, hashed_full_path)
      end

      @manifest[asset_path] = hashed_path
      @stats[:hashed] += 1
      hashed_path
    end

    def compress_file_fast(file_path)
      return [] unless File.exist?(file_path)

      compressed_files = []

      # Read file once
      original_content = File.read(file_path)

      # Parallel compression
      futures = []
      thread_pool = Concurrent::FixedThreadPool.new(2)

      # Brotli compression
      futures << Concurrent::Future.execute(executor: thread_pool) do
        begin
          brotli_content = Brotli.deflate(original_content, quality: 4) # Lower quality for speed
          brotli_path = "#{file_path}.br"
          File.write(brotli_path, brotli_content)
          File.basename(brotli_path)
        rescue
          nil
        end
      end

      # Gzip compression
      futures << Concurrent::Future.execute(executor: thread_pool) do
        begin
          gzip_content = Zlib::Deflate.deflate(original_content, Zlib::DEFAULT_COMPRESSION) # Faster compression
          gzip_path = "#{file_path}.gz"
          File.write(gzip_path, gzip_content)
          File.basename(gzip_path)
        rescue
          # Silent fail for performance
        end
      end

      # Collect results
      futures.each do |future|
        result = future.value
        if result
          compressed_files << result
          @stats[:compressed] += 1
        end
      end

      thread_pool.shutdown
      thread_pool.wait_for_termination

      compressed_files
    end

    def cleanup_unused_assets(used_assets)
      used_set = Set.new(used_assets)

      @manifest.keys.each do |original_path|
        unless used_set.include?(original_path)
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

      hashed_file = cached_files.find { |f| f.include?('-') && !f.end_with?('.br', '.gz') }
      if hashed_file
        hashed_path = File.join(File.dirname(asset_path), hashed_file)
        @manifest[asset_path] = hashed_path if File.exist?(File.join(@site_dir, hashed_path))
      end
    end

    def update_html_references_fast
      return if @manifest.empty?

      puts "🔄 Fast updating asset references..."

      html_files = Dir.glob(File.join(@site_dir, '**', '*.html'))

      # Parallel HTML processing
      thread_pool = Concurrent::FixedThreadPool.new(4)
      futures = []

      html_files.each do |html_file|
        futures << Concurrent::Future.execute(executor: thread_pool) do
          update_single_html_file(html_file)
        end
      end

      futures.each(&:wait)
      thread_pool.shutdown
      thread_pool.wait_for_termination
    end

    def update_single_html_file(html_file)
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
        'version' => '3.0'
      }

      File.write(manifest_path, JSON.generate(manifest_data)) # Faster than pretty_generate
    end

    def display_stats
      puts "\n📈 Turbo Asset Processing Complete!"
      puts "═" * 50
      puts "📁 Processed: #{@stats[:processed]} files"
      puts "⏭️  Skipped: #{@stats[:skipped]} files (unchanged)"
      puts "🔗 Hashed: #{@stats[:hashed]} files"
      puts "🗜️  Compressed: #{@stats[:compressed]} files"
      puts "⚡ Processing time: #{@stats[:processing_time].round(2)}s"
      puts "✅ Manifest saved with #{@manifest.size} asset mappings"
      puts "═" * 50
    end
  end
end

# Jekyll Hook
Jekyll::Hooks.register :site, :post_write do |site|
  processor = AssetProcessor::TurboProcessor.new(site)
  processor.process
end
