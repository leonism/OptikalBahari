require 'net/http'
require 'json'
require 'time'
require 'fileutils'

module OptikalBahari
  class ReviewGenerator < Jekyll::Generator
    priority :highest

    # Class-level cache to persist across re-generations in the same process
    @@cached_reviews = nil
    @@last_fetch = nil
    CACHE_DURATION = 3600 # 1 hour cache

    def generate(site)
      worker_url = "https://api.optikalbahari.com"
      cache_dir = File.join(site.source, '.jekyll-cache', 'optikal_bahari')
      cache_file = File.join(cache_dir, 'reviews.json')
      
      reviews = nil

      # 1. Try memory cache first (fastest, for re-generations during 'jekyll serve')
      if @@cached_reviews && @@last_fetch && (Time.now - @@last_fetch < CACHE_DURATION)
        reviews = @@cached_reviews
        Jekyll.logger.info "Reviews Plugin:", "Using in-memory cache."
      end

      # 2. Try file cache if not in memory (for new command runs)
      if !reviews && File.exist?(cache_file) && (Time.now - File.mtime(cache_file) < CACHE_DURATION)
        begin
          reviews = JSON.parse(File.read(cache_file))
          @@cached_reviews = reviews
          @@last_fetch = File.mtime(cache_file)
          Jekyll.logger.info "Reviews Plugin:", "Using file-based cache from .jekyll-cache."
        rescue => e
          Jekyll.logger.warn "Reviews Plugin:", "Failed to read cache file: #{e.message}"
        end
      end

      # 3. Fetch from API if no valid cache exists
      if !reviews
        begin
          Jekyll.logger.info "Reviews Plugin:", "Fetching latest reviews from #{worker_url}..."
          uri = URI(worker_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = true
          http.open_timeout = 5
          http.read_timeout = 10
          
          response = http.get(uri.request_uri)
          reviews = JSON.parse(response.body)

          if reviews.is_a?(Array)
            # Save to file cache
            FileUtils.mkdir_p(cache_dir)
            File.write(cache_file, JSON.dump(reviews))
            
            @@cached_reviews = reviews
            @@last_fetch = Time.now
            Jekyll.logger.info "Reviews Plugin:", "Successfully fetched and cached #{reviews.size} reviews."
          else
            Jekyll.logger.warn "Reviews Plugin:", "Expected an array of reviews, but got: #{reviews.class}"
            # Fallback to expired cache if available
            reviews = load_expired_cache(cache_file)
          end
        rescue => e
          Jekyll.logger.error "Reviews Plugin:", "Fetch Failed: #{e.message}"
          reviews = load_expired_cache(cache_file)
        end
      end

      return unless reviews.is_a?(Array)

      populate_collection(site, reviews)

      # 4. Synchronize pagination per_page from _config.yml if set
      # This allows control from _config.yml as requested
      per_page_config = site.config['reviews_per_page']
      if per_page_config
        site.pages.each do |page|
          if page.data['pagination'] && page.data['pagination']['collection'] == 'reviews'
            page.data['pagination']['per_page'] = per_page_config
            Jekyll.logger.info "Reviews Plugin:", "Set pagination per_page to #{per_page_config} for #{page.name}."
          end
        end
      end
    end

    private

    def load_expired_cache(cache_file)
      if File.exist?(cache_file)
        Jekyll.logger.info "Reviews Plugin:", "Falling back to expired cache file."
        JSON.parse(File.read(cache_file)) rescue nil
      end
    end

    def populate_collection(site, reviews)
      reviews_coll = site.collections['reviews']
      unless reviews_coll
        Jekyll.logger.error "Reviews Plugin:", "Collection 'reviews' not found in _config.yml."
        return
      end

      # Clear existing docs to prevent accumulation on re-generation
      reviews_coll.docs.clear

      reviews.each_with_index do |item, index|
        path = File.join(site.source, "_reviews", "review-#{index}.md")
        doc = Jekyll::Document.new(path, { :site => site, :collection => reviews_coll })

        doc.data['layout'] = nil
        doc.data['title'] = "Review by #{item['name']}"
        doc.data['stars'] = item['stars'].to_i
        doc.data['text'] = item['text']
        
        begin
          doc.data['date'] = Time.parse(item['publishedAtDate'])
        rescue
          doc.data['date'] = item['publishedAtDate']
        end
        
        doc.data['photo'] = item['reviewerPhotoUrl']
        doc.data['images'] = item['reviewImageUrls'] || []
        doc.data['owner_response'] = item['responseFromOwnerText']
        doc.data['review_url'] = item['reviewUrl']

        # Set content for pagination plugins
        doc.instance_variable_set(:@content, item['text'])
        
        reviews_coll.docs << doc
      end

      # Sort reviews by date descending
      reviews_coll.docs.sort! { |a, b| (b.data['date'] || Time.at(0)) <=> (a.data['date'] || Time.at(0)) }
      
      Jekyll.logger.info "Reviews Plugin:", "Collection 'reviews' updated with #{reviews_coll.docs.size} documents."
    end
  end
end
