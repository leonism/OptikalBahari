require 'cloudinary'
require 'cloudinary/utils'

# --- ADD THIS BLOCK TO LOAD .ENV LOCALLY ---
begin
  require 'dotenv'
  Dotenv.load
rescue LoaderError, LoadError
  # If dotenv isn't installed, we assume variables are set in the environment (like Cloudflare)
end
# -------------------------------------------

# Configure Cloudinary globally
# It will now pull from your .env file locally OR from Cloudflare variables in production
Cloudinary.config(
  cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
  api_key: ENV['CLOUDINARY_API_KEY'],
  api_secret: ENV['CLOUDINARY_API_SECRET'],
  secure: true
)

module Jekyll
  module CloudinaryFilters
    def cloudinary_url(input, options = {})
      return input if input.nil? || input.empty?

      # Extract public_id from local path
      public_id = extract_public_id(input)

      # Default transformations
      transformation_options = {
        "quality" => 'auto',
        "fetch_format" => 'auto',
        "dpr" => 'auto'
      }

      # Convert String options from Liquid
      if options.is_a?(String)
        parsed_options = {}
        options.split(',').each do |pair|
          parts = pair.strip.split('_', 2)
          next unless parts.length == 2
          key = parts[0]
          value = parts[1]

          case key
          when 'w' then parsed_options["width"] = value
          when 'h' then parsed_options["height"] = value
          when 'c' then parsed_options["crop"] = value
          when 'q' then parsed_options["quality"] = value
          when 'f' then parsed_options["fetch_format"] = value
          when 'g' then parsed_options["gravity"] = value
          end
        end
        transformation_options.merge!(parsed_options)
      elsif options.is_a?(Hash)
        transformation_options.merge!(options.transform_keys(&:to_s))
      end

      Cloudinary::Utils.cloudinary_url(public_id, transformation_options)
    rescue => e
      puts "⚠️ Cloudinary Error for #{input}: #{e.message}"
      input # Return original input if something goes wrong
    end

    private

    def extract_public_id(input)
      id = input.gsub(/https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/[^\/]+\//, '')
      id = id.gsub(/^\/?assets\/img\//, '')
      id = id.gsub(/\.[^.]+$/, '')
      id
    end
  end
end

Liquid::Template.register_filter(Jekyll::CloudinaryFilters)
