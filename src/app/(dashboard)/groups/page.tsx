import { createGroupAction, joinGroupAction, leaveGroupAction, setRoleAction, updateGroupAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export default async function GroupsPage() {
  const user = await requireUser();
  const store = getStore();
  const users = (store.getUsers() as Array<{ id: string; name: string }>).filter((u) => u.id !== user.id);
  const groups = store.listGroups() as Array<{ id: string; conversation_id: string; title: string; description: string }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Groups</h1>
      <form action={createGroupAction} className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
        <p className="font-medium">Create group</p>
        <input name="title" placeholder="Group title" required className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" />
        <input name="description" placeholder="Description" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" />
        <input name="memberIds" placeholder={`Member IDs (comma): ${users.map((u) => u.id).join(", ")}`} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" />
        <button className="rounded bg-indigo-500 px-3 py-1.5">Create</button>
      </form>
      <div className="space-y-3">
        {groups.map((group) => {
          const members = store.listMembers(group.conversation_id as string) as Array<{ user_id: string; role: string; name: string }>;
          const isMember = members.some((m) => m.user_id === user.id);
          return (
            <article key={group.id as string} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
              <p className="text-lg font-medium">{group.title as string}</p>
              <p className="text-slate-400">{group.description as string}</p>
              <p className="mt-1 text-xs text-slate-500">Members: {members.map((m) => `${m.name} (${m.role})`).join(", ")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={isMember ? leaveGroupAction : joinGroupAction}><input hidden name="groupId" value={group.id as string} readOnly /><button className="rounded border border-slate-700 px-2 py-1">{isMember ? "Leave" : "Join"}</button></form>
                <form action={updateGroupAction} className="flex gap-2"><input hidden name="groupId" value={group.id as string} readOnly /><input name="title" defaultValue={group.title as string} className="rounded border border-slate-700 bg-slate-900 px-2 py-1" /><input name="description" defaultValue={group.description as string} className="rounded border border-slate-700 bg-slate-900 px-2 py-1" /><button className="rounded border border-slate-700 px-2 py-1">Update</button></form>
              </div>
              <div className="mt-2">
                {members.map((member) => (
                  <form key={member.user_id as string} action={setRoleAction} className="mb-1 flex items-center gap-2 text-xs">
                    <input hidden name="conversationId" value={group.conversation_id as string} readOnly />
                    <input hidden name="memberId" value={member.user_id as string} readOnly />
                    <span className="w-36">{member.name as string}</span>
                    <select name="role" defaultValue={member.role as string} className="rounded border border-slate-700 bg-slate-900 px-2 py-1"><option value="member">Member</option><option value="moderator">Moderator</option></select>
                    <button className="rounded border border-slate-700 px-2 py-1">Set role</button>
                  </form>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      {!groups.length ? <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">No groups created yet.</div> : null}
    </div>
  );
}
