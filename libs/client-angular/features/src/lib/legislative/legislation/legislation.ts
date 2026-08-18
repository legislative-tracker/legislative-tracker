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

// App Imports
import { LegislatureService } from '@legislative-tracker/client-angular/core';
import { Legislation as LegislationModel } from '@legislative-tracker/shared/models';

@Component({
  selector: 'app-legislation',
  imports: [MatCardModule, MatProgressSpinnerModule, MatTabsModule],
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

  isLoading = computed(() => this.legislationResource.isLoading());
  error = computed(() => this.legislationResource.error());
}
