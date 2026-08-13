import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

// App imports
import { AppUser } from '@legislative-tracker/shared/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore, { optional: true });

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
   * Subscribes to the user's profile document in Firestore.
   */
  private fetchUserProfile(uid: string) {
    if (!this.firestore) return;
    const userDoc = doc(this.firestore, `users/${uid}`);

    docData(userDoc).subscribe((data) => {
      this.userProfile.set(data as AppUser);
    });
  }

  /**
   * Logs the user in with Google and updates their User Record in Firestore.
   * Lazily loads Auth Provider logic.
   */
  async loginWithGoogle() {
    // Lazy Load Auth Logic
    const { GoogleAuthProvider, signInWithPopup } =
      await import('@angular/fire/auth');

    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);

    // Update the user record in Firestore
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
   */
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
