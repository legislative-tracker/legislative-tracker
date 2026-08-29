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
import { legUsNjPlugin } from '@legislative-tracker/plugins-leg-us-nj';

export const getAppConfig = (
  runtimeConfig: AppConfig = configJson as AppConfig,
): ApplicationConfig => {
  return {
    providers: [
      { provide: APP_CONFIG, useValue: runtimeConfig },

      provideZonelessChangeDetection(),

      provideRouter(
        routes,
        withComponentInputBinding(),
        withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      ),

      provideServiceWorker('ngsw-worker.js', {
        enabled: true,
        registrationStrategy: 'registerWhenStable:30000',
      }),

      ...BACKEND_PROVIDERS,

      provideAppInitializer(() => {
        if (!LegislaturePluginRegistry.has(legUsNyPlugin.metadata.id)) {
          LegislaturePluginRegistry.register(legUsNyPlugin);
        }
        if (!LegislaturePluginRegistry.has(legUsNjPlugin.metadata.id)) {
          LegislaturePluginRegistry.register(legUsNjPlugin);
        }
        return inject(ConfigService).load();
      }),
    ],
  };
};
