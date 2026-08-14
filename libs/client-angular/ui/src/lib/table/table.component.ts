import {
  Component,
  input,
  computed,
  output,
  ChangeDetectionStrategy,
  viewChild,
  effect,
} from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort, SortDirection } from '@angular/material/sort';
import { RouterLink } from '@angular/router';

// App imports
import { ColumnConfig } from '@legislative-tracker/shared/models';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatTableModule, MatSortModule, RouterLink],
})
export class TableComponent<T> {
  dataSource = input.required<T[]>();
  columnSource = input.required<ColumnConfig<T>[]>();
  stateCd = input.required<string>(); // Passed from parent or route
  routeType = input.required<'bill' | 'member'>();
  chamber = input<'SENATE' | 'ASSEMBLY'>();
  defaultSortKeyInput = input<string | undefined>(undefined, { alias: 'defaultSortKey' });
  defaultSortDirection = input<SortDirection>('asc');

  readonly sort = viewChild(MatSort);
  readonly matDataSource = new MatTableDataSource<T>([]);

  displayedColumns = computed(() => this.columnSource().map((c) => c.key));

  defaultSortKey = computed(() => {
    const customKey = this.defaultSortKeyInput();
    if (customKey) return customKey;

    const titleCol = this.columnSource().find(
      (c) => c.label === 'Title' || c.key === 'title'
    );
    return titleCol ? titleCol.key : (this.columnSource()[0]?.key ?? '');
  });

  rowClick = output<T>();

  constructor() {
    effect(() => {
      this.matDataSource.data = this.dataSource();
      const sortInstance = this.sort();
      if (sortInstance) {
        this.matDataSource.sort = sortInstance;
      }
    });
  }

  onRowClick(row: T) {
    this.rowClick.emit(row);
  }
}
