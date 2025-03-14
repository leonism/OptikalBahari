Using the **Jekyll Minifier** gem is an excellent choice for a small project, as it simplifies the process of minifying JavaScript (and optionally CSS/HTML) without requiring additional tools or complex configurations. Since you're using jQuery as your JavaScript framework, this approach will work seamlessly.

Below is a step-by-step guide to integrating and configuring the Jekyll Minifier gem into your Jekyll project:

---

### **1. Prerequisites**
- Ensure you have Jekyll installed and your project is set up.
- Verify that your JavaScript files (including jQuery) are located in the appropriate directory (e.g., `assets/js`).

---

### **2. Install the Jekyll Minifier Gem**

#### **Step 1: Add the Gem to Your `Gemfile`**
Open your `Gemfile` and add the following line under the `plugins` group:

```ruby
group :jekyll_plugins do
  gem 'jekyll-minifier'
end
```

#### **Step 2: Install the Gem**
Run the following command to install the gem:

```bash
bundle install
```

This will download and install the `jekyll-minifier` gem along with its dependencies.

---

### **3. Configure Jekyll Minifier**

#### **Step 1: Update `_config.yml`**
Open your `_config.yml` file and add the following configuration to enable and customize the minifier:

```yaml
plugins:
  - jekyll-minifier

jekyll-minifier:
  js:
    enable: true
    preserve_source_map: false
  css:
    enable: false # Disable CSS minification if not needed
  html:
    enable: false # Disable HTML minification if not needed
```

#### **Configuration Options Explained**:
- **`js.enable`**: Enables JavaScript minification.
- **`preserve_source_map`**: Set to `false` unless you need source maps for debugging.
- **`css.enable`**: Set to `true` if you want to minify CSS files as well.
- **`html.enable`**: Set to `true` if you want to minify HTML files.

For your small project, enabling only JavaScript minification (`js.enable`) should suffice.

---

### **4. Organize Your JavaScript Files**

Ensure your JavaScript files (including jQuery) are organized properly. For example:

```
/assets/js/
  ├── jquery.min.js       # Pre-minified jQuery library
  ├── main.js             # Your custom JavaScript code
```

If you're using a pre-minified version of jQuery (e.g., `jquery.min.js`), you don't need to include it in the minification process. Only include your custom JavaScript files (e.g., `main.js`) in the build process.

---

### **5. Reference JavaScript Files in Your Templates**

Update your HTML templates to reference the correct JavaScript files. For example:

```html
<!-- Include jQuery -->
<script src="/assets/js/jquery.min.js"></script>

<!-- Include your custom JavaScript -->
{% if jekyll.environment == 'production' %}
  <script src="/assets/js/main.min.js"></script>
{% else %}
  <script src="/assets/js/main.js"></script>
{% endif %}
```

This ensures that during production builds, the minified version (`main.min.js`) is used, while the unminified version (`main.js`) is used during development.

---

### **6. Build Your Jekyll Site**

Run the following command to build your site:

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

- **`JEKYLL_ENV=production`**: Ensures the `jekyll.environment` variable is set to `production`, triggering the use of minified files.
- **`bundle exec jekyll build`**: Builds the site using the Jekyll Minifier plugin.

After the build process, check the `_site/assets/js/` directory to confirm that the minified JavaScript files (e.g., `main.min.js`) have been generated.

---

### **7. Serve Your Site Locally (Optional)**

To test your site locally, run:

```bash
bundle exec jekyll serve
```

By default, this will use the unminified JavaScript files (`main.js`). To test the minified version, set the environment variable:

```bash
JEKYLL_ENV=production bundle exec jekyll serve
```

---

### **8. Deploy Your Site**

Once you've confirmed that the minified files are working correctly, deploy your site to your hosting provider (e.g., GitHub Pages, Netlify, etc.). The production build will automatically include the minified JavaScript files.

---

### **9. Additional Notes**

#### **jQuery Considerations**
Since you're using jQuery, ensure that:
1. You include the pre-minified version of jQuery (`jquery.min.js`) in your project.
2. Your custom JavaScript code (`main.js`) does not conflict with jQuery. For example, wrap your code in a `$(document).ready()` block:

```javascript
$(document).ready(function () {
  // Your custom JavaScript code here
});
```

#### **Debugging Minified Code**
If you encounter issues with the minified JavaScript, temporarily disable minification in `_config.yml` (`js.enable: false`) to debug the original code. Alternatively, enable `preserve_source_map: true` to generate source maps for easier debugging.

---

### **Conclusion**

By following these steps, you can efficiently minify your JavaScript files using the Jekyll Minifier gem. This approach keeps your workflow simple and avoids introducing unnecessary complexity, making it ideal for small projects like yours. Once configured, the gem will handle minification automatically during the build process, ensuring your site remains lightweight and performant in production.
