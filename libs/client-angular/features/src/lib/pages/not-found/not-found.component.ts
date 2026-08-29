import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * 404 Not Found error page displayed when a route or unsupported state jurisdiction cannot be resolved.
 */
@Component({
  selector: 'app-not-found',
  imports: [],
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../pages.scss', './not-found.component.scss'],
})
export class NotFound {}
