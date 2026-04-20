require 'json'
require 'fileutils'

module Jekyll
  # --- 1. Data Loader & Standardizer ---
  # Loads individual reviews from _data/reviews folder and standardizes them into site.data['reviews_list']
  Jekyll::Hooks.register :site, :post_read do |site|
    reviews_data = site.data['reviews']
    
    # Get configuration from _config.yml
    excluded_ids = site.config.dig('reviews', 'exclude_review_ids') || []
    excluded_ids = [excluded_ids] if excluded_ids.is_a?(String)
    excluded_ids = excluded_ids.map(&:to_s)
    
    reviews = if reviews_data.is_a?(Hash)
      # The 'reviews' entry in site.data will be a hash if loaded from a directory
      reviews_data.values
    elsif reviews_data.is_a?(Array)
      # Fallback to a single reviews.json if the folder isn't loaded correctly
      reviews_data
    else
      []
    end

    # Filter out excluded reviews
    unless excluded_ids.empty?
      reviews = reviews.reject { |r| excluded_ids.include?(r['reviewId'].to_s) }
    end

    # Sort by date descending and standardize into reviews_list
    site.data['reviews_list'] = reviews.sort_by { |r| 
      r['publishedAtDate'] || r['publishAt'] || r['scrapedAt'] || ""
    }.reverse

    Jekyll.logger.info "Reviews:", "Standardized #{site.data['reviews_list'].length} reviews from data into reviews_list."
  end

  # --- 2. API Generator ---
  # Generates public JSON endpoints from the standardized reviews_list.
  class ReviewApiGenerator < Generator
    safe true
    priority :low

    def generate(site)
      reviews = site.data['reviews_list']
      return unless reviews && reviews.is_a?(Array)

      # A. Output individual reviews (for deep linking or on-demand fetch)
      reviews.each do |review|
        id = review['reviewId']
        next unless id
        site.pages << JsonPage.new(site, site.source, 'api/reviews', "#{id}.json", review)
      end

      # B. Output chunks (e.g., 20 reviews per file)
      chunk_size = 20
      reviews.each_slice(chunk_size).with_index(1) do |chunk, index|
        site.pages << JsonPage.new(site, site.source, 'api/reviews', "chunk-#{index}.json", chunk)
      end

      # C. Output a lightweight index (only ID, name, stars, date for sorting)
      index_data = {
        'totalCount' => reviews.length,
        'overallScore' => reviews[0] ? (reviews[0]['totalScore'] || 5.0) : 5.0,
        'reviews' => reviews.map { |r| 
          {
            'reviewId' => r['reviewId'],
            'name' => r['name'],
            'stars' => r['stars'],
            'publishedAtDate' => r['publishedAtDate'] || r['publishAt'] || r['scrapedAt'],
            'hasPhotos' => (r['reviewImageUrls'] && !r['reviewImageUrls'].empty?)
          }
        }
      }
      site.pages << JsonPage.new(site, site.source, 'api', 'reviews-index.json', index_data)

      # NOTE: reviews.json is now handled by a source file at /api/reviews.json 
      # for maximum reliability and ease of customization.

      Jekyll.logger.info "Review API:", "Registered /api/reviews-index.json and detail chunks as Jekyll Pages."
    end
  end

  # Helper class to create JSON pages dynamically
  class JsonPage < Page
    def initialize(site, base, dir, name, data)
      @site = site
      @base = base
      @dir  = dir
      @name = name

      self.process(name)
      self.data = {
        'layout' => nil,
        'content_type' => 'application/json'
      }
      self.content = data.to_json
    end
  end
end
