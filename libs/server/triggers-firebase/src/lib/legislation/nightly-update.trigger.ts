import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { dataAccessOpenStatesKey, pluginLegUsNyKey } from '../firebase.config';
import { performLegislationUpdate } from './legislation.service';

/**
 * Scheduled Nightly Update
 */
export const nightlyUpdate = onSchedule(
  {
    schedule: '0 5 * * *',
    timeZone: 'America/New_York',
    retryCount: 3,
    secrets: [dataAccessOpenStatesKey, pluginLegUsNyKey],
  },
  async () => {
    logger.info('🌙 Starting nightly legislation update...');
    await performLegislationUpdate();
    logger.info('✅ Nightly update finished.');
  },
);
