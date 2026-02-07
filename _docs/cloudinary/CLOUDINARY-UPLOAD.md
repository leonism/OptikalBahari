# Cloudinary Bulk Image Uploader

A high-performance Ruby script for syncing large local image libraries to Cloudinary.

Built for: • Speed • Reliability • Large asset folders • Automation pipelines

## 🚀 Features

- ✅ Auto-load `.env` from project root
- ✅ Recursive image scanning
- ✅ Parallel uploads (thread pool)
- ✅ Skip existing assets by `public_id`
- ✅ Progress bar with ETA
- ✅ JSON mapping output
- ✅ Dry-run mode (no uploads)
- ✅ Resume after interruption
- ✅ Automatic retries
- ✅ Logging to file
- ✅ CLI configuration flags

---

## 📁 Project Structure

```bash
project-root/
│
├─ .env
├─ assets/
│   └─ img/
│       ├─ icons/
│       ├─ photos/
│       └─ ...
│
└─ _scripts/
    └─ cloudinary/
        ├─ cloudinary-upload.rb
        ├─ cloudinary-upload.md
        └─ mapping-cloudinary-urls.json (generated)
```

---

## ⚙️ Requirements

### Ruby

Ruby 3.0+

### Gems

```bash
gem install cloudinary dotenv colorize
```

---

## 🔐 Environment Setup

Create `.env` in project root:

```text
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Script auto-loads it regardless of run location.

---

## ▶️ Basic Usage

```bash
ruby _scripts/cloudinary/cloudinary-upload.rb
```

---

## 📸 Supported Formats

- JPG / JPEG
- PNG
- WebP
- AVIF

---

## 🧠 How Upload Logic Works

### Public ID Mapping

```
assets/img/icons/logo.png
→ icons/logo
```

### Decision Table

| Remote public_id | Action |
| ---------------- | ------ |
| Exists           | Skip   |
| Missing          | Upload |

This avoids slow API calls per file.

---

## ⚡ Performance Architecture

### One-time remote fetch

Cloudinary API is called once to fetch all assets.

Stored in memory using Ruby `Set`:

```bash
O(1) lookup speed
```

### Thread pool

Uploads happen in parallel.

Default:

```ruby
THREADS = 6
```

Recommended:

| Network | Threads |
| ------- | ------- |
| Slow    | 4       |
| Normal  | 6       |
| Fast    | 8–12    |

---

## 📊 Progress Display

```
[██████████░░░░░░░░░░░░░░] 55.3%
Uploaded: 210 Skipped: 300 Failed: 1
ETA: 42s
```

---

## 📝 Mapping Output

Generated at:

```
_scripts/cloudinary/mapping-cloudinary-urls.json
```

Example:

```json
{
  "icons/logo.png": {
    "public_id": "icons/logo",
    "secure_url": "https://res.cloudinary.com/...",
    "width": 200,
    "height": 80,
    "bytes": 4890,
    "created_at": "2026-02-01T11:20:30Z"
  }
}
```

---

# 🔧 Advanced Features

---

## ✅ Dry-Run Mode

Simulate uploads without sending files.

```bash
ruby cloudinary-upload.rb --dry-run
```

Output:

```bash
Would upload: icons/logo.png
Would skip: photos/bg.jpg
```

Useful for audits.

---

## ♻ Resume Mode

If script crashes or is interrupted:

A checkpoint file is saved:

```bash
.cloudinary-upload-state.json
```

Run again:

```bash
ruby cloudinary-upload.rb --resume
```

Already processed files will be skipped.

---

## 🔁 Automatic Retry

Each failed upload is retried with exponential backoff:

Attempt sequence:

```
1s → 2s → 4s → fail
```

Prevents network hiccups breaking batch jobs.

---

## 📄 Logging

All operations saved to:

```
cloudinary-upload.log
```

Includes:

• Upload success • Skips • Errors • Timing

Useful for CI.

---

## ⚙ CLI Flags

| Flag          | Description           |
| ------------- | --------------------- |
| --dry-run     | Simulate uploads      |
| --resume      | Continue previous run |
| --threads=10  | Custom thread count   |
| --verbose     | Detailed logs         |
| --no-progress | Disable progress bar  |

Example:

```bash
ruby cloudinary-upload.rb --threads=10 --resume --verbose
```

---

## 🤖 CI/CD Usage Example

GitHub Actions:

```yaml
- name: Upload assets to Cloudinary
  run: ruby _scripts/cloudinary/cloudinary-upload.rb
```

Ensure secrets injected as env vars.

---

# 🛠 Configuration (inside script)

```ruby
THREADS = 6
ASSETS_PATH = File.join(PROJECT_ROOT, 'assets/img')
MAPPING_FILE = File.join(PROJECT_ROOT, '_scripts/cloudinary/mapping-cloudinary-urls.json')
LOG_FILE = File.join(PROJECT_ROOT, 'cloudinary-upload.log')
```

---

# 🚨 Troubleshooting

---

### ENV not loading

```
❌ Missing ENV var
```

Fix:

• Ensure `.env` in project root • No extra spaces • Restart terminal

---

### Assets reupload unexpectedly

Possible causes:

• File renamed • Folder renamed • Asset deleted remotely

(public_id changed)

---

### Rate limit errors

Solution:

Lower threads:

```ruby
THREADS = 4
```

---

### Slow performance

Ensure:

• Using skip by public_id • No per-file API check • Threads enabled

---

# 📈 Real World Performance

### 500 images:

| Method             | Time       |
| ------------------ | ---------- |
| Old per-file check | ~40–60 min |
| This script        | ~2–5 min   |

---

# 📌 Best Practices

✔ Keep consistent folder structure ✔ Avoid renaming images frequently ✔ Commit mapping file if used
by app ✔ Run after adding new assets

---

# 🚀 Future Ideas (Optional)

- SHA256 content deduplication
- Automatic Cloudinary folder cleanup
- Image optimization presets
- Responsive transformation generator
- Webhook notifications

---

## ✅ Conclusion

This Cloudinary uploader is designed for:

✔ Large static sites ✔ Marketing asset libraries ✔ Production automation ✔ High speed

It avoids Cloudinary API bottlenecks and scales cleanly.

---
