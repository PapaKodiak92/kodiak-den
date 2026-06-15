"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);

  function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim()) return;
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-8 text-zinc-100">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center">
        <form onSubmit={requestReset} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
          <Link href="/sign-in" className="text-sm font-black text-amber-300 transition hover:text-amber-200">Back to Sign In</Link>
          <h1 className="mt-6 text-4xl font-black tracking-tight">Reset access to your Den.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            Enter your email or handle. We will send a reset code after this is connected to email delivery.
          </p>
          <label className="mt-6 block space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Email or handle</span>
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
          </label>
          {sent ? <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">If that Den exists, a reset code has been sent.</p> : null}
          <button className="mt-6 w-full rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400">
            Send Reset Code
          </button>
        </form>
      </section>
    </main>
  );
}
