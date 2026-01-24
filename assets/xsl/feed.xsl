<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="id-ID">
      <head>
        <title>RSS Feed - Optikal Bahari</title>
        <style type="text/css">
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f4f7f6; color: #333; line-height: 1.6; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          header { border-bottom: 2px solid #eee; margin-bottom: 30px; padding-bottom: 20px; }
          h1 { color: #007bff; margin: 0; font-size: 28px; }
          .subtitle { color: #666; font-size: 16px; margin-top: 5px; }
          .entry { margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #eee; }
          .entry:last-child { border-bottom: none; }
          .entry h2 a { color: #222; text-decoration: none; font-size: 22px; font-weight: bold; }
          .entry h2 a:hover { color: #007bff; }
          .meta { font-size: 13px; color: #999; margin-bottom: 15px; }
          .content { font-size: 16px; color: #444; }
          .content img { max-width: 100%; height: auto; border-radius: 4px; margin: 15px 0; display: block; }
          .alert { background: #e7f3ff; border: 1px solid #b8daff; color: #004085; padding: 15px; border-radius: 4px; margin-bottom: 30px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1><xsl:value_of select="//*[local-name()='title'][1]"/></h1>
            <p class="subtitle"><xsl:value_of select="//*[local-name()='subtitle']"/></p>
          </header>
          
          <div class="alert">
            <strong>RSS Feed:</strong> Ini adalah format XML yang digunakan oleh aplikasi pembaca berita.
          </div>

          <xsl:for-each select="//*[local-name()='entry']">
            <div class="entry">
              <h2>
                <a href="{*[local-name()='link' and @rel='alternate']/@href}">
                  <xsl:value_of select="*[local-name()='title']"/>
                </a>
              </h2>
              <div class="meta">
                Dipublikasikan pada: <xsl:value_of select="substring(*[local-name()='published'], 1, 10)"/>
              </div>
              <div class="content">
                <xsl:value_of select="*[local-name()='content']" disable-output-escaping="yes"/>
              </div>
            </div>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
