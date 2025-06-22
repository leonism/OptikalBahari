# _plugins/compression.rb

require 'brotli'
require 'zlib'
require 'find'
require 'digest'
require 'json'
require 'fileutils'

Jekyll::Hooks.register :site, :post_write do |site|
  # Uncomment to enable only in production:
  # next unless Jekyll.env == "production"

  site_path = site.dest
  compressible_exts = %w[.html .css .js .md .ico .json .xml .svg .txt .jpg .jpeg .png .webp .avif]
  hashable_exts = %w[.css .js .jpg .jpeg .png .webp .avif .svg .ico] # Assets that should be hashed

  total_original = 0
  total_brotli = 0
  total_gzip = 0
  asset_manifest = {}

  puts "\n🔨 Starting asset processing with hashing and compression..."

  # First pass: Hash assets and create manifest
  Find.find(site_path) do |path|
    next if File.directory?(path)
    next unless compressible_exts.include?(File.extname(path))

    relative_path = path.sub(site_path + '/', '')

    # Skip already hashed files
    next if File.basename(path) =~ /-[a-f0-9]{8}\./

    begin
      content = File.binread(path)
      original_size = content.bytesize

      # Generate hash for cacheable assets
      if hashable_exts.include?(File.extname(path))
        file_hash = Digest::MD5.hexdigest(content)[0, 8]
        dir = File.dirname(path)
        basename = File.basename(path, File.extname(path))
        ext = File.extname(path)

        # Create hashed filename
        hashed_filename = "#{basename}-#{file_hash}#{ext}"
        hashed_path = File.join(dir, hashed_filename)
        hashed_relative_path = hashed_path.sub(site_path + '/', '')

        # Copy original to hashed version
        FileUtils.cp(path, hashed_path)

        # Store mapping in manifest
        asset_manifest[relative_path] = {
          'original' => relative_path,
          'hashed' => hashed_relative_path,
          'hash' => file_hash,
          'size' => original_size
        }

        puts "   📝 Hashed: #{relative_path} → #{hashed_relative_path}"

        # Process the hashed file for compression
        process_path = hashed_path
      else
        # For non-hashable files, just compress the original
        process_path = path
      end

      # Compression for both original and hashed files
      content = File.binread(process_path)
      file_size = content.bytesize

      # Brotli compression
      brotli_path = "#{process_path}.br"
      if !File.exist?(brotli_path) || File.mtime(process_path) > File.mtime(brotli_path)
        br_compressed = Brotli.deflate(content, quality: 11)
        File.binwrite(brotli_path, br_compressed)
        br_size = br_compressed.bytesize
      else
        br_size = File.size(brotli_path)
      end

      # Gzip compression
      gzip_path = "#{process_path}.gz"
      if !File.exist?(gzip_path) || File.mtime(process_path) > File.mtime(gzip_path)
        Zlib::GzipWriter.open(gzip_path, Zlib::BEST_COMPRESSION) { |gz| gz.write(content) }
        gz_size = File.size(gzip_path)
      else
        gz_size = File.size(gzip_path)
      end

      total_original += file_size
      total_brotli += br_size
      total_gzip += gz_size

    rescue => e
      warn "⚠️  Processing failed for #{path}: #{e.message}"
    end
  end

  # Write asset manifest
  manifest_path = File.join(site_path, 'assets', 'manifest.json')
  FileUtils.mkdir_p(File.dirname(manifest_path))
  File.write(manifest_path, JSON.pretty_generate(asset_manifest))

  puts "\n📋 Asset manifest created: #{asset_manifest.size} hashed assets"
  puts "   Manifest location: assets/manifest.json"

  # Update HTML files to reference hashed assets
  update_html_references(site_path, asset_manifest)

  puts "\n📊 Compression Summary:"
  puts "   Original size: #{total_original} bytes"
  puts "   Brotli size:   #{total_brotli} bytes (#{((1 - total_brotli.to_f / total_original) * 100).round(2)}% saved)"
  puts "   Gzip size:     #{total_gzip} bytes (#{((1 - total_gzip.to_f / total_original) * 100).round(2)}% saved)"
end

def update_html_references(site_path, manifest)
  html_files = Dir.glob(File.join(site_path, '**', '*.html'))
  updated_files = 0

  html_files.each do |html_file|
    content = File.read(html_file)
    original_content = content.dup

    manifest.each do |original_path, asset_info|
      # Update various reference patterns
      patterns = [
        /href=["']\/?#{Regexp.escape(original_path)}["']/,
        /src=["']\/?#{Regexp.escape(original_path)}["']/,
        /url\(["']?\/?#{Regexp.escape(original_path)}["']?\)/,
        /["']\/?#{Regexp.escape(original_path)}["']/
      ]

      patterns.each do |pattern|
        content.gsub!(pattern) do |match|
          match.gsub(original_path, asset_info['hashed'])
        end
      end
    end

    if content != original_content
      File.write(html_file, content)
      updated_files += 1
    end
  end

  puts "   🔄 Updated #{updated_files} HTML files with hashed asset references"
end
