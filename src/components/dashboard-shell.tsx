import Link from "next/link";
import { ReactNode } from "react";
import { signOutAction } from "@/lib/actions";

const navItems = [
  ["/dashboard", "Home"],
  ["/discover", "Discover"],
  ["/matches", "Matches"],
  ["/messages", "Messages"],
  ["/calls", "Calls"],
  ["/groups", "Groups"],
  ["/status", "Status"],
  ["/trending", "Trending"],
  ["/plans", "Plans"],
  ["/ads", "Ads"],
  ["/profile", "Profile"],
  ["/settings", "Settings"],
] as const;

export function DashboardShell({ children, userName }: { children: ReactNode; userName: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-4 p-4">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-56 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:block">
          <p className="mb-3 text-sm text-slate-300">Hi, {userName}</p>
          <nav className="space-y-1 text-sm">
            {navItems.map(([href, label]) => (
              <Link key={href} href={href} className="block rounded-lg px-3 py-2 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-400">
                {label}
              </Link>
            ))}
          </nav>
          <form action={signOutAction} className="mt-4">
            <button className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm hover:bg-slate-800">Sign out</button>
          </form>
        </aside>
        <main className="mb-16 flex-1 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:mb-0">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-900/95 p-2 md:hidden">
        <div className="grid grid-cols-6 gap-1 text-xs">
          {navItems.slice(0, 6).map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-2 py-2 text-center hover:bg-slate-800">
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
