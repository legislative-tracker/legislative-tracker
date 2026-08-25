import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { StatesDirectory } from './states-directory.component';
import {
  clearRegistry,
  registerPlugin,
  LegislativePlugin,
} from '@legislative-tracker/plugins-core';

const mockNyPlugin: LegislativePlugin = {
  metadata: {
    id: 'leg-us-ny',
    name: 'New York State Legislature Plugin',
    version: '1.0.0',
    description: 'New York state legislative plugin',
    jurisdiction: {
      id: 'ocd-jurisdiction/country:us/state:ny/government',
      code: 'us-ny',
      name: 'New York',
      isBicameral: true,
      chambers: {
        upper: 'Senate',
        lower: 'Assembly',
      },
      currentSession: '2025-2026',
    },
    capabilities: {
      hasApi: true,
    },
  },
  calculateCurrentSession: () => '2025-2026',
};

const mockCaPlugin: LegislativePlugin = {
  metadata: {
    id: 'leg-us-ca',
    name: 'California State Legislature Plugin',
    version: '1.2.0',
    description: 'California state legislative plugin',
    jurisdiction: {
      id: 'ocd-jurisdiction/country:us/state:ca/government',
      code: 'us-ca',
      name: 'California',
      isBicameral: true,
      chambers: {
        upper: 'Senate',
        lower: 'Assembly',
      },
      currentSession: '2025-2026',
    },
    capabilities: {
      hasApi: false,
    },
  },
  calculateCurrentSession: () => '2025-2026',
};

describe('StatesDirectory Component', () => {
  let component: StatesDirectory;
  let fixture: ComponentFixture<StatesDirectory>;

  beforeEach(async () => {
    clearRegistry();
    await registerPlugin(mockNyPlugin);
    await registerPlugin(mockCaPlugin);

    await TestBed.configureTestingModule({
      imports: [StatesDirectory],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StatesDirectory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load registered plugins', () => {
    expect(component).toBeTruthy();
    expect(component.plugins().length).toBe(2);
    expect(component.filteredPlugins().length).toBe(2);
  });

  it('should calculate stats accurately', () => {
    const stats = component.stats();
    expect(stats.totalStates).toBe(2);
    expect(stats.totalChambers).toBe(4);
    expect(stats.withApi).toBe(1);
  });

  it('should filter plugins by query', () => {
    component.searchQuery.set('california');
    expect(component.filteredPlugins().length).toBe(1);
    expect(component.filteredPlugins()[0].metadata.jurisdiction.code).toBe(
      'us-ca',
    );

    component.searchQuery.set('us-ny');
    expect(component.filteredPlugins().length).toBe(1);
    expect(component.filteredPlugins()[0].metadata.jurisdiction.name).toBe(
      'New York',
    );

    component.searchQuery.set('nonexistent');
    expect(component.filteredPlugins().length).toBe(0);
  });

  it('should return proper route for jurisdiction', () => {
    const route = component.getJurisdictionRoute(mockNyPlugin);
    expect(route).toBe('/us-ny');
  });

  afterAll(async () => {
    clearRegistry();
    await registerPlugin(mockNyPlugin);
  });
});
