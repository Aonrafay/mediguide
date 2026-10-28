import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";

export default async function PatientFooter() {
  const { t } = await getI18n();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 font-bold text-slate-900">
            <span className="text-2xl">🏥</span> MediGuide
          </p>
          <p className="mt-2 text-sm text-slate-500">{t("footer.tagline")}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">{t("footer.explore")}</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            <li>
              <Link href="/doctors" className="hover:text-teal-700">
                {t("nav.findDoctors")}
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-teal-700">
                {t("footer.browse")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">{t("footer.aboutTitle")}</p>
          <p className="mt-2 text-sm text-slate-500">{t("footer.aboutText")}</p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 MediGuide — Final Year Project
      </div>
    </footer>
  );
}
