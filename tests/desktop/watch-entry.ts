import {
  VaultClient,
  type VaultDescriptor,
} from "../../src/lib/native/vault-client.ts";
import { createNativeBridge } from "../../src/lib/native/native-bridge.ts";
import type {
  ChangeEvent,
  NativeWatchSubscription,
  WatchErrorEvent,
} from "@lapis-notes/api";

const client = new VaultClient();
const bridge = createNativeBridge(client, "macos");
const events: Array<ChangeEvent | WatchErrorEvent> = [];
let subscription: NativeWatchSubscription | void;
Object.assign(globalThis, {
  __lapisNativeWatchAcceptance: {
    async open() {
      return client.select();
    },
    async start(selected: VaultDescriptor) {
      subscription = bridge.watch?.(
        selected.path,
        "Notes",
        { recursive: true },
        (event) => events.push(event),
      );
      await subscription?.ready;
    },
    events() {
      return events;
    },
    async stop() {
      await subscription?.close();
    },
    async close() {
      await client.closeAll();
    },
  },
});
