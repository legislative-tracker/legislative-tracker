import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { OfflineStorageService } from './offline-storage.service';
import { ThemeService, ThemeMode, THEME_STORAGE_KEY } from './theme.service';
import { FIREBASE_FIRESTORE } from '../firebase-tokens.token';

export interface UserPersonalBackup {
  savedBills: any[];
  offlineNotes: any[];
  theme?: ThemeMode | string;
  timestamp: string;
}

export interface AppResetOptions {
  backupPersonalData: boolean;
  userId?: string;
}

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
   * Temporarily uploads personal data (saved bills, notes, preferences) to Firestore.
   */
  async backupPersonalData(userId?: string): Promise<boolean> {
    if (!userId || !this.firestore) {
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

      const backupDoc = doc(
        this.firestore,
        `users/${userId}/backups/app_reset`,
      );
      await setDoc(backupDoc, backupData);
      return true;
    } catch (e) {
      console.warn('Failed to backup personal data to cloud', e);
      return false;
    }
  }

  /**
   * Checks for and restores any pending personal data backup from Firestore.
   */
  async restorePersonalData(userId?: string): Promise<boolean> {
    if (!userId || !this.firestore) {
      return false;
    }

    try {
      const backupDoc = doc(
        this.firestore,
        `users/${userId}/backups/app_reset`,
      );
      const snap = await getDoc(backupDoc);

      if (snap.exists()) {
        const data = snap.data() as UserPersonalBackup;

        if (Array.isArray(data.savedBills)) {
          for (const bill of data.savedBills) {
            await this.offlineStorage.saveBill(bill);
          }
        }

        if (Array.isArray(data.offlineNotes)) {
          for (const note of data.offlineNotes) {
            await this.offlineStorage.saveNote(note);
          }
        }

        if (data.theme && this.themeService) {
          this.themeService.setThemeMode(data.theme as ThemeMode);
        }

        // Cleanup temporary cloud backup once successfully restored
        await deleteDoc(backupDoc);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to restore personal data from cloud', e);
      return false;
    }
  }

  /**
   * Completely purges all local client storage:
   * - localStorage
   * - sessionStorage
   * - IndexedDB databases
   * - CacheStorage
   * - Service Worker registrations
   */
  async performStorageWipe(): Promise<void> {
    // 1. Clear localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('Failed to clear localStorage', e);
      }
    }

    // 2. Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.clear();
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

    // 4. Delete all IndexedDB databases
    if (
      typeof indexedDB !== 'undefined' &&
      typeof indexedDB.databases === 'function'
    ) {
      try {
        const dbs = await indexedDB.databases();
        for (const dbInfo of dbs) {
          if (dbInfo.name) {
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
   */
  async resetApp(options: AppResetOptions): Promise<void> {
    if (options.backupPersonalData && options.userId) {
      await this.backupPersonalData(options.userId);
    }

    await this.performStorageWipe();

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}
