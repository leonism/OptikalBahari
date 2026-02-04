require 'fileutils'
require 'pathname'

# Setup Root Path
SCRIPT_PATH = Pathname.new(__FILE__).realpath
PROJECT_ROOT = SCRIPT_PATH.dirname.parent.parent
TARGET_DIRS = ['_posts', '_pages']

def heal_malformed_include(raw_content)
  # Extract attributes
  attrs = {}
  raw_content.scan(/([\w-]+)=['"]([^'"]*)['"]/).each { |k, v| attrs[k] = v }

  src = attrs['src'] || ""

  # THE FIX: If the src is literally 'post.background', it cannot be used
  # inside an include like a string. We need to either:
  # 1. Convert it to a Liquid variable pass: src=post.background (no quotes)
  # 2. Or, if it's meant to be a path, fix the string.

  is_variable = src.match?(/^(post|page|site)\./)

  final_src = src.gsub(/\{\{|\}\}|['"]|\|\s*relative_url/, '').strip
  final_src = final_src.gsub(/^\//, '') # Remove leading slash

  alt = (attrs['alt'] || "").strip
  klass = (attrs['class'] || "card-img-top").strip

  # If it was a variable like post.background, we pass it WITHOUT quotes
  if is_variable
    "{% include cloudinary/card_image.html src=#{final_src} alt='#{alt}' ratio='16x9' class='#{klass}' %}"
  else
    "{% include cloudinary/card_image.html src='#{final_src}' alt='#{alt}' ratio='16x9' class='#{klass}' %}"
  end
end

puts "🚀 Healing malformed tags in #{PROJECT_ROOT}..."

TARGET_DIRS.each do |dir_name|
  dir_path = File.join(PROJECT_ROOT, dir_name)
  next unless Dir.exist?(dir_path)

  Dir.glob("#{dir_path}/**/*.{md,markdown,html}").each do |file_path|
    content = File.read(file_path)

    # Target existing broken includes
    inc_regex = /\{%\s*include\s+cloudinary\/card_image\.html\s+([^%]+?)\s*%\}/m

    new_content = content.gsub(inc_regex) do |match|
      heal_malformed_include($1)
    end

    if content != new_content
      File.write(file_path, new_content)
      puts "✅ Healed variable usage in: #{file_path.gsub(PROJECT_ROOT.to_s, '')}"
    end
  end
end
