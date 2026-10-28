import { hostname } from "node:os";
import { label } from "./model.mjs";
import { docker, dockerOutput } from "./docker.mjs";

const defaults = { docker, output: dockerOutput };
const ids = (text) => text.split("\n").filter(Boolean);
export function completed(state) {
  return Boolean(
    state &&
      ["exited", "dead"].includes(state.Status) &&
      state.Running === false &&
      state.Paused === false &&
      state.Restarting === false,
  );
}
export function containerIdentity(config, id, kind, overrides = {}) {
  const io = { ...defaults, ...overrides };
  const record = JSON.parse(
    io.output(config, ["inspect", id, "--format", "{{json .}}"]),
  );
  if (
    !/^[a-f0-9]{64}$/.test(record.Id ?? "") ||
    (/^[a-f0-9]{64}$/.test(id) && id !== record.Id) ||
    record.Config?.Labels?.[label] !== kind
  )
    throw Error("Refusing an unowned validation container");
  return record;
}
function containers(config, kind, io, workspace) {
  return ids(
    io.output(config, [
      "ps",
      "-aq",
      "--no-trunc",
      "--filter",
      `label=${label}=${kind}`,
      ...(workspace
        ? ["--filter", `label=${label}.workspace=${workspace}`]
        : []),
    ]),
  );
}
function settled(config, workspace, io) {
  if (!/^[a-z0-9-]{1,64}$/.test(workspace ?? "")) return false;
  try {
    return containers(config, "run", io, workspace).every((id) => {
      const record = containerIdentity(config, id, "run", io);
      return (
        record.Config.Labels[`${label}.workspace`] === workspace &&
        completed(record.State)
      );
    });
  } catch {
    // An unreachable worker is not evidence that it stopped using the caches.
    return false;
  }
}
export async function releaseLease(config, id, overrides = {}) {
  const io = { ...defaults, ...overrides };
  let lease;
  try {
    lease = containerIdentity(config, id, "lease", io);
  } catch {
    return false;
  }
  if (!settled(config, lease.Config.Labels[`${label}.workspace`], io))
    return false;
  await io.docker(config, ["rm", lease.Id]);
  return true;
}
/**
 * Only a same-host ESRCH proves the recorded owner absent. A live owner, a
 * foreign host, or a missing/malformed record stays unverifiable and blocks
 * acquisition, exactly as the preview-maintenance lease owner check does.
 */
function ownerAbsent(record) {
  const pid = Number(record.Config.Labels[`${label}.owner-pid`]);
  if (
    !Number.isSafeInteger(pid) ||
    pid <= 0 ||
    record.Config.Labels[`${label}.owner-host`] !== hostname()
  )
    return false;
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    return error.code === "ESRCH";
  }
}
async function acquireLease(config, workspace, name, image, io) {
  const create = () =>
    io.output(config, [
      "create",
      "--name",
      name,
      "--label",
      `${label}=lease`,
      "--label",
      `${label}.workspace=${workspace}`,
      "--label",
      `${label}.owner-pid=${process.pid}`,
      "--label",
      `${label}.owner-host=${hostname()}`,
      image,
      "true",
    ]);
  try {
    return create();
  } catch (error) {
    let held;
    try {
      held = containerIdentity(config, name, "lease", io);
    } catch {
      // A missing or unowned lease name keeps the original create failure.
      throw error;
    }
    if (
      held.Config.Labels[`${label}.workspace`] !== workspace ||
      !ownerAbsent(held)
    )
      throw Error(
        `Validation lease ${name} is held by a live or unverifiable owner; if no run is active, an owner releases it with: pnpm validation -- clean --apply`,
      );
    if (!(await releaseLease(config, held.Id, io)))
      throw Error(
        `Stale validation lease ${name} is retained; worker state is active, prepared or unknown.`,
      );
    io.warn(`Released stale lease ${name}; its recorded owner is absent.`);
    return create();
  }
}
export async function withWorkspaceLease(
  config,
  workspace,
  image,
  operation,
  overrides = {},
) {
  const io = { ...defaults, warn: console.warn, ...overrides };
  const name = `lapis-desktop-validation-lease-${workspace}`;
  const id = await acquireLease(config, workspace, name, image, io);
  try {
    return await operation();
  } finally {
    try {
      if (!(await releaseLease(config, id, io)))
        io.warn(
          `Lease retained: ${name}; worker state is active, prepared or unknown.`,
        );
    } catch (error) {
      io.warn(`Lease cleanup pending: ${name}: ${error.message}`);
    }
  }
}
function stopped(config, id, io) {
  try {
    const record = containerIdentity(config, id, "run", io);
    return completed(record.State) ? record : undefined;
  } catch {
    return undefined;
  }
}
export async function cleanOwned(config, args, overrides = {}) {
  const io = { ...defaults, ...overrides };
  const eligible = containers(config, "run", io).filter((id) =>
    stopped(config, id, io),
  );
  const leases = containers(config, "lease", io);
  const volumes = ids(
    io.output(config, [
      "volume",
      "ls",
      "-q",
      "--filter",
      `label=${label}=cache`,
    ]),
  );
  const result = {
    stoppedContainers: eligible,
    leaseContainers: leases,
    cacheVolumes: volumes,
    apply: args.includes("--apply"),
  };
  if (result.apply) {
    for (const id of eligible) {
      // Preview is not a continuing grant: recheck before collecting/removing.
      const record = stopped(config, id, io);
      if (!record) continue;
      await io.collect(config, record.Id);
      if (stopped(config, record.Id, io))
        await io.docker(config, ["rm", record.Id]);
    }
    for (const id of leases) await releaseLease(config, id, io);
    if (args.includes("--caches"))
      for (const volume of volumes)
        await io.docker(config, ["volume", "rm", volume]);
  }
  return result;
}
