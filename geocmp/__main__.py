from geocmp.glob_expander import expand_globs
from geocmp.html_maker import generate_html

from pathlib import Path
import sys
import argparse
import logging

logger = logging.getLogger(__name__)

ITEMDIV = '\n\t'
LOG_FORMAT = "[%(levelname)s] %(message)s"


def main(args=None):
	if args is None:
		args = sys.argv[1:]

	parser = argparse.ArgumentParser(description="Генерация HTML компаратора GeoJSON файлов")
	parser.add_argument(
		"-v", "--verbose",
		action="store_true",
		help="Включить подробное логирование (DEBUG)",
	)
	parser.add_argument(
		"-o", "--out",
		type=Path,
		default=None,
		help="Путь к файлу, куда сохранить результат (по умолчанию stdout)",
	)
	parser.add_argument(
		"--title",
		default=None,
		help="Заголовок HTML-документа (по умолчанию формируется автоматически)",
	)
	parser.add_argument(
		"--ext_css",
		type=Path,
		default=None,
		help="Путь к дополнительному CSS-файлу (не обязательно)",
	)
	parser.add_argument(
		"--ext_js",
		type=Path,
		default=None,
		help="Путь к дополнительному JS-файлу (не обязательно)",
	)
	parser.add_argument(
		"args",
		nargs="+",
		help="Список входных GeoJSON-файлов",
	)
	parsed = parser.parse_args(args)

	logging.basicConfig(
		level=logging.DEBUG if parsed.verbose else logging.INFO,
		stream=sys.stderr,
		format=LOG_FORMAT,
	)

	try:
		logger.debug(f"Получены пути к GeoJSON в параметрах ({len(parsed.args)}):{ITEMDIV}{ITEMDIV.join(parsed.args)}")
		geojson_paths = expand_globs(parsed.args)
		logger.debug(f"Документы к сравнению ({len(geojson_paths)}):{ITEMDIV}{ITEMDIV.join(map(str, geojson_paths))}")
		html_content = generate_html(
			geojson_paths,
			title=parsed.title,
			ext_css=parsed.ext_css,
			ext_js=parsed.ext_js,
		)
		if parsed.out is None:
			logger.debug("Вывод в stdout")
			sys.stdout.write(html_content)
		else:
			logger.debug("Сохранение результата в файл: %s", parsed.out)
			parsed.out.write_text(html_content, encoding="utf-8")
	except (ValueError, NotImplementedError) as e:
		logger.error(e)
		sys.exit(1)


if __name__ == '__main__':
	main()
