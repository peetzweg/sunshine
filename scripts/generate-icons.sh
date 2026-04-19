#!/bin/bash
# Generate extension icons from SVG source at all required sizes
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SVG="$SCRIPT_DIR/../sunshine.svg"
OUT_DIR="$SCRIPT_DIR/../public/icons"

mkdir -p "$OUT_DIR"

for size in 16 32 48 96 128; do
  rsvg-convert -w "$size" -h "$size" "$SVG" -o "$OUT_DIR/${size}.png"
  echo "Generated ${size}x${size} -> public/icons/${size}.png"
done

echo "Done!"
