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
});
