import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { MockLegislatureService } from './mock-legislature.service';

describe('MockLegislatureService', () => {
  let service: MockLegislatureService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockLegislatureService],
    });
    service = TestBed.inject(MockLegislatureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return mock bills for state', async () => {
    const bills = await firstValueFrom(service.getBillsByState('NY'));
    expect(bills.length).toBeGreaterThan(0);
  });

  it('should return mock members for state', async () => {
    const members = await firstValueFrom(service.getMembersByState('NY'));
    expect(members.length).toBeGreaterThan(0);
  });

  it('should return mock bill by ID', async () => {
    const bill = await firstValueFrom(service.getBillById('NY', 'mock-bill-1'));
    expect(bill).toBeTruthy();
    expect(bill.id).toBe('mock-bill-1');
  });

  it('should return mock member by ID', async () => {
    const member = await firstValueFrom(
      service.getMemberById('NY', 'mock-mem-1'),
    );
    expect(member).toBeTruthy();
    expect(member.id).toBe('mock-mem-1');
  });

  it('should add a bill', async () => {
    const newBill = {
      id: 'test-bill',
      title: 'Test Bill',
    } as any;

    const result = (await service.addBill('NY', newBill)) as any;
    expect(result.data.title).toBe('Test Bill');
  });

  it('should remove a bill', async () => {
    const result = (await service.removeBill('NY', 'mock-bill-1')) as any;
    expect(result.data.success).toBe(true);
  });
});
