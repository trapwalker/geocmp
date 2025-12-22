"""Internationalization support using gettext."""

import gettext
import locale
import os
from pathlib import Path


_translator: gettext.NullTranslations | gettext.GNUTranslations | None = None


def _norm_lang(token: str) -> str:
    token = token.strip()
    if not token or token.upper() in {"C", "POSIX"}:
        return ""
    return token.split(".", 1)[0].split("@", 1)[0].strip()


def _split_language_list(value: str) -> list[str]:
    return [t for t in (_norm_lang(p) for p in value.split(":")) if t]


def detect_message_languages(cli_lang: str | None = None) -> list[str]:
    """
    Returns preferred UI languages in priority order (gettext-friendly),
    e.g. ["de_DE", "de", "en"].
    """
    if cli_lang:
        if ":" in cli_lang:
            langs = _split_language_list(cli_lang)
            return langs or ["en"]
        base = _norm_lang(cli_lang)
        return [base] if base else ["en"]

    # 1) LANGUAGE (may be a priority list)
    v = os.environ.get("LANGUAGE")
    if v:
        langs = _split_language_list(v)
        if langs:
            return langs

    # 2) LC_ALL, 3) LC_MESSAGES, 4) LANG
    for key in ("LC_ALL", "LC_MESSAGES", "LANG"):
        v = os.environ.get(key)
        if v and v.upper() not in {"C", "POSIX"}:
            # strip encoding/modifiers: "de_DE.UTF-8@euro" -> "de_DE"
            base = v.split(".", 1)[0].split("@", 1)[0]
            if base:
                return [base]

    # As a last resort, ask Python's locale (may reflect LC_CTYPE)
    try:
        # This does not change locale; it reports current setting.
        loc, _enc = locale.getlocale(locale.LC_MESSAGES)
        if loc:
            base = _norm_lang(loc)
            if base:
                return [base]
    except Exception:
        pass

    return ["en"]


def setup_i18n(domain: str = "geocmp", localedir: Path | None = None, lang: str | None = None) -> None:
    """
    Setup internationalization.

    Args:
        domain: Translation domain name
        localedir: Directory containing locale files (None for default)
        lang: Language override, e.g. "de_DE:de:en" or "de_DE"
    """
    global _translator

    if localedir is None:
        # Default locale directory relative to package
        localedir = Path(__file__).resolve().parent.parent.parent / "locales"

    _translator = gettext.translation(domain, localedir=localedir, languages=detect_message_languages(lang), fallback=True)


def _(message: str) -> str:
    """Translate message."""
    global _translator
    if _translator is None:
        setup_i18n()
    return _translator.gettext(message)


def _n(singular: str, plural: str, n: int) -> str:
    """Translate message with plural forms."""
    global _translator
    if _translator is None:
        setup_i18n()
    return _translator.ngettext(singular, plural, n)
