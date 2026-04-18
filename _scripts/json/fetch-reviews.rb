#!/usr/bin/env ruby

require 'net/http'
require 'json'
require 'fileutils'
require 'time'
require 'securerandom'
require 'yaml'

# Configuration
API_URL = 'https://api.optikalbahari.com/'
BASE_DIR = File.expand_path('../../', __dir__)
DATA_DIR = File.join(BASE_DIR, '_data')
REVIEWS_FILE = File.join(DATA_DIR, 'reviews.json')
INDIVIDUAL_REVIEWS_DIR = File.join(DATA_DIR, 'reviews')
TIMESTAMP_FILE = File.join(DATA_DIR, '.reviews_timestamp')
META_FILE = File.join(DATA_DIR, '.reviews_meta.json')

# Default TTL: 24 hours
DEFAULT_TTL = 24 * 60 * 60

# ----------------------------------------
# Cache Control
# ----------------------------------------
def should_force_fetch?
  return true if ENV['FORCE_FETCH'] == 'true'
  return true unless File.exist?(REVIEWS_FILE) && File.exist?(TIMESTAMP_FILE)

  last_fetch_content = File.read(TIMESTAMP_FILE).strip
  return true if last_fetch_content.empty?

  last_fetched_time = last_fetch_content.to_i
  ttl = ENV['REVIEWS_FETCH_TTL'] ? ENV['REVIEWS_FETCH_TTL'].to_i : DEFAULT_TTL

  (Time.now.to_i - last_fetched_time) > ttl
end

# ----------------------------------------
# Filename Builder
# ----------------------------------------
def build_review_filename(review, review_id)
  publish_date_str = review['publishedAtDate'] || review['publishAt'] || review['scrapedAt']

  begin
    if publish_date_str
      time = Time.parse(publish_date_str)
      timestamp_str = time.strftime('%Y-%m-%d-%H%M%S')
    else
      timestamp_str = Time.now.strftime('%Y-%m-%d-%H%M%S')
    end
  rescue
    timestamp_str = Time.now.to_i.to_s
  end

  "#{timestamp_str}-#{review_id}.json"
end

# ----------------------------------------
# Load Existing Reviews Index
# ----------------------------------------
def load_existing_reviews_index
  index = {}

  return index unless Dir.exist?(INDIVIDUAL_REVIEWS_DIR)

  Dir.glob("#{INDIVIDUAL_REVIEWS_DIR}/*.json").each do |file|
    begin
      data = JSON.parse(File.read(file))
      id = data['reviewId'] || data['cid']

      if id
        index[id] = {
          path: file,
          data: data
        }
      end
    rescue
      # Skip corrupted files
    end
  end

  index
end

# ----------------------------------------
# Diff-Based Sync
# ----------------------------------------
def sync_reviews(reviews)
  puts "Running diff-based sync..."

  FileUtils.mkdir_p(INDIVIDUAL_REVIEWS_DIR)

  existing_index = load_existing_reviews_index
  incoming_index = {}

  created = 0
  updated = 0
  unchanged = 0

  reviews.each do |review|
    id = review['reviewId'] || review['cid'] || SecureRandom.hex(4)
    incoming_index[id] = review

    existing = existing_index[id]

    if existing
      if JSON.dump(existing[:data]) == JSON.dump(review)
        unchanged += 1
        next
      else
        File.write(existing[:path], JSON.pretty_generate(review))
        updated += 1
      end
    else
      filename = build_review_filename(review, id)
      filepath = File.join(INDIVIDUAL_REVIEWS_DIR, filename)

      File.write(filepath, JSON.pretty_generate(review))
      created += 1
    end
  end

  # Handle deletions
  deleted = 0
  existing_index.each do |id, info|
    unless incoming_index.key?(id)
      File.delete(info[:path])
      deleted += 1
    end
  end

  puts "Sync complete:"
  puts "  Created: #{created}"
  puts "  Updated: #{updated}"
  puts "  Deleted: #{deleted}"
  puts "  Unchanged: #{unchanged}"
end

# ----------------------------------------
# Process Data
# ----------------------------------------
def process_data(body, raw_size)
  begin
    data = JSON.parse(body)
  rescue JSON::ParserError
    puts "Error: Failed to parse JSON response."
    exit 1
  end

  unless data.is_a?(Array)
    if data.is_a?(Hash) && data.key?('reviews') && data['reviews'].is_a?(Array)
      data = data['reviews']
    else
      puts "Error: Invalid data format. Expected an array of reviews."
      exit 1
    end
  end

  FileUtils.mkdir_p(DATA_DIR)

  # Save full dataset
  File.write(REVIEWS_FILE, JSON.pretty_generate(data))
  File.write(TIMESTAMP_FILE, Time.now.to_i)

  File.write(META_FILE, JSON.generate({
    raw_size: raw_size,
    last_fetched: Time.now.iso8601,
    count: data.length
  }))

  puts "Successfully fetched #{data.length} reviews."

  # Run diff-based sync
  sync_reviews(data)
end

# ----------------------------------------
# Main Runner
# ----------------------------------------
def run
  uri = URI(API_URL)
  puts "Checking for changes at #{API_URL}..."

  begin
    Net::HTTP.start(uri.host, uri.port, use_ssl: (uri.scheme == 'https')) do |http|
      request = Net::HTTP::Get.new(uri)
      request['Accept-Encoding'] = 'identity'

      http.request(request) do |response|
        unless response.is_a?(Net::HTTPSuccess)
          puts "Error: Failed to connect. Status: #{response.code}"
          exit 1
        end

        remote_raw_size = response['content-length'].to_i
        local_meta = File.exist?(META_FILE) ? JSON.parse(File.read(META_FILE)) : {}

        if !local_meta.empty? &&
           local_meta['raw_size'] == remote_raw_size &&
           remote_raw_size > 0 &&
           ENV['FORCE_FETCH'] != 'true'

          if should_force_fetch?
            puts "Size matches, but TTL expired. Proceeding..."
          else
            puts "No changes detected (#{remote_raw_size} bytes). Skipping download."
            return
          end
        else
          puts "Changes detected or initial fetch (#{remote_raw_size} bytes)."
        end

        puts "Downloading reviews..."
        download_response = Net::HTTP.get_response(uri)

        if download_response.is_a?(Net::HTTPSuccess)
          process_data(download_response.body, remote_raw_size)
        else
          puts "Error: Failed to download reviews."
          exit 1
        end
      end
    end
  rescue => e
    puts "Error: #{e.message}"
    exit 1
  end
end

# ----------------------------------------
# Execute
# ----------------------------------------
run
