import type { LocalGraphCommit, LocalCodeResponse } from "@lapismd/jj-history";

export function commitDetail(commit: LocalGraphCommit): LocalCodeResponse {
  return {
    kind: "commit",
    data: {
      commit,
      object: {
        version: 1,
        profile: "git-sha1",
        key: { kind: "commit", id: commit.id },
        virtual_object: false,
        stats: {
          metadata_nodes: 0,
          predicate_file_bytes: 0,
          predicate_lines: 0,
          object_reads: 0,
          object_bytes: 0,
          work: 0,
        },
        data: {
          kind: "commit",
          data: {
            parents: commit.parents,
            predecessors: [],
            root_tree: commit.tree_terms,
            conflict_labels: [],
            change_id: commit.change_id,
            description: commit.description,
            author: commit.author,
            committer: commit.committer,
          },
        },
      },
    },
  };
}
