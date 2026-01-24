<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="id-ID">
      <head>
        <title>XML Sitemap - Optikal Bahari</title>
        <style type="text/css">
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8f9fa; color: #333; padding: 20px; }
          .container { max-width: 1000px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 15px rgba(0,0,0,0.05); }
          h1 { color: #28a745; margin-bottom: 10px; font-size: 24px; }
          p { color: #666; margin-bottom: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
          th { background: #f1f1f1; text-align: left; padding: 12px; border-bottom: 2px solid #ddd; font-size: 13px; text-transform: uppercase; color: #555; }
          td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; word-break: break-all; vertical-align: top; }
          tr:hover { background: #fafafa; }
          a { color: #007bff; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; background: #e9ecef; color: #495057; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>XML Sitemap</h1>
          <p>Total URL yang ditemukan: <strong><xsl:value_of select="count(s:urlset/s:url)"/></strong></p>
          
          <table>
            <thead>
              <tr>
                <th width="70%">Lokasi (URL)</th>
                <th width="15%">Prioritas</th>
                <th width="15%">Frekuensi</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td>
                    <a href="{s:loc}">
                      <xsl:value_of select="s:loc"/>
                    </a>
                  </td>
                  <td><span class="badge"><xsl:value_of select="s:priority"/></span></td>
                  <td><xsl:value_of select="s:changefreq"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>