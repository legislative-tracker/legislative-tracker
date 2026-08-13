import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { dataAccessOpenStatesKey, pluginLegUsNyKey } from '../config';
import { updateLegislators } from './service';

export const manualUpdate = onRequest(
  { secrets: [dataAccessOpenStatesKey, pluginLegUsNyKey], timeoutSeconds: 300 },
  async (request, response) => {
    try {
      const results = await updateLegislators();

      response.send({
        status: 'success',
        timestamp: new Date().toISOString(),
        results: results,
      });
    } catch (error: unknown) {
      logger.error('HTTP Update Failed', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      response.status(500).send({ error: msg });
    }
  },
);
