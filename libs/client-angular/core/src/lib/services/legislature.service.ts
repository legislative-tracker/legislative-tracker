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

/**
 * Abstract service defining queries and mutations for state legislation,
 * bill details, and elected legislative members.
 */
@Injectable()
export abstract class LegislatureService {
  /**
   * Retrieves an observable stream of all tracked legislation for a jurisdiction.
   *
   * @param stateCode - Short jurisdiction code (e.g. 'us-ny', 'us-nj').
   * @returns Observable emitting arrays of tracked Legislation records.
   */
  abstract getLegislationByState(stateCode: string): Observable<Legislation[]>;

  /**
   * Retrieves an observable stream of all elected members/legislators for a jurisdiction.
   *
   * @param stateCode - Short jurisdiction code (e.g. 'us-ny', 'us-nj').
   * @returns Observable emitting arrays of OpenStatesPerson records.
   */
  abstract getMembersByState(stateCode: string): Observable<OpenStatesPerson[]>;

  /**
   * Retrieves detailed information for a single bill by its identifier.
   *
   * @param stateCode - Short jurisdiction code.
   * @param id - OCD bill ID or canonical state bill ID (e.g. 'S100').
   * @returns Observable emitting the matching OpenStatesBill or Legislation, or `undefined` if not found.
   */
  abstract getBillById(
    stateCode: string,
    id: string,
  ): Observable<OpenStatesBill | Legislation | undefined>;

  /**
   * Retrieves detailed profile and sponsorship records for an individual legislator.
   *
   * @param stateCode - Short jurisdiction code.
   * @param id - OCD person ID or formatted document ID.
   * @returns Observable emitting the OpenStatesPerson record, or `undefined` if not found.
   */
  abstract getMemberById(
    stateCode: string,
    id: string,
  ): Observable<OpenStatesPerson | undefined>;

  /**
   * Registers new bills to be tracked in a state jurisdiction.
   *
   * @param params - Configuration parameters specifying state, bill IDs, and titles.
   */
  abstract addBills(params: AddBillsParams): Promise<unknown>;

  /**
   * Removes a bill from tracked legislation.
   *
   * @param state - State jurisdiction code.
   * @param billId - Target bill ID.
   * @param chamber - Optional chamber filter ('upper' or 'lower').
   */
  abstract removeBill(
    state: string,
    billId: string,
    chamber?: 'upper' | 'lower',
  ): Promise<unknown>;

  /**
   * Updates metadata (titles, descriptions, chamber mappings) for an existing tracked bill.
   *
   * @param params - Updated bill parameters.
   */
  abstract updateBill(params: UpdateBillParams): Promise<unknown>;

  /**
   * Triggers an on-demand manual refresh of all tracked legislation data from external sources.
   */
  abstract manualUpdateLegislation(): Promise<unknown>;

  /**
   * Triggers an on-demand manual refresh of all elected legislator profiles.
   */
  abstract manualUpdateLegislators(): Promise<unknown>;
}
