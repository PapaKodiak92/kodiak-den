"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import kodiakDenLogo from "../../assets/kodiak-den-logo.png";

type Visibility = "Public" | "Pack" | "Inner Den";

type RoarComment = {
  id: string;
  author: string;
  handle: string;
  time: string;
  text: string;
};

type Roar = {
  id: string;
  author: string;
  handle: string;
  time: string;
  visibility: Visibility;
  text: string;
  pawprints: number;
  comments: RoarComment[];
  hasPawprinted: boolean;
};

const storageKey = "kodiak-den-local-roars";

const navItems = [
  { label: "The Trail", href: "/den" },
  { label: "My Den", href: "/my-den" },
  { label: "Pack", href: "/my-den" },
  { label: "Inner Den", href: "/my-den" },
  { label: "Settings", href: "/my-den" },
];

function KodiakBrand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-transparent">
        <Image
          src={kodiakDenLogo}
          alt=""
          priority
          className="h-full w-full origin-top scale-[2.25] object-contain object-top"
        />
      </div>

      <div className="leading-none">
        <div className="flex items-baseline gap-2 text-2xl font-black tracking-tight">
          <span className="text-zinc-100">Kodiak</span>
          <span className="text-amber-400">Den</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.32em] text-zinc-400">
          <span className="h-px w-6 bg-amber-500" />
          <span>Privacy-first social</span>
          <span className="h-px w-6 bg-amber-500" />
        </div>
      </div>
    </Link>
  );
}

function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return (
    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
      {visibility}
    </span>
  );
}

function normalizeStoredRoars(rawRoars: unknown): Roar[] {
  if (!Array.isArray(rawRoars)) {
    return [];
  }

  return rawRoars
    .filter((rawRoar) => rawRoar && typeof rawRoar === "object")
    .map((rawRoar) => {
      const storedRoar = rawRoar as Partial<Roar> & { comments?: unknown };
      const comments = Array.isArray(storedRoar.comments)
        ? storedRoar.comments.filter((comment): comment is RoarComment => {
            return Boolean(
              comment &&
                typeof comment === "object" &&
                "id" in comment &&
                "text" in comment &&
                typeof (comment as RoarComment).id === "string" &&
                typeof (comment as RoarComment).text === "string",
            );
          })
        : [];

      return {
        id: storedRoar.id ?? crypto.randomUUID(),
        author: storedRoar.author ?? "Kodiak",
        handle: storedRoar.handle ?? "@kodiak",
        time: storedRoar.time ?? "now",
        visibility: storedRoar.visibility ?? "Public",
        text: storedRoar.text ?? "",
        pawprints: storedRoar.pawprints ?? 0,
        comments,
        hasPawprinted: storedRoar.hasPawprinted ?? false,
      };
    })
    .filter((roar) => roar.text.trim().length > 0);
}

export default function MyDenPage() {
  const [roars, setRoars] = useState<Roar[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedRoars = window.localStorage.getItem(storageKey);

    if (savedRoars) {
      try {
        setRoars(normalizeStoredRoars(JSON.parse(savedRoars)));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    setIsLoaded(true);
  }, []);

  const stats = useMemo(() => {
    const pawprints = roars.reduce((total, roar) => total + roar.pawprints, 0);
    const comments = roars.reduce((total, roar) => total + roar.comments.length, 0);

    return {
      roars: roars.length,
      pawprints,
      comments,
    };
  }, [roars]);

  return (
    <main className="min-h-screen bg-[#050608] text-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-6">
            <KodiakBrand />

            <nav className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    item.label === "My Den"
                      ? "block rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-300 ring-1 ring-amber-500/20"
                      : "block rounded-2xl px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-amber-300"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <section className="space-y-5">
          <header className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30">
            <div className="h-36 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.32),_transparent_34%),linear-gradient(135deg,_rgba(245,158,11,0.2),_rgba(24,24,27,0.4),_rgba(5,6,8,1))]" />

            <div className="p-5 pt-0">
              <div className="-mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="flex items-end gap-4">
                  <div className="grid h-24 w-24 place-items-center rounded-[2rem] border-4 border-zinc-950 bg-amber-500/10 text-5xl shadow-2xl shadow-black/50 ring-1 ring-amber-500/20">
                    🐾
                  </div>

                  <div className="pb-2">
                    <p className="text-3xl font-black tracking-tight">Kodiak</p>
                    <p className="text-sm font-bold text-zinc-500">@kodiak</p>
                  </div>
                </div>

                <button className="rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300">
                  Edit Profile soon
                </button>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-400">
                Building Kodiak Den: a private corner of the internet for Roars, Pack, and quiet social connection without a creepy algorithm.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-2xl font-black text-amber-300">{stats.roars}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Roars</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-2xl font-black text-amber-300">{stats.pawprints}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Pawprints</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-2xl font-black text-amber-300">{stats.comments}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Comments</p>
                </div>
              </div>
            </div>
          </header>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">My Roars</p>
                <h2 className="mt-2 text-2xl font-black">Everything you have posted locally.</h2>
              </div>

              <Link
                href="/den"
                className="rounded-full bg-amber-500 px-5 py-2 text-center text-sm font-black text-zinc-950 transition hover:bg-amber-400"
              >
                Create a Roar
              </Link>
            </div>
          </section>

          {!isLoaded || roars.length === 0 ? (
            <section className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/10 text-3xl ring-1 ring-amber-500/20">
                🐻
              </div>
              <h2 className="mt-5 text-2xl font-black">Your Den is quiet.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
                Your profile starts empty. Post your first Roar on The Trail and it will show up here.
              </p>
              <Link
                href="/den"
                className="mt-5 inline-flex rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400"
              >
                Go to The Trail
              </Link>
            </section>
          ) : (
            <div className="space-y-5">
              {roars.map((roar) => (
                <article key={roar.id} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">Kodiak</p>
                    <p className="text-sm text-zinc-500">@kodiak</p>
                    <p className="text-sm text-zinc-600">· {roar.time}</p>
                  </div>
                  <div className="mt-3">
                    <VisibilityBadge visibility={roar.visibility} />
                  </div>
                  <p className="mt-5 whitespace-pre-wrap text-lg font-semibold leading-8 text-zinc-100">{roar.text}</p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-zinc-400">
                    <span className="rounded-full border border-zinc-800 px-4 py-2">🐾 {roar.pawprints} Pawprints</span>
                    <span className="rounded-full border border-zinc-800 px-4 py-2">💬 {roar.comments.length} Comments</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-5">
            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-lg font-black">Profile Privacy</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Your Den should show only what you choose to share.
              </p>
              <div className="mt-4 space-y-3 text-sm font-bold text-zinc-300">
                <p>✓ Roars keep their visibility labels</p>
                <p>✓ Bio and profile edits are local mockups</p>
                <p>✓ Export/delete planned before real launch</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5">
              <h2 className="text-lg font-black text-amber-300">Coming Next</h2>
              <div className="mt-4 space-y-3 text-sm font-bold text-zinc-300">
                <p>Edit profile</p>
                <p>Profile avatar</p>
                <p>Banner image</p>
                <p>Delete or edit Roars</p>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
