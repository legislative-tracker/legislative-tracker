import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
} from '@angular/material/snack-bar';

/**
 * Data payload injected into LinkSnackBar.
 */
export interface LinkSnackBarData {
  /** Notification message text. */
  message: string;
  /** Label for external anchor action button. */
  linkText: string;
  /** Target external URL (e.g., GitHub Issue). */
  linkUrl: string;
}

/**
 * Custom snackbar component displaying a message along with an actionable external link.
 */
@Component({
  selector: 'app-link-snackbar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarLabel,
    MatSnackBarActions,
    MatSnackBarAction,
  ],
  templateUrl: './link-snackbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./link-snackbar.component.scss'],
})
export class LinkSnackBar {
  constructor(
    public snackBarRef: MatSnackBarRef<LinkSnackBar>,
    @Inject(MAT_SNACK_BAR_DATA) public data: LinkSnackBarData,
  ) {}
}
