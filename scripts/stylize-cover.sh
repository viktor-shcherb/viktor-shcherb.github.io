#!/usr/bin/env bash
#
# stylize-cover.sh — palette-map a hand-stylized illustration onto the site's
# cream + ink palette and export a web-ready cover JPEG.
#
# Step 0 (manual, before this script):
#   Produce a line-art / etching version of the source photo in your tool of
#   choice (Photoshop posterise + edge-detect, Procreate, AI img2img, …) and
#   save it as a PNG with broadly cream paper + dark ink tones.
#
# Step 1 (this script):
#   - Convert to grayscale (drop any residual color cast)
#   - Auto-level + tighten the histogram so the lightest and darkest tones
#     genuinely hit the endpoints
#   - +level-colors to map black → site --text, white → site --bg
#   - Resize to 1600 px wide, strip metadata, JPEG quality 92
#
# Usage:
#   scripts/stylize-cover.sh <input.png> <output.jpg>
#
# Example:
#   scripts/stylize-cover.sh \
#     assets/images/posts/<slug>/cover.original.png \
#     assets/images/posts/<slug>/cover.jpg

set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 <input.png> <output.jpg>" >&2
  exit 64
fi

INPUT="$1"
OUTPUT="$2"

# Site palette (kept in sync with _includes/critical.css)
INK="#1c1a17"
CREAM="#f7f3ea"

# Tunables — adjust if the source has very flat or very contrasty tones.
LEVEL_MIN="10%"
LEVEL_MAX="90%"
TARGET_WIDTH="1600"
JPEG_QUALITY="92"

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick (\`magick\`) not found. Install with: brew install imagemagick" >&2
  exit 1
fi

magick "$INPUT" \
  -colorspace Gray \
  -auto-level \
  -level "${LEVEL_MIN},${LEVEL_MAX}" \
  +level-colors "${INK},${CREAM}" \
  -resize "${TARGET_WIDTH}x" \
  -strip \
  -quality "${JPEG_QUALITY}" \
  "$OUTPUT"

echo "wrote $OUTPUT (palette: ink=${INK}, cream=${CREAM})"
