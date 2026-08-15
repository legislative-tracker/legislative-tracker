import {
  Component,
  input,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LegislatureService } from '@legislative-tracker/client-angular/core';
import {
  TableComponent,
  ImgFallbackDirective,
} from '@legislative-tracker/client-angular/ui';
import {
  SPONSORSHIP_COLS,
  Legislator,
} from '@legislative-tracker/shared/models';

@Component({
  selector: 'app-member-detail',
  imports: [
    MatIconModule,
    MatListModule,
    MatTabsModule,
    TableComponent,
    MatProgressSpinnerModule,
    ImgFallbackDirective,
  ],
  templateUrl: './member-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./member-detail.scss'],
})
export class MemberDetail {
  stateCd = input.required<string>();
  id = input.required<string>(); // The Member ID

  private legislatureService = inject(LegislatureService);
  sponsorshipCols = SPONSORSHIP_COLS;

  memberResource = rxResource({
    params: () => ({ state: this.stateCd(), id: this.id() }),
    stream: ({ params }) =>
      this.legislatureService.getMemberById(params.state, params.id),
  });

  member = computed(
    () => this.memberResource.value() as Legislator | undefined,
  );

  sponsorships = computed(() => this.member()?.sponsorships ?? []);
}
