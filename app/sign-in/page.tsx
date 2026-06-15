"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const accountStorageKey = "kodiak-den-account";
const sessionStorageKey = "kodiak-den-session";

function cleanHandle(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
  return cleaned ? (cleaned.startsWith("@") ? cleaned : `@${cleaned}`) : "@kodiak";
}

function readAccount() {
  try {
    const saved = window.localStorage.getItem(accountStorageKey);
    return saved ? (JSON.parse(saved) as { email?: string; handle?: string }) : null;
  } catch {
    return null;
  }
}

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const user = identifier.trim();
    if (!user) return setError("Enter your email or handle.");

    const account = readAccount();
    const handle = account?.email?.toLowerCase() === user.toLowerCase() && account.handle ? cleanHandle(account.handle) : cleanHandle(user);

    window.localStorage.setItem(
      sessionStorageKey,
      JSON.stringify({ signedInAt: new Date().toISOString(), handle }),
    );

    router.push("/den");
  }

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-8 text-zinc-100">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <Link href="/" className="text-sm font-black text-amber-300 transition hover:text-amber-200">
            Kodiak Den
          </Link>
          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl">Welcome back.</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-zinc-400">
            Sign in to walk The Trail, manage your Den, and share with your Pack.
          </p>
        </div>

        <form onSubmit={signIn} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Email or handle</span>
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
          </label>

          <div className="mt-4 flex items-center justify-end text-sm font-bold">
            <Link href="/support" className="text-amber-300 hover:text-amber-200">Need help signing in?</Link>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</p> : null}

          <button className="mt-6 w-full rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400">
            Sign In
          </button>

          <p className="mt-5 text-center text-sm font-bold text-zinc-500">
            New to Kodiak Den? <Link href="/create-den" className="text-amber-300 hover:text-amber-200">Create your Den</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
