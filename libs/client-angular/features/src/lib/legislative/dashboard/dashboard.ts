import { Component, input, inject, computed, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

// Angular Material Imports
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// App Imports
import { LegislatureService } from '@legislative-tracker/client-angular/data-access-legislature';
import { TableComponent } from '@legislative-tracker/client-angular/ui';
import {
  BILL_COLS,
  MEMBER_COLS,
  Legislation,
  Legislator,
} from '@legislative-tracker/shared/models';

enum DashboardTab {
  Bills = 0,
  Senate = 1,
  Assembly = 2,
}

@Component({
  selector: 'app-dashboard',
  imports: [MatTabsModule, TableComponent, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  stateCd = input.required<string>();
  private legislatureService = inject(LegislatureService);

  selectedTabIndex = signal<DashboardTab>(DashboardTab.Bills);

  Tab = DashboardTab;
  billCols = BILL_COLS;
  memberCols = MEMBER_COLS;

  // --- Request Signals (Triggers) ---

  // Computes the active state for bills, or null if inactive
  private billsRequest = computed(() =>
    this.selectedTabIndex() === DashboardTab.Bills ? this.stateCd() : null,
  );

  // Computes the active state for members, or null if inactive
  private membersRequest = computed(() =>
    [DashboardTab.Senate, DashboardTab.Assembly].includes(
      this.selectedTabIndex(),
    )
      ? this.stateCd()
      : null,
  );

  // --- Resources ---

  billsResource = rxResource<Legislation[], string | null>({
    params: () => this.billsRequest(),
    stream: ({ params: stateCode }) => {
      if (!stateCode) return of([]);
      return this.legislatureService.getBillsByState(stateCode);
    },
  });

  membersResource = rxResource<Legislator[], string | null>({
    params: () => this.membersRequest(),
    stream: ({ params: stateCode }) => {
      if (!stateCode) return of([]);
      return this.legislatureService.getMembersByState(stateCode);
    },
  });

  // --- Derived State ---
  bills = computed(() => this.billsResource.value() ?? []);
  members = computed(() => this.membersResource.value() ?? []);

  isLoading = computed(
    () => this.billsResource.isLoading() || this.membersResource.isLoading(),
  );
  error = computed(
    () => this.billsResource.error() || this.membersResource.error(),
  );

  senateMembers = computed(() =>
    this.members().filter((m) => m.chamber === 'SENATE'),
  );
  assemblyMembers = computed(() =>
    this.members().filter((m) => m.chamber === 'ASSEMBLY'),
  );

  onTabChange(index: number) {
    this.selectedTabIndex.set(index as DashboardTab);
  }
}
