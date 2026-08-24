import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { Legislation } from './legislation';
import {
  LegislatureService,
  SeoService,
} from '@legislative-tracker/client-angular/core';

describe('Legislation', () => {
  let component: Legislation;
  let fixture: ComponentFixture<Legislation>;

  const mockLegislationList = [
    {
      id: 'leg-1',
      name: 'Clean Energy Act',
      description: 'Promotes clean energy incentives',
      upperBillId: 'S100',
      lowerBillId: 'A200',
    },
  ];

  const mockLegislatureService = {
    getLegislationByState: vi.fn().mockReturnValue(of(mockLegislationList)),
    getBillById: vi.fn().mockReturnValue(
      of({
        id: 'S100',
        title: 'Clean Energy Act - Senate Version',
        identifier: 'S100',
        sponsorships: [],
        actions: [],
      }),
    ),
  };

  const mockSeoService = {
    updateTags: vi.fn(),
    resetTags: vi.fn(),
  };

  beforeEach(async () => {
    mockSeoService.updateTags.mockClear();
    mockSeoService.resetTags.mockClear();

    await TestBed.configureTestingModule({
      imports: [Legislation],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: SeoService, useValue: mockSeoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Legislation);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stateCd', 'us-ny');
    fixture.componentRef.setInput('id', 'leg-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve legislation details', () => {
    expect(component.legislation()).toEqual(mockLegislationList[0]);
  });

  it('should compute upper and lower chamber bill IDs', () => {
    expect(component.upperBillId()).toBe('S100');
    expect(component.lowerBillId()).toBe('A200');
  });

  it('should update page title and SEO tags to <name> | Legislative Tracker', () => {
    expect(mockSeoService.updateTags).toHaveBeenCalledWith({
      title: 'Clean Energy Act | Legislative Tracker',
      description: 'Promotes clean energy incentives',
      type: 'article',
      twitterCard: 'summary',
    });
  });
});
