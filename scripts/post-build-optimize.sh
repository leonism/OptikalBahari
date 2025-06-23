#!/bin/bash

# WebP conversion for remaining images
find _site -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | while read img; do
  if [ ! -f "${img%.*}.webp" ]; then
    cwebp -q 85 "$img" -o "${img%.*}.webp"
  fi
done

# AVIF generation for modern browsers
find _site -name "*.webp" | while read img; do
  if [ ! -f "${img%.*}.avif" ]; then
    npx @squoosh/cli --avif '{"cqLevel":30,"cqAlphaLevel":-1,"denoiseLevel":0,"tileColsLog2":0,"tileRowsLog2":0}' "$img"
  fi
done
