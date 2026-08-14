import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  User,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Firestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { AppUser } from '@legislative-tracker/shared/models';
import { AuthService } from '../services/auth.service';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase-tokens';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService implements AuthService {
  private auth = inject<Auth>(FIREBASE_AUTH, { optional: true });
  private firestore = inject<Firestore>(FIREBASE_FIRESTORE, { optional: true });
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

  constructor() {
    effect(async () => {
      const currentUser = this.userSig();

      if (currentUser) {
        const token = await currentUser.getIdTokenResult();
        this.isAdmin.set(!!token.claims['admin']);
        this.fetchUserProfile(currentUser.uid);
      } else {
        this.userProfile.set(null);
        this.isAdmin.set(false);
      }
    });
  }

  private fetchUserProfile(uid: string) {
    if (!this.firestore) return;
    const userDoc = doc(this.firestore, `users/${uid}`);

    const user$ = new Observable<any>((subscriber) => {
      return onSnapshot(userDoc, (snapshot) =>
        subscriber.next(snapshot.data()),
      );
    });

    user$.subscribe((data) => {
      this.userProfile.set(data as AppUser);
    });
  }

  async loginWithGoogle() {
    if (!this.auth) throw new Error('Firebase Auth not provided');
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);

    if (credential.user && this.firestore) {
      const userRef = doc(this.firestore, `users/${credential.user.uid}`);
      await setDoc(
        userRef,
        {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          photoURL: credential.user.photoURL || null,
          phoneNumber: credential.user.phoneNumber,
          lastLogin: new Date(),
        },
        { merge: true },
      );
    }
    return credential;
  }

  async logout() {
    if (this.auth) {
      await signOut(this.auth);
    }
    this.router.navigate(['/']);
  }

  async toggleFavorite(billId: string) {
    const profile = this.userProfile();
    const currentUser = this.userSig();

    if (!profile || !currentUser || !this.firestore) return;

    const currentFavorites = profile.favorites || [];
    const newFavorites = currentFavorites.includes(billId)
      ? currentFavorites.filter((id: string) => id !== billId)
      : [...currentFavorites, billId];

    const userRef = doc(this.firestore, `users/${currentUser.uid}`);
    return setDoc(userRef, { favorites: newFavorites }, { merge: true });
  }
}
