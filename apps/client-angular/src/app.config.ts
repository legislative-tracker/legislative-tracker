import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withRouterConfig,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

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
      provideAnimationsAsync(),

      provideRouter(
        routes,
        withComponentInputBinding(),
        withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      ),

      ...BACKEND_PROVIDERS,

      provideAppInitializer(() => {
        const configService = inject(ConfigService);
        return configService.load();
      }),
    ],
  };
};

export const appConfig: ApplicationConfig = getAppConfig(
  configJson as AppConfig,
);
