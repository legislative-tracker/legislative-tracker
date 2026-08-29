import {
  Component,
  input,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

// Angular Material Imports
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// App Imports
import { getPlugin, getAllPlugins } from '@legislative-tracker/plugins-core';
import { LegislatureService } from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';
import {
  BILL_COLS,
  getBillCols,
  MEMBER_COLS,
  Legislation,
  OpenStatesBill,
  OpenStatesPerson,
} from '@legislative-tracker/shared/models';

enum DashboardTab {
  Bills = 0,
  Senate = 1,
  Assembly = 2,
}

/**
 * State legislative dashboard displaying tabbed tables for tracked bills, Senate members, and Assembly members.
 */
@Component({
  selector: 'app-dashboard',
  imports: [MatTabsModule, TableComponent, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dashboard.component.scss',
})
export class Dashboard {
  stateCd = input.required<string>();
  private legislatureService = inject(LegislatureService);

  selectedTabIndex = signal<DashboardTab>(DashboardTab.Bills);

  Tab = DashboardTab;

  billCols = computed(() => {
    const code = this.stateCd().toLowerCase();
    const plugins = getAllPlugins();
    const plugin =
      getPlugin(code) ||
      plugins.find((p) => {
        const jCode = p.metadata.jurisdiction?.code?.toLowerCase();
        const pId = p.metadata.id?.toLowerCase();
        return (
          jCode === code ||
          pId === code ||
          jCode?.replace(/^us-/, '') === code.replace(/^us-/, '')
        );
      }) ||
      (plugins.length === 1 ? plugins[0] : undefined);

    return getBillCols(plugin);
  });
  memberCols = MEMBER_COLS;

  // --- Request Signals (Triggers) ---

  private billsRequest = computed(() =>
    this.selectedTabIndex() === DashboardTab.Bills ? this.stateCd() : null,
  );

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
      return this.legislatureService.getLegislationByState(stateCode);
    },
  });

  membersResource = rxResource<OpenStatesPerson[], string | null>({
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
    this.members()
      .filter((m) => {
        const org =
          m.current_role?.org_classification?.toLowerCase() ??
          (m as any).chamber?.toLowerCase() ??
          '';
        return org === 'upper' || org === 'senate';
      })
      .map((m) => this.formatMember(m)),
  );

  assemblyMembers = computed(() =>
    this.members()
      .filter((m) => {
        const org =
          m.current_role?.org_classification?.toLowerCase() ??
          (m as any).chamber?.toLowerCase() ??
          '';
        return org === 'lower' || org === 'assembly' || org === 'house';
      })
      .map((m) => this.formatMember(m)),
  );

  private formatMember(m: OpenStatesPerson): OpenStatesPerson {
    let given_name = m.given_name;
    let family_name = m.family_name;
    if (!given_name && !family_name && m.name) {
      const parts = m.name.trim().split(/\s+/);
      given_name = parts[0] || '';
      family_name = parts.slice(1).join(' ') || '';
    }
    return {
      ...m,
      given_name: given_name ?? '',
      family_name: family_name ?? '',
      district: m.district ?? m.current_role?.district ?? '',
    };
  }

  onTabChange(index: number) {
    this.selectedTabIndex.set(index as DashboardTab);
  }
}
