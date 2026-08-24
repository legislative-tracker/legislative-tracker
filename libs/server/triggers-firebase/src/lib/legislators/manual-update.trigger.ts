import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { dataAccessOpenStatesKey, pluginLegUsNyKey } from '../firebase.config';
import { updateLegislators } from './legislators.service';

/**
 * Manual Trigger for Legislators Updates (Callable)
 */
export const manualUpdate = onCall(
  { secrets: [dataAccessOpenStatesKey, pluginLegUsNyKey], timeoutSeconds: 300 },
  async (request) => {
    if (request.auth?.token['admin'] !== true) {
      throw new HttpsError(
        'permission-denied',
        'Only admins can perform manual legislator updates.',
      );
    }

    try {
      const results = await updateLegislators();
      return {
        status: 'success',
        timestamp: new Date().toISOString(),
        results,
      };
    } catch (error: unknown) {
      logger.error('Manual Legislator Update Failed', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpsError('internal', msg);
    }
  },
);
