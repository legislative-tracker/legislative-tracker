export interface PostGitHubIssueOptions {
  token: string;
  owner?: string;
  repo?: string;
  title: string;
  body: string;
  labels?: string[];
}

export interface GitHubIssueApiResponse {
  id: number;
  number: number;
  html_url: string;
  title: string;
  state: string;
  [key: string]: unknown;
}
