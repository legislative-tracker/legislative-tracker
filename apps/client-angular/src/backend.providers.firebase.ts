import { EnvironmentProviders, Provider, inject } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

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
  FIREBASE_APP,
  FIREBASE_AUTH,
  FIREBASE_FIRESTORE,
  FIREBASE_FUNCTIONS,
  FIREBASE_STORAGE,
} from '@legislative-tracker/client-angular/core';

export const BACKEND_PROVIDERS: (Provider | EnvironmentProviders)[] = [
  { provide: LegislatureService, useClass: FirebaseLegislatureService },
  { provide: AuthService, useClass: FirebaseAuthService },
  { provide: ConfigService, useClass: FirebaseConfigService },
  { provide: FeedbackService, useClass: FirebaseFeedbackService },
  { provide: UserManagementService, useClass: FirebaseUserManagementService },

  {
    provide: FIREBASE_APP,
    useFactory: () => {
      const config = inject(APP_CONFIG);
      return initializeApp(config.firebase);
    },
  },
  {
    provide: FIREBASE_AUTH,
    useFactory: () => {
      const app = inject(FIREBASE_APP);
      const auth = getAuth(app);
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
    },
  },
  {
    provide: FIREBASE_FIRESTORE,
    useFactory: () => {
      const app = inject(FIREBASE_APP);
      const firestore = getFirestore(app);
      const config = inject(APP_CONFIG);
      if (config.useEmulators && config.emulatorHosts?.firestore) {
        const fsHost = config.emulatorHosts.firestore;
        connectFirestoreEmulator(firestore, fsHost.host, fsHost.port);
      }
      return firestore;
    },
  },
  {
    provide: FIREBASE_FUNCTIONS,
    useFactory: () => {
      const app = inject(FIREBASE_APP);
      const functions = getFunctions(app);
      const config = inject(APP_CONFIG);
      if (config.useEmulators && config.emulatorHosts?.functions) {
        const fnHost = config.emulatorHosts.functions;
        connectFunctionsEmulator(functions, fnHost.host, fnHost.port);
      }
      return functions;
    },
  },
  {
    provide: FIREBASE_STORAGE,
    useFactory: () => {
      const app = inject(FIREBASE_APP);
      const storage = getStorage(app);
      const config = inject(APP_CONFIG);
      if (config.useEmulators && config.emulatorHosts?.storage) {
        const stHost = config.emulatorHosts.storage;
        connectStorageEmulator(storage, stHost.host, stHost.port);
      }
      return storage;
    },
  },
];
