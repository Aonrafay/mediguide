import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { flagEmoji, slugify } from "@/lib/slugs";

export const instant = false;

type Props = PageProps<"/c/[countryCode]">;

export async function generateMetadata({ params }: Props) {
  const { countryCode } = await params;
  const country = await db.country.findFirst({
    where: { code: countryCode.toUpperCase(), isActive: true },
  });
  return { title: country ? `Healthcare in ${country.name}` : "Country" };
}

export default async function CountryPage({ params }: Props) {
  const { countryCode } = await params;
  const country = await db.country.findFirst({
    where: { code: countryCode.toUpperCase(), isActive: true },
    include: {
      cities: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: { _count: { select: { facilities: { where: { isActive: true } } } } },
      },
    },
  });
  if (!country) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-teal-700">
          Home
        </Link>{" "}
        / <span className="text-slate-700">{country.name}</span>
      </nav>

      <header className="mt-4 flex items-center gap-4">
        <span className="text-6xl">{flagEmoji(country.code)}</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Healthcare in {country.name}
          </h1>
          <p className="mt-1 text-slate-500">
            {country.cities.length} cities — choose a city to continue
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {country.cities.map((city) => (
          <Link
            key={city.id}
            href={`/c/${country.code.toLowerCase()}/${slugify(city.name)}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
          >
            <p className="text-xl font-bold text-slate-900">🏙️ {city.name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {city._count.facilities} facilities
            </p>
          </Link>
        ))}
        {country.cities.length === 0 && (
          <p className="text-slate-400">No cities available yet.</p>
        )}
      </div>
    </main>
  );
}
