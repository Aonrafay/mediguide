import Link from "next/link";

import { logout } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";

/** Language switcher — functional in Phase 6 (multi-language). */
function LanguageChip() {
  return (
    <span
      title="Language switcher arrives in Phase 6"
      className="hidden cursor-not-allowed items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-400 sm:inline-flex"
    >
      🌐 EN
    </span>
  );
}

export default async function PatientHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="text-2xl">🏥</span>
          <span className="text-lg">MediGuide</span>
        </Link>

        {/* Global search — lands on the doctors directory */}
        <form action="/doctors" className="ml-auto hidden max-w-sm flex-1 sm:block">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 focus-within:border-teal-400 focus-within:bg-white">
            <span className="text-slate-400">🔍</span>
            <input
              name="q"
              placeholder="Search doctors, specialties…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-2 text-sm sm:ml-0">
          <Link
            href="/doctors"
            className="rounded-full px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Find Doctors
          </Link>
          <LanguageChip />
          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-teal-50 px-3 py-1.5 font-medium text-teal-700 sm:inline-block">
                {session.name}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 font-medium text-slate-500 transition hover:bg-slate-100"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-teal-600 px-4 py-1.5 font-semibold text-white transition hover:bg-teal-700"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
