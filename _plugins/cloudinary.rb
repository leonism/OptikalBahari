require 'cloudinary'
require 'cloudinary/utils'

module Jekyll
  module CloudinaryFilters
    def cloudinary_url(input, options = {})
      return input if input.nil? || input.empty?
      
      # Initialize Cloudinary if not already done
      unless @cloudinary_initialized
        Cloudinary.config(
          cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
          api_key: ENV['CLOUDINARY_API_KEY'],
          api_secret: ENV['CLOUDINARY_API_SECRET'],
          secure: true
        )
        @cloudinary_initialized = true
      end
      
      # Extract public_id from local path
      public_id = extract_public_id(input)
      
      # Default transformations
      default_options = {
        quality: 'auto',
        fetch_format: 'auto',
        dpr: 'auto'
      }
      
      # Merge with provided options
      transformation_options = default_options.merge(options)
      
      # Generate Cloudinary URL
      Cloudinary::Utils.cloudinary_url(public_id, transformation_options)
    end
    
    def cloudinary_responsive(input, options = {})
      return input if input.nil? || input.empty?
      
      public_id = extract_public_id(input)
      
      # Generate responsive breakpoints
      breakpoints = [
        { width: 400, suffix: 'sm' },
        { width: 800, suffix: 'md' },
        { width: 1200, suffix: 'lg' }
      ]
      
      srcset_urls = breakpoints.map do |bp|
        url = cloudinary_url(input, options.merge(width: bp[:width]))
        "#{url} #{bp[:width]}w"
      end
      
      srcset_urls.join(', ')
    end
    
    def cloudinary_preset(input, preset)
      return input if input.nil? || input.empty?
      
      presets = {
        'thumbnail' => { width: 200, height: 200, crop: 'fill', gravity: 'auto' },
        'card' => { width: 400, height: 300, crop: 'fill', gravity: 'auto' },
        'hero' => { width: 1200, height: 600, crop: 'fill', gravity: 'auto' },
        'full' => { width: 1920 }
      }
      
      preset_options = presets[preset] || {}
      cloudinary_url(input, preset_options)
    end
    
    private
    
    def extract_public_id(input)
      # Remove leading slash and assets/img/ prefix
      public_id = input.gsub(/^\/?assets\/img\//, '')
      # Remove file extension
      public_id = public_id.gsub(/\.[^.]+$/, '')
      # Return the path as-is since folder structure is handled by Cloudinary folders
      public_id
    end
  end
end

Liquid::Template.register_filter(Jekyll::CloudinaryFilters)

# Cloudinary Tag for more complex usage
module Jekyll
  class CloudinaryTag < Liquid::Tag
    def initialize(tag_name, markup, tokens)
      super
      @markup = markup.strip
    end
    
    def render(context)
      # Parse parameters
      params = parse_params(@markup)
      src = params['src'] || params.keys.first
      
      return '' if src.nil? || src.empty?
      
      # Remove quotes if present
      src = src.gsub(/["']/, '')
      
      # Extract transformation options
      options = params.reject { |k, v| k == 'src' }
      
      # Convert string values to appropriate types
      options = options.transform_values do |value|
        case value
        when /^\d+$/
          value.to_i
        when 'true'
          true
        when 'false'
          false
        else
          value.gsub(/["']/, '')
        end
      end
      
      # Generate Cloudinary URL
      cloudinary_url = Jekyll::CloudinaryFilters.new.cloudinary_url(src, options)
      
      cloudinary_url
    end
    
    private
    
    def parse_params(markup)
      params = {}
      markup.scan(/([\w-]+)=(["']?)([^"'\s]+)\2/) do |key, quote, value|
        params[key] = value
      end
      
      # Handle the case where src is provided without key=value format
      if params.empty? && !markup.empty?
        params[markup] = true
      end
      
      params
    end
  end
end

Liquid::Template.register_tag('cloudinary', Jekyll::CloudinaryTag)