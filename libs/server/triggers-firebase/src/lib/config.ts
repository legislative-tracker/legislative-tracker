import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';

const ensureDefaultApp = () => {
  try {
    return getApp();
  } catch {
    return initializeApp();
  }
};

// Initialize default app on module load
ensureDefaultApp();

let _db: Firestore | undefined;
let _auth: Auth | undefined;

export const getDb = (): Firestore => {
  if (!_db) {
    ensureDefaultApp();
    _db = getFirestore();
    _db.settings({ ignoreUndefinedProperties: true });
  }
  return _db;
};

export const getAuthAdmin = (): Auth => {
  if (!_auth) {
    ensureDefaultApp();
    _auth = getAuth();
  }
  return _auth;
};

// Lazy proxy getters for backwards compatibility and minimal startup cost
export const db = new Proxy({} as Firestore, {
  get: (_, prop: keyof Firestore) => {
    const instance = getDb();
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

export const auth = new Proxy({} as Auth, {
  get: (_, prop: keyof Auth) => {
    const instance = getAuthAdmin();
    const val = instance[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  },
});

// Define Secrets
export const dataAccessOpenStatesKey = defineSecret('DATA_ACCESS_OPENSTATES');
export const dataAccessGoogleMapsKey = defineSecret('DATA_ACCESS_GOOGLE_MAPS');
export const dataAccessGitHubKey = defineSecret('DATA_ACCESS_GITHUB');
export const pluginLegUsNyKey = defineSecret('PLUGIN_LEG_US_NY');

// Set global options once
setGlobalOptions({ maxInstances: 10 });
