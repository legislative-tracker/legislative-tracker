import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';

import {
  AuthService,
  FIREBASE_FUNCTIONS,
} from '@legislative-tracker/client-angular/core';
import {
  AddressForm,
  ConfirmDialog,
  TableComponent,
} from '@legislative-tracker/client-angular/ui';
import {
  USER_REPS_COLS,
  SearchAddress,
} from '@legislative-tracker/shared/models';

@Component({
  selector: 'app-profile',
  imports: [
    DatePipe,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    AddressForm,
    MatTabsModule,
    TableComponent,
    MatSnackBarModule,
  ],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './profile.scss',
})
export class Profile {
  private auth = inject(AuthService);
  private functions = inject(FIREBASE_FUNCTIONS, { optional: true });
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  user = this.auth.userProfile;
  legislatorCols = USER_REPS_COLS;
  isResetting = signal(false);
  isDeleting = signal(false);

  searchAddress = async (e: SearchAddress) => {
    let addressStr = e.address;
    if (e.address2) addressStr += `, ${e.address2}`;
    addressStr += `, ${e.city}, ${e.state} ${e.postalCode}`;

    try {
      if (!this.functions) throw new Error('Firebase Functions not available');
      const { httpsCallable } = await import('firebase/functions');

      const fetchUserReps = httpsCallable(
        this.functions,
        'users-fetchUserReps',
      );
      await fetchUserReps({ address: addressStr });
      this.snackBar.open(
        'Representatives search completed successfully!',
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar'],
        },
      );
    } catch (error: any) {
      const errorMsg =
        error instanceof Error ? error.message : 'Address search failed.';
      this.snackBar.open(errorMsg, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    }
  };

  resetDistricts = async () => {
    if (this.isResetting()) return;
    this.isResetting.set(true);

    try {
      await this.auth.resetDistricts();
      this.snackBar.open(
        'Districts and representatives have been reset.',
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar'],
        },
      );
    } catch (error: any) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to reset districts.';
      this.snackBar.open(errorMsg, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isResetting.set(false);
    }
  };

  confirmDeleteAccount = () => {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete Account Data',
        message:
          'Are you sure you want to permanently delete all your account data? This will wipe your profile and all offline data. This action cannot be undone.',
        confirmText: 'Delete Account Data',
        cancelText: 'Cancel',
        confirmColor: 'warn',
        icon: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        await this.deleteAccount();
      }
    });
  };

  deleteAccount = async () => {
    if (this.isDeleting()) return;
    this.isDeleting.set(true);

    try {
      await this.auth.deleteAccountData();
      this.snackBar.open('Account data deleted successfully.', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error: any) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Failed to delete account data.';
      this.snackBar.open(errorMsg, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isDeleting.set(false);
    }
  };
}
