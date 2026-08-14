import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Legislation, Legislator } from '@legislative-tracker/shared/models';
import { LegislatureService } from '../services/legislature.service';

const MOCK_BILLS: Legislation[] = [
  {
    id: 'mock-bill-1',
    session: '2025-2026',
    title: 'Clean Energy Infrastructure Act',
    text: 'An act establishing funding and incentives for renewable energy installation across public facilities.',
    classification: 'bill',
    updated_at: '2025-02-01',
  },
  {
    id: 'mock-bill-2',
    session: '2025-2026',
    title: 'Digital Privacy Protection Amendment',
    text: 'Provides consumer privacy protection and data handling standard requirements for technology companies.',
    classification: 'bill',
    updated_at: '2025-01-15',
  },
];

const MOCK_MEMBERS: Legislator[] = [
  {
    id: 'mock-mem-1',
    name: 'Jane Doe',
    district: '42',
    chamber: 'SENATE',
    party: 'Democrat',
    email: 'jdoe@nysenate.gov',
    image: '',
    offices: [],
  },
  {
    id: 'mock-mem-2',
    name: 'John Smith',
    district: '15',
    chamber: 'ASSEMBLY',
    party: 'Republican',
    email: 'jsmith@nyassembly.gov',
    image: '',
    offices: [],
  },
];

@Injectable()
export class MockLegislatureService extends LegislatureService {
  private bills = [...MOCK_BILLS];
  private members = [...MOCK_MEMBERS];

  getBillsByState(stateCode: string): Observable<Legislation[]> {
    return of(this.bills);
  }

  getMembersByState(stateCode: string): Observable<Legislator[]> {
    return of(this.members);
  }

  getBillById(stateCode: string, id: string): Observable<Legislation> {
    const bill =
      this.bills.find((b) => b.id.toLowerCase() === id.toLowerCase()) ??
      this.bills[0];
    return of(bill);
  }

  getMemberById(stateCode: string, id: string): Observable<Legislator> {
    const member =
      this.members.find((m) => m.id.toLowerCase() === id.toLowerCase()) ??
      this.members[0];
    return of(member);
  }

  async addBill(state: string, billData: Legislation): Promise<unknown> {
    const newBill = { ...billData, id: `mock-bill-${Date.now()}` };
    this.bills.push(newBill);
    return Promise.resolve({ data: newBill });
  }

  async removeBill(state: string, billId: string): Promise<unknown> {
    this.bills = this.bills.filter((b) => b.id !== billId);
    return Promise.resolve({ data: { success: true } });
  }
}
