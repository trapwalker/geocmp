from typing import Callable, Any, Dict
import logging
from .i18n import _

logger = logging.getLogger(__name__)


# Property to style mapping strategies
_PROPERTY_MAPPERS: Dict[str, Callable[[Any], dict[str, Any]]] = {
    "marker-color": lambda v: {"color": v},
    "fill": lambda v: {"fillColor": v},
    "stroke": lambda v: {"color": v},
    "fill-opacity": lambda v: {"fillOpacity": float(v)},
    "stroke-width": lambda v: {"weight": float(v)},
}


def update_styles(feature: Dict[str, Any]) -> None:
    """
    Apply styles to a feature (mutates input value).
    """
    def nothing_to_do(_: Any) -> Dict:
        return {}

    style = feature.setdefault("style", {})

    for prop_key, prop_value in feature.get("properties", {}).items():
        try:
            style.update(_PROPERTY_MAPPERS.get(prop_key, nothing_to_do)(prop_value))
        except (ValueError, TypeError) as e:
            logger.warning(_("Cannot process style parameter %s=%r: %s"), prop_key, prop_value, e)


def is_valid_feature_collection(geojson_data: dict) -> bool:
    """Check if object is a valid FeatureCollection."""
    if not isinstance(geojson_data, dict):
        return False
    if geojson_data.get("type") != "FeatureCollection":
        return False
    if not isinstance(geojson_data.get("features"), list):
        return False
    return True
