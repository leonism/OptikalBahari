# [Start Bootstrap - Clean Blog Jekyll](https://startbootstrap.com/template-overviews/clean-blog-jekyll/) - Official Jekyll Version

[Clean Blog Jekyll](http://startbootstrap.com/template-overviews/clean-blog-jekyll/)
is a stylish, responsive blog theme for [Bootstrap](http://getbootstrap.com/)
created by [Start Bootstrap](http://startbootstrap.com/). This theme features a
blog homepage, about page, contact page, and an example post page along with a
working contact form powered by [Formspree](https://formspree.io/).

This repository holds the official Jekyll version of the Clean Blog theme on
Start Bootstrap!

## Preview

[![Clean Blog (Jekyll) Preview](screenshot.png)](https://optikalbahari.com/)

**[View Live Preview](http://blackrockdigital.github.io/startbootstrap-clean-blog-jekyll/)**

## Installation & Setup

### Using RubyGems:

When installing the theme using RubyGems, demo images, posts, and pages are not
included. Follow the instructions below for complete setup.

1. (Optional) Create a new Jekyll site: `jekyll new my-site`
2. Replace the current theme in your `Gemfile` with
   `gem "jekyll-theme-clean-blog"`.
3. Install the theme: `bundle install`
4. Replace the current theme in your `_config.yml` file with
   `theme: jekyll-theme-clean-blog`.
5. Build your site: `bundle exec jekyll serve`

Assuming there are no errors and the site is building properly (it should be
accessible at `http://localhost:4000` by default), you can stop the server
(Ctrl+C). This step verifies the basic theme integration.

6. **Configure Content and Structure**: Follow these steps to set up your site's
   content:
   1. Create the following pages if they do not exist already (or change the
      extension of existing markdown files from `.md` to `.html`):
   - `index.html` - set to `layout: home`
   - `about.html` - set to `layout: page`
   - `contact.html` - set to `layout: page`
   - `posts/index.html` - set to `layout: page` (you will also need to create a
     `posts` directory)

7. Configure the `index.html` front matter. Example:

```
---
layout: home
background: '/PATH_TO_IMAGE'
---
```

3. Configure the `about.html`, `contact.html`, and `posts/index.html` front
   matter. Example:

```
---
layout: page
title: Page Title
description: This is the page description.
background: '/PATH_TO_IMAGE'
```

4. For each post in the `_posts` directory, update the front matter. Example:

```
---
layout: post
title: "Post Title"
subtitle: "This is the post subtitle."
date: YYYY-MM-DD HH:MM:SS
background: '/PATH_TO_IMAGE'
---
```

For reference, look at the
[demo repository](https://github.com/BlackrockDigital/startbootstrap-clean-blog-jekyll)
to see how the files are set up.

5. Add the form to the `contact.html` page. Add the following code to your
   `contact.html` page:

```
<form name="sentMessage" id="contactForm" novalidate>
  <div class="control-group">
    <div class="form-group floating-label-form-group controls">
      <label>Name</label>
      <input type="text" class="form-control" placeholder="Name" id="name" required data-validation-required-message="Please enter your name.">
      <p class="help-block text-danger"></p>
    </div>
  </div>
  <div class="control-group">
    <div class="form-group floating-label-form-group controls">
      <label>Email Address</label>
      <input type="email" class="form-control" placeholder="Email Address" id="email" required data-validation-required-message="Please enter your email address.">
      <p class="help-block text-danger"></p>
    </div>
  </div>
  <div class="control-group">
    <div class="form-group col-xs-12 floating-label-form-group controls">
      <label>Phone Number</label>
      <input type="tel" class="form-control" placeholder="Phone Number" id="phone" required data-validation-required-message="Please enter your phone number.">
      <p class="help-block text-danger"></p>
    </div>
  </div>
  <div class="control-group">
    <div class="form-group floating-label-form-group controls">
      <label>Message</label>
      <textarea rows="5" class="form-control" placeholder="Message" id="message" required data-validation-required-message="Please enter a message."></textarea>
      <p class="help-block text-danger"></p>
    </div>
  </div>
  <br>
  <div id="success"></div>
  <div class="form-group">
    <button type="submit" class="btn btn-primary" id="sendMessageButton">Send</button>
  </div>
</form>
```

Make sure you have the `email` setting in your `_config.yml` file set to a
working email address! Once this is set, fill out the form and then check your
email, verify the email address using the link sent to you by Formspree, and
then the form will be working!

6. Build your site: `bundle exec jekyll serve` or `bundle exec jekyll build` or
   `bundle exec jekyll serve --livereload` or `bundle install`

### Using Core Files

When using the core files, the demo images, posts, and pages are all included
with the download. After following the instructions below, you can then go and
change the content of the pages and posts.

1. [Download](https://github.com/BlackrockDigital/startbootstrap-clean-blog-jekyll/archive/master.zip)
   or Clone the repository.

2. Update the following configuration settings in your `_config.yml` file:
   - `baseurl`
   - `url`
   - `title`
   - `email` (after setting this setting to a working email address, fill out
     the form on the contact page and send it - then check your email and verify
     the address and the form will send you messages when used)
   - `description`
   - `author`
   - `twitter_username` (Optional)
   - `facebook_username` (Optional)
   - `github_username` (Optional)
   - `linkedin_username` (Optional)
   - `instagram_username` (Optional)
   3. Build your site: `bundle exec jekyll serve`

## Bugs and Issues

Have a bug or an issue with this template?
[Open a new issue](https://github.com/BlackrockDigital/startbootstrap-clean-blog-jekyll/issues)
here on GitHub!

## About

Start Bootstrap is an open source library of free Bootstrap templates and
themes. All of the free templates and themes on Start Bootstrap are released
under the MIT license, which means you can use them for any purpose, even for
commercial projects.

- https://startbootstrap.com
- https://twitter.com/SBootstrap

Start Bootstrap was created by and is maintained by
**[David Miller](http://davidmiller.io/)**, Owner of
[Blackrock Digital](http://blackrockdigital.io/).

- http://davidmiller.io
- https://twitter.com/davidmillerskt
- https://github.com/davidtmiller

Start Bootstrap is based on the [Bootstrap](http://getbootstrap.com/) framework
created by [Mark Otto](https://twitter.com/mdo) and
[Jacob Thorton](https://twitter.com/fat).

## Copyright and License

Copyright 2013-2019 Blackrock Digital LLC. Code released under the
[MIT](https://github.com/BlackrockDigital/startbootstrap-clean-blog-jekyll/blob/gh-pages/LICENSE)
license.

### To fix this issue, you need to clear all caches and rebuild:

```bash
bundle exec jekyll clean
```

### Clear smart_asssets_cache.yml

```bash
rm -f .smart_asset_cache.yml
```

### Rebuild again

```bash
bundle exec jekyll build
```

### Build command

```bash
build_command: "bundle exec jekyll build -- verbose && bash scripts/post-build.sh"
JEKYLL_ENV=production bundle exec jekyll build --verbose
npx prettier --write .
npx prettier --write "**/*.md"
npx prettier --check "**/*.{html,md}"
npx prettier --write _includes/home/home-cards.html
```
