import Link from "next/link";

import { DeleteButton, EntityDialog } from "@/components/admin/ui";
import {
  CheckField,
  ErrorBanner,
  Field,
  FieldRow,
  PageHeader,
  Table,
  inputClass,
} from "@/components/admin/table";
import { deleteFacility, saveFacility } from "@/lib/actions/admin";
import { savePortfolio } from "@/lib/actions/partner";
import { facilityWhere, type AdminScope } from "@/lib/adminScope";
import { requireCountryView } from "@/lib/adminContext";
import { db } from "@/lib/db";

export const metadata = { title: "Facilities" };
export const instant = false;

function facilityFormFields(
  cities: { id: string; name: string; country: { name: string } }[],
  types: { id: string; name: string }[],
  facility?: {
    id: string;
    name: string;
    cityId: string;
    typeId: string;
    address: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    mapUrl: string | null;
    images: string;
    isVerified: boolean;
  }
) {
  let imagesValue = "";
  if (facility) {
    try {
      imagesValue = (JSON.parse(facility.images) as string[]).join(", ");
    } catch {
      imagesValue = "";
    }
  }
  return (
    <>
      {facility && <input type="hidden" name="id" value={facility.id} />}
      <FieldRow>
        <Field label="Facility name">
          <input
            name="name"
            required
            defaultValue={facility?.name}
            className={inputClass}
            placeholder="Lahore General Hospital"
          />
        </Field>
        <Field label="Facility type">
          <select name="typeId" required defaultValue={facility?.typeId} className={inputClass}>
            <option value="" disabled>
              Select type…
            </option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      </FieldRow>
      <Field label="City">
        <select name="cityId" required defaultValue={facility?.cityId} className={inputClass}>
          <option value="" disabled>
            Select city…
          </option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.country.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Address">
        <input
          name="address"
          required
          defaultValue={facility?.address}
          className={inputClass}
          placeholder="Jail Road, Lahore"
        />
      </Field>
      <FieldRow>
        <Field label="Phone">
          <input name="phone" defaultValue={facility?.phone ?? ""} className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={facility?.email ?? ""} className={inputClass} />
        </Field>
      </FieldRow>
      <Field label="Description">
        <textarea
          name="description"
          rows={3}
          defaultValue={facility?.description ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Map URL" hint="Optional Google Maps link">
        <input name="mapUrl" defaultValue={facility?.mapUrl ?? ""} className={inputClass} />
      </Field>
      <Field label="Image URLs" hint="Comma-separated URLs (Cloudinary later)">
        <input name="images" defaultValue={imagesValue} className={inputClass} />
      </Field>
      <CheckField
        name="isVerified"
        label="Verified (shows a ✓ badge to patients)"
        defaultChecked={facility?.isVerified ?? false}
      />
    </>
  );
}

export default async function FacilitiesPage({
  searchParams,
}: PageProps<"/admin/facilities">) {
  // Drill-down: requires an open country panel
  const ctx = await requireCountryView();
  const scope: AdminScope = {
    type: "COUNTRY",
    countryId: ctx.countryId,
    countryName: ctx.countryName,
    countryCode: ctx.countryCode,
  };

  const { error } = await searchParams;
  const [cities, types, facilities] = await Promise.all([
    db.city.findMany({
      where: { countryId: scope.countryId },
      orderBy: { name: "asc" },
      include: { country: { select: { name: true } } },
    }),
    db.facilityType.findMany({ orderBy: { name: "asc" } }),
    db.facility.findMany({
      where: facilityWhere(scope),
      orderBy: { name: "asc" },
      include: {
        city: { include: { country: true } },
        type: true,
        _count: { select: { doctors: true } },
      },
    }),
  ]);  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities"
        subtitle={`Hospitals, clinics, complexes and labs inside ${scope.countryName}'s cities.`}
      >
        <EntityDialog
          title="Add Facility"
          action={saveFacility}
          trigger="＋ Add Facility"
          wide
        >
          {facilityFormFields(cities, types)}
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      <Table head={["Facility", "Type", "City", "Doctors", "Verified", "Actions"]}>
        {facilities.map((facility) => (
          <tr key={facility.id} className="text-slate-700">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-900">{facility.name}</p>
              <p className="text-xs text-slate-400">{facility.address}</p>
            </td>
            <td className="px-4 py-3">
              {facility.type.icon} {facility.type.name}
            </td>
            <td className="px-4 py-3">
              {facility.city.name}
              <span className="text-xs text-slate-400"> · {facility.city.country.name}</span>
            </td>
            <td className="px-4 py-3">
              {facility._count.doctors}{" "}
              <Link
                href={`/admin/doctors?facility=${facility.id}`}
                className="text-xs text-teal-700 hover:underline"
              >
                (view)
              </Link>
            </td>
            <td className="px-4 py-3">{facility.isVerified ? "✅" : "⬜"}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <EntityDialog
                  title={`Edit ${facility.name}`}
                  action={saveFacility}
                  openLabel="Edit"
                  wide
                >
                  {facilityFormFields(cities, types, facility)}
                </EntityDialog>
                <EntityDialog
                  title={`Portfolio — ${facility.name}`}
                  action={savePortfolio}
                  openLabel="🎨"
                  wide
                >
                  <PortfolioFields facility={facility} />
                </EntityDialog>
                <DeleteButton
                  action={deleteFacility}
                  id={facility.id}
                  confirmMessage={`Delete ${facility.name} and its doctors?`}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* --------------------------- portfolio editor form ------------------------- */

function PortfolioFields({
  facility,
}: {
  facility: {
    id: string;
    name: string;
    planTier: string;
    portfolioTagline: string | null;
    portfolioServices: string;
    openingHours: string | null;
    images: string;
    socials: string;
  };
}) {
  let servicesValue = "";
  let galleryValue = "";
  let socials: Record<string, string> = {};
  try {
    servicesValue = (JSON.parse(facility.portfolioServices) as string[]).join("\n");
  } catch {
    servicesValue = "";
  }
  try {
    galleryValue = (JSON.parse(facility.images) as string[]).join(", ");
  } catch {
    galleryValue = "";
  }
  try {
    socials = JSON.parse(facility.socials) as Record<string, string>;
  } catch {
    socials = {};
  }

  return (
    <>
      <input type="hidden" name="facilityId" value={facility.id} />
      <Field label="Portfolio tagline" hint="One line shown big on the portfolio page">
        <input
          name="tagline"
          defaultValue={facility.portfolioTagline ?? ""}
          className={inputClass}
          placeholder="Advanced cardiac care in the heart of Lahore"
        />
      </Field>
      <Field label="Services list" hint="One service per line">
        <textarea
          name="services"
          rows={4}
          defaultValue={servicesValue}
          className={inputClass}
          placeholder={"Cardiology & Heart Screenings\nPediatric Care"}
        />
      </Field>
      <Field label="Opening hours">
        <input
          name="openingHours"
          defaultValue={facility.openingHours ?? ""}
          className={inputClass}
          placeholder="Mon–Sat 9:00–21:00 · Emergency 24/7"
        />
      </Field>
      <Field label="Gallery image URLs" hint="Comma-separated (2–3 works best)">
        <input name="gallery" defaultValue={galleryValue} className={inputClass} />
      </Field>
      <FieldRow>
        <Field label="Plan tier">
          <select name="planTier" defaultValue={facility.planTier} className={inputClass}>
            <option value="NONE">None (no portfolio badge)</option>
            <option value="BASIC">Basic</option>
            <option value="PRO">Pro</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </Field>
      </FieldRow>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Social links (empty = hidden)
      </p>
      <FieldRow>
        <Field label="Instagram URL">
          <input name="social_instagram" defaultValue={socials.instagram ?? ""} className={inputClass} />
        </Field>
        <Field label="LinkedIn URL">
          <input name="social_linkedin" defaultValue={socials.linkedin ?? ""} className={inputClass} />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="X (Twitter) URL">
          <input name="social_x" defaultValue={socials.x ?? ""} className={inputClass} />
        </Field>
        <Field label="Facebook URL">
          <input name="social_facebook" defaultValue={socials.facebook ?? ""} className={inputClass} />
        </Field>
      </FieldRow>
      <Field label="Website URL">
        <input name="social_website" defaultValue={socials.website ?? ""} className={inputClass} />
      </Field>
    </>
  );
}
