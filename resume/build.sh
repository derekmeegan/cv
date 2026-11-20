#!/usr/bin/env bash
# Regenerate the PDF after editing resume.html
set -euo pipefail
cd "$(dirname "$0")"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PWD/derek-meegan-resume.pdf" \
  "file://$PWD/resume.html" 2>/dev/null
echo "wrote derek-meegan-resume.pdf"
