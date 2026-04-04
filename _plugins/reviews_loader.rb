Jekyll::Hooks.register :site, :post_read do |site|
  # Load individual reviews from _data/reviews folder
  reviews_folder = site.data['reviews']
  
  if reviews_folder.is_a?(Hash)
    # The 'reviews' entry in site.data will be a hash if loaded from a directory
    # where keys are filenames and values are the JSON content.
    # We want a flat array sorted by date descending.
    site.data['reviews_list'] = reviews_folder.values.sort_by { |r| 
      r['publishedAtDate'] || r['publishAt'] || r['scrapedAt'] || ""
    }.reverse
  elsif site.data['reviews'].is_a?(Array)
    # Fallback to the main reviews.json if the folder isn't loaded correctly
    site.data['reviews_list'] = site.data['reviews'].sort_by { |r| 
      r['publishedAtDate'] || r['publishAt'] || r['scrapedAt'] || ""
    }.reverse
  else
    site.data['reviews_list'] = []
  end

  Jekyll.logger.info "Reviews:", "Standardized #{site.data['reviews_list'].length} reviews into site.data.reviews_list"
end
