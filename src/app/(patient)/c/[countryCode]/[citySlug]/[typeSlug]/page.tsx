import Link from "next/link";
import { notFound } from "next/navigation";

import { FacilityCard } from "@/components/patient/cards";
import { db } from "@/lib/db";
import { flagEmoji, slugify } from "@/lib/slugs";

export const instant = false;

type Props = PageProps<"/c/[countryCode]/[citySlug]/[typeSlug]">;

export async function generateMetadata({ params }: Props) {
  const { citySlug, typeSlug } = await params;
  const typeWord = typeSlug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
  return { title: `${typeWord}s in ${citySlug}` };
}

export default async function FacilityTypeListingPage({ params }: Props) {
  const { countryCode, citySlug, typeSlug } = await params;

  const country = await db.country.findFirst({
    where: { code: countryCode.toUpperCase(), isActive: true },
  });
  if (!country) notFound();

  const city = (await db.city.findMany({
    where: { countryId: country.id, isActive: true },
  })).find((c) => slugify(c.name) === citySlug);
  if (!city) notFound();

  const types = await db.facilityType.findMany();
  const type = types.find((t) => slugify(t.name) === typeSlug);
  if (!type) notFound();

  const facilities = await db.facility.findMany({
    where: { cityId: city.id, typeId: type.id, isActive: true },
    orderBy: [{ isVerified: "desc" }, { name: "asc" }],
    include: {
      type: true,
      city: { include: { country: true } },
      _count: { select: { doctors: true } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-teal-700">
          Home
        </Link>{" "}
        /{" "}
        <Link
          href={`/c/${country.code.toLowerCase()}`}
          className="hover:text-teal-700"
        >
          {country.name}
        </Link>{" "}
        /{" "}
        <Link
          href={`/c/${country.code.toLowerCase()}/${slugify(city.name)}`}
          className="hover:text-teal-700"
        >
          {city.name}
        </Link>{" "}
        / <span className="text-slate-700">{type.name}</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">
          {type.icon} {type.name}s in {city.name}
        </h1>
        <p className="mt-1 text-slate-500">
          {facilities.length} {facilities.length === 1 ? "facility" : "facilities"} found
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
        {facilities.length === 0 && (
          <p className="text-slate-400">
            No {type.name.toLowerCase()}s in {city.name} yet.
          </p>
        )}
      </div>
    </main>
  );
}
