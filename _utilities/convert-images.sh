#!/bin/bash

# Set the directory containing your images, leaving the last trailing slash empty
input_dir="/Volumes/DATA/Jekyll/OptikalBahari/assets/img/posts/kacamata-hitam-wanita"

# Set the quality parameter (0-100, where 100 is the highest quality)
quality=20

# Set the desired width and height for the output images (0 for no resizing)
width=0
height=0

# Alpha compression option (0 for compression, 1 for no compression)
# This parameter is used for images with alpha channel (transparency)
alpha_compression=0

# Preserve metadata option (all for preserving all metadata, none for stripping all metadata)
# This parameter determines whether to preserve metadata such as EXIF, ICC, XMP, and other metadata
preserve_metadata="none"

# Effort level (0 to 6, where higher values require more processing time)
# This parameter determines the trade-off between encoding speed and file size
effort=6

# Overwrite existing output files (0 for no overwrite, 1 for overwrite)
overwrite=1

# Find all image files in the specified directory and its subdirectories
find "$input_dir" -type f \( -iname \*.jpg -o -iname \*.jpeg -o -iname \*.png -o -iname \*.gif \) -print0 |
while IFS= read -r -d '' file; do
    # Get the filename without extension
    filename=$(basename -- "$file")
    filename_no_ext="${filename%.*}"

    # Check if the output file already exists
    if [ -f "${file%.*}.webp" ] && [ "$overwrite" -eq 0 ]; then
        echo "Output file ${file%.*}.webp already exists. Skipping..."
    else
        # Convert the image to WebP format with the specified parameters
        cwebp -q "$quality" -resize "$width" "$height" -alpha_q "$alpha_compression" \
        -metadata "$preserve_metadata" -m "$effort" \
        "$file" -o "${file%.*}.webp"
    fi
done
