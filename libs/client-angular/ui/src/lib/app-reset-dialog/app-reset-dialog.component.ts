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

export interface AppResetDialogData {
  title?: string;
  message?: string;
  isLoggedIn?: boolean;
}

export interface AppResetDialogResult {
  confirmed: boolean;
  backupPersonalData: boolean;
}

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
