# Translations

This directory contains translation files for geocmp.

## Structure

```
locales/
└── ru_RU/
    └── LC_MESSAGES/
        ├── geocmp.po   # Translation source (edit this)
        └── geocmp.mo   # Compiled translation (generated)
```

## Working with translations

### Editing translations

1. Edit the `.po` file for your language:
   ```bash
   nano locales/ru_RU/LC_MESSAGES/geocmp.po
   ```

2. Compile the `.po` file to `.mo`:
   ```bash
   msgfmt locales/ru_RU/LC_MESSAGES/geocmp.po -o locales/ru_RU/LC_MESSAGES/geocmp.mo
   ```

### Adding a new language

1. Create directory structure:
   ```bash
   mkdir -p locales/<LANG_CODE>/LC_MESSAGES
   ```

2. Copy the Russian template or create new:
   ```bash
   cp locales/ru_RU/LC_MESSAGES/geocmp.po locales/<LANG_CODE>/LC_MESSAGES/geocmp.po
   ```

3. Edit the header and translate messages

4. Compile:
   ```bash
   msgfmt locales/<LANG_CODE>/LC_MESSAGES/geocmp.po -o locales/<LANG_CODE>/LC_MESSAGES/geocmp.mo
   ```

## Format

The `.po` files use the standard GNU gettext format:

```
msgid "English message"
msgstr "Translated message"
```

## Notes

- `.mo` files are compiled binary files (not stored in git)
- `.po` files are source text files (stored in git)
- The application automatically selects language based on system locale
- Fallback language is English (messages without translation)
