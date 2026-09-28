import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { WhisperStore } from "../lib/store";

async function setupStore() {
  const store = new WhisperStore(":memory:");
  store.migrate();
  const passwordHash = await bcrypt.hash("demo12345", 10);
  const alice = store.createUser({ email: "alice@test.local", passwordHash, name: "Alice", gender: "female", age: 26 });
  const noah = store.createUser({ email: "noah@test.local", passwordHash, name: "Noah", gender: "male", age: 28 });
  if (!alice || !noah) throw new Error("Failed to create demo users");
  return { store, alice, noah };
}

describe("auth and sessions", () => {
  it("creates and validates user session persistence", async () => {
    const { store, alice } = await setupStore();
    const sessionId = store.createSession(alice.id, 7);
    const session = store.getSession(sessionId);
    expect(session?.user_id).toBe(alice.id);
    store.deleteSession(sessionId);
    expect(store.getSession(sessionId)).toBeUndefined();
    store.close();
  });
});

describe("conversation code mappings", () => {
  it("scopes same code to each conversation", async () => {
    const { store, alice, noah } = await setupStore();
    const c1 = store.createConversation({ createdBy: alice.id, memberIds: [noah.id] });
    const c2 = store.createConversation({ createdBy: noah.id, memberIds: [alice.id] });
    store.upsertCodeMapping({ conversationId: c1, code: "32", meaning: "Call me", userId: alice.id });
    store.upsertCodeMapping({ conversationId: c2, code: "32", meaning: "I am home", userId: noah.id });
    expect(store.resolveCode(c1, "32")?.meaning).toBe("Call me");
    expect(store.resolveCode(c2, "32")?.meaning).toBe("I am home");
    store.close();
  });
});

describe("message CRUD", () => {
  it("creates, edits, pins and soft deletes a message", async () => {
    const { store, alice, noah } = await setupStore();
    const conversationId = store.createConversation({ createdBy: alice.id, memberIds: [noah.id] });
    const messageId = store.createMessage({ conversationId, senderId: alice.id, body: "hello", encryptedBody: "enc" });
    store.updateMessage(messageId, alice.id, "hello edited", "enc2");
    store.pinMessage(messageId, alice.id, true);
    let messages = store.listMessages(conversationId) as Array<{ body: string; is_pinned: number }>;
    expect(messages[0]?.body).toBe("hello edited");
    expect(messages[0]?.is_pinned).toBe(1);
    store.deleteMessage(messageId, alice.id);
    messages = store.listMessages(conversationId) as Array<{ body: string; is_pinned: number }>;
    expect(messages).toHaveLength(0);
    store.close();
  });
});

describe("subscriptions", () => {
  it("updates user subscription tier", async () => {
    const { store, alice } = await setupStore();
    store.ensureSubscription(alice.id, "premium");
    const sub = store.getSubscription(alice.id) as { plan_tier: string };
    expect(sub.plan_tier).toBe("premium");
    expect(store.getUserById(alice.id)?.plan_tier).toBe("premium");
    store.close();
  });
});
