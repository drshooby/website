#!/usr/bin/env bash
# Regenerates public/piazza.webp (the fallback stage painting) from a running
# dev server (?capture=scene is dev-only): scripts/stills.sh [base-url]
# Captured as PNG with shot.sh, then converted to WebP in public/.
set -euo pipefail

BASE="${1:-http://localhost:3000}"
DIR="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

capture() { # name capture width height
  "$DIR/shot.sh" "$BASE/?capture=$2" "$TMP/$1.png" "$3" "$4" 2>/dev/null
  bun "$DIR/to-webp.mjs" "$TMP/$1.png" "$DIR/../public/$1.webp" 86
}

capture piazza scene 1600 1000
