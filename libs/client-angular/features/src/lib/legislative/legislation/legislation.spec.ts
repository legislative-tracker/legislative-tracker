import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { Legislation } from './legislation';
import { LegislatureService } from '@legislative-tracker/client-angular/core';

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
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Legislation],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Legislation);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stateCd', 'ny');
    fixture.componentRef.setInput('id', 'leg-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve legislation details', () => {
    expect(component.legislation()).toEqual(mockLegislationList[0]);
  });
});
