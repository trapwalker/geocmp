# Contributing to geocmp

Thank you for considering contributing to geocmp!

## Development Setup

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/geocmp.git
cd geocmp

# Setup development environment (installs deps + compiles translations)
make dev-setup
```

### Manual Setup

If `make` is not available:

```bash
# Install in development mode
uv pip install -e ".[dev]"

# Compile translations
python scripts/compile_translations.py
```

## Development Workflow

### Making Changes

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Format and check your code:
   ```bash
   make format        # Auto-format code
   make check         # Run all checks (format-check, lint, test)
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

### Working with Translations

If you add or modify user-facing messages:

1. Use the `_()` function for translatable strings:
   ```python
   from .i18n import _

   logger.info(_("Processing file: %s"), filename)
   ```

2. Update translation files in `locales/*/LC_MESSAGES/geocmp.po`

3. Compile translations:
   ```bash
   make compile-translations
   ```

### Running Tests

```bash
# Run all tests
make test

# Run tests with coverage
make test-cov

# Open coverage report
open htmlcov/index.html
```

### Code Style

We use:
- **black** for code formatting (line length: 100)
- **flake8** for linting
- **mypy** for type checking

Run all checks:
```bash
make check
```

## Makefile Commands

See all available commands:
```bash
make help
```

Common commands:
- `make dev-setup` - Complete development setup
- `make format` - Format code with black
- `make lint` - Run linters
- `make test` - Run tests
- `make check` - Run all checks
- `make clean` - Clean temporary files
- `make compile-translations` - Compile translation files

## Pull Request Process

1. Ensure all tests pass: `make check`
2. Update documentation if needed
3. Update CHANGELOG.md if applicable
4. Create a Pull Request with a clear description

## Questions?

Feel free to open an issue for any questions or concerns.
