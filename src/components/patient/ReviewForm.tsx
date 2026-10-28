"use client";

import { useActionState, useState } from "react";

import { submitReview, type ReviewState } from "@/lib/actions/engagement";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"] as const;

export type ReviewLabels = {
  title: string;
  updateTitle: string;
  note: string;
  placeholder: string;
  submit: string;
  updateSubmit: string;
  saving: string;
  scale: [string, string, string, string, string, string];
};

const DEFAULT_LABELS: ReviewLabels = {
  title: "Leave a review",
  updateTitle: "Update your review",
  note: "Reviews appear publicly after admin approval.",
  placeholder: "How was your experience? (optional)",
  submit: "Submit review",
  updateSubmit: "Update review",
  saving: "Saving…",
  scale: ["", "Poor", "Fair", "Good", "Very good", "Excellent"],
};

export default function ReviewForm({
  doctorId,
  existingRating,
  existingComment,
  labels: labelsProp,
}: {
  doctorId: string;
  existingRating?: number;
  existingComment?: string | null;
  labels?: Partial<ReviewLabels>;
}) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [rating, setRating] = useState(existingRating ?? 0);
  const [hover, setHover] = useState(0);
  const [state, formAction, isPending] = useActionState<ReviewState, FormData>(
    submitReview,
    {}
  );

  const shown = hover || rating;

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-5">
      <input type="hidden" name="doctorId" value={doctorId} />
      <input type="hidden" name="rating" value={rating} />

      <p className="font-semibold text-slate-900">
        {existingRating ? labels.updateTitle : labels.title}
      </p>
      <p className="mt-1 text-xs text-slate-400">{labels.note}</p>

      {/* Star picker */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              className={`px-1 text-2xl transition ${
                star <= shown ? "text-amber-400" : "text-slate-300"
              }`}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
        {shown > 0 && (
          <span className="text-sm font-medium text-slate-600">
            {labels.scale[shown]}
          </span>
        )}
      </div>

      <textarea
        name="comment"
        rows={3}
        defaultValue={existingComment ?? ""}
        placeholder={labels.placeholder}
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
      />

      {state.error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={rating === 0 || isPending}
        className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
      >
        {isPending
          ? labels.saving
          : existingRating
            ? labels.updateSubmit
            : labels.submit}
      </button>
    </form>
  );
}
