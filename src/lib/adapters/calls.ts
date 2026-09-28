import { getStore } from "@/lib/store";

export type CallProvider = {
  startCall(input: { conversationId: string; startedBy: string; type: "audio" | "video"; participants: string[] }): string;
  endCall(callId: string, status: "ended" | "missed"): void;
  label: string;
};

export const demoCallProvider: CallProvider = {
  label: "Demo simulated call provider",
  startCall(input) {
    return getStore().startCall(input);
  },
  endCall(callId, status) {
    getStore().endCall(callId, status);
  },
};
