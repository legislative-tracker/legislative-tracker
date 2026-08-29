/**
 * Classification category for submitted feedback.
 */
export type FeedbackType = 'bug' | 'feature' | 'general';

/**
 * Payload sent when submitting anonymous feedback or issue reports.
 */
export interface FeedbackPayload {
  /** Type/category of feedback being submitted. */
  type?: FeedbackType;
  /** Summary title for the feedback submission or GitHub issue. */
  title: string;
  /** Detailed feedback message body. */
  body: string;
  /** The current page or route URL when feedback was triggered. */
  contextUrl?: string;
  /** Optional authenticated user ID submitting the feedback. */
  userId?: string;
}

/**
 * Server response after creating a feedback record or issue ticket.
 */
export interface FeedbackResponse {
  /** Indicates whether the issue was created successfully. */
  success?: boolean;
  /** GitHub issue number created by the backend trigger. */
  issueNumber: number;
  /** Web URL to the created issue on GitHub. */
  issueUrl: string;
}
