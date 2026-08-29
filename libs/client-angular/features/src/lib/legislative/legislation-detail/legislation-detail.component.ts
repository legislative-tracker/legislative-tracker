import {
  Component,
  input,
  inject,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getPlugin, getAllPlugins } from '@legislative-tracker/plugins-core';

// App Imports
import {
  LegislatureService,
  SeoService,
} from '@legislative-tracker/client-angular/core';
import { Legislation as LegislationModel } from '@legislative-tracker/shared/models';
import { BillDetail } from '../bill-detail/bill-detail.component';

/**
 * View showing details and progress for a tracked bipartisan/bicameral legislative package.
 */
@Component({
  selector: 'app-legislation-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    BillDetail,
  ],
  templateUrl: './legislation-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./legislation-detail.component.scss'],
})
export class LegislationDetail {
  stateCd = input<string>('');
  id = input<string>('');

  private legislatureService = inject(LegislatureService);
  private seoService = inject(SeoService);

  constructor() {
    effect(() => {
      const leg = this.legislation();
      if (leg?.name) {
        this.seoService.setLegislationTags({
          name: leg.name,
          description: leg.description,
        });
      } else {
        this.seoService.resetTags();
      }
    });
  }

  legislationParams = computed(
    () => {
      const state = this.stateCd();
      return state ? { state } : undefined;
    },
    { equal: (a, b) => a?.state === b?.state },
  );

  legislationResource = rxResource({
    params: () => this.legislationParams(),
    stream: ({ params }) =>
      this.legislatureService.getLegislationByState(params.state),
  });

  legislation = computed(() => {
    const list = this.legislationResource.value() as
      LegislationModel[] | undefined;
    return list?.find((item) => item.id === this.id());
  });

  chamberNames = computed(() => {
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

    const chambers = plugin?.metadata?.jurisdiction?.chambers;
    return {
      upper: chambers?.upper ?? 'Upper Chamber',
      lower: chambers?.lower ?? 'Lower Chamber',
    };
  });

  cleanId(rawId?: string): string {
    if (!rawId) return '';
    return String(rawId).replace(/^ocd-(person|bill)[\/:=]/, '');
  }

  upperBillId = computed(() => {
    const leg = this.legislation();
    if (!leg) return undefined;
    const raw =
      leg.ocdBillIds?.upper || leg.upperBillId || leg.stateBillIds?.upper;
    return raw ? this.cleanId(raw) : undefined;
  });

  lowerBillId = computed(() => {
    const leg = this.legislation();
    if (!leg) return undefined;
    const raw =
      leg.ocdBillIds?.lower || leg.lowerBillId || leg.stateBillIds?.lower;
    return raw ? this.cleanId(raw) : undefined;
  });

  upperBillDisplayId = computed(() => {
    const leg = this.legislation();
    if (!leg) return undefined;
    return leg.upperBillId || leg.stateBillIds?.upper || leg.ocdBillIds?.upper;
  });

  lowerBillDisplayId = computed(() => {
    const leg = this.legislation();
    if (!leg) return undefined;
    return leg.lowerBillId || leg.stateBillIds?.lower || leg.ocdBillIds?.lower;
  });

  isLoading = computed(() => this.legislationResource.isLoading());
  error = computed(() => this.legislationResource.error());
}
