import {
  Component,
  input,
  inject,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

// App Imports
import {
  LegislatureService,
  SeoService,
} from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';
import {
  COSPONSOR_COLS,
  OpenStatesBill,
} from '@legislative-tracker/shared/models';

@Component({
  selector: 'app-bill-detail',
  imports: [
    MatTabsModule,
    TableComponent,
    MatProgressSpinnerModule,
    MatListModule,
    MatExpansionModule,
    MatCardModule,
    MatDividerModule,
  ],
  templateUrl: './bill-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./bill-detail.scss'],
})
export class BillDetail {
  stateCd = input.required<string>(); // region code (e.g. us-ny or ny)
  id = input.required<string>(); // The Bill ID
  updateSeoTags = input<boolean>(true);

  private legislatureService = inject(LegislatureService);
  private seoService = inject(SeoService);
  cosponsorCols = COSPONSOR_COLS;

  constructor() {
    effect(() => {
      if (!this.updateSeoTags()) return;
      const b = this.bill();
      if (b) {
        const title = b.identifier
          ? `${b.identifier}: ${b.title || 'Bill Details'}`
          : b.title || 'Bill Details';
        const description =
          this.summaryText() || b.title || 'View bill details and actions.';
        this.seoService.updateTags({
          title,
          description,
          type: 'article',
          twitterCard: 'summary',
        });
      } else {
        this.seoService.resetTags();
      }
    });
  }

  // Single dedicated resource for this bill
  billResource = rxResource({
    params: () => ({ state: this.stateCd(), id: this.id() }),
    stream: ({ params }) =>
      this.legislatureService.getBillById(params.state, params.id),
  });

  bill = computed(
    () => this.billResource.value() as OpenStatesBill | undefined,
  );

  summaryText = computed(() => {
    const b = this.bill();
    if (!b) return '';
    if (b.abstracts && b.abstracts.length > 0 && b.abstracts[0].abstract) {
      return b.abstracts[0].abstract;
    }
    return (b as any).text ?? b.title ?? '';
  });

  // Transform logic for Bill versions / sponsors
  billVersions = computed(() => {
    const b = this.bill();
    if (!b) return [];

    // Support legacy structure if cosponsors map exists
    if (
      (b as any).cosponsors &&
      typeof (b as any).cosponsors === 'object' &&
      !Array.isArray((b as any).cosponsors)
    ) {
      return Object.entries((b as any).cosponsors)
        .map(([key, data]) => ({
          id: key,
          data: (data as any[]).map((item) => {
            const rawId = item.id ?? item.person?.id ?? item.name;
            const cleanId = rawId
              ? String(rawId).replace(/^ocd-person[\/:=]/, '')
              : '';
            return {
              ...item,
              id: cleanId,
              party: item.party ?? item.person?.party ?? '',
              district:
                item.district ?? item.person?.current_role?.district ?? '',
            };
          }),
        }))
        .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
    }

    // OpenStates schema: sponsorships array
    if (Array.isArray(b.sponsorships) && b.sponsorships.length > 0) {
      return [
        {
          id: 'Sponsors & Cosponsors',
          data: b.sponsorships.map((s) => {
            const rawId = s.person?.id ?? s.id ?? s.name;
            const cleanId = rawId
              ? String(rawId).replace(/^ocd-person[\/:=]/, '')
              : '';
            return {
              id: cleanId,
              name: s.name,
              primary: s.primary,
              classification: s.classification,
              entity_type: s.entity_type,
              party: s.person?.party ?? (s as any).party ?? '',
              district:
                s.person?.current_role?.district ?? (s as any).district ?? '',
            };
          }),
        },
      ];
    }

    return [];
  });

  billActions = computed(() => {
    const b = this.bill();
    if (!Array.isArray(b?.actions)) return [];
    return b.actions.map((data: any, index: number) => ({
      id: data.id ?? index,
      date: data.date,
      text: data.description ?? data.action ?? data.text,
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
