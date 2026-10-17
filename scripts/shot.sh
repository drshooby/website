#!/usr/bin/env bash
# Headless Chrome screenshot: scripts/shot.sh <url> <out.png> <width> <height>
set -euo pipefail

if [ "$#" -ne 4 ]; then
  echo "usage: $0 <url> <out.png> <width> <height>" >&2
  exit 1
fi

URL="$1"
OUT="$2"
W="$3"
H="$4"

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --use-angle=swiftshader \
  --enable-unsafe-swiftshader \
  --hide-scrollbars \
  --window-size="$W,$H" \
  --virtual-time-budget=6000 \
  --screenshot="$OUT" \
  "$URL"
