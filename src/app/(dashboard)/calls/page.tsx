import { endCallAction, startCallAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { demoCallProvider } from "@/lib/adapters/calls";
import { getStore } from "@/lib/store";

export default async function CallsPage() {
  const user = await requireUser();
  const store = getStore();
  const conversations = store.listConversationsForUser(user.id) as Array<{ id: string; name: string }>;
  const calls = store.listCallsForUser(user.id) as Array<{ id: string; conversation_name: string; type: string; status: string; started_at: string }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Calls</h1>
      <p className="text-sm text-slate-400">Provider: {demoCallProvider.label}. Swap this adapter for WebRTC/Twilio/LiveKit in production.</p>
      <form action={startCallAction} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 md:grid-cols-4">
        <select name="conversationId" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm">
          {conversations.map((c) => <option value={c.id as string} key={c.id as string}>{c.name as string}</option>)}
        </select>
        <select name="type" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"><option value="audio">Audio</option><option value="video">Video</option></select>
        <button className="rounded bg-indigo-500 px-3 py-1.5 text-sm">Start call</button>
      </form>
      <ul className="space-y-2">
        {calls.map((call) => (
          <li key={call.id as string} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
            <p>{(call.conversation_name as string) || "Conversation"} · {(call.type as string).toUpperCase()} · {(call.status as string)}</p>
            <p className="text-xs text-slate-400">Started {new Date(call.started_at as string).toLocaleString()}</p>
            <div className="mt-2 flex gap-2">
              <form action={endCallAction}><input hidden name="callId" value={call.id as string} readOnly /><input hidden name="status" value="ended" readOnly /><button className="rounded border border-slate-700 px-2 py-1 text-xs">End</button></form>
              <form action={endCallAction}><input hidden name="callId" value={call.id as string} readOnly /><input hidden name="status" value="missed" readOnly /><button className="rounded border border-slate-700 px-2 py-1 text-xs">Mark missed</button></form>
            </div>
          </li>
        ))}
      </ul>
      {!calls.length ? <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">No call history yet.</div> : null}
    </div>
  );
}
