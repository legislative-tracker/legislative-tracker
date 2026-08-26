import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppUser } from '@legislative-tracker/shared/models';
import { AuthService, AuthProviderType } from '../services/auth.service';
import { OfflineStorageService } from '../services/offline-storage.service';

const MOCK_USER: AppUser = {
  uid: 'mock-user-123',
  email: 'mockuser@example.com',
  displayName: 'Mock User',
  photoURL: undefined,
  phoneNumber: null,
  lastLogin: new Date(),
  districts: {
    federal: '1',
    state: {
      assembly: '100',
      senate: '50',
    },
  },
  legislators: {
    federal: [],
    state: [],
  },
};

@Injectable({ providedIn: 'root' })
export class MockAuthService implements AuthService {
  private router = inject(Router);
  private offlineStorage = inject(OfflineStorageService, { optional: true });

  readonly userSig = signal<any>(MOCK_USER);
  readonly isLoggedIn = computed(() => !!this.userSig());
  readonly userProfile = signal<AppUser | null>(MOCK_USER);
  readonly isAdmin = signal<boolean>(true);

  async loginWithProvider(provider: AuthProviderType = 'google') {
    const user = {
      ...MOCK_USER,
      displayName: `Mock User (${provider})`,
    };
    this.userSig.set(user);
    this.userProfile.set(user);
    this.isAdmin.set(true);
    return { user };
  }

  async logout() {
    this.userSig.set(null);
    this.userProfile.set(null);
    this.isAdmin.set(false);
    this.router.navigate(['/']);
  }

  async resetDistricts() {
    const profile = this.userProfile();
    if (!profile) return;

    const updated = { ...profile };
    delete updated.districts;
    delete updated.legislators;
    this.userProfile.set(updated);
  }

  async deleteAccountData() {
    if (this.offlineStorage) {
      await this.offlineStorage.clearAll();
    }
    this.userProfile.set(null);
  }
}
