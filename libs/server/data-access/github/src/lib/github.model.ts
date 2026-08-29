/**
 * Configuration options for creating a GitHub issue via REST API.
 */
export interface PostGitHubIssueOptions {
  /** GitHub Personal Access Token with repository issues write permission. */
  token: string;
  /** Repository owner / organization name (defaults to 'legislative-tracker'). */
  owner?: string;
  /** Repository name (defaults to 'legislative-tracker'). */
  repo?: string;
  /** Issue title text. */
  title: string;
  /** Markdown body content for the issue. */
  body: string;
  /** Optional GitHub labels to attach to the created issue. */
  labels?: string[];
}

/**
 * Expected subset of fields returned by the GitHub REST API upon issue creation.
 */
export interface GitHubIssueApiResponse {
  /** Unique database ID of the issue. */
  id: number;
  /** Issue sequence number within repository (e.g. 42). */
  number: number;
  /** Web URL for viewing the issue on GitHub. */
  html_url: string;
  /** Issue title. */
  title: string;
  /** Issue state ('open', 'closed'). */
  state: string;
  /** Additional raw GitHub API response properties. */
  [key: string]: unknown;
}
