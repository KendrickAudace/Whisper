import { completeCheckoutAction, upgradePlanAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getStore, PlanTier } from "@/lib/store";

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ checkout?: string; tier?: PlanTier; checkoutId?: string; uid?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const store = getStore();
  const plans = store.listPlans() as Array<{ id: string; tier: PlanTier; price_cents: number; features_json: string }>;
  const sub = store.getSubscription(user.id) as { plan_tier: PlanTier; status: string } | undefined;

  if (params.checkout === "success" && params.tier && params.uid === user.id) {
    await completeCheckoutAction(params.tier, user.id);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Plans</h1>
      <p className="text-sm text-slate-400">Current subscription: <span className="capitalize">{sub?.plan_tier || "free"}</span> ({sub?.status || "active"})</p>
      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((plan) => {
          const features = JSON.parse(plan.features_json as string) as string[];
          const tier = plan.tier as PlanTier;
          return (
            <article key={plan.id as string} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h2 className="text-lg font-medium capitalize">{tier}</h2>
              <p className="text-sm text-slate-400">${((plan.price_cents as number) / 100).toFixed(2)} / month</p>
              <ul className="mt-2 space-y-1 text-sm">{features.map((f) => <li key={f}>• {f}</li>)}</ul>
              <form action={upgradePlanAction} className="mt-3"><input hidden name="tier" value={tier} readOnly /><button disabled={sub?.plan_tier === tier} className="rounded bg-indigo-500 px-3 py-1.5 text-sm disabled:opacity-50">{sub?.plan_tier === tier ? "Current" : "Upgrade"}</button></form>
            </article>
          );
        })}
      </div>
      {params.checkoutId ? <p className="rounded-lg border border-emerald-700 bg-emerald-950/50 p-3 text-sm text-emerald-200">Checkout {params.checkoutId} completed in demo mode.</p> : null}
    </div>
  );
}
