import { test } from "node:test";
// SSH fixture adapted from lapis-server c32b5ae (Apache-2.0).
import { spawn, execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  appendFileSync,
  unlinkSync,
} from "node:fs";
import { tmpdir, homedir, userInfo } from "node:os";
import { join } from "node:path";
import { createServer, connect } from "node:net";
import assert from "node:assert/strict";
import { nativeSession } from "./native-session.mjs";
import { jj, success, select, admit } from "./repository-driver.mjs";

test(
  "cold Desktop uses a host SSH agent for one reviewed branch without changing dirty files",
  { timeout: 120000 },
  async () => {
    assert.equal(
      process.env.LAPIS_DESKTOP_REMOTES_SSH,
      "1",
      "Explicit disposable SSH acceptance opt-in required",
    );
    assert.equal(process.platform, "darwin");
    assert.equal(process.arch, "arm64");
    const root = mkdtempSync(join(tmpdir(), "lapis-desktop-ssh-")),
      vault = join(root, "Vault"),
      remote = join(root, "remote.git");
    const run = (cmd, args, env = process.env) =>
      execFileSync(cmd, args, {
        encoding: "utf8",
        env,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 15000,
      }).trim();
    const quote = (v) =>
      '"' + v.replaceAll("\\", "\\\\").replaceAll('"', '\\"') + '"';
    const listener = createServer();
    await new Promise((r) => listener.listen(0, "127.0.0.1", r));
    const port = listener.address().port;
    await new Promise((r) => listener.close(r));
    const children = [];
    let logs = "",
      session,
      trustLine,
      trustPath,
      originalTrust;
    const oldSocket = process.env.SSH_AUTH_SOCK;
    const daemon = (cmd, args) => {
      const c = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
      c.stderr.on("data", (b) => (logs += b.toString()));
      children.push(c);
      return c;
    };
    const until = async (check) => {
      const end = Date.now() + 6000;
      while (Date.now() < end) {
        if (await check()) return;
        await new Promise((r) => setTimeout(r, 30));
      }
      throw Error("SSH fixture startup failed: " + logs);
    };
    try {
      mkdirSync(vault);
      jj(vault, ["git", "init", "--no-colocate", "."]);
      writeFileSync(join(vault, "Note.md"), "Native SSH original\n");
      jj(vault, ["commit", "-m", "SSH fixture"]);
      jj(vault, ["bookmark", "create", "publish", "-r", "@-"]);
      jj(vault, ["bookmark", "create", "do-not-publish", "-r", "@-"]);
      const commit = jj(vault, [
        "log",
        "-r",
        "publish",
        "--no-graph",
        "-T",
        "commit_id",
      ]).trim();
      const checkout = readFileSync(join(vault, ".jj/working_copy/checkout"));
      writeFileSync(join(vault, "Dirty.md"), "Keep dirty bytes\n");
      run("/usr/bin/git", ["init", "--bare", "--initial-branch=main", remote]);
      for (const key of ["host", "identity", "wrong-host"])
        run("/usr/bin/ssh-keygen", [
          "-q",
          "-t",
          "ed25519",
          "-N",
          "",
          "-f",
          join(root, key),
        ]);
      writeFileSync(
        join(root, "authorized_keys"),
        readFileSync(join(root, "identity.pub")),
        { mode: 0o600 },
      );
      const helper = join(root, "git-only.mjs");
      writeFileSync(
        helper,
        `import {spawn} from 'node:child_process';\nimport {appendFileSync} from 'node:fs';\nconst remote=${JSON.stringify(remote)};const command=process.env.SSH_ORIGINAL_COMMAND;\nconst kind=['git-upload-pack','git-receive-pack'].find(k=>command===k+" '"+remote+"'");if(!kind)process.exit(70);\nappendFileSync(${JSON.stringify(join(root, "receives"))},kind+'\\n');\nconst child=spawn('/usr/bin/'+kind,[remote],{stdio:'inherit'});child.on('exit',c=>process.exitCode=c??1);\n`,
        { mode: 0o700 },
      );
      const config = join(root, "sshd_config");
      writeFileSync(
        config,
        [
          `Port ${port}`,
          "ListenAddress 127.0.0.1",
          `HostKey ${quote(join(root, "host"))}`,
          `PidFile ${quote(join(root, "sshd.pid"))}`,
          `AuthorizedKeysFile ${quote(join(root, "authorized_keys"))}`,
          `AllowUsers ${userInfo().username}`,
          "AuthenticationMethods publickey",
          "PubkeyAuthentication yes",
          "PasswordAuthentication no",
          "KbdInteractiveAuthentication no",
          "UsePAM no",
          "StrictModes yes",
          "AllowAgentForwarding no",
          "AllowTcpForwarding no",
          "X11Forwarding no",
          "PermitTTY no",
          "UseDNS no",
          "PrintMotd no",
          "PrintLastLog no",
          "LogLevel ERROR",
          `SetEnv ZDOTDIR=${quote(root)} BASH_ENV=/dev/null ENV=/dev/null GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1`,
          `ForceCommand ${quote(process.execPath)} ${quote(helper)}`,
        ].join("\n") + "\n",
        { mode: 0o600 },
      );
      daemon("/usr/sbin/sshd", ["-D", "-e", "-f", config]);
      await until(
        () =>
          new Promise((r) => {
            const s = connect({ host: "127.0.0.1", port });
            s.once("connect", () => {
              s.destroy();
              r(true);
            });
            s.once("error", () => r(false));
          }),
      );
      const socket = join(root, "agent.sock");
      daemon("/usr/bin/ssh-agent", ["-D", "-a", socket]);
      await until(() => existsSync(socket));
      process.env.SSH_AUTH_SOCK = socket;
      run("/usr/bin/ssh-add", [join(root, "identity")]);
      const publicKey = readFileSync(join(root, "host.pub"), "utf8")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join(" ");
      mkdirSync(join(homedir(), ".ssh"), { recursive: true, mode: 0o700 });
      trustPath = join(homedir(), ".ssh/known_hosts");
      originalTrust = existsSync(trustPath) ? readFileSync(trustPath) : null;
      trustLine = `[127.0.0.1]:${port} ${publicKey} lapis-disposable-${port}\n`;
      appendFileSync(
        trustPath,
        (originalTrust?.length && !originalTrust.toString().endsWith("\n")
          ? "\n"
          : "") + trustLine,
        { mode: 0o600 },
      );
      const endpoint = `ssh://${userInfo().username}@127.0.0.1:${port}${remote}`;
      run("/usr/bin/git", ["ls-remote", endpoint], {
        ...process.env,
        GIT_SSH_COMMAND:
          "ssh -F /dev/null -oBatchMode=yes -oStrictHostKeyChecking=yes -oIdentityFile=none",
      });
      session = await nativeSession(
        "repository-remotes-ssh",
        root,
        undefined,
        [],
        { background: true },
      );
      if (oldSocket === undefined) delete process.env.SSH_AUTH_SOCK;
      else process.env.SSH_AUTH_SOCK = oldSocket;
      const selected = await select(session, root, vault);
      await admit(session, selected.sessionId);
      const read = () =>
        success(session, "desktop_repository_remotes", {
          request: { sessionId: selected.sessionId },
        });
      let snapshot = await read();
      const control = async (command) =>
        (snapshot = await success(session, "desktop_repository_remotes", {
          request: {
            sessionId: selected.sessionId,
            command: { ...command, expectedRevision: snapshot.revision },
          },
        }));
      const target = () =>
        snapshot.settings.targets.find((t) => t.target === "original");
      await control({
        kind: "save_connection",
        target: "original",
        connection: {
          name: "ssh-fixture",
          url: endpoint,
          branch: "reviewed-only",
          bookmark: "publish",
          authentication: "ssh-agent",
          credential: "",
        },
      });
      assert.equal(snapshot.settings.automaticSync, false);
      assert.equal(target().connection.authentication, "ssh-agent");
      await control({ kind: "test_connection", target: "original" });
      await control({ kind: "review_push", target: "original" });
      const review = target().review;
      assert.equal(review.commit, commit);
      await control({ kind: "push", target: "original", reviewId: review.id });
      await control({ kind: "fetch", target: "original" });
      assert.equal(
        run("/usr/bin/git", [
          "--git-dir",
          remote,
          "for-each-ref",
          "--format=%(refname) %(objectname)",
        ]),
        `refs/heads/reviewed-only ${commit}`,
      );
      assert.deepEqual(
        readFileSync(join(vault, ".jj/working_copy/checkout")),
        checkout,
      );
      assert.equal(
        readFileSync(join(vault, "Dirty.md"), "utf8"),
        "Keep dirty bytes\n",
      );
      assert.equal(
        readFileSync(join(root, "receives"), "utf8")
          .split("\n")
          .filter((s) => s === "git-receive-pack").length,
        1,
      );
      await control({
        kind: "save_connection",
        target: "backup",
        connection: {
          name: "ssh-backup-fixture",
          url: endpoint,
          branch: "backup",
          bookmark: "lapis-backup",
          authentication: "ssh-agent",
          credential: "",
        },
      });
      await control({ kind: "test_connection", target: "backup" });
      assert.equal(target().connection.branch, "reviewed-only");
      const wrongKey = readFileSync(join(root, "wrong-host.pub"), "utf8")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join(" ");
      const wrongLine = `[127.0.0.1]:${port} ${wrongKey} lapis-disposable-${port}\n`;
      writeFileSync(
        trustPath,
        readFileSync(trustPath, "utf8").replace(trustLine, wrongLine),
      );
      trustLine = wrongLine;
      await assert.rejects(() =>
        control({ kind: "test_connection", target: "original" }),
      );
      assert.equal(
        readFileSync(join(root, "receives"), "utf8")
          .split("\n")
          .filter((s) => s === "git-receive-pack").length,
        1,
      );
      await success(session, "vault_close", { sessionId: selected.sessionId });
      await session.close(true);
      console.log(
        "PASS: actual Desktop host-agent SSH test/fetch and exact one-branch push, dirty checkout preserved, one receive.",
      );
    } finally {
      if (oldSocket === undefined) delete process.env.SSH_AUTH_SOCK;
      else process.env.SSH_AUTH_SOCK = oldSocket;
      await session?.cleanup();
      for (const c of children) c.kill("SIGTERM");
      for (const key of ["host", "identity", "wrong-host"])
        if (existsSync(join(root, key))) unlinkSync(join(root, key));
      if (trustLine && trustPath) {
        let current = readFileSync(trustPath, "utf8");
        current = current.replace(trustLine, "");
        if (originalTrust === null && current === "") unlinkSync(trustPath);
        else if (
          originalTrust &&
          current === originalTrust.toString() + "\n" &&
          !originalTrust.toString().endsWith("\n")
        )
          writeFileSync(trustPath, originalTrust);
        else writeFileSync(trustPath, current);
        console.log("Removed temporary loopback SSH host-key entry.");
      }
    }
  },
);
