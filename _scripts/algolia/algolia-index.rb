#!/usr/bin/env ruby
# frozen_string_literal: true

# Algolia Indexing Script for Optikal Bahari
# This script indexes Jekyll content to Algolia
# Compatible with Cloudflare Pages and other platforms that don't support bash scripts

require 'dotenv/load'
require 'colorize'

# Load environment variables
Dotenv.load

# Configuration
REQUIRED_ENV_VARS = %w[
  ALGOLIA_APPLICATION_ID
  ALGOLIA_ADMIN_API_KEY
  ALGOLIA_INDEX_NAME
].freeze

def print_header
  puts "\n#{'=' * 60}".colorize(:cyan)
  puts '  Algolia Search Indexing for Optikal Bahari'.colorize(:cyan).bold
  puts "#{'=' * 60}\n\n".colorize(:cyan)
end

def print_step(step, message)
  puts "#{step.to_s.rjust(2, '0')}. #{message}".colorize(:yellow)
end

def print_success(message)
  puts "✅  #{message}".colorize(:green)
end

def print_error(message)
  puts "❌  #{message}".colorize(:red)
end

def print_info(message)
  puts "   #{message}".colorize(:light_black)
end

def check_environment_variables
  print_step(1, 'Checking environment variables...')

  missing_vars = REQUIRED_ENV_VARS.select { |var| ENV[var].nil? || ENV[var].empty? }

  if missing_vars.any?
    print_error('Missing required environment variables:')
    missing_vars.each { |var| puts "   - #{var}".colorize(:red) }
    print_info('Please ensure these variables are set in your .env file')
    exit 1
  end

  print_success('All required environment variables found')
  print_info("Application ID: #{ENV['ALGOLIA_APPLICATION_ID']}")
  print_info("Index Name: #{ENV['ALGOLIA_INDEX_NAME']}")
  puts
end

def build_jekyll_site
  print_step(2, 'Building Jekyll site...')

  # Set Jekyll environment to production
  ENV['JEKYLL_ENV'] = 'production'

  # Run Jekyll build
  success = system('bundle exec jekyll build')

  unless success
    print_error('Jekyll build failed!')
    exit 1
  end

  print_success('Jekyll build complete')
  puts
end

def index_to_algolia
  print_step(3, 'Indexing content to Algolia...')
  print_info('This may take a few minutes depending on content size...')
  puts

  # Set environment variables for jekyll-algolia if not already set
  # Prioritize ALGOLIA_API_KEY, then fallback to ALGOLIA_ADMIN_API_KEY
  algolia_key = ENV['ALGOLIA_API_KEY'] || ENV['ALGOLIA_ADMIN_API_KEY']

  if algolia_key.nil? || algolia_key.empty?
    print_error('No Algolia API key found (tried ALGOLIA_API_KEY and ALGOLIA_ADMIN_API_KEY)')
    exit 1
  end

  ENV['ALGOLIA_API_KEY'] = algolia_key

  # Run Algolia indexing
  success = system('bundle exec jekyll algolia')

  unless success
    print_error('Algolia indexing failed!')
    print_info('Check the error messages above for details')
    exit 1
  end

  print_success('Algolia indexing complete!')
  puts
end

def print_completion
  puts "\n#{'=' * 60}".colorize(:green)
  puts '  Indexing Complete!'.colorize(:green).bold
  puts "#{'=' * 60}".colorize(:green)
  puts
  print_success("Your content is now searchable in: #{ENV['ALGOLIA_INDEX_NAME']}")
  puts
  print_info('View your index at:')
  puts "   https://www.algolia.com/apps/#{ENV['ALGOLIA_APPLICATION_ID']}/explorer".colorize(:cyan)
  puts
end

# Main execution
begin
  print_header
  check_environment_variables
  build_jekyll_site
  index_to_algolia
  print_completion
rescue Interrupt
  puts "\n\n❌  Indexing cancelled by user".colorize(:red)
  exit 1
rescue StandardError => e
  puts "\n\n❌  An error occurred: #{e.message}".colorize(:red)
  puts e.backtrace.join("\n").colorize(:light_black) if ENV['DEBUG']
  exit 1
end
