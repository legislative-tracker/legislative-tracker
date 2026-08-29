import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

/**
 * Data payload injected into AppResetDialog.
 */
export interface AppResetDialogData {
  /** Optional custom title. */
  title?: string;
  /** Optional custom description message. */
  message?: string;
  /** Whether the user is currently logged in. */
  isLoggedIn?: boolean;
}

/**
 * Result returned when AppResetDialog is dismissed.
 */
export interface AppResetDialogResult {
  /** Whether the reset was confirmed. */
  confirmed: boolean;
  /** Whether the user opted to back up personal data before resetting. */
  backupPersonalData: boolean;
}

/**
 * Interactive dialog guiding the user through an application reset,
 * providing the choice to backup personal bookmarks and notes to cloud storage first.
 */
@Component({
  selector: 'app-reset-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    FormsModule,
  ],
  templateUrl: './app-reset-dialog.component.html',
  styleUrl: './app-reset-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppResetDialog {
  readonly dialogRef = inject(MatDialogRef<AppResetDialog>);
  readonly data = inject<AppResetDialogData>(MAT_DIALOG_DATA, {
    optional: true,
  });

  readonly backupChoice = signal<'backup' | 'wipe'>(
    this.data?.isLoggedIn === false ? 'wipe' : 'backup',
  );
  readonly isSubmitting = signal<boolean>(false);

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    this.dialogRef.close({
      confirmed: true,
      backupPersonalData: this.backupChoice() === 'backup',
    } as AppResetDialogResult);
  }
}
