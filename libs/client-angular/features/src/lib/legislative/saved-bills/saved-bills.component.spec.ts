import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SavedBills } from './saved-bills.component';
import {
  OfflineStorageService,
  SavedBill,
} from '@legislative-tracker/client-angular/core';

describe('SavedBills Component', () => {
  let component: SavedBills;
  let fixture: ComponentFixture<SavedBills>;

  const mockSavedBills: SavedBill[] = [
    {
      id: 'ocd-bill/101',
      identifier: 'S101',
      title: 'Climate Resilience Act',
      stateCd: 'us-ny',
      savedAt: '2026-08-20T12:00:00Z',
      summary: 'A bill to bolster climate resilience across New York state.',
    },
    {
      id: 'ocd-bill/202',
      identifier: 'A202',
      title: 'Public Transit Funding Act',
      stateCd: 'us-ny',
      savedAt: '2026-08-22T15:00:00Z',
      summary: 'Allocates funding for zero-emission bus fleet transitions.',
    },
  ];

  const mockOfflineStorage = {
    getSavedBills: vi.fn().mockResolvedValue([...mockSavedBills]),
    removeSavedBill: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockOfflineStorage.getSavedBills.mockResolvedValue([...mockSavedBills]);

    await TestBed.configureTestingModule({
      imports: [SavedBills],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: OfflineStorageService, useValue: mockOfflineStorage },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedBills);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create and load saved bills sorted newest first', () => {
    expect(component).toBeTruthy();
    expect(mockOfflineStorage.getSavedBills).toHaveBeenCalled();
    const bills = component.savedBills();
    expect(bills.length).toBe(2);
    expect(bills[0].identifier).toBe('A202'); // Newer date 2026-08-22
  });

  it('should filter saved bills by search query', () => {
    component.searchQuery.set('Transit');
    expect(component.filteredBills().length).toBe(1);
    expect(component.filteredBills()[0].identifier).toBe('A202');

    component.searchQuery.set('S101');
    expect(component.filteredBills().length).toBe(1);
    expect(component.filteredBills()[0].title).toBe('Climate Resilience Act');

    component.searchQuery.set('NonExistent');
    expect(component.filteredBills().length).toBe(0);
  });

  it('should remove a saved bill and display snackbar', async () => {
    const snackBarSpy = vi.spyOn((component as any).snackBar, 'open');
    mockOfflineStorage.getSavedBills.mockResolvedValue([mockSavedBills[0]]);
    await component.removeBill('ocd-bill/202');

    expect(mockOfflineStorage.removeSavedBill).toHaveBeenCalledWith(
      'ocd-bill/202',
    );
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Bill removed from offline storage',
      'Close',
      expect.any(Object),
    );
  });

  it('should clear all saved bills', async () => {
    const snackBarSpy = vi.spyOn((component as any).snackBar, 'open');
    mockOfflineStorage.getSavedBills.mockResolvedValue([]);
    await component.clearAll();

    expect(mockOfflineStorage.clearAll).toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith(
      'All saved bills cleared',
      'Close',
      expect.any(Object),
    );
    expect(component.savedBills().length).toBe(0);
  });

  it('should correctly format bill routes', () => {
    const route1 = component.getBillRoute(mockSavedBills[0]);
    expect(route1).toEqual(['/', 'us-ny', 'ocd-bill', 'ocd-bill/101']);

    const legBill: SavedBill = {
      id: 'clean-energy',
      title: 'Clean Energy',
      stateCd: 'us-ny',
      savedAt: '2026-08-20T12:00:00Z',
      type: 'legislation',
    };
    const route2 = component.getBillRoute(legBill);
    expect(route2).toEqual(['/', 'us-ny', 'legislation', 'clean-energy']);
  });

  it('should resolve readable bill title even when saved title is generic', () => {
    const genericBill: SavedBill = {
      id: 'broadband-access-act',
      title: 'legislation',
      stateCd: 'us-ny',
      savedAt: '2026-08-20T12:00:00Z',
      type: 'legislation',
    };
    expect(component.getBillTitle(genericBill)).toBe('Broadband Access Act');

    const billDataBill: SavedBill = {
      id: 'broadband-access-act',
      title: 'bill',
      stateCd: 'us-ny',
      savedAt: '2026-08-20T12:00:00Z',
      billData: { name: 'Broadband Act' },
    };
    expect(component.getBillTitle(billDataBill)).toBe('Broadband Act');
  });
});
