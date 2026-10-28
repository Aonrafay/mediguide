import Link from "next/link";

import LanguageSwitcher from "@/components/patient/LanguageSwitcher";
import { logout } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { getI18n, activeLanguages } from "@/lib/i18n/server";

export default async function PatientHeader() {
  const { locale, t } = await getI18n();
  const session = await getSession();
  const languages = await activeLanguages();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="text-2xl">🏥</span>
          <span className="text-lg">MediGuide</span>
        </Link>

        {/* Global search — lands on the doctors directory */}
        <form action="/doctors" className="ms-auto hidden max-w-sm flex-1 sm:block">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 focus-within:border-teal-400 focus-within:bg-white">
            <span className="text-slate-400">🔍</span>
            <input
              name="q"
              placeholder={t("nav.searchPlaceholder")}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </form>

        <nav className="ms-auto flex items-center gap-2 text-sm sm:ms-0">
          <Link
            href="/doctors"
            className="rounded-full px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100"
          >
            {t("nav.findDoctors")}
          </Link>
          {session?.role === "PATIENT" && (
            <>
              <Link
                href="/account"
                className="rounded-full px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100"
              >
                {t("nav.myAppointments")}
              </Link>
              <Link
                href="/account/notifications"
                title={t("notif.title")}
                className="relative rounded-full px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100"
              >
                🔔
              </Link>
            </>
          )}
          <LanguageSwitcher languages={languages} current={locale} />
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
                  {t("nav.signOut")}
                </button>
              </form>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100"
              >
                {t("nav.signIn")}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-teal-600 px-4 py-1.5 font-semibold text-white transition hover:bg-teal-700"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
