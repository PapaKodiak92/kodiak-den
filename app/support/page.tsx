import Link from "next/link";

const supportOptions = [
  {
    title: "Account help",
    description: "Get help with signing in, profile settings, your Den, or anything that feels stuck.",
  },
  {
    title: "Safety and reports",
    description: "Report harassment, spam, abuse, impersonation, or anything that does not belong on Kodiak Den.",
  },
  {
    title: "Feedback",
    description: "Share ideas, bugs, and feature requests as Kodiak Den grows into a better social home.",
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
            Need Support?
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight tracking-tight">
            Help for your Den, account, and safety.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            This is the place for account help, safety reports, questions, and
            feedback. The contact link will be connected when Kodiak Den is ready
            for public support requests.
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

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-2xl font-black">Contact support</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              A real support link will go here later. For now, this page gives
              the site a proper home for help, safety, and feedback.
            </p>
            <button className="mt-5 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400">
              Contact Support
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
