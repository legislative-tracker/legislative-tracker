import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import {
  APP_CONFIG,
  AppConfig,
  ConfigService,
} from '@legislative-tracker/client-angular/core';
import { BACKEND_PROVIDERS } from './backend.providers';
import { routes } from './app.routes';
import configJson from '../public/assets/config.json';

import { LegislaturePluginRegistry } from '@legislative-tracker/plugins-core';
import { legUsNyPlugin } from '@legislative-tracker/plugins-leg-us-ny';

export const getAppConfig = (
  runtimeConfig: AppConfig = configJson as AppConfig,
): ApplicationConfig => {
  return {
    providers: [
      { provide: APP_CONFIG, useValue: runtimeConfig },

      provideZonelessChangeDetection(),

      provideRouter(routes, withComponentInputBinding()),

      provideServiceWorker('ngsw-worker.js', {
        enabled: true,
        registrationStrategy: 'registerWhenStable:30000',
      }),

      ...BACKEND_PROVIDERS,

      provideAppInitializer(() => {
        LegislaturePluginRegistry.register(legUsNyPlugin);
        return inject(ConfigService).load();
      }),
    ],
  };
};

export const appConfig: ApplicationConfig = getAppConfig(
  configJson as AppConfig,
);
