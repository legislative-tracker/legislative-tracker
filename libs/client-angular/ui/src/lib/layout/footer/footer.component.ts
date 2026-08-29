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
import { Feedback } from '../../feedback/feedback.component';

/**
 * Global application footer displaying current release version, copyright,
 * and quick trigger for user feedback.
 */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './footer.component.scss',
})
export class Footer {
  /** Current year signal for copyright display. */
  currentYear = signal(new Date().getFullYear());
  /** Application version signal. */
  appVersion = signal(APP_VERSION);
  /** Build timestamp signal. */
  buildTimestamp = signal(new Date().toISOString());

  private ui = inject(UiService);

  /**
   * Opens the user feedback dialog.
   */
  openFeedback() {
    this.ui.openFeedbackDialog(Feedback);
  }
}
