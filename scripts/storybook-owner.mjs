import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { readRecord, writeRecord } from "./storybook-files.mjs";
import { sameProcess } from "./storybook-process.mjs";

export const previewArgs = (port) => [
  "dev",
  "--host",
  "127.0.0.1",
  "--port",
  String(port),
  "--no-open",
  "--disable-telemetry",
  "--ci",
  "--exact-port",
];
export class PreviewOwner {
  constructor(root, port, path, ports) {
    Object.assign(this, { root, port, path, ports });
  }
  async record() {
    const record = await readRecord(this.path);
    if (
      record &&
      (record.kind !== "lapis-storybook/1" ||
        record.port !== this.port ||
        !Number.isSafeInteger(record.pid) ||
        record.pid <= 0 ||
        typeof record.token !== "string" ||
        typeof record.entry !== "string" ||
        typeof record.executable !== "string")
    )
      throw new Error("Invalid preview ownership record");
    return record;
  }
  owns(record, observed) {
    return (
      sameProcess(record, observed) &&
      observed.cwd === this.root &&
      observed.uid === process.getuid() &&
      observed.command ===
        [record.executable, record.entry, ...previewArgs(this.port)].join(" ")
    );
  }
  async status() {
    const record = await this.record(),
      bound = await this.ports.listeners(this.port);
    const observed = record ? await this.ports.inspect(record.pid) : undefined;
    const owned = this.owns(record, observed);
    const state = bound.length
      ? owned && bound.every((pid) => pid === record.pid)
        ? (await this.ports.ready(this.port))
          ? "running"
          : "unready"
        : "foreign"
      : owned
        ? "starting"
        : "stopped";
    return {
      state,
      port: this.port,
      pid: owned ? record.pid : undefined,
      listeners: bound,
      url: `http://127.0.0.1:${this.port}/`,
      record,
    };
  }
  claim(observed, entry) {
    const record = {
      ...observed,
      entry,
      executable: process.execPath,
      token: randomUUID(),
      kind: "lapis-storybook/1",
      port: this.port,
    };
    if (!this.owns(record, observed))
      throw new Error("Cannot establish started preview ownership");
    return record;
  }
  save(record) {
    return writeRecord(this.path, record);
  }
  async erase(record) {
    if ((await this.record())?.token === record.token) await unlink(this.path);
  }
  async halt(record) {
    const observed = await this.ports.inspect(record.pid);
    if (!this.owns(record, observed))
      throw new Error("Preview process identity changed; no signal sent");
    try {
      this.ports.signal(record.pid);
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
    const deadline = performance.now() + 10_000;
    for (let n = 0; n < 100 && performance.now() < deadline; n++) {
      let observed;
      try {
        observed = await this.ports.inspect(record.pid);
      } catch (error) {
        if (error.code !== "PREVIEW_IDENTITY_UNAVAILABLE") throw error;
        await this.ports.pause(100);
        continue;
      }
      if (
        !observed ||
        observed.started !== record.started ||
        observed.uid !== record.uid
      ) {
        await this.erase(record);
        return;
      }
      if (!this.owns(record, observed))
        throw new Error("Preview identity changed; ownership record retained");
      await this.ports.pause(100);
    }
    throw new Error(
      "Preview has not stopped; its ownership record is retained",
    );
  }
  async stop() {
    const current = await this.status();
    if (current.state === "foreign")
      throw new Error(
        `Port ${this.port} has an unowned listener; no process was stopped`,
      );
    if (current.pid) await this.halt(current.record);
    else if (current.record) await this.erase(current.record);
    return this.status();
  }
}
