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
export const openStatesKey = defineSecret('OPENSTATES_KEY');
export const googleMapsKey = defineSecret('GOOGLE_MAPS_KEY');
export const nySenateKey = defineSecret('NYSENATE_KEY');

// Set global options once
setGlobalOptions({ maxInstances: 10 });
