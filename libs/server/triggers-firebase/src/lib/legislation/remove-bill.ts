import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config';

/**
 * Deletes a Bill (Callable)
 */
export const removeBill = onCall(async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError(
      'permission-denied',
      'Only admins can delete legislation.',
    );
  }
  const { state, billId } = request.data;
  if (!state || !billId)
    throw new HttpsError('invalid-argument', 'Invalid data.');

  try {
    const billRef = db
      .collection(`legislatures/${state}/legislation`)
      .doc(billId);
    await billRef.delete();
    return { message: `Success! Bill ${billId} removed.`, id: billId };
  } catch (error) {
    throw new HttpsError('internal', 'Failed to delete bill.');
  }
});
