import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { OfflineStorageService } from './offline-storage.service';
import { ThemeService, ThemeMode, THEME_STORAGE_KEY } from './theme.service';
import { FIREBASE_FIRESTORE } from '../firebase-tokens.token';

/**
 * Key used in sessionStorage when backing up personal data in mock environments.
 */
export const MOCK_APP_RESET_BACKUP_KEY = '__legislative_tracker_mock_backup__';

/**
 * Structure of personal data backed up to the cloud before a local storage reset.
 */
export interface UserPersonalBackup {
  /** Array of saved bills. */
  savedBills: any[];
  /** Array of personal offline notes. */
  offlineNotes: any[];
  /** Saved theme mode setting. */
  theme?: ThemeMode | string;
  /** ISO timestamp of backup creation. */
  timestamp: string;
}

/**
 * Options for executing an application reset sequence.
 */
export interface AppResetOptions {
  /** Whether to back up personal data (saved bills and notes) to cloud before wiping. */
  backupPersonalData: boolean;
  /** Authenticated user ID required if backing up personal data. */
  userId?: string;
}

/**
 * Service managing application resets, client-side storage wipes,
 * and personal data backups (saved bills, offline notes, theme settings).
 */
@Injectable({
  providedIn: 'root',
})
export class AppResetService {
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly themeService = inject(ThemeService, { optional: true });
  private readonly firestore = inject<Firestore>(FIREBASE_FIRESTORE, {
    optional: true,
  });

  /**
   * Temporarily uploads personal data (saved bills, notes, preferences) to Firestore (or sessionStorage in mock mode).
   *
   * @param userId - Authenticated user identifier.
   * @returns `true` if backup succeeded, `false` otherwise.
   */
  async backupPersonalData(userId?: string): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      const savedBills = await this.offlineStorage.getSavedBills();
      const offlineNotes = await this.offlineStorage.getOfflineNotes();
      let theme: ThemeMode | string = 'system';

      if (this.themeService) {
        const serviceMode =
          typeof this.themeService.mode === 'function'
            ? this.themeService.mode()
            : (this.themeService as any).mode;
        if (serviceMode) {
          theme = serviceMode;
        }
      } else if (typeof localStorage !== 'undefined') {
        theme =
          (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) || 'system';
      }

      const backupData: UserPersonalBackup = {
        savedBills,
        offlineNotes,
        theme,
        timestamp: new Date().toISOString(),
      };

      if (this.firestore) {
        const backupDoc = doc(
          this.firestore,
          `users/${userId}/backups/app_reset`,
        );
        await setDoc(backupDoc, backupData);
      } else if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(
          MOCK_APP_RESET_BACKUP_KEY,
          JSON.stringify(backupData),
        );
      }
      return true;
    } catch (e) {
      console.warn('Failed to backup personal data to cloud', e);
      return false;
    }
  }

  /**
   * Checks for and restores any pending personal data backup from Firestore (or sessionStorage in mock mode).
   *
   * @param userId - Authenticated user identifier.
   * @returns `true` if data was found and restored, `false` otherwise.
   */
  async restorePersonalData(userId?: string): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      let backupData: UserPersonalBackup | null = null;

      if (this.firestore) {
        const backupDoc = doc(
          this.firestore,
          `users/${userId}/backups/app_reset`,
        );
        const snap = await getDoc(backupDoc);

        if (snap.exists()) {
          backupData = snap.data() as UserPersonalBackup;
          // Cleanup temporary cloud backup once successfully retrieved
          await deleteDoc(backupDoc);
        }
      } else if (typeof sessionStorage !== 'undefined') {
        const raw = sessionStorage.getItem(MOCK_APP_RESET_BACKUP_KEY);
        if (raw) {
          try {
            backupData = JSON.parse(raw) as UserPersonalBackup;
            sessionStorage.removeItem(MOCK_APP_RESET_BACKUP_KEY);
          } catch (err) {
            console.warn('Failed to parse mock backup data', err);
          }
        }
      }

      if (backupData) {
        if (Array.isArray(backupData.savedBills)) {
          for (const bill of backupData.savedBills) {
            await this.offlineStorage.saveBill(bill);
          }
        }

        if (Array.isArray(backupData.offlineNotes)) {
          for (const note of backupData.offlineNotes) {
            await this.offlineStorage.saveNote(note);
          }
        }

        if (backupData.theme && this.themeService) {
          this.themeService.setThemeMode(backupData.theme as ThemeMode);
        }

        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to restore personal data from cloud', e);
      return false;
    }
  }

  /**
   * Purges local client storage:
   * - localStorage (preserving auth tokens if preserveAuth is true)
   * - sessionStorage (preserving mock backup if preserveAuth is true)
   * - IndexedDB databases (preserving firebase auth database if preserveAuth is true)
   * - CacheStorage
   * - Service Worker registrations
   *
   * @param options - Storage wipe options.
   */
  async performStorageWipe(options?: {
    preserveAuth?: boolean;
  }): Promise<void> {
    const preserveAuth = options?.preserveAuth ?? false;

    // 1. Clear localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        if (preserveAuth) {
          const authItems: [string, string][] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
              key &&
              (key.startsWith('firebase:authUser') ||
                key.startsWith('firebase:') ||
                key.startsWith('firebaseui'))
            ) {
              const val = localStorage.getItem(key);
              if (val !== null) {
                authItems.push([key, val]);
              }
            }
          }
          localStorage.clear();
          for (const [k, v] of authItems) {
            localStorage.setItem(k, v);
          }
        } else {
          localStorage.clear();
        }
      } catch (e) {
        console.warn('Failed to clear localStorage', e);
      }
    }

    // 2. Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      try {
        if (preserveAuth) {
          const mockBackup = sessionStorage.getItem(MOCK_APP_RESET_BACKUP_KEY);
          sessionStorage.clear();
          if (mockBackup) {
            sessionStorage.setItem(MOCK_APP_RESET_BACKUP_KEY, mockBackup);
          }
        } else {
          sessionStorage.clear();
        }
      } catch (e) {
        console.warn('Failed to clear sessionStorage', e);
      }
    }

    // 3. Clear OfflineStorageService IndexedDB object stores
    try {
      await this.offlineStorage.clearAll();
    } catch (e) {
      console.warn('Failed to clear OfflineStorage stores', e);
    }

    // 4. Delete all IndexedDB databases (preserving auth if requested)
    if (
      typeof indexedDB !== 'undefined' &&
      typeof indexedDB.databases === 'function'
    ) {
      try {
        const dbs = await indexedDB.databases();
        for (const dbInfo of dbs) {
          if (dbInfo.name) {
            if (
              preserveAuth &&
              (dbInfo.name.includes('firebaseLocalStorage') ||
                dbInfo.name.includes('firebase-auth') ||
                dbInfo.name.includes('firebase-heartbeat'))
            ) {
              continue;
            }
            indexedDB.deleteDatabase(dbInfo.name);
          }
        }
      } catch (e) {
        console.warn('Failed to delete IndexedDB databases', e);
      }
    }

    // 5. Clear CacheStorage
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      } catch (e) {
        console.warn('Failed to clear CacheStorage', e);
      }
    }

    // 6. Unregister Service Workers
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      } catch (e) {
        console.warn('Failed to unregister Service Workers', e);
      }
    }
  }

  /**
   * Performs the full App Reset sequence.
   *
   * @param options - App reset configuration parameters.
   */
  async resetApp(options: AppResetOptions): Promise<void> {
    if (options.backupPersonalData && options.userId) {
      const backupSucceeded = await this.backupPersonalData(options.userId);
      if (!backupSucceeded) {
        throw new Error(
          'Failed to backup personal data to cloud. Reset aborted to prevent data loss.',
        );
      }
    }

    await this.performStorageWipe({ preserveAuth: options.backupPersonalData });

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}
