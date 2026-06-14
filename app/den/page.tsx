"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import kodiakDenLogo from "../../assets/kodiak-den-logo.png";

type Visibility = "Public" | "Pack" | "Inner Den";
type Reaction = "up" | "down" | null;

type Comment = {
  id: string;
  text: string;
  time: string;
};

type Roar = {
  id: string;
  text: string;
  time: string;
  editedAt?: string;
  visibility: Visibility;
  reaction: Reaction;
  pawsUp: number;
  pawsDown: number;
  comments: Comment[];
};

const storageKey = "kodiak-den-local-roars";
const visibilityOptions: Visibility[] = ["Public", "Pack", "Inner Den"];
const navItems = [
  { label: "The Trail", href: "/den" },
  { label: "My Den", href: "/my-den" },
  { label: "Pack", href: "/pack" },
];

function now() {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date());
}

function KodiakBrand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-transparent">
        <Image src={kodiakDenLogo} alt="" priority className="h-full w-full origin-top scale-[2.25] object-contain object-top" />
      </div>
      <div className="leading-none">
        <div className="flex items-baseline gap-2 text-2xl font-black tracking-tight">
          <span>Kodiak</span>
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

function VisibilityPill({ value }: { value: Visibility }) {
  return <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">{value}</span>;
}

function Avatar() {
  return <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 font-black text-amber-300 ring-1 ring-amber-500/20">KD</div>;
}

function normalizeRoars(value: unknown): Roar[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const roar = item as Partial<Roar> & { pawprints?: number; hasPawprinted?: boolean };
      const legacyPaws = typeof roar.pawprints === "number" ? roar.pawprints : 0;
      const reaction = roar.reaction === "up" || roar.reaction === "down" ? roar.reaction : roar.hasPawprinted ? "up" : null;

      return {
        id: roar.id ?? crypto.randomUUID(),
        text: roar.text ?? "",
        time: roar.time ?? now(),
        editedAt: typeof roar.editedAt === "string" ? roar.editedAt : undefined,
        visibility: roar.visibility ?? "Public",
        reaction,
        pawsUp: roar.pawsUp ?? legacyPaws,
        pawsDown: roar.pawsDown ?? 0,
        comments: Array.isArray(roar.comments) ? roar.comments.filter((comment): comment is Comment => Boolean(comment && typeof comment === "object" && "text" in comment)) : [],
      };
    })
    .filter((roar) => roar.text.trim().length > 0);
}

export default function DenPage() {
  const [isReady, setIsReady] = useState(false);
  const [roars, setRoars] = useState<Roar[]>([]);
  const [draft, setDraft] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("Public");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editVisibility, setEditVisibility] = useState<Visibility>("Public");
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        setRoars(normalizeRoars(JSON.parse(saved)));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) window.localStorage.setItem(storageKey, JSON.stringify(roars));
  }, [isReady, roars]);

  function createRoar() {
    const text = draft.trim();
    if (!text) return;

    setRoars((current) => [
      {
        id: crypto.randomUUID(),
        text,
        time: now(),
        visibility,
        reaction: null,
        pawsUp: 0,
        pawsDown: 0,
        comments: [],
      },
      ...current,
    ]);
    setDraft("");
  }

  function react(roarId: string, nextReaction: Exclude<Reaction, null>) {
    setRoars((current) =>
      current.map((roar) => {
        if (roar.id !== roarId) return roar;
        const removing = roar.reaction === nextReaction;
        const previousUp = roar.reaction === "up" ? 1 : 0;
        const previousDown = roar.reaction === "down" ? 1 : 0;
        const nextUp = !removing && nextReaction === "up" ? 1 : 0;
        const nextDown = !removing && nextReaction === "down" ? 1 : 0;

        return {
          ...roar,
          reaction: removing ? null : nextReaction,
          pawsUp: Math.max(0, roar.pawsUp - previousUp + nextUp),
          pawsDown: Math.max(0, roar.pawsDown - previousDown + nextDown),
        };
      }),
    );
  }

  function startEdit(roar: Roar) {
    setEditingId(roar.id);
    setEditDraft(roar.text);
    setEditVisibility(roar.visibility);
  }

  function saveEdit(roarId: string) {
    const text = editDraft.trim();
    if (!text) return;

    setRoars((current) => current.map((roar) => (roar.id === roarId ? { ...roar, text, visibility: editVisibility, editedAt: now() } : roar)));
    setEditingId(null);
    setEditDraft("");
  }

  function removeRoar(roarId: string) {
    if (!window.confirm("Remove this Roar?")) return;
    setRoars((current) => current.filter((roar) => roar.id !== roarId));
  }

  function addComment(roarId: string) {
    const text = (commentDrafts[roarId] ?? "").trim();
    if (!text) return;

    setRoars((current) => current.map((roar) => (roar.id === roarId ? { ...roar, comments: [...roar.comments, { id: crypto.randomUUID(), text, time: now() }] } : roar)));
    setCommentDrafts((current) => ({ ...current, [roarId]: "" }));
    setOpenComments((current) => ({ ...current, [roarId]: true }));
  }

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
                  className={item.label === "The Trail" ? "block rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-300 ring-1 ring-amber-500/20" : "block rounded-2xl px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-amber-300"}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <section className="space-y-5">
          <header className="rounded-[2rem] border border-zinc-800 bg-zinc-950/90 p-5 shadow-2xl shadow-black/30">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">The Trail</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Your chronological feed.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Roars from your Pack, shown in the order they were shared.</p>
          </header>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center gap-4">
              <Avatar />
              <div>
                <p className="font-black">Create a Roar</p>
                <p className="text-sm text-zinc-500">Posting as Kodiak</p>
              </div>
            </div>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="What's happening on your trail?" className="min-h-32 w-full resize-none rounded-3xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500" />
            <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {visibilityOptions.map((option) => (
                  <button key={option} onClick={() => setVisibility(option)} className={option === visibility ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300" : "rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400 transition hover:border-amber-500/40 hover:text-amber-300"}>
                    {option}
                  </button>
                ))}
              </div>
              <button onClick={createRoar} disabled={draft.trim().length === 0} className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">Roar</button>
            </div>
          </section>

          {roars.length === 0 ? (
            <section className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
              <h2 className="text-2xl font-black">Your Trail is quiet.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">Share your first Roar or add people to your Pack.</p>
            </section>
          ) : (
            <div className="space-y-5">
              {roars.map((roar) => {
                const isEditing = editingId === roar.id;
                const commentsOpen = Boolean(openComments[roar.id]);
                const commentDraft = commentDrafts[roar.id] ?? "";

                return (
                  <article key={roar.id} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black">Kodiak</p>
                            <p className="text-sm text-zinc-500">@kodiak</p>
                            <p className="text-sm text-zinc-600">- {roar.time}</p>
                            {roar.editedAt ? <p className="text-sm text-zinc-600">- edited {roar.editedAt}</p> : null}
                          </div>
                          <div className="mt-2"><VisibilityPill value={roar.visibility} /></div>
                        </div>
                      </div>
                      {!isEditing ? (
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(roar)} className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-black text-zinc-500 transition hover:border-amber-500/40 hover:text-amber-300">Edit</button>
                          <button onClick={() => removeRoar(roar.id)} className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-black text-zinc-500 transition hover:border-red-500/50 hover:text-red-300">Remove</button>
                        </div>
                      ) : null}
                    </div>

                    {isEditing ? (
                      <section className="mt-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4">
                        <textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} className="min-h-28 w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm font-medium text-zinc-100 outline-none focus:border-amber-500" />
                        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div className="flex flex-wrap gap-2">
                            {visibilityOptions.map((option) => (
                              <button key={option} onClick={() => setEditVisibility(option)} className={option === editVisibility ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300" : "rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400 transition hover:border-amber-500/40 hover:text-amber-300"}>
                                {option}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingId(null)} className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-zinc-600">Cancel</button>
                            <button onClick={() => saveEdit(roar.id)} disabled={editDraft.trim().length === 0} className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">Save Roar</button>
                          </div>
                        </div>
                      </section>
                    ) : (
                      <p className="mt-5 whitespace-pre-wrap text-lg font-semibold leading-8 text-zinc-100">{roar.text}</p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-zinc-400">
                      <button onClick={() => react(roar.id, "up")} className={roar.reaction === "up" ? "rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-300" : "rounded-full border border-zinc-800 px-4 py-2 transition hover:border-amber-500 hover:text-amber-300"}>{roar.pawsUp} Paws Up</button>
                      <button onClick={() => react(roar.id, "down")} className={roar.reaction === "down" ? "rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300" : "rounded-full border border-zinc-800 px-4 py-2 transition hover:border-red-500/60 hover:text-red-300"}>{roar.pawsDown} Paws Down</button>
                      <button onClick={() => setOpenComments((current) => ({ ...current, [roar.id]: !current[roar.id] }))} className="rounded-full border border-zinc-800 px-4 py-2 transition hover:border-amber-500 hover:text-amber-300">{roar.comments.length} Comment{roar.comments.length === 1 ? "" : "s"}</button>
                    </div>

                    {commentsOpen ? (
                      <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-4">
                        <div className="space-y-3">
                          {roar.comments.length === 0 ? <p className="text-sm font-bold text-zinc-500">No comments yet.</p> : null}
                          {roar.comments.map((comment) => (
                            <div key={comment.id} className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                              <p className="text-sm font-black">Kodiak <span className="font-bold text-zinc-600">- {comment.time}</span></p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <input value={commentDraft} onChange={(event) => setCommentDrafts((current) => ({ ...current, [roar.id]: event.target.value }))} placeholder="Write a comment..." className="min-h-12 flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500" />
                          <button onClick={() => addComment(roar.id)} disabled={commentDraft.trim().length === 0} className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">Comment</button>
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
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-4 text-sm font-bold leading-6 text-zinc-500">Your Pack is empty.</div>
              <Link href="/pack" className="mt-4 block rounded-2xl bg-amber-500 px-4 py-3 text-center text-sm font-black text-zinc-950 transition hover:bg-amber-400">Find People</Link>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
