"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction } from "@/lib/actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUpAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <form action={action} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Create your Whisper account</h1>
        <label className="block text-sm">Name<input name="name" required className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <label className="block text-sm">Email<input name="email" type="email" required className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <label className="block text-sm">Password<input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Gender<select name="gender" defaultValue="female" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"><option value="female">Female</option><option value="male">Male</option></select></label>
          <label className="block text-sm">Age<input name="age" type="number" min={18} max={99} defaultValue={25} required className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /></label>
        </div>
        {state?.error ? <p className="rounded-lg border border-rose-600 bg-rose-950/40 p-2 text-sm text-rose-200">{state.error}</p> : null}
        <button disabled={pending} className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 disabled:opacity-60">{pending ? "Creating..." : "Create account"}</button>
        <p className="text-sm text-slate-400">Already have an account? <Link href="/signin" className="text-indigo-300 underline">Sign in</Link></p>
      </form>
    </div>
  );
}
