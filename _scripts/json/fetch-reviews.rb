#!/usr/bin/env ruby

require 'net/http'
require 'json'
require 'fileutils'
require 'time'
require 'securerandom'

require 'yaml'

# Configuration
API_URL = 'https://api.optikalbahari.com/'
BASE_DIR = File.expand_path('../../', __dir__) # Root
DATA_DIR = File.join(BASE_DIR, '_data')
REVIEWS_FILE = File.join(DATA_DIR, 'reviews.json')
# We'll use individual JSONs in _data/reviews
INDIVIDUAL_REVIEWS_DIR = File.join(DATA_DIR, 'reviews')
TIMESTAMP_FILE = File.join(DATA_DIR, '.reviews_timestamp')
META_FILE = File.join(DATA_DIR, '.reviews_meta.json')

# Default TTL: 24 hours (in seconds)
DEFAULT_TTL = 24 * 60 * 60

def should_force_fetch?
  return true if ENV['FORCE_FETCH'] == 'true'
  return true unless File.exist?(REVIEWS_FILE) && File.exist?(TIMESTAMP_FILE)
  last_fetch_content = File.read(TIMESTAMP_FILE).strip
  return true if last_fetch_content.empty?
  last_fetched_time = last_fetch_content.to_i
  ttl = ENV['REVIEWS_FETCH_TTL'] ? ENV['REVIEWS_FETCH_TTL'].to_i : DEFAULT_TTL
  (Time.now.to_i - last_fetched_time) > ttl
end

def split_reviews(reviews)
  puts "Splitting #{reviews.length} reviews into individual JSONs in #{INDIVIDUAL_REVIEWS_DIR}..."

  # Ensure target directory exists and is ready
  FileUtils.mkdir_p(INDIVIDUAL_REVIEWS_DIR)

  # Clean old reviews to avoid stale data
  FileUtils.rm_rf(Dir.glob("#{INDIVIDUAL_REVIEWS_DIR}/*.json"))

  reviews.each do |review|
    # Generate unique filename based on timestamp
    publish_date_str = review['publishedAtDate'] || review['publishAt'] || review['scrapedAt']

    begin
      if publish_date_str
        time = Time.parse(publish_date_str)
        timestamp_str = time.strftime('%Y-%m-%d-%H%M%S')
      else
        timestamp_str = Time.now.strftime('%Y-%m-%d-%H%M%S')
      end
    rescue ArgumentError, TypeError
      timestamp_str = publish_date_str.to_s.gsub(/[^0-9]/, '')[0..13] rescue Time.now.to_i.to_s
    end

    review_id = review['reviewId'] || review['cid'] || SecureRandom.hex(4)
    filename = "#{timestamp_str}-#{review_id}.json"
    filepath = File.join(INDIVIDUAL_REVIEWS_DIR, filename)

    File.write(filepath, JSON.pretty_generate(review))
  end

  puts "Finished splitting reviews into #{INDIVIDUAL_REVIEWS_DIR}"
end

def process_data(body, raw_size)
  begin
    data = JSON.parse(body)
  rescue JSON::ParserError
    puts "Error: Failed to parse JSON response."
    exit 1
  end

  unless data.is_a?(Array)
    # Handle cases where the response might be wrapped
    if data.is_a?(Hash) && data.key?('reviews') && data['reviews'].is_a?(Array)
      data = data['reviews']
    else
      puts "Error: Invalid data format. Expected an array of reviews."
      exit 1
    end
  end

  # Ensure directories exist
  FileUtils.mkdir_p(DATA_DIR)
  # Save the full reviews file
  File.write(REVIEWS_FILE, JSON.pretty_generate(data))
  File.write(TIMESTAMP_FILE, Time.now.to_i)
  # Save meta for change detection
  File.write(META_FILE, JSON.generate({
    raw_size: raw_size,
    last_fetched: Time.now.iso8601,
    count: data.length
  }))

  puts "Successfully fetched #{data.length} reviews and saved to #{REVIEWS_FILE}"

  # Split into individual records
  split_reviews(data)
end

def run
  uri = URI(API_URL)
  puts "Checking for changes at #{API_URL}..."

  begin
    # 1. Detect Changes using Headers only (uncompressed size)
    Net::HTTP.start(uri.host, uri.port, use_ssl: (uri.scheme == 'https')) do |http|
      # We ask for identity encoding to ensure we get a Content-Length header
      # instead of Transfer-Encoding: chunked (which doesn't have size)
      request = Net::HTTP::Get.new(uri)
      request['Accept-Encoding'] = 'identity'

      http.request(request) do |response|
        unless response.is_a?(Net::HTTPSuccess)
          puts "Error: Failed to connect. Status: #{response.code}"
          exit 1
        end

        remote_raw_size = response['content-length'].to_i
        local_meta = File.exist?(META_FILE) ? JSON.parse(File.read(META_FILE)) : {}

        # Size-based Change Detection
        if !local_meta.empty? && local_meta['raw_size'] == remote_raw_size && remote_raw_size > 0 && ENV['FORCE_FETCH'] != 'true'
          # If size matches, it's NOT fresh. We only proceed if TTL expired.
          if should_force_fetch?
            puts "Size matches local record, but TTL expired. Proceeding anyway."
          else
            puts "No changes detected (Remote raw size: #{remote_raw_size} bytes). Skipping download."
            return
          end
        else
          puts "Changes detected or initial fetch. Remote raw size: #{remote_raw_size} bytes."
        end

        # 2. Proceed to Download (this time we allow gzip for performance/standard behavior)
        puts "Downloading reviews..."
        download_response = Net::HTTP.get_response(uri)

        if download_response.is_a?(Net::HTTPSuccess)
          process_data(download_response.body, remote_raw_size)
        else
          puts "Error: Failed to download reviews during second pass."
          exit 1
        end
      end
    end
  rescue => e
    puts "Error: #{e.message}"
    exit 1
  end
end

# Execution
run
