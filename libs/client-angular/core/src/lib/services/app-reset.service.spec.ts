import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AppResetService, UserPersonalBackup } from './app-reset.service';
import { OfflineStorageService } from './offline-storage.service';
import { ThemeService } from './theme.service';
import { FIREBASE_FIRESTORE } from '../firebase-tokens.token';

const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
}));

describe('AppResetService', () => {
  let service: AppResetService;

  const mockOfflineStorage = {
    getSavedBills: vi.fn(),
    getOfflineNotes: vi.fn(),
    saveBill: vi.fn(),
    saveNote: vi.fn(),
    clearAll: vi.fn(),
  };

  const mockThemeService = {
    mode: vi.fn().mockReturnValue('dark'),
    setThemeMode: vi.fn(),
  };

  const mockFirestore = {};

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.resetAllMocks();
    mockDoc.mockReturnValue({ path: 'users/user-123/backups/app_reset' });
    mockSetDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);

    mockOfflineStorage.getSavedBills.mockResolvedValue([
      { id: 'bill-1', title: 'Test Bill' },
    ]);
    mockOfflineStorage.getOfflineNotes.mockResolvedValue([
      {
        id: 'note-1',
        billId: 'bill-1',
        note: 'Test Note',
        createdAt: '2026-01-01',
      },
    ]);
    mockOfflineStorage.saveBill.mockResolvedValue(undefined);
    mockOfflineStorage.saveNote.mockResolvedValue(undefined);
    mockOfflineStorage.clearAll.mockResolvedValue(undefined);
    mockThemeService.mode.mockReturnValue('dark');

    TestBed.configureTestingModule({
      providers: [
        AppResetService,
        { provide: OfflineStorageService, useValue: mockOfflineStorage },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: FIREBASE_FIRESTORE, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(AppResetService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('backupPersonalData', () => {
    it('should collect saved bills, notes, and theme and store to Firestore', async () => {
      const result = await service.backupPersonalData('user-123');

      expect(result).toBe(true);
      expect(mockDoc).toHaveBeenCalledWith(
        mockFirestore,
        'users/user-123/backups/app_reset',
      );
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          savedBills: [{ id: 'bill-1', title: 'Test Bill' }],
          offlineNotes: [
            {
              id: 'note-1',
              billId: 'bill-1',
              note: 'Test Note',
              createdAt: '2026-01-01',
            },
          ],
          theme: 'dark',
        }),
      );
    });

    it('should return false if no userId is provided', async () => {
      const result = await service.backupPersonalData(undefined);
      expect(result).toBe(false);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should handle firestore errors gracefully and return false', async () => {
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.backupPersonalData('user-123');
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('restorePersonalData', () => {
    it('should restore saved bills, offline notes, theme, and delete the backup doc', async () => {
      const backupData: UserPersonalBackup = {
        savedBills: [{ id: 'bill-restored', title: 'Restored Bill' }],
        offlineNotes: [
          {
            id: 'note-restored',
            billId: 'bill-restored',
            note: 'Restored Note',
            createdAt: '2026-01-01',
          },
        ],
        theme: 'light',
        timestamp: '2026-01-01T00:00:00.000Z',
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => backupData,
      });

      const result = await service.restorePersonalData('user-123');

      expect(result).toBe(true);
      expect(mockOfflineStorage.saveBill).toHaveBeenCalledWith({
        id: 'bill-restored',
        title: 'Restored Bill',
      });
      expect(mockOfflineStorage.saveNote).toHaveBeenCalledWith({
        id: 'note-restored',
        billId: 'bill-restored',
        note: 'Restored Note',
        createdAt: '2026-01-01',
      });
      expect(mockThemeService.setThemeMode).toHaveBeenCalledWith('light');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should return false if backup doc does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await service.restorePersonalData('user-123');
      expect(result).toBe(false);
      expect(mockOfflineStorage.saveBill).not.toHaveBeenCalled();
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });
  });

  describe('performStorageWipe', () => {
    it('should clear localStorage, sessionStorage, OfflineStorage, and caches', async () => {
      localStorage.setItem('test_key', 'test_val');
      sessionStorage.setItem('test_session', 'test_session_val');

      const mockDelete = vi.fn().mockResolvedValue(true);
      const originalCaches = (globalThis as any).caches;
      (globalThis as any).caches = {
        keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
        delete: mockDelete,
      };

      const mockUnregister = vi.fn().mockResolvedValue(true);
      const originalNavigator = (globalThis as any).navigator;
      (globalThis as any).navigator.serviceWorker = {
        getRegistrations: vi
          .fn()
          .mockResolvedValue([{ unregister: mockUnregister }]),
      };

      await service.performStorageWipe();

      expect(localStorage.getItem('test_key')).toBeNull();
      expect(sessionStorage.getItem('test_session')).toBeNull();
      expect(mockOfflineStorage.clearAll).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith('cache-v1');
      expect(mockDelete).toHaveBeenCalledWith('cache-v2');
      expect(mockUnregister).toHaveBeenCalled();

      (globalThis as any).caches = originalCaches;
      (globalThis as any).navigator = originalNavigator;
    });
  });

  describe('resetApp', () => {
    it('should backup data if requested and perform wipe', async () => {
      const backupSpy = vi
        .spyOn(service, 'backupPersonalData')
        .mockResolvedValue(true);
      const wipeSpy = vi
        .spyOn(service, 'performStorageWipe')
        .mockResolvedValue(undefined);

      await service.resetApp({ backupPersonalData: true, userId: 'user-123' });

      expect(backupSpy).toHaveBeenCalledWith('user-123');
      expect(wipeSpy).toHaveBeenCalledWith({ preserveAuth: true });
    });

    it('should skip backup if backupPersonalData is false', async () => {
      const backupSpy = vi
        .spyOn(service, 'backupPersonalData')
        .mockResolvedValue(true);
      const wipeSpy = vi
        .spyOn(service, 'performStorageWipe')
        .mockResolvedValue(undefined);

      await service.resetApp({ backupPersonalData: false, userId: 'user-123' });

      expect(backupSpy).not.toHaveBeenCalled();
      expect(wipeSpy).toHaveBeenCalledWith({ preserveAuth: false });
    });

    it('should throw an error and abort if backup fails during resetApp', async () => {
      vi.spyOn(service, 'backupPersonalData').mockResolvedValue(false);
      const wipeSpy = vi.spyOn(service, 'performStorageWipe');

      await expect(
        service.resetApp({ backupPersonalData: true, userId: 'user-123' }),
      ).rejects.toThrow('Failed to backup personal data to cloud');

      expect(wipeSpy).not.toHaveBeenCalled();
    });

    it('should pass preserveAuth: true to performStorageWipe when backupPersonalData is true', async () => {
      vi.spyOn(service, 'backupPersonalData').mockResolvedValue(true);
      const wipeSpy = vi
        .spyOn(service, 'performStorageWipe')
        .mockResolvedValue(undefined);

      await service.resetApp({ backupPersonalData: true, userId: 'user-123' });

      expect(wipeSpy).toHaveBeenCalledWith({ preserveAuth: true });
    });
  });

  describe('Mock / Non-Firestore environment', () => {
    let mockService: AppResetService;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AppResetService,
          { provide: OfflineStorageService, useValue: mockOfflineStorage },
          { provide: ThemeService, useValue: mockThemeService },
          { provide: FIREBASE_FIRESTORE, useValue: null },
        ],
      });
      mockService = TestBed.inject(AppResetService);
    });

    it('should backup and restore personal data via sessionStorage when firestore is null', async () => {
      const backupResult =
        await mockService.backupPersonalData('mock-user-123');
      expect(backupResult).toBe(true);

      const restoreResult =
        await mockService.restorePersonalData('mock-user-123');
      expect(restoreResult).toBe(true);
      expect(mockOfflineStorage.saveBill).toHaveBeenCalled();
      expect(mockOfflineStorage.saveNote).toHaveBeenCalled();
    });
  });
});
