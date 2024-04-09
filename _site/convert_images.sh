#!/bin/bash

# Set the directory containing your images
input_dir="/Volumes/DATA/Jekyll/OptikalBahari/assets/img"

# Set the quality parameter (0-100, where 100 is the highest quality)
quality=30

# Find all image files in the specified directory and its subdirectories
find "$input_dir" -type f \( -iname \*.jpg -o -iname \*.jpeg -o -iname \*.png -o -iname \*.gif \) -print0 |
while IFS= read -r -d '' file; do
    # Get the filename without extension
    filename=$(basename -- "$file")
    filename_no_ext="${filename%.*}"
    
    # Convert the image to WebP format with the specified quality
    cwebp -q "$quality" "$file" -o "${file%.*}.webp"
done
