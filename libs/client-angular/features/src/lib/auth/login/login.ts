import { Component, signal, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@legislative-tracker/client-angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  authError = signal<string | null>(null);

  async loginWithGoogle() {
    this.authError.set(null);

    try {
      const result = await this.authService.loginWithGoogle();

      if (result) {
        this.router.navigate(['/profile']);
      } else {
        this.authError.set(
          'Unable to authenticate with Google. Please try again.',
        );
      }
    } catch (error: any) {
      console.error('Auth Error Code:', error.code);
      console.error('Auth Error Message:', error.message);
    }
  }
}
