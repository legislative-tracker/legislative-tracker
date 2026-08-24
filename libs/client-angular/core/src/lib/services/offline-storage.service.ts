import { Injectable, signal, inject } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { FeedbackService } from './feedback.service';

export interface SavedBill {
  id: string;
  title: string;
  stateCd: string;
  savedAt: string;
}

export interface OfflineNote {
  id: string;
  billId: string;
  note: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private readonly feedback = inject(FeedbackService, { optional: true });
  private dbPromise: Promise<IDBPDatabase> | null = null;

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
    if (typeof indexedDB === 'undefined') {
      return null;
    }
    if (!this.dbPromise) {
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
    }
    return this.dbPromise;
  }

  async saveBill(bill: SavedBill): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.put('saved_bills', bill);
    }
  }

  async getSavedBills(): Promise<SavedBill[]> {
    const db = await this.initDB();
    if (db) {
      return db.getAll('saved_bills');
    }
    return [];
  }

  async removeSavedBill(id: string): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.delete('saved_bills', id);
    }
  }

  async saveNote(note: OfflineNote): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.put('offline_notes', note);
    }
  }

  async getOfflineNotes(): Promise<OfflineNote[]> {
    const db = await this.initDB();
    if (db) {
      return db.getAll('offline_notes');
    }
    return [];
  }

  async clearOfflineNotes(): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.clear('offline_notes');
    }
  }

  async clearAll(): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.clear('saved_bills');
      await db.clear('offline_notes');
    }
  }

  private async syncPendingData(): Promise<void> {
    const notes = await this.getOfflineNotes();
    if (notes.length > 0) {
      await this.clearOfflineNotes();
    }
  }
}
