import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

// Target Component
import { BillDetail } from './bill-detail';

// Dependencies
import { LegislatureService } from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';

// Stub Child Component
@Component({
  selector: 'app-table',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['dataSource', 'columnSource'],
})
class MockTableComponent {}

describe('BillDetail', () => {
  let component: BillDetail;
  let fixture: ComponentFixture<BillDetail>;

  // Mock Data
  const mockBillData = {
    id: 'BILL-123',
    identifier: 'S 123',
    title: 'Clean Water Act',
    session: '2024',
    cosponsors: {
      'AMENDED-A': [{ name: 'Rep. Smith', id: '1' }],
      ORIGINAL: [
        { name: 'Rep. Doe', id: '2' },
        { name: 'Rep. Jones', id: '3' },
      ],
    },
  };

  const mockLegislatureService = {
    getBillById: vi.fn().mockReturnValue(of(mockBillData)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillDetail],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
      ],
    })
      .overrideComponent(BillDetail, {
        remove: { imports: [TableComponent] },
        add: { imports: [MockTableComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BillDetail);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('stateCd', 'ny');
    fixture.componentRef.setInput('id', 'BILL-123');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch bill details with correct params on init', async () => {
    await fixture.whenStable();

    expect(mockLegislatureService.getBillById).toHaveBeenCalledWith(
      'ny',
      'BILL-123',
    );

    const bill = component.bill();
    expect(bill?.title).toBe('Clean Water Act');
  });

  it('should transform cosponsors object into billVersions array', async () => {
    await fixture.whenStable();

    const versions = component.billVersions();

    expect(versions.length).toBe(2);

    const originalVer = versions.find((v) => v.id === 'ORIGINAL');
    expect(originalVer).toBeDefined();
    expect(originalVer?.data.length).toBe(2);

    const amendedVer = versions.find((v) => v.id === 'AMENDED-A');
    expect(amendedVer).toBeDefined();
    expect(amendedVer?.data[0].name).toBe('Rep. Smith');
  });

  it('should handle missing cosponsors gracefully', async () => {
    mockLegislatureService.getBillById.mockReturnValueOnce(
      of({
        id: 'BILL-999',
        title: 'Empty Bill',
        cosponsors: null,
      }),
    );

    fixture.componentRef.setInput('id', 'BILL-999');
    fixture.detectChanges();
    await fixture.whenStable();

    const versions = component.billVersions();
    expect(versions).toEqual([]);
  });

  it('should refetch data when inputs change', async () => {
    mockLegislatureService.getBillById.mockClear();

    fixture.componentRef.setInput('stateCd', 'ca');
    fixture.componentRef.setInput('id', 'BILL-456');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockLegislatureService.getBillById).toHaveBeenCalledWith(
      'ca',
      'BILL-456',
    );
  });
});
