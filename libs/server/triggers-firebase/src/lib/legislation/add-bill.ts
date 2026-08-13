import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { db, pluginLegUsNyKey } from '../config';
import { getBillUpdates } from '@legislative-tracker/server-util-core';

/**
 * Adds a Bill & Pulls Updates (Callable)
 */
export const addBill = onCall({ secrets: [pluginLegUsNyKey] }, async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError(
      'permission-denied',
      'Only admins can add legislation.',
    );
  }

  const { state, bill } = request.data;
  if (!state || !bill || !bill.id) {
    throw new HttpsError('invalid-argument', 'Invalid data.');
  }

  const billRef = db
    .collection(`legislatures/${state}/legislation`)
    .doc(bill.id);

  try {
    await billRef.set(bill, { merge: true });
    logger.info(`Initial bill stub created for ${bill.id}`);

    try {
      logger.info(
        `Attempting to fetch details for ${bill.id} from ${state}...`,
      );

      const updates = await getBillUpdates({ id: state, bills: [bill.id] });

      if (updates.bills && updates.bills.length > 0) {
        const fullBillData = updates.bills[0];
        await billRef.set(fullBillData, { merge: true });
        logger.info(`Successfully fetched and saved full data for ${bill.id}`);

        return {
          message: `Success! Bill ${bill.id} added and details fetched.`,
          path: billRef.path,
          fetched: true,
        };
      }
    } catch (apiError) {
      logger.warn(
        `Bill added, but failed to fetch remote details: ${apiError}`,
      );

      return {
        message: `Success! Bill ${bill.id} added (details pending nightly update).`,
        path: billRef.path,
        fetched: false,
      };
    }

    return { message: `Success! Bill ${bill.id} added.`, path: billRef.path };
  } catch (error) {
    logger.error('Database write failed', error);
    throw new HttpsError('internal', 'Failed to save bill.');
  }
});
