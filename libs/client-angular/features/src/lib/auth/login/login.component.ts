import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import {
  AuthService,
  AuthProviderType,
} from '@legislative-tracker/client-angular/core';
import { Router } from '@angular/router';

/**
 * Authentication login page offering single sign-on with Google and Apple.
 */
@Component({
  selector: 'app-login',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login.component.scss',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  authError = signal<string | null>(null);
  isLoading = signal<AuthProviderType | null>(null);

  async login(provider: AuthProviderType) {
    this.authError.set(null);
    this.isLoading.set(provider);

    try {
      const result = await this.authService.loginWithProvider(provider);

      if (result) {
        this.router.navigate(['/profile']);
      } else {
        this.authError.set(
          `Unable to authenticate with ${this.getProviderDisplayName(provider)}. Please try again.`,
        );
      }
    } catch (error: any) {
      console.error('Auth Error Code:', error?.code);
      console.error('Auth Error Message:', error?.message);
      this.authError.set(this.formatErrorMessage(error, provider));
    } finally {
      this.isLoading.set(null);
    }
  }

  private formatErrorMessage(error: any, provider: AuthProviderType): string {
    const providerName = this.getProviderDisplayName(provider);
    switch (error?.code) {
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address using a different sign-in method. Please sign in with your original provider.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'The sign-in popup was blocked by your browser. Please allow popups and try again.';
      case 'auth/network-request-failed':
        return 'A network error occurred. Please check your internet connection and try again.';
      case 'auth/operation-not-allowed':
        return `${providerName} sign-in is not enabled. Please use another provider.`;
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      default:
        return `Unable to authenticate with ${providerName}. Please try again.`;
    }
  }

  private getProviderDisplayName(provider: AuthProviderType): string {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
    }
  }
}
