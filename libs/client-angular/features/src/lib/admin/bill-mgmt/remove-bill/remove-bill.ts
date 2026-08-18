import {
  Component,
  inject,
  signal,
  computed,
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
import { Legislation } from '@legislative-tracker/shared/models';
import { getAllPlugins } from '@legislative-tracker/plugins-core';

export interface SimpleBill {
  id: string;
  number: string;
  title: string;
  description?: string;
  stateBillIds?: { upper?: string; lower?: string };
  ocdBillIds?: { upper?: string; lower?: string };
  upperBillId?: string;
  lowerBillId?: string;
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
        pluginId: p.metadata.id,
      };
    });
  }

  get implementedStates() {
    return this.states;
  }

  selectedPlugin = computed(() => {
    const state = this.selectedState();
    if (!state) return undefined;
    const plugins = getAllPlugins();
    return plugins.find(
      (p) => p.metadata.id === state || p.metadata.jurisdiction?.code === state,
    );
  });

  isBicameral = computed(() => {
    const plugin = this.selectedPlugin();
    return plugin ? plugin.metadata.jurisdiction?.isBicameral !== false : true;
  });

  chambers = computed(() => {
    const plugin = this.selectedPlugin();
    return (
      plugin?.metadata.jurisdiction?.chambers ?? {
        upper: 'Upper Chamber (Senate)',
        lower: 'Lower Chamber (Assembly/House)',
      }
    );
  });

  selectedBill = computed(() => {
    const id = this.selectedBillId();
    if (!id) return undefined;
    return this.availableBills().find((b) => b.id === id);
  });

  hasUpperChamber = computed(() => {
    const bill = this.selectedBill();
    if (!bill) return false;
    return !!(
      bill.stateBillIds?.upper ||
      bill.ocdBillIds?.upper ||
      bill.upperBillId
    );
  });

  hasLowerChamber = computed(() => {
    const bill = this.selectedBill();
    if (!bill) return false;
    return !!(
      bill.stateBillIds?.lower ||
      bill.ocdBillIds?.lower ||
      bill.lowerBillId
    );
  });

  hasMultipleChambers = computed(() => {
    return this.hasUpperChamber() && this.hasLowerChamber();
  });

  constructor() {
    effect(() => {
      const state = this.selectedState();
      if (state) {
        this.fetchBillsForState(state);
      } else {
        this.availableBills.set([]);
        this.selectedBillId.set('');
        this.selectedChamber.set('all');
      }
    });
  }

  onStateChange(newState: string) {
    this.selectedState.set(newState);
    this.selectedBillId.set('');
    this.selectedChamber.set('all');
  }

  onBillChange(newBillId: string) {
    this.selectedBillId.set(newBillId);
    this.selectedChamber.set('all');
  }

  fetchBillsForState(state: string) {
    this.isLoadingBills.set(true);
    this.selectedBillId.set('');
    this.selectedChamber.set('all');

    this.legislature.getLegislationByState(state).subscribe({
      next: (billsData) => {
        const bills = (billsData || []).map((doc: Legislation | any) => {
          const upperNo =
            doc.stateBillIds?.upper || doc.upperBillId || undefined;
          const lowerNo =
            doc.stateBillIds?.lower || doc.lowerBillId || undefined;

          let billNumber = 'Unknown';
          if (upperNo && lowerNo) {
            billNumber = `${upperNo} / ${lowerNo}`;
          } else if (upperNo) {
            billNumber = upperNo;
          } else if (lowerNo) {
            billNumber = lowerNo;
          } else if (doc.identifier) {
            billNumber = doc.identifier;
          } else if (doc.id) {
            billNumber = doc.id;
          }

          return {
            id: doc.id || '',
            number: billNumber,
            title: doc.name || doc.title || doc.description || 'No Title',
            description: doc.description,
            stateBillIds: doc.stateBillIds,
            ocdBillIds: doc.ocdBillIds,
            upperBillId: upperNo,
            lowerBillId: lowerNo,
          };
        }) as SimpleBill[];

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

    const chamberText =
      chamberChoice === 'upper'
        ? ` (${this.chambers().upper})`
        : chamberChoice === 'lower'
          ? ` (${this.chambers().lower})`
          : '';

    if (
      !confirm(
        `ARE YOU SURE?\n\nThis will remove bill ${billId} from ${state.toUpperCase()}${chamberText}.`,
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
