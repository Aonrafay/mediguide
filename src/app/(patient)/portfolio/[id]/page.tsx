import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, Stars } from "@/components/patient/cards";
import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { flagEmoji, parseJsonArray, slugify } from "@/lib/slugs";

export const instant = false;

type Props = PageProps<"/portfolio/[id]">;

const SOCIAL_META: Record<string, { icon: string; label: string; labelKey?: string }> = {
  instagram: { icon: "📸", label: "Instagram" },
  linkedin: { icon: "💼", label: "LinkedIn" },
  x: { icon: "🐦", label: "X" },
  facebook: { icon: "📘", label: "Facebook" },
  website: { icon: "🌐", label: "Website", labelKey: "pf.website" },
};

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  BASIC: { label: "BASIC PARTNER", className: "bg-white/20 text-white" },
  PRO: { label: "PRO PARTNER", className: "bg-sky-400 text-sky-950" },
  PREMIUM: { label: "PREMIUM PARTNER", className: "bg-amber-400 text-amber-950" },
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const facility = await db.facility.findUnique({
    where: { id },
    select: { name: true, portfolioTagline: true },
  });
  return {
    title: facility ? `${facility.name} — Portfolio` : "Portfolio",
    description: facility?.portfolioTagline ?? undefined,
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { id } = await params;
  const { t } = await getI18n();

  const facility = await db.facility.findUnique({
    where: { id },
    include: {
      type: true,
      city: { include: { country: true } },
      doctors: {
        where: { isActive: true },
        orderBy: [{ rating: "desc" }, { name: "asc" }],
        include: { specialty: true },
      },
    },
  });
  if (!facility || !facility.isActive) notFound();

  // Approved reviews for this facility's doctors (reviews live on Doctor)
  const reviews = await db.review.findMany({
    where: {
      isApproved: true,
      doctor: { facilityId: facility.id },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: {
      patient: { select: { name: true } },
      doctor: { select: { name: true } },
    },
  });

  const services = parseJsonArray(facility.portfolioServices);
  const images = parseJsonArray(facility.images);
  let socials: Record<string, string> = {};
  try {
    socials = JSON.parse(facility.socials) as Record<string, string>;
  } catch {
    socials = {};
  }
  const badge = facility.planTier !== "NONE" ? TIER_BADGES[facility.planTier] : null;

  return (
    <main>
      {/* Cover banner */}
      <section className="bg-gradient-to-r from-slate-900 via-teal-900 to-teal-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
              {facility.type.icon} {facility.type.name}
            </span>
            {badge && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}
              >
                ✓ {badge.label}
              </span>
            )}
            {facility.isVerified && (
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-sm text-emerald-50">
                ✓ {t("facility.verified")}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">{facility.name}</h1>
          {facility.portfolioTagline && (
            <p className="mt-3 max-w-2xl text-lg text-teal-50">
              {facility.portfolioTagline}
            </p>
          )}
          <p className="mt-3 text-sm text-teal-100">
            📍 {facility.address} — {facility.city.name},{" "}
            {flagEmoji(facility.city.country.code)} {facility.city.country.name}
          </p>

          {/* Social links */}
          {Object.keys(socials).length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-teal-200">
                {t("pf.followUs")}:
              </span>
              {Object.entries(socials).map(([key, url]) => {
                const meta = SOCIAL_META[key];
                if (!meta) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium transition hover:bg-white/20"
                  >
                    {meta.icon}{" "}
                    {key === "website" ? t("pf.website") : meta.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Gallery */}
        {images.length > 0 && (
          <section className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3">
            {images.slice(0, 3).map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`${facility.name} ${index + 1}`}
                className={`w-full rounded-2xl object-cover ${
                  index === 0 ? "col-span-2 h-64 md:col-span-2" : "h-64"
                }`}
              />
            ))}
          </section>
        )}

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="space-y-10">
            {facility.description && (
              <section>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("facility.about")}
                </h2>
                <p className="mt-2 leading-relaxed text-slate-600">
                  {facility.description}
                </p>
              </section>
            )}

            {services.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("pf.servicesTitle")}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {services.map((service) => (
                    <div
                      key={service}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      <span className="text-teal-600">✔</span> {service}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Team */}
            <section>
              <h2 className="text-xl font-bold text-slate-900">
                {t("pf.team")} ({facility.doctors.length})
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {facility.doctors.map((doctor) => (
                  <Link
                    key={doctor.id}
                    href={`/doctor/${doctor.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm"
                  >
                    <Avatar name={doctor.name} size="h-12 w-12 text-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {doctor.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {doctor.specialty.icon} {doctor.specialty.name}
                      </p>
                      {doctor.reviewCount > 0 && (
                        <Stars rating={doctor.rating} />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Reviews */}
            {reviews.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("pf.reviews")}
                </h2>
                <div className="mt-4 space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800">
                          {review.patient.name}
                          <span className="ms-2 text-xs font-normal text-slate-400">
                            on {review.doctor.name}
                          </span>
                        </p>
                        <Stars rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">{t("doctor.bookTitle")}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {t("pf.bookWith")}
              </p>
              <a
                href={`/facility/${facility.id}`}
                className="mt-4 block rounded-lg bg-teal-600 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-teal-700"
              >
                {t("facility.doctors", { n: facility.doctors.length })}
              </a>
            </div>

            {facility.openingHours && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900">{t("pf.hours")}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  🕐 {facility.openingHours}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">{t("facility.contact")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {facility.phone && <li>📞 {facility.phone}</li>}
                {facility.email && <li>✉️ {facility.email}</li>}
                <li>
                  🌍 {facility.city.country.name} ({facility.city.country.code})
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
