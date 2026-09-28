import { blockUserAction, reportUserAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export default async function SettingsPage() {
  const user = await requireUser();
  const users = (getStore().getUsers() as Array<{ id: string; name: string }>).filter((u) => u.id !== user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings & Privacy</h1>
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
        <p className="font-medium">Presence & privacy</p>
        <p className="text-slate-400">Your last seen: {new Date(user.last_seen).toLocaleString()}. Demo encryption mode protects message content locally but is not production-grade E2EE.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <form action={blockUserAction} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
          <p className="font-medium">Block user</p>
          <select name="targetUserId" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1">{users.map((u) => <option key={u.id as string} value={u.id as string}>{u.name as string}</option>)}</select>
          <button className="rounded border border-slate-700 px-3 py-1.5">Block</button>
        </form>
        <form action={reportUserAction} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
          <p className="font-medium">Report user</p>
          <select name="targetUserId" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1">{users.map((u) => <option key={u.id as string} value={u.id as string}>{u.name as string}</option>)}</select>
          <input name="reason" required placeholder="Reason" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" />
          <button className="rounded border border-slate-700 px-3 py-1.5">Report</button>
        </form>
      </div>
    </div>
  );
}
