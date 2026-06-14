"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

const pack: string[] = [];
const storageKey = "kodiak-den-local-roars";

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

function EmptyTrail() {
  return (
    <section className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/10 text-3xl ring-1 ring-amber-500/20">
        🐾
      </div>
      <h2 className="mt-5 text-2xl font-black">Your Trail is quiet.</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
        No Roars yet. Your chronological feed starts empty until you post or add people to your Pack.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-black text-zinc-500">
        <span className="rounded-full border border-zinc-800 px-3 py-1">No algorithm</span>
        <span className="rounded-full border border-zinc-800 px-3 py-1">No fake demo feed</span>
        <span className="rounded-full border border-zinc-800 px-3 py-1">No tracking</span>
      </div>
    </section>
  );
}

function formatLocalTime() {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
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
        time: storedRoar.time ?? formatLocalTime(),
        visibility: storedRoar.visibility ?? "Public",
        text: storedRoar.text ?? "",
        pawprints: storedRoar.pawprints ?? 0,
        comments,
        hasPawprinted: storedRoar.hasPawprinted ?? false,
      };
    })
    .filter((roar) => roar.text.trim().length > 0);
}

export default function DenPage() {
  const [draft, setDraft] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("Public");
  const [roars, setRoars] = useState<Roar[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openCommentRoarIds, setOpenCommentRoarIds] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(roars));
  }, [isLoaded, roars]);

  function createRoar() {
    const cleanDraft = draft.trim();

    if (!cleanDraft) {
      return;
    }

    const roar: Roar = {
      id: crypto.randomUUID(),
      author: "Kodiak",
      handle: "@kodiak",
      time: formatLocalTime(),
      visibility,
      text: cleanDraft,
      pawprints: 0,
      comments: [],
      hasPawprinted: false,
    };

    setRoars((currentRoars) => [roar, ...currentRoars]);
    setDraft("");
  }

  function togglePawprint(roarId: string) {
    setRoars((currentRoars) =>
      currentRoars.map((roar) => {
        if (roar.id !== roarId) {
          return roar;
        }

        const hasPawprinted = !roar.hasPawprinted;

        return {
          ...roar,
          hasPawprinted,
          pawprints: hasPawprinted ? roar.pawprints + 1 : Math.max(0, roar.pawprints - 1),
        };
      }),
    );
  }

  function toggleComments(roarId: string) {
    setOpenCommentRoarIds((currentOpenIds) => ({
      ...currentOpenIds,
      [roarId]: !currentOpenIds[roarId],
    }));
  }

  function updateCommentDraft(roarId: string, value: string) {
    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [roarId]: value,
    }));
  }

  function createComment(roarId: string) {
    const cleanComment = (commentDrafts[roarId] ?? "").trim();

    if (!cleanComment) {
      return;
    }

    const comment: RoarComment = {
      id: crypto.randomUUID(),
      author: "Kodiak",
      handle: "@kodiak",
      time: formatLocalTime(),
      text: cleanComment,
    };

    setRoars((currentRoars) =>
      currentRoars.map((roar) => {
        if (roar.id !== roarId) {
          return roar;
        }

        return {
          ...roar,
          comments: [...roar.comments, comment],
        };
      }),
    );

    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [roarId]: "",
    }));

    setOpenCommentRoarIds((currentOpenIds) => ({
      ...currentOpenIds,
      [roarId]: true,
    }));
  }

  function clearLocalTrail() {
    setRoars([]);
    setCommentDrafts({});
    setOpenCommentRoarIds({});
    window.localStorage.removeItem(storageKey);
  }

  return (
    <main className="min-h-screen bg-[#050608] text-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-6">
            <KodiakBrand />

            <nav className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-3">
              {["The Trail", "My Den", "Pack", "Inner Den", "Settings"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-amber-300"
                >
                  {item}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <section className="space-y-5">
          <header className="rounded-[2rem] border border-zinc-800 bg-zinc-950/90 p-5 shadow-2xl shadow-black/30">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">The Trail</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Your chronological feed.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  Roars from your Pack, shown in order. No hidden ranking, no rage-bait engine, no creepy tracking.
                </p>
              </div>

              <Link
                href="/"
                className="rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300"
              >
                Back Home
              </Link>
            </div>
          </header>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-2xl ring-1 ring-amber-500/20">
                🐾
              </div>
              <div>
                <p className="font-black">Create a Roar</p>
                <p className="text-sm text-zinc-500">Posting as Kodiak</p>
              </div>
            </div>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What's happening on your trail?"
              className="min-h-32 w-full resize-none rounded-3xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500"
            />

            <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {(["Public", "Pack", "Inner Den"] as Visibility[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setVisibility(option)}
                    className={
                      option === visibility
                        ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300"
                        : "rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400 transition hover:border-amber-500/40 hover:text-amber-300"
                    }
                  >
                    {option}
                  </button>
                ))}
                <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-600">Image soon</span>
                <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-600">Link soon</span>
              </div>

              <button
                onClick={createRoar}
                disabled={draft.trim().length === 0}
                className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                Roar
              </button>
            </div>
          </section>

          {roars.length === 0 ? (
            <EmptyTrail />
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-3xl border border-zinc-800 bg-zinc-950/70 px-5 py-3">
                <p className="text-sm font-bold text-zinc-500">
                  {roars.length} local Roar{roars.length === 1 ? "" : "s"} on this device.
                </p>
                <button
                  onClick={clearLocalTrail}
                  className="text-xs font-black text-zinc-600 transition hover:text-red-300"
                >
                  Clear local Trail
                </button>
              </div>

              {roars.map((roar) => {
                const isCommentPanelOpen = Boolean(openCommentRoarIds[roar.id]);
                const commentDraft = commentDrafts[roar.id] ?? "";

                return (
                  <article key={roar.id} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-xl ring-1 ring-zinc-800">
                          🐻
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black">{roar.author}</p>
                            <p className="text-sm text-zinc-500">{roar.handle}</p>
                            <p className="text-sm text-zinc-600">· {roar.time}</p>
                          </div>
                          <div className="mt-2">
                            <VisibilityBadge visibility={roar.visibility} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 whitespace-pre-wrap text-lg font-semibold leading-8 text-zinc-100">{roar.text}</p>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-zinc-400">
                      <button
                        onClick={() => togglePawprint(roar.id)}
                        className={
                          roar.hasPawprinted
                            ? "rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-300 transition hover:border-amber-400"
                            : "rounded-full border border-zinc-800 px-4 py-2 transition hover:border-amber-500 hover:text-amber-300"
                        }
                      >
                        🐾 {roar.pawprints} Pawprints
                      </button>
                      <button
                        onClick={() => toggleComments(roar.id)}
                        className="rounded-full border border-zinc-800 px-4 py-2 transition hover:border-amber-500 hover:text-amber-300"
                      >
                        💬 {roar.comments.length} Comment{roar.comments.length === 1 ? "" : "s"}
                      </button>
                      <button className="rounded-full border border-zinc-800 px-4 py-2 text-zinc-600">
                        Share soon
                      </button>
                    </div>

                    {isCommentPanelOpen ? (
                      <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-4">
                        <div className="space-y-3">
                          {roar.comments.length === 0 ? (
                            <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-4 text-sm font-bold text-zinc-500">
                              No comments yet. Start the conversation locally.
                            </p>
                          ) : (
                            roar.comments.map((comment) => (
                              <div key={comment.id} className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <p className="font-black text-zinc-100">{comment.author}</p>
                                  <p className="text-zinc-500">{comment.handle}</p>
                                  <p className="text-zinc-600">· {comment.time}</p>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{comment.text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <input
                            value={commentDraft}
                            onChange={(event) => updateCommentDraft(roar.id, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                createComment(roar.id);
                              }
                            }}
                            placeholder="Write a comment..."
                            className="min-h-12 flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500"
                          />
                          <button
                            onClick={() => createComment(roar.id)}
                            disabled={commentDraft.trim().length === 0}
                            className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                          >
                            Comment
                          </button>
                        </div>
                      </section>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-5">
            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-lg font-black">Your Pack</h2>
              <p className="mt-1 text-sm text-zinc-500">People you trust on The Trail.</p>

              <div className="mt-4 space-y-3">
                {pack.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-4 text-sm font-bold leading-6 text-zinc-500">
                    Your Pack is empty. Add people later to see their Roars here.
                  </div>
                ) : (
                  pack.map((member) => (
                    <div key={member} className="flex items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-sm ring-1 ring-amber-500/20">🐾</div>
                        <p className="text-sm font-bold">{member}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-300">Pack</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5">
              <h2 className="text-lg font-black text-amber-300">Privacy Check</h2>
              <div className="mt-4 space-y-3 text-sm font-bold text-zinc-300">
                <p>✓ Local-only Roars and comments</p>
                <p>✓ Visibility before posting</p>
                <p>✓ No third-party trackers</p>
                <p>✓ Export/delete planned</p>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
