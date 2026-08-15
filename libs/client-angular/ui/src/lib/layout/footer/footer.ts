import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';

// App imports
import {
  UiService,
  APP_VERSION,
} from '@legislative-tracker/client-angular/core';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './footer.scss',
})
export class Footer {
  currentYear = signal(new Date().getFullYear());
  appVersion = signal(APP_VERSION);
  buildTimestamp = signal(new Date().toISOString());

  private ui = inject(UiService);

  openFeedback() {
    this.ui.openFeedbackDialog(Feedback);
  }
}
