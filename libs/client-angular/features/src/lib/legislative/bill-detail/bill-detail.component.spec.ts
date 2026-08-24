import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { BillDetail } from './bill-detail.component';

// Dependencies
import {
  AuthService,
  LegislatureService,
  SeoService,
} from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';
import { signal } from '@angular/core';

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

  const mockSeoService = {
    updateTags: vi.fn(),
    resetTags: vi.fn(),
  };

  const mockUserProfileSignal = signal<any>(null);
  const mockAuthService = {
    userProfile: mockUserProfileSignal,
  };

  beforeEach(async () => {
    mockSeoService.updateTags.mockClear();
    mockSeoService.resetTags.mockClear();
    mockUserProfileSignal.set(null);

    await TestBed.configureTestingModule({
      imports: [BillDetail],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: AuthService, useValue: mockAuthService },
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

  it('should update SEO tags with bill title and details', async () => {
    await fixture.whenStable();

    expect(mockSeoService.updateTags).toHaveBeenCalledWith({
      title: 'S 123: Clean Water Act',
      description: 'Clean Water Act',
      type: 'article',
      twitterCard: 'summary',
    });
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

  it('should badge sponsors that match the user representative profile', async () => {
    mockUserProfileSignal.set({
      districts: { state: { senate: '42' } },
      legislators: {
        state: [
          {
            id: 'ocd-person/2',
            name: 'Rep. Doe',
            chamber: 'Senate',
            district: '42',
            party: 'Democrat',
          },
        ],
        federal: [],
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const versions = component.billVersions();
    const originalVer = versions.find((v) => v.id === 'ORIGINAL');
    expect(originalVer).toBeDefined();

    const repDoe = originalVer?.data.find((d: any) => d.name === 'Rep. Doe');
    expect(repDoe?.repBadge).toBe('Your State Senator');
    expect(repDoe?.isUserRep).toBe(true);

    const repJones = originalVer?.data.find(
      (d: any) => d.name === 'Rep. Jones',
    );
    expect(repJones?.repBadge).toBeUndefined();
    expect(repJones?.isUserRep).toBe(false);

    expect(component.userRepSponsors()).toEqual([
      { name: 'Rep. Doe', badge: 'Your State Senator', isPrimary: false },
    ]);
  });

  it('should badge sponsorships array in OpenStates schema', async () => {
    mockBillData.cosponsors = null as any;
    (mockBillData as any).sponsorships = [
      {
        id: 'ocd-person/555',
        name: 'Jane Senator',
        primary: true,
        classification: 'primary',
        entity_type: 'person',
        person: { id: 'ocd-person/555', party: 'Democratic' },
      },
    ];

    mockUserProfileSignal.set({
      legislators: {
        federal: [
          {
            id: '555',
            name: 'Jane Senator',
            chamber: 'Senate',
            district: 'US',
            party: 'Democratic',
          },
        ],
        state: [],
      },
    });

    mockLegislatureService.getBillById.mockReturnValueOnce(of(mockBillData));
    fixture.componentRef.setInput('id', 'BILL-OPENSTATES');
    fixture.detectChanges();
    await fixture.whenStable();

    const versions = component.billVersions();
    expect(versions.length).toBe(1);
    expect(versions[0].data[0].repBadge).toBe('Your U.S. Senator');
    expect(versions[0].data[0].isUserRep).toBe(true);
    expect(component.userRepSponsors()).toEqual([
      { name: 'Jane Senator', badge: 'Your U.S. Senator', isPrimary: true },
    ]);
  });

  it('should badge sponsor by district match (e.g. NY State Senate District 24)', async () => {
    mockBillData.cosponsors = null as any;
    (mockBillData as any).sponsorships = [
      {
        name: 'Senator Andrew Lanza',
        primary: true,
        person: {
          name: 'Andrew Lanza',
          current_role: {
            org_classification: 'upper',
            district: '24',
            title: 'Senator',
          },
        },
      },
    ];

    mockUserProfileSignal.set({
      districts: {
        state: {
          senate: '24',
          assembly: '64',
        },
        federal: '11',
      },
    });

    mockLegislatureService.getBillById.mockReturnValueOnce(of(mockBillData));
    fixture.componentRef.setInput('id', 'BILL-DISTRICT-24');
    fixture.detectChanges();
    await fixture.whenStable();

    const versions = component.billVersions();
    expect(versions[0].data[0].repBadge).toBe('Your State Senator');
    expect(versions[0].data[0].isUserRep).toBe(true);
    expect(component.userRepSponsors()).toEqual([
      {
        name: 'Senator Andrew Lanza',
        badge: 'Your State Senator',
        isPrimary: true,
      },
    ]);
  });

  it('should gracefully fall back when user has not saved their address', async () => {
    mockUserProfileSignal.set(null);
    fixture.detectChanges();
    await fixture.whenStable();

    const versions = component.billVersions();
    for (const v of versions) {
      for (const item of v.data) {
        expect(item.repBadge).toBeUndefined();
        expect(item.isUserRep).toBe(false);
      }
    }
    expect(component.userRepSponsors()).toEqual([]);
  });
});
