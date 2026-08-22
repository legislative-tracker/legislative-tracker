# @legislative-tracker/plugins-leg-us-ny

New York State Legislative Plugin for the Legislative Tracker monorepo ecosystem.

## Features

- Implements `LegislativePlugin` interface from `@legislative-tracker/plugins-core`.
- Defines New York State jurisdiction metadata (`ocd-jurisdiction/country:us/state:ny/government`).
- Dynamic `currentSession` evaluation supporting New York's 2-year odd-year bienniums (e.g. `2025-2026`).

## Installation

```bash
npm install @legislative-tracker/plugins-leg-us-ny
```

## Usage

```typescript
import { registerPlugin } from '@legislative-tracker/plugins-core';
import { legUsNyPlugin } from '@legislative-tracker/plugins-leg-us-ny';

// Register plugin
await registerPlugin(legUsNyPlugin);

// Access dynamic session
console.log(legUsNyPlugin.metadata.jurisdiction.currentSession); // "2025-2026"
```

## Building & Testing

- Build output: `nx build plugin-leg-us-ny`
- Unit tests: `nx test plugin-leg-us-ny`
- Publish target: `nx run plugin-leg-us-ny:publish`
