import glob
from pathlib import Path
from typing import Iterable


def expand_glob(pattern: str) -> Iterable[Path]:
    """
    Expand a glob pattern to matching file paths.

    Supports standard glob patterns:
    - '*.json' - files in current directory
    - 'data/*.json' - files in specific directory
    - '**/*.json' - files in all subdirectories (recursive)
    - 'data/**/*.json' - files in subdirectories of data/

    Args:
        pattern: Glob pattern (shell-style wildcards)

    Returns:
        Set of resolved Path objects for matching files
    """
    # Use glob.glob with recursive=True for proper ** handling
    matched_paths = glob.glob(pattern, recursive=True)
    # Filter only files and convert to Path objects
    return {Path(p).resolve() for p in matched_paths if Path(p).is_file()}


def expand_globs(patterns: Iterable[str]) -> list[Path]:
    """
    Expand multiple glob patterns and return sorted unique file paths.

    Args:
        patterns: Iterable of glob patterns

    Returns:
        Sorted list of unique Path objects
    """
    paths: set[Path] = set()
    for pattern in patterns:
        paths.update(expand_glob(pattern))

    return list(sorted(paths, key=str))
