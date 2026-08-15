import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-not-found',
  imports: [],
  templateUrl: './not-found.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../pages.scss', './not-found.scss'],
})
export class NotFound {}
