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
import { Auth, connectAuthEmulator, getAuth, provideAuth } from "@angular/fire/auth";
import {
  Firestore,
  connectFirestoreEmulator,
  getFirestore,
  provideFirestore,
} from "@angular/fire/firestore";
import {
  Functions,
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions,
} from "@angular/fire/functions";
import {
  Storage,
  connectStorageEmulator,
  getStorage,
  provideStorage,
} from "@angular/fire/storage";
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
import configJson from "../public/assets/config.json";

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
        withRouterConfig({ paramsInheritanceStrategy: "always" }),
      ),

      provideFirebaseApp(() => initializeApp(inject(APP_CONFIG).firebase)),
      provideAuth(() => {
        const auth = getAuth();
        const config = inject(APP_CONFIG);
        if (config.useEmulators && config.emulatorHosts?.auth) {
          const authHost = config.emulatorHosts.auth;
          connectAuthEmulator(
            auth,
            `http://${authHost.host}:${authHost.port}`,
            { disableWarnings: true },
          );
        }
        return auth;
      }),
      provideFirestore(() => {
        const firestore = getFirestore();
        const config = inject(APP_CONFIG);
        if (config.useEmulators && config.emulatorHosts?.firestore) {
          const fsHost = config.emulatorHosts.firestore;
          connectFirestoreEmulator(
            firestore,
            fsHost.host,
            fsHost.port,
          );
        }
        return firestore;
      }),
      provideFunctions(() => {
        const functions = getFunctions();
        const config = inject(APP_CONFIG);
        if (config.useEmulators && config.emulatorHosts?.functions) {
          const fnHost = config.emulatorHosts.functions;
          connectFunctionsEmulator(
            functions,
            fnHost.host,
            fnHost.port,
          );
        }
        return functions;
      }),
      provideStorage(() => {
        const storage = getStorage();
        const config = inject(APP_CONFIG);
        if (config.useEmulators && config.emulatorHosts?.storage) {
          const stHost = config.emulatorHosts.storage;
          connectStorageEmulator(
            storage,
            stHost.host,
            stHost.port,
          );
        }
        return storage;
      }),
      provideAnalytics(() => getAnalytics()),
      ScreenTrackingService,
      UserTrackingService,

      provideAppInitializer(() => {
        const configService = inject(ConfigService);
        const config = inject(APP_CONFIG);
        if (config.useEmulators) {
          inject(Auth);
          inject(Firestore);
          inject(Functions);
          inject(Storage);
        }
        return configService.load();
      }),
    ],
  };
};

export const appConfig: ApplicationConfig = getAppConfig(configJson as AppConfig);
