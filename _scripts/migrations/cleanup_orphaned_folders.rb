#!/usr/bin/env ruby

require 'cloudinary'
require 'cloudinary/api'
require 'base64'
require 'time'
require 'dotenv/load'
require 'colorize'

class CloudinaryOrphanedCleaner
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

    @orphaned_folders = ['harpot', 'harpotter', 'test']
    @dry_run = ARGV.include?('--dry-run')
  end

  def run
    puts "\n🧹 Cloudinary Orphaned Folder Cleanup".colorize(:cyan).bold
    puts "Mode: #{@dry_run ? 'DRY RUN' : 'LIVE CLEANUP'}".colorize(:yellow)
    puts "="*50

    return unless validate_config

    @orphaned_folders.each do |folder|
      cleanup_folder(folder)
    end

    puts "\n✅ Cleanup completed!".colorize(:green)
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

  def cleanup_folder(folder_name)
    puts "\n🔍 Checking folder: #{folder_name}/".colorize(:blue)
    
    begin
      # Search for assets in this folder
      response = Cloudinary::Api.resources(
        type: 'upload',
        prefix: folder_name + '/',
        max_results: 500
      )

      assets = response['resources'] || []
      
      if assets.empty?
        puts "   📭 No assets found in #{folder_name}/ folder".colorize(:yellow)
        return
      end

      puts "   📁 Found #{assets.length} assets in #{folder_name}/ folder:".colorize(:cyan)
      
      assets.each do |asset|
        public_id = asset['public_id']
        puts "   - #{public_id}".colorize(:light_blue)
        
        unless @dry_run
          delete_asset(public_id)
        end
      end

      if @dry_run
        puts "   🔥 Would delete #{assets.length} assets (DRY RUN)".colorize(:yellow)
      else
        puts "   ✅ Deleted #{assets.length} assets from #{folder_name}/ folder".colorize(:green)
      end

    rescue Cloudinary::Api::NotFound
      puts "   📭 Folder #{folder_name}/ not found on Cloudinary".colorize(:yellow)
    rescue => e
      puts "   ❌ Error checking folder #{folder_name}/: #{e.message}".colorize(:red)
    end
  end

  def delete_asset(public_id)
    begin
      Cloudinary::Api.delete_resources([public_id])
      puts "     🗑️  Deleted: #{public_id}".colorize(:green)
    rescue => e
      puts "     ❌ Failed to delete #{public_id}: #{e.message}".colorize(:red)
    end
    
    # Small delay to prevent API rate limiting
    sleep(0.1)
  end
end

if __FILE__ == $0
  cleaner = CloudinaryOrphanedCleaner.new
  cleaner.run
end