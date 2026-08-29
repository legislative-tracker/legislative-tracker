import { Injectable, Signal } from '@angular/core';
import { AppUser } from '@legislative-tracker/shared/models';

/**
 * Supported third-party OAuth authentication providers.
 */
export type AuthProviderType = 'google' | 'apple';

/**
 * Abstract authentication service defining reactive authentication state,
 * user profile signals, and credential lifecycle operations.
 */
@Injectable()
export abstract class AuthService {
  /** Reactive signal containing the raw Firebase User object or `null` when logged out. */
  abstract readonly userSig: Signal<any>;

  /** Reactive boolean signal indicating whether an active user session exists. */
  abstract readonly isLoggedIn: Signal<boolean>;

  /** Reactive signal containing the authenticated user profile document from Firestore. */
  abstract readonly userProfile: Signal<AppUser | null>;

  /** Reactive boolean signal indicating if the authenticated user has administrative claims. */
  abstract readonly isAdmin: Signal<boolean>;

  /**
   * Initiates popup OAuth sign-in flow with the specified identity provider.
   *
   * @param provider - Third-party OAuth provider ('google' or 'apple').
   * @returns Resolves with user credentials upon successful sign-in.
   */
  abstract loginWithProvider(provider: AuthProviderType): Promise<any>;

  /**
   * Terminates the active user session and clears local credentials.
   */
  abstract logout(): Promise<void>;

  /**
   * Resets the resolved electoral districts and elected representatives in the user's profile.
   */
  abstract resetDistricts(): Promise<void>;

  /**
   * Deletes all personal profile and district data stored for the authenticated user.
   */
  abstract deleteAccountData(): Promise<void>;
}
