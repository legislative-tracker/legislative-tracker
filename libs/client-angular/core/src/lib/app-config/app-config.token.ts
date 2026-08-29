import { InjectionToken } from '@angular/core';

/**
 * Top-level application bootstrap configuration loaded at client startup.
 */
export interface AppConfig {
  /** Indicates whether the application runs in production mode. */
  production: boolean;
  /** When true, redirects Firebase SDK calls to local emulator suite. */
  useEmulators?: boolean;
  /** Host and port mapping for local Firebase emulators. */
  emulatorHosts?: {
    firestore?: { host: string; port: number };
    functions?: { host: string; port: number };
    auth?: { host: string; port: number };
    pubsub?: { host: string; port: number };
    'pub/sub'?: { host: string; port: number };
    storage?: { host: string; port: number };
  };
  /** Firebase project credentials and options. */
  firebase: {
    projectId: string;
    appId: string;
    databaseURL: string;
    storageBucket: string;
    apiKey: string;
    authDomain: string;
    messagingSenderId: string;
    measurementId: string;
    projectNumber: string;
    version: string;
  };
  /** Optional custom API gateway URL. */
  apiUrl?: string;
}

/**
 * Dependency injection token providing the active runtime AppConfig.
 */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
