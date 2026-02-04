#!/usr/bin/env ruby
require 'fileutils'

class RollbackToLocal
  # Adjust paths based on your script location
  BASE_DIR = File.expand_path('../../', __dir__)
  TARGET_DIRS = [
    File.join(BASE_DIR, '_posts'),
    File.join(BASE_DIR, '_pages')
  ]

  # The Cloudinary URL pattern to match
  # Captures the path after the transformations (e.g., posts/folder/image)
  CLOUDINARY_REGEX = /background:\s*"?https:\/\/res\.cloudinary\.com\/divkqrf7k\/image\/upload\/[^\/]+\/(.+?)"?\s*$/

  def run
    puts "🚀 Starting rollback to local paths..."

    count = 0
    TARGET_DIRS.each do |dir|
      unless Dir.exist?(dir)
        puts "⚠️  Directory not found: #{dir}"
        next
      end

      Dir.glob("#{dir}/**/*.md").each do |file_path|
        if process_file(file_path)
          count += 1
        end
      end
    end

    puts "✨ Finished! Updated #{count} files."
    puts "💡 Note: Ensure your local /assets/img/ folder contains the corresponding images."
  end

  def process_file(file_path)
    content = File.read(file_path)
    updated = false

    # We only want to look at the Frontmatter (between the first two ---)
    if content =~ /\A(---\s*\n.*?\n---\s*\n)/m
      frontmatter = $1
      rest_of_file = content[frontmatter.length..-1]

      new_frontmatter = frontmatter.gsub(CLOUDINARY_REGEX) do |match|
        # $1 is the captured path (e.g., posts/kacamata-anti-radiasi/kacamata-anti-radiasi-35)
        path = $1

        # Check if it already has an extension, if not, add .webp
        clean_path = path.include?('.') ? path : "#{path}.webp"

        updated = true
        "background: /assets/img/#{clean_path}"
      end

      if updated
        File.write(file_path, new_frontmatter + rest_of_file)
        puts "✅ Reverted: #{File.basename(file_path)}"
        return true
      end
    end
    false
  end
end

RollbackToLocal.new.run
