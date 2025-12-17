"""Command-line interface for massunpacker."""

import logging
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.logging import RichHandler
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn, TimeRemainingColumn
from .i18n import _, setup_i18n

from .glob_expander import expand_globs
from .html_maker import generate_html


logger = logging.getLogger(__name__)

ITEMDIV = '\n\t'

app = typer.Typer(help="Geocmp utility for compare GIS-files on the map")
console = Console()
err_console = Console(stderr=True)


def setup_logging(verbose: bool = False) -> None:
    """
    Setup logging with rich handler.

    Args:
        verbose: Enable debug logging
    """
    # LOG_FORMAT = "[%(levelname)s] %(message)s"
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[
            RichHandler(
                console=err_console,
                show_time=False,
                show_path=False,
                markup=True,
                rich_tracebacks=True,
            )
        ],
    )

    error_handler = RichHandler(
        console=err_console,
        show_time=True,
        show_path=False,
        markup=True,
        rich_tracebacks=True,
    )
    error_handler.setLevel(logging.WARNING)
    logging.getLogger().addHandler(error_handler)


@app.command()
def main(
    patterns: list[str] = typer.Argument(..., help="Glob pattern(s) or GeoJSON file(s) (e.g., 'data/*.geojson' or file1.geojson file2.geojson)"),
    out: Optional[Path] = typer.Option(
        None, "--out", "-o", help="Output file path (default: STDOUT)"
    ),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable verbose logging"),
    title: str = typer.Option(None, "--title", "-t", help="Title of output file"),
    open_browser: bool = typer.Option(False, "--open-browser", "-b", help="Open in browser"),
    ext_css: Path = typer.Option(None, "--ext-css", help="Path to extra CSS"),
    ext_js: Path = typer.Option(None, "--ext-js", help="Path to extra JS code"),
) -> None:
    """
    A utility for creating an interactive HTML map that allows rapid switching between multiple GeoJSON files for visual comparison.
    The tool generates a single HTML file with a layer control panel to toggle between datasets.

    Examples:
        geocmp "data/*.Geojson" --out=comparsion.html
        geocmp *.example_[abc].geojson
        geocmp file1.geojson file2.geojson file3.geojson
    """
    setup_i18n()
    setup_logging(verbose)

    try:
        logger.debug(f"Получены пути к GeoJSON в параметрах ({len(patterns)}):{ITEMDIV}{ITEMDIV.join(patterns)}")
        geojson_paths = expand_globs(patterns)
        logger.debug(f"Документы к сравнению ({len(geojson_paths)}):{ITEMDIV}{ITEMDIV.join(map(str, geojson_paths))}")

        html_content = generate_html(geojson_paths, title=title, ext_css=ext_css, ext_js=ext_js)
        if out is None:
            logger.debug("Вывод в stdout")
            console.print(html_content)
        else:
            logger.debug("Сохранение результата в файл: %s", out)
            out.write_text(html_content)
    except KeyboardInterrupt:
        err_console.print("\n[red]Operation interrupted by user (Ctrl-C)[/red]")
        raise typer.Exit(code=130)
    except Exception as e:
        err_console.print(f"[red]Fatal error: {e}[/red]")
        if verbose:
            console.print_exception()
        raise typer.Exit(code=2)


if __name__ == "__main__":
    app()
