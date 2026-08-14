import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UserManagementService } from '@legislative-tracker/client-angular/core';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './remove-admin.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './remove-admin.scss',
})
export class RemoveAdmin {
  private userMgmt = inject(UserManagementService);
  private snackBar = inject(MatSnackBar);

  email = signal('');
  isLoading = signal(false);

  async demoteAdmin() {
    if (!this.email()) return;

    this.isLoading.set(true);

    try {
      // Call the function we added to AuthService
      await this.userMgmt.revokeAdminPrivileges(this.email());

      this.snackBar.open(
        `Success! ${this.email()} is no longer an Admin.`,
        'Close',
        {
          duration: 5000,
          panelClass: ['success-snackbar'],
        },
      );

      this.email.set(''); // Clear the form
    } catch (error: any) {
      console.error(error);
      this.snackBar.open(error.message || 'Demotion failed.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isLoading.set(false);
    }
  }
}
