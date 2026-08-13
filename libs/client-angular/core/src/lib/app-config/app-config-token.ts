import { InjectionToken } from '@angular/core';

export interface AppConfig {
  production: boolean;
  useEmulators?: boolean;
  emulatorHosts?: {
    firestore?: { host: string; port: number };
    functions?: { host: string; port: number };
    auth?: { host: string; port: number };
    pubsub?: { host: string; port: number };
    'pub/sub'?: { host: string; port: number };
    storage?: { host: string; port: number };
  };
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
  apiUrl?: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
