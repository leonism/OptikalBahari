#!/usr/bin/env ruby
require 'fileutils'

class HtmlGapCleaner
  # Scan your usual directories
  BASE_DIR = File.expand_path('../../', __dir__)
  TARGET_DIRECTORIES = [
    File.join(BASE_DIR, '_pages'),
    File.join(BASE_DIR, '_posts'),
    File.join(BASE_DIR, '_includes', 'home')
  ]
  EXTENSIONS = ['.md', '.markdown', '.html']

  def run
    puts "🧹 Starting HTML Gap Cleanup..."
    TARGET_DIRECTORIES.each do |dir|
      Dir.glob("#{dir}/**/*{#{EXTENSIONS.join(',')}}").each do |file_path|
        process_file(file_path)
      end
    end
    puts "✨ Done."
  end

  def process_file(file_path)
    content = File.read(file_path)
    original_content = content.dup

    # Regex breakdown:
    # <img       : Find the start of an img tag
    # [^>]+      : Match everything inside until the closing >
    # >          : End of tag
    # /m         : Multiline mode
    content.gsub!(/<img[^>]+>/m) do |img_block|
      # Inside the img tag, replace 2+ newlines (with potential spaces)
      # with a single newline and standard indentation
      img_block.gsub(/(\n\s*){2,}/, "\n      ")
    end

    if content != original_content
      File.write(file_path, content)
      puts "✅ Fixed: #{file_path}"
    end
  end
end

if __FILE__ == $0
  HtmlGapCleaner.new.run
end
