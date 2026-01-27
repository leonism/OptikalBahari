# Cloudinary Advanced Sync Tool Guide

## Overview

The enhanced `migrate_to_cloudinary.rb` script provides advanced bidirectional
synchronization between your local Jekyll image assets and Cloudinary. This tool
goes beyond simple uploading to offer intelligent conflict resolution, metadata
tracking, and selective synchronization.

## Features

### 🔄 Bidirectional Synchronization

- **Upload**: Sync local files to Cloudinary
- **Download**: Sync Cloudinary files to local
- **Bidirectional**: Smart two-way sync with conflict detection

### ⚡ Advanced Capabilities

- **Conflict Resolution**: Multiple strategies for handling file conflicts
- **Metadata Tracking**: Track sync state and file checksums
- **Selective Sync**: Include/exclude patterns for targeted syncing
- **Automatic Backups**: Protect existing files during sync
- **Dry Run Mode**: Preview changes without making them
- **Progress Tracking**: Detailed logging and reporting

## Installation & Setup

### Prerequisites

Ensure you have the required gems installed:

```bash
bundle install
```

### Environment Variables

Set up your Cloudinary credentials in `.env`:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Usage

### Basic Commands

```bash
# Bidirectional sync (default)
ruby _scripts/migrate_to_cloudinary.rb

# Upload only
ruby _scripts/migrate_to_cloudinary.rb --direction upload

# Download only
ruby _scripts/migrate_to_cloudinary.rb --direction download

# Dry run (preview changes)
ruby _scripts/migrate_to_cloudinary.rb --dry-run
```

### Command Line Options

| Option            | Description                | Values                                |
| ----------------- | -------------------------- | ------------------------------------- |
| `-d, --direction` | Sync direction             | `upload`, `download`, `bidirectional` |
| `-c, --conflict`  | Conflict resolution        | `prompt`, `local`, `remote`, `newer`  |
| `-n, --dry-run`   | Preview without changes    | -                                     |
| `-f, --force`     | Force sync without prompts | -                                     |
| `--no-backup`     | Disable automatic backups  | -                                     |
| `-e, --exclude`   | Exclude pattern            | File pattern                          |
| `-i, --include`   | Include pattern            | File pattern                          |
| `-h, --help`      | Show help                  | -                                     |

### Advanced Examples

```bash
# Sync only JPG files
ruby _scripts/migrate_to_cloudinary.rb --include "*.jpg"

# Exclude backup directories
ruby _scripts/migrate_to_cloudinary.rb --exclude "**/backup/**"

# Auto-resolve conflicts using newer files
ruby _scripts/migrate_to_cloudinary.rb --conflict newer

# Upload with automatic conflict resolution
ruby _scripts/migrate_to_cloudinary.rb --direction upload --conflict local --force
```

## Conflict Resolution

When the same file exists both locally and remotely with different content or
timestamps, the tool detects conflicts and offers resolution strategies:

### Resolution Strategies

1. **Prompt** (default): Interactive resolution for each conflict
2. **Local**: Always use the local version
3. **Remote**: Always use the remote version
4. **Newer**: Use the file with the most recent modification time

### Interactive Conflict Resolution

When using `--conflict prompt`, you'll see:

```
🔥 CONFLICT DETECTED:
📁 File: posts/hero-image.jpg
🏠 Local:  2024-01-15 10:30:00 (245.6 KB)
☁️  Remote: 2024-01-14 15:20:00 (198.3 KB)

Choose resolution:
  [l] Use local version (upload)
  [r] Use remote version (download)
  [s] Skip this file
  [b] Backup local and use remote
```

## File Organization

The tool automatically organizes files into Cloudinary folders based on their
local path:

| Local Path      | Cloudinary Folder             |
| --------------- | ----------------------------- |
| `posts/`        | `optikalbahari/posts/`        |
| `backgrounds/`  | `optikalbahari/backgrounds/`  |
| `icons/`        | `optikalbahari/icons/`        |
| `testimonials/` | `optikalbahari/testimonials/` |
| `profile/`      | `optikalbahari/profile/`      |
| Other           | `optikalbahari/`              |

## Sync State Management

The tool maintains a sync state file (`.cloudinary_sync_state.json`) that
tracks:

- Last sync timestamp for each file
- Local file checksums
- Remote file versions
- Conflict resolution history

This enables intelligent conflict detection and prevents unnecessary transfers.

## Generated Files

After each sync operation, the tool generates several log files:

### Log Files

- `cloudinary_upload_log_YYYYMMDD_HHMMSS.yml`: Detailed upload log
- `cloudinary_download_log_YYYYMMDD_HHMMSS.yml`: Detailed download log
- `cloudinary_error_log_YYYYMMDD_HHMMSS.yml`: Error log (if any)
- `cloudinary_conflicts.yml`: Conflict resolution history
- `url_mapping_YYYYMMDD_HHMMSS.yml`: URL mapping for reference

### Backup Files

When files are overwritten during download, backups are created in `.backup/`
subdirectories with timestamps.

## Best Practices

### 1. Start with Dry Run

Always preview changes first:

```bash
ruby _scripts/migrate_to_cloudinary.rb --dry-run
```

### 2. Use Selective Sync

For large projects, sync specific directories:

```bash
# Sync only posts images
ruby _scripts/migrate_to_cloudinary.rb --include "posts/**"
```

### 3. Regular Bidirectional Sync

Set up regular bidirectional syncs to keep everything in sync:

```bash
# Weekly sync with automatic conflict resolution
ruby _scripts/migrate_to_cloudinary.rb --conflict newer
```

### 4. Backup Strategy

Keep backups enabled (default) for safety:

```bash
# Disable only if you're confident
ruby _scripts/migrate_to_cloudinary.rb --no-backup
```

## Workflow Examples

### Initial Migration

```bash
# 1. Preview the migration
ruby _scripts/migrate_to_cloudinary.rb --direction upload --dry-run

# 2. Perform the migration
ruby _scripts/migrate_to_cloudinary.rb --direction upload

# 3. Verify results
cat cloudinary_upload_log_*.yml
```

### Team Collaboration

```bash
# Download latest images from team
ruby _scripts/migrate_to_cloudinary.rb --direction download

# Upload your new images
ruby _scripts/migrate_to_cloudinary.rb --direction upload --include "new-images/**"
```

### Maintenance Sync

```bash
# Regular bidirectional sync
ruby _scripts/migrate_to_cloudinary.rb --conflict newer
```

## Troubleshooting

### Common Issues

1. **API Rate Limits**: The tool handles rate limits automatically with retries
2. **Large Files**: Files over 10MB may take longer to process
3. **Network Issues**: Temporary failures are logged and can be retried

### Error Recovery

```bash
# Retry failed uploads
ruby _scripts/migrate_to_cloudinary.rb --direction upload --force

# Check error logs
cat cloudinary_error_log_*.yml
```

### Debugging

```bash
# Verbose dry run
ruby _scripts/migrate_to_cloudinary.rb --dry-run --include "problematic-file.jpg"
```

## Integration with Jekyll

After syncing, use the Cloudinary integration in your Jekyll templates:

```liquid
<!-- Using the cloudinary_url filter -->
<img src="{{ '/assets/img/hero.jpg' | cloudinary_url }}" alt="Hero">

<!-- Using the cloudinary tag -->
{% cloudinary src='/assets/img/hero.jpg' width=800 height=400 %}

<!-- Using presets -->
<img src="{{ '/assets/img/hero.jpg' | cloudinary_preset: 'hero' }}" alt="Hero">
```

## Security Considerations

- Never commit `.env` files with API credentials
- Use environment-specific credentials for development/production
- Regularly rotate API keys
- Monitor Cloudinary usage and quotas

## Performance Tips

1. **Batch Operations**: The tool processes files in batches for efficiency
2. **Selective Sync**: Use include/exclude patterns to limit scope
3. **Conflict Resolution**: Use automatic strategies for large syncs
4. **Dry Run First**: Always preview large operations

## Support

For issues or questions:

1. Check the error logs first
2. Review the Cloudinary documentation
3. Use dry run mode to debug issues
4. Check network connectivity and API credentials

---

**Note**: This tool is designed for Jekyll projects with the Cloudinary
integration. Ensure you have the proper Jekyll plugins and configuration in
place before using the sync tool.
