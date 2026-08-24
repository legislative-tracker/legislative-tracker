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
import { MatIconModule } from '@angular/material/icon';

// App Imports
import {
  AuthService,
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
    MatIconModule,
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
  private authService = inject(AuthService, { optional: true });
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

  private getRepresentativeBadge(sponsor: {
    id?: string;
    person?: {
      id?: string;
      name?: string;
      current_role?: {
        org_classification?: string;
        district?: string;
        title?: string;
      };
    };
    name?: string;
    party?: string;
    district?: string;
    classification?: string;
    primary?: boolean;
  }): string | undefined {
    const profile = this.authService?.userProfile();
    if (!profile?.legislators) return undefined;

    const stateReps = profile.legislators.state ?? [];
    const federalReps = profile.legislators.federal ?? [];
    const allReps = [...stateReps, ...federalReps];
    if (allReps.length === 0) return undefined;

    const clean = (val?: string) =>
      val
        ? String(val)
            .replace(/^ocd-person[\/:=]/, '')
            .trim()
            .toLowerCase()
        : '';

    const sponsorCleanId = clean(sponsor.id ?? sponsor.person?.id);
    const sponsorName = (sponsor.name ?? sponsor.person?.name ?? '')
      .trim()
      .toLowerCase();

    for (const rep of allReps) {
      const repCleanId = clean((rep as any).ocdId ?? (rep as any).id);
      const repName = (rep.name ?? '').trim().toLowerCase();
      const isStateRep = stateReps.includes(rep);
      const isFederalRep = federalReps.includes(rep);

      const idMatches = !!(
        sponsorCleanId &&
        repCleanId &&
        sponsorCleanId === repCleanId
      );
      const nameMatches = !!(sponsorName && repName && sponsorName === repName);

      if (idMatches || nameMatches) {
        const chamber = String(
          (rep as any).chamber ??
            (rep as any).current_role?.title ??
            (rep as any).current_role?.org_classification ??
            '',
        ).toLowerCase();

        if (chamber.includes('senat') || chamber === 'upper') {
          return isFederalRep ? 'Your U.S. Senator' : 'Your State Senator';
        }
        if (chamber.includes('assembly')) {
          return 'Your State Assemblymember';
        }
        if (
          chamber.includes('house') ||
          chamber.includes('rep') ||
          chamber === 'lower'
        ) {
          return isFederalRep
            ? 'Your U.S. Representative'
            : 'Your State Representative';
        }
        return isFederalRep
          ? 'Your Federal Representative'
          : 'Your Representative';
      }
    }

    return undefined;
  }

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
            const repBadge = this.getRepresentativeBadge(item);
            return {
              ...item,
              id: cleanId,
              party: item.party ?? item.person?.party ?? '',
              district:
                item.district ?? item.person?.current_role?.district ?? '',
              repBadge,
              isUserRep: !!repBadge,
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
            const repBadge = this.getRepresentativeBadge(s);
            return {
              id: cleanId,
              name: s.name,
              primary: s.primary,
              classification: s.classification,
              entity_type: s.entity_type,
              party: s.person?.party ?? (s as any).party ?? '',
              district:
                s.person?.current_role?.district ?? (s as any).district ?? '',
              repBadge,
              isUserRep: !!repBadge,
            };
          }),
        },
      ];
    }

    return [];
  });

  userRepSponsors = computed(() => {
    const versions = this.billVersions();
    const repSponsors: { name: string; badge: string; isPrimary: boolean }[] =
      [];
    for (const version of versions) {
      for (const item of version.data) {
        if (item.repBadge) {
          if (!repSponsors.some((r) => r.name === item.name)) {
            repSponsors.push({
              name: item.name,
              badge: item.repBadge,
              isPrimary: !!item.primary,
            });
          }
        }
      }
    }
    return repSponsors;
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
