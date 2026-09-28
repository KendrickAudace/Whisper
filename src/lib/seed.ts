import bcrypt from "bcryptjs";
import { WhisperStore } from "@/lib/store";
import { demoEncryptionAdapter } from "@/lib/adapters/encryption";

const demoUsers = [
  { email: "alice@whisper.local", name: "Alice Carter", gender: "female" as const, age: 27, bio: "Coffee lover and weekend hiker.", location: "Kigali", interests: ["hiking", "music", "travel"], avatarUrl: "https://i.pravatar.cc/150?img=32", plan: "plus" as const, status: "online" },
  { email: "noah@whisper.local", name: "Noah Reed", gender: "male" as const, age: 29, bio: "Chef by day, gamer by night.", location: "Nairobi", interests: ["food", "gaming", "movies"], avatarUrl: "https://i.pravatar.cc/150?img=12", plan: "free" as const, status: "away" },
  { email: "maya@whisper.local", name: "Maya Singh", gender: "female" as const, age: 25, bio: "Product designer and yoga teacher.", location: "Lagos", interests: ["design", "yoga", "reading"], avatarUrl: "https://i.pravatar.cc/150?img=25", plan: "premium" as const, status: "online" },
  { email: "leo@whisper.local", name: "Leo Walker", gender: "male" as const, age: 31, bio: "Startup founder who loves jazz.", location: "Accra", interests: ["startups", "jazz", "running"], avatarUrl: "https://i.pravatar.cc/150?img=68", plan: "free" as const, status: "offline" },
];

export async function seedDemo(store: WhisperStore) {
  store.resetAllData();

  store.db.prepare("INSERT INTO plans (id, tier, price_cents, features_json) VALUES (?, ?, ?, ?)").run("plan-free", "free", 0, JSON.stringify(["Core messaging", "Basic discover", "Limited boosts"]));
  store.db.prepare("INSERT INTO plans (id, tier, price_cents, features_json) VALUES (?, ?, ?, ?)").run("plan-plus", "plus", 999, JSON.stringify(["Unlimited likes", "Read receipts", "Priority discover"]));
  store.db.prepare("INSERT INTO plans (id, tier, price_cents, features_json) VALUES (?, ?, ?, ?)").run("plan-premium", "premium", 1999, JSON.stringify(["All Plus features", "Advanced filters", "Profile spotlight", "Priority support"]));

  const userIds: string[] = [];
  for (const user of demoUsers) {
    const created = store.createUser({
      email: user.email,
      passwordHash: await bcrypt.hash("demo12345", 10),
      name: user.name,
      gender: user.gender,
      age: user.age,
      bio: user.bio,
      location: user.location,
    });
    if (!created) continue;
    store.updateUserProfile(created.id, { interests: user.interests, avatarUrl: user.avatarUrl, onlineStatus: user.status });
    store.ensureSubscription(created.id, user.plan);
    userIds.push(created.id);
  }

  const [alice, noah, maya, leo] = userIds;
  const conv1 = store.createConversation({ createdBy: alice, memberIds: [noah], name: "Alice & Noah" });
  const conv2 = store.createConversation({ createdBy: maya, memberIds: [alice], name: "Maya & Alice" });
  const group = store.createGroup({ title: "Weekend Explorers", description: "Trips, brunch and spontaneous plans", createdBy: alice, memberIds: [noah, maya, leo] });

  store.createMessage({ conversationId: conv1, senderId: alice, body: "Hey Noah, are you free tonight?", encryptedBody: demoEncryptionAdapter.encrypt("Hey Noah, are you free tonight?") });
  store.createMessage({ conversationId: conv1, senderId: noah, body: "Yes! Send me code 32 if you want me to call.", encryptedBody: demoEncryptionAdapter.encrypt("Yes! Send me code 32 if you want me to call.") });
  store.createMessage({ conversationId: conv2, senderId: maya, body: "Brunch this weekend?", encryptedBody: demoEncryptionAdapter.encrypt("Brunch this weekend?") });
  store.createMessage({ conversationId: group.conversationId, senderId: leo, body: "Hiking trail looks clear tomorrow.", encryptedBody: demoEncryptionAdapter.encrypt("Hiking trail looks clear tomorrow.") });

  store.upsertCodeMapping({ conversationId: conv1, code: "32", meaning: "Call me now", userId: alice });
  store.upsertCodeMapping({ conversationId: group.conversationId, code: "32", meaning: "I'm home safely", userId: alice });

  store.createStatus(alice, "Getting ready for sunset walk 🌇", 20);
  store.createStatus(maya, "Booked a new dance class 💃", 24);

  store.db.prepare("INSERT INTO trends (id, title, description, category, score, created_at) VALUES (?, ?, ?, ?, ?, ?)").run("trend-1", "Sunset Meetups", "People are planning evening coffee meetups this week.", "dating", 41, new Date().toISOString());
  store.db.prepare("INSERT INTO trends (id, title, description, category, score, created_at) VALUES (?, ?, ?, ?, ?, ?)").run("trend-2", "Voice Notes Challenge", "Singles are sharing 30 second voice intros.", "social", 29, new Date().toISOString());

  store.db.prepare("INSERT INTO ads (id, title, body, category, cta_label, cta_url, sponsored_by, targeting_json, impressions, clicks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)").run(
    "ad-1",
    "City Jazz Night",
    "Meet other jazz lovers this Friday at Sky Lounge.",
    "events",
    "Reserve Seat",
    "https://example.com/jazz-night",
    "Sky Lounge",
    JSON.stringify({ ageRange: "24-35", interests: ["jazz", "events"] }),
    new Date().toISOString(),
  );
  store.db.prepare("INSERT INTO ads (id, title, body, category, cta_label, cta_url, sponsored_by, targeting_json, impressions, clicks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)").run(
    "ad-2",
    "Premium Match Coaching",
    "Upgrade your dating profile with 1:1 coaching.",
    "services",
    "Learn More",
    "https://example.com/coaching",
    "Heartwise",
    JSON.stringify({ plan: "free" }),
    new Date().toISOString(),
  );

  const firstCall = store.startCall({ conversationId: conv1, startedBy: alice, type: "audio", participants: [alice, noah] });
  store.endCall(firstCall, "ended");
  const missed = store.startCall({ conversationId: group.conversationId, startedBy: leo, type: "video", participants: [alice, leo, maya] });
  store.endCall(missed, "missed");
}
