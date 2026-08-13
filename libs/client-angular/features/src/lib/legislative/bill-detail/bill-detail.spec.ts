import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

// Target Component
import { BillDetail } from './bill-detail';

// Dependencies
import { LegislatureService } from '@legislative-tracker/client-angular/data-access-legislature';
import { TableComponent } from '@legislative-tracker/client-angular/ui';

// -------------------------------------------------------------------------
// Stub Child Components
// -------------------------------------------------------------------------
@Component({
  selector: 'app-table',
  template: '',
  standalone: true,
  inputs: ['dataSource', 'columnSource'],
})
class MockTableComponent {}

describe('BillDetail', () => {
  let component: BillDetail;
  let fixture: ComponentFixture<BillDetail>;

  // Mock Data
  const mockBillData = {
    id: 'BILL-123',
    title: 'Clean Water Act',
    description: 'A bill to ensure clean water.',
    session: '2024',
    // Structure matches logic: Object.entries(cosponsors)
    cosponsors: {
      'AMENDED-A': [{ name: 'Rep. Smith', id: '1' }],
      ORIGINAL: [
        { name: 'Rep. Doe', id: '2' },
        { name: 'Rep. Jones', id: '3' },
      ],
    },
  };

  // Mock Service
  const mockLegislatureService = {
    getBillById: vi.fn().mockReturnValue(of(mockBillData)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillDetail], // Standalone
      providers: [
        provideNoopAnimations(), // Prevent MatTabs animation errors
        { provide: LegislatureService, useValue: mockLegislatureService },
      ],
    })
      // Override TableComponent with Stub
      .overrideComponent(BillDetail, {
        remove: { imports: [TableComponent] },
        add: { imports: [MockTableComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BillDetail);
    component = fixture.componentInstance;

    // Initialize Required Inputs
    fixture.componentRef.setInput('stateCd', 'ny');
    fixture.componentRef.setInput('id', 'BILL-123');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch bill details with correct params on init', async () => {
    // rxResource triggers immediately, but we wait for stability to be safe
    await fixture.whenStable();

    expect(mockLegislatureService.getBillById).toHaveBeenCalledWith(
      'ny',
      'BILL-123',
    );

    const bill = component.bill();
    expect(bill?.title).toBe('Clean Water Act');
  });

  it('should transform cosponsors object into billVersions array', async () => {
    await fixture.whenStable(); // Wait for data to settle

    const versions = component.billVersions();

    // Logic: Object.entries -> map to { id, data }
    expect(versions.length).toBe(2);

    // Verify first version (Order depends on JS object iteration, usually insertion order for string keys,
    // but specific assertion is safer by finding)
    const originalVer = versions.find((v) => v.id === 'ORIGINAL');
    expect(originalVer).toBeDefined();
    expect(originalVer?.data.length).toBe(2); // Rep. Doe, Rep. Jones

    const amendedVer = versions.find((v) => v.id === 'AMENDED-A');
    expect(amendedVer).toBeDefined();
    expect(amendedVer?.data[0].name).toBe('Rep. Smith');
  });

  it('should handle missing cosponsors gracefully', async () => {
    // Mock service returning bill with NO cosponsors
    mockLegislatureService.getBillById.mockReturnValueOnce(
      of({
        id: 'BILL-999',
        title: 'Empty Bill',
        cosponsors: null, // or undefined
      }),
    );

    // Change Input ID to trigger refetch
    fixture.componentRef.setInput('id', 'BILL-999');
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify transformation handles null safely
    const versions = component.billVersions();
    expect(versions).toEqual([]);
  });

  it('should refetch data when inputs change', async () => {
    mockLegislatureService.getBillById.mockClear();

    // Change State and ID
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
