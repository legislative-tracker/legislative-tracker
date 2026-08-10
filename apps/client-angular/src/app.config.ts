import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { APP_CONFIG, AppConfig, ConfigService } from '@legislative-tracker/client-angular/core';
import { routes } from './app.routes';

export const getAppConfig = (runtimeConfig: AppConfig): ApplicationConfig => {
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

      provideFirebaseApp(() => initializeApp(inject(APP_CONFIG).firebase)),
      provideAuth(() => getAuth()),
      provideAnalytics(() => getAnalytics()),
      ScreenTrackingService,
      UserTrackingService,

      provideAppInitializer(() => inject(ConfigService).load()),
    ],
  };
};
