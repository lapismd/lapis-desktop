import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { parse } from "yaml";
import { prepareLocal } from "./ai-local-compute-fixture.mjs";
import {
  configuration,
  labels,
  fixture,
  ready,
  send,
  completed,
  pendingApproval,
  metadataFiles,
  records,
  hash,
  invoke,
} from "./ai-provider-fixture.mjs";

const clients = (
  process.env.LAPIS_AI_TEST_CLIENTS ?? "codex,cursor,opencode"
).split(",");
assert.ok(
  clients.length && clients.every((client) => Object.hasOwn(labels, client)),
);
for (const client of clients)
  test(
    `real ${labels[client]} reads, approves an edit, cancels a pending write and restores cold`,
    { skip: !configuration, timeout: 1_200_000 },
    async (context) => {
      const f = await fixture(client, context),
        session = f.session;
      const compute = client === "local" ? await prepareLocal(f) : null;
      await ready(session);
      if (client === "opencode" || client === "cursor") {
        const mode = client === "opencode" ? "build" : "agent";
        await session.browser
          .$('button[aria-label="Conversation actions"]')
          .click();
        await session.browser.$('[role="menuitem"]*=Mode:').click();
        const build = session.browser.$(
          `//*[@role="menuitemradio" and translate(normalize-space(.),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")="${mode}"]`,
        );
        await build.waitForDisplayed({ timeout: 30_000 });
        assert.equal(await build.getAttribute("aria-disabled"), "false");
        await session.browser.execute((option) => option.focus(), await build);
        await session.browser.keys("Enter");
        await session.browser.keys("Escape");
        await session.browser
          .$('button[aria-label="Conversation actions"]')
          .click();
        await session.browser.waitUntil(
          async () =>
            (await session.browser.$('[role="menuitem"]*=Mode:').getText())
              .trim()
              .toLowerCase() === `mode: ${mode}`,
          { timeout: 30_000, timeoutMsg: `${mode} mode was not saved` },
        );
        await session.browser.keys("Escape");
      }
      await send(
        session,
        "Use only the app-provided lapis-tools MCP read tool to read Note.md. Reply with its Read witness value. Do not use shell commands or other filesystem tools.",
      );
      let metadata;
      await session.browser.waitUntil(
        () => Boolean((metadata = metadataFiles(f.vault)[0])),
        { timeout: 30_000 },
      );
      const journal = join(dirname(metadata), "transcript.jsonl");
      await completed(session, metadata, (entries) =>
        entries.some(
          (e) => e.role === "assistant" && e.text.includes(f.witness),
        ),
      );
      assert.ok(
        records(journal).some(
          (e) =>
            e.type === "tool" &&
            e.name === "read" &&
            e.server === "lapis-tools" &&
            e.state === "completed",
        ),
      );
      assert.equal(readFileSync(f.note, "utf8"), f.original);
      const bindings = records(join(dirname(metadata), "agents.jsonl"));
      writeFileSync(
        join(f.root, "binding-facts.json"),
        JSON.stringify(
          bindings.filter((e) => e.type === "binding.created"),
          null,
          2,
        ),
      );
      await send(
        session,
        "Use only the lapis-tools application edit tool to replace the exact text Editable: BEFORE with Editable: AFTER in Note.md. Submit the tool request so I can approve it in the application. Do not ask for approval in chat or use shell commands or other filesystem tools.",
      );
      const approval = await pendingApproval(session);
      assert.match(await approval.getText(), /Edit Note\.md/u);
      assert.equal(
        readFileSync(f.note, "utf8"),
        f.original,
        "No write before approval",
      );
      await approval.$("button*=Allow once").click();
      await completed(session, metadata, (entries) =>
        entries.some(
          (e) =>
            e.type === "tool" &&
            e.name === "edit" &&
            e.server === "lapis-tools" &&
            e.state === "completed",
        ),
      );
      assert.equal(
        readFileSync(f.note, "utf8"),
        f.original.replace("BEFORE", "AFTER"),
      );
      await send(
        session,
        "Use only the lapis-tools application edit tool to replace Editable: AFTER with Editable: CANCELLED in Note.md. Submit the tool request to show the application approval. Do not ask in chat or use shell commands or other filesystem tools.",
      );
      await pendingApproval(session);
      await session.browser.$('button[aria-label="Stop agent"]').click();
      await session.browser.waitUntil(
        () => {
          const pending = parse(readFileSync(metadata, "utf8")).pendingTurn;
          return (
            !pending ||
            records(journal).some(
              (e) =>
                e.type === "error" &&
                e.id === `turn-unknown:${pending.id}` &&
                e.retryable === false,
            )
          );
        },
        { timeout: 30_000, interval: 200 },
      );
      assert.equal(
        readFileSync(f.note, "utf8"),
        f.original.replace("BEFORE", "AFTER"),
      );
      const savedHash = hash(journal),
        noteHash = hash(f.note);
      await compute?.stop();
      await session.close(true);
      const cold = await f.launch("-cold");
      await ready(cold);
      await cold.browser
        .$('button[aria-label="Show conversation history"]')
        .click();
      await cold.browser.$("button*=Use only the app-provided").click();
      await cold.browser
        .$('[data-testid="ai-transcript-panel"]')
        .waitForDisplayed();
      assert.equal(
        hash(journal),
        savedHash,
        "Cold restore cannot replay or rewrite history",
      );
      assert.equal(hash(f.note), noteHash);
      assert.deepEqual(await invoke(cold, "plugin:lapis-ai|list"), []);
      assert.equal(existsSync(join(f.vault, ".jj")), false);
      await cold.close(true);
      writeFileSync(
        join(f.root, "accepted.json"),
        JSON.stringify(
          {
            client,
            read: true,
            approvedEdit: true,
            cancelledWrite: true,
            coldHistory: true,
            journalSha256: savedHash,
          },
          null,
          2,
        ),
      );
    },
  );
