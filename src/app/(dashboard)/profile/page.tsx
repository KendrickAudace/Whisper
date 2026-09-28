import { updateProfileAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireUser();
  const interests = (JSON.parse(user.interests_json || "[]") as string[]).join(", ");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <form action={updateProfileAction} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label>Name<input name="name" defaultValue={user.name} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" /></label>
          <label>Age<input name="age" type="number" min={18} max={99} defaultValue={user.age} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" /></label>
        </div>
        <label>Bio<textarea name="bio" defaultValue={user.bio} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label>Location<input name="location" defaultValue={user.location} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" /></label>
          <label>Avatar URL<input name="avatarUrl" defaultValue={user.avatar_url} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" /></label>
        </div>
        <label>Interests (comma separated)<input name="interests" defaultValue={interests} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" /></label>
        <button className="rounded bg-indigo-500 px-3 py-2">Save profile</button>
      </form>
    </div>
  );
}
