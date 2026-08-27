# Legislative Tracker

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node->=%2024-brightgreen.svg)](package.json)
[![Angular](https://img.shields.io/badge/Angular-22-red.svg)](https://angular.dev)
[![Nx Monorepo](https://img.shields.io/badge/Nx-23-blueviolet.svg)](https://nx.dev)
[![Firebase](https://img.shields.io/badge/Firebase-v2%20Functions%20%26%20Firestore-orange.svg)](https://firebase.google.com)

**Legislative Tracker** is an open-source, multi-state civic tech platform designed to track state legislation, monitor lawmaker voting records, map citizen districts to representatives, and deliver accessible legislative intelligence.

Built as an **Nx Monorepo**, it features an offline-first **Angular Progressive Web Application (PWA)** on the frontend and an event-driven serverless backend powered by **Firebase Cloud Functions (v2)** and **Cloud Firestore**.

## ✨ Features

- 🏛️ **Multi-State Legislation & Lawmaker Tracking**: Monitor bills, committee actions, voting history, and lawmaker rosters across supported state legislatures.
- 🔌 **Extensible State Plugin Engine**: Easily plug in new state legislatures with modular session biennium rules, chamber naming, and jurisdiction codes.
- 📱 **Offline-First PWA**: Save bills and record private notes locally in `IndexedDB` with automatic network status detection and reconnection handling.
- 📍 **Citizen District & Representative Lookup**: Address geocoding (via Google Maps API) matched against Open Civic Data (OCD) to determine federal and state districts and assign representatives.
- 🎨 **Dynamic Material Design 3 Theming**: Automatic tonal color schemes derived using `@material/material-color-utilities` with light/dark/system mode switching.
- ⚙️ **Automated Data Pipelines**: Scheduled daily bill updates and monthly lawmaker roster refreshes via Cloud Functions v2 and Firestore triggers.
- 🛡️ **Role-Based Admin Management**: Custom auth claims and Firestore security rules governing bill curation, user management, and configuration.
- 💬 **Integrated Feedback & Issue Reporting**: In-app feedback system directly connected to GitHub Issues.

## 🏗️ Architecture Overview

The codebase is organized as an **Nx Monorepo** enforcing strict modularity and a **Ports-and-Adapters (Hexagonal)** architecture on the client.

```
legislative-tracker/
├── apps/
│   ├── client-angular/          # Angular 22 PWA (Zoneless + Signals + Material 3)
│   └── server-firebase/         # Firebase Cloud Functions v2 backend
├── libs/
│   ├── client-angular/
│   │   ├── core/                # Abstract service ports, adapters, guards, auth/theme
│   │   ├── features/            # Feature modules (legislative, admin, profile, auth)
│   │   └── ui/                  # Reusable presentation components & layout
│   ├── plugins/
│   │   ├── core/                # State plugin contracts & LegislaturePluginRegistry
│   │   ├── leg-us-nj/           # New Jersey legislative plugin
│   │   └── leg-us-ny/           # New York legislative plugin
│   ├── server/
│   │   ├── data-access/         # OpenStates, Google Maps, and GitHub API clients
│   │   ├── triggers-firebase/   # Cloud Functions triggers (callable, scheduled, firestore)
│   │   └── util-core/           # Business logic orchestrators & bulk updates
│   └── shared/
│       └── models/              # Cross-boundary domain models and TypeScript types
└── docs/
    ├── ARCHITECTURE.md          # In-depth architectural specification
    ├── CHANGELOG.md             # Semantic release history
    ├── DEPLOYMENT.md            # Production deployment & GCP setup guide
    ├── DEVELOPMENT.md           # Local development & emulator environment guide
    └── STATE_PLUGIN_GUIDE.md    # State plugin authoring & integration guide
```

- 📖 **[Architecture Overview](docs/ARCHITECTURE.md)**: Deep dive into design patterns, data models, ports & adapters, and serverless triggers.
- 💻 **[Local Development Guide](docs/DEVELOPMENT.md)**: Local setup, emulator suite instructions, testing workflows, and troubleshooting.
- 🚀 **[Production Deployment Guide](docs/DEPLOYMENT.md)**: Production builds, Secret Manager, Firestore rules, and CI/CD pipelines.
- 🔌 **[State Plugin Authoring Guide](docs/STATE_PLUGIN_GUIDE.md)**: Step-by-step tutorial for adding new state legislature plugins.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `^24.0.0`
- **npm**: `^10.0.0`
- **Java Runtime (JRE)**: Required for Firebase Local Emulator Suite
- **Firebase CLI**: `npm install -g firebase-tools`

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/legislative-tracker/legislative-tracker.git
   cd legislative-tracker
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure local environment / Firebase emulators:**
   Copy or configure your local runtime settings in `apps/client-angular/public/assets/config.json` and backend secret keys in `apps/server-firebase/.secret.local`.

## 💻 Development & Scripts

### Running Locally

```bash
# Start both client and server (connects to Firebase backend)
npm start

# Run the Angular frontend locally
npm run serve:client

# Start Firebase Emulators (Auth, Firestore, Functions, PubSub)
npm run serve:server

# Export local emulator state
npm run export:server
```

### Building

```bash
# Build all monorepo targets
npm run build

# Build client PWA only
npm run build:client

# Build Firebase Functions backend only
npm run build:server
```

### Testing & Quality Assurance

```bash
# Run unit tests across all libraries and applications (Vitest)
npm test

# Run client unit tests
npm run test:client

# Run server unit tests
npm run test:server

# Run server emulator tests
npm run test:emulator

# Run end-to-end test suite (Playwright)
npm run test:e2e

# Run linter across all projects
npm run lint

# Format codebase with Prettier
npm run format

# Run unused dependency/export analysis
npm run knip
```

### Versioning & Release

```bash
# Execute conventional release workflow
npm run release

# Rebuild changelog from Git history
npm run changelog:rebuild

# Synchronize app versions across packages
npm run sync-version
```

## 🔌 State Plugin System

State-specific rules (legislative calendar, session biennium calculations, chamber structure) are encapsulated in standalone plugins implementing the `LegislativePlugin` contract from `@legislative-tracker/plugins-core`.

### Supported States

| State          | Plugin ID   | Jurisdiction Code | Chambers                  | Biennium Session                   |
| :------------- | :---------- | :---------------- | :------------------------ | :--------------------------------- |
| **New York**   | `leg-us-ny` | `us-ny`           | Senate / Assembly         | Odd-year start (e.g. `2025-2026`)  |
| **New Jersey** | `leg-us-nj` | `us-nj`           | Senate / General Assembly | Even-year start (e.g. `2024-2025`) |

### Adding a New State

1. Generate a new library in `libs/plugins/leg-us-<stateCd>`.
2. Implement the `LegislativePlugin` interface with jurisdiction metadata and `calculateCurrentSession(date)` logic.
3. Register the plugin in `LegislaturePluginRegistry`.
4. Register the plugin import in `apps/client-angular/src/app.config.ts` and `libs/server/util-core/src/lib/find-plugin-for-state.util.ts`.

See the **[State Plugin Authoring Guide](docs/STATE_PLUGIN_GUIDE.md)** for a detailed walkthrough.

## 🤝 Contributing

1. Fork the repository and create a feature branch (`git checkout -b feat/my-new-feature`).
2. Follow [Conventional Commits](https://www.conventionalcommits.org/) standards (enforced via `commitlint` and `husky`).
3. Ensure all tests and lint checks pass (`npm run lint && npm test`).
4. Submit a Pull Request.

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0-only)**. See the [LICENSE](LICENSE) file for details.
