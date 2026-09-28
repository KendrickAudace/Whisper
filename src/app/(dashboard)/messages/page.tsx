import {
  createConversationAction,
  createMessageAction,
  deleteCodeAction,
  deleteMessageAction,
  editMessageAction,
  pinMessageAction,
  upsertCodeAction,
} from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { demoEncryptionAdapter } from "@/lib/adapters/encryption";
import { getStore } from "@/lib/store";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string; q?: string; code?: string; codeSearch?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const store = getStore();
  const conversations = store.listConversationsForUser(user.id) as Array<{ id: string; name: string; unread_count: number }>;
  const activeConversationId = params.conversationId || (conversations[0]?.id as string | undefined);
  const query = (params.q || "").trim();
  const codeQuery = (params.codeSearch || "").trim();

  const messages = (activeConversationId ? store.listMessages(activeConversationId, query) : []) as Array<{
    id: string;
    sender_name: string;
    created_at: string;
    body: string;
    encrypted_body: string;
    is_pinned: number;
    attachment_json: string | null;
  }>;
  if (activeConversationId) store.markConversationRead(activeConversationId, user.id);
  const mappings = (activeConversationId ? store.listCodeMappings(activeConversationId, codeQuery) : []) as Array<{ id: string; code: string; meaning: string }>;
  const resolved = activeConversationId && params.code ? store.resolveCode(activeConversationId, params.code) : undefined;
  const allUsers = (store.getUsers() as Array<{ id: string; name: string }>).filter((u) => u.id !== user.id);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-slate-800 bg-slate-950 p-3">
        <h1 className="text-xl font-semibold">Messages</h1>
        <form action={createConversationAction} className="mt-3 space-y-2 rounded-lg border border-slate-800 p-2 text-sm">
          <input name="name" placeholder="Conversation name" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" />
          <select name="memberIds" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1">
            {allUsers.map((u) => <option value={u.id as string} key={u.id as string}>{u.name as string}</option>)}
          </select>
          <button className="w-full rounded bg-indigo-500 px-3 py-1.5">New chat</button>
        </form>
        <ul className="mt-3 space-y-1 text-sm">
          {conversations.length === 0 ? <li className="rounded-lg border border-dashed border-slate-700 p-3 text-slate-400">No chats yet</li> : null}
          {conversations.map((conversation) => (
            <li key={conversation.id as string}>
              <a
                href={`/messages?conversationId=${conversation.id as string}`}
                className={`block rounded-lg border px-3 py-2 ${activeConversationId === conversation.id ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-900"}`}
              >
                <p className="font-medium">{conversation.name as string}</p>
                <p className="text-xs text-slate-400">Unread {Number(conversation.unread_count || 0)}</p>
              </a>
            </li>
          ))}
        </ul>
      </aside>
      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        {!activeConversationId ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">Select or create a conversation to start messaging.</div>
        ) : (
          <>
            <header className="flex flex-wrap items-end gap-2">
              <h2 className="text-lg font-semibold">Conversation</h2>
              <form className="ml-auto flex gap-2 text-sm">
                <input name="conversationId" value={activeConversationId} readOnly hidden />
                <input name="q" defaultValue={query} placeholder="Search messages" className="rounded border border-slate-700 bg-slate-900 px-2 py-1" />
                <button className="rounded border border-slate-700 px-2 py-1">Filter</button>
              </form>
            </header>
            <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 p-3">
              {messages.length === 0 ? <p className="text-sm text-slate-400">No messages yet. Send the first one.</p> : null}
              {messages.map((message) => {
                const attachment = message.attachment_json ? JSON.parse(message.attachment_json) as { url: string; kind: string } : null;
                return (
                  <article key={message.id as string} className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-sm">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{message.sender_name as string}</span>
                      <span>{new Date(message.created_at as string).toLocaleString()}</span>
                    </div>
                    <p className="mt-1">{demoEncryptionAdapter.decrypt(message.encrypted_body as string)}</p>
                    {attachment?.url ? <a className="mt-1 block text-xs text-indigo-300 underline" href={attachment.url} target="_blank">Attachment ({attachment.kind})</a> : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <form action={pinMessageAction}><input hidden name="messageId" value={message.id as string} readOnly /><input hidden name="pinned" value={message.is_pinned ? "false" : "true"} readOnly /><button className="rounded border border-slate-700 px-2 py-0.5">{message.is_pinned ? "Unpin" : "Pin"}</button></form>
                      <form action={deleteMessageAction}><input hidden name="messageId" value={message.id as string} readOnly /><button className="rounded border border-slate-700 px-2 py-0.5">Delete</button></form>
                    </div>
                    <form action={editMessageAction} className="mt-2 flex gap-2 text-xs">
                      <input hidden name="messageId" value={message.id as string} readOnly />
                      <input name="body" defaultValue={message.body as string} className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1" />
                      <button className="rounded border border-slate-700 px-2 py-1">Edit</button>
                    </form>
                  </article>
                );
              })}
            </div>
            <form action={createMessageAction} className="space-y-2 rounded-lg border border-slate-800 p-3">
              <input hidden name="conversationId" value={activeConversationId} readOnly />
              <input name="body" placeholder="Type a message" required className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
              <input name="attachmentUrl" placeholder="Attachment URL (optional)" className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" />
              <button className="rounded bg-indigo-500 px-3 py-2 text-sm font-medium">Send (optimistic)</button>
            </form>
            <div className="grid gap-3 rounded-lg border border-slate-800 p-3 lg:grid-cols-2">
              <section className="space-y-2">
                <h3 className="font-medium">Code manager (private to this chat)</h3>
                <form action={upsertCodeAction} className="space-y-2 text-sm">
                  <input hidden name="conversationId" value={activeConversationId} readOnly />
                  <input name="code" placeholder="Code (e.g. 32)" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" />
                  <input name="meaning" placeholder="Meaning" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" />
                  <button className="rounded border border-slate-700 px-2 py-1">Save code</button>
                </form>
                <form className="flex gap-2 text-sm">
                  <input hidden name="conversationId" value={activeConversationId} readOnly />
                  <input name="codeSearch" defaultValue={codeQuery} placeholder="Search code mappings" className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1" />
                  <button className="rounded border border-slate-700 px-2 py-1">Search</button>
                </form>
                <ul className="space-y-1 text-sm">
                  {mappings.map((mapping) => (
                    <li key={mapping.id as string} className="flex items-center justify-between rounded border border-slate-800 px-2 py-1">
                      <span><strong>{mapping.code as string}</strong> → {mapping.meaning as string}</span>
                      <form action={deleteCodeAction}><input hidden name="id" value={mapping.id as string} readOnly /><input hidden name="conversationId" value={activeConversationId} readOnly /><button className="text-rose-300">Delete</button></form>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="space-y-2">
                <h3 className="font-medium">Resolve code while composing</h3>
                <form className="flex gap-2 text-sm">
                  <input hidden name="conversationId" value={activeConversationId} readOnly />
                  <input name="code" defaultValue={params.code || ""} placeholder="Enter code" className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1" />
                  <button className="rounded border border-slate-700 px-2 py-1">Resolve</button>
                </form>
                <p className="rounded border border-slate-800 bg-slate-900 p-2 text-sm text-slate-300">
                  {params.code ? `${params.code} means: ${resolved?.meaning || "No mapping in this conversation"}` : "Enter a code to preview its meaning."}
                </p>
                <p className="text-xs text-slate-400">Meanings remain isolated per conversation metadata.</p>
              </section>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
