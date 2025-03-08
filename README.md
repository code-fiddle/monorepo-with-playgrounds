# MonorepoStarter

## Config

### Fonts

1. Download latest release from [https://github.com/IBM/plex](https://github.com/IBM/plex).
2. Upload to R2 bucket with `rclone copy <folder> r2fonts:fonts`
3. CF Bug: preflight CORS issue. Add Transform Rule to update response headers, add `access-control-allow-origin = *`
