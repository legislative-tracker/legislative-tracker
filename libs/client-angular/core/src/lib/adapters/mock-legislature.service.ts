import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Legislation,
  OpenStatesBill,
  OpenStatesPerson,
} from '@legislative-tracker/shared/models';
import {
  LegislatureService,
  AddBillsParams,
} from '../services/legislature.service';

const MOCK_LEGISLATION: Legislation[] = [
  {
    id: 'mock-leg-1',
    name: 'Clean Energy Infrastructure Act',
    description: 'Clean energy infrastructure regulations',
    upperBillId: 'S1234',
    lowerBillId: 'A5678',
    stateBillIds: { upper: 'S1234', lower: 'A5678' },
    ocdBillIds: {
      upper: 'ocd-bill/mock-bill-1',
      lower: 'ocd-bill/mock-bill-2',
    },
  },
  {
    id: 'mock-leg-2',
    name: 'Digital Privacy Protection Amendment',
    description: 'Digital privacy protection measures',
    upperBillId: 'S5678',
    lowerBillId: 'A1234',
    stateBillIds: { upper: 'S5678', lower: 'A1234' },
    ocdBillIds: {
      upper: 'ocd-bill/mock-bill-3',
      lower: 'ocd-bill/mock-bill-4',
    },
  },
];

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
  private legislation = [...MOCK_LEGISLATION];
  private bills = [...MOCK_BILLS];
  private members = [...MOCK_MEMBERS];

  getLegislationByState(stateCode: string): Observable<Legislation[]> {
    return of(this.legislation);
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
