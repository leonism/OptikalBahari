---
layout: null
permalink: /api/reviews.json
---
{%- assign reviews = site.data.reviews_list | take: 60 -%}
[
  {%- for r in reviews -%}
    {
      "name": {{ r.name | jsonify }},
      "reviewId": {{ r.reviewId | jsonify }},
      "reviewerPhotoUrl": {{ r.reviewerPhotoUrl | jsonify }},
      "text": {{ r.text | jsonify }},
      "stars": {{ r.stars | jsonify }},
      "publishedAtDate": {{ r.publishedAtDate | default: r.publishAt | default: r.scrapedAt | jsonify }},
      "reviewUrl": {{ r.reviewUrl | jsonify }},
      "reviewImageUrls": {{ r.reviewImageUrls | jsonify }},
      "responseFromOwnerText": {{ r.responseFromOwnerText | jsonify }},
      "totalScore": {{ r.totalScore | default: 5.0 | jsonify }},
      "reviewsCount": {{ r.reviewsCount | default: 0 | jsonify }}
    }{% unless forloop.last %},{% endunless %}
  {%- endfor -%}
]
