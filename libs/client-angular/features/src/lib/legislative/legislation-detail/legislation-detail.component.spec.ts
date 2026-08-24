import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { LegislationDetail } from './legislation-detail.component';
import {
  LegislatureService,
  SeoService,
} from '@legislative-tracker/client-angular/core';

describe('LegislationDetail', () => {
  let component: LegislationDetail;
  let fixture: ComponentFixture<LegislationDetail>;

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
    setLegislationTags: vi.fn(),
  };

  beforeEach(async () => {
    mockSeoService.updateTags.mockClear();
    mockSeoService.resetTags.mockClear();
    mockSeoService.setLegislationTags.mockClear();

    await TestBed.configureTestingModule({
      imports: [LegislationDetail],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: SeoService, useValue: mockSeoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LegislationDetail);
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
    expect(mockSeoService.setLegislationTags).toHaveBeenCalledWith({
      name: 'Clean Energy Act',
      description: 'Promotes clean energy incentives',
    });
  });

  it('should render pop-out buttons in chamber tab headers with correct links and accessibility attributes', () => {
    const popOutLinks = fixture.debugElement.queryAll(By.css('.pop-out-btn'));
    expect(popOutLinks.length).toBe(2);

    const upperLink = popOutLinks[0].nativeElement as HTMLAnchorElement;
    expect(upperLink.getAttribute('target')).toBe('_blank');
    expect(upperLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(upperLink.getAttribute('aria-label')).toBe(
      `Open ${component.chamberNames().upper} bill in new tab`,
    );
    expect(upperLink.getAttribute('href')).toContain('/us-ny/ocd-bill/S100');

    const lowerLink = popOutLinks[1].nativeElement as HTMLAnchorElement;
    expect(lowerLink.getAttribute('target')).toBe('_blank');
    expect(lowerLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(lowerLink.getAttribute('aria-label')).toBe(
      `Open ${component.chamberNames().lower} bill in new tab`,
    );
    expect(lowerLink.getAttribute('href')).toContain('/us-ny/ocd-bill/A200');
  });

  it('should stop event propagation when pop-out button is clicked', () => {
    const popOutLinks = fixture.debugElement.queryAll(By.css('.pop-out-btn'));
    expect(popOutLinks.length).toBeGreaterThan(0);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

    popOutLinks[0].nativeElement.dispatchEvent(clickEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
