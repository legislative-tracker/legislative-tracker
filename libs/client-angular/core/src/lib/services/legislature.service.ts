import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Legislation,
  OpenStatesBill,
  OpenStatesPerson,
  AddBillsParams,
  UpdateBillParams,
} from '@legislative-tracker/shared/models';

export { AddBillsParams, UpdateBillParams };

@Injectable()
export abstract class LegislatureService {
  abstract getLegislationByState(stateCode: string): Observable<Legislation[]>;
  abstract getMembersByState(stateCode: string): Observable<OpenStatesPerson[]>;
  abstract getBillById(
    stateCode: string,
    id: string,
  ): Observable<OpenStatesBill | Legislation | undefined>;
  abstract getMemberById(
    stateCode: string,
    id: string,
  ): Observable<OpenStatesPerson | undefined>;

  abstract addBills(params: AddBillsParams): Promise<unknown>;
  abstract removeBill(
    state: string,
    billId: string,
    chamber?: 'upper' | 'lower',
  ): Promise<unknown>;
  abstract updateBill(params: UpdateBillParams): Promise<unknown>;
  abstract manualUpdateLegislation(): Promise<unknown>;
  abstract manualUpdateLegislators(): Promise<unknown>;
}
