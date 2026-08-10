import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
} from '@angular/material/snack-bar';

// Define the data shape we expect
export interface LinkSnackBarData {
  message: string;
  linkText: string;
  linkUrl: string;
}

@Component({
  selector: 'app-link-snackbar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
  templateUrl: './link-snackbar.html',
  styleUrls: ['./link-snackbar.scss'],
})
export class LinkSnackBar {
  constructor(
    public snackBarRef: MatSnackBarRef<LinkSnackBar>,
    @Inject(MAT_SNACK_BAR_DATA) public data: LinkSnackBarData,
  ) {}
}
