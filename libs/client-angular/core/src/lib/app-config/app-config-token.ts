import { InjectionToken } from '@angular/core';

export interface AppConfig {
  production: boolean;
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
