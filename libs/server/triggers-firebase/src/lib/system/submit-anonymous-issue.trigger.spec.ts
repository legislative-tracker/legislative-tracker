import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitAnonymousIssue } from './submit-anonymous-issue.trigger';
import { postGitHubIssue } from '@legislative-tracker/server-data-access-github';
import { dataAccessGitHubKey } from '../firebase.config';

vi.mock('../firebase.config', () => ({
  dataAccessGitHubKey: {
    value: vi.fn().mockReturnValue('mock-github-token'),
  },
}));

vi.mock('@legislative-tracker/server-data-access-github', () => ({
  postGitHubIssue: vi.fn(),
}));

describe('submitAnonymousIssue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dataAccessGitHubKey.value).mockReturnValue('mock-github-token');
  });

  it('should throw invalid-argument if title is less than 4 characters', async () => {
    await expect(
      (submitAnonymousIssue as any).run({
        data: { title: 'abc', body: 'Valid description of at least 10 chars' },
      }),
    ).rejects.toThrow('Issue title must be at least 4 characters long.');
  });

  it('should throw invalid-argument if body is less than 10 characters', async () => {
    await expect(
      (submitAnonymousIssue as any).run({
        data: { title: 'Valid Title', body: 'Too short' },
      }),
    ).rejects.toThrow('Issue body must be at least 10 characters long.');
  });

  it('should throw internal error if GitHub token is missing', async () => {
    vi.mocked(dataAccessGitHubKey.value).mockReturnValue('');

    await expect(
      (submitAnonymousIssue as any).run({
        data: {
          title: 'Valid Title',
          body: 'Valid description of at least 10 chars',
        },
      }),
    ).rejects.toThrow(
      'GitHub authentication key is not configured on the server.',
    );
  });

  it('should submit bug report with bug label', async () => {
    const mockResult = {
      success: true,
      issueNumber: 101,
      issueUrl:
        'https://github.com/legislative-tracker/legislative-tracker/issues/101',
    };
    vi.mocked(postGitHubIssue).mockResolvedValue(mockResult);

    const result = await (submitAnonymousIssue as any).run({
      data: {
        title: 'Crash on page load',
        body: 'The app crashes when clicking the button on page load.',
        type: 'bug',
      },
    });

    expect(postGitHubIssue).toHaveBeenCalledWith({
      token: 'mock-github-token',
      owner: 'legislative-tracker',
      repo: 'legislative-tracker',
      title: 'Crash on page load',
      body: 'The app crashes when clicking the button on page load.',
      labels: ['bug'],
    });
    expect(result).toEqual(mockResult);
  });

  it('should submit feature request with enhancement label', async () => {
    const mockResult = {
      success: true,
      issueNumber: 102,
      issueUrl:
        'https://github.com/legislative-tracker/legislative-tracker/issues/102',
    };
    vi.mocked(postGitHubIssue).mockResolvedValue(mockResult);

    const result = await (submitAnonymousIssue as any).run({
      data: {
        title: 'Add export to CSV',
        description: 'It would be great to export bill data as CSV.',
        type: 'feature',
      },
    });

    expect(postGitHubIssue).toHaveBeenCalledWith({
      token: 'mock-github-token',
      owner: 'legislative-tracker',
      repo: 'legislative-tracker',
      title: 'Add export to CSV',
      body: 'It would be great to export bill data as CSV.',
      labels: ['enhancement'],
    });
    expect(result).toEqual(mockResult);
  });

  it('should handle errors from postGitHubIssue and throw HttpsError', async () => {
    vi.mocked(postGitHubIssue).mockRejectedValue(
      new Error('GitHub 500 server error'),
    );

    await expect(
      (submitAnonymousIssue as any).run({
        data: {
          title: 'Valid Title',
          body: 'Valid description of at least 10 chars',
        },
      }),
    ).rejects.toThrow('GitHub 500 server error');
  });
});
