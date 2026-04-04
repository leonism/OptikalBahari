#!/usr/bin/env ruby

require 'cloudinary'
require 'cloudinary/uploader'
require 'cloudinary/api'
require 'cloudinary/utils'
require 'base64'
require 'json'
require 'yaml'
require 'fileutils'
require 'dotenv/load'
require 'colorize'
require 'digest'
require 'optparse'
require 'time'
require 'set'
require 'thread'
require 'io/console'

class CloudinarySyncTool
  # Constants
  SYNC_STATE_FILE = '.cloudinary_sync_state.json'
  LOG_DIR = '_logs/cloudinary'
  BACKUP_DIR = '_backup/images'

    # Default Configuration

    DEFAULT_OPTIONS = {

      direction: 'bidirectional', # upload, download, bidirectional

      conflict_mode: 'skip',      # skip, prompt, local, remote, newer

      dry_run: false,

      force: false,

      backup: true,

      include: [],

      exclude: []

    }

  

    def initialize(options = {})

      @options = DEFAULT_OPTIONS.merge(options)

      

      # Load environment variables

      Dotenv.load

  

      # Configure Cloudinary

      configure_cloudinary

  

      # Setup directories

      FileUtils.mkdir_p(LOG_DIR)

      FileUtils.mkdir_p(BACKUP_DIR) if @options[:backup]

  

      # Local base path for images

      @base_path = File.expand_path('../../assets/img/', __dir__)

      

      # State tracking

      @sync_state = load_sync_state

      @local_files = {}

      @remote_files = {}

      

      # Stats

      @stats = {

        uploaded: 0,

        downloaded: 0,

        skipped: 0,

        errors: 0,

        conflicts_resolved: 0

      }

    end

  

    def run

      print_header

      

      validate_environment!

      

      # 1. Scan Local Files

      scan_local_files

      

      # 2. Scan Remote Files

      scan_remote_files

      

      # 3. Determine Actions

      actions = plan_sync_actions

      

      # 4. Execute Actions

      if actions.empty?

        puts "✅ Everything is in sync. No actions needed.".colorize(:green)

      else

        execute_actions(actions)

      end

      

      # 5. Finalize

      save_sync_state

      print_summary

    rescue Interrupt

      puts "\n\n⚠️  Process interrupted by user. Exiting...".colorize(:yellow)

      save_sync_state

      exit 1

    rescue StandardError => e

      puts "\n❌ Error: #{e.message}".colorize(:red)

      puts e.backtrace.join("\n").colorize(:light_black) if @options[:verbose]

      exit 1

    end

  

    private

  

    def configure_cloudinary

      Cloudinary.config(

        cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],

        api_key: ENV['CLOUDINARY_API_KEY'],

        api_secret: ENV['CLOUDINARY_API_SECRET'],

        secure: true

      )

    end

  

    def validate_environment!

      unless ENV['CLOUDINARY_CLOUD_NAME'] && ENV['CLOUDINARY_API_KEY'] && ENV['CLOUDINARY_API_SECRET']

        raise "Missing Cloudinary credentials in .env file"

      end

      

      unless Dir.exist?(@base_path)

        raise "Local assets directory not found: #{@base_path}"

      end

    end

  

    def print_header

      puts "\n🔄 Cloudinary Advanced Sync Tool".colorize(:cyan).bold

      puts "=" * 60

      puts "Mode:      #{@options[:direction].upcase}".colorize(:yellow)

      puts "Strategy:  #{@options[:conflict_mode].upcase}".colorize(:yellow)

      puts "Dry Run:   #{@options[:dry_run] ? 'YES' : 'NO'}".colorize(:yellow)

      puts "Local Dir: #{@base_path}".colorize(:blue)

      puts "=" * 60

      puts

    end

  

    # ---------------------------------------------------------------------------

    # Scanning & Discovery

    # ---------------------------------------------------------------------------

  

    def scan_local_files

      puts "🔍 Scanning local files...".colorize(:blue)

      

      Dir.glob(File.join(@base_path, '**', '*')).each do |file_path|

        next unless File.file?(file_path)

        next unless image_file?(file_path)

        

        relative_path = file_path.sub(@base_path + '/', '')

        

        # Apply filters

        next if excluded?(relative_path)

        next unless included?(relative_path)

  

        @local_files[relative_path] = {

          path: file_path,

          mtime: File.mtime(file_path),

          size: File.size(file_path),

          checksum: calculate_checksum(file_path)

        }

      end

      

      puts "   Found #{@local_files.size} local images.".colorize(:green)

    end

  

    def scan_remote_files

      puts "🔍 Scanning remote files (Cloudinary)...".colorize(:blue)

      

      # We'll use the Search API for efficient listing if possible, or list resources

      # For this implementation, we'll fetch everything to ensure accuracy

      

      next_cursor = nil

      begin

        loop do

          response = Cloudinary::Api.resources(

            type: 'upload',

            resource_type: 'image',

            max_results: 500,

            next_cursor: next_cursor,

            tags: true,

            context: true

          )

          

          response['resources'].each do |res|

            # Map public_id back to relative path if possible

            # Assuming public_id mirrors folder structure: folder/filename

            

            # Skip if not in our known structure (optional check)

            # relative_path = res['public_id'] + "." + res['format']

            

            # We need to match remote ID to local structure. 

            # Cloudinary often drops extensions in public_ids or keeps them based on upload settings.

            # Here we assume public_id matches relative path without extension, or we try to fuzzy match.

            

            # Simplified mapping: remote public_id 'folder/image' maps to local 'folder/image.jpg'

            

            public_id = res['public_id']

            format = res['format']

            bytes = res['bytes']

            created_at = Time.parse(res['created_at'])

            version = res['version']

            

            @remote_files[public_id] = {

              public_id: public_id,

              format: format,

              size: bytes,

              created_at: created_at,

              version: version,

              secure_url: res['secure_url'],

              checksum: res.dig('context', 'custom', 'checksum') # If we stored it

            }

          end

          

          next_cursor = response['next_cursor']

          break unless next_cursor

          print ".".colorize(:blue)

        end

        puts "\n   Found #{@remote_files.size} remote images.".colorize(:green)

      rescue Cloudinary::Api::Error => e

        puts "   ❌ Failed to list remote files: #{e.message}".colorize(:red)

        exit 1

      end

    end

  

    # ---------------------------------------------------------------------------

    # Planning

    # ---------------------------------------------------------------------------

  

    def plan_sync_actions

      puts "\n🧠 Planning synchronization...".colorize(:blue)

      actions = []

  

      # Map local paths to potential remote public_ids

      # This is tricky because local 'img/a.jpg' might be remote 'img/a'

      

      all_keys = (@local_files.keys + @remote_files.keys).uniq

      

      # We need a unified view. Let's iterate local files first.

      @local_files.each do |rel_path, local|

        # Guess public_id: remove extension

        public_id = rel_path.sub(File.extname(rel_path), '')

        remote = @remote_files[public_id]

        

        if remote

          # Exists both places -> Check for conflict/update

          action = determine_update_action(rel_path, local, remote)

          actions << action if action

        else

          # Exists only locally -> Upload?

          if ['upload', 'bidirectional'].include?(@options[:direction])

            actions << { type: :upload, file: rel_path, reason: 'new_local' }

          end

        end

      end

      

      # Check for remote files not locally present

      @remote_files.each do |public_id, remote|

        # Try to find if we processed this as a local file match already

        # We need to guess the local extension if we don't have it.

        # This is a limitation; we might download 'image' as 'image.jpg' if format is jpg

        

        guessed_local_path = "#{public_id}.#{remote[:format]}"

        

        unless @local_files.key?(guessed_local_path)

          # Check other extensions just in case

          already_matched = @local_files.keys.any? { |k| k.start_with?(public_id + '.') }

          

          unless already_matched

            if ['download', 'bidirectional'].include?(@options[:direction])

              actions << { type: :download, public_id: public_id, target_path: guessed_local_path, reason: 'new_remote' }

            end

          end

        end

      end

  

      actions

    end

  

    def determine_update_action(rel_path, local, remote)

      # Check sync state first

      last_sync = @sync_state[rel_path]

      

      # Calculate local content hash (if not already done)

      local[:checksum] ||= calculate_checksum(local[:path])

      

      # 1. Content Identity Check (Size + Checksum if available)

      # Cloudinary doesn't give us MD5/SHA of original file easily unless we stored it in context.

      # We'll use file size as a quick check, and last_sync state.

      

      if last_sync && last_sync['remote_version'] == remote[:version] && last_sync['local_checksum'] == local[:checksum]

        return nil # Fully synced

      end

  

      # Check if identical based on size (and potentially other metadata if available)

      if remote && local[:size] == remote[:size]

         @stats[:skipped] += 1

         return nil

      end

      

      # Conflict Detection

      # A conflict occurs if both changed since last sync

      local_changed = last_sync.nil? || last_sync['local_checksum'] != local[:checksum]

      remote_changed = last_sync.nil? || last_sync['remote_version'] != remote[:version]

      

      if local_changed && remote_changed

        return resolve_conflict(rel_path, local, remote)

      elsif local_changed

        return nil unless ['upload', 'bidirectional'].include?(@options[:direction])

        return { type: :upload, file: rel_path, reason: 'changed_local' }

      elsif remote_changed

        return nil unless ['download', 'bidirectional'].include?(@options[:direction])

        return { type: :download, public_id: remote[:public_id], target_path: rel_path, reason: 'changed_remote' }

      end

      

      nil

    end

  

    def resolve_conflict(rel_path, local, remote)

      # If the user wants to skip conflicts, return nil

      if @options[:conflict_mode] == 'skip'

        @stats[:skipped] += 1

        return nil

      end

  

      puts "\n🔥 CONFLICT DETECTED: #{rel_path}".colorize(:red)

      puts "   🏠 Local:  #{local[:mtime]} | #{format_bytes(local[:size])}".colorize(:yellow)

      puts "   ☁️  Remote: #{remote[:created_at]} | #{format_bytes(remote[:size])}".colorize(:blue)

      

      case @options[:conflict_mode]

      when 'local'

        { type: :upload, file: rel_path, reason: 'conflict_resolve_local' }

      when 'remote'

        { type: :download, public_id: remote[:public_id], target_path: rel_path, reason: 'conflict_resolve_remote' }

      when 'newer'

        if local[:mtime] > remote[:created_at]

          { type: :upload, file: rel_path, reason: 'conflict_resolve_newer_local' }

        else

          { type: :download, public_id: remote[:public_id], target_path: rel_path, reason: 'conflict_resolve_newer_remote' }

        end

      when 'prompt'

        ask_user_resolution(rel_path, local, remote)

      end

    end

  

    def ask_user_resolution(rel_path, local, remote)

      # This requires interactive TTY

      return nil unless $stdin.tty?

  

      puts "   Choose resolution:".colorize(:yellow)

      puts "   [l] Use local version (upload)"

      puts "   [r] Use remote version (download)"

      puts "   [s] Skip this file"

      

      print "   > "

      choice = $stdin.gets.chomp.downcase

      

      case choice

      when 'l'

        { type: :upload, file: rel_path, reason: 'user_selected_local' }

      when 'r'

        { type: :download, public_id: remote[:public_id], target_path: rel_path, reason: 'user_selected_remote' }

      else

        puts "   Skipping...".colorize(:yellow)

        @stats[:skipped] += 1

        nil

      end

    end

  

    # ---------------------------------------------------------------------------

    # Execution

    # ---------------------------------------------------------------------------

  

    def execute_actions(actions)

      puts "\n⚡ Executing #{actions.size} actions...".colorize(:blue)

      

      actions.each_with_index do |action, idx|

        # Progress

        prefix = "[#{idx + 1}/#{actions.size}]"

        

        if @options[:dry_run]

          puts "#{prefix} #{action[:type].upcase} #{action[:file] || action[:target_path]} (#{action[:reason]})".colorize(:yellow)

          next

        end

        

        case action[:type]

        when :upload

          perform_upload(action[:file], prefix)

        when :download

          perform_download(action[:public_id], action[:target_path], prefix)

        end

      end

    end

  

    def perform_upload(rel_path, prefix)

      local_data = @local_files[rel_path]

      full_path = local_data[:path]

      public_id = rel_path.sub(File.extname(rel_path), '')

      

      print "#{prefix} Uploading #{rel_path}... "

      

      begin

        result = Cloudinary::Uploader.upload(

          full_path,

          public_id: public_id,

          overwrite: true,

          resource_type: 'image',

          context: "checksum=#{local_data[:checksum]}" # Store checksum for future sync

        )

        

        # Update State

        update_state_after_upload(rel_path, result, local_data[:checksum])

        @stats[:uploaded] += 1

        puts "✅".colorize(:green)

        

      rescue => e

        puts "❌ #{e.message}".colorize(:red)

        @stats[:errors] += 1

      end

    end

  

    def perform_download(public_id, target_path, prefix)

      print "#{prefix} Downloading #{target_path}... "

      

      full_target_path = File.join(@base_path, target_path)

      

      # Backup if exists

      if File.exist?(full_target_path) && @options[:backup]

        backup_file(full_target_path)

      end

      

      # Ensure directory exists

      FileUtils.mkdir_p(File.dirname(full_target_path))

      

      begin

        # Generate URL (secured)

        url = Cloudinary::Utils.cloudinary_url(public_id, secure: true, sign_url: true)

        

        # Download

        require 'open-uri'

        File.open(full_target_path, "wb") do |saved_file|

          # the following "open" is provided by open-uri

          URI.open(url, "rb") do |read_file|

            saved_file.write(read_file.read)

          end

        end

        

        # Get fresh metadata from file

        checksum = calculate_checksum(full_target_path)

        remote_ver = @remote_files[public_id] ? @remote_files[public_id][:version] : nil

        

        update_state_after_download(target_path, checksum, remote_ver)

        @stats[:downloaded] += 1

        puts "✅".colorize(:green)

        

      rescue => e

        puts "❌ #{e.message}".colorize(:red)

        @stats[:errors] += 1

      end

    end

  

    # ---------------------------------------------------------------------------

    # State Management

    # ---------------------------------------------------------------------------

  

    def load_sync_state

      if File.exist?(SYNC_STATE_FILE)

        JSON.parse(File.read(SYNC_STATE_FILE))

      else

        {}

      end

    rescue

      {}

    end

  

    def save_sync_state

      File.write(SYNC_STATE_FILE, JSON.pretty_generate(@sync_state))

    end

  

    def update_state_after_upload(rel_path, result, checksum)

      @sync_state[rel_path] = {

        'last_synced_at' => Time.now.iso8601,

        'local_checksum' => checksum,

        'remote_version' => result['version'],

        'remote_public_id' => result['public_id']

      }

    end

  

    def update_state_after_download(rel_path, checksum, remote_version)

      @sync_state[rel_path] = {

        'last_synced_at' => Time.now.iso8601,

        'local_checksum' => checksum,

        'remote_version' => remote_version,

        'remote_public_id' => rel_path.sub(File.extname(rel_path), '')

      }

    end

  

    # ---------------------------------------------------------------------------

    # Helpers

    # ---------------------------------------------------------------------------

  

    def calculate_checksum(path)

      Digest::SHA256.file(path).hexdigest

    end

  

    def image_file?(path)

      ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].include?(File.extname(path).downcase)

    end

  

    def included?(path)

      return true if @options[:include].empty?

      @options[:include].any? { |pattern| File.fnmatch(pattern, path) }

    end

  

    def excluded?(path)

      @options[:exclude].any? { |pattern| File.fnmatch(pattern, path) }

    end

  

    def backup_file(path)

      timestamp = Time.now.strftime('%Y%m%d_%H%M%S')

      filename = File.basename(path)

      backup_path = File.join(BACKUP_DIR, "#{filename}.#{timestamp}.bak")

      FileUtils.cp(path, backup_path)

    end

  

    def format_bytes(bytes)

      return "0 B" if bytes.nil? || bytes == 0

      units = %w[B KB MB GB]

      exp = (Math.log(bytes) / Math.log(1024)).to_i

      exp = 3 if exp > 3

      "%.1f %s" % [bytes.to_f / 1024 ** exp, units[exp]]

    end

  

    def print_summary

      puts "\n📊 Sync Summary".colorize(:cyan).bold

      puts "-" * 30

      puts "Uploaded:   #{@stats[:uploaded]}".colorize(:green)

      puts "Downloaded: #{@stats[:downloaded]}".colorize(:blue)

      puts "Skipped:    #{@stats[:skipped]}".colorize(:yellow)

      puts "Errors:     #{@stats[:errors]}".colorize(:red)

      puts "-" * 30

      puts "Log file:   #{File.join(LOG_DIR, "sync_#{Time.now.to_i}.log")}"

    end

  end

  

  # -----------------------------------------------------------------------------

  # CLI Entry Point

  # -----------------------------------------------------------------------------

  

  if __FILE__ == $0

    options = {}

    

    parser = OptionParser.new do |opts|

      opts.banner = "Usage: cloudinary-upload-synced.rb [options]"

  

      opts.on("-d", "--direction DIRECTION", "Sync direction: upload, download, bidirectional (default)") do |v|

        options[:direction] = v

      end

  

      opts.on("-c", "--conflict STRATEGY", "Conflict strategy: skip (default), prompt, local, remote, newer") do |v|

        options[:conflict_mode] = v

      end

  

      opts.on("-n", "--dry-run", "Show what would happen without making changes") do |v|

        options[:dry_run] = true

      end

  

      opts.on("-f", "--force", "Force sync regardless of state") do |v|

        options[:force] = true

      end

  

      opts.on("--no-backup", "Disable local backups before overwriting") do |v|

        options[:backup] = false

      end

  

      opts.on("-i", "--include PATTERN", "Include files matching pattern (glob)") do |v|

        options[:include] ||= []

        options[:include] << v

      end

  

      opts.on("-e", "--exclude PATTERN", "Exclude files matching pattern (glob)") do |v|

        options[:exclude] ||= []

        options[:exclude] << v

      end

      

      opts.on("-v", "--verbose", "Verbose output") do |v|

        options[:verbose] = true

      end

    end

  

    parser.parse!

  

    tool = CloudinarySyncTool.new(options)

    tool.run

  end

  
