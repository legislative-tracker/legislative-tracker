import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';

interface DataCategory {
  title: string;
  icon: string;
  description: string;
  importantNote?: string;
}

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [MatCardModule, MatListModule, MatIconModule, MatDividerModule, DatePipe],
  templateUrl: './privacy.html',
  styleUrls: ['../pages.scss', './privacy.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Privacy {
  readonly lastUpdated = signal<Date>(new Date('2026-01-04'));

  readonly dataCategories = signal<DataCategory[]>([
    {
      title: 'Identity Data',
      icon: 'badge',
      description:
        'If you sign in, we store your email address and basic profile info provided by Google Auth.',
    },
    {
      title: 'Usage Data',
      icon: 'dashboard',
      description: 'We store your list of "Favorite" bills to populate your dashboard.',
    },
    {
      title: 'Address & Location (Transient)',
      icon: 'location_off',
      description: 'Used solely to find your district representatives and discarded immediately.',
      importantNote: 'We do NOT store your street address or coordinates.',
    },
  ]);
}
