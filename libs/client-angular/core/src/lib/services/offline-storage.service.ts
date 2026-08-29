import { Injectable, signal, inject } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { FeedbackService } from './feedback.service';

/**
 * Record representing a saved or bookmarked bill stored in client-side IndexedDB.
 */
export interface SavedBill {
  /** Unique identifier for the saved bill. */
  id: string;
  /** Display title of the bill. */
  title: string;
  /** Optional alternate name. */
  name?: string;
  /** Jurisdiction state code (e.g., 'us-ny'). */
  stateCd: string;
  /** ISO timestamp when the bill was saved locally. */
  savedAt: string;
  /** Canonical bill identifier string (e.g., 'S100'). */
  identifier?: string;
  /** Summary or abstract text. */
  summary?: string;
  /** Type discriminator ('bill' or 'legislation'). */
  type?: 'bill' | 'legislation';
  /** Full raw bill data payload if stored. */
  billData?: any;
}

/**
 * User personal note attached to a specific bill in offline storage.
 */
export interface OfflineNote {
  /** Unique note identifier. */
  id: string;
  /** Target bill identifier the note is associated with. */
  billId: string;
  /** Plaintext note content. */
  note: string;
  /** ISO timestamp when note was created. */
  createdAt: string;
  /** ISO timestamp when note was last updated. */
  updatedAt?: string;
}

/**
 * Structured schema for exported user data backup.
 */
export interface UserDataExport {
  /** Schema format version. */
  version: string;
  /** ISO timestamp when backup was generated. */
  exportedAt: string;
  /** Array of saved bills and bookmarks. */
  savedBills: SavedBill[];
  /** Array of personal offline notes. */
  offlineNotes: OfflineNote[];
}

/**
 * Service managing client-side IndexedDB persistence for offline bookmarks,
 * saved bills, personal notes, and network connectivity state.
 */
@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private readonly feedback = inject(FeedbackService, { optional: true });
  private dbPromise: Promise<IDBPDatabase> | null = null;

  /** Reactive signal tracking navigator online/offline connectivity status. */
  readonly isOnline = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      if (typeof indexedDB !== 'undefined') {
        this.initDB();
      }
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline.set(online);
    if (online) {
      this.feedback?.sendFeedback?.(
        'Network Connection Restored',
        'Syncing offline changes...',
      );
      this.syncPendingData();
    }
  }

  private initDB(): Promise<IDBPDatabase> | null {
    if (this.dbPromise) {
      return this.dbPromise;
    }
    if (typeof indexedDB === 'undefined') {
      return null;
    }
    this.dbPromise = openDB('legislative_tracker_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('saved_bills')) {
          db.createObjectStore('saved_bills', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offline_notes')) {
          db.createObjectStore('offline_notes', { keyPath: 'id' });
        }
      },
    });
    return this.dbPromise;
  }

  private cleanBillId(val: string): string {
    if (!val) return '';
    return String(val)
      .replace(/^leg:/, '')
      .replace(/^legislation:/, '')
      .replace(/^bill:/, '')
      .replace(/^ocd-bill[\/:=]/, '')
      .trim();
  }

  /**
   * Saves or updates a bill in the local IndexedDB `saved_bills` store.
   *
   * @param bill - The SavedBill object to persist.
   */
  async saveBill(bill: SavedBill): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.put('saved_bills', bill);
    }
  }

  /**
   * Retrieves all saved bills stored in local IndexedDB.
   *
   * @returns Array of SavedBill objects.
   */
  async getSavedBills(): Promise<SavedBill[]> {
    const db = await this.initDB();
    if (db) {
      return db.getAll('saved_bills');
    }
    return [];
  }

  /**
   * Finds a saved bill by ID or normalized bill identifier.
   *
   * @param id - Bill ID or number to query.
   * @returns Matching SavedBill, or `undefined` if not found.
   */
  async getSavedBill(id: string): Promise<SavedBill | undefined> {
    const db = await this.initDB();
    if (db) {
      const clean = this.cleanBillId(id).toLowerCase();
      const direct = await db.get('saved_bills', id);
      if (direct) return direct;
      const all: SavedBill[] = await db.getAll('saved_bills');
      return all.find(
        (b) =>
          this.cleanBillId(b.id).toLowerCase() === clean ||
          (b.identifier && b.identifier.toLowerCase() === clean),
      );
    }
    return undefined;
  }

  /**
   * Checks whether a bill is currently saved locally.
   *
   * @param id - Target bill ID.
   * @returns `true` if saved, `false` otherwise.
   */
  async isBillSaved(id: string): Promise<boolean> {
    const bill = await this.getSavedBill(id);
    return !!bill;
  }

  /**
   * Removes a saved bill from local IndexedDB.
   *
   * @param id - Target bill ID to remove.
   */
  async removeSavedBill(id: string): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.delete('saved_bills', id);
      const clean = this.cleanBillId(id).toLowerCase();
      const all: SavedBill[] = await db.getAll('saved_bills');
      const matches = all.filter(
        (b) =>
          this.cleanBillId(b.id).toLowerCase() === clean ||
          (b.identifier && b.identifier.toLowerCase() === clean),
      );
      for (const m of matches) {
        if (m.id !== id) {
          await db.delete('saved_bills', m.id);
        }
      }
    }
  }

  /**
   * Saves or updates a personal offline note.
   *
   * @param note - OfflineNote object to persist.
   */
  async saveNote(note: OfflineNote): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.put('offline_notes', note);
    }
  }

  /**
   * Retrieves all offline notes across all bills.
   *
   * @returns Array of all OfflineNote objects.
   */
  async getOfflineNotes(): Promise<OfflineNote[]> {
    const db = await this.initDB();
    if (db) {
      return db.getAll('offline_notes');
    }
    return [];
  }

  /**
   * Retrieves all notes associated with a specific bill.
   *
   * @param billId - Target bill identifier.
   * @returns Array of notes sorted newest first.
   */
  async getNotesForBill(billId: string): Promise<OfflineNote[]> {
    const notes = await this.getOfflineNotes();
    const cleanTarget = this.cleanBillId(billId).toLowerCase();
    return notes
      .filter((n) => this.cleanBillId(n.billId).toLowerCase() === cleanTarget)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  /**
   * Deletes an individual offline note by ID.
   *
   * @param id - Note ID to delete.
   */
  async deleteNote(id: string): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.delete('offline_notes', id);
    }
  }

  /**
   * Clears all offline notes from IndexedDB.
   */
  async clearOfflineNotes(): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.clear('offline_notes');
    }
  }

  /**
   * Completely purges all saved bills and offline notes from IndexedDB.
   */
  async clearAll(): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.clear('saved_bills');
      await db.clear('offline_notes');
    }
  }

  /**
   * Exports all locally saved bills and private notes as a structured portable data payload.
   *
   * @returns UserDataExport containing saved bills and notes.
   */
  async exportData(): Promise<UserDataExport> {
    const [savedBills, offlineNotes] = await Promise.all([
      this.getSavedBills(),
      this.getOfflineNotes(),
    ]);
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      savedBills,
      offlineNotes,
    };
  }

  private async syncPendingData(): Promise<void> {
    // Hook for syncing offline data if a remote endpoint is configured
  }
}
