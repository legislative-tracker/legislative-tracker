import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { firstValueFrom } from 'rxjs';
import {
  LegislatureService,
  OfflineStorageService,
  SavedBill,
} from '@legislative-tracker/client-angular/core';

@Component({
  selector: 'app-saved-bills',
  imports: [
    RouterLink,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './saved-bills.component.html',
  styleUrl: './saved-bills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedBills implements OnInit {
  private offlineStorage = inject(OfflineStorageService);
  private legislatureService = inject(LegislatureService, { optional: true });
  private snackBar = inject(MatSnackBar);

  savedBills = signal<SavedBill[]>([]);
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(true);

  filteredBills = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const bills = this.savedBills();
    if (!query) return bills;

    return bills.filter((b) => {
      const resolvedTitle = this.getBillTitle(b).toLowerCase();
      const titleMatch =
        resolvedTitle.includes(query) || b.title?.toLowerCase().includes(query);
      const idMatch = b.id?.toLowerCase().includes(query);
      const identMatch = b.identifier?.toLowerCase().includes(query);
      const stateMatch = b.stateCd?.toLowerCase().includes(query);
      return titleMatch || idMatch || identMatch || stateMatch;
    });
  });

  async ngOnInit(): Promise<void> {
    await this.loadSavedBills();
  }

  getBillTitle(bill: SavedBill): string {
    // 1. Explicit name field from Legislation model
    if (bill.name) {
      return bill.name;
    }
    if (bill.billData?.name) {
      return bill.billData.name;
    }
    // 2. Meaningful title
    if (
      bill.title &&
      bill.title.toLowerCase() !== 'legislation' &&
      bill.title.toLowerCase() !== 'bill' &&
      bill.title.toLowerCase() !== 'legislative tracker' &&
      bill.title !== bill.id
    ) {
      return bill.title;
    }
    if (bill.billData?.title) {
      return bill.billData.title;
    }
    if (bill.identifier) {
      return bill.identifier;
    }
    return bill.id || 'Legislation';
  }

  async loadSavedBills(): Promise<void> {
    this.isLoading.set(true);
    try {
      const bills = await this.offlineStorage.getSavedBills();

      // If online and service available, enrich bills with actual Legislation.name
      if (this.legislatureService && bills.length > 0) {
        const uniqueStates = Array.from(
          new Set(bills.map((b) => b.stateCd || 'us-ny')),
        );
        for (const state of uniqueStates) {
          try {
            const legs = await firstValueFrom(
              this.legislatureService.getLegislationByState(state),
            );
            if (legs && legs.length > 0) {
              for (const bill of bills) {
                if ((bill.stateCd || 'us-ny') === state) {
                  const foundLeg = legs.find(
                    (l) =>
                      l.id === bill.id ||
                      l.ocdBillIds?.upper === bill.id ||
                      l.ocdBillIds?.lower === bill.id,
                  );
                  if (foundLeg && foundLeg.name) {
                    bill.name = foundLeg.name;
                    bill.title = foundLeg.name;
                    if (foundLeg.description) {
                      bill.summary = foundLeg.description;
                    }
                    bill.billData = foundLeg;
                    await this.offlineStorage.saveBill(bill);
                  }
                }
              }
            }
          } catch {
            // Ignore offline/fetch errors
          }
        }
      }

      for (const bill of bills) {
        const title = this.getBillTitle(bill);
        if (
          title &&
          (!bill.title ||
            bill.title.toLowerCase() === 'legislation' ||
            bill.title.toLowerCase() === 'bill' ||
            bill.title.toLowerCase() === 'legislative tracker')
        ) {
          bill.title = title;
          await this.offlineStorage.saveBill(bill);
        }
      }

      // Sort newest saved first
      bills.sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
      );
      this.savedBills.set(bills);
    } catch {
      this.savedBills.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  getBillRoute(bill: SavedBill): any[] {
    const state = bill.stateCd || 'us-ny';
    if (bill.type === 'legislation') {
      return ['/', state, 'legislation', bill.id];
    }
    return ['/', state, 'ocd-bill', bill.id];
  }

  async removeBill(id: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    await this.offlineStorage.removeSavedBill(id);
    await this.loadSavedBills();
    this.snackBar.open('Bill removed from offline storage', 'Close', {
      duration: 3000,
    });
  }

  async clearAll(): Promise<void> {
    await this.offlineStorage.clearAll();
    await this.loadSavedBills();
    this.snackBar.open('All saved bills cleared', 'Close', {
      duration: 3000,
    });
  }
}
