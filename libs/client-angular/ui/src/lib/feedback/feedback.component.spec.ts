import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Feedback } from './feedback.component';
import { FeedbackService } from '@legislative-tracker/client-angular/core';
import { LinkSnackBar } from '../snackbars/link-snackbar/link-snackbar.component';

describe('Feedback', () => {
  let component: Feedback;
  let fixture: ComponentFixture<Feedback>;

  // Define Mocks
  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
    openFromComponent: vi.fn(),
  };

  const mockRouter = {
    url: '/current/test/route',
  };

  const mockFeedbackService = {
    sendFeedback: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feedback], // Standalone component
      providers: [
        provideNoopAnimations(), // Prevent animation errors during test
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter },
        { provide: FeedbackService, useValue: mockFeedbackService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Feedback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Reset mocks between tests to prevent pollution
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    const form = component.form;
    expect(form.get('type')?.value).toBe('bug');
    expect(form.get('title')?.value).toBe('');
    expect(form.get('description')?.value).toBe('');
    expect(form.valid).toBe(false); // Should be invalid initially (required fields empty)
  });

  describe('onSubmit', () => {
    it('should NOT submit if form is invalid', async () => {
      // Form is empty/invalid by default
      await component.onSubmit();

      expect(mockFeedbackService.sendFeedback).not.toHaveBeenCalled();
    });

    it('should submit successfully when form is valid', async () => {
      // Setup Form Data
      component.form.patchValue({
        type: 'feature',
        title: 'Add Dark Mode',
        description: 'Please add dark mode.',
      });

      // Mock successful service response
      const mockResponse = {
        issueNumber: 123,
        issueUrl: 'http://github.com/issue/123',
      };
      mockFeedbackService.sendFeedback.mockResolvedValue(mockResponse);

      // Act
      await component.onSubmit();

      // Assert Service Call
      // Expect the body to contain the formatted markdown we constructed in the component
      expect(mockFeedbackService.sendFeedback).toHaveBeenCalledWith(
        'Add Dark Mode',
        expect.stringContaining('**Type:** FEATURE'),
        'feature',
      );
      expect(mockFeedbackService.sendFeedback).toHaveBeenCalledWith(
        'Add Dark Mode',
        expect.stringContaining('**Context:** `/current/test/route`'),
        'feature',
      );

      // Assert SnackBar (Success)
      // We check that it opened the LinkSnackBar with the correct data
      expect(mockSnackBar.openFromComponent).toHaveBeenCalledWith(
        LinkSnackBar,
        {
          duration: 8000,
          data: {
            message: 'Issue #123 successfully submitted.',
            linkText: 'View on GitHub',
            linkUrl: 'http://github.com/issue/123',
          },
        },
      );

      // Assert Dialog Closed
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should handle submission errors gracefully', async () => {
      // Setup Form Data
      component.form.patchValue({
        type: 'bug',
        title: 'Broken Link',
        description: 'Link is broken',
      });

      // Mock Error response
      mockFeedbackService.sendFeedback.mockRejectedValue(
        new Error('API Failure'),
      );

      // Act
      await component.onSubmit();

      // Assert Error Handling
      expect(mockDialogRef.close).not.toHaveBeenCalled(); // Should stay open so user can retry
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to submit'),
        'Close',
        expect.anything(),
      );

      expect(component.isSubmitting()).toBe(false);
    });
  });
});
