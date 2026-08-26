import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  AuthProvider,
  User,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
} from 'firebase/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AppUser } from '@legislative-tracker/shared/models';
import { AuthService, AuthProviderType } from '../services/auth.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { AppResetService } from '../services/app-reset.service';
import { FeedbackService } from '../services/feedback.service';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase-tokens.token';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService implements AuthService {
  private auth = inject<Auth>(FIREBASE_AUTH, { optional: true });
  private firestore = inject<Firestore>(FIREBASE_FIRESTORE, { optional: true });
  private offlineStorage = inject(OfflineStorageService, { optional: true });
  private appResetService = inject(AppResetService, { optional: true });
  private feedbackService = inject(FeedbackService, { optional: true });
  private router = inject(Router);

  private readonly authState$ = new Observable<User | null>((subscriber) => {
    if (!this.auth) {
      subscriber.next(null);
      return;
    }
    return onAuthStateChanged(this.auth, (u) => subscriber.next(u));
  });

  readonly userSig = toSignal(this.authState$, { initialValue: null });
  readonly isLoggedIn = computed(() => !!this.userSig());
  readonly userProfile = signal<AppUser | null>(null);
  readonly isAdmin = signal<boolean>(false);

  private profileUnsub?: () => void;

  constructor() {
    effect(async () => {
      const currentUser = this.userSig();

      if (currentUser) {
        const token = await currentUser.getIdTokenResult();
        this.isAdmin.set(!!token.claims['admin']);
        this.fetchUserProfile(currentUser.uid);

        if (this.appResetService) {
          const restored = await this.appResetService.restorePersonalData(
            currentUser.uid,
          );
          if (restored && this.feedbackService) {
            this.feedbackService.sendFeedback(
              'Application Reset',
              'Your personal data has been restored successfully.',
            );
          }
        }
      } else {
        if (this.profileUnsub) {
          this.profileUnsub();
          this.profileUnsub = undefined;
        }
        this.userProfile.set(null);
        this.isAdmin.set(false);
      }
    });
  }

  private fetchUserProfile(uid: string) {
    if (this.profileUnsub) {
      this.profileUnsub();
      this.profileUnsub = undefined;
    }
    if (!this.firestore) return;
    const userDoc = doc(this.firestore, `users/${uid}`);

    this.profileUnsub = onSnapshot(userDoc, (snapshot: any) => {
      if (!snapshot) return;
      const exists =
        typeof snapshot.exists === 'function'
          ? snapshot.exists()
          : Boolean(snapshot.data?.());
      if (exists) {
        const data =
          typeof snapshot.data === 'function' ? snapshot.data() : snapshot;
        this.userProfile.set(data as AppUser);
      } else {
        this.userProfile.set(null);
      }
    });
  }

  private getAuthProvider(provider: AuthProviderType): AuthProvider {
    switch (provider) {
      case 'google':
        return new GoogleAuthProvider();
      case 'apple': {
        const appleProvider = new OAuthProvider('apple.com');
        appleProvider.addScope('email');
        appleProvider.addScope('name');
        return appleProvider;
      }
      default:
        throw new Error(`Unsupported auth provider: ${provider}`);
    }
  }

  async loginWithProvider(provider: AuthProviderType) {
    if (!this.auth) throw new Error('Firebase Auth not provided');
    const authProvider = this.getAuthProvider(provider);
    const credential = await signInWithPopup(this.auth, authProvider);

    if (credential.user && this.firestore) {
      const userRef = doc(this.firestore, `users/${credential.user.uid}`);
      const userData: Record<string, any> = {
        uid: credential.user.uid,
        lastLogin: new Date(),
      };

      if (
        credential.user.email !== undefined &&
        credential.user.email !== null
      ) {
        userData['email'] = credential.user.email;
      }
      if (
        credential.user.displayName !== undefined &&
        credential.user.displayName !== null
      ) {
        userData['displayName'] = credential.user.displayName;
      }
      if (
        credential.user.photoURL !== undefined &&
        credential.user.photoURL !== null
      ) {
        userData['photoURL'] = credential.user.photoURL;
      }
      if (
        credential.user.phoneNumber !== undefined &&
        credential.user.phoneNumber !== null
      ) {
        userData['phoneNumber'] = credential.user.phoneNumber;
      }

      await setDoc(userRef, userData, { merge: true });
    }
    return credential;
  }

  async logout() {
    if (this.auth) {
      await signOut(this.auth);
    }
    this.router.navigate(['/']);
  }

  async resetDistricts(): Promise<void> {
    const currentUser = this.userSig();
    if (!currentUser || !this.firestore) return;

    const userRef = doc(this.firestore, `users/${currentUser.uid}`);
    await updateDoc(userRef, {
      districts: deleteField(),
      legislators: deleteField(),
    });

    const currentProfile = this.userProfile();
    if (currentProfile) {
      const updated = { ...currentProfile };
      delete updated.districts;
      delete updated.legislators;
      this.userProfile.set(updated);
    }
  }

  async deleteAccountData(): Promise<void> {
    const currentUser = this.userSig();
    if (currentUser && this.firestore) {
      const userRef = doc(this.firestore, `users/${currentUser.uid}`);
      await deleteDoc(userRef);
    }
    if (this.offlineStorage) {
      await this.offlineStorage.clearAll();
    }
    this.userProfile.set(null);
  }
}
