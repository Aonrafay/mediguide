import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/patient/cards";
import BookingWidget from "@/components/patient/BookingWidget";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Book Appointment" };
export const instant = false;

type Props = PageProps<"/book/[id]">;

export default async function BookPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, date, mode } = await searchParams;

  const doctor = await db.doctor.findUnique({
    where: { id },
    include: {
      specialty: true,
      facility: { include: { city: { include: { country: true } } } },
    },
  });
  if (!doctor || !doctor.isActive) notFound();

  // Which weekdays support each mode (for disabling date chips)
  const windows = await db.availability.findMany({
    where: { doctorId: doctor.id, isActive: true },
    select: { dayOfWeek: true, mode: true },
  });
  const modeDays: { IN_PERSON: number[]; VIDEO: number[] } = {
    IN_PERSON: [],
    VIDEO: [],
  };
  for (const w of windows) {
    if (w.mode === "IN_PERSON" || w.mode === "BOTH")
      modeDays.IN_PERSON.push(w.dayOfWeek);
    if (w.mode === "VIDEO" || w.mode === "BOTH") modeDays.VIDEO.push(w.dayOfWeek);
  }

  const session = await getSession();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href={`/doctor/${doctor.id}`} className="hover:text-teal-700">
          ← {doctor.name}
        </Link>
      </nav>

      {/* Doctor summary */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <Avatar name={doctor.name} />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Book — {doctor.name}</h1>
          <p className="text-sm text-slate-500">
            {doctor.specialty.icon} {doctor.specialty.name} · {doctor.qualification}
          </p>
          <p className="text-xs text-slate-400">
            {doctor.facility.name}, {doctor.facility.city.name},{" "}
            {doctor.facility.city.country.name}
          </p>
        </div>
      </div>

      {/* Booking widget */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <BookingWidget
          doctorId={doctor.id}
          offersVideo={doctor.offersVideo}
          inPersonFee={doctor.inPersonFee}
          videoFee={doctor.videoFee}
          isLoggedIn={session?.role === "PATIENT"}
          modeDays={modeDays}
          initialError={typeof error === "string" ? error : undefined}
          initialDate={typeof date === "string" ? date : undefined}
          initialMode={typeof mode === "string" ? mode : undefined}
        />
      </div>
    </main>
  );
}
