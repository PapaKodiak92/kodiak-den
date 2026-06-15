"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  accountIsLocked,
  clearSignedInSession,
  identifierMatches,
  issueEmailVerification,
  lockoutText,
  readAccount,
  setSignedInSession,
  verifyCredential,
  writeAccount,
} from "../../lib/localAuth";

const maxFailedSignInAttempts = 5;
const lockoutMinutes = 10;

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const user = identifier.trim();

      if (!user) {
        setError("Enter your email or handle.");
        return;
      }

      if (!password) {
        setError("Enter your password.");
        return;
      }

      const account = readAccount();

      if (!account || !identifierMatches(account, user)) {
        clearSignedInSession();
        setError("Email, handle, or password is incorrect.");
        return;
      }

      if (accountIsLocked(account)) {
        clearSignedInSession();
        setError(lockoutText(account));
        return;
      }

      const passwordMatches = await verifyCredential(account, password);

      if (!passwordMatches) {
        const failedSignInAttempts = (account.failedSignInAttempts ?? 0) + 1;
        const lockedUntil =
          failedSignInAttempts >= maxFailedSignInAttempts
            ? new Date(Date.now() + lockoutMinutes * 60_000).toISOString()
            : undefined;

        writeAccount({
          ...account,
          failedSignInAttempts,
          lockedUntil,
        });

        clearSignedInSession();
        setError(
          lockedUntil
            ? `Too many failed attempts. Try again in ${lockoutMinutes} minutes.`
            : "Email, handle, or password is incorrect.",
        );
        return;
      }

      if (!account.emailVerified) {
        issueEmailVerification(account);
        clearSignedInSession();
        router.push("/verify-email");
        return;
      }

      const unlockedAccount = {
        ...account,
        failedSignInAttempts: 0,
        lockedUntil: undefined,
      };

      writeAccount(unlockedAccount);
      setSignedInSession(unlockedAccount);
      router.push("/den");
    } finally {
      setBusy(false);
    }
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
            Sign in with your email or handle and password to walk The Trail.
          </p>
        </div>

        <form onSubmit={signIn} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Email or handle</span>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500"
            />
          </label>

          <label className="mt-4 block space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500"
            />
          </label>

          <div className="mt-4 flex items-center justify-end text-sm font-bold">
            <Link href="/forgot-password" className="text-amber-300 hover:text-amber-200">
              Forgot password?
            </Link>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
              {error}
            </p>
          ) : null}

          <button
            disabled={busy}
            className="mt-6 w-full rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Checking..." : "Sign In"}
          </button>

          <p className="mt-5 text-center text-sm font-bold text-zinc-500">
            New to Kodiak Den?{" "}
            <Link href="/create-den" className="text-amber-300 hover:text-amber-200">
              Create your Den
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
