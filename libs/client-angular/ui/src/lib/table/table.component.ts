import { Component, input, computed, output, ChangeDetectionStrategy } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
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

  displayedColumns = computed(() => this.columnSource().map((c) => c.key));

  rowClick = output<T>();

  onRowClick(row: T) {
    this.rowClick.emit(row);
  }
}
