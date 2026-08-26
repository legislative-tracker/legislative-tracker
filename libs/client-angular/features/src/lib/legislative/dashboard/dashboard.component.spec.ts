import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Dashboard } from './dashboard.component';

// Dependencies
import {
  AuthService,
  LegislatureService,
} from '@legislative-tracker/client-angular/core';
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
    {
      id: 'BILL-1',
      title: 'Education Reform',
      session: '2024',
      upperBillId: 'S100',
      lowerBillId: 'A200',
    },
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

  const mockUserProfileSignal = signal<any>(null);
  const mockIsLoggedInSignal = signal<boolean>(false);
  const mockAuthService = {
    userProfile: mockUserProfileSignal,
    isLoggedIn: mockIsLoggedInSignal,
  };

  beforeEach(async () => {
    mockLegislatureService.getLegislationByState.mockClear();
    mockLegislatureService.getMembersByState.mockClear();
    mockUserProfileSignal.set(null);
    mockIsLoggedInSignal.set(false);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: AuthService, useValue: mockAuthService },
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
      const jane = senate.find((m) => m.name === 'Jane Doe');
      expect(jane).toBeTruthy();
      expect(jane?.family_name).toBe('Doe');
      expect(jane?.given_name).toBe('Jane');
      expect(jane?.district).toBe('1');
      expect(
        senate.find(
          (m) =>
            m.chamber === 'ASSEMBLY' ||
            m.current_role?.org_classification === 'lower',
        ),
      ).toBeUndefined();
    });

    it('should have memberCols configured with Last Name, First Name, Party, and District', () => {
      expect(component.memberCols).toEqual([
        { key: 'family_name', label: 'Last Name' },
        { key: 'given_name', label: 'First Name' },
        { key: 'party', label: 'Party' },
        { key: 'district', label: 'District' },
      ]);
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
      expect(assembly[0].family_name).toBe('Smith');
      expect(assembly[0].given_name).toBe('John');
      expect(assembly[0].district).toBe('2');
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
