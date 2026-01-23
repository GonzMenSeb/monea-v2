.PHONY: help dev android test test-watch test-coverage typecheck lint lint-fix format format-check validate e2e-build e2e-test e2e-build-release e2e-test-release e2e-test-ci clean

help:
	@echo "Monea v2 - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start Expo dev server"
	@echo "  make android          Build and run on Android device/emulator"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run unit tests"
	@echo "  make test-watch       Run tests in watch mode"
	@echo "  make test-coverage    Run tests with coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  make typecheck        TypeScript type checking"
	@echo "  make lint             ESLint code analysis"
	@echo "  make lint-fix         ESLint auto-fix"
	@echo "  make format           Format code with Prettier"
	@echo "  make format-check     Check code formatting"
	@echo "  make validate         Run all checks (typecheck + lint + format + tests)"
	@echo ""
	@echo "E2E Testing (Detox):"
	@echo "  make e2e-build        Build debug APK for E2E tests"
	@echo "  make e2e-test         Run E2E tests on local emulator"
	@echo "  make e2e-build-release Build release APK for E2E tests"
	@echo "  make e2e-test-release Run E2E tests on release build"
	@echo "  make e2e-test-ci      Run E2E tests in CI environment"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean            Remove build artifacts and caches"

# Development
dev:
	npx expo start

android:
	npx expo run:android

# Unit Tests
test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

# Code Quality
typecheck:
	npm run typecheck

lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

format-check:
	npm run format:check

validate:
	npm run validate

# E2E Tests (Detox)
e2e-build:
	npm run e2e:build:android

e2e-test:
	npm run e2e:test:android

e2e-build-release:
	npm run e2e:build:release

e2e-test-release:
	npm run e2e:test:release

e2e-test-ci:
	npm run e2e:test:ci

# Maintenance
clean:
	rm -rf node_modules/.cache
	rm -rf .expo
	rm -rf android/app/build
	rm -rf coverage
