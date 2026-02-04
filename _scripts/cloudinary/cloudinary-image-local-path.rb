require 'fileutils'

# Directories to scan for <img> tags
TARGET_DIRS = ['_posts', '_pages']

def migrate_img_tags(content)
  # Matches <img ... /> tags regardless of line breaks
  img_regex = /<img\s+([^>]+?)\/?>/m

  content.gsub(img_regex) do |_match|
    attributes = $1

    # 1. Extract the Source path
    # Matches both: {{ '/path' | relative_url }} AND plain '/path'
    src_match = attributes.match(/src=["'](?:\{\{\s*['"]?([^'"]+?)['"]?\s*\|\s*relative_url\s*\}\}|([^"']+))["']/)
    final_src = src_match ? (src_match[1] || src_match[2]) : ""

    # 2. Extract Alt text (defaults to empty string)
    alt_match = attributes.match(/alt=["']([^"']*)["']/)
    final_alt = alt_match ? alt_match[1] : ""

    # 3. Extract Class (defaults to card-img-top)
    class_match = attributes.match(/class=["']([^"']*)["']/)
    final_class = class_match ? class_match[1] : "card-img-top"

    # 4. Clean the path: remove leading slash to match your Cloudinary folder structure
    final_src = final_src.gsub(/^\//, '')

    # Build the Liquid component output
    # IMPORTANT: The filename 'cloudinary/card_image.html' MUST be on the same
    # line as the opening '{% include' to prevent Jekyll IOErrors.
    <<~LIQUID.strip
      {% include cloudinary/card_image.html src="#{final_src}"
         alt="#{final_alt}"
         ratio="16x9"
         class="#{final_class}" %}
    LIQUID
  end
end

puts "🚀 Starting HTML to Cloudinary Component migration..."

TARGET_DIRS.each do |dir|
  Dir.glob("#{dir}/**/*.{md,markdown,html}").each do |file_path|
    unless File.exist?(file_path)
      puts "⏭️ Skipping missing file: #{file_path}"
      next
    end

    original_content = File.read(file_path)
    new_content = migrate_img_tags(original_content)

    if original_content != new_content
      File.write(file_path, new_content)
      puts "✅ Converted tags in: #{file_path}"
    end
  end
end

puts "🎉 Done! All <img> tags have been replaced with the Super Component."
