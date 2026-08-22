import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

// Target Component
import { Dashboard } from './dashboard';

// Dependencies
import { LegislatureService } from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';

// Stub Child Components
@Component({
  selector: 'app-table',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['dataSource', 'columnSource', 'isLoading', 'routeType'],
})
class MockTableComponent {}

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const mockBills = [
    { id: 'BILL-1', title: 'Education Reform', session: '2024' },
    { id: 'BILL-2', title: 'Infrastructure', session: '2024' },
  ];

  const mockMembers = [
    {
      id: '1',
      name: 'Jane Doe',
      chamber: 'SENATE',
      current_role: { org_classification: 'upper', district: '1' },
      party: 'D',
    },
    {
      id: '2',
      name: 'John Smith',
      chamber: 'ASSEMBLY',
      current_role: { org_classification: 'lower', district: '2' },
      party: 'R',
    },
    {
      id: '3',
      name: 'Alice Johnson',
      chamber: 'SENATE',
      current_role: { org_classification: 'upper', district: '3' },
      party: 'I',
    },
  ];

  const mockLegislatureService = {
    getLegislationByState: vi.fn().mockReturnValue(of(mockBills)),
    getMembersByState: vi.fn().mockReturnValue(of(mockMembers)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
      ],
    })
      .overrideComponent(Dashboard, {
        remove: { imports: [TableComponent] },
        add: { imports: [MockTableComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('stateCd', 'ny');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization (Default Tab: Bills)', () => {
    it('should fetch bills immediately on load', () => {
      expect(mockLegislatureService.getLegislationByState).toHaveBeenCalledWith(
        'ny',
      );
      expect(component.bills()).toEqual(mockBills);
    });

    it('should NOT fetch members on initial load', () => {
      expect(mockLegislatureService.getMembersByState).not.toHaveBeenCalled();
      expect(component.members()).toEqual([]);
    });
  });

  describe('Tab Switching & Data Filtering', () => {
    it('should fetch members when switching to Senate tab (Index 1)', async () => {
      component.onTabChange(1);
      fixture.detectChanges();

      await fixture.whenStable();

      expect(mockLegislatureService.getMembersByState).toHaveBeenCalledWith(
        'ny',
      );

      const senate = component.senateMembers();
      expect(senate.length).toBe(2);
      expect(senate.find((m) => m.name === 'Jane Doe')).toBeTruthy();
      expect(
        senate.find(
          (m) =>
            m.chamber === 'ASSEMBLY' ||
            m.current_role?.org_classification === 'lower',
        ),
      ).toBeUndefined();
    });

    it('should fetch members when switching to Assembly tab (Index 2)', async () => {
      component.onTabChange(2);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockLegislatureService.getMembersByState).toHaveBeenCalledWith(
        'ny',
      );

      const assembly = component.assemblyMembers();
      expect(assembly.length).toBe(1);
      expect(assembly[0].name).toBe('John Smith');
    });

    it('should stop fetching bills when switching away from Bills tab', async () => {
      mockLegislatureService.getLegislationByState.mockClear();

      component.onTabChange(1);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        mockLegislatureService.getLegislationByState,
      ).not.toHaveBeenCalled();
      expect(component.bills()).toEqual([]);
    });
  });

  describe('State Changes', () => {
    it('should refetch bills when stateCd input changes', () => {
      mockLegislatureService.getLegislationByState.mockClear();

      fixture.componentRef.setInput('stateCd', 'ca');
      fixture.detectChanges();

      expect(mockLegislatureService.getLegislationByState).toHaveBeenCalledWith(
        'ca',
      );
    });
  });
});
