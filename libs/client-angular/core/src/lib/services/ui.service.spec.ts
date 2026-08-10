import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Target Service
import { UiService } from './ui.service';

// Dependencies
// We import the component class to verify it is passed to the dialog
import { Feedback } from '@legislative-tracker/client-angular/ui';

describe('UiService', () => {
  let service: UiService;
  let dialogSpy: { open: any };

  beforeEach(() => {
    // Create a spy for MatDialog
    dialogSpy = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UiService,
        // Provide the spy instead of the real MatDialog
        { provide: MatDialog, useValue: dialogSpy },
      ],
    });

    service = TestBed.inject(UiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('openFeedbackDialog', () => {
    it('should open the Feedback component with correct configuration', () => {
      // Call the method
      service.openFeedbackDialog();

      // Verify MatDialog.open was called exactly once
      expect(dialogSpy.open).toHaveBeenCalledTimes(1);

      // Verify arguments: Component Class + Config Object
      expect(dialogSpy.open).toHaveBeenCalledWith(Feedback, {
        width: '500px',
        maxWidth: '90vw',
        disableClose: true,
        autoFocus: false,
      });
    });
  });
});
