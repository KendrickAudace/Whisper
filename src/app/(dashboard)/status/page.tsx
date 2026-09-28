import { createStatusAction, deleteStatusAction } from "@/lib/actions";
import { getStore } from "@/lib/store";

export default function StatusPage() {
  const statuses = getStore().listActiveStatuses() as Array<{ id: string; name: string; content: string; expires_at: string }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Status / Stories</h1>
      <form action={createStatusAction} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 md:grid-cols-5">
        <input name="content" required placeholder="Share your current vibe" className="md:col-span-3 rounded border border-slate-700 bg-slate-900 px-3 py-1" />
        <input name="hours" type="number" min={1} max={48} defaultValue={24} className="rounded border border-slate-700 bg-slate-900 px-3 py-1" />
        <button className="rounded bg-indigo-500 px-3 py-1.5">Post story</button>
      </form>
      <ul className="space-y-2">
        {statuses.map((status) => (
          <li key={status.id as string} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
            <p className="font-medium">{status.name as string}</p>
            <p>{status.content as string}</p>
            <p className="text-xs text-slate-400">Expires {new Date(status.expires_at as string).toLocaleString()}</p>
            <form action={deleteStatusAction} className="mt-2"><input hidden name="statusId" value={status.id as string} readOnly /><button className="rounded border border-slate-700 px-2 py-1 text-xs">Delete</button></form>
          </li>
        ))}
      </ul>
      {!statuses.length ? <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">No active stories.</div> : null}
    </div>
  );
}
