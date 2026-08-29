import { InjectionToken } from '@angular/core';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Functions } from 'firebase/functions';
import type { FirebaseStorage } from 'firebase/storage';

/** DI Token providing the initialized FirebaseApp instance. */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

/** DI Token providing the Firebase Auth instance. */
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');

/** DI Token providing the Cloud Firestore database instance. */
export const FIREBASE_FIRESTORE = new InjectionToken<Firestore>(
  'FIREBASE_FIRESTORE',
);

/** DI Token providing the Cloud Functions v2 instance. */
export const FIREBASE_FUNCTIONS = new InjectionToken<Functions>(
  'FIREBASE_FUNCTIONS',
);

/** DI Token providing the Firebase Storage instance. */
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>(
  'FIREBASE_STORAGE',
);
