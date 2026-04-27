import { Action, ActionPanel, Alert, Icon, List, Toast, confirmAlert, showToast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useEffect, useState } from "react";
import { ChangelogRecord } from "./types";
import { deleteRecord, listRecords } from "./storage/history";
import { VERSION } from "./version";

export default function HistoryCommand() {
  const [records, setRecords] = useState<ChangelogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function refresh() {
    try {
      setRecords(listRecords());
    } catch (err) {
      showFailureToast(err, { title: "Failed to read history" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onDelete(record: ChangelogRecord) {
    const confirmed = await confirmAlert({
      title: "Delete this record?",
      message: `${record.repoFullName} · ${new Date(record.createdAt).toLocaleString()}`,
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    try {
      deleteRecord(record.id);
      refresh();
      await showToast({ style: Toast.Style.Success, title: "Deleted" });
    } catch (err) {
      await showFailureToast(err, { title: "Delete failed" });
    }
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      navigationTitle={`Changelog History (v${VERSION})`}
      searchBarPlaceholder="Search history…"
    >
      {records.length === 0 && !isLoading ? (
        <List.EmptyView title="No saved changelogs yet" description="Generate one from the New Changelog command." />
      ) : (
        records.map((r) => {
          const date = new Date(r.createdAt);
          const detailMd = `# ${r.repoFullName}\n\n_${date.toLocaleString()} · ${r.commitShas.length} commit${r.commitShas.length === 1 ? "" : "s"} · ext v${r.extVersion}_\n\n---\n\n${r.output}`;
          return (
            <List.Item
              key={r.id}
              icon={Icon.Document}
              title={r.repoFullName}
              subtitle={`${r.commitShas.length} commit${r.commitShas.length === 1 ? "" : "s"}`}
              accessories={[{ date }]}
              detail={<List.Item.Detail markdown={detailMd} />}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title="Copy Output" content={r.output} />
                  <Action.CopyToClipboard
                    title="Copy Prompt Snapshot"
                    content={r.promptUsed}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
                  />
                  <Action
                    title="Delete Record"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    onAction={() => onDelete(r)}
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                  />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
