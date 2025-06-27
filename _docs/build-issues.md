### To fix this issue, you need to clear all caches and rebuild:

```bash
bundle exec jekyll clean
```

### Clear smart_asssets_cache.yml

```bash
rm -f .smart_asset_cache.yml
```

### Rebuild again

```bash
bundle exec jekyll build
```


### Build command

```bash
build_command: "bundle exec jekyll build && bash scripts/post-build.sh"
```
