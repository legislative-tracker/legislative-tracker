import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { Legislation, Legislator } from '@legislative-tracker/shared/models';
import { LegislatureService } from '../services/legislature.service';

@Injectable()
export class FirebaseLegislatureService extends LegislatureService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);

  private getPaths = (stateCd: string): { bills: string; members: string } => {
    return {
      bills: `legislatures/${stateCd}/legislation`,
      members: `legislatures/${stateCd}/legislators`,
    };
  };

  getBillsByState(stateCode: string): Observable<Legislation[]> {
    const billsRef = collection(
      this.firestore,
      this.getPaths(stateCode).bills,
    );
    return collectionData(billsRef, {
      idField: 'id',
    }) as Observable<Legislation[]>;
  }

  getMembersByState(stateCode: string): Observable<Legislator[]> {
    const membersRef = collection(
      this.firestore,
      this.getPaths(stateCode).members,
    );
    return collectionData(membersRef, {
      idField: 'id',
    }) as Observable<Legislator[]>;
  }

  getBillById(stateCode: string, id: string): Observable<Legislation> {
    const path = this.getPaths(stateCode).bills + `/${id}`;
    const billRef = doc(this.firestore, path);
    return docData(billRef, {
      idField: 'id',
    }) as Observable<Legislation>;
  }

  getMemberById(stateCode: string, id: string): Observable<Legislator> {
    const path = this.getPaths(stateCode).members + `/${id.toLowerCase()}`;
    const memberRef = doc(this.firestore, path);
    return docData(memberRef, {
      idField: 'id',
    }) as Observable<Legislator>;
  }

  async addBill(state: string, billData: Legislation) {
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
