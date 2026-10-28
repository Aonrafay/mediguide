import Link from "next/link";

const phases = [
  { name: "0. Planning & Design", status: "done" },
  { name: "1. Foundation (setup, DB, auth)", status: "active" },
  { name: "2. Admin Panel", status: "todo" },
  { name: "3. Patient Website", status: "todo" },
  { name: "4. Booking + Video Consults", status: "todo" },
  { name: "5. Reviews & Favourites", status: "todo" },
  { name: "6. Multi-Language + RTL", status: "todo" },
  { name: "7. Polish, Deploy & Viva Prep", status: "todo" },
];

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-700 to-teal-600 text-white">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
            🏥 Final Year Project — under active development
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            MediGuide
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-50">
            Find the right care, anywhere. Hospitals, clinics, medical complexes and
            labs across countries &amp; cities — with doctor profiles and in-person
            or video appointment booking.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/admin/login"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
            >
              Admin Panel
            </Link>
            <span className="rounded-lg border border-white/40 px-6 py-3 text-white/80">
              Patient search coming in Phase 3
            </span>
          </div>
        </div>
      </section>

      {/* Build roadmap */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold">Build Roadmap</h2>
        <p className="mt-2 text-center text-slate-600">
          MediGuide is being built phase by phase — track progress here.
        </p>
        <ul className="mx-auto mt-8 grid max-w-2xl gap-3">
          {phases.map((p) => (
            <li
              key={p.name}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                p.status === "done"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : p.status === "active"
                    ? "border-teal-300 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <span>
                {p.status === "done" ? "✅" : p.status === "active" ? "🚧" : "⬜"}
              </span>
              {p.name}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
