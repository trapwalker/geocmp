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

ITEMDIV = "\n\t"
TEMP_FILE_PREFIX = "geocmp_"
TEMP_FILE_SUFFIX = ".html"
TEMP_FILE_PATTERN = f"{TEMP_FILE_PREFIX}*{TEMP_FILE_SUFFIX}"

setup_i18n()
app = typer.Typer(help=_("Geocmp utility for compare GIS-files on the map"))


def setup_logging(verbose: bool = False) -> None:
    """
    Setup logging with standard handlers.

    Args:
        verbose: Enable debug logging
    """
    level = logging.DEBUG if verbose else logging.INFO
    formatter = logging.Formatter("%(levelname)s: %(message)s")
    info_handler = logging.StreamHandler(sys.stderr)
    info_handler.setLevel(level)
    info_handler.setFormatter(formatter)
    info_handler.addFilter(lambda record: record.levelno < logging.WARNING)

    error_formatter = logging.Formatter("%(asctime)s - %(levelname)s: %(message)s")
    error_handler = logging.StreamHandler(sys.stderr)
    error_handler.setLevel(logging.WARNING)
    error_handler.setFormatter(error_formatter)

    logging.basicConfig(level=level, handlers=[info_handler, error_handler])


@app.command(
    help=_(
        "A utility for creating an interactive HTML map that allows rapid switching "
        "between multiple GeoJSON files for visual comparison. "
        "The tool generates a single HTML file with a layer control panel to toggle between datasets."
    )
)
def main(
    patterns: list[str] = typer.Argument(
        ...,
        help=_("Glob pattern(s) or GeoJSON file(s) (e.g., 'data/*.geojson' or file1.geojson file2.geojson)"),
    ),
    out: Optional[Path] = typer.Option(
        None, "--out", "-o", help=_("Output file path (default: STDOUT)")
    ),
    verbose: bool = typer.Option(False, "--verbose", "-v", help=_("Enable verbose logging")),
    title: str = typer.Option(None, "--title", "-t", help=_("Title of output file")),
    open_browser: bool = typer.Option(False, "--open-browser", "-b", help=_("Open in browser")),
    ext_css: Path = typer.Option(None, "--ext-css", help=_("Path to extra CSS")),
    ext_js: Path = typer.Option(None, "--ext-js", help=_("Path to extra JS code")),
) -> None:
    """Main command entry point.

    Note: The user-facing help text is localized via @app.command(help=...).
    This docstring is for code documentation only.
    """
    setup_logging(verbose)

    try:
        logger.debug(
            _("Received GeoJSON paths in arguments (%d):%s%s"),
            len(patterns),
            ITEMDIV,
            ITEMDIV.join(patterns),
        )
        geojson_paths = expand_globs(patterns)
        logger.debug(
            _("Documents to compare (%d):%s%s"),
            len(geojson_paths),
            ITEMDIV,
            ITEMDIV.join(map(str, geojson_paths)),
        )

        html_content = generate_html(geojson_paths, title=title, ext_css=ext_css, ext_js=ext_js)

        if out:
            logger.debug(_("Saving result to file: %s"), out)
        elif open_browser:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=TEMP_FILE_SUFFIX, prefix=TEMP_FILE_PREFIX, delete=False
            ) as temp_file:
                out = Path(temp_file.name)
            logger.debug(_("Saving to temporary file: %s"), out)

        if out is None:
            logger.debug(_("Output to stdout"))
            print(html_content)
        else:
            out.write_text(html_content)
            if open_browser:
                logger.debug(_("Opening in browser: %s"), out)
                webbrowser.open(f"file://{out.resolve()}")

    except KeyboardInterrupt:
        print(_("\nOperation interrupted by user (Ctrl-C)"), file=sys.stderr)
        raise typer.Exit(code=130)
    except Exception as e:
        print(_("Fatal error: %s") % e, file=sys.stderr)
        if verbose:
            traceback.print_exc()
        raise typer.Exit(code=2)


@app.command(help=_("Remove all temporary files created by geocmp"))
def clean(
    verbose: bool = typer.Option(False, "--verbose", "-v", help=_("Enable verbose logging")),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help=_("Show what would be deleted without deleting")),
) -> None:
    """Clean up temporary files created by geocmp.

    Note: The user-facing help text is localized via @app.command(help=...).
    This docstring is for code documentation only.
    """
    setup_logging(verbose)

    temp_dir = Path(tempfile.gettempdir())
    pattern = TEMP_FILE_PATTERN

    try:
        temp_files = list(temp_dir.glob(pattern))

        if not temp_files:
            print(_("No temporary files found"))
            return

        print(_("Found %d temporary file(s):") % len(temp_files))
        for temp_file in temp_files:
            file_size = temp_file.stat().st_size
            print(f"  {temp_file.name} ({file_size:,} bytes)")

        if dry_run:
            print(_("\nDry run mode - no files deleted"))
            return

        deleted_count = 0
        total_size = 0

        for temp_file in temp_files:
            try:
                file_size = temp_file.stat().st_size
                temp_file.unlink()
                deleted_count += 1
                total_size += file_size
                logger.debug(_("Deleted: %s"), temp_file)
            except Exception as e:
                logger.warning(_("Failed to delete %s: %s"), temp_file, e)

        print(_("\nDeleted %d file(s), freed %s bytes") % (deleted_count, f"{total_size:,}"))

    except Exception as e:
        print(_("Error during cleanup: %s") % e, file=sys.stderr)
        if verbose:
            traceback.print_exc()
        raise typer.Exit(code=2)


def cli_entry_point() -> None:
    """
    Main CLI entry point with backward compatibility.

    Automatically inserts 'main' command if first argument is not a known command.
    This allows using 'geocmp file.geojson' instead of 'geocmp main file.geojson'.
    """
    import sys

    # For backward compatibility: if first arg is not a known command, insert "main"
    # Known commands and options that should not trigger auto-insertion
    known_args = {"main", "clean", "--help", "-h", "--install-completion", "--show-completion"}

    if len(sys.argv) > 1 and sys.argv[1] not in known_args and not sys.argv[1].startswith("-"):
        sys.argv.insert(1, "main")

    app()


if __name__ == "__main__":
    cli_entry_point()
