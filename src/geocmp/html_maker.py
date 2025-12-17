from . import geojson_tools

import os
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


BASE_PATH = Path(__file__).parent
TEMPLATES_PATH = BASE_PATH / 'templates'
TEMPLATE_HTML = TEMPLATES_PATH / 'template.html'
TEMPLATE_CSS = TEMPLATES_PATH / 'style.css'
TEMPLATE_JS = TEMPLATES_PATH / 'map.js'


def make_layers_data_list(geojson_paths: list[Path]) -> list[dict]:
	"""
	Загружает, валидирует и стилизует все GeoJSON файлы.
	Возвращает список слоев (может быть пустой если все файлы невалидны).
	"""
	layers_data = []

	common_path = Path(os.path.commonpath([p.as_posix() for p in geojson_paths]))
	trimmed_paths = [p.relative_to(common_path) for p in geojson_paths]

	for geojson_path, trimmed_path in zip(geojson_paths, trimmed_paths):
		try:
			with geojson_path.open(encoding='utf-8') as f:
				geojson_data = json.load(f)
		except FileNotFoundError as e:
			logger.warning(f"Не удаётся прочитать {geojson_path}: {e}")
			continue
		except json.decoder.JSONDecodeError as e:
			logger.warning(f"Некорректный формат файла {geojson_path}: {e}")
			continue

		if not geojson_tools.is_valid_feature_collection(geojson_data):
			logger.warning('Некорректный формат GeoJSON: %s', geojson_path)
			continue

		map(geojson_tools.update_styles, geojson_data.get('features', []))

		layers_data.append({
			"name": f'{trimmed_path}',
			"source": str(geojson_path),
			"data": geojson_data,
			"features":  len(geojson_data.get('features', []))
		})

	return layers_data


def generate_html(geojson_paths: list[Path], title: str = None, ext_css: Path = None, ext_js: Path = None) -> str:
	layers_data = make_layers_data_list(geojson_paths)

	if not layers_data:
		raise ValueError('No geojson data found.')

	return TEMPLATE_HTML.read_text(encoding='utf-8').format(
		title=title or ' vs '.join(layers_data['name'] for layers_data in layers_data),
		css=TEMPLATE_CSS.read_text(encoding='utf-8'),
		ext_css=ext_css and ext_css.read_text(encoding='utf-8') or '',  # TODO: add to template
		js=TEMPLATE_JS.read_text(encoding='utf-8'),
		ext_js=ext_js and ext_js.read_text(encoding='utf-8') or '',  # TODO: add to template
		layers_json=json.dumps(layers_data, ensure_ascii=False, separators=(',', ':')),
	)
