import { Component, signal, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

// App imports
import { UiService } from "@legislative-tracker/client-angular/core";
import { Feedback } from "../../feedback/feedback";

@Component({
  selector: "app-footer",
  imports: [RouterLink],
  templateUrl: "./footer.html",
  styleUrl: "./footer.scss",
})
export class Footer {
  currentYear = signal(new Date().getFullYear());
  appVersion = signal("0.8.4");
  buildTimestamp = signal(new Date().toISOString());

  private ui = inject(UiService);

  openFeedback() {
    this.ui.openFeedbackDialog(Feedback);
  }
}
