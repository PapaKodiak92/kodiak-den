import Image from "next/image";
import Link from "next/link";
import kodiakDenLogo from "../../assets/kodiak-den-logo.png";

const roars = [
  {
    author: "Kodiak",
    handle: "@kodiak",
    time: "just now",
    visibility: "Public",
    text: "Welcome to The Trail. Chronological, calm, private by default, and built for your Pack instead of an algorithm.",
    pawprints: 128,
    comments: 24,
  },
  {
    author: "Mara Stone",
    handle: "@mara",
    time: "12m",
    visibility: "Pack",
    text: "The visibility badge before posting is exactly what social media should have had from day one.",
    pawprints: 42,
    comments: 8,
  },
  {
    author: "River Hale",
    handle: "@river",
    time: "29m",
    visibility: "Inner Den",
    text: "No rage bait feed. No creepy tracking. Just people I actually care about. That is the move.",
    pawprints: 61,
    comments: 13,
  },
];

const pack = ["Kodiak", "Mara Stone", "River Hale", "Ash Wilder"];

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

function VisibilityBadge({ visibility }: { visibility: string }) {
  const label = visibility === "Inner Den" ? "Inner Den" : visibility;

  return (
    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
      {label}
    </span>
  );
}

export default function DenPage() {
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
              placeholder="What's happening on your trail?"
              className="min-h-32 w-full resize-none rounded-3xl border border-zinc-800 bg-zinc-900 p-4 text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500"
            />

            <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                <VisibilityBadge visibility="Public" />
                <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">Image</span>
                <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">Link</span>
              </div>

              <button className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400">
                Roar
              </button>
            </div>
          </section>

          {roars.map((roar) => (
            <article key={`${roar.handle}-${roar.time}`} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
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

              <p className="mt-5 text-lg font-semibold leading-8 text-zinc-100">{roar.text}</p>

              <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-zinc-400">
                <button className="rounded-full border border-zinc-800 px-4 py-2 transition hover:border-amber-500 hover:text-amber-300">
                  🐾 {roar.pawprints} Pawprints
                </button>
                <button className="rounded-full border border-zinc-800 px-4 py-2 transition hover:border-amber-500 hover:text-amber-300">
                  💬 {roar.comments} Comments
                </button>
                <button className="rounded-full border border-zinc-800 px-4 py-2 transition hover:border-amber-500 hover:text-amber-300">
                  Share
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-5">
            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-lg font-black">Your Pack</h2>
              <p className="mt-1 text-sm text-zinc-500">People you trust on The Trail.</p>

              <div className="mt-4 space-y-3">
                {pack.map((member) => (
                  <div key={member} className="flex items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-sm ring-1 ring-amber-500/20">🐾</div>
                      <p className="text-sm font-bold">{member}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-300">Pack</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5">
              <h2 className="text-lg font-black text-amber-300">Privacy Check</h2>
              <div className="mt-4 space-y-3 text-sm font-bold text-zinc-300">
                <p>✓ Chronological feed</p>
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
