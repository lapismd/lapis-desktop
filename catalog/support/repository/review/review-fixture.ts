import { richCommitMessage } from "../rich-commit.ts";
import { operationFixture, operationNode } from "../operations.ts";
import { commit, otherOperation, parent, revision } from "../fixture.ts";
import { commitDetail } from "../commit-detail.ts";
import { reviewEvolutionFixture } from "./review-evolution.ts";
import { repositoryWorkspaces } from "../../../../src/lib/repository/workspaces.ts";

export function reviewFixture() {
  const fixture = operationFixture("operation-ready");
  const operations = [operationNode(), operationNode(otherOperation, [])];
  operations[0].description =
    "describe commit 5ae7211b218e61eae163d39677075f5165c90ce8";
  operations[0].attributes.args =
    "jj describe -r @ -m 'Keep repository history beside the notes'";
  const first = commit(revision),
    second = commit("33".repeat(20));
  first.description = richCommitMessage;
  first.bookmarks = [
    {
      name: "main",
      remote: null,
      added: true,
      removed: false,
      conflicted: false,
    },
    {
      name: "main",
      remote: "origin",
      added: true,
      removed: false,
      conflicted: false,
    },
    {
      name: "notes/design-system-review",
      remote: null,
      added: true,
      removed: false,
      conflicted: false,
    },
    {
      name: "notes/design-system-review",
      remote: "origin",
      added: true,
      removed: false,
      conflicted: false,
    },
  ];
  first.workspaces = ["default"];
  second.change_id = "bb".repeat(16);
  second.parents = [parent];
  second.conflicted = true;
  second.workspaces = ["notes-review"];
  second.description = "Update vault shortcuts";
  second.author = {
    ...second.author,
    name: "Grace",
    email: "grace@example.test",
  };
  second.bookmarks = [
    {
      name: "notes",
      remote: null,
      added: true,
      removed: false,
      conflicted: false,
    },
    {
      name: "notes",
      remote: "origin",
      added: true,
      removed: false,
      conflicted: false,
    },
    {
      name: "notes",
      remote: "backup",
      added: true,
      removed: false,
      conflicted: false,
    },
  ];
  const commits = [first, second, commit(parent)];
  const read = fixture.reader.read;
  fixture.reader.read = async (handle, query) => {
    const response = await read(handle, query);
    if (response.kind === "graph" && response.data.data.graph === "log") {
      const graph = response.data.data;
      graph.nodes = graph.nodes.map((node) => ({
        ...node,
        commit:
          commits.find((commit) => commit.id === node.commit.id) ?? node.commit,
      }));
      if (
        graph.nodes.some((node) => node.commit.id === first.id) &&
        !graph.nodes.some((node) => node.commit.id === second.id)
      )
        graph.nodes.splice(1, 0, {
          commit: second,
          edges: [{ target: parent, kind: "direct" }],
        });
    }
    if (response.kind === "graph" && response.data.data.graph === "operations")
      response.data.data.nodes = response.data.data.nodes.map(
        (node) =>
          operations.find((operation) => operation.id === node.id) ?? node,
      );
    if (response.kind === "commit") {
      const selected = commits.find(
        (commit) => commit.id === response.data.commit.id,
      );
      if (selected) return commitDetail(selected);
    }
    if (response.kind === "operation_changes")
      response.data.groups.push({
        change: second.change_id,
        before: [parent],
        after: [second.id],
        comparison: { status: "exact", from: parent, to: second.id },
      });
    return response;
  };
  return {
    ...fixture,
    commits,
    operations,
    evolution: reviewEvolutionFixture(commits),
    workspaces: repositoryWorkspaces(commits),
  };
}
