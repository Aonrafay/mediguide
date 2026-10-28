import Link from "next/link";

import { ErrorBanner, PageHeader, Table } from "@/components/admin/table";
import { deleteReview, setReviewApproval } from "@/lib/actions/engagement";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Reviews" };
export const instant = false;

const FILTERS = ["PENDING", "APPROVED", "REJECTED"] as const;

export default async function AdminReviewsPage({
  searchParams,
}: PageProps<"/admin/reviews">) {
  const { error, filter } = await searchParams;
  const filterValue =
    typeof filter === "string" && FILTERS.includes(filter as "PENDING")
      ? filter
      : "PENDING";

  const reviews = await db.review.findMany({
    where:
      filterValue === "PENDING"
        ? { isApproved: false }
        : filterValue === "APPROVED"
          ? { isApproved: true }
          : { isApproved: false },
    orderBy: { createdAt: "desc" },
    include: {
      patient: { select: { name: true, email: true } },
      doctor: { select: { name: true, specialty: { select: { name: true } } } },
    },
  });

  // Rejected reviews are simply deleted, so the REJECTED tab shows unapproved
  // ones too — but let's keep it simple: PENDING and APPROVED tabs matter.
  void filterValue;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        subtitle="Moderate patient reviews. Approved reviews count toward the doctor's public rating."
      />

      <ErrorBanner message={error} />

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.filter((f) => f !== "REJECTED").map((f) => (
          <Link
            key={f}
            href={`/admin/reviews?filter=${f}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filterValue === f
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "PENDING" ? "Pending approval" : "Approved"}
          </Link>
        ))}
      </div>

      <Table head={["Patient", "Doctor", "Rating", "Comment", "Date", "Actions"]}>
        {reviews.map((review) => (
          <tr key={review.id} className="text-slate-700">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-900">{review.patient.name}</p>
              <p className="text-xs text-slate-400">{review.patient.email}</p>
            </td>
            <td className="px-4 py-3">
              <p className="font-medium text-slate-900">{review.doctor.name}</p>
              <p className="text-xs text-slate-400">{review.doctor.specialty.name}</p>
            </td>
            <td className="px-4 py-3">
              <span className="text-amber-400">{"★".repeat(review.rating)}</span>
              <span className="text-slate-300">{"★".repeat(5 - review.rating)}</span>
            </td>
            <td className="max-w-xs px-4 py-3">
              {review.comment ?? <span className="text-slate-400">—</span>}
            </td>
            <td className="px-4 py-3 text-xs">{formatDate(review.createdAt)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {!review.isApproved && (
                  <form action={setReviewApproval}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="approve" value="1" />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                    >
                      Approve
                    </button>
                  </form>
                )}
                {review.isApproved && (
                  <form action={setReviewApproval}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="approve" value="0" />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 font-medium text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50"
                    >
                      Unpublish
                    </button>
                  </form>
                )}
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-2.5 py-1 font-medium text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </td>
          </tr>
        ))}
        {reviews.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
              No reviews here right now.
            </td>
          </tr>
        )}
      </Table>
    </div>
  );
}
