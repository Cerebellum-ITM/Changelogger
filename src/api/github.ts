import { Octokit } from "@octokit/rest";
import { getPreferenceValues } from "@raycast/api";
import { Branch, Commit, Repo } from "../types";

interface Preferences {
  githubToken: string;
  commitsPerPage?: string;
}

let cachedClient: Octokit | null = null;

export function getOctokit(): Octokit {
  if (cachedClient) return cachedClient;
  const { githubToken } = getPreferenceValues<Preferences>();
  cachedClient = new Octokit({ auth: githubToken });
  return cachedClient;
}

export function getCommitsPerPage(): number {
  const { commitsPerPage } = getPreferenceValues<Preferences>();
  const parsed = Number(commitsPerPage);
  if (!Number.isFinite(parsed) || parsed <= 0) return 30;
  return Math.min(100, Math.floor(parsed));
}

export async function listRepos(): Promise<Repo[]> {
  const octokit = getOctokit();
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "pushed",
    per_page: 100,
  });
  return data.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    owner: r.owner.login,
    name: r.name,
    description: r.description,
    language: r.language,
    defaultBranch: r.default_branch,
    htmlUrl: r.html_url,
    pushedAt: r.pushed_at,
    private: r.private,
  }));
}

export async function listBranches(repo: Repo): Promise<Branch[]> {
  const octokit = getOctokit();
  const branches = await octokit.paginate(octokit.repos.listBranches, {
    owner: repo.owner,
    repo: repo.name,
    per_page: 100,
  });
  return branches
    .map((b) => ({
      name: b.name,
      sha: b.commit.sha,
      isDefault: b.name === repo.defaultBranch,
    }))
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export async function listCommits(repo: Repo, branch?: string): Promise<Commit[]> {
  const octokit = getOctokit();
  const { data } = await octokit.repos.listCommits({
    owner: repo.owner,
    repo: repo.name,
    sha: branch ?? repo.defaultBranch,
    per_page: getCommitsPerPage(),
  });
  return data.map((c) => {
    const message = c.commit.message ?? "";
    const newlineIdx = message.indexOf("\n");
    const subject = newlineIdx === -1 ? message : message.slice(0, newlineIdx);
    const body = newlineIdx === -1 ? "" : message.slice(newlineIdx + 1).trim();
    return {
      sha: c.sha,
      shortSha: c.sha.slice(0, 7),
      subject,
      body,
      authorName: c.commit.author?.name ?? "unknown",
      authorEmail: c.commit.author?.email ?? "",
      date: c.commit.author?.date ?? "",
      htmlUrl: c.html_url,
    };
  });
}
