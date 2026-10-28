import ContactForm from "@/components/patient/ContactForm";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Contact" };
export const instant = false;

export default async function ContactPage() {
  const { t } = await getI18n();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-slate-900">{t("contact.title")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-500">
          {t("contact.subtitle")}
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {t("contact.formTitle")}
          </h2>
          <div className="mt-5">
            <ContactForm
              labels={{
                name: t("contact.name"),
                email: t("contact.email"),
                phone: t("contact.phone"),
                subject: t("contact.subject"),
                message: t("contact.message"),
                send: t("contact.send"),
                sending: t("contact.sending"),
              }}
            />
          </div>
        </section>

        {/* Info cards */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">{t("contact.infoTitle")}</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li>
                <span className="font-semibold">{t("contact.emailLabel")}:</span>{" "}
                ✉️ support@mediguide.com
              </li>
              <li>
                <span className="font-semibold">{t("contact.phoneLabel")}:</span> 📞
                +92 300 0000000
              </li>
              <li>
                <span className="font-semibold">{t("contact.addressLabel")}:</span> 📍
                Lahore, Pakistan
              </li>
              <li>
                <span className="font-semibold">{t("contact.hoursLabel")}:</span> 🕐{" "}
                {t("contact.hoursValue")}
              </li>
            </ul>
            <a
              href="https://maps.google.com/?q=Lahore"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-center text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
            >
              {t("contact.mapButton")}
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            <p className="font-semibold text-slate-900">⚡ Quick answers</p>
            <p className="mt-2">
              Booking questions? Check the{" "}
              <a href="/faq" className="text-teal-700 hover:underline">
                FAQ
              </a>{" "}
              first — most answers are there.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
