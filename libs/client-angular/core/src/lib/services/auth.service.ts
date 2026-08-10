import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { FirebaseApp } from '@angular/fire/app';
import { Router } from '@angular/router';

// App imports
import { AppUser } from '@legislative-tracker/shared/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private app = inject(FirebaseApp);

  // Signals
  readonly userSig = toSignal(user(this.auth), { initialValue: null });

  // Derived state
  readonly isLoggedIn = computed(() => !!this.userSig());

  // State Signals
  readonly userProfile = signal<AppUser | null>(null);
  readonly isAdmin = signal<boolean>(false);

  constructor() {
    // Subscribe to the lightweight Auth State (Core Auth SDK only)
    effect(async () => {
      const currentUser = this.userSig();

      if (currentUser) {
        // Check for Admin User Token
        const token = await currentUser.getIdTokenResult();
        this.isAdmin.set(!!token.claims['admin']);

        // Load user profile
        this.fetchUserProfile(currentUser.uid);
      } else {
        // Reset State on Logout
        this.userProfile.set(null);
        this.isAdmin.set(false);
      }
    });
  }

  /**
   * Lazy loads Firestore and subscribes to the user's profile document.
   */
  private async fetchUserProfile(uid: string) {
    const { getFirestore, doc, docData } = await import('@angular/fire/firestore');

    const firestore = getFirestore(this.app);
    const userDoc = doc(firestore, `users/${uid}`);

    docData(userDoc).subscribe((data) => {
      this.userProfile.set(data as AppUser);
    });
  }

  /**
   * Logs the user in with Google and updates their User Record in Firestore.
   * Lazily loads both Auth Providers and Firestore.
   */
  async loginWithGoogle() {
    // Lazy Load Auth Logic
    const { GoogleAuthProvider, signInWithPopup } = await import('@angular/fire/auth');

    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);

    // Lazy Load Firestore to save/update the user record
    if (credential.user) {
      const { getFirestore, doc, setDoc } = await import('@angular/fire/firestore');
      const firestore = getFirestore(this.app);

      const userRef = doc(firestore, `users/${credential.user.uid}`);
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

  /**
   * Logs the user out.
   */
  async logout() {
    // Lazy Load SignOut Logic
    const { signOut } = await import('@angular/fire/auth');

    await signOut(this.auth);

    this.router.navigate(['/']);
  }

  /**
   * Toggles a bill as a favorite.
   * Lazily loads Firestore to perform the write.
   */
  async toggleFavorite(billId: string) {
    const profile = this.userProfile();
    const currentUser = this.userSig();

    if (!profile || !currentUser) return;

    const currentFavorites = profile.favorites || [];
    const newFavorites = currentFavorites.includes(billId)
      ? currentFavorites.filter((id: string) => id !== billId)
      : [...currentFavorites, billId];

    // Lazy Load Firestore for the write operation
    const { getFirestore, doc, setDoc } = await import('@angular/fire/firestore');
    const firestore = getFirestore(this.app);

    const userRef = doc(firestore, `users/${currentUser.uid}`);
    return setDoc(userRef, { favorites: newFavorites }, { merge: true });
  }
}
