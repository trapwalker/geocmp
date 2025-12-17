#!/usr/bin/env python3
"""Compile all .po files to .mo files (cross-platform)."""

import subprocess
import sys
from pathlib import Path


def compile_po_file(po_file: Path) -> bool:
    """Compile a single .po file to .mo format.

    Args:
        po_file: Path to .po file

    Returns:
        True if successful, False otherwise
    """
    mo_file = po_file.with_suffix('.mo')

    try:
        result = subprocess.run(
            ['msgfmt', str(po_file), '-o', str(mo_file)],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"  ✓ {po_file.relative_to(PROJECT_ROOT)} -> {mo_file.relative_to(PROJECT_ROOT)}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Failed to compile {po_file}: {e.stderr}", file=sys.stderr)
        return False
    except FileNotFoundError:
        print("Error: msgfmt not found. Please install gettext tools.", file=sys.stderr)
        print("  - macOS: brew install gettext", file=sys.stderr)
        print("  - Ubuntu/Debian: apt-get install gettext", file=sys.stderr)
        print("  - Windows: https://mlocati.github.io/articles/gettext-iconv-windows.html", file=sys.stderr)
        return False


if __name__ == '__main__':
    SCRIPT_DIR = Path(__file__).parent
    PROJECT_ROOT = SCRIPT_DIR.parent
    LOCALES_DIR = PROJECT_ROOT / 'locales'

    if not LOCALES_DIR.exists():
        print(f"Error: Locales directory not found: {LOCALES_DIR}", file=sys.stderr)
        sys.exit(1)

    print("Compiling translations...")

    # Find all .po files
    po_files = list(LOCALES_DIR.rglob('*.po'))

    if not po_files:
        print("No .po files found.")
        sys.exit(0)

    # Compile all files
    success_count = 0
    failed_count = 0

    for po_file in po_files:
        if compile_po_file(po_file):
            success_count += 1
        else:
            failed_count += 1

    print(f"\nDone! Compiled: {success_count}, Failed: {failed_count}")

    if failed_count > 0:
        sys.exit(1)
