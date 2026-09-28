"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signInSchema, signUpSchema, profileSchema, messageSchema, codeSchema } from "@/lib/validation";
import { createLoginSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { demoEncryptionAdapter } from "@/lib/adapters/encryption";
import { demoBillingAdapter } from "@/lib/adapters/billing";
import { demoCallProvider } from "@/lib/adapters/calls";
import { demoAdsAdapter } from "@/lib/adapters/ads";
import { getStore, PlanTier } from "@/lib/store";

function parseFormData(formData: FormData, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}

export async function signUpAction(_prevState: { error?: string } | undefined, formData: FormData) {
  try {
    const values = signUpSchema.parse(parseFormData(formData, ["email", "password", "name", "gender", "age"]));
    const store = getStore();
    if (store.getUserByEmail(values.email)) {
      return { error: "An account with this email already exists." };
    }
    const created = store.createUser({
      email: values.email,
      passwordHash: await hashPassword(values.password),
      name: values.name,
      gender: values.gender,
      age: values.age,
    });
    if (!created) return { error: "Unable to create account right now." };
    await createLoginSession(created.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid signup input." };
  }
  redirect("/dashboard");
}

export async function signInAction(_prevState: { error?: string } | undefined, formData: FormData) {
  try {
    const values = signInSchema.parse(parseFormData(formData, ["email", "password"]));
    const store = getStore();
    const user = store.getUserByEmail(values.email);
    if (!user) return { error: "No account found for this email." };
    const ok = await verifyPassword(values.password, user.password_hash);
    if (!ok) return { error: "Invalid password." };
    await createLoginSession(user.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid sign in input." };
  }
  redirect("/dashboard");
}

export async function signOutAction() {
  await destroySession();
  redirect("/signin");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const values = profileSchema.parse(parseFormData(formData, ["name", "age", "bio", "location", "interests", "avatarUrl"]));
  getStore().updateUserProfile(user.id, {
    name: values.name,
    age: values.age,
    bio: values.bio,
    location: values.location,
    interests: values.interests.split(",").map((v) => v.trim()).filter(Boolean),
    avatarUrl: values.avatarUrl,
  });
  revalidatePath("/profile");
  revalidatePath("/settings");
}

export async function createConversationAction(formData: FormData) {
  const user = await requireUser();
  const memberIds = String(formData.get("memberIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const name = String(formData.get("name") ?? "").trim();
  getStore().createConversation({ createdBy: user.id, memberIds, name: name || undefined, isGroup: false });
  revalidatePath("/messages");
}

export async function createMessageAction(formData: FormData) {
  const user = await requireUser();
  const conversationId = String(formData.get("conversationId") ?? "");
  const values = messageSchema.parse(parseFormData(formData, ["body", "attachmentUrl"]));
  getStore().setTyping(conversationId, user.id);
  getStore().createMessage({
    conversationId,
    senderId: user.id,
    body: values.body,
    encryptedBody: demoEncryptionAdapter.encrypt(values.body),
    attachmentJson: values.attachmentUrl ? JSON.stringify({ url: values.attachmentUrl, kind: "link" }) : null,
  });
  getStore().markConversationRead(conversationId, user.id);
  revalidatePath(`/messages?conversationId=${conversationId}`);
}

export async function editMessageAction(formData: FormData) {
  const user = await requireUser();
  const messageId = String(formData.get("messageId") ?? "");
  const body = String(formData.get("body") ?? "");
  getStore().updateMessage(messageId, user.id, body, demoEncryptionAdapter.encrypt(body));
  revalidatePath("/messages");
}

export async function deleteMessageAction(formData: FormData) {
  const user = await requireUser();
  const messageId = String(formData.get("messageId") ?? "");
  getStore().deleteMessage(messageId, user.id);
  revalidatePath("/messages");
}

export async function pinMessageAction(formData: FormData) {
  const user = await requireUser();
  const messageId = String(formData.get("messageId") ?? "");
  const pinned = String(formData.get("pinned") ?? "") === "true";
  getStore().pinMessage(messageId, user.id, pinned);
  revalidatePath("/messages");
}

export async function upsertCodeAction(formData: FormData) {
  const user = await requireUser();
  const conversationId = String(formData.get("conversationId") ?? "");
  const values = codeSchema.parse(parseFormData(formData, ["code", "meaning"]));
  getStore().upsertCodeMapping({ conversationId, code: values.code, meaning: values.meaning, userId: user.id });
  revalidatePath(`/messages?conversationId=${conversationId}`);
}

export async function deleteCodeAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const conversationId = String(formData.get("conversationId") ?? "");
  getStore().deleteCodeMapping(id, conversationId);
  revalidatePath(`/messages?conversationId=${conversationId}`);
}

export async function createStatusAction(formData: FormData) {
  const user = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  getStore().createStatus(user.id, content, Number(formData.get("hours") ?? 24));
  revalidatePath("/status");
}

export async function deleteStatusAction(formData: FormData) {
  const user = await requireUser();
  getStore().deleteStatus(String(formData.get("statusId") ?? ""), user.id);
  revalidatePath("/status");
}

export async function reactTrendAction(formData: FormData) {
  const user = await requireUser();
  getStore().reactTrend(String(formData.get("trendId") ?? ""), user.id, String(formData.get("reaction") ?? "🔥"));
  revalidatePath("/trending");
}

export async function startCallAction(formData: FormData) {
  const user = await requireUser();
  const conversationId = String(formData.get("conversationId") ?? "");
  const type = String(formData.get("type") ?? "audio") as "audio" | "video";
  const members = (getStore().listMembers(conversationId) as Array<{ user_id: string }>).map((m) => m.user_id);
  demoCallProvider.startCall({ conversationId, startedBy: user.id, type, participants: members });
  revalidatePath("/calls");
}

export async function endCallAction(formData: FormData) {
  await requireUser();
  demoCallProvider.endCall(String(formData.get("callId") ?? ""), String(formData.get("status") ?? "ended") as "ended" | "missed");
  revalidatePath("/calls");
}

export async function createGroupAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const memberIds = String(formData.get("memberIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!title) return;
  getStore().createGroup({ title, description, memberIds, createdBy: user.id });
  revalidatePath("/groups");
}

export async function updateGroupAction(formData: FormData) {
  const user = await requireUser();
  getStore().updateGroup(String(formData.get("groupId") ?? ""), String(formData.get("title") ?? ""), String(formData.get("description") ?? ""), user.id);
  revalidatePath("/groups");
}

export async function joinGroupAction(formData: FormData) {
  const user = await requireUser();
  getStore().joinGroup(String(formData.get("groupId") ?? ""), user.id);
  revalidatePath("/groups");
}

export async function leaveGroupAction(formData: FormData) {
  const user = await requireUser();
  getStore().leaveGroup(String(formData.get("groupId") ?? ""), user.id);
  revalidatePath("/groups");
}

export async function setRoleAction(formData: FormData) {
  await requireUser();
  getStore().setMemberRole(
    String(formData.get("conversationId") ?? ""),
    String(formData.get("memberId") ?? ""),
    String(formData.get("role") ?? "member") as "member" | "moderator",
  );
  revalidatePath("/groups");
}

export async function upgradePlanAction(formData: FormData) {
  const user = await requireUser();
  const tier = String(formData.get("tier") ?? "free") as PlanTier;
  const checkout = demoBillingAdapter.beginCheckout({ userId: user.id, tier });
  redirect(checkout.redirectUrl);
}

export async function completeCheckoutAction(tier: PlanTier, userId: string) {
  const user = await requireUser();
  if (user.id !== userId) return;
  getStore().ensureSubscription(user.id, tier);
  revalidatePath("/plans");
}

export async function adClickAction(formData: FormData) {
  const adId = String(formData.get("adId") ?? "");
  demoAdsAdapter.trackClick(adId);
  revalidatePath("/ads");
}

export async function blockUserAction(formData: FormData) {
  const user = await requireUser();
  getStore().blockUser(user.id, String(formData.get("targetUserId") ?? ""));
  revalidatePath("/settings");
}

export async function reportUserAction(formData: FormData) {
  const user = await requireUser();
  getStore().reportUser(user.id, String(formData.get("targetUserId") ?? ""), String(formData.get("reason") ?? ""));
  revalidatePath("/settings");
}
