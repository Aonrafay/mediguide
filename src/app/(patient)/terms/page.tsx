import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Terms of Service" };
export const instant = false;

const SECTIONS = [
  {
    h: "1. About this platform",
    p: "MediGuide is a directory and appointment-booking demonstration built as a Final Year Project. Facility and doctor listings are sample data for demonstration purposes.",
  },
  {
    h: "2. Medical disclaimer",
    p: "Content on MediGuide (including blog articles) is general health information, NOT medical advice. Always consult a qualified healthcare professional about your specific situation. In an emergency, contact your local emergency number immediately.",
  },
  {
    h: "3. Your account",
    p: "You are responsible for keeping your password safe and for the activity on your account. Provide accurate information when booking so clinics can reach you.",
  },
  {
    h: "4. Bookings and cancellations",
    p: "A booking is a request until the clinic confirms it. You may cancel pending or confirmed appointments from your dashboard. Repeated no-shows may lead to account restrictions.",
  },
  {
    h: "5. Reviews and conduct",
    p: "Reviews must be honest, respectful and based on real completed appointments. We may moderate or remove content that is abusive, promotional or misleading.",
  },
  {
    h: "6. Changes to these terms",
    p: "These demo terms may be updated as the project evolves. Continued use of MediGuide means you accept the latest version.",
  },
] as const;

export default async function TermsPage() {
  const { t } = await getI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-slate-400">{t("legal.back")} — <Link href="/" className="text-teal-700 hover:underline">MediGuide</Link></p>
      <h1 className="mt-2 text-4xl font-bold text-slate-900">{t("terms.title")}</h1>
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
