# Force UTF-8 encoding for standard streams and internal processing
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

require 'dotenv'
require 'erb'

# Load .env variables immediately when plugin is required
Dotenv.load

# Bridge ALGOLIA_ADMIN_API_KEY to ALGOLIA_API_KEY for jekyll-algolia compatibility
# This ensures that if the user defines ALGOLIA_ADMIN_API_KEY, it's also available as ALGOLIA_API_KEY
ENV['ALGOLIA_API_KEY'] ||= ENV['ALGOLIA_ADMIN_API_KEY']

module Jekyll
  module EnvLoader
    # Process the config hash to evaluate ERB-like ENV placeholders
    def self.process_config(config)
      config.each do |key, value|
        if value.is_a?(Hash)
          process_config(value)
        elsif value.is_a?(String) && value.match?(/<%=\s*ENV\[['"].+['"]\]\s*%>|{{ site\..+ }}/)
          config[key] = evaluate_value(value)
        end
      end
    end

    def self.evaluate_value(value)
      # Handle <%= ENV['VAR'] %>
      if value.match?(/<%=\s*ENV\[['"](.+)['"]\]\s*%>/)
        var_name = value.match(/<%=\s*ENV\[['"](.+)['"]\]\s*%>/)[1]
        return ENV[var_name] || value
      end

      value
    end
  end
end

# Use a hook that runs earlier than Generators
# after_init is called right after the Site object is initialized
Jekyll::Hooks.register :site, :after_init do |site|
  Jekyll::EnvLoader.process_config(site.config)
end
