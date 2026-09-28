import { adClickAction } from "@/lib/actions";
import { demoAdsAdapter } from "@/lib/adapters/ads";
import { getStore } from "@/lib/store";

export default function AdsPage() {
  const store = getStore();
  const ads = store.listAds() as Array<{
    id: string;
    category: string;
    title: string;
    body: string;
    sponsored_by: string;
    impressions: number;
    clicks: number;
    cta_label: string;
  }>;
  ads.forEach((ad) => demoAdsAdapter.trackImpression(ad.id as string));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ads & Promotions</h1>
      <p className="text-sm text-slate-400">Sponsored content is clearly labeled. Tracking adapter: {demoAdsAdapter.label}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {ads.map((ad) => (
          <article key={ad.id as string} className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Sponsored · {ad.category as string}</p>
            <h2 className="text-lg font-medium">{ad.title as string}</h2>
            <p className="text-sm text-slate-300">{ad.body as string}</p>
            <p className="mt-1 text-xs text-slate-400">By {ad.sponsored_by as string} · Impressions {ad.impressions as number} · Clicks {ad.clicks as number}</p>
            <form action={adClickAction} className="mt-3"><input hidden name="adId" value={ad.id as string} readOnly /><button className="rounded bg-amber-500 px-3 py-1.5 text-sm text-slate-900">{ad.cta_label as string}</button></form>
          </article>
        ))}
      </div>
      {!ads.length ? <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">No promotions available.</div> : null}
    </div>
  );
}
