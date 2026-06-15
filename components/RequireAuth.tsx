"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { accountStorageKey, cleanHandle, sessionStorageKey, type LocalAccount } from "../lib/localAuth";

type AuthState = "checking" | "allowed";

type LocalSession = {
  handle?: string;
  signedInAt?: string;
};

function readJson<T>(key: string): T | null {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function sessionMatchesAccount(session: LocalSession | null, account: LocalAccount | null) {
  if (!session?.handle || !account?.handle) return false;
  return cleanHandle(session.handle) === cleanHandle(account.handle);
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    const account = readJson<LocalAccount>(accountStorageKey);
    const session = readJson<LocalSession>(sessionStorageKey);

    if (!account) {
      window.localStorage.removeItem(sessionStorageKey);
      router.replace(`/create-den?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!account.emailVerified) {
      window.localStorage.removeItem(sessionStorageKey);
      router.replace("/verify-email");
      return;
    }

    if (!sessionMatchesAccount(session, account)) {
      window.localStorage.removeItem(sessionStorageKey);
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setAuthState("allowed");
  }, [pathname, router]);

  if (authState !== "allowed") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050608] px-6 text-zinc-100">
        <section className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 text-center shadow-2xl shadow-black/40">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-400">Kodiak Den</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Checking your Den.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">Hold tight while we verify your session.</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
