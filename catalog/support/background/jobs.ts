import type {
  NativeBackgroundJobs,
  BackgroundJobSnapshot,
} from "@lapis-notes/api/background-jobs";
export function backgroundJobsFixture(fail = false): NativeBackgroundJobs {
  const snapshot: BackgroundJobSnapshot = {
    revision: 0,
    runnerId: "89b52d9a-2fe1-43f1-877f-09581c5533c6",
    vaultId: "6c9a720b-21d6-46fd-8326-5640693cd1fd",
    nativeNotificationsAvailable: true,
    trusted: true,
    safeMode: false,
    transfer: null,
    jobs: [
      {
        pluginId: "tasks",
        fingerprint: "a".repeat(64),
        configuration: null,
        phase: "paused",
        runs: [],
        nextRunAt: null,
        unavailableReason: null,
        descriptor: {
          id: "overdue-digest",
          title: "Overdue task digest",
          description: "Show a daily count of saved tasks in Review.",
          entry: "jobs/overdue-digest.js",
          schedule: { kind: "daily", hour: 9, minute: 0, timezone: "UTC" },
          permissions: {
            metadataRead: true,
            frontmatterRead: false,
            notifications: true,
            frontmatterFields: [],
          },
        },
      },
    ],
  };
  return {
    async call(command) {
      if (command.kind !== "list") {
        if (fail && command.kind === "configure")
          throw new Error(
            "The native runner is unavailable. Refresh status before retrying.",
          );
        if (command.kind === "fence") {
          snapshot.trusted = command.trusted;
          snapshot.safeMode = command.safeMode;
        }
        if (command.kind === "configure") {
          snapshot.jobs[0]!.configuration = command.configuration;
          snapshot.jobs[0]!.phase = command.configuration.enabled
            ? "ready"
            : "paused";
        }
        if (command.kind === "pause") {
          snapshot.jobs[0]!.configuration!.enabled = false;
          snapshot.jobs[0]!.phase = "paused";
        }
        snapshot.revision++;
      }
      return JSON.parse(JSON.stringify(snapshot)) as BackgroundJobSnapshot;
    },
  };
}
