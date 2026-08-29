import { Injectable } from '@angular/core';
import {
  FeedbackResponse,
  FeedbackType,
} from '@legislative-tracker/shared/models';

/**
 * Abstract service for submitting user feedback, bug reports, and feature requests.
 */
@Injectable()
export abstract class FeedbackService {
  /**
   * Submits user feedback or creates an automated issue tracking item.
   *
   * @param title - Summary title of the feedback.
   * @param body - Detailed description of the feedback or bug report.
   * @param type - Optional feedback category ('bug', 'feature', 'general').
   * @returns Resolves with FeedbackResponse including the created issue URL.
   */
  abstract sendFeedback(
    title: string,
    body: string,
    type?: FeedbackType,
  ): Promise<FeedbackResponse>;
}
