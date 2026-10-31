"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { getAdminScope, reviewInScope } from "@/lib/adminScope";
import { db } from "@/lib/db";

/* ------------------------------- helpers -------------------------------- */

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Recompute a doctor's denormalized rating from approved reviews. */
async function recomputeDoctorRating(doctorId: string) {
  const agg = await db.review.aggregate({
    where: { doctorId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await db.doctor.update({
    where: { id: doctorId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count,
    },
  });
}

/* ------------------------------- reviews --------------------------------- */

export type ReviewState = { error?: string; success?: string };

/**
 * Create or update the patient's review of a doctor. Requires a COMPLETED
 * appointment with that doctor. Reviews start unapproved (admin moderation).
 */
export async function submitReview(
  _prevState: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  let doctorId = str(formData, "doctorId");
  let rating = Number(str(formData, "rating"));
  const comment = str(formData, "comment");

  const session = await requireRole("PATIENT").catch(() => null);
  if (!session) return { error: "Please sign in as a patient to review." };

  if (!doctorId) return { error: "Missing doctor." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "Please choose a star rating." };

  // Must have a completed appointment with this doctor
  const completed = await db.appointment.findFirst({
    where: {
      patientId: session.userId,
      doctorId,
      status: "COMPLETED",
    },
  });
  if (!completed)
    return { error: "You can review a doctor after completing an appointment." };

  try {
    await db.review.upsert({
      where: {
        patientId_doctorId: { patientId: session.userId, doctorId },
      },
      update: { rating, comment: comment || null, isApproved: false },
      create: {
        patientId: session.userId,
        doctorId,
        rating,
        comment: comment || null,
        isApproved: false,
      },
    });
    // Rating average only counts approved reviews — unchanged until moderated
  } catch {
    return { error: "Could not save your review — try again." };
  }

  revalidatePath(`/doctor/${doctorId}`);
  redirect(`/doctor/${doctorId}?reviewed=1`);
}

/* ------------------------- admin review moderation ----------------------- */

export async function setReviewApproval(formData: FormData) {
  const scope = await getAdminScope();
  if (!scope) redirect("/admin/login");
  const id = str(formData, "id");
  const approve = str(formData, "approve") === "1";

  const review = await db.review.findUnique({ where: { id } });
  if (review) {
    if (scope.type === "COUNTRY" && !(await reviewInScope(scope, id))) {
      redirect(
        "/admin/reviews?error=" +
          encodeURIComponent("This review belongs to another country.")
      );
    }
    await db.review.update({ where: { id }, data: { isApproved: approve } });
    await recomputeDoctorRating(review.doctorId);
    revalidatePath("/admin/reviews");
  }
  redirect("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  const scope = await getAdminScope();
  if (!scope) redirect("/admin/login");
  const id = str(formData, "id");

  const review = await db.review.findUnique({ where: { id } });
  if (review) {
    if (scope.type === "COUNTRY" && !(await reviewInScope(scope, id))) {
      redirect(
        "/admin/reviews?error=" +
          encodeURIComponent("This review belongs to another country.")
      );
    }
    await db.review.delete({ where: { id } });
    await recomputeDoctorRating(review.doctorId);
    revalidatePath("/admin/reviews");
  }
  redirect("/admin/reviews");
}

/* ------------------------------ favourites ------------------------------- */

/** Toggle a doctor in the patient's favourites list. */
export async function toggleFavourite(formData: FormData) {
  const doctorId = str(formData, "doctorId");
  const path = str(formData, "path") || "/";

  const session = await requireRole("PATIENT").catch(() => null);
  if (!session) redirect(`/login?next=${encodeURIComponent(path)}`);

  const existing = await db.favourite.findUnique({
    where: { patientId_doctorId: { patientId: session.userId, doctorId } },
  });

  if (existing) await db.favourite.delete({ where: { patientId_doctorId: { patientId: session.userId, doctorId } } });
  else await db.favourite.create({ data: { patientId: session.userId, doctorId } });

  revalidatePath(path);
  revalidatePath("/account");
  redirect(path);
}

/* ---------------------------- notifications ------------------------------ */

export async function markAllNotificationsRead() {
  const session = await requireRole().catch(() => null);
  if (!session) redirect("/login?next=/account/notifications");

  await db.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/account/notifications");
  redirect("/account/notifications");
}
