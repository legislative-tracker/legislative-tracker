import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { Functions, httpsCallable } from 'firebase/functions';
import { Observable } from 'rxjs';
import { Legislation, Legislator } from '@legislative-tracker/shared/models';
import { LegislatureService } from '../services/legislature.service';
import { FIREBASE_FIRESTORE, FIREBASE_FUNCTIONS } from '../firebase-tokens';

@Injectable()
export class FirebaseLegislatureService extends LegislatureService {
  private firestore = inject<Firestore>(FIREBASE_FIRESTORE, { optional: true });
  private functions = inject<Functions>(FIREBASE_FUNCTIONS, { optional: true });

  private getPaths = (stateCd: string): { bills: string; members: string } => {
    return {
      bills: `legislatures/${stateCd}/legislation`,
      members: `legislatures/${stateCd}/legislators`,
    };
  };

  getBillsByState(stateCode: string): Observable<Legislation[]> {
    return new Observable<Legislation[]>((subscriber) => {
      if (!this.firestore) {
        subscriber.next([]);
        return;
      }
      const billsRef = collection(
        this.firestore,
        this.getPaths(stateCode).bills,
      );
      return onSnapshot(
        billsRef,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Legislation[];
          subscriber.next(list);
        },
        (error) => {
          console.error(`Error fetching bills for ${stateCode}:`, error);
          subscriber.error(error);
        },
      );
    });
  }

  getMembersByState(stateCode: string): Observable<Legislator[]> {
    return new Observable<Legislator[]>((subscriber) => {
      if (!this.firestore) {
        subscriber.next([]);
        return;
      }
      const membersRef = collection(
        this.firestore,
        this.getPaths(stateCode).members,
      );
      return onSnapshot(
        membersRef,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Legislator[];
          subscriber.next(list);
        },
        (error) => {
          console.error(`Error fetching members for ${stateCode}:`, error);
          subscriber.error(error);
        },
      );
    });
  }

  getBillById(stateCode: string, id: string): Observable<Legislation> {
    return new Observable<Legislation>((subscriber) => {
      if (!this.firestore) {
        subscriber.next(undefined as any);
        return;
      }
      const billsPath = this.getPaths(stateCode).bills;
      const billRef = doc(this.firestore, `${billsPath}/${id}`);

      let fallbackUnsub: (() => void) | undefined;

      const mainUnsub = onSnapshot(
        billRef,
        (snapshot) => {
          if (snapshot.exists()) {
            if (fallbackUnsub) {
              fallbackUnsub();
              fallbackUnsub = undefined;
            }
            subscriber.next({
              id: snapshot.id,
              ...snapshot.data(),
            } as Legislation);
          } else {
            const printNo = id.split('-')[0].toUpperCase();
            const billsRef = collection(this.firestore!, billsPath);
            if (fallbackUnsub) fallbackUnsub();

            const fallbackQuery = query(
              billsRef,
              where('identifier', '==', printNo),
              limit(10),
            );

            fallbackUnsub = onSnapshot(
              fallbackQuery,
              (collectionSnap) => {
                const match = collectionSnap.docs.find(
                  (d) =>
                    d.id.toUpperCase() === id.toUpperCase() ||
                    d.id.toUpperCase().startsWith(`${printNo}-`) ||
                    (d.data() as Legislation).identifier?.toUpperCase() ===
                      printNo,
                );
                if (match) {
                  subscriber.next({
                    id: match.id,
                    ...match.data(),
                  } as Legislation);
                } else {
                  subscriber.next(undefined as any);
                }
              },
              (err) => {
                console.error(`Error in bill fallback query for ${id}:`, err);
                subscriber.next(undefined as any);
              },
            );
          }
        },
        (error) => {
          console.error(`Error fetching bill ${id}:`, error);
          subscriber.error(error);
        },
      );

      return () => {
        mainUnsub();
        if (fallbackUnsub) fallbackUnsub();
      };
    });
  }

  getMemberById(stateCode: string, id: string): Observable<Legislator> {
    return new Observable<Legislator>((subscriber) => {
      if (!this.firestore) {
        subscriber.next(undefined as any);
        return;
      }
      const membersPath = this.getPaths(stateCode).members;
      const memberRef = doc(
        this.firestore,
        `${membersPath}/${id.toLowerCase()}`,
      );

      let fallbackUnsub: (() => void) | undefined;

      const mainUnsub = onSnapshot(
        memberRef,
        (snapshot) => {
          if (snapshot.exists()) {
            if (fallbackUnsub) {
              fallbackUnsub();
              fallbackUnsub = undefined;
            }
            subscriber.next({
              id: snapshot.id,
              ...snapshot.data(),
            } as Legislator);
          } else {
            const membersRef = collection(this.firestore!, membersPath);
            if (fallbackUnsub) fallbackUnsub();

            const fallbackQuery = query(
              membersRef,
              where('id', '==', id.toLowerCase()),
              limit(10),
            );

            fallbackUnsub = onSnapshot(
              fallbackQuery,
              (collectionSnap) => {
                const match = collectionSnap.docs.find(
                  (d) =>
                    d.id.toLowerCase() === id.toLowerCase() ||
                    d.id.toLowerCase().includes(id.toLowerCase()),
                );
                if (match) {
                  subscriber.next({
                    id: match.id,
                    ...match.data(),
                  } as Legislator);
                } else {
                  subscriber.next(undefined as any);
                }
              },
              (err) => {
                console.error(`Error in member fallback query for ${id}:`, err);
                subscriber.next(undefined as any);
              },
            );
          }
        },
        (error) => {
          console.error(`Error fetching member ${id}:`, error);
          subscriber.error(error);
        },
      );

      return () => {
        mainUnsub();
        if (fallbackUnsub) fallbackUnsub();
      };
    });
  }

  async addBill(state: string, billData: Legislation) {
    if (!this.functions) throw new Error('Firebase Functions not provided');
    const addBillFn = httpsCallable(this.functions, 'legislation-addBill');
    try {
      const result = await addBillFn({ state, bill: billData });
      console.log('Bill created:', result.data);
      return result;
    } catch (error) {
      console.error('Failed to create bill:', error);
      throw error;
    }
  }

  async removeBill(state: string, billId: string) {
    if (!this.functions) throw new Error('Firebase Functions not provided');
    const removeBillFn = httpsCallable(
      this.functions,
      'legislation-removeBill',
    );
    try {
      const result = await removeBillFn({ state, billId });
      console.log('Bill removed:', result.data);
      return result;
    } catch (error) {
      console.error('Failed to remove bill:', error);
      throw error;
    }
  }
}
