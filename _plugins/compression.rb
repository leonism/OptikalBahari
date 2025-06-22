# _plugins/compression.rb

require 'brotli'
require 'zlib'
require 'find'

Jekyll::Hooks.register :site, :post_write do |site|
  # Uncomment to enable only in production:
  # next unless Jekyll.env == "production"

  site_path = site.dest
  compressible_exts = %w[.html .css .js .md .ico .json .xml .svg .txt .jpg .jpeg .png .webp .avif]

  total_original = 0
  total_brotli = 0
  total_gzip = 0

  Find.find(site_path) do |path|
    next if File.directory?(path)
    next unless compressible_exts.include?(File.extname(path))

    begin
      content = File.binread(path)
      original_size = content.bytesize

      # Brotli (max compression)
      brotli_path = "#{path}.br"
      if !File.exist?(brotli_path) || File.mtime(path) > File.mtime(brotli_path)
        br_compressed = Brotli.deflate(content, quality: 11)
        File.binwrite(brotli_path, br_compressed)
        br_size = br_compressed.bytesize
      else
        br_size = File.size(brotli_path)
      end

      # Gzip (max compression)
      gzip_path = "#{path}.gz"
      if !File.exist?(gzip_path) || File.mtime(path) > File.mtime(gzip_path)
        Zlib::GzipWriter.open(gzip_path, Zlib::BEST_COMPRESSION) { |gz| gz.write(content) }
        gz_size = File.size(gzip_path)
      else
        gz_size = File.size(gzip_path)
      end

      total_original += original_size
      total_brotli += br_size
      total_gzip += gz_size

    rescue => e
      warn "⚠️ Compression failed for #{path}: #{e.message}"
    end
  end

  puts "\n📊 Compression Summary:"
  puts "   Original size: #{total_original} bytes"
  puts "   Brotli size:   #{total_brotli} bytes (#{((1 - total_brotli.to_f / total_original) * 100).round(2)}% saved)"
  puts "   Gzip size:     #{total_gzip} bytes (#{((1 - total_gzip.to_f / total_original) * 100).round(2)}% saved)"
end
