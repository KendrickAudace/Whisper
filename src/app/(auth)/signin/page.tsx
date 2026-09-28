"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction } from "@/lib/actions";

export default function SignInPage() {
  const [state, action, pending] = useActionState(signInAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <form action={action} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Sign in to Whisper</h1>
        <p className="text-sm text-slate-400">Demo: alice@whisper.local / demo12345</p>
        <label className="block text-sm">Email<input name="email" type="email" required className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <label className="block text-sm">Password<input name="password" type="password" required className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        {state?.error ? <p className="rounded-lg border border-rose-600 bg-rose-950/40 p-2 text-sm text-rose-200">{state.error}</p> : null}
        <button disabled={pending} className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 disabled:opacity-60">{pending ? "Signing in..." : "Sign in"}</button>
        <p className="text-sm text-slate-400">No account? <Link href="/signup" className="text-indigo-300 underline">Create one</Link></p>
      </form>
    </div>
  );
}
