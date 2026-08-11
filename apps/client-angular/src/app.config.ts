import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  inject,
  provideAppInitializer,
} from "@angular/core";
import {
  provideRouter,
  withComponentInputBinding,
  withRouterConfig,
} from "@angular/router";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { connectAuthEmulator, getAuth, provideAuth } from "@angular/fire/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  provideFirestore,
} from "@angular/fire/firestore";
import {
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions,
} from "@angular/fire/functions";
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from "@angular/fire/analytics";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";

import {
  APP_CONFIG,
  AppConfig,
  ConfigService,
} from "@legislative-tracker/client-angular/core";
import { routes } from "./app.routes";

export const getAppConfig = (runtimeConfig: AppConfig): ApplicationConfig => {
  return {
    providers: [
      { provide: APP_CONFIG, useValue: runtimeConfig },

      provideZonelessChangeDetection(),
      provideAnimationsAsync(),

      provideRouter(
        routes,
        withComponentInputBinding(),
        withRouterConfig({ paramsInheritanceStrategy: "always" }),
      ),

      provideFirebaseApp(() => initializeApp(inject(APP_CONFIG).firebase)),
      provideAuth(() => {
        const auth = getAuth();
        const config = inject(APP_CONFIG);
        if (config.useEmulators) {
          const authHost = config.emulatorHosts?.auth;
          connectAuthEmulator(
            auth,
            `http://${authHost?.host ?? "127.0.0.1"}:${authHost?.port ?? 9099}`,
            { disableWarnings: true },
          );
        }
        return auth;
      }),
      provideFirestore(() => {
        const firestore = getFirestore();
        const config = inject(APP_CONFIG);
        if (config.useEmulators) {
          const fsHost = config.emulatorHosts?.firestore;
          connectFirestoreEmulator(
            firestore,
            fsHost?.host ?? "127.0.0.1",
            fsHost?.port ?? 8080,
          );
        }
        return firestore;
      }),
      provideFunctions(() => {
        const functions = getFunctions();
        const config = inject(APP_CONFIG);
        if (config.useEmulators) {
          const fnHost = config.emulatorHosts?.functions;
          connectFunctionsEmulator(
            functions,
            fnHost?.host ?? "127.0.0.1",
            fnHost?.port ?? 5001,
          );
        }
        return functions;
      }),
      provideAnalytics(() => getAnalytics()),
      ScreenTrackingService,
      UserTrackingService,

      provideAppInitializer(() => inject(ConfigService).load()),
    ],
  };
};
