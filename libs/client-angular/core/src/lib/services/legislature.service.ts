import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Legislation, Legislator } from '@legislative-tracker/shared/models';

@Injectable()
export abstract class LegislatureService {
  abstract getBillsByState(stateCode: string): Observable<Legislation[]>;
  abstract getMembersByState(stateCode: string): Observable<Legislator[]>;
  abstract getBillById(stateCode: string, id: string): Observable<Legislation>;
  abstract getMemberById(stateCode: string, id: string): Observable<Legislator>;

  abstract addBill(state: string, billData: Legislation): Promise<unknown>;
  abstract removeBill(state: string, billId: string): Promise<unknown>;
}
