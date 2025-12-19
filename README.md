# geocmp

CLI утилита для визуального сравнения GeoJSON-файлов.

## Описание

`geocmp` генерирует автономный HTML-файл с интерактивной картой, позволяющий быстро переключаться между несколькими GeoJSON-документами для их визуального сравнения. Все данные встраиваются в единый HTML-файл, который можно открыть в браузере без подключения к интернету (кроме загрузки карты OSM и библиотек Leaflet).

## Возможности

- Визуализация нескольких GeoJSON-файлов на одной карте
- Быстрое переключение между слоями с помощью вкладок или горячих клавиш
- Поддержка glob-паттернов для указания файлов
- Автоматическое применение стилей из свойств GeoJSON (marker-color, fill, stroke и т.д.)
- Popup с информацией о свойствах объектов при клике
- Сохранение позиции карты в URL (lat, lng, zoom)
- Полностью автономный HTML-файл

## Установка

```bash
# Используя uv (рекомендуется)
uv pip install -e .

# Или используя pip
pip install -e .
```

## Использование

### Базовое использование

```bash
# Сравнить два GeoJSON файла
geocmp file1.geojson file2.geojson

# Вывести результат в файл
geocmp -o output.html file1.geojson file2.geojson

# Использовать glob-паттерны
geocmp "*.geojson"
geocmp "data/**/*.geojson"
```

### Опции командной строки

```
positional arguments:
  args                  Список входных GeoJSON-файлов (поддерживает glob-паттерны)

options:
  -h, --help            Показать справку
  -v, --verbose         Включить подробное логирование (DEBUG)
  -o OUT, --out OUT     Путь к файлу для сохранения результата (по умолчанию stdout)
  -b, --open-browser    Открыть результат в браузере
  -t TITLE, --title TITLE
                        Заголовок HTML-документа (по умолчанию формируется автоматически)
  --ext_css EXT_CSS     Путь к дополнительному CSS-файлу
  --ext_js EXT_JS       Путь к дополнительному JS-файлу
```

### Примеры

```bash
# Вывести HTML в stdout
geocmp data/region1.geojson data/region2.geojson

# Сохранить в файл с подробным логированием
geocmp -v -o comparison.html region*.geojson

# Установить свой заголовок
geocmp --title "Сравнение регионов" -o map.html region1.geojson region2.geojson

# Использовать рекурсивный поиск
geocmp -o all_data.html "data/**/*.geojson"

# Открыть результат в браузере сразу после генерации
geocmp -o map.html -b region1.geojson region2.geojson

# Открыть во временном файле (без сохранения)
geocmp -b region1.geojson region2.geojson

# Добавить пользовательские стили и скрипты
geocmp -o map.html --ext-css custom.css --ext-js custom.js region1.geojson region2.geojson
```

## Управление интерактивной картой

После открытия сгенерированного HTML-файла в браузере доступны следующие возможности:

### Горячие клавиши

**Переключение слоёв:**
- **1-9, 0** - переключиться на слой по номеру (1 = первый слой, 0 = десятый слой)
- **T, E, Пробел** - циклическое переключение на следующий активный слой

**Управление интерфейсом:**
- **I** - скрыть/показать информационную панель
- **H** - показать справку по горячим клавишам
- **⚙ (кнопка)** - открыть настройки подложки

**Работа с чекбоксами:**
- **Клик по элементу списка** - переключиться на слой
- **Клик по чекбоксу** - включить/выключить слой (переключение по T/E/Пробел работает только по активным слоям)

### Работа с картой

- **Левая кнопка мыши + перетаскивание** - перемещение карты
- **Колесо мыши** - приближение/отдаление
- **Клик по объекту** - показать popup с информацией о свойствах
- **Позиция карты сохраняется в URL** - можно делиться ссылкой с нужным zoom и центром

### Настройки подложки

Нажмите на кнопку **⚙** (шестерёнка) в левом верхнем углу:
- **Base Layer** - выбор типа карты (OSM, спутник, топографическая, CartoDB)
- **Opacity** - прозрачность подложки (0-100%)
- **Data Opacity** - прозрачность слоёв данных (0-100%)
- **Background** - переключение фона (светлый/тёмный)

## Формат данных

### Поддерживаемые GeoJSON структуры

Утилита работает с GeoJSON документами типа `FeatureCollection`:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [37.6, 55.75]
      },
      "properties": {
        "name": "Москва",
        "marker-color": "#ff0000"
      }
    }
  ]
}
```

### Поддерживаемые свойства стилизации

Утилита автоматически применяет стили из следующих свойств объектов:

- `marker-color` - цвет маркера/линии
- `fill` - цвет заливки
- `stroke` - цвет обводки
- `fill-opacity` - прозрачность заливки
- `stroke-width` - толщина обводки
- `marker-size` - размер маркера (small/medium/large)
- `radius` - радиус маркера в пикселях

Пример с стилями:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[...]]
  },
  "properties": {
    "name": "Зона А",
    "fill": "#00ff00",
    "fill-opacity": 0.5,
    "stroke": "#006600",
    "stroke-width": 2
  }
}
```

## Кастомизация

Вы можете добавить собственные стили и скрипты к генерируемой карте с помощью параметров `--ext-css` и `--ext-js`.

### Пользовательский CSS

Создайте файл с дополнительными стилями:

```css
/* custom.css */
#info {
    border: 2px solid #ff6600;
    background: rgba(255, 230, 200, 0.95) !important;
}

.layer-item.active {
    background: linear-gradient(90deg, #4CAF50, #45a049);
}
```

Примените стили:

```bash
geocmp -o map.html --ext-css custom.css data/*.geojson
```

### Пользовательский JavaScript

В директории `examples/` есть простой пример пользовательского JavaScript:

```bash
# Подключить пользовательский JavaScript
geocmp -o map.html --ext-js examples/custom.js data/*.geojson
```

После открытия карты:
- Нажмите **Q** чтобы увидеть тестовое сообщение
- Это демонстрирует, что пользовательский код работает
- На основе этого примера можно создать любую функциональность

Или создайте свой скрипт:

```javascript
// my-custom.js
// Пример: автоматическое переключение слоёв
let autoSwitch = false;

document.addEventListener('keydown', function(event) {
    if (event.key === 'a' || event.key === 'A') {
        autoSwitch = !autoSwitch;
        if (autoSwitch) {
            setInterval(() => {
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 't'}));
            }, 3000);
        }
    }
});
```

Примените скрипт:

```bash
geocmp -o map.html --ext-js my-custom.js data/*.geojson
```

### Комбинирование

Вы можете использовать оба параметра одновременно:

```bash
geocmp -o map.html --ext-css custom.css --ext-js custom.js data/*.geojson
```

### Доступные элементы для кастомизации

- `#map` - контейнер карты
- `#base-layer-control` - панель управления подложкой
- `#tabs` - панель слоёв данных
- `#info` - информационная панель
- `.layer-item` - элемент списка слоёв
- `.layer-item.active` - активный слой
- `.leaflet-control-settings` - кнопка настроек

### Примеры

Готовые примеры кастомизации находятся в директории `examples/`:

```bash
# Использовать готовые примеры
geocmp -o map.html --ext-css examples/custom.css --ext-js examples/custom.js data/*.geojson
```

Подробнее см. [examples/README.md](examples/README.md)

## Требования

- Python >= 3.10
- Минимальные зависимости (typer, xxhash, natsort)
- Браузер с поддержкой JavaScript для просмотра результата
- `msgfmt` (gettext tools) - для компиляции переводов (опционально)

## Разработка

### Быстрый старт для разработчиков

Проект использует Makefile для упрощения разработки:

```bash
# Показать все доступные команды
make help

# Полная настройка окружения разработчика
make dev-setup

# Или по шагам:
make install-dev              # Установить в режиме разработчика
make compile-translations     # Скомпилировать переводы
```

### Основные команды Make

```bash
make install-dev              # Установка в режиме разработчика с dev зависимостями
make sync                     # Синхронизация зависимостей (uv sync)
make compile-translations     # Компиляция файлов переводов (.po -> .mo)
make format                   # Форматирование кода (black)
make format-check             # Проверка форматирования без изменений
make lint                     # Проверка кода (flake8, mypy)
make test                     # Запуск тестов
make test-cov                 # Запуск тестов с отчетом о покрытии
make clean                    # Очистка временных файлов
make build                    # Сборка пакета
make check                    # Запуск всех проверок (format-check, lint, test)
make all                      # Полный цикл: clean, compile, format, lint, test
```

### Работа с переводами

Все пользовательские сообщения автоматически переводятся на язык системы (если доступен перевод).

Компиляция переводов (кросс-платформенно):
```bash
make compile-translations
# или напрямую
python scripts/compile_translations.py
```

Подробнее см. [locales/README.md](locales/README.md)

Документация:
- Быстрое руководство: [docs/i18n-quick-guide.md](docs/i18n-quick-guide.md)
- Подробная информация: [docs/i18n-typer.md](docs/i18n-typer.md)

### Без использования Make

Если Make недоступен, можно использовать команды напрямую:

```bash
# Установка для разработки
uv pip install -e ".[dev]"

# Компиляция переводов
python scripts/compile_translations.py

# Форматирование
uv run black src/geocmp/

# Линтеры
uv run flake8 src/geocmp/
uv run mypy src/geocmp/

# Тесты
uv run pytest
```

## Структура проекта

```
geocmp/
├── src/
│   └── geocmp/
│       ├── __init__.py          - Пакет
│       ├── __main__.py          - Точка входа CLI
│       ├── cli.py               - CLI интерфейс (Typer)
│       ├── geojson_tools.py     - Валидация и стилизация GeoJSON
│       ├── glob_expander.py     - Обработка glob-паттернов
│       ├── html_maker.py        - Генерация HTML
│       ├── i18n.py              - Интернационализация
│       ├── utils.py             - Вспомогательные функции
│       └── templates/           - Шаблоны для HTML
│           ├── template.html    - HTML-шаблон
│           ├── style.css        - Стили карты
│           └── map.js           - Логика карты и переключения слоев
├── locales/                     - Переводы
│   ├── README.md                - Документация по переводам
│   └── ru_RU/
│       └── LC_MESSAGES/
│           ├── geocmp.po        - Русский перевод (исходник)
│           └── geocmp.mo        - Скомпилированный перевод
├── scripts/
│   ├── compile_translations.py  - Компиляция переводов (Python)
│   └── compile_translations.sh  - Компиляция переводов (Bash)
├── docs/
│   ├── i18n-quick-guide.md      - Быстрое руководство по i18n
│   ├── i18n-domains.md          - Работа с доменами переводов
│   └── i18n-typer.md            - Подробная документация по i18n в Typer
├── examples/
│   ├── README.md                - Руководство по кастомизации
│   ├── custom.css               - Пример пользовательских стилей
│   └── custom.js                - Пример пользовательских скриптов
├── Makefile                     - Задачи для разработки
└── pyproject.toml               - Конфигурация проекта
```

## Участие в разработке

См. [CONTRIBUTING.md](CONTRIBUTING.md) для информации о том, как внести вклад в проект.

## Лицензия

MIT

## Автор

Sergey Pankov <svpmailbox@gmail.com>
