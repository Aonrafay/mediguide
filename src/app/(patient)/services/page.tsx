import ServiceRequestForm from "@/components/patient/ServiceRequestForm";
import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/slugs";

export const metadata = { title: "For Clinics" };
export const instant = false;

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸 Instagram",
  linkedin: "💼 LinkedIn",
  x: "🐦 X",
  facebook: "📘 Facebook",
  website: "🌐 Website",
};

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  BASIC: { label: "BASIC", className: "bg-slate-100 text-slate-700" },
  PRO: { label: "PRO", className: "bg-sky-100 text-sky-700" },
  PREMIUM: { label: "PREMIUM", className: "bg-amber-100 text-amber-700" },
  CUSTOM: { label: "CUSTOM", className: "bg-violet-100 text-violet-700" },
};

export default async function ServicesPage() {
  const { t } = await getI18n();

  const [packages, facilities] = await Promise.all([
    db.servicePackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.facility.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { city: { select: { name: true } } },
    }),
  ]);

  const formLabels: Record<string, string> = {
    business: t("svc.business"),
    person: t("svc.person"),
    email: t("svc.email"),
    phone: t("svc.phone"),
    facility: t("svc.facility"),
    noFacility: t("svc.noFacility"),
    plan: t("svc.plan"),
    msgLabel: t("svc.msgLabel"),
    submit: t("svc.submit"),
    sending: t("svc.sending"),
  };

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-5xl">💼</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            {t("svc.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            {t("svc.heroSub")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            {["instagram", "linkedin", "x", "facebook", "website"].map((p) => (
              <span
                key={p}
                className="rounded-full bg-white/10 px-4 py-1.5 font-medium"
              >
                {PLATFORM_ICONS[p]}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          {t("svc.worksTitle")}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { icon: "📝", title: t("svc.w1t"), text: t("svc.w1d") },
            { icon: "🏗️", title: t("svc.w2t"), text: t("svc.w2d") },
            { icon: "📈", title: t("svc.w3t"), text: t("svc.w3d") },
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

      {/* Packages */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            {t("svc.plansTitle")}
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {packages.map((pkg) => {
              const badge = TIER_BADGES[pkg.tier] ?? TIER_BADGES.CUSTOM!;
              const features = parseJsonArray(pkg.features);
              const platforms = parseJsonArray(pkg.platforms);
              return (
                <div
                  key={pkg.id}
                  className={`flex flex-col rounded-3xl border p-6 ${
                    pkg.tier === "PREMIUM"
                      ? "border-amber-300 shadow-md"
                      : "border-slate-200"
                  }`}
                >
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-slate-900">
                    {pkg.name}
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-teal-700">
                    {pkg.priceLabel}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{pkg.description}</p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                    {features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="text-teal-600">✔</span> {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {platforms.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {PLATFORM_ICONS[p] ?? p}
                      </span>
                    ))}
                  </div>
                  <a
                    href="#request"
                    className={`mt-6 block rounded-xl px-4 py-2.5 text-center font-semibold transition ${
                      pkg.tier === "PREMIUM"
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-teal-600 text-white hover:bg-teal-700"
                    }`}
                  >
                    {t("svc.requestTitle")}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Request form */}
      <section id="request" className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {t("svc.requestTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t("svc.requestSub")}</p>
          <div className="mt-6">
            <ServiceRequestForm
              labels={formLabels}
              facilities={facilities.map((f) => ({
                id: f.id,
                name: f.name,
                city: f.city.name,
              }))}
              packages={packages.map((p) => ({ id: p.id, name: p.name }))}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
