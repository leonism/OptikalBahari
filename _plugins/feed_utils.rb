module Jekyll
  module FeedFilter
    def clean_feed_content(input)
      return input if input.nil?

      # 1. Remove HTML comments entirely
      input = input.gsub(/<!--.*?-->/m, '')

      # 2. Remove layout and complex tags but KEEP their inner content
      # This preserves the text inside <div>, <section>, <picture>, etc.
      tags_to_strip = %w[div section aside nav header footer article picture figure figcaption main]
      tags_to_strip.each do |tag|
        input = input.gsub(/<#{tag}[^>]*>/i, '')
        input = input.gsub(/<\/#{tag}>/i, '')
      end

      # 3. Completely REMOVE tags that are redundant or problematic in RSS
      # These tags and their attributes are deleted entirely.
      input = input.gsub(/<source[^>]*\/?>/i, '')

      # 4. Strip ALL attributes from remaining tags except for a whitelist
      # Allowed: href, src, alt, title
      input = input.gsub(/<([a-z1-6]+)([^>]*)>/i) do |match|
        tag_name = $1.downcase
        raw_attrs = $2
        
        # Whitelist of attributes to keep
        allowed_attrs = %w[href src alt title]
        clean_attrs = ""
        
        # Scan for attributes and keep only the allowed ones
        raw_attrs.scan(/\s+([a-zA-Z0-9-]+)=("[^"]*"|'[^']*')/i) do |attr_name, attr_value|
          if allowed_attrs.include?(attr_name.downcase)
            clean_attrs << " #{attr_name.downcase}=#{attr_value}"
          end
        end
        
        # Return the cleaned tag
        "<#{tag_name}#{clean_attrs}>"
      end

      # 5. Final cleanup: normalize whitespace
      input.gsub(/\s{2,}/, ' ').strip
    end
  end
end

Liquid::Template.register_filter(Jekyll::FeedFilter)
