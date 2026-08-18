import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  OpenStatesBill,
  OpenStatesPerson,
} from '@legislative-tracker/shared/models';
import {
  LegislatureService,
  AddBillsParams,
} from '../services/legislature.service';

const MOCK_BILLS: OpenStatesBill[] = [
  {
    id: 'ocd-bill/mock-bill-1',
    identifier: 'S1234',
    session: '2025-2026',
    title: 'Clean Energy Infrastructure Act',
    updated_at: '2025-02-01',
    classification: ['bill'],
  },
  {
    id: 'ocd-bill/mock-bill-2',
    identifier: 'A5678',
    session: '2025-2026',
    title: 'Digital Privacy Protection Amendment',
    updated_at: '2025-01-15',
    classification: ['bill'],
  },
];

const MOCK_MEMBERS: OpenStatesPerson[] = [
  {
    id: 'ocd-person/mock-mem-1',
    name: 'Jane Doe',
    given_name: 'Jane',
    family_name: 'Doe',
    party: 'Democrat',
    email: 'jdoe@nysenate.gov',
    image: '',
    current_role: {
      title: 'Senator',
      org_classification: 'upper',
      district: '42',
    },
  },
  {
    id: 'ocd-person/mock-mem-2',
    name: 'John Smith',
    given_name: 'John',
    family_name: 'Smith',
    party: 'Republican',
    email: 'jsmith@nyassembly.gov',
    image: '',
    current_role: {
      title: 'Assembly Member',
      org_classification: 'lower',
      district: '15',
    },
  },
];

@Injectable()
export class MockLegislatureService extends LegislatureService {
  private bills = [...MOCK_BILLS];
  private members = [...MOCK_MEMBERS];

  getBillsByState(stateCode: string): Observable<OpenStatesBill[]> {
    return of(this.bills);
  }

  getMembersByState(stateCode: string): Observable<OpenStatesPerson[]> {
    return of(this.members);
  }

  getBillById(
    stateCode: string,
    id: string,
  ): Observable<OpenStatesBill | undefined> {
    const bill =
      this.bills.find(
        (b) =>
          b.id.toLowerCase() === id.toLowerCase() ||
          b.identifier?.toLowerCase() === id.toLowerCase(),
      ) ?? this.bills[0];
    return of(bill);
  }

  getMemberById(
    stateCode: string,
    id: string,
  ): Observable<OpenStatesPerson | undefined> {
    const member =
      this.members.find((m) => m.id.toLowerCase() === id.toLowerCase()) ??
      this.members[0];
    return of(member);
  }

  async addBills(params: AddBillsParams): Promise<unknown> {
    const newBills = params.billIds.map((bId, idx) => ({
      id: `ocd-bill/mock-${bId}-${idx}`,
      identifier: bId,
      session: '2025-2026',
      title: params.name,
      updated_at: new Date().toISOString(),
    }));
    this.bills.push(...newBills);
    return Promise.resolve({ data: { added: params.billIds, failed: [] } });
  }

  async removeBill(
    state: string,
    billId: string,
    chamber?: 'upper' | 'lower',
  ): Promise<unknown> {
    this.bills = this.bills.filter(
      (b) => b.id !== billId && b.identifier !== billId,
    );
    return Promise.resolve({ data: { success: true } });
  }
}
