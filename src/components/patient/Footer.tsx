import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";

export default async function PatientFooter() {
  const { t } = await getI18n();

  const columns: {
    title: string;
    links: { href: string; label: string }[];
  }[] = [
    {
      title: t("footer.explore"),
      links: [
        { href: "/doctors", label: t("nav.findDoctors") },
        { href: "/blog", label: t("nav.blog") },
        { href: "/", label: t("footer.browse") },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { href: "/about", label: t("nav.about") },
        { href: "/services", label: t("nav.services") },
        { href: "/contact", label: t("nav.contact") },
        { href: "/faq", label: t("nav.faq") },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { href: "/privacy", label: t("nav.privacy") },
        { href: "/terms", label: t("nav.terms") },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <p className="flex items-center gap-2 font-bold text-slate-900">
            <span className="text-2xl">🏥</span> MediGuide
          </p>
          <p className="mt-2 text-sm text-slate-500">{t("footer.tagline")}</p>
          <p className="mt-3 text-xs font-medium text-slate-400">
            {t("footer.followUs")}
          </p>
          <div className="mt-1 flex gap-2 text-lg">
            <span title="Facebook">📘</span>
            <span title="X / Twitter">🐦</span>
            <span title="Instagram">📸</span>
            <span title="LinkedIn">💼</span>
          </div>
        </div>

        {/* Link columns */}
        {columns.map((column) => (
          <div key={column.title}>
            <p className="font-semibold text-slate-900">{column.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="hover:text-teal-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact */}
        <div>
          <p className="font-semibold text-slate-900">{t("footer.contactTitle")}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>✉️ support@mediguide.com</li>
            <li>📞 +92 300 0000000</li>
            <li>📍 Lahore, Pakistan</li>
            <li>
              <Link href="/contact" className="text-teal-700 hover:underline">
                {t("nav.contact")} →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 MediGuide — Final Year Project
      </div>
    </footer>
  );
}
