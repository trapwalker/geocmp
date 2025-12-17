"""Command-line interface for geocmp."""

import logging
import sys
import tempfile
import traceback
import webbrowser
from pathlib import Path
from typing import Optional

import typer
from .i18n import _, setup_i18n

from .glob_expander import expand_globs
from .html_maker import generate_html


logger = logging.getLogger(__name__)

ITEMDIV = '\n\t'

app = typer.Typer(help="Geocmp utility for compare GIS-files on the map")


def setup_logging(verbose: bool = False) -> None:
    """
    Setup logging with standard handlers.

    Args:
        verbose: Enable debug logging
    """
    level = logging.DEBUG if verbose else logging.INFO
    formatter = logging.Formatter('%(levelname)s: %(message)s')
    info_handler = logging.StreamHandler(sys.stderr)
    info_handler.setLevel(level)
    info_handler.setFormatter(formatter)
    info_handler.addFilter(lambda record: record.levelno < logging.WARNING)

    error_formatter = logging.Formatter('%(asctime)s - %(levelname)s: %(message)s')
    error_handler = logging.StreamHandler(sys.stderr)
    error_handler.setLevel(logging.WARNING)
    error_handler.setFormatter(error_formatter)

    logging.basicConfig(level=level, handlers=[info_handler, error_handler])


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

        if out:
            logger.debug("Сохранение результата в файл: %s", out)
        elif open_browser:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', prefix='geocmp_', delete=False) as temp_file:
                out = Path(temp_file.name)
            logger.debug("Сохранение во временный файл: %s", out)

        if out is None:
            logger.debug("Вывод в stdout")
            print(html_content)
        else:
            out.write_text(html_content)
            if open_browser:
                logger.debug("Открытие в браузере: %s", out)
                webbrowser.open(f'file://{out.resolve()}')

    except KeyboardInterrupt:
        print("\nOperation interrupted by user (Ctrl-C)", file=sys.stderr)
        raise typer.Exit(code=130)
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        if verbose:
            traceback.print_exc()
        raise typer.Exit(code=2)


if __name__ == "__main__":
    app()
