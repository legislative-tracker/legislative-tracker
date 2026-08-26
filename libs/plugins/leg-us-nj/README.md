# @legislative-tracker/plugins-leg-us-nj

New Jersey State Legislative Plugin for the Legislative Tracker monorepo ecosystem.

## Features

- Implements `LegislativePlugin` interface from `@legislative-tracker/plugins-core`.
- Defines New Jersey State jurisdiction metadata (`ocd-jurisdiction/country:us/state:nj/government`).
- Dynamic `currentSession` evaluation supporting New Jersey's 2-year even-year bienniums (e.g. `2024-2025`, `2026-2027`).

## Installation

```bash
npm install @legislative-tracker/plugins-leg-us-nj
```

## Usage

```typescript
import { registerPlugin } from '@legislative-tracker/plugins-core';
import { legUsNjPlugin } from '@legislative-tracker/plugins-leg-us-nj';

// Register plugin
await registerPlugin(legUsNjPlugin);

// Access dynamic session
console.log(legUsNjPlugin.metadata.jurisdiction.currentSession); // "2026-2027"
```

## Building & Testing

- Build output: `nx build plugin-leg-us-nj`
- Unit tests: `nx test plugin-leg-us-nj`
- Publish target: `nx run plugin-leg-us-nj:publish`
