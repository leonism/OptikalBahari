require 'digest'
require 'yaml'
require 'set'
require 'fileutils'
require 'zlib'
require 'brotli'
require 'thread'
require 'concurrent-ruby'
require 'digest'
require 'json'

module AssetProcessor
  # Configuration class to handle all user-configurable options
  class Configuration
    # Default configuration values
    DEFAULT_CONFIG = {
      # Compression settings
      'compression' => {
        'enabled' => true,
        'brotli' => {
          'enabled' => true,
          'quality' => 10,  # 0-11, higher = better compression but slower
          'window' => 22   # 10-24, affects memory usage
        },
        'gzip' => {
          'enabled' => true,
          'level' => Zlib::DEFAULT_COMPRESSION  # 1-9, higher = better compression
        },
        'min_file_size' => 2048,  # Only compress files larger than this (bytes)
        'file_types' => %w[.css .js .html .svg .txt .xml .json]
      },

      # Asset hashing settings
      'hashing' => {
        'enabled' => true,
        'algorithm' => 'md5',  # 'md5' or 'sha256'
        'hash_length' => 8,    # Length of hash in filename
        'file_types' => %w[.css .js .png .jpg .jpeg .gif .webp .svg .ico]
      },

      # Performance settings
      'performance' => {
        'thread_pool_size' => 1,        # Number of threads for parallel processing
        'html_thread_pool_size' => 1,   # Threads for HTML processing
        'compression_thread_pool_size' => 1,  # Threads for compression
        'enable_caching' => true,       # Enable smart caching
        'cache_file' => '.smart_asset_cache.yml'
      },

      # Asset analysis settings
      'analysis' => {
        'critical_assets' => [
          'assets/main.css',
          'assets/js/scripts.js',
          'assets/vendor/bootstrap/css/bootstrap.min.css',
          'assets/vendor/bootstrap/js/bootstrap.bundle.min.js',
          'assets/vendor/jquery/jquery.min.js',
          'assets/vendor/fontawesome-free/css/all.min.css',
          'assets/vendor/font-awesome-4.5.0/css/font-awesome.min.css',
          'assets/vendor/startbootstrap-clean-blog/js/clean-blog.js'
        ],
        'scan_directories' => ['assets', 'css', 'js'],
        'include_html_files' => true
      },

      # Output and logging settings
      'output' => {
        'verbose' => true,
        'show_stats' => true,
        'manifest_file' => 'assets/manifest.json'
      }
    }.freeze

    def initialize(site_config = {})
      @config = deep_merge(DEFAULT_CONFIG, site_config.fetch('asset_processor', {}))
      validate_config!
    end

    # Get configuration value using dot notation (e.g., 'compression.brotli.quality')
    def get(key_path)
      keys = key_path.split('.')
      keys.reduce(@config) { |config, key| config[key] }
    rescue
      nil
    end

    # Check if a feature is enabled
    def enabled?(feature_path)
      get("#{feature_path}.enabled") == true
    end

    # Get the full configuration hash
    def to_h
      @config
    end

    private

    # Deep merge two hashes
    def deep_merge(hash1, hash2)
      hash1.merge(hash2) do |key, oldval, newval|
        oldval.is_a?(Hash) && newval.is_a?(Hash) ? deep_merge(oldval, newval) : newval
      end
    end

    # Validate configuration values
    def validate_config!
      # Validate compression quality levels
      brotli_quality = get('compression.brotli.quality')
      raise "Brotli quality must be between 0-11" if brotli_quality && (brotli_quality < 0 || brotli_quality > 11)

      gzip_level = get('compression.gzip.level')
      raise "Gzip level must be between 1-9" if gzip_level && (gzip_level < 1 || gzip_level > 9)

      # Validate thread pool sizes
      thread_size = get('performance.thread_pool_size')
      raise "Thread pool size must be positive" if thread_size && thread_size <= 0
    end
  end

  # Enhanced usage analyzer with configurable options
  class FastUsageAnalyzer
    def initialize(site_dir, config)
      @site_dir = site_dir
      @config = config
      @used_assets = Concurrent::Set.new

      # Build asset patterns based on configured scan directories
      scan_dirs = @config.get('analysis.scan_directories').join('|')
      @asset_patterns = [
        /(?:href|src|data-src)=["']([^"']*\/(?:#{scan_dirs})\/[^"']*)["\']/,
        /url\(["']?([^"')]*\/(?:#{scan_dirs})\/[^"')]*)["\'']?\)/,
        /import\s+["']([^"']*\/(?:#{scan_dirs})\/[^"']*)["']/
      ]

      @critical_assets = Set.new(@config.get('analysis.critical_assets'))
    end

    def analyze_usage
      puts "🔍 Analyzing asset usage with custom configuration..." if @config.get('output.verbose')

      # Add critical assets immediately
      @critical_assets.each { |asset| @used_assets.add(asset) }

      # Add HTML files for compression if enabled
      if @config.get('analysis.include_html_files')
        html_files = Dir.glob(File.join(@site_dir, '**', '*.html')).map do |file|
          file.sub(@site_dir + '/', '')
        end
        html_files.each { |html_file| @used_assets.add(html_file) }
      end

      # Parallel file scanning for better performance
      scan_files_parallel

      puts "📊 Found #{@used_assets.size} referenced assets" if @config.get('output.verbose')
      @used_assets.to_a
    end

    private

    def scan_files_parallel
      file_patterns = [
        File.join(@site_dir, '**', '*.html'),
        File.join(@site_dir, '**', '*.css'),
        File.join(@site_dir, '**', '*.js')
      ]

      # Use configurable thread pool size
      thread_pool_size = [@config.get('performance.thread_pool_size'), 1].max
      thread_pool = Concurrent::FixedThreadPool.new(thread_pool_size)
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

      scan_dirs = @config.get('analysis.scan_directories')
      scan_dirs.any? { |dir| clean_path.start_with?("#{dir}/") } ? clean_path : nil
    end
  end

  # Enhanced caching system with configurable options
  class UltraFastCache
    def initialize(config)
      @cache_file = config.get('performance.cache_file')
      @enabled = config.get('performance.enable_caching')
      @cache = @enabled ? load_cache : {}
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
      return unless @enabled && @dirty
      File.write(@cache_file, @cache.to_yaml)
      @dirty = false
    end

    def file_changed?(file_path)
      return true unless @enabled
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

      false
    end

    def update_cache(file_path, processed_files = [])
      return unless @enabled

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
      return [] unless @enabled
      @cache.dig(file_path, 'processed_files') || []
    end
  end

  # Main processor with enhanced configurability
  class TurboProcessor
    def initialize(site)
      @site = site
      @site_dir = site.dest
      @config = Configuration.new(site.config)
      @cache = UltraFastCache.new(@config)
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
      puts "🚀 Starting configurable asset processing..." if @config.get('output.verbose')

      # Fast usage analysis with configuration
      analyzer = FastUsageAnalyzer.new(@site_dir, @config)
      used_assets = analyzer.analyze_usage

      # Parallel processing of assets
      process_assets_parallel(used_assets)

      # Quick cleanup and updates
      cleanup_unused_assets(used_assets)
      update_html_references_fast if @config.enabled?('hashing')

      # Save everything
      save_manifest
      @cache.save_cache

      @stats[:processing_time] = Time.now - start_time
      display_stats if @config.get('output.show_stats')
    end

    private

    def process_assets_parallel(used_assets)
      puts "⚡ Processing #{used_assets.size} assets with custom settings..." if @config.get('output.verbose')

      # Filter existing assets first
      existing_assets = used_assets.select do |asset_path|
        File.exist?(File.join(@site_dir, asset_path))
      end

      # Use configurable thread pool size
      thread_pool_size = [@config.get('performance.thread_pool_size'), 1].max
      thread_pool = Concurrent::FixedThreadPool.new(thread_pool_size)
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

      # Check if file type is configured for processing
      hash_types = @config.get('hashing.file_types')
      compress_types = @config.get('compression.file_types')

      (hash_types + compress_types).uniq.include?(ext)
    end

    def process_file_fast(file_path, asset_path)
      @stats[:processed] += 1
      processed_files = []

      # Configurable hashing
      if @config.enabled?('hashing') && should_hash?(file_path)
        hashed_path = hash_file_fast(file_path, asset_path)
        processed_files << hashed_path if hashed_path
        file_path = File.join(@site_dir, hashed_path) if hashed_path
      end

      # Configurable compression
      if @config.enabled?('compression') && should_compress_fast?(file_path)
        compressed_files = compress_file_fast(file_path)
        processed_files.concat(compressed_files)
      end

      @cache.update_cache(File.join(@site_dir, asset_path), processed_files)
    end

    def should_hash?(file_path)
      return false unless @config.enabled?('hashing')

      ext = File.extname(file_path).downcase
      @config.get('hashing.file_types').include?(ext)
    end

    def should_compress_fast?(file_path)
      return false unless @config.enabled?('compression')

      ext = File.extname(file_path).downcase
      return false unless @config.get('compression.file_types').include?(ext)

      # Use configurable minimum file size
      File.size(file_path) > @config.get('compression.min_file_size')
    end

    def hash_file_fast(file_path, asset_path)
      return nil unless File.exist?(file_path)

      # Use configurable hashing algorithm
      algorithm = @config.get('hashing.algorithm')
      hash_length = @config.get('hashing.hash_length')

      content_hash = case algorithm
                    when 'sha256'
                      Digest::SHA256.file(file_path).hexdigest[0, hash_length]
                    else # default to md5
                      Digest::MD5.file(file_path).hexdigest[0, hash_length]
                    end

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
      original_content = File.read(file_path)

      # Use configurable thread pool for compression
      thread_pool_size = [@config.get('performance.compression_thread_pool_size'), 1].max
      thread_pool = Concurrent::FixedThreadPool.new(thread_pool_size)
      futures = []

      # Configurable Brotli compression
      if @config.enabled?('compression.brotli')
        futures << Concurrent::Future.execute(executor: thread_pool) do
          begin
            quality = @config.get('compression.brotli.quality')
            window = @config.get('compression.brotli.window')

            brotli_content = Brotli.deflate(original_content,
              quality: quality,
              window: window
            )
            brotli_path = "#{file_path}.br"
            File.write(brotli_path, brotli_content)
            File.basename(brotli_path)
          rescue => e
            puts "Warning: Brotli compression failed for #{file_path}: #{e.message}" if @config.get('output.verbose')
            nil
          end
        end
      end

      # Configurable Gzip compression
      if @config.enabled?('compression.gzip')
        futures << Concurrent::Future.execute(executor: thread_pool) do
          begin
            level = @config.get('compression.gzip.level')
            gzip_content = Zlib::Deflate.deflate(original_content, level)
            gzip_path = "#{file_path}.gz"
            File.write(gzip_path, gzip_content)
            File.basename(gzip_path)
          rescue => e
            puts "Warning: Gzip compression failed for #{file_path}: #{e.message}" if @config.get('output.verbose')
            nil
          end
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

      puts "🔄 Updating asset references in HTML files..." if @config.get('output.verbose')

      html_files = Dir.glob(File.join(@site_dir, '**', '*.html'))

      # Use configurable thread pool for HTML processing
      thread_pool_size = [@config.get('performance.html_thread_pool_size'), 1].max
      thread_pool = Concurrent::FixedThreadPool.new(thread_pool_size)
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
      manifest_path = File.join(@site_dir, @config.get('output.manifest_file'))
      return {} unless File.exist?(manifest_path)

      JSON.parse(File.read(manifest_path))
    rescue
      {}
    end

    def save_manifest
      return if @manifest.empty?

      manifest_file = @config.get('output.manifest_file')
      manifest_dir = File.dirname(File.join(@site_dir, manifest_file))
      FileUtils.mkdir_p(manifest_dir)

      manifest_path = File.join(@site_dir, manifest_file)
      manifest_data = {
        'assets' => @manifest,
        'generated_at' => Time.now.iso8601,
        'version' => '4.0',
        'configuration' => @config.to_h
      }

      File.write(manifest_path, JSON.generate(manifest_data))
    end

    def display_stats
      puts "\n📈 Configurable Asset Processing Complete!"
      puts "═" * 60
      puts "📁 Processed: #{@stats[:processed]} files"
      puts "⏭️  Skipped: #{@stats[:skipped]} files (unchanged)"
      puts "🔗 Hashed: #{@stats[:hashed]} files"
      puts "🗜️  Compressed: #{@stats[:compressed]} files"
      puts "⚡ Processing time: #{@stats[:processing_time].round(2)}s"
      puts "✅ Manifest saved with #{@manifest.size} asset mappings"
      puts "🔧 Configuration: #{@config.get('compression.brotli.quality')} Brotli quality, #{@config.get('compression.gzip.level')} Gzip level"
      puts "═" * 60
    end
  end
end

# Jekyll Hook - automatically processes assets after site generation
Jekyll::Hooks.register :site, :post_write do |site|
  # Skip asset processing in development environment to improve serve performance
  next if Jekyll.env == 'development'

  begin
    processor = AssetProcessor::TurboProcessor.new(site)
    processor.process
  rescue Exception => e
    puts "\n❌ Asset Processor Failed!"
    puts "Error: #{e.message}"
    puts "Backtrace:"
    puts e.backtrace.join("\n")
    STDOUT.flush
    raise e
  end
end


class FastUsageAnalyzer
  def initialize
    @asset_patterns = [
      /href=["']([^"']*\.(?:css|js|webp|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot))["']/i,
      /src=["']([^"']*\.(?:js|webp|jpg|jpeg|png|gif|svg|ico))["']/i,
      /data-src=["']([^"']*\.(?:webp|jpg|jpeg|png|gif|svg))["']/i,
      /url\(["']?([^"')]*\.(?:css|js|webp|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot))["']?\)/i,
      /@import\s+["']([^"']*\.css)["']/i
    ]

    # Add HTML files for compression
    @html_pattern = /\.html$/i
    @directories = ['/assets/', '/css/', '/js/', '/']
  end

  def should_compress_html?(file_path)
    return false unless @html_pattern.match?(file_path)
    File.size(file_path) > 2048 # Only compress HTML files > 2KB
  end
end
