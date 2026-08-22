import { Injectable, Signal } from '@angular/core';
import { AppUser } from '@legislative-tracker/shared/models';

export type AuthProviderType = 'google' | 'apple' | 'facebook';

@Injectable()
export abstract class AuthService {
  abstract readonly userSig: Signal<any>;
  abstract readonly isLoggedIn: Signal<boolean>;
  abstract readonly userProfile: Signal<AppUser | null>;
  abstract readonly isAdmin: Signal<boolean>;

  abstract loginWithProvider(provider: AuthProviderType): Promise<any>;
  abstract logout(): Promise<void>;
  abstract toggleFavorite(billId: string): Promise<any>;
}
