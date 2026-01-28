
import os
import re

directories = [
    '/Volumes/DATA/Jekyll/OptikalBahari/_layouts',
    '/Volumes/DATA/Jekyll/OptikalBahari/_includes',
    '/Volumes/DATA/Jekyll/OptikalBahari/_pages',
    '/Volumes/DATA/Jekyll/OptikalBahari/_posts',
]

replacements = [
    (r'data-toggle', 'data-bs-toggle'),
    (r'data-target', 'data-bs-target'),
    (r'data-dismiss', 'data-bs-dismiss'),
    (r'data-parent', 'data-bs-parent'),
    (r'float-left', 'float-start'),
    (r'float-right', 'float-end'),
    (r'text-left', 'text-start'),
    (r'text-right', 'text-end'),
    (r'ml-auto', 'ms-auto'),
    (r'mr-auto', 'me-auto'),
]

regex_replacements = [
    (r'pl-(\d+)', r'ps-\1'),
    (r'pr-(\d+)', r'pe-\1'),
    (r'ml-(\d+)', r'ms-\1'),
    (r'mr-(\d+)', r'me-\1'),
]

for directory in directories:
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.html', '.md', '.js')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()

                original_content = content

                for old, new in replacements:
                    content = content.replace(old, new)

                for pattern, replacement in regex_replacements:
                    content = re.sub(pattern, replacement, content)

                if content != original_content:
                    print(f"Updating {filepath}")
                    with open(filepath, 'w') as f:
                        f.write(content)
