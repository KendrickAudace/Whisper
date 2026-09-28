import { reactTrendAction } from "@/lib/actions";
import { getStore } from "@/lib/store";

export default function TrendingPage() {
  const trends = getStore().listTrends() as Array<{ id: string; category: string; title: string; description: string; score: number }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Trending</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {trends.map((trend) => (
          <article key={trend.id as string} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wider text-indigo-300">{trend.category as string}</p>
            <h2 className="text-lg font-medium">{trend.title as string}</h2>
            <p className="text-sm text-slate-300">{trend.description as string}</p>
            <p className="mt-2 text-xs text-slate-400">Score: {trend.score as number}</p>
            <form action={reactTrendAction} className="mt-2 flex gap-2 text-xs"><input hidden name="trendId" value={trend.id as string} readOnly /><input hidden name="reaction" value="🔥" readOnly /><button className="rounded border border-slate-700 px-2 py-1">Boost 🔥</button></form>
          </article>
        ))}
      </div>
      {!trends.length ? <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">No trends yet.</div> : null}
    </div>
  );
}
