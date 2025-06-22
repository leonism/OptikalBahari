#!/usr/bin/env ruby

require 'cloudinary'
require 'cloudinary/api'
require 'base64'
require 'time'
require 'dotenv/load'
require 'colorize'
require 'set'

class CloudinaryAssetLister
  def initialize
    # Load environment variables
    Dotenv.load

    # Configure Cloudinary
    Cloudinary.config(
      cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
      api_key: ENV['CLOUDINARY_API_KEY'],
      api_secret: ENV['CLOUDINARY_API_SECRET'],
      secure: true
    )

    @all_assets = []
    @folders = Set.new
  end

  def run
    puts "\n📋 Cloudinary Asset Inventory".colorize(:cyan).bold
    puts "="*50

    return unless validate_config

    load_all_assets
    analyze_folders
    check_specific_folders
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

    puts "✅ Configuration validated".colorize(:green)
    true
  end

  def load_all_assets
    puts "\n🔍 Loading all assets from Cloudinary...".colorize(:blue)
    
    begin
      next_cursor = nil
      total_loaded = 0
      
      loop do
        options = {
          type: 'upload',
          max_results: 500
        }
        options[:next_cursor] = next_cursor if next_cursor
        
        response = Cloudinary::Api.resources(options)
        resources = response['resources'] || []
        
        @all_assets.concat(resources)
        total_loaded += resources.length
        
        print "\r   📦 Loaded #{total_loaded} assets..."
        
        next_cursor = response['next_cursor']
        break unless next_cursor
        
        sleep(0.1) # Rate limiting
      end
      
      puts "\n✅ Total assets loaded: #{@all_assets.length}".colorize(:green)
      
    rescue => e
      puts "\n❌ Error loading assets: #{e.message}".colorize(:red)
    end
  end

  def analyze_folders
    puts "\n📁 Analyzing folder structure...".colorize(:blue)
    
    @all_assets.each do |asset|
      public_id = asset['public_id']
      if public_id.include?('/')
        # Extract all folder levels
        parts = public_id.split('/')
        (0...parts.length-1).each do |i|
          folder_path = parts[0..i].join('/')
          @folders.add(folder_path)
        end
      end
    end
    
    puts "\n📂 Found #{@folders.length} unique folders:".colorize(:cyan)
    @folders.sort.each do |folder|
      asset_count = @all_assets.count { |a| a['public_id'].start_with?(folder + '/') }
      puts "   #{folder}/ (#{asset_count} assets)".colorize(:light_blue)
    end
  end

  def check_specific_folders
    puts "\n🎯 Checking specific folders mentioned by user...".colorize(:blue)
    
    target_folders = ['harpot', 'harpotter', 'test']
    
    target_folders.each do |folder|
      puts "\n🔍 Checking #{folder}/ folder:".colorize(:yellow)
      
      # Check if folder exists in our list
      folder_exists = @folders.any? { |f| f == folder || f.start_with?(folder + '/') }
      
      if folder_exists
        puts "   ✅ Folder #{folder}/ exists".colorize(:green)
        
        # List assets in this folder
        folder_assets = @all_assets.select { |a| a['public_id'].start_with?(folder + '/') }
        
        if folder_assets.any?
          puts "   📁 Assets in #{folder}/ folder:".colorize(:cyan)
          folder_assets.each do |asset|
            puts "     - #{asset['public_id']} (#{asset['format']}, #{asset['bytes']} bytes)".colorize(:light_blue)
          end
        else
          puts "   📭 No assets found in #{folder}/ folder".colorize(:yellow)
        end
      else
        puts "   📭 Folder #{folder}/ not found".colorize(:yellow)
      end
    end
    
    # Also check for any folders that might contain these names
    puts "\n🔍 Checking for folders containing target names...".colorize(:blue)
    target_folders.each do |target|
      matching_folders = @folders.select { |f| f.include?(target) }
      if matching_folders.any?
        puts "   🎯 Folders containing '#{target}':".colorize(:cyan)
        matching_folders.each do |folder|
          asset_count = @all_assets.count { |a| a['public_id'].start_with?(folder + '/') }
          puts "     - #{folder}/ (#{asset_count} assets)".colorize(:light_blue)
        end
      else
        puts "   📭 No folders found containing '#{target}'".colorize(:yellow)
      end
    end
  end
end

if __FILE__ == $0
  lister = CloudinaryAssetLister.new
  lister.run
end