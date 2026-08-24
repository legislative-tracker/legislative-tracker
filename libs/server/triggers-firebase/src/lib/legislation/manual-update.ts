import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { dataAccessOpenStatesKey, pluginLegUsNyKey } from '../config';
import { performLegislationUpdate } from './service';

/**
 * Manual Trigger for Legislation Updates (Callable)
 */
export const manualUpdate = onCall(
  { secrets: [dataAccessOpenStatesKey, pluginLegUsNyKey], timeoutSeconds: 300 },
  async (request) => {
    if (request.auth?.token['admin'] !== true) {
      throw new HttpsError(
        'permission-denied',
        'Only admins can perform manual legislation updates.',
      );
    }

    try {
      const data = await performLegislationUpdate();
      return {
        status: 'success',
        timestamp: new Date().toISOString(),
        data,
      };
    } catch (error: unknown) {
      logger.error('Manual Legislation Update Failed', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpsError('internal', msg);
    }
  },
);
