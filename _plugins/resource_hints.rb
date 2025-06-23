Jekyll::Hooks.register :site, :post_write do |site|
  Dir.glob(File.join(site.dest, '**/*.html')).each do |file|
    content = File.read(file)

    # Extract critical resources
    css_files = content.scan(/href=["']([^"']*\.css)["']/i).flatten
    js_files = content.scan(/src=["']([^"']*\.js)["']/i).flatten

    # Generate preload hints
    preloads = []
    css_files.first(2).each { |css| preloads << "<link rel='preload' href='#{css}' as='style'>" }
    js_files.first(2).each { |js| preloads << "<link rel='preload' href='#{js}' as='script'>" }

    # Inject before closing head tag
    content.gsub!('</head>', "#{preloads.join("\n")}\n</head>")
    File.write(file, content)
  end
end
