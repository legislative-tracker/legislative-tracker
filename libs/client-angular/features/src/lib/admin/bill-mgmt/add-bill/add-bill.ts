import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  AuthService,
  LegislatureService,
} from '@legislative-tracker/client-angular/core';
import { getAllPlugins, getPlugin } from '@legislative-tracker/plugins-core';

@Component({
  selector: 'app-add-bill',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './add-bill.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './add-bill.scss',
})
export class AddBill {
  public auth = inject(AuthService);
  private legislature = inject(LegislatureService);
  private snackBar = inject(MatSnackBar);

  // Form State
  isLoading = signal(false);

  // Form Fields
  state = signal('');
  name = signal('');
  description = signal('');

  upperBillId = signal('');
  lowerBillId = signal('');
  singleBillId = signal('');

  get implementedStates() {
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

  selectedPlugin = computed(() => {
    const selectedState = this.state();
    if (!selectedState) return undefined;
    const plugins = getAllPlugins();
    return plugins.find(
      (p) =>
        p.metadata.id === selectedState ||
        p.metadata.jurisdiction?.code === selectedState,
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

  onStateChange(newState: string) {
    this.state.set(newState);
    this.upperBillId.set('');
    this.lowerBillId.set('');
    this.singleBillId.set('');
  }

  async onSubmit() {
    const stateVal = this.state();
    const nameVal = this.name().trim();
    const descVal = this.description().trim();

    if (!stateVal || !nameVal) {
      this.snackBar.open(
        'Please provide a state and legislation title.',
        'Close',
        {
          duration: 3000,
        },
      );
      return;
    }

    const billIds: string[] = [];
    if (this.isBicameral()) {
      if (this.upperBillId().trim()) billIds.push(this.upperBillId().trim());
      if (this.lowerBillId().trim()) billIds.push(this.lowerBillId().trim());
    } else {
      if (this.singleBillId().trim()) billIds.push(this.singleBillId().trim());
    }

    if (billIds.length === 0) {
      this.snackBar.open('Please enter at least one bill ID.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isLoading.set(true);

    try {
      await this.legislature.addBills({
        state: stateVal,
        name: nameVal,
        description: descVal || undefined,
        billIds,
      });

      this.snackBar.open(`Success! Added ${billIds.length} bill(s).`, 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });

      this.resetForm();
    } catch (error: any) {
      console.error(error);
      this.snackBar.open(error.message || 'Failed to add bills.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  resetForm() {
    this.state.set('');
    this.name.set('');
    this.description.set('');
    this.upperBillId.set('');
    this.lowerBillId.set('');
    this.singleBillId.set('');
  }
}
