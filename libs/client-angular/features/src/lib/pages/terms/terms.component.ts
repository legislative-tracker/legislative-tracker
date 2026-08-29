import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';

interface TermsSection {
  title: string;
  icon: string;
  description: string;
  importantNote?: string;
}

/**
 * Terms of Service page outlining civic data terms, open source license terms,
 * user responsibilities, and government non-affiliation disclaimers.
 */
@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    DatePipe,
  ],
  templateUrl: './terms.component.html',
  styleUrls: ['../pages.scss', './terms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Terms {
  readonly lastUpdated = signal<Date>(new Date('2026-08-29'));

  readonly termsSections = signal<TermsSection[]>([
    {
      title: 'Open Source License (AGPL-3.0)',
      icon: 'gavel',
      description:
        'Legislative Tracker is free, open-source software licensed under the GNU Affero General Public License v3.0. You may inspect, modify, and redistribute the source code under AGPL-3.0 terms.',
    },
    {
      title: 'Non-Affiliation & Civic Data Disclaimer',
      icon: 'account_balance',
      description:
        'Legislative Tracker is an independent civic tech platform. It is NOT affiliated with, endorsed by, or an official representation of any government agency, legislature, or state official.',
      importantNote:
        'Data is provided for informational and public awareness purposes only.',
    },
    {
      title: 'Data Sources & Accuracy',
      icon: 'sync',
      description:
        'Legislative records and lawmaker rosters are aggregated from public open data APIs (such as OpenStates and state legislative portals). While updated regularly, official state journals remain the definitive record.',
    },
    {
      title: 'Acceptable Use & Privacy',
      icon: 'security',
      description:
        'Users agree not to misuse automated features or attempt unauthorized access to platform infrastructure. Local bookmarks and notes are stored strictly on your device.',
    },
  ]);
}
