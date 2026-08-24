import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Legislation } from '@legislative-tracker/shared/models';
import { getJurisdictionCode } from '@legislative-tracker/server-util-core';
import { db } from '../firebase.config';
import { formatDocId } from '../helpers.util';

/**
 * Deletes a Bill / Chamber reference (Callable)
 */
export const removeBill = onCall(async (request) => {
  if (request.auth?.token['admin'] !== true) {
    throw new HttpsError(
      'permission-denied',
      'Only admins can delete legislation.',
    );
  }

  const { state, billId, chamber } = request.data || {};
  if (!state || !billId) {
    throw new HttpsError('invalid-argument', 'State and billId are required.');
  }

  const stateKey = getJurisdictionCode(state);
  const cleanBillId = billId.trim();
  const cleanChamber =
    typeof chamber === 'string'
      ? (chamber.trim().toLowerCase() as 'upper' | 'lower')
      : undefined;

  const legislationRef = db
    .collection(`legislatures/${stateKey}/legislation`)
    .doc(cleanBillId);

  const legislationSnap = await legislationRef.get();

  if (!legislationSnap.exists) {
    // Fallback: check if billId corresponds directly to an ocd-bill document ID
    const ocdDocId = formatDocId(cleanBillId);
    const ocdBillRef = db
      .collection(`legislatures/${stateKey}/ocd-bill`)
      .doc(ocdDocId);

    const ocdSnap = await ocdBillRef.get();
    if (ocdSnap.exists) {
      await ocdBillRef.delete();
      return {
        message: `Deleted ocd-bill document ${ocdDocId}`,
        id: cleanBillId,
      };
    }

    throw new HttpsError('not-found', `Bill ${cleanBillId} not found.`);
  }

  const data = legislationSnap.data() as Legislation;
  const ocdBillIds = { ...data.ocdBillIds };
  const stateBillIds = { ...data.stateBillIds };

  // Determine target chambers to remove
  const targetChambers: Array<'upper' | 'lower'> = cleanChamber
    ? [cleanChamber]
    : ['upper', 'lower'];

  for (const ch of targetChambers) {
    const ocdId = ocdBillIds[ch];
    if (ocdId) {
      const ocdDocId = formatDocId(ocdId);
      const ocdBillRef = db
        .collection(`legislatures/${stateKey}/ocd-bill`)
        .doc(ocdDocId);
      await ocdBillRef.delete();
    }
    delete ocdBillIds[ch];
    delete stateBillIds[ch];
  }

  // If no chambers remain in stateBillIds or ocdBillIds, delete the legislation document
  if (
    !stateBillIds.upper &&
    !stateBillIds.lower &&
    !ocdBillIds.upper &&
    !ocdBillIds.lower
  ) {
    await legislationRef.delete();
    return {
      message: `Successfully removed legislation ${cleanBillId} and all associated ocd-bill documents.`,
      id: cleanBillId,
    };
  }

  // Otherwise, update the legislation document with remaining chamber references
  await legislationRef.set(
    {
      stateBillIds,
      ocdBillIds,
    },
    { merge: true },
  );

  return {
    message: `Updated legislation ${cleanBillId}: removed ${cleanChamber || 'all'} chamber entries.`,
    id: cleanBillId,
  };
});
