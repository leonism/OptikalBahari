#!/usr/bin/env ruby

require 'cloudinary'
require 'cloudinary/uploader'
require 'cloudinary/api'
require 'cloudinary/utils'
require 'base64'
require 'json'
require 'find'
require 'colorize'
require 'dotenv/load'
require 'fileutils'
require 'digest'
require 'concurrent-ruby'
require 'set'
require 'yaml'
require 'time'

class CloudinaryEnterpriseUploader
  BATCH_SIZE = 1000  # Increased from 500 for better throughput
  MAX_WORKERS = 15   # Increased from 10 for better parallelism
  CACHE_DIR = File.join(File.dirname(__FILE__), 'cache')
  CACHE_FILE = File.join(CACHE_DIR, 'cloudinary_cache.yml')
  SYNC_LOG_FILE = File.join(CACHE_DIR, 'cloudinary_sync_log.yml')
  INTEGRITY_CACHE_FILE = File.join(CACHE_DIR, 'cloudinary_integrity_cache.yml')
  FOLDER_STRUCTURE_FILE = File.join(CACHE_DIR, 'cloudinary_folder_structure.yml')
  API_RATE_LIMIT_DELAY = 0.05  # Reduced from 0.1 for faster processing
  CHUNK_SIZE = 2000  # Increased from 1000 for better batching
  CHECKSUM_CACHE_SIZE = 10000  # LRU cache for checksums
  FILE_STAT_CACHE_SIZE = 5000   # Cache for file stats

  def initialize(options = {})
    # Load environment variables
    Dotenv.load

    # Configure Cloudinary with connection pooling
    Cloudinary.config(
      cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
      api_key: ENV['CLOUDINARY_API_KEY'],
      api_secret: ENV['CLOUDINARY_API_SECRET'],
      secure: true,
      timeout: 60,
      connection_timeout: 30
    )

    @base_path = File.expand_path('../../assets/img/', __dir__)
    @mapping = {}
    @cache = load_cache
    @integrity_cache = load_integrity_cache
    @folder_structure = load_folder_structure
    @remote_assets_cache = {}
    @uploaded_count = 0
    @failed_count = 0
    @skipped_count = 0
    @deleted_count = 0
    @renamed_count = 0
    @folder_changes_count = 0
    @total_files = 0
    @thread_pool = Concurrent::FixedThreadPool.new(MAX_WORKERS)
    @mutex = Mutex.new
    @progress_mutex = Mutex.new
    @processed_count = 0
    @scan_start_time = nil
    @scan_duration = 0
    @current_scan_data = nil

    # Performance optimization caches
    @checksum_cache = Concurrent::Map.new
    @file_stat_cache = Concurrent::Map.new
    @path_filter_cache = Concurrent::Map.new
    @image_extension_set = Set.new(%w[.jpg .jpeg .png .webp .gif .svg])

    # Options
    @force_upload = options[:force] || false
    @dry_run = options[:dry_run] || false
    @include_patterns = options[:include] || []
    @exclude_patterns = options[:exclude] || []
    @sync_mode = options[:sync] || false
    @incremental = options[:incremental] || true
    @fast_scan = options[:fast_scan] || true
  end

  def run
    puts "\n🚀 Starting Cloudinary Enterprise Upload Process".colorize(:cyan).bold
    puts "Mode: #{@dry_run ? 'DRY RUN' : 'LIVE'} | Sync: #{@sync_mode ? 'ON' : 'OFF'} | Incremental: #{@incremental ? 'ON' : 'OFF'} | Fast Scan: #{@fast_scan ? 'ON' : 'OFF'}".colorize(:yellow)
    puts "="*80

    # Validate configuration
    return unless validate_config

    # Perform comprehensive file integrity scan
    puts "\n🔍 Starting comprehensive file integrity scan...".colorize(:blue).bold
    @scan_start_time = Time.now
    scan_results = perform_integrity_scan
    @scan_duration = Time.now - @scan_start_time

    puts "\n✅ Integrity scan completed in #{@scan_duration.round(2)}s".colorize(:green)
    display_scan_results(scan_results)

    # Load remote assets cache for intelligent sync
    if @sync_mode || @incremental || scan_results[:has_changes]
      load_remote_assets_cache
    end

    # Always update integrity cache to track file state
    @integrity_cache = @current_scan_data if @current_scan_data

    # Process changes if any detected
    if scan_results[:has_changes] || @force_upload
      process_detected_changes(scan_results)
    else
      puts "\n✅ No changes detected. All files are in sync!".colorize(:green)

      # Still check for orphaned remote files in sync mode
      if @sync_mode
        orphaned_files = find_orphaned_remote_files(scan_results)
        if orphaned_files.any?
          puts "\n🧹 Processing #{orphaned_files.length} orphaned remote files...".colorize(:yellow)
          handle_orphaned_file_cleanup(orphaned_files)
        end
      end
    end

    # Generate mapping file
    generate_mapping_file unless @dry_run

    # Cleanup
    @thread_pool.shutdown
    @thread_pool.wait_for_termination

    # Show summary
    show_summary
  ensure
    # Always save integrity cache for change tracking, save others only if not dry-run
    ensure_cache_directory
    save_integrity_cache
    unless @dry_run
      save_cache
      save_folder_structure
      puts "💾 Upload caches saved to cache directory".colorize(:blue)
    else
      puts "💾 Integrity cache saved for change tracking".colorize(:blue)
    end
  end

  private

  def validate_config
    missing_vars = []
    missing_vars << 'CLOUDINARY_CLOUD_NAME' unless ENV['CLOUDINARY_CLOUD_NAME']
    missing_vars << 'CLOUDINARY_API_KEY' unless ENV['CLOUDINARY_API_KEY']
    missing_vars << 'CLOUDINARY_API_SECRET' unless ENV['CLOUDINARY_API_SECRET']

    if missing_vars.any?
      puts "❌ Missing environment variables: #{missing_vars.join(', ')}".colorize(:red)
      return false
    end

    unless Dir.exist?(@base_path)
      puts "❌ Assets directory not found: #{@base_path}".colorize(:red)
      return false
    end

    puts "✅ Configuration validated".colorize(:green)
    true
  end

  def load_cache
    return {} unless File.exist?(CACHE_FILE)

    begin
      YAML.safe_load_file(CACHE_FILE, permitted_classes: [Time, Symbol, Set]) || {}
    rescue => e
      puts "⚠️  Warning: Could not load cache file: #{e.message}".colorize(:yellow)
      {}
    end
  end

  def load_integrity_cache
    return {} unless File.exist?(INTEGRITY_CACHE_FILE)

    begin
      YAML.safe_load_file(INTEGRITY_CACHE_FILE, permitted_classes: [Time, Symbol, Set]) || {}
    rescue => e
      puts "⚠️  Warning: Could not load integrity cache: #{e.message}".colorize(:yellow)
      {}
    end
  end

  def load_folder_structure
    return {} unless File.exist?(FOLDER_STRUCTURE_FILE)

    begin
      YAML.safe_load_file(FOLDER_STRUCTURE_FILE, permitted_classes: [Time, Symbol, Set]) || {}
    rescue => e
      puts "⚠️  Warning: Could not load folder structure: #{e.message}".colorize(:yellow)
      {}
    end
  end

  def ensure_cache_directory
    FileUtils.mkdir_p(CACHE_DIR) unless Dir.exist?(CACHE_DIR)
  end

  def save_all_caches
    ensure_cache_directory
    save_cache
    save_integrity_cache
    save_folder_structure
    puts "💾 All caches saved to cache directory".colorize(:blue)
  end

  def save_cache
    File.write(CACHE_FILE, @cache.to_yaml)
  end

  def save_integrity_cache
    File.write(INTEGRITY_CACHE_FILE, @integrity_cache.to_yaml)
  end

  def save_folder_structure
    File.write(FOLDER_STRUCTURE_FILE, @folder_structure.to_yaml)
  end

  def perform_integrity_scan
    puts "📊 Scanning file system structure...".colorize(:blue)

    current_scan = initialize_scan_data
    scan_filesystem(current_scan)

    print "\r" + " " * 50 + "\r" # Clear progress line

    # Analyze changes and store current scan data
    changes = analyze_file_changes(current_scan)
    @current_scan_data = current_scan

    changes
  end

  def initialize_scan_data
    {
      files: {},
      folders: Set.new,
      scan_time: Time.now.iso8601,
      total_files: 0,
      total_size: 0
    }
  end

  def scan_filesystem(current_scan)
    # Use Dir.glob for better performance than Find.find
    pattern = File.join(@base_path, '**', '*')

    Dir.glob(pattern, File::FNM_DOTMATCH).each do |path|
      next if File.basename(path).start_with?('.')

      if File.directory?(path)
        add_folder_to_scan(path, current_scan)
      elsif File.file?(path) && is_image_file_fast?(path)
        add_file_to_scan(path, current_scan)
      end
    end
  end

  def add_folder_to_scan(path, current_scan)
    relative_dir = path.sub(@base_path.chomp('/') + '/', '')
    current_scan[:folders] << relative_dir unless relative_dir.empty?
  end

  def is_image_file_fast?(path)
    # Use cached set lookup for better performance
    @image_extension_set.include?(File.extname(path).downcase)
  end

  def add_file_to_scan(path, current_scan)
    relative_path = path.sub(@base_path.chomp('/') + '/', '')

    return unless passes_filters?(relative_path)

    file_info = scan_file_integrity(path, relative_path)
    current_scan[:files][relative_path] = file_info
    current_scan[:total_files] += 1
    current_scan[:total_size] += file_info[:size]

    show_scan_progress(current_scan[:total_files])
  end

  def passes_filters?(relative_path)
    # Use cache for filter results to avoid repeated pattern matching
    cache_key = "#{relative_path}:#{@include_patterns.join(',')}:#{@exclude_patterns.join(',')}"

    @path_filter_cache.fetch(cache_key) do
      # Apply include filters
      if @include_patterns.any?
        return false unless @include_patterns.any? { |pattern| File.fnmatch(pattern, relative_path) }
      end

      # Apply exclude filters
      if @exclude_patterns.any?
        return false if @exclude_patterns.any? { |pattern| File.fnmatch(pattern, relative_path) }
      end

      true
    end
  end

  def show_scan_progress(file_count)
    if file_count % 100 == 0
      print "\r📊 Scanned #{file_count} files..."
    end
  end

  def scan_file_integrity(file_path, relative_path)
    # Use cached file stats when possible
    stat_cache_key = "#{file_path}:#{File.mtime(file_path).to_i}"
    stat = @file_stat_cache.fetch(stat_cache_key) { File.stat(file_path) }

    file_info = {
      path: file_path,
      relative_path: relative_path,
      size: stat.size,
      mtime: stat.mtime,
      ctime: stat.ctime,
      mode: stat.mode,
      checksum: nil
    }

    # Calculate checksum with improved caching
    if @fast_scan
      # Use cached checksum if file hasn't changed
      cache_key = "#{relative_path}:#{stat.mtime.to_i}:#{stat.size}"

      # Check both persistent cache and memory cache
      if @cache[cache_key]
        file_info[:checksum] = @cache[cache_key]
      elsif @checksum_cache[cache_key]
        file_info[:checksum] = @checksum_cache[cache_key]
        @cache[cache_key] = file_info[:checksum]  # Persist to disk cache
      else
        file_info[:checksum] = calculate_file_checksum_fast(file_path)
        @cache[cache_key] = file_info[:checksum]
        @checksum_cache[cache_key] = file_info[:checksum]
      end
    else
      file_info[:checksum] = calculate_file_checksum_fast(file_path)
    end

    file_info
  end

  def calculate_file_checksum_fast(file_path)
    # Use buffered reading for better performance on large files
    digest = Digest::SHA256.new
    File.open(file_path, 'rb') do |file|
      while chunk = file.read(65536)  # 64KB chunks
        digest.update(chunk)
      end
    end
    digest.hexdigest
  end

  def analyze_file_changes(current_scan)
    previous_scan = @integrity_cache
    changes = initialize_change_tracking

    # Handle first-time scan
    if is_first_scan?(previous_scan)
      return handle_first_scan(current_scan, changes)
    end

    # Compare current vs previous scan
    detect_file_changes(current_scan, previous_scan, changes)
    detect_folder_changes(current_scan, previous_scan, changes)
    detect_renamed_files(changes)

    changes
  end

  def initialize_change_tracking
    {
      new_files: [],
      modified_files: [],
      deleted_files: [],
      renamed_files: [],
      new_folders: [],
      deleted_folders: [],
      has_changes: false
    }
  end

  def is_first_scan?(previous_scan)
    previous_scan.empty? || !previous_scan[:files]
  end

  def handle_first_scan(current_scan, changes)
    changes[:new_files] = current_scan[:files].values
    changes[:new_folders] = current_scan[:folders].to_a
    changes[:has_changes] = true
    changes
  end

  def detect_file_changes(current_scan, previous_scan, changes)
    current_files = current_scan[:files]
    previous_files = previous_scan[:files] || {}

    # Find new and modified files
    current_files.each do |path, file_info|
      if previous_files.key?(path)
        if file_changed?(previous_files[path], file_info)
          changes[:modified_files] << file_info
          changes[:has_changes] = true
        end
      else
        changes[:new_files] << file_info
        changes[:has_changes] = true
      end
    end

    # Find deleted files
    previous_files.each do |path, prev_file_info|
      unless current_files.key?(path)
        changes[:deleted_files] << prev_file_info
        changes[:has_changes] = true
      end
    end
  end

  def detect_folder_changes(current_scan, previous_scan, changes)
    current_folders = current_scan[:folders]
    previous_folders = Set.new(previous_scan[:folders] || [])

    changes[:new_folders] = (current_folders - previous_folders).to_a
    changes[:deleted_folders] = (previous_folders - current_folders).to_a

    if changes[:new_folders].any? || changes[:deleted_folders].any?
      changes[:has_changes] = true
    end
  end

  def detect_renamed_files(changes)
    # Find files with same checksum but different paths
    new_file_checksums = changes[:new_files].map { |f| f[:checksum] }
    deleted_file_checksums = changes[:deleted_files].map { |f| f[:checksum] }
    common_checksums = new_file_checksums & deleted_file_checksums

    common_checksums.each do |checksum|
      new_file = changes[:new_files].find { |f| f[:checksum] == checksum }
      deleted_file = changes[:deleted_files].find { |f| f[:checksum] == checksum }

      if new_file && deleted_file
        changes[:renamed_files] << {
          old_path: deleted_file[:relative_path],
          new_path: new_file[:relative_path],
          file_info: new_file
        }

        # Remove from new/deleted lists since it's a rename
        changes[:new_files].delete(new_file)
        changes[:deleted_files].delete(deleted_file)
        changes[:has_changes] = true
      end
    end
  end

  def file_changed?(prev_file, current_file)
    return true if prev_file[:size] != current_file[:size]
    return true if prev_file[:mtime] != current_file[:mtime]
    return true if prev_file[:checksum] != current_file[:checksum]
    false
  end



  def display_scan_results(scan_results)
    puts "\n📋 File Integrity Scan Results:".colorize(:cyan).bold
    puts "   📁 Total folders: #{@current_scan_data[:folders].size}".colorize(:blue)
    puts "   📄 Total files: #{@current_scan_data[:total_files]}".colorize(:blue)
    puts "   💾 Total size: #{format_bytes(@current_scan_data[:total_size])}".colorize(:blue)

    if scan_results[:has_changes]
      puts "\n🔄 Detected Changes:".colorize(:yellow).bold
      puts "   ➕ New files: #{scan_results[:new_files].length}".colorize(:green) if scan_results[:new_files].any?
      puts "   📝 Modified files: #{scan_results[:modified_files].length}".colorize(:yellow) if scan_results[:modified_files].any?
      puts "   🗑️  Deleted files: #{scan_results[:deleted_files].length}".colorize(:red) if scan_results[:deleted_files].any?
      puts "   🔄 Renamed files: #{scan_results[:renamed_files].length}".colorize(:cyan) if scan_results[:renamed_files].any?
      puts "   📁 New folders: #{scan_results[:new_folders].length}".colorize(:green) if scan_results[:new_folders].any?
      puts "   📁 Deleted folders: #{scan_results[:deleted_folders].length}".colorize(:red) if scan_results[:deleted_folders].any?
    else
      puts "\n✅ No changes detected since last scan".colorize(:green)
    end
  end

  def process_detected_changes(scan_results)
    return unless scan_results[:has_changes] || @force_upload || @sync_mode

    puts "\n🚀 Processing detected changes...".colorize(:cyan).bold

    all_files_to_process = []
    all_files_to_process.concat(scan_results[:new_files])
    all_files_to_process.concat(scan_results[:modified_files])
    all_files_to_process.concat(scan_results[:renamed_files].map { |r| r[:file_info] })

    @total_files = all_files_to_process.length

    if @total_files > 0
      puts "\n📤 Processing #{@total_files} files...".colorize(:green)
      upload_files_parallel(all_files_to_process)
    end

    # Handle deletions
    if scan_results[:deleted_files].any? && @sync_mode
      puts "\n🗑️  Processing #{scan_results[:deleted_files].length} deletions...".colorize(:red)
      handle_file_deletions(scan_results[:deleted_files])
    end

    # Handle renames
    if scan_results[:renamed_files].any?
      puts "\n🔄 Processing #{scan_results[:renamed_files].length} renames...".colorize(:cyan)
      handle_file_renames(scan_results[:renamed_files])
    end

    # Handle orphaned remote files in sync mode
    if @sync_mode
      orphaned_files = find_orphaned_remote_files(scan_results)
      if orphaned_files.any?
        puts "\n🧹 Processing #{orphaned_files.length} orphaned remote files...".colorize(:yellow)
        handle_orphaned_file_cleanup(orphaned_files)
      end
    end

    # Update folder structure
    update_folder_structure(scan_results)
  end

  def load_remote_assets_cache
    puts "🔍 Loading remote assets information...".colorize(:blue)

    begin
      # Use Admin API to get all resources in larger batches for better performance
      all_resources = []
      next_cursor = nil
      batch_count = 0

      loop do
        options = {
          resource_type: 'image',
          type: 'upload',
          max_results: BATCH_SIZE  # Now 1000 instead of 500
        }
        options[:next_cursor] = next_cursor if next_cursor

        result = Cloudinary::Api.resources(options)
        all_resources.concat(result['resources'])
        batch_count += 1

        next_cursor = result['next_cursor']
        break unless next_cursor

        # Update progress less frequently for better performance
        if batch_count % 5 == 0
          print "\r📊 Loaded #{all_resources.length} remote assets..."
        end

        # Reduced sleep time for faster loading
        sleep(API_RATE_LIMIT_DELAY)
      end

      puts "\n✅ Loaded #{all_resources.length} remote assets in #{batch_count} batches".colorize(:green)

      # Build efficient lookup cache with concurrent map for thread safety
      @remote_assets_cache = Concurrent::Map.new

      # Process resources in parallel for faster cache building
      all_resources.each_slice(1000) do |resource_batch|
        resource_batch.each do |resource|
          @remote_assets_cache[resource['public_id']] = {
            bytes: resource['bytes'],
            etag: resource['etag'],
            version: resource['version'],
            created_at: resource['created_at'],
            secure_url: resource['secure_url'],
            width: resource['width'],
            height: resource['height'],
            format: resource['format']
          }
        end
      end

    rescue => e
      puts "\n⚠️  Warning: Could not load remote assets: #{e.message}".colorize(:yellow)
      puts "Continuing with local-only mode...".colorize(:yellow)
    end
  end

  def upload_files_parallel(files)
    return if files.empty?

    @processed_count = 0

    # Process files in optimized batches with better concurrency
    files.each_slice(CHUNK_SIZE) do |chunk|
      # Use promise-based approach for better resource management
      promises = chunk.map do |file_info|
        Concurrent::Promise.execute(executor: @thread_pool) do
          upload_single_file(file_info)
        end
      end

      # Wait for all promises in chunk to complete
      Concurrent::Promise.zip(*promises).wait

      # Brief pause to prevent API rate limiting
      sleep(API_RATE_LIMIT_DELAY) if chunk.size > 100
    end
  end

  def upload_single_file(file_info)
    return if @dry_run

    begin
      relative_path = file_info[:relative_path]
      public_id = relative_path.sub(/\.[^.]+$/, '')

      # Prepare upload options
      upload_options = {
        public_id: public_id,
        resource_type: 'image',
        overwrite: true,
        quality: 'auto',
        fetch_format: 'auto',
        use_filename: false,
        unique_filename: false,
        invalidate: true  # Invalidate CDN cache
      }

      # Add asset_folder for dynamic folder mode
      if public_id.include?('/')
        upload_options[:asset_folder] = File.dirname(public_id)
      end

      # Upload to Cloudinary
      result = Cloudinary::Uploader.upload(file_info[:path], upload_options)

      # Store mapping data
      @mutex.synchronize do
        @mapping[relative_path] = build_mapping_entry(result, public_id)
        @uploaded_count += 1
      end

      # Update progress
      update_progress

    rescue => e
      @mutex.synchronize { @failed_count += 1 }
      log_error(file_info[:relative_path], e)
    end
  end

  def find_orphaned_remote_files(scan_results)
    return [] if @remote_assets_cache.empty?

    # Get all current local file paths (convert to public_id format)
    current_local_files = Set.new

    # Add all files from current scan data
    if @current_scan_data && @current_scan_data[:files]
      @current_scan_data[:files].each_value do |file_info|
        public_id = file_info[:relative_path].sub(/\.[^.]+$/, '')
        current_local_files.add(public_id)
      end
    end

    # Add files from scan results
    [scan_results[:new_files], scan_results[:modified_files]].each do |file_list|
      next unless file_list
      file_list.each do |file_info|
        public_id = file_info[:relative_path].sub(/\.[^.]+$/, '')
        current_local_files.add(public_id)
      end
    end

    # Add renamed files (new paths)
    scan_results[:renamed_files].each do |rename_info|
      public_id = rename_info[:new_path].sub(/\.[^.]+$/, '')
      current_local_files.add(public_id)
    end

    # Find remote assets that don't exist locally
    orphaned_files = []
    @remote_assets_cache.each do |remote_public_id, remote_info|
      unless current_local_files.include?(remote_public_id)
        orphaned_files << {
          public_id: remote_public_id,
          remote_info: remote_info
        }
      end
    end

    puts "🔍 Found #{orphaned_files.length} orphaned remote files".colorize(:yellow) if orphaned_files.any?
    orphaned_files
  end

  def handle_orphaned_file_cleanup(orphaned_files)
    puts "🧹 #{@dry_run ? 'Would clean up' : 'Cleaning up'} orphaned remote files...".colorize(:yellow)

    orphaned_files.each_slice(BATCH_SIZE) do |batch|
      public_ids = batch.map { |file| file[:public_id] }

      if @dry_run
        puts "   🔍 Would delete #{public_ids.length} orphaned files:".colorize(:cyan)
        public_ids.each do |public_id|
          puts "      🗑️  #{public_id}".colorize(:light_red)
        end
      else
        begin
          result = Cloudinary::Api.delete_resources(public_ids)

          if result['deleted']
            deleted_count = result['deleted'].length
            @deleted_count += deleted_count
            puts "   ✅ Deleted #{deleted_count} orphaned files".colorize(:green)

            # Log deleted files
            result['deleted'].each do |public_id|
              puts "      🗑️  #{public_id}".colorize(:light_red)
            end
          end

          if result['not_found'] && result['not_found'].any?
            puts "   ⚠️  #{result['not_found'].length} files already deleted".colorize(:yellow)
          end

        rescue => e
          puts "   ❌ Error deleting batch: #{e.message}".colorize(:red)
          log_error("Orphaned file cleanup", e)
        end
      end
    end
  end

  def handle_file_deletions(deleted_files)
    deleted_files.each_slice(BATCH_SIZE) do |batch|
      public_ids = batch.map { |file| file[:relative_path].sub(/\.[^.]+$/, '') }

      if @dry_run
        puts "   🔍 Would delete #{public_ids.length} files from Cloudinary:".colorize(:cyan)
        public_ids.each do |public_id|
          puts "      🗑️  #{public_id}".colorize(:light_red)
        end
        @deleted_count += public_ids.length
      else
        begin
          result = Cloudinary::Api.delete_resources(public_ids)
          deleted_count = result['deleted']&.length || 0
          @deleted_count += deleted_count
          puts "🗑️  Deleted #{deleted_count} files from Cloudinary".colorize(:red)

          # Log deleted files
          if result['deleted']
            result['deleted'].each do |public_id|
              puts "      🗑️  #{public_id}".colorize(:light_red)
            end
          end

          if result['not_found'] && result['not_found'].any?
            puts "   ⚠️  #{result['not_found'].length} files already deleted".colorize(:yellow)
          end

        rescue => e
          puts "❌ Error deleting batch: #{e.message}".colorize(:red)
          log_error("File deletion", e)
        end

        sleep(API_RATE_LIMIT_DELAY)
      end
    end
  end

  def handle_file_renames(renamed_files)
    return if @dry_run

    renamed_files.each do |rename_info|
      begin
        old_public_id = rename_info[:old_path].sub(/\.[^.]+$/, '')
        new_public_id = rename_info[:new_path].sub(/\.[^.]+$/, '')

        # Rename in Cloudinary
        result = Cloudinary::Uploader.rename(old_public_id, new_public_id)

        @mutex.synchronize do
          @mapping[rename_info[:new_path]] = build_mapping_entry(result, new_public_id)
          @renamed_count += 1
        end

        puts "🔄 Renamed: #{old_public_id} → #{new_public_id}".colorize(:cyan)
      rescue => e
        puts "❌ Error renaming #{rename_info[:old_path]}: #{e.message}".colorize(:red)
        # Fallback: upload as new file
        upload_single_file(rename_info[:file_info])
      end

      sleep(API_RATE_LIMIT_DELAY)
    end
  end

  def update_folder_structure(scan_results)
    current_structure = {
      folders: @integrity_cache[:folders].to_a,
      last_updated: Time.now.iso8601,
      changes: {
        new_folders: scan_results[:new_folders],
        deleted_folders: scan_results[:deleted_folders]
      }
    }

    @folder_structure = current_structure
    @folder_changes_count = scan_results[:new_folders].length + scan_results[:deleted_folders].length
  end

  def build_mapping_entry(data, public_id)
    base_url = "https://res.cloudinary.com/#{ENV['CLOUDINARY_CLOUD_NAME']}/image/upload"

    {
      public_id: data['public_id'] || public_id,
      secure_url: data['secure_url'] || "#{base_url}/#{public_id}",
      url: data['url'],
      format: data['format'],
      width: data['width'],
      height: data['height'],
      bytes: data['bytes'],
      created_at: data['created_at'],
      responsive_urls: generate_responsive_urls(public_id)
    }
  end

  def generate_responsive_urls(public_id)
    base_url = "https://res.cloudinary.com/#{ENV['CLOUDINARY_CLOUD_NAME']}/image/upload"

    {
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
  end

  def update_progress
    @progress_mutex.synchronize do
      @processed_count += 1
      percentage = (@processed_count.to_f / @total_files * 100).round(1)

      print "\r🔄 Progress: #{percentage}% (#{@processed_count}/#{@total_files}) | "
      print "✅ #{@uploaded_count} uploaded | "
      print "❌ #{@failed_count} failed"

      puts "" if @processed_count == @total_files
    end
  end

  def log_error(file_path, error)
    error_entry = {
      file: file_path,
      error: error.message,
      timestamp: Time.now.iso8601
    }

    File.open(SYNC_LOG_FILE, 'a') do |f|
      f.puts error_entry.to_yaml
    end
  end

  def generate_mapping_file
    puts "\n📝 Generating enhanced mapping file...".colorize(:blue)

    mapping_file = File.join(File.dirname(__FILE__), 'mapping-cloudinary-urls.json')
    File.write(mapping_file, JSON.pretty_generate(@mapping))

    puts "✅ Mapping file saved: #{mapping_file}".colorize(:green)
  end

  def format_bytes(bytes)
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    size = bytes.to_f
    unit_index = 0

    while size >= 1024 && unit_index < units.length - 1
      size /= 1024
      unit_index += 1
    end

    "#{size.round(2)} #{units[unit_index]}"
  end

  def show_summary
    puts "\n" + "="*80
    puts "📊 ENTERPRISE UPLOAD SUMMARY".colorize(:cyan).bold
    puts "="*80
    puts "⏱️  Scan duration: #{@scan_duration.round(2)}s".colorize(:blue)
    puts "📁 Total files scanned: #{@current_scan_data ? @current_scan_data[:total_files] : 0}".colorize(:blue)
    puts "💾 Total size: #{format_bytes(@current_scan_data ? @current_scan_data[:total_size] : 0)}".colorize(:blue)
    puts "\n🔄 Operations Performed:".colorize(:yellow)
    puts "✅ Successfully uploaded: #{@uploaded_count.to_s.colorize(:green).bold}"
    puts "⏭️  Skipped (unchanged): #{@skipped_count.to_s.colorize(:blue).bold}" if @skipped_count > 0
    puts "🔄 Renamed files: #{@renamed_count.to_s.colorize(:cyan).bold}" if @renamed_count > 0
    puts "🗑️  Deleted (orphaned): #{@deleted_count.to_s.colorize(:red).bold}" if @deleted_count > 0
    puts "📁 Folder changes: #{@folder_changes_count.to_s.colorize(:yellow).bold}" if @folder_changes_count > 0
    puts "❌ Failed uploads: #{@failed_count.to_s.colorize(:red).bold}" if @failed_count > 0

    if @uploaded_count > 0 || @skipped_count > 0
      puts "\n🎉 Sync completed successfully!".colorize(:green).bold
      puts "📝 Check mapping-cloudinary-urls.json for responsive URLs".colorize(:yellow)
    end

    if @failed_count > 0
      puts "\n⚠️  Check #{SYNC_LOG_FILE} for error details".colorize(:yellow)
    end

    puts "\n💾 Cache files saved in cache directory:".colorize(:blue)
    puts "   - #{File.basename(CACHE_FILE)}".colorize(:light_blue)
    puts "   - #{File.basename(INTEGRITY_CACHE_FILE)}".colorize(:light_blue)
    puts "   - #{File.basename(FOLDER_STRUCTURE_FILE)}".colorize(:light_blue)

    puts "\n🏁 Process completed!".colorize(:cyan).bold
    puts "="*80
  end
end

# CLI Interface
if __FILE__ == $0
  require 'optparse'

  # Set default options for sync and dry-run modes
  options = {
    sync: true,
    dry_run: true
  }

  OptionParser.new do |opts|
    opts.banner = "Usage: #{$0} [options]"
    opts.separator ""
    opts.separator "Default behavior: Runs in sync mode with dry-run enabled"
    opts.separator "Use --no-dry-run to execute actual operations"
    opts.separator ""

    opts.on('--force', 'Force upload all files') do
      options[:force] = true
    end

    opts.on('--[no-]dry-run', 'Preview operations without executing (default: enabled)') do |v|
      options[:dry_run] = v
    end

    opts.on('--[no-]sync', 'Enable full synchronization mode (default: enabled)') do |v|
      options[:sync] = v
    end

    opts.on('--no-incremental', 'Disable incremental updates') do
      options[:incremental] = false
    end

    opts.on('--no-fast-scan', 'Disable fast scanning (always recalculate checksums)') do
      options[:fast_scan] = false
    end

    opts.on('--include PATTERN', 'Include files matching pattern') do |pattern|
      options[:include] ||= []
      options[:include] << pattern
    end

    opts.on('--exclude PATTERN', 'Exclude files matching pattern') do |pattern|
      options[:exclude] ||= []
      options[:exclude] << pattern
    end

    opts.on('-h', '--help', 'Show this help') do
      puts opts
      exit
    end
  end.parse!

  uploader = CloudinaryEnterpriseUploader.new(options)
  uploader.run
end
