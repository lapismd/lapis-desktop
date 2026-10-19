import type {
  ConversationLocation,
  TranscriptEntry,
} from "../../conversations/types.ts";
import type {
  DispatchIntent,
  DeliveryState,
} from "../../conversations/dispatch-intent.ts";
export type ActiveDelivery = {
  dispatchId: string;
  deliveryId: string;
  user: Extract<TranscriptEntry, { type: "message" }>;
  done: (state: DeliveryState) => void;
};
export type ActiveDispatch = {
  intent: DispatchIntent;
  location: ConversationLocation;
  cancelled: boolean;
  done?: (state: DeliveryState) => void;
};
