import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations'; // Critical for MatTable
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';

import { TableComponent } from './table.component';
import { ColumnConfig } from '@legislative-tracker/shared/models';

interface TestItem {
  id: string;
  name: string;
  role: string;
}

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('TableComponent', () => {
  let component: TableComponent<TestItem>;
  let fixture: ComponentFixture<TableComponent<TestItem>>;

  const mockData: TestItem[] = [
    { id: '1', name: 'Alice', role: 'Admin' },
    { id: '2', name: 'Bob', role: 'User' },
  ];

  const mockColumns: ColumnConfig<TestItem>[] = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent],
      providers: [
        provideRouter([{ path: '**', component: DummyComponent }]),
        provideNoopAnimations(), // Ensures MatTable renders without waiting for CSS animations
      ],
    }).compileComponents();

    fixture = TestBed.createComponent<TableComponent<TestItem>>(TableComponent);
    component = fixture.componentInstance;

    // Set Inputs
    fixture.componentRef.setInput('dataSource', mockData);
    fixture.componentRef.setInput('columnSource', mockColumns);
    fixture.componentRef.setInput('stateCd', 'ny');
    fixture.componentRef.setInput('routeType', 'bill');

    // Trigger Initial Change Detection
    fixture.detectChanges();

    // Wait for MatTable to render rows (Critical Step)
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the correct number of rows', () => {
    const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
    expect(rows.length).toBe(2);
  });

  it('should emit rowClick event when a row is clicked', () => {
    // Spy on the output emitter
    const emitSpy = vi.spyOn(component.rowClick, 'emit');

    // Find the row
    const firstRow = fixture.debugElement.query(By.css('tr[mat-row]'));

    // Safety Check: Ensure row exists before clicking to prevent crash
    if (!firstRow) {
      throw new Error('Table row not found! MatTable did not render.');
    }

    // Click
    firstRow.nativeElement.click();

    // Assert
    expect(emitSpy).toHaveBeenCalledWith(mockData[0]);
  });
});
