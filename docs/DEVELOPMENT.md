# Local Development Guide

This document provides complete instructions for configuring, running, and testing the **Legislative Tracker** platform locally.

## 1. Prerequisites

Ensure the following tools are installed on your workstation:

- **Node.js**: `^24.0.0` (Active LTS / Current)
- **npm**: `^10.0.0`
- **Java Runtime Environment (JRE)**: `11+` or `17+` (Required by the Firebase Local Emulator Suite)
- **Firebase CLI**: `npm install -g firebase-tools`
- **Git**: `2.30+`

Verify your environment:

```bash
node -v      # Should be v24.x
npm -v       # Should be v10.x
java -version # Should display OpenJDK / JRE version
firebase --version
```

## 2. Initial Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/legislative-tracker/legislative-tracker.git
   cd legislative-tracker
   ```

2. **Install monorepo dependencies:**
   ```bash
   npm install
   ```
   _Husky Git pre-commit hooks will automatically configure during installation._

## 3. Configuration & Secrets

### 3.1 Client Configuration (`apps/client-angular/public/assets/config.json`)

The client loads its runtime configuration from `assets/config.json`. When developing locally with emulators, `useEmulators` must be set to `true`:

```json
{
  "production": false,
  "useEmulators": true,
  "emulatorHosts": {
    "auth": { "host": "localhost", "port": 9099 },
    "firestore": { "host": "localhost", "port": 8080 },
    "functions": { "host": "localhost", "port": 5001 },
    "pubsub": { "host": "localhost", "port": 8085 },
    "storage": { "host": "localhost", "port": 9199 }
  },
  "firebase": {
    "projectId": "demo-legislative-tracker",
    "appId": "demo-app-id",
    "databaseURL": "http://127.0.0.1:9000?ns=demo-legislative-tracker",
    "storageBucket": "demo-legislative-tracker.appspot.com",
    "apiKey": "demo-api-key",
    "authDomain": "demo-legislative-tracker.firebaseapp.com",
    "messagingSenderId": "1234567890",
    "measurementId": "G-DEMO",
    "projectNumber": "1234567890",
    "version": "2"
  }
}
```

### 3.2 Server Local Secrets (`apps/server-firebase/.secret.local`)

Firebase Cloud Functions v2 loads local secrets from `apps/server-firebase/.secret.local` when running in the emulator:

```ini
DATA_ACCESS_OPENSTATES=<YOUR_OPENSTATES_API_KEY>
DATA_ACCESS_GOOGLE_MAPS=<YOUR_GOOGLE_MAPS_API_KEY>
DATA_ACCESS_GITHUB=<YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>
PLUGIN_LEG_US_NY=<OPTIONAL_NY_API_KEY>
```

> [!TIP]
> You can acquire a free Open States API key at [OpenStates.org](https://openstates.org/api/register/) and a Google Maps Geocoding API key in the [Google Cloud Console](https://console.cloud.google.com/).

## 4. Running the Development Environment

### 4.1 Start the Firebase Emulator Suite

The server emulator hosts Firestore, Authentication, Cloud Functions, and Pub/Sub locally:

```bash
npm run serve:server
```

This starts the Firebase Emulator Suite and binds the following ports:

| Service         | Local Port | Description                                        |
| :-------------- | :--------- | :------------------------------------------------- |
| **Emulator UI** | `4000`     | Web dashboard to inspect Firestore, Auth, and Logs |
| **Firestore**   | `8080`     | Local Firestore database                           |
| **Auth**        | `9099`     | Local authentication provider                      |
| **Functions**   | `5001`     | Local Cloud Functions v2 runtime                   |
| **Pub/Sub**     | `8085`     | Scheduled cron event runner                        |

Open **[http://localhost:4000](http://localhost:4000)** in your browser to access the Firebase Emulator UI.

### 4.2 Start the Angular Frontend

In a separate terminal window:

```bash
npm run serve:client
```

_(Or use `npm start` which starts the Angular dev server configured for Firebase)._

Open **[http://localhost:4200](http://localhost:4200)** in your browser.

### 4.3 Exporting / Importing Emulator Data

To preserve local test data across restarts:

```bash
# Export active Firestore and Auth emulator state to ./emulator_data
npm run export:server
```

The emulators automatically load saved state from `./emulator_data` upon startup if present.

## 5. Testing & Quality Assurance

### 5.1 Unit Tests (Vitest)

Unit tests are executed across all libraries using **Vitest**:

```bash
# Run all unit tests
npm test

# Run client unit tests only
npm run test:client

# Run server unit tests only
npm run test:server

# Run a specific library's tests (e.g., NY plugin)
npx nx test plugins-leg-us-ny
```

### 5.2 Server Emulator Tests

To test Cloud Functions against live local Firebase emulators:

```bash
npm run test:emulator
```

### 5.3 End-to-End Tests (Playwright)

Run the Playwright E2E test suite:

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive Playwright UI
npx playwright test --ui
```

### 5.4 Linting & Code Formatting

```bash
# Run ESLint across all projects
npm run lint

# Format code with Prettier
npm run format

# Detect unused files and exports
npm run knip
```

## 6. Monorepo Tooling (Nx)

Nx orchestrates dependency caching and task pipelines:

```bash
# View interactive project dependency graph
npx nx graph

# Run build target for all affected projects
npx nx affected -t build

# Run lint for all affected projects
npx nx affected -t lint
```

## 7. Troubleshooting

### Port Conflicts

If you encounter `Error: listen EADDRINUSE: address already in use` for ports 8080, 9099, or 5001:

```bash
# Terminate any lingering emulator processes
fuser -k 8085/tcp 8080/tcp 9099/tcp 5001/tcp || true
```

### Missing Java for Firebase Emulators

If `firebase emulators:start` fails with `Java runtime not found`:

```bash
# Debian / Ubuntu
sudo apt update && sudo apt install default-jre

# macOS (Homebrew)
brew install openjdk
```

### Resetting Client Storage & Cache

If local IndexedDB or service worker caches become inconsistent:

1. Open Chrome DevTools (`F12`) > **Application** tab.
2. Select **Storage** > Click **Clear site data**.
3. Alternatively, click the **Reset App Data** dialog within the application profile menu.
