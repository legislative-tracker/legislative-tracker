import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AppErrorHandler } from './app-error-handler';

describe('AppErrorHandler', () => {
  let errorHandler: AppErrorHandler;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSnackBar = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AppErrorHandler,
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    errorHandler = TestBed.inject(AppErrorHandler);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(errorHandler).toBeTruthy();
  });

  it('should log uncaught errors to console.error and open error snackbar', () => {
    const error = new Error('Test runtime failure');
    errorHandler.handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[AppErrorHandler] Uncaught application error:',
      error,
    );
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'An unexpected error occurred. Please refresh or try again.',
      'Dismiss',
      {
        duration: 5000,
        panelClass: ['error-snackbar'],
      },
    );
  });

  it('should throttle snackbar notifications for rapid successive errors', () => {
    const error1 = new Error('First crash');
    const error2 = new Error('Second crash');

    errorHandler.handleError(error1);
    errorHandler.handleError(error2);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    expect(mockSnackBar.open).toHaveBeenCalledTimes(1);
  });

  it('should allow notification again after throttle duration elapses', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(now)
      .mockReturnValueOnce(now + 3500);

    errorHandler.handleError(new Error('First crash'));
    errorHandler.handleError(new Error('Second crash after timeout'));

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    expect(mockSnackBar.open).toHaveBeenCalledTimes(2);
  });

  it('should run snackbar inside NgZone when NgZone is available', () => {
    const ngZone = TestBed.inject(NgZone);
    const runSpy = vi.spyOn(ngZone, 'run');

    errorHandler.handleError(new Error('Zone error'));

    expect(runSpy).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should handle missing MatSnackBar gracefully without crashing', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AppErrorHandler],
    });

    const handlerWithoutSnackBar = TestBed.inject(AppErrorHandler);
    expect(() => {
      handlerWithoutSnackBar.handleError(new Error('No snackbar provider'));
    }).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[AppErrorHandler] Uncaught application error:',
      expect.any(Error),
    );
  });
});
