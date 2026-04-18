Jekyll::Hooks.register :site, :post_read do |site|
  # Load individual reviews from _data/reviews folder
  reviews_data = site.data['reviews']
  
  # Get excluded review IDs from _config.yml
  # Configuration format:
  # reviews:
  #   exclude_review_ids: ["ID1", "ID2"]
  excluded_ids = site.config.dig('reviews', 'exclude_review_ids') || []
  excluded_ids = [excluded_ids] if excluded_ids.is_a?(String)
  excluded_ids = excluded_ids.map(&:to_s)
  
  reviews = if reviews_data.is_a?(Hash)
    # The 'reviews' entry in site.data will be a hash if loaded from a directory
    # where keys are filenames and values are the JSON content.
    reviews_data.values
  elsif reviews_data.is_a?(Array)
    # Fallback to the main reviews.json if the folder isn't loaded correctly
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

  Jekyll.logger.info "Reviews:", "Standardized #{site.data['reviews_list'].length} reviews into site.data.reviews_list"
end
