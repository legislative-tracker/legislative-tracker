import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

/**
 * Data payload injected into ConfirmDialog.
 */
export interface ConfirmDialogData {
  /** Dialog header title. */
  title: string;
  /** Primary confirmation prompt message. */
  message: string;
  /** Label for confirm button (defaults to 'Confirm'). */
  confirmText?: string;
  /** Label for cancel button (defaults to 'Cancel'). */
  cancelText?: string;
  /** Theme palette color for confirm button ('primary', 'accent', 'warn'). */
  confirmColor?: 'primary' | 'accent' | 'warn';
  /** Optional icon name displayed in the header. */
  icon?: string;
}

/**
 * Reusable modal dialog for user confirmation actions (deletions, resets, promotions).
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialog>);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
