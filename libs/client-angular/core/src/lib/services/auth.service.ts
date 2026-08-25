import { Injectable, Signal } from '@angular/core';
import { AppUser } from '@legislative-tracker/shared/models';

@Injectable()
export abstract class AuthService {
  abstract readonly userSig: Signal<any>;
  abstract readonly isLoggedIn: Signal<boolean>;
  abstract readonly userProfile: Signal<AppUser | null>;
  abstract readonly isAdmin: Signal<boolean>;

  abstract loginWithGoogle(): Promise<any>;
  abstract logout(): Promise<void>;
  abstract resetDistricts(): Promise<void>;
  abstract deleteAccountData(): Promise<void>;
}
