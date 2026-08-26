export type FeedbackType = 'bug' | 'feature' | 'general';

export interface FeedbackPayload {
  type?: FeedbackType;
  title: string;
  body: string;
  contextUrl?: string;
  userId?: string;
}

export interface FeedbackResponse {
  success?: boolean;
  issueNumber: number;
  issueUrl: string;
}
