# Быстрое руководство по добавлению переводов

## Добавление нового переводимого текста

### 1. В коде используйте функцию `_()`

```python
from .i18n import _

# Для help-текста
help=_("Enable verbose logging")

# Для сообщений в лог
logger.info(_("Processing file: %s"), filename)

# Для вывода пользователю
print(_("Operation completed successfully"))
```

### 2. Добавьте перевод в .po файл

Откройте `locales/ru_RU/LC_MESSAGES/geocmp.po` и добавьте:

```
msgid "Enable verbose logging"
msgstr "Включить подробное логирование"
```

### 3. Скомпилируйте переводы

```bash
make compile-translations
```

### 4. Протестируйте

```bash
# Русская локаль
LANG=ru_RU.UTF-8 uv run geocmp --help

# Английская локаль
LANG=en_US.UTF-8 uv run geocmp --help
```

## Что можно локализовать

✅ **Можно:**
- Пользовательские сообщения (`logger.info()`, `print()`)
- Help-тексты аргументов и опций
- Описание команд (`@app.command(help=...)`)
- Сообщения об ошибках

❌ **Нельзя (легко):**
- Встроенные команды Typer (`--help`, `--install-completion`)
- Стандартные сообщения Click/Typer

## Примеры

### Пример 1: Локализация опции

```python
verbose: bool = typer.Option(
    False,
    "--verbose", "-v",
    help=_("Enable verbose logging")  # ← Используйте _()
)
```

В .po файле:
```
msgid "Enable verbose logging"
msgstr "Включить подробное логирование"
```

### Пример 2: Локализация сообщения с параметрами

```python
# В коде
logger.warning(_("Cannot read file %s: %s"), filepath, error)
```

В .po файле:
```
msgid "Cannot read file %s: %s"
msgstr "Не удаётся прочитать файл %s: %s"
```

### Пример 3: Многострочный текст

```python
@app.command(
    help=_(
        "A utility for creating an interactive HTML map "
        "that allows rapid switching between files."
    )
)
```

В .po файле:
```
msgid ""
"A utility for creating an interactive HTML map "
"that allows rapid switching between files."
msgstr ""
"Утилита для создания интерактивной HTML-карты, "
"позволяющей быстро переключаться между файлами."
```

## Важные правила

1. **Всегда используйте `_()` для пользовательского текста**
2. **Не используйте `_()` в докстрингах** (они для документации кода)
3. **Сохраняйте спецификаторы формата** (`%s`, `%d`) в переводах
4. **Компилируйте после каждого изменения** `.po` файла

## Структура файлов

```
locales/
└── ru_RU/
    └── LC_MESSAGES/
        ├── geocmp.po   # Исходник (редактируйте этот файл)
        └── geocmp.mo   # Скомпилированный (генерируется автоматически)
```

## Добавление нового языка

```bash
# 1. Создайте структуру
mkdir -p locales/fr_FR/LC_MESSAGES

# 2. Скопируйте шаблон
cp locales/ru_RU/LC_MESSAGES/geocmp.po locales/fr_FR/LC_MESSAGES/geocmp.po

# 3. Отредактируйте заголовок
# Language: fr_FR
# Language-Team: French

# 4. Переведите все msgstr

# 5. Скомпилируйте
make compile-translations
```

## Отладка

Проверка текущей локали:
```bash
locale
echo $LANG
```

Принудительная установка локали:
```bash
export LANG=ru_RU.UTF-8
uv run geocmp --help
```

Проверка скомпилированных переводов:
```bash
# Должен быть недавний .mo файл
ls -l locales/ru_RU/LC_MESSAGES/geocmp.mo
```

## Ссылки

- Полная документация: [i18n-typer.md](i18n-typer.md)
- GNU gettext: https://www.gnu.org/software/gettext/
- Python gettext: https://docs.python.org/3/library/gettext.html
