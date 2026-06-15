import Image from "next/image";
import Link from "next/link";
import kodiakDenLogo from "../assets/kodiak-den-logo.png";

const principles = [
  {
    title: "Privacy-first by default",
    description:
      "Your posts, profile, Pack, and account controls are designed around choice instead of hidden tracking.",
  },
  {
    title: "A chronological Trail",
    description:
      "See what people share in order, without rage-bait ranking deciding what deserves your attention.",
  },
  {
    title: "Your Pack, your circle",
    description:
      "Share publicly, with trusted people, or keep something close to your own Den.",
  },
];

const promises = [
  "No selling personal behavior",
  "No forced algorithmic feed",
  "Clear visibility before posting",
  "Profile and account controls built in",
];

function KodiakBrand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Kodiak Den home">
      <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-transparent">
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

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050608] text-zinc-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between gap-6">
          <KodiakBrand />

          <div className="hidden items-center gap-3 sm:flex">
            <button className="rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-200 transition hover:border-amber-500 hover:text-amber-300">
              Sign In
            </button>
            <Link
              href="/my-den"
              className="rounded-full bg-amber-500 px-5 py-2 text-sm font-black text-zinc-950 transition hover:bg-amber-400"
            >
              Create Your Den
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <div className="mb-6 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300">
              Private by design. Social by choice.
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-7xl">
              Social media should feel like yours again.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Kodiak Den is a privacy-first social home for profiles, Roars,
              comments, Paws Up, Paws Down, and trusted circles. Build your Den,
              walk The Trail, and share with the people you choose.
            </p>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl shadow-black/40">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-400">
              What we stand for
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">
              A quieter, cleaner place to connect.
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Kodiak Den is being built for people who want a personal social
              space without the noise, manipulation, and creepy feeling that has
              taken over the big platforms.
            </p>

            <div className="mt-6 grid gap-3">
              {promises.map((promise) => (
                <div
                  key={promise}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-200"
                >
                  {promise}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="grid gap-4 pb-10 md:grid-cols-3">
          {principles.map((principle) => (
            <div
              key={principle.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5"
            >
              <h2 className="font-black text-amber-300">{principle.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {principle.description}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-10 rounded-[2rem] border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-300">
                Need Support?
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Questions, account help, safety, or feedback.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
                The support area is where people can get help, report issues,
                ask questions, or contact the Kodiak Den team when something
                needs attention.
              </p>
            </div>
            <Link
              href="/support"
              className="rounded-2xl border border-zinc-700 px-6 py-4 text-center text-sm font-black text-zinc-100 transition hover:border-amber-500 hover:text-amber-300"
            >
              Need Support?
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
