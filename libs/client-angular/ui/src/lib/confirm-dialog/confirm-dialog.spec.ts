import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;

  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockDialogData: ConfirmDialogData = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Yes, Proceed',
    cancelText: 'No, Cancel',
    confirmColor: 'warn',
    icon: 'warning',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should receive injected dialog data', () => {
    expect(component.data.title).toBe('Confirm Action');
    expect(component.data.message).toBe('Are you sure you want to proceed?');
    expect(component.data.confirmText).toBe('Yes, Proceed');
    expect(component.data.cancelText).toBe('No, Cancel');
    expect(component.data.confirmColor).toBe('warn');
    expect(component.data.icon).toBe('warning');
  });

  it('should close dialog with true on confirm', () => {
    component.onConfirm();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
