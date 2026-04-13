# frozen_string_literal: true

# LLM Mirror Generator
# Generates plain Markdown (.md) mirrors of every post and page
# for consumption by LLMs and RAG pipelines.
#
# Uses :post_write hook to write after Jekyll finalizes _site/,
# ensuring files are not cleaned up during the build process.

module Jekyll
  module LlmMirror
    SKIP_URLS = %w[
      /404.html
      /sitemap.xml
      /feed.xml
      /robots.txt
      /llms.txt
      /llms-full.txt
    ].freeze

    SKIP_EXTENSIONS = %w[.xml .json .txt .css .js].freeze

    class << self
      def should_mirror_post?(doc)
        return false if doc.data["published"] == false
        return false if doc.data["draft"] == true
        true
      end

      def should_mirror_page?(page)
        return false if page.data["layout"].nil?
        return false if page.data["title"].nil? || page.data["title"].to_s.empty?
        return false if SKIP_URLS.include?(page.url)
        return false if SKIP_EXTENSIONS.include?(File.extname(page.url))
        true
      end

      def write_mirror(doc, site)
        url = doc.url.to_s
        dest_dir = File.join(site.dest, url)
        dest_path = File.join(dest_dir, "index.md")

        content = build_mirror_content(doc, site)

        begin
          FileUtils.mkdir_p(dest_dir)
          File.write(dest_path, content)
        rescue StandardError => e
          Jekyll.logger.warn "LLM Mirror:", "Failed to write #{dest_path}: #{e.message}"
        end
      end

      def write_mirror_page(page, site)
        url = page.url.to_s
        url = url.chomp("index.html")
        url = "/#{url}" unless url.start_with?("/")
        url = "#{url}/" unless url.end_with?("/")

        dest_dir = File.join(site.dest, url)
        dest_path = File.join(dest_dir, "index.md")

        content = build_mirror_content(page, site)

        begin
          FileUtils.mkdir_p(dest_dir)
          File.write(dest_path, content)
        rescue StandardError => e
          Jekyll.logger.warn "LLM Mirror:", "Failed to write #{dest_path}: #{e.message}"
        end
      end

      def build_mirror_content(doc, site)
        frontmatter = build_frontmatter(doc, site)
        body = extract_body(doc)

        "#{frontmatter}\n\n#{body}\n"
      end

      def build_frontmatter(doc, site)
        fm = {}
        fm["title"] = doc.data["title"] if doc.data["title"]
        fm["description"] = doc.data["description"] if doc.data["description"]
        fm["date"] = doc.data["date"].to_s if doc.data["date"]
        fm["author"] = doc.data["author"] if doc.data["author"]
        fm["categories"] = doc.data["categories"] if doc.data["categories"]&.any?
        fm["tags"] = doc.data["tags"] if doc.data["tags"]&.any?
        fm["source_url"] = "#{site.config['url']}#{doc.url}"

        lines = ["---"]
        fm.each do |key, value|
          if value.is_a?(Array)
            lines << "#{key}:"
            value.each { |v| lines << "  - #{v}" }
          else
            lines << "#{key}: \"#{value}\""
          end
        end
        lines << "---"
        lines.join("\n")
      end

      def extract_body(doc)
        raw = doc.content.to_s
        html_to_markdown(raw)
      end

      def html_to_markdown(html)
        require 'nokogiri'
        doc = Nokogiri::HTML.fragment(html)
        
        # Remove script and style completely
        doc.css('script, style').remove
        
        text = process_node(doc)
        text.gsub(/\n{3,}/, "\n\n").strip
      end

      def process_node(node)
        return node.text if node.text?
        
        text = ""
        node.children.each do |child|
          text += process_node(child)
        end
        
        case node.name.downcase
        when 'h1' then "\n# #{text.strip}\n\n"
        when 'h2' then "\n## #{text.strip}\n\n"
        when 'h3' then "\n### #{text.strip}\n\n"
        when 'h4' then "\n#### #{text.strip}\n\n"
        when 'h5' then "\n##### #{text.strip}\n\n"
        when 'h6' then "\n###### #{text.strip}\n\n"
        when 'strong', 'b' then "**#{text.strip}**"
        when 'em', 'i' then "*#{text.strip}*"
        when 'blockquote' then "\n> #{text.strip.gsub("\n", "\n> ")}\n\n"
        when 'code'
          if node.parent&.name&.downcase == 'pre'
            text
          else
            "`#{text.strip}`"
          end
        when 'pre' then "\n```\n#{text.strip}\n```\n\n"
        when 'hr' then "\n---\n\n"
        when 'a' 
          href = node['href']
          href ? "[#{text.strip}](#{href})" : text
        when 'img'
          src = node['src'] || node['data-src'] || ''
          alt = node['alt'] || ''
          title = node['title'] ? " \"#{node['title']}\"" : ""
          src.empty? ? "" : "![#{alt}](#{src}#{title})"
        when 'li'
          if node.parent&.name&.downcase == 'ol'
            "1. #{text.strip}\n"
          else
            "- #{text.strip}\n"
          end
        when 'ul', 'ol'
          "\n#{text}\n"
        when 'p', 'div', 'section', 'article', 'main'
          "\n#{text.strip}\n\n"
        when 'br'
          "  \n"
        when 'table'
          "\n#{text.strip}\n\n"
        when 'thead'
          first_tr = node.at_css('tr')
          col_count = first_tr ? first_tr.css('th, td').count : 2
          separator = "|" + ("---|"*col_count) + "\n"
          "#{text}#{separator}"
        when 'tr'
          "|#{text}\n"
        when 'th', 'td'
          " #{text.strip} |"
        when 'del', 's', 'strike'
          "~~#{text.strip}~~"
        else
          text
        end
      end
    end
  end
end

# Hook: After ALL posts are written to _site
Jekyll::Hooks.register :posts, :post_write do |post|
  LlmMirror = Jekyll::LlmMirror unless defined?(LlmMirror)
  if Jekyll::LlmMirror.should_mirror_post?(post)
    Jekyll::LlmMirror.write_mirror(post, post.site)
  end
end

# Hook: After EACH page is written to _site
Jekyll::Hooks.register :pages, :post_write do |page|
  if Jekyll::LlmMirror.should_mirror_page?(page)
    Jekyll::LlmMirror.write_mirror_page(page, page.site)
  end
end

# Log summary after site is written
Jekyll::Hooks.register :site, :post_write do |site|
  post_count = site.posts.docs.count { |d| Jekyll::LlmMirror.should_mirror_post?(d) }
  page_count = site.pages.count { |p| Jekyll::LlmMirror.should_mirror_page?(p) }
  total = post_count + page_count
  Jekyll.logger.info "LLM Mirror:", "Generated #{total} Markdown mirrors (#{post_count} posts, #{page_count} pages)"
end
