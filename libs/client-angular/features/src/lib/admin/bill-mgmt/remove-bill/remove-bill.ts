import {
  Component,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// App imports
import {
  AuthService,
  LegislatureService,
} from '@legislative-tracker/client-angular/core';
import { getAllPlugins } from '@legislative-tracker/plugins-core';

interface SimpleBill {
  id: string;
  number: string;
  title: string;
}

@Component({
  selector: 'app-remove-bill',
  imports: [
    SlicePipe,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './remove-bill.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './remove-bill.scss',
})
export class RemoveBill {
  public auth = inject(AuthService);

  private legislature = inject(LegislatureService);
  private snackBar = inject(MatSnackBar);

  selectedState = signal<string>('');
  selectedBillId = signal<string>('');
  selectedChamber = signal<'all' | 'upper' | 'lower'>('all');

  availableBills = signal<SimpleBill[]>([]);
  isLoadingBills = signal(false);
  isDeleting = signal(false);

  get states() {
    return getAllPlugins().map((p) => {
      const jurisdiction = p.metadata.jurisdiction;
      const code = jurisdiction?.code || p.metadata.id;
      const name = jurisdiction?.name || p.metadata.name;
      return {
        value: code,
        name: `${name} (${code.toUpperCase()})`,
      };
    });
  }

  constructor() {
    effect(() => {
      const state = this.selectedState();
      if (state) {
        this.fetchBillsForState(state);
      } else {
        this.availableBills.set([]);
      }
    });
  }

  fetchBillsForState(state: string) {
    this.isLoadingBills.set(true);
    this.selectedBillId.set('');

    this.legislature.getBillsByState(state).subscribe({
      next: (billsData) => {
        const bills = (billsData || []).map((doc: any) => ({
          id: doc.id,
          number: doc.identifier || doc.id || 'Unknown',
          title: doc.title || doc.name || 'No Title',
        })) as SimpleBill[];

        this.availableBills.set(bills);
        this.isLoadingBills.set(false);
      },
      error: (error) => {
        console.error('Error fetching bills:', error);
        this.snackBar.open('Could not load bills for this state.', 'Close');
        this.isLoadingBills.set(false);
      },
    });
  }

  async onDelete() {
    const state = this.selectedState();
    const billId = this.selectedBillId();
    const chamberChoice = this.selectedChamber();

    if (!state || !billId) return;

    if (
      !confirm(
        `ARE YOU SURE?\n\nThis will remove bill ${billId} from ${state.toUpperCase()}${
          chamberChoice !== 'all' ? ` (${chamberChoice} chamber)` : ''
        }.`,
      )
    ) {
      return;
    }

    this.isDeleting.set(true);

    try {
      const chamberArg = chamberChoice !== 'all' ? chamberChoice : undefined;
      await this.legislature.removeBill(state, billId, chamberArg);

      this.snackBar.open('Bill removed successfully.', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });

      this.fetchBillsForState(state);
    } catch (error: any) {
      this.snackBar.open(error.message || 'Deletion failed.', 'Close', {
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isDeleting.set(false);
    }
  }
}
