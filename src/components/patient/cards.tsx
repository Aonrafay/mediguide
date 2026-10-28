import Link from "next/link";

import { avatarColor, initials } from "@/lib/slugs";
import { formatFee } from "@/lib/utils";

/* ------------------------------- Rating --------------------------------- */

export function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className={`${size} tracking-wide text-amber-400`} title={`${rating.toFixed(1)} / 5`}>
      {"★".repeat(rounded)}
      <span className="text-slate-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

/* ------------------------------ Avatar ---------------------------------- */

export function Avatar({ name, size = "h-14 w-14 text-lg" }: { name: string; size?: string }) {
  return (
    <div
      className={`${size} ${avatarColor(name)} flex shrink-0 items-center justify-center rounded-full font-bold`}
    >
      {initials(name)}
    </div>
  );
}

/* ---------------------------- DoctorCard --------------------------------- */

export type DoctorCardData = {
  id: string;
  name: string;
  qualification: string;
  experienceYears: number;
  inPersonFee: number;
  videoFee: number | null;
  rating: number;
  reviewCount: number;
  offersVideo: boolean;
  specialty: { name: string; icon: string | null };
  facility: {
    id: string;
    name: string;
    city: { name: string; country: { name: string; code: string } };
  };
};

export function DoctorCard({ doctor }: { doctor: DoctorCardData }) {
  return (
    <Link
      href={`/doctor/${doctor.id}`}
      className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
    >
      <Avatar name={doctor.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-900">{doctor.name}</h3>
          {doctor.offersVideo && (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
              🎥 Video
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600">
          {doctor.specialty.icon} {doctor.specialty.name} · {doctor.qualification}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {doctor.facility.name} · {doctor.facility.city.name},{" "}
          {doctor.facility.city.country.name}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold text-slate-800">
            {formatFee(doctor.inPersonFee)}
          </span>
          {doctor.videoFee != null && (
            <span className="text-slate-500">🎥 {formatFee(doctor.videoFee)}</span>
          )}
          <span className="text-slate-500">{doctor.experienceYears} yrs exp</span>
          {doctor.reviewCount > 0 ? (
            <span className="flex items-center gap-1">
              <Stars rating={doctor.rating} />
              <span className="text-xs text-slate-400">({doctor.reviewCount})</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400">New on MediGuide</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ---------------------------- FacilityCard -------------------------------- */

export type FacilityCardData = {
  id: string;
  name: string;
  address: string;
  isVerified: boolean;
  type: { name: string; icon: string | null };
  city: { name: string; country: { name: string; code: string } };
  _count?: { doctors: number };
};

export function FacilityCard({ facility }: { facility: FacilityCardData }) {
  return (
    <Link
      href={`/facility/${facility.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{facility.type.icon ?? "🏢"}</span>
        {facility.isVerified && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            ✓ Verified
          </span>
        )}
      </div>
      <h3 className="mt-3 font-bold text-slate-900">{facility.name}</h3>
      <p className="text-sm text-slate-500">{facility.type.name}</p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{facility.address}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          📍 {facility.city.name}, {facility.city.country.name}
        </span>
        <span>👨‍⚕️ {facility._count?.doctors ?? 0} doctors</span>
      </div>
    </Link>
  );
}
