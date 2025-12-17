#!/bin/bash
# Compile all .po files to .mo files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOCALES_DIR="$PROJECT_ROOT/locales"

echo "Compiling translations..."

# Find all .po files and compile them
find "$LOCALES_DIR" -name "*.po" -type f | while read -r po_file; do
    mo_file="${po_file%.po}.mo"
    echo "  $po_file -> $mo_file"
    msgfmt "$po_file" -o "$mo_file"
done

echo "Done!"
