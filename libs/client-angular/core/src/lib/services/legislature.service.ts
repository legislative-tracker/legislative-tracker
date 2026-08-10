import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

// App imports
import { Legislation, Legislator } from '@legislative-tracker/shared/models';

@Injectable({ providedIn: 'root' })
export class LegislatureService {
  private app = inject(FirebaseApp);

  // provides a db path string for the 'get' functions
  private getPaths = (stateCd: string): { bills: string; members: string } => {
    return {
      bills: `legislatures/${stateCd}/legislation`,
      members: `legislatures/${stateCd}/legislators`,
    };
  };

  // This method fetches all state legislation
  getBillsByState(stateCode: string): Observable<Legislation[]> {
    // Lazy load the Firestore SDK
    return from(import('@angular/fire/firestore')).pipe(
      switchMap((firestoreLib) => {
        // Instantiate Firestore manually
        const firestore = firestoreLib.getFirestore(this.app);

        // Create Reference and Data Stream
        const billsRef = firestoreLib.collection(firestore, this.getPaths(stateCode).bills);
        return firestoreLib.collectionData(billsRef, { idField: 'id' }) as Observable<
          Legislation[]
        >;
      }),
    );
  }

  // This method fetches all state legislators
  getMembersByState(stateCode: string): Observable<Legislator[]> {
    return from(import('@angular/fire/firestore')).pipe(
      switchMap((firestoreLib) => {
        const firestore = firestoreLib.getFirestore(this.app);
        const membersRef = firestoreLib.collection(firestore, this.getPaths(stateCode).members);
        return firestoreLib.collectionData(membersRef, { idField: 'id' }) as Observable<
          Legislator[]
        >;
      }),
    );
  }

  // This method fetches a single bill within a state legislature
  getBillById(stateCode: string, id: string): Observable<Legislation> {
    return from(import('@angular/fire/firestore')).pipe(
      switchMap((firestoreLib) => {
        const firestore = firestoreLib.getFirestore(this.app);
        const path = this.getPaths(stateCode).bills + `/${id}`;
        const billRef = firestoreLib.doc(firestore, path);
        return firestoreLib.docData(billRef, { idField: 'id' }) as Observable<Legislation>;
      }),
    );
  }

  // This method fetches a single member within a state legislature
  getMemberById(stateCode: string, id: string): Observable<Legislator> {
    return from(import('@angular/fire/firestore')).pipe(
      switchMap((firestoreLib) => {
        const firestore = firestoreLib.getFirestore(this.app);
        const path = this.getPaths(stateCode).members + `/${id}`;
        const memberRef = firestoreLib.doc(firestore, path);
        return firestoreLib.docData(memberRef, { idField: 'id' }) as Observable<Legislator>;
      }),
    );
  }

  //ADMIN FUNCTIONS
  async addBill(state: string, billData: Legislation) {
    // Lazy load Functions SDK
    const { getFunctions, httpsCallable } = await import('@angular/fire/functions');
    const functions = getFunctions(this.app);

    const addBillFn = httpsCallable(functions, 'legislation-addBill');

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
    const { getFunctions, httpsCallable } = await import('@angular/fire/functions');
    const functions = getFunctions(this.app);

    const removeBillFn = httpsCallable(functions, 'legislation-removeBill');

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
