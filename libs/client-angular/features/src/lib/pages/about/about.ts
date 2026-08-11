import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";

// App Imports
import { ConfigService } from "@legislative-tracker/client-angular/core";
import { ResourceLink } from "@legislative-tracker/shared/models";

@Component({
  selector: "app-about",
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatListModule, MatIconModule],
  templateUrl: "./about.html",
  styleUrls: ["../pages.scss", "./about.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  private configService = inject(ConfigService);

  // Computed Signals for Template Binding
  // If config is not yet loaded, these fall back to safe empty strings or defaults
  readonly orgName = computed(
    () => this.configService.config().organization.name,
  );
  readonly orgUrl = computed(
    () => this.configService.config().organization.url,
  );

  readonly resources = computed<ResourceLink[]>(() => {
    return this.configService.config().resources;
  });

  readonly details = signal([
    {
      title: "Data Sources",
      icon: "dns",
      content:
        "We aggregate data via OpenStates & State Legislature APIs, syncing nightly to capture the latest bill sponsorships and legislator movements.",
    },
    {
      title: "Open Source",
      icon: "terminal",
      content:
        "Built with Angular v20 and Firebase. We welcome community contributions to help improve transparency in advocacy.",
    },
    {
      title: "Disclaimer",
      icon: "warning",
      content:
        "This tool is for informational purposes only and is not an official government service. Always verify with official legislative records.",
    },
  ]);
}
