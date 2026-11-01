#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ARTIFACT_DIR="${ARTIFACT_DIR:-font-build}"
uv run scripts/build_fonts.py --output-dir "$ARTIFACT_DIR/fonts"
