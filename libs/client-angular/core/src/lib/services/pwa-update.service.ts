import { inject, Injectable, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, Subscription } from 'rxjs';

/**
 * Service managing Angular Progressive Web App (PWA) lifecycle and service worker version updates.
 * Listens for newly deployed application builds and presents an actionable snackbar to reload and activate the update.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService implements OnDestroy {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);

  private updateSubscription?: Subscription;

  constructor() {
    this.init();
  }

  /**
   * Initializes the service worker version update listener if service workers are enabled.
   */
  init(): void {
    if (!this.swUpdate.isEnabled || this.updateSubscription) {
      return;
    }

    this.updateSubscription = this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      )
      .subscribe(() => {
        this.promptUserToUpdate();
      });
  }

  /**
   * Prompts the user with an actionable snackbar toast indicating a fresh release is ready.
   */
  protected promptUserToUpdate(): void {
    const snackBarRef = this.snackBar.open(
      'A new version is available.',
      'Reload',
      {
        duration: 0,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['pwa-update-snackbar'],
      },
    );

    snackBarRef.onAction().subscribe(() => {
      this.activateUpdateAndReload();
    });
  }

  /**
   * Activates the downloaded service worker update and reloads the browser application window.
   */
  async activateUpdateAndReload(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
    } finally {
      this.document.location?.reload();
    }
  }

  /**
   * Manually checks for available service worker updates.
   *
   * @returns Resolves to `true` if an update was found, `false` otherwise.
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }
    return this.swUpdate.checkForUpdate();
  }

  ngOnDestroy(): void {
    this.updateSubscription?.unsubscribe();
  }
}
