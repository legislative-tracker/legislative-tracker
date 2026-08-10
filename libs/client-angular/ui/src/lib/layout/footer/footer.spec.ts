import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideRouter } from '@angular/router';

import { Footer } from './footer';
import { UiService } from '@legislative-tracker/client-angular/core';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  // Mock dependencies
  const mockUiService = {
    openFeedbackDialog: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer], // Standalone component
      providers: [
        //  Essential for components using RouterLink
        provideRouter([]),

        // Mock the UI service
        { provide: UiService, useValue: mockUiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize signals with correct defaults', () => {
    const currentYear = new Date().getFullYear();

    // Verify the signals hold data (version/date come from imports)
    expect(component.currentYear()).toBe(currentYear);
    expect(component.appVersion()).toBeDefined();
    expect(component.buildTimestamp()).toBeDefined();
  });

  it('should open feedback dialog when requested', () => {
    // Trigger the method
    component.openFeedback();

    // Verify the spy was called
    expect(mockUiService.openFeedbackDialog).toHaveBeenCalled();
  });
});
