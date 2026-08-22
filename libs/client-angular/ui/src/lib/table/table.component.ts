import {
  Component,
  input,
  computed,
  output,
  viewChild,
  effect,
  signal,
} from '@angular/core';
import {
  MatTableModule,
  MatTableDataSource,
  MatTable,
} from '@angular/material/table';
import { MatSortModule, MatSort, SortDirection } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

// App imports
import { ColumnConfig } from '@legislative-tracker/shared/models';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  imports: [
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
  ],
})
export class TableComponent<T> {
  dataSource = input.required<T[]>();
  columnSource = input.required<ColumnConfig<T>[]>();
  stateCd = input.required<string>(); // Passed from parent or route
  routeType = input.required<
    'bill' | 'member' | 'legislation' | 'ocd-person'
  >();
  chamber = input<'SENATE' | 'ASSEMBLY'>();
  defaultSortKeyInput = input<string | undefined>(undefined, {
    alias: 'defaultSortKey',
  });
  defaultSortDirection = input<SortDirection>('asc');
  enableColumnSearch = input<boolean>(true);

  readonly sort = viewChild(MatSort);
  readonly table = viewChild<MatTable<T>>(MatTable);
  readonly matDataSource = new MatTableDataSource<T>([]);
  readonly filterValues = signal<Record<string, string>>({});

  displayedColumns = computed(() => this.columnSource().map((c) => c.key));
  displayedFilterColumns = computed(() =>
    this.enableColumnSearch()
      ? this.columnSource().map((c) => 'filter-' + c.key)
      : [],
  );

  hasActiveFilters = computed(() =>
    Object.values(this.filterValues()).some((v) => !!v?.trim()),
  );

  defaultSortKey = computed(() => {
    const customKey = this.defaultSortKeyInput();
    if (customKey) return customKey;

    const titleCol = this.columnSource().find(
      (c) => c.label === 'Title' || c.key === 'title',
    );
    return titleCol ? titleCol.key : (this.columnSource()[0]?.key ?? '');
  });

  rowClick = output<T>();

  constructor() {
    this.matDataSource.filterPredicate = (
      data: T,
      filterJson: string,
    ): boolean => {
      if (!filterJson) return true;
      try {
        const searchTerms = JSON.parse(filterJson) as Record<string, string>;
        return Object.entries(searchTerms).every(([key, term]) => {
          if (!term || !term.trim()) return true;
          const val = (data as Record<string, any>)[key];
          if (val == null) return false;
          return String(val).toLowerCase().includes(term.trim().toLowerCase());
        });
      } catch {
        return true;
      }
    };

    effect(() => {
      this.matDataSource.data = this.dataSource();
      const sortInstance = this.sort();
      if (sortInstance) {
        this.matDataSource.sort = sortInstance;
      }
      this.matDataSource.filter = JSON.stringify(this.filterValues());
    });
  }

  onFilterInput(columnKey: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterValues.update((current) => ({
      ...current,
      [columnKey]: value,
    }));
  }

  clearColumnFilter(columnKey: string) {
    this.filterValues.update((current) => {
      const updated = { ...current };
      delete updated[columnKey];
      return updated;
    });
  }

  clearAllFilters() {
    this.filterValues.set({});
  }

  onRowClick(row: T) {
    this.rowClick.emit(row);
  }

  getRowTargetId(row: T): string {
    if (!row) return '';
    const r = row as Record<string, any>;
    const rawId =
      r['id'] ||
      r['legislationId'] ||
      r['ocdId'] ||
      r['ocdBillId'] ||
      r['identifier'];
    return this.cleanId(rawId);
  }

  cleanId(rawId?: string): string {
    if (!rawId) return '';
    return String(rawId).replace(/^ocd-(person|bill)[\/:=]/, '');
  }
}
