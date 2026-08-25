import { Injectable, signal, inject } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { FeedbackService } from './feedback.service';

export interface SavedBill {
  id: string;
  title: string;
  name?: string;
  stateCd: string;
  savedAt: string;
  identifier?: string;
  summary?: string;
  type?: 'bill' | 'legislation';
  billData?: any;
}

export interface OfflineNote {
  id: string;
  billId: string;
  note: string;
  createdAt: string;
  updatedAt?: string;
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

  async isBillSaved(id: string): Promise<boolean> {
    const bill = await this.getSavedBill(id);
    return !!bill;
  }

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

  async deleteNote(id: string): Promise<void> {
    const db = await this.initDB();
    if (db) {
      await db.delete('offline_notes', id);
    }
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
    // Hook for syncing offline data if a remote endpoint is configured
  }
}
