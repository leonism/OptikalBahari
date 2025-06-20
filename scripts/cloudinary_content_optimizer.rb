#!/usr/bin/env ruby

require 'yaml'
require 'fileutils'
require 'find'
require 'uri'
require 'json'

# Load environment variables
require 'dotenv'
Dotenv.load

class CloudinaryContentOptimizer
  def initialize
    @base_path = Dir.pwd
    @posts_path = File.join(@base_path, '_posts')
    @pages_path = File.join(@base_path, '_pages')
    @cloudinary_base_url = "https://res.cloudinary.com/#{ENV['CLOUDINARY_CLOUD_NAME']}/image/upload"
    @processed_files = []
    @errors = []
    @changes_made = 0
    
    # Load existing sync state if available
    @sync_state_file = File.join(@base_path, '_cloudinary', '.cloudinary_sync_state.json')
    @sync_state = load_sync_state
    
    # Image size configurations for responsive images
    @responsive_sizes = {
      small: 480,
      medium: 768,
      large: 1200
    }
    
    # Default aspect ratio (can be overridden)
    @default_aspect_ratio = 16.0 / 9.0
  end
  
  def optimize_all_content
    puts "Starting Cloudinary content optimization..."
    puts "Base path: #{@base_path}"
    
    # Process _posts directory
    if Dir.exist?(@posts_path)
      puts "\nProcessing _posts directory..."
      process_directory(@posts_path)
    else
      puts "Warning: _posts directory not found"
    end
    
    # Process _pages directory
    if Dir.exist?(@pages_path)
      puts "\nProcessing _pages directory..."
      process_directory(@pages_path)
    else
      puts "Warning: _pages directory not found"
    end
    
    # Generate report
    generate_report
  end
  
  private
  
  def load_sync_state
    if File.exist?(@sync_state_file)
      JSON.parse(File.read(@sync_state_file))
    else
      {}
    end
  rescue JSON::ParserError
    puts "Warning: Could not parse sync state file, starting fresh"
    {}
  end
  
  def process_directory(directory)
    Find.find(directory) do |path|
      next unless File.file?(path)
      next unless ['.md', '.html'].include?(File.extname(path).downcase)
      
      process_file(path)
    end
  end
  
  def process_file(file_path)
    puts "Processing: #{File.basename(file_path)}"
    
    begin
      content = File.read(file_path)
      original_content = content.dup
      
      # Process frontmatter
      content = process_frontmatter(content, file_path)
      
      # Process HTML img tags
      content = process_html_images(content, file_path)
      
      # Process markdown image syntax
      content = process_markdown_images(content, file_path)
      
      # Write back if changes were made
      if content != original_content
        File.write(file_path, content)
        @processed_files << {
          file: file_path,
          status: 'updated'
        }
        puts "  ✓ Updated: #{File.basename(file_path)}"
      else
        @processed_files << {
          file: file_path,
          status: 'no_changes'
        }
        puts "  - No changes: #{File.basename(file_path)}"
      end
      
    rescue => e
      @errors << {
        file: file_path,
        error: e.message
      }
      puts "  ✗ Error processing #{File.basename(file_path)}: #{e.message}"
    end
  end
  
  def process_frontmatter(content, file_path)
    # Extract frontmatter
    if content.match(/^---\s*\n(.*?)\n---\s*\n/m)
      frontmatter_content = $1
      rest_of_content = content.sub(/^---\s*\n(.*?)\n---\s*\n/m, '')
      
      begin
        frontmatter = YAML.load(frontmatter_content)
        
        # Process background field
        if frontmatter['background'] && frontmatter['background'].start_with?('/assets/img/')
          cloudinary_url = convert_to_cloudinary_url(frontmatter['background'])
          if cloudinary_url
            frontmatter['background'] = cloudinary_url
            @changes_made += 1
          end
        end
        
        # Process thumbs field
        if frontmatter['thumbs'] && frontmatter['thumbs'].start_with?('/assets/img/')
          cloudinary_url = convert_to_cloudinary_url(frontmatter['thumbs'])
          if cloudinary_url
            frontmatter['thumbs'] = cloudinary_url
            @changes_made += 1
          end
        end
        
        # Reconstruct content
        new_frontmatter = YAML.dump(frontmatter).sub(/^---\n/, '')
        content = "---\n#{new_frontmatter}---\n#{rest_of_content}"
        
      rescue YAML::SyntaxError => e
        puts "  Warning: Could not parse frontmatter in #{File.basename(file_path)}: #{e.message}"
      end
    end
    
    content
  end
  
  def process_html_images(content, file_path)
    # Match HTML img tags with src pointing to /assets/img/
    content.gsub(/<img[^>]*src=["'](\/assets\/img\/[^"']+)["'][^>]*>/i) do |match|
      img_tag = match
      src_url = $1
      
      # Extract attributes
      attributes = extract_img_attributes(img_tag)
      
      # Convert to responsive picture element
      responsive_picture = generate_responsive_picture(src_url, attributes)
      
      if responsive_picture
        @changes_made += 1
        responsive_picture
      else
        img_tag # Return original if conversion failed
      end
    end
  end
  
  def process_markdown_images(content, file_path)
    # Match markdown image syntax ![alt](src)
    content.gsub(/!\[([^\]]*)\]\((\/assets\/img\/[^)]+)\)/) do |match|
      alt_text = $1
      src_url = $2
      
      # Convert to responsive picture element
      attributes = {
        'alt' => alt_text,
        'class' => 'img-fluid'
      }
      
      responsive_picture = generate_responsive_picture(src_url, attributes)
      
      if responsive_picture
        @changes_made += 1
        responsive_picture
      else
        match # Return original if conversion failed
      end
    end
  end
  
  def extract_img_attributes(img_tag)
    attributes = {}
    
    # Extract common attributes
    img_tag.scan(/(\w+)=["']([^"']*)["']/) do |attr, value|
      attributes[attr.downcase] = value
    end
    
    attributes
  end
  
  def convert_to_cloudinary_url(local_path)
    # Remove /assets/img/ prefix and file extension
    relative_path = local_path.sub(/^\/assets\/img\//, '')
    public_id = File.basename(relative_path, File.extname(relative_path))
    
    # Determine folder based on path structure
    folder = determine_cloudinary_folder(relative_path)
    full_public_id = folder ? "#{folder}/#{public_id}" : "optikalbahari/#{public_id}"
    
    # Check if this image exists in our sync state
    if @sync_state[local_path]
      return @sync_state[local_path]['cloudinary_url']
    end
    
    # Generate optimized Cloudinary URL
    "#{@cloudinary_base_url}/f_auto,q_auto/#{full_public_id}"
  end
  
  def determine_cloudinary_folder(relative_path)
    case relative_path
    when /^posts\//
      'optikalbahari/posts'
    when /^backgrounds?\//
      'optikalbahari/backgrounds'
    when /^icons?\//
      'optikalbahari/icons'
    when /^testimonials?\//
      'optikalbahari/testimonials'
    when /^profil\//
      'optikalbahari/profil'
    when /^splash-screen\//
      'optikalbahari/splash-screen'
    else
      'optikalbahari'
    end
  end
  
  def generate_responsive_picture(src_url, attributes = {})
    # Convert local URL to Cloudinary public ID
    relative_path = src_url.sub(/^\/assets\/img\//, '')
    public_id = File.basename(relative_path, File.extname(relative_path))
    folder = determine_cloudinary_folder(relative_path)
    full_public_id = folder ? "#{folder}/#{public_id}" : "optikalbahari/#{public_id}"
    
    # Extract important attributes
    alt_text = attributes['alt'] || attributes['title'] || 'Image'
    css_class = attributes['class'] || 'img-fluid'
    title = attributes['title'] || alt_text
    
    # Calculate dimensions (use defaults if not specified)
    width = attributes['width']&.to_i || @responsive_sizes[:medium]
    height = attributes['height']&.to_i || (width / @default_aspect_ratio).round
    
    # Generate responsive picture element
    picture_html = <<~HTML
      <picture>
        <!-- AVIF: Best modern compression -->
        <source
          srcset="
            #{@cloudinary_base_url}/f_avif,q_auto,w_#{@responsive_sizes[:small]}/#{full_public_id} #{@responsive_sizes[:small]}w,
            #{@cloudinary_base_url}/f_avif,q_auto,w_#{@responsive_sizes[:medium]}/#{full_public_id} #{@responsive_sizes[:medium]}w,
            #{@cloudinary_base_url}/f_avif,q_auto,w_#{@responsive_sizes[:large]}/#{full_public_id} #{@responsive_sizes[:large]}w
          "
          type="image/avif"
          sizes="(max-width: 768px) 100vw, 768px"
        >
      
        <!-- WebP: Broad support with good compression -->
        <source
          srcset="
            #{@cloudinary_base_url}/f_webp,q_auto,w_#{@responsive_sizes[:small]}/#{full_public_id} #{@responsive_sizes[:small]}w,
            #{@cloudinary_base_url}/f_webp,q_auto,w_#{@responsive_sizes[:medium]}/#{full_public_id} #{@responsive_sizes[:medium]}w,
            #{@cloudinary_base_url}/f_webp,q_auto,w_#{@responsive_sizes[:large]}/#{full_public_id} #{@responsive_sizes[:large]}w
          "
          type="image/webp"
          sizes="(max-width: 768px) 100vw, 768px"
        >
      
        <!-- JPEG: Legacy fallback -->
        <source
          srcset="
            #{@cloudinary_base_url}/f_jpg,q_auto,w_#{@responsive_sizes[:small]}/#{full_public_id} #{@responsive_sizes[:small]}w,
            #{@cloudinary_base_url}/f_jpg,q_auto,w_#{@responsive_sizes[:medium]}/#{full_public_id} #{@responsive_sizes[:medium]}w,
            #{@cloudinary_base_url}/f_jpg,q_auto,w_#{@responsive_sizes[:large]}/#{full_public_id} #{@responsive_sizes[:large]}w
          "
          type="image/jpeg"
          sizes="(max-width: 768px) 100vw, 768px"
        >
      
        <!-- Final fallback -->
        <img
          src="#{@cloudinary_base_url}/f_auto,q_auto,w_#{@responsive_sizes[:medium]}/#{full_public_id}"
          alt="#{alt_text}"
          title="#{title}"
          class="#{css_class}"
          loading="lazy"
          decoding="async"
          width="#{width}"
          height="#{height}"
        >
      </picture>
    HTML
    
    # Clean up the HTML (remove extra whitespace)
    picture_html.gsub(/\n\s+/, "\n").strip
  end
  
  def generate_report
    puts "\n" + "=" * 60
    puts "CLOUDINARY CONTENT OPTIMIZATION REPORT"
    puts "=" * 60
    
    updated_files = @processed_files.select { |f| f[:status] == 'updated' }
    unchanged_files = @processed_files.select { |f| f[:status] == 'no_changes' }
    
    puts "Files processed: #{@processed_files.length}"
    puts "Files updated: #{updated_files.length}"
    puts "Files unchanged: #{unchanged_files.length}"
    puts "Total changes made: #{@changes_made}"
    puts "Errors encountered: #{@errors.length}"
    
    if updated_files.any?
      puts "\nUpdated files:"
      updated_files.each do |file_info|
        puts "  ✓ #{File.basename(file_info[:file])}"
      end
    end
    
    if @errors.any?
      puts "\nErrors:"
      @errors.each do |error_info|
        puts "  ✗ #{File.basename(error_info[:file])}: #{error_info[:error]}"
      end
    end
    
    # Save detailed report
    timestamp = Time.now.strftime('%Y%m%d_%H%M%S')
    report_file = "cloudinary_optimization_report_#{timestamp}.yml"
    
    report_data = {
      timestamp: timestamp,
      summary: {
        files_processed: @processed_files.length,
        files_updated: updated_files.length,
        files_unchanged: unchanged_files.length,
        total_changes: @changes_made,
        errors: @errors.length
      },
      processed_files: @processed_files,
      errors: @errors
    }
    
    File.write(report_file, report_data.to_yaml)
    puts "\nDetailed report saved to: #{report_file}"
    
    puts "\nOptimization complete! Your content is now using Cloudinary's optimized, responsive images."
    puts "\nNext steps:"
    puts "1. Test your site locally to ensure images load correctly"
    puts "2. Check that responsive breakpoints work as expected"
    puts "3. Verify that all image formats (AVIF, WebP, JPEG) are supported"
    puts "4. Deploy your changes to production"
  end
end

# Command line interface
if __FILE__ == $0
  require 'optparse'
  
  options = {}
  
  OptionParser.new do |opts|
    opts.banner = "Usage: #{$0} [options]"
    
    opts.on("-h", "--help", "Show this help message") do
      puts opts
      exit
    end
    
    opts.on("-v", "--verbose", "Enable verbose output") do
      options[:verbose] = true
    end
    
    opts.on("-d", "--dry-run", "Show what would be changed without making changes") do
      options[:dry_run] = true
    end
  end.parse!
  
  if options[:dry_run]
    puts "DRY RUN MODE: No files will be modified"
    puts "This feature will be implemented in a future version"
    exit
  end
  
  optimizer = CloudinaryContentOptimizer.new
  optimizer.optimize_all_content
end