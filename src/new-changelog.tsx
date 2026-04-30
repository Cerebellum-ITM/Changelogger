import {
  Action,
  ActionPanel,
  Detail,
  Icon,
  List,
  Toast,
  getPreferenceValues,
  open,
  showToast,
  useNavigation,
} from "@raycast/api";
import { showFailureToast, useCachedPromise } from "@raycast/utils";
import { useEffect, useMemo, useState } from "react";
import { Branch, Commit, Repo } from "./types";
import { listBranches, listCommits, listRepos } from "./api/github";
import { loadPrompt, PROMPT_PATH } from "./config/prompt";
import { DEFAULT_AI_MODEL, DEFAULT_OUTPUT_LANGUAGE, generate } from "./ai/generate";
import { insertRecord } from "./storage/history";
import { VERSION } from "./version";

interface Preferences {
  aiModel?: string;
  outputLanguage?: string;
}

function getAiModel(): string {
  const { aiModel } = getPreferenceValues<Preferences>();
  return aiModel && aiModel.length > 0 ? aiModel : DEFAULT_AI_MODEL;
}

function getOutputLanguage(): string {
  const { outputLanguage } = getPreferenceValues<Preferences>();
  return outputLanguage && outputLanguage.length > 0 ? outputLanguage : DEFAULT_OUTPUT_LANGUAGE;
}

export default function NewChangelogCommand() {
  return <RepoListView />;
}

function RepoListView() {
  const { push } = useNavigation();
  const { data, isLoading, revalidate } = useCachedPromise(listRepos, [], {
    onError: (err) => showFailureToast(err, { title: "Failed to load repositories" }),
  });

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search repositories…">
      {(data ?? []).map((repo) => (
        <List.Item
          key={repo.id}
          icon={repo.private ? Icon.Lock : Icon.Globe}
          title={repo.fullName}
          subtitle={repo.description ?? ""}
          accessories={[
            ...(repo.language ? [{ tag: repo.language }] : []),
            ...(repo.pushedAt ? [{ date: new Date(repo.pushedAt) }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Select Repository"
                icon={Icon.ArrowRight}
                onAction={() => push(<CommitListView repo={repo} />)}
              />
              <Action.OpenInBrowser url={repo.htmlUrl} />
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function CommitListView({ repo }: { repo: Repo }) {
  const { push } = useNavigation();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [branch, setBranch] = useState<string>(repo.defaultBranch);
  const { data, isLoading, revalidate } = useCachedPromise(listCommits, [repo, branch], {
    onError: (err) => showFailureToast(err, { title: "Failed to load commits" }),
  });

  const commits = data ?? [];

  function toggle(sha: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sha)) next.delete(sha);
      else next.add(sha);
      return next;
    });
  }

  const selectedCommits = useMemo(() => commits.filter((c) => selected.has(c.sha)), [commits, selected]);

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      navigationTitle={`${repo.fullName} @ ${branch} — ${selected.size} selected`}
      searchBarPlaceholder="Search commits…"
    >
      {commits.map((c) => {
        const isSelected = selected.has(c.sha);
        const detailMd = `# ${c.subject}\n\n\`${c.shortSha}\` · ${c.authorName} · ${c.date}\n\n${c.body || "_No body._"}`;
        return (
          <List.Item
            key={c.sha}
            icon={isSelected ? Icon.CheckCircle : Icon.Circle}
            title={c.subject}
            subtitle={`${c.shortSha} · ${c.authorName}`}
            detail={<List.Item.Detail markdown={detailMd} />}
            actions={
              <ActionPanel>
                <Action
                  title={isSelected ? "Deselect Commit" : "Select Commit"}
                  icon={isSelected ? Icon.Circle : Icon.CheckCircle}
                  onAction={() => toggle(c.sha)}
                  shortcut={{ modifiers: ["ctrl"], key: "a" }}
                />
                <Action
                  title={`Generate Changelog from ${selected.size} Commit${selected.size === 1 ? "" : "s"}`}
                  icon={Icon.Wand}
                  shortcut={{ modifiers: ["cmd"], key: "return" }}
                  onAction={() => {
                    if (selectedCommits.length === 0) {
                      showToast({ style: Toast.Style.Failure, title: "Select at least one commit" });
                      return;
                    }
                    push(<GenerateView repo={repo} branch={branch} commits={selectedCommits} />);
                  }}
                />
                <Action
                  title="Switch Branch"
                  icon={Icon.Switch}
                  shortcut={{ modifiers: ["cmd"], key: "b" }}
                  onAction={() =>
                    push(
                      <BranchListView
                        repo={repo}
                        currentBranch={branch}
                        onPick={(name) => {
                          setBranch(name);
                          setSelected(new Set());
                        }}
                      />,
                    )
                  }
                />
                <Action.OpenInBrowser url={c.htmlUrl} />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  onAction={revalidate}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function BranchListView({
  repo,
  currentBranch,
  onPick,
}: {
  repo: Repo;
  currentBranch: string;
  onPick: (name: string) => void;
}) {
  const { pop } = useNavigation();
  const { data, isLoading, revalidate } = useCachedPromise(listBranches, [repo], {
    onError: (err) => showFailureToast(err, { title: "Failed to load branches" }),
  });

  return (
    <List isLoading={isLoading} navigationTitle={`Branches — ${repo.fullName}`} searchBarPlaceholder="Search branches…">
      {(data ?? []).map((b: Branch) => {
        const isCurrent = b.name === currentBranch;
        return (
          <List.Item
            key={b.name}
            icon={isCurrent ? Icon.CheckCircle : Icon.Circle}
            title={b.name}
            subtitle={b.sha.slice(0, 7)}
            accessories={[...(b.isDefault ? [{ tag: "default" }] : []), ...(isCurrent ? [{ tag: "current" }] : [])]}
            actions={
              <ActionPanel>
                <Action
                  title="Use This Branch"
                  icon={Icon.ArrowRight}
                  onAction={() => {
                    onPick(b.name);
                    pop();
                  }}
                />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  onAction={revalidate}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function GenerateView({ repo, branch, commits }: { repo: Repo; branch: string; commits: Commit[] }) {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const model = getAiModel();
  const outputLanguage = getOutputLanguage();

  useEffect(() => {
    let cancelled = false;
    setOutput("");
    setIsLoading(true);
    setError(null);
    setSaved(false);
    (async () => {
      try {
        const loadedPrompt = await loadPrompt();
        if (cancelled) return;
        setPrompt(loadedPrompt);
        const handle = generate({ prompt: loadedPrompt, repoFullName: repo.fullName, commits, model, outputLanguage });
        handle.onData((chunk) => {
          if (cancelled) return;
          setOutput((prev) => prev + chunk);
        });
        const final = await handle.promise;
        if (cancelled) return;
        setOutput(final);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
        showFailureToast(err, { title: "AI generation failed" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo.fullName, commits, runKey, model, outputLanguage]);

  const markdown = error ? `# Error\n\n\`\`\`\n${error}\n\`\`\`` : output || "_Waiting for the model…_";

  async function save() {
    if (!prompt || !output) return;
    try {
      await insertRecord({
        repoFullName: repo.fullName,
        branch,
        commitShas: commits.map((c) => c.sha),
        promptUsed: prompt,
        output,
        model,
      });
      setSaved(true);
      await showToast({ style: Toast.Style.Success, title: "Saved to history" });
    } catch (err) {
      await showFailureToast(err, { title: "Failed to save record" });
    }
  }

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={`Changelog — ${repo.fullName}`}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Repository" text={repo.fullName} />
          <Detail.Metadata.Label title="Branch" text={branch} />
          <Detail.Metadata.Label title="Commits" text={String(commits.length)} />
          <Detail.Metadata.Label title="AI Model" text={model} />
          <Detail.Metadata.Label title="Output Language" text={outputLanguage} />
          <Detail.Metadata.Label title="Extension Version" text={VERSION} />
          <Detail.Metadata.Label title="Saved" text={saved ? "Yes" : "No"} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action
            title="Save to History"
            icon={Icon.SaveDocument}
            onAction={save}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
          />
          <Action.CopyToClipboard title="Copy Output" content={output} />
          <Action
            title="Regenerate"
            icon={Icon.ArrowClockwise}
            onAction={() => setRunKey((k) => k + 1)}
            shortcut={{ modifiers: ["cmd"], key: "g" }}
          />
          <Action
            title="Open Prompt.md in Editor"
            icon={Icon.Pencil}
            onAction={() => open(PROMPT_PATH)}
            shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
          />
        </ActionPanel>
      }
    />
  );
}
