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
import { MatInputModule } from '@angular/material/input';
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

export interface EditableBill {
  id: string;
  number: string;
  name: string;
  description: string;
  upperBillId: string;
  lowerBillId: string;
}

@Component({
  selector: 'app-edit-bill',
  imports: [
    SlicePipe,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './edit-bill.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './edit-bill.component.scss',
})
export class EditBill {
  public auth = inject(AuthService);

  private legislature = inject(LegislatureService);
  private snackBar = inject(MatSnackBar);

  selectedState = signal<string>('');
  selectedBillId = signal<string>('');

  availableBills = signal<EditableBill[]>([]);
  isLoadingBills = signal(false);
  isSaving = signal(false);

  // Form Fields
  name = signal<string>('');
  description = signal<string>('');
  upperBillId = signal<string>('');
  lowerBillId = signal<string>('');
  singleBillId = signal<string>('');

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

  constructor() {
    effect(() => {
      const state = this.selectedState();
      if (state) {
        this.fetchBillsForState(state);
      } else {
        this.availableBills.set([]);
        this.selectedBillId.set('');
        this.resetForm();
      }
    });
  }

  onStateChange(newState: string) {
    this.selectedState.set(newState);
    this.selectedBillId.set('');
    this.resetForm();
  }

  onBillChange(newBillId: string) {
    this.selectedBillId.set(newBillId);
    const bill = this.availableBills().find((b) => b.id === newBillId);

    if (bill) {
      this.name.set(bill.name);
      this.description.set(bill.description);
      this.upperBillId.set(bill.upperBillId);
      this.lowerBillId.set(bill.lowerBillId);
      this.singleBillId.set(bill.upperBillId || bill.lowerBillId);
    } else {
      this.resetForm();
    }
  }

  fetchBillsForState(state: string) {
    this.isLoadingBills.set(true);
    this.selectedBillId.set('');
    this.resetForm();

    this.legislature.getLegislationByState(state).subscribe({
      next: (billsData) => {
        const bills = (billsData || []).map((doc: Legislation | any) => {
          const upperNo = doc.stateBillIds?.upper || doc.upperBillId || '';
          const lowerNo = doc.stateBillIds?.lower || doc.lowerBillId || '';

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
            name: doc.name || doc.title || '',
            description: doc.description || '',
            upperBillId: upperNo,
            lowerBillId: lowerNo,
          };
        }) as EditableBill[];

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

  async onSubmit() {
    const stateVal = this.selectedState();
    const billId = this.selectedBillId();
    const nameVal = this.name().trim();
    const descVal = this.description().trim();

    if (!stateVal || !billId) return;

    if (!nameVal) {
      this.snackBar.open('Please provide a legislation title.', 'Close', {
        duration: 3000,
      });
      return;
    }

    let upperVal = '';
    let lowerVal = '';

    if (this.isBicameral()) {
      upperVal = this.upperBillId().trim();
      lowerVal = this.lowerBillId().trim();
    } else {
      upperVal = this.singleBillId().trim();
    }

    this.isSaving.set(true);

    try {
      await this.legislature.updateBill({
        state: stateVal,
        id: billId,
        name: nameVal,
        description: descVal,
        upperBillId: upperVal,
        lowerBillId: lowerVal,
      });

      this.snackBar.open('Legislation updated successfully.', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });

      this.fetchBillsForState(stateVal);
    } catch (error: any) {
      console.error(error);
      this.snackBar.open(error.message || 'Failed to update bill.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  resetForm() {
    this.name.set('');
    this.description.set('');
    this.upperBillId.set('');
    this.lowerBillId.set('');
    this.singleBillId.set('');
  }
}
