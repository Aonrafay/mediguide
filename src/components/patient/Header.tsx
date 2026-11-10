import Link from "next/link";

import LanguageSwitcher from "@/components/patient/LanguageSwitcher";
import MobileMenu from "@/components/patient/MobileMenu";
import NavLinks from "@/components/patient/NavLinks";
import ThemeToggle from "@/components/patient/ThemeToggle";
import { logout } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { activeLanguages, getI18n } from "@/lib/i18n/server";
import { normalizeTheme, THEME_COOKIE, type Theme } from "@/lib/theme";
import { cookies } from "next/headers";

export default async function PatientHeader() {
  const { locale, t } = await getI18n();
  const session = await getSession();
  const languages = await activeLanguages();

  const cookieStore = await cookies();
  const theme: Theme = normalizeTheme(cookieStore.get(THEME_COOKIE)?.value);

  const navItems = [
    { href: "/doctors", label: t("nav.findDoctors") },
    { href: "/blog", label: t("nav.blog") },
    { href: "/about", label: t("nav.about") },
    { href: "/services", label: t("nav.services") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="text-2xl">🏥</span>
          <span className="text-lg">MediGuide</span>
        </Link>

        {/* Global search — lands on the doctors directory */}
        <form action="/doctors" className="ms-auto hidden max-w-sm flex-1 md:block">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 focus-within:border-teal-400 focus-within:bg-white">
            <span className="text-slate-400">🔍</span>
            <input
              name="q"
              placeholder={t("nav.searchPlaceholder")}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <div className="ms-auto hidden items-center gap-1 md:flex md:ms-0">
          <NavLinks items={navItems} className="flex items-center gap-1" />
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle initial={theme} />
          <LanguageSwitcher languages={languages} current={locale} />
          {session ? (
            <div className="flex items-center gap-2">
              {session.role === "PATIENT" && (
                <Link
                  href="/account/notifications"
                  title={t("notif.title")}
                  className="relative rounded-full px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-100"
                >
                  🔔
                </Link>
              )}
              <span className="rounded-full bg-teal-50 px-3 py-1.5 font-medium text-teal-700">
                {session.name.split(" ")[0]}
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
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="ms-auto flex items-center gap-2 md:hidden">
          <ThemeToggle initial={theme} />
          <MobileMenu>
            <MobilePanel
              navItems={navItems}
              session={session}
              signOutLabel={t("nav.signOut")}
              signInLabel={t("nav.signIn")}
              registerLabel={t("nav.register")}
              myAppointmentsLabel={t("nav.myAppointments")}
            >
              <div className="border-t border-slate-100 pt-3">
                <LanguageSwitcher
                  languages={languages}
                  current={locale}
                  variant="inline"
                />
              </div>
            </MobilePanel>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}

/* ------------------------- mobile panel (server) -------------------------- */

function MobilePanel({
  navItems,
  session,
  signOutLabel,
  signInLabel,
  registerLabel,
  myAppointmentsLabel,
  children,
}: {
  navItems: { href: string; label: string }[];
  session: Awaited<ReturnType<typeof getSession>>;
  signOutLabel: string;
  signInLabel: string;
  registerLabel: string;
  myAppointmentsLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-2 text-sm">
      <NavLinks items={navItems} className="space-y-1" />
      {session?.role === "PATIENT" && (
        <Link
          href="/account"
          className="block rounded-full px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100"
        >
          {myAppointmentsLabel}
        </Link>
      )}
      {children}
      <div className="border-t border-slate-100 pt-3">
        {session ? (
          <form action={logout}>
            <button
              type="submit"
              className="block w-full rounded-full px-3 py-1.5 text-start font-medium text-slate-500 hover:bg-slate-100"
            >
              {signOutLabel}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex-1 rounded-full px-3 py-1.5 text-center font-medium text-slate-600 ring-1 ring-slate-200"
            >
              {signInLabel}
            </Link>
            <Link
              href="/register"
              className="flex-1 rounded-full bg-teal-600 px-3 py-1.5 text-center font-semibold text-white"
            >
              {registerLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
