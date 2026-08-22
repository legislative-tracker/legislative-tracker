import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as appModule from 'firebase-admin/app';
import * as firestoreModule from 'firebase-admin/firestore';
import * as authModule from 'firebase-admin/auth';
import { getDb, getAuthAdmin, db, auth } from './config';

describe('config', () => {
  it('should retrieve or initialize the default app when getting db and auth', () => {
    const firestoreInstance = getDb();
    expect(firestoreInstance).toBeDefined();

    const authInstance = getAuthAdmin();
    expect(authInstance).toBeDefined();
  });

  it('should proxy Firestore property and method accesses', () => {
    expect(typeof db.collection).toBe('function');
    expect(typeof db.doc).toBe('function');
  });

  it('should proxy Auth property and method accesses', () => {
    expect(typeof auth.getUser).toBe('function');
    expect(typeof auth.getUserByEmail).toBe('function');
  });
});
