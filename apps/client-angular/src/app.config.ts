import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import {
  APP_CONFIG,
  AppConfig,
  ConfigService,
} from '@legislative-tracker/client-angular/core';
import { BACKEND_PROVIDERS } from './backend.providers';
import { routes } from './app.routes';
import configJson from '../public/assets/config.json';

export const getAppConfig = (
  runtimeConfig: AppConfig = configJson as AppConfig,
): ApplicationConfig => {
  return {
    providers: [
      { provide: APP_CONFIG, useValue: runtimeConfig },

      provideZonelessChangeDetection(),

      provideRouter(routes, withComponentInputBinding()),

      ...BACKEND_PROVIDERS,

      provideAppInitializer(() => inject(ConfigService).load()),
    ],
  };
};

export const appConfig: ApplicationConfig = getAppConfig(
  configJson as AppConfig,
);
