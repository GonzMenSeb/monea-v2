# Monea

A React Native Android application serving as a centralized digital wallet that automatically tracks bank transactions by reading SMS messages from Colombian financial institutions.

## Features

- **Automatic SMS Parsing**: Reads and parses bank transaction notifications from Colombian banks
- **Multi-Bank Support**: Supports Bancolombia, Davivienda, BBVA, Nequi, and Daviplata
- **Transaction Dashboard**: View all transactions with spending analytics
- **Account Management**: Manage multiple bank accounts in one place
- **Offline-First**: All data stored locally on device using WatermelonDB
- **Privacy-Focused**: No cloud sync - your financial data stays on your device

## Supported Banks

| Bank | Status |
|------|--------|
| Bancolombia | Supported |
| Davivienda | Supported |
| BBVA Colombia | Supported |
| Nequi | Supported |
| Daviplata | Supported |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native + Expo (dev-client) |
| Language | TypeScript (strict mode) |
| UI | NativeWind (TailwindCSS) + React Native Paper |
| State Management | Zustand + React Query |
| Database | WatermelonDB |
| Navigation | Expo Router |
| Testing | Jest + React Native Testing Library + Detox |

## Prerequisites

- Node.js 20+
- npm or yarn
- Android Studio (for emulator or device builds)
- Java JDK 17+

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd monea

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npx expo start --android
```

### Running on Android

```bash
# Start Metro bundler
npx expo start

# Run on connected device or emulator
npx expo run:android
```

### Building for Production

```bash
# Build preview APK
eas build --platform android --profile preview

# Build production AAB
eas build --platform android --profile production
```

## Project Structure

```
src/
├── app/                    # Expo Router screens (file-based routing)
├── features/               # Domain features (vertical slices)
│   ├── dashboard/          # Home screen with analytics
│   ├── transactions/       # Transaction list and details
│   ├── settings/           # App settings and configuration
│   ├── sms-sync/           # SMS reading and sync logic
│   └── onboarding/         # Permission request flow
├── shared/                 # Cross-feature utilities
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Shared hooks
│   ├── utils/              # Utility functions
│   ├── animations/         # Animation presets
│   └── theme/              # Design tokens
├── core/                   # Business logic
│   └── parser/             # Bank SMS parsing engine
└── infrastructure/         # External integrations
    ├── database/           # WatermelonDB setup
    └── sms/                # SMS reading module
```

## Development

### Available Scripts

```bash
# Development
npm start                   # Start Expo dev server
npm run android            # Start with Android
npm test                   # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage

# Code Quality
npm run lint               # ESLint check
npm run lint:fix           # ESLint auto-fix
npm run typecheck          # TypeScript check
npm run format             # Prettier format
npm run validate           # Run all checks

# E2E Testing
npm run e2e:build:android  # Build for E2E tests
npm run e2e:test:android   # Run E2E tests
```

### Code Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Components**: Functional components with hooks
- **Styling**: NativeWind utility classes
- **Testing**: Minimum 70% coverage for features, 80% for core parser

See [CLAUDE.md](./CLAUDE.md) for detailed coding standards.

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests (Detox)

```bash
# Build the app
npm run e2e:build:android

# Run tests
npm run e2e:test:android
```

## Architecture

Monea follows a feature-based architecture with vertical slices:

- **Features**: Self-contained modules with their own components, hooks, and stores
- **Shared**: Cross-cutting concerns used by multiple features
- **Core**: Business logic independent of UI framework
- **Infrastructure**: External service integrations

For detailed architecture documentation, see [docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md).

## Permissions

Monea requires the following Android permissions:

- `READ_SMS`: Read bank transaction notifications
- `RECEIVE_SMS`: Get notified of new transactions in real-time

All SMS data is processed locally and never leaves your device.

## Privacy

- **Local-only storage**: All transaction data is stored in a local WatermelonDB database
- **No cloud sync**: Your financial data never leaves your device
- **No analytics**: We don't collect any usage data
- **SMS filtering**: Only bank-related messages are processed

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for contribution guidelines.

## License

This project is private and not open for public distribution.

---

Built with React Native and Expo
