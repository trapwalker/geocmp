from . import geojson_tools
from .i18n import _

import os
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


BASE_PATH = Path(__file__).parent
TEMPLATES_PATH = BASE_PATH / "templates"
TEMPLATE_HTML = TEMPLATES_PATH / "template.html"
TEMPLATE_CSS = TEMPLATES_PATH / "style.css"
TEMPLATE_JS = TEMPLATES_PATH / "map.js"


def make_layers_data_list(geojson_paths: list[Path]) -> list[dict]:
    """
    Load, validate and stylize all GeoJSON files.
    Returns list of layers (can be empty if all files are invalid).
    """
    layers_data = []

    common_path = Path(os.path.commonpath([p.as_posix() for p in geojson_paths]))
    trimmed_paths = [p.relative_to(common_path) for p in geojson_paths]

    for geojson_path, trimmed_path in zip(geojson_paths, trimmed_paths):
        try:
            with geojson_path.open(encoding="utf-8") as f:
                geojson_data = json.load(f)
        except FileNotFoundError as e:
            logger.warning(_("Cannot read %s: %s"), geojson_path, e)
            continue
        except json.decoder.JSONDecodeError as e:
            logger.warning(_("Invalid file format %s: %s"), geojson_path, e)
            continue

        if not geojson_tools.is_valid_feature_collection(geojson_data):
            logger.warning(_("Invalid GeoJSON format: %s"), geojson_path)
            continue

        map(geojson_tools.update_styles, geojson_data.get("features", []))

        layers_data.append(
            {
                "name": f"{trimmed_path}",
                "source": str(geojson_path),
                "data": geojson_data,
                "features": len(geojson_data.get("features", [])),
            }
        )

    return layers_data


def generate_html(
    geojson_paths: list[Path],
    title: str | None = None,
    ext_css: Path | None = None,
    ext_js: Path | None = None,
) -> str:
    layers_data = make_layers_data_list(geojson_paths)

    if not layers_data:
        raise ValueError("No geojson data found.")

    return TEMPLATE_HTML.read_text(encoding="utf-8").format(
        title=title or " vs ".join(layers_data["name"] for layers_data in layers_data),
        css=TEMPLATE_CSS.read_text(encoding="utf-8"),
        ext_css=ext_css.read_text(encoding="utf-8") if ext_css else "",
        js=TEMPLATE_JS.read_text(encoding="utf-8"),
        ext_js=ext_js.read_text(encoding="utf-8") if ext_js else "",
        layers_json=json.dumps(layers_data, ensure_ascii=False, separators=(",", ":")),
    )
