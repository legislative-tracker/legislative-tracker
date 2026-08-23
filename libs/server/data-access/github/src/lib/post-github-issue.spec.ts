import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postGitHubIssue } from './post-github-issue';

describe('postGitHubIssue', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should throw an error when token is missing', async () => {
    await expect(
      postGitHubIssue({
        token: '',
        title: 'Test Issue',
        body: 'Test Body',
      }),
    ).rejects.toThrow('GitHub access token is required.');
  });

  it('should throw an error when title is empty', async () => {
    await expect(
      postGitHubIssue({
        token: 'ghp_secret',
        title: '   ',
        body: 'Test Body',
      }),
    ).rejects.toThrow('Issue title is required.');
  });

  it('should throw an error when body is empty', async () => {
    await expect(
      postGitHubIssue({
        token: 'ghp_secret',
        title: 'Test Title',
        body: '',
      }),
    ).rejects.toThrow('Issue body is required.');
  });

  it('should send POST request to GitHub API with correct headers and payload', async () => {
    const mockApiResponse = {
      id: 987654,
      number: 42,
      html_url:
        'https://github.com/legislative-tracker/legislative-tracker/issues/42',
      title: 'Fix something',
      state: 'open',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      json: vi.fn().mockResolvedValue(mockApiResponse),
    });
    globalThis.fetch = mockFetch;

    const result = await postGitHubIssue({
      token: 'ghp_test_token_123',
      title: 'Fix something',
      body: 'Here is the issue description',
      labels: ['bug', 'help wanted'],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/legislative-tracker/legislative-tracker/issues',
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer ghp_test_token_123',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'legislative-tracker-firebase',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Fix something',
          body: 'Here is the issue description',
          labels: ['bug', 'help wanted'],
        }),
      },
    );

    expect(result).toEqual({
      success: true,
      issueNumber: 42,
      issueUrl:
        'https://github.com/legislative-tracker/legislative-tracker/issues/42',
    });
  });

  it('should allow custom owner and repo parameters', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({
        number: 10,
        html_url: 'https://github.com/custom-owner/custom-repo/issues/10',
      }),
    });
    globalThis.fetch = mockFetch;

    const result = await postGitHubIssue({
      token: 'ghp_token',
      owner: 'custom-owner',
      repo: 'custom-repo',
      title: 'Custom Title',
      body: 'Custom Body',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/custom-owner/custom-repo/issues',
      expect.anything(),
    );
    expect(result.issueNumber).toBe(10);
    expect(result.issueUrl).toBe(
      'https://github.com/custom-owner/custom-repo/issues/10',
    );
  });

  it('should handle API errors with detailed error message from response body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: vi.fn().mockResolvedValue({
        message: 'Bad credentials',
      }),
    });
    globalThis.fetch = mockFetch;

    await expect(
      postGitHubIssue({
        token: 'invalid_token',
        title: 'Title',
        body: 'Body',
      }),
    ).rejects.toThrow(
      'GitHub API request failed: 401 Unauthorized - Bad credentials',
    );
  });

  it('should throw an error if API response lacks number or html_url', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    });
    globalThis.fetch = mockFetch;

    await expect(
      postGitHubIssue({
        token: 'ghp_token',
        title: 'Title',
        body: 'Body',
      }),
    ).rejects.toThrow('Invalid response received from GitHub API.');
  });
});
