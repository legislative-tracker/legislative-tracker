import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import {
  SwUpdate,
  VersionEvent,
  VersionReadyEvent,
} from '@angular/service-worker';
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
  let service: PwaUpdateService;
  let versionUpdates$: Subject<VersionEvent>;
  let mockSwUpdate: {
    isEnabled: boolean;
    versionUpdates: Subject<VersionEvent>;
    activateUpdate: ReturnType<typeof vi.fn>;
    checkForUpdate: ReturnType<typeof vi.fn>;
  };
  let onActionSubject: Subject<void>;
  let mockSnackBarRef: Partial<MatSnackBarRef<TextOnlySnackBar>>;
  let mockSnackBar: {
    open: ReturnType<typeof vi.fn>;
  };
  let mockDocument: {
    location: {
      reload: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    versionUpdates$ = new Subject<VersionEvent>();
    onActionSubject = new Subject<void>();

    mockSwUpdate = {
      isEnabled: true,
      versionUpdates: versionUpdates$,
      activateUpdate: vi.fn().mockResolvedValue(true),
      checkForUpdate: vi.fn().mockResolvedValue(true),
    };

    mockSnackBarRef = {
      onAction: vi.fn().mockReturnValue(onActionSubject.asObservable()),
      dismiss: vi.fn(),
    };

    mockSnackBar = {
      open: vi
        .fn()
        .mockReturnValue(mockSnackBarRef as MatSnackBarRef<TextOnlySnackBar>),
    };

    mockDocument = {
      location: {
        reload: vi.fn(),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    service = TestBed.inject(PwaUpdateService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created and initialize version update listener', () => {
    expect(service).toBeTruthy();
    expect(mockSnackBar.open).not.toHaveBeenCalled();
  });

  it('should not subscribe or open snackbar if SwUpdate is disabled', () => {
    TestBed.resetTestingModule();
    mockSwUpdate.isEnabled = false;
    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });
    const disabledService = TestBed.inject(PwaUpdateService);
    expect(disabledService).toBeTruthy();
    expect(mockSnackBar.open).not.toHaveBeenCalled();
  });

  it('should display snackbar when VERSION_READY event is emitted', () => {
    const readyEvent: VersionReadyEvent = {
      type: 'VERSION_READY',
      currentVersion: { hash: 'v1' },
      latestVersion: { hash: 'v2' },
    };

    versionUpdates$.next(readyEvent);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'A new version is available.',
      'Reload',
      expect.objectContaining({
        duration: 0,
        panelClass: ['pwa-update-snackbar'],
      }),
    );
  });

  it('should ignore non-VERSION_READY update events', () => {
    versionUpdates$.next({
      type: 'VERSION_DETECTED',
      version: { hash: 'v2' },
    });

    versionUpdates$.next({
      type: 'NO_NEW_VERSION_DETECTED',
      version: { hash: 'v1' },
    });

    expect(mockSnackBar.open).not.toHaveBeenCalled();
  });

  it('should activate update and reload document when snackbar action is triggered', async () => {
    const readyEvent: VersionReadyEvent = {
      type: 'VERSION_READY',
      currentVersion: { hash: 'v1' },
      latestVersion: { hash: 'v2' },
    };

    versionUpdates$.next(readyEvent);

    // Trigger snackbar action (user clicks "Reload")
    onActionSubject.next();

    // Wait for microtask resolution
    await Promise.resolve();

    expect(mockSwUpdate.activateUpdate).toHaveBeenCalled();
    expect(mockDocument.location.reload).toHaveBeenCalled();
  });

  it('should delegate checkForUpdate when service worker is enabled', async () => {
    const result = await service.checkForUpdate();
    expect(result).toBe(true);
    expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
  });

  it('should return false for checkForUpdate when service worker is disabled', async () => {
    mockSwUpdate.isEnabled = false;
    const result = await service.checkForUpdate();
    expect(result).toBe(false);
  });
});
