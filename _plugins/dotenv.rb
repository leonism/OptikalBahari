require 'dotenv'
Dotenv.load

# Inject Algolia credentials from ENV into Jekyll configuration
Jekyll::Hooks.register :site, :post_read do |site|
  # Inject into site.data which is reliably available in Liquid
  # Using post_read ensures this happens after site.reset and site.read
  site.data['algolia_credentials'] = {
    'application_id' => ENV['ALGOLIA_APPLICATION_ID'],
    'search_only_api_key' => ENV['ALGOLIA_SEARCH_API_KEY'],
    'index_name' => ENV['ALGOLIA_INDEX_NAME']
  }

  # Inject Cloudinary credentials
  site.data['cloudinary'] = {
    'cloud_name' => ENV['CLOUDINARY_CLOUD_NAME']
  }

  # Also keep standard algolia config for the plugin (backend)
  site.config['algolia'] ||= {}

  if ENV['ALGOLIA_APPLICATION_ID']
    site.config['algolia']['application_id'] = ENV['ALGOLIA_APPLICATION_ID']
  end

  # Allow overriding index name via ENV
  if ENV['ALGOLIA_INDEX_NAME']
    site.config['algolia']['index_name'] = ENV['ALGOLIA_INDEX_NAME']
  end
end
