import {
  ErrorHandler,
  Injectable,
  Injector,
  NgZone,
  inject,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Global Angular error handler intercepting uncaught runtime exceptions and unhandled promise rejections.
 * Logs diagnostic details and presents an informative, throttled snackbar notification to the user
 * to prevent silent white-screen crashes.
 */
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  private lastNotificationTime = 0;
  private readonly throttleMs = 3000;

  /**
   * Intercepts and processes uncaught application errors.
   *
   * @param error - The uncaught error or promise rejection reason.
   */
  handleError(error: unknown): void {
    // Log the error to console for debugging and monitoring
    console.error('[AppErrorHandler] Uncaught application error:', error);

    const now = Date.now();
    if (now - this.lastNotificationTime < this.throttleMs) {
      return;
    }

    try {
      const snackBar = this.injector.get(MatSnackBar, null);
      const ngZone = this.injector.get(NgZone, null);

      if (snackBar) {
        this.lastNotificationTime = now;
        const showToast = () => {
          snackBar.open(
            'An unexpected error occurred. Please refresh or try again.',
            'Dismiss',
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
            },
          );
        };

        if (ngZone) {
          ngZone.run(showToast);
        } else {
          showToast();
        }
      }
    } catch {
      // Fallback silently if injector or Material snackbar cannot be instantiated during early startup error
    }
  }
}
