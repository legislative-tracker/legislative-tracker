import {
  Component,
  input,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { getPlugin, getAllPlugins } from '@legislative-tracker/plugins-core';

// App Imports
import { LegislatureService } from '@legislative-tracker/client-angular/core';
import { Legislation as LegislationModel } from '@legislative-tracker/shared/models';
import { BillDetail } from '../bill-detail/bill-detail';

@Component({
  selector: 'app-legislation',
  imports: [MatCardModule, MatProgressSpinnerModule, MatTabsModule, BillDetail],
  templateUrl: './legislation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./legislation.scss'],
})
export class Legislation {
  stateCd = input.required<string>();
  id = input.required<string>();

  private legislatureService = inject(LegislatureService);

  legislationResource = rxResource({
    params: () => ({ state: this.stateCd(), id: this.id() }),
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

  upperBillId = computed(() => {
    const leg = this.legislation();
    if (!leg) return undefined;
    return leg.ocdBillIds?.upper || leg.upperBillId || leg.stateBillIds?.upper;
  });

  lowerBillId = computed(() => {
    const leg = this.legislation();
    if (!leg) return undefined;
    return leg.ocdBillIds?.lower || leg.lowerBillId || leg.stateBillIds?.lower;
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
