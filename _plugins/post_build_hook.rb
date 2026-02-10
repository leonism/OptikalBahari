Jekyll::Hooks.register :site, :post_write do |site|
  # Only run if JEKYLL_ENV is set to production
  if ENV['JEKYLL_ENV'] == 'production'
    puts "  [Post-Build Hook] Detected production environment. Running asset consolidation..."
    
    # Path to the consolidation script
    script_path = "_scripts/post-built/consolidate-assets.js"
    
    if File.exist?(script_path)
      # Run the node script
      # We use system to execute the command. 
      # The output will appear in the Jekyll serve console.
      success = system("node #{script_path}")
      
      if success
        puts "  [Post-Build Hook] Asset consolidation completed successfully."
      else
        puts "  [Post-Build Hook] Error: Asset consolidation script failed."
      end
    else
      puts "  [Post-Build Hook] Warning: #{script_path} not found."
    end
  end
end
