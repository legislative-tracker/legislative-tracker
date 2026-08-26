import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AppResetDialog,
  AppResetDialogData,
} from './app-reset-dialog.component';

describe('AppResetDialog', () => {
  let component: AppResetDialog;
  let fixture: ComponentFixture<AppResetDialog>;

  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockData: AppResetDialogData = {
    title: 'Custom Reset Title',
    message: 'Custom Reset Message',
    isLoggedIn: true,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [AppResetDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppResetDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default backupChoice to backup', () => {
    expect(component.backupChoice()).toBe('backup');
  });

  it('should close with null on onCancel()', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should close with confirmed: true and backupPersonalData: true when backup is selected', () => {
    component.backupChoice.set('backup');
    component.onConfirm();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      confirmed: true,
      backupPersonalData: true,
    });
  });

  it('should default backupChoice to wipe if isLoggedIn is false', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AppResetDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { ...mockData, isLoggedIn: false },
        },
      ],
    }).compileComponents();

    const unauthedFixture = TestBed.createComponent(AppResetDialog);
    const unauthedComponent = unauthedFixture.componentInstance;
    expect(unauthedComponent.backupChoice()).toBe('wipe');
  });
});
