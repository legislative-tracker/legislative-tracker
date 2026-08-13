import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { dataAccessOpenStatesKey, pluginLegUsNyKey } from '../config';
import { updateLegislators } from './service';

export const monthlyUpdate = onSchedule(
  {
    schedule: '1st Monday of month 05:00',
    timeZone: 'America/New_York',
    secrets: [dataAccessOpenStatesKey, pluginLegUsNyKey],
    retryCount: 3,
  },
  async () => {
    logger.info('🗓️ Starting monthly legislator update...');

    try {
      const results = await updateLegislators();

      logger.info('✅ Monthly update complete.', results);
    } catch (error) {
      logger.error('❌ Monthly update failed.', error);
    }
  },
);
