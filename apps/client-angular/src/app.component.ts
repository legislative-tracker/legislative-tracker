import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigService } from '@legislative-tracker/client-angular/core';

/**
 * Root application component hosting the primary router outlet and loading runtime branding.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
})
export class App {
  // Set up app branding
  private readonly configService = inject(ConfigService);
  protected readonly config = this.configService.config;
}
