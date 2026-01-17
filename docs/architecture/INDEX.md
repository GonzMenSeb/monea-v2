# Architecture Documentation

This directory contains comprehensive documentation about the Monea v2 application architecture, design decisions, and technical implementation details.

## Directory Contents

### Core Documentation Files

- **ARCHITECTURE.md** - Detailed system design, stack justification, folder structure explanation, and architectural patterns
- **DATA_FLOW.md** - Data flow diagrams, state management flow, and transaction processing pipeline
- **TESTING_STRATEGY.md** - Testing approach, test patterns, coverage goals, and E2E testing strategy

## Quick Links

- [Architecture Design](./ARCHITECTURE.md) - System design and technical decisions
- [Data Flow](./DATA_FLOW.md) - How data moves through the application
- [Testing Strategy](./TESTING_STRATEGY.md) - Testing methodologies and test coverage
- [Project Configuration](../CLAUDE.md) - Coding standards and project configuration

## Key Architectural Principles

The Monea v2 application is built on these core principles:

1. **Feature-Based Organization** - Code organized by domain features rather than technical layers
2. **SOLID Principles** - Single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion
3. **Clean Architecture** - Clear separation between UI, business logic, and data access layers
4. **Type Safety** - TypeScript strict mode with explicit types throughout
5. **Testability** - Components and business logic designed for easy testing
6. **Performance** - Optimized rendering, efficient state management, and virtualized lists
7. **Offline First** - Local database with WatermelonDB, SMS processing without cloud dependency

## Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| ARCHITECTURE.md | ✅ Complete | 2026-01-16 |
| DATA_FLOW.md | ⏳ Pending | - |
| TESTING_STRATEGY.md | ⏳ Pending | - |

## Related Files

- `/CLAUDE.md` - Project-specific coding standards and configuration
- `/README.md` - Project overview and getting started guide (future)
- `/docs/CONTRIBUTING.md` - Contribution guidelines (future)
- `/docs/SMS_PATTERNS.md` - Bank SMS format documentation (future)
