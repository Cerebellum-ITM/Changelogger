export interface Repo {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  defaultBranch: string;
  htmlUrl: string;
  pushedAt: string | null;
  private: boolean;
}

export interface Commit {
  sha: string;
  shortSha: string;
  subject: string;
  body: string;
  authorName: string;
  authorEmail: string;
  date: string;
  htmlUrl: string;
}

export interface ChangelogRecord {
  id: number;
  createdAt: string;
  repoFullName: string;
  commitShas: string[];
  promptUsed: string;
  output: string;
  model: string | null;
  extVersion: string;
}
