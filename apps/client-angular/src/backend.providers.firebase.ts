import { EnvironmentProviders, Provider, inject } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  provideAuth,
} from '@angular/fire/auth';
import {
  Firestore,
  connectFirestoreEmulator,
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import {
  Functions,
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions,
} from '@angular/fire/functions';
import {
  Storage,
  connectStorageEmulator,
  getStorage,
  provideStorage,
} from '@angular/fire/storage';
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
  UserTrackingService,
} from '@angular/fire/analytics';

import {
  APP_CONFIG,
  AuthService,
  ConfigService,
  FeedbackService,
  LegislatureService,
  UserManagementService,
  FirebaseAuthService,
  FirebaseConfigService,
  FirebaseFeedbackService,
  FirebaseLegislatureService,
  FirebaseUserManagementService,
} from '@legislative-tracker/client-angular/core';

export const BACKEND_PROVIDERS: (Provider | EnvironmentProviders)[] = [
  { provide: LegislatureService, useClass: FirebaseLegislatureService },
  { provide: AuthService, useClass: FirebaseAuthService },
  { provide: ConfigService, useClass: FirebaseConfigService },
  { provide: FeedbackService, useClass: FirebaseFeedbackService },
  { provide: UserManagementService, useClass: FirebaseUserManagementService },
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
      connectFirestoreEmulator(firestore, fsHost.host, fsHost.port);
    }
    return firestore;
  }),
  provideFunctions(() => {
    const functions = getFunctions();
    const config = inject(APP_CONFIG);
    if (config.useEmulators && config.emulatorHosts?.functions) {
      const fnHost = config.emulatorHosts.functions;
      connectFunctionsEmulator(functions, fnHost.host, fnHost.port);
    }
    return functions;
  }),
  provideStorage(() => {
    const storage = getStorage();
    const config = inject(APP_CONFIG);
    if (config.useEmulators && config.emulatorHosts?.storage) {
      const stHost = config.emulatorHosts.storage;
      connectStorageEmulator(storage, stHost.host, stHost.port);
    }
    return storage;
  }),
  provideAnalytics(() => getAnalytics()),
  ScreenTrackingService,
  UserTrackingService,
];
