require 'jekyll-algolia'

# Compatibility for Algolia indexing in CI/CD environments
# jekyll-algolia expects ALGOLIA_API_KEY, but we might have ALGOLIA_ADMIN_API_KEY
if ENV['ALGOLIA_ADMIN_API_KEY'] && !ENV['ALGOLIA_API_KEY']
  ENV['ALGOLIA_API_KEY'] = ENV['ALGOLIA_ADMIN_API_KEY']
end

# Custom hooks for Algolia indexing
module Jekyll
  module Algolia
    # Register hook to customize records before indexing
    module Hooks
      def self.before_indexing_each(record, node, context)
        # Ensure image field is available
        if record[:image].nil? || record[:image].to_s.empty?
          record[:image] = record[:header_image] if record[:header_image]
        end

        # Truncate excerpt to reasonable length
        if record[:excerpt] && record[:excerpt].length > 200
          record[:excerpt] = record[:excerpt][0..197] + '...'
        end

        # Add timestamp for custom ranking
        if record[:date]
          begin
            record[:timestamp] = Time.parse(record[:date]).to_i
          rescue
            record[:timestamp] = 0
          end
        end

        # Clean up content - remove excessive whitespace
        if record[:content]
          record[:content] = record[:content].gsub(/\s+/, ' ').strip
        end

        # Ensure categories and tags are arrays
        record[:categories] = Array(record[:categories])
        record[:tags] = Array(record[:tags])

        # Return the modified record
        record
      end

      # Hook to completely skip certain records
      def self.should_be_excluded?(filepath)
        # Exclude files that shouldn't be indexed
        excluded_patterns = [
          /404/,
          /sitemap/,
          /feed\.xml/,
          /robots\.txt/
        ]

        excluded_patterns.any? { |pattern| filepath.match(pattern) }
      end
    end
  end
end
