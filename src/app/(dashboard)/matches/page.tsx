import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export default async function MatchesPage() {
  const user = await requireUser();
  const conversations = getStore().listConversationsForUser(user.id) as Array<{ id: string; name: string; unread_count: number }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Matches</h1>
      <p className="text-sm text-slate-400">Your active chats and group connections.</p>
      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center text-sm text-slate-400">No matches yet. Visit Discover and start a chat.</div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conversation) => (
            <li key={conversation.id as string} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
              <span>{conversation.name as string}</span>
              <span className="text-slate-400">Unread: {Number(conversation.unread_count || 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
