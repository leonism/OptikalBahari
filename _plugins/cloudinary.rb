require 'cloudinary'
require 'cloudinary/utils'

# --- LOAD .ENV FOR LOCAL DEVELOPMENT ---
begin
  require 'dotenv'
  Dotenv.load
rescue LoadError
  # Dotenv not installed or not needed (e.g., in Production/Cloudflare)
end

# --- GLOBAL CONFIGURATION ---
# This ensures the Cloudinary Gem is ready the moment Jekyll starts.
Cloudinary.config(
  cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
  api_key:    ENV['CLOUDINARY_API_KEY'],
  api_secret: ENV['CLOUDINARY_API_SECRET'],
  secure:     true
)

module Jekyll
  module CloudinaryFilters
    def cloudinary_url(input, options = {})
      return input if input.nil? || input.empty?

      # Extract the clean Public ID
      public_id = extract_public_id(input)

      # Default transformations
      transformation_options = {
        "quality"      => 'auto',
        "fetch_format" => 'auto',
        "dpr"          => 'auto'
      }

      # Convert String options from Liquid (e.g., 'w_800,c_fill') into a Hash
      if options.is_a?(String)
        parsed_options = {}
        options.split(',').each do |pair|
          parts = pair.strip.split('_', 2)
          next unless parts.length == 2

          key, value = parts[0], parts[1]
          case key
          when 'w'  then parsed_options["width"] = value
          when 'h'  then parsed_options["height"] = value
          when 'c'  then parsed_options["crop"] = value
          when 'q'  then parsed_options["quality"] = value
          when 'f'  then parsed_options["fetch_format"] = value
          when 'g'  then parsed_options["gravity"] = value
          when 'r'  then parsed_options["radius"] = value
          when 'e'  then parsed_options["effect"] = value
          when 'bo' then parsed_options["border"] = value
          end
        end
        transformation_options.merge!(parsed_options)
      elsif options.is_a?(Hash)
        transformation_options.merge!(options.transform_keys(&:to_s))
      end

      # Generate the final URL
      Cloudinary::Utils.cloudinary_url(public_id, transformation_options)
    rescue => e
      # If configuration is missing or API fails, log it and return original path
      puts "[WARNING] Cloudinary Error for #{input}: #{e.message}"
      input
    end

    private

    def extract_public_id(input)
      return "" if input.nil?

      # 1. Force string and clean whitespace
      id = input.to_s.strip

      # 2. Strip Cloudinary domain & versioning if a full URL was passed
      # Matches: https://res.cloudinary.com/cloud/image/upload/v12345/
      id = id.gsub(/https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/(v\d+\/)?/, '')

      # 3. Strip leading slashes
      id = id.gsub(/^\//, '')

      # 4. Strip common Jekyll/Local prefixes aggressively
      # This removes 'assets/img/' regardless of what comes before it
      id = id.gsub(/^(.*\/)?assets\/img\//, '')

      # 5. Strip all common image file extensions
      id = id.gsub(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i, '')

      # 6. Final safety: remove any remaining leading slashes
      id = id.gsub(/^\//, '')

      id
    end
  end
end

# Register the Filter
Liquid::Template.register_filter(Jekyll::CloudinaryFilters)

# Cloudinary Tag for complex usage: {% cloudinary src="/assets/img/photo.jpg" w=800 %}
module Jekyll
  class CloudinaryTag < Liquid::Tag
    def initialize(tag_name, markup, tokens)
      super
      @markup = markup.strip
    end

    def render(context)
      params = parse_params(@markup)
      src = params.delete('src') || params.keys.first

      return '' if src.nil? || src.empty?

      # Clean quotes from source
      src = src.gsub(/["']/, '')

      # Access the filter logic by extending a new object
      filter = Object.new.extend(Jekyll::CloudinaryFilters)
      filter.cloudinary_url(src, params)
    end

    private

    def parse_params(markup)
      params = {}
      markup.scan(/([\w-]+)=(["']?)([^"'\s]+)\2/) do |key, quote, value|
        params[key] = value
      end
      params
    end
  end
end

# Register the Tag
Liquid::Template.register_tag('cloudinary', Jekyll::CloudinaryTag)
