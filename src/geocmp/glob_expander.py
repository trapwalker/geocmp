from pathlib import Path
from typing import Iterable


def expand_glob(pattern: str, base: Path = Path()) -> Iterable[Path]:
    return {p.resolve() for p in base.rglob(pattern) if p.is_file()}


def expand_globs(patterns: Iterable[str]) -> list[Path]:
    paths: set[Path] = set()
    for pattern in patterns:
        paths.update(expand_glob(pattern))

    return list(sorted(paths, key=str))
