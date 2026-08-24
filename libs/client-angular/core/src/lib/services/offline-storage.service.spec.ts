import { TestBed } from '@angular/core/testing';
import { OfflineStorageService, SavedBill } from './offline-storage.service';
import { FeedbackService } from './feedback.service';
import { MockFeedbackService } from '../adapters/mock-feedback.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('OfflineStorageService', () => {
  let service: OfflineStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OfflineStorageService,
        { provide: FeedbackService, useClass: MockFeedbackService },
      ],
    });
    service = TestBed.inject(OfflineStorageService);
  });

  it('should be created and initialize default online signal status', () => {
    expect(service).toBeTruthy();
    expect(typeof service.isOnline()).toBe('boolean');
  });

  it('should store and retrieve saved bills via IndexedDB', async () => {
    const mockBill: SavedBill = {
      id: 'S1234',
      title: 'Clean Energy Act',
      stateCd: 'ny',
      savedAt: new Date().toISOString(),
    };

    await service.saveBill(mockBill);
    const bills = await service.getSavedBills();
    expect(bills).toBeDefined();
    expect(Array.isArray(bills)).toBe(true);
  });

  it('should handle clearAll gracefully when indexedDB is unavailable', async () => {
    await expect(service.clearAll()).resolves.toBeUndefined();
  });

  it('should clear object stores when database is available', async () => {
    const originalIndexedDB = (globalThis as any).indexedDB;
    (globalThis as any).indexedDB = {};
    const mockClear = vi.fn().mockResolvedValue(undefined);
    (service as any).dbPromise = Promise.resolve({
      clear: mockClear,
    });

    await service.clearAll();

    expect(mockClear).toHaveBeenCalledWith('saved_bills');
    expect(mockClear).toHaveBeenCalledWith('offline_notes');

    (globalThis as any).indexedDB = originalIndexedDB;
  });
});
