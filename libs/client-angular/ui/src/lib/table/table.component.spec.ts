import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';

import { TableComponent } from './table.component';
import { ColumnConfig } from '@legislative-tracker/shared/models';

interface TestItem {
  id: string;
  title?: string;
  name?: string;
  role?: string;
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class DummyComponent {}

describe('TableComponent', () => {
  let component: TableComponent<TestItem>;
  let fixture: ComponentFixture<TableComponent<TestItem>>;

  const mockData: TestItem[] = [
    { id: '1', name: 'Alice', role: 'Admin', title: 'Zebra Bill' },
    { id: '2', name: 'Bob', role: 'User', title: 'Apple Bill' },
  ];

  const mockColumns: ColumnConfig<TestItem>[] = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
  ];

  const mockColumnsWithTitle: ColumnConfig<TestItem>[] = [
    { key: 'id', label: 'Bill Number' },
    { key: 'title', label: 'Title' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent],
      providers: [
        provideRouter([{ path: '**', component: DummyComponent }]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent<TableComponent<TestItem>>(TableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('dataSource', mockData);
    fixture.componentRef.setInput('columnSource', mockColumns);
    fixture.componentRef.setInput('stateCd', 'ny');
    fixture.componentRef.setInput('routeType', 'bill');

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the correct number of rows', () => {
    const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
    expect(rows.length).toBe(2);
  });

  it('should render mat-sort-header on table header cells', () => {
    const headers = fixture.debugElement.queryAll(
      By.css('th[mat-sort-header]'),
    );
    expect(headers.length).toBe(2);
    headers.forEach((header) => {
      expect(header.attributes['mat-sort-header']).toBeDefined();
    });
  });

  it('should default sort to first column key when Title column is absent', () => {
    expect(component.defaultSortKey()).toBe('name');
  });

  it('should default sort to Title column key when Title column is present', async () => {
    fixture.componentRef.setInput('columnSource', mockColumnsWithTitle);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.defaultSortKey()).toBe('title');
  });

  it('should respect custom defaultSortKey input', async () => {
    fixture.componentRef.setInput('defaultSortKey', 'role');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.defaultSortKey()).toBe('role');
  });

  it('should emit rowClick event when a row is clicked', () => {
    const emitSpy = vi.spyOn(component.rowClick, 'emit');
    const firstRow = fixture.debugElement.query(By.css('tr[mat-row]'));

    if (!firstRow) {
      throw new Error('Table row not found! MatTable did not render.');
    }

    firstRow.nativeElement.click();
    expect(emitSpy).toHaveBeenCalledWith(mockData[0]);
  });

  it('should render filter header row when enableColumnSearch is true', () => {
    const filterRow = fixture.debugElement.query(
      By.css('tr.filter-header-row'),
    );
    expect(filterRow).toBeTruthy();
  });

  it('should filter rows by column input value', async () => {
    const inputDebug = fixture.debugElement.query(
      By.css('input[aria-label="Filter by Name"]'),
    );
    expect(inputDebug).toBeTruthy();

    inputDebug.nativeElement.value = 'Alice';
    inputDebug.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
    expect(rows.length).toBe(1);
    expect(component.matDataSource.filteredData.length).toBe(1);
    expect(component.matDataSource.filteredData[0].name).toBe('Alice');
  });

  it('should filter rows by multiple columns simultaneously', async () => {
    component.onFilterInput('name', {
      target: { value: 'Alice' },
    } as unknown as Event);
    component.onFilterInput('role', {
      target: { value: 'User' },
    } as unknown as Event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.matDataSource.filteredData.length).toBe(0);

    component.onFilterInput('role', {
      target: { value: 'Admin' },
    } as unknown as Event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.matDataSource.filteredData.length).toBe(1);
  });

  it('should clear individual column filter', async () => {
    component.onFilterInput('name', {
      target: { value: 'Alice' },
    } as unknown as Event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.matDataSource.filteredData.length).toBe(1);

    component.clearColumnFilter('name');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.matDataSource.filteredData.length).toBe(2);
  });

  it('should clear all filters using clearAllFilters', async () => {
    component.onFilterInput('name', {
      target: { value: 'Alice' },
    } as unknown as Event);
    component.onFilterInput('role', {
      target: { value: 'Admin' },
    } as unknown as Event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.hasActiveFilters()).toBe(true);

    component.clearAllFilters();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.hasActiveFilters()).toBe(false);
    expect(component.matDataSource.filteredData.length).toBe(2);
  });

  it('should hide filter header row when enableColumnSearch is false', async () => {
    const freshFixture =
      TestBed.createComponent<TableComponent<TestItem>>(TableComponent);
    freshFixture.componentRef.setInput('dataSource', mockData);
    freshFixture.componentRef.setInput('columnSource', mockColumns);
    freshFixture.componentRef.setInput('stateCd', 'ny');
    freshFixture.componentRef.setInput('routeType', 'bill');
    freshFixture.componentRef.setInput('enableColumnSearch', false);

    freshFixture.detectChanges();
    await freshFixture.whenStable();

    const filterRow = freshFixture.debugElement.query(
      By.css('tr.filter-header-row'),
    );
    expect(filterRow).toBeNull();
  });

  it('should not emit rowClick when clicking on filter input', () => {
    const emitSpy = vi.spyOn(component.rowClick, 'emit');
    const inputDebug = fixture.debugElement.query(
      By.css('input[aria-label="Filter by Name"]'),
    );

    if (inputDebug) {
      inputDebug.nativeElement.click();
    }
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
