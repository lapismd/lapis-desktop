import type { Meta, StoryObj } from "@storybook/svelte-vite";
import RepositoryReviewDemo from "../../support/repository/review/RepositoryReviewDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta: Meta = {
  title: "Desktop/Repository parity review",
  component: RepositoryReviewDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  parameters: {
    docs: {
      description: {
        component:
          "Reviewed compositions share production presentation. Synthetic Evo/revert cases remain catalog-only; production adoption evidence is E-REPO-015.",
      },
    },
  },
};
export default meta;
export const SelectedOperationActions: StoryObj = { args: { selected: true } };
export const UnselectedOperations: StoryObj = { args: { selected: false } };
export const MultilineCommitMessage: StoryObj = {
  args: { selected: true, initialTab: "history" },
};

export const TagsAndConflictedCommits: StoryObj = {
  args: {
    selected: true,
    initialTab: "history",
    initialRevision: "33".repeat(20),
  },
};

export const EvolutionLog: StoryObj = {
  args: { selected: true, initialTab: "history", initialEvolution: true },
};

export const OperationMessageIds: StoryObj = { args: { selected: true } };

export const ConflictResolution: StoryObj = {
  args: {
    selected: true,
    initialTab: "history",
    initialRevision: "33".repeat(20),
  },
};
export const ShortCommitWithParent: StoryObj = {
  args: {
    selected: true,
    initialTab: "history",
    initialRevision: "33".repeat(20),
  },
};
export const RevertOperation: StoryObj = { args: { selected: true } };

export const EvolutionWithoutComparison: StoryObj = {
  args: {
    selected: true,
    initialTab: "history",
    initialRevision: "22".repeat(20),
    initialEvolution: true,
  },
};
