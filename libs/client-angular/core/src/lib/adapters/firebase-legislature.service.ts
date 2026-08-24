import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  limit,
  setDoc,
} from 'firebase/firestore';
import { Functions, httpsCallable } from 'firebase/functions';
import { Observable } from 'rxjs';
import {
  Legislation,
  OpenStatesBill,
  OpenStatesPerson,
} from '@legislative-tracker/shared/models';
import {
  LegislatureService,
  AddBillsParams,
  UpdateBillParams,
} from '../services/legislature.service';
import { FIREBASE_FIRESTORE, FIREBASE_FUNCTIONS } from '../firebase-tokens';

@Injectable()
export class FirebaseLegislatureService extends LegislatureService {
  private firestore = inject<Firestore>(FIREBASE_FIRESTORE, { optional: true });
  private functions = inject<Functions>(FIREBASE_FUNCTIONS, { optional: true });

  private resolveJurisdictionCode(state: string): string {
    if (!state) return '';
    const s = state.trim().toLowerCase();
    if (s.startsWith('us-')) return s;
    if (s.length === 2) return `us-${s}`;
    return s;
  }

  private cleanDocId(id: string, prefix: string): string {
    if (!id) return '';
    let clean = id.trim();
    if (clean.startsWith(`${prefix}/`)) {
      clean = clean.substring(prefix.length + 1);
    } else if (clean.startsWith(`${prefix}:`)) {
      clean = clean.substring(prefix.length + 1);
    }
    return clean;
  }

  private getPaths = (stateCd: string) => {
    const code = this.resolveJurisdictionCode(stateCd);
    return {
      bills: `legislatures/${code}/legislation`,
      ocdBills: `legislatures/${code}/ocd-bill`,
      members: `legislatures/${code}/ocd-person`,
    };
  };

  getLegislationByState(stateCode: string): Observable<Legislation[]> {
    return new Observable<Legislation[]>((subscriber) => {
      if (!this.firestore) {
        subscriber.next([]);
        return;
      }
      const legislationRef = collection(
        this.firestore,
        this.getPaths(stateCode).bills,
      );
      return onSnapshot(
        legislationRef,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Legislation[];
          subscriber.next(list);
        },
        (error) => {
          console.error(`Error fetching legislation for ${stateCode}:`, error);
          subscriber.error(error);
        },
      );
    });
  }

  getMembersByState(stateCode: string): Observable<OpenStatesPerson[]> {
    return new Observable<OpenStatesPerson[]>((subscriber) => {
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
          })) as OpenStatesPerson[];
          subscriber.next(list);
        },
        (error) => {
          console.error(`Error fetching members for ${stateCode}:`, error);
          subscriber.error(error);
        },
      );
    });
  }

  getBillById(
    stateCode: string,
    id: string,
  ): Observable<OpenStatesBill | undefined> {
    return new Observable<OpenStatesBill | undefined>((subscriber) => {
      if (!this.firestore) {
        subscriber.next(undefined);
        return;
      }
      const ocdBillsPath = this.getPaths(stateCode).ocdBills;
      const cleanId = this.cleanDocId(id, 'ocd-bill');
      const billRef = doc(this.firestore, `${ocdBillsPath}/${cleanId}`);

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
            } as OpenStatesBill);
          } else {
            const printNo = cleanId.split('-')[0].toUpperCase();
            const billsRef = collection(this.firestore!, ocdBillsPath);
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
                    d.id.toUpperCase() === cleanId.toUpperCase() ||
                    d.id.toUpperCase() === id.toUpperCase() ||
                    d.id.toUpperCase().startsWith(`${printNo}-`) ||
                    (d.data() as OpenStatesBill).identifier?.toUpperCase() ===
                      printNo,
                );
                if (match) {
                  subscriber.next({
                    id: match.id,
                    ...match.data(),
                  } as OpenStatesBill);
                } else {
                  subscriber.next(undefined);
                }
              },
              (err) => {
                console.error(`Error in bill fallback query for ${id}:`, err);
                subscriber.next(undefined);
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

  getMemberById(
    stateCode: string,
    id: string,
  ): Observable<OpenStatesPerson | undefined> {
    return new Observable<OpenStatesPerson | undefined>((subscriber) => {
      if (!this.firestore) {
        subscriber.next(undefined);
        return;
      }
      const membersPath = this.getPaths(stateCode).members;
      const cleanId = this.cleanDocId(id, 'ocd-person');
      const memberRef = doc(this.firestore, `${membersPath}/${cleanId}`);

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
            } as OpenStatesPerson);
          } else {
            const membersRef = collection(this.firestore!, membersPath);
            if (fallbackUnsub) fallbackUnsub();

            const fallbackQuery = query(
              membersRef,
              where('id', 'in', [id, cleanId, `ocd-person/${cleanId}`]),
              limit(10),
            );

            fallbackUnsub = onSnapshot(
              fallbackQuery,
              (collectionSnap) => {
                const match = collectionSnap.docs.find(
                  (d) =>
                    d.id === cleanId ||
                    d.id.toLowerCase() === id.toLowerCase() ||
                    d.id.toLowerCase().includes(cleanId.toLowerCase()),
                );
                if (match) {
                  subscriber.next({
                    id: match.id,
                    ...match.data(),
                  } as OpenStatesPerson);
                } else {
                  subscriber.next(undefined);
                }
              },
              (err) => {
                console.error(`Error in member fallback query for ${id}:`, err);
                subscriber.next(undefined);
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

  async addBills(params: AddBillsParams) {
    if (!this.functions) throw new Error('Firebase Functions not provided');
    const addBillsFn = httpsCallable(this.functions, 'legislation-addBills');
    try {
      const result = await addBillsFn({
        state: params.state,
        name: params.name,
        description: params.description,
        billIds: params.billIds,
      });
      console.log('Bills created:', result.data);
      return result;
    } catch (error) {
      console.error('Failed to create bills:', error);
      throw error;
    }
  }

  async removeBill(state: string, billId: string, chamber?: 'upper' | 'lower') {
    if (!this.functions) throw new Error('Firebase Functions not provided');
    const removeBillFn = httpsCallable(
      this.functions,
      'legislation-removeBill',
    );
    try {
      const result = await removeBillFn({ state, billId, chamber });
      console.log('Bill removed:', result.data);
      return result;
    } catch (error) {
      console.error('Failed to remove bill:', error);
      throw error;
    }
  }

  async updateBill(params: UpdateBillParams) {
    if (!this.firestore) throw new Error('Firestore not provided');
    const code = this.resolveJurisdictionCode(params.state);
    const billRef = doc(
      this.firestore,
      `legislatures/${code}/legislation/${params.id}`,
    );

    const payload: Record<string, unknown> = {};
    if (params.name !== undefined) payload['name'] = params.name;
    if (params.description !== undefined)
      payload['description'] = params.description;

    const stateBillIds: Record<string, string> = {};
    if (params.upperBillId !== undefined) {
      payload['upperBillId'] = params.upperBillId;
      if (params.upperBillId) stateBillIds['upper'] = params.upperBillId;
    }
    if (params.lowerBillId !== undefined) {
      payload['lowerBillId'] = params.lowerBillId;
      if (params.lowerBillId) stateBillIds['lower'] = params.lowerBillId;
    }
    if (Object.keys(stateBillIds).length > 0) {
      payload['stateBillIds'] = stateBillIds;
    }

    try {
      await setDoc(billRef, payload, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Failed to update bill:', error);
      throw error;
    }
  }

  async manualUpdateLegislation() {
    if (!this.functions) throw new Error('Firebase Functions not provided');
    const updateFn = httpsCallable(this.functions, 'legislation-manualUpdate');
    try {
      const result = await updateFn();
      console.log('Legislation manual update completed:', result.data);
      return result;
    } catch (error) {
      console.error('Failed to manually update legislation:', error);
      throw error;
    }
  }

  async manualUpdateLegislators() {
    if (!this.functions) throw new Error('Firebase Functions not provided');
    const updateFn = httpsCallable(this.functions, 'legislators-manualUpdate');
    try {
      const result = await updateFn();
      console.log('Legislators manual update completed:', result.data);
      return result;
    } catch (error) {
      console.error('Failed to manually update legislators:', error);
      throw error;
    }
  }
}
