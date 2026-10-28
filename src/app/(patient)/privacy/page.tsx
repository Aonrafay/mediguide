import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Privacy Policy" };
export const instant = false;

const SECTIONS = [
  {
    h: "1. Information we collect",
    p: "When you register we store your name, email address and (optionally) your phone number. When you book, we store the appointment details (doctor, date, time, mode and any notes you write). When you contact us, we store your message.",
  },
  {
    h: "2. How we use your information",
    p: "Your data is used only to operate MediGuide: showing your appointments, notifying you about status changes, letting clinics confirm bookings and answering your contact messages. We never sell your data.",
  },
  {
    h: "3. Cookies",
    p: "MediGuide uses two essential cookies: a signed session cookie that keeps you signed in, and a language/theme cookie that remembers your interface preferences. No advertising or tracking cookies are used.",
  },
  {
    h: "4. Password security",
    p: "Passwords are hashed with bcrypt before storage and are never readable by our team. Sessions use signed JWT tokens stored in HttpOnly cookies that expire after 7 days.",
  },
  {
    h: "5. Reviews are public",
    p: "Approved review text and the display name on your account appear publicly on doctor profiles. Your email is never shown publicly.",
  },
  {
    h: "6. Deleting your data",
    p: "You can ask us to delete your account and associated data any time through the Contact page. Cancelled appointments are kept only for statistics.",
  },
] as const;

export default async function PrivacyPage() {
  const { t } = await getI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-slate-400">{t("legal.back")} — <Link href="/" className="text-teal-700 hover:underline">MediGuide</Link></p>
      <h1 className="mt-2 text-4xl font-bold text-slate-900">{t("privacy.title")}</h1>
      <p className="mt-2 text-xs text-slate-400">{t("privacy.updated")}</p>
      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠️ {t("legal.demoNote")}
      </p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.h}>
            <h2 className="font-bold text-slate-900">{section.h}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{section.p}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
