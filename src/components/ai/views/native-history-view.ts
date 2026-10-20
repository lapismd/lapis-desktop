// SPDX-License-Identifier: Apache-2.0
import { AiView } from "./ai-view.ts";
import { AI_NATIVE_HISTORY_VIEW } from "../../../lib/ai/plugin/view-types.ts";

/** The same embedded native reader, opened without selecting a conversation. */
export class AiNativeHistoryView extends AiView {
  protected override nativeCatalog = true;
  override getViewType() {
    return AI_NATIVE_HISTORY_VIEW;
  }
  override getDisplayText() {
    return "Native conversations";
  }
  override getIcon() {
    return "messages-square";
  }
}
