import { FAQ_CATEGORIES } from "@/lib/faq";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "FAQ" };
export const instant = false;

export default async function FaqPage() {
  const { t } = await getI18n();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="text-center">
        <p className="text-4xl">❓</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">{t("faq.title")}</h1>
        <p className="mt-3 text-slate-500">{t("faq.subtitle")}</p>
      </header>

      <div className="mt-10 space-y-10">
        {FAQ_CATEGORIES.map((category) => (
          <section key={category.key}>
            <h2 className="text-xl font-bold text-teal-700">{t(category.key)}</h2>
            <div className="mt-4 space-y-3">
              {category.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 open:shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold text-slate-900 marker:content-none">
                    {item.q}
                    <span className="text-teal-600 transition group-open:rotate-45">
                      ＋
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        {t("contact.subtitle")}{" "}
        <a href="/contact" className="font-semibold text-teal-700 hover:underline">
          {t("nav.contact")} →
        </a>
      </p>
    </main>
  );
}
