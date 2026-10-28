import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";

export const metadata = { title: "About" };
export const instant = false;

export default async function AboutPage() {
  const { t } = await getI18n();

  const [countryCount, cityCount, facilityCount, doctorCount] = await Promise.all([
    db.country.count({ where: { isActive: true } }),
    db.city.count({ where: { isActive: true } }),
    db.facility.count({ where: { isActive: true } }),
    db.doctor.count({ where: { isActive: true } }),
  ]);

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-700 to-teal-600 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <span className="text-5xl">🏥</span>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">{t("about.title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-50">
            {t("about.subtitle")}
          </p>
        </div>
      </section>

      {/* Mission + Vision */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-3xl">🎯</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {t("about.missionTitle")}
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              {t("about.missionText")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-3xl">🌟</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {t("about.visionTitle")}
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              {t("about.visionText")}
            </p>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900">{t("about.statsTitle")}</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-x-12 gap-y-6">
            {[
              { label: t("stat.countries"), value: countryCount, icon: "🌍" },
              { label: t("stat.cities"), value: cityCount, icon: "🏙️" },
              { label: t("stat.facilities"), value: facilityCount, icon: "🏢" },
              { label: t("stat.doctors"), value: doctorCount, icon: "👨‍⚕️" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl">{s.icon}</p>
                <p className="mt-1 text-3xl font-bold text-teal-700">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          {t("about.howTitle")}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { icon: "🌍", title: t("home.s1t"), text: t("home.s1d") },
            { icon: "🏥", title: t("home.s2t"), text: t("home.s2d") },
            { icon: "🩺", title: t("home.s3t"), text: t("home.s3d") },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 text-center"
            >
              <p className="text-4xl">{step.icon}</p>
              <p className="mt-3 font-bold text-slate-900">{step.title}</p>
              <p className="mt-1 text-sm text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            {t("about.valuesTitle")}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { icon: "🤝", title: t("about.value1t"), text: t("about.value1d") },
              { icon: "🌐", title: t("about.value2t"), text: t("about.value2d") },
              { icon: "🔀", title: t("about.value3t"), text: t("about.value3d") },
            ].map((value) => (
              <div key={value.title}>
                <p className="text-3xl">{value.icon}</p>
                <p className="mt-2 font-bold text-slate-900">{value.title}</p>
                <p className="mt-1 text-sm text-slate-500">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-teal-500 p-10 text-center text-white">
          <h2 className="text-2xl font-bold">{t("about.ctaTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-teal-50">{t("about.ctaText")}</p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-teal-700 shadow transition hover:bg-teal-50"
          >
            {t("about.ctaButton")}
          </Link>
        </div>
      </section>
    </main>
  );
}
