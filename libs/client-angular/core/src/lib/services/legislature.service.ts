import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Legislation,
  OpenStatesBill,
  OpenStatesPerson,
} from '@legislative-tracker/shared/models';

export interface AddBillsParams {
  state: string;
  name: string;
  description?: string;
  billIds: string[];
}

@Injectable()
export abstract class LegislatureService {
  abstract getBillsByState(
    stateCode: string,
  ): Observable<OpenStatesBill[] | Legislation[]>;
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
}
