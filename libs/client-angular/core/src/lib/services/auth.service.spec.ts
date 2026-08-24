import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';

import { AuthService } from './auth.service';
import { FirebaseAuthService } from '../adapters/firebase-auth.service';
import { OfflineStorageService } from './offline-storage.service';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase-tokens.token';

const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockDeleteField = vi.fn(() => '__DELETE_FIELD__');
const mockDoc = vi.fn();
const mockOnSnapshot = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  deleteField: () => mockDeleteField(),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
}));

const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();
const mockGoogleAuthProvider = vi.fn();
const mockOnAuthStateChanged = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
  GoogleAuthProvider: class {
    constructor() {
      mockGoogleAuthProvider();
    }
  },
  signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
}));

describe('FirebaseAuthService', () => {
  let service: AuthService;
  let router: Router;

  const mockAuth = {};
  const mockFirestore = {};
  const mockOfflineStorage = {
    clearAll: vi.fn().mockResolvedValue(undefined),
  };

  let authCallback: ((user: any) => void) | null = null;
  let snapshotCallback: ((snapshot: any) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = null;
    snapshotCallback = null;

    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      authCallback = cb;
      cb(null);
      return () => {};
    });

    mockOnSnapshot.mockImplementation((docRef, cb) => {
      snapshotCallback = cb;
      cb({ data: () => ({}) });
      return () => {};
    });

    mockDoc.mockReturnValue({ path: 'dummy/ref' });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: FirebaseAuthService },
        { provide: FIREBASE_AUTH, useValue: mockAuth },
        { provide: FIREBASE_FIRESTORE, useValue: mockFirestore },
        { provide: OfflineStorageService, useValue: mockOfflineStorage },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Auth State Effects', () => {
    it('should initialize as logged out', () => {
      expect(service.userSig()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
      expect(service.isAdmin()).toBe(false);
    });

    it('should fetch user profile and admin claims when user logs in', async () => {
      const mockUser = {
        uid: '123',
        getIdTokenResult: vi
          .fn()
          .mockResolvedValue({ claims: { admin: true } }),
      };

      const mockProfile = { uid: '123', displayName: 'Test User' };

      mockOnSnapshot.mockImplementation((docRef, cb) => {
        cb({ data: () => mockProfile });
        return () => {};
      });

      if (authCallback) {
        authCallback(mockUser);
      }

      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(service.userSig()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBe(true);
      expect(service.isAdmin()).toBe(true);

      expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'users/123');
      expect(service.userProfile()).toEqual(mockProfile);
    });

    it('should reset state when user logs out', async () => {
      const mockUser = {
        uid: '123',
        getIdTokenResult: async () => ({ claims: {} }),
      };

      if (authCallback) {
        authCallback(mockUser);
      }
      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (authCallback) {
        authCallback(null);
      }
      await TestBed.flushEffects();

      expect(service.userProfile()).toBeNull();
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('loginWithGoogle', () => {
    it('should sign in via popup and save user to Firestore', async () => {
      const mockCredential = {
        user: {
          uid: '123',
          email: 'test@example.com',
          displayName: 'Test User',
          phoneNumber: null,
          photoURL: null,
        },
      };
      mockSignInWithPopup.mockResolvedValue(mockCredential);

      await service.loginWithGoogle();

      expect(mockGoogleAuthProvider).toHaveBeenCalled();
      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'users/123');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          uid: '123',
          email: 'test@example.com',
          displayName: 'Test User',
          lastLogin: expect.any(Date),
        }),
        { merge: true },
      );
    });
  });

  describe('logout', () => {
    it('should sign out and navigate to home', async () => {
      await service.logout();

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('toggleFavorite', () => {
    it('should add ID to favorites if not present', async () => {
      const mockUser = {
        uid: 'USER_1',
        getIdTokenResult: async () => ({ claims: {} }),
      };

      mockOnSnapshot.mockImplementation((docRef, cb) => {
        cb({ data: () => ({ favorites: ['BILL_A'] }) });
        return () => {};
      });

      if (authCallback) {
        authCallback(mockUser);
      }

      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

      await service.toggleFavorite('BILL_B');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        { favorites: ['BILL_A', 'BILL_B'] },
        { merge: true },
      );
    });

    it('should remove ID from favorites if already present', async () => {
      const mockUser = {
        uid: 'USER_1',
        getIdTokenResult: async () => ({ claims: {} }),
      };

      mockOnSnapshot.mockImplementation((docRef, cb) => {
        cb({ data: () => ({ favorites: ['BILL_A', 'BILL_B'] }) });
        return () => {};
      });

      if (authCallback) {
        authCallback(mockUser);
      }

      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

      await service.toggleFavorite('BILL_A');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        { favorites: ['BILL_B'] },
        { merge: true },
      );
    });

    it('should do nothing if user is not logged in', async () => {
      if (authCallback) {
        authCallback(null);
      }
      await TestBed.flushEffects();

      await service.toggleFavorite('BILL_1');

      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('resetDistricts', () => {
    it('should update Firestore document removing districts and legislators fields', async () => {
      const mockUser = {
        uid: 'USER_RESET',
        getIdTokenResult: async () => ({ claims: {} }),
      };

      mockOnSnapshot.mockImplementation((docRef, cb) => {
        cb({
          data: () => ({
            uid: 'USER_RESET',
            districts: { federal: '1' },
            legislators: { federal: [], state: [] },
          }),
        });
        return () => {};
      });

      if (authCallback) {
        authCallback(mockUser);
      }

      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

      await service.resetDistricts();

      expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'users/USER_RESET');
      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
        districts: '__DELETE_FIELD__',
        legislators: '__DELETE_FIELD__',
      });
      expect(service.userProfile()?.districts).toBeUndefined();
      expect(service.userProfile()?.legislators).toBeUndefined();
    });

    it('should do nothing if user is not logged in', async () => {
      if (authCallback) {
        authCallback(null);
      }
      await TestBed.flushEffects();

      await service.resetDistricts();

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccountData', () => {
    it('should delete Firestore user document, clear offline storage, and reset user profile signal', async () => {
      const mockUser = {
        uid: 'USER_DELETE',
        getIdTokenResult: async () => ({ claims: {} }),
      };

      mockOnSnapshot.mockImplementation((docRef, cb) => {
        cb({
          data: () => ({ uid: 'USER_DELETE', displayName: 'Delete Me' }),
        });
        return () => {};
      });

      if (authCallback) {
        authCallback(mockUser);
      }

      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(service.userProfile()).toBeTruthy();

      await service.deleteAccountData();

      expect(mockDoc).toHaveBeenCalledWith(mockFirestore, 'users/USER_DELETE');
      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.anything());
      expect(mockOfflineStorage.clearAll).toHaveBeenCalled();
      expect(service.userProfile()).toBeNull();
    });
  });
});
