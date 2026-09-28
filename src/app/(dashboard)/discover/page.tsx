import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export default async function DiscoverPage() {
  const user = await requireUser();
  const profiles = (getStore().getUsers() as Array<{ id: string; name: string; age: number; gender: string; bio: string; location: string; interests_json: string }>).filter(
    (u) => u.id !== user.id,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Discover</h1>
      <p className="text-sm text-slate-400">Find people near you and start meaningful conversations.</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => {
          const interests = JSON.parse(profile.interests_json || "[]") as string[];
          return (
            <article key={profile.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-medium">{profile.name}, {profile.age}</p>
              <p className="text-sm text-slate-400">{profile.location} · {profile.gender}</p>
              <p className="mt-2 text-sm">{profile.bio}</p>
              <p className="mt-2 text-xs text-indigo-300">{interests.join(" • ") || "No interests added"}</p>
            </article>
          );
        })}
      </div>
      {!profiles.length ? <p className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">No profiles match your filters yet.</p> : null}
    </div>
  );
}
