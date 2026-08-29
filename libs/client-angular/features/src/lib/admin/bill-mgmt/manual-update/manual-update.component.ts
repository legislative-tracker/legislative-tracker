import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import {
  AuthService,
  LegislatureService,
} from '@legislative-tracker/client-angular/core';

/**
 * Admin view for initiating on-demand batch refreshes of legislative and legislator datasets.
 */
@Component({
  selector: 'app-manual-update',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './manual-update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './manual-update.component.scss',
})
export class ManualUpdate {
  public auth = inject(AuthService);
  private legislatureService = inject(LegislatureService);
  private snackBar = inject(MatSnackBar);

  readonly isUpdatingLegislation = signal(false);
  readonly isUpdatingLegislators = signal(false);

  async triggerLegislationUpdate() {
    this.isUpdatingLegislation.set(true);
    try {
      await this.legislatureService.manualUpdateLegislation();
      this.snackBar.open(
        'Legislation data sync completed successfully.',
        'Close',
        { duration: 5000, panelClass: ['success-snackbar'] },
      );
    } catch (error: unknown) {
      console.error('Manual legislation update failed:', error);
      const msg =
        error instanceof Error ? error.message : 'Legislation sync failed.';
      this.snackBar.open(msg, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isUpdatingLegislation.set(false);
    }
  }

  async triggerLegislatorsUpdate() {
    this.isUpdatingLegislators.set(true);
    try {
      await this.legislatureService.manualUpdateLegislators();
      this.snackBar.open(
        'Legislators data sync completed successfully.',
        'Close',
        { duration: 5000, panelClass: ['success-snackbar'] },
      );
    } catch (error: unknown) {
      console.error('Manual legislators update failed:', error);
      const msg =
        error instanceof Error ? error.message : 'Legislators sync failed.';
      this.snackBar.open(msg, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isUpdatingLegislators.set(false);
    }
  }
}
