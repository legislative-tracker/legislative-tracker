import {
  Component,
  input,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';

// App Imports
import { LegislatureService } from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';
import { COSPONSOR_COLS } from '@legislative-tracker/shared/models';
import { Legislation } from '@legislative-tracker/shared/models';

@Component({
  selector: 'app-bill-detail',
  imports: [
    MatTabsModule,
    TableComponent,
    MatProgressSpinnerModule,
    MatListModule,
    MatExpansionModule,
  ],
  templateUrl: './bill-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./bill-detail.scss'],
})
export class BillDetail {
  stateCd = input.required<string>(); // two-letter region abbreviation
  id = input.required<string>(); // The Bill ID

  private legislatureService = inject(LegislatureService);
  cosponsorCols = COSPONSOR_COLS;

  // Single dedicated resource for this bill
  billResource = rxResource({
    params: () => ({ state: this.stateCd(), id: this.id() }),
    stream: ({ params }) =>
      this.legislatureService.getBillById(params.state, params.id),
  });

  bill = computed(() => this.billResource.value() as Legislation | undefined);

  // Transform logic specifically for Bill versions
  billVersions = computed(() => {
    const b = this.bill();
    if (!b?.cosponsors) return [];
    return Object.entries(b.cosponsors)
      .map(([key, data]) => ({
        id: key,
        data: data,
      }))
      .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
  });

  billActions = computed(() => {
    const b = this.bill();
    if (!Array.isArray(b?.actions)) return [];
    return b.actions.map((data: any, index: number) => ({
      id: data.id ?? index,
      date: data.date,
      text: data.action ?? data.text ?? data.description,
    }));
  });

  latestAction = computed(() => {
    const actions = this.billActions();
    if (actions.length > 0) {
      return actions[actions.length - 1];
    }
    const b = this.bill();
    if (b?.first_action_date) {
      return { id: 'initial', date: b.first_action_date, text: 'Published' };
    }
    return undefined;
  });
}
