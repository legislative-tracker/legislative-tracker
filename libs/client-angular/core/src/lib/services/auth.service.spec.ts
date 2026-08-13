import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { FirebaseApp } from '@angular/fire/app';
import { Firestore } from '@angular/fire/firestore';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';

import { AuthService } from './auth.service';
import { FirebaseAuthService } from '../adapters/firebase-auth.service';

const mockDocData = vi.fn();
const mockSetDoc = vi.fn();
const mockDoc = vi.fn();
const mockGetFirestore = vi.fn().mockReturnValue({});

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  getFirestore: (...args: any[]) => mockGetFirestore(...args),
  doc: (...args: any[]) => mockDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  docData: (...args: any[]) => mockDocData(...args),
}));

const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();
const mockGoogleAuthProvider = vi.fn();

const authState$ = new BehaviorSubject<any>(null);

vi.mock('@angular/fire/auth', () => ({
  user: () => authState$,
  GoogleAuthProvider: class {
    constructor() {
      mockGoogleAuthProvider();
    }
  },
  signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  Auth: class {},
}));

describe('FirebaseAuthService', () => {
  let service: AuthService;
  let router: Router;

  const mockAuth = {};
  const mockFirebaseApp = { name: '[DEFAULT]' };
  const mockFirestore = {};

  beforeEach(() => {
    vi.clearAllMocks();
    authState$.next(null);

    mockGetFirestore.mockReturnValue({});
    mockDocData.mockReturnValue(of({}));
    mockDoc.mockReturnValue({ path: 'dummy/ref' });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useClass: FirebaseAuthService },
        { provide: Auth, useValue: mockAuth },
        { provide: FirebaseApp, useValue: mockFirebaseApp },
        { provide: Firestore, useValue: mockFirestore },
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
      mockDocData.mockReturnValue(of(mockProfile));

      authState$.next(mockUser);

      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(service.userSig()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBe(true);
      expect(service.isAdmin()).toBe(true);

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users/123');
      expect(service.userProfile()).toEqual(mockProfile);
    });

    it('should reset state when user logs out', async () => {
      authState$.next({
        uid: '123',
        getIdTokenResult: async () => ({ claims: {} }),
      });
      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

      authState$.next(null);
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
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users/123');

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
      const mockProfile = { favorites: ['BILL_A'] };

      mockDocData.mockReturnValue(of(mockProfile));
      authState$.next({
        uid: 'USER_1',
        getIdTokenResult: async () => ({ claims: {} }),
      });

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
      const mockProfile = { favorites: ['BILL_A', 'BILL_B'] };

      mockDocData.mockReturnValue(of(mockProfile));
      authState$.next({
        uid: 'USER_1',
        getIdTokenResult: async () => ({ claims: {} }),
      });

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
      authState$.next(null);
      await TestBed.flushEffects();

      await service.toggleFavorite('BILL_1');

      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });
});
