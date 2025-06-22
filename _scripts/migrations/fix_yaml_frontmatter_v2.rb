#!/usr/bin/env ruby

require 'fileutils'

def fix_yaml_frontmatter(file_path)
  content = File.read(file_path)
  lines = content.split("\n")

  # Find YAML frontmatter boundaries
  start_idx = lines.find_index { |line| line.strip == '---' }
  return false unless start_idx == 0

  end_idx = lines[1..-1].find_index { |line| line.strip == '---' }
  return false unless end_idx

  end_idx += 1 # Adjust for the slice

  # Extract frontmatter lines (excluding delimiters)
  frontmatter_lines = lines[1...end_idx]
  fixed_lines = []
  i = 0

  while i < frontmatter_lines.length
    line = frontmatter_lines[i]

    # Check if this is a key-value pair
    if line.match(/^(\w+):\s*(.*)$/)
      key = $1
      value = $2.strip

      # Case 1: Key with empty value, check next line
      if value.empty? && i + 1 < frontmatter_lines.length
        next_line = frontmatter_lines[i + 1]

        # If next line doesn't start with a key and isn't empty, it's the value
        if !next_line.match(/^\w+:/) && next_line.strip != ''
          # Collect all continuation lines
          full_value = next_line.strip
          j = i + 2

          while j < frontmatter_lines.length &&
                !frontmatter_lines[j].match(/^\w+:/) &&
                frontmatter_lines[j].strip != ''
            full_value += " " + frontmatter_lines[j].strip
            j += 1
          end

          # Add quotes to ensure proper YAML
          fixed_lines << "#{key}: \"#{full_value}\""
          i = j # Skip the continuation lines
        else
          # Regular single-line value or empty value
          fixed_lines << line
          i += 1
        end
      # Case 2: Key with value, but check if it continues on next line
      elsif !value.empty? && i + 1 < frontmatter_lines.length
        next_line = frontmatter_lines[i + 1]

        # If next line doesn't start with a key and isn't empty, it's a continuation
        if !next_line.match(/^\w+:/) && next_line.strip != ''
          # Collect all continuation lines
          full_value = value
          j = i + 1

          while j < frontmatter_lines.length &&
                !frontmatter_lines[j].match(/^\w+:/) &&
                frontmatter_lines[j].strip != ''
            full_value += " " + frontmatter_lines[j].strip
            j += 1
          end

          # Clean up the value and ensure it's properly quoted
          full_value = full_value.strip

          # Remove existing quotes if present
          if (full_value.start_with?('"') && full_value.end_with?('"')) ||
             (full_value.start_with?("'") && full_value.end_with?("'"))
            full_value = full_value[1...-1]
          end

          # Add quotes to ensure proper YAML
          fixed_lines << "#{key}: \"#{full_value}\""
          i = j # Skip the continuation lines
        else
          # Regular single-line value
          fixed_lines << line
          i += 1
        end
      else
        # Regular single-line value or last line
        fixed_lines << line
        i += 1
      end
    else
      # Not a key-value pair, keep as is
      fixed_lines << line
      i += 1
    end
  end

  # Reconstruct the file
  new_content = ["---"] + fixed_lines + ["---"] + lines[(end_idx + 1)..-1]

  # Write back to file
  File.write(file_path, new_content.join("\n"))
  true
end

def process_posts_directory(directory)
  fixed_count = 0
  error_count = 0

  Dir.glob(File.join(directory, "*.html")).each do |file_path|
    begin
      if fix_yaml_frontmatter(file_path)
        puts "Fixed: #{File.basename(file_path)}"
        fixed_count += 1
      end
    rescue => e
      puts "Error processing #{File.basename(file_path)}: #{e.message}"
      error_count += 1
    end
  end

  puts "\n=== YAML Frontmatter Fix Summary ==="
  puts "Files fixed: #{fixed_count}"
  puts "Errors: #{error_count}"
end

# Process the _posts directory
posts_dir = "/Volumes/DATA/Jekyll/OptikalBahari/_posts"
process_posts_directory(posts_dir)
