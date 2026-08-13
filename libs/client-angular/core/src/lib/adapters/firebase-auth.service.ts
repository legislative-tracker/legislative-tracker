import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

import { AppUser } from '@legislative-tracker/shared/models';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService implements AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore, { optional: true });

  readonly userSig = toSignal(user(this.auth), { initialValue: null });
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

    docData(userDoc).subscribe((data) => {
      this.userProfile.set(data as AppUser);
    });
  }

  async loginWithGoogle() {
    const { GoogleAuthProvider, signInWithPopup } =
      await import('@angular/fire/auth');

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
    const { signOut } = await import('@angular/fire/auth');
    await signOut(this.auth);
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
