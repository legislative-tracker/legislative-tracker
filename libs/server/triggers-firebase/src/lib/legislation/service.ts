import { db } from '../config';

export const performLegislationUpdate = async () => {
  const legislaturesSnapshot = await db.collection('legislatures').get();
  const legislaturesList = legislaturesSnapshot.docs.map((doc) => doc.id);

  const pendingLookups = legislaturesList.map(async (legislature) => {
    const snapshot = await db
      .collection(`legislatures/${legislature}/legislation`)
      .get();
    const billList = snapshot.docs.map((doc) => ({ id: doc.id }));
    return { id: legislature, bills: billList };
  });

  const updates = await Promise.all(pendingLookups);

  const bulkWriter = db.bulkWriter();

  updates.forEach((u) => {
    const cRef = db.collection(`legislatures/${u.id}/legislation`);
    u.bills.forEach((bill) => {
      const docRef = cRef.doc(bill.id);
      bulkWriter.set(docRef, bill, { merge: true });
    });
  });

  await bulkWriter.close();
  return updates;
};
