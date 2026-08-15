import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';

if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
export const auth = getAuth();

db.settings({ ignoreUndefinedProperties: true });

// Define Secrets
export const dataAccessOpenStatesKey = defineSecret('DATA_ACCESS_OPENSTATES');
export const dataAccessGoogleMapsKey = defineSecret('DATA_ACCESS_GOOGLE_MAPS');
export const pluginLegUsNyKey = defineSecret('PLUGIN_LEG_US_NY');

// Set global options once
setGlobalOptions({ maxInstances: 10 });
