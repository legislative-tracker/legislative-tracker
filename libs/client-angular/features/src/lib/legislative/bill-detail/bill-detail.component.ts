import {
  Component,
  input,
  inject,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    TableComponent,
  ],
  templateUrl: './bill-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./bill-detail.component.scss'],
})
export class BillDetail {
  stateCd = input<string>(''); // region code (e.g. us-ny or ny)
  id = input<string>(''); // The Bill ID
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
        this.seoService.setBillTags({
          identifier: b.identifier,
          title: b.title,
          description: this.summaryText(),
        });
      } else {
        this.seoService.resetTags();
      }
    });
  }

  billParams = computed(
    () => {
      const state = this.stateCd();
      const id = this.id();
      return state && id ? { state, id } : undefined;
    },
    { equal: (a, b) => a?.state === b?.state && a?.id === b?.id },
  );

  // Single dedicated resource for this bill
  billResource = rxResource({
    params: () => this.billParams(),
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
    if (!profile) return undefined;

    const stateReps = profile.legislators?.state ?? [];
    const federalReps = profile.legislators?.federal ?? [];
    const allReps = [...stateReps, ...federalReps];

    const cleanId = (val?: string) =>
      val
        ? String(val)
            .replace(/^ocd-person[\/:=]/, '')
            .trim()
            .toLowerCase()
        : '';

    const normalizeDistrict = (d?: string | number): string => {
      if (d === undefined || d === null) return '';
      const str = String(d)
        .trim()
        .replace(/^district\s+/i, '');
      const part = str.split('-').pop()?.trim() ?? str;
      return part.replace(/^0+/, '');
    };

    const normalizeName = (name?: string): string => {
      if (!name) return '';
      return name
        .toLowerCase()
        .replace(
          /\b(senator|sen\.|assemblymember|assembly member|assemblyman|assemblywoman|representative|rep\.|hon\.|mr\.|ms\.|mrs\.|dr\.)\b/g,
          '',
        )
        .replace(/\b(jr\.|sr\.|ii|iii|iv)\b/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const namesMatch = (nameA: string, nameB: string): boolean => {
      const normA = normalizeName(nameA);
      const normB = normalizeName(nameB);
      if (!normA || !normB) return false;
      if (normA === normB) return true;

      const partsA = normA.split(' ').filter(Boolean);
      const partsB = normB.split(' ').filter(Boolean);
      const lastA = partsA[partsA.length - 1];
      const lastB = partsB[partsB.length - 1];

      if (lastA && lastB && lastA === lastB) {
        const firstA = partsA[0];
        const firstB = partsB[0];
        if (
          firstA &&
          firstB &&
          (firstA === firstB ||
            firstA.startsWith(firstB) ||
            firstB.startsWith(firstA))
        ) {
          return true;
        }
      }

      return normA.includes(normB) || normB.includes(normA);
    };

    const getSponsorChamber = (): 'upper' | 'lower' | 'unknown' => {
      const role = sponsor.person?.current_role;
      const orgClass = String(
        role?.org_classification ?? (sponsor as any).org_classification ?? '',
      ).toLowerCase();
      if (orgClass === 'upper' || orgClass.includes('senat')) return 'upper';
      if (
        orgClass === 'lower' ||
        orgClass.includes('assembly') ||
        orgClass.includes('house')
      )
        return 'lower';

      const title = String(
        role?.title ?? (sponsor as any).title ?? (sponsor as any).chamber ?? '',
      ).toLowerCase();
      if (title.includes('senat')) return 'upper';
      if (
        title.includes('assembly') ||
        title.includes('house') ||
        title.includes('rep')
      )
        return 'lower';

      const b = this.bill();
      if (b) {
        const billOrg = String(
          b.from_organization?.classification ??
            b.from_organization?.name ??
            '',
        ).toLowerCase();
        if (billOrg.includes('upper') || billOrg.includes('senat'))
          return 'upper';
        if (
          billOrg.includes('lower') ||
          billOrg.includes('assembly') ||
          billOrg.includes('house')
        )
          return 'lower';

        const id = String(b.identifier ?? b.id ?? '')
          .trim()
          .toUpperCase();
        if (
          id.startsWith('S') &&
          !id.startsWith('SCR') &&
          !id.startsWith('SJR') &&
          !id.startsWith('STATE')
        )
          return 'upper';
        if (id.startsWith('A') || id.startsWith('HR') || id.startsWith('H.R.'))
          return 'lower';
      }

      return 'unknown';
    };

    const sponsorCleanId = cleanId(sponsor.id ?? sponsor.person?.id);
    const rawSponsorName = sponsor.name ?? sponsor.person?.name ?? '';
    const sponsorDist = normalizeDistrict(
      sponsor.district ??
        sponsor.person?.current_role?.district ??
        (sponsor as any).person?.district,
    );
    const sponsorChamber = getSponsorChamber();

    // 1. Check against user's specific representative list
    for (const rep of allReps) {
      const repCleanId = cleanId((rep as any).ocdId ?? (rep as any).id);
      const repName = rep.name ?? '';
      const repDist = normalizeDistrict(
        (rep as any).district ?? (rep as any).current_role?.district,
      );
      const isStateRep = stateReps.includes(rep);
      const isFederalRep = federalReps.includes(rep);

      const repChamberStr = String(
        (rep as any).chamber ??
          (rep as any).current_role?.title ??
          (rep as any).current_role?.org_classification ??
          '',
      ).toLowerCase();
      const repChamber =
        repChamberStr.includes('senat') || repChamberStr === 'upper'
          ? 'upper'
          : repChamberStr.includes('assembly') ||
              repChamberStr.includes('house') ||
              repChamberStr === 'lower'
            ? 'lower'
            : 'unknown';

      const idMatches = !!(
        sponsorCleanId &&
        repCleanId &&
        sponsorCleanId === repCleanId
      );
      const nameMatches = !!(
        rawSponsorName &&
        repName &&
        namesMatch(rawSponsorName, repName)
      );
      const districtAndChamberMatches = !!(
        sponsorDist &&
        repDist &&
        sponsorDist === repDist &&
        sponsorChamber !== 'unknown' &&
        repChamber !== 'unknown' &&
        sponsorChamber === repChamber
      );

      if (idMatches || nameMatches || districtAndChamberMatches) {
        if (repChamber === 'upper') {
          return isFederalRep ? 'Your U.S. Senator' : 'Your State Senator';
        }
        if (repChamber === 'lower') {
          if (repChamberStr.includes('assembly'))
            return 'Your State Assemblymember';
          return isFederalRep
            ? 'Your U.S. Representative'
            : 'Your State Representative';
        }
        return isFederalRep
          ? 'Your Federal Representative'
          : 'Your Representative';
      }
    }

    // 2. Direct district matching against profile.districts
    const userDistricts = profile.districts;
    if (userDistricts && sponsorDist) {
      const userStateSenate = normalizeDistrict(userDistricts.state?.senate);
      const userStateAssembly = normalizeDistrict(
        userDistricts.state?.assembly,
      );
      const userFederal = normalizeDistrict(userDistricts.federal);

      if (
        userStateSenate &&
        sponsorDist === userStateSenate &&
        (sponsorChamber === 'upper' || sponsorChamber === 'unknown')
      ) {
        return 'Your State Senator';
      }
      if (
        userStateAssembly &&
        sponsorDist === userStateAssembly &&
        (sponsorChamber === 'lower' || sponsorChamber === 'unknown')
      ) {
        return 'Your State Assemblymember';
      }
      if (
        userFederal &&
        sponsorDist === userFederal &&
        (sponsorChamber === 'lower' || sponsorChamber === 'unknown')
      ) {
        return 'Your U.S. Representative';
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
