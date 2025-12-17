.PHONY: help install install-dev sync compile-translations format lint test clean build

# Default target
.DEFAULT_GOAL := help

# Project variables
PYTHON := python3
UV := uv
SRC_DIR := src/geocmp
LOCALES_DIR := locales

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install package in production mode
	$(UV) pip install .

install-dev: ## Install package in development mode with dev dependencies
	$(UV) pip install -e . --group dev

sync: ## Sync dependencies (uv sync)
	$(UV) sync

compile-translations: ## Compile translation files (.po -> .mo)
	$(PYTHON) scripts/compile_translations.py

format: ## Format code with black
	black $(SRC_DIR)

format-check: ## Check code formatting without changes
	black --check $(SRC_DIR)

lint: ## Run code linters (flake8, mypy)
	$(UV) run flake8 $(SRC_DIR)
	$(UV) run mypy $(SRC_DIR)

test: ## Run tests with pytest
	pytest

test-cov: ## Run tests with coverage report
	pytest --cov=$(SRC_DIR) --cov-report=html --cov-report=term

clean: ## Clean build artifacts and temporary files
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name '*.pyc' -delete
	find . -type f -name '*.pyo' -delete
	find . -type f -name '*.mo' -delete

build: compile-translations ## Build distribution packages
	$(UV) build

dev-setup: install-dev compile-translations ## Complete development setup
	@echo "Development environment is ready!"

check: format-check lint test ## Run all checks (format, lint, test)

all: clean compile-translations format lint test ## Run clean, compile, format, lint, and test
