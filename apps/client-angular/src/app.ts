import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigService } from '@legislative-tracker/client-angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  // Set up app branding
  private readonly configService = inject(ConfigService);
  protected readonly config = this.configService.config;
}
