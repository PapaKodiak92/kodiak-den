import Link from "next/link";

const supportOptions = [
  {
    title: "Follow the build",
    description: "Keep up with Kodiak Den as the platform grows into a real privacy-first social home.",
  },
  {
    title: "Share feedback",
    description: "Tell us what matters most for profiles, The Trail, Pack features, safety, and community tools.",
  },
  {
    title: "Spread the word",
    description: "Invite people who want a quieter, cleaner social platform built around trust instead of tracking.",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#050608] px-6 py-8 text-zinc-100">
      <section className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-black tracking-tight">
            <span>Kodiak</span> <span className="text-amber-400">Den</span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300"
          >
            Back Home
          </Link>
        </nav>

        <section className="mt-12 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-400">
            Support
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight tracking-tight">
            Help build a better social space.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            Kodiak Den is being built as a privacy-first social platform for
            profiles, Roars, comments, Pack circles, and community connection.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {supportOptions.map((option) => (
              <article
                key={option.title}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5"
              >
                <h2 className="font-black text-amber-300">{option.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {option.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
            <h2 className="text-2xl font-black">Official support link coming soon.</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              This page is ready for the official Kodiak Den support link when
              it is time to connect it.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
