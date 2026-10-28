import Link from "next/link";

import { DoctorCard, FacilityCard } from "@/components/patient/cards";
import { db } from "@/lib/db";
import { flagEmoji } from "@/lib/slugs";
import { getI18n, loadContentTranslator } from "@/lib/i18n/server";

export const instant = false;

export default async function HomePage() {
  const { locale, t } = await getI18n();
  const tr = await loadContentTranslator(locale, ["Country", "Specialty", "Facility", "FacilityType"]);

  const [countries, stats, featuredDoctors, specialties, featuredFacilities, latestPosts] =
    await Promise.all([
      db.country.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          _count: { select: { cities: true } },
        },
      }),
      Promise.all([
        db.country.count({ where: { isActive: true } }),
        db.city.count({ where: { isActive: true } }),
        db.facility.count({ where: { isActive: true } }),
        db.doctor.count({ where: { isActive: true } }),
      ]),
      db.doctor.findMany({
        where: { isActive: true, offersVideo: true },
        orderBy: [{ rating: "desc" }, { experienceYears: "desc" }],
        take: 6,
        include: {
          specialty: true,
          facility: { include: { city: { include: { country: true } } } },
        },
      }),
      db.specialty.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        take: 10,
      }),
      db.facility.findMany({
        where: { isActive: true, isVerified: true },
        orderBy: [{ createdAt: "desc" }],
        take: 6,
        include: {
          type: true,
          city: { include: { country: true } },
          _count: { select: { doctors: true } },
        },
      }),
      db.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        take: 3,
      }),
    ]);

  const [countryCount, cityCount, facilityCount, doctorCount] = stats;

  // Facilities per country for the country cards
  const facilityCounts = await db.facility.groupBy({
    by: ["cityId"],
    where: { isActive: true },
    _count: true,
  });

  const citiesWithCountry = await db.city.findMany({
    where: { isActive: true },
    select: { id: true, countryId: true },
  });
  const cityToCountry = new Map(citiesWithCountry.map((c) => [c.id, c.countryId]));
  const facilitiesByCountry = new Map<string, number>();
  for (const row of facilityCounts) {
    const countryId = cityToCountry.get(row.cityId);
    if (countryId)
      facilitiesByCountry.set(
        countryId,
        (facilitiesByCountry.get(countryId) ?? 0) + row._count
      );
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-700 to-teal-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-50">
            {t("home.heroSub")}
          </p>

          {/* Big search */}
          <form action="/doctors" className="mx-auto mt-8 flex max-w-xl gap-2">
            <input
              name="q"
              placeholder={t("home.searchPlaceholder")}
              className="w-full rounded-xl px-4 py-3 text-slate-900 shadow-lg outline-none focus:ring-2 focus:ring-teal-300"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold shadow-lg transition hover:bg-slate-800"
            >
              {t("home.search")}
            </button>
          </form>

          {/* Live stats */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-10 gap-y-4 text-center">
            {[
              { label: t("stat.countries"), value: countryCount },
              { label: t("stat.cities"), value: cityCount },
              { label: t("stat.facilities"), value: facilityCount },
              { label: t("stat.doctors"), value: doctorCount },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-teal-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialty quick links */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {specialties.map((specialty) => (
            <Link
              key={specialty.id}
              href={`/doctors?specialty=${specialty.id}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
            >
              <span className="text-lg">{specialty.icon ?? "🩺"}</span>
              {tr("Specialty", specialty.id, "name", specialty.name)}
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by country */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold text-slate-900">{t("home.browseTitle")}</h2>
        <p className="mt-1 text-slate-500">{t("home.browseSub")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <Link
              key={country.id}
              href={`/c/${country.code.toLowerCase()}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
            >
              <span className="text-4xl">{flagEmoji(country.code)}</span>
              <div>
                <p className="font-bold text-slate-900">
                  {tr("Country", country.id, "name", country.name)}
                </p>
                <p className="text-sm text-slate-500">
                  {t("cty.citiesIn", { n: country._count.cities }).split("—")[0]!.trim()}{" "}
                  · {facilitiesByCountry.get(country.id) ?? 0}{" "}
                  {t("stat.facilities").toLowerCase()}
                </p>
              </div>
              <span className="ms-auto text-slate-300">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            {t("home.howTitle")}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: "🌍",
                title: t("home.s1t"),
                text: t("home.s1d"),
              },
              {
                icon: "🏥",
                title: t("home.s2t"),
                text: t("home.s2d"),
              },
              {
                icon: "🩺",
                title: t("home.s3t"),
                text: t("home.s3d"),
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center"
              >
                <p className="text-4xl">{step.icon}</p>
                <p className="mt-3 font-bold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured facilities */}
      {featuredFacilities.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {t("home.facilitiesTitle") ?? "Featured facilities"}
          </h2>
          <p className="mt-1 text-slate-500">
            {t("home.facilitiesSub") ?? "Verified places patients trust"}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredFacilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={{
                  ...facility,
                  name: tr("Facility", facility.id, "name", facility.name),
                  type: {
                    ...facility.type,
                    name: tr("FacilityType", facility.typeId, "name", facility.type.name),
                  },
                  city: {
                    ...facility.city,
                    name: tr("City", facility.cityId, "name", facility.city.name),
                    country: {
                      ...facility.city.country,
                      name: tr(
                        "Country",
                        facility.city.countryId,
                        "name",
                        facility.city.country.name
                      ),
                    },
                  },
                }}
                labels={{
                  verified: t("facility.verified"),
                  doctors: (n) => t("card.doctors", { n }),
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured doctors (video consultations available) */}
      {featuredDoctors.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {t("home.featuredTitle")}
              </h2>
              <p className="mt-1 text-slate-500">{t("home.featuredSub")}</p>
            </div>
            <Link
              href="/doctors"
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              {t("home.viewAll")}
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {featuredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={{
                  ...doctor,
                  specialty: {
                    ...doctor.specialty,
                    name: tr("Specialty", doctor.specialty.id, "name", doctor.specialty.name),
                  },
                }}
                labels={{
                  video: t("card.video"),
                  yrs: (n) => t("card.yrs", { n }),
                  reviews: (n) => `(${n})`,
                  newLabel: t("card.new"),
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            {t("home.testimonialsTitle") ?? "What patients say"}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                name: "Ayesha K.",
                city: "Lahore 🇵🇰",
                text: "Found a cardiologist near me in two minutes and booked a video call the same evening. Very easy!",
              },
              {
                name: "Omar F.",
                city: "Dubai 🇦🇪",
                text: "The Arabic interface made it simple for my mother to choose a hospital herself. Great idea.",
              },
              {
                name: "Selin Y.",
                city: "Istanbul 🇹🇷",
                text: "Fees and timings are visible before booking — no surprises. I use it for my whole family now.",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-6"
              >
                <p className="text-amber-400">★★★★★</p>
                <p className="mt-2 text-sm text-slate-600">“{item.text}”</p>
                <p className="mt-3 text-sm font-bold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-400">{item.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest health tips (blog teaser) */}
      {latestPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{t("blog.title")}</h2>
              <p className="mt-1 text-slate-500">{t("blog.subtitle")}</p>
            </div>
            <Link
              href="/blog"
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              {t("home.viewAll")}
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
              >
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                  {post.category}
                </span>
                <h3 className="mt-2 font-bold text-slate-900">{post.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {post.excerpt}
                </p>
                <span className="mt-3 block text-sm font-semibold text-teal-700">
                  {t("blog.readMore")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA — get listed */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-slate-900 p-10 text-center text-white">
          <p className="text-3xl">🤝</p>
          <h2 className="mt-2 text-2xl font-bold">{t("about.ctaTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-300">{t("about.ctaText")}</p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-xl bg-teal-500 px-6 py-3 font-semibold text-white transition hover:bg-teal-600"
          >
            {t("about.ctaButton")}
          </Link>
        </div>
      </section>
    </main>
  );
}
