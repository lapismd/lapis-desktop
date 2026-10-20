// SPDX-License-Identifier: Apache-2.0
import { untrack } from "svelte";
import type { TranscriptController } from "@lapismd/design-core/chat";
import { draftThreads } from "../../drafts/model.ts";
import type { ComposerState } from "./composer.svelte.ts";
/** Keep pending source comments on the same conversation as the message draft. */
export function observeDraftComments(
  getComposer: () => ComposerState,
  state: TranscriptController,
) {
  let active = "",
    restored = false;
  $effect.pre(() => {
    const composer = getComposer();
    const key = composer.draftKey,
      ready = composer.draftReady;
    untrack(() => {
      if (active !== key) {
        active = key;
        restored = false;
        state.threads = [];
        state.active = undefined;
        state.message = "";
        state.error = "";
        state.retainedSubmission = undefined;
        state.submissionResult = undefined;
      }
      if (ready && !restored) {
        restored = true;
        const next = structuredClone($state.snapshot(state.threads));
        for (const saved of $state.snapshot(composer.draftThreads)) {
          const current = next.find((thread) => thread.id === saved.id);
          if (current)
            current.comments.push(
              ...saved.comments.filter(
                (comment) =>
                  !current.comments.some(
                    (existing) => existing.id === comment.id,
                  ),
              ),
            );
          else next.push(saved);
        }
        state.threads = next;
      }
    });
  });
  $effect(() => {
    const composer = getComposer();
    const ready = composer.draftReady;
    const threads = draftThreads($state.snapshot(state.threads));
    if (ready)
      untrack(() => {
        composer.draftThreads = threads;
      });
  });
}
