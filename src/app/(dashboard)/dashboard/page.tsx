import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export default async function DashboardPage() {
  const user = await requireUser();
  const store = getStore();
  const conversations = store.listConversationsForUser(user.id) as Array<{ id: string; name: string; unread_count: number }>;
  const statuses = (store.listActiveStatuses() as Array<{ id: string; name: string; content: string }>).slice(0, 4);
  const trends = (store.listTrends() as Array<{ id: string; title: string; score: number }>).slice(0, 3);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-400">Welcome back. Profile completion: {user.profile_completed ? "Complete" : "Needs updates"}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h2 className="text-sm text-slate-300">Active conversations</h2>
          <p className="mt-2 text-2xl font-bold">{conversations.length}</p>
          <Link href="/messages" className="mt-3 inline-block text-sm text-indigo-300 underline">Open inbox</Link>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h2 className="text-sm text-slate-300">Live stories</h2>
          <p className="mt-2 text-2xl font-bold">{statuses.length}</p>
          <Link href="/status" className="mt-3 inline-block text-sm text-indigo-300 underline">Watch stories</Link>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h2 className="text-sm text-slate-300">Current plan</h2>
          <p className="mt-2 text-2xl font-bold capitalize">{user.plan_tier}</p>
          <Link href="/plans" className="mt-3 inline-block text-sm text-indigo-300 underline">Manage plan</Link>
        </article>
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h2 className="mb-3 text-lg font-medium">Recent statuses</h2>
          {statuses.length === 0 ? <p className="text-sm text-slate-400">No statuses yet.</p> : (
            <ul className="space-y-2 text-sm">
              {statuses.map((status) => <li key={status.id} className="rounded-lg border border-slate-800 p-2">{status.name}: {status.content}</li>)}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h2 className="mb-3 text-lg font-medium">Trending now</h2>
          <ul className="space-y-2 text-sm">
            {trends.map((trend) => <li key={trend.id} className="rounded-lg border border-slate-800 p-2">{trend.title} · {trend.score} boosts</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}
