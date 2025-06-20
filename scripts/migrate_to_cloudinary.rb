#!/usr/bin/env ruby

require 'cloudinary'
require 'cloudinary/uploader'
require 'cloudinary/api'
require 'find'
require 'fileutils'
require 'yaml'
require 'digest'
require 'json'
require 'time'
require 'optparse'

# Load environment variables
require 'dotenv'
Dotenv.load

# Configure Cloudinary
Cloudinary.config(
  cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
  api_key: ENV['CLOUDINARY_API_KEY'],
  api_secret: ENV['CLOUDINARY_API_SECRET'],
  secure: true
)

class CloudinaryAdvancedSync
  SYNC_STATE_FILE = '.cloudinary_sync_state.json'
  CONFLICT_LOG_FILE = 'cloudinary_conflicts.yml'

  def initialize(options = {})
    @assets_path = File.join(Dir.pwd, 'assets', 'img')
    @upload_log = []
    @download_log = []
    @error_log = []
    @conflict_log = []
    @sync_state = load_sync_state
    @options = {
      dry_run: false,
      force: false,
      direction: :bidirectional, # :upload, :download, :bidirectional
      conflict_resolution: :prompt, # :prompt, :local, :remote, :newer
      exclude_patterns: [],
      include_patterns: ['**/*'],
      backup: true
    }.merge(options)
  end

  def sync
    puts "🚀 Starting advanced Cloudinary synchronization..."
    puts "📁 Local path: #{@assets_path}"
    puts "🌐 Cloudinary: #{ENV['CLOUDINARY_CLOUD_NAME']}"
    puts "🔄 Direction: #{@options[:direction]}"
    puts "🔧 Mode: #{@options[:dry_run] ? 'DRY RUN' : 'LIVE'}"
    puts "" + "=" * 60

    unless Dir.exist?(@assets_path)
      puts "❌ Error: Assets directory not found at #{@assets_path}"
      return
    end

    case @options[:direction]
    when :upload
      sync_local_to_remote
    when :download
      sync_remote_to_local
    when :bidirectional
      sync_bidirectional
    end

    save_sync_state
    generate_comprehensive_report
  end

  private

  def sync_bidirectional
    puts "🔄 Performing bidirectional synchronization..."

    local_files = scan_local_files
    remote_files = scan_remote_files

    # Find files that need syncing
    upload_candidates = find_upload_candidates(local_files, remote_files)
    download_candidates = find_download_candidates(local_files, remote_files)
    conflicts = find_conflicts(local_files, remote_files)

    puts "📊 Sync Analysis:"
    puts "  📤 Files to upload: #{upload_candidates.length}"
    puts "  📥 Files to download: #{download_candidates.length}"
    puts "  ⚠️  Conflicts detected: #{conflicts.length}"
    puts ""

    # Handle conflicts first
    resolve_conflicts(conflicts) unless conflicts.empty?

    # Perform uploads
    upload_candidates.each { |file| upload_file(file) }

    # Perform downloads
    download_candidates.each { |file| download_file(file) }
  end

  def sync_local_to_remote
    puts "📤 Syncing local files to Cloudinary..."
    local_files = scan_local_files
    local_files.each { |file| upload_file(file) }
  end

  def sync_remote_to_local
    puts "📥 Syncing Cloudinary files to local..."
    remote_files = scan_remote_files
    remote_files.each { |file| download_file(file) }
  end

  def scan_local_files
    puts "🔍 Scanning local files..."
    image_extensions = %w[.jpg .jpeg .png .gif .webp .svg]
    files = []

    Find.find(@assets_path) do |path|
      next unless File.file?(path)
      next unless image_extensions.include?(File.extname(path).downcase)
      next unless matches_patterns?(path)

      relative_path = path.sub(@assets_path + '/', '')
      files << create_file_metadata(path, relative_path, :local)
    end

    puts "  📁 Found #{files.length} local files"
    files
  end

  def scan_remote_files
    puts "🔍 Scanning Cloudinary files..."
    files = []

    begin
      # Get all resources with optikalbahari prefix
      result = Cloudinary::Api.resources(
        type: 'upload',
        prefix: 'optikalbahari/',
        max_results: 500,
        context: true,
        metadata: true
      )

      result['resources'].each do |resource|
        files << create_remote_file_metadata(resource)
      end

      puts "  ☁️  Found #{files.length} remote files"
    rescue => e
      puts "  ❌ Error scanning remote files: #{e.message}"
    end

    files
  end

  def create_file_metadata(full_path, relative_path, source)
    {
      source: source,
      relative_path: relative_path,
      full_path: full_path,
      public_id: generate_public_id(relative_path),
      size: File.size(full_path),
      modified_time: File.mtime(full_path),
      checksum: calculate_checksum(full_path),
      extension: File.extname(relative_path).downcase
    }
  end

  def create_remote_file_metadata(resource)
    # Extract relative path from public_id
    relative_path = resource['public_id'].sub(/^optikalbahari\//, '') + '.' + resource['format']

    {
      source: :remote,
      relative_path: relative_path,
      public_id: resource['public_id'],
      cloudinary_url: resource['secure_url'],
      size: resource['bytes'],
      modified_time: Time.parse(resource['created_at']),
      version: resource['version'],
      format: resource['format'],
      etag: resource['etag']
    }
  end

  def find_upload_candidates(local_files, remote_files)
    remote_public_ids = remote_files.map { |f| f[:public_id] }.to_set

    local_files.select do |local_file|
      !remote_public_ids.include?(local_file[:public_id]) ||
      file_needs_update?(local_file, remote_files)
    end
  end

  def find_download_candidates(local_files, remote_files)
    local_public_ids = local_files.map { |f| f[:public_id] }.to_set

    remote_files.select do |remote_file|
      !local_public_ids.include?(remote_file[:public_id])
    end
  end

  def find_conflicts(local_files, remote_files)
    conflicts = []

    local_files.each do |local_file|
      remote_file = remote_files.find { |r| r[:public_id] == local_file[:public_id] }
      next unless remote_file

      if files_conflict?(local_file, remote_file)
        conflicts << {
          local: local_file,
          remote: remote_file,
          type: determine_conflict_type(local_file, remote_file)
        }
      end
    end

    conflicts
  end

  def files_conflict?(local_file, remote_file)
    # Check if files have been modified since last sync
    last_sync = @sync_state.dig(local_file[:public_id], 'last_sync')
    return false unless last_sync

    last_sync_time = Time.parse(last_sync)
    local_file[:modified_time] > last_sync_time && remote_file[:modified_time] > last_sync_time
  end

  def determine_conflict_type(local_file, remote_file)
    if local_file[:size] != remote_file[:size]
      :size_mismatch
    elsif local_file[:modified_time] != remote_file[:modified_time]
      :timestamp_mismatch
    else
      :content_mismatch
    end
  end

  def resolve_conflicts(conflicts)
    puts "⚠️  Resolving #{conflicts.length} conflicts..."

    conflicts.each do |conflict|
      case @options[:conflict_resolution]
      when :prompt
        resolve_conflict_interactive(conflict)
      when :local
        upload_file(conflict[:local])
      when :remote
        download_file(conflict[:remote])
      when :newer
        if conflict[:local][:modified_time] > conflict[:remote][:modified_time]
          upload_file(conflict[:local])
        else
          download_file(conflict[:remote])
        end
      end
    end
  end

  def resolve_conflict_interactive(conflict)
    puts "\n🔥 CONFLICT DETECTED:"
    puts "📁 File: #{conflict[:local][:relative_path]}"
    puts "🏠 Local:  #{conflict[:local][:modified_time]} (#{format_size(conflict[:local][:size])})"
    puts "☁️  Remote: #{conflict[:remote][:modified_time]} (#{format_size(conflict[:remote][:size])})"
    puts "\nChoose resolution:"
    puts "  [l] Use local version (upload)"
    puts "  [r] Use remote version (download)"
    puts "  [s] Skip this file"
    puts "  [b] Backup local and use remote"

    choice = gets.chomp.downcase

    case choice
    when 'l'
      upload_file(conflict[:local])
    when 'r'
      download_file(conflict[:remote])
    when 'b'
      backup_file(conflict[:local])
      download_file(conflict[:remote])
    when 's'
      puts "  ⏭️  Skipped #{conflict[:local][:relative_path]}"
    else
      puts "  ❌ Invalid choice, skipping..."
    end

    @conflict_log << conflict.merge(resolution: choice, timestamp: Time.now)
  end

  def upload_file(file_metadata)
    return if @options[:dry_run]

    begin
      puts "📤 Uploading #{file_metadata[:relative_path]}..."

      result = Cloudinary::Uploader.upload(file_metadata[:full_path], {
        public_id: file_metadata[:public_id],
        overwrite: true,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        context: {
          source: 'jekyll_sync',
          original_path: file_metadata[:relative_path],
          sync_timestamp: Time.now.iso8601
        }
      })

      @upload_log << {
        local_path: file_metadata[:relative_path],
        cloudinary_url: result['secure_url'],
        public_id: result['public_id'],
        format: result['format'],
        size: result['bytes'],
        timestamp: Time.now
      }

      # Update sync state
      @sync_state[file_metadata[:public_id]] = {
        'last_sync' => Time.now.iso8601,
        'local_checksum' => file_metadata[:checksum],
        'remote_version' => result['version']
      }

      puts "  ✅ Uploaded: #{result['secure_url']}"

    rescue => e
      @error_log << {
        file_path: file_metadata[:relative_path],
        operation: 'upload',
        error: e.message,
        timestamp: Time.now
      }
      puts "  ❌ Error uploading #{file_metadata[:relative_path]}: #{e.message}"
    end
  end

  def download_file(file_metadata)
    return if @options[:dry_run]

    begin
      puts "📥 Downloading #{file_metadata[:relative_path]}..."

      local_path = File.join(@assets_path, file_metadata[:relative_path])

      # Create directory if it doesn't exist
      FileUtils.mkdir_p(File.dirname(local_path))

      # Backup existing file if requested
      backup_file_path(local_path) if File.exist?(local_path) && @options[:backup]

      # Download file
      File.open(local_path, 'wb') do |file|
        file.write(URI.open(file_metadata[:cloudinary_url]).read)
      end

      @download_log << {
        remote_url: file_metadata[:cloudinary_url],
        local_path: file_metadata[:relative_path],
        size: file_metadata[:size],
        timestamp: Time.now
      }

      # Update sync state
      @sync_state[file_metadata[:public_id]] = {
        'last_sync' => Time.now.iso8601,
        'local_checksum' => calculate_checksum(local_path),
        'remote_version' => file_metadata[:version]
      }

      puts "  ✅ Downloaded: #{local_path}"

    rescue => e
      @error_log << {
        file_path: file_metadata[:relative_path],
        operation: 'download',
        error: e.message,
        timestamp: Time.now
      }
      puts "  ❌ Error downloading #{file_metadata[:relative_path]}: #{e.message}"
    end
  end

  def backup_file(file_metadata)
    backup_file_path(file_metadata[:full_path])
  end

  def backup_file_path(file_path)
    return unless File.exist?(file_path)

    backup_dir = File.join(File.dirname(file_path), '.backup')
    FileUtils.mkdir_p(backup_dir)

    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    backup_path = File.join(backup_dir, "#{File.basename(file_path, '.*')}_#{timestamp}#{File.extname(file_path)}")

    FileUtils.cp(file_path, backup_path)
    puts "  💾 Backed up to: #{backup_path}"
  end

  def generate_public_id(relative_path)
    # Remove extension and add folder prefix
    base_name = File.basename(relative_path, File.extname(relative_path))
    folder = determine_folder(relative_path)
    "#{folder}/#{base_name}"
  end

  def determine_folder(relative_path)
    case relative_path
    when /^posts\//
      'optikalbahari/posts'
    when /^backgrounds?\//
      'optikalbahari/backgrounds'
    when /^icons?\//
      'optikalbahari/icons'
    when /^testimonials?\//
      'optikalbahari/testimonials'
    when /^profile\//
      'optikalbahari/profile'
    else
      'optikalbahari'
    end
  end

  def matches_patterns?(path)
    relative_path = path.sub(@assets_path + '/', '')

    # Check exclude patterns
    @options[:exclude_patterns].each do |pattern|
      return false if File.fnmatch(pattern, relative_path)
    end

    # Check include patterns
    @options[:include_patterns].any? do |pattern|
      File.fnmatch(pattern, relative_path)
    end
  end

  def calculate_checksum(file_path)
    Digest::MD5.hexdigest(File.read(file_path))
  end

  def file_needs_update?(local_file, remote_files)
    remote_file = remote_files.find { |r| r[:public_id] == local_file[:public_id] }
    return false unless remote_file

    # Check if local file is newer or different
    local_file[:modified_time] > remote_file[:modified_time] ||
    local_file[:size] != remote_file[:size]
  end

  def load_sync_state
    return {} unless File.exist?(SYNC_STATE_FILE)
    JSON.parse(File.read(SYNC_STATE_FILE))
  rescue
    {}
  end

  def save_sync_state
    File.write(SYNC_STATE_FILE, JSON.pretty_generate(@sync_state))
  end

  def format_size(bytes)
    units = ['B', 'KB', 'MB', 'GB']
    size = bytes.to_f
    unit_index = 0

    while size >= 1024 && unit_index < units.length - 1
      size /= 1024
      unit_index += 1
    end

    "#{size.round(2)} #{units[unit_index]}"
  end

  def generate_comprehensive_report
    puts "\n" + "=" * 60
    puts "📊 COMPREHENSIVE SYNC REPORT"
    puts "=" * 60

    puts "📈 Statistics:"
    puts "  📤 Files uploaded: #{@upload_log.length}"
    puts "  📥 Files downloaded: #{@download_log.length}"
    puts "  ❌ Errors: #{@error_log.length}"
    puts "  ⚠️  Conflicts resolved: #{@conflict_log.length}"

    # Calculate total data transferred
    upload_size = @upload_log.sum { |entry| entry[:size] || 0 }
    download_size = @download_log.sum { |entry| entry[:size] || 0 }

    puts "  📊 Data uploaded: #{format_size(upload_size)}"
    puts "  📊 Data downloaded: #{format_size(download_size)}"

    # Save detailed logs
    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')

    unless @upload_log.empty?
      File.write("cloudinary_upload_log_#{timestamp}.yml", @upload_log.to_yaml)
      puts "\n📄 Detailed logs saved:"
      puts "  📤 cloudinary_upload_log_#{timestamp}.yml"
    end

    unless @download_log.empty?
      File.write("cloudinary_download_log_#{timestamp}.yml", @download_log.to_yaml)
      puts "  📥 cloudinary_download_log_#{timestamp}.yml"
    end

    unless @error_log.empty?
      File.write("cloudinary_error_log_#{timestamp}.yml", @error_log.to_yaml)
      puts "  ❌ cloudinary_error_log_#{timestamp}.yml"
    end

    unless @conflict_log.empty?
      File.write(CONFLICT_LOG_FILE, @conflict_log.to_yaml)
      puts "  ⚠️  #{CONFLICT_LOG_FILE}"
    end

    # Generate URL mapping for reference
    generate_url_mapping(timestamp)

    puts "\n🎉 Synchronization completed!"
    puts "💡 Next steps:"
    puts "  1. Review the logs for any issues"
    puts "  2. Test your Jekyll site with the synced images"
    puts "  3. Use Cloudinary filters in your templates"
  end

  def generate_url_mapping(timestamp)
    mapping = {}

    (@upload_log + @download_log).each do |entry|
      if entry[:local_path] && entry[:cloudinary_url]
        local_url = "/assets/img/#{entry[:local_path]}"
        mapping[local_url] = entry[:cloudinary_url]
      end
    end

    unless mapping.empty?
      File.write("url_mapping_#{timestamp}.yml", mapping.to_yaml)
      puts "  🗺️  url_mapping_#{timestamp}.yml"
    end
  end
end

# Command line interface
if __FILE__ == $0
  options = {}

  OptionParser.new do |opts|
    opts.banner = "Usage: #{$0} [options]"

    opts.on('-d', '--direction DIRECTION', [:upload, :download, :bidirectional],
            'Sync direction (upload, download, bidirectional)') do |d|
      options[:direction] = d
    end

    opts.on('-c', '--conflict RESOLUTION', [:prompt, :local, :remote, :newer],
            'Conflict resolution strategy') do |c|
      options[:conflict_resolution] = c
    end

    opts.on('-n', '--dry-run', 'Perform a dry run without making changes') do
      options[:dry_run] = true
    end

    opts.on('-f', '--force', 'Force sync without prompts') do
      options[:force] = true
    end

    opts.on('--no-backup', 'Disable automatic backups') do
      options[:backup] = false
    end

    opts.on('-e', '--exclude PATTERN', 'Exclude files matching pattern') do |pattern|
      options[:exclude_patterns] ||= []
      options[:exclude_patterns] << pattern
    end

    opts.on('-i', '--include PATTERN', 'Include only files matching pattern') do |pattern|
      options[:include_patterns] = [pattern]
    end

    opts.on('-h', '--help', 'Show this help message') do
      puts opts
      exit
    end
  end.parse!

  # Set defaults
  options[:direction] ||= :bidirectional
  options[:conflict_resolution] ||= :prompt

  puts "🚀 Cloudinary Advanced Sync Tool"
  puts "=" * 40

  syncer = CloudinaryAdvancedSync.new(options)
  syncer.sync
end
