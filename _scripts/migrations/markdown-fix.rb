#!/usr/bin/env ruby

require 'yaml'

def process_file(filepath)
  content = File.read(filepath, encoding: 'utf-8')

  # Match the YAML frontmatter block
  match = content.match(/\A(---\r?\n)(.*?\r?\n)(---\r?\n)/m)
  return unless match

  frontmatter_text = match[2]
  begin
    data = YAML.load(frontmatter_text)
  rescue StandardError => e
    puts "Skipping #{filepath} due to YAML parsing error: #{e.message}"
    return
  end

  return unless data.is_a?(Hash)

  subtitle = data['subtitle']
  description = data['description']

  # Skip if description is empty
  return if description.nil? || description.to_s.strip.empty?

  # Skip if subtitle and description are identical
  if subtitle.to_s.strip == description.to_s.strip
    return
  end

  puts "Updating: #{filepath}"

  desc_text = description.to_s.strip

  # Ensure we safely escape single quotes so the YAML remains valid
  escaped_desc = desc_text.gsub("'", "''")

  # The user requested wrapping using quotes (` was likely a typo for ' single quote based on their manual edits).
  # We format the blocks as:
  # key:
  #   '<value>'
  format_val_subtitle = "subtitle:\n  '#{escaped_desc}'"
  format_val_description = "description:\n  '#{escaped_desc}'"

  new_frontmatter = frontmatter_text.dup

  # Replace existing subtitle block
  if new_frontmatter.match?(/^subtitle:/)
    new_frontmatter.sub!(/^subtitle:.*?(?=\n^[a-zA-Z0-9_-]+:|\z)/m, format_val_subtitle)
  else
    # Insert subtitle before description if missing
    new_frontmatter.sub!(/^description:/, "#{format_val_subtitle}\ndescription:")
  end

  # Replace existing description block (to ensure it matches the same format)
  if new_frontmatter.match?(/^description:/)
    new_frontmatter.sub!(/^description:.*?(?=\n^[a-zA-Z0-9_-]+:|\z)/m, format_val_description)
  end

  # Replace old frontmatter with new frontmatter
  new_content = content.sub(/\A(---\r?\n).*?\r?\n(---\r?\n)/m, "\\1#{new_frontmatter}\\2")
  File.write(filepath, new_content, encoding: 'utf-8')
end

base_dir = File.expand_path('../../', __dir__)
['_posts', '_pages'].each do |dir|
  path = File.join(base_dir, dir)
  next unless Dir.exist?(path)

  Dir.glob(File.join(path, '**/*.md')).each do |filepath|
    process_file(filepath)
  end
end

puts "Migration complete."
