Jekyll::Hooks.register :site, :post_write do |site|
  # Only run if JEKYLL_ENV is set to production
  if ENV['JEKYLL_ENV'] == 'production'
    puts "  [Post-Build Hook] Detected production environment (hook disabled, handled by post-build.js)"

    # Path to the consolidation script
    # script_path = "_scripts/post-built/consolidate-assets.js"
    # ...
  end
end
