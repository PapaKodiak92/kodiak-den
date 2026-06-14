import Image from "next/image";
import kodiakDenLogo from "../assets/kodiak-den-logo.png";

const features = [
  {
    title: "Privacy-first",
    description: "No creepy trackers, no data selling, and no rage-bait algorithm as the default experience.",
  },
  {
    title: "The Trail",
    description: "A chronological home feed for Roars, photos, links, comments, and Pawprints.",
  },
  {
    title: "Your Pack",
    description: "Follow people you trust and control who can see your posts before you publish.",
  },
  {
    title: "Inner Den",
    description: "Private circles, clear visibility controls, account export, and account deletion from day one.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050608] text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between gap-6">
          <Image
            src={kodiakDenLogo}
            alt="Kodiak Den logo"
            priority
            className="h-auto w-36 object-contain sm:w-44"
          />

          <div className="hidden items-center gap-3 sm:flex">
            <button className="rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-200 transition hover:border-amber-500 hover:text-amber-300">
              Sign In
            </button>
            <button className="rounded-full bg-amber-500 px-5 py-2 text-sm font-black text-zinc-950 transition hover:bg-amber-400">
              Create Your Den
            </button>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <div className="mb-6 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300">
              No trackers. No data selling. No algorithmic rage bait.
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-7xl">
              Your private corner of the internet.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Kodiak Den is a privacy-first social home for your Pack: posts,
              profiles, comments, Pawprints, private circles, and a feed that
              respects your time instead of manipulating it.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-2xl bg-amber-500 px-7 py-4 text-base font-black text-zinc-950 transition hover:bg-amber-400">
                Create Your Den
              </button>
              <button className="rounded-2xl border border-zinc-800 px-7 py-4 text-base font-bold text-zinc-200 transition hover:border-amber-500 hover:text-amber-300">
                Explore The Trail
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/40">
            <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-5 flex items-center gap-4">
                <Image
                  src={kodiakDenLogo}
                  alt="Kodiak Den logo mark"
                  priority
                  className="h-14 w-14 rounded-2xl object-cover object-top ring-1 ring-amber-500/20"
                />

                <div>
                  <p className="font-black">Kodiak</p>
                  <p className="text-sm text-zinc-500">Posting to The Trail · Public</p>
                </div>
              </div>

              <p className="text-xl font-bold">
                Building a better social space. Less noise. More Pack.
              </p>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-sm font-bold text-amber-300">Inner Den Controls</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300">
                  <div className="rounded-xl bg-zinc-950 px-4 py-3">Visibility: Public</div>
                  <div className="rounded-xl bg-zinc-950 px-4 py-3">Comments: Pack only</div>
                  <div className="rounded-xl bg-zinc-950 px-4 py-3">Tracking: Disabled</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-zinc-400">
                <span>Pawprints: 128</span>
                <span>Comments: 24</span>
                <span>Privacy-first</span>
              </div>
            </div>
          </section>
        </div>

        <section className="grid gap-4 pb-10 md:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-black text-amber-300">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
