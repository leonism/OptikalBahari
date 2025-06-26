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
require 'fiddle'  # Replace mmap with fiddle
require 'fiber'

module AssetProcessor
  # Enterprise-grade configuration with performance optimizations
  class EnterpriseConfiguration
    DEFAULT_CONFIG = {
      'compression' => {
        'enabled' => true,
        'brotli' => {
          'enabled' => true,
          'quality' => 6,  # Optimized for speed vs compression ratio
          'window' => 20   # Reduced memory usage
        },
        'gzip' => {
          'enabled' => true,
          'level' => 6     # Balanced speed/compression
        },
        'min_file_size' => 1024,
        'file_types' => %w[.css .js .html .svg .txt .xml .json],
        'chunk_size' => 65536,  # 64KB chunks for streaming
        'parallel_compression' => true
      },
      'hashing' => {
        'enabled' => true,
        'algorithm' => 'xxhash',  # Fastest hash algorithm
        'hash_length' => 8,
        'file_types' => %w[.css .js .png .jpg .jpeg .gif .webp .svg .ico]
      },
      'performance' => {
        'max_workers' => [Concurrent.processor_count * 2, 16].min,
        'io_workers' => [Concurrent.processor_count, 8].min,
        'compression_workers' => [Concurrent.processor_count, 4].min,
        'batch_size' => 50,
        'memory_limit' => 512 * 1024 * 1024,  # 512MB
        'use_mmap' => false,  # Disable mmap since we're using regular file I/O
        'enable_streaming' => true,
        'cache_file' => '.enterprise_asset_cache.msgpack'
      },
      'optimization' => {
        'precompute_hashes' => true,
        'lazy_loading' => true,
        'memory_pool' => true,
        'zero_copy' => true,
        'async_io' => true
      }
    }.freeze

    def initialize(site_config = {})
      @config = deep_merge(DEFAULT_CONFIG, site_config.fetch('asset_processor', {}))
      @runtime_stats = Concurrent::Hash.new
      validate_and_optimize!
    end

    def get(key_path)
      keys = key_path.split('.')
      keys.reduce(@config) { |config, key| config[key] }
    rescue
      nil
    end

    def enabled?(feature_path)
      get("#{feature_path}.enabled") == true
    end

    private

    def validate_and_optimize!
      # Auto-tune based on system resources
      available_memory = `sysctl -n hw.memsize`.to_i rescue 8_589_934_592
      @config['performance']['memory_limit'] = [available_memory / 4, @config['performance']['memory_limit']].min

      # Optimize worker counts based on workload
      cpu_count = Concurrent.processor_count
      @config['performance']['max_workers'] = [cpu_count * 2, 32].min
      @config['performance']['io_workers'] = [cpu_count, 16].min
    end

    def deep_merge(hash1, hash2)
      hash1.merge(hash2) { |key, oldval, newval|
        oldval.is_a?(Hash) && newval.is_a?(Hash) ? deep_merge(oldval, newval) : newval
      }
    end
  end

  # High-performance memory pool for reusing buffers
  class MemoryPool
    def initialize(buffer_size = 65536, pool_size = 100)
      @buffer_size = buffer_size
      @available = Concurrent::Array.new
      @in_use = Concurrent::Set.new

      # Pre-allocate buffers
      pool_size.times { @available << String.new(capacity: buffer_size) }
    end

    def checkout
      buffer = @available.pop || String.new(capacity: @buffer_size)
      @in_use.add(buffer)
      buffer.clear
      buffer
    end

    def checkin(buffer)
      return unless @in_use.delete?(buffer)
      buffer.clear
      @available.push(buffer) if @available.size < 100
    end
  end

  # Enterprise-grade asset analyzer with streaming and batching
  class StreamingAssetAnalyzer
    def initialize(site_dir, config)
      @site_dir = site_dir
      @config = config
      @used_assets = Concurrent::Set.new
      @memory_pool = MemoryPool.new
      @file_cache = Concurrent::Map.new

      # Optimized regex patterns
      @asset_patterns = compile_optimized_patterns
    end

    def analyze_usage
      puts "🚀 Enterprise asset analysis starting..." if @config.get('output.verbose')

      # Use fiber-based async processing for better memory efficiency
      fibers = []

      # Process files in batches to control memory usage
      file_batches = get_file_batches

      file_batches.each do |batch|
        fiber = Fiber.new do
          process_file_batch(batch)
        end
        fibers << fiber
      end

      # Execute fibers with controlled concurrency
      execute_fibers_controlled(fibers)

      puts "📊 Analyzed #{@used_assets.size} assets" if @config.get('output.verbose')
      @used_assets.to_a
    end

    private

    def compile_optimized_patterns
      # Pre-compiled, optimized regex patterns
      [
        /(?:href|src|data-src)=["']([^"']*\/(?:assets|css|js)\/[^"']*)["\']/o,
        /url\(["']?([^"')]*\/(?:assets|css|js)\/[^"')]*)["\'']?\)/o,
        /import\s+["']([^"']*\/(?:assets|css|js)\/[^"']*)["']/o
      ]
    end

    def get_file_batches
      all_files = Dir.glob(File.join(@site_dir, '**', '*.{html,css,js}'))
      batch_size = @config.get('performance.batch_size')
      all_files.each_slice(batch_size).to_a
    end

    def process_file_batch(files)
      thread_pool = Concurrent::FixedThreadPool.new(@config.get('performance.io_workers'))
      futures = []

      files.each do |file_path|
        futures << Concurrent::Future.execute(executor: thread_pool) do
          process_file_streaming(file_path)
        end
      end

      futures.each(&:wait)
      thread_pool.shutdown
      thread_pool.wait_for_termination
    end

    def process_file_streaming(file_path)
      return unless File.exist?(file_path)

      # Use memory mapping for large files
      if @config.get('performance.use_mmap') && File.size(file_path) > 32768
        process_with_mmap(file_path)
      else
        process_with_streaming(file_path)
      end
    rescue => e
      puts "Warning: Failed to process #{file_path}: #{e.message}" if @config.get('output.verbose')
    end

    def process_with_mmap(file_path)
      File.open(file_path, 'rb') do |file|
        mmap = Mmap.new(file, :readonly)
        scan_content_optimized(mmap)
        mmap.munmap
      end
    end

    def analyze_file(file_path)
      return unless File.exist?(file_path)

      # Use streaming processing instead of memory mapping
      process_with_streaming(file_path)
    rescue => e
      puts "Warning: Failed to process #{file_path}: #{e.message}" if @config.get('output.verbose')
    end

    # Remove the process_with_mmap method entirely and use streaming for all files
    def process_with_streaming(file_path)
      buffer = @memory_pool.checkout

      File.open(file_path, 'rb') do |file|
        while file.read(@config.get('compression.chunk_size'), buffer)
          scan_content_optimized(buffer)
        end
      end

      @memory_pool.checkin(buffer)
    end

    def scan_content_optimized(content)
      @asset_patterns.each do |pattern|
        content.scan(pattern) do |match|
          asset_path = normalize_path_fast(match[0])
          @used_assets.add(asset_path) if asset_path
        end
      end
    end

    def normalize_path_fast(path)
      return nil if path.start_with?('http')
      path.sub(/^\/?/, '')
    end

    def execute_fibers_controlled(fibers)
      max_concurrent = [@config.get('performance.max_workers'), fibers.size].min
      active_fibers = []

      fibers.each do |fiber|
        active_fibers << fiber
        fiber.resume

        if active_fibers.size >= max_concurrent
          active_fibers.reject! { |f| !f.alive? }
          sleep(0.001) while active_fibers.size >= max_concurrent
        end
      end

      # Wait for remaining fibers
      active_fibers.each { |f| f.resume while f.alive? }
    end
  end

  # Enterprise-grade processor with advanced optimizations
  class EnterpriseProcessor
    def initialize(site)
      @site = site
      @site_dir = site.dest
      @config = EnterpriseConfiguration.new(site.config)
      @manifest = Concurrent::Hash.new
      @stats = Concurrent::Hash.new(0)
      @global_thread_pool = create_global_thread_pool
      @compression_pool = create_compression_pool
      @memory_pool = MemoryPool.new
    end

    def process
      start_time = Time.now
      puts "🚀 Enterprise asset processing initiated..." if @config.get('output.verbose')

      # Load existing manifest for incremental processing
      load_manifest_fast

      # Streaming asset analysis
      analyzer = StreamingAssetAnalyzer.new(@site_dir, @config)
      used_assets = analyzer.analyze_usage

      # Parallel processing with batching
      process_assets_enterprise(used_assets)

      # Async cleanup and HTML updates
      cleanup_and_update_async(used_assets)

      # Save results
      save_manifest_fast

      @stats[:total_time] = Time.now - start_time
      display_enterprise_stats if @config.get('output.show_stats')

    ensure
      shutdown_thread_pools
    end

    private

    def create_global_thread_pool
      Concurrent::ThreadPoolExecutor.new(
        min_threads: 2,
        max_threads: @config.get('performance.max_workers'),
        max_queue: @config.get('performance.max_workers') * 4,
        fallback_policy: :caller_runs
      )
    end

    def create_compression_pool
      Concurrent::ThreadPoolExecutor.new(
        min_threads: 1,
        max_threads: @config.get('performance.compression_workers'),
        max_queue: 100,
        fallback_policy: :caller_runs
      )
    end

    def process_assets_enterprise(used_assets)
      puts "⚡ Processing #{used_assets.size} assets with enterprise optimizations..." if @config.get('output.verbose')

      # Filter and batch assets
      existing_assets = filter_existing_assets(used_assets)
      asset_batches = existing_assets.each_slice(@config.get('performance.batch_size')).to_a

      # Process batches with controlled memory usage
      asset_batches.each_with_index do |batch, index|
        puts "Processing batch #{index + 1}/#{asset_batches.size}" if @config.get('output.verbose')
        process_asset_batch(batch)

        # Memory management
        GC.start if (index + 1) % 10 == 0
      end
    end

    def filter_existing_assets(used_assets)
      used_assets.select do |asset_path|
        full_path = File.join(@site_dir, asset_path)
        File.exist?(full_path) && should_process_fast?(full_path)
      end
    end

    def process_asset_batch(assets)
      futures = assets.map do |asset_path|
        Concurrent::Future.execute(executor: @global_thread_pool) do
          process_single_asset_optimized(asset_path)
        end
      end

      # Wait with timeout
      futures.each { |f| f.wait(30) }  # 30 second timeout per asset
    end

    def process_single_asset_optimized(asset_path)
      full_path = File.join(@site_dir, asset_path)

      # Fast hashing with streaming
      if should_hash_fast?(full_path)
        hashed_path = hash_file_streaming(full_path, asset_path)
        full_path = File.join(@site_dir, hashed_path) if hashed_path
      end

      # Async compression
      if should_compress_fast?(full_path)
        compress_file_async(full_path)
      end

      @stats[:processed] += 1
    rescue => e
      puts "Error processing #{asset_path}: #{e.message}" if @config.get('output.verbose')
      @stats[:errors] += 1
    end

    def should_process_fast?(file_path)
      ext = File.extname(file_path).downcase
      hash_types = @config.get('hashing.file_types')
      compress_types = @config.get('compression.file_types')

      (hash_types + compress_types).include?(ext)
    end

    def should_hash_fast?(file_path)
      ext = File.extname(file_path).downcase
      @config.get('hashing.file_types').include?(ext)
    end

    def should_compress_fast?(file_path)
      ext = File.extname(file_path).downcase
      return false unless @config.get('compression.file_types').include?(ext)

      File.size(file_path) > @config.get('compression.min_file_size')
    end

    def hash_file_streaming(file_path, asset_path)
      return nil unless File.exist?(file_path)

      # Use streaming hash calculation for large files
      hasher = Digest::MD5.new

      File.open(file_path, 'rb') do |file|
        buffer = @memory_pool.checkout

        while file.read(@config.get('compression.chunk_size'), buffer)
          hasher.update(buffer)
        end

        @memory_pool.checkin(buffer)
      end

      content_hash = hasher.hexdigest[0, @config.get('hashing.hash_length')]

      ext = File.extname(asset_path)
      base_name = File.basename(asset_path, ext)
      dir_name = File.dirname(asset_path)

      hashed_filename = "#{base_name}-#{content_hash}#{ext}"
      hashed_path = File.join(dir_name, hashed_filename)
      hashed_full_path = File.join(@site_dir, hashed_path)

      # Ensure directory exists
      FileUtils.mkdir_p(File.dirname(hashed_full_path))

      # Always use streaming copy instead of hard linking
      streaming_copy(file_path, hashed_full_path)

      @manifest[asset_path] = hashed_path
      @stats[:hashed] += 1
      hashed_path
    end

    def compress_file_async(file_path)
      return unless File.exist?(file_path)

      # Submit compression jobs to dedicated pool
      if @config.enabled?('compression.brotli')
        Concurrent::Future.execute(executor: @compression_pool) do
          compress_brotli_streaming(file_path)
        end
      end

      if @config.enabled?('compression.gzip')
        Concurrent::Future.execute(executor: @compression_pool) do
          compress_gzip_streaming(file_path)
        end
      end
    end

    def compress_brotli_streaming(file_path)
      quality = @config.get('compression.brotli.quality')
      window = @config.get('compression.brotli.window')

      File.open(file_path, 'rb') do |input|
        File.open("#{file_path}.br", 'wb') do |output|
          # Stream compression in chunks
          while chunk = input.read(@config.get('compression.chunk_size'))
            compressed = Brotli.deflate(chunk, quality: quality, window: window)
            output.write(compressed)
          end
        end
      end

      @stats[:compressed] += 1
    rescue => e
      puts "Brotli compression failed for #{file_path}: #{e.message}" if @config.get('output.verbose')
    end

    def compress_gzip_streaming(file_path)
      level = @config.get('compression.gzip.level')

      File.open(file_path, 'rb') do |input|
        Zlib::GzipWriter.open("#{file_path}.gz", level) do |gz|
          # Remove this line: gz.level = level

          while chunk = input.read(@config.get('compression.chunk_size'))
            gz.write(chunk)
          end
        end
      end

      @stats[:compressed] += 1
    rescue => e
      puts "Gzip compression failed for #{file_path}: #{e.message}" if @config.get('output.verbose')
    end

    def streaming_copy(source, destination)
      # Ensure destination directory exists
      FileUtils.mkdir_p(File.dirname(destination))

      File.open(source, 'rb') do |src|
        File.open(destination, 'wb') do |dst|
          buffer = @memory_pool.checkout

          while src.read(@config.get('compression.chunk_size'), buffer)
            dst.write(buffer)
          end

          @memory_pool.checkin(buffer)
        end
      end
    rescue => e
      puts "Error copying #{source} to #{destination}: #{e.message}" if @config.get('output.verbose')
      raise e
    end

    def cleanup_and_update_async(used_assets)
      # Async cleanup
      Concurrent::Future.execute(executor: @global_thread_pool) do
        cleanup_unused_assets_fast(used_assets)
      end

      # Async HTML updates
      if @config.enabled?('hashing')
        Concurrent::Future.execute(executor: @global_thread_pool) do
          update_html_references_streaming
        end
      end
    end

    def cleanup_unused_assets_fast(used_assets)
      used_set = Set.new(used_assets)

      @manifest.each_pair do |original_path, hashed_path|
        next if used_set.include?(original_path)

        # Parallel file deletion
        files_to_delete = [
          File.join(@site_dir, hashed_path),
          "#{File.join(@site_dir, hashed_path)}.br",
          "#{File.join(@site_dir, hashed_path)}.gz"
        ]

        files_to_delete.each do |file|
          File.delete(file) if File.exist?(file)
        end

        @manifest.delete(original_path)
      end
    end

    def update_html_references_streaming
      return if @manifest.empty?

      html_files = Dir.glob(File.join(@site_dir, '**', '*.html'))

      # Process HTML files in parallel with streaming
      futures = html_files.map do |html_file|
        Concurrent::Future.execute(executor: @global_thread_pool) do
          update_html_file_streaming(html_file)
        end
      end

      futures.each(&:wait)
    end

    def update_html_file_streaming(html_file)
      temp_file = "#{html_file}.tmp"
      modified = false

      File.open(html_file, 'rb') do |input|
        File.open(temp_file, 'wb') do |output|
          buffer = @memory_pool.checkout

          while input.read(@config.get('compression.chunk_size'), buffer)
            # Apply replacements
            @manifest.each do |original, hashed|
              if buffer.include?(original)
                buffer.gsub!(original, hashed)
                modified = true
              end
            end

            output.write(buffer)
          end

          @memory_pool.checkin(buffer)
        end
      end

      if modified
        File.rename(temp_file, html_file)
      else
        File.delete(temp_file)
      end
    rescue => e
      File.delete(temp_file) if File.exist?(temp_file)
      puts "Failed to update #{html_file}: #{e.message}" if @config.get('output.verbose')
    end

    def load_manifest_fast
      manifest_path = File.join(@site_dir, 'assets/manifest.json')
      return unless File.exist?(manifest_path)

      data = JSON.parse(File.read(manifest_path))
      @manifest.merge!(data['assets'] || {})
    rescue => e
      puts "Warning: Could not load manifest: #{e.message}" if @config.get('output.verbose')
    end

    def save_manifest_fast
      return if @manifest.empty?

      manifest_dir = File.join(@site_dir, 'assets')
      FileUtils.mkdir_p(manifest_dir)

      manifest_data = {
        'assets' => @manifest.to_h,
        'generated_at' => Time.now.iso8601,
        'version' => '5.0-enterprise',
        'stats' => @stats.to_h
      }

      File.write(File.join(manifest_dir, 'manifest.json'), JSON.generate(manifest_data))
    end

    def display_enterprise_stats
      puts "\n🚀 Enterprise Asset Processing Complete!"
      puts "═" * 70
      puts "📁 Processed: #{@stats[:processed]} files"
      puts "🔗 Hashed: #{@stats[:hashed]} files"
      puts "🗜️  Compressed: #{@stats[:compressed]} files"
      puts "❌ Errors: #{@stats[:errors]} files"
      puts "⚡ Total time: #{@stats[:total_time].round(3)}s"
      puts "🧠 Memory efficient: Yes (Streaming I/O)"
      puts "🔧 Workers: #{@config.get('performance.max_workers')} max, #{@config.get('performance.compression_workers')} compression"
      puts "✅ Manifest: #{@manifest.size} asset mappings"
      puts "═" * 70
    end

    def shutdown_thread_pools
      [@global_thread_pool, @compression_pool].each do |pool|
        pool.shutdown
        pool.wait_for_termination(10)
      end
    end
  end
end

# Jekyll Hook - Enterprise asset processing
Jekyll::Hooks.register :site, :post_write do |site|
  processor = AssetProcessor::EnterpriseProcessor.new(site)
  processor.process
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
