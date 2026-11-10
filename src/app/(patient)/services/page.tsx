import ServiceCatalog, { type CatalogTab } from "@/components/patient/ServiceCatalog";
import ServiceRequestForm from "@/components/patient/ServiceRequestForm";
import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/slugs";

export const metadata = { title: "Services" };
export const instant = false;

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
    busType: t("svc.busType"),
    btHospital: t("svc.btHospital"),
    btClinic: t("svc.btClinic"),
    btLab: t("svc.btLab"),
    btPharmacy: t("svc.btPharmacy"),
    btOther: t("svc.btOther"),
    facility: t("svc.facility"),
    noFacility: t("svc.noFacility"),
    plan: t("svc.plan"),
    msgLabel: t("svc.msgLabel"),
    submit: t("svc.submit"),
    sending: t("svc.sending"),
  };

  const tabs: CatalogTab[] = [
    { id: "ALL", icon: "✨", label: t("svc.audAll") },
    { id: "HOSPITAL", icon: "🏥", label: t("svc.audHospital") },
    { id: "CLINIC", icon: "🩺", label: t("svc.audClinic") },
    { id: "LAB", icon: "🔬", label: t("svc.audLab") },
    { id: "PHARMACY", icon: "💊", label: t("svc.audPharmacy") },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-5xl">🖥️</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            {t("svc.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            {t("svc.heroSub")}
          </p>

          {/* Provider types we serve */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            {[
              { icon: "🏥", label: t("svc.audHospital") },
              { icon: "🩺", label: t("svc.audClinic") },
              { icon: "🔬", label: t("svc.audLab") },
              { icon: "💊", label: t("svc.audPharmacy") },
            ].map((a) => (
              <span
                key={a.label}
                className="rounded-full bg-white/10 px-4 py-1.5 font-medium"
              >
                {a.icon} {a.label}
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

      {/* Plans — filtered by provider type */}
      <section id="plans" className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            {t("svc.plansTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
            {t("svc.plansSub")}
          </p>
        </div>
        <ServiceCatalog
          tabs={tabs}
          requestLabel={t("svc.requestTitle")}
          packages={packages.map((pkg) => ({
            id: pkg.id,
            name: pkg.name,
            tier: pkg.tier,
            description: pkg.description,
            priceLabel: pkg.priceLabel,
            features: parseJsonArray(pkg.features),
            platforms: parseJsonArray(pkg.platforms),
            audiences: parseJsonArray(pkg.audiences),
          }))}
        />
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
