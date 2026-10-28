import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/patient/cards";
import { db } from "@/lib/db";
import { formatFee } from "@/lib/utils";

export const metadata = { title: "Book Appointment" };
export const instant = false;

export default async function BookPage({
  params,
}: PageProps<"/book/[id]">) {
  const { id } = await params;
  const doctor = await db.doctor.findUnique({
    where: { id },
    include: {
      specialty: true,
      facility: { include: { city: { include: { country: true } } } },
    },
  });
  if (!doctor || !doctor.isActive) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <div className="flex justify-center">
          <Avatar name={doctor.name} size="h-20 w-20 text-2xl" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{doctor.name}</h1>
        <p className="text-slate-500">
          {doctor.specialty.icon} {doctor.specialty.name} · {doctor.facility.name}
        </p>

        <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-800">
          <p className="text-2xl">🚧</p>
          <p className="mt-2 font-semibold">
            Online booking launches in Phase 4
          </p>
          <p className="mt-1">
            The slot-picker (choose date &amp; time, in-person or video) is the next
            milestone. Until then, book by phone:
          </p>
        </div>

        <div className="mt-6 space-y-2 text-sm text-slate-600">
          <p>
            🏥 In-person fee:{" "}
            <span className="font-semibold">{formatFee(doctor.inPersonFee)}</span>
          </p>
          {doctor.videoFee != null && (
            <p>
              🎥 Video fee:{" "}
              <span className="font-semibold">{formatFee(doctor.videoFee)}</span>
            </p>
          )}
          <p>
            📞 {doctor.facility.phone ?? "Contact the facility for bookings"}
          </p>
          <p>
            📍 {doctor.facility.address}, {doctor.facility.city.name},{" "}
            {doctor.facility.city.country.name}
          </p>
        </div>

        <Link
          href={`/doctor/${doctor.id}`}
          className="mt-8 inline-block rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          ← Back to profile
        </Link>
      </div>
    </main>
  );
}
