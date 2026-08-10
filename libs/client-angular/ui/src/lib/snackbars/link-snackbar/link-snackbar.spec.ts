import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinkSnackBar, LinkSnackBarData } from './link-snackbar';

describe('LinkSnackBar', () => {
  let component: LinkSnackBar;
  let fixture: ComponentFixture<LinkSnackBar>;

  // Define strict mock data
  const mockData: LinkSnackBarData = {
    message: 'Test Message',
    linkText: 'Click Here',
    linkUrl: 'https://example.com',
  };

  // Create the mock object using vi.fn() for spies
  const snackBarRefMock = {
    dismiss: vi.fn(),
    dismissWithAction: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Import the standalone component directly
      imports: [LinkSnackBar],
      providers: [
        // Provide the Vitest mock
        { provide: MatSnackBarRef, useValue: snackBarRefMock },
        // Provide the data token
        { provide: MAT_SNACK_BAR_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkSnackBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with the injected data', () => {
    expect(component.data).toEqual(mockData);
    expect(component.data.message).toBe('Test Message');
  });

  it('should render the message in the view', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Message');
  });

  it('should render the link text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Click Here');
  });
});
