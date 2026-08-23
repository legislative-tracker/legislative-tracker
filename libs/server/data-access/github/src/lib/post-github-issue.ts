import { FeedbackResponse } from '@legislative-tracker/shared/models';
import { PostGitHubIssueOptions, GitHubIssueApiResponse } from './model';

const DEFAULT_OWNER = 'legislative-tracker';
const DEFAULT_REPO = 'legislative-tracker';

export const postGitHubIssue = async (
  options: PostGitHubIssueOptions,
): Promise<FeedbackResponse> => {
  const {
    token,
    owner = DEFAULT_OWNER,
    repo = DEFAULT_REPO,
    title,
    body,
    labels,
  } = options;

  if (!token) {
    throw new Error('GitHub access token is required.');
  }
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Issue title is required.');
  }
  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    throw new Error('Issue body is required.');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/issues`;

  const payload: { title: string; body: string; labels?: string[] } = {
    title: title.trim(),
    body: body.trim(),
  };

  if (labels && labels.length > 0) {
    payload.labels = labels;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token.trim()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'legislative-tracker-firebase',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail =
        errorJson.message ||
        (Array.isArray(errorJson.errors)
          ? JSON.stringify(errorJson.errors)
          : '');
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(
      `GitHub API request failed: ${response.status} ${response.statusText}${
        errorDetail ? ` - ${errorDetail}` : ''
      }`,
    );
  }

  const data = (await response.json()) as GitHubIssueApiResponse;

  if (!data || typeof data.number !== 'number' || !data.html_url) {
    throw new Error('Invalid response received from GitHub API.');
  }

  return {
    success: true,
    issueNumber: data.number,
    issueUrl: data.html_url,
  };
};
