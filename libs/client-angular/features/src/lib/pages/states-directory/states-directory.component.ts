import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  getAllPlugins,
  LegislativePlugin,
} from '@legislative-tracker/plugins-core';

/**
 * State Directory landing page showcasing all registered legislative jurisdiction plugins with search filtering.
 */
@Component({
  selector: 'app-states-directory',
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './states-directory.component.html',
  styleUrls: ['../pages.scss', './states-directory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatesDirectory {
  searchQuery = signal<string>('');

  readonly plugins = signal<LegislativePlugin[]>(getAllPlugins());

  readonly filteredPlugins = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.plugins();
    if (!query) return list;

    return list.filter((p) => {
      const name = p.metadata.jurisdiction.name.toLowerCase();
      const code = p.metadata.jurisdiction.code.toLowerCase();
      const id = p.metadata.id.toLowerCase();
      const upper = p.metadata.jurisdiction.chambers.upper?.toLowerCase() || '';
      const lower = p.metadata.jurisdiction.chambers.lower?.toLowerCase() || '';
      return (
        name.includes(query) ||
        code.includes(query) ||
        id.includes(query) ||
        upper.includes(query) ||
        lower.includes(query)
      );
    });
  });

  readonly stats = computed(() => {
    const list = this.plugins();
    const totalStates = list.length;
    const totalChambers = list.reduce((acc, p) => {
      let count = 0;
      if (p.metadata.jurisdiction.chambers.upper) count++;
      if (p.metadata.jurisdiction.chambers.lower) count++;
      return acc + (count || (p.metadata.jurisdiction.isBicameral ? 2 : 1));
    }, 0);
    const withApi = list.filter((p) => p.metadata.capabilities?.hasApi).length;

    return { totalStates, totalChambers, withApi };
  });

  getJurisdictionRoute(plugin: LegislativePlugin): string {
    return `/${plugin.metadata.jurisdiction.code}`;
  }
}
