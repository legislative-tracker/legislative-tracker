import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { BillDetail } from './bill-detail.component';

// Dependencies
import {
  AuthService,
  LegislatureService,
  OfflineStorageService,
  SeoService,
} from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';

// Stub Child Component
@Component({
  selector: 'app-table',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['dataSource', 'columnSource', 'stateCd', 'routeType'],
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
    setBillTags: vi.fn(),
  };

  const mockUserProfileSignal = signal<any>(null);
  const mockIsLoggedInSignal = signal<boolean>(false);
  const mockToggleFavorite = vi.fn().mockResolvedValue(undefined);
  const mockAuthService = {
    userProfile: mockUserProfileSignal,
    isLoggedIn: mockIsLoggedInSignal,
    toggleFavorite: mockToggleFavorite,
  };

  const mockOfflineStorage = {
    getSavedBill: vi.fn().mockResolvedValue(undefined),
    isBillSaved: vi.fn().mockResolvedValue(false),
    saveBill: vi.fn().mockResolvedValue(undefined),
    removeSavedBill: vi.fn().mockResolvedValue(undefined),
    getNotesForBill: vi.fn().mockResolvedValue([]),
    saveNote: vi.fn().mockResolvedValue(undefined),
    deleteNote: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    mockSeoService.updateTags.mockClear();
    mockSeoService.resetTags.mockClear();
    mockSeoService.setBillTags.mockClear();
    mockUserProfileSignal.set(null);
    mockLegislatureService.getBillById.mockReset();
    mockLegislatureService.getBillById.mockReturnValue(of(mockBillData));
    mockOfflineStorage.getSavedBill.mockReset();
    mockOfflineStorage.getSavedBill.mockResolvedValue(undefined);
    mockOfflineStorage.getNotesForBill.mockReset();
    mockOfflineStorage.getNotesForBill.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [BillDetail],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: OfflineStorageService, useValue: mockOfflineStorage },
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

  it('should update SEO tags with bill identifier', async () => {
    await fixture.whenStable();

    expect(mockSeoService.setBillTags).toHaveBeenCalledWith({
      identifier: 'S 123',
      title: 'Clean Water Act',
      description: 'Clean Water Act',
    });
  });

  it('should fallback to bill title if identifier is missing', async () => {
    mockLegislatureService.getBillById.mockReturnValueOnce(
      of({
        id: 'BILL-456',
        title: 'Education Reform Act',
        identifier: '',
      }),
    );

    fixture.componentRef.setInput('id', 'BILL-456');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockSeoService.setBillTags).toHaveBeenCalledWith({
      identifier: '',
      title: 'Education Reform Act',
      description: 'Education Reform Act',
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

  it('should toggle save offline for the bill', async () => {
    const snackBarSpy = vi.spyOn((component as any).snackBar, 'open');

    component.isSavedOffline.set(false);
    await component.toggleSaveOffline();

    expect(mockOfflineStorage.saveBill).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'BILL-123',
        title: 'Clean Water Act',
        identifier: 'S 123',
        stateCd: 'ny',
      }),
    );
    expect(component.isSavedOffline()).toBe(true);
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Bill saved for offline reading',
      'Close',
      expect.any(Object),
    );

    await component.toggleSaveOffline();
    expect(mockOfflineStorage.removeSavedBill).toHaveBeenCalledWith('BILL-123');
    expect(component.isSavedOffline()).toBe(false);
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Bill removed from offline storage',
      'Close',
      expect.any(Object),
    );
  });

  it('should add and delete personal offline notes', async () => {
    const snackBarSpy = vi.spyOn((component as any).snackBar, 'open');

    mockOfflineStorage.getNotesForBill.mockResolvedValue([
      {
        id: 'note-1',
        billId: 'BILL-123',
        note: 'Important environmental legislation.',
        createdAt: '2026-08-25T12:00:00Z',
      },
    ]);

    component.newNoteText.set('Important environmental legislation.');
    await component.addNote();

    expect(mockOfflineStorage.saveNote).toHaveBeenCalledWith(
      expect.objectContaining({
        billId: 'BILL-123',
        note: 'Important environmental legislation.',
      }),
    );
    expect(component.newNoteText()).toBe('');
    expect(component.notes().length).toBe(1);
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Personal note saved',
      'Close',
      expect.any(Object),
    );

    mockOfflineStorage.getNotesForBill.mockResolvedValue([]);
    await component.deleteNote('note-1');
    expect(mockOfflineStorage.deleteNote).toHaveBeenCalledWith('note-1');
    expect(component.notes().length).toBe(0);
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Note deleted',
      'Close',
      expect.any(Object),
    );
  });

  it('should use cached offline bill when live resource returns undefined', async () => {
    const cachedBill: any = {
      id: 'BILL-OFFLINE-ONLY',
      identifier: 'S 999',
      title: 'Offline Cached Bill',
      summary: 'Read this offline',
    };

    mockLegislatureService.getBillById.mockReturnValueOnce(of(undefined));
    fixture.componentRef.setInput('id', 'BILL-OFFLINE-ONLY');
    component.cachedOfflineBill.set(cachedBill);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.bill()?.title).toBe('Offline Cached Bill');
  });

  it('should compute notesDescription with chamber name and identifier', async () => {
    fixture.componentRef.setInput('stateCd', 'ny');
    fixture.componentRef.setInput('id', 'BILL-123');
    fixture.detectChanges();
    await fixture.whenStable();

    // mockBillData has identifier 'S 123'
    expect(component.chamberName()).toBe('Senate');
    expect(component.notesDescription()).toBe(
      'Private notes for Senate Bill S 123',
    );
  });
});
