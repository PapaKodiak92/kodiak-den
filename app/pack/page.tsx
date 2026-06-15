"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type PackMember = {
  id: string;
  name: string;
  handle: string;
};

const packStorageKey = "kodiak-den-pack-members";

function cleanHandle(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
  return cleaned ? (cleaned.startsWith("@") ? cleaned : `@${cleaned}`) : "@pack-member";
}

function normalizePack(raw: unknown): PackMember[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const member = item as Partial<PackMember>;
      return {
        id: member.id ?? crypto.randomUUID(),
        name: typeof member.name === "string" && member.name.trim() ? member.name.trim().slice(0, 40) : "Pack Member",
        handle: typeof member.handle === "string" ? cleanHandle(member.handle) : "@pack-member",
      };
    });
}

export default function PackPage() {
  const [members, setMembers] = useState<PackMember[]>([]);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(packStorageKey);
    if (saved) setMembers(normalizePack(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(packStorageKey, JSON.stringify(members));
  }, [members]);

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const memberName = name.trim();
    if (!memberName) return;

    setMembers((current) => [
      { id: crypto.randomUUID(), name: memberName.slice(0, 40), handle: cleanHandle(handle || memberName) },
      ...current,
    ]);
    setName("");
    setHandle("");
  }

  function removeMember(memberId: string) {
    setMembers((current) => current.filter((member) => member.id !== memberId));
  }

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-8 text-zinc-100">
      <section className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-400">Pack</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight">Your Pack</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Add the people you trust most. Pack-only Roars are built around this circle.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/den" className="rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300">
              The Trail
            </Link>
            <Link href="/my-den" className="rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300">
              My Den
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={addMember} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-2xl font-black">Add to Pack</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Start with a name and handle.</p>

            <label className="mt-5 block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Handle</span>
              <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@handle" className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none placeholder:text-zinc-600 focus:border-amber-500" />
            </label>

            <button className="mt-5 w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400">
              Add Pack Member
            </button>
          </form>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">Pack Members</h2>
              <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-black text-zinc-500">{members.length}</span>
            </div>

            {members.length === 0 ? (
              <div className="mt-5 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
                <h3 className="text-xl font-black">Your Pack is empty.</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
                  Add people you trust to shape who sees Pack-only Roars.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 font-black text-amber-300 ring-1 ring-amber-500/20">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black">{member.name}</p>
                        <p className="text-sm font-bold text-zinc-500">{member.handle}</p>
                      </div>
                    </div>
                    <button onClick={() => removeMember(member.id)} className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-black text-zinc-500 transition hover:border-red-500/50 hover:text-red-300">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
