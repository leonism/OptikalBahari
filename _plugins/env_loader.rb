require 'dotenv'
require 'erb'

# Load .env variables
Dotenv.load

module Jekyll
  class EnvLoader < Generator
    safe true
    priority :highest

    def generate(site)
      # Recursively process the config hash to evaluate ERB-like ENV placeholders
      process_config(site.config)
    end

    private

    def process_config(config)
      config.each do |key, value|
        if value.is_a?(Hash)
          process_config(value)
        elsif value.is_a?(String) && value.match?(/<%=\s*ENV\[['"].+['"]\]\s*%>|{{ site\..+ }}/)
          config[key] = evaluate_value(value)
        end
      end
    end

    def evaluate_value(value)
      # Handle <%= ENV['VAR'] %>
      if value.match?(/<%=\s*ENV\[['"](.+)['"]\]\s*%>/)
        var_name = value.match(/<%=\s*ENV\[['"](.+)['"]\]\s*%>/)[1]
        return ENV[var_name] || value
      end

      value
    end
  end
end
