from pathlib import Path
from typing import Iterable, Union


def expand_glob(pattern: str, base: Path = Path()) -> Iterable[Path]:
    return {p.resolve() for p in base.rglob(pattern) if p.is_file()}


def expand_globs(patterns: Iterable[Union[str, Path]]) -> list[Path]:
    paths = set()
    for pattern in patterns:
        paths.update(expand_glob(pattern))

    return list(sorted(paths, key=str))
