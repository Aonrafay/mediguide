import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, Stars } from "@/components/patient/cards";
import FavouriteButton from "@/components/patient/FavouriteButton";
import ReviewForm from "@/components/patient/ReviewForm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  APPOINTMENT_MODE_LABELS,
  WEEKDAYS,
} from "@/lib/constants";
import { formatDate, formatFee } from "@/lib/utils";
import { flagEmoji, parseJsonArray } from "@/lib/slugs";

export const instant = false;

type Props = PageProps<"/doctor/[id]">;

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const doctor = await db.doctor.findUnique({ where: { id }, select: { name: true } });
  return { title: doctor?.name ?? "Doctor" };
}

export default async function DoctorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { reviewed } = await searchParams;
  const doctor = await db.doctor.findUnique({
    where: { id },
    include: {
      specialty: true,
      facility: { include: { city: { include: { country: true } } } },
      availability: {
        where: { isActive: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        include: { patient: { select: { name: true } } },
      },
    },
  });
  if (!doctor || !doctor.isActive) notFound();

  const languages = parseJsonArray(doctor.languages);

  // Patient-specific state: favourite flag + review eligibility
  const session = await getSession();
  let isFavourite = false;
  let canReview = false;
  let existingReview: { rating: number; comment: string | null } | null = null;
  if (session?.role === "PATIENT") {
    const [favourite, completed, review] = await Promise.all([
      db.favourite.findUnique({
        where: {
          patientId_doctorId: { patientId: session.userId, doctorId: doctor.id },
        },
      }),
      db.appointment.findFirst({
        where: {
          patientId: session.userId,
          doctorId: doctor.id,
          status: "COMPLETED",
        },
        select: { id: true },
      }),
      db.review.findUnique({
        where: {
          patientId_doctorId: { patientId: session.userId, doctorId: doctor.id },
        },
      }),
    ]);
    isFavourite = !!favourite;
    canReview = !!completed;
    existingReview = review;
  }

  // Group availability windows by weekday
  const byDay = new Map<number, typeof doctor.availability>();
  for (const window of doctor.availability) {
    const list = byDay.get(window.dayOfWeek) ?? [];
    list.push(window);
    byDay.set(window.dayOfWeek, list);
  }
  // Order Monday-first for display
  const orderedDays = [1, 2, 3, 4, 5, 6, 0].filter((day) => byDay.has(day));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link href="/doctors" className="hover:text-teal-700">
          Doctors
        </Link>{" "}
        / <span className="text-slate-700">{doctor.name}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-8">
          {/* Profile header */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start gap-5">
              <Avatar name={doctor.name} size="h-20 w-20 text-2xl" />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {doctor.name}
                </h1>
                <p className="mt-1 text-slate-600">
                  {doctor.specialty.icon} {doctor.specialty.name} ·{" "}
                  {doctor.qualification}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {doctor.experienceYears} years experience ·{" "}
                  {doctor.facility.name}, {doctor.facility.city.name},{" "}
                  {flagEmoji(doctor.facility.city.country.code)}{" "}
                  {doctor.facility.city.country.name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {doctor.reviewCount > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Stars rating={doctor.rating} />
                      <span className="font-semibold text-slate-700">
                        {doctor.rating.toFixed(1)}
                      </span>
                      <span className="text-slate-400">
                        ({doctor.reviewCount} review{doctor.reviewCount === 1 ? "" : "s"})
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">No reviews yet</span>
                  )}
                  {doctor.offersVideo && (
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                      🎥 Video consultations available
                    </span>
                  )}
                  {session?.role === "PATIENT" && (
                    <FavouriteButton
                      doctorId={doctor.id}
                      path={`/doctor/${doctor.id}`}
                      filled={isFavourite}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Fees */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  🏥 In-person visit
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatFee(doctor.inPersonFee)}
                </p>
              </div>
              <div
                className={`rounded-xl p-4 ${
                  doctor.videoFee != null ? "bg-sky-50" : "bg-slate-50 opacity-60"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  🎥 Video consultation
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {doctor.videoFee != null
                    ? formatFee(doctor.videoFee)
                    : "Not available"}
                </p>
              </div>
            </div>
          </section>

          {/* About */}
          {doctor.about && (
            <section>
              <h2 className="text-xl font-bold text-slate-900">About</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{doctor.about}</p>
            </section>
          )}

          {/* Availability */}
          <section>
            <h2 className="text-xl font-bold text-slate-900">Availability</h2>
            {orderedDays.length > 0 ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {orderedDays.map((day) => (
                      <tr key={day}>
                        <td className="w-32 px-4 py-3 font-semibold text-slate-800">
                          {WEEKDAYS[day]}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {byDay.get(day)!.map((window) => (
                            <span
                              key={window.id}
                              className="mr-2 inline-flex items-center gap-1"
                            >
                              {window.startTime}–{window.endTime}
                              <span className="text-xs text-slate-400">
                                (
                                {window.mode === "BOTH"
                                  ? "In-person & Video"
                                  : APPOINTMENT_MODE_LABELS[window.mode as "VIDEO"]}
                                )
                              </span>
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-slate-400">
                No published timings — contact the facility directly.
              </p>
            )}
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Patient reviews ({doctor.reviews.length})
            </h2>

            {reviewed === "1" && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                🙏 Thank you! Your review was submitted and will appear once approved.
              </p>
            )}

            {/* Review form for eligible patients */}
            {session?.role === "PATIENT" && canReview && (
              <div className="mt-4">
                <ReviewForm
                  doctorId={doctor.id}
                  existingRating={existingReview?.rating}
                  existingComment={existingReview?.comment}
                />
              </div>
            )}
            {session?.role === "PATIENT" && !canReview && (
              <p className="mt-3 rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
                💡 You can review this doctor after completing an appointment with
                them.
              </p>
            )}

            <div className="mt-4 space-y-4">
              {doctor.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">
                      {review.patient.name}
                    </p>
                    <Stars rating={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              ))}
              {doctor.reviews.length === 0 && (
                <p className="text-slate-400">
                  No reviews yet — be the first after your visit.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Booking sidebar */}
        <aside>
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">Book an appointment</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex justify-between">
                <span>🏥 In-person</span>
                <span className="font-semibold">{formatFee(doctor.inPersonFee)}</span>
              </li>
              <li className="flex justify-between">
                <span>🎥 Video</span>
                <span className="font-semibold">
                  {doctor.videoFee != null ? formatFee(doctor.videoFee) : "—"}
                </span>
              </li>
            </ul>
            <Link
              href={`/book/${doctor.id}`}
              className="mt-4 block rounded-lg bg-teal-600 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-teal-700"
            >
              Book Appointment
            </Link>
            <p className="mt-3 text-center text-xs text-slate-400">
              {doctor.facility.name}
              <br />
              📍 {doctor.facility.city.name}, {doctor.facility.city.country.name}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
