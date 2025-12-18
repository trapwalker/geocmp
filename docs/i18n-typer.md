# Internationalization (i18n) with Typer

## Overview

This document explains how to localize Typer CLI applications and the limitations of built-in command localization.

## What Can Be Localized

### ✅ User-Defined Elements

All user-defined help text can be localized using the `_()` function:

1. **Application help**:
   ```python
   from .i18n import _

   setup_i18n()
   app = typer.Typer(help=_("Geocmp utility for compare GIS-files on the map"))
   ```

2. **Command help** (via decorator):
   ```python
   @app.command(
       help=_("A utility for creating an interactive HTML map...")
   )
   def main(...):
       pass
   ```

3. **Argument help**:
   ```python
   patterns: list[str] = typer.Argument(
       ...,
       help=_("Glob pattern(s) or GeoJSON file(s)..."),
   )
   ```

4. **Option help**:
   ```python
   verbose: bool = typer.Option(
       False,
       "--verbose", "-v",
       help=_("Enable verbose logging")
   )
   ```

### ❌ Built-in Typer Elements (Hard to Localize)

Typer's built-in commands and options are **not easily localizable**:

- `--help` option text
- `--install-completion` command
- `--show-completion` command
- Error messages from Typer itself
- Auto-generated usage text

## Why Built-in Commands Can't Be Easily Localized

Typer uses Click underneath, which has hardcoded English strings for:
- Standard help text ("Show this message and exit")
- Completion installation messages
- Error messages

### Workarounds (Not Recommended)

You could:

1. **Disable auto-help and implement custom**:
   ```python
   app = typer.Typer(add_help_option=False)

   @app.command()
   def main(
       ctx: typer.Context,
       help_flag: bool = typer.Option(
           False, "--help", "-h",
           help=_("Show this help message and exit"),
           is_flag=True
       ),
       ...
   ):
       if help_flag:
           # Custom help display
           print(_("Custom help text"))
           raise typer.Exit()
   ```

2. **Monkey-patch Click's internal strings** (fragile and not recommended)

3. **Use a wrapper that translates output** (complex)

## Best Practice

**Recommendation**: Keep built-in Typer commands in English and only localize your custom help text.

This is acceptable because:
- `--help` is a universal convention in CLI tools
- Developers worldwide understand English CLI options
- Your custom help text (which explains what the tool does) is localized

## Docstrings vs Help Text

**Important distinction**:

```python
@app.command(help=_("Localized help text for users"))
def main(...):
    """English docstring for code documentation.

    This is for developers reading the code, not for CLI users.
    """
    pass
```

- **Docstring**: For developers, stays in English (code documentation)
- **help parameter**: For CLI users, use `_()` for localization

## Complete Example

```python
from .i18n import _, setup_i18n
import typer

setup_i18n()
app = typer.Typer(help=_("Application description"))

@app.command(
    help=_("Command description that users see")
)
def main(
    input_file: Path = typer.Argument(
        ...,
        help=_("Input file path")
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose", "-v",
        help=_("Enable verbose output")
    )
) -> None:
    """Code documentation in English.

    This docstring is for developers, not CLI users.
    """
    # Implementation
    pass
```

## Translation Workflow

1. Mark strings with `_()`:
   ```python
   help=_("Enable verbose logging")
   ```

2. Extract to .po file:
   ```
   msgid "Enable verbose logging"
   msgstr "Включить подробное логирование"
   ```

3. Compile translations:
   ```bash
   make compile-translations
   ```

## Summary

- ✅ Localize: All custom help text using `_()`
- ❌ Don't localize: Docstrings (code documentation)
- ⚠️  Can't easily localize: Built-in Typer commands (`--help`, etc.)
- 📝 Best practice: Localize user-facing text, keep system commands in English
