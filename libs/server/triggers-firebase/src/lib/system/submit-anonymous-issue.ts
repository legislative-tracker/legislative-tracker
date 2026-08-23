import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  FeedbackResponse,
  FeedbackType,
} from '@legislative-tracker/shared/models';
import { postGitHubIssue } from '@legislative-tracker/server-data-access-github';
import { dataAccessGitHubKey } from '../config';

const getLabelsForType = (type?: FeedbackType | string): string[] => {
  switch (type?.toLowerCase()) {
    case 'bug':
      return ['bug'];
    case 'feature':
      return ['enhancement'];
    case 'general':
      return ['feedback'];
    default:
      return ['feedback'];
  }
};

export const submitAnonymousIssue = onCall(
  { secrets: [dataAccessGitHubKey] },
  async (request): Promise<FeedbackResponse> => {
    const data = request.data || {};
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const body =
      typeof data.body === 'string'
        ? data.body.trim()
        : typeof data.description === 'string'
          ? data.description.trim()
          : '';
    const type = data.type as FeedbackType | undefined;

    if (!title || title.length < 4) {
      throw new HttpsError(
        'invalid-argument',
        'Issue title must be at least 4 characters long.',
      );
    }

    if (!body || body.length < 10) {
      throw new HttpsError(
        'invalid-argument',
        'Issue body must be at least 10 characters long.',
      );
    }

    let token = '';
    try {
      token = dataAccessGitHubKey.value();
    } catch {
      // In local testing/emulator edge-cases, fallback to process.env
    }

    if (!token) {
      token = process.env['DATA_ACCESS_GITHUB'] || '';
    }

    if (!token) {
      throw new HttpsError(
        'internal',
        'GitHub authentication key is not configured on the server.',
      );
    }

    const labels = getLabelsForType(type);

    try {
      const result = await postGitHubIssue({
        token,
        owner: 'legislative-tracker',
        repo: 'legislative-tracker',
        title,
        body,
        labels,
      });

      return result;
    } catch (error: any) {
      console.error('Error submitting anonymous issue to GitHub:', error);
      throw new HttpsError(
        'internal',
        error instanceof Error
          ? error.message
          : 'Failed to post issue to GitHub.',
      );
    }
  },
);
