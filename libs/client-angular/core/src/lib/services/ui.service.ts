import { inject, Injectable, Type } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Injectable({ providedIn: 'root' })
export class UiService {
  private dialog = inject(MatDialog);

  openFeedbackDialog(component?: Type<any>, config?: MatDialogConfig) {
    if (!component) return;
    this.dialog.open(component, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      ...config,
    });
  }
}
