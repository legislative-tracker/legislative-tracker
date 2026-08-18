import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
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
    const bill = await firstValueFrom(
      service.getBillById('NY', 'ocd-bill/mock-bill-1'),
    );
    expect(bill).toBeTruthy();
    expect(bill?.id).toBe('ocd-bill/mock-bill-1');
  });

  it('should return mock member by ID', async () => {
    const member = await firstValueFrom(
      service.getMemberById('NY', 'ocd-person/mock-mem-1'),
    );
    expect(member).toBeTruthy();
    expect(member?.id).toBe('ocd-person/mock-mem-1');
  });

  it('should add bills', async () => {
    const result = (await service.addBills({
      state: 'NY',
      name: 'Test Bill',
      billIds: ['S100'],
    })) as any;
    expect(result.data.added).toContain('S100');
  });

  it('should remove a bill', async () => {
    const result = (await service.removeBill(
      'NY',
      'ocd-bill/mock-bill-1',
    )) as any;
    expect(result.data.success).toBe(true);
  });
});
