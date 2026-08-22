import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { dataAccessOpenStatesKey, pluginLegUsNyKey } from '../config';
import { performLegislationUpdate } from './service';

/**
 * Manual Trigger for Debugging (HTTPS)
 */
export const manualUpdate = onRequest(
  { secrets: [dataAccessOpenStatesKey, pluginLegUsNyKey], timeoutSeconds: 300 },
  async (request, response) => {
    try {
      const data = await performLegislationUpdate();
      response.send({
        status: 'success',
        timestamp: new Date().toISOString(),
        data: data,
      });
    } catch (error: unknown) {
      logger.error('HTTP Update Failed', error);
      response.status(500).send({ error: error });
    }
  },
);
