import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import { dirname } from "path";

export type PlanTier = "free" | "plus" | "premium";
export type Gender = "male" | "female";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  gender: Gender;
  age: number;
  bio: string;
  location: string;
  interests_json: string;
  avatar_url: string;
  online_status: "online" | "offline" | "away";
  last_seen: string;
  profile_completed: number;
  plan_tier: PlanTier;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  encrypted_body: string;
  attachment_json: string | null;
  is_pinned: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
};

export class WhisperStore {
  db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  close() {
    this.db.close();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
        age INTEGER NOT NULL,
        bio TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        interests_json TEXT NOT NULL DEFAULT '[]',
        avatar_url TEXT NOT NULL DEFAULT '',
        online_status TEXT NOT NULL DEFAULT 'offline',
        last_seen TEXT NOT NULL,
        profile_completed INTEGER NOT NULL DEFAULT 0,
        plan_tier TEXT NOT NULL DEFAULT 'free',
        blocked_ids_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        name TEXT,
        is_group INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS conversation_members (
        conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        last_read_at TEXT,
        typing_until TEXT,
        PRIMARY KEY (conversation_id, user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        body TEXT NOT NULL,
        encrypted_body TEXT NOT NULL,
        attachment_json TEXT,
        is_pinned INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS code_mappings (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        code TEXT NOT NULL,
        meaning TEXT NOT NULL,
        created_by TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(conversation_id, code)
      );

      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS statuses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS trends (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trend_interactions (
        id TEXT PRIMARY KEY,
        trend_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reaction TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (trend_id) REFERENCES trends(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        tier TEXT UNIQUE NOT NULL,
        price_cents INTEGER NOT NULL,
        features_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        plan_tier TEXT NOT NULL,
        status TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ads (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        category TEXT NOT NULL,
        cta_label TEXT NOT NULL,
        cta_url TEXT NOT NULL,
        sponsored_by TEXT NOT NULL,
        targeting_json TEXT NOT NULL,
        impressions INTEGER NOT NULL DEFAULT 0,
        clicks INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS call_records (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        started_by TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        participant_ids_json TEXT NOT NULL,
        provider_metadata_json TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        target_user_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        blocked_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, blocked_user_id)
      );
    `);
  }

  now() {
    return new Date().toISOString();
  }

  getUsers() {
    return this.db.prepare("SELECT id, name, age, gender, bio, location, interests_json, avatar_url, online_status, last_seen, profile_completed, plan_tier FROM users ORDER BY name").all();
  }

  getUserByEmail(email: string): UserRow | undefined {
    return this.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
  }

  getUserById(id: string): UserRow | undefined {
    return this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  }

  createUser(input: {
    email: string;
    passwordHash: string;
    name: string;
    gender: Gender;
    age: number;
    bio?: string;
    location?: string;
  }) {
    const id = randomUUID();
    const now = this.now();
    this.db
      .prepare(`
      INSERT INTO users (id, email, password_hash, name, gender, age, bio, location, interests_json, avatar_url, online_status, last_seen, profile_completed, plan_tier, blocked_ids_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', '', 'online', ?, 0, 'free', '[]', ?)
    `)
      .run(id, input.email, input.passwordHash, input.name, input.gender, input.age, input.bio ?? "", input.location ?? "", now, now);
    this.ensureSubscription(id, "free");
    return this.getUserById(id);
  }

  updateUserProfile(userId: string, input: Partial<{ name: string; age: number; bio: string; location: string; interests: string[]; avatarUrl: string; onlineStatus: string }>) {
    const existing = this.getUserById(userId);
    if (!existing) return;
    const next = {
      name: input.name ?? existing.name,
      age: input.age ?? existing.age,
      bio: input.bio ?? existing.bio,
      location: input.location ?? existing.location,
      interests_json: JSON.stringify(input.interests ?? JSON.parse(existing.interests_json || "[]")),
      avatar_url: input.avatarUrl ?? existing.avatar_url,
      online_status: input.onlineStatus ?? existing.online_status,
    };
    const profileCompleted = next.bio.length > 0 && next.location.length > 0 && next.avatar_url.length > 0 ? 1 : 0;
    this.db
      .prepare(
        "UPDATE users SET name = ?, age = ?, bio = ?, location = ?, interests_json = ?, avatar_url = ?, online_status = ?, profile_completed = ?, last_seen = ? WHERE id = ?",
      )
      .run(next.name, next.age, next.bio, next.location, next.interests_json, next.avatar_url, next.online_status, profileCompleted, this.now(), userId);
  }

  createSession(userId: string, expiresInDays = 7) {
    const id = randomUUID();
    const createdAt = this.now();
    const expires = new Date(Date.now() + expiresInDays * 86400000).toISOString();
    this.db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(id, userId, expires, createdAt);
    return id;
  }

  getSession(sessionId: string) {
    return this.db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as { id: string; user_id: string; expires_at: string } | undefined;
  }

  deleteSession(sessionId: string) {
    this.db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
  }

  listConversationsForUser(userId: string) {
    return this.db
      .prepare(`
      SELECT c.id, COALESCE(c.name, 'Direct chat') as name, c.is_group, c.updated_at,
      SUM(CASE WHEN m.created_at > COALESCE(cm.last_read_at, '') AND m.sender_id <> ? THEN 1 ELSE 0 END) as unread_count
      FROM conversations c
      JOIN conversation_members cm ON cm.conversation_id = c.id
      LEFT JOIN messages m ON m.conversation_id = c.id AND m.is_deleted = 0
      WHERE cm.user_id = ?
      GROUP BY c.id
      ORDER BY c.updated_at DESC
    `)
      .all(userId, userId);
  }

  createConversation(input: { name?: string; createdBy: string; memberIds: string[]; isGroup?: boolean }) {
    const id = randomUUID();
    const now = this.now();
    this.db.prepare("INSERT INTO conversations (id, name, is_group, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, input.name ?? null, input.isGroup ? 1 : 0, input.createdBy, now, now);
    const memberStmt = this.db.prepare("INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, role, last_read_at) VALUES (?, ?, ?, ?)");
    [...new Set([input.createdBy, ...input.memberIds])].forEach((memberId) => {
      memberStmt.run(id, memberId, memberId === input.createdBy ? "owner" : "member", now);
    });
    return id;
  }

  markConversationRead(conversationId: string, userId: string) {
    this.db.prepare("UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?").run(this.now(), conversationId, userId);
  }

  listMessages(conversationId: string, q?: string) {
    const search = q ? `%${q}%` : null;
    return this.db
      .prepare(
        `SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ? AND (m.is_deleted = 0 OR m.sender_id = ?) ${
          search ? "AND m.body LIKE ?" : ""
        } ORDER BY m.created_at ASC`,
      )
      .all(conversationId, "", ...(search ? [search] : []));
  }

  createMessage(input: { conversationId: string; senderId: string; body: string; encryptedBody: string; attachmentJson?: string | null }) {
    const id = randomUUID();
    const now = this.now();
    this.db
      .prepare(
        "INSERT INTO messages (id, conversation_id, sender_id, body, encrypted_body, attachment_json, is_pinned, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)",
      )
      .run(id, input.conversationId, input.senderId, input.body, input.encryptedBody, input.attachmentJson ?? null, now, now);
    this.db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(now, input.conversationId);
    return id;
  }

  updateMessage(messageId: string, senderId: string, body: string, encryptedBody: string) {
    this.db.prepare("UPDATE messages SET body = ?, encrypted_body = ?, updated_at = ? WHERE id = ? AND sender_id = ? AND is_deleted = 0").run(body, encryptedBody, this.now(), messageId, senderId);
  }

  pinMessage(messageId: string, senderId: string, pinned: boolean) {
    this.db.prepare("UPDATE messages SET is_pinned = ? WHERE id = ? AND sender_id = ? AND is_deleted = 0").run(pinned ? 1 : 0, messageId, senderId);
  }

  deleteMessage(messageId: string, senderId: string) {
    this.db.prepare("UPDATE messages SET is_deleted = 1, body = '[deleted]', updated_at = ? WHERE id = ? AND sender_id = ?").run(this.now(), messageId, senderId);
  }

  setTyping(conversationId: string, userId: string) {
    const until = new Date(Date.now() + 15000).toISOString();
    this.db.prepare("UPDATE conversation_members SET typing_until = ? WHERE conversation_id = ? AND user_id = ?").run(until, conversationId, userId);
  }

  listTypingUsers(conversationId: string) {
    return this.db
      .prepare("SELECT user_id FROM conversation_members WHERE conversation_id = ? AND typing_until > ?")
      .all(conversationId, this.now()) as { user_id: string }[];
  }

  listCodeMappings(conversationId: string, q?: string) {
    return this.db
      .prepare(`SELECT * FROM code_mappings WHERE conversation_id = ? ${q ? "AND (code LIKE ? OR meaning LIKE ?)" : ""} ORDER BY updated_at DESC`)
      .all(conversationId, ...(q ? [`%${q}%`, `%${q}%`] : []));
  }

  upsertCodeMapping(input: { conversationId: string; code: string; meaning: string; userId: string }) {
    const existing = this.db.prepare("SELECT id FROM code_mappings WHERE conversation_id = ? AND code = ?").get(input.conversationId, input.code) as { id: string } | undefined;
    if (existing) {
      this.db.prepare("UPDATE code_mappings SET meaning = ?, updated_at = ? WHERE id = ?").run(input.meaning, this.now(), existing.id);
      return existing.id;
    }
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO code_mappings (id, conversation_id, code, meaning, created_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, input.conversationId, input.code, input.meaning, input.userId, this.now());
    return id;
  }

  deleteCodeMapping(id: string, conversationId: string) {
    this.db.prepare("DELETE FROM code_mappings WHERE id = ? AND conversation_id = ?").run(id, conversationId);
  }

  resolveCode(conversationId: string, code: string) {
    return this.db.prepare("SELECT meaning FROM code_mappings WHERE conversation_id = ? AND code = ?").get(conversationId, code) as { meaning: string } | undefined;
  }

  createStatus(userId: string, content: string, hours = 24) {
    const id = randomUUID();
    const createdAt = this.now();
    const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
    this.db.prepare("INSERT INTO statuses (id, user_id, content, expires_at, created_at, is_deleted) VALUES (?, ?, ?, ?, ?, 0)").run(id, userId, content, expiresAt, createdAt);
  }

  deleteStatus(statusId: string, userId: string) {
    this.db.prepare("UPDATE statuses SET is_deleted = 1 WHERE id = ? AND user_id = ?").run(statusId, userId);
  }

  listActiveStatuses() {
    return this.db
      .prepare(
        "SELECT s.*, u.name, u.avatar_url FROM statuses s JOIN users u ON u.id = s.user_id WHERE s.is_deleted = 0 AND s.expires_at > ? ORDER BY s.created_at DESC",
      )
      .all(this.now());
  }

  listTrends() {
    return this.db.prepare("SELECT * FROM trends ORDER BY score DESC, created_at DESC").all();
  }

  reactTrend(trendId: string, userId: string, reaction: string) {
    this.db
      .prepare("INSERT INTO trend_interactions (id, trend_id, user_id, reaction, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(randomUUID(), trendId, userId, reaction, this.now());
    this.db.prepare("UPDATE trends SET score = score + 1 WHERE id = ?").run(trendId);
  }

  listPlans() {
    return this.db.prepare("SELECT * FROM plans ORDER BY price_cents ASC").all();
  }

  ensureSubscription(userId: string, tier: PlanTier) {
    const now = this.now();
    this.db
      .prepare("INSERT INTO subscriptions (id, user_id, plan_tier, status, updated_at) VALUES (?, ?, ?, 'active', ?) ON CONFLICT(user_id) DO UPDATE SET plan_tier = excluded.plan_tier, updated_at = excluded.updated_at")
      .run(randomUUID(), userId, tier, now);
    this.db.prepare("UPDATE users SET plan_tier = ? WHERE id = ?").run(tier, userId);
  }

  getSubscription(userId: string) {
    return this.db.prepare("SELECT * FROM subscriptions WHERE user_id = ?").get(userId);
  }

  listAds() {
    return this.db.prepare("SELECT * FROM ads ORDER BY created_at DESC").all();
  }

  trackAdImpression(adId: string) {
    this.db.prepare("UPDATE ads SET impressions = impressions + 1 WHERE id = ?").run(adId);
  }

  trackAdClick(adId: string) {
    this.db.prepare("UPDATE ads SET clicks = clicks + 1 WHERE id = ?").run(adId);
  }

  startCall(input: { conversationId: string; startedBy: string; type: "audio" | "video"; participants: string[] }) {
    const id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO call_records (id, conversation_id, started_by, type, status, started_at, ended_at, participant_ids_json, provider_metadata_json) VALUES (?, ?, ?, ?, 'started', ?, NULL, ?, ?)",
      )
      .run(id, input.conversationId, input.startedBy, input.type, this.now(), JSON.stringify(input.participants), JSON.stringify({ provider: "demo-simulator" }));
    return id;
  }

  endCall(callId: string, status: "ended" | "missed") {
    this.db.prepare("UPDATE call_records SET status = ?, ended_at = ? WHERE id = ?").run(status, this.now(), callId);
  }

  listCallsForUser(userId: string) {
    return this.db
      .prepare(
        "SELECT cr.*, c.name as conversation_name FROM call_records cr JOIN conversations c ON c.id = cr.conversation_id JOIN conversation_members cm ON cm.conversation_id = c.id WHERE cm.user_id = ? ORDER BY cr.started_at DESC",
      )
      .all(userId);
  }

  createGroup(input: { title: string; description: string; createdBy: string; memberIds: string[] }) {
    const conversationId = this.createConversation({ createdBy: input.createdBy, isGroup: true, name: input.title, memberIds: input.memberIds });
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO groups (id, conversation_id, title, description, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, conversationId, input.title, input.description, input.createdBy, this.now());
    return { id, conversationId };
  }

  listGroups() {
    return this.db.prepare("SELECT * FROM groups ORDER BY created_at DESC").all();
  }

  updateGroup(groupId: string, title: string, description: string, userId: string) {
    this.db.prepare("UPDATE groups SET title = ?, description = ? WHERE id = ? AND created_by = ?").run(title, description, groupId, userId);
    const row = this.db.prepare("SELECT conversation_id FROM groups WHERE id = ?").get(groupId) as { conversation_id: string } | undefined;
    if (row) {
      this.db.prepare("UPDATE conversations SET name = ?, updated_at = ? WHERE id = ?").run(title, this.now(), row.conversation_id);
    }
  }

  joinGroup(groupId: string, userId: string) {
    const row = this.db.prepare("SELECT conversation_id FROM groups WHERE id = ?").get(groupId) as { conversation_id: string } | undefined;
    if (!row) return;
    this.db.prepare("INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, role, last_read_at) VALUES (?, ?, 'member', ?)").run(row.conversation_id, userId, this.now());
  }

  leaveGroup(groupId: string, userId: string) {
    const row = this.db.prepare("SELECT conversation_id, created_by FROM groups WHERE id = ?").get(groupId) as { conversation_id: string; created_by: string } | undefined;
    if (!row || row.created_by === userId) return;
    this.db.prepare("DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?").run(row.conversation_id, userId);
  }

  listMembers(conversationId: string) {
    return this.db
      .prepare("SELECT cm.user_id, cm.role, u.name FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ? ORDER BY u.name")
      .all(conversationId);
  }

  setMemberRole(conversationId: string, memberId: string, role: "member" | "moderator") {
    this.db.prepare("UPDATE conversation_members SET role = ? WHERE conversation_id = ? AND user_id = ?").run(role, conversationId, memberId);
  }

  blockUser(userId: string, blockedUserId: string) {
    this.db.prepare("INSERT OR IGNORE INTO blocks (id, user_id, blocked_user_id, created_at) VALUES (?, ?, ?, ?)").run(randomUUID(), userId, blockedUserId, this.now());
  }

  reportUser(userId: string, targetUserId: string, reason: string) {
    this.db.prepare("INSERT INTO reports (id, reporter_id, target_user_id, reason, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)").run(randomUUID(), userId, targetUserId, reason, this.now());
  }

  resetAllData() {
    const tables = [
      "reports",
      "blocks",
      "call_records",
      "ads",
      "subscriptions",
      "plans",
      "trend_interactions",
      "trends",
      "statuses",
      "groups",
      "code_mappings",
      "messages",
      "conversation_members",
      "conversations",
      "sessions",
      "users",
    ];
    tables.forEach((table) => this.db.prepare(`DELETE FROM ${table}`).run());
  }
}

let store: WhisperStore | null = null;

export function getStore() {
  if (store) return store;
  const filePath = process.env.DATABASE_URL?.replace("file:", "") || "./data/whisper.db";
  mkdirSync(dirname(filePath), { recursive: true });
  store = new WhisperStore(filePath);
  store.migrate();
  return store;
}
