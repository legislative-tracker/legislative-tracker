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

  it('should save, retrieve, check existence, and remove saved bills', async () => {
    const mockBill: SavedBill = {
      id: 'ocd-bill/1234',
      identifier: 'S1234',
      title: 'Clean Energy Act',
      stateCd: 'ny',
      savedAt: new Date().toISOString(),
    };

    const store = new Map<string, SavedBill>();
    const mockDb = {
      put: vi.fn(async (_store: string, val: SavedBill) => {
        store.set(val.id, val);
      }),
      get: vi.fn(async (_store: string, id: string) => store.get(id)),
      getAll: vi.fn(async () => Array.from(store.values())),
      delete: vi.fn(async (_store: string, id: string) => {
        store.delete(id);
      }),
    };
    (service as any).dbPromise = Promise.resolve(mockDb);

    await service.saveBill(mockBill);
    expect(mockDb.put).toHaveBeenCalledWith('saved_bills', mockBill);

    const isSaved = await service.isBillSaved('1234');
    expect(isSaved).toBe(true);

    const fetched = await service.getSavedBill('1234');
    expect(fetched?.identifier).toBe('S1234');

    await service.removeSavedBill('1234');
    expect(mockDb.delete).toHaveBeenCalledWith('saved_bills', '1234');
  });

  it('should save, query, and delete offline notes for a bill', async () => {
    const note1 = {
      id: 'n1',
      billId: 'ocd-bill/1234',
      note: 'First note',
      createdAt: '2026-08-25T10:00:00Z',
    };
    const note2 = {
      id: 'n2',
      billId: 'ocd-bill/1234',
      note: 'Second note',
      createdAt: '2026-08-25T11:00:00Z',
    };
    const noteOther = {
      id: 'n3',
      billId: 'ocd-bill/9999',
      note: 'Other note',
      createdAt: '2026-08-25T12:00:00Z',
    };

    const notesStore = new Map<string, any>();
    const mockDb = {
      put: vi.fn(async (_store: string, val: any) => {
        notesStore.set(val.id, val);
      }),
      getAll: vi.fn(async () => Array.from(notesStore.values())),
      delete: vi.fn(async (_store: string, id: string) => {
        notesStore.delete(id);
      }),
    };
    (service as any).dbPromise = Promise.resolve(mockDb);

    await service.saveNote(note1);
    await service.saveNote(note2);
    await service.saveNote(noteOther);

    const billNotes = await service.getNotesForBill('1234');
    expect(billNotes.length).toBe(2);
    expect(billNotes[0].id).toBe('n2'); // newest first

    await service.deleteNote('n1');
    expect(mockDb.delete).toHaveBeenCalledWith('offline_notes', 'n1');
  });

  it('should export all user saved bills and notes formatted as JSON', async () => {
    const mockBill: SavedBill = {
      id: 'S100',
      title: 'Clean Energy Act',
      stateCd: 'ny',
      savedAt: '2026-08-29T10:00:00Z',
    };
    const mockNote = {
      id: 'n1',
      billId: 'S100',
      note: 'My personal note',
      createdAt: '2026-08-29T10:00:00Z',
    };

    const mockDb = {
      getAll: vi.fn(async (storeName: string) => {
        if (storeName === 'saved_bills') return [mockBill];
        if (storeName === 'offline_notes') return [mockNote];
        return [];
      }),
    };
    (service as any).dbPromise = Promise.resolve(mockDb);

    const exported = await service.exportData();

    expect(exported.version).toBe('1.0.0');
    expect(exported.exportedAt).toBeDefined();
    expect(exported.savedBills).toEqual([mockBill]);
    expect(exported.offlineNotes).toEqual([mockNote]);
  });
});
