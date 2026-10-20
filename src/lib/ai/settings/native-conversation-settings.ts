// SPDX-License-Identifier: Apache-2.0
import type { NativeConversationSetup } from "../conversations/native-setup.ts";
import type { NativeConversationReference } from "../conversations/conversation-route.ts";

export interface NativeConversationSettingsManagement {
  setup: NativeConversationSetup;
  openHistory(): Promise<void>;
  openConversation(reference: NativeConversationReference): Promise<void>;
}
